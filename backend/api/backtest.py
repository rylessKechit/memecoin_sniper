from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.schemas import BacktestConfig, BacktestStatus, BacktestResult
from utils.storage import active_backtests, backtest_results_cache
from core.backtest_engine import run_real_backtest
from datetime import datetime
import uuid

backtest_router = APIRouter()

@backtest_router.post("/backtest/start")
async def start_backtest(config: BacktestConfig, background_tasks: BackgroundTasks):
    """Lance un nouveau backtest avec VOTRE logique exacte"""
    
    # Validation des paramètres (comme dans votre GUI)
    try:
        start_date = datetime(config.start_year, config.start_month, 1)
        end_date = datetime(config.end_year, config.end_month, 1)
        
        if start_date >= end_date:
            raise HTTPException(status_code=400, detail="Date de fin doit être après date de début")
        
        months_diff = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month) + 1
        
        if months_diff > 36:
            raise HTTPException(status_code=400, detail="Période trop longue (max 36 mois)")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Paramètres invalides: {str(e)}")
    
    # Génère un ID unique
    backtest_id = str(uuid.uuid4())
    
    # Initialise le status
    active_backtests[backtest_id] = BacktestStatus(
        id=backtest_id,
        status="running",
        progress=0.0,
        message="🚀 Initialisation du backtest...",
        started_at=datetime.now(),
        total_months=months_diff
    )
    
    # Lance le backtest en arrière-plan avec VOTRE logique
    background_tasks.add_task(run_real_backtest, backtest_id, config)
    
    return {
        "backtest_id": backtest_id,
        "status": "started",
        "estimated_duration": f"{months_diff * 2} secondes",
        "total_months": months_diff
    }

@backtest_router.get("/backtest/{backtest_id}/status")
async def get_backtest_status(backtest_id: str):
    """Récupère le status en temps réel"""
    if backtest_id not in active_backtests:
        raise HTTPException(status_code=404, detail="Backtest non trouvé")
    
    return active_backtests[backtest_id]

@backtest_router.get("/backtest/{backtest_id}/results")
async def get_backtest_results(backtest_id: str):
    """Récupère les résultats complets"""
    if backtest_id not in backtest_results_cache:
        raise HTTPException(status_code=404, detail="Résultats non trouvés")
    
    return backtest_results_cache[backtest_id]

@backtest_router.delete("/backtest/{backtest_id}")
async def stop_backtest(backtest_id: str):
    """Arrête un backtest en cours"""
    if backtest_id in active_backtests:
        active_backtests[backtest_id].status = "stopped"
        active_backtests[backtest_id].message = "⏹️ Arrêté par l'utilisateur"
        return {"message": "Backtest arrêté"}
    
    raise HTTPException(status_code=404, detail="Backtest non trouvé")

@backtest_router.get("/backtest/history")
async def get_backtest_history():
    """Récupère l'historique des backtests"""
    history = []
    for backtest_id, result in backtest_results_cache.items():
        if hasattr(result, 'dict'):
            result_dict = result.dict()
        else:
            result_dict = result
        
        history.append({
            'id': backtest_id,
            'config': result_dict.get('config', {}),
            'summary': result_dict.get('summary', {}),
            'completed_at': active_backtests.get(backtest_id, {}).get('completed_at')
        })
    
    return {"history": history}

@backtest_router.get("/backtest/active")
async def get_active_backtests():
    """Récupère tous les backtests actifs"""
    active = []
    for backtest_id, status in active_backtests.items():
        if status.status == "running":
            active.append(status)
    
    return {"active_backtests": active}