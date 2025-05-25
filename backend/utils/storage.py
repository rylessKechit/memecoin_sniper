# Global storage for active backtests and results
active_backtests = {}
backtest_results_cache = {}

def clear_old_backtests():
    """Nettoie les anciens backtests (plus de 24h)"""
    from datetime import datetime, timedelta
    
    cutoff_time = datetime.now() - timedelta(hours=24)
    
    # Clean active backtests
    to_remove = []
    for backtest_id, status in active_backtests.items():
        if status.completed_at and status.completed_at < cutoff_time:
            to_remove.append(backtest_id)
    
    for backtest_id in to_remove:
        del active_backtests[backtest_id]
        if backtest_id in backtest_results_cache:
            del backtest_results_cache[backtest_id]