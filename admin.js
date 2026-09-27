// ==================== CONFIG ====================
const API_BASE = 'https://rust-bot.sdadawqdqdasda.workers.dev';
const BOT_USERNAME = 'rustguard_official_bot';

// ==================== STATE ====================
let token = localStorage.getItem('admin_token') || null;
let adminUser = JSON.parse(localStorage.getItem('admin_user') || 'null');

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
    } catch (e) {
        grid.innerHTML = `<div class="loading" style="color:#ef4444;">❌ ${e.message}</div>`;
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

        const users = data.users || data.results || [];

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
window.onTelegramAuth = window.onTelegramAuth;