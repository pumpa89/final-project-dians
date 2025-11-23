import yfinance as yf
import pandas as pd
import requests
import time
from typing import List, Dict

class CoinGeckoClient:
    
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    def __init__(self):
        self.session = requests.Session()
        self.request_delay = 1
    
    def get_top_cryptocurrencies(self, limit: int = 100) -> List[Dict]:
        
        url = f"{self.BASE_URL}/coins/markets"
        params = {
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': limit,
            'page': 1,
            'sparkline': False
        }
        
        time.sleep(self.request_delay)
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()  
            
            data = response.json()
            return data
            
        except requests.exceptions.RequestException as e:
            return []

    def get_historical_data_yahoo(self, symbol: str, years: int = 10) -> List[Dict]:
        try:
            yahoo_symbol = f"{symbol.upper()}-USD"
            
            ticker = yf.Ticker(yahoo_symbol)
            hist_data = ticker.history(period=f"{years}y")
            
            if hist_data.empty:
                return []
            
            historical_data = []
            for date, row in hist_data.iterrows():
                historical_data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'open': float(row['Open']),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'close': float(row['Close']),
                    'volume': float(row['Volume']),
                    'source': 'yahoo_finance'
                })
            
            return historical_data
            
        except Exception as e:
            return []