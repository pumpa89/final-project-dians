import pandas as pd
import os
from typing import List, Dict, Optional
from datetime import datetime

class CSVManager:
    def __init__(self, base_path: str = "data"):
        self.base_path = base_path
        self.ensure_directories()
    
    def ensure_directories(self):
        os.makedirs(f"{self.base_path}/raw", exist_ok=True)
        os.makedirs(f"{self.base_path}/processed", exist_ok=True)
        os.makedirs(f"{self.base_path}/historical", exist_ok=True)
    
    def save_cryptocurrency_list(self, cryptocurrencies: List[Dict]):
        if not cryptocurrencies:
            return
        
        df = pd.DataFrame(cryptocurrencies)
        
        file_path = f"{self.base_path}/raw/top_cryptocurrencies.csv"
        df.to_csv(file_path, index=False)
    
    def get_last_date_for_crypto(self, crypto_id: str) -> Optional[str]:

        file_path = f"{self.base_path}/historical/{crypto_id}.csv"
        
        if not os.path.exists(file_path):
            return None 
        
        try:
            df = pd.read_csv(file_path)
            if df.empty or 'date' not in df.columns:
                return None
            
            last_date = df['date'].max()
            return last_date
            
        except Exception as e:
            return None
    
    def save_historical_data(self, crypto_id: str, historical_data: List[Dict]):
        if not historical_data:
            return
        
        df = pd.DataFrame(historical_data)
        
        file_path = f"{self.base_path}/historical/{crypto_id}.csv"
        df.to_csv(file_path, index=False)
    
    def append_historical_data(self, crypto_id: str, new_data: List[Dict]):
        if not new_data:
            return
        
        file_path = f"{self.base_path}/historical/{crypto_id}.csv"
        
        if not os.path.exists(file_path):
            self.save_historical_data(crypto_id, new_data)
            return
        
        try:
            existing_df = pd.read_csv(file_path)
            
            new_df = pd.DataFrame(new_data)
            
            combined_df = pd.concat([existing_df, new_df]).drop_duplicates(subset=['date']).sort_values('date')
            
            combined_df.to_csv(file_path, index=False)
            
        except Exception as e:
            print("x")
