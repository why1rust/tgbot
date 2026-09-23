const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const API_BASE = 'https://rust-bot.sdadawqdqdasda.workers.dev';

// ==================== API ====================
async function apiCall(endpoint, data = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData, ...data })
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
        resultDiv.innerHTML = `❌ Ошибка: ${escapeHtml(e.message)}`;
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
        d.reasons.slice(0, 5).forEach(r => html += `· ${escapeHtml(r)}<br>`);
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

// ==================== RAID ====================
const RAID_DATA = {
    doors: {
        title: '🚪 Двери',
        items: {
            wood_door:    { name: 'Деревянная дверь', hp: 200,  explosive: '2 молотова',            resources: '100 топлива' },
            sheet_door:   { name: 'Железная дверь',   hp: 250,  explosive: '1 ракета, 8 разрывов',  resources: '1600 серы' },
            garage_door:  { name: 'Гаражка',          hp: 600,  explosive: '3 ракеты',              resources: '4200 серы' },
            mvp_door:     { name: 'МВК дверь',        hp: 1000, explosive: '2 C4, 30 разрывов',     resources: '5900 серы' },
            ladder_hatch: { name: 'Люк',              hp: 250,  explosive: '1 ракета, 8 разрывов',  resources: '1600 серы' },
            shop_front:   { name: 'Витрина',          hp: 750,  explosive: '3 C4',                  resources: '6600 серы' }
        }
    },
    walls: {
        title: '🧱 Стены',
        items: {
            wood_wall:  { name: 'Деревянная стена', hp: 250,  explosive: '4 молотова',            resources: '200 топлива' },
            stone_wall: { name: 'Каменная стена',   hp: 500,  explosive: '3 ракеты, 35 разрывов', resources: '5075 серы' },
            sheet_wall: { name: 'Железная стена',   hp: 1000, explosive: '7 ракет, 15 разрывов',  resources: '10175 серы' },
            mvp_wall:   { name: 'МВК стена',        hp: 2000, explosive: '14 ракет, 30 разрывов', resources: '20350 серы' }
        }
    },
    outer_walls: {
        title: '🛡️ Внешние стены',
        items: {
            outer_stone: { name: 'Каменная стена',   hp: 500, explosive: '2 C4',                   resources: '4400 серы' },
            outer_wood:  { name: 'Деревянная стена', hp: 500, explosive: '1 зажигательная ракета', resources: '75 топлива' }
        }
    }
};

function renderRaidItems() {
    const cat = document.getElementById('raid-cat').value;
    const select = document.getElementById('raid-target');
    const items = RAID_DATA[cat].items;

    select.innerHTML = Object.entries(items)
        .map(([key, item]) => `<option value="${key}">${item.name}</option>`)
        .join('');
}

function calculateRaid() {
    const cat = document.getElementById('raid-cat').value;
    const targetKey = document.getElementById('raid-target').value;
    const item = RAID_DATA[cat].items[targetKey];
    const resultDiv = document.getElementById('raid-result');

    let html = `<strong>${item.name}</strong><br><br>`;
    html += `❤️ ХП: <strong>${item.hp}</strong><br>`;
    html += `💥 Взрывчатка: <strong>${item.explosive}</strong><br>`;
    html += `📦 Ресурсы: <strong>${item.resources}</strong>`;

    resultDiv.innerHTML = html;
    resultDiv.classList.add('show');

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ==================== CRAFT ====================
const CRAFT_DATA = {
    c4: {
        name: 'C4 (взрывчатка с таймером)',
        emoji: '💥',
        sulfur: 2200,
        lgf: 60,
        resources: [
            { name: 'Взрывчатка', count: 20 },
            { name: 'Ткань', count: 5 },
            { name: 'Микросхемы', count: 2 }
        ]
    },
    rocket: {
        name: 'Ракета',
        emoji: '🚀',
        sulfur: 1400,
        lgf: 30,
        resources: [
            { name: 'Взрывчатка', count: 10 },
            { name: 'Порох', count: 150 },
            { name: 'Металлическая труба', count: 2 }
        ]
    },
    satchel: {
        name: 'Сатчел (связка)',
        emoji: '🎒',
        sulfur: 480,
        lgf: 0,
        resources: [
            { name: 'Бобовая граната', count: 4 },
            { name: 'Малый схрон', count: 1 },
            { name: 'Верёвка', count: 1 }
        ]
    },
    beancan: {
        name: 'Бобовая граната',
        emoji: '💣',
        sulfur: 120,
        lgf: 0,
        resources: [
            { name: 'Порох', count: 60 },
            { name: 'Металлические фрагменты', count: 20 }
        ]
    },
    explo: {
        name: 'Патрон 5.56 (взрывной)',
        emoji: '🔫',
        sulfur: 25,
        lgf: 0,
        resources: [
            { name: 'Порох', count: 5 },
            { name: 'Металлические фрагменты', count: 10 }
        ]
    }
};

function updateCraftInfo() {
    const type = document.getElementById('craft-type').value;
    const item = CRAFT_DATA[type];
    const infoDiv = document.getElementById('craft-info');

    let html = `<div class="craft-info-title">${item.emoji} <strong>${item.name}</strong></div>`;
    html += `<div class="craft-info-list">`;
    item.resources.forEach(r => {
        html += `<div class="resource">• ${r.name}: <strong>${r.count}</strong></div>`;
    });
    html += `<div class="resource">• Сера: <strong>${item.sulfur}</strong></div>`;
    if (item.lgf > 0) {
        html += `<div class="resource">• Топливо низкого качества: <strong>${item.lgf}</strong></div>`;
    }
    html += `</div>`;

    infoDiv.innerHTML = html;
}

function calculateCraft() {
    const type = document.getElementById('craft-type').value;
    const count = parseInt(document.getElementById('craft-count').value) || 1;
    const item = CRAFT_DATA[type];
    const resultDiv = document.getElementById('craft-result');

    let html = `<strong>${item.emoji} ${item.name} × ${count} шт.</strong><br><br>`;
    html += `<strong>📦 Нужно ресурсов:</strong><br>`;

    item.resources.forEach(r => {
        html += `• ${r.name}: <strong>${r.count * count}</strong><br>`;
    });
    html += `• Сера: <strong>${item.sulfur * count}</strong><br>`;
    if (item.lgf > 0) {
        html += `• Топливо низкого качества: <strong>${item.lgf * count}</strong><br>`;
    }

    resultDiv.innerHTML = html;
    resultDiv.classList.add('show');

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
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
        resultDiv.innerHTML = `✅ <strong>${escapeHtml(data.name || match[0])}</strong> добавлен в отслеживание<br><br>Бот уведомит при появлении бана.`;
        document.getElementById('watch-input').value = '';
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) {
        resultDiv.innerHTML = `❌ Ошибка: ${escapeHtml(e.message)}`;
    }
}

async function loadWatchlist() {
    const resultDiv = document.getElementById('watchlist-result');
    resultDiv.innerHTML = '<span class="spinner"></span>Загружаю...';
    resultDiv.classList.add('show');

    try {
        const list = await apiCall('/api/watch-list');
        if (!list?.length) {
            resultDiv.innerHTML = '📊 Список пуст. Добавь игроков через форму выше.';
            return;
        }

        let html = `<strong>📊 Отслеживается: ${list.length}</strong><br><br>`;
        list.forEach((w, i) => {
            html += `<div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.06);">`;
            html += `<strong>${i + 1}. ${escapeHtml(w.name)}</strong><br>`;
            html += `<small style="opacity:0.6">${w.steamId}</small><br>`;
            html += `<small>🚫 VAC: ${w.lastVacBans} · Game: ${w.lastGameBans}</small><br>`;
            html += `<button class="btn secondary" style="margin-top:8px; padding:10px; font-size:13px;" onclick="removeFromWatchlist('${w.steamId}')">🗑 Удалить</button>`;
            html += `</div>`;
        });

        resultDiv.innerHTML = html;
    } catch (e) {
        resultDiv.innerHTML = `❌ Ошибка: ${escapeHtml(e.message)}`;
    }
}

async function removeFromWatchlist(steamId) {
    try {
        await apiCall('/api/watch-remove', { steamId });
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        loadWatchlist();
    } catch (e) {
        alert('Ошибка: ' + e.message);
    }
}

// ==================== HELPERS ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== INIT ====================
renderRaidItems();
updateCraftInfo();
