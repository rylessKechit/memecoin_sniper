import math
from typing import Union, List, Dict, Any
import locale
from datetime import datetime, timedelta

class FormatUtils:
    """Utilitaires de formatage"""
    
    @staticmethod
    def format_currency(amount: float, currency: str = "$") -> str:
        """Formate un montant en devise"""
        if abs(amount) >= 1000000:
            return f"{currency}{amount/1000000:.1f}M"
        elif abs(amount) >= 1000:
            return f"{currency}{amount/1000:.1f}K"
        else:
            return f"{currency}{amount:,.0f}"
    
    @staticmethod
    def format_percentage(value: float, decimals: int = 2) -> str:
        """Formate un pourcentage"""
        return f"{value:+.{decimals}f}%"
    
    @staticmethod
    def format_large_number(number: float) -> str:
        """Formate un grand nombre"""
        if abs(number) >= 1e9:
            return f"{number/1e9:.1f}B"
        elif abs(number) >= 1e6:
            return f"{number/1e6:.1f}M"
        elif abs(number) >= 1e3:
            return f"{number/1e3:.1f}K"
        else:
            return f"{number:.0f}"
    
    @staticmethod
    def format_duration(days: int) -> str:
        """Formate une durée"""
        if days >= 365:
            years = days // 365
            return f"{years} an{'s' if years > 1 else ''}"
        elif days >= 30:
            months = days // 30
            return f"{months} mois"
        else:
            return f"{days} jour{'s' if days > 1 else ''}"
    
    @staticmethod
    def format_date(date: Union[datetime, str], format_str: str = "%d/%m/%Y") -> str:
        """Formate une date"""
        if isinstance(date, str):
            try:
                date = datetime.fromisoformat(date.replace('Z', '+00:00'))
            except ValueError:
                return date
        
        return date.strftime(format_str)

class MathUtils:
    """Utilitaires mathématiques"""
    
    @staticmethod
    def calculate_sharpe_ratio(returns: List[float], risk_free_rate: float = 0.02) -> float:
        """Calcule le ratio de Sharpe"""
        if not returns or len(returns) < 2:
            return 0.0
        
        mean_return = sum(returns) / len(returns)
        std_return = math.sqrt(sum((r - mean_return) ** 2 for r in returns) / (len(returns) - 1))
        
        if std_return == 0:
            return 0.0
        
        return (mean_return - risk_free_rate) / std_return
    
    @staticmethod
    def calculate_max_drawdown(capital_evolution: List[float]) -> float:
        """Calcule le drawdown maximum"""
        if not capital_evolution:
            return 0.0
        
        peak = capital_evolution[0]
        max_dd = 0.0
        
        for capital in capital_evolution:
            if capital > peak:
                peak = capital
            else:
                drawdown = (peak - capital) / peak
                max_dd = max(max_dd, drawdown)
        
        return max_dd * 100  # En pourcentage
    
    @staticmethod
    def calculate_volatility(returns: List[float]) -> float:
        """Calcule la volatilité"""
        if not returns or len(returns) < 2:
            return 0.0
        
        mean_return = sum(returns) / len(returns)
        variance = sum((r - mean_return) ** 2 for r in returns) / (len(returns) - 1)
        
        return math.sqrt(variance)
    
    @staticmethod
    def calculate_var(returns: List[float], confidence_level: float = 0.95) -> float:
        """Calcule la Value at Risk"""
        if not returns:
            return 0.0
        
        sorted_returns = sorted(returns)
        index = int((1 - confidence_level) * len(sorted_returns))
        
        return sorted_returns[index] if index < len(sorted_returns) else sorted_returns[-1]
    
    @staticmethod
    def compound_annual_growth_rate(initial_value: float, final_value: float, years: float) -> float:
        """Calcule le CAGR"""
        if initial_value <= 0 or years <= 0:
            return 0.0
        
        return ((final_value / initial_value) ** (1 / years) - 1) * 100

class DataUtils:
    """Utilitaires de manipulation de données"""
    
    @staticmethod
    def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
        """Division sécurisée"""
        return numerator / denominator if denominator != 0 else default
    
    @staticmethod
    def clamp(value: float, min_value: float, max_value: float) -> float:
        """Limite une valeur entre min et max"""
        return max(min_value, min(value, max_value))
    
    @staticmethod
    def moving_average(data: List[float], window: int) -> List[float]:
        """Calcule une moyenne mobile"""
        if len(data) < window:
            return data.copy()
        
        result = []
        for i in range(len(data)):
            if i < window - 1:
                result.append(data[i])
            else:
                avg = sum(data[i-window+1:i+1]) / window
                result.append(avg)
        
        return result
    
    @staticmethod
    def remove_outliers(data: List[float], std_threshold: float = 2.0) -> List[float]:
        """Supprime les valeurs aberrantes"""
        if len(data) < 3:
            return data.copy()
        
        mean_val = sum(data) / len(data)
        std_val = math.sqrt(sum((x - mean_val) ** 2 for x in data) / len(data))
        
        if std_val == 0:
            return data.copy()
        
        filtered_data = []
        for value in data:
            z_score = abs(value - mean_val) / std_val
            if z_score <= std_threshold:
                filtered_data.append(value)
        
        return filtered_data if filtered_data else data.copy()
    
    @staticmethod
    def normalize_data(data: List[float], min_val: float = 0.0, max_val: float = 1.0) -> List[float]:
        """Normalise les données entre min_val et max_val"""
        if not data:
            return []
        
        data_min = min(data)
        data_max = max(data)
        
        if data_max == data_min:
            return [min_val] * len(data)
        
        normalized = []
        for value in data:
            norm_value = (value - data_min) / (data_max - data_min)
            scaled_value = norm_value * (max_val - min_val) + min_val
            normalized.append(scaled_value)
        
        return normalized

print("Tous les modules ont été créés! Votre architecture complète est maintenant prête.")
print("\nPour utiliser l'interface:")
print("1. Exécutez: python main.py")
print("2. Configurez vos paramètres dans le panel de gauche")
print("3. Lancez un backtest")
print("4. Analysez les résultats dans les différents onglets")
print("\nStructure créée:")
print("- GUI avec 5 onglets interactifs")
print("- Moteur de backtest réaliste") 
print("- Système de validation complet")
print("- Graphiques matplotlib intégrés")
print("- Export CSV/Excel")
print("- Analyse IA des performances")
print("- Gestion des configurations")