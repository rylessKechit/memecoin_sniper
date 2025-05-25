import os
from datetime import datetime

class Config:
    """Configuration globale de l'application"""
    
    # Chemins
    ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
    ASSETS_DIR = os.path.join(ROOT_DIR, "assets")
    CONFIGS_DIR = os.path.join(ASSETS_DIR, "configs")
    
    # Paramètres par défaut du bot
    DEFAULT_CONFIG = {
        # Capital et position
        "initial_capital": 10000,
        "position_size": 2.0,
        
        # Période
        "start_year": 2023,
        "start_month": 1,
        "end_year": 2024,
        "end_month": 12,
        
        # Trading
        "detection_threshold": 30,
        "stop_loss": -20,
        "max_holding_days": 8,
        
        # Take profits
        "tp1": 35,
        "tp2": 80,
        "tp3": 200,
        "tp4": 500,
        "tp5": 1200,
        
        # Frais
        "trading_fees": 0.4,
    }
    
    # Couleurs du thème
    COLORS = {
        "bg_primary": "#1a1a2e",
        "bg_secondary": "#0f0f23",
        "bg_tertiary": "#16213e",
        "accent_green": "#00ff88",
        "accent_red": "#ff4444",
        "accent_blue": "#4444ff",
        "accent_orange": "#ff8800",
        "accent_gold": "#ffd700",
        "text_primary": "#e0e0e0",
        "text_secondary": "#cccccc",
        "border": "#333333",
    }
    
    # Graphiques
    CHART_CONFIG = {
        "figsize": (10, 6),
        "dpi": 100,
        "style": "dark_background",
    }