from fastapi import APIRouter, HTTPException
from fastapi import File, UploadFile
from models.schemas import ConfigSave, BacktestConfig
from typing import Dict, Any, Optional
from pydantic import BaseModel
import json
import os
from datetime import datetime

config_router = APIRouter()

CONFIGS_DIR = "data/configs"

# ============================================================================
# NOUVEAUX MODÈLES POUR LES CONFIGS DYNAMIQUES
# ============================================================================

class ConfigUpdate(BaseModel):
    config: Dict[str, Any]

class TradingConfigResponse(BaseModel):
    success: bool
    config: Dict[str, Any]
    message: str

# Configuration par défaut - VOS PARAMÈTRES OPTIMISÉS DE FOU !
DEFAULT_CONFIG = {
    # 💰 Paramètres capital
    "initial_capital": 10000,
    "position_size_percent": 2.0,
    
    # 🎯 Paramètres trading - Votre sauce secrète
    "stop_loss_percent": -20,
    "max_holding_days": 8,
    "take_profits": [35, 80, 200, 500, 1200],  # Vos niveaux gagnants
    "detection_threshold": 30,
    
    # 🎲 Paramètres de simulation - Vos découvertes
    "base_trend_mean": 1.5,
    "base_trend_std": 3.0,
    "volatility_min": 40,
    "volatility_max": 80,
    
    # 🚀 Probabilités d'events - Vos observations du marché
    "moon_shot_probability": 0.08,    # 8% chance de moon shot
    "pump_probability": 0.05,         # 5% chance de pump majeur  
    "dump_probability": 0.12,         # 12% chance de dump soudain
    
    # 📅 Période par défaut
    "default_start_year": 2023,
    "default_start_month": 1,
    "default_end_year": 2024,
    "default_end_month": 12,
    
    # ⚙️ Métadonnées
    "version": "2.0",
    "last_updated": datetime.now().isoformat(),
    "strategy_name": "Memecoin Sniper Pro"
}

# Variable globale pour la config active
current_config = DEFAULT_CONFIG.copy()

# ============================================================================
# ROUTES EXISTANTES (CONSERVÉES)
# ============================================================================

@config_router.post("/config/save")
async def save_config(config_data: ConfigSave):
    """Sauvegarde une configuration"""
    try:
        os.makedirs(CONFIGS_DIR, exist_ok=True)
        
        config_file = {
            "name": config_data.name,
            "description": config_data.description,
            "config": config_data.config.dict(),
            "created_at": datetime.now().isoformat()
        }
        
        filename = f"{CONFIGS_DIR}/{config_data.name.replace(' ', '_')}.json"
        
        with open(filename, 'w') as f:
            json.dump(config_file, f, indent=4)
        
        return {"message": "Configuration sauvegardée", "filename": filename}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur sauvegarde: {str(e)}")

@config_router.get("/config/list")
async def list_configs():
    """Liste toutes les configurations"""
    try:
        configs = []
        if os.path.exists(CONFIGS_DIR):
            for filename in os.listdir(CONFIGS_DIR):
                if filename.endswith('.json'):
                    with open(f"{CONFIGS_DIR}/{filename}", 'r') as f:
                        config = json.load(f)
                        configs.append({
                            "filename": filename,
                            "name": config.get("name"),
                            "description": config.get("description"),
                            "created_at": config.get("created_at")
                        })
        
        return {"configs": configs}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur liste configs: {str(e)}")

@config_router.get("/config/load/{filename}")
async def load_config(filename: str):
    """Charge une configuration"""
    try:
        filepath = f"{CONFIGS_DIR}/{filename}"
        
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Configuration non trouvée")
        
        with open(filepath, 'r') as f:
            config_data = json.load(f)
        
        return config_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur chargement: {str(e)}")

@config_router.delete("/config/{filename}")
async def delete_config(filename: str):
    """Supprime une configuration"""
    try:
        filepath = f"{CONFIGS_DIR}/{filename}"
        
        if os.path.exists(filepath):
            os.remove(filepath)
            return {"message": "Configuration supprimée"}
        else:
            raise HTTPException(status_code=404, detail="Configuration non trouvée")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur suppression: {str(e)}")

# ============================================================================
# NOUVELLES ROUTES POUR VOTRE FRONTEND NEXT.JS
# ============================================================================

@config_router.get("/configs")
async def get_configs():
    """
    📊 Récupère la configuration actuelle du bot
    Route appelée par votre frontend Next.js
    """
    return {
        "success": True,
        "config": current_config,
        "message": "Configuration récupérée avec succès",
        "timestamp": datetime.now().isoformat()
    }

@config_router.post("/configs")
async def update_configs(config_data: ConfigUpdate):
    """
    ⚙️ Met à jour la configuration du bot en temps réel
    Utilisée par votre frontend pour ajuster les paramètres
    """
    global current_config
    
    try:
        new_config = config_data.config
        
        # 🛡️ VALIDATIONS CRITIQUES - Protection de votre stratégie
        validation_errors = []
        
        # Capital initial
        if "initial_capital" in new_config and new_config["initial_capital"] <= 0:
            validation_errors.append("Le capital initial doit être positif")
        
        # Position size
        if "position_size_percent" in new_config:
            pos_size = new_config["position_size_percent"]
            if pos_size <= 0 or pos_size > 100:
                validation_errors.append("La taille de position doit être entre 0 et 100%")
        
        # Stop loss
        if "stop_loss_percent" in new_config and new_config["stop_loss_percent"] >= 0:
            validation_errors.append("Le stop loss doit être négatif")
        
        # Take profits
        if "take_profits" in new_config:
            tps = new_config["take_profits"]
            if not isinstance(tps, list) or len(tps) == 0:
                validation_errors.append("Au moins un take profit doit être défini")
            elif not all(isinstance(tp, (int, float)) and tp > 0 for tp in tps):
                validation_errors.append("Tous les take profits doivent être des nombres positifs")
        
        # Probabilités
        for prob_key in ["moon_shot_probability", "pump_probability", "dump_probability"]:
            if prob_key in new_config:
                prob = new_config[prob_key]
                if not (0 <= prob <= 1):
                    validation_errors.append(f"{prob_key} doit être entre 0 et 1")
        
        if validation_errors:
            raise HTTPException(status_code=400, detail={
                "message": "Erreurs de validation",
                "errors": validation_errors
            })
        
        # ✅ Mise à jour de la config
        current_config.update(new_config)
        current_config["last_updated"] = datetime.now().isoformat()
        
        return {
            "success": True,
            "config": current_config,
            "message": "Configuration mise à jour avec succès",
            "updated_fields": list(new_config.keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour: {str(e)}")

@config_router.get("/configs/default")
async def get_default_configs():
    """
    🔄 Récupère la configuration par défaut - Vos paramètres optimisés de légende
    """
    return {
        "success": True,
        "config": DEFAULT_CONFIG,
        "message": "Configuration par défaut récupérée",
        "note": "Ces paramètres ont été optimisés pour des performances exceptionnelles"
    }

@config_router.post("/configs/reset")
async def reset_configs():
    """
    🗑️ Remet la configuration aux valeurs par défaut optimisées
    """
    global current_config
    current_config = DEFAULT_CONFIG.copy()
    current_config["last_updated"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "config": current_config,
        "message": "Configuration remise aux valeurs par défaut optimisées"
    }

@config_router.post("/configs/validate")
async def validate_configs(config_data: ConfigUpdate):
    """
    ✅ Valide une configuration sans la sauvegarder
    Parfait pour la validation côté frontend
    """
    try:
        config = config_data.config
        errors = []
        warnings = []
        
        # 🚨 Validations critiques
        if config.get("initial_capital", 0) <= 0:
            errors.append("Le capital initial doit être positif")
        
        pos_size = config.get("position_size_percent", 0)
        if not (0 < pos_size <= 100):
            errors.append("La taille de position doit être entre 0 et 100%")
        
        if config.get("stop_loss_percent", 0) >= 0:
            errors.append("Le stop loss doit être négatif")
        
        # Take profits validation
        take_profits = config.get("take_profits", [])
        if not isinstance(take_profits, list) or len(take_profits) == 0:
            errors.append("Au moins un take profit doit être défini")
        elif not all(isinstance(tp, (int, float)) and tp > 0 for tp in take_profits):
            errors.append("Tous les take profits doivent être des nombres positifs")
        
        # ⚠️ Avertissements basés sur votre expérience
        if pos_size > 10:
            warnings.append("Taille de position > 10% - Risque très élevé pour les memecoins")
        
        if config.get("stop_loss_percent", 0) < -50:
            warnings.append("Stop loss < -50% - Risque extrême, non recommandé")
        
        if config.get("max_holding_days", 0) > 15:
            warnings.append("Holding > 15 jours - Les memecoins sont très volatils à long terme")
        
        # Vérification des probabilités
        total_event_prob = (
            config.get("moon_shot_probability", 0) + 
            config.get("pump_probability", 0) + 
            config.get("dump_probability", 0)
        )
        if total_event_prob > 0.5:
            warnings.append("Probabilités d'events > 50% - Marché très volatile simulé")
        
        return {
            "success": len(errors) == 0,
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "message": "Validation terminée",
            "risk_level": "high" if len(warnings) > 2 else "medium" if len(warnings) > 0 else "low"
        }
        
    except Exception as e:
        return {
            "success": False,
            "valid": False,
            "errors": [f"Erreur de validation: {str(e)}"],
            "warnings": [],
            "message": "Erreur lors de la validation",
            "risk_level": "unknown"
        }

@config_router.get("/configs/presets")
async def get_config_presets():
    """
    🎯 Récupère les presets de configuration pour différents profils de risque
    """
    presets = {
        "conservative": {
            "name": "Conservateur",
            "description": "Paramètres sécurisés pour débutants",
            "config": {
                **DEFAULT_CONFIG,
                "position_size_percent": 1.0,
                "stop_loss_percent": -15,
                "take_profits": [25, 50, 100, 200, 400],
                "moon_shot_probability": 0.05,
                "pump_probability": 0.03,
                "dump_probability": 0.08
            }
        },
        "balanced": {
            "name": "Équilibré",
            "description": "Configuration par défaut optimisée",
            "config": DEFAULT_CONFIG
        },
        "aggressive": {
            "name": "Agressif",
            "description": "Pour traders expérimentés - Risque élevé",
            "config": {
                **DEFAULT_CONFIG,
                "position_size_percent": 5.0,
                "stop_loss_percent": -30,
                "take_profits": [50, 120, 300, 800, 2000],
                "moon_shot_probability": 0.12,
                "pump_probability": 0.08,
                "dump_probability": 0.15
            }
        },
        "moonshot_hunter": {
            "name": "Chasseur de Moon Shots",
            "description": "Spécialisé dans les gains exceptionnels - Très risqué",
            "config": {
                **DEFAULT_CONFIG,
                "position_size_percent": 3.0,
                "stop_loss_percent": -25,
                "take_profits": [100, 250, 500, 1000, 5000],
                "moon_shot_probability": 0.15,
                "pump_probability": 0.10,
                "dump_probability": 0.20,
                "max_holding_days": 12
            }
        }
    }
    
    return {
        "success": True,
        "presets": presets,
        "message": "Presets de configuration récupérés",
        "default_preset": "balanced"
    }

@config_router.post("/configs/{strategy_name}")
async def save_named_strategy(strategy_name: str, config_data: ConfigUpdate):
    """
    💾 Sauvegarde une stratégie avec un nom personnalisé
    URL: POST /api/configs/ma-strategie-agressive
    """
    global current_config
    
    try:
        # Decode le nom de stratégie (au cas où il y aurait des caractères spéciaux)
        from urllib.parse import unquote
        decoded_name = unquote(strategy_name)
        
        # Validation de la config
        new_config = config_data.config
        validation_errors = []
        
        # Mêmes validations que pour /configs
        if "initial_capital" in new_config and new_config["initial_capital"] <= 0:
            validation_errors.append("Le capital initial doit être positif")
        
        if "position_size_percent" in new_config:
            pos_size = new_config["position_size_percent"]
            if pos_size <= 0 or pos_size > 100:
                validation_errors.append("La taille de position doit être entre 0 et 100%")
        
        if "stop_loss_percent" in new_config and new_config["stop_loss_percent"] >= 0:
            validation_errors.append("Le stop loss doit être négatif")
        
        if validation_errors:
            raise HTTPException(status_code=400, detail={
                "message": "Erreurs de validation",
                "errors": validation_errors
            })
        
        # Sauvegarde de la stratégie nommée
        os.makedirs(CONFIGS_DIR, exist_ok=True)
        
        strategy_file = {
            "name": decoded_name,
            "description": f"Stratégie personnalisée: {decoded_name}",
            "config": new_config,
            "created_at": datetime.now().isoformat(),
            "type": "named_strategy"
        }
        
        # Nettoie le nom pour le fichier
        safe_filename = "".join(c for c in decoded_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"{CONFIGS_DIR}/{safe_filename.replace(' ', '_')}.json"
        
        with open(filename, 'w') as f:
            json.dump(strategy_file, f, indent=4)
        
        # Met à jour aussi la config courante
        current_config.update(new_config)
        current_config["strategy_name"] = decoded_name
        current_config["last_updated"] = datetime.now().isoformat()
        
        return {
            "success": True,
            "message": f"Stratégie '{decoded_name}' sauvegardée avec succès",
            "strategy_name": decoded_name,
            "filename": filename,
            "config": current_config
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur sauvegarde stratégie: {str(e)}")

@config_router.get("/configs/{strategy_name}")
async def load_named_strategy(strategy_name: str):
    """
    📂 Charge une stratégie par son nom
    URL: GET /api/configs/ma-strategie-agressive
    """
    try:
        from urllib.parse import unquote
        decoded_name = unquote(strategy_name)
        
        # Cherche dans les fichiers sauvegardés
        if os.path.exists(CONFIGS_DIR):
            for filename in os.listdir(CONFIGS_DIR):
                if filename.endswith('.json'):
                    with open(f"{CONFIGS_DIR}/{filename}", 'r') as f:
                        strategy_data = json.load(f)
                        if strategy_data.get("name") == decoded_name:
                            return {
                                "success": True,
                                "strategy_name": decoded_name,
                                "config": strategy_data.get("config", {}),
                                "description": strategy_data.get("description", ""),
                                "created_at": strategy_data.get("created_at"),
                                "message": f"Stratégie '{decoded_name}' chargée"
                            }
        
        raise HTTPException(status_code=404, detail=f"Stratégie '{decoded_name}' non trouvée")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur chargement stratégie: {str(e)}")

@config_router.get("/configs/strategies/list")
async def list_named_strategies():
    """
    📋 Liste toutes les stratégies nommées sauvegardées
    """
    try:
        strategies = []
        
        if os.path.exists(CONFIGS_DIR):
            for filename in os.listdir(CONFIGS_DIR):
                if filename.endswith('.json'):
                    with open(f"{CONFIGS_DIR}/{filename}", 'r') as f:
                        strategy_data = json.load(f)
                        if strategy_data.get("type") == "named_strategy":
                            strategies.append({
                                "name": strategy_data.get("name"),
                                "description": strategy_data.get("description"),
                                "created_at": strategy_data.get("created_at"),
                                "filename": filename
                            })
        
        return {
            "success": True,
            "strategies": strategies,
            "count": len(strategies),
            "message": f"{len(strategies)} stratégies trouvées"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur liste stratégies: {str(e)}")

@config_router.delete("/configs/{strategy_name}")
async def delete_named_strategy(strategy_name: str):
    """
    🗑️ Supprime une stratégie nommée
    """
    try:
        from urllib.parse import unquote
        decoded_name = unquote(strategy_name)
        
        if os.path.exists(CONFIGS_DIR):
            for filename in os.listdir(CONFIGS_DIR):
                if filename.endswith('.json'):
                    filepath = f"{CONFIGS_DIR}/{filename}"
                    with open(filepath, 'r') as f:
                        strategy_data = json.load(f)
                        if strategy_data.get("name") == decoded_name:
                            os.remove(filepath)
                            return {
                                "success": True,
                                "message": f"Stratégie '{decoded_name}' supprimée",
                                "deleted_file": filename
                            }
        
        raise HTTPException(status_code=404, detail=f"Stratégie '{decoded_name}' non trouvée")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur suppression: {str(e)}")

# ============================================================================
# FONCTION UTILITAIRE POUR LES AUTRES MODULES
# ============================================================================

def get_current_config() -> Dict[str, Any]:
    """
    🔧 Fonction utilitaire pour récupérer la config actuelle
    Utilisée par le moteur de backtest
    """
    return current_config.copy()

def update_config_field(field: str, value: Any) -> bool:
    """
    🔄 Met à jour un champ spécifique de la configuration
    """
    global current_config
    try:
        current_config[field] = value
        current_config["last_updated"] = datetime.now().isoformat()
        return True
    except Exception:
        return False