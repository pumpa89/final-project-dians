// api-client.js - Communication with Python backend

class CryptoAPI {
    constructor() {
        this.baseURL = 'http://127.0.0.1:5001/api'
    }

    async getAllCryptos() {
        try {
            const response = await fetch(`${this.baseURL}/cryptos`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching all cryptos:', error);
            return [];
        }
    }

    async getTopCryptos(limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/cryptos/top/${limit}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching top cryptos:', error);
            return [];
        }
    }

    async searchCryptos(query) {
        try {
            const response = await fetch(`${this.baseURL}/cryptos/search?q=${encodeURIComponent(query)}`);
            return await response.json();
        } catch (error) {
            console.error('Error searching cryptos:', error);
            return [];
        }
    }

    async getCryptoDetails(cryptoId) {
        try {
            const response = await fetch(`${this.baseURL}/cryptos/${cryptoId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching crypto details:', error);
            return null;
        }
    }

    async getCryptoHistory(cryptoId) {
        try {
            const response = await fetch(`${this.baseURL}/cryptos/${cryptoId}/history`);
            if (!response.ok) {
                console.log(`No historical data available for ${cryptoId}`);
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching crypto history:', error);
            return [];
        }
    }

    async getMarketStats() {
        try {
            const response = await fetch(`${this.baseURL}/stats`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching market stats:', error);
            return {};
        }
    }
}

// Create global instance
const cryptoAPI = new CryptoAPI();