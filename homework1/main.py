import time
import pandas as pd
from datetime import datetime
from src.filters.filter_1 import Filter1
from src.filters.filter_2 import Filter2
from src.filters.filter_3 import Filter3

class CryptoDataPipeline: 
    def __init__(self):
        self.filter1 = Filter1()
        self.filter2 = Filter2()
        self.filter3 = Filter3()
        self.execution_times = {}
        self.pipeline_results = {}
    
    def run_complete_pipeline(self, target_cryptos: int = 10, test_mode: bool = True):
        
        total_start_time = time.time()
        
        filter1_start = time.time()
        filter1_results = self.filter1.process(target_count=target_cryptos)
        filter1_time = time.time() - filter1_start
        
        self.execution_times['filter1'] = filter1_time
        self.pipeline_results['filter1'] = {
            'cryptos_processed': len(filter1_results),
            'execution_time': filter1_time
        }
        
        if not filter1_results:
            return
        
        time.sleep(2)
        
        filter2_start = time.time()
        if test_mode:
            filter2_results = self.filter2.process(test_limit=10)  
        else:
            filter2_results = self.filter2.process() 
        filter2_time = time.time() - filter2_start
        
        self.execution_times['filter2'] = filter2_time
        self.pipeline_results['filter2'] = {
            'cryptos_processed': filter2_results.get('total_tested', 0),
            'execution_time': filter2_time,
            'total_records': filter2_results.get('total_records', 0)
        }
        
        successful_filter2 = filter2_results.get('successful', 0)
        if successful_filter2 == 0:
            return
        
        time.sleep(2)
        
        filter3_start = time.time()
        filter3_results = self.filter3.process(test_mode=test_mode)
        filter3_time = time.time() - filter3_start
        
        self.execution_times['filter3'] = filter3_time
        self.pipeline_results['filter3'] = {
            'cryptos_processed': len(filter3_results),
            'execution_time': filter3_time,
            'total_filled': sum(r.get('missing_dates_filled', 0) for r in filter3_results)
        }
        
        total_time = time.time() - total_start_time
        self.execution_times['total'] = total_time
        
        self.generate_final_report()
    
    def generate_final_report(self):
        
        if 'filter2' in self.pipeline_results:
            total_records = self.pipeline_results['filter2']['total_records']
            
            if self.pipeline_results['filter2']['cryptos_processed'] > 0:
                avg_records = total_records / self.pipeline_results['filter2']['cryptos_processed']
        
        total_cryptos = self.pipeline_results['filter1']['cryptos_processed']
        total_time = self.execution_times['total']
        
        if total_time > 0 and total_cryptos > 0:
            cryptos_per_second = total_cryptos / total_time
    
    def check_data_quality(self):
        
        try:
            import os
            import glob

            historical_files = glob.glob("data/historical/*.csv")
            
            if historical_files:
                sample_files = historical_files[:3]
                for file_path in sample_files:
                    crypto_name = os.path.basename(file_path).replace('.csv', '')
                    df = pd.read_csv(file_path)
                    
                    if 'price' in df.columns:
                        print("x")
                    
                    if len(df) > 0:
                        date_range = (pd.to_datetime(df['date'].max()) - pd.to_datetime(df['date'].min())).days
                        print("x")
            
            main_list_path = "data/raw/top_cryptocurrencies.csv"
            if os.path.exists(main_list_path):
                df_main = pd.read_csv(main_list_path)
            
        except Exception as e:
            print("x")

def main():
    
    pipeline = CryptoDataPipeline()
    
    pipeline.run_complete_pipeline(
        target_cryptos=1000,
        test_mode=False       
    )
    
    pipeline.check_data_quality()

if __name__ == "__main__":
    main()