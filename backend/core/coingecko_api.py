import requests
import time
import numpy as np
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from dataclasses import dataclass

class CoinGeckoAPI:
    """Interface avec l'API CoinGecko"""
    
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.session = requests.Session()
        self.last_request_time = 0
        self.rate_limit_delay = 1.2  # Respect rate limits
    
    def _wait_for_rate_limit(self):
        """Respect des limites de taux"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - time_since_last)
        
        self.last_request_time = time.time()
    
    def get_price_data(self, coin_id: str, vs_currency: str = "usd", days: int = 30) -> Optional[List[float]]:
        """
        Récupère les données de prix historiques
        Retourne une liste des prix de clôture
        """
        try:
            self._wait_for_rate_limit()
            
            url = f"{self.base_url}/coins/{coin_id}/market_chart"
            params = {
                'vs_currency': vs_currency,
                'days': days,
                'interval': 'daily' if days > 1 else 'hourly'
            }
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if 'prices' in data:
                # Extrait seulement les prix (pas les timestamps)
                prices = [price[1] for price in data['prices']]
                return prices
            
            return None
            
        except Exception as e:
            print(f"Erreur CoinGecko API pour {coin_id}: {e}")
            return None
    
    def get_current_price(self, coin_id: str) -> Optional[float]:
        """Récupère le prix actuel d'une crypto"""
        try:
            self._wait_for_rate_limit()
            
            url = f"{self.base_url}/simple/price"
            params = {
                'ids': coin_id,
                'vs_currencies': 'usd'
            }
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if coin_id in data and 'usd' in data[coin_id]:
                return data[coin_id]['usd']
            
            return None
            
        except Exception as e:
            print(f"Erreur prix actuel pour {coin_id}: {e}")
            return None
    
    def get_trending_coins(self) -> List[Dict]:
        """Récupère les cryptos tendance"""
        try:
            self._wait_for_rate_limit()
            
            url = f"{self.base_url}/search/trending"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            return data.get('coins', [])
            
        except Exception as e:
            print(f"Erreur trending coins: {e}")
            return []

# Classes pour compatibilité avec votre logique de trading
class TradeAction:
    BUY = "BUY"
    SELL = "SELL"

@dataclass
class Trade:
    coin_id: str
    action: str
    amount: float
    price: float
    date: datetime
    
    def to_dict(self):
        return {
            'coin_id': self.coin_id,
            'action': self.action,
            'amount': self.amount,
            'price': self.price,
            'date': self.date.isoformat()
        }

@dataclass
class Position:
    coin_id: str
    amount: float
    entry_price: float
    entry_date: datetime
    
    def to_dict(self):
        return {
            'coin_id': self.coin_id,
            'amount': self.amount,
            'entry_price': self.entry_price,
            'entry_date': self.entry_date.isoformat()
        }

@dataclass
class MonthlyStats:
    month: int
    starting_capital: float
    ending_capital: float
    trades_count: int = 0
    winning_trades: int = 0
    moon_shots: int = 0
    
    @property
    def return_pct(self):
        if self.starting_capital <= 0:
            return 0
        return ((self.ending_capital - self.starting_capital) / self.starting_capital) * 100
    
    def to_dict(self):
        return {
            'month': self.month,
            'starting_capital': self.starting_capital,
            'ending_capital': self.ending_capital,
            'return_pct': self.return_pct,
            'trades_count': self.trades_count,
            'winning_trades': self.winning_trades,
            'moon_shots': self.moon_shots
        }

class SmartMemecoinBacktester:
    """
    Backtester pour memecoins avec votre logique de trading
    Compatible avec votre GUI original
    """
    
    def __init__(self, initial_capital=10000, position_size_percent=2.0, coingecko_api=None):
        self.initial_capital = initial_capital
        self.current_capital = initial_capital
        self.position_size_percent = position_size_percent
        self.coingecko_api = coingecko_api or CoinGeckoAPI()
        
        # Paramètres de trading (comme dans votre GUI)
        self.stop_loss_percent = -20
        self.max_holding_days = 8
        self.take_profits = [35, 80, 200, 500, 1200]
        self.detection_threshold = 30
        
        # Historique
        self.trades = []
        self.positions = []
        self.monthly_stats = []
        
    def apply_exit_rules(self, performance: float) -> float:
        """
        Applique les règles de sortie exactement comme dans votre GUI
        """
        # Stop Loss
        if performance <= self.stop_loss_percent:
            return self.stop_loss_percent
        
        # Take Profits (du plus élevé au plus bas)
        for tp in sorted(self.take_profits, reverse=True):
            if performance >= tp:
                return tp
        
        return performance
    
    def generate_realistic_performance(self) -> float:
        """
        Génère une performance réaliste basée sur l'analyse des memecoins
        Logique identique à votre GUI
        """
        # Facteurs de marché
        base_trend = np.random.normal(1.5, 3.0)
        volatility = np.random.uniform(40, 80)
        
        # Simulation sur max_holding_days
        cumulative = 0
        for day in range(self.max_holding_days):
            daily = np.random.normal(base_trend, volatility/12)
            
            # Events spéciaux (basés sur l'analyse réelle des memecoins)
            random_event = np.random.random()
            
            if random_event < 0.08:  # Moon shot (8% comme observé)
                daily += np.random.uniform(200, 800)
            elif random_event < 0.05:  # Pump majeur (5%)
                daily += np.random.uniform(50, 150)
            elif random_event < 0.12:  # Dump (12%)
                daily -= np.random.uniform(30, 60)
            
            cumulative += daily
        
        return cumulative
    
    def execute_trade(self, coin_id: str, performance: float) -> Dict:
        """
        Exécute un trade avec la logique exacte de votre GUI
        """
        # Applique les règles de sortie
        final_return = self.apply_exit_rules(performance)
        
        # Calcul P&L
        position_size_usd = self.current_capital * (self.position_size_percent / 100)
        pnl = position_size_usd * (final_return / 100) - 40  # fees
        
        # Mise à jour du capital
        self.current_capital += pnl
        
        # Crée le trade
        trade = Trade(
            coin_id=coin_id,
            action=TradeAction.SELL,
            amount=position_size_usd,
            price=final_return,
            date=datetime.now()
        )
        
        self.trades.append(trade)
        
        return {
            'coin_id': coin_id,
            'return': final_return,
            'pnl': pnl,
            'action': TradeAction.SELL,
            'is_moon_shot': final_return >= 100
        }
    
    def simulate_month(self, month: int) -> MonthlyStats:
        """
        Simule un mois de trading
        """
        month_start_capital = self.current_capital
        month_trades = np.random.randint(8, 16)  # 8-15 trades par mois
        winning_trades = 0
        moon_shots = 0
        
        # Liste des memecoins populaires
        memecoin_list = [
            'dogecoin', 'shiba-inu', 'pepe', 'floki', 'bonk', 
            'wojak', 'mog-coin', 'brett-based', 'book-of-meme',
            'dogwifcoin', 'cat-in-a-dogs-world', 'memecoin-2'
        ]
        
        for _ in range(month_trades):
            # Sélectionne un memecoin aléatoire
            coin_id = np.random.choice(memecoin_list)
            
            # Génère la performance
            performance = self.generate_realistic_performance()
            
            # Exécute le trade
            trade_result = self.execute_trade(coin_id, performance)
            
            if trade_result['return'] > 0:
                winning_trades += 1
            
            if trade_result['is_moon_shot']:
                moon_shots += 1
        
        # Crée les stats mensuelles
        stats = MonthlyStats(
            month=month,
            starting_capital=month_start_capital,
            ending_capital=self.current_capital,
            trades_count=month_trades,
            winning_trades=winning_trades,
            moon_shots=moon_shots
        )
        
        self.monthly_stats.append(stats)
        return stats
    
    def run_backtest(self, start_month: int, end_month: int) -> Dict:
        """
        Lance un backtest complet
        """
        results = {
            'initial_capital': self.initial_capital,
            'monthly_stats': [],
            'trades': [],
            'summary': {}
        }
        
        for month in range(start_month, end_month + 1):
            stats = self.simulate_month(month)
            results['monthly_stats'].append(stats.to_dict())
        
        # Résultats finaux
        results['trades'] = [trade.to_dict() for trade in self.trades]
        results['final_capital'] = self.current_capital
        results['total_return'] = ((self.current_capital - self.initial_capital) / self.initial_capital) * 100
        
        return results
    
    def get_performance_metrics(self) -> Dict:
        """
        Calcule les métriques de performance
        """
        if not self.trades:
            return {}
        
        returns = [trade.price for trade in self.trades]
        winning_returns = [r for r in returns if r > 0]
        losing_returns = [r for r in returns if r <= 0]
        
        return {
            'total_trades': len(self.trades),
            'winning_trades': len(winning_returns),
            'losing_trades': len(losing_returns),
            'win_rate': (len(winning_returns) / len(returns)) * 100 if returns else 0,
            'best_trade': max(returns) if returns else 0,
            'worst_trade': min(returns) if returns else 0,
            'avg_gain': np.mean(winning_returns) if winning_returns else 0,
            'avg_loss': np.mean(losing_returns) if losing_returns else 0,
            'moon_shots': len([r for r in returns if r >= 100])
        }