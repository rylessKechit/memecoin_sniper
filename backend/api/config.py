from fastapi import APIRouter, HTTPException
from fastapi import File, UploadFile
from models.schemas import ConfigSave, BacktestConfig
import json
import os
from datetime import datetime

config_router = APIRouter()

CONFIGS_DIR = "data/configs"

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
