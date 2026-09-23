const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Применяем тему Telegram
if (tg.themeParams && tg.themeParams.bg_color) {
    document.documentElement.style.setProperty('--tg-bg', tg.themeParams.bg_color);
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
    explo:   'Explosive 5.56 (патрон)'
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
    if (cost.lgf === 0) {
        limiter = 'серой (топливо не нужно)';
    } else if (bySulfur < byLgf) {
        limiter = 'серой';
    } else if (byLgf < bySulfur) {
        limiter = 'топливом';
    } else {
        limiter = 'серой и топливом одновременно';
    }

    const sulfurUsed = count * cost.sulfur;
    const lgfUsed = count * cost.lgf;
    const sulfurLeft = sulfur - sulfurUsed;
    const lgfLeft = lgf - lgfUsed;

    let html = `<strong>${name}</strong><br><br>`;
    html += `Можно скрафтить: <strong>${count} шт.</strong><br>`;
    html += `Ограничитель: ${limiter}<br><br>`;
    html += `<strong>Расход ресурсов:</strong><br>`;
    html += `• Сера: ${sulfurUsed} из ${sulfur} (остаток: <strong>${sulfurLeft}</strong>)<br>`;

    if (cost.lgf > 0) {
        html += `• Топливо: ${lgfUsed} из ${lgf} (остаток: <strong>${lgfLeft}</strong>)<br>`;
    }

    html += `<br><small>На 1 ${name}: ${cost.sulfur} серы`;
    if (cost.lgf > 0) html += ` + ${cost.lgf} LGF`;
    html += `</small>`;

    resultDiv.innerHTML = html;
    resultDiv.classList.add('show');

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ==================== STEAM АНАЛИЗ ====================
const STEAM_ID_REGEX = /\d{17}/;

async function analyzeSteam() {
    const input = document.getElementById('steam-input').value.trim();
    const resultDiv = document.getElementById('steam-result');

    const match = input.match(STEAM_ID_REGEX);
    if (!match) {
        resultDiv.innerHTML = '❌ Введи SteamID (17 цифр) или ссылку на профиль.';
        resultDiv.classList.add('show');
        return;
    }

    const steamId = match[0];
    resultDiv.innerHTML = '⏳ Анализ запущен...<br><br>Открой бота и напиши:<br><code>/steam ' + steamId + '</code>';
    resultDiv.classList.add('show');

    // Копируем команду в буфер обмена
    try {
        await navigator.clipboard.writeText(`/steam ${steamId}`);
        resultDiv.innerHTML = '✅ Команда скопирована!<br><br>Открой бота и вставь:<br><code>/steam ' + steamId + '</code><br><br><small>Анализ профиля работает через бота.</small>';
    } catch (e) {
        // Fallback — просто показываем
    }

    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

// ==================== БЕСПЛАТНЫЕ ИГРЫ ====================
async function loadFreeGames() {
    const resultDiv = document.getElementById('free-result');
    resultDiv.innerHTML = '⏳ Загружаю раздачи...';
    resultDiv.classList.add('show');

    try {
        const res = await fetch('https://www.gamerpower.com/api/giveaways?platform=steam&type=game');
        const data = await res.json();
        const active = data.filter(g => g.status === 'Active');

        if (active.length === 0) {
            resultDiv.innerHTML = '😕 Сейчас нет активных Steam-раздач.<br><br>Проверь позже — бот уведомит автоматически.';
            return;
        }

        let html = `<strong>🎁 Найдено: ${active.length}</strong><br><br>`;

        active.slice(0, 8).forEach((game, i) => {
            html += `<div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border);">`;
            html += `<strong>${i + 1}. ${game.title}</strong><br>`;
            if (game.worth && game.worth !== 'N/A') {
                html += `<small>💰 <s>${game.worth}</s> → 🎁 БЕСПЛАТНО</small><br>`;
            }
            html += `<a href="${game.open_giveaway_url}" target="_blank" style="color: var(--accent-light);">⬇️ Забрать</a>`;
            html += `</div>`;
        });

        resultDiv.innerHTML = html;

        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    } catch (e) {
        resultDiv.innerHTML = '❌ Не удалось загрузить раздачи. Попробуй позже.';
    }
}

// ==================== WATCHLIST ====================
function openBotForWatch() {
    const input = document.getElementById('watch-input').value.trim();
    const match = input.match(STEAM_ID_REGEX);

    if (!match) {
        alert('Введи SteamID (17 цифр)');
        return;
    }

    // Копируем команду
    const command = `/watch add ${match[0]}`;
    navigator.clipboard.writeText(command).then(() => {
        alert(`Команда скопирована:\n${command}\n\nОткрой бота и вставь её.`);
    }).catch(() => {
        alert(`Скопируй вручную:\n${command}`);
    });

    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
// Показываем имя пользователя в консоли (для отладки)
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    console.log('👤', tg.initDataUnsafe.user.first_name || 'User');
}
