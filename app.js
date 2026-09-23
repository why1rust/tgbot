const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// === Вкладки ===
function switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[onclick*="${name}"]`).classList.add('active');
    document.getElementById(name).classList.add('active');
}

// === Рейд-калькулятор ===
function calculateRaid() {
    const sulfur = parseInt(document.getElementById('sulfur').value) || 0;
    const target = document.getElementById('target').value;

    // Стоимость в сере (примерные значения для стен)
    const costs = {
        stone: 200,
        sheet: 400,
        hqm: 800,
        garage: 300,
        armored: 1000
    };

    const needed = Math.ceil(costs[target] * (sulfur / 1000));
    const result = document.getElementById('raid-result');
    result.innerText = `На ${sulfur} серы нужно ${needed} ед. для цели "${target}"`;
    result.classList.add('show');

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// === Калькулятор генов (упрощённое скрещивание) ===
function parseGenes(str) {
    return str.trim().toUpperCase().split(/\s+/).filter(g => 'GYHWX'.includes(g));
}

function calculateCrossbreed() {
    const p1 = parseGenes(document.getElementById('plant1').value);
    const p2 = parseGenes(document.getElementById('plant2').value);
    const result = document.getElementById('gene-result');

    if (p1.length !== 6 || p2.length !== 6) {
        result.innerText = '❌ Нужно ровно 6 генов у каждого растения';
        result.classList.add('show');
        return;
    }

    // Веса генов: G/Y/H = 0.6, W/X = 1.0 [citation:7]
    const weights = { G: 0.6, Y: 0.6, H: 0.6, W: 1.0, X: 1.0 };

    let child = [];
    for (let i = 0; i < 6; i++) {
        const g1 = p1[i];
        const g2 = p2[i];

        if (g1 === g2) {
            child.push(g1);
        } else {
            const w1 = weights[g1] || 0;
            const w2 = weights[g2] || 0;

            if (w1 > w2) child.push(g1);
            else if (w2 > w1) child.push(g2);
            else child.push(Math.random() < 0.5 ? g1 : g2); // ничья
        }
    }

    const childStr = child.join(' ');
    const redCount = child.filter(g => g === 'W' || g === 'X').length;

    let quality = '🔴 Плохой';
    if (redCount === 0) quality = '🟢 Идеальный (god clone)';
    else if (redCount <= 2) quality = '🟡 Средний';
    else if (redCount <= 4) quality = '🟠 Слабый';

    result.innerHTML =
        `<div class="result-line">🧬 Ребёнок: <b>${childStr}</b></div>` +
        `<div class="result-line">${quality} (красных генов: ${redCount})</div>`;
    result.classList.add('show');

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
}

// === Сервера (заглушка) ===
function addServer() {
    const ip = document.getElementById('server-ip').value.trim();
    if (!ip) return;

    const list = document.getElementById('server-list');
    const div = document.createElement('div');
    div.className = 'result-line';
    div.innerText = `📡 ${ip} — добавлен`;
    list.appendChild(div);
    list.classList.add('show');

    document.getElementById('server-ip').value = '';

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// === Профиль из Telegram ===
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    document.getElementById('user-name').innerText = user.first_name || 'Без имени';
    document.getElementById('user-id').innerText = user.id || '—';
}
