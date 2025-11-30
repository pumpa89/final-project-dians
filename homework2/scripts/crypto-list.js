// crypto-list.js - Fixed version with pagination

let allCryptos = [];
let filteredCryptos = [];
let currentPage = 1;
const itemsPerPage = 50;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Crypto List page loaded');
    await initializeCryptoListPage();
});

async function initializeCryptoListPage() {
    try {
        // Load all cryptos from API
        allCryptos = await cryptoAPI.getAllCryptos();
        filteredCryptos = [...allCryptos];
        
        console.log(`Loaded ${allCryptos.length} cryptocurrencies from API`);
        
        // Populate the table
        displayCurrentPage();
        
        // Initialize filters and search
        initializeFilters();
        
        // Update statistics
        updateListStatistics(allCryptos);
        
    } catch (error) {
        console.error('Error initializing crypto list:', error);
        showErrorMessage('Failed to load cryptocurrency data');
    }
}

function displayCurrentPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredCryptos.slice(startIndex, endIndex);
    
    populateCryptoTable(pageData, startIndex);
    updatePaginationControls();
}

function populateCryptoTable(cryptoData, startIndex = 0) {
    const tbody = document.querySelector('.crypto-table tbody');
    
    if (!tbody) {
        console.error('Crypto table body not found');
        return;
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    if (cryptoData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No cryptocurrencies found</td></tr>';
        return;
    }
    
    // Add rows for each cryptocurrency
    cryptoData.forEach((crypto, index) => {
        const row = createCryptoTableRow(crypto, startIndex + index + 1);
        tbody.appendChild(row);
    });
}

function createCryptoTableRow(crypto, displayRank) {
    const row = document.createElement('tr');
    
    const priceChange = crypto.price_change_percentage_24h || 0;
    const changeClass = priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : 'neutral';
    
    row.innerHTML = `
        <td>${displayRank}</td>
        <td class="crypto-name">
            <strong>${crypto.name || 'N/A'}</strong>
            <span class="symbol">${(crypto.symbol || '').toUpperCase()}</span>
        </td>
        <td class="price">$${formatPrice(crypto.current_price)}</td>
        <td class="change ${changeClass}">${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%</td>
        <td class="market-cap">${formatMarketCap(crypto.market_cap)}</td>
        <td class="volume">${formatVolume(crypto.total_volume)}</td>
        <td class="supply">${formatSupply(crypto.circulating_supply, crypto.symbol)}</td>
    `;
    
    return row;
}

function formatPrice(price) {
    if (!price) return '0';
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updatePaginationControls() {
    const totalPages = Math.ceil(filteredCryptos.length / itemsPerPage);
    
    const prevButton = document.querySelector('.pagination .btn-secondary:first-child');
    const nextButton = document.querySelector('.pagination .btn-secondary:last-child');
    const pageInfo = document.querySelector('.page-info');
    
    if (prevButton) {
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                displayCurrentPage();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
    }
    
    if (nextButton) {
        nextButton.disabled = currentPage >= totalPages;
        nextButton.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayCurrentPage();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
    }
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
}

function initializeFilters() {
    const searchInput = document.getElementById('search-input');
    const marketCapFilter = document.getElementById('market-cap-filter');
    const priceChangeFilter = document.getElementById('price-change-filter');
    const resetButton = document.getElementById('reset-filters');
    const searchButton = document.querySelector('.search-box .btn');
    
    if (!searchInput) return;
    
    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilters();
        }, 300);
    });
    
    // Market cap filter
    if (marketCapFilter) {
        marketCapFilter.addEventListener('change', applyFilters);
    }
    
    // Price change filter
    if (priceChangeFilter) {
        priceChangeFilter.addEventListener('change', applyFilters);
    }
    
    // Reset filters
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            searchInput.value = '';
            if (marketCapFilter) marketCapFilter.value = '';
            if (priceChangeFilter) priceChangeFilter.value = '';
            applyFilters();
        });
    }
    
    // Search button
    if (searchButton) {
        searchButton.addEventListener('click', applyFilters);
    }
}

function applyFilters() {
    const searchInput = document.getElementById('search-input');
    const marketCapFilter = document.getElementById('market-cap-filter');
    const priceChangeFilter = document.getElementById('price-change-filter');
    
    let results = [...allCryptos];
    
    // Apply search filter
    const searchTerm = searchInput?.value.trim().toLowerCase();
    if (searchTerm) {
        results = results.filter(crypto => 
            (crypto.name || '').toLowerCase().includes(searchTerm) ||
            (crypto.symbol || '').toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply market cap filter
    const marketCapValue = marketCapFilter?.value;
    if (marketCapValue) {
        const limit = parseInt(marketCapValue.replace('top', ''));
        results = results.slice(0, limit);
    }
    
    // Apply price change filter
    const priceChangeValue = priceChangeFilter?.value;
    if (priceChangeValue === 'positive') {
        results = results.filter(crypto => (crypto.price_change_percentage_24h || 0) > 0);
    } else if (priceChangeValue === 'negative') {
        results = results.filter(crypto => (crypto.price_change_percentage_24h || 0) < 0);
    }
    
    filteredCryptos = results;
    currentPage = 1;
    displayCurrentPage();
}

function updateListStatistics(cryptoData) {
    const totalMarketCap = cryptoData.reduce((sum, crypto) => sum + (crypto.market_cap || 0), 0);
    const totalVolume = cryptoData.reduce((sum, crypto) => sum + (crypto.total_volume || 0), 0);
    
    // Update statistics cards
    const statItems = document.querySelectorAll('.stat-item .stat-number');
    if (statItems.length >= 4) {
        statItems[0].textContent = cryptoData.length.toLocaleString();
        statItems[1].textContent = formatMarketCap(totalMarketCap);
        statItems[2].textContent = formatVolume(totalVolume);
        
        // Update Bitcoin dominance
        const bitcoin = cryptoData.find(crypto => crypto.id === 'bitcoin');
        if (bitcoin && totalMarketCap > 0) {
            const bitcoinDominance = ((bitcoin.market_cap || 0) / totalMarketCap * 100).toFixed(1);
            statItems[3].textContent = `${bitcoinDominance}%`;
        }
    }
}

function showErrorMessage(message) {
    const tbody = document.querySelector('.crypto-table tbody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #e74c3c; padding: 2rem;">${message}</td></tr>`;
    }
}