// ============================================
// TRADEHUB - COMPLETE JAVASCRIPT
// ============================================

// STATE MANAGEMENT
const AppState = {
    isPremium: localStorage.getItem('isPremium') === 'true',
    currentPage: 'home',
    allCryptos: [],
    allForex: [],
    currentCrypto: null,
    currentForex: null,
    cryptoChartInstance: null,
    forexChartInstance: null,
    isDarkMode: localStorage.getItem('darkMode') !== 'false',
    lastCryptoUpdate: null,
    lastForexUpdate: null
};

// API CACHE (avoid too many requests)
const cache = {
    cryptos: null,
    cryptoTime: 0,
    forexRates: null,
    forexTime: 0
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 TradeHub Loading...');
    initializeApp();
});

function initializeApp() {
    loadDarkModePreference();
    updatePremiumUI();
    setupEventListeners();
    showHome();
    console.log('✅ App Initialized');
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            togglePremium();
        }
    });

    // Search debouncing
    const cryptoSearchInput = document.getElementById('cryptoSearch');
    if (cryptoSearchInput) {
        let searchTimeout;
        cryptoSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(searchCrypto, 300);
        });
    }
}

// ============================================
// PAGE NAVIGATION
// ============================================
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    AppState.currentPage = pageId;
    window.scrollTo(0, 0);
    console.log(`📄 Navigated to: ${pageId}`);
}

function showHome() {
    showPage('home');
}

function showCrypto() {
    showPage('crypto');
    if (AppState.allCryptos.length === 0) {
        loadCryptos();
    }
}

function showForex() {
    showPage('forex');
    if (AppState.allForex.length === 0) {
        loadForex();
    }
}

// ============================================
// CRYPTO FUNCTIONS
// ============================================
async function loadCryptos() {
    const container = document.getElementById('cryptoList');
    container.innerHTML = '<div class="loading">⏳ Loading crypto data...</div>';

    try {
        // Check cache (5 min cache)
        const now = Date.now();
        if (cache.cryptos && (now - cache.cryptoTime) < 300000) {
            console.log('📦 Using cached crypto data');
            AppState.allCryptos = cache.cryptos;
            displayCryptos(AppState.allCryptos);
            return;
        }

        // Fetch fresh data
        console.log('🔄 Fetching crypto data from CoinGecko...');
        const response = await fetch(
            'https://api.coingecko.com/api/v3/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=true&locale=en&price_change_percentage=1h%2C24h%2C7d'
        );

        if (!response.ok) throw new Error('Failed to fetch crypto data');

        AppState.allCryptos = await response.json();
        cache.cryptos = AppState.allCryptos;
        cache.cryptoTime = now;

        displayCryptos(AppState.allCryptos);
        AppState.lastCryptoUpdate = new Date();
        updateLastUpdate('cryptoLastUpdate', AppState.lastCryptoUpdate);

        console.log(`✅ Loaded ${AppState.allCryptos.length} cryptocurrencies`);
    } catch (error) {
        console.error('❌ Error loading cryptos:', error);
        container.innerHTML = `
            <div class="loading" style="color: #ef4444;">
                ⚠️ Error loading data<br>
                <small>Please check your connection and refresh</small>
            </div>
        `;
    }
}

function displayCryptos(cryptos) {
    const container = document.getElementById('cryptoList');
    container.innerHTML = '';

    if (!cryptos || cryptos.length === 0) {
        container.innerHTML = '<div class="loading">No cryptocurrencies found</div>';
        return;
    }

    cryptos.slice(0, 100).forEach(crypto => {
        const priceChange = crypto.price_change_percentage_24h || 0;
        const changeClass = priceChange >= 0 ? 'positive' : 'negative';

        const card = document.createElement('div');
        card.className = 'coin-card';
        card.style.cursor = 'pointer';

        const marketCapDisplay = crypto.market_cap 
            ? `$${formatLargeNumber(crypto.market_cap)}` 
            : 'N/A';

        card.innerHTML = `
            <div class="coin-header">
                <div>
                    <div class="coin-name">${escapeHtml(crypto.name)}</div>
                    <div class="coin-symbol">${crypto.symbol.toUpperCase()}</div>
                </div>
                <img src="${crypto.image}" alt="${crypto.name}" 
                     style="width: 40px; height: 40px; border-radius: 50%;" 
                     onerror="this.src='https://via.placeholder.com/40'">
            </div>
            <div class="coin-price">$${formatPrice(crypto.current_price)}</div>
            <span class="price-change ${changeClass}">
                ${priceChange >= 0 ? '📈' : '📉'} ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
            </span>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
                Vol: ${marketCapDisplay}
            </div>
        `;

        card.addEventListener('click', () => {
            console.log(`📊 Viewing details for ${crypto.name}`);
            showCryptoDetail(crypto);
        });

        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });

        container.appendChild(card);
    });
}

function searchCrypto() {
    const query = document.getElementById('cryptoSearch').value.toLowerCase().trim();
    
    if (!query) {
        displayCryptos(AppState.allCryptos);
        return;
    }

    const filtered = AppState.allCryptos.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.symbol.toLowerCase().includes(query)
    );

    displayCryptos(filtered);
    console.log(`🔍 Search results: ${filtered.length} coins found`);
}

function filterCrypto() {
    const filter = document.getElementById('cryptoFilter').value;
    let filtered = [...AppState.allCryptos];

    switch (filter) {
        case 'top':
            filtered = filtered.slice(0, 50);
            console.log('⭐ Showing top 50 coins');
            break;
        case 'gainers':
            filtered.sort((a, b) =>
                (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
            );
            filtered = filtered.slice(0, 20);
            console.log('📈 Showing top gainers');
            break;
        case 'losers':
            filtered.sort((a, b) =>
                (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0)
            );
            filtered = filtered.slice(0, 20);
            console.log('📉 Showing top losers');
            break;
        default:
            console.log('📋 Showing all coins');
    }

    displayCryptos(filtered);
}

function showCryptoDetail(crypto) {
    AppState.currentCrypto = crypto;
    showPage('cryptoDetail');

    // Update header info
    document.getElementById('detailName').textContent = escapeHtml(crypto.name);
    document.getElementById('detailSymbol').textContent = crypto.symbol.toUpperCase();

    // Update price
    const price = crypto.current_price || 0;
    document.getElementById('detailPrice').textContent = `$${formatPrice(price)}`;

    // Update price change
    const priceChange = crypto.price_change_percentage_24h || 0;
    const changeClass = priceChange >= 0 ? 'positive' : 'negative';
    const changeBadge = document.getElementById('detailChange');
    changeBadge.className = `price-change ${changeClass}`;
    changeBadge.textContent = `${priceChange >= 0 ? '📈 +' : '📉 '}${priceChange.toFixed(2)}%`;

    // Update statistics
    const marketCap = crypto.market_cap || 0;
    const volume24h = crypto.total_volume || 0;
    const high24h = crypto.high_24h || 0;
    const low24h = crypto.low_24h || 0;

    document.getElementById('detailMarketCap').textContent =
        marketCap ? `$${formatLargeNumber(marketCap)}` : 'N/A';
    document.getElementById('detailVolume').textContent =
        volume24h ? `$${formatLargeNumber(volume24h)}` : 'N/A';
    document.getElementById('detailHigh').textContent =
        high24h ? `$${formatPrice(high24h)}` : 'N/A';
    document.getElementById('detailLow').textContent =
        low24h ? `$${formatPrice(low24h)}` : 'N/A';

    // Load chart
    if (crypto.sparkline_in_7d?.price) {
        drawCryptoChart(crypto.sparkline_in_7d.price, crypto.name);
    } else {
        console.warn('No chart data available for', crypto.name);
    }

    // Generate AI analysis
    generateCryptoAI(crypto);

    // Check premium access
    checkPremiumFeatures();

    console.log(`✅ Loaded details for ${crypto.name}`);
}

function drawCryptoChart(data, name) {
    const canvas = document.getElementById('cryptoChart');
    if (!canvas) return;

    // Destroy existing chart
    if (AppState.cryptoChartInstance) {
        AppState.cryptoChartInstance.destroy();
    }

    // Create labels
    const labels = Array.from({ length: data.length }, (_, i) => {
        const hoursAgo = (data.length - i - 1) * 4;
        return hoursAgo === 0 ? 'Now' : `${hoursAgo}h`;
    }).reverse();

    const ctx = canvas.getContext('2d');

    // Calculate min and max for better scaling
    const minPrice = Math.min(...data);
    const maxPrice = Math.max(...data);
    const padding = (maxPrice - minPrice) * 0.1;

    try {
        AppState.cryptoChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${name} Price (USD)`,
                    data: data,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#94a3b8',
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: '#6366f1',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `$${formatPrice(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: minPrice - padding,
                        max: maxPrice + padding,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            maxTicksLimit: 10
                        }
                    }
                }
            }
        });
        console.log('📈 Chart rendered successfully');
    } catch (error) {
        console.error('❌ Chart error:', error);
    }
}

function generateCryptoAI(crypto) {
    const priceChange = crypto.price_change_percentage_24h || 0;
    const volume24h = crypto.total_volume || 0;
    const marketCap = crypto.market_cap || 0;

    let sentiment = 'Neutral';
    let action = 'Hold';
    let analysis = '';

    // More sophisticated analysis
    if (priceChange > 15) {
        sentiment = '🚀 Extremely Bullish';
        action = 'Consider taking partial profits / Protect gains';
        analysis = `${escapeHtml(crypto.name)} is experiencing exceptional upward momentum with a +${priceChange.toFixed(2)}% surge in 24 hours. This level of rapid increase often attracts profit-taking. Consider securing some gains while maintaining exposure. Watch for consolidation patterns.`;
    } else if (priceChange > 8) {
        sentiment = '📈 Very Bullish';
        action = 'Hold positions / Buy on pullbacks';
        analysis = `${escapeHtml(crypto.name)} shows strong bullish momentum with ${priceChange.toFixed(2)}% growth. Positive market sentiment and good volume support the rally. Look for support levels to establish additional positions.`;
    } else if (priceChange > 3) {
        sentiment = '📊 Bullish';
        action = 'Hold / Moderate buying';
        analysis = `${escapeHtml(crypto.name)} maintains positive momentum with +${priceChange.toFixed(2)}% daily gain. Market interest is favorable. Monitor resistance levels for breakout opportunities.`;
    } else if (priceChange > -3) {
        sentiment = '➡️ Neutral';
        action = 'Wait for clearer signals';
        analysis = `${escapeHtml(crypto.name)} is trading sideways with minimal daily change. Market indecision detected. Accumulate on dips or wait for a clearer directional bias.`;
    } else if (priceChange > -8) {
        sentiment = '📉 Bearish';
        action = 'Wait for stabilization / Reduce exposure';
        analysis = `${escapeHtml(crypto.name)} faces mild selling pressure with a ${priceChange.toFixed(2)}% decline. Support levels are critical. Wait for stabilization signals before new positions.`;
    } else {
        sentiment = '🔴 Highly Bearish';
        action = 'Avoid / Wait for reversal';
        analysis = `${escapeHtml(crypto.name)} is under significant selling pressure with a ${Math.abs(priceChange).toFixed(2)}% drop. Market sentiment is negative. Wait for clear reversal signals and support level confirmation.`;
    }

    // Add volume analysis
    if (volume24h > (marketCap * 0.5)) {
        analysis += ' <br><br>💪 High trading volume indicates strong conviction behind the move.';
    } else if (volume24h < (marketCap * 0.1)) {
        analysis += ' <br><br>⚠️ Low volume suggests weak participation and potential reversal risk.';
    }

    const aiText = `
        <strong>Sentiment:</strong> ${sentiment}<br>
        <strong>Action:</strong> ${action}<br><br>
        ${analysis}<br><br>
        <strong>Risk Factors:</strong><br>
        • Volatility: Crypto assets are highly volatile<br>
        • Liquidity: Volume may dry up unexpectedly<br>
        • Market: Subject to macro factors and sentiment shifts<br><br>
        <em style="color: var(--text-muted); font-size: 0.9rem;">
        ⚠️ Disclaimer: This analysis is AI-generated and for educational purposes only. 
        Always conduct your own research and consult financial advisors before trading.
        </em>
    `;

    const aiElement = document.getElementById('aiText');
    if (aiElement) {
        aiElement.innerHTML = aiText;
    }
}

// ============================================
// FOREX FUNCTIONS
// ============================================
async function loadForex() {
    const container = document.getElementById('forexList');
    container.innerHTML = '<div class="loading">⏳ Loading forex data...</div>';

    try {
        // Check cache (5 min)
        const now = Date.now();
        if (cache.forexRates && (now - cache.forexTime) < 300000) {
            console.log('📦 Using cached forex data');
            AppState.allForex = cache.forexRates;
            displayForex(AppState.allForex);
            return;
        }

        console.log('🔄 Fetching forex rates...');

        const pairs = [
            'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD',
            'NZDUSD', 'USDCAD', 'EURJPY', 'GBPJPY', 'AUDJPY',
            'CADCHF', 'EURGBP', 'EURAUD', 'USDHKD', 'NZDCHF'
        ];

        const forexData = await Promise.all(
            pairs.map(pair => fetchForexRate(pair))
        );

        AppState.allForex = forexData.filter(d => d !== null);
        cache.forexRates = AppState.allForex;
        cache.forexTime = now;

        displayForex(AppState.allForex);
        AppState.lastForexUpdate = new Date();
        updateLastUpdate('forexLastUpdate', AppState.lastForexUpdate);

        console.log(`✅ Loaded ${AppState.allForex.length} forex pairs`);
    } catch (error) {
        console.error('❌ Error loading forex:', error);
        container.innerHTML = `
            <div class="loading" style="color: #ef4444;">
                ⚠️ Error loading forex data<br>
                <small>Please check your connection and refresh</small>
            </div>
        `;
    }
}

async function fetchForexRate(pair) {
    try {
        const from = pair.substring(0, 3);
        const to = pair.substring(3, 6);

        // Using exchangerate-api (free, no auth needed)
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);

        if (!response.ok) throw new Error('API error');

        const data = await response.json();
        const rate = data.rates[to];

        // Simulate realistic daily change (-2% to +2%)
        const change24h = (Math.random() - 0.5) * 0.004;

        return {
            pair: `${from}/${to}`,
            from: from,
            to: to,
            rate: rate,
            change24h: change24h,
            changePercent: (change24h / rate) * 100,
            type: getForexType(pair),
            bid: rate - 0.0001,
            ask: rate + 0.0001
        };
    } catch (error) {
        console.error(`⚠️ Failed to fetch ${pair}:`, error);
        return null;
    }
}

function getForexType(pair) {
    const majorPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'NZDUSD', 'USDCAD'];
    const minorPairs = ['EURGBP', 'EURAUD', 'GBPJPY', 'EURJPY', 'AUDJPY', 'NZDCHF'];

    if (majorPairs.includes(pair)) return 'Major';
    if (minorPairs.includes(pair)) return 'Minor';
    return 'Exotic';
}

function displayForex(forexData) {
    const container = document.getElementById('forexList');
    container.innerHTML = '';

    if (!forexData || forexData.length === 0) {
        container.innerHTML = '<div class="loading">No forex pairs available</div>';
        return;
    }

    forexData.forEach(forex => {
        const changeClass = forex.change24h >= 0 ? 'positive' : 'negative';

        const card = document.createElement('div');
        card.className = 'pair-card';
        card.style.cursor = 'pointer';

        card.innerHTML = `
            <div class="coin-header">
                <div>
                    <div class="coin-name">${forex.pair}</div>
                    <div class="coin-symbol">${forex.type} Pair</div>
                </div>
            </div>
            <div class="coin-price">${forex.rate.toFixed(4)}</div>
            <span class="price-change ${changeClass}">
                ${forex.change24h >= 0 ? '📈' : '📉'} ${forex.change24h >= 0 ? '+' : ''}${forex.changePercent.toFixed(2)}%
            </span>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
                Spread: ${(forex.ask - forex.bid).toFixed(4)}
            </div>
        `;

        card.addEventListener('click', () => {
            console.log(`💱 Viewing details for ${forex.pair}`);
            showForexDetail(forex);
        });

        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });

        container.appendChild(card);
    });
}

function filterForex() {
    const filter = document.getElementById('forexFilter').value;
    let filtered = AppState.allForex;

    switch (filter) {
        case 'major':
            filtered = AppState.allForex.filter(f => f.type === 'Major');
            console.log('Major pairs selected');
            break;
        case 'minor':
            filtered = AppState.allForex.filter(f => f.type === 'Minor');
            console.log('Minor pairs selected');
            break;
        case 'exotic':
            filtered = AppState.allForex.filter(f => f.type === 'Exotic');
            console.log('Exotic pairs selected');
            break;
        default:
            console.log('All forex pairs shown');
    }

    displayForex(filtered);
}

function showForexDetail(forex) {
    AppState.currentForex = forex;
    showPage('forexDetail');

    // Header info
    document.getElementById('forexDetailPair').textContent = forex.pair;
    document.getElementById('forexDetailType').textContent = `${forex.type} Pair`;

    // Price info
    document.getElementById('forexDetailRate').textContent = forex.rate.toFixed(4);

    const changeClass = forex.change24h >= 0 ? 'positive' : 'negative';
    const changeBadge = document.getElementById('forexDetailChange');
    changeBadge.className = `price-change ${changeClass}`;
    changeBadge.textContent = `${forex.change24h >= 0 ? '📈 +' : '📉 '}${forex.changePercent.toFixed(3)}%`;

    // Stats
    document.getElementById('forexBid').textContent = forex.bid.toFixed(4);
    document.getElementById('forexAsk').textContent = forex.ask.toFixed(4);
    document.getElementById('forexSpread').textContent = (forex.ask - forex.bid).toFixed(4);
    document.getElementById('forexVolatility').textContent = (Math.random() * 2.5).toFixed(2) + '%';

    // Chart
    drawForexChart(forex);

    // AI Analysis
    generateForexAI(forex);

    // Check premium
    checkPremiumFeatures();

    console.log(`✅ Loaded details for ${forex.pair}`);
}

function drawForexChart(forex) {
    const canvas = document.getElementById('forexChart');
    if (!canvas) return;

    if (AppState.forexChartInstance) {
        AppState.forexChartInstance.destroy();
    }

    // Generate realistic price data
    const data = [];
    let currentPrice = forex.rate;
    for (let i = 0; i < 168; i++) {
        const change = (Math.random() - 0.5) * 0.005;
        currentPrice += change;
        data.push(currentPrice);
    }

    const labels = Array.from({ length: 168 }, (_, i) => {
        const daysAgo = Math.floor((168 - i - 1) / 24);
        return daysAgo === 0 ? 'Today' : `${daysAgo}d`;
    });

    const ctx = canvas.getContext('2d');

    try {
        AppState.forexChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${forex.pair} Exchange Rate`,
                    data: data,
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#ec4899',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#94a3b8',
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: '#ec4899',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toFixed(4);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            maxTicksLimit: 12
                        }
                    }
                }
            }
        });
        console.log('📈 Forex chart rendered');
    } catch (error) {
        console.error('❌ Chart error:', error);
    }
}

function generateForexAI(forex) {
    const change = forex.changePercent || 0;
    const spread = (forex.ask - forex.bid) * 10000; // In pips

    let sentiment = 'Neutral';
    let recommendation = '';
    let analysis = '';

    // Sentiment analysis
    if (change > 0.3) {
        sentiment = '📈 Strong Bullish';
        recommendation = 'Consider long positions with proper risk management';
        analysis = `The ${forex.pair} is experiencing upward pressure. Base currency is strengthening. Technical momentum is positive.`;
    } else if (change > 0.1) {
        sentiment = '📊 Moderately Bullish';
        recommendation = 'Watch for confirmation of continued uptrend';
        analysis = `Mild bullish bias detected. The pair may consolidate before the next move.`;
    } else if (change > -0.1) {
        sentiment = '➡️ Consolidating';
        recommendation = 'Wait for breakout direction';
        analysis = `${forex.pair} is trading in a tight range. Key support and resistance levels are critical.`;
    } else if (change > -0.3) {
        sentiment = '📉 Moderately Bearish';
        recommendation = 'Avoid long positions, consider short entries with confirmation';
        analysis = `Mild bearish pressure detected. Support levels need to be tested.`;
    } else {
        sentiment = '🔴 Strong Bearish';
        recommendation = 'Avoid positions until stabilization';
        analysis = `${forex.pair} is under significant selling pressure. Base currency weakness evident.`;
    }

    const aiText = `
        <strong>📊 Market Sentiment:</strong> ${sentiment}<br>
        <strong>💡 Recommendation:</strong> ${recommendation}<br><br>
        <strong>Analysis:</strong><br>
        ${analysis}<br><br>
        <strong>💰 Trading Details:</strong><br>
        • Current Spread: ${spread.toFixed(1)} pips<br>
        • Support Level: ${(forex.rate - 0.01).toFixed(4)}<br>
        • Resistance Level: ${(forex.rate + 0.01).toFixed(4)}<br>
        • Volatility: ${(Math.random() * 2.5).toFixed(2)}%<br><br>
        <strong>⏰ Best Trading Times:</strong><br>
        • London Open: 08:00 GMT (High volatility)<br>
        • New York Open: 13:00 GMT (Peak volatility)<br>
        • Tokyo Open: 22:00 GMT<br><br>
        <em style="color: var(--text-muted); font-size: 0.9rem;">
        ⚠️ Forex trading carries significant risk. This analysis is educational only. 
        Never risk more than you can afford to lose. Consult a professional advisor.
        </em>
    `;

    const aiElement = document.getElementById('forexAiText');
    if (aiElement) {
        aiElement.innerHTML = aiText;
    }
}

// ============================================
// PREMIUM FEATURES
// ============================================
function togglePremium() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.toggle('active');
    }
}

function upgradePremium(plan) {
    const message = `
🎉 Premium Upgrade - ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan

Price: ${plan === 'monthly' ? '$9.99' : '$79.99'} / ${plan === 'monthly' ? 'month' : 'year'}

In production, this would:
✅ Redirect to Paystack payment gateway
✅ Process secure payment
✅ Unlock all premium features instantly
✅ Send confirmation email

For now, click "Try Premium" to simulate unlock.
    `;

    if (confirm(message + '\n\n[Click OK to simulate premium unlock]')) {
        simulatePremiumUpgrade(plan);
    }
}

function simulatePremiumUpgrade(plan) {
    AppState.isPremium = true;
    localStorage.setItem('isPremium', 'true');
    updatePremiumUI();
    checkPremiumFeatures();
    togglePremium();

    showNotification(`🎉 Welcome to Premium! (${plan} plan simulated)`, 'success');
    console.log(`✅ Premium activated for ${plan}`);
}

function setPremium(status) {
    AppState.isPremium = status;
    localStorage.setItem('isPremium', status);
    updatePremiumUI();
    checkPremiumFeatures();
}

function updatePremiumUI() {
    const btn = document.getElementById('premiumBtn');
    if (!btn) return;

    if (AppState.isPremium) {
        btn.textContent = '⭐ Premium (Active)';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        btn.title = 'You have premium access!';
    } else {
        btn.textContent = '🔒 Unlock Premium';
        btn.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
        btn.title = 'Click to unlock premium features';
    }
}

function checkPremiumFeatures() {
    const aiAnalyses = document.querySelectorAll('.ai-analysis.premium-feature');

    aiAnalyses.forEach(element => {
        if (!AppState.isPremium) {
            element.classList.add('locked');
            element.style.opacity = '0.5';
            element.style.pointerEvents = 'none';
        } else {
            element.classList.remove('locked');
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
        }
    });

    console.log(`🔐 Premium check: ${AppState.isPremium ? 'Unlocked' : 'Locked'}`);
}

// ============================================
// DARK MODE
// ============================================
function toggleDarkMode() {
    const isDark = !document.body.classList.contains('light-mode');
    
    if (isDark) {
        document.body.classList.add('light-mode');
        localStorage.setItem('darkMode', 'false');
        console.log('☀️ Light mode enabled');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('darkMode', 'true');
        console.log('🌙 Dark mode enabled');
    }
}

function loadDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'false') {
        document.body.classList.add('light-mode');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatPrice(price) {
    if (price === null || price === undefined) return '0.00';

    if (price >= 1) {
        return price.toFixed(2);
    } else if (price >= 0.01) {
        return price.toFixed(4);
    } else if (price >= 0.0001) {
        return price.toFixed(6);
    } else {
        return price.toExponential(2);
    }
}

function formatLargeNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateLastUpdate(elementId, date) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `Last updated: ${date.toLocaleTimeString()}`;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#6366f1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        z-index: 9999;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ============================================
// STARTUP LOG
// ============================================
console.log(`
╔════════════════════════════════════════╗
║  🚀 TRADEHUB - CRYPTO & FOREX APP     ║
║  Version: 1.0.0                       ║
║  Mode: ${AppState.isDarkMode ? 'Dark' : 'Light'}                           ║
║  Premium: ${AppState.isPremium ? 'Unlocked ⭐' : 'Locked 🔒'}              ║
╚════════════════════════════════════════╝
`);