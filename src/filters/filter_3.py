import pandas as pd
from typing import List, Dict, Optional
from src.utils.api_client import CoinGeckoClient
from src.utils.csv_manager import CSVManager
import time
from datetime import datetime, timedelta
import os

class Filter3:
    def __init__(self):
        self.api_client = CoinGeckoClient()
        self.csv_manager = CSVManager()
        self.base_path = "data"
        self.results = []
    
    def load_cryptocurrencies_from_filter1(self) -> List[Dict]:
        file_path = f"{self.base_path}/raw/top_cryptocurrencies.csv"
        
        try:
            df = pd.read_csv(file_path)
            cryptocurrencies = df.to_dict('records')
            return cryptocurrencies
            
        except Exception as e:
            return []
    
    def check_data_gaps(self, crypto_id: str) -> List[Dict]:
        file_path = f"{self.base_path}/historical/{crypto_id}.csv"
        
        if not os.path.exists(file_path):
            return self.generate_10_year_date_range() 
        
        try:
            df = pd.read_csv(file_path)
            
            if df.empty or 'date' not in df.columns:
                return self.generate_10_year_date_range()
            
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            start_date = df['date'].min()
            end_date = df['date'].max()
            total_days = (end_date - start_date).days
            total_years = total_days / 365.25
            total_records = len(df)
            
            if total_years < 8:
                return self.generate_10_year_date_range()
            
            all_dates = pd.date_range(start=start_date, end=end_date, freq='D')
            existing_dates = set(df['date'])
            missing_dates = [date for date in all_dates if date not in existing_dates]
            
            missing_data = [{'date': date.strftime('%Y-%m-%d'), 'missing': True} for date in missing_dates]
            
            return missing_data
            
        except Exception as e:
            return self.generate_10_year_date_range()

    def generate_10_year_date_range(self) -> List[Dict]:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * 10)  # 10 години
        
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        missing_dates = [{'date': date.strftime('%Y-%m-%d'), 'missing': True} for date in date_range]
        
        return missing_dates
    
    def format_and_clean_data(self, crypto_id: str) -> bool:
        file_path = f"{self.base_path}/historical/{crypto_id}.csv"
        
        if not os.path.exists(file_path):
            return False
        
        try:
            df = pd.read_csv(file_path)
            
            if df.empty:
                return False
            
            if 'close' in df.columns and 'price' not in df.columns:
                df['price'] = df['close']
            
            required_columns = ['date']
            price_column = 'price' if 'price' in df.columns else 'close'
            
            if price_column not in df.columns:
                return False
            
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            initial_count = len(df)
            df = df.drop_duplicates(subset=['date'], keep='last')
            
            df['date'] = df['date'].dt.strftime('%Y-%m-%d')
            
            initial_count = len(df)
            df = df[df[price_column] > 0] 
            cleaned_count = len(df)
            
            df.to_csv(file_path, index=False)
            
            return True
            
        except Exception as e:
            return False
    
    def calculate_statistics(self, crypto_id: str) -> Dict:
        file_path = f"{self.base_path}/historical/{crypto_id}.csv"
        
        if not os.path.exists(file_path):
            return {}
        
        try:
            df = pd.read_csv(file_path)
            
            if df.empty:
                return {}
            
            price_column = 'price' if 'price' in df.columns else 'close'
            
            if price_column not in df.columns:
                return {}
            
            stats = {
                'total_records': len(df),
                'date_range': f"{df['date'].min()} до {df['date'].max()}",
                'price_min': df[price_column].min(),
                'price_max': df[price_column].max(),
                'price_mean': df[price_column].mean(),
                'data_quality': 'GOOD' if len(df) > 100 else 'INSUFFICIENT'
            }
            
            if all(col in df.columns for col in ['open', 'high', 'low', 'close']):
                stats.update({
                    'ohlc_available': True,
                    'avg_daily_range': (df['high'] - df['low']).mean(),
                    'volatility': (df['high'] - df['low']).std()
                })
            
            return stats
            
        except Exception as e:
            return {}
    
    def process_cryptocurrency(self, crypto: Dict) -> Dict:
        crypto_id = crypto['id']
        crypto_name = crypto['name']
        
        missing_dates = self.check_data_gaps(crypto_id)
        
        filled_data = []
        
        formatting_success = self.format_and_clean_data(crypto_id)
        
        stats = self.calculate_statistics(crypto_id)
        
        result = {
            'crypto_id': crypto_id,
            'crypto_name': crypto_name,
            'missing_dates_found': len(missing_dates),
            'missing_dates_filled': len(filled_data),
            'formatting_success': formatting_success,
            'statistics': stats
        }
        
        return result
    
    def create_final_report(self) -> str:
        if not self.results:
            return ""
        
        report_data = []
        for result in self.results:
            report_data.append({
                'Crypto Name': result['crypto_name'],
                'Crypto ID': result['crypto_id'],
                'Missing Dates Found': result['missing_dates_found'],
                'Missing Dates Filled': result['missing_dates_filled'],
                'Formatting Success': result['formatting_success'],
                'Total Records': result['statistics'].get('total_records', 0),
                'Data Quality': result['statistics'].get('data_quality', 'UNKNOWN')
            })
        
        df = pd.DataFrame(report_data)
        
        os.makedirs(f"{self.base_path}/processed", exist_ok=True)
        report_path = f"{self.base_path}/processed/filter3_report.csv"
        df.to_csv(report_path, index=False)
        
        total_cryptos = len(self.results)
        total_filled = sum(r['missing_dates_filled'] for r in self.results)
        success_count = sum(1 for r in self.results if r['formatting_success'])
        success_rate = success_count / total_cryptos * 100 if total_cryptos > 0 else 0
        
        return ""
    
    def process(self, test_mode: bool = True) -> List[Dict]:
        cryptocurrencies = self.load_cryptocurrencies_from_filter1()
        
        if not cryptocurrencies:
            return []
        
        if test_mode:
            cryptocurrencies = cryptocurrencies[:3]
        
        for crypto in cryptocurrencies:
            result = self.process_cryptocurrency(crypto)
            self.results.append(result)
        
        report_summary = self.create_final_report()
        print(report_summary)
        
        return self.results
