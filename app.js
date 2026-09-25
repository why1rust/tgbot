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
let PERMS = {};

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
    if (name === 'helpers') helperLoadTickets();
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

function renderActivityStats(graph) {
    if (!graph || !graph.twoWeeksMinutes) return '';
    return `
        <div class="activity-graph-card">
            <div class="activity-graph-header">
                <div>
                    <h3>📊 Активность</h3>
                    <p>Часы в Rust за последние 2 недели</p>
                </div>
            </div>
            <div class="activity-graph-stats">
                <div class="activity-graph-stat">
                    <div class="activity-graph-stat-value">${graph.twoWeeksHours} ч</div>
                    <div class="activity-graph-stat-label">Всего за 2 нед.</div>
                </div>
                <div class="activity-graph-stat">
                    <div class="activity-graph-stat-value">${graph.avgPerDay} ч</div>
                    <div class="activity-graph-stat-label">В среднем в день</div>
                </div>
            </div>
        </div>
    `;
}

function renderComparison(player, comparison) {
    if (!comparison || !comparison.friendsTotal) return '';
    const friendsCount = comparison.friendsTotal;
    const pctFriends = Math.min(100, friendsCount * 5);
    const avgRustHours = 500;
    const playerPct = Math.min(100, Math.round((player.rustPlaytime / avgRustHours) * 100));
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
        ${d.premium && d.activityGraph ? renderActivityStats(d.activityGraph) : ''}
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

// ==================== RAID / CRAFT ====================
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
        PERMS = profile.permissions || {};
        applyTheme(SETTINGS.theme);
        updateSegActive();
        updateUserUI(profile);
        showRoleTabs(profile.isAdmin, profile.isHelper);

        const dateFmt = (ts) => {
            const d = new Date(ts);
            return {
                date: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                time: d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            };
        };
        let premiumHtml = '';
        const heroClass = profile.isHelper ? 'helper' : '';
        if (profile.premium && profile.premiumExpires) {
            const { date, time } = dateFmt(profile.premiumExpires);
            premiumHtml = `<div class="premium-status active"><div class="premium-status-icon">⭐</div><div class="premium-status-info"><div class="premium-status-title">Премиум активен</div><div class="premium-status-date">до <b>${date}</b> в <b>${time}</b></div><div class="premium-status-days">Осталось: <b>${profile.daysLeft} дн.</b></div></div></div>`;
        } else if (profile.isAdmin) {
            premiumHtml = `<div class="premium-status active"><div class="premium-status-icon">👑</div><div class="premium-status-info"><div class="premium-status-title">Администратор</div><div class="premium-status-date">Постоянный доступ</div></div></div>`;
        } else if (profile.isHelper) {
            premiumHtml = `<div class="premium-status helper"><div class="premium-status-icon">🎧</div><div class="premium-status-info"><div class="premium-status-title">Хелпер</div><div class="premium-status-date">+${profile.helperBonus} к дневному лимиту проверок</div><div class="premium-status-days">Можешь отвечать в тикетах</div></div></div>`;
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
            <div class="profile-hero ${heroClass}">
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
    const sr = document.getElementById('sidebar-user-role');
    if (sr) {
        if (p.isAdmin) { sr.textContent = '👑 Администратор'; sr.className = 'sidebar-user-role admin'; sr.style.display = 'inline-block'; }
        else if (p.isHelper) { sr.textContent = '🎧 Хелпер'; sr.className = 'sidebar-user-role helper'; sr.style.display = 'inline-block'; }
        else { sr.style.display = 'none'; }
    }
}
function showRoleTabs(isAdmin, isHelper) {
    const adminTab = document.querySelector('.admin-only-tab');
    const helperTab = document.querySelector('.helper-only-tab');
    if (adminTab) adminTab.style.display = isAdmin ? 'flex' : 'none';
    if (helperTab) helperTab.style.display = isHelper ? 'flex' : 'none';
    if (!isAdmin && document.getElementById('panel-admin').classList.contains('active')) goToTab('steam');
    if (!isHelper && !isAdmin && document.getElementById('panel-helpers').classList.contains('active')) goToTab('steam');
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
    if (sb.classList.contains('open')) {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
        set('set-notifications', SETTINGS.notifications);
        set('set-watch-notifications', SETTINGS.watchNotifications);
        set('set-haptic', SETTINGS.haptic);
        updateSegActive();
    }
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

// ==================== SUPPORT (юзер) ====================
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
    else if (currentTicket.status === 'admin_connected') { banner.classList.add('hidden'); if (desc) desc.textContent = 'Поддержка подключилась'; }
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
    } catch (e) {
        // Уже есть открытый тикет — просто грузим его
        if (e.message && e.message.toLowerCase().includes('already open')) {
            await loadSupport();
            if (currentTicket) tg.showAlert('У тебя уже есть открытый тикет — открываем его');
            else tg.showAlert('Ошибка загрузки тикета. Попробуй ещё раз.');
            return;
        }
        tg.showAlert('Ошибка: ' + e.message);
    }
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

// ==================== HELPER (вкладка «🎧 Тикеты») ====================
async function helperLoadTickets() {
    const c = document.getElementById('helper-tickets-list');
    c.innerHTML = '<div class="loading-block">⏳ Загрузка...</div>';
    try {
        const data = await apiCall('/api/support/admin/tickets');
        renderTicketsList(data.tickets, c, 'helper');
    } catch (e) { c.innerHTML = `<div class="loading-block">❌ ${escapeHtml(e.message)}</div>`; }
}

async function openHelperTicket(ticketId) {
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

// ==================== Общий рендер списка тикетов ====================
function renderTicketsList(tickets, container, context) {
    if (!tickets || !tickets.length) {
        container.innerHTML = '<div class="loading-block">Нет открытых тикетов</div>';
        return;
    }
    let html = '';
    tickets.forEach(t => {
        const statusEmoji = { 'waiting': '⏳', 'admin_connected': '💬', 'closed': '✅' }[t.status] || '💬';
        const isUnread = t.status === 'waiting';
        const firstName = (t.firstName || '').trim() || 'User';
        const username = t.username ? `@${t.username}` : '';
        const nameLine = username ? `${firstName} · ${username}` : firstName;
        const preview = (t.lastMessage || '').replace(/\s+/g, ' ').trim().substring(0, 60) || '—';
        const handler = context === 'helper' ? 'openHelperTicket' : 'openAdminTicket';
        html += `<div class="ticket-item ${isUnread ? 'unread' : ''}" onclick="${handler}('${t.id}')">
            <div class="ticket-icon">${isUnread ? '🔴' : '💬'}</div>
            <div class="ticket-info">
                <div class="ticket-name">${escapeHtml(nameLine)}</div>
                <div class="ticket-preview">${escapeHtml(preview)}</div>
            </div>
            <div class="ticket-status ${t.status}">${statusEmoji}</div>
        </div>`;
    });
    container.innerHTML = html;
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
                <div class="admin-stat-card"><div class="admin-stat-value helper">${s.totalHelpers || 0}</div><div class="admin-stat-label">Хелперов</div></div>
            </div>
            <div class="admin-grid-3">
                <div class="admin-stat-card"><div class="admin-stat-value cyan">${s.purchasedUsers || 0}</div><div class="admin-stat-label">Купили</div></div>
                <div class="admin-stat-card"><div class="admin-stat-value yellow">${s.totalRevenue || 0}</div><div class="admin-stat-label">Доход (Stars)</div></div>
                <div class="admin-stat-card"><div class="admin-stat-value">${s.purchasesToday || 0}</div><div class="admin-stat-label">Покупок сегодня</div></div>
            </div>
            <div class="admin-grid-3">
                <div class="admin-stat-card"><div class="admin-stat-value">${s.totalReferrals}</div><div class="admin-stat-label">Рефералов</div></div>
                <div class="admin-stat-card"><div class="admin-stat-value">${s.totalWatched}</div><div class="admin-stat-label">В отслеж.</div></div>
                <div class="admin-stat-card"><div class="admin-stat-value">${s.todayChecks}</div><div class="admin-stat-label">Проверок сегодня</div></div>
            </div>
        `;
    } catch (e) { c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`; }
}

// ==================== ADMIN: USERS ====================
function renderUserCard(u) {
    const pi = u.premium ? '⭐' : (u.helper ? '🎧' : '👤');
    const un = u.username ? `@${u.username}` : '—';
    let badges = '';
    if (u.premium) badges += '<span class="premium-badge">⭐ Премиум</span>';
    if (u.helper) badges += '<span class="helper-badge">🎧 Хелпер</span>';
    let exp = '';
    if (u.premiumExpires) { const d = new Date(u.premiumExpires); exp = ` · до ${d.toLocaleDateString('ru-RU')}`; }
    const bonus = u.bonusChecks || 0;
    return `
        <div class="user-item">
            <div class="user-head">
                <div class="user-info">
                    <div class="user-name">${pi} ${escapeHtml(u.firstName || 'Без имени')}</div>
                    <div class="user-meta">${un} · ID: ${u.userId}${exp} · 👁️ ${u.watchlistCount || 0}${bonus > 0 ? ` · 🎁 +${bonus}` : ''}</div>
                    ${badges ? `<div class="user-badges">${badges}</div>` : ''}
                </div>
            </div>
            <div class="user-actions">
                ${u.premium
                    ? `<button class="user-btn danger" onclick="quickRevokePremium(${u.userId})">❌ Забрать премиум</button>`
                    : `<button class="user-btn premium" onclick="openUserPremiumModal(${u.userId}, '${escapeHtml(u.firstName || '—')}')">⭐ Выдать премиум</button>`
                }
                ${u.helper
                    ? `<button class="user-btn danger" onclick="quickRemoveHelper(${u.userId})">❌ Убрать хелпера</button>`
                    : `<button class="user-btn helper" onclick="quickAddHelper(${u.userId})">🎧 Сделать хелпером</button>`
                }
                <button class="user-btn dm" onclick="openUserDmModal(${u.userId}, '${escapeHtml(u.firstName || '—')}')">📩 Написать</button>
                <button class="user-btn bonus" onclick="openUserBonusModal(${u.userId}, '${escapeHtml(u.firstName || '—')}')">🎁 Бонус</button>
            </div>
        </div>
    `;
}

async function adminLoadUsers() {
    const c = document.getElementById('admin-users-content');
    c.innerHTML = '<div class="loading-block">⏳</div>';
    try {
        const data = await apiCall('/api/admin/users');
        if (!data.users?.length) { c.innerHTML = '<div class="loading-block">Нет пользователей</div>'; return; }
        let html = '';
        data.users.slice(0, 50).forEach(u => { html += renderUserCard(u); });
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
            data.results.forEach(u => { html += renderUserCard(u); });
            c.innerHTML = html;
        } catch (e) { c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`; }
    }, 300);
}

// ==================== ADMIN: QUICK ACTIONS ====================
// Premium
let currentUserPremiumId = null;
function openUserPremiumModal(userId, name) {
    currentUserPremiumId = userId;
    document.getElementById('user-premium-name').value = `${name} · ID: ${userId}`;
    document.getElementById('user-premium-days').value = 30;
    document.querySelectorAll('#user-premium-presets button').forEach(b => b.classList.toggle('active', b.dataset.days === '30'));
    document.getElementById('user-premium-result').classList.remove('show');
    document.getElementById('user-premium-modal').style.display = 'flex';
}
function closeUserPremiumModal() {
    document.getElementById('user-premium-modal').style.display = 'none';
    currentUserPremiumId = null;
}
function selectPremiumDays(days) {
    document.getElementById('user-premium-days').value = days;
    document.querySelectorAll('#user-premium-presets button').forEach(b => b.classList.toggle('active', parseInt(b.dataset.days) === days));
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}
function clearPresetActive() {
    document.querySelectorAll('#user-premium-presets button').forEach(b => b.classList.remove('active'));
}
async function confirmUserPremium() {
    if (!currentUserPremiumId) return;
    const days = parseInt(document.getElementById('user-premium-days').value) || 30;
    const result = document.getElementById('user-premium-result');
    result.innerHTML = '<span class="spinner"></span>Обработка...';
    result.classList.add('show');
    try {
        await apiCall('/api/admin/give-premium', { targetId: currentUserPremiumId, days });
        result.innerHTML = `✅ Премиум выдан на ${days} дн.`;
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        setTimeout(() => { closeUserPremiumModal(); adminLoadUsers(); }, 900);
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}
async function quickRevokePremium(userId) {
    const confirmed = await new Promise(res => tg.showConfirm('Забрать премиум?', res));
    if (!confirmed) return;
    try {
        await apiCall('/api/admin/revoke-premium', { targetId: userId });
        tg.showAlert('✅ Премиум забран');
        adminLoadUsers();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

// Helper
async function quickAddHelper(userId) {
    const confirmed = await new Promise(res => tg.showConfirm('Назначить пользователя хелпером?', res));
    if (!confirmed) return;
    try {
        await apiCall('/api/admin/add-helper', { targetId: userId });
        tg.showAlert('✅ Хелпер назначен, уведомление отправлено');
        adminLoadUsers();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}
async function quickRemoveHelper(userId) {
    const confirmed = await new Promise(res => tg.showConfirm('Убрать роль хелпера?', res));
    if (!confirmed) return;
    try {
        await apiCall('/api/admin/remove-helper', { targetId: userId });
        tg.showAlert('✅ Роль снята');
        adminLoadUsers();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

// Bonus
let currentUserBonusId = null;
function openUserBonusModal(userId, name) {
    currentUserBonusId = userId;
    document.getElementById('user-bonus-name').value = `${name} · ID: ${userId}`;
    document.getElementById('user-bonus-amount').value = 5;
    document.querySelectorAll('#user-bonus-presets button').forEach(b => b.classList.toggle('active', b.dataset.amount === '5'));
    document.getElementById('user-bonus-result').classList.remove('show');
    document.getElementById('user-bonus-modal').style.display = 'flex';
}
function closeUserBonusModal() {
    document.getElementById('user-bonus-modal').style.display = 'none';
    currentUserBonusId = null;
}
function selectBonusAmount(amount) {
    document.getElementById('user-bonus-amount').value = amount;
    document.querySelectorAll('#user-bonus-presets button').forEach(b => b.classList.toggle('active', parseInt(b.dataset.amount) === amount));
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}
function clearBonusPresetActive() {
    document.querySelectorAll('#user-bonus-presets button').forEach(b => b.classList.remove('active'));
}
async function confirmUserBonus() {
    if (!currentUserBonusId) return;
    const amount = parseInt(document.getElementById('user-bonus-amount').value) || 5;
    const result = document.getElementById('user-bonus-result');
    result.innerHTML = '<span class="spinner"></span>Обработка...';
    result.classList.add('show');
    try {
        const data = await apiCall('/api/admin/give-bonus', { targetId: currentUserBonusId, amount });
        result.innerHTML = `✅ +${amount} проверок. Всего бонусов: ${data.newBonus}`;
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        setTimeout(() => { closeUserBonusModal(); adminLoadUsers(); }, 900);
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}

// DM
let currentUserDmId = null;
function openUserDmModal(userId, name) {
    currentUserDmId = userId;
    document.getElementById('user-dm-name').value = `${name} · ID: ${userId}`;
    document.getElementById('user-dm-text').value = '';
    document.getElementById('user-dm-result').classList.remove('show');
    document.getElementById('user-dm-modal').style.display = 'flex';
}
function closeUserDmModal() {
    document.getElementById('user-dm-modal').style.display = 'none';
    currentUserDmId = null;
}
async function confirmUserDm() {
    if (!currentUserDmId) return;
    const text = document.getElementById('user-dm-text').value.trim();
    const result = document.getElementById('user-dm-result');
    if (!text) { result.innerHTML = '❌ Введи текст'; result.classList.add('show'); return; }
    result.innerHTML = '<span class="spinner"></span>Отправка...';
    result.classList.add('show');
    try {
        await apiCall('/api/admin/send-dm', { targetId: currentUserDmId, text });
        result.innerHTML = '✅ Отправлено';
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        setTimeout(() => { closeUserDmModal(); }, 800);
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}

// ==================== ADMIN: PERMISSIONS ====================
async function adminLoadPerms() {
    const permList = document.getElementById('perm-list');
    const result = document.getElementById('perms-result');
    result.classList.remove('show');
    try {
        const data = await apiCall('/api/admin/perms');
        const perms = data.perms || {};
        document.querySelectorAll('#perm-list input[data-perm]').forEach(input => {
            input.checked = perms[input.dataset.perm] === true;
        });
    } catch (e) {
        permList.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`;
    }
}

async function savePerms() {
    const result = document.getElementById('perms-result');
    const newPerms = {};
    document.querySelectorAll('#perm-list input[data-perm]').forEach(input => {
        newPerms[input.dataset.perm] = input.checked;
    });
    result.innerHTML = '<span class="spinner"></span>Сохранение...';
    result.classList.add('show');
    try {
        await apiCall('/api/admin/perms/save', { perms: newPerms });
        result.innerHTML = '✅ Права сохранены';
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        setTimeout(() => result.classList.remove('show'), 1500);
    } catch (e) {
        result.innerHTML = `❌ ${escapeHtml(e.message)}`;
    }
}

// ==================== ADMIN: LOGS ====================
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
            'broadcast': '📢',
            'add_helper': '🎧',
            'remove_helper': '❌',
            'give_bonus': '🎁',
            'send_dm': '📩',
            'edit_perms': '🛡️'
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

// ==================== ADMIN: PREMIUM ====================
async function adminGivePremium() {
    const target = document.getElementById('admin-premium-target').value.trim();
    const days = parseInt(document.getElementById('admin-premium-days').value) || 30;
    const result = document.getElementById('admin-premium-result');
    if (!target) { result.innerHTML = '❌ Укажи ID или @тег'; result.classList.add('show'); return; }
    result.innerHTML = '<span class="spinner"></span>Обработка...';
    result.classList.add('show');
    try {
        let targetId = target;
        if (target.startsWith('@')) {
            const u = await apiCall('/api/admin/users');
            const f = u.users.find(x => x.username?.toLowerCase() === target.replace('@', '').toLowerCase());
            if (!f) throw new Error('Не найден');
            targetId = f.userId;
        }
        await apiCall('/api/admin/give-premium', { targetId: parseInt(targetId), days });
        result.innerHTML = `✅ Премиум выдан на ${days} дн.`;
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}

async function adminRevokePremium() {
    const target = document.getElementById('admin-premium-target').value.trim();
    const result = document.getElementById('admin-premium-result');
    if (!target) { result.innerHTML = '❌ Укажи ID'; result.classList.add('show'); return; }
    result.innerHTML = '<span class="spinner"></span>Обработка...';
    result.classList.add('show');
    try {
        let targetId = target;
        if (target.startsWith('@')) {
            const u = await apiCall('/api/admin/users');
            const f = u.users.find(x => x.username?.toLowerCase() === target.replace('@', '').toLowerCase());
            if (!f) throw new Error('Не найден');
            targetId = f.userId;
        }
        await apiCall('/api/admin/revoke-premium', { targetId: parseInt(targetId) });
        result.innerHTML = '✅ Забран';
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}

// ==================== ADMIN: HELPERS ====================
async function adminAddHelper() {
    const target = document.getElementById('admin-helper-target').value.trim();
    const result = document.getElementById('admin-helper-result');
    if (!target) { result.innerHTML = '❌ Укажи ID или @тег'; result.classList.add('show'); return; }
    result.innerHTML = '<span class="spinner"></span>Обработка...';
    result.classList.add('show');
    try {
        let targetId = target;
        if (target.startsWith('@')) {
            const u = await apiCall('/api/admin/users');
            const f = u.users.find(x => x.username?.toLowerCase() === target.replace('@', '').toLowerCase());
            if (!f) throw new Error('Не найден');
            targetId = f.userId;
        }
        await apiCall('/api/admin/add-helper', { targetId: parseInt(targetId) });
        result.innerHTML = '✅ Хелпер назначен, уведомление отправлено';
        document.getElementById('admin-helper-target').value = '';
        adminLoadHelpers();
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}

async function adminLoadHelpers() {
    const c = document.getElementById('admin-helpers-list');
    c.innerHTML = '<div class="loading-block">⏳</div>';
    try {
        const data = await apiCall('/api/admin/helper-list');
        if (!data.helpers?.length) { c.innerHTML = '<div class="loading-block">Пока нет хелперов</div>'; return; }
        let html = '';
        data.helpers.forEach(h => {
            const un = h.username ? `@${h.username}` : '—';
            const since = new Date(h.since).toLocaleDateString('ru-RU');
            html += `<div class="user-item">
                <div class="user-head">
                    <div class="user-info">
                        <div class="user-name">🎧 ${escapeHtml(h.firstName || '—')}</div>
                        <div class="user-meta">${un} · ID: ${h.userId} · с ${since}</div>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="user-btn danger" onclick="quickRemoveHelper(${h.userId})">❌ Убрать</button>
                </div>
            </div>`;
        });
        c.innerHTML = html;
    } catch (e) { c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`; }
}

// ==================== ADMIN: TICKETS ====================
async function loadAdminTickets() {
    try {
        const data = await apiCall('/api/support/admin/tickets');
        const c = document.getElementById('admin-tickets-list');
        renderTicketsList(data.tickets, c, 'admin');
    } catch (e) {
        const c = document.getElementById('admin-tickets-list');
        c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`;
    }
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
        let visualRole;
        if (msg.role === 'user') visualRole = 'admin';
        else if (msg.role === 'admin') visualRole = 'user';
        else if (msg.role === 'helper') visualRole = 'helper';
        else visualRole = 'admin';
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
    const role = USER_DATA?.isAdmin ? 'admin' : 'helper';
    currentAdminTicket.messages.push({ role, text: message, timestamp: Date.now() });
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
    if (USER_DATA?.isAdmin) loadAdminTickets();
    else if (USER_DATA?.isHelper) helperLoadTickets();
}

async function closeAdminTicket() {
    if (!currentAdminTicket) return;
    const canClose = USER_DATA?.isAdmin || (USER_DATA?.isHelper && PERMS.close_tickets);
    if (!canClose) { tg.showAlert('Закрывать тикеты может только админ'); return; }
    const confirmed = await new Promise(res => tg.showConfirm('Закрыть тикет?', res));
    if (!confirmed) return;
    try {
        await apiCall('/api/support/admin/close', { ticketId: currentAdminTicket.id });
        tg.showAlert('✅ Тикет закрыт');
        closeAdminTicketChat();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

// ==================== ADMIN: PILL TABS ====================
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
        if (a === 'premium') {}
        if (a === 'helpers') adminLoadHelpers();
        if (a === 'perms') adminLoadPerms();
        if (a === 'promos') adminLoadPromos();
        if (a === 'giveaways') adminLoadGiveaways();
        if (a === 'reviews') adminLoadReviews();
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
        PERMS = p.permissions || {};
        updateUserUI(p);
        updateSegActive();
        showRoleTabs(p.isAdmin, p.isHelper);
        if (!p.isAdmin) {
            ['edit-promo-modal'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
        }
    } catch (e) { console.warn('init failed', e); }

    renderRaidItems();
    updateCraftInfo();
    loadHome();

    const hash = location.hash || '';
    if (hash.startsWith('#ticket=')) {
        const ticketId = hash.replace('#ticket=', '');
        if (USER_DATA?.isAdmin || USER_DATA?.isHelper) {
            goToTab(USER_DATA.isAdmin ? 'admin' : 'helpers');
            setTimeout(() => openAdminTicket(ticketId).catch(() => openSupport()), 300);
        } else {
            document.getElementById('support-modal').style.display = 'flex';
            loadSupport();
        }
        history.replaceState(null, '', location.pathname);
    }
}
// ==================== HOME TAB ====================
async function loadHome() {
    // Статистика
    try {
        const stats = await apiCall('/api/public/stats');
        const el1 = document.getElementById('home-stat-premium');
        const el2 = document.getElementById('home-stat-users');
        const el3 = document.getElementById('home-stat-rating');
        if (el1) el1.textContent = stats.purchasedUsers || 0;
        if (el2) el2.textContent = stats.totalUsers || 0;
        if (el3) el3.textContent = stats.avgRating ? stats.avgRating.toFixed(1) : '—';
    } catch (e) {
        console.warn('home stats failed', e);
    }
    loadHomeGiveaways();
    loadHomeReviews();
}

async function loadHomeGiveaways() {
    const c = document.getElementById('home-giveaways');
    if (!c) return;
    c.innerHTML = '<div class="loading-block">⏳ Загрузка...</div>';
    try {
        const data = await apiCall('/api/giveaways');
        const list = data.giveaways || [];
        const ended = data.endedGiveaways || [];
        if (!list.length && !ended.length) {
            c.innerHTML = '<div class="loading-block">Пока нет розыгрышей 🎁</div>';
            return;
        }
        let html = '';
        list.forEach(g => {
            const untilText = g.endsAt ? new Date(g.endsAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Бессрочно';
            const condClass = g.condition === 'premium' ? 'condition-premium' : g.condition === 'channel' ? 'condition-channel' : '';
            const condText = g.condition === 'premium' ? '⭐ Премиум' : g.condition === 'channel' ? '📢 Канал' : '🆓 Открыт';
            html += `<div class="giveaway-card">
                <div class="giveaway-header">
                    <div class="giveaway-emoji">🎁</div>
                    <div class="giveaway-title-wrap">
                        <div class="giveaway-title-new">${escapeHtml(g.title)}</div>
                        <div class="giveaway-desc-new">${escapeHtml(g.description || '')}</div>
                    </div>
                </div>
                <div class="giveaway-prize-badge">🏆 ${escapeHtml(g.prize || 'Приз')}</div>
                <div class="giveaway-stats">
                    <span class="giveaway-stat ${condClass}">${condText}</span>
                    <span class="giveaway-stat">👥 ${g.participantsCount || 0}</span>
                    <span class="giveaway-stat">⏰ ${untilText}</span>
                </div>
                <button class="giveaway-btn ${g.joined ? 'leave' : 'join'}" onclick="${g.joined ? `leaveGiveaway('${g.id}')` : `joinGiveaway('${g.id}')`}">
                    ${g.joined ? '❌ Выйти из розыгрыша' : '✅ Участвовать'}
                </button>
            </div>`;
        });
        if (ended.length > 0) {
            html += `<div style="margin-top:24px;margin-bottom:12px;font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;">🏆 Прошлые победители</div>`;
            ended.forEach(g => {
                const endDate = g.endsAt ? new Date(g.endsAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
                html += `<div class="giveaway-card ended">
                    <div class="giveaway-header">
                        <div class="giveaway-emoji">🏆</div>
                        <div class="giveaway-title-wrap">
                            <div class="giveaway-title-new">${escapeHtml(g.title)}</div>
                            <div class="giveaway-desc-new">${escapeHtml(g.description || '')}</div>
                        </div>
                    </div>
                    <div class="giveaway-stats">
                        <span class="giveaway-stat">🏆 ${escapeHtml(g.prize || '—')}</span>
                        <span class="giveaway-stat">👥 ${g.participantsCount || 0}</span>
                        <span class="giveaway-stat">📅 ${endDate}</span>
                        ${g.winner ? `<span class="giveaway-stat winner">👑 Победитель: ${g.winnerName ? escapeHtml(g.winnerName) : g.winner}</span>` : '<span class="giveaway-stat">❌ Без победителя</span>'}
                    </div>
                </div>`;
            });
        }
        c.innerHTML = html;
    } catch (e) {
        c.innerHTML = `<div class="loading-block">❌ ${escapeHtml(e.message)}</div>`;
    }
}

async function joinGiveaway(id) {
    try {
        await apiCall('/api/giveaways/join', { id });
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        loadHomeGiveaways();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

async function leaveGiveaway(id) {
    try {
        await apiCall('/api/giveaways/leave', { id });
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        loadHomeGiveaways();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

async function loadHomeReviews() {
    const c = document.getElementById('home-reviews');
    if (!c) return;
    c.innerHTML = '<div class="loading-block">⏳ Загрузка...</div>';
    try {
        const data = await apiCall('/api/reviews');
        const list = data.reviews || [];
        if (!list.length) {
            c.innerHTML = '<div class="loading-block">Пока нет отзывов. Будь первым! ✏️</div>';
            return;
        }
        let html = '';
        list.forEach(r => {
           const rawName = (r.firstName || '').trim() || (r.username || 'U');
const initials = rawName.charAt(0).toUpperCase() || 'U';
const av = `<div class="home-review-avatar"><img src="${API_BASE}/api/tg-avatar?userId=${r.userId}" onerror="this.style.display='none'; this.parentNode.textContent='${initials}';"></div>`;
            const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
            const dateStr = new Date(r.timestamp).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
            html += `<div class="home-review-item">
                <div class="home-review-head">
                    ${av}
                    <div style="flex:1;min-width:0;">
                        <div class="home-review-name">${escapeHtml(r.firstName || 'User')}${r.username ? ' · @' + escapeHtml(r.username) : ''}</div>
                        <div class="home-review-stars">${stars}</div>
                    </div>
                </div>
                <div class="home-review-text">${escapeHtml(r.text)}</div>
                <div class="home-review-date">${dateStr}</div>
            </div>`;
        });
        c.innerHTML = html;
    } catch (e) {
        c.innerHTML = `<div class="loading-block">❌ ${escapeHtml(e.message)}</div>`;
    }
}

// ==================== REVIEW ADD ====================
let reviewRating = 5;
function openReviewModal() {
    reviewRating = 5;
    document.getElementById('review-text').value = '';
    setReviewRating(5);
    document.getElementById('review-result').classList.remove('show');
    document.getElementById('review-modal').style.display = 'flex';
}
function closeReviewModal() {
    document.getElementById('review-modal').style.display = 'none';
}
function setReviewRating(v) {
    reviewRating = v;
    document.querySelectorAll('#review-stars span').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.v) <= v);
    });
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}
async function submitReview() {
    const text = document.getElementById('review-text').value.trim();
    const result = document.getElementById('review-result');
    if (text.length < 5) { result.innerHTML = '❌ Минимум 5 символов'; result.classList.add('show'); return; }
    if (text.length > 500) { result.innerHTML = '❌ Максимум 500 символов'; result.classList.add('show'); return; }
    result.innerHTML = '<span class="spinner"></span>Отправка...';
    result.classList.add('show');
    try {
        await apiCall('/api/reviews/add', { text, rating: reviewRating });
        result.innerHTML = '✅ Спасибо за отзыв!';
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        setTimeout(() => {
            closeReviewModal();
            loadHomeReviews();
        }, 900);
    } catch (e) {
        result.innerHTML = `❌ ${escapeHtml(e.message)}`;
    }
}

// ==================== ADMIN: REVIEWS ====================
async function adminLoadReviews() {
    const c = document.getElementById('admin-reviews-list');
    if (!c) return;
    c.innerHTML = '<div class="loading-block">⏳</div>';
    try {
        const data = await apiCall('/api/reviews');
        const list = data.reviews || [];
        if (!list.length) { c.innerHTML = '<div class="loading-block">Отзывов нет</div>'; return; }
        let html = '';
        list.forEach(r => {
            const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
            const dateStr = new Date(r.timestamp).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            html += `<div class="admin-review-item">
                <div class="admin-review-body">
                    <div class="admin-review-head">
                        <div class="admin-review-name">${escapeHtml(r.firstName || 'User')}${r.username ? ' · @' + escapeHtml(r.username) : ''} · <code>${r.userId}</code></div>
                        <div class="admin-review-stars">${stars}</div>
                    </div>
                    <div class="admin-review-text">${escapeHtml(r.text)}</div>
                    <div class="admin-review-date">${dateStr}</div>
                </div>
                <button class="admin-review-delete" onclick="adminDeleteReview(${r.userId}, ${r.timestamp})">🗑</button>
            </div>`;
        });
        c.innerHTML = html;
    } catch (e) {
        c.innerHTML = `<div class="loading-block">❌ ${escapeHtml(e.message)}</div>`;
    }
}
async function adminDeleteReview(userId, timestamp) {
    const confirmed = await new Promise(res => tg.showConfirm('Удалить этот отзыв?', res));
    if (!confirmed) return;
    try {
        await apiCall('/api/admin/reviews/delete', { userId, timestamp });
        adminLoadReviews();
        loadHomeReviews();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

// ==================== ADMIN: GIVEAWAYS ====================
async function adminLoadGiveaways() {
    const c = document.getElementById('admin-giveaways-list');
    if (!c) return;
    c.innerHTML = '<div class="loading-block">⏳</div>';
    try {
        const data = await apiCall('/api/admin/giveaways/list');
        const list = data.giveaways || [];
        if (!list.length) {
            c.innerHTML = '<div class="loading-block">Розыгрышей нет. Создай первый! 🎁</div>';
            return;
        }
        let html = '';
        list.forEach(g => {
            const participants = (g.participants || []).length;
            const untilText = g.endsAt ? new Date(g.endsAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Бессрочно';
            const isActive = g.status === 'active';
            const winnerNameSafe = (g.winnerName || 'Победитель').replace(/['"\\<>]/g, '');
            html += `<div class="admin-giveaway-card ${isActive ? 'active' : 'ended'}">
                <div class="admin-giveaway-head">
                    <div style="flex:1;min-width:0;">
                        <div class="admin-giveaway-title-new">🎁 ${escapeHtml(g.title)}</div>
                        <div class="admin-giveaway-info">
                            <span>🏆 ${escapeHtml(g.prize || '—')}</span>
                            <span>👥 ${participants}</span>
                            <span>⏰ ${untilText}</span>
                            ${g.winner ? `<span>👑 ${g.winnerUsername ? '@' + g.winnerUsername : (g.winnerName ? g.winnerName : 'ID ' + g.winner)}</span>` : ''}
                        </div>
                    </div>
                    <div class="admin-giveaway-status ${isActive ? 'active' : 'ended'}">${isActive ? 'Активен' : 'Завершён'}</div>
                </div>
                                <div class="admin-giveaway-actions-new">
                    <button class="admin-btn edit" onclick="openGiveawayModal('${g.id}')">✏️ Редактировать</button>
                    ${isActive
                        ? `<button class="admin-btn finish" onclick="adminFinishGiveaway('${g.id}')">🏆 Завершить</button>`
                        : `<button class="admin-btn delete" onclick="adminDeleteGiveaway('${g.id}')">🗑 Удалить</button>`
                    }
                    ${isActive ? `<button class="admin-btn delete wide" onclick="adminDeleteGiveaway('${g.id}')">🗑 Удалить</button>` : ''}
                    ${!isActive && g.winner ? `
                                                                        <button class="admin-btn edit wide" onclick="openUserDmModal(${g.winner}, '${winnerNameSafe}')">💬 Написать победителю</button>
                        <button class="admin-btn finish" onclick="openUserPremiumModal(${g.winner}, '${winnerNameSafe}')">⭐ Премиум</button>
                        <button class="admin-btn edit" onclick="openUserBonusModal(${g.winner}, '${winnerNameSafe}')">🎁 Бонусы</button>
                                        ` : ''}
                </div>
            </div>`;
        });
        c.innerHTML = html;
    } catch (e) {
        c.innerHTML = `<div class="loading-block">❌ ${escapeHtml(e.message)}</div>`;
    }
}

let currentGiveawayId = null;
let currentGiveawayFull = null;
async function openGiveawayModal(id) {
    currentGiveawayId = id || null;
    document.getElementById('giveaway-id').value = id || '';
    document.getElementById('giveaway-title').textContent = id ? '✏️ Редактировать розыгрыш' : '🎁 Создать розыгрыш';
    document.getElementById('giveaway-modal-title').textContent = id ? '✏️ Редактировать розыгрыш' : '🎁 Создать розыгрыш';
    document.getElementById('giveaway-result').classList.remove('show');

    if (id) {
        const data = await apiCall('/api/admin/giveaways/list');
        const g = (data.giveaways || []).find(x => x.id === id);
        if (!g) { tg.showAlert('Не найден'); return; }
        currentGiveawayFull = g;
        document.getElementById('giveaway-title').value = g.title || '';
        document.getElementById('giveaway-description').value = g.description || '';
        document.getElementById('giveaway-prize').value = g.prize || '';
        document.getElementById('giveaway-condition').value = g.condition || 'none';
        if (g.endsAt) {
            const d = new Date(g.endsAt);
            const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('giveaway-ends').value = iso;
        } else {
            document.getElementById('giveaway-ends').value = '';
        }
    } else {
        currentGiveawayFull = null;
        document.getElementById('giveaway-title').value = '';
        document.getElementById('giveaway-description').value = '';
        document.getElementById('giveaway-prize').value = '';
        document.getElementById('giveaway-condition').value = 'none';
        document.getElementById('giveaway-ends').value = '';
    }
    document.getElementById('giveaway-modal').style.display = 'flex';
}
function closeGiveawayModal() {
    document.getElementById('giveaway-modal').style.display = 'none';
    currentGiveawayId = null;
    currentGiveawayFull = null;
}
async function saveGiveaway() {
    const title = document.getElementById('giveaway-title').value.trim();
    const description = document.getElementById('giveaway-description').value.trim();
    const prize = document.getElementById('giveaway-prize').value.trim();
    const condition = document.getElementById('giveaway-condition').value;
    const endsVal = document.getElementById('giveaway-ends').value;
    const endsAt = endsVal ? new Date(endsVal).getTime() : 0;
    const result = document.getElementById('giveaway-result');
    if (!title || !description) { result.innerHTML = '❌ Заполни название и описание'; result.classList.add('show'); return; }
    result.innerHTML = '<span class="spinner"></span>Сохранение...';
    result.classList.add('show');
    try {
        if (currentGiveawayId) {
            await apiCall('/api/admin/giveaways/update', { id: currentGiveawayId, title, description, prize, condition, endsAt });
        } else {
            await apiCall('/api/admin/giveaways/create', { title, description, prize, condition, endsAt });
        }
        result.innerHTML = '✅ Сохранено';
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        setTimeout(() => { closeGiveawayModal(); adminLoadGiveaways(); loadHomeGiveaways(); }, 800);
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}
async function adminDeleteGiveaway(id) {
    const confirmed = await new Promise(res => tg.showConfirm('Удалить розыгрыш?', res));
    if (!confirmed) return;
    try {
        await apiCall('/api/admin/giveaways/delete', { id });
        adminLoadGiveaways();
        loadHomeGiveaways();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}
async function adminFinishGiveaway(id) {
    const confirmed = await new Promise(res => tg.showConfirm('Завершить розыгрыш и выбрать победителя?', res));
    if (!confirmed) return;
    try {
        const r = await apiCall('/api/admin/giveaways/finish', { id });
        tg.showAlert('🏆 Победитель: ' + r.winner);
        adminLoadGiveaways();
        loadHomeGiveaways();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

// ==================== ADMIN: BAN ====================
let currentBanId = null;
let currentBanName = '';
function openUserBanModal(userId, name, banned) {
    if (banned) {
        // Разбан
        tg.showConfirm('Разбанить пользователя?', async (ok) => {
            if (!ok) return;
            try {
                await apiCall('/api/admin/unban', { targetId: userId });
                tg.showAlert('✅ Разбанен');
                adminLoadUsers();
            } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
        });
        return;
    }
    currentBanId = userId;
    currentBanName = name;
    document.getElementById('user-ban-name').value = `${name} · ID: ${userId}`;
    document.getElementById('user-ban-minutes').value = 10080;
    document.getElementById('user-ban-reason').value = '';
    document.querySelectorAll('#user-ban-presets button').forEach(b => b.classList.toggle('active', b.dataset.min === '10080'));
    document.getElementById('user-ban-result').classList.remove('show');
    document.getElementById('user-ban-modal').style.display = 'flex';
}
function closeUserBanModal() {
    document.getElementById('user-ban-modal').style.display = 'none';
    currentBanId = null;
}
function selectBanDuration(minutes) {
    document.getElementById('user-ban-minutes').value = minutes;
    document.querySelectorAll('#user-ban-presets button').forEach(b => b.classList.toggle('active', parseInt(b.dataset.min) === minutes));
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}
function clearBanPresetActive() {
    document.querySelectorAll('#user-ban-presets button').forEach(b => b.classList.remove('active'));
}
async function confirmUserBan() {
    if (!currentBanId) return;
    const minutes = parseInt(document.getElementById('user-ban-minutes').value) || 0;
    const reason = document.getElementById('user-ban-reason').value.trim();
    const result = document.getElementById('user-ban-result');
    result.innerHTML = '<span class="spinner"></span>Применяю...';
    result.classList.add('show');
    try {
        await apiCall('/api/admin/ban', { targetId: currentBanId, minutes, reason });
        result.innerHTML = '✅ Забанен';
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        setTimeout(() => { closeUserBanModal(); adminLoadUsers(); }, 800);
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}
init();
