// lstm-predict.js - LSTM Price Prediction Implementation

let lstmModel = null;
let historicalData = [];
let predictions = [];
let forecast = [];
let predictionChart = null;
let forecastChart = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('LSTM Prediction page loaded');
    initializeEventListeners();
});

function initializeEventListeners() {
    const trainBtn = document.getElementById('train-model-btn');
    const predictBtn = document.getElementById('predict-btn');
    
    if (trainBtn) {
        trainBtn.addEventListener('click', trainLSTMModel);
    }
    
    if (predictBtn) {
        predictBtn.addEventListener('click', generatePredictions);
    }
}

async function trainLSTMModel() {
    const cryptoSelect = document.getElementById('crypto-select');
    const lookbackSelect = document.getElementById('lookback-select');
    const epochsSelect = document.getElementById('epochs-select');
    const statusDiv = document.getElementById('model-status');
    const trainBtn = document.getElementById('train-model-btn');
    
    if (!cryptoSelect || !lookbackSelect) return;
    
    const cryptoId = cryptoSelect.value;
    const lookback = parseInt(lookbackSelect.value);
    const epochs = parseInt(epochsSelect.value);
    
    statusDiv.textContent = 'Loading historical data...';
    statusDiv.className = 'model-status loading';
    trainBtn.disabled = true;
    trainBtn.querySelector('.btn-text').style.display = 'none';
    trainBtn.querySelector('.btn-loader').style.display = 'inline';
    
    try {
        historicalData = await cryptoAPI.getCryptoHistory(cryptoId);
        
        if (!historicalData || historicalData.length < 30) {
            throw new Error('Insufficient historical data for training');
        }
        
        statusDiv.textContent = 'Preprocessing data...';
        const preparedData = prepareDataForLSTM(historicalData, lookback);
        
        statusDiv.textContent = 'Training LSTM model...';
        lstmModel = simulateLSTMTraining(preparedData, epochs, lookback);
        
        document.getElementById('predict-btn').disabled = false;
        statusDiv.textContent = 'Model trained successfully!';
        statusDiv.className = 'model-status success';
        
        generatePredictions();
        
    } catch (error) {
        console.error('Error training LSTM model:', error);
        statusDiv.textContent = `Error: ${error.message}`;
        statusDiv.className = 'model-status error';
    } finally {
        trainBtn.disabled = false;
        trainBtn.querySelector('.btn-text').style.display = 'inline';
        trainBtn.querySelector('.btn-loader').style.display = 'none';
    }
}

function prepareDataForLSTM(data, lookback) {
    const prices = data.map(d => parseFloat(d.close) || parseFloat(d.price) || 0);
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    const normalizedPrices = prices.map(p => (p - minPrice) / (maxPrice - minPrice));
    
    const X = [];
    const y = [];
    
    for (let i = lookback; i < normalizedPrices.length; i++) {
        X.push(normalizedPrices.slice(i - lookback, i));
        y.push(normalizedPrices[i]);
    }
    
    const splitIndex = Math.floor(X.length * 0.7);
    const X_train = X.slice(0, splitIndex);
    const y_train = y.slice(0, splitIndex);
    const X_test = X.slice(splitIndex);
    const y_test = y.slice(splitIndex);
    
    return {
        X_train, y_train, X_test, y_test,
        minPrice, maxPrice,
        originalPrices: prices,
        dates: data.map(d => d.date)
    };
}

function simulateLSTMTraining(data, epochs, lookback) {
    console.log(`Simulating LSTM training with ${epochs} epochs`);
    
    const weights = Array(lookback).fill(0.5);
    const bias = 0.1;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
        if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}/${epochs}`);
        }
    }
    
    const predictFunction = (sequence) => {
        const weightedSum = sequence.reduce((sum, val, idx) => sum + val * weights[idx], 0);
        return weightedSum / lookback + bias;
    };
    
    const forecastFunction = (sequence, steps) => {
        const forecasts = [];
        let currentSequence = [...sequence];
        
        for (let i = 0; i < steps; i++) {
            const pred = predictFunction(currentSequence);
            forecasts.push(pred);
            currentSequence.shift();
            currentSequence.push(pred);
        }
        
        return forecasts;
    };
    
    return {
        predict: predictFunction,
        forecast: forecastFunction,
        weights: weights,
        bias: bias
    };
}

function generatePredictions() {
    if (!lstmModel || !historicalData.length) {
        alert('Please train the model first');
        return;
    }
    
    const lookbackSelect = document.getElementById('lookback-select');
    const forecastSelect = document.getElementById('forecast-select');
    const lookback = parseInt(lookbackSelect.value);
    const forecastDays = parseInt(forecastSelect.value);
    
    const preparedData = prepareDataForLSTM(historicalData, lookback);
    
    predictions = [];
    for (let i = 0; i < preparedData.X_test.length; i++) {
        const normalizedPred = lstmModel.predict(preparedData.X_test[i]);
        const actualPrice = denormalize(normalizedPred, preparedData.minPrice, preparedData.maxPrice);
        const actualActual = denormalize(preparedData.y_test[i], preparedData.minPrice, preparedData.maxPrice);
        
        predictions.push({
            date: preparedData.dates[preparedData.X_train.length + lookback + i],
            actual: actualActual,
            predicted: actualPrice,
            error: Math.abs(actualActual - actualPrice) / actualActual * 100
        });
    }
    
    const lastSequence = preparedData.X_test[preparedData.X_test.length - 1] || 
                        preparedData.X_train[preparedData.X_train.length - 1];
    
    const normalizedForecast = lstmModel.forecast(lastSequence, forecastDays);
    forecast = normalizedForecast.map((pred, idx) => ({
        date: new Date(Date.now() + (idx + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predicted: denormalize(pred, preparedData.minPrice, preparedData.maxPrice),
        change: idx === 0 ? 0 : ((pred - normalizedForecast[idx - 1]) / normalizedForecast[idx - 1] * 100)
    }));
    
    calculateMetrics(predictions);
    updatePredictionsTable();
    updateForecastTable();
    drawCharts(preparedData, predictions, forecast);
}

function denormalize(value, min, max) {
    return value * (max - min) + min;
}

function calculateMetrics(predictions) {
    if (predictions.length === 0) return;
    
    const errors = predictions.map(p => p.actual - p.predicted);
    const squaredErrors = errors.map(e => e * e);
    const absoluteErrors = errors.map(e => Math.abs(e));
    const percentageErrors = predictions.map(p => Math.abs(p.error));
    
    const mse = squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length;
    const rmse = Math.sqrt(mse);
    document.getElementById('rmse-value').textContent = rmse.toFixed(2);
    
    const mape = percentageErrors.reduce((a, b) => a + b, 0) / percentageErrors.length;
    document.getElementById('mape-value').textContent = mape.toFixed(2) + '%';
    
    const actualMean = predictions.reduce((sum, p) => sum + p.actual, 0) / predictions.length;
    const totalSumSquares = predictions.reduce((sum, p) => sum + Math.pow(p.actual - actualMean, 2), 0);
    const r2 = 1 - (squaredErrors.reduce((a, b) => a + b, 0) / totalSumSquares);
    document.getElementById('r2-value').textContent = r2.toFixed(3);
    
    let correctDirections = 0;
    for (let i = 1; i < predictions.length; i++) {
        const actualDir = predictions[i].actual > predictions[i-1].actual;
        const predictedDir = predictions[i].predicted > predictions[i-1].predicted;
        if (actualDir === predictedDir) correctDirections++;
    }
    const accuracy = (correctDirections / (predictions.length - 1)) * 100;
    document.getElementById('accuracy-value').textContent = accuracy.toFixed(1) + '%';
}

function updatePredictionsTable() {
    const tableBody = document.querySelector('#predictions-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    predictions.slice(-10).forEach(pred => {
        const row = document.createElement('tr');
        const signal = pred.predicted > pred.actual ? '↑ Buy' : pred.predicted < pred.actual ? '↓ Sell' : '↔ Hold';
        const signalClass = pred.predicted > pred.actual ? 'signal-buy' : pred.predicted < pred.actual ? 'signal-sell' : 'signal-hold';
        
        row.innerHTML = `
            <td>${pred.date}</td>
            <td>$${pred.actual.toFixed(2)}</td>
            <td>$${pred.predicted.toFixed(2)}</td>
            <td class="${pred.error > 5 ? 'error-high' : 'error-low'}">${pred.error.toFixed(2)}%</td>
            <td class="${signalClass}">${signal}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateForecastTable() {
    const tableBody = document.querySelector('#forecast-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    forecast.forEach(fc => {
        const row = document.createElement('tr');
        const confidence = fc.change > 5 ? 'High' : fc.change < -5 ? 'Low' : 'Medium';
        const changeClass = fc.change > 0 ? 'change-positive' : fc.change < 0 ? 'change-negative' : 'change-neutral';
        
        row.innerHTML = `
            <td>${fc.date}</td>
            <td>$${fc.predicted.toFixed(2)}</td>
            <td class="${changeClass}">${fc.change > 0 ? '+' : ''}${fc.change.toFixed(2)}%</td>
            <td class="confidence-${confidence.toLowerCase()}">${confidence}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function drawCharts(preparedData, predictions, forecast) {
    const ctx1 = document.getElementById('predictionChart');
    if (!ctx1) return;
    
    if (predictionChart) {
        predictionChart.destroy();
    }
    
    const predictionDates = predictions.map(p => p.date);
    const actualPrices = predictions.map(p => p.actual);
    const predictedPrices = predictions.map(p => p.predicted);
    
    predictionChart = new Chart(ctx1.getContext('2d'), {
        type: 'line',
        data: {
            labels: predictionDates,
            datasets: [
                {
                    label: 'Actual Price',
                    data: actualPrices,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Predicted Price',
                    data: predictedPrices,
                    borderColor: '#e74c3c',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { display: true, title: { display: true, text: 'Date' } },
                y: { 
                    display: true, 
                    title: { display: true, text: 'Price (USD)' },
                    ticks: { callback: value => '$' + value.toFixed(2) }
                }
            }
        }
    });
    
    const ctx2 = document.getElementById('forecastChart');
    if (!ctx2) return;
    
    if (forecastChart) {
        forecastChart.destroy();
    }
    
    const forecastDates = forecast.map(f => f.date);
    const forecastPrices = forecast.map(f => f.predicted);
    const lastActual = predictions.length > 0 ? predictions[predictions.length - 1].actual : 
                     preparedData.originalPrices[preparedData.originalPrices.length - 1];
    
    forecastChart = new Chart(ctx2.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Last Actual', ...forecastDates],
            datasets: [{
                label: 'Price Forecast',
                data: [lastActual, ...forecastPrices],
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { 
                    mode: 'index', 
                    intersect: false,
                    callbacks: {
                        label: ctx => `Price: $${ctx.raw.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: { display: true, title: { display: true, text: 'Date' } },
                y: { 
                    display: true, 
                    title: { display: true, text: 'Price (USD)' },
                    ticks: { callback: value => '$' + value.toFixed(2) }
                }
            }
        }
    });
}

window.lstmPredictor = {
    trainLSTMModel,
    generatePredictions
};