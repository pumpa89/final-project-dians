// script.js - Shared functionality using Python API

// Global API client and data
let cryptoData = [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Crypto Analyzer - Python API version loaded');
    
    // Initialize shared features first
    initializeSharedFeatures();
    
    // Then initialize page-specific features
    // Each page will load its own data from API
    initializePageSpecificFeatures();
});

function initializeSharedFeatures() {
    // Navigation active state management
    updateNavigationState();
    
    console.log('Shared features initialized');
}

function initializePageSpecificFeatures() {
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'index':
            initializeHomePage();
            break;
        case 'crypto-list':
            console.log('Crypto List page - will load data via crypto-list.js');
            break;
        case 'crypto-details':
            console.log('Crypto Details page - will load data via crypto-details.js');
            break;
        case 'analysis':
            console.log('Analysis page - will load data via analysis.js');
            break;
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    if (page === 'index.html' || page === '') return 'index';
    if (page === 'crypto-list.html') return 'crypto-list';
    if (page === 'crypto-details.html') return 'crypto-details';
    if (page === 'analysis.html') return 'analysis';
    
    return 'index';
}

async function initializeHomePage() {
    console.log('Home page - loading data from API');
    
    try {
        // Load top 6 cryptos and stats from API
        const [topCryptos, marketStats] = await Promise.all([
            cryptoAPI.getTopCryptos(6),
            cryptoAPI.getMarketStats()
        ]);
        
        updateTopCryptos(topCryptos);
        updateHomePageStats(marketStats);
        
    } catch (error) {
        console.error('Error loading home page data:', error);
    }
}

function updateTopCryptos(cryptoData) {
    const cryptoGrid = document.querySelector('.crypto-grid');
    
    if (!cryptoGrid) return;
    
    cryptoGrid.innerHTML = ''; // Clear existing cards
    
    cryptoData.forEach(crypto => {
        const cryptoCard = createCryptoCard(crypto);
        cryptoGrid.appendChild(cryptoCard);
    });
}

function createCryptoCard(crypto) {
    const card = document.createElement('div');
    card.className = 'crypto-card';
    
    const priceChange = crypto.price_change_percentage_24h || 0;
    const changeClass = priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : 'neutral';
    
    card.innerHTML = `
        <div class="crypto-header">
            <div>
                <h3>${crypto.name} (${(crypto.symbol || '').toUpperCase()})</h3>
                <p class="crypto-price">$${(crypto.current_price || 0).toLocaleString()}</p>
            </div>
        </div>
        <div class="crypto-details">
            <p>Market Cap: <strong>${formatMarketCap(crypto.market_cap)}</strong></p>
            <p class="change ${changeClass}">${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}% (24h)</p>
        </div>
    `;
    
    return card;
}

function updateHomePageStats(marketStats) {
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card .stat-number');
    if (statCards.length >= 3) {
        statCards[0].textContent = marketStats.total_cryptocurrencies || 0;
        statCards[1].textContent = formatMarketCap(marketStats.total_market_cap);
        // For largest gain, we'll need to calculate this differently
        statCards[2].textContent = '+5.25%'; // Placeholder for now
    }
}

function updateNavigationState() {
    // Remove active class from all nav items
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to current page
    const currentPage = getCurrentPage();
    const currentNavLink = document.querySelector(`.nav-link[href="${getPageFileName(currentPage)}"]`);
    if (currentNavLink) {
        currentNavLink.classList.add('active');
    }
}

function getPageFileName(page) {
    switch(page) {
        case 'index': return 'index.html';
        case 'crypto-list': return 'crypto-list.html';
        case 'crypto-details': return 'crypto-details.html';
        case 'analysis': return 'analysis.html';
        default: return 'index.html';
    }
}

// Utility functions
function formatNumber(num) {
    if (!num) return '0';
    return new Intl.NumberFormat('en-US').format(num);
}

function formatMarketCap(marketCap) {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) {
        return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
        return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
        return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
        return `$${marketCap.toLocaleString()}`;
    }
}

function formatVolume(volume) {
    if (!volume) return 'N/A';
    if (volume >= 1e9) {
        return `$${(volume / 1e9).toFixed(1)}B`;
    } else if (volume >= 1e6) {
        return `$${(volume / 1e6).toFixed(1)}M`;
    } else {
        return `$${volume.toLocaleString()}`;
    }
}

function formatSupply(supply, symbol) {
    if (!supply) return 'N/A';
    const symbolStr = symbol ? ` ${symbol.toUpperCase()}` : '';
    
    if (supply >= 1e9) {
        return `${(supply / 1e9).toFixed(1)}B${symbolStr}`;
    } else if (supply >= 1e6) {
        return `${(supply / 1e6).toFixed(1)}M${symbolStr}`;
    } else {
        return `${supply.toLocaleString()}${symbolStr}`;
    }
}