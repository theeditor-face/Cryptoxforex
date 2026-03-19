// =========================================
// TRADEHUB PRO - COMPLETE APPLICATION
// =========================================

const app = {
    isPremium: localStorage.getItem('premium') === 'true',
    isDark: localStorage.getItem('darkMode') !== 'false',
    cryptoData: [],
    forexData: [],
    currentCrypto: null,
    currentForex: null,
    charts: {}
};

// =========================================
// INITIALIZATION
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 TradeHub Pro Starting...');
    
    // Load preferences
    if (!app.isDark) document.body.classList.add('light-mode');
    updatePremiumUI();
    
    // Start animations
    createParticles();
    
    // Load data
    await Promise.all([loadCryptos(), loadForex()]);
    
    // Auto-refresh every 60 seconds
    setInterval(async () => {
        await loadCryptos();
        await loadForex();
        updateTicker();
    }, 60000);
    
    // Initial ticker
    updateTicker();
    
    console.log('✅ TradeHub Pro Ready');
});

// =========================================
// PARTICLE ANIMATION
// =========================================
function createParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 0.5;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = (Math.random() - 0.5) * 1.5;
            this.opacity = Math.random() * 0.6 + 0.2;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (let i = 0; i < 80; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    
    animate();
}

// =========================================
// NAVIGATION
// =========================================
function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo(0, 0);
    }
}

// =========================================
// DARK MODE
// =========================================
function toggleDarkMode() {
    app.isDark = !app.isDark;
    document.body.classList.toggle('light-mode');
    localStorage.setItem('darkMode', app.isDark);
}

// =========================================
// CRYPTO FUNCTIONS
// =========================================
async function loadCryptos() {
    try {
        console.log('📊 Loading cryptocurrencies...');
        const response = await fetch(
            'https://api.coingecko.com/api/v3/markets?vs_currency=usd&order=market_cap_desc&per_page=250&sparkline=true&price_change_percentage=1h%2C24h%2C7d'
        );
        
        app.cryptoData = await response.json();
        displayCryptos(app.cryptoData);
        updateCryptoStats();
        updateTicker();
        updateHeroChart();
        
        document.getElementById('cryptoTime').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        console.log(`✅ Loaded ${app.cryptoData.length} cryptocurrencies`);
    } catch (error) {
        console.error('❌ Crypto Error:', error);
    }
}

function displayCryptos(cryptos) {
    const grid = document.getElementById('cryptoGrid');
    grid.innerHTML = '';
    
    cryptos.slice(0, 100).forEach((crypto, i) => {
        const change = crypto.price_change_percentage_24h || 0;
        const card = document.createElement('div');
        card.className = 'asset-card';
        card.style.animation = `fadeInCard 0.5s ease-out ${i * 0.03}s both`;
        
        card.innerHTML = `
            <div class="asset-header">
                <div>
                    <div class="asset-name">${sanitize(crypto.name)}</div>
                    <div class="asset-symbol">${crypto.symbol.toUpperCase()}</div>
                </div>
                <img src="${crypto.image}" alt="${crypto.name}" loading="lazy">
            </div>
            <div class="asset-price">$${formatNumber(crypto.current_price)}</div>
            <div class="asset-change ${change >= 0 ? 'positive' : 'negative'}">
                ${change >= 0 ? '📈' : '📉'} ${Math.abs(change).toFixed(2)}%
            </div>
        `;
        
        card.onclick = () => showCryptoDetail(crypto);
        grid.appendChild(card);
    });
}

function searchCrypto() {
    const search = document.getElementById('cryptoSearch').value.toLowerCase();
    const filtered = app.cryptoData.filter(c => 
        c.name.toLowerCase().includes(search) || c.symbol.toLowerCase().includes(search)
    );
    displayCryptos(filtered);
}

function filterCrypto() {
    const filter = document.getElementById('cryptoFilter').value;
    let filtered = app.cryptoData;
    
    if (filter === 'top50') {
        filtered = app.cryptoData.slice(0, 50);
    } else if (filter === 'gainers') {
        filtered = [...app.cryptoData].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)).slice(0, 20);
    } else if (filter === 'losers') {
        filtered = [...app.cryptoData].sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0)).slice(0, 20);
    }
    
    displayCryptos(filtered);
}

function showCryptoDetail(crypto) {
    app.currentCrypto = crypto;
    navigate('cryptoDetail');
    
    const change = crypto.price_change_percentage_24h || 0;
    
    document.getElementById('cryptoLogo').src = crypto.image;
    document.getElementById('cryptoName').textContent = sanitize(crypto.name);
    document.getElementById('cryptoSymbol').textContent = crypto.symbol.toUpperCase();
    document.getElementById('cryptoPrice').textContent = `$${formatNumber(crypto.current_price)}`;
    document.getElementById('cryptoChange').textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    document.getElementById('cryptoChange').className = `price-badge ${change >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('cryptoMarketCap').textContent = crypto.market_cap ? `$${formatLargeNumber(crypto.market_cap)}` : 'N/A';
    document.getElementById('cryptoVolume').textContent = crypto.total_volume ? `$${formatLargeNumber(crypto.total_volume)}` : 'N/A';
    document.getElementById('cryptoHigh').textContent = crypto.high_24h ? `$${formatNumber(crypto.high_24h)}` : 'N/A';
    document.getElementById('cryptoLow').textContent = crypto.low_24h ? `$${formatNumber(crypto.low_24h)}` : 'N/A';
    
    // Draw chart
    if (crypto.sparkline_in_7d?.price) {
        drawChart('cryptoDetailChart', crypto.sparkline_in_7d.price, 'Crypto Price');
    }
    
    // AI Analysis
    generateCryptoAI(crypto);
    updatePremiumLock('cryptoAI', 'cryptoAILock');
}

function generateCryptoAI(crypto) {
    const change = crypto.price_change_percentage_24h || 0;
    const volume = crypto.total_volume || 0;
    const marketCap = crypto.market_cap || 0;
    
    let sentiment = '➡️ Neutral';
    let analysis = '';
    
    if (change > 20) {
        sentiment = '🚀 Extremely Bullish';
        analysis = `${sanitize(crypto.name)} is experiencing explosive growth with ${change.toFixed(2)}% gains. Strong bullish momentum detected. Monitor resistance levels for potential profit-taking opportunities.`;
    } else if (change > 10) {
        sentiment = '📈 Very Bullish';
        analysis = `Strong upward movement detected. Trading volume supports the rally. Key support levels should hold for continuation of the trend.`;
    } else if (change > 5) {
        sentiment = '📊 Bullish';
        analysis = `Moderate positive momentum. Buyers maintain control. Watch for pullbacks to establish better entry points.`;
    } else if (change > -5) {
        sentiment = '➡️ Neutral';
        analysis = `Market is consolidating. Waiting for clearer directional signals. Both bulls and bears showing balanced interest.`;
    } else if (change > -10) {
        sentiment = '📉 Bearish';
        analysis = `Selling pressure detected. Resistance levels being tested. Monitor support zones for potential bounce opportunities.`;
    } else {
        sentiment = '🔴 Highly Bearish';
        analysis = `Significant downward pressure. Multiple support levels under test. Wait for stabilization before new positions.`;
    }
    
    document.getElementById('cryptoAIText').innerHTML = `
        <strong>Sentiment: ${sentiment}</strong><br><br>
        ${analysis}<br><br>
        <em style="opacity: 0.8; font-size: 0.95rem;">
        ⚠️ For educational purposes. Always do your own research.
        </em>
    `;
}

// =========================================
// FOREX FUNCTIONS
// =========================================
async function loadForex() {
    try {
        console.log('💱 Loading forex rates...');
        
        const pairs = [
            'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'CNY', 'INR', 'MXN',
            'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'ZAR', 'BRL', 'RUB', 'KRW', 'TRY'
        ];
        
        const rates = await Promise.all(
            pairs.map(pair => fetchRate(pair))
        );
        
        app.forexData = rates.filter(r => r);
        displayForex(app.forexData);
        updateTicker();
        
        document.getElementById('forexTime').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        console.log(`✅ Loaded ${app.forexData.length} forex pairs`);
    } catch (error) {
        console.error('❌ Forex Error:', error);
    }
}

async function fetchRate(base) {
    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
        const data = await response.json();
        
        const topPairs = [];
        const rates = data.rates;
        
        ['USD', 'EUR', 'GBP', 'JPY', 'CHF'].forEach(quote => {
            if (rates[quote]) {
                topPairs.push({
                    pair: `${base}/${quote}`,
                    base: base,
                    quote: quote,
                    rate: rates[quote],
                    change: (Math.random() - 0.5) * 2,
                    type: getPairType(base, quote)
                });
            }
        });
        
        return topPairs;
    } catch (error) {
        console.error(`Error fetching ${base}:`, error);
        return [];
    }
}

function getPairType(base, quote) {
    const majors = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];
    if ((majors.includes(base) || base === 'USD') && (majors.includes(quote) || quote === 'USD')) {
        return 'Major';
    }
    return 'Minor';
}

function displayForex(forexPairs) {
    const grid = document.getElementById('forexGrid');
    grid.innerHTML = '';
    
    forexPairs.slice(0, 100).forEach((pair, i) => {
        const card = document.createElement('div');
        card.className = 'asset-card';
        card.style.animation = `fadeInCard 0.5s ease-out ${i * 0.03}s both`;
        
        card.innerHTML = `
            <div class="asset-header">
                <div>
                    <div class="asset-name">${pair.pair}</div>
                    <div class="asset-symbol">${pair.type} Pair</div>
                </div>
                <div style="font-weight: 700; font-size: 1.3rem; color: var(--primary);">💱</div>
            </div>
            <div class="asset-price">${pair.rate.toFixed(4)}</div>
            <div class="asset-change ${pair.change >= 0 ? 'positive' : 'negative'}">
                ${pair.change >= 0 ? '📈' : '📉'} ${Math.abs(pair.change).toFixed(4)}
            </div>
        `;
        
        card.onclick = () => showForexDetail(pair);
        grid.appendChild(card);
    });
}

function searchForex() {
    const search = document.getElementById('forexSearch').value.toUpperCase();
    const filtered = app.forexData.filter(p => p.pair.includes(search));
    displayForex(filtered);
}

function filterForex() {
    const filter = document.getElementById('forexFilter').value;
    let filtered = app.forexData;
    
    if (filter === 'major') {
        filtered = app.forexData.filter(p => p.type === 'Major');
    } else if (filter === 'minor') {
        filtered = app.forexData.filter(p => p.type === 'Minor');
    }
    
    displayForex(filtered);
}

function showForexDetail(pair) {
    app.currentForex = pair;
    navigate('forexDetail');
    
    document.getElementById('forexFrom').textContent = pair.base;
    document.getElementById('forexTo').textContent = pair.quote;
    document.getElementById('forexPair').textContent = pair.pair;
    document.getElementById('forexType').textContent = pair.type;
    document.getElementById('forexRate').textContent = pair.rate.toFixed(4);
    
    const changePercent = (pair.change / pair.rate) * 100;
    document.getElementById('forexChange').textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(3)}%`;
    document.getElementById('forexChange').className = `price-badge ${changePercent >= 0 ? 'positive' : 'negative'}`;
    
    const bid = pair.rate - 0.0001;
    const ask = pair.rate + 0.0001;
    
    document.getElementById('forexBid').textContent = bid.toFixed(4);
    document.getElementById('forexAsk').textContent = ask.toFixed(4);
    document.getElementById('forexSpread').textContent = (ask - bid).toFixed(4);
    document.getElementById('forexVolatility').textContent = (Math.random() * 3).toFixed(2) + '%';
    
    // Chart
    const data = generateChartData(pair.rate);
    drawChart('forexDetailChart', data, 'Exchange Rate');
    
    // AI
    generateForexAI(pair);
    updatePremiumLock('forexAI', 'forexAILock');
}

function generateForexAI(pair) {
    const changePercent = (pair.change / pair.rate) * 100;
    
    let sentiment = '➡️ Neutral';
    let analysis = '';
    
    if (changePercent > 1) {
        sentiment = '📈 Bullish';
        analysis = `${pair.pair} shows upward momentum. Base currency strengthening. Technical indicators remain positive.`;
    } else if (changePercent < -1) {
        sentiment = '📉 Bearish';
        analysis = `${pair.pair} experiencing downward pressure. Quote currency gaining strength. Support levels being tested.`;
    } else {
        sentiment = '➡️ Consolidating';
        analysis = `${pair.pair} trading in tight range. Market awaiting directional signals. Risk/reward appears balanced.`;
    }
    
    document.getElementById('forexAIText').innerHTML = `
        <strong>Sentiment: ${sentiment}</strong><br><br>
        ${analysis}<br><br>
        <strong>Trading Levels:</strong><br>
        • Resistance: ${(pair.rate + 0.01).toFixed(4)}<br>
        • Support: ${(pair.rate - 0.01).toFixed(4)}<br><br>
        <em style="opacity: 0.8; font-size: 0.95rem;">
        ⚠️ For educational purposes. Always do your own research.
        </em>
    `;
}

// =========================================
// CHARTS
// =========================================
function drawChart(canvasId, data, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    if (app.charts[canvasId]) {
        app.charts[canvasId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const labels = Array.from({length: data.length}, (_, i) => `${i * 4}h`);
    
    app.charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 8,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: true, labels: { color: '#cbd5e1', padding: 20 } },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 39, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#6366f1',
                    borderWidth: 1,
                    padding: 15
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(30, 41, 59, 0.2)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

function generateChartData(baseValue) {
    const data = [];
    let value = baseValue;
    for (let i = 0; i < 168; i++) {
        value += (Math.random() - 0.5) * baseValue * 0.01;
        data.push(Math.max(value, baseValue * 0.95));
    }
    return data;
}

function updateHeroChart() {
    if (app.cryptoData.length === 0) return;
    
    const topCoins = app.cryptoData.slice(0, 10);
    const prices = topCoins.map(c => c.current_price);
    const names = topCoins.map(c => c.name.substring(0, 6));
    
    const canvas = document.getElementById('heroChartCanvas');
    if (!canvas) return;
    
    if (app.charts['hero']) {
        app.charts['hero'].destroy();
    }
    
    app.charts['hero'] = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: names,
            datasets: [{
                label: 'Top 10 Cryptos',
                data: prices,
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(20, 184, 166, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(236, 72, 153, 0.6)',
                    'rgba(99, 102, 241, 0.6)',
                    'rgba(20, 184, 166, 0.6)'
                ],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(30, 41, 59, 0.1)' },
                    ticks: { color: '#94a3b8', callback: v => '$' + v.toFixed(0) }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// =========================================
// TICKER UPDATE
// =========================================
function updateTicker() {
    const ticker = document.getElementById('ticker');
    ticker.innerHTML = '';
    
    const items = [];
    
    if (app.cryptoData.length > 0) {
        ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'].forEach(symbol => {
            const crypto = app.cryptoData.find(c => c.symbol.toUpperCase() === symbol);
            if (crypto) {
                const change = crypto.price_change_percentage_24h || 0;
                items.push({
                    symbol: symbol,
                    price: crypto.current_price,
                    change: change,
                    type: 'crypto'
                });
            }
        });
    }
    
    if (app.forexData.length > 0) {
        app.forexData.slice(0, 5).forEach(pair => {
            items.push({
                symbol: pair.pair,
                price: pair.rate,
                change: pair.change,
                type: 'forex'
            });
        });
    }
    
    // Duplicate for scroll effect
    [...items, ...items].forEach(item => {
        const div = document.createElement('div');
        div.className = 'ticker-item';
        div.innerHTML = `
            <span class="ticker-symbol">${item.symbol}</span>
            <span class="ticker-price">${item.type === 'crypto' ? '$' + formatNumber(item.price) : item.price.toFixed(4)}</span>
            <span class="ticker-change ${item.change >= 0 ? 'up' : 'down'}">
                ${item.change >= 0 ? '+' : ''}${item.change.toFixed(2)}%
            </span>
        `;
        ticker.appendChild(div);
    });
}

// =========================================
// STATS UPDATE
// =========================================
function updateCryptoStats() {
    if (app.cryptoData.length === 0) return;
    
    const totalCap = app.cryptoData.reduce((sum, c) => sum + (c.market_cap || 0), 0);
    const totalVolume = app.cryptoData.reduce((sum, c) => sum + (c.total_volume || 0), 0);
    
    document.getElementById('marketCap').textContent = `$${formatLargeNumber(totalCap)}`;
    document.getElementById('volume24h').textContent = `$${formatLargeNumber(totalVolume)}`;
}

// =========================================
// PREMIUM
// =========================================
function openPremium() {
    document.getElementById('premiumModal').classList.add('active');
}

function closePremium() {
    document.getElementById('premiumModal').classList.remove('active');
}

function upgradePremium(plan) {
    app.isPremium = true;
    localStorage.setItem('premium', 'true');
    updatePremiumUI();
    closePremium();
    
    alert(`✅ Premium activated! (${plan} plan)\n\nIn production, this would process payment via Paystack.`);
    updatePremiumLocks();
}

function updatePremiumUI() {
    const btn = document.querySelector('.premium-btn');
    if (app.isPremium) {
        btn.innerHTML = '<i class="fas fa-crown"></i> Premium (Active)';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    }
    updatePremiumLocks();
}

function updatePremiumLock(boxId, lockId) {
    const box = document.getElementById(boxId);
    const lock = document.getElementById(lockId);
    
    if (!app.isPremium) {
        box.classList.add('premium-locked');
        if (lock) lock.style.display = 'flex';
    } else {
        box.classList.remove('premium-locked');
        if (lock) lock.style.display = 'none';
    }
}

function updatePremiumLocks() {
    updatePremiumLock('cryptoAI', 'cryptoAILock');
    updatePremiumLock('forexAI', 'forexAILock');
}

// =========================================
// UTILITIES
// =========================================
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    if (num >= 1) return num.toFixed(2);
    if (num >= 0.01) return num.toFixed(4);
    if (num >= 0.0001) return num.toFixed(6);
    return num.toExponential(2);
}

function formatLargeNumber(num) {
    if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return '$' + (num / 1e3).toFixed(2) + 'K';
    return '$' + num.toFixed(2);
}

function sanitize(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('premiumModal');
    if (e.target === modal) {
        closePremium();
    }
});

console.log(`
╔════════════════════════════════════════╗
║    🚀 TRADEHUB PRO v1.0               ║
║    Professional Trading Platform       ║
║    Dark Mode: ${app.isDark ? 'ON' : 'OFF'}     Premium: ${app.isPremium ? 'YES' : 'NO'}    ║
╚════════════════════════════════════════╝
`);