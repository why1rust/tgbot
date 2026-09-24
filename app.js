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
        
        if (name === 'profile') loadProfile();
        if (name === 'support') loadSupport();
        if (name === 'watch') loadWatchlist();
        
        if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    });
});

// ==================== STEAM ====================
async function analyzeSteam() {
    const input = document.getElementById('steam-input').value.trim();
    const resultDiv = document.getElementById('steam-result');
    const match = input.match(/\d{17}/);

    if (!match) {
        resultDiv.innerHTML = '❌ Введи SteamID (17 цифр)';
        resultDiv.classList.add('show');
        return;
    }

    resultDiv.innerHTML = '<span class="spinner"></span>Анализирую...';
    resultDiv.classList.add('show');

    try {
        const data = await apiCall('/api/steam', { steamId: match[0] });
        if (data.error) {
            resultDiv.innerHTML = `❌ ${escapeHtml(data.error)}`;
            return;
        }
        resultDiv.innerHTML = renderSteamProfile(data);
        resultDiv.classList.add('show');
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) {
        resultDiv.innerHTML = `❌ ${escapeHtml(e.message)}`;
    }
}

function renderSteamProfile(d) {
    if (d.privateWarning) {
        return `<div class="player-card"><div class="player-top"><div class="player-avatar">🔒</div><div class="player-info"><h3>${escapeHtml(d.name)}</h3><span class="player-status offline">Приватный профиль</span></div></div></div>`;
    }
    const isOnline = d.state.includes('Онлайн') || d.state.includes('В игре');
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
                    <span class="player-status ${isOnline ? 'online' : 'offline'}">Steam ${d.state.replace(/[^\wа-яА-Я\s]/g, '').trim() || 'Оффлайн'}</span>
                </div>
                ${hasBan ? `<div class="vac-badge">⚠ BAN</div>` : `<div class="no-vac-badge">✓ OK</div>`}
            </div>
            <div class="stats-grid">
                <div class="stat-box"><div class="stat-icon purple">🦀</div><div><div class="stat-value">${d.rustPlaytime.toLocaleString('ru-RU')}</div><div class="stat-label">часов Rust</div></div></div>
                <div class="stat-box"><div class="stat-icon cyan">👥</div><div><div class="stat-value">${d.friendsCount}</div><div class="stat-label">друзей</div></div></div>
                <div class="stat-box"><div class="stat-icon red">!</div><div><div class="stat-value">${totalBans}</div><div class="stat-label">банов</div></div></div>
            </div>
        </div>
        <div class="risk-card">
            <div class="risk-head"><div><h3>Риск читерства</h3><p>Анализ VAC, часов и активности</p></div><div class="risk-value"><div class="risk-percent ${riskClass}">${d.riskScore}%</div><div class="risk-level ${riskClass}">${d.riskLevel}</div></div></div>
            <div class="risk-bar"><div class="risk-indicator" style="left: ${d.riskScore}%"></div></div>
            <div class="risk-labels"><span>Низкий</span><span>Высокий</span></div>
        </div>
        <div class="section-title"><span>Активность</span></div>
        <div class="activity-list">
            ${hasBan ? `<div class="activity-item"><div class="activity-icon vac">VAC</div><div class="activity-content"><h4>VAC бан</h4><p>${d.vacBans} активных</p></div></div>` : `<div class="activity-item"><div class="activity-icon vpn">✓</div><div class="activity-content"><h4>Банов нет</h4><p>Чистая история</p></div></div>`}
            <div class="activity-item"><div class="activity-icon raid">🔥</div><div class="activity-content"><h4>Steam уровень: ${d.steamLevel}</h4><p>Достижений: ${d.achievementsCount}</p></div></div>
            <div class="activity-item"><div class="activity-icon friend">📅</div><div class="activity-content"><h4>Возраст: ${d.accountAgeYears} лет</h4><p>${d.accountAgeDays} дней · Игр: ${d.gamesCount}</p></div></div>
            ${d.friendsWithRust?.length > 0 ? `<div class="activity-item" onclick="window.open('${escapeHtml(d.profileUrl)}friends/','_blank')"><div class="activity-icon friend">👥</div><div class="activity-content"><h4>Друзей с Rust: ${d.friendsWithRust.length}</h4><p>Открыть список в Steam</p></div></div>` : ''}
            <div class="activity-item" onclick="window.open('${escapeHtml(d.profileUrl)}','_blank')"><div class="activity-icon vpn">🔗</div><div class="activity-content"><h4>Открыть профиль</h4><p>${d.steamId}</p></div></div>
        </div>
    `;
}

// ==================== RAID ====================
const RAID_DATA = {
    doors: { title: '🚪 Двери', items: {
        wood_door: { name: 'Деревянная дверь', hp: 200, explosive: '2 молотова', resources: '100 топлива' },
        sheet_door: { name: 'Железная дверь', hp: 250, explosive: '1 ракета, 8 разрывов', resources: '1600 серы' },
        garage_door: { name: 'Гаражка', hp: 600, explosive: '3 ракеты', resources: '4200 серы' },
        mvp_door: { name: 'МВК дверь', hp: 1000, explosive: '2 C4, 30 разрывов', resources: '5900 серы' },
        ladder_hatch: { name: 'Люк', hp: 250, explosive: '1 ракета, 8 разрывов', resources: '1600 серы' },
        shop_front: { name: 'Витрина', hp: 750, explosive: '3 C4', resources: '6600 серы' }
    }},
    walls: { title: '🧱 Стены', items: {
        wood_wall: { name: 'Деревянная стена', hp: 250, explosive: '4 молотова', resources: '200 топлива' },
        stone_wall: { name: 'Каменная стена', hp: 500, explosive: '3 ракеты, 35 разрывов', resources: '5075 серы' },
        sheet_wall: { name: 'Железная стена', hp: 1000, explosive: '7 ракет, 15 разрывов', resources: '10175 серы' },
        mvp_wall: { name: 'МВК стена', hp: 2000, explosive: '14 ракет, 30 разрывов', resources: '20350 серы' }
    }},
    outer_walls: { title: '🛡️ Внешние стены', items: {
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
    result.innerHTML = `<strong>${item.name}</strong><br><br>❤️ ХП: <strong>${item.hp}</strong><br>💥 ${item.explosive}<br>📦 ${item.resources}`;
    result.classList.add('show');
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ==================== CRAFT ====================
const CRAFT_DATA = {
    c4: { name: 'C4', emoji: '💥', sulfur: 2200, lgf: 60, resources: [{name:'Взрывчатка',count:20},{name:'Ткань',count:5},{name:'Микросхемы',count:2}] },
    rocket: { name: 'Ракета', emoji: '🚀', sulfur: 1400, lgf: 30, resources: [{name:'Взрывчатка',count:10},{name:'Порох',count:150},{name:'Металлическая труба',count:2}] },
    satchel: { name: 'Сатчел', emoji: '🎒', sulfur: 480, lgf: 0, resources: [{name:'Бобовая граната',count:4},{name:'Малый схрон',count:1},{name:'Верёвка',count:1}] },
    beancan: { name: 'Бобовая граната', emoji: '💣', sulfur: 120, lgf: 0, resources: [{name:'Порох',count:60},{name:'Металлические фрагменты',count:20}] },
    explo: { name: 'Патрон 5.56', emoji: '🔫', sulfur: 25, lgf: 0, resources: [{name:'Порох',count:5},{name:'Металлические фрагменты',count:10}] }
};

function updateCraftInfo() {
    const type = document.getElementById('craft-type').value;
    const item = CRAFT_DATA[type];
    const info = document.getElementById('craft-info');
    let html = `<div class="craft-info-list">`;
    item.resources.forEach(r => html += `<div class="craft-row"><span>${r.name}</span><strong>${r.count}</strong></div>`);
    html += `<div class="craft-row"><span>Сера</span><strong>${item.sulfur}</strong></div>`;
    if (item.lgf > 0) html += `<div class="craft-row"><span>Топливо (LGF)</span><strong>${item.lgf}</strong></div>`;
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
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ==================== WATCHLIST ====================
async function addToWatchlist() {
    const input = document.getElementById('watch-input').value.trim();
    const result = document.getElementById('watch-result');
    const match = input.match(/\d{17}/);
    if (!match) {
        result.innerHTML = '❌ Введи SteamID';
        result.classList.add('show');
        return;
    }
    result.innerHTML = '<span class="spinner"></span>Добавляю...';
    result.classList.add('show');
    try {
        const data = await apiCall('/api/watch-add', { steamId: match[0] });
        result.innerHTML = `✅ <strong>${escapeHtml(data.name)}</strong> добавлен`;
        document.getElementById('watch-input').value = '';
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) {
        result.innerHTML = `❌ ${escapeHtml(e.message)}`;
    }
}

async function loadWatchlist() {
    const result = document.getElementById('watchlist-result');
    result.innerHTML = '<span class="spinner"></span>Загружаю...';
    result.classList.add('show');
    try {
        const list = await apiCall('/api/watch-list');
        if (!list?.length) {
            result.innerHTML = '📊 Список пуст';
            return;
        }
        let html = `<strong>📊 Отслеживается: ${list.length}</strong><br><br>`;
        list.forEach((w, i) => {
            html += `<div class="watch-item"><strong>${i+1}. ${escapeHtml(w.name)}</strong><br><small>${w.steamId}</small><br><small>VAC: ${w.lastVacBans} · Game: ${w.lastGameBans}</small><br><button class="btn secondary" style="margin-top:8px;padding:8px;font-size:12px;" onclick="removeFromWatchlist('${w.steamId}')">🗑 Удалить</button></div>`;
        });
        result.innerHTML = html;
    } catch (e) {
        result.innerHTML = `❌ ${escapeHtml(e.message)}`;
    }
}

async function removeFromWatchlist(steamId) {
    try {
        await apiCall('/api/watch-remove', { steamId });
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        loadWatchlist();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

// ==================== PROFILE ====================
async function loadProfile() {
    const container = document.getElementById('profile-content');
    container.innerHTML = '<div class="loading-block">⏳ Загружаю профиль...</div>';
    
    try {
        const profile = await apiCall('/api/profile');
        
        let premiumHtml = '';
        if (profile.premium && profile.premiumExpires) {
            const date = new Date(profile.premiumExpires);
            const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            premiumHtml = `
                <div class="premium-status active">
                    <div class="premium-status-icon">⭐</div>
                    <div class="premium-status-info">
                        <div class="premium-status-title">Премиум активен</div>
                        <div class="premium-status-date">до <b>${dateStr}</b> в <b>${timeStr}</b></div>
                        <div class="premium-status-days">Осталось: <b>${profile.daysLeft} дн.</b></div>
                    </div>
                </div>
            `;
        } else if (profile.premium) {
            premiumHtml = `
                <div class="premium-status active">
                    <div class="premium-status-icon">👑</div>
                    <div class="premium-status-info">
                        <div class="premium-status-title">Администратор</div>
                        <div class="premium-status-date">Постоянный доступ</div>
                    </div>
                </div>
            `;
        } else {
            premiumHtml = `
                <div class="premium-status inactive">
                    <div class="premium-status-icon">❌</div>
                    <div class="premium-status-info">
                        <div class="premium-status-title">Премиум не активен</div>
                        <div class="premium-status-date">Купи премиум для безлимита</div>
                    </div>
                </div>
            `;
        }
        
        let avatarHtml = '';
        if (profile.photoUrl) {
            avatarHtml = `<img class="profile-avatar" src="${escapeHtml(profile.photoUrl)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';"><div class="profile-avatar-fallback" style="display:none">${(profile.firstName || 'U').charAt(0).toUpperCase()}</div>`;
        } else {
            avatarHtml = `<div class="profile-avatar-fallback">${(profile.firstName || 'U').charAt(0).toUpperCase()}</div>`;
        }
        
        let html = `
            <div class="profile-hero">
                ${avatarHtml}
                <div class="profile-name">${escapeHtml(profile.firstName)} ${escapeHtml(profile.lastName || '')}</div>
                <div class="profile-username">${profile.username ? '@' + escapeHtml(profile.username) : 'без @'}</div>
            </div>
            
            ${premiumHtml}
            
            <div class="stats-profile-grid">
                <div class="stat-profile-box">
                    <div class="stat-profile-value">${profile.remainingChecks}</div>
                    <div class="stat-profile-label">Проверок</div>
                </div>
                <div class="stat-profile-box">
                    <div class="stat-profile-value">${profile.watchlistCount}/${profile.watchlistLimit}</div>
                    <div class="stat-profile-label">Watchlist</div>
                </div>
                <div class="stat-profile-box">
                    <div class="stat-profile-value">${profile.referral.count}</div>
                    <div class="stat-profile-label">Рефералов</div>
                </div>
            </div>
        `;
        
        if (profile.discount) {
            html += `<div class="premium-status active" style="background:linear-gradient(135deg,rgba(6,182,212,.15),rgba(6,182,212,.05));border-color:rgba(6,182,212,.4);">
                <div class="premium-status-icon">💰</div>
                <div class="premium-status-info">
                    <div class="premium-status-title">Скидка ${profile.discount.percent}%</div>
                    <div class="premium-status-date">На покупку премиума</div>
                </div>
            </div>`;
        }
        
        html += `<div class="card">
            <div class="card-head"><h2>Действия</h2></div>
            ${!profile.premium ? `<button class="btn primary" onclick="openPremiumFromProfile()">⭐ Купить премиум</button>` : ''}
            ${!profile.trialUsed ? `<button class="btn secondary" style="margin-top:8px" onclick="activateTrial()">🎁 Пробная ${profile.trialDays} дня</button>` : ''}
            <button class="btn secondary" style="margin-top:8px" onclick="showPromoInput()">🎟 Активировать промокод</button>
            <button class="btn secondary" style="margin-top:8px" onclick="showReferral()">🎁 Реферальная ссылка</button>
            ${profile.isAdmin ? `<button class="btn danger" style="margin-top:8px" onclick="openAdminPanel()">👑 Админ-панель</button>` : ''}
        </div>`;
        
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<div class="card"><div class="result show">❌ ${escapeHtml(e.message)}</div></div>`;
    }
}

function openPremiumFromProfile() {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelector('.tab[data-tab="steam"]').classList.add('active');
    document.getElementById('panel-steam').classList.add('active');
    tg.showAlert('Открой бота → /start → «⭐ Купить премиум»');
}

async function activateTrial() {
    const promo = prompt('Введи промокод для пробной:');
    if (!promo) return;
    try {
        const result = await apiCall('/api/activate-trial', { promo });
        tg.showAlert('🎉 Пробная активирована на ' + result.days + ' дня!');
        loadProfile();
    } catch (e) {
        tg.showAlert('Ошибка: ' + e.message);
    }
}

function showPromoInput() {
    const code = prompt('Введи промокод:');
    if (!code) return;
    apiCall('/api/use-promo', { code }).then(result => {
        tg.showAlert('✅ ' + result.message);
        loadProfile();
    }).catch(e => tg.showAlert('Ошибка: ' + e.message));
}

async function showReferral() {
    try {
        const profile = await apiCall('/api/profile');
        const link = profile.referral.link;
        tg.showPopup({
            title: '🎁 Реферальная ссылка',
            message: `Приглашено: ${profile.referral.count}\nБонусов: ${profile.referral.bonusChecks}\n\n${link}\n\nЗа каждого друга +1 проверка!`,
            buttons: [
                { id: 'copy', type: 'default', text: '📋 Скопировать' },
                { id: 'share', type: 'default', text: '📤 Поделиться' },
                { id: 'cancel', type: 'cancel' }
            ]
        }, (id) => {
            if (id === 'copy') {
                navigator.clipboard.writeText(link);
                tg.showAlert('✅ Ссылка скопирована');
            }
            if (id === 'share') {
                tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Проверь свой Steam профиль в Rust!')}`);
            }
        });
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

// ==================== SUPPORT ====================
let currentTicket = null;
let pollInterval = null;

async function loadSupport() {
    try {
        const data = await apiCall('/api/support/my-ticket');
        currentTicket = data.ticket;
        
        if (currentTicket && currentTicket.status !== 'closed') {
            document.getElementById('support-start').style.display = 'none';
            document.getElementById('support-chat').style.display = 'block';
            renderSupportMessages();
            updateSupportStatus();
            startPolling();
        } else {
            document.getElementById('support-start').style.display = 'block';
            document.getElementById('support-chat').style.display = 'none';
            if (currentTicket && currentTicket.status === 'closed') currentTicket = null;
        }
        
        const profile = await apiCall('/api/profile');
        if (profile.isAdmin) {
            document.getElementById('support-admin').style.display = 'block';
            loadAdminTickets();
        }
    } catch (e) { console.error(e); }
}

function updateSupportStatus() {
    if (!currentTicket) return;
    const banner = document.getElementById('support-waiting-banner');
    const badge = document.getElementById('support-status-badge');
    const desc = document.getElementById('support-status-desc');
    if (currentTicket.status === 'waiting') {
        banner.classList.remove('hidden');
        badge.textContent = '⏳';
        desc.textContent = 'Ожидаем ответа администратора...';
    } else if (currentTicket.status === 'admin_connected') {
        banner.classList.add('hidden');
        badge.textContent = '💬';
        desc.textContent = 'Админ подключился';
    } else {
        banner.classList.add('hidden');
        badge.textContent = '✅';
        desc.textContent = 'Диалог завершён';
    }
}

async function createTicket() {
    const message = document.getElementById('support-first-message').value.trim();
    if (!message || message.length < 10) {
        tg.showAlert('Опиши проблему подробнее (мин. 10 символов)');
        return;
    }
    try {
        const data = await apiCall('/api/support/create', { message });
        currentTicket = data.ticket;
        document.getElementById('support-start').style.display = 'none';
        document.getElementById('support-chat').style.display = 'block';
        document.getElementById('support-first-message').value = '';
        renderSupportMessages();
        updateSupportStatus();
        startPolling();
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        tg.showAlert('✅ Поддержка вызвана! Админ ответит в ближайшее время.');
    } catch (e) {
        tg.showAlert('Ошибка: ' + e.message);
    }
}

function renderSupportMessages() {
    if (!currentTicket) return;
    const container = document.getElementById('support-messages');
    let html = '';
    currentTicket.messages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        html += `<div class="support-msg ${msg.role}">${escapeHtml(msg.text)}<div class="support-msg-time">${time}</div></div>`;
    });
    if (currentTicket.status === 'waiting') {
        html += `<div class="support-msg system">⏳ Ожидаем ответа администратора</div>`;
    }
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
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
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
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
                    if (currentTicket.messages.length > oldLen && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                }
            }
        } catch (e) {}
    }, 5000);
}

async function loadAdminTickets() {
    try {
        const data = await apiCall('/api/support/admin/tickets');
        const container = document.getElementById('admin-tickets-list');
        if (!data.tickets?.length) {
            container.innerHTML = '<p style="text-align:center;opacity:0.5;padding:20px;">Нет тикетов</p>';
            document.getElementById('tickets-count').textContent = '0';
            return;
        }
        const waitingCount = data.tickets.filter(t => t.status === 'waiting').length;
        document.getElementById('tickets-count').textContent = waitingCount;
        let html = '';
        data.tickets.forEach(ticket => {
            const isUnread = ticket.status === 'waiting';
            const statusText = { 'waiting': '⏳', 'admin_connected': '💬', 'closed': '✅' }[ticket.status];
            const usernameText = ticket.username ? `@${ticket.username}` : 'без @';
            html += `<div class="ticket-item ${isUnread ? 'unread' : ''}" onclick="openAdminTicket('${ticket.id}')">
                <div class="ticket-icon">${isUnread ? '🔴' : '💬'}</div>
                <div class="ticket-info">
                    <div class="ticket-name">${escapeHtml(ticket.firstName)} · ${usernameText}</div>
                    <div class="ticket-preview">${escapeHtml(ticket.lastMessage.substring(0, 50))}</div>
                </div>
                <div class="ticket-status ${ticket.status}">${statusText}</div>
            </div>`;
        });
        container.innerHTML = html;
    } catch (e) { console.error(e); }
}

async function openAdminTicket(ticketId) {
    try {
        const data = await apiCall('/api/support/admin/ticket', { ticketId });
        const ticket = data.ticket;
        const messagesPreview = ticket.messages.slice(-5).map(m => {
            const role = m.role === 'user' ? '👤' : m.role === 'admin' ? '👑' : '📌';
            return `${role} ${m.text}`;
        }).join('\n\n');
        const usernameText = ticket.username ? `@${ticket.username}` : 'без @';
        tg.showPopup({
            title: `Тикет от ${ticket.firstName}`,
            message: `${usernameText} · ID: ${ticket.userId}\n\n${messagesPreview.substring(0, 500)}`,
            buttons: [
                { id: 'reply', type: 'default', text: '✏️ Ответить' },
                { id: 'close', type: 'destructive', text: '✅ Закрыть' },
                { id: 'cancel', type: 'cancel' }
            ]
        }, async (id) => {
            if (id === 'close') {
                try { await apiCall('/api/support/admin/close', { ticketId }); loadAdminTickets(); tg.showAlert('✅ Тикет закрыт'); } catch (e) {}
            }
            if (id === 'reply') {
                const replyText = prompt('Ответ пользователю:');
                if (!replyText?.trim()) return;
                try {
                    await apiCall('/api/support/admin/reply', { ticketId, message: replyText.trim() });
                    loadAdminTickets();
                    tg.showAlert('✅ Отправлено');
                } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
            }
        });
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

// ==================== ADMIN PANEL ====================
function openAdminPanel() {
    document.getElementById('admin-panel').style.display = 'flex';
    adminLoadStats();
}

function closeAdminPanel() {
    document.getElementById('admin-panel').style.display = 'none';
}

document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`atab-${tab.dataset.atab}`).classList.add('active');
        
        const atab = tab.dataset.atab;
        if (atab === 'stats') adminLoadStats();
        if (atab === 'users') adminLoadUsers();
        if (atab === 'promos') adminLoadPromos();
    });
});

async function adminLoadStats() {
    const c = document.getElementById('admin-stats-content');
    c.innerHTML = '<div class="loading-block">⏳</div>';
    try {
        const stats = await apiCall('/api/admin/stats');
        c.innerHTML = `
            <div class="stats-profile-grid">
                <div class="stat-profile-box"><div class="stat-profile-value">${stats.totalUsers}</div><div class="stat-profile-label">Юзеров</div></div>
                <div class="stat-profile-box"><div class="stat-profile-value">${stats.premiumUsers}</div><div class="stat-profile-label">Премиум</div></div>
                <div class="stat-profile-box"><div class="stat-profile-value">${stats.todayChecks}</div><div class="stat-profile-label">Проверок сегодня</div></div>
            </div>
            <div class="stats-profile-grid">
                <div class="stat-profile-box"><div class="stat-profile-value">${stats.totalReferrals}</div><div class="stat-profile-label">Рефералов</div></div>
                <div class="stat-profile-box"><div class="stat-profile-value">${stats.totalWatched}</div><div class="stat-profile-label">В watchlist</div></div>
                <div class="stat-profile-box"><div class="stat-profile-value">~${stats.premiumUsers * 59}₽</div><div class="stat-profile-label">Доход</div></div>
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
            const usernameText = u.username ? `@${u.username}` : 'без @';
            const premiumIcon = u.premium ? '⭐' : '👤';
            let expiresText = '';
            if (u.premiumExpires) {
                const d = new Date(u.premiumExpires);
                expiresText = `до ${d.toLocaleDateString('ru-RU')}`;
            }
            html += `<div class="promo-item">
                <div>
                    <div class="promo-code">${premiumIcon} ${escapeHtml(u.firstName || 'Без имени')}</div>
                    <div class="promo-details">${usernameText} · ID: ${u.userId}</div>
                    <div class="promo-details">${expiresText} · 👁️ ${u.watchlistCount}</div>
                </div>
            </div>`;
        });
        c.innerHTML = html;
    } catch (e) { c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`; }
}

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
            const users = await apiCall('/api/admin/users');
            const found = users.users.find(u => u.username?.toLowerCase() === target.replace('@', '').toLowerCase());
            if (!found) throw new Error('Пользователь не найден');
            targetId = found.userId;
        }
        await apiCall('/api/admin/give-premium', { targetId: parseInt(targetId), days });
        result.innerHTML = `✅ Премиум выдан на ${days} дн.`;
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}

async function adminRevokePremium() {
    const target = document.getElementById('admin-premium-target').value.trim();
    const result = document.getElementById('admin-premium-result');
    if (!target) { result.innerHTML = '❌ Укажи ID или @тег'; result.classList.add('show'); return; }
    result.innerHTML = '<span class="spinner"></span>Обработка...';
    result.classList.add('show');
    try {
        let targetId = target;
        if (target.startsWith('@')) {
            const users = await apiCall('/api/admin/users');
            const found = users.users.find(u => u.username?.toLowerCase() === target.replace('@', '').toLowerCase());
            if (!found) throw new Error('Пользователь не найден');
            targetId = found.userId;
        }
        await apiCall('/api/admin/revoke-premium', { targetId: parseInt(targetId) });
        result.innerHTML = `✅ Премиум забран`;
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}

// ==================== PROMOCODE MANAGEMENT ====================
function adminShowPromoCreate() {
    document.getElementById('admin-promo-create').style.display = 'block';
}

function adminHidePromoCreate() {
    document.getElementById('admin-promo-create').style.display = 'none';
}

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

    if (!code) { tg.showAlert('Введи код'); return; }
    
    try {
        await apiCall('/api/admin/create-promo', {
            code, type, days, checks, percent, maxUses, validDays, onlyNew
        });
        tg.showAlert('✅ Промокод создан!');
        adminHidePromoCreate();
        document.getElementById('promo-code').value = '';
        document.getElementById('promo-max-uses').value = '';
        document.getElementById('promo-valid-days').value = '';
        document.getElementById('promo-only-new').checked = false;
        adminLoadPromos();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

async function adminLoadPromos() {
    const c = document.getElementById('admin-promos-list');
    c.innerHTML = '<div class="loading-block">⏳</div>';
    try {
        const data = await apiCall('/api/admin/promo-list');
        if (!data.promos?.length) { c.innerHTML = '<div class="loading-block">Промокодов нет</div>'; return; }
        
        const now = Date.now();
        let html = '';
        data.promos.forEach(p => {
            let typeText = '';
            if (p.type === 'premium') typeText = `⭐ ${p.days} дней премиума`;
            else if (p.type === 'checks') typeText = `🎮 +${p.checks} проверок`;
            else if (p.type === 'discount') typeText = `💰 Скидка ${p.percent}%`;
            
            const usesText = p.maxUses ? `Использований: ${p.uses}/${p.maxUses}` : `Использований: ${p.uses}`;
            
            let expiresText = '';
            let expiresBadge = '';
            if (p.expiresAt) {
                const d = new Date(p.expiresAt);
                if (p.expiresAt < now) {
                    expiresText = `⏰ Истёк: ${d.toLocaleDateString('ru-RU')}`;
                    expiresBadge = '<span class="promo-badge expired">Истёк</span>';
                } else {
                    const daysLeft = Math.ceil((p.expiresAt - now) / 86400000);
                    expiresText = `⏰ До: ${d.toLocaleDateString('ru-RU')} (${daysLeft} дн.)`;
                    expiresBadge = '<span class="promo-badge temp">Временный</span>';
                }
            } else {
                expiresText = '♾ Бессрочный';
                expiresBadge = '<span class="promo-badge active">Активный</span>';
            }
            
            const limitedBadge = p.maxUses ? `<span class="promo-badge limited">Лимит ${p.maxUses}</span>` : '';
            const newBadge = p.onlyNew ? '<span class="promo-badge temp">Только новые</span>' : '';
            
            html += `<div class="promo-item">
                <div style="flex:1;min-width:0;">
                    <div class="promo-code">${escapeHtml(p.code)}</div>
                    <div class="promo-details">${typeText}</div>
                    <div class="promo-details">${usesText}</div>
                    <div class="promo-details">${expiresText}</div>
                    <div class="promo-stats">${expiresBadge} ${limitedBadge} ${newBadge}</div>
                </div>
                <button class="promo-delete-btn" onclick="adminDeletePromo('${escapeHtml(p.code)}')">🗑</button>
            </div>`;
        });
        c.innerHTML = html;
    } catch (e) { c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`; }
}

async function adminDeletePromo(code) {
    if (!confirm(`Удалить промокод ${code}?`)) return;
    try {
        await apiCall('/api/admin/delete-promo', { code });
        tg.showAlert('✅ Удалён');
        adminLoadPromos();
    } catch (e) { tg.showAlert('Ошибка: ' + e.message); }
}

async function adminSendBroadcast() {
    const text = document.getElementById('admin-broadcast-text').value.trim();
    const result = document.getElementById('admin-broadcast-result');
    if (!text) { result.innerHTML = '❌ Введи текст'; result.classList.add('show'); return; }
    if (!confirm('Отправить всем пользователям?')) return;
    result.innerHTML = '<span class="spinner"></span>Отправка...';
    result.classList.add('show');
    try {
        const users = await apiCall('/api/admin/users');
        let sent = 0;
        for (const u of users.users) {
            try {
                await apiCall('/api/admin/broadcast-single', { targetId: u.userId, text });
                sent++;
            } catch (e) {}
        }
        result.innerHTML = `✅ Отправлено: ${sent}/${users.users.length}`;
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
renderRaidItems();
updateCraftInfo();
