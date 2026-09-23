const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

function calculateRaid() {
    const sulfur = parseInt(document.getElementById('sulfur').value) || 0;
    const target = document.getElementById('target').value;
    
    const cost = {
        stone: 200,
        sheet: 400,
        hqm: 800
    };
    
    const needed = Math.ceil(cost[target] * (sulfur / 1000));
    const resultDiv = document.getElementById('result');
    resultDiv.innerText = `Для ${sulfur} серы нужно ${needed} ед. для ${target}`;
    resultDiv.classList.add('show');
    
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}
