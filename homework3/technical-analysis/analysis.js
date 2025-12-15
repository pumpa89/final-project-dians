// analysis.js - Complete working implementation

let allCryptos = [];
let selectedCrypto = null;
let analysisChart = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Analysis page loaded');
    
    // Load all cryptocurrencies
    await loadCryptocurrencies();
    
    // Initialize event listeners
    initializeEventListeners();
});

async function loadCryptocurrencies() {
    try {
        allCryptos = await cryptoAPI.getAllCryptos();
        console.log(`Loaded ${allCryptos.length} cryptocurrencies`);
        
        // Set default selection to Bitcoin
        selectedCrypto = allCryptos.find(c => c.id === 'bitcoin') || allCryptos[0];
        
    } catch (error) {
        console.error('Error loading cryptocurrencies:', error);
    }
}

function initializeEventListeners() {
    const analyzeButton = document.getElementById('analyze-button');
    
    if (analyzeButton) {
        analyzeButton.addEventListener('click', runAnalysis);
    }
    
    // Add enter key support
    const indicatorSelect = document.getElementById('indicator-select');
    const periodSelect = document.getElementById('period-select');
    
    if (indicatorSelect) {
        indicatorSelect.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') runAnalysis();
        });
    }
    
    if (periodSelect) {
        periodSelect.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') runAnalysis();
        });
    }
}

async function runAnalysis() {
    const indicatorSelect = document.getElementById('indicator-select');
    const periodSelect = document.getElementById('period-select');
    const resultsDiv = document.getElementById('analysis-results');
    
    if (!indicatorSelect || !periodSelect || !resultsDiv) {
        console.error('Required elements not found');
        return;
    }
    
    const indicator = indicatorSelect.value;
    const period = periodSelect.value;
    
    console.log(`Running analysis: ${indicator} for ${period}`);
    
    // Show loading state
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '<div class="loading-message"><p>Running technical analysis...</p></div>';
    
    try {
        // Use Bitcoin as default crypto for analysis
        const cryptoId = 'bitcoin';
        
        // Fetch historical data
        const history = await cryptoAPI.getCryptoHistory(cryptoId);
        
        if (!history || history.length === 0) {
            resultsDiv.innerHTML = '<div class="error-message"><p>No historical data available for analysis</p></div>';
            return;
        }
        
        // Filter data based on period
        const filteredData = filterDataByPeriod(history, period);
        
        if (filteredData.length === 0) {
            resultsDiv.innerHTML = '<div class="error-message"><p>Insufficient data for selected period</p></div>';
            return;
        }
        
        // Perform analysis based on indicator
        const analysisResult = performAnalysis(filteredData, indicator);
        
        // Display results
        displayAnalysisResults(analysisResult, indicator, period, filteredData);
        
    } catch (error) {
        console.error('Error running analysis:', error);
        resultsDiv.innerHTML = `<div class="error-message"><p>Error running analysis: ${error.message}</p></div>`;
    }
}

function filterDataByPeriod(data, period) {
    const periodMap = {
        '24h': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
    };
    
    const days = periodMap[period] || 30;
    return data.slice(-days);
}

function performAnalysis(data, indicator) {
    const prices = data.map(d => parseFloat(d.close) || parseFloat(d.price) || 0);
    const volumes = data.map(d => parseFloat(d.volume) || 0);
    
    let result = {
        trend: '',
        support: 0,
        resistance: 0,
        volatility: '',
        recommendation: '',
        indicatorData: []
    };
    
    switch(indicator) {
        case 'sma':
            result.indicatorData = calculateSMA(prices, 20);
            result.trend = analyzeTrend(prices, result.indicatorData);
            break;
        case 'ema':
            result.indicatorData = calculateEMA(prices, 20);
            result.trend = analyzeTrend(prices, result.indicatorData);
            break;
        case 'rsi':
            result.indicatorData = calculateRSI(prices, 14);
            result.trend = analyzeRSI(result.indicatorData);
            break;
        case 'macd':
            result.indicatorData = calculateMACD(prices);
            result.trend = analyzeMACD(result.indicatorData);
            break;
        case 'bollinger':
            result.indicatorData = calculateBollingerBands(prices, 20);
            result.trend = analyzeBollinger(prices, result.indicatorData);
            break;
        case 'wma':
            result.indicatorData = calculateWMA(prices, 20);
            result.trend = analyzeTrend(prices, result.indicatorData);
            break;
        case 'vma':
            result.indicatorData = calculateVMA(volumes, 20);
            result.trend = analyzeVolumeTrend(volumes, result.indicatorData);
            break;
        case 'stochastic':
            result.indicatorData = calculateStochastic(prices, 14);
            result.trend = analyzeStochastic(result.indicatorData);
            break;
        case 'adx':
            const high = data.map(d => parseFloat(d.high) || parseFloat(d.price) || 0);
            const low = data.map(d => parseFloat(d.low) || parseFloat(d.price) || 0);
            const close = prices;
            result.indicatorData = calculateADX(high, low, close, 14);
            result.trend = analyzeADX(result.indicatorData);
            break;
        case 'cci':
            const highC = data.map(d => parseFloat(d.high) || parseFloat(d.price) || 0);
            const lowC = data.map(d => parseFloat(d.low) || parseFloat(d.price) || 0);
            const closeC = prices;
            result.indicatorData = calculateCCI(highC, lowC, closeC, 20);
            result.trend = analyzeCCI(result.indicatorData);
            break;
    }
    
    // Calculate support and resistance
    result.support = Math.min(...prices).toFixed(2);
    result.resistance = Math.max(...prices).toFixed(2);
    
    // Calculate volatility
    result.volatility = calculateVolatility(prices);
    
    // Generate recommendation
    result.recommendation = generateRecommendation(result.trend, result.volatility);
    
    return result;
}

function calculateSMA(prices, period) {
    const sma = [];
    for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
            sma.push(null);
        } else {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
    }
    return sma;
}

function calculateEMA(prices, period) {
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is just SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += prices[i];
    }
    ema[period - 1] = sum / period;
    
    // Calculate remaining EMAs
    for (let i = period; i < prices.length; i++) {
        ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
    }
    
    // Fill initial nulls
    for (let i = 0; i < period - 1; i++) {
        ema[i] = null;
    }
    
    return ema;
}

function calculateRSI(prices, period = 14) {
    const rsi = [];
    const changes = [];
    
    for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }
    
    for (let i = 0; i < changes.length; i++) {
        if (i < period) {
            rsi.push(null);
        } else {
            const recentChanges = changes.slice(i - period, i);
            const gains = recentChanges.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
            const losses = Math.abs(recentChanges.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;
            
            if (losses === 0) {
                rsi.push(100);
            } else {
                const rs = gains / losses;
                rsi.push(100 - (100 / (1 + rs)));
            }
        }
    }
    
    return rsi;
}

function calculateMACD(prices) {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macdLine = [];
    
    for (let i = 0; i < prices.length; i++) {
        if (ema12[i] !== null && ema26[i] !== null) {
            macdLine.push(ema12[i] - ema26[i]);
        } else {
            macdLine.push(null);
        }
    }
    
    return macdLine;
}

function calculateBollingerBands(prices, period = 20) {
    const sma = calculateSMA(prices, period);
    const bands = { upper: [], middle: [], lower: [] };
    
    for (let i = 0; i < prices.length; i++) {
        if (sma[i] === null) {
            bands.upper.push(null);
            bands.middle.push(null);
            bands.lower.push(null);
        } else {
            const slice = prices.slice(i - period + 1, i + 1);
            const stdDev = Math.sqrt(slice.reduce((sum, price) => sum + Math.pow(price - sma[i], 2), 0) / period);
            
            bands.middle.push(sma[i]);
            bands.upper.push(sma[i] + (2 * stdDev));
            bands.lower.push(sma[i] - (2 * stdDev));
        }
    }
    
    return bands;
}

function analyzeTrend(prices, indicatorData) {
    const validData = indicatorData.filter(d => d !== null);
    if (validData.length === 0) return 'Neutral';
    
    const lastPrice = prices[prices.length - 1];
    const lastIndicator = validData[validData.length - 1];
    
    if (lastPrice > lastIndicator * 1.02) {
        return 'Strong Uptrend - Price is above moving average';
    } else if (lastPrice > lastIndicator) {
        return 'Uptrend - Price slightly above moving average';
    } else if (lastPrice < lastIndicator * 0.98) {
        return 'Downtrend - Price significantly below moving average';
    } else {
        return 'Neutral - Price near moving average';
    }
}

function analyzeRSI(rsiData) {
    const validRSI = rsiData.filter(d => d !== null);
    if (validRSI.length === 0) return 'Insufficient data';
    
    const lastRSI = validRSI[validRSI.length - 1];
    
    if (lastRSI > 70) {
        return `Overbought - RSI at ${lastRSI.toFixed(2)}. Potential reversal coming`;
    } else if (lastRSI < 30) {
        return `Oversold - RSI at ${lastRSI.toFixed(2)}. Potential buying opportunity`;
    } else {
        return `Neutral - RSI at ${lastRSI.toFixed(2)}. Normal trading range`;
    }
}

function analyzeMACD(macdData) {
    const validMACD = macdData.filter(d => d !== null);
    if (validMACD.length < 2) return 'Insufficient data';
    
    const current = validMACD[validMACD.length - 1];
    const previous = validMACD[validMACD.length - 2];
    
    if (current > 0 && previous <= 0) {
        return 'Bullish crossover - Potential buy signal';
    } else if (current < 0 && previous >= 0) {
        return 'Bearish crossover - Potential sell signal';
    } else if (current > 0) {
        return 'Bullish momentum continuing';
    } else {
        return 'Bearish momentum continuing';
    }
}

function analyzeBollinger(prices, bands) {
    const lastPrice = prices[prices.length - 1];
    const lastUpper = bands.upper.filter(d => d !== null).pop();
    const lastLower = bands.lower.filter(d => d !== null).pop();
    
    if (!lastUpper || !lastLower) return 'Insufficient data';
    
    if (lastPrice >= lastUpper) {
        return 'Price at upper band - Overbought, potential reversal';
    } else if (lastPrice <= lastLower) {
        return 'Price at lower band - Oversold, potential bounce';
    } else {
        return 'Price within bands - Normal trading range';
    }
}

function calculateVolatility(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance) * 100;
    
    if (stdDev > 5) {
        return `High (${stdDev.toFixed(2)}%)`;
    } else if (stdDev > 2) {
        return `Medium (${stdDev.toFixed(2)}%)`;
    } else {
        return `Low (${stdDev.toFixed(2)}%)`;
    }
}

function generateRecommendation(trend, volatility) {
    const trendLower = trend.toLowerCase();
    
    if (trendLower.includes('overbought') || trendLower.includes('bearish')) {
        return 'HOLD or SELL - Wait for better entry point';
    } else if (trendLower.includes('oversold') || trendLower.includes('bullish')) {
        return 'CONSIDER BUYING - Potential upside opportunity';
    } else if (trendLower.includes('uptrend') || trendLower.includes('strong')) {
        return 'HOLD - Maintain current positions';
    } else {
        return 'NEUTRAL - Monitor for clearer signals';
    }
}

function displayAnalysisResults(result, indicator, period, data) {
    const resultsDiv = document.getElementById('analysis-results');
    
    const indicatorNames = {
    'sma': 'Simple Moving Average',
    'ema': 'Exponential Moving Average',
    'rsi': 'Relative Strength Index',
    'macd': 'MACD',
    'bollinger': 'Bollinger Bands',
    'wma': 'Weighted Moving Average',
    'vma': 'Volume Moving Average',
    'stochastic': 'Stochastic Oscillator',
    'adx': 'Average Directional Index',
    'cci': 'Commodity Channel Index'
    };
    
    resultsDiv.innerHTML = `
        <h3>Analysis Results: ${indicatorNames[indicator]} (${period})</h3>
        
        <div class="analysis-chart">
            <canvas id="analysisChart" style="max-height: 400px;"></canvas>
        </div>
        
        <div class="analysis-insights">
            <h4>Key Insights</h4>
            <div class="insights-grid">
                <div class="insight-card">
                    <h5>Trend Analysis</h5>
                    <p id="trend-analysis">${result.trend}</p>
                </div>
                <div class="insight-card">
                    <h5>Support/Resistance</h5>
                    <p id="support-resistance">Support: $${result.support}<br>Resistance: $${result.resistance}</p>
                </div>
                <div class="insight-card">
                    <h5>Volatility</h5>
                    <p id="volatility">${result.volatility}</p>
                </div>
                <div class="insight-card">
                    <h5>Recommendation</h5>
                    <p id="recommendation" style="font-weight: bold;">${result.recommendation}</p>
                </div>
            </div>
        </div>
    `;
    
    // Draw the chart
    setTimeout(() => drawAnalysisChart(data, indicator, result.indicatorData), 100);
}

function drawAnalysisChart(data, indicator, indicatorData) {
    const canvas = document.getElementById('analysisChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (analysisChart) {
        analysisChart.destroy();
    }
    
    const labels = data.map(d => d.date);
    const prices = data.map(d => parseFloat(d.close) || parseFloat(d.price) || 0);
    
    const datasets = [{
        label: 'Price',
        data: prices,
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
    }];
    
    // Add indicator data
    if (indicator === 'sma' || indicator === 'ema') {
        datasets.push({
            label: indicator.toUpperCase(),
            data: indicatorData,
            borderColor: '#e74c3c',
            borderWidth: 2,
            fill: false,
            tension: 0.4
        });
    } else if (indicator === 'rsi') {
        // For RSI, show it separately
        datasets[0] = {
            label: 'RSI',
            data: indicatorData,
            borderColor: '#9b59b6',
            borderWidth: 2,
            fill: false
        };
    } else if (indicator === 'bollinger') {
        datasets.push({
            label: 'Upper Band',
            data: indicatorData.upper,
            borderColor: '#e74c3c',
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false
        });
        datasets.push({
            label: 'Lower Band',
            data: indicatorData.lower,
            borderColor: '#27ae60',
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false
        });
    } else if (indicator === 'wma') {
        datasets.push({
            label: 'WMA',
            data: indicatorData,
            borderColor: '#e67e22',
            borderWidth: 2,
            fill: false
        });
    } else if (indicator === 'vma') {
        datasets[0] = {
            label: 'Volume MA',
            data: indicatorData,
            borderColor: '#34495e',
            borderWidth: 2,
            fill: false
        };
    } else if (indicator === 'stochastic') {
        datasets[0] = {
            label: 'Stochastic %K',
            data: indicatorData,
            borderColor: '#8e44ad',
            borderWidth: 2,
            fill: false
        };
    } else if (indicator === 'adx' || indicator === 'cci') {
        datasets[0] = {
            label: indicator.toUpperCase(),
            data: indicatorData,
            borderColor: '#c0392b',
            borderWidth: 2,
            fill: false
        };
    }


    
    analysisChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: {
                    display: true,
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    display: true,
                    ticks: {
                        callback: function(value) {
                            return indicator === 'rsi' ? value.toFixed(0) : '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Додај ги овие функции во analysis.js

function calculateWMA(prices, period = 20) {
    const wma = [];
    const weights = [];
    for (let i = 0; i < period; i++) {
        weights.push(i + 1);
    }
    const weightSum = weights.reduce((a, b) => a + b, 0);

    for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
            wma.push(null);
        } else {
            let weightedSum = 0;
            for (let j = 0; j < period; j++) {
                weightedSum += prices[i - j] * weights[j];
            }
            wma.push(weightedSum / weightSum);
        }
    }
    return wma;
}

function calculateVMA(volumes, period = 20) {
    const vma = [];
    for (let i = 0; i < volumes.length; i++) {
        if (i < period - 1) {
            vma.push(null);
        } else {
            const sum = volumes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            vma.push(sum / period);
        }
    }
    return vma;
}

function calculateStochastic(prices, period = 14) {
    const stochastic = [];
    for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
            stochastic.push(null);
        } else {
            const slice = prices.slice(i - period + 1, i + 1);
            const high = Math.max(...slice);
            const low = Math.min(...slice);
            const current = prices[i];
            const k = ((current - low) / (high - low)) * 100;
            stochastic.push(k);
        }
    }
    return stochastic;
}

function calculateADX(pricesHigh, pricesLow, pricesClose, period = 14) {
    // ADX е комплексен, го поедноставувам за сега
    const adx = [];
    for (let i = 0; i < pricesHigh.length; i++) {
        if (i < period - 1) {
            adx.push(null);
        } else {
            // Pojednostavena верзија
            const sliceHigh = pricesHigh.slice(i - period + 1, i + 1);
            const sliceLow = pricesLow.slice(i - period + 1, i + 1);
            const sliceClose = pricesClose.slice(i - period + 1, i + 1);
            const avgHigh = sliceHigh.reduce((a, b) => a + b, 0) / period;
            const avgLow = sliceLow.reduce((a, b) => a + b, 0) / period;
            const avgClose = sliceClose.reduce((a, b) => a + b, 0) / period;
            const adxValue = (avgHigh - avgLow) / avgClose * 100;
            adx.push(adxValue);
        }
    }
    return adx;
}

function calculateCCI(pricesHigh, pricesLow, pricesClose, period = 20) {
    const cci = [];
    for (let i = 0; i < pricesHigh.length; i++) {
        if (i < period - 1) {
            cci.push(null);
        } else {
            const sliceHigh = pricesHigh.slice(i - period + 1, i + 1);
            const sliceLow = pricesLow.slice(i - period + 1, i + 1);
            const sliceClose = pricesClose.slice(i - period + 1, i + 1);
            const typicalPrices = sliceHigh.map((h, idx) => (h + sliceLow[idx] + sliceClose[idx]) / 3);
            const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
            const meanDev = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;
            const cciValue = (typicalPrices[typicalPrices.length - 1] - sma) / (0.015 * meanDev);
            cci.push(cciValue);
        }
    }
    return cci;
}

function analyzeVolumeTrend(volumes, vmaData) {
    const lastVolume = volumes[volumes.length - 1];
    const lastVMA = vmaData.filter(d => d !== null).pop();
    if (!lastVMA) return 'Insufficient data';
    
    if (lastVolume > lastVMA * 1.5) {
        return 'High volume - Strong interest';
    } else if (lastVolume > lastVMA) {
        return 'Above average volume';
    } else {
        return 'Low volume - Weak interest';
    }
}

function analyzeStochastic(stochData) {
    const valid = stochData.filter(d => d !== null);
    if (valid.length === 0) return 'Insufficient data';
    
    const lastK = valid[valid.length - 1];
    
    if (lastK > 80) {
        return `Overbought - Stochastic at ${lastK.toFixed(2)}`;
    } else if (lastK < 20) {
        return `Oversold - Stochastic at ${lastK.toFixed(2)}`;
    } else {
        return `Neutral - Stochastic at ${lastK.toFixed(2)}`;
    }
}

function analyzeADX(adxData) {
    const valid = adxData.filter(d => d !== null);
    if (valid.length === 0) return 'Insufficient data';
    
    const lastADX = valid[valid.length - 1];
    
    if (lastADX > 25) {
        return `Strong trend - ADX at ${lastADX.toFixed(2)}`;
    } else if (lastADX > 20) {
        return `Moderate trend - ADX at ${lastADX.toFixed(2)}`;
    } else {
        return `Weak or no trend - ADX at ${lastADX.toFixed(2)}`;
    }
}

function analyzeCCI(cciData) {
    const valid = cciData.filter(d => d !== null);
    if (valid.length === 0) return 'Insufficient data';
    
    const lastCCI = valid[valid.length - 1];
    
    if (lastCCI > 100) {
        return `Overbought - CCI at ${lastCCI.toFixed(2)}`;
    } else if (lastCCI < -100) {
        return `Oversold - CCI at ${lastCCI.toFixed(2)}`;
    } else {
        return `Neutral - CCI at ${lastCCI.toFixed(2)}`;
    }
}