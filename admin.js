// ==================== CONFIG ====================
const API_BASE = 'https://rust-bot.sdadawqdqdasda.workers.dev';
const BOT_USERNAME = 'rustguard_official_bot';

// ==================== STATE ====================
let token = localStorage.getItem('admin_token') || null;
let adminUser = JSON.parse(localStorage.getItem('admin_user') || 'null');
let currentFilter = 'all';

// ==================== AUTH ====================
window.onTelegramAuth = async function(user) {
    try {
        const res = await fetch(`${API_BASE}/api/webadmin/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            showLoginError(data.error || 'Доступ запрещён');
            return;
        }

        token = data.token;
        adminUser = data.user;
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(adminUser));
        showAdminPanel();
    } catch (e) {
        showLoginError('Ошибка: ' + e.message);
    }
};

function showLoginError(msg) {
    const el = document.getElementById('login-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

async function checkToken() {
    if (!token) return false;
    try {
        const res = await fetch(`${API_BASE}/api/webadmin/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const data = await res.json();
        return data.valid === true;
    } catch (e) { return false; }
}

function logout() {
    token = null;
    adminUser = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    location.reload();
}

// ==================== API CALL ====================
async function apiCall(path, body = {}) {
    const res = await fetch(`${API_BASE}/api/webadmin${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...body })
    });
    const data = await res.json();
    if (res.status === 401) { logout(); throw new Error('Unauthorized'); }
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
}

// ==================== UI ====================
async function init() {
    // Проверяем токен
    if (token && await checkToken()) {
        showAdminPanel();
    } else {
        showLogin();
    }

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', logout);

    // Tabs
    document.querySelectorAll('.sidebar-nav button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-nav button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            document.getElementById('tab-' + tab)?.classList.add('active');
            loadTab(tab);
        });
    });
}

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-screen').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-screen').style.display = 'flex';
    document.getElementById('admin-name').textContent = adminUser?.first_name || 'Admin';
    loadTab('dashboard');
}

function loadTab(tab) {
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'users') loadUsers();
    if (tab === 'logs') loadLogs();
    if (tab === 'tickets') loadTickets();
    if (tab === 'purchases') loadPurchases();
    if (tab === 'promos') loadPromos();
    if (tab === 'reviews') loadReviews();
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = '<div class="loading"><span class="spinner"></span>Загрузка...</div>';

    try {
        const s = await apiCall('/stats');
        grid.innerHTML = `
            <div class="stat-card"><div class="value">${s.totalUsers || 0}</div><div class="label">👥 Юзеров</div></div>
            <div class="stat-card"><div class="value green">${s.premiumUsers || 0}</div><div class="label">⭐ Премиум</div></div>
            <div class="stat-card"><div class="value yellow">${s.purchasedUsers || 0}</div><div class="label">💰 Купили</div></div>
            <div class="stat-card"><div class="value purple">${s.totalRevenue || 0}</div><div class="label">⭐ Stars</div></div>
            <div class="stat-card"><div class="value cyan">${s.todayChecks || 0}</div><div class="label">🎮 Проверок</div></div>
            <div class="stat-card"><div class="value">${s.totalReferrals || 0}</div><div class="label">🎁 Рефералов</div></div>
            <div class="stat-card"><div class="value">${s.totalWatched || 0}</div><div class="label">👁️ В отслеж.</div></div>
            <div class="stat-card"><div class="value">${s.totalHelpers || 0}</div><div class="label">🎧 Хелперов</div></div>
            <div class="stat-card"><div class="value" style="color:#ef4444;">${s.totalBans || 0}</div><div class="label">🚫 Банов</div></div>
        `;
                
        // Рисуем графики
        renderCharts();
    } catch (e) {
        grid.innerHTML = `<div class="loading" style="color:#ef4444;">❌ ${e.message}</div>`;
    }
}

// ==================== CHARTS ====================
let usersChart = null;
let revenueChart = null;

async function renderCharts() {
    try {
        const data = await apiCall('/stats-history', { days: 30 });
        const history = data.history || [];
        
        if (history.length === 0) {
            console.warn('renderCharts: пустая история');
            return;
        }
        
        const labels = history.map(h => {
            const [y, m, d] = h.date.split('-');
            return `${d}.${m}`;
        });
        const usersData = history.map(h => h.totalUsers);
        const revenueData = history.map(h => h.totalRevenue);
        
        // Users chart
        const usersCtx = document.getElementById('users-chart');
        if (usersChart) { usersChart.destroy(); usersChart = null; }
        if (usersCtx) {
            usersChart = new Chart(usersCtx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Пользователей',
                        data: usersData,
                        borderColor: '#7c5cff',
                        backgroundColor: 'rgba(124, 92, 255, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 3,
                        pointBackgroundColor: '#7c5cff',
                        pointBorderColor: '#0e0e12',
                        pointBorderWidth: 2,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255,255,255,0.04)' },
                            ticks: { color: '#7a7a8e', font: { size: 10 } },
                        },
                        y: {
                            grid: { color: 'rgba(255,255,255,0.04)' },
                            ticks: { color: '#7a7a8e', font: { size: 10 } },
                            beginAtZero: true,
                        },
                    },
                },
            });
        }
        
        // Revenue chart
        const revenueCtx = document.getElementById('revenue-chart');
        if (revenueChart) { revenueChart.destroy(); revenueChart = null; }
        if (revenueCtx) {
            revenueChart = new Chart(revenueCtx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Stars',
                        data: revenueData,
                        backgroundColor: 'rgba(251, 191, 36, 0.6)',
                        borderColor: '#fbbf24',
                        borderWidth: 1,
                        borderRadius: 6,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: '#7a7a8e', font: { size: 10 } },
                        },
                        y: {
                            grid: { color: 'rgba(255,255,255,0.04)' },
                            ticks: { color: '#7a7a8e', font: { size: 10 } },
                            beginAtZero: true,
                        },
                    },
                },
            });
        }
    } catch (e) {
        console.error('renderCharts error:', e.message);
    }
}

// ==================== USERS ====================
async function loadUsers(query = '') {
    const container = document.getElementById('users-table');
    container.innerHTML = '<div class="loading"><span class="spinner"></span>Загрузка...</div>';

    try {
        const data = query
            ? await apiCall('/search-user', { query })
            : await apiCall('/users');
        let users = data.users || data.results || [];

        // Фильтр
        if (currentFilter !== 'all') {
            users = users.filter(u => {
                if (currentFilter === 'premium') return u.premium;
                if (currentFilter === 'helper') return u.helper;
                if (currentFilter === 'banned') return u.banned;
                return true;
            });
        }

        if (!users.length) {
            container.innerHTML = '<div class="loading">Нет юзеров</div>';
            return;
        }

        let html = `<table>
            <thead><tr>
                <th>ID</th><th>Имя</th><th>@username</th><th>Статус</th><th>Премиум до</th><th>Действия</th>
            </tr></thead><tbody>`;

        users.slice(0, 100).forEach(u => {
            const badges = [];
            if (u.premium) badges.push('<span class="badge premium">⭐ Premium</span>');
            if (u.helper) badges.push('<span class="badge helper">🎧 Helper</span>');
            if (u.banned) badges.push('<span class="badge banned">🚫 Banned</span>');

            const exp = u.premiumExpires
                ? new Date(u.premiumExpires).toLocaleDateString('ru-RU')
                : '—';

            html += `<tr>
                <td><code>${u.userId}</code></td>
                <td>${escapeHtml(u.firstName || '—')}</td>
                <td>${u.username ? '@' + escapeHtml(u.username) : '—'}</td>
                <td>${badges.join(' ') || '—'}</td>
                <td>${exp}</td>
                <td>
                    ${u.premium
                        ? `<button class="btn btn-mini danger" onclick="revokePremium(${u.userId})">❌ Премиум</button>`
                        : `<button class="btn btn-mini primary" onclick="givePremium(${u.userId})">⭐ Премиум</button>`
                    }
                    ${u.banned
                        ? `<button class="btn btn-mini primary" onclick="unbanUser(${u.userId})">✅ Разбан</button>`
                        : `<button class="btn btn-mini danger" onclick="banUser(${u.userId})">🚫 Бан</button>`
                    }
                </td>
            </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<div class="loading" style="color:#ef4444;">❌ ${e.message}</div>`;
    }
}

function searchUsers() {
    const query = document.getElementById('user-search').value.trim();
    loadUsers(query);
}

// ==================== ADMIN ACTIONS ====================
async function givePremium(userId) {
    const days = prompt('Сколько дней премиума?', '30');
    if (!days) return;
    try {
        await apiCall('/give-premium', { targetId: userId, days: parseInt(days) });
        alert('✅ Премиум выдан');
        loadUsers();
    } catch (e) { alert('Ошибка: ' + e.message); }
}

async function revokePremium(userId) {
    if (!confirm('Забрать премиум?')) return;
    try {
        await apiCall('/revoke-premium', { targetId: userId });
        alert('✅ Премиум забран');
        loadUsers();
    } catch (e) { alert('Ошибка: ' + e.message); }
}

async function banUser(userId) {
    const reason = prompt('Причина бана?', '');
    if (reason === null) return;
    const minutes = prompt('Сколько минут? (0 = навсегда)', '10080');
    try {
        await apiCall('/ban', { targetId: userId, minutes: parseInt(minutes) || 0, reason });
        alert('✅ Забанен');
        loadUsers();
    } catch (e) { alert('Ошибка: ' + e.message); }
}

async function unbanUser(userId) {
    if (!confirm('Разбанить?')) return;
    try {
        await apiCall('/unban', { targetId: userId });
        alert('✅ Разбанен');
        loadUsers();
    } catch (e) { alert('Ошибка: ' + e.message); }
}

// ==================== LOGS ====================
async function loadLogs() {
    const container = document.getElementById('logs-table');
    container.innerHTML = '<div class="loading"><span class="spinner"></span>Загрузка...</div>';

    try {
        const data = await apiCall('/logs');
        const logs = data.logs || [];

        if (!logs.length) {
            container.innerHTML = '<div class="loading">Логов нет</div>';
            return;
        }

        let html = `<table>
            <thead><tr><th>Время</th><th>Admin</th><th>Action</th><th>Details</th></tr></thead><tbody>`;

        logs.slice(0, 100).forEach(l => {
            const time = new Date(l.t).toLocaleString('ru-RU');
            html += `<tr>
                <td>${time}</td>
                <td><code>${l.adminId}</code></td>
                <td>${escapeHtml(l.action)}</td>
                <td>${escapeHtml(l.details || '—')}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<div class="loading" style="color:#ef4444;">❌ ${e.message}</div>`;
    }
}

// ==================== PURCHASES ====================
async function loadPurchases() {
    const container = document.getElementById('purchases-table');
    container.innerHTML = '<div class="loading"><span class="spinner"></span>Загрузка...</div>';
    
    try {
        const data = await apiCall('/purchases');
        const list = data.purchases || [];
        
        if (!list.length) {
            container.innerHTML = '<div class="loading">Покупок нет</div>';
            return;
        }
        
        let total = 0;
        list.forEach(p => total += p.totalSpent);
        
        let html = `<div style="padding:16px;background:#1c1c25;font-size:14px;display:flex;gap:20px;align-items:center;">
            <div>💰 Всего заработано: <b style="color:#fbbf24;font-size:18px;">${total} Stars</b></div>
            <div>👥 Покупателей: <b>${list.length}</b></div>
        </div>
        <table><thead><tr>
            <th>ID</th><th>@username</th><th>Покупок</th><th>Потрачено (⭐)</th><th>Последняя покупка</th>
        </tr></thead><tbody>`;
        
        list.forEach(p => {
            const lastDate = p.lastPurchaseAt
                ? new Date(p.lastPurchaseAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—';
            html += `<tr>
                <td><code>${p.userId}</code></td>
                <td>${p.username ? '@' + escapeHtml(p.username) : '—'}</td>
                <td>${p.purchasesCount}</td>
                <td><b style="color:#fbbf24;">${p.totalSpent}</b></td>
                <td>${lastDate} (${p.lastDays}д)</td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<div class="loading" style="color:#ef4444;">❌ ${e.message}</div>`;
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
document.addEventListener('DOMContentLoaded', init);

// Экспорт функций в глобальный scope (для onclick)
window.givePremium = givePremium;
window.revokePremium = revokePremium;
window.banUser = banUser;
window.unbanUser = unbanUser;
window.searchUsers = searchUsers;
window.exportUsersCSV = exportUsersCSV;
window.loadPurchases = loadPurchases;
window.filterUsers = filterUsers;
window.sendBroadcast = sendBroadcast;
window.previewBroadcast = previewBroadcast;
window.showPromoForm = showPromoForm;
window.hidePromoForm = hidePromoForm;
window.createPromo = createPromo;
window.deletePromo = deletePromo;
window.deleteReview = deleteReview;
window.openTicketChat = openTicketChat;
window.closeTicketChat = closeTicketChat;
window.sendTicketReply = sendTicketReply;
window.closeCurrentTicket = closeCurrentTicket;

function filterUsers(filter) {
    currentFilter = filter;
    document.querySelectorAll('[data-filter]').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === filter);
    });
    loadUsers();
}

async function exportUsersCSV() {
    try {
        const data = await apiCall('/export-users');
        if (!data.csv) { alert('Нет данных'); return; }
        
        const blob = new Blob(['\ufeff' + data.csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rustguard_users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) { alert('Ошибка: ' + e.message); }
}
window.onTelegramAuth = window.onTelegramAuth;


async function sendBroadcast() {
    const text = document.getElementById('broadcast-text').value.trim();
    const result = document.getElementById('broadcast-result');
    if (!text) { alert('Введи текст'); return; }
    
    const confirmed = confirm('Отправить всем юзерам?');
    if (!confirmed) return;
    
    result.innerHTML = '<span class="spinner"></span>Отправка...';
    try {
        const data = await apiCall('/broadcast', { text });
        result.innerHTML = `<span style="color:#22c55e;">✅ Запущено для ${data.total} юзеров</span>`;
    } catch (e) {
        result.innerHTML = `<span style="color:#ef4444;">❌ ${e.message}</span>`;
    }
}

function previewBroadcast() {
    const text = document.getElementById('broadcast-text').value.trim();
    const p = document.getElementById('broadcast-preview');
    if (!text) { alert('Введи текст'); return; }
    p.innerHTML = text;
    p.style.display = 'block';
}

// ==================== PROMOS ====================
async function loadPromos() {
    const c = document.getElementById('promos-table');
    c.innerHTML = '<div class="loading"><span class="spinner"></span>Загрузка...</div>';
    
    try {
        const data = await apiCall('/promo-list');
        const list = data.promos || [];
        
        if (!list.length) {
            c.innerHTML = '<div class="loading">Промокодов нет</div>';
            return;
        }
        
        let html = `<table><thead><tr>
            <th>Код</th><th>Тип</th><th>Значение</th><th>Использовано</th><th>Срок</th><th>Действия</th>
        </tr></thead><tbody>`;
        
        list.forEach(p => {
            let typeText = '', valText = '';
            if (p.type === 'premium') { typeText = '⭐ Премиум'; valText = p.days + ' дней'; }
            else if (p.type === 'checks') { typeText = '🎮 Проверки'; valText = '+' + p.checks; }
            else if (p.type === 'discount') { typeText = '💰 Скидка'; valText = p.percent + '%'; }
            
            const uses = p.maxUses ? `${p.uses}/${p.maxUses}` : `${p.uses}`;
            let expText = '∞';
            if (p.expiresAt) {
                if (p.expiresAt < Date.now()) expText = '<span style="color:#ef4444;">Истёк</span>';
                else expText = new Date(p.expiresAt).toLocaleDateString('ru-RU');
            }
            
            html += `<tr>
                <td><code>${escapeHtml(p.code)}</code></td>
                <td>${typeText}</td>
                <td>${valText}</td>
                <td>${uses}</td>
                <td>${expText}</td>
                <td><button class="btn btn-mini danger" onclick="deletePromo('${escapeHtml(p.code)}')">🗑</button></td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        c.innerHTML = html;
    } catch (e) {
        c.innerHTML = `<div class="loading" style="color:#ef4444;">❌ ${e.message}</div>`;
    }
}

function showPromoForm() {
    document.getElementById('promo-form').style.display = 'block';
}

function hidePromoForm() {
    document.getElementById('promo-form').style.display = 'none';
    document.getElementById('promo-result').innerHTML = '';
}

async function createPromo() {
    const code = document.getElementById('p-code').value.trim().toUpperCase();
    const type = document.getElementById('p-type').value;
    const value = parseInt(document.getElementById('p-value').value);
    const maxUses = document.getElementById('p-maxuses').value ? parseInt(document.getElementById('p-maxuses').value) : null;
    const validDays = document.getElementById('p-validdays').value ? parseInt(document.getElementById('p-validdays').value) : null;
    const onlyNew = document.getElementById('p-onlynew').checked;
    
    if (!code || !value) { alert('Заполни Код и Значение'); return; }
    
    const body = { code, type, maxUses, validDays, onlyNew };
    if (type === 'premium') body.days = value;
    if (type === 'checks') body.checks = value;
    if (type === 'discount') body.percent = value;
    
    const result = document.getElementById('promo-result');
    result.innerHTML = '<span class="spinner"></span>Создание...';
    
    try {
        await apiCall('/create-promo', body);
        result.innerHTML = '<span style="color:#22c55e;">✅ Промокод создан!</span>';
        setTimeout(() => {
            hidePromoForm();
            loadPromos();
        }, 1000);
    } catch (e) {
        result.innerHTML = `<span style="color:#ef4444;">❌ ${e.message}</span>`;
    }
}

async function deletePromo(code) {
    if (!confirm('Удалить промокод ' + code + '?')) return;
    try {
        await apiCall('/delete-promo', { code });
        loadPromos();
    } catch (e) { alert('Ошибка: ' + e.message); }
}

// ==================== REVIEWS ====================
async function loadReviews() {
    const c = document.getElementById('reviews-list');
    c.innerHTML = '<div class="loading"><span class="spinner"></span>Загрузка...</div>';
    
    try {
        const data = await apiCall('/reviews');
        const list = data.reviews || [];
        
        if (!list.length) {
            c.innerHTML = '<div class="loading">Отзывов нет</div>';
            return;
        }
        
        let html = '';
        list.forEach(r => {
            const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
            const date = new Date(r.timestamp).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            html += `
                <div style="background:#16161d;border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:16px;margin-bottom:12px;display:flex;gap:12px;align-items:flex-start;">
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:700;margin-bottom:4px;font-size:14px;">
                            ${escapeHtml(r.firstName || 'User')}
                            ${r.username ? ' · @' + escapeHtml(r.username) : ''}
                            <code style="color:#7a7a8e;font-size:11px;margin-left:6px;">${r.userId}</code>
                        </div>
                        <div style="color:#fbbf24;font-size:14px;margin-bottom:6px;letter-spacing:2px;">${stars}</div>
                        <div style="font-size:13px;color:#b8b8c8;line-height:1.5;word-break:break-word;">${escapeHtml(r.text)}</div>
                        <div style="font-size:11px;color:#7a7a8e;margin-top:8px;">${date}</div>
                    </div>
                    <button class="btn btn-mini danger" onclick="deleteReview(${r.userId}, ${r.timestamp})">🗑</button>
                </div>
            `;
        });
        c.innerHTML = html;
    } catch (e) {
        c.innerHTML = `<div class="loading" style="color:#ef4444;">❌ ${e.message}</div>`;
    }
}

async function deleteReview(userId, timestamp) {
    if (!confirm('Удалить этот отзыв?')) return;
    try {
        await apiCall('/delete-review', { userId, timestamp });
        loadReviews();
    } catch (e) { alert('Ошибка: ' + e.message); }
}

// ==================== TICKETS ====================
let currentTicket = null;
let ticketPollInterval = null;

async function loadTickets() {
    const c = document.getElementById('tickets-list');
    c.innerHTML = '<div class="loading"><span class="spinner"></span>Загрузка...</div>';
    
    try {
        const data = await apiCall('/tickets');
        const tickets = data.tickets || [];
        
        if (!tickets.length) {
            c.innerHTML = '<div class="loading">Открытых тикетов нет</div>';
            return;
        }
        
        let html = '';
                tickets.forEach(t => {
            const statusEmoji = t.status === 'waiting' ? '⏳' : '💬';
            const statusText = t.status === 'waiting' ? 'Ожидает' : 'Диалог';
            const isUnread = t.status === 'waiting';
            const date = new Date(t.updatedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const nameLine = t.username ? `${escapeHtml(t.firstName)} · @${escapeHtml(t.username)}` : escapeHtml(t.firstName);

            const initials = (t.firstName || 'U').charAt(0).toUpperCase();
            const avatarHtml = t.photoUrl
                ? `<div class="ticket-icon"><img src="${escapeHtml(t.photoUrl)}" onerror="this.parentNode.textContent='${initials}';"></div>`
                : `<div class="ticket-icon">${initials}</div>`;

            html += `<div class="ticket-item ${isUnread ? 'unread' : ''}" onclick="openTicketChat('${t.id}')">
                ${avatarHtml}
                <div class="ticket-info">
                    <div class="ticket-name">${nameLine}</div>
                    <div class="ticket-preview">${escapeHtml(t.lastMessage || '—')}</div>
                </div>
                <div class="ticket-meta">
                    <div class="ticket-status ${t.status}">${statusEmoji} ${statusText}</div>
                    <div class="ticket-date">${date}</div>
                </div>
            </div>`;
        });
        c.innerHTML = html;
    } catch (e) {
        c.innerHTML = `<div class="loading" style="color:#ef4444;">❌ ${e.message}</div>`;
    }
}

async function openTicketChat(ticketId) {
    try {
        const data = await apiCall('/ticket', { ticketId });
        currentTicket = data.ticket;
        document.getElementById('ticket-chat-name').textContent = currentTicket.firstName || 'User';
        document.getElementById('ticket-chat-sub').textContent =
            (currentTicket.username ? '@' + currentTicket.username + ' · ' : '') + 'ID: ' + currentTicket.userId;
        renderTicketMessages();
        document.getElementById('ticket-chat-modal').style.display = 'block';
        
        if (ticketPollInterval) clearInterval(ticketPollInterval);
        ticketPollInterval = setInterval(async () => {
            try {
                const fresh = await apiCall('/ticket', { ticketId });
                if (fresh.ticket && fresh.ticket.messages.length !== currentTicket.messages.length) {
                    currentTicket = fresh.ticket;
                    renderTicketMessages();
                }
            } catch (e) {}
        }, 5000);
    } catch (e) { alert('Ошибка: ' + e.message); }
}

function closeTicketChat() {
    if (ticketPollInterval) { clearInterval(ticketPollInterval); ticketPollInterval = null; }
    document.getElementById('ticket-chat-modal').style.display = 'none';
    currentTicket = null;
    loadTickets();
}

function renderTicketMessages() {
    if (!currentTicket) return;
    const c = document.getElementById('ticket-chat-messages');
    let html = '';
    
    currentTicket.messages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const isUser = msg.role === 'user';
        const isAdmin = msg.role === 'admin' || msg.role === 'helper';
        
        if (isUser) {
            html += `<div style="align-self:flex-start;max-width:80%;">
                <div style="font-size:10px;color:#7a7a8e;margin-bottom:4px;">👤 ${escapeHtml(currentTicket.firstName)}</div>
                <div style="background:#16161d;border:1px solid rgba(255,255,255,.06);padding:10px 14px;border-radius:14px;border-bottom-left-radius:4px;font-size:14px;line-height:1.4;word-wrap:break-word;">${escapeHtml(msg.text)}<div style="font-size:10px;color:#7a7a8e;text-align:right;margin-top:4px;">${time}</div></div>
            </div>`;
        } else if (isAdmin) {
            html += `<div style="align-self:flex-end;max-width:80%;">
                <div style="font-size:10px;color:#a855f7;margin-bottom:4px;text-align:right;">🛡️ Админ</div>
                <div style="background:linear-gradient(135deg,#7c5cff,#a855f7);padding:10px 14px;border-radius:14px;border-bottom-right-radius:4px;font-size:14px;line-height:1.4;color:#fff;word-wrap:break-word;">${escapeHtml(msg.text)}<div style="font-size:10px;opacity:.7;text-align:right;margin-top:4px;">${time}</div></div>
            </div>`;
        }
    });
    
    if (currentTicket.status === 'waiting') {
        html += `<div style="align-self:center;padding:6px 12px;background:#16161d;border-radius:10px;font-size:11px;color:#7a7a8e;">⏳ Ждём ответа юзера</div>`;
    } else if (currentTicket.status === 'closed') {
        html += `<div style="align-self:center;padding:6px 12px;background:#16161d;border-radius:10px;font-size:11px;color:#7a7a8e;">✅ Тикет закрыт</div>`;
    }
    
    c.innerHTML = html;
    c.scrollTop = c.scrollHeight;
}

async function sendTicketReply() {
    if (!currentTicket) return;
    const input = document.getElementById('ticket-chat-input');
    const message = input.value.trim();
    if (!message) return;
    
    input.value = '';
    currentTicket.messages.push({ role: 'admin', text: message, timestamp: Date.now() });
    renderTicketMessages();
    
    try {
        const data = await apiCall('/ticket-reply', { ticketId: currentTicket.id, message });
        currentTicket = data.ticket;
        renderTicketMessages();
    } catch (e) {
        alert('Ошибка: ' + e.message);
    }
}

async function closeCurrentTicket() {
    if (!currentTicket) return;
    if (!confirm('Закрыть этот тикет?')) return;
    try {
        await apiCall('/ticket-close', { ticketId: currentTicket.id });
        closeTicketChat();
    } catch (e) { alert('Ошибка: ' + e.message); }
}
