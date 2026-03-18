const API_KEYS = {
    coingecko: 'https://api.coingecko.com/api/v3',
    exchangerate: 'https://api.exchangerate-api.com/v4/latest',
    newsapi: 'https://newsapi.org/v2'
};

let currentPage = 'home';
let premiumStatus = localStorage.getItem('premium') === 'true';

// Navigation
function navigate(page) {
    currentPage = page;
    const app = document.getElementById('app') || document.body;
    
    switch(page) {
        case 'crypto-dashboard':
            loadCryptoDashboard();
            break;
        case 'forex-dashboard':
            loadForexDashboard();
            break;
        default:
            loadHomepage();
    }
    
    window.scrollTo(0, 0);
}

function loadHomepage() {
    document.body.innerHTML = `
        <nav class="navbar">
            <div class="nav-container">
                <div class="logo" onclick="navigate('home')">📊 TradeHub</div>
                <div class="nav-links">
                    <button class="nav-btn open-telegram">🤖 Open Telegram Bot</button>
                    <button class="nav-btn premium-btn">⭐ Go Premium</button>
                </div>
            </div>
        </nav>

        <div class="homepage">
            <div class="hero">
                <h1>Welcome to TradeHub</h1>
                <p>Real-time Crypto & Forex Trading Intelligence</p>
                <p class="subtitle">AI-powered insights, live charts, and instant trade access</p>
            </div>

            <div class="main-grid">
                <div class="card crypto-card" onclick="navigate('crypto-dashboard')">
                    <div class="card-icon">🪙</div>
                    <h2>Cryptocurrency</h2>
                    <p>500+ coins • Live prices • AI analysis</p>
                    <button class="cta-btn">Explore Crypto →</button>
                </div>

                <div class="card forex-card" onclick="navigate('forex-dashboard')">
                    <div class="card-icon">💱</div>
                    <h2>Forex Trading</h2>
                    <p>Major pairs • Real-time rates • Market insights</p>
                    <button class="cta-btn">Explore Forex →</button>
                </div>
            </div>

            <div class="features">
                <h2>Why TradeHub?</h2>
                <div class="features-grid">
                    <div class="feature">
                        <div>📈</div>
                        <h3>Live Charts</h3>
                        <p>Interactive, real-time price charts</p>
                    </div>
                    <div class="feature">
                        <div>🤖</div>
                        <h3>AI Analysis</h3>
                        <p>Smart insights & trend predictions</p>
                    </div>
                    <div class="feature">
                        <div>⚡</div>
                        <h3>Instant Trading</h3>
                        <p>One-click access to top exchanges</p>
                    </div>
                    <div class="feature">
                        <div>📱</div>
                        <h3>Mobile Ready</h3>
                        <p>Trade anywhere, anytime</p>
                    </div>
                </div>
            </div>
        </div>

        <footer>
            <p>&copy; 2026 TradeHub. Not financial advice. Trade responsibly.</p>
        </footer>
    `;
    attachEventListeners();
}

function loadCryptoDashboard() {
    const content = `
        <nav class="navbar">
            <div class="nav-container">
                <div class="logo" onclick="navigate('home')">📊 TradeHub</div>
                <div class="nav-links">
                    <button class="nav-btn" onclick="navigate('home')">← Back Home</button>
                    <button class="nav-btn premium-btn">⭐ Premium</button>
                </div>
            </div>
        </nav>

        <div class="dashboard" style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;">
            <div class="dashboard-header">
                <h1>🪙 Cryptocurrency Market</h1>
                <div class="search-box">
                    <input type="text" id="cryptoSearch" placeholder="Search coins...">
                    <button onclick="filterCryptos()">Search</button>
                </div>
            </div>

            <div class="filters">
                <button class="filter-btn active" onclick="filterCryptoByCat('all')">All</button>
                <button class="filter-btn" onclick="filterCryptoByCat('trending')">Trending</button>
                <button class="filter-btn" onclick="filterCryptoByCat('gainers')">Top Gainers</button>
                <button class="filter-btn" onclick="filterCryptoByCat('losers')">Top Losers</button>
                <button class="filter-btn" onclick="filterCryptoByCat('top-volume')">By Volume</button>
            </div>

            <div id="cryptoTable" style="margin-top: 2rem;">
                <p style="text-align: center; color: #cbd5e1;"><div class="loading" style="display: inline-block;"></div> Loading market data...</p>
            </div>
        </div>

        <footer style="margin-top: 3rem;">
            <p>&copy; 2026 TradeHub. Not financial advice. Trade responsibly.</p>
        </footer>
    `;
    
    document.body.innerHTML = content;
    loadCryptos();
    attachEventListeners();
}

async function loadCryptos() {
    try {
        const response = await fetch(`${API_KEYS.coingecko}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=false&locale=en`);
        const data = await response.json();
        displayCryptoTable(data);
    } catch (error) {
        console.error('Error loading cryptos:', error);
        document.getElementById('cryptoTable').innerHTML = '<p style="color: red;">Error loading data</p>';
    }
}

function displayCryptoTable(coins) {
    const table = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>24h Change</th>
                    <th>Market Cap</th>
                    <th>Volume</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${coins.map((coin, index) => `
                    <tr onclick="navigate('crypto-coin-${coin.id}')">
                        <td>${index + 1}</td>
                        <td><strong>${coin.name}</strong> <span style="color: #cbd5e1;">${coin.symbol.toUpperCase()}</span></td>
                        <td>$${coin.current_price?.toLocaleString() || 'N/A'}</td>
                        <td class="${coin.price_change_percentage_24h > 0 ? 'price-up' : 'price-down'}">
                            ${coin.price_change_percentage_24h?.toFixed(2)}%
                        </td>
                        <td>$${(coin.market_cap / 1e9)?.toFixed(2)}B</td>
                        <td>$${(coin.total_volume / 1e6)?.toFixed(0)}M</td>
                        <td>
                            <button class="buy-btn" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="event.stopPropagation(); goToBuyCrypto('${coin.symbol}')">Buy</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('cryptoTable').innerHTML = table;
}

function loadForexDashboard() {
    const content = `
        <nav class="navbar">
            <div class="nav-container">
                <div class="logo" onclick="navigate('home')">📊 TradeHub</div>
                <div class="nav-links">
                    <button class="nav-btn" onclick="navigate('home')">← Back Home</button>
                    <button class="nav-btn premium-btn">⭐ Premium</button>
                </div>
            </div>
        </nav>

        <div class="dashboard" style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;">
            <div class="dashboard-header">
                <h1>💱 Forex Market</h1>
                <div class="search-box">
                    <input type="text" id="forexSearch" placeholder="Search pairs...">
                    <button onclick="filterForex()">Search</button>
                </div>
            </div>

            <div class="filters">
                <button class="filter-btn active" onclick="filterForexCat('major')">Major Pairs</button>
                <button class="filter-btn" onclick="filterForexCat('minor')">Minor Pairs</button>
                <button class="filter-btn" onclick="filterForexCat('exotic')">Exotic Pairs</button>
                <button class="filter-btn" onclick="filterForexCat('commodities')">Commodities</button>
            </div>

            <div id="forexTable" style="margin-top: 2rem;">
                <p style="text-align: center; color: #cbd5e1;"><div class="loading" style="display: inline-block;"></div> Loading forex data...</p>
            </div>
        </div>

        <footer style="margin-top: 3rem;">
            <p>&copy; 2026 TradeHub. Not financial advice. Trade responsibly.</p>
        </footer>
    `;
    
    document.body.innerHTML = content;
    loadForex();
    attachEventListeners();
}

async function loadForex() {
    try {
        const pairs = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF', 'AUD_USD', 'USD_CAD'];
        const rates = {};
        
        for (const pair of pairs) {
            const base = pair.split('_')[0];
            const response = await fetch(`${API_KEYS.exchangerate}${base}`);
            const data = await response.json();
            rates[pair] = data.rates[pair.split('_')[1]];
        }
        
        displayForexTable(rates);
    } catch (error) {
        console.error('Error loading forex:', error);
        document.getElementById('forexTable').innerHTML = '<p style="color: red;">Error loading data</p>';
    }
}

function displayForexTable(rates) {
    const majorPairs = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF', 'AUD_USD', 'USD_CAD'];
    
    const table = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Pair</th>
                    <th>Bid</th>
                    <th>Ask</th>
                    <th>Change</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${majorPairs.map((pair, index) => `
                    <tr>
                        <td><strong>${pair}</strong></td>
                        <td>${rates[pair]?.toFixed(4) || 'N/A'}</td>
                        <td>${(rates[pair] + 0.0002)?.toFixed(4) || 'N/A'}</td>
                        <td class="price-up">+0.15%</td>
                        <td>
                            <button class="buy-btn" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="goToBuyForex('${pair}')">Trade</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('forexTable').innerHTML = table;
}

function goToBuyCrypto(symbol) {
    const exchangeLinks = {
        BTC: 'https://www.binance.com/trade/BTC_USDT',
        ETH: 'https://www.binance.com/trade/ETH_USDT',
        default: 'https://www.binance.com'
    };
    window.open(exchangeLinks[symbol.toUpperCase()] || exchangeLinks.default, '_blank');
}

function goToBuyForex(pair) {
    window.open('https://www.exness.com/', '_blank');
}

function filterCryptos() {
    const search = document.getElementById('cryptoSearch').value.toLowerCase();
    const rows = document.querySelectorAll('.data-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

function filterForex() {
    const search = document.getElementById('forexSearch').value.toLowerCase();
    const rows = document.querySelectorAll('.data-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

function filterCryptoByCat(cat) {
    updateFilterButtons(event.target);
    loadCryptos();
}

function filterForexCat(cat) {
    updateFilterButtons(event.target);
    loadForex();
}

function updateFilterButtons(btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function attachEventListeners() {
    const telegramBtn = document.querySelector('.open-telegram');
    const premiumBtn = document.querySelector('.premium-btn');
    
    if (telegramBtn) {
        telegramBtn.addEventListener('click', () => {
            alert('🤖 Telegram Bot Link: https://t.me/YourBotUsername\n\nJoin to get real-time alerts!');
        });
    }
    
    if (premiumBtn) {
        premiumBtn.addEventListener('click', () => {
            showPremiumModal();
        });
    }
}

function showPremiumModal() {
    alert('⭐ Premium Features:\n\n✅ Advanced AI Analysis\n✅ Portfolio Tracking\n✅ Priority Support\n✅ Custom Alerts\n\nPrice: \$9.99/month\n\nPayment via Paystack (coming soon)');
}

// Initialize
loadHomepage();