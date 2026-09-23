const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// URL твоего Cloudflare Worker'а
const API_BASE = 'https://rust-bot.sdadawqdqdasda.workers.dev';

// ==================== API ====================
async function apiCall(endpoint, data = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            initData: tg.initData,
            ...data
        })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Ошибка API');
    return json;
}

// ==================== TABS ====================
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const name = tab.dataset.tab;

        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(`panel-${name}`).classList.add('active');

        if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    });
});

// ==================== SULFUR ====================
const SULFUR_COSTS = {
    c4:      { sulfur: 2200, lgf: 60 },
    rocket:  { sulfur: 1400, lgf: 30 },
    satchel: { sulfur: 480,  lgf: 0  },
    beancan: { sulfur: 120,  lgf: 0  },
    explo:   { sulfur: 25,   lgf: 0  }
};

const EXPLOSIVE_NAMES = {
    c4:      'C4 (Timed Explosive)',
    rocket:  'Ракета',
    satchel: 'Satchel Charge',
    beancan: 'Beancan Grenade',
    explo:   'Explosive 5.56'
};

function calculateSulfur() {
    const sulfur = parseInt(document.getElementById('sulfur-input').value) || 0;
    const lgf = parseInt(document.getElementById('lgf-input').value) || 0;
    const type = document.getElementById('explosive-type').value;
    const resultDiv = document.getElementById('sulfur-result');

    const cost = SULFUR_COSTS[type];
    const name = EXPLOSIVE_NAMES[type];

    const bySulfur = Math.floor(sulfur / cost.sulfur);
    const byLgf = cost.lgf > 0 ? Math.floor(lgf / cost.lgf) : Infinity;
    const count = Math.min(bySulfur, byLgf);

    let limiter = '';
    if (cost.lgf === 0) limiter = 'только серой';
    else if (bySulfur < byLgf) limiter = 'серой';
    else if (byLgf < bySulfur) limiter = 'топливом';
    else limiter = 'обоими ресурсами';

    const sUsed = count * cost.sulfur;
    const lUsed = count * cost.lgf;

    let html = `<strong>${name}</strong><br><br>`;
    html += `🎯 Можно скрафтить: <strong>${count} шт.</strong><br>`;
    html += `⚠️ Ограничитель: ${limiter}<br><br>`;
    html += `📦 Сера: ${sUsed} / ${sulfur} · остаток <strong>${sulfur - sUsed}</strong><br>`;
    if (cost.lgf > 0) {
        html += `🔥 Топливо: ${lUsed} / ${lgf} · остаток <strong>${lgf - lUsed}</strong><br>`;
    }
    html += `<br><small style="opacity:0.6">На 1 шт: ${cost.sulfur} серы${cost.lgf > 0 ? ` + ${cost.lgf} LGF` : ''}</small>`;

    resultDiv.innerHTML = html;
    resultDiv.classList.add('show');

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ==================== STEAM ====================
async function analyzeSteam() {
    const input = document.getElementById('steam-input').value.trim();
    const resultDiv = document.getElementById('steam-result');

    const match = input.match(/\d{17}/);
    if (!match) {
        resultDiv.innerHTML = '❌ Введи SteamID (17 цифр) или ссылку на профиль.';
        resultDiv.classList.add('show');
        return;
    }

    resultDiv.innerHTML = '<span class="spinner"></span>Анализирую профиль...';
    resultDiv.classList.add('show');

    try {
        const data = await apiCall('/api/steam', { steamId: match[0] });

        if (data.error) {
            resultDiv.innerHTML = `❌ ${data.error}`;
            return;
        }

        resultDiv.innerHTML = formatSteamResult(data);
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) {
        resultDiv.innerHTML = `❌ Ошибка: ${e.message}`;
    }
}

function formatSteamResult(d) {
    if (d.privateWarning) {
        return `<strong>🔒 ${escapeHtml(d.name)}</strong><br><br>Приватный профиль — полный анализ недоступен.`;
    }

    const emoji = d.riskScore >= 70 ? '🔴' : d.riskScore >= 50 ? '🟠' : d.riskScore >= 30 ? '🟡' : '🟢';

    let html = `<strong>👤 ${escapeHtml(d.name)}</strong><br><br>`;
    html += `📊 Статус: <strong>${d.state}</strong><br>`;
    html += `📅 Возраст: ${d.accountAgeDays} дней (${d.accountAgeYears} лет)<br>`;
    html += `🦀 Rust: <strong>${d.rustPlaytime}ч</strong><br>`;
    html += `🎮 Игр: ${d.gamesCount} · 👥 Друзей: ${d.friendsCount}<br>`;
    html += `📈 Уровень: ${d.steamLevel} · 🏆 ${d.achievementsCount}<br>`;

    if (d.vacBans > 0 || d.gameBans > 0 || d.communityBanned || d.tradeBanned) {
        html += `<br>🚫 <strong>БАНЫ:</strong><br>`;
        if (d.vacBans > 0) html += `❌ VAC: ${d.vacBans}<br>`;
        if (d.gameBans > 0) html += `❌ Game: ${d.gameBans}<br>`;
        if (d.communityBanned) html += `❌ Бан в сообществе<br>`;
        if (d.tradeBanned) html += `❌ Торговый бан<br>`;
    } else {
        html += `<br>✅ <strong>Банов нет</strong><br>`;
    }

    if (d.friendsWithRust?.length > 0) {
        html += `<br>👥 <strong>Друзья с Rust (${d.friendsWithRust.length}):</strong><br>`;
        d.friendsWithRust.slice(0, 5).forEach(f => {
            html += `• <a href="${escapeHtml(f.profileUrl)}" target="_blank">${escapeHtml(f.name)}</a><br>`;
        });
    }

    html += `<br>${emoji} <strong>Риск: ${d.riskScore}%</strong> · ${d.riskLevel}<br>`;

    if (d.reasons?.length > 0) {
        html += `<br><strong>📋 Факторы:</strong><br>`;
        d.reasons.slice(0, 5).forEach(r => {
            html += `· ${escapeHtml(r)}<br>`;
        });
    }

    let rec = '';
    if (d.riskScore >= 70) rec = '⚠️ <strong>Отклонить</strong>';
    else if (d.riskScore >= 50) rec = '⚡ <strong>Проверить</strong>';
    else if (d.riskScore >= 30) rec = 'ℹ️ Наблюдать';
    else rec = '✅ Допустить';

    html += `<br>${rec}`;
    html += `<br><br><a href="${escapeHtml(d.profileUrl)}" target="_blank">📂 Открыть профиль Steam</a>`;

    return html;
}

// ==================== FREE GAMES ====================
async function loadFreeGames() {
    const resultDiv = document.getElementById('free-result');
    resultDiv.innerHTML = '<span class="spinner"></span>Загружаю раздачи...';
    resultDiv.classList.add('show');

    try {
        const games = await apiCall('/api/free-games');

        if (!games?.length) {
            resultDiv.innerHTML = '😕 Сейчас нет активных Steam-раздач.<br><br>Бот уведомит, когда появятся.';
            return;
        }

        let html = `<strong>🎁 Найдено: ${games.length}</strong><br><br>`;

        games.slice(0, 8).forEach((g, i) => {
            html += `<div style="margin-bottom: 14px;">`;
            html += `<strong>${i + 1}. ${escapeHtml(g.name)}</strong><br>`;
            if (g.price && g.price !== 'N/A') {
                html += `<small style="opacity:0.7">💰 <s>${escapeHtml(g.price)}</s> → 🎁 БЕСПЛАТНО</small><br>`;
            }
            html += `<a href="${escapeHtml(g.url)}" target="_blank">⬇️ Забрать</a>`;
            if (i < games.slice(0, 8).length - 1) html += `<hr>`;
            html += `</div>`;
        });

        resultDiv.innerHTML = html;
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) {
        resultDiv.innerHTML = `❌ Ошибка: ${e.message}`;
    }
}

// ==================== WATCHLIST ====================
async function addToWatchlist() {
    const input = document.getElementById('watch-input').value.trim();
    const resultDiv = document.getElementById('watch-result');

    const match = input.match(/\d{17}/);
    if (!match) {
        resultDiv.innerHTML = '❌ Введи SteamID (17 цифр).';
        resultDiv.classList.add('show');
        return;
    }

    resultDiv.innerHTML = '<span class="spinner"></span>Добавляю...';
    resultDiv.classList.add('show');

    try {
        const data = await apiCall('/api/watch-add', { steamId: match[0] });
        resultDiv.innerHTML = `✅ Добавлен: <strong>${escapeHtml(data.name || match[0])}</strong><br><br>Бот уведомит при появлении бана.`;
        document.getElementById('watch-input').value = '';
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) {
        resultDiv.innerHTML = `❌ Ошибка: ${e.message}`;
    }
}

async function loadWatchlist() {
    const resultDiv = document.getElementById('watchlist-result');
    resultDiv.innerHTML = '<span class="spinner"></span>Загружаю...';
    resultDiv.classList.add('show');

    try {
        const list = await apiCall('/api/watch-list');

        if (!list?.length) {
            resultDiv.innerHTML = '📊 Список пуст.';
            return;
        }

        let html = `<strong>📊 Watchlist (${list.length})</strong><br><br>`;
        list.forEach((w, i) => {
            html += `<strong>${i + 1}. ${escapeHtml(w.name)}</strong><br>`;
            html += `<small style="opacity:0.6">${w.steamId}</small><br>`;
            html += `<small>VAC: ${w.lastVacBans} · Game: ${w.lastGameBans}</small><br><br>`;
        });

        resultDiv.innerHTML = html;
    } catch (e) {
        resultDiv.innerHTML = `❌ Ошибка: ${e.message}`;
    }
}

// ==================== STATUS ====================
async function loadStatus() {
    const resultDiv = document.getElementById('status-result');
    resultDiv.innerHTML = '<span class="spinner"></span>Загружаю...';
    resultDiv.classList.add('show');

    try {
        const data = await apiCall('/api/status');

        let html = `<strong>📊 Статистика бота</strong><br><br>`;
        html += `👥 Авторизовано: <strong>${data.usersCount}</strong><br>`;
        html += `📊 Проверок профилей: <strong>${data.historyCount}</strong><br>`;
        html += `👁️ В watchlist: <strong>${data.watchlistCount}</strong><br>`;

        resultDiv.innerHTML = html;
    } catch (e) {
        resultDiv.innerHTML = `❌ Ошибка: ${e.message}`;
    }
}

// ==================== HELPERS ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
