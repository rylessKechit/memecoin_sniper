from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime

class BacktestConfig(BaseModel):
    """Configuration du backtest - IDENTIQUE à votre GUI"""
    initial_capital: float = 10000
    position_size: float = 2.0
    start_year: int = 2023
    start_month: int = 1
    end_year: int = 2024
    end_month: int = 12
    detection_threshold: float = 30
    stop_loss: float = -20
    max_holding_days: int = 8
    tp1: float = 35
    tp2: float = 80
    tp3: float = 200
    tp4: float = 500
    tp5: float = 1200

class BacktestStatus(BaseModel):
    """Status du backtest en temps réel"""
    id: str
    status: str  # "running", "completed", "failed"
    progress: float
    message: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    current_month: Optional[int] = None
    total_months: Optional[int] = None
    live_metrics: Optional[Dict] = None

class BacktestResult(BaseModel):
    """Résultats complets du backtest"""
    id: str
    config: BacktestConfig
    summary: Dict[str, Any]
    monthly_data: List[Dict]
    trades: List[Dict]
    metrics: Dict[str, float]
    charts_data: Dict[str, Any]

class ConfigSave(BaseModel):
    """Configuration à sauvegarder"""
    name: str
    config: BacktestConfig
    description: Optional[str] = None