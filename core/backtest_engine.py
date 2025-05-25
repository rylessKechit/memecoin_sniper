import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import List, Dict, Callable, Optional
import time
import threading

@dataclass
class Trade:
    """Représente un trade"""
    month: int
    token: str
    action: str
    entry_price: float
    exit_price: float
    return_pct: float
    pnl: float
    date: str
    holding_days: int
    exit_reason: str

@dataclass
class MonthlyStats:
    """Statistiques mensuelles"""
    month: int
    starting_capital: float
    ending_capital: float
    return_pct: float
    trades_count: int
    winning_trades: int
    moon_shots: int
    total_pnl: float

class BacktestEngine:
    """Moteur de backtest principal"""
    
    def __init__(self):
        self.is_running = False
        self.progress_callback = None
        
    def run_backtest(self, params: Dict, progress_callback: Callable = None) -> Dict:
        """Lance le backtest principal"""
        self.is_running = True
        self.progress_callback = progress_callback
        
        try:
            # Validation des paramètres
            validated_params = self._validate_params(params)
            
            # Calcul de la période
            start_date = datetime(int(validated_params['start_year']), 
                                int(validated_params['start_month']), 1)
            end_date = datetime(int(validated_params['end_year']), 
                              int(validated_params['end_month']), 1)
            
            months_count = self._calculate_months(start_date, end_date)
            
            # Initialisation des résultats
            results = {
                'initial_capital': validated_params['initial_capital'],
                'capital': [validated_params['initial_capital']],
                'returns': [],
                'trades': [],
                'monthly_stats': [],
                'params_used': validated_params,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }
            
            # Simulation mensuelle
            current_capital = validated_params['initial_capital']
            
            for month in range(1, months_count + 1):
                if not self.is_running:
                    break
                
                # Simulation du mois
                month_results = self._simulate_month(month, current_capital, validated_params)
                
                # Mise à jour du capital
                current_capital = month_results['ending_capital']
                results['capital'].append(current_capital)
                results['returns'].append(month_results['return_pct'])
                results['trades'].extend(month_results['trades'])
                results['monthly_stats'].append(month_results['stats'])
                
                # Mise à jour du progress
                progress = (month / months_count) * 100
                total_return = ((current_capital - validated_params['initial_capital']) / 
                              validated_params['initial_capital']) * 100
                
                metrics = {
                    'capital': current_capital,
                    'return': total_return,
                    'trades': len(results['trades']),
                    'win_rate': self._calculate_win_rate(results['trades']),
                    'moon_shots': len([t for t in results['trades'] if t.get('return', 0) >= 100])
                }
                
                if self.progress_callback:
                    self.progress_callback(progress, f"📅 Mois {month}/{months_count}", metrics)
                
                # Pause pour l'effet visuel
                time.sleep(0.1)
            
            # Finalisation
            results['final_capital'] = current_capital
            results['total_return'] = ((current_capital - validated_params['initial_capital']) / 
                                     validated_params['initial_capital']) * 100
            
            return results
            
        except Exception as e:
            raise Exception(f"Erreur lors du backtest: {str(e)}")
        finally:
            self.is_running = False
    
    def _validate_params(self, params: Dict) -> Dict:
        """Valide et nettoie les paramètres"""
        validated = {}
        
        # Paramètres obligatoires avec valeurs par défaut
        required_params = {
            'initial_capital': 10000,
            'position_size': 2.0,
            'start_year': 2023,
            'start_month': 1,
            'end_year': 2024,
            'end_month': 12,
            'detection_threshold': 30,
            'stop_loss': -20,
            'max_holding_days': 8,
            'tp1': 35,
            'tp2': 80,
            'tp3': 200,
            'tp4': 500,
            'tp5': 1200,
            'trading_fees': 0.4
        }
        
        for key, default_value in required_params.items():
            if key in params:
                try:
                    if isinstance(default_value, int):
                        validated[key] = int(float(params[key]))
                    else:
                        validated[key] = float(params[key])
                except (ValueError, TypeError):
                    validated[key] = default_value
            else:
                validated[key] = default_value
        
        return validated
    
    def _calculate_months(self, start_date: datetime, end_date: datetime) -> int:
        """Calcule le nombre de mois entre deux dates"""
        return (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month) + 1
    
    def _simulate_month(self, month: int, starting_capital: float, params: Dict) -> Dict:
        """Simule un mois de trading"""
        
        # Génération du nombre de trades pour ce mois
        trades_count = np.random.randint(8, 16)  # Entre 8 et 15 trades par mois
        
        month_trades = []
        current_capital = starting_capital
        winning_trades = 0
        moon_shots = 0
        total_pnl = 0
        
        for trade_idx in range(trades_count):
            if not self.is_running:
                break
            
            # Génération d'un trade
            trade_result = self._generate_trade(month, trade_idx, current_capital, params)
            
            # Application du trade
            current_capital += trade_result['pnl']
            total_pnl += trade_result['pnl']
            
            if trade_result['return'] > 0:
                winning_trades += 1
            
            if trade_result['return'] >= 100:
                moon_shots += 1
            
            month_trades.append(trade_result)
        
        # Calcul du rendement mensuel
        month_return = ((current_capital - starting_capital) / starting_capital) * 100
        
        # Statistiques mensuelles
        monthly_stats = MonthlyStats(
            month=month,
            starting_capital=starting_capital,
            ending_capital=current_capital,
            return_pct=month_return,
            trades_count=len(month_trades),
            winning_trades=winning_trades,
            moon_shots=moon_shots,
            total_pnl=total_pnl
        )
        
        return {
            'ending_capital': current_capital,
            'return_pct': month_return,
            'trades': month_trades,
            'stats': monthly_stats.__dict__
        }
    
    def _generate_trade(self, month: int, trade_idx: int, current_capital: float, params: Dict) -> Dict:
        """Génère un trade réaliste"""
        
        # Token fictif
        token_name = f"MEME{trade_idx + 1}"
        
        # Simulation de la performance initiale
        base_performance = self._simulate_price_evolution(params)
        
        # Application des règles de sortie
        final_return, exit_reason = self._apply_exit_rules(base_performance, params)
        
        # Calcul du P&L
        position_size_usd = current_capital * (params['position_size'] / 100)
        gross_pnl = position_size_usd * (final_return / 100)
        fees = position_size_usd * (params['trading_fees'] / 100)
        net_pnl = gross_pnl - fees
        
        # Holding period (simulé)
        holding_days = min(np.random.randint(1, params['max_holding_days'] + 1), 
                          params['max_holding_days'])
        
        # Date fictive
        trade_date = f"2024-{month:02d}-{np.random.randint(1, 29):02d}"
        
        return {
            'month': month,
            'token': token_name,
            'action': 'SELL',
            'entry_price': 100.0,  # Prix fictif
            'exit_price': 100.0 * (1 + final_return/100),
            'return': final_return,
            'pnl': net_pnl,
            'date': trade_date,
            'holding_days': holding_days,
            'exit_reason': exit_reason
        }
    
    def _simulate_price_evolution(self, params: Dict) -> float:
        """Simule l'évolution réaliste du prix d'un memecoin"""
        
        # Facteurs de base
        market_trend = np.random.normal(0, 5)  # Tendance générale du marché
        volatility = np.random.uniform(30, 80)  # Volatilité du token
        
        # Simulation jour par jour
        cumulative_return = 0
        current_price = 100.0
        
        for day in range(params['max_holding_days']):
            # Mouvement quotidien de base
            daily_return = np.random.normal(market_trend, volatility/10)
            
            # Events spéciaux (probabilities based on real memecoin behavior)
            random_event = np.random.random()
            
            if random_event < 0.05:  # 5% chance de moon shot
                daily_return += np.random.uniform(100, 500)
            elif random_event < 0.08:  # 3% chance de pump majeur
                daily_return += np.random.uniform(50, 150)
            elif random_event < 0.15:  # 7% chance de dump
                daily_return -= np.random.uniform(20, 50)
            elif random_event < 0.25:  # 10% chance de volatilité extrême
                daily_return += np.random.normal(0, volatility)
            
            # Application du mouvement
            current_price *= (1 + daily_return/100)
            cumulative_return = (current_price - 100) / 100 * 100
            
            # Vérification des conditions de sortie anticipée
            if cumulative_return <= params['stop_loss']:
                return cumulative_return
            
            # Check take profits
            take_profits = [params['tp1'], params['tp2'], params['tp3'], params['tp4'], params['tp5']]
            for tp in sorted(take_profits, reverse=True):
                if cumulative_return >= tp:
                    return cumulative_return
        
        return cumulative_return
    
    def _apply_exit_rules(self, performance: float, params: Dict) -> tuple:
        """Applique les règles de sortie et retourne le rendement final + raison"""
        
        # Stop Loss
        if performance <= params['stop_loss']:
            return params['stop_loss'], 'STOP_LOSS'
        
        # Take Profits (du plus élevé au plus bas)
        take_profits = [
            (params['tp5'], 'TP5'),
            (params['tp4'], 'TP4'), 
            (params['tp3'], 'TP3'),
            (params['tp2'], 'TP2'),
            (params['tp1'], 'TP1')
        ]
        
        for tp_level, tp_name in take_profits:
            if performance >= tp_level:
                return tp_level, tp_name
        
        # Si aucune condition n'est remplie, sortie à l'expiration
        return performance, 'TIME_EXIT'
    
    def _calculate_win_rate(self, trades: List) -> float:
        """Calcule le win rate des trades"""
        if not trades:
            return 0.0
        
        winning_trades = len([t for t in trades if t.get('return', 0) > 0])
        return (winning_trades / len(trades)) * 100
    
    def stop(self):
        """Arrête le backtest"""
        self.is_running = False
