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
    if (!res.ok) {
        throw new Error(json.error || 'Ошибка API');
    }
    return json;
}

// ==================== НАВИГАЦИЯ ====================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');

        if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    });
});

// ==================== КОНВЕРТЕР СЕРЫ ====================
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
    if (cost.lgf === 0) limiter = 'серой (топливо не нужно)';
    else if (bySulfur < byLgf) limiter = 'серой';
    else if (byLgf < bySulfur) limiter = 'топливом';
    else limiter = 'обоими ресурсами';

    const sUsed = count * cost.sulfur;
    const lUsed = count * cost.lgf;
    const sLeft = sulfur - sUsed;
    const lLeft = lgf - lUsed;

    let html = `<strong>${name}</strong><br><br>`;
    html += `Можно скрафтить: <strong>${count} шт.</strong><br>`;
    html += `Ограничитель: ${limiter}<br><br>`;
    html += `• Сера: ${sUsed} из ${sulfur} (остаток: <strong>${sLeft}</strong>)<br>`;
    if (cost.lgf > 0) {
        html += `• Топливо: ${lUsed} из ${lgf} (остаток: <strong>${lLeft}</strong>)<br>`;
    }
    html += `<br><small>На 1 ${name}: ${cost.sulfur} серы${cost.lgf > 0 ? ` + ${cost.lgf} LGF` : ''}</small>`;

    resultDiv.innerHTML = html;
    resultDiv.classList.add('show');

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ==================== STEAM АНАЛИЗ ====================
async function analyzeSteam() {
    const input = document.getElementById('steam-input').value.trim();
    const resultDiv = document.getElementById('steam-result');

    const match = input.match(/\d{17}/);
    if (!match) {
        resultDiv.innerHTML = '❌ Введи SteamID (17 цифр) или ссылку на профиль.';
        resultDiv.classList.add('show');
        return;
    }

    const steamId = match[0];
    resultDiv.innerHTML = '⏳ Анализирую профиль...<br><small>Это может занять 10-20 секунд</small>';
    resultDiv.classList.add('show');

    try {
        const data = await apiCall('/api/steam', { steamId });

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
        return `<strong>🔒 ${d.name}</strong><br>Приватный профиль — полный анализ недоступен`;
    }

    const emoji = d.riskScore >= 70 ? '🔴' : d.riskScore >= 50 ? '🟠' : d.riskScore >= 30 ? '🟡' : '🟢';

    let html = `<strong>👤 ${d.name}</strong><br>`;
    html += `📊 Статус: ${d.state}<br>`;
    html += `📅 Возраст: ${d.accountAgeDays} дней (${d.accountAgeYears} лет)<br>`;
    html += `🦀 Rust: ${d.rustPlaytime} часов<br>`;
    html += `🎮 Игр: ${d.gamesCount} | 👥 Друзей: ${d.friendsCount}<br>`;
    html += `📊 Уровень: ${d.steamLevel} | 🏆 Достижений: ${d.achievementsCount}<br>`;

    if (d.vacBans > 0 || d.gameBans > 0 || d.communityBanned || d.tradeBanned) {
        html += `<br>🚫 <strong>БАНЫ:</strong><br>`;
        if (d.vacBans > 0) html += `❌ VAC: ${d.vacBans}<br>`;
        if (d.gameBans > 0) html += `❌ Game: ${d.gameBans}<br>`;
        if (d.communityBanned) html += `❌ Бан в сообществе<br>`;
        if (d.tradeBanned) html += `❌ Торговый бан<br>`;
    } else {
        html += `<br>✅ Банов нет<br>`;
    }

    if (d.friendsWithRust?.length > 0) {
        html += `<br>👥 <strong>Друзья с Rust:</strong><br>`;
        d.friendsWithRust.slice(0, 5).forEach(f => {
            html += `• <a href="${f.profileUrl}" target="_blank">${f.name}</a><br>`;
        });
    }

    html += `<br>${emoji} <strong>Риск: ${d.riskScore}%</strong> (${d.riskLevel})<br>`;

    if (d.reasons?.length > 0) {
        html += `<br><strong>Факторы:</strong><br>`;
        d.reasons.slice(0, 5).forEach(r => {
            html += `${r}<br>`;
        });
    }

    let recommend = '';
    if (d.riskScore >= 70) recommend = '⚠️ Отклонить!';
    else if (d.riskScore >= 50) recommend = '⚡ Проверить!';
    else if (d.riskScore >= 30) recommend = 'ℹ️ Наблюдать.';
    else recommend = '✅ Допустить.';

    html += `<br><strong>Рекомендация:</strong> ${recommend}`;
    html += `<br><br><a href="${d.profileUrl}" target="_blank">📂 Открыть профиль Steam</a>`;

    return html;
}

// ==================== БЕСПЛАТНЫЕ ИГРЫ ====================
async function loadFreeGames() {
    const resultDiv = document.getElementById('free-result');
    resultDiv.innerHTML = '⏳ Загружаю раздачи...';
    resultDiv.classList.add('show');

    try {
        const games = await apiCall('/api/free-games');

        if (!games || games.length === 0) {
            resultDiv.innerHTML = '😕 Сейчас нет активных Steam-раздач.<br><br>Бот пришлёт уведомление, когда появится.';
            return;
        }

        let html = `<strong>🎁 Найдено: ${games.length}</strong><br><br>`;

        games.slice(0, 8).forEach((game, i) => {
            html += `<div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border);">`;
            html += `<strong>${i + 1}. ${game.name}</strong><br>`;
            if (game.price && game.price !== 'N/A') {
                html += `<small>💰 <s>${game.price}</s> → 🎁 БЕСПЛАТНО</small><br>`;
            }
            html += `<a href="${game.url}" target="_blank">⬇️ Забрать</a>`;
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

    const steamId = match[0];
    resultDiv.innerHTML = '⏳ Добавляю...';
    resultDiv.classList.add('show');

    try {
        const data = await apiCall('/api/watch-add', { steamId });
        resultDiv.innerHTML = `✅ Добавлен в Watchlist: <strong>${data.name || steamId}</strong><br><br>Бот уведомит, если появится бан.`;
        document.getElementById('watch-input').value = '';

        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) {
        resultDiv.innerHTML = `❌ Ошибка: ${e.message}`;
    }
}

async function loadWatchlist() {
    const resultDiv = document.getElementById('watch-result');
    resultDiv.innerHTML = '⏳ Загружаю...';
    resultDiv.classList.add('show');

    try {
        const list = await apiCall('/api/watch-list');

        if (!list || list.length === 0) {
            resultDiv.innerHTML = '📊 Список пуст.';
            return;
        }

        let html = `<strong>📊 Watchlist (${list.length})</strong><br><br>`;
        list.forEach((w, i) => {
            html += `${i + 1}. <strong>${w.name}</strong><br>`;
            html += `<small>${w.steamId}</small><br>`;
            html += `<small>VAC: ${w.lastVacBans} | Game: ${w.lastGameBans}</small><br><br>`;
        });

        resultDiv.innerHTML = html;
    } catch (e) {
        resultDiv.innerHTML = `❌ Ошибка: ${e.message}`;
    }
}

// ==================== СТАТУС ====================
async function loadStatus() {
    const resultDiv = document.getElementById('status-result');
    resultDiv.innerHTML = '⏳ Загружаю...';
    resultDiv.classList.add('show');

    try {
        const data = await apiCall('/api/status');

        let html = `<strong>📊 Статистика бота</strong><br><br>`;
        html += `👥 Авторизовано: <strong>${data.usersCount}</strong><br>`;
        html += `📊 Проверок: <strong>${data.historyCount}</strong><br>`;
        html += `👁️ Watchlist: <strong>${data.watchlistCount}</strong><br>`;

        resultDiv.innerHTML = html;
    } catch (e) {
        resultDiv.innerHTML = `❌ Ошибка: ${e.message}`;
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    console.log('👤 User:', tg.initDataUnsafe.user.first_name || 'User');
}
