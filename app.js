const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
if (tg.setHeaderColor) tg.setHeaderColor('#13161e');
if (tg.setBackgroundColor) tg.setBackgroundColor('#13161e');

const API_BASE = 'https://rust-bot.sdadawqdqdasda.workers.dev';
const INIT_DATA = tg.initData || '';

// ==================== I18N ====================
const I18N = {
    ru: {
        btn_analyze: 'АНАЛИЗ', hero_kicker: 'RUST CHECKER', hero_title: 'Проверь игрока',
        hero_desc: 'Введи SteamID или ссылку — получи полный отчёт за секунду',
        raid_kicker: 'CALCULATOR', raid_title_big: 'Калькулятор рейда', raid_category: 'Категория', raid_target: 'Цель',
        raid_doors_opt: '🚪 Двери', raid_walls_opt: '🧱 Стены', raid_outer_opt: '🛡️ Внешние стены',
        raid_title_calc: 'Калькулятор рейда', raid_desc: 'Сколько взрывчатки нужно на объект',
        craft_kicker: 'CALCULATOR', craft_title_big: 'Калькулятор крафта', craft_desc: 'Ресурсы на крафт взрывчатки',
        craft_explosive: 'Взрывчатка', craft_count: 'Количество', craft_per_unit: 'Стоимость на 1 шт.',
        watch_kicker: 'TRACKING', watch_title_big: 'Watchlist', watch_desc: 'Следи за игроками и получай уведомления о банах',
        watch_add_title: 'Добавить игрока', watch_steamid: 'SteamID', watch_list_title: 'Отслеживаемые',
        btn_calc_upper: 'РАССЧИТАТЬ', btn_add_upper: 'ДОБАВИТЬ',
        support_title: 'Поддержка', support_hero: 'Нужна помощь?', support_hero_desc: 'Опиши ситуацию подробнее — ответим быстрее',
        support_problem: 'Опиши проблему', support_start_chat: 'НАЧАТЬ ДИАЛОГ',
        profile_title_modal: 'Профиль', friends_title_modal: 'Друзья с Rust', admin_title_modal: 'Админ-панель',
        sidebar_profile: 'Профиль', sidebar_watch: 'Watchlist', sidebar_support: 'Помощь',
        sidebar_settings: 'Настройки', sidebar_theme: 'Тема', sidebar_lang: 'Язык',
        sidebar_notifications: 'Уведомления', sidebar_watch_notif: 'Уведомления о банах',
        sidebar_haptic: 'Вибро-отклик',
        sidebar_referral: 'Реферальная ссылка', sidebar_promo: 'Активировать промокод',
        sidebar_back: 'Вернуться в бот', sidebar_close: 'Закрыть',
        chat_called: 'Поддержка вызвана', chat_wait_hint: 'Ожидайте ответа',
        steam_private: 'Приватный профиль', hours_rust: 'часов Rust', friends_lbl: 'друзей', bans_lbl: 'банов',
        risk_title: 'Риск читерства', risk_sub: 'Анализ VAC, часов и активности', risk_low: 'Низкий', risk_high: 'Высокий',
        activity_title: 'Активность', vac_ban: 'VAC бан', vac_active: 'активных', no_bans: 'Банов нет', clean_history: 'Чистая история',
        steam_level: 'Steam уровень', achievements: 'Достижений', age_lbl: 'Возраст', years_lbl: 'лет', days_lbl: 'дней', games_lbl: 'Игр',
        friends_rust: 'Друзей с Rust', open_friends: 'Открыть список', open_profile: 'Открыть профиль',
        profile_loading: '⏳ Загружаю профиль...',
        profile_premium_active: 'Премиум активен', profile_premium_admin: 'Администратор', profile_premium_inactive: 'Премиум не активен',
        profile_premium_hint: 'Купи премиум для безлимита', profile_admin_perm: 'Постоянный доступ',
        until_lbl: 'до', at_lbl: 'в', days_left: 'Осталось', discount_lbl: 'Скидка', on_premium_buy: 'На покупку премиума',
        actions_title: 'Действия', btn_buy_premium: '⭐ Купить премиум', btn_trial: '🎁 Пробная', days_word: 'дня',
        btn_activate_promo: '🎟 Активировать промокод', btn_ref_link: '🎁 Реферальная ссылка', btn_admin_panel: '👑 Админ-панель',
        checks_lbl: 'Проверок', watchlist_lbl: 'Watchlist', refs_lbl: 'Рефералов',
        err_steamid: '❌ Введи SteamID (17 цифр)', analyzing: 'Анализирую...',
        watchlist_empty: '📊 Список пуст', watching_lbl: '📊 Отслеживается',
        ref_title: '🎁 Реферальная ссылка', ref_invited: 'Приглашено', ref_bonus: 'Бонусов',
        ref_hint: 'За каждого друга +1 проверка!', ref_copy: '📋 Скопировать', ref_share: '📤 Поделиться', ref_copied: '✅ Ссылка скопирована',
        err_prefix: 'Ошибка: ', open_bot: 'Открой бота → /start → «⭐ Купить премиум»',
        trial_activated: '🎉 Пробная активирована на', promo_activated: '✅ Промокод активирован',
        sending_bg: '📢 Рассылка запущена в фоне', sending_run: 'Отправка запущена...', broadcast_sent: '✅ Рассылка запущена для',
        preview_lbl: '👁 ПРЕВЬЮ', empty_lbl: '❌ Пусто',
        confirm_broadcast: 'Отправить всем пользователям?', confirm_delete_promo: 'Удалить промокод', confirm_close_ticket: 'Закрыть тикет?',
        premium_given: '✅ Премиум выдан на', days_short: 'дн.',
        ticket_closed: '✅ Тикет закрыт', admin_close_ok: '✅ Тикет закрыт', promo_updated: '✅ Промокод обновлён',
        no_users: 'Нет пользователей', no_promos: 'Промокодов нет', no_tickets: 'Нет тикетов', no_friends: 'Нет друзей с Rust',
        loading_lbl: '⏳ Загрузка...', loading_short: '⏳',
        promo_uses_lbl: 'Использований', promo_until_lbl: 'До', promo_forever_lbl: '♾ Бессрочный',
        promo_expired_lbl: '⏰ Истёк', promo_temp_lbl: 'Временный', promo_active_lbl: 'Активный',
        promo_limit_lbl: 'Лимит', promo_only_new_lbl: 'Только новые', promo_days_badge: 'Дней',
        refs_short: 'Рефералов', watch_short: 'В watchlist', income_lbl: 'Доход', today_checks: 'Проверок сегодня',
        users_short: 'Юзеров', premium_short: 'Премиум', purchased_short: 'Купили', revenue_short: 'Доход (Stars)',
        chat_waiting: 'Ожидаем ответа администратора...', chat_connected: 'Админ подключился', chat_finished: 'Диалог завершён',
        chat_waiting_sys: '⏳ Ожидаем ответа администратора', chat_closed_sys: '✅ Тикет закрыт', chat_need_reply: '⏳ Ждём ответа...',
        friend_check: 'Проверить', friend_steam: 'Steam',
        admin_stats: 'Статистика', admin_users: 'Юзеры', admin_premium: 'Премиум', admin_promos: 'Промокоды', admin_tickets: 'Тикеты', admin_broadcast: 'Рассылка',
        promo_code: 'Код', promo_type: 'Тип', promo_type_premium: '⭐ Дни премиума', promo_type_checks: '🎮 Бонусные проверки', promo_type_discount: '💰 Скидка на покупку',
        promo_days: 'Дней премиума', promo_checks: 'Кол-во проверок', promo_percent: 'Скидка (%)',
        promo_max_uses: 'Лимит использований', promo_valid_days: 'Срок действия (дней)',
        promo_only_new: 'Только для новых', promo_broadcast: '📢 Рассылка об этом промокоде',
        edit_promo_title: '✏️ Редактировать промокод',
        admin_target: 'ID или @тег', admin_days: 'Дней',
        admin_template: 'Шаблон', admin_choose_template: 'Выбери шаблон', admin_broadcast_text: 'Текст (HTML разрешён)',
        settings_saved: '✅ Сохранено'
    },
    en: {
        btn_analyze: 'ANALYZE', hero_kicker: 'RUST CHECKER', hero_title: 'Check a player',
        hero_desc: 'Enter SteamID or link — get a full report in a second',
        raid_kicker: 'CALCULATOR', raid_title_big: 'Raid Calculator', raid_category: 'Category', raid_target: 'Target',
        raid_doors_opt: '🚪 Doors', raid_walls_opt: '🧱 Walls', raid_outer_opt: '🛡️ Outer',
        raid_title_calc: 'Raid Calculator', raid_desc: 'How much explosives you need',
        craft_kicker: 'CALCULATOR', craft_title_big: 'Craft Calculator', craft_desc: 'Resources to craft explosives',
        craft_explosive: 'Explosive', craft_count: 'Amount', craft_per_unit: 'Cost per unit',
        watch_kicker: 'TRACKING', watch_title_big: 'Watchlist', watch_desc: 'Track players and get ban alerts',
        watch_add_title: 'Add player', watch_steamid: 'SteamID', watch_list_title: 'Tracked',
        btn_calc_upper: 'CALCULATE', btn_add_upper: 'ADD',
        support_title: 'Support', support_hero: 'Need help?', support_hero_desc: 'Describe the situation — we will answer faster',
        support_problem: 'Describe problem', support_start_chat: 'START CHAT',
        profile_title_modal: 'Profile', friends_title_modal: 'Friends with Rust', admin_title_modal: 'Admin Panel',
        sidebar_profile: 'Profile', sidebar_watch: 'Watchlist', sidebar_support: 'Help',
        sidebar_settings: 'Settings', sidebar_theme: 'Theme', sidebar_lang: 'Language',
        sidebar_notifications: 'Notifications', sidebar_watch_notif: 'Ban alerts',
        sidebar_haptic: 'Haptic',
        sidebar_referral: 'Referral link', sidebar_promo: 'Activate promo',
        sidebar_back: 'Back to bot', sidebar_close: 'Close',
        chat_called: 'Support called', chat_wait_hint: 'Wait for reply',
        steam_private: 'Private profile', hours_rust: 'hours Rust', friends_lbl: 'friends', bans_lbl: 'bans',
        risk_title: 'Cheat risk', risk_sub: 'VAC, hours, activity', risk_low: 'Low', risk_high: 'High',
        activity_title: 'Activity', vac_ban: 'VAC ban', vac_active: 'active', no_bans: 'No bans', clean_history: 'Clean history',
        steam_level: 'Steam level', achievements: 'Achievements', age_lbl: 'Age', years_lbl: 'years', days_lbl: 'days', games_lbl: 'Games',
        friends_rust: 'Friends with Rust', open_friends: 'Open list', open_profile: 'Open profile',
        profile_loading: '⏳ Loading profile...',
        profile_premium_active: 'Premium active', profile_premium_admin: 'Administrator', profile_premium_inactive: 'Premium inactive',
        profile_premium_hint: 'Buy premium for unlimited', profile_admin_perm: 'Permanent access',
        until_lbl: 'until', at_lbl: 'at', days_left: 'Left', discount_lbl: 'Discount', on_premium_buy: 'On premium purchase',
        actions_title: 'Actions', btn_buy_premium: '⭐ Buy premium', btn_trial: '🎁 Trial', days_word: 'days',
        btn_activate_promo: '🎟 Activate promo', btn_ref_link: '🎁 Referral link', btn_admin_panel: '👑 Admin panel',
        checks_lbl: 'Checks', watchlist_lbl: 'Watchlist', refs_lbl: 'Referrals',
        err_steamid: '❌ Enter SteamID (17 digits)', analyzing: 'Analyzing...',
        watchlist_empty: '📊 List is empty', watching_lbl: '📊 Tracking',
        ref_title: '🎁 Referral link', ref_invited: 'Invited', ref_bonus: 'Bonus',
        ref_hint: '+1 check for each friend!', ref_copy: '📋 Copy', ref_share: '📤 Share', ref_copied: '✅ Link copied',
        err_prefix: 'Error: ', open_bot: 'Open bot → /start → "⭐ Buy premium"',
        trial_activated: '🎉 Trial activated for', promo_activated: '✅ Promo activated',
        sending_bg: '📢 Broadcast started', sending_run: 'Sending started...', broadcast_sent: '✅ Broadcast started for',
        preview_lbl: '👁 PREVIEW', empty_lbl: '❌ Empty',
        confirm_broadcast: 'Send to all users?', confirm_delete_promo: 'Delete promo', confirm_close_ticket: 'Close ticket?',
        premium_given: '✅ Premium given for', days_short: 'days',
        ticket_closed: '✅ Ticket closed', admin_close_ok: '✅ Ticket closed', promo_updated: '✅ Promo updated',
        no_users: 'No users', no_promos: 'No promos', no_tickets: 'No tickets', no_friends: 'No friends with Rust',
        loading_lbl: '⏳ Loading...', loading_short: '⏳',
        promo_uses_lbl: 'Uses', promo_until_lbl: 'Until', promo_forever_lbl: '♾ Forever',
        promo_expired_lbl: '⏰ Expired', promo_temp_lbl: 'Temporary', promo_active_lbl: 'Active',
        promo_limit_lbl: 'Limit', promo_only_new_lbl: 'New only', promo_days_badge: 'Days',
        refs_short: 'Referrals', watch_short: 'In watchlist', income_lbl: 'Income', today_checks: 'Checks today',
        users_short: 'Users', premium_short: 'Premium', purchased_short: 'Purchased', revenue_short: 'Revenue (Stars)',
        chat_waiting: 'Waiting for admin reply...', chat_connected: 'Admin connected', chat_finished: 'Dialog finished',
        chat_waiting_sys: '⏳ Waiting for admin reply', chat_closed_sys: '✅ Ticket closed', chat_need_reply: '⏳ Waiting...',
        friend_check: 'Check', friend_steam: 'Steam',
        admin_stats: 'Stats', admin_users: 'Users', admin_premium: 'Premium', admin_promos: 'Promos', admin_tickets: 'Tickets', admin_broadcast: 'Broadcast',
        promo_code: 'Code', promo_type: 'Type', promo_type_premium: '⭐ Premium days', promo_type_checks: '🎮 Bonus checks', promo_type_discount: '💰 Discount',
        promo_days: 'Premium days', promo_checks: 'Checks amount', promo_percent: 'Discount (%)',
        promo_max_uses: 'Max uses', promo_valid_days: 'Valid days',
        promo_only_new: 'New users only', promo_broadcast: '📢 Broadcast about this promo',
        edit_promo_title: '✏️ Edit promo',
        admin_target: 'ID or @tag', admin_days: 'Days',
        admin_template: 'Template', admin_choose_template: 'Choose template', admin_broadcast_text: 'Text (HTML allowed)',
        settings_saved: '✅ Saved'
    }
};

let LANG = 'ru';
let SETTINGS = { theme: 'dark', language: 'ru', notifications: true, watchNotifications: true, haptic: true };
let USER_DATA = null;
let LAST_ANALYZED = null;

function tr(key) { return (I18N[LANG] && I18N[LANG][key]) || I18N.ru[key] || key; }

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
    const t = (theme === 'auto')
        ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
        : theme;
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f4f5f9' : '#13161e');
    if (tg.setHeaderColor) tg.setHeaderColor(t === 'light' ? '#f4f5f9' : '#13161e');
    if (tg.setBackgroundColor) tg.setBackgroundColor(t === 'light' ? '#f4f5f9' : '#13161e');
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
    applyI18n();
    updateSegActive();
    try { await apiCall('/api/settings', { settings: { language: lang } }); } catch (e) {}
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    if (LAST_ANALYZED) {
        const el = document.getElementById('steam-result');
        if (el && el.innerHTML) el.innerHTML = renderSteamProfile(LAST_ANALYZED);
    }
    if (document.getElementById('profile-modal').style.display === 'flex') loadProfile();
    if (document.getElementById('support-modal').style.display === 'flex') loadSupport();
    if (document.querySelector('.tab[data-tab="watch"]').classList.contains('active')) loadWatchlist();
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

function applyI18n() {
    // Тексты в HTML пока без data-i18n кроме заголовков секций — их обновляем вручную
    updateSegActive();
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
    if (!match) { resultDiv.innerHTML = tr('err_steamid'); resultDiv.classList.add('show'); return; }
    resultDiv.innerHTML = `<span class="spinner"></span>${tr('analyzing')}`;
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

function renderSteamProfile(d) {
    if (d.privateWarning) {
        return `<div class="player-card"><div class="player-top"><div class="player-avatar">🔒</div><div class="player-info"><h3>${escapeHtml(d.name)}</h3><span class="player-status offline">${tr('steam_private')}</span></div></div></div>`;
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
                <div class="stat-box"><div class="stat-icon purple">🦀</div><div class="stat-value">${d.rustPlaytime.toLocaleString(LANG === 'en' ? 'en-US' : 'ru-RU')}</div><div class="stat-label">${tr('hours_rust')}</div></div>
                <div class="stat-box"><div class="stat-icon cyan">👥</div><div class="stat-value">${d.friendsCount}</div><div class="stat-label">${tr('friends_lbl')}</div></div>
                <div class="stat-box"><div class="stat-icon red">!</div><div class="stat-value">${totalBans}</div><div class="stat-label">${tr('bans_lbl')}</div></div>
            </div>
        </div>
        <div class="risk-card">
            <div class="risk-head"><div><h3>${tr('risk_title')}</h3><p>${tr('risk_sub')}</p></div><div class="risk-value"><div class="risk-percent ${riskClass}">${d.riskScore}%</div><div class="risk-level ${riskClass}">${escapeHtml(d.riskLevel)}</div></div></div>
            <div class="risk-bar"><div class="risk-indicator" style="left: ${d.riskScore}%"></div></div>
            <div class="risk-labels"><span>${tr('risk_low')}</span><span>${tr('risk_high')}</span></div>
        </div>
        <div class="section-title">${tr('activity_title')}</div>
        <div class="activity-list">
            ${hasBan ? `<div class="activity-item"><div class="activity-icon vac">VAC</div><div class="activity-content"><h4>${tr('vac_ban')}</h4><p>${d.vacBans} ${tr('vac_active')}</p></div></div>` : `<div class="activity-item"><div class="activity-icon vpn">✓</div><div class="activity-content"><h4>${tr('no_bans')}</h4><p>${tr('clean_history')}</p></div></div>`}
            <div class="activity-item"><div class="activity-icon raid">🔥</div><div class="activity-content"><h4>${tr('steam_level')}: ${d.steamLevel}</h4><p>${tr('achievements')}: ${d.achievementsCount}</p></div></div>
            <div class="activity-item"><div class="activity-icon friend">📅</div><div class="activity-content"><h4>${tr('age_lbl')}: ${d.accountAgeYears} ${tr('years_lbl')}</h4><p>${d.accountAgeDays} ${tr('days_lbl')} · ${tr('games_lbl')}: ${d.gamesCount}</p></div></div>
            ${d.friendsWithRust?.length > 0 ? `<div class="activity-item" onclick="openFriendsScreen()"><div class="activity-icon friend">👥</div><div class="activity-content"><h4>${tr('friends_rust')}: ${d.friendsWithRust.length}</h4><p>${tr('open_friends')}</p></div></div>` : ''}
            <div class="activity-item" onclick="window.open('${escapeHtml(d.profileUrl)}','_blank')"><div class="activity-icon vpn">🔗</div><div class="activity-content"><h4>${tr('open_profile')}</h4><p>${d.steamId}</p></div></div>
        </div>
    `;
}

// ==================== FRIENDS SCREEN ====================
function openFriendsScreen() {
    if (!LAST_ANALYZED || !LAST_ANALYZED.friendsWithRust) return;
    const body = document.getElementById('friends-body');
    const friends = LAST_ANALYZED.friendsWithRust;
    if (!friends.length) {
        body.innerHTML = `<div class="loading-block">${tr('no_friends')}</div>`;
    } else {
        let html = '';
        friends.forEach(f => {
            const initials = (f.name || 'U').substring(0, 2).toUpperCase();
            const avatarHtml = f.avatar
                ? `<div class="friend-avatar"><img src="${API_BASE}/api/avatar?url=${encodeURIComponent(f.avatar)}" onerror="this.parentNode.innerHTML='${initials}';"></div>`
                : `<div class="friend-avatar">${initials}</div>`;
            html += `<div class="friend-row">
                ${avatarHtml}
                <div class="friend-info">
                    <div class="friend-name">${escapeHtml(f.name)}</div>
                    <div class="friend-id">${f.steamId}</div>
                </div>
                <div class="friend-actions">
                    <button class="friend-btn steam" onclick="window.open('${escapeHtml(f.profileUrl)}','_blank')" title="${tr('friend_steam')}">🌐</button>
                    <button class="friend-btn check" onclick="checkFriend('${f.steamId}')" title="${tr('friend_check')}">🔍</button>
                </div>
            </div>`;
        });
        body.innerHTML = html;
    }
    document.getElementById('friends-screen').style.display = 'flex';
}

function closeFriendsScreen() {
    document.getElementById('friends-screen').style.display = 'none';
}

async function checkFriend(steamId) {
    closeFriendsScreen();
    document.getElementById('steam-input').value = steamId;
    goToTab('steam');
    setTimeout(() => analyzeSteam(), 100);
}

// ==================== RAID ====================
const RAID_DATA = {
    doors: { title: '🚪 Doors', items: {
        wood_door: { name: 'Wood Door / Деревянная', hp: 200, explosive: '2 molotov', resources: '100 fuel' },
        sheet_door: { name: 'Sheet Door / Железная', hp: 250, explosive: '1 rocket, 8 beancans', resources: '1600 sulfur' },
        garage_door: { name: 'Garage Door / Гаражка', hp: 600, explosive: '3 rockets', resources: '4200 sulfur' },
        mvp_door: { name: 'Armored Door / МВК', hp: 1000, explosive: '2 C4, 30 beancans', resources: '5900 sulfur' },
        ladder_hatch: { name: 'Ladder Hatch / Люк', hp: 250, explosive: '1 rocket', resources: '1600 sulfur' },
        shop_front: { name: 'Shop Front / Витрина', hp: 750, explosive: '3 C4', resources: '6600 sulfur' }
    }},
    walls: { title: '🧱 Walls', items: {
        wood_wall: { name: 'Wood Wall / Дерево', hp: 250, explosive: '4 molotov', resources: '200 fuel' },
        stone_wall: { name: 'Stone Wall / Камень', hp: 500, explosive: '3 rockets', resources: '5075 sulfur' },
        sheet_wall: { name: 'Sheet Wall / Железо', hp: 1000, explosive: '7 rockets', resources: '10175 sulfur' },
        mvp_wall: { name: 'Armored Wall / МВК', hp: 2000, explosive: '14 rockets', resources: '20350 sulfur' }
    }},
    outer_walls: { title: '🛡️ Outer', items: {
        outer_stone: { name: 'Stone / Камень', hp: 500, explosive: '2 C4', resources: '4400 sulfur' },
        outer_wood: { name: 'Wood / Дерево', hp: 500, explosive: '1 incendiary', resources: '75 fuel' }
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
    c4: { name: 'C4', emoji: '💥', sulfur: 2200, lgf: 60, resources: [{name:'Explosive',count:20},{name:'Cloth',count:5},{name:'Tech Trash',count:2}] },
    rocket: { name: 'Rocket', emoji: '🚀', sulfur: 1400, lgf: 30, resources: [{name:'Explosive',count:10},{name:'Gunpowder',count:150},{name:'Pipe',count:2}] },
    satchel: { name: 'Satchel', emoji: '🎒', sulfur: 480, lgf: 0, resources: [{name:'Beancan',count:4},{name:'Small Stash',count:1},{name:'Rope',count:1}] },
    beancan: { name: 'Beancan', emoji: '💣', sulfur: 120, lgf: 0, resources: [{name:'Gunpowder',count:60},{name:'Metal Frags',count:20}] },
    explo: { name: 'Bullet 5.56', emoji: '🔫', sulfur: 25, lgf: 0, resources: [{name:'Gunpowder',count:5},{name:'Metal Frags',count:10}] }
};

function updateCraftInfo() {
    const type = document.getElementById('craft-type').value;
    const item = CRAFT_DATA[type];
    const info = document.getElementById('craft-info');
    let html = `<div class="craft-info-list">`;
    item.resources.forEach(r => html += `<div class="craft-row"><span>${r.name}</span><strong>${r.count}</strong></div>`);
    html += `<div class="craft-row"><span>Sulfur</span><strong>${item.sulfur}</strong></div>`;
    if (item.lgf > 0) html += `<div class="craft-row"><span>Fuel (LGF)</span><strong>${item.lgf}</strong></div>`;
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
    html += `• Sulfur: <strong>${item.sulfur * count}</strong><br>`;
    if (item.lgf > 0) html += `• Fuel: <strong>${item.lgf * count}</strong><br>`;
    result.innerHTML = html;
    result.classList.add('show');
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ==================== WATCHLIST ====================
async function addToWatchlist() {
    const input = document.getElementById('watch-input').value.trim();
    const result = document.getElementById('watch-result');
    const match = input.match(/\d{17}/);
    if (!match) { result.innerHTML = tr('err_steamid'); result.classList.add('show'); return; }
    result.innerHTML = `<span class="spinner"></span>${tr('analyzing')}`;
    result.classList.add('show');
    try {
        const data = await apiCall('/api/watch-add', { steamId: match[0] });
        result.innerHTML = `✅ <strong>${escapeHtml(data.name)}</strong>`;
        document.getElementById('watch-input').value = '';
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) {
        result.innerHTML = `❌ ${escapeHtml(e.message)}`;
    }
}

async function loadWatchlist() {
    const result = document.getElementById('watchlist-result');
    result.innerHTML = `<span class="spinner"></span>${tr('loading_short')}`;
    result.classList.add('show');
    try {
        const list = await apiCall('/api/watch-list');
        if (!list?.length) { result.innerHTML = tr('watchlist_empty'); return; }
        let html = `<strong>${tr('watching_lbl')}: ${list.length}</strong><br><br>`;
        list.forEach((w, i) => {
            html += `<div style="padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;"><strong>${i+1}. ${escapeHtml(w.name)}</strong><br><small style="color:var(--muted);">${w.steamId}</small><br><small style="color:var(--muted);">VAC: ${w.lastVacBans} · Game: ${w.lastGameBans}</small><br><button class="btn secondary" style="margin-top:8px;padding:8px;font-size:11px;" onclick="removeFromWatchlist('${w.steamId}')">🗑 ${LANG === 'en' ? 'Remove' : 'Удалить'}</button></div>`;
        });
        result.innerHTML = html;
    } catch (e) {
        result.innerHTML = `❌ ${escapeHtml(e.message)}`;
    }
}

async function removeFromWatchlist(steamId) {
    try {
        await apiCall('/api/watch-remove', { steamId });
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        loadWatchlist();
    } catch (e) { tg.showAlert(tr('err_prefix') + e.message); }
}

// ==================== PROFILE MODAL ====================
function openProfileFromSidebar() {
    toggleSidebar();
    document.getElementById('profile-modal').style.display = 'flex';
    loadProfile();
}

function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

async function loadProfile() {
    const container = document.getElementById('profile-content');
    container.innerHTML = `<div class="loading-block">${tr('profile_loading')}</div>`;
    try {
        const profile = await apiCall('/api/profile');
        USER_DATA = profile;
        LANG = profile.settings?.language || LANG;
        SETTINGS = { ...SETTINGS, ...(profile.settings || {}) };
        applyTheme(SETTINGS.theme);
        updateUserUI(profile);

        const dateFmt = (ts) => {
            const d = new Date(ts);
            return {
                date: d.toLocaleDateString(LANG === 'en' ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                time: d.toLocaleTimeString(LANG === 'en' ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit' })
            };
        };

        let premiumHtml = '';
        if (profile.premium && profile.premiumExpires) {
            const { date, time } = dateFmt(profile.premiumExpires);
            premiumHtml = `<div class="premium-status active"><div class="premium-status-icon">⭐</div><div class="premium-status-info"><div class="premium-status-title">${tr('profile_premium_active')}</div><div class="premium-status-date">${tr('until_lbl')} <b>${date}</b> ${tr('at_lbl')} <b>${time}</b></div><div class="premium-status-days">${tr('days_left')}: <b>${profile.daysLeft} ${tr('days_short')}</b></div></div></div>`;
        } else if (profile.premium) {
            premiumHtml = `<div class="premium-status active"><div class="premium-status-icon">👑</div><div class="premium-status-info"><div class="premium-status-title">${tr('profile_premium_admin')}</div><div class="premium-status-date">${tr('profile_admin_perm')}</div></div></div>`;
        } else {
            premiumHtml = `<div class="premium-status inactive"><div class="premium-status-icon">❌</div><div class="premium-status-info"><div class="premium-status-title">${tr('profile_premium_inactive')}</div><div class="premium-status-date">${tr('profile_premium_hint')}</div></div></div>`;
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
                <div class="stat-profile-box"><div class="stat-profile-value">${profile.remainingChecks}</div><div class="stat-profile-label">${tr('checks_lbl')}</div></div>
                <div class="stat-profile-box"><div class="stat-profile-value">${profile.watchlistCount}</div><div class="stat-profile-label">${tr('watchlist_lbl')}</div></div>
                <div class="stat-profile-box"><div class="stat-profile-value">${profile.referral.count}</div><div class="stat-profile-label">${tr('refs_lbl')}</div></div>
            </div>
        `;

        if (profile.discount) {
            const { date, time } = dateFmt(profile.discount.expiresAt);
            html += `<div class="premium-status active" style="background:linear-gradient(135deg,rgba(34,211,238,.1),rgba(34,211,238,.03));border-color:rgba(34,211,238,.35);">
                <div class="premium-status-icon">💰</div>
                <div class="premium-status-info">
                    <div class="premium-status-title">${tr('discount_lbl')} ${profile.discount.percent}%</div>
                    <div class="premium-status-date">${tr('until_lbl')} <b>${date}</b> ${tr('at_lbl')} <b>${time}</b></div>
                    <div class="premium-status-days">${tr('on_premium_buy')}</div>
                </div>
            </div>`;
        }

        html += `<div class="card">
            <div class="card-head"><h3>${tr('actions_title')}</h3></div>
            ${!profile.premium ? `<button class="btn primary pill" onclick="openPremiumFromProfile()">${tr('btn_buy_premium')}</button>` : ''}
            ${!profile.trialUsed ? `<button class="btn secondary pill" style="margin-top:8px" onclick="activateTrial()">${tr('btn_trial')} ${profile.trialDays} ${tr('days_word')}</button>` : ''}
            <button class="btn secondary pill" style="margin-top:8px" onclick="showPromoInput()">${tr('btn_activate_promo')}</button>
            <button class="btn secondary pill" style="margin-top:8px" onclick="openReferral()">${tr('btn_ref_link')}</button>
            ${profile.isAdmin ? `<button class="btn danger pill" style="margin-top:8px" onclick="closeProfileModal(); openAdminPanel();">${tr('btn_admin_panel')}</button>` : ''}
        </div>`;
        container.innerHTML = html;

        if (!profile.isAdmin) {
            ['admin-panel', 'admin-ticket-chat', 'edit-promo-modal'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
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

function openPremiumFromProfile() {
    closeProfileModal();
    goToTab('steam');
    tg.showAlert(tr('open_bot'));
}

async function activateTrial() {
    const promo = prompt(LANG === 'en' ? 'Enter trial promo:' : 'Введи промокод для пробной:');
    if (!promo) return;
    try {
        const result = await apiCall('/api/activate-trial', { promo });
        tg.showAlert(`${tr('trial_activated')} ${result.days} ${tr('days_word')}!`);
        loadProfile();
    } catch (e) { tg.showAlert(tr('err_prefix') + e.message); }
}

function showPromoInput() {
    const code = prompt(LANG === 'en' ? 'Enter promo:' : 'Введи промокод:');
    if (!code) return;
    apiCall('/api/use-promo', { code }).then(result => {
        tg.showAlert(`${tr('promo_activated')}: ${result.message}`);
        if (document.getElementById('profile-modal').style.display === 'flex') loadProfile();
    }).catch(e => tg.showAlert(tr('err_prefix') + e.message));
}

async function openReferral() {
    try {
        const profile = await apiCall('/api/profile');
        const link = profile.referral.link;
        tg.showPopup({
            title: tr('ref_title'),
            message: `${tr('ref_invited')}: ${profile.referral.count}\n${tr('ref_bonus')}: ${profile.referral.bonusChecks}\n\n${link}\n\n${tr('ref_hint')}`,
            buttons: [
                { id: 'copy', type: 'default', text: tr('ref_copy') },
                { id: 'share', type: 'default', text: tr('ref_share') },
                { id: 'cancel', type: 'cancel' }
            ]
        }, (id) => {
            if (id === 'copy') { navigator.clipboard.writeText(link); tg.showAlert(tr('ref_copied')); }
            if (id === 'share') { tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}`); }
        });
    } catch (e) { tg.showAlert(tr('err_prefix') + e.message); }
}

function openBotLink() {
    tg.openTelegramLink('https://t.me/rustplusplusss_bot');
}

// ==================== SIDEBAR ====================
function toggleSidebar() {
    const sb = document.getElementById('profile-sidebar');
    if (!sb) return;
    sb.classList.toggle('open');
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
    set('set-notifications', SETTINGS.notifications);
    set('set-watch-notifications', SETTINGS.watchNotifications);
    set('set-haptic', SETTINGS.haptic);
    updateSegActive();
}

// ==================== SUPPORT MODAL ====================
let currentTicket = null;
let pollInterval = null;

function openSupportFromSidebar() {
    toggleSidebar();
    document.getElementById('support-modal').style.display = 'flex';
    loadSupport();
}

function openSupportFromFloat() {
    document.getElementById('support-modal').style.display = 'flex';
    loadSupport();
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
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
    if (currentTicket.status === 'waiting') {
        banner.classList.remove('hidden');
        if (desc) desc.textContent = tr('chat_waiting');
    } else if (currentTicket.status === 'admin_connected') {
        banner.classList.add('hidden');
        if (desc) desc.textContent = tr('chat_connected');
    } else {
        banner.classList.add('hidden');
        if (desc) desc.textContent = tr('chat_finished');
    }
}

async function createTicket() {
    const message = document.getElementById('support-first-message').value.trim();
    if (!message || message.length < 10) {
        tg.showAlert(LANG === 'en' ? 'Describe problem (min 10 chars)' : 'Опиши проблему подробнее (мин. 10 символов)');
        return;
    }
    try {
        const data = await apiCall('/api/support/create', { message });
        currentTicket = data.ticket;
        document.getElementById('support-start').style.display = 'none';
        document.getElementById('support-chat').style.display = 'flex';
        document.getElementById('support-first-message').value = '';
        renderSupportMessages();
        updateSupportStatus();
        startPolling();
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) { tg.showAlert(tr('err_prefix') + e.message); }
}

async function closeMyTicket() {
    const confirmed = await new Promise(res => tg.showConfirm(tr('confirm_close_ticket'), res));
    if (!confirmed) return;
    try {
        await apiCall('/api/support/close-my-ticket');
        tg.showAlert(tr('ticket_closed'));
        currentTicket = null;
        document.getElementById('support-chat').style.display = 'none';
        document.getElementById('support-start').style.display = 'block';
    } catch (e) { tg.showAlert(tr('err_prefix') + e.message); }
}

function renderSupportMessages() {
    if (!currentTicket) return;
    const container = document.getElementById('support-messages');
    let html = '';
    currentTicket.messages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString(LANG === 'en' ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit' });
        html += `<div class="chat-msg ${msg.role}">${escapeHtml(msg.text)}<span class="chat-msg-time">${time}</span></div>`;
    });
    if (currentTicket.status === 'waiting') html += `<div class="chat-msg system">${tr('chat_waiting_sys')}</div>`;
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
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    } catch (e) { tg.showAlert(tr('err_prefix') + e.message); }
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
                    if (currentTicket.messages.length > oldLen && SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                }
            }
        } catch (e) {}
    }, 5000);
}

// ==================== ADMIN TICKETS ====================
let currentAdminTicket = null;
let adminTicketPoll = null;

async function loadAdminTickets() {
    try {
        const data = await apiCall('/api/support/admin/tickets');
        const container = document.getElementById('admin-tickets-list');
        if (!data.tickets?.length) { container.innerHTML = `<p style="text-align:center;opacity:.5;padding:20px;">${tr('no_tickets')}</p>`; return; }
        let html = '';
        data.tickets.forEach(ticket => {
            const isUnread = ticket.status === 'waiting';
            const st = { 'waiting': '⏳', 'admin_connected': '💬', 'closed': '✅' }[ticket.status];
            const un = ticket.username ? `@${ticket.username}` : '—';
            html += `<div class="ticket-item ${isUnread ? 'unread' : ''}" onclick="openAdminTicket('${ticket.id}')">
                <div class="ticket-icon">${isUnread ? '🔴' : '💬'}</div>
                <div class="ticket-info">
                    <div class="ticket-name">${escapeHtml(ticket.firstName)} · ${un}</div>
                    <div class="ticket-preview">${escapeHtml(ticket.lastMessage.substring(0, 50))}</div>
                </div>
                <div class="ticket-status ${ticket.status}">${st}</div>
            </div>`;
        });
        container.innerHTML = html;
    } catch (e) { console.error(e); }
}

async function openAdminTicket(ticketId) {
    try {
        const data = await apiCall('/api/support/admin/ticket', { ticketId });
        currentAdminTicket = data.ticket;
        document.getElementById('admin-ticket-name').textContent = currentAdminTicket.firstName || 'User';
        document.getElementById('admin-ticket-sub').textContent = (currentAdminTicket.username ? '@' + currentAdminTicket.username + ' · ' : '') + 'ID: ' + currentAdminTicket.userId;
        document.getElementById('admin-ticket-avatar').innerHTML = `<span>👤</span>`;
        renderAdminTicketMessages();
        document.getElementById('admin-ticket-chat').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
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
    } catch (e) { tg.showAlert(tr('err_prefix') + e.message); }
}

function renderAdminTicketMessages() {
    if (!currentAdminTicket) return;
    const c = document.getElementById('admin-ticket-messages');
    let html = '';
    currentAdminTicket.messages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString(LANG === 'en' ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit' });
        const visualRole = msg.role === 'admin' ? 'user' : 'admin';
        html += `<div class="chat-msg ${visualRole}">${escapeHtml(msg.text)}<span class="chat-msg-time">${time}</span></div>`;
    });
    if (currentAdminTicket.status === 'waiting') html += `<div class="chat-msg system">${tr('chat_need_reply')}</div>`;
    else if (currentAdminTicket.status === 'closed') html += `<div class="chat-msg system">${tr('chat_closed_sys')}</div>`;
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
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    } catch (e) { tg.showAlert(tr('err_prefix') + e.message); }
}

function closeAdminTicketChat() {
    if (adminTicketPoll) { clearInterval(adminTicketPoll); adminTicketPoll = null; }
    document.getElementById('admin-ticket-chat').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
    loadAdminTickets();
}

async function closeAdminTicket() {
    if (!currentAdminTicket) return;
    const confirmed = await new Promise(res => tg.showConfirm(tr('confirm_close_ticket'), res));
    if (!confirmed) return;
    try {
        await apiCall('/api/support/admin/close', { ticketId: currentAdminTicket.id });
        tg.showAlert(tr('admin_close_ok'));
        closeAdminTicketChat();
    } catch (e) { tg.showAlert(tr('err_prefix') + e.message); }
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
        const a = tab.dataset.atab;
        if (a === 'stats') adminLoadStats();
        if (a === 'users') adminLoadUsers();
        if (a === 'promos') adminLoadPromos();
        if (a === 'tickets') loadAdminTickets();
        if (a === 'broadcast') loadBroadcastTemplates();
    });
});

async function adminLoadStats() {
    const c = document.getElementById('admin-stats-content');
    c.innerHTML = `<div class="loading-block">${tr('loading_short')}</div>`;
    try {
        const s = await apiCall('/api/admin/stats');
        c.innerHTML = `
            <div class="stats-profile-grid">
                <div class="stat-profile-box"><div class="stat-profile-value">${s.totalUsers}</div><div class="stat-profile-label">${tr('users_short')}</div></div>
                <div class="stat-profile-box"><div class="stat-profile-value">${s.premiumUsers}</div><div class="stat-profile-label">${tr('premium_short')}</div></div>
                <div class="stat-profile-box"><div class="stat-profile-value">${s.purchasedUsers || 0}</div><div class="stat-profile-label">${tr('purchased_short')}</div></div>
            </div>
            <div class="stats-profile-grid">
                <div class="stat-profile-box"><div class="stat-profile-value">${s.totalRevenue || 0}</div><div class="stat-profile-label">${tr('revenue_short')}</div></div>
                <div class="stat-profile-box"><div class="stat-profile-value">${s.totalReferrals}</div><div class="stat-profile-label">${tr('refs_short')}</div></div>
                <div class="stat-profile-box"><div class="stat-profile-value">${s.todayChecks}</div><div class="stat-profile-label">${tr('today_checks')}</div></div>
            </div>`;
    } catch (e) { c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`; }
}

async function adminLoadUsers() {
    const c = document.getElementById('admin-users-content');
    c.innerHTML = `<div class="loading-block">${tr('loading_short')}</div>`;
    try {
        const data = await apiCall('/api/admin/users');
        if (!data.users?.length) { c.innerHTML = `<div class="loading-block">${tr('no_users')}</div>`; return; }
        let html = '';
        data.users.slice(0, 50).forEach(u => {
            const un = u.username ? `@${u.username}` : '—';
            const pi = u.premium ? '⭐' : '👤';
            let exp = '';
            if (u.premiumExpires) { const d = new Date(u.premiumExpires); exp = `${tr('until_lbl')} ${d.toLocaleDateString(LANG === 'en' ? 'en-US' : 'ru-RU')}`; }
            html += `<div class="promo-item"><div><div class="promo-code">${pi} ${escapeHtml(u.firstName || '—')}</div><div class="promo-details">${un} · ID: ${u.userId}</div><div class="promo-details">${exp} · 👁️ ${u.watchlistCount}</div></div></div>`;
        });
        c.innerHTML = html;
    } catch (e) { c.innerHTML = `<div class="result show">❌ ${escapeHtml(e.message)}</div>`; }
}

async function adminGivePremium() {
    const target = document.getElementById('admin-premium-target').value.trim();
    const days = parseInt(document.getElementById('admin-premium-days').value) || 30;
    const result = document.getElementById('admin-premium-result');
    if (!target) { result.innerHTML = `❌ ${tr('admin_target')}`; result.classList.add('show'); return; }
    result.innerHTML = `<span class="spinner"></span>${tr('sending_run')}`;
    result.classList.add('show');
    try {
        let targetId = target;
        if (target.startsWith('@')) {
            const u = await apiCall('/api/admin/users');
            const f = u.users.find(x => x.username?.toLowerCase() === target.replace('@', '').toLowerCase());
            if (!f) throw new Error('Not found');
            targetId = f.userId;
        }
        await apiCall('/api/admin/give-premium', { targetId: parseInt(targetId), days });
        result.innerHTML = `${tr('premium_given')} ${days} ${tr('days_short')}`;
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}

async function adminRevokePremium() {
    const target = document.getElementById('admin-premium-target').value.trim();
    const result = document.getElementById('admin-premium-result');
    if (!target) { result.innerHTML = `❌ ${tr('admin_target')}`; result.classList.add('show'); return; }
    result.innerHTML = `<span class="spinner"></span>${tr('sending_run')}`;
    result.classList.add('show');
    try {
        let targetId = target;
        if (target.startsWith('@')) {
            const u = await apiCall('/api/admin/users');
            const f = u.users.find(x => x.username?.toLowerCase() === target.replace('@', '').toLowerCase());
            if (!f) throw new Error('Not found');
            targetId = f.userId;
        }
        await apiCall('/api/admin/revoke-premium', { targetId: parseInt(targetId) });
        result.innerHTML = `✅`;
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}

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
    if (!code) { tg.showAlert('Code'); return; }
    try {
        await apiCall('/api/admin/create-promo', { code, type, days, checks, percent, maxUses, validDays, onlyNew, broadcast });
        if (broadcast) tg.showAlert(tr('sending_bg'));
        else tg.showAlert('✅');
        adminHidePromoCreate();
        document.getElementById('promo-code').value = '';
        document.getElementById('promo-max-uses').value = '';
        document.getElementById('promo-valid-days').value = '';
        document.getElementById('promo-only-new').checked = false;
        document.getElementById('promo-broadcast').checked = false;
        adminLoadPromos();
    } catch (e) { tg.showAlert(tr('err_prefix') + e.message); }
}

async function adminLoadPromos() {
    const c = document.getElementById('admin-promos-list');
    c.innerHTML = `<div class="loading-block">${tr('loading_short')}</div>`;
    try {
        const data = await apiCall('/api/admin/promo-list');
        if (!data.promos?.length) { c.innerHTML = `<div class="loading-block">${tr('no_promos')}</div>`; return; }
        window.__promosCache = data.promos;
        const now = Date.now();
        let html = '';
        data.promos.forEach(p => {
            let tt = '';
            if (p.type === 'premium') tt = `⭐ ${p.days} ${tr('promo_days_badge')}`;
            else if (p.type === 'checks') tt = `🎮 +${p.checks}`;
            else if (p.type === 'discount') tt = `💰 ${p.percent}%`;
            const ut = p.maxUses ? `${tr('promo_uses_lbl')}: ${p.uses}/${p.maxUses}` : `${tr('promo_uses_lbl')}: ${p.uses}`;
            let et = '', eb = '';
            if (p.expiresAt) {
                const d = new Date(p.expiresAt);
                if (p.expiresAt < now) { et = `${tr('promo_expired_lbl')}: ${d.toLocaleDateString(LANG === 'en' ? 'en-US' : 'ru-RU')}`; eb = `<span class="promo-badge expired">${tr('promo_expired_lbl')}</span>`; }
                else { const dl = Math.ceil((p.expiresAt - now) / 86400000); et = `${tr('promo_until_lbl')}: ${d.toLocaleDateString(LANG === 'en' ? 'en-US' : 'ru-RU')} (${dl} ${tr('days_short')})`; eb = `<span class="promo-badge temp">${tr('promo_temp_lbl')}</span>`; }
            } else { et = tr('promo_forever_lbl'); eb = `<span class="promo-badge active">${tr('promo_active_lbl')}</span>`; }
            const lb = p.maxUses ? `<span class="promo-badge limited">${tr('promo_limit_lbl')} ${p.maxUses}</span>` : '';
            const nb = p.onlyNew ? `<span class="promo-badge temp">${tr('promo_only_new_lbl')}</span>` : '';
            html += `<div class="promo-item">
                <div style="flex:1;min-width:0;">
                    <div class="promo-code">${escapeHtml(p.code)}</div>
                    <div class="promo-details">${tt}</div>
                    <div class="promo-details">${ut}</div>
                    <div class="promo-details">${et}</div>
                    <div class="promo-stats">${eb} ${lb} ${nb}</div>
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
    if (!confirm(`${tr('confirm_delete_promo')} ${code}?`)) return;
    try {
        await apiCall('/api/admin/delete-promo', { code });
        tg.showAlert('✅');
        adminLoadPromos();
    } catch (e) { tg.showAlert(tr('err_prefix') + e.message); }
}

// ==================== EDIT PROMO ====================
let editingPromo = null;

function openEditPromo(code) {
    const promos = window.__promosCache || [];
    const promo = promos.find(p => p.code === code);
    if (!promo) { tg.showAlert('Promo not found'); return; }
    editingPromo = promo;
    document.getElementById('edit-promo-code').value = promo.code;
    document.getElementById('edit-promo-code-view').value = promo.code;
    const valField = document.getElementById('edit-promo-value-field');
    const valLabel = document.getElementById('edit-promo-value-label');
    const valInput = document.getElementById('edit-promo-value');
    if (promo.type === 'premium') { valLabel.textContent = tr('promo_days'); valInput.value = promo.days; valField.style.display = 'block'; }
    else if (promo.type === 'checks') { valLabel.textContent = tr('promo_checks'); valInput.value = promo.checks; valField.style.display = 'block'; }
    else if (promo.type === 'discount') { valLabel.textContent = tr('promo_percent'); valInput.value = promo.percent; valField.style.display = 'block'; }
    document.getElementById('edit-promo-max-uses').value = promo.maxUses || '';
    if (promo.expiresAt) {
        const days = Math.max(1, Math.ceil((promo.expiresAt - Date.now()) / 86400000));
        document.getElementById('edit-promo-valid-days').value = days;
    } else {
        document.getElementById('edit-promo-valid-days').value = '';
    }
    document.getElementById('edit-promo-only-new').checked = !!promo.onlyNew;
    document.getElementById('edit-promo-result').classList.remove('show');
    document.getElementById('edit-promo-modal').style.display = 'flex';
}

function closeEditPromo() {
    document.getElementById('edit-promo-modal').style.display = 'none';
    editingPromo = null;
}

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
        result.innerHTML = `✅ ${tr('promo_updated')}`;
        result.classList.add('show');
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        setTimeout(() => { closeEditPromo(); adminLoadPromos(); }, 800);
    } catch (e) {
        result.innerHTML = `❌ ${escapeHtml(e.message)}`;
        result.classList.add('show');
    }
}

// ==================== BROADCAST ====================
let broadcastTemplates = {};

async function loadBroadcastTemplates() {
    const select = document.getElementById('broadcast-template');
    if (select.dataset.loaded === '1') return;
    try {
        const data = await apiCall('/api/admin/broadcast-templates');
        broadcastTemplates = data.templates;
        select.innerHTML = `<option value="">— ${tr('admin_choose_template')} —</option>` +
            Object.entries(broadcastTemplates).map(([k, t]) => `<option value="${k}">${escapeHtml(t.title)}</option>`).join('');
        select.dataset.loaded = '1';
    } catch (e) { console.error(e); }
}

function applyBroadcastTemplate() {
    const key = document.getElementById('broadcast-template').value;
    if (!key || !broadcastTemplates[key]) return;
    document.getElementById('admin-broadcast-text').value = broadcastTemplates[key].text;
    if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function adminPreviewBroadcast() {
    const text = document.getElementById('admin-broadcast-text').value.trim();
    const preview = document.getElementById('admin-broadcast-preview');
    if (!text) { preview.innerHTML = tr('empty_lbl'); preview.classList.add('show'); return; }
    preview.innerHTML = `<div style="opacity:.55;font-size:11px;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">${tr('preview_lbl')}</div>${text}`;
    preview.classList.add('show');
}

async function adminSendBroadcast() {
    const text = document.getElementById('admin-broadcast-text').value.trim();
    const result = document.getElementById('admin-broadcast-result');
    if (!text) { result.innerHTML = tr('empty_lbl'); result.classList.add('show'); return; }
    const confirmed = await new Promise(res => tg.showConfirm(tr('confirm_broadcast'), res));
    if (!confirmed) return;
    result.innerHTML = `<span class="spinner"></span>${tr('sending_run')}`;
    result.classList.add('show');
    try {
        const data = await apiCall('/api/admin/broadcast', { text });
        result.innerHTML = `${tr('broadcast_sent')} <b>${data.total}</b>`;
        if (SETTINGS.haptic && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) { result.innerHTML = `❌ ${escapeHtml(e.message)}`; }
}

// ==================== HELPERS ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== HASH ROUTING ====================
async function handleHashRoute() {
    const hash = location.hash || '';
    if (hash.startsWith('#ticket=')) {
        const ticketId = hash.replace('#ticket=', '');
        if (!USER_DATA) {
            try { USER_DATA = await apiCall('/api/profile'); } catch (e) {}
        }
        if (USER_DATA?.isAdmin) {
            document.getElementById('admin-panel').style.display = 'flex';
            setTimeout(() => openAdminTicket(ticketId).catch(() => {
                document.getElementById('admin-panel').style.display = 'none';
                openSupportFromFloat();
            }), 300);
        } else {
            document.getElementById('support-modal').style.display = 'flex';
            loadSupport();
        }
        history.replaceState(null, '', location.pathname);
    }
}

// ==================== INIT ====================
async function init() {
    const tgLang = (tg.initDataUnsafe?.user?.language_code || 'ru').startsWith('en') ? 'en' : 'ru';
    LANG = tgLang;
    SETTINGS.language = tgLang;

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
        if (!p.isAdmin) {
            ['admin-panel', 'admin-ticket-chat', 'edit-promo-modal'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
        }
    } catch (e) { console.warn('init failed', e); }

    renderRaidItems();
    updateCraftInfo();
    updateSegActive();

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
            if (SETTINGS.theme === 'auto') applyTheme('auto');
        });
    }

    await handleHashRoute();
}

window.addEventListener('hashchange', handleHashRoute);

init();
