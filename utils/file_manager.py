import os
import json
import shutil
from typing import Dict, List, Optional
from datetime import datetime
import tempfile

class FileManager:
    """Gestionnaire de fichiers et d'export"""
    
    def __init__(self, base_directory: str = "data"):
        self.base_dir = base_directory
        self.ensure_directories()
    
    def ensure_directories(self):
        """S'assure que tous les répertoires nécessaires existent"""
        directories = [
            self.base_dir,
            os.path.join(self.base_dir, "configs"),
            os.path.join(self.base_dir, "exports"), 
            os.path.join(self.base_dir, "reports"),
            os.path.join(self.base_dir, "temp")
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    def save_json(self, data: Dict, filename: str, subdirectory: str = "") -> str:
        """Sauvegarde des données en JSON"""
        if subdirectory:
            filepath = os.path.join(self.base_dir, subdirectory, filename)
        else:
            filepath = os.path.join(self.base_dir, filename)
        
        # S'assurer que le répertoire parent existe
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False, default=str)
        
        return filepath
    
    def load_json(self, filename: str, subdirectory: str = "") -> Dict:
        """Charge des données depuis JSON"""
        if subdirectory:
            filepath = os.path.join(self.base_dir, subdirectory, filename)
        else:
            filepath = os.path.join(self.base_dir, filename)
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Fichier non trouvé: {filepath}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def list_files(self, subdirectory: str = "", extension: str = ".json") -> List[Dict]:
        """Liste les fichiers d'un répertoire"""
        if subdirectory:
            directory = os.path.join(self.base_dir, subdirectory)
        else:
            directory = self.base_dir
        
        if not os.path.exists(directory):
            return []
        
        files = []
        for filename in os.listdir(directory):
            if filename.endswith(extension):
                filepath = os.path.join(directory, filename)
                stat_info = os.stat(filepath)
                
                files.append({
                    'filename': filename,
                    'name': os.path.splitext(filename)[0],
                    'path': filepath,
                    'size': stat_info.st_size,
                    'created': datetime.fromtimestamp(stat_info.st_ctime),
                    'modified': datetime.fromtimestamp(stat_info.st_mtime)
                })
        
        return sorted(files, key=lambda x: x['modified'], reverse=True)
    
    def delete_file(self, filename: str, subdirectory: str = "") -> bool:
        """Supprime un fichier"""
        if subdirectory:
            filepath = os.path.join(self.base_dir, subdirectory, filename)
        else:
            filepath = os.path.join(self.base_dir, filename)
        
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                return True
        except OSError:
            pass
        
        return False
    
    def create_backup(self, source_file: str, subdirectory: str = "") -> str:
        """Crée une sauvegarde d'un fichier"""
        if subdirectory:
            source_path = os.path.join(self.base_dir, subdirectory, source_file)
        else:
            source_path = os.path.join(self.base_dir, source_file)
        
        if not os.path.exists(source_path):
            raise FileNotFoundError(f"Fichier source non trouvé: {source_path}")
        
        # Génération du nom de backup
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{os.path.splitext(source_file)[0]}_backup_{timestamp}.json"
        backup_path = os.path.join(self.base_dir, "backups", backup_name)
        
        # Création du répertoire backup
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        
        # Copie du fichier
        shutil.copy2(source_path, backup_path)
        
        return backup_path
    
    def cleanup_temp_files(self, max_age_hours: int = 24):
        """Nettoie les fichiers temporaires"""
        temp_dir = os.path.join(self.base_dir, "temp")
        if not os.path.exists(temp_dir):
            return
        
        cutoff_time = datetime.now().timestamp() - (max_age_hours * 3600)
        
        for filename in os.listdir(temp_dir):
            filepath = os.path.join(temp_dir, filename)
            if os.path.isfile(filepath):
                if os.path.getmtime(filepath) < cutoff_time:
                    try:
                        os.remove(filepath)
                    except OSError:
                        pass
