const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ==================== ВКЛАДКИ ====================
function switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[onclick*="${name}"]`).classList.add('active');
    document.getElementById(name).classList.add('active');

    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

// ==================== КОНВЕРТЕР СЕРЫ И ТОПЛИВА ====================
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

    // Сколько можно скрафтить из имеющихся ресурсов (floor — реально возможное)
    const bySulfur = Math.floor(sulfur / cost.sulfur);
    const byLgf = cost.lgf > 0 ? Math.floor(lgf / cost.lgf) : Infinity;
    const count = Math.min(bySulfur, byLgf);

    // Что ограничивает крафт
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

    // Остатки ресурсов
    const sulfurUsed = count * cost.sulfur;
    const lgfUsed = count * cost.lgf;
    const sulfurLeft = sulfur - sulfurUsed;
    const lgfLeft = lgf - lgfUsed;

    // Формирование результата
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

// ==================== КАЛЬКУЛЯТОР ГЕНОВ ====================
const GENE_WEIGHTS = { G: 0.6, Y: 0.6, H: 0.6, W: 1.0, X: 1.0 };
const GREEN_GENES = ['G', 'Y', 'H'];

function parseGenes(str) {
    return str.trim().toUpperCase().split(/\s+/).filter(g => 'GYHWX'.includes(g));
}

// Симуляция скрещивания: центр защищается, доноры атакуют
function simulateCrossbreed(center, donors) {
    const result = [];
    let tieChance = 1;

    for (let slot = 0; slot < 6; slot++) {
        const centerGene = center[slot];
        const centerWeight = GENE_WEIGHTS[centerGene] || 0;

        // Считаем вес каждого гена от доноров в этом слоте
        const weights = {};
        donors.forEach(donor => {
            const gene = donor[slot];
            if (gene) {
                weights[gene] = (weights[gene] || 0) + (GENE_WEIGHTS[gene] || 0);
            }
        });

        // Находим ген(ы) с максимальным весом
        let maxWeight = 0;
        let winners = [];
        for (const [gene, weight] of Object.entries(weights)) {
            if (weight > maxWeight) {
                maxWeight = weight;
                winners = [gene];
            } else if (weight === maxWeight) {
                winners.push(gene);
            }
        }

        // Правило строгого превосходства: донор побеждает только если строго больше
        if (maxWeight > centerWeight) {
            if (winners.length === 1) {
                result.push(winners[0]);
            } else {
                // Ничья между несколькими генами: 50/50 на каждый
                tieChance *= 0.5;
                result.push(winners[0]);
            }
        } else {
            // Центр защитился
            result.push(centerGene);
        }
    }

    return { genes: result, chance: tieChance };
}

// Перебор комбинаций доноров (для поиска лучшего маршрута)
function* combinations(arr, k) {
    if (k === 0) {
        yield [];
        return;
    }
    if (arr.length < k) return;
    const [first, ...rest] = arr;
    for (const combo of combinations(rest, k - 1)) {
        yield [first, ...combo];
    }
    yield* combinations(rest, k);
}

function findBestRoute(center, availableClones, target) {
    const maxDonors = 3; // ограничение для производительности
    let best = null;

    for (let k = 1; k <= maxDonors && k <= availableClones.length; k++) {
        for (const combo of combinations(availableClones, k)) {
            const sim = simulateCrossbreed(center, combo);
            const match = sim.genes.join('') === target;

            if (match) {
                const chance = sim.chance;
                if (!best || chance > best.chance) {
                    best = { donors: combo, chance, genes: sim.genes };
                }
            }
        }
    }

    return best;
}

function calculateGenes() {
    const input = document.getElementById('gene-input').value;
    const target = document.getElementById('gene-target').value.trim().toUpperCase();
    const resultDiv = document.getElementById('gene-result');

    // Парсинг клонов
    const clones = input.split('\n')
        .map(line => line.trim().toUpperCase().replace(/\s+/g, ''))
        .filter(line => line.length === 6 && /^[GYHWX]+$/.test(line));

    if (clones.length < 2) {
        resultDiv.innerHTML = '❌ Нужно минимум 2 клона (по 6 букв каждый: G, Y, H, W, X).';
        resultDiv.classList.add('show');
        return;
    }

    if (target.length !== 6 || !/^[GYHWX]+$/.test(target)) {
        resultDiv.innerHTML = '❌ Цель должна состоять из 6 букв G, Y, H, W, X.';
        resultDiv.classList.add('show');
        return;
    }

    // Ищем лучший маршрут: каждый клон по очереди становится центром
    let bestOverall = null;

    for (const center of clones) {
        const donors = clones.filter(c => c !== center);
        const route = findBestRoute(center, donors, target);

        if (route && (!bestOverall || route.chance > bestOverall.chance)) {
            bestOverall = { center, ...route };
        }
    }

    if (!bestOverall) {
        resultDiv.innerHTML = '😕 Не удалось найти комбинацию для достижения цели.<br><br>Попробуй добавить больше клонов или изменить цель.';
        resultDiv.classList.add('show');
        return;
    }

    // Форматирование
    const formatGenes = (genesStr) => {
        return genesStr.split('').map(g =>
            `<span class="gene-box ${GREEN_GENES.includes(g) ? 'green' : 'red'}">${g}</span>`
        ).join('');
    };

    const centerHtml = formatGenes(bestOverall.center);
    const resultHtml = formatGenes(bestOverall.genes.join(''));

    let donorsHtml = '';
    bestOverall.donors.forEach((donor, i) => {
        donorsHtml += `<div style="margin: 4px 0;">Донор ${i + 1}: ${formatGenes(donor)}</div>`;
    });

    const chancePercent = Math.round(bestOverall.chance * 100);
    const chanceColor = chancePercent === 100 ? '#4caf50' : chancePercent >= 50 ? '#ff9800' : '#f44336';

    resultDiv.innerHTML = `
        <strong>🎯 Лучший маршрут найден:</strong><br><br>

        <strong>Центр:</strong><br>
        <div style="margin: 8px 0;">${centerHtml}</div>

        <strong>Доноры:</strong><br>
        ${donorsHtml}

        <br><strong>Результат:</strong><br>
        <div style="margin: 8px 0;">${resultHtml}</div>

        <strong>Шанс успеха:</strong>
        <span style="color: ${chanceColor};">${chancePercent}%</span>

        ${chancePercent < 100 ? '<br><br><small>⚠️ Шанс ниже 100% из-за ничьих (50/50). Для стабильности используй GEN.2 маршруты.</small>' : ''}
    `;
    resultDiv.classList.add('show');

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
// Применяем тему Telegram
if (tg.themeParams && tg.themeParams.bg_color) {
    document.documentElement.style.setProperty('--tg-bg', tg.themeParams.bg_color);
}
