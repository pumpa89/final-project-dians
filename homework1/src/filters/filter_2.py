import pandas as pd
from typing import List, Dict
from src.utils.csv_manager import CSVManager
import time
from datetime import datetime
import os
import yfinance as yf

class Filter2:
    def __init__(self):
        self.csv_manager = CSVManager()
        self.processed_count = 0
        self.successful_count = 0
    
    def load_cryptocurrencies(self) -> List[Dict]:
        try:
            df = pd.read_csv("data/raw/top_cryptocurrencies.csv")
            cryptocurrencies = df.to_dict('records')
            return cryptocurrencies
        except Exception as e:
            return []
    
    def get_best_yahoo_symbol(self, crypto: Dict) -> str:
        symbol = crypto['symbol'].upper()
        name = crypto['name']
        

        symbol_formats = [
            f"{symbol}-USD",           
            f"{symbol}USD",            
            f"{symbol}-USDT",          
            name.upper().replace(' ', '') + "-USD", 
            f"{symbol}-EUR",           
            symbol,                   
        ]
        
        special_mappings = {
            'usdt': 'USDT-USD',
            'usdc': 'USDC-USD', 
            'busd': 'BUSD-USD',
            'dai': 'DAI-USD',
            'ust': 'UST-USD',
            'mim': 'MIM-USD',
            'frax': 'FRAX-USD',
        }
        
        if symbol.lower() in special_mappings:
            special_symbol = special_mappings[symbol.lower()]
            symbol_formats.insert(0, special_symbol) 
        
        for sym_format in symbol_formats:
            try:
                ticker = yf.Ticker(sym_format)
                hist_data = ticker.history(period="7d") 
                
                if not hist_data.empty and len(hist_data) > 0:
                    return sym_format
                else:
                    print("x")
            except Exception as e:
                print("x")
        return None
        
    def fetch_historical_data(self, crypto: Dict, yahoo_symbol: str) -> List[Dict]:
        try:
            ticker = yf.Ticker(yahoo_symbol)
            
            hist_data = ticker.history(period="10y") 
            
            if hist_data.empty:
                hist_data = ticker.history(period="max")
            
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
                    'source': 'yahoo_10_years'
                })
            
            if historical_data:
                start_date = historical_data[0]['date']
                end_date = historical_data[-1]['date']
                total_days = len(historical_data)
                years = total_days / 365.25
                
            return historical_data
            
        except Exception as e:
            return []
    
    def process(self, test_mode: bool = False, test_limit: int = None) -> Dict:
        start_time = time.time()
        
        cryptocurrencies = self.load_cryptocurrencies()
        
        if not cryptocurrencies:
            return {'error': 'No data from Filter 1'}
        
        if test_mode and test_limit is None:
            test_limit = 50
        
        if test_limit is not None:
            cryptocurrencies = cryptocurrencies[:test_limit]
            print(f"🔧 TEST MODE: Обработувам {test_limit} криптовалути")
        
        # Помали батчи за 1000 криптовалути
        batch_size = 5  # наместо 10, за да се намали оптоварувањето
        batches = [cryptocurrencies[i:i + batch_size] for i in range(0, len(cryptocurrencies), batch_size)]
        
        all_results = []
        
        for batch_num, batch in enumerate(batches, 1):
            batch_start = time.time()
            
            batch_results = self.process_crypto_batch(batch, batch_num)
            all_results.extend(batch_results)
            
            batch_time = time.time() - batch_start
            
            total_processed = len(all_results)
            total_successful = len([r for r in all_results if r['status'] == 'SUCCESS'])
            success_rate = (total_successful / total_processed) * 100 if total_processed > 0 else 0
            
            print(f"✅ Батч {batch_num}/{len(batches)} завршен: {success_rate:.1f}% успешност")
            
            if batch_num < len(batches):
                pause_time = 15  # подолга пауза помеѓу батчови
                print(f"⏳ Пауза од {pause_time} секунди...")
                time.sleep(pause_time)
        
        total_time = time.time() - start_time
        
        report = self.generate_report(all_results, total_time)
        return report
        
    def generate_report(self, results: List[Dict], total_time: float) -> Dict:
        successful = [r for r in results if r['status'] == 'SUCCESS']
        no_symbol = [r for r in results if r['status'] == 'NO_YAHOO_SYMBOL']
        no_data = [r for r in results if r['status'] == 'NO_DATA']
        
        total_records = sum(r['records_count'] for r in successful)
        
        return {
            'total_tested': len(results),
            'successful': len(successful),
            'no_symbol': len(no_symbol),
            'no_data': len(no_data),
            'total_records': total_records,
            'total_time': total_time
        }
    
    def validate_historical_data(self, historical_data: List[Dict], crypto_name: str) -> bool:
        if not historical_data:
            return False
        
        dates = [datetime.strptime(entry['date'], '%Y-%m-%d') for entry in historical_data]
        start_date = min(dates)
        end_date = max(dates)
        
        total_days = (end_date - start_date).days
        total_years = total_days / 365.25
        total_records = len(historical_data)
        
        if total_years >= 5:
            return True
        elif total_years >= 2:
            return True
        elif total_years >= 1:
            return True
        elif total_records >= 100: 
            return True
        else:
            return False

    def process_crypto_batch(self, batch: List[Dict], batch_num: int) -> List[Dict]:
        results = []
        
        for crypto in batch:
            self.processed_count += 1
            
            crypto_id = crypto['id']
            crypto_name = crypto['name']
            crypto_symbol = crypto['symbol']
            
            existing_data = self.csv_manager.get_last_date_for_crypto(crypto_id)
            if existing_data:
                last_date_obj = datetime.strptime(existing_data, '%Y-%m-%d')
                days_since_last = (datetime.now() - last_date_obj).days
                if days_since_last <= 7:
                    continue 
            
            yahoo_symbol = self.get_best_yahoo_symbol(crypto)
            
            if not yahoo_symbol:
                results.append({
                    'crypto_id': crypto_id,
                    'crypto_name': crypto_name,
                    'status': 'NO_YAHOO_SYMBOL',
                    'records_count': 0
                })
                continue
            
            historical_data = self.fetch_historical_data(crypto, yahoo_symbol)
            
            is_valid = self.validate_historical_data(historical_data, crypto_name)
            
            if historical_data and is_valid:
                self.csv_manager.save_historical_data(crypto_id, historical_data)
                self.successful_count += 1
                
                results.append({
                    'crypto_id': crypto_id,
                    'crypto_name': crypto_name,
                    'status': 'SUCCESS',
                    'records_count': len(historical_data),
                    'yahoo_symbol': yahoo_symbol,
                    'data_years': len(historical_data) / 365.25,
                    'date_range': f"{historical_data[0]['date']} до {historical_data[-1]['date']}"
                })
                
            else:
                results.append({
                    'crypto_id': crypto_id,
                    'crypto_name': crypto_name,
                    'status': 'INSUFFICIENT_DATA',
                    'records_count': len(historical_data) if historical_data else 0
                })
            
            time.sleep(3)  
        
        return results