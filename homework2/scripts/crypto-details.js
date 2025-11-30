// crypto-details.js - Complete version with all historical data columns

document.addEventListener('DOMContentLoaded', function() {
    console.log('Crypto Details page loaded');
    
    // Populate the dropdown with all available cryptocurrencies
    populateCryptoDropdown();
    
    // Add event listener to Load Data button
    const loadButton = document.getElementById('load-crypto');
    if (loadButton) {
        loadButton.addEventListener('click', loadCryptoDetails);
    }
    
    // Allow loading by pressing Enter in the dropdown
    const cryptoSelect = document.getElementById('crypto-select');
    if (cryptoSelect) {
        cryptoSelect.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loadCryptoDetails();
            }
        });
    }
});

async function populateCryptoDropdown() {
    try {
        const cryptos = await cryptoAPI.getAllCryptos();
        const select = document.getElementById('crypto-select');
        
        if (!select) return;
        
        // Clear existing options
        select.innerHTML = '';
        
        // Add all cryptocurrencies to dropdown
        cryptos.forEach(crypto => {
            const option = document.createElement('option');
            option.value = crypto.id;
            option.textContent = `${crypto.name} (${crypto.symbol.toUpperCase()})`;
            select.appendChild(option);
        });
        
        console.log(`Loaded ${cryptos.length} cryptocurrencies into dropdown`);
    } catch (error) {
        console.error('Error populating dropdown:', error);
    }
}

async function loadCryptoDetails() {
    const select = document.getElementById('crypto-select');
    const contentDiv = document.getElementById('crypto-details-content');
    
    if (!select || !contentDiv) {
        console.error('Select or content div not found');
        return;
    }
    
    const cryptoId = select.value;
    console.log('Loading details for:', cryptoId);
    
    // Show loading message
    contentDiv.innerHTML = '<div class="loading-message"><p>Loading cryptocurrency details...</p></div>';
    
    try {
        // Fetch crypto details
        const details = await cryptoAPI.getCryptoDetails(cryptoId);
        
        console.log('Received details:', details);
        
        if (!details || details.error) {
            contentDiv.innerHTML = '<div class="error-message"><p>Error: Cryptocurrency not found</p></div>';
            return;
        }
        
        // Try to fetch historical data (optional)
        let history = [];
        try {
            history = await cryptoAPI.getCryptoHistory(cryptoId);
            console.log('Historical data points:', history.length);
        } catch (histError) {
            console.log('No historical data available:', histError);
        }
        
        // Display the details
        displayCryptoDetails(details, history);
        
    } catch (error) {
        console.error('Error loading crypto details:', error);
        contentDiv.innerHTML = `
            <div class="error-message">
                <p>Error loading cryptocurrency data. Please try again.</p>
                <p style="font-size: 0.9rem; color: #999; margin-top: 1rem;">Technical details: ${error.message}</p>
            </div>
        `;
    }
}

function displayCryptoDetails(crypto, history) {
    const contentDiv = document.getElementById('crypto-details-content');
    
    // Safely get values with fallbacks
    const priceChange24h = crypto.price_change_percentage_24h || 0;
    
    const changeClass24h = priceChange24h > 0 ? 'positive' : priceChange24h < 0 ? 'negative' : 'neutral';
    
    contentDiv.innerHTML = `
        <!-- Crypto Header -->
        <div class="crypto-details-header">
            <div class="crypto-title">
                <h1>${crypto.name || 'Unknown'} (${(crypto.symbol || '').toUpperCase()})</h1>
                <p class="crypto-rank">Rank #${crypto.market_cap_rank || 'N/A'}</p>
            </div>
            <div class="crypto-main-price">
                <h2>$${formatPrice(crypto.current_price)}</h2>
                <p class="change ${changeClass24h}">${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}% (24h)</p>
            </div>
        </div>

        <!-- Price Statistics -->
        <div class="price-stats-section">
            <h2>Price Statistics</h2>
            <div class="stats-grid">
                <div class="stat-box">
                    <p class="stat-label">24h High</p>
                    <p class="stat-value">$${formatPrice(crypto.high_24h)}</p>
                </div>
                <div class="stat-box">
                    <p class="stat-label">24h Low</p>
                    <p class="stat-value">$${formatPrice(crypto.low_24h)}</p>
                </div>
                <div class="stat-box">
                    <p class="stat-label">All-Time High</p>
                    <p class="stat-value">$${formatPrice(crypto.ath)}</p>
                    <p class="stat-subtext">${crypto.ath_date ? formatDate(crypto.ath_date) : 'N/A'}</p>
                </div>
                <div class="stat-box">
                    <p class="stat-label">All-Time Low</p>
                    <p class="stat-value">$${formatPrice(crypto.atl)}</p>
                    <p class="stat-subtext">${crypto.atl_date ? formatDate(crypto.atl_date) : 'N/A'}</p>
                </div>
            </div>
        </div>

        <!-- Price Chart Section -->
        ${history && history.length > 0 ? `
        <div class="price-chart-section">
            <h2>Average Price Over Time</h2>
            <div class="chart-controls">
                <button class="chart-btn active" data-range="all">All Time</button>
                <button class="chart-btn" data-range="365">1 Year</button>
                <button class="chart-btn" data-range="90">90 Days</button>
                <button class="chart-btn" data-range="30">30 Days</button>
                <button class="chart-btn" data-range="7">7 Days</button>
            </div>
            <canvas id="priceChart" style="max-height: 400px;"></canvas>
        </div>
        ` : ''}

        <!-- Historical Data Section -->
        ${history && history.length > 0 ? `
        <div class="historical-data-section">
            <h2>Historical Data (${history.length} records)</h2>
            <div class="historical-table-scroll">
                <table class="historical-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Open</th>
                            <th>High</th>
                            <th>Low</th>
                            <th>Close</th>
                            <th>Volume</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(row => `
                            <tr>
                                <td>${row.date || 'N/A'}</td>
                                <td>$${formatPrice(row.open)}</td>
                                <td>$${formatPrice(row.high)}</td>
                                <td>$${formatPrice(row.low)}</td>
                                <td>$${formatPrice(row.close)}</td>
                                <td>${formatVolume(row.volume)}</td>
                                <td>$${formatPrice(row.price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <p class="data-note">Scroll to view all historical data • Total records: ${history.length}</p>
        </div>
        ` : `
        <div class="no-history">
            <p>No historical data available for this cryptocurrency.</p>
        </div>
        `}

        <!-- Navigation Buttons -->
        <div class="navigation-buttons">
            <a href="crypto-list.html" class="btn btn-secondary">Back to List</a>
            <a href="analysis.html" class="btn btn-primary">Compare Cryptocurrencies</a>
        </div>
    `;
    
    // Initialize chart if historical data exists
    if (history && history.length > 0) {
        setTimeout(() => initializePriceChart(history, crypto.symbol), 100);
    }
}

// Utility functions
function formatPrice(price) {
    if (!price || price === null || price === undefined) return '0';
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMarketCap(marketCap) {
    if (!marketCap || marketCap === null || marketCap === undefined) return 'N/A';
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
    if (!volume || volume === null || volume === undefined) return 'N/A';
    if (volume >= 1e9) {
        return `$${(volume / 1e9).toFixed(1)}B`;
    } else if (volume >= 1e6) {
        return `$${(volume / 1e6).toFixed(1)}M`;
    } else {
        return `$${volume.toLocaleString()}`;
    }
}

function formatSupply(supply, symbol) {
    if (!supply || supply === null || supply === undefined) return 'N/A';
    const symbolStr = symbol ? ` ${symbol.toUpperCase()}` : '';
    
    if (supply >= 1e9) {
        return `${(supply / 1e9).toFixed(1)}B${symbolStr}`;
    } else if (supply >= 1e6) {
        return `${(supply / 1e6).toFixed(1)}M${symbolStr}`;
    } else {
        return `${supply.toLocaleString()}${symbolStr}`;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return 'N/A';
    }
}

// Chart functionality
let priceChart = null;
let fullHistoryData = [];

function initializePriceChart(history, symbol) {
    fullHistoryData = history;
    
    // Create the chart with all data initially
    createChart(history, symbol, 'all');
    
    // Add event listeners to chart control buttons
    const chartButtons = document.querySelectorAll('.chart-btn');
    chartButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            chartButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const range = this.getAttribute('data-range');
            filterChartData(range, symbol);
        });
    });
}

function filterChartData(range, symbol) {
    let filteredData = fullHistoryData;
    
    if (range !== 'all') {
        const daysToShow = parseInt(range);
        filteredData = fullHistoryData.slice(-daysToShow);
    }
    
    createChart(filteredData, symbol, range);
}

function createChart(data, symbol, range) {
    const canvas = document.getElementById('priceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (priceChart) {
        priceChart.destroy();
    }
    
    // Prepare data for chart
    const labels = data.map(row => row.date);
    const prices = data.map(row => {
        // Calculate average of open, high, low, close
        const open = parseFloat(row.open) || 0;
        const high = parseFloat(row.high) || 0;
        const low = parseFloat(row.low) || 0;
        const close = parseFloat(row.close) || 0;
        return (open + high + low + close) / 4;
    });
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(52, 152, 219, 0.5)');
    gradient.addColorStop(1, 'rgba(52, 152, 219, 0.0)');
    
    // Create new chart
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${symbol.toUpperCase()} Average Price`,
                data: prices,
                borderColor: '#3498db',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#3498db',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Price: ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    ticks: {
                        maxTicksLimit: 10
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Price (USD)'
                    },
                    ticks: {
                        callback: function(value) {
                            return ' + value.toFixed(2)';
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}