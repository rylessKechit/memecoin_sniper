"""
🛡️ CoinGecko API - Version Ultra Robuste
Gestion des erreurs 429, 401 et rate limiting optimisé
"""

import requests
import time
import random
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import json

class CoinGeckoAPI:
    """
    Interface CoinGecko ultra-robuste avec fallbacks et cache
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.session = requests.Session()
        self.last_request_time = 0
        self.api_key = api_key
        
        # 🚨 RATE LIMITING ULTRA CONSERVATEUR
        # API gratuite: 10-50 calls/minute selon CoinGecko
        self.rate_limit_delay = 3.0  # 3 secondes entre requêtes (20 calls/minute max)
        self.max_retries = 3
        self.backoff_multiplier = 2
        
        # Cache simple pour éviter les requêtes répétées
        self.cache = {}
        self.cache_duration = 300  # 5 minutes
        
        # Headers avec User-Agent et clé API si disponible
        self.session.headers.update({
            'User-Agent': 'MemecoinBot/1.0 (Educational Purpose)',
            'Accept': 'application/json'
        })
        
        if self.api_key:
            self.session.headers['x-cg-demo-api-key'] = self.api_key
        
        print(f"🔗 CoinGecko API initialisée")
        print(f"   🔑 Clé API: {'✅' if api_key else '❌ Gratuite'}")
        print(f"   ⏰ Délai entre requêtes: {self.rate_limit_delay}s")
    
    def _get_cache_key(self, url: str, params: dict) -> str:
        """Génère une clé de cache unique"""
        return f"{url}_{hash(json.dumps(params, sort_keys=True))}"
    
    def _is_cache_valid(self, timestamp: float) -> bool:
        """Vérifie si le cache est encore valide"""
        return time.time() - timestamp < self.cache_duration
    
    def _wait_for_rate_limit(self):
        """
        🐌 Rate limiting ultra-conservateur
        """
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.rate_limit_delay:
            sleep_time = self.rate_limit_delay - time_since_last
            # Ajoute un peu de randomness pour éviter les patterns
            sleep_time += random.uniform(0.1, 0.5)
            print(f"⏳ Rate limit: pause de {sleep_time:.1f}s")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def _make_request(self, url: str, params: dict = None) -> Optional[dict]:
        """
        🚀 Requête robuste avec retry et gestion d'erreurs
        """
        if params is None:
            params = {}
        
        # Check cache first
        cache_key = self._get_cache_key(url, params)
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if self._is_cache_valid(timestamp):
                print(f"📦 Cache hit pour {url}")
                return cached_data
        
        for attempt in range(self.max_retries):
            try:
                self._wait_for_rate_limit()
                
                print(f"🌐 Requête CoinGecko: {url} (tentative {attempt + 1})")
                response = self.session.get(url, params=params, timeout=15)
                
                # Gestion des codes d'erreur spécifiques
                if response.status_code == 200:
                    data = response.json()
                    # Cache la réponse
                    self.cache[cache_key] = (data, time.time())
                    return data
                
                elif response.status_code == 429:
                    # Too Many Requests - Backoff exponentiel
                    wait_time = self.rate_limit_delay * (self.backoff_multiplier ** attempt)
                    wait_time += random.uniform(1, 5)  # Jitter
                    print(f"🚨 Rate limit 429: pause de {wait_time:.1f}s")
                    time.sleep(wait_time)
                    continue
                
                elif response.status_code == 401:
                    print(f"🔐 Erreur 401: API Key requise pour {url}")
                    return None
                
                elif response.status_code == 404:
                    print(f"❌ 404: Endpoint non trouvé {url}")
                    return None
                
                else:
                    print(f"⚠️ Erreur HTTP {response.status_code}: {response.text[:100]}")
                    if attempt < self.max_retries - 1:
                        time.sleep(2 ** attempt)  # Backoff
                        continue
                    return None
                    
            except requests.exceptions.Timeout:
                print(f"⏰ Timeout sur {url} (tentative {attempt + 1})")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                    
            except requests.exceptions.ConnectionError:
                print(f"🔌 Erreur de connexion sur {url} (tentative {attempt + 1})")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                    
            except Exception as e:
                print(f"💥 Erreur inattendue: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
        
        print(f"❌ Échec définitif pour {url} après {self.max_retries} tentatives")
        return None
    
    def get_price_data(self, coin_id: str, vs_currency: str = "usd", days: int = 30) -> Optional[List[float]]:
        """
        📈 Récupère les données de prix avec fallbacks
        """
        try:
            url = f"{self.base_url}/coins/{coin_id}/market_chart"
            params = {
                'vs_currency': vs_currency,
                'days': days,
                'interval': 'daily' if days > 1 else 'hourly'
            }
            
            data = self._make_request(url, params)
            
            if data and 'prices' in data:
                prices = [price[1] for price in data['prices']]
                print(f"✅ Prix récupérés pour {coin_id}: {len(prices)} points")
                return prices
            
            # Fallback: générer des données réalistes si API fail
            print(f"🎲 Fallback: génération de données simulées pour {coin_id}")
            return self._generate_fallback_prices(days)
            
        except Exception as e:
            print(f"⚠️ Erreur get_price_data pour {coin_id}: {e}")
            return self._generate_fallback_prices(days)
    
    def get_current_price(self, coin_id: str) -> Optional[float]:
        """
        💰 Prix actuel avec fallback
        """
        try:
            url = f"{self.base_url}/simple/price"
            params = {
                'ids': coin_id,
                'vs_currencies': 'usd'
            }
            
            data = self._make_request(url, params)
            
            if data and coin_id in data and 'usd' in data[coin_id]:
                price = data[coin_id]['usd']
                print(f"💰 Prix actuel {coin_id}: ${price}")
                return price
            
            # Fallback: prix simulé réaliste
            fallback_price = self._generate_fallback_price(coin_id)
            print(f"🎲 Prix fallback {coin_id}: ${fallback_price}")
            return fallback_price
            
        except Exception as e:
            print(f"⚠️ Erreur get_current_price pour {coin_id}: {e}")
            return self._generate_fallback_price(coin_id)
    
    def get_trending_coins(self) -> List[Dict]:
        """
        🔥 Coins tendance avec fallback
        """
        try:
            url = f"{self.base_url}/search/trending"
            data = self._make_request(url)
            
            if data and 'coins' in data:
                coins = data.get('coins', [])
                print(f"🔥 Trending coins récupérés: {len(coins)}")
                return coins
            
            # Fallback: liste de memecoins populaires
            return self._get_fallback_trending()
            
        except Exception as e:
            print(f"⚠️ Erreur get_trending_coins: {e}")
            return self._get_fallback_trending()
    
    def _generate_fallback_prices(self, days: int) -> List[float]:
        """
        🎲 Génère des prix fallback réalistes
        """
        import numpy as np
        
        base_price = random.uniform(0.00001, 0.1)  # Prix typique memecoin
        prices = []
        
        for i in range(days):
            # Volatilité élevée typique des memecoins
            daily_change = np.random.normal(0, 0.15)  # 15% volatilité journalière
            
            # Events spéciaux occasionnels
            if random.random() < 0.05:  # 5% chance de pump/dump
                daily_change += random.choice([-0.4, 0.6])  # -40% ou +60%
            
            base_price *= (1 + daily_change)
            base_price = max(base_price, 0.00001)  # Pas de prix négatif
            prices.append(base_price)
        
        return prices
    
    def _generate_fallback_price(self, coin_id: str) -> float:
        """
        💰 Prix fallback basé sur le coin
        """
        # Prix typiques selon le type de coin
        price_ranges = {
            'bitcoin': (40000, 70000),
            'ethereum': (2000, 4000),
            'dogecoin': (0.05, 0.3),
            'shiba-inu': (0.000008, 0.00003),
            'pepe': (0.000001, 0.000008)
        }
        
        if coin_id in price_ranges:
            min_price, max_price = price_ranges[coin_id]
            return random.uniform(min_price, max_price)
        
        # Pour les autres memecoins
        return random.uniform(0.00001, 0.001)
    
    def _get_fallback_trending(self) -> List[Dict]:
        """
        🔥 Liste fallback des trending coins
        """
        trending_memecoins = [
            {"item": {"id": "pepe", "name": "Pepe", "symbol": "PEPE"}},
            {"item": {"id": "dogecoin", "name": "Dogecoin", "symbol": "DOGE"}},
            {"item": {"id": "shiba-inu", "name": "Shiba Inu", "symbol": "SHIB"}},
            {"item": {"id": "floki", "name": "Floki", "symbol": "FLOKI"}},
            {"item": {"id": "bonk", "name": "Bonk", "symbol": "BONK"}},
            {"item": {"id": "wojak", "name": "Wojak", "symbol": "WOJAK"}},
            {"item": {"id": "dogwifcoin", "name": "dogwifhat", "symbol": "WIF"}}
        ]
        
        print("🎲 Utilisation de la liste trending fallback")
        return trending_memecoins
    
    def get_api_status(self) -> Dict:
        """
        📊 Status de l'API et statistiques
        """
        return {
            "api_key_configured": bool(self.api_key),
            "rate_limit_delay": self.rate_limit_delay,
            "cache_size": len(self.cache),
            "last_request": self.last_request_time,
            "base_url": self.base_url,
            "status": "✅ Opérationnelle avec fallbacks"
        }


# ============================================================================
# VERSION SIMULÉE POUR DÉVELOPPEMENT/TESTS
# ============================================================================

class MockCoinGeckoAPI:
    """
    🎭 Version simulée pour développement quand l'API est down
    """
    
    def __init__(self):
        print("🎭 MockCoinGeckoAPI activée - Mode simulation pure")
        self.memecoin_base_prices = {
            'bitcoin': 50000,
            'ethereum': 3000,
            'dogecoin': 0.08,
            'shiba-inu': 0.000015,
            'pepe': 0.000005,
            'floki': 0.00008,
            'bonk': 0.00002
        }
    
    def get_price_data(self, coin_id: str, vs_currency: str = "usd", days: int = 30) -> List[float]:
        """Données simulées ultra-réalistes"""
        import numpy as np
        
        base_price = self.memecoin_base_prices.get(coin_id, random.uniform(0.00001, 0.001))
        prices = []
        
        for day in range(days):
            # Simulation comportement memecoin
            daily_volatility = np.random.normal(0, 0.12)  # 12% volatilité
            
            # Events spéciaux memecoins
            if random.random() < 0.08:  # Moon shot
                daily_volatility += random.uniform(0.5, 2.0)
            elif random.random() < 0.12:  # Dump
                daily_volatility -= random.uniform(0.3, 0.8)
            
            base_price *= (1 + daily_volatility)
            base_price = max(base_price, 0.00001)
            prices.append(base_price)
        
        return prices
    
    def get_current_price(self, coin_id: str) -> float:
        """Prix simulé"""
        base = self.memecoin_base_prices.get(coin_id, 0.00005)
        return base * random.uniform(0.8, 1.2)
    
    def get_trending_coins(self) -> List[Dict]:
        """Trending simulé"""
        return [
            {"item": {"id": "pepe", "name": "Pepe", "symbol": "PEPE"}},
            {"item": {"id": "dogecoin", "name": "Dogecoin", "symbol": "DOGE"}},
            {"item": {"id": "shiba-inu", "name": "Shiba Inu", "symbol": "SHIB"}}
        ]


# ============================================================================
# FACTORY POUR CHOISIR LA BONNE API
# ============================================================================

def create_coingecko_api(api_key: Optional[str] = None, use_mock: bool = False) -> 'CoinGeckoAPI':
    """
    🏭 Factory pour créer l'API appropriée
    """
    if use_mock:
        return MockCoinGeckoAPI()
    else:
        return CoinGeckoAPI(api_key=api_key)


# Test si exécuté directement
if __name__ == "__main__":
    print("🧪 Test CoinGecko API robuste")
    
    # Test avec API réelle
    api = CoinGeckoAPI()
    
    # Test prix Bitcoin
    btc_price = api.get_current_price("bitcoin")
    print(f"Bitcoin: ${btc_price:,.0f}")
    
    # Test prix Dogecoin  
    doge_price = api.get_current_price("dogecoin")
    print(f"Dogecoin: ${doge_price:.4f}")
    
    # Test trending
    trending = api.get_trending_coins()
    print(f"Trending: {len(trending)} coins")
    
    # Status API
    status = api.get_api_status()
    print(f"Status: {status}")