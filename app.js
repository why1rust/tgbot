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
        resultDiv.innerHTML = renderSteamProfile(data);
        resultDiv.classList.add('show');
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) {
        resultDiv.innerHTML = `❌ Ошибка: ${escapeHtml(e.message)}`;
    }
}

function renderSteamProfile(d) {
    const avatarSrc = d.avatar 
        ? `${API_BASE}/api/avatar?url=${encodeURIComponent(d.avatar)}`
        : '';

    if (d.privateWarning) {
        return `
            <div class="player-card">
                <div class="player-top">
                    ${avatarSrc 
                        ? `<img class="player-avatar-img" src="${avatarSrc}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
                        : ''
                    }
                    <div class="player-avatar" style="${avatarSrc ? 'display:none;' : ''}">🔒</div>
                    <div class="player-info">
                        <h3>${escapeHtml(d.name)}</h3>
                        <span class="player-status offline">Приватный профиль</span>
                    </div>
                </div>
            </div>
        `;
    }

    const isOnline = d.state.includes('Онлайн') || d.state.includes('В игре');
    const initials = d.name.substring(0, 2).toUpperCase();
    const riskClass = d.riskScore >= 70 ? 'critical' : d.riskScore >= 50 ? 'high' : d.riskScore >= 30 ? 'medium' : 'low';
    const hasBan = d.vacBans > 0 || d.gameBans > 0;
    const totalBans = d.vacBans + d.gameBans;

    return `
        <div class="player-card">
            <div class="player-top">
                ${avatarSrc 
                    ? `<img class="player-avatar-img ${isOnline ? 'online' : ''}" src="${avatarSrc}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
                    : ''
                }
                <div class="player-avatar ${isOnline ? 'online' : ''}" style="${avatarSrc ? 'display:none;' : ''}">${initials}</div>
                <div class="player-info">
                    <h3>${escapeHtml(d.name)}</h3>
                    <span class="player-status ${isOnline ? 'online' : 'offline'}">Steam ${d.state.replace(/[^\wа-яА-Я\s]/g, '').trim() || 'Оффлайн'}</span>
                </div>
                ${hasBan
                    ? `<div class="vac-badge">⚠ VAC Ban</div>`
                    : `<div class="no-vac-badge">✓ Без банов</div>`
                }
            </div>

            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-icon purple">🦀</div>
                    <div>
                        <div class="stat-value">${d.rustPlaytime.toLocaleString('ru-RU')}</div>
                        <div class="stat-label">часов в Rust</div>
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-icon cyan">👥</div>
                    <div>
                        <div class="stat-value">${d.friendsCount}</div>
                        <div class="stat-label">друзей</div>
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-icon red">!</div>
                    <div>
                        <div class="stat-value">${totalBans}</div>
                        <div class="stat-label">активных бана</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="risk-card">
            <div class="risk-head">
                <div>
                    <h3>Уровень риска читерства</h3>
                    <p>Анализ VAC, часов и активности</p>
                </div>
                <div class="risk-value">
                    <div class="risk-percent ${riskClass}">${d.riskScore}%</div>
                    <div class="risk-level ${riskClass}">${d.riskLevel} риск</div>
                </div>
            </div>

            <div class="risk-bar">
                <div class="risk-indicator" style="left: ${d.riskScore}%"></div>
            </div>

            <div class="risk-labels">
                <span>Низкий</span>
                <span>Высокий</span>
            </div>
        </div>

        <div class="section-title">
            <span>Активность</span>
        </div>

        <div class="activity-list">
            ${hasBan ? `
                <div class="activity-item">
                    <div class="activity-icon vac">VAC</div>
                    <div class="activity-content">
                        <h4>Игрок получил VAC бан</h4>
                        <p>${d.vacBans} активных VAC банов</p>
                    </div>
                </div>
            ` : `
                <div class="activity-item">
                    <div class="activity-icon vpn">✓</div>
                    <div class="activity-content">
                        <h4>Банов не обнаружено</h4>
                        <p>Чистая история аккаунта</p>
                    </div>
                </div>
            `}

            <div class="activity-item">
                <div class="activity-icon raid">🔥</div>
                <div class="activity-content">
                    <h4>Steam уровень: ${d.steamLevel}</h4>
                    <p>Достижений: ${d.achievementsCount}</p>
                </div>
            </div>

            <div class="activity-item">
                <div class="activity-icon friend">📅</div>
                <div class="activity-content">
                    <h4>Возраст аккаунта: ${d.accountAgeYears} лет</h4>
                    <p>${d.accountAgeDays} дней · Игр: ${d.gamesCount}</p>
                </div>
            </div>

            ${d.friendsWithRust && d.friendsWithRust.length > 0 ? `
                <div class="activity-item">
                    <div class="activity-icon friend">👥</div>
                    <div class="activity-content">
                        <h4>Друзей с Rust: ${d.friendsWithRust.length}</h4>
                        <p>${d.friendsWithRust.slice(0, 3).map(f => escapeHtml(f.name)).join(', ')}${d.friendsWithRust.length > 3 ? ` и ещё ${d.friendsWithRust.length - 3}` : ''}</p>
                    </div>
                </div>
            ` : `
                <div class="activity-item">
                    <div class="activity-icon friend">👥</div>
                    <div class="activity-content">
                        <h4>Друзей всего: ${d.friendsCount}</h4>
                        <p>Steam API скрывает список друзей для чужих профилей</p>
                    </div>
                </div>
            `}

            <div class="activity-item" onclick="window.open('${escapeHtml(d.profileUrl)}', '_blank')">
                <div class="activity-icon vpn">🔗</div>
                <div class="activity-content">
                    <h4>Открыть профиль Steam</h4>
                    <p>${d.steamId}</p>
                </div>
                <div class="activity-arrow">›</div>
            </div>
        </div>
    `;
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

    resultDiv.innerHTML = `
        <strong>${item.name}</strong><br><br>
        ❤️ ХП: <strong>${item.hp}</strong><br>
        💥 Взрывчатка: <strong>${item.explosive}</strong><br>
        📦 Ресурсы: <strong>${item.resources}</strong>
    `;
    resultDiv.classList.add('show');
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ==================== CRAFT ====================
const CRAFT_DATA = {
    c4: {
        name: 'C4', emoji: '💥', sulfur: 2200, lgf: 60,
        resources: [
            { name: 'Взрывчатка', count: 20 },
            { name: 'Ткань', count: 5 },
            { name: 'Микросхемы', count: 2 }
        ]
    },
    rocket: {
        name: 'Ракета', emoji: '🚀', sulfur: 1400, lgf: 30,
        resources: [
            { name: 'Взрывчатка', count: 10 },
            { name: 'Порох', count: 150 },
            { name: 'Металлическая труба', count: 2 }
        ]
    },
    satchel: {
        name: 'Сатчел', emoji: '🎒', sulfur: 480, lgf: 0,
        resources: [
            { name: 'Бобовая граната', count: 4 },
            { name: 'Малый схрон', count: 1 },
            { name: 'Верёвка', count: 1 }
        ]
    },
    beancan: {
        name: 'Бобовая граната', emoji: '💣', sulfur: 120, lgf: 0,
        resources: [
            { name: 'Порох', count: 60 },
            { name: 'Металлические фрагменты', count: 20 }
        ]
    },
    explo: {
        name: 'Патрон 5.56', emoji: '🔫', sulfur: 25, lgf: 0,
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

    let html = `<div class="craft-info-list">`;
    item.resources.forEach(r => {
        html += `<div class="craft-row"><span>${r.name}</span><strong>${r.count}</strong></div>`;
    });
    html += `<div class="craft-row"><span>Сера</span><strong>${item.sulfur}</strong></div>`;
    if (item.lgf > 0) {
        html += `<div class="craft-row"><span>Топливо (LGF)</span><strong>${item.lgf}</strong></div>`;
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
        html += `• Топливо: <strong>${item.lgf * count}</strong><br>`;
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
        resultDiv.innerHTML = `✅ <strong>${escapeHtml(data.name || match[0])}</strong> добавлен в отслеживание`;
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
            resultDiv.innerHTML = '📊 Список пуст.';
            return;
        }

        let html = `<strong>📊 Отслеживается: ${list.length}</strong><br><br>`;
        list.forEach((w, i) => {
            html += `<strong>${i + 1}. ${escapeHtml(w.name)}</strong><br>`;
            html += `<small style="opacity:0.6">${w.steamId}</small><br>`;
            html += `<small>🚫 VAC: ${w.lastVacBans} · Game: ${w.lastGameBans}</small><br><br>`;
        });

        resultDiv.innerHTML = html;
    } catch (e) {
        resultDiv.innerHTML = `❌ Ошибка: ${escapeHtml(e.message)}`;
    }
}

// ==================== SETTINGS ====================
function openSettings() {
    tg.showAlert('Настройки: скоро здесь появятся опции темы и уведомлений');
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
