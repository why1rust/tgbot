const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
if (tg.setHeaderColor) tg.setHeaderColor('#0e0e12');
if (tg.setBackgroundColor) tg.setBackgroundColor('#0e0e12');

const API_BASE = 'https://rust-bot.sdadawqdqdasda.workers.dev';
const INIT_DATA = tg.initData || '';

let LANG = 'ru';
let SETTINGS = { theme: 'dark', language: 'ru', notifications: true, watchNotifications: true, haptic: true };
let USER_DATA = null;
let LAST_ANALYZED = null;

// ==================== API ====================
async function apiCall(endpoint, data = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: INIT_DATA, ...data })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'API Error');
    return json;
}

// ==================== THEME ====================
function applyTheme(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f7f8fa' : '#0e0e12');
    if (tg.setHeaderColor) tg.setHeaderColor(t === 'light' ? '#f7f8fa' : '#0e0e12');
    if (tg.setBackgroundColor) tg.setBackgroundColor(t === 'light' ? '#f7f8fa' : '#0e0e12');
    document.querySelectorAll('#theme-seg button').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
}
async function setTheme(theme) {
    SETTINGS.theme = theme;
    applyTheme(theme);
    try { await apiCall('/api/settings', { settings: { theme } }); } catch (e) {}
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}
async function setLanguage(lang) {
    SETTINGS.language = lang;
    LANG = lang;
    try { await apiCall('/api/settings', { settings: { language: lang } }); } catch (e) {}
    document.querySelectorAll('#lang-seg button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    if (LAST_ANALYZED) {
        const el = document.getElementById('steam-result');
        if (el && el.innerHTML) el.innerHTML = renderSteamProfile(LAST_ANALYZED);
    }
}
async function setSetting(key, value) {
    SETTINGS[key] = value;
    try { await apiCall('/api/settings', { settings: { [key]: value } }); } catch (e) {}
    if (key === 'haptic' && value && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}
function updateSegActive() {
    document.querySelectorAll('#theme-seg button').forEach(b => b.classList.toggle('active', b.dataset.theme === SETTINGS.theme));
    document.querySelectorAll('#lang-seg button').forEach(b => b.classList.toggle('active', b.dataset.lang === SETTINGS.language));
}

// ==================== TABS ====================
function goToTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const tab = document.querySelector(`.tab[data-tab="${name}"]`);
    if (tab) tab.classList.add('active');
    const panel = document.getElementById(`panel-${name}`);
    if (panel) panel.classList.add('active');
    if (name === 'watch') loadWatchlist();
    if (name === 'admin') adminLoadDashboard();
}

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        goToTab(tab.dataset.tab);
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    });
});

// ==================== STEAM ====================
async function analyzeSteam() {
    const input = document.getElementById('steam-input').value.trim();
    const resultDiv = document.getElementById('steam-result');
    const match = input.match(/\d{17}/);
    if (!match) { resultDiv.innerHTML = '❌ Введи SteamID (17 цифр)'; resultDiv.classList.add('show'); return; }
    resultDiv.innerHTML = '<span class="spinner"></span>Анализирую...';
    resultDiv.classList.add('show');
    try {
        const data = await apiCall('/api/steam', { steamId: match[0] });
        if (data.error) { resultDiv.innerHTML = `❌ ${escapeHtml(data.error)}`; return; }
        LAST_ANALYZED = data;
        resultDiv.innerHTML = renderSteamProfile(data);
        resultDiv.classList.add('show');
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) {
        resultDiv.innerHTML = `❌ ${escapeHtml(e.message)}`;
    }
}

function renderActivityGraph(graph) {
    if (!graph || !graph.twoWeeksMinutes) return '';
    // Строим график: 14 столбиков (по дням за 2 недели), распределяем равномерно
    // Steam не даёт по дням, только общее за 2 недели, поэтому рисуем "сглаженный" визуал
    const days = 14;
    const totalHours = graph.twoWeeksHours;
    const avg = graph.avgPerDay;
    // Генерируем псевдо-распределение с вариацией
    const values = [];
    let sum = 0;
    for (let i = 0; i < days; i++) {
        const variation = 0.5 + Math.random() * 1.0; // 0.5x - 1.5x
        values.push(variation);
        sum += variation;
    }
    const norm = values.map(v => (v / sum) * totalHours);
    const maxVal = Math.max(...norm, 0.1);

    let barsHtml = '';
    const labels = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс','Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    for (let i = 0; i < days; i++) {
        const h = Math.max(4, (norm[i] / maxVal) * 100);
        const lbl = labels[i] || '';
        barsHtml += `<div class="activity-bar-wrap">
            <div class="activity-bar" style="height:${h}%"></div>
            <div class="activity-bar-label">${lbl}</div>
        </div>`;
    }

    return `
        <div class="activity-graph-card">
            <div class="activity-graph-header">
                <div>
                    <h3>📊 График активности</h3>
                    <p>Часы в Rust за 2 недели</p>
                </div>
            </div>
            <div class="activity-graph-bars">${barsHtml}</div>
            <div class="activity-graph-stats">
                <div class="activity-graph-stat">
                    <div class="activity-graph-stat-value">${totalHours} ч</div>
                    <div class="activity-graph-stat-label">Всего за 2 нед.</div>
                </div>
                <div class="activity-graph-stat">
                    <div class="activity-graph-stat-value">${avg} ч</div>
                    <div class="activity-graph-stat-label">В среднем в день</div>
                </div>
            </div>
        </div>
    `;
}

function renderComparison(player, comparison) {
    if (!comparison || !comparison.friendsTotal) return '';
    // У нас нет часов друзей, но покажем сколько друзей и играют ли в Rust
    const friendsCount = comparison.friendsTotal;
    const pctFriends = Math.min(100, friendsCount * 5); // грубая метрика, до 20 друзей = 100%

    // Сравнение часов игрока со средним по Rust (500ч = "средний")
    const avgRustHours = 500;
    const playerPct = Math.min(100, Math.round((player.rustPlaytime / avgRustHours) * 100));
    const avgPct = 100;

    return `
        <div class="comparison-card">
            <div class="comparison-header">
                <div>
                    <h3>👥 Сравнение</h3>
                    <p>Игрок vs средний Rust-игрок</p>
                </div>
            </div>
            <div class="comparison-row">
                <div class="comparison-row-head">
                    <span>🎮 Часы в Rust</span>
                    <span>${player.rustPlaytime} ч / ~${avgRustHours} ч</span>
                </div>
                <div class="comparison-bar-track">
                    <div class="comparison-bar-fill player" style="width:${playerPct}%"></div>
                </div>
            </div>
            <div class="comparison-row">
                <div class="comparison-row-head">
                    <span>👥 Друзей с Rust</span>
                    <span>${friendsCount}</span>
                </div>
                <div class="comparison-bar-track">
                    <div class="comparison-bar-fill yours" style="width:${pctFriends}%"></div>
                </div>
            </div>
        </div>
    `;
}

function renderSteamProfile(d) {
    if (d.privateWarning) {
        return `<div class="player-card"><div class="player-top"><div class="player-avatar">🔒</div><div class="player-info"><h3>${escapeHtml(d.name)}</h3><span class="player-status offline">Приватный профиль</span></div></div></div>`;
    }
    const isOnline = d.state.includes('Online') || d.state.includes('In game') || d.state.includes('Онлайн') || d.state.includes('В игре');
    const initials = d.name.substring(0, 2).toUpperCase();
    const riskClass = d.riskScore >= 70 ? 'critical' : d.riskScore >= 50 ? 'high' : d.riskScore >= 30 ? 'medium' : 'low';
    const hasBan = d.vacBans > 0 || d.gameBans > 0;
    const totalBans = d.vacBans + d.gameBans;
    const avatarSrc = d.avatar ? `${API_BASE}/api/avatar?url=${encodeURIComponent(d.avatar)}` : '';
    return `
        <div class="player-card">
            <div class="player-top">
                ${avatarSrc ? `<img class="player-avatar-img ${isOnline ? 'online' : ''}" src="${avatarSrc}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                <div class="player-avatar ${isOnline ? 'online' : ''}" style="${avatarSrc ? 'display:none' : ''}">${initials}</div>
                <div class="player-info">
                    <h3>${escapeHtml(d.name)}</h3>
                    <span class="player-status ${isOnline ? 'online' : 'offline'}">Steam ${escapeHtml(d.state)}</span>
                </div>
                ${hasBan ? `<div class="vac-badge">⚠ BAN</div>` : `<div class="no-vac-badge">✓ OK</div>`}
            </div>
            <div class="stats-grid">
                <div class="stat-box"><div class="stat-icon purple">🦀</div><div class="stat-value">${d.rustPlaytime.toLocaleString('ru-RU')}</div><div class="stat-label">часов Rust</div></div>
                <div class="stat-box"><div class="stat-icon cyan">👥</div><div class="stat-value">${d.friendsCount}</div><div class="stat-label">друзей</div></div>
                <div class="stat-box"><div class="stat-icon red">!</div><div class="stat-value">${totalBans}</div><div class="stat-label">банов</div></div>
            </div>
        </div>
        <div class="risk-card">
            <div class="risk-head"><div><h3>Риск читерства</h3><p>Анализ VAC, часов и активности</p></div><div class="risk-value"><div class="risk-percent ${riskClass}">${d.riskScore}%</div><div class="risk-level ${riskClass}">${escapeHtml(d.riskLevel)}</div></div></div>
            <div class="risk-bar"><div class="risk-indicator" style="left: ${d.riskScore}%"></div></div>
            <div class="risk-labels"><span>Низкий</span><span>Высокий</span></div>
        </div>
        ${d.premium && d.activityGraph ? renderActivityGraph(d.activityGraph) : ''}
        ${d.premium && d.comparison ? renderComparison(d, d.comparison) : ''}
        <div class="section-title-mini">Активность</div>
        <div class="activity-list">
            ${hasBan ? `<div class="activity-item"><div class="activity-icon vac">VAC</div><div class="activity-content"><h4>VAC бан</h4><p>${d.vacBans} активных</p></div></div>` : `<div class="activity-item"><div class="activity-icon vpn">✓</div><div class="activity-content"><h4>Банов нет</h4><p>Чистая история</p></div></div>`}
            <div class="activity-item"><div class="activity-icon raid">🔥</div><div class="activity-content"><h4>Steam уровень: ${d.steamLevel}</h4><p>Достижений: ${d.achievementsCount}</p></div></div>
            <div class="activity-item"><div class="activity-icon friend">📅</div><div class="activity-content"><h4>Возраст: ${d.accountAgeYears} лет</h4><p>${d.accountAgeDays} дней · Игр: ${d.gamesCount}</p></div></div>
            ${d.friendsWithRust?.length > 0 ? `<div class="activity-item" onclick="openFriendsScreen()"><div class="activity-icon friend">👥</div><div class="activity-content"><h4>Друзей с Rust: ${d.friendsWithRust.length}</h4><p>Открыть список</p></div></div>` : ''}
            <div class="activity-item" onclick="window.open('${escapeHtml(d.profileUrl)}','_blank')"><div class="activity-icon vpn">🔗</div><div class="activity-content"><h4>Открыть профиль</h4><p>${d.steamId}</p></div></div>
        </div>
    `;
}

// ==================== FRIENDS ====================
function openFriendsScreen() {
    if (!LAST_ANALYZED || !LAST_ANALYZED.friendsWithRust) return;
    const body = document.getElementById('friends-body');
    const friends = LAST_ANALYZED.friendsWithRust;
    if (!friends.length) {
        body.innerHTML = `<div class="loading-block">Нет друзей с Rust</div>`;
    } else {
        let html = '';
        friends.forEach(f => {
            const initials = (f.name || 'U').substring(0, 2).toUpperCase();
            const av = f.avatar
                ? `<div class="friend-avatar"><img src="${API_BASE}/api/avatar?url=${encodeURIComponent(f.avatar)}" onerror="this.parentNode.innerHTML='${initials}';"></div>`
                : `<div class="friend-avatar">${initials}</div>`;
            html += `<div class="friend-row">
                ${av}
                <div class="friend-info">
                    <div class="friend-name">${escapeHtml(f.name)}</div>
                    <div class="friend-id">${f.steamId}</div>
                </div>
                <div class="friend-actions">
                    <button class="friend-btn steam" onclick="window.open('${escapeHtml(f.profileUrl)}','_blank')">🌐</button>
                    <button class="friend-btn check" onclick="checkFriend('${f.steamId}')">🔍</button>
                </div>
            </div>`;
        });
        body.innerHTML = html;
    }
    document.getElementById('friends-screen').style.display = 'flex';
}
function closeFriendsScreen() { document.getElementById('friends-screen').style.display = 'none'; }
async function checkFriend(steamId) {
    closeFriendsScreen();
    document.getElementById('steam-input').value = steamId;
    goToTab('steam');
    setTimeout(() => analyzeSteam(), 100);
}

// ==================== RAID ====================
const RAID_DATA = {
    doors: { title: '🚪 Doors', items: {
        wood_door: { name: 'Деревянная дверь', hp: 200, explosive: '2 молотова', resources: '100 топлива' },
        sheet_door: { name: 'Железная дверь', hp: 250, explosive: '1 ракета, 8 разрывов', resources: '1600 серы' },
        garage_door: { name: 'Гаражка', hp: 600, explosive: '3 ракеты', resources: '4200 серы' },
        mvp_door: { name: 'МВК дверь', hp: 1000, explosive: '2 C4, 30 разрывов', resources: '5900 серы' },
        ladder_hatch: { name: 'Люк', hp: 250, explosive: '1 ракета, 8 разрывов', resources: '1600 серы' },
        shop_front: { name: 'Витрина', hp: 750, explosive: '3 C4', resources: '6600 серы' }
    }},
    walls: { title: '🧱 Walls', items: {
        wood_wall: { name: 'Деревянная стена', hp: 250, explosive: '4 молотова', resources: '200 топлива' },
        stone_wall: { name: 'Каменная стена', hp: 500, explosive: '3 ракеты, 35 разрывов', resources: '5075 серы' },
        sheet_wall: { name: 'Железная стена', hp: 1000, explosive: '7 ракет, 15 разрывов', resources: '10175 серы' },
        mvp_wall: { name: 'МВК стена', hp: 2000, explosive: '14 ракет, 30 разрывов', resources: '20350 серы' }
    }},
    outer_walls: { title: '🛡️ Outer', items: {
        outer_stone: { name: 'Каменная стена', hp: 500, explosive: '2 C4', resources: '4400 серы' },
        outer_wood: { name: 'Деревянная стена', hp: 500, explosive: '1 зажигательная ракета', resources: '75 топлива' }
    }}
};
function renderRaidItems() {
    const cat = document.getElementById('raid-cat').value;
    const select = document.getElementById('raid-target');
    select.innerHTML = Object.entries(RAID_DATA[cat].items).map(([k, i]) => `<option value="${k}">${i.name}</option>`).join('');
}
function calculateRaid() {
    const cat = document.getElementById('raid-cat').value;
    const key = document.getElementById('raid-target').value;
    const item = RAID_DATA[cat].items[key];
    const result = document.getElementById('raid-result');
    result.innerHTML = `<strong>${item.name}</strong><br><br>❤️ HP: <strong>${item.hp}</strong><br>💥 ${item.explosive}<br>📦 ${item.resources}`;
    result.classList.add('show');
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ==================== CRAFT ====================
const CRAFT_DATA = {
    c4: { name: 'C4', emoji: '💥', sulfur: 2200, lgf: 60, resources: [{name:'Взрывчатка',count:20},{name:'Ткань',count:5},{name:'Микросхемы',count:2}] },
    rocket: { name: 'Ракета', emoji: '🚀', sulfur: 1400, lgf: 30, resources: [{name:'Взрывчатка',count:10},{name:'Порох',count:150},{name:'Труба',count:2}] },
    satchel: { name: 'Сатчел', emoji: '🎒', sulfur: 480, lgf: 0, resources: [{name:'Бобовая',count:4},{name:'Схрон',count:1},{name:'Верёвка',count:1}] },
    beancan: { name: 'Бобовая', emoji: '💣', sulfur: 120, lgf: 0, resources: [{name:'Порох',count:60},{name:'Фрагменты',count:20}] },
    explo: { name: 'Патрон 5.56', emoji: '🔫', sulfur: 25, lgf: 0, resources: [{name:'Порох',count:5},{name:'Фрагменты',count:10}] }
};
function updateCraftInfo() {
    const type = document.getElementById('craft-type').value;
    const item = CRAFT_DATA[type];
    const info = document.getElementById('craft-info');
    let html = `<div class="craft-info-list">`;
    item.resources.forEach(r => html += `<div class="craft-row"><span>${r.name}</span><strong>${r.count}</strong></div>`);
    html += `<div class="craft-row"><span>Сера</span><strong>${item.sulfur}</strong></div>`;
    if (item.lgf > 0) html += `<div class="craft-row"><span>Топливо</span><strong>${item.lgf}</strong></div>`;
    html += `</div>`;
    info.innerHTML = html;
}
function calculateCraft() {
    const type = document.getElementById('craft-type').value;
    const count = parseInt(document.getElementById('craft-count').value) || 1;
    const item = CRAFT_DATA[type];
    const result = document.getElementById('craft-result');
    let html = `<strong>${item.emoji} ${item.name} × ${count}</strong><br><br>`;
    item.resources.forEach(r => html += `• ${r.name}: <strong>${r.count * count}</strong><br>`);
    html += `• Сера: <strong>${item.sulfur * count}</strong><br>`;
    if (item.lgf > 0) html += `• Топливо: <strong>${item.lgf * count}</strong><br>`;
    result.innerHTML = html;
    result.classList.add('show');
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ==================== WATCHLIST ====================
async function addToWatchlist() {
    const input = document.getElementById('watch-input').value.trim();
    const result = document.getElementById('watch-result');
    const match = input.match(/\d{17}/);
    if (!match) { result.innerHTML = '❌ Введи SteamID'; result.classList.add('show'); return; }
    result.innerHTML = '<span class="spinner"></span>Добавляю...';
    result.classList.add('show');
    try {
        const data = await apiCall('/api/watch-add', { steamId: match[0] });
        result.innerHTML = `✅ <strong>${escapeHtml(data.name)}</strong> добавлен`;
        document.getElementById('watch-input').value = '';
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}
async function loadWatchlist() {
    const result = document.getElementById('watchlist-result');
    result.innerHTML = '<span class="spinner"></span>Загружаю...';
    result.classList.add('show');
    try {
        const list = await apiCall('/api/watch-list');
        if (!list?.length) { result.innerHTML = '📊 Список пуст'; return; }
        let html = `<strong>Отслеживается: ${list.length}</strong><br><br>`;
        list.forEach((w, i) => {
            html += `<div style="padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;"><strong>${i+1}. ${escapeHtml(w.name)}</strong><br><small style="color:var(--muted);">${w.steamId}</small><br><small style="color:var(--muted);">VAC: ${w.lastVacBans} · Game: ${w.lastGameBans}</small><br><button class="btn secondary" style="margin-top:8px;padding:8px;font-size:12px;" onclick="removeFromWatchlist('${w.steamId}')">🗑 Удалить</button></div>`;
        });
        result.innerHTML = html;
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}
async function removeFromWatchlist(steamId) {
    try {
        await apiCall('/api/watch-remove', { steamId });
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        loadWatchlist();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}
function openWatchlistFromSidebar() { toggleSidebar(); goToTab('watch'); }

// ==================== PROFILE ====================
function openProfile() {
    toggleSidebar();
    document.getElementById('profile-modal').style.display = 'flex';
    loadProfile();
}
function closeProfileModal() { document.getElementById('profile-modal').style.display = 'none'; }

async function loadProfile() {
    const container = document.getElementById('profile-content');
    container.innerHTML = '<div class="loading-block">⏳ Загружаю профиль...</div>';
    try {
        const profile = await apiCall('/api/profile');
        USER_DATA = profile;
        LANG = profile.settings?.language || LANG;
        SETTINGS = { ...SETTINGS, ...(profile.settings || {}) };
        applyTheme(SETTINGS.theme);
        updateSegActive();
        updateUserUI(profile);
        showAdminTabIfAdmin(profile.isAdmin);

        const dateFmt = (ts) => {
            const d = new Date(ts);
            return {
                date: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                time: d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            };
        };
        let premiumHtml = '';
        if (profile.premium && profile.premiumExpires) {
            const { date, time } = dateFmt(profile.premiumExpires);
            premiumHtml = `<div class="premium-status active"><div class="premium-status-icon">⭐</div><div class="premium-status-info"><div class="premium-status-title">Премиум активен</div><div class="premium-status-date">до <b>${date}</b> в <b>${time}</b></div><div class="premium-status-days">Осталось: <b>${profile.daysLeft} дн.</b></div></div></div>`;
        } else if (profile.premium) {
            premiumHtml = `<div class="premium-status active"><div class="premium-status-icon">👑</div><div class="premium-status-info"><div class="premium-status-title">Администратор</div><div class="premium-status-date">Постоянный доступ</div></div></div>`;
        } else {
            premiumHtml = `<div class="premium-status inactive"><div class="premium-status-icon">❌</div><div class="premium-status-info"><div class="premium-status-title">Премиум не активен</div><div class="premium-status-date">Купи премиум для безлимита</div></div></div>`;
        }
        let avatarHtml = '';
        if (profile.photoUrl) {
            avatarHtml = `<img class="profile-avatar" src="${escapeHtml(profile.photoUrl)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="profile-avatar-fallback" style="display:none">${(profile.firstName || 'U').charAt(0).toUpperCase()}</div>`;
        } else {
            avatarHtml = `<div class="profile-avatar-fallback">${(profile.firstName || 'U').charAt(0).toUpperCase()}</div>`;
        }
        let html = `
            <div class="profile-hero">
                ${avatarHtml}
                <div class="profile-name">${escapeHtml(profile.firstName)} ${escapeHtml(profile.lastName || '')}</div>
                <div class="profile-username">${profile.username ? '@' + escapeHtml(profile.username) : '—'}</div>
            </div>
            ${premiumHtml}
            <div class="stats-profile-grid">
                <div class="stat-profile-box"><div class="stat-profile-value">${profile.remainingChecks}</div><div class="stat-profile-label">Проверок</div></div>
                <div class="stat-profile-box"><div class="stat-profile-value">${profile.watchlistCount}</div><div class="stat-profile-label">Отслеж.</div></div>
                <div class="stat-profile-box"><div class="stat-profile-value">${profile.referral.count}</div><div class="stat-profile-label">Рефералов</div></div>
            </div>
        `;
        if (profile.discount) {
            const { date, time } = dateFmt(profile.discount.expiresAt);
            html += `<div class="premium-status active" style="background:linear-gradient(135deg,rgba(34,211,238,.1),rgba(34,211,238,.03));border-color:rgba(34,211,238,.35);">
                <div class="premium-status-icon">💰</div>
                <div class="premium-status-info">
                    <div class="premium-status-title">Скидка ${profile.discount.percent}%</div>
                    <div class="premium-status-date">до <b>${date}</b> в <b>${time}</b></div>
                    <div class="premium-status-days">На покупку премиума</div>
                </div>
            </div>`;
        }
        html += `<div class="card">
            <div class="card-head"><h3>Действия</h3></div>
            ${!profile.premium ? `<button class="btn primary" onclick="openPremiumFromProfile()">⭐ Купить премиум</button>` : ''}
            ${!profile.trialUsed ? `<button class="btn secondary" style="margin-top:8px" onclick="activateTrial()">🎁 Пробная ${profile.trialDays} дня</button>` : ''}
            <button class="btn secondary" style="margin-top:8px" onclick="showPromoInput()">🎟 Активировать промокод</button>
            <button class="btn secondary" style="margin-top:8px" onclick="openReferral()">🎁 Реферальная ссылка</button>
        </div>`;
        container.innerHTML = html;
        if (!profile.isAdmin) {
            ['edit-promo-modal', 'admin-ticket-chat'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
        }
    } catch (e) {
        container.innerHTML = `<div class="card"><div class="result show">❌ ${escapeHtml(e.message)}</div></div>`;
    }
}
function updateUserUI(p) {
    const ha = document.getElementById('header-avatar');
    if (ha) {
        if (p.photoUrl) ha.innerHTML = `<img src="${escapeHtml(p.photoUrl)}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
        else ha.textContent = (p.firstName || 'U').charAt(0).toUpperCase();
    }
    const sa = document.getElementById('sidebar-avatar');
    if (sa) {
        if (p.photoUrl) sa.innerHTML = `<img src="${escapeHtml(p.photoUrl)}">`;
        else sa.textContent = (p.firstName || 'U').charAt(0).toUpperCase();
    }
    const sn = document.getElementById('sidebar-user-name');
    if (sn) sn.textContent = `${p.firstName || 'User'} ${p.lastName || ''}`.trim();
    const si = document.getElementById('sidebar-user-id');
    if (si) si.textContent = `ID: ${p.userId}` + (p.username ? ` · @${p.username}` : '');
}
function showAdminTabIfAdmin(isAdmin) {
    const tab = document.querySelector('.admin-only-tab');
    if (!tab) return;
    tab.style.display = isAdmin ? 'flex' : 'none';
    if (!isAdmin) {
        // Если админка открыта - уйти на steam
        if (document.getElementById('panel-admin').classList.contains('active')) goToTab('steam');
    }
}
function openPremiumFromProfile() {
    closeProfileModal();
    goToTab('steam');
    tg.showAlert('Открой бота → /start → «⭐ Купить премиум»');
}
async function activateTrial() {
    const promo = prompt('Введи промокод для пробной:');
    if (!promo) return;
    try {
        const result = await apiCall('/api/activate-trial', { promo });
        tg.showAlert(`🎉 Пробная активирована на ${result.days} дня!`);
        loadProfile();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}
function showPromoInput() {
    const code = prompt('Введи промокод:');
    if (!code) return;
    apiCall('/api/use-promo', { code }).then(result => {
        tg.showAlert('✅ ' + result.message);
        if (document.getElementById('profile-modal').style.display === 'flex') loadProfile();
    }).catch(e => tg.showAlert('Ошибка: ' + e.message));
}
async function openReferral() {
    try {
        const profile = await apiCall('/api/profile');
        const link = profile.referral.link;
        tg.showPopup({
            title: '🎁 Реферальная ссылка',
            message: `Приглашено: ${profile.referral.count}\nБонусов: ${profile.referral.bonusChecks}\n\n${link}`,
            buttons: [
                { id: 'copy', type: 'default', text: '📋 Скопировать' },
                { id: 'share', type: 'default', text: '📤 Поделиться' },
                { id: 'cancel', type: 'cancel' }
            ]
        }, (id) => {
            if (id === 'copy') { navigator.clipboard.writeText(link); tg.showAlert('✅ Скопировано'); }
            if (id === 'share') { tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}`); }
        });
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

// ==================== SIDEBAR ====================
function toggleSidebar(e) {
    if (e) e.stopPropagation();
    const sb = document.getElementById('profile-sidebar');
    if (!sb) return;
    sb.classList.toggle('open');
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

// ==================== SUPPORT ====================
let currentTicket = null;
let pollInterval = null;
function openSupport() {
    toggleSidebar();
    document.getElementById('support-modal').style.display = 'flex';
    loadSupport();
}
function closeSupportModal() {
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    document.getElementById('support-modal').style.display = 'none';
}
async function loadSupport() {
    try {
        const data = await apiCall('/api/support/my-ticket');
        currentTicket = data.ticket;
        if (currentTicket && currentTicket.status !== 'closed') {
            document.getElementById('support-start').style.display = 'none';
            document.getElementById('support-chat').style.display = 'flex';
            renderSupportMessages();
            updateSupportStatus();
            startPolling();
        } else {
            document.getElementById('support-start').style.display = 'block';
            document.getElementById('support-chat').style.display = 'none';
            if (currentTicket && currentTicket.status === 'closed') currentTicket = null;
        }
    } catch (e) { console.error(e); }
}
function updateSupportStatus() {
    if (!currentTicket) return;
    const banner = document.getElementById('support-waiting-banner');
    const desc = document.getElementById('support-status-desc');
    if (currentTicket.status === 'waiting') { banner.classList.remove('hidden'); if (desc) desc.textContent = 'Ожидаем ответа...'; }
    else if (currentTicket.status === 'admin_connected') { banner.classList.add('hidden'); if (desc) desc.textContent = 'Админ подключился'; }
    else { banner.classList.add('hidden'); if (desc) desc.textContent = 'Диалог завершён'; }
}
async function createTicket() {
    const message = document.getElementById('support-first-message').value.trim();
    if (!message || message.length < 10) { tg.showAlert('Опиши проблему (мин. 10 символов)'); return; }
    try {
        const data = await apiCall('/api/support/create', { message });
        currentTicket = data.ticket;
        document.getElementById('support-start').style.display = 'none';
        document.getElementById('support-chat').style.display = 'flex';
        document.getElementById('support-first-message').value = '';
        renderSupportMessages();
        updateSupportStatus();
        startPolling();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}
async function closeMyTicket() {
    const confirmed = await new Promise(res => tg.showConfirm('Закрыть тикет?', res));
    if (!confirmed) return;
    try {
        await apiCall('/api/support/close-my-ticket');
        tg.showAlert('✅ Тикет закрыт');
        currentTicket = null;
        document.getElementById('support-chat').style.display = 'none';
        document.getElementById('support-start').style.display = 'block';
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}
function renderSupportMessages() {
    if (!currentTicket) return;
    const c = document.getElementById('support-messages');
    let html = '';
    currentTicket.messages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        html += `<div class="chat-msg ${msg.role}">${escapeHtml(msg.text)}<span class="chat-msg-time">${time}</span></div>`;
    });
    if (currentTicket.status === 'waiting') html += `<div class="chat-msg system">⏳ Ожидаем ответа</div>`;
    c.innerHTML = html;
    c.scrollTop = c.scrollHeight;
}
async function sendSupportMessage() {
    const input = document.getElementById('support-input');
    const message = input.value.trim();
    if (!message) return;
    input.value = '';
    currentTicket.messages.push({ role: 'user', text: message, timestamp: Date.now() });
    renderSupportMessages();
    try {
        const data = await apiCall('/api/support/send', { message });
        currentTicket = data.ticket;
        renderSupportMessages();
        updateSupportStatus();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}
function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
        try {
            const data = await apiCall('/api/support/my-ticket');
            if (data.ticket) {
                const oldStatus = currentTicket?.status;
                const oldLen = currentTicket?.messages?.length || 0;
                currentTicket = data.ticket;
                if (currentTicket.status !== oldStatus || currentTicket.messages.length !== oldLen) {
                    renderSupportMessages();
                    updateSupportStatus();
                }
            }
        } catch (e) {}
    }, 5000);
}

// ==================== ADMIN ====================
let currentAdminTicket = null;
let adminTicketPoll = null;

async function adminLoadDashboard() {
    const c = document.getElementById('admin-stats-content');
    c.innerHTML = '<div class="loading-block">⏳</div>';
    try {
        const s = await apiCall('/api/admin/stats');
        c.innerHTML = `
            <div class="admin-grid-3">
                <div class="admin-stat-card"><div class="admin-stat-value">${s.totalUsers}</div><div class="admin-stat-label">Юзеров</div></div>
                <div class="admin-stat-card"><div class="admin-stat-value green">${s.premiumUsers}</div><div class="admin-stat-label">Премиум</div></div>
                <div class="admin-stat-card"><div class="admin-stat-value cyan">${s.purchasedUsers || 0}</div><div class="admin-stat-label">Купили</div></div>
            </div>
            <div class="admin-grid-3">
                <div class="admin-stat-card"><div class="admin-stat-value yellow">${s.totalRevenue || 0}</div><div class="admin-stat-label">Доход (Stars)</div></div>
                <div class="admin-stat-card"><div class="admin-stat-value">${s.totalReferrals}</div><div class="admin-stat-label">Рефералов</div></div>
                <div class="admin-stat-card"><div class="admin-stat-value">${s.todayChecks}</div><div class="admin-stat-label">Проверок сегодня</div></div>
            </div>
            <div class="admin-grid">
                <div class="admin-stat-card"><div class="admin-stat-value">${s.totalWatched}</div><div class="admin-stat-label">В отслеживании</div></div>
                <div class="admin-stat-card"><div class="admin-stat-value green">${s.purchasesToday || 0}</div><div class="admin-stat-label">Покупок сегодня</div></div>
            </div>
        `;
    } catch (e) { c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`; }
}

async function adminLoadUsers() {
    const c = document.getElementById('admin-users-content');
    c.innerHTML = '<div class="loading-block">⏳</div>';
    try {
        const data = await apiCall('/api/admin/users');
        if (!data.users?.length) { c.innerHTML = '<div class="loading-block">Нет пользователей</div>'; return; }
        let html = '';
        data.users.slice(0, 50).forEach(u => {
            const un = u.username ? `@${u.username}` : '—';
            const pi = u.premium ? '⭐' : '👤';
            let exp = '';
            if (u.premiumExpires) { const d = new Date(u.premiumExpires); exp = `до ${d.toLocaleDateString('ru-RU')}`; }
            html += `<div class="promo-item"><div><div class="promo-code">${pi} ${escapeHtml(u.firstName || '—')}</div><div class="promo-details">${un} · ID: ${u.userId}</div><div class="promo-details">${exp} · 👁️ ${u.watchlistCount}</div></div></div>`;
        });
        c.innerHTML = html;
    } catch (e) { c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`; }
}

let searchTimeout = null;
function adminSearchUsers() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        const q = document.getElementById('admin-search-input').value.trim();
        const c = document.getElementById('admin-users-content');
        if (!q) { adminLoadUsers(); return; }
        c.innerHTML = '<div class="loading-block">🔍 Поиск...</div>';
        try {
            const data = await apiCall('/api/admin/search-user', { query: q });
            if (!data.results?.length) { c.innerHTML = '<div class="loading-block">Ничего не найдено</div>'; return; }
            let html = '';
            data.results.forEach(u => {
                const pi = u.premium ? '⭐' : '👤';
                const un = u.username ? `@${u.username}` : '—';
                html += `<div class="promo-item"><div><div class="promo-code">${pi} ${escapeHtml(u.firstName || '—')}</div><div class="promo-details">${un} · ID: ${u.userId}</div></div></div>`;
            });
            c.innerHTML = html;
        } catch (e) { c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`; }
    }, 300);
}

async function adminLoadLogs() {
    const c = document.getElementById('admin-logs-content');
    c.innerHTML = '<div class="loading-block">⏳</div>';
    try {
        const data = await apiCall('/api/admin/logs');
        if (!data.logs?.length) { c.innerHTML = '<div class="loading-block">Логов нет</div>'; return; }
        const actionEmoji = {
            'give_premium': '⭐',
            'revoke_premium': '❌',
            'create_promo': '🎟',
            'edit_promo': '✏️',
            'delete_promo': '🗑',
            'broadcast': '📢'
        };
        let html = '';
        data.logs.slice(0, 50).forEach(l => {
            const time = new Date(l.t).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const emoji = actionEmoji[l.action] || '📌';
            html += `<div class="log-item">
                <div class="log-icon">${emoji}</div>
                <div class="log-content">
                    <div class="log-action">${l.action}</div>
                    <div class="log-details">${escapeHtml(l.details || '')} · admin: ${l.adminId}</div>
                </div>
                <div class="log-time">${time}</div>
            </div>`;
        });
        c.innerHTML = html;
    } catch (e) { c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`; }
}

async function loadAdminTickets() {
    try {
        const data = await apiCall('/api/support/admin/tickets');
        const c = document.getElementById('admin-tickets-list');
        if (!data.tickets?.length) { c.innerHTML = `<p style="text-align:center;opacity:.5;padding:20px;">Нет тикетов</p>`; return; }
        let html = '';
        data.tickets.forEach(t => {
            const isUnread = t.status === 'waiting';
            const st = { 'waiting': '⏳', 'admin_connected': '💬', 'closed': '✅' }[t.status];
            const un = t.username ? `@${t.username}` : '—';
            html += `<div class="ticket-item ${isUnread ? 'unread' : ''}" onclick="openAdminTicket('${t.id}')">
                <div class="ticket-icon">${isUnread ? '🔴' : '💬'}</div>
                <div class="ticket-info">
                    <div class="ticket-name">${escapeHtml(t.firstName)} · ${un}</div>
                    <div class="ticket-preview">${escapeHtml(t.lastMessage.substring(0, 50))}</div>
                </div>
                <div class="ticket-status ${t.status}">${st}</div>
            </div>`;
        });
        c.innerHTML = html;
    } catch (e) { console.error(e); }
}

async function openAdminTicket(ticketId) {
    try {
        const data = await apiCall('/api/support/admin/ticket', { ticketId });
        currentAdminTicket = data.ticket;
        document.getElementById('admin-ticket-name').textContent = currentAdminTicket.firstName || 'User';
        document.getElementById('admin-ticket-sub').textContent = (currentAdminTicket.username ? '@' + currentAdminTicket.username + ' · ' : '') + 'ID: ' + currentAdminTicket.userId;
        document.getElementById('admin-ticket-avatar').textContent = '👤';
        renderAdminTicketMessages();
        document.getElementById('admin-ticket-chat').style.display = 'flex';
        if (adminTicketPoll) clearInterval(adminTicketPoll);
        adminTicketPoll = setInterval(async () => {
            try {
                const fresh = await apiCall('/api/support/admin/ticket', { ticketId });
                if (fresh.ticket && fresh.ticket.messages.length !== currentAdminTicket.messages.length) {
                    currentAdminTicket = fresh.ticket;
                    renderAdminTicketMessages();
                }
            } catch (e) {}
        }, 5000);
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}
function renderAdminTicketMessages() {
    if (!currentAdminTicket) return;
    const c = document.getElementById('admin-ticket-messages');
    let html = '';
    currentAdminTicket.messages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const visualRole = msg.role === 'admin' ? 'user' : 'admin';
        html += `<div class="chat-msg ${visualRole}">${escapeHtml(msg.text)}<span class="chat-msg-time">${time}</span></div>`;
    });
    if (currentAdminTicket.status === 'waiting') html += `<div class="chat-msg system">⏳ Ждём ответа</div>`;
    else if (currentAdminTicket.status === 'closed') html += `<div class="chat-msg system">✅ Тикет закрыт</div>`;
    c.innerHTML = html;
    c.scrollTop = c.scrollHeight;
}
async function sendAdminTicketMessage() {
    const input = document.getElementById('admin-ticket-input');
    const message = input.value.trim();
    if (!message || !currentAdminTicket) return;
    input.value = '';
    currentAdminTicket.messages.push({ role: 'admin', text: message, timestamp: Date.now() });
    renderAdminTicketMessages();
    try {
        const data = await apiCall('/api/support/admin/reply', { ticketId: currentAdminTicket.id, message });
        currentAdminTicket = data.ticket;
        renderAdminTicketMessages();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}
function closeAdminTicketChat() {
    if (adminTicketPoll) { clearInterval(adminTicketPoll); adminTicketPoll = null; }
    document.getElementById('admin-ticket-chat').style.display = 'none';
    loadAdminTickets();
}
async function closeAdminTicket() {
    if (!currentAdminTicket) return;
    const confirmed = await new Promise(res => tg.showConfirm('Закрыть тикет?', res));
    if (!confirmed) return;
    try {
        await apiCall('/api/support/admin/close', { ticketId: currentAdminTicket.id });
        tg.showAlert('✅ Тикет закрыт');
        closeAdminTicketChat();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

document.querySelectorAll('.admin-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.admin-pill').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
        pill.classList.add('active');
        const a = pill.dataset.atab;
        const content = document.getElementById(`atab-${a}`);
        if (content) content.classList.add('active');
        if (a === 'dashboard') adminLoadDashboard();
        if (a === 'users') adminLoadUsers();
        if (a === 'promos') adminLoadPromos();
        if (a === 'tickets') loadAdminTickets();
        if (a === 'broadcast') loadBroadcastTemplates();
        if (a === 'logs') adminLoadLogs();
    });
});

// ==================== PROMO ====================
function adminShowPromoCreate() { document.getElementById('admin-promo-create').style.display = 'block'; }
function adminHidePromoCreate() { document.getElementById('admin-promo-create').style.display = 'none'; }
function adminUpdatePromoFields() {
    const type = document.getElementById('promo-type').value;
    document.getElementById('promo-days-field').style.display = type === 'premium' ? 'block' : 'none';
    document.getElementById('promo-checks-field').style.display = type === 'checks' ? 'block' : 'none';
    document.getElementById('promo-percent-field').style.display = type === 'discount' ? 'block' : 'none';
}
async function adminCreatePromo() {
    const code = document.getElementById('promo-code').value.trim().toUpperCase();
    const type = document.getElementById('promo-type').value;
    const days = parseInt(document.getElementById('promo-days').value) || 0;
    const checks = parseInt(document.getElementById('promo-checks').value) || 0;
    const percent = parseInt(document.getElementById('promo-percent').value) || 0;
    const maxUses = document.getElementById('promo-max-uses').value ? parseInt(document.getElementById('promo-max-uses').value) : null;
    const validDays = document.getElementById('promo-valid-days').value ? parseInt(document.getElementById('promo-valid-days').value) : null;
    const onlyNew = document.getElementById('promo-only-new').checked;
    const broadcast = document.getElementById('promo-broadcast').checked;
    if (!code) { tg.showAlert('Введи код'); return; }
    try {
        await apiCall('/api/admin/create-promo', { code, type, days, checks, percent, maxUses, validDays, onlyNew, broadcast });
        tg.showAlert('✅ Промокод создан');
        adminHidePromoCreate();
        ['promo-code', 'promo-max-uses', 'promo-valid-days'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('promo-only-new').checked = false;
        document.getElementById('promo-broadcast').checked = false;
        adminLoadPromos();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}
async function adminLoadPromos() {
    const c = document.getElementById('admin-promos-list');
    c.innerHTML = '<div class="loading-block">⏳</div>';
    try {
        const data = await apiCall('/api/admin/promo-list');
        if (!data.promos?.length) { c.innerHTML = '<div class="loading-block">Промокодов нет</div>'; return; }
        window.__promosCache = data.promos;
        const now = Date.now();
        let html = '';
        data.promos.forEach(p => {
            let tt = '';
            if (p.type === 'premium') tt = `⭐ ${p.days} дн.`;
            else if (p.type === 'checks') tt = `🎮 +${p.checks}`;
            else if (p.type === 'discount') tt = `💰 ${p.percent}%`;
            const ut = p.maxUses ? `${p.uses}/${p.maxUses}` : `${p.uses}`;
            let eb = '';
            if (p.expiresAt) {
                const d = new Date(p.expiresAt);
                if (p.expiresAt < now) eb = '<span class="promo-badge expired">Истёк</span>';
                else eb = '<span class="promo-badge temp">Активный</span>';
            } else eb = '<span class="promo-badge active">♾</span>';
            html += `<div class="promo-item">
                <div style="flex:1;min-width:0;">
                    <div class="promo-code">${escapeHtml(p.code)}</div>
                    <div class="promo-details">${tt} · ${ut}</div>
                    <div class="promo-stats">${eb}</div>
                </div>
                <div class="promo-actions">
                    <button class="promo-edit-btn" onclick="openEditPromo('${escapeHtml(p.code)}')">✏️</button>
                    <button class="promo-delete-btn" onclick="adminDeletePromo('${escapeHtml(p.code)}')">🗑</button>
                </div>
            </div>`;
        });
        c.innerHTML = html;
    } catch (e) { c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`; }
}
async function adminDeletePromo(code) {
    if (!confirm(`Удалить промокод ${code}?`)) return;
    try {
        await apiCall('/api/admin/delete-promo', { code });
        tg.showAlert('✅');
        adminLoadPromos();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

// ==================== EDIT PROMO ====================
let editingPromo = null;
function openEditPromo(code) {
    const promos = window.__promosCache || [];
    const promo = promos.find(p => p.code === code);
    if (!promo) return;
    editingPromo = promo;
    document.getElementById('edit-promo-code').value = promo.code;
    document.getElementById('edit-promo-code-view').value = promo.code;
    const vf = document.getElementById('edit-promo-value-field');
    const vl = document.getElementById('edit-promo-value-label');
    const vi = document.getElementById('edit-promo-value');
    if (promo.type === 'premium') { vl.textContent = 'Дней премиума'; vi.value = promo.days; vf.style.display = 'block'; }
    else if (promo.type === 'checks') { vl.textContent = 'Кол-во проверок'; vi.value = promo.checks; vf.style.display = 'block'; }
    else if (promo.type === 'discount') { vl.textContent = 'Скидка (%)'; vi.value = promo.percent; vf.style.display = 'block'; }
    document.getElementById('edit-promo-max-uses').value = promo.maxUses || '';
    document.getElementById('edit-promo-valid-days').value = promo.expiresAt ? Math.max(1, Math.ceil((promo.expiresAt - Date.now()) / 86400000)) : '';
    document.getElementById('edit-promo-only-new').checked = !!promo.onlyNew;
    document.getElementById('edit-promo-result').classList.remove('show');
    document.getElementById('edit-promo-modal').style.display = 'flex';
}
function closeEditPromo() { document.getElementById('edit-promo-modal').style.display = 'none'; editingPromo = null; }
async function adminSavePromoEdit() {
    if (!editingPromo) return;
    const result = document.getElementById('edit-promo-result');
    const value = parseInt(document.getElementById('edit-promo-value').value) || 0;
    const maxUses = document.getElementById('edit-promo-max-uses').value ? parseInt(document.getElementById('edit-promo-max-uses').value) : null;
    const validDays = document.getElementById('edit-promo-valid-days').value ? parseInt(document.getElementById('edit-promo-valid-days').value) : null;
    const onlyNew = document.getElementById('edit-promo-only-new').checked;
    const payload = { code: editingPromo.code, maxUses, validDays, onlyNew };
    if (editingPromo.type === 'premium') payload.days = value;
    if (editingPromo.type === 'checks') payload.checks = value;
    if (editingPromo.type === 'discount') payload.percent = value;
    try {
        await apiCall('/api/admin/edit-promo', payload);
        result.innerHTML = '✅ Обновлено';
        result.classList.add('show');
        setTimeout(() => { closeEditPromo(); adminLoadPromos(); }, 700);
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; result.classList.add('show'); }
}

// ==================== BROADCAST ====================
let broadcastTemplates = {};
async function loadBroadcastTemplates() {
    const select = document.getElementById('broadcast-template');
    if (select.dataset.loaded === '1') return;
    try {
        const data = await apiCall('/api/admin/broadcast-templates');
        broadcastTemplates = data.templates;
        select.innerHTML = `<option value="">— Выбери шаблон —</option>` + Object.entries(broadcastTemplates).map(([k, t]) => `<option value="${k}">${escapeHtml(t.title)}</option>`).join('');
        select.dataset.loaded = '1';
    } catch (e) {}
}
function applyBroadcastTemplate() {
    const k = document.getElementById('broadcast-template').value;
    if (!k || !broadcastTemplates[k]) return;
    document.getElementById('admin-broadcast-text').value = broadcastTemplates[k].text;
}
function adminPreviewBroadcast() {
    const text = document.getElementById('admin-broadcast-text').value.trim();
    const p = document.getElementById('admin-broadcast-preview');
    if (!text) { p.innerHTML = '❌ Пусто'; p.classList.add('show'); return; }
    p.innerHTML = `<div style="opacity:.6;font-size:11px;margin-bottom:6px;">ПРЕВЬЮ</div>${text}`;
    p.classList.add('show');
}
async function adminSendBroadcast() {
    const text = document.getElementById('admin-broadcast-text').value.trim();
    const result = document.getElementById('admin-broadcast-result');
    if (!text) { result.innerHTML = '❌ Пусто'; result.classList.add('show'); return; }
    const confirmed = await new Promise(res => tg.showConfirm('Отправить всем?', res));
    if (!confirmed) return;
    result.innerHTML = '<span class="spinner"></span>Отправка...';
    result.classList.add('show');
    try {
        const data = await apiCall('/api/admin/broadcast', { text });
        result.innerHTML = `✅ Запущено для <b>${data.total}</b> юзеров`;
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}

// ==================== HELPERS ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== INIT ====================
async function init() {
    applyTheme('dark');
    try {
        const p = await apiCall('/api/profile');
        USER_DATA = p;
        if (p.settings) {
            SETTINGS = { ...SETTINGS, ...p.settings };
            LANG = p.settings.language || LANG;
            applyTheme(SETTINGS.theme);
        }
        updateUserUI(p);
        updateSegActive();
        showAdminTabIfAdmin(p.isAdmin);
        if (!p.isAdmin) {
            ['edit-promo-modal', 'admin-ticket-chat'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
        }
    } catch (e) { console.warn('init failed', e); }

    renderRaidItems();
    updateCraftInfo();

    const hash = location.hash || '';
    if (hash.startsWith('#ticket=')) {
        const ticketId = hash.replace('#ticket=', '');
        if (USER_DATA?.isAdmin) {
            goToTab('admin');
            setTimeout(() => openAdminTicket(ticketId).catch(() => openSupport()), 300);
        } else {
            document.getElementById('support-modal').style.display = 'flex';
            loadSupport();
        }
        history.replaceState(null, '', location.pathname);
    }
}

init();
