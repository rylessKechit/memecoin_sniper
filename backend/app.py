from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
import uvicorn
import os

# Imports des modules locaux
from api.backtest import backtest_router
from api.data import data_router
from api.config import config_router
from core.memecoin_bot import CoinGeckoAPI
from utils.storage import active_backtests, backtest_results_cache

app = FastAPI(
    title="🤖 Memecoin Trading Bot API",
    description="API pour le bot de trading memecoin avec CoinGecko",
    version="1.0.0"
)

# CORS pour Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation des composants
coingecko_api = CoinGeckoAPI()

# Routes principales
app.include_router(backtest_router, prefix="/api")
app.include_router(data_router, prefix="/api")
app.include_router(config_router, prefix="/api")

@app.get("/")
async def root():
    """Page d'accueil API"""
    return {
        "message": "🤖 Memecoin Trading Bot API",
        "status": "running",
        "version": "1.0.0",
        "documentation": "/docs"
    }

@app.get("/api/status")
async def get_api_status():
    """Status général de l'API"""
    return {
        "status": "running",
        "version": "1.0.0",
        "active_backtests": len(active_backtests),
        "coingecko_status": await check_coingecko_status(),
        "timestamp": datetime.now().isoformat()
    }

async def check_coingecko_status():
    """Vérifie si CoinGecko API est accessible"""
    try:
        btc_data = coingecko_api.get_price_data("bitcoin", 1, 1)
        return "connected" if btc_data else "error"
    except:
        return "error"

if __name__ == "__main__":
    # Crée les dossiers nécessaires
    os.makedirs("data/configs", exist_ok=True)
    os.makedirs("data/backtests", exist_ok=True)
    
    print("🤖 Démarrage Memecoin Trading Bot API...")
    print("📊 Intégration CoinGecko: ✅")
    print("🎯 Stratégie: Votre logique originale")
    print("🌐 Interface: http://localhost:8000")
    print("📚 Documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        "app:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )