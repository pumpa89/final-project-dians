from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import os
import numpy as np

app = Flask(__name__)
CORS(app)

BASE_DATA_PATH = "data"
TOP_CRYPTOS_PATH = f"{BASE_DATA_PATH}/raw/top_cryptocurrencies.csv"
HISTORICAL_FOLDER = f"{BASE_DATA_PATH}/historical"

cryptos_df = pd.read_csv(TOP_CRYPTOS_PATH)

cryptos_df = cryptos_df.replace({np.nan: None})

cryptos_list = cryptos_df.to_dict(orient="records")

@app.route("/api/cryptos")
def get_all_cryptos():
    """Return all cryptos from top-cryptocurrencies.csv"""
    return jsonify(cryptos_list)


@app.route("/api/cryptos/top/<int:limit>")
def get_top_cryptos(limit):
    """Return top N cryptocurrencies by market cap rank"""
    top_cryptos = cryptos_list[:limit]
    return jsonify(top_cryptos)


@app.route("/api/cryptos/search")
def search_cryptos():
    """Search cryptocurrencies by name or symbol"""
    from flask import request
    query = request.args.get('q', '').lower()
    
    if not query:
        return jsonify([])
    
    results = [
        crypto for crypto in cryptos_list
        if query in str(crypto.get('name', '')).lower() or 
           query in str(crypto.get('symbol', '')).lower()
    ]
    
    return jsonify(results)


@app.route("/api/cryptos/<crypto_id>")
def get_crypto_details(crypto_id):
    """Return one crypto based on its ID (id column in CSV)"""
    filtered = cryptos_df[cryptos_df["id"] == crypto_id]
    
    if filtered.empty:
        return jsonify({"error": "Crypto not found"}), 404
    
    crypto_dict = filtered.iloc[0].to_dict()
    crypto_dict = {k: (None if pd.isna(v) else v) for k, v in crypto_dict.items()}
    
    return jsonify(crypto_dict)


@app.route("/api/cryptos/<crypto_id>/history")
def get_crypto_history(crypto_id):
    """Return historical data for given crypto by loading <id>.csv"""
    file_path = f"{HISTORICAL_FOLDER}/{crypto_id}.csv"
    
    if not os.path.exists(file_path):
        return jsonify({"error": f"No historical data for {crypto_id}"}), 404
    
    df = pd.read_csv(file_path)
    
    df = df.replace({np.nan: None})
    
    return jsonify(df.to_dict(orient="records"))


@app.route("/api/stats")
def get_market_stats():
    """Return overall market statistics"""
    total_market_cap = sum(crypto.get('market_cap', 0) or 0 for crypto in cryptos_list)
    total_volume = sum(crypto.get('total_volume', 0) or 0 for crypto in cryptos_list)
    
    # Get Bitcoin dominance
    bitcoin = next((c for c in cryptos_list if c.get('id') == 'bitcoin'), None)
    btc_dominance = 0
    if bitcoin and total_market_cap > 0:
        btc_cap = bitcoin.get('market_cap', 0) or 0
        btc_dominance = (btc_cap / total_market_cap) * 100
    
    stats = {
        'total_cryptocurrencies': len(cryptos_list),
        'total_market_cap': total_market_cap,
        'total_volume_24h': total_volume,
        'bitcoin_dominance': btc_dominance,
        'top_gainer': get_top_gainer(),
        'top_loser': get_top_loser()
    }
    
    return jsonify(stats)


def get_top_gainer():
    """Find cryptocurrency with highest 24h percentage change"""
    try:
        valid_cryptos = [c for c in cryptos_list if c.get('price_change_percentage_24h') is not None]
        if valid_cryptos:
            top = max(valid_cryptos, key=lambda x: x.get('price_change_percentage_24h', -float('inf')))
            return {
                'name': top.get('name'),
                'symbol': top.get('symbol'),
                'change': top.get('price_change_percentage_24h')
            }
    except:
        pass
    return None


def get_top_loser():
    """Find cryptocurrency with lowest 24h percentage change"""
    try:
        valid_cryptos = [c for c in cryptos_list if c.get('price_change_percentage_24h') is not None]
        if valid_cryptos:
            bottom = min(valid_cryptos, key=lambda x: x.get('price_change_percentage_24h', float('inf')))
            return {
                'name': bottom.get('name'),
                'symbol': bottom.get('symbol'),
                'change': bottom.get('price_change_percentage_24h')
            }
    except:
        pass
    return None

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)