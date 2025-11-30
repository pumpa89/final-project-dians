import pandas as pd
from typing import List, Dict
from src.utils.api_client import CoinGeckoClient
from src.utils.csv_manager import CSVManager
import time

class Filter1:
    
    def __init__(self):
        self.api_client = CoinGeckoClient()
        self.csv_manager = CSVManager()
        self.processed_data = []
    
    def get_all_cryptocurrencies(self, target_count: int = 1000) -> List[Dict]:
        
        all_cryptos = []
        page = 1
        per_page = 250 
        
        while len(all_cryptos) < target_count:
            
            url = f"{self.api_client.BASE_URL}/coins/markets"
            params = {
                'vs_currency': 'usd',
                'order': 'market_cap_desc',
                'per_page': per_page,
                'page': page,
                'sparkline': False
            }
            
            time.sleep(self.api_client.request_delay)
            
            try:
                response = self.api_client.session.get(url, params=params)
                response.raise_for_status()
                
                page_data = response.json()
                
                if not page_data:
                    print("x")
                    break
                
                all_cryptos.extend(page_data)
                
                page += 1
                
            except Exception as e:
                print(f"x")
                break
        
        return all_cryptos[:target_count] 
    
    def filter_invalid_cryptocurrencies(self, cryptocurrencies: List[Dict]) -> List[Dict]:
        
        valid_cryptos = []
        rejected_count = 0
        
        for i, crypto in enumerate(cryptocurrencies):
            crypto_symbol = crypto.get('symbol', '').lower()
            crypto_name = crypto.get('name', '')
            
            if i % 50 == 0: 
                print("")
            
            is_valid = True
            
            market_cap = crypto.get('market_cap', 0)
            if market_cap is None or market_cap < 100000: 
                is_valid = False
            
            volume = crypto.get('total_volume', 0)
            if volume is None or volume < 1000: 
                is_valid = False
            
            current_price = crypto.get('current_price')
            if current_price is None or current_price <= 0:
                is_valid = False
            
            existing_symbols = [c.get('symbol', '').lower() for c in valid_cryptos]
            if crypto_symbol in existing_symbols:
                is_valid = False
            
            if is_valid:
                valid_cryptos.append(crypto)
            else:
                rejected_count += 1
        
        if rejected_count > len(cryptocurrencies) * 0.5:  
            print("!")
        
        return valid_cryptos

    def process(self, target_count: int = 1000) -> List[Dict]:
        all_cryptos = self.get_all_cryptocurrencies(target_count)
        
        valid_cryptos = self.filter_invalid_cryptocurrencies(all_cryptos)
        
        if valid_cryptos:
            self.csv_manager.save_cryptocurrency_list(valid_cryptos)
            self.processed_data = valid_cryptos
        else:
            print("x")
        
        return valid_cryptos