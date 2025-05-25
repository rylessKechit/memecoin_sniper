from fastapi import APIRouter, HTTPException
from core.memecoin_bot import CoinGeckoAPI
from datetime import datetime, timedelta
import json

data_router = APIRouter()

# Initialize CoinGecko API
coingecko_api = CoinGeckoAPI()

@data_router.get("/data/memecoin-list")
async def get_memecoin_list():
    """Récupère la liste des memecoins populaires"""
    memecoin_list = [
        {'id': 'dogecoin', 'name': 'Dogecoin', 'symbol': 'DOGE'},
        {'id': 'shiba-inu', 'name': 'Shiba Inu', 'symbol': 'SHIB'},
        {'id': 'pepe', 'name': 'Pepe', 'symbol': 'PEPE'},
        {'id': 'floki', 'name': 'Floki Inu', 'symbol': 'FLOKI'},
        {'id': 'bonk', 'name': 'Bonk', 'symbol': 'BONK'},
        {'id': 'wojak', 'name': 'Wojak', 'symbol': 'WOJAK'},
        {'id': 'mog-coin', 'name': 'Mog Coin', 'symbol': 'MOG'},
        {'id': 'brett-based', 'name': 'Brett', 'symbol': 'BRETT'},
        {'id': 'book-of-meme', 'name': 'Book of Meme', 'symbol': 'BOME'},
        {'id': 'dogwifcoin', 'name': 'dogwifhat', 'symbol': 'WIF'},
        {'id': 'cat-in-a-dogs-world', 'name': 'Cat in a dogs world', 'symbol': 'MEW'},
        {'id': 'memecoin-2', 'name': 'Memecoin', 'symbol': 'MEME'}
    ]
    
    return {"memecoins": memecoin_list}

@data_router.get("/data/price/{coin_id}")
async def get_coin_price(coin_id: str, days: int = 30):
    """Récupère les données de prix pour une crypto"""
    try:
        # Utilise votre API CoinGecko existante
        price_data = coingecko_api.get_price_data(coin_id, 1, days)
        
        if not price_data:
            raise HTTPException(status_code=404, detail=f"Données non trouvées pour {coin_id}")
        
        return {
            "coin_id": coin_id,
            "days": days,
            "data": price_data,
            "last_updated": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur récupération données: {str(e)}")

@data_router.get("/data/market-overview")
async def get_market_overview():
    """Récupère un aperçu du marché crypto"""
    try:
        # Récupère les données pour les principales cryptos
        overview_coins = ['bitcoin', 'ethereum', 'dogecoin', 'shiba-inu']
        market_data = {}
        
        for coin in overview_coins:
            try:
                price_data = coingecko_api.get_price_data(coin, 1, 1)
                if price_data:
                    market_data[coin] = {
                        'current_price': price_data[-1] if price_data else 0,
                        'price_change_24h': 0  # Calcul simplifié
                    }
            except:
                market_data[coin] = {'current_price': 0, 'price_change_24h': 0}
        
        return {
            "market_data": market_data,
            "last_updated": datetime.now().isoformat(),
            "total_market_cap": "2.1T",  # Données simulées
            "market_dominance": {
                "bitcoin": 54.2,
                "ethereum": 17.8,
                "others": 28.0
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur aperçu marché: {str(e)}")

@data_router.get("/data/trending")
async def get_trending_coins():
    """Récupère les cryptos tendance"""
    try:
        # Simulation de données trending (remplacer par vraie API)
        trending_data = [
            {'id': 'pepe', 'name': 'Pepe', 'price_change_24h': 15.6},
            {'id': 'bonk', 'name': 'Bonk', 'price_change_24h': 12.3},
            {'id': 'floki', 'name': 'Floki Inu', 'price_change_24h': 8.9},
            {'id': 'wojak', 'name': 'Wojak', 'price_change_24h': 6.7},
            {'id': 'mog-coin', 'name': 'Mog Coin', 'price_change_24h': 5.4}
        ]
        
        return {
            "trending": trending_data,
            "last_updated": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur trending: {str(e)}")

@data_router.get("/data/performance-summary")
async def get_performance_summary():
    """Récupère un résumé des performances récentes"""
    try:
        # Simulation de données de performance (à remplacer par vrais calculs)
        summary_data = {
            "last_30_days": {
                "total_return": 23.4,
                "win_rate": 68.2,
                "total_trades": 45,
                "best_trade": 156.7,
                "worst_trade": -18.3,
                "moon_shots": 3
            },
            "last_7_days": {
                "total_return": 8.9,
                "win_rate": 71.4,
                "total_trades": 12,
                "best_trade": 89.2,
                "worst_trade": -12.1,
                "moon_shots": 1
            },
            "today": {
                "total_return": 2.1,
                "win_rate": 75.0,
                "total_trades": 4,
                "best_trade": 23.4,
                "worst_trade": -5.6,
                "moon_shots": 0
            }
        }
        
        return {
            "performance": summary_data,
            "last_updated": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur résumé performance: {str(e)}")

@data_router.get("/data/statistics")
async def get_trading_statistics():
    """Récupère les statistiques de trading détaillées"""
    try:
        # Simulation de statistiques détaillées
        stats_data = {
            "all_time": {
                "total_trades": 1247,
                "winning_trades": 849,
                "losing_trades": 398,
                "win_rate": 68.1,
                "profit_factor": 3.42,
                "sharpe_ratio": 2.34,
                "max_drawdown": -18.5,
                "best_month": 45.6,
                "worst_month": -12.3,
                "avg_trade_duration": 4.2,
                "largest_winning_streak": 12,
                "largest_losing_streak": 4
            },
            "by_month": [
                {"month": "2024-01", "return": 12.4, "trades": 34, "win_rate": 64.7},
                {"month": "2024-02", "return": 23.1, "trades": 41, "win_rate": 70.7},
                {"month": "2024-03", "return": -5.2, "trades": 38, "win_rate": 55.3},
                {"month": "2024-04", "return": 18.7, "trades": 45, "win_rate": 72.2},
                {"month": "2024-05", "return": 31.5, "trades": 52, "win_rate": 75.0},
                {"month": "2024-06", "return": 8.9, "trades": 39, "win_rate": 61.5},
                {"month": "2024-07", "return": 45.6, "trades": 48, "win_rate": 81.2},
                {"month": "2024-08", "return": -12.3, "trades": 43, "win_rate": 48.8},
                {"month": "2024-09", "return": 27.8, "trades": 41, "win_rate": 73.2},
                {"month": "2024-10", "return": 19.4, "trades": 47, "win_rate": 68.1},
                {"month": "2024-11", "return": 35.2, "trades": 44, "win_rate": 77.3},
                {"month": "2024-12", "return": 22.1, "trades": 38, "win_rate": 71.1}
            ],
            "by_coin": [
                {"coin": "PEPE", "total_trades": 89, "win_rate": 74.2, "avg_return": 28.4},
                {"coin": "BONK", "total_trades": 76, "win_rate": 69.7, "avg_return": 22.1},
                {"coin": "FLOKI", "total_trades": 82, "win_rate": 67.1, "avg_return": 19.8},
                {"coin": "DOGE", "total_trades": 94, "win_rate": 65.9, "avg_return": 18.3},
                {"coin": "SHIB", "total_trades": 88, "win_rate": 63.6, "avg_return": 16.7}
            ]
        }
        
        return {
            "statistics": stats_data,
            "last_updated": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur statistiques: {str(e)}")

@data_router.post("/data/export")
async def export_data(format: str = "json"):
    """Exporte les données de trading"""
    try:
        if format not in ["json", "csv"]:
            raise HTTPException(status_code=400, detail="Format non supporté. Utilisez 'json' ou 'csv'")
        
        # Simulation de données d'export
        export_data = {
            "trades": [
                {
                    "date": "2024-01-15",
                    "coin": "PEPE",
                    "entry_price": 0.000001234,
                    "exit_price": 0.000001678,
                    "return_pct": 36.0,
                    "pnl_usd": 72.45,
                    "holding_days": 3
                },
                # ... plus de trades
            ],
            "summary": {
                "total_trades": 142,
                "total_return": 156.7,
                "total_pnl": 11340.56
            }
        }
        
        if format == "json":
            return {
                "format": "json",
                "data": export_data,
                "exported_at": datetime.now().isoformat()
            }
        
        # Pour CSV, on retournerait les données formatées
        return {
            "format": "csv",
            "message": "Export CSV généré",
            "exported_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur export: {str(e)}")