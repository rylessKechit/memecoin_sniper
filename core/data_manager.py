import json
import os
from datetime import datetime
from typing import Dict, List, Optional
import pandas as pd

class DataManager:
    """Gestionnaire des données et de la persistance"""
    
    def __init__(self, data_directory: str = "data"):
        self.data_dir = data_directory
        self.ensure_data_directory()
    
    def ensure_data_directory(self):
        """S'assure que le répertoire de données existe"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        
        # Sous-répertoires
        subdirs = ['backtests', 'configs', 'exports', 'cache']
        for subdir in subdirs:
            path = os.path.join(self.data_dir, subdir)
            if not os.path.exists(path):
                os.makedirs(path)
    
    def save_backtest_results(self, results: Dict, name: Optional[str] = None) -> str:
        """Sauvegarde les résultats d'un backtest"""
        if name is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            name = f"backtest_{timestamp}"
        
        filename = f"{name}.json"
        filepath = os.path.join(self.data_dir, 'backtests', filename)
        
        # Préparation des données pour JSON
        json_data = self._prepare_for_json(results)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=4, ensure_ascii=False)
        
        return filepath
    
    def load_backtest_results(self, filename: str) -> Dict:
        """Charge les résultats d'un backtest"""
        filepath = os.path.join(self.data_dir, 'backtests', filename)
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Fichier backtest non trouvé: {filename}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def list_backtest_results(self) -> List[Dict]:
        """Liste tous les backtests sauvegardés"""
        backtest_dir = os.path.join(self.data_dir, 'backtests')
        files = []
        
        if os.path.exists(backtest_dir):
            for filename in os.listdir(backtest_dir):
                if filename.endswith('.json'):
                    filepath = os.path.join(backtest_dir, filename)
                    stats = os.stat(filepath)
                    
                    files.append({
                        'filename': filename,
                        'name': filename.replace('.json', ''),
                        'created': datetime.fromtimestamp(stats.st_ctime),
                        'modified': datetime.fromtimestamp(stats.st_mtime),
                        'size': stats.st_size
                    })
        
        return sorted(files, key=lambda x: x['modified'], reverse=True)
    
    def save_configuration(self, config: Dict, name: str) -> str:
        """Sauvegarde une configuration"""
        filename = f"{name}.json"
        filepath = os.path.join(self.data_dir, 'configs', filename)
        
        config_with_metadata = {
            'config': config,
            'metadata': {
                'created': datetime.now().isoformat(),
                'version': '1.0'
            }
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(config_with_metadata, f, indent=4)
        
        return filepath
    
    def load_configuration(self, name: str) -> Dict:
        """Charge une configuration"""
        filename = f"{name}.json"
        filepath = os.path.join(self.data_dir, 'configs', filename)
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Configuration non trouvée: {name}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return data.get('config', data)  # Compatibilité avec anciens formats
    
    def export_to_csv(self, results: Dict, filepath: str):
        """Exporte les résultats vers CSV"""
        trades = results.get('trades', [])
        
        if not trades:
            raise ValueError("Aucun trade à exporter")
        
        # Conversion en DataFrame
        df = pd.DataFrame(trades)
        
        # Ajout de métadonnées
        metadata_rows = [
            ['# Rapport d\'export Memecoin Trading Bot'],
            ['# Généré le:', datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
            ['# Capital Initial:', f"${results.get('initial_capital', 0):,.0f}"],
            ['# Capital Final:', f"${results.get('final_capital', 0):,.0f}"],
            ['# Rendement Total:', f"{results.get('total_return', 0):+.2f}%"],
            ['# Nombre de Trades:', str(len(trades))],
            [''],  # Ligne vide
            ['# Données des Trades:']
        ]
        
        # Écriture du fichier
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            # Métadonnées
            for row in metadata_rows:
                f.write(','.join(row) + '\n')
            
            # Données
            df.to_csv(f, index=False)
    
    def export_to_excel(self, results: Dict, filepath: str):
        """Exporte les résultats vers Excel"""
        with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
            
            # Onglet Résumé
            summary_data = {
                'Métrique': [
                    'Capital Initial',
                    'Capital Final', 
                    'Rendement Total',
                    'Nombre de Trades',
                    'Win Rate',
                    'Moon Shots',
                    'Max Drawdown'
                ],
                'Valeur': [
                    f"${results.get('initial_capital', 0):,.0f}",
                    f"${results.get('final_capital', 0):,.0f}",
                    f"{results.get('total_return', 0):+.2f}%",
                    len(results.get('trades', [])),
                    f"{self._calculate_win_rate(results.get('trades', [])):.1f}%",
                    len([t for t in results.get('trades', []) if t.get('return', 0) >= 100]),
                    "À calculer"  # Placeholder
                ]
            }
            
            pd.DataFrame(summary_data).to_excel(writer, sheet_name='Résumé', index=False)
            
            # Onglet Trades
            if results.get('trades'):
                trades_df = pd.DataFrame(results['trades'])
                trades_df.to_excel(writer, sheet_name='Trades', index=False)
            
            # Onglet Performance Mensuelle
            if results.get('monthly_stats'):
                monthly_df = pd.DataFrame(results['monthly_stats'])
                monthly_df.to_excel(writer, sheet_name='Performance Mensuelle', index=False)
            
            # Onglet Évolution Capital
            if results.get('capital'):
                capital_data = {
                    'Mois': list(range(len(results['capital']))),
                    'Capital': results['capital'],
                    'Rendement Cumulé': [
                        ((cap - results.get('initial_capital', 0)) / results.get('initial_capital', 1)) * 100 
                        for cap in results['capital']
                    ]
                }
                pd.DataFrame(capital_data).to_excel(writer, sheet_name='Évolution Capital', index=False)
    
    def _prepare_for_json(self, data: Dict) -> Dict:
        """Prépare les données pour la sérialisation JSON"""
        json_data = {}
        
        for key, value in data.items():
            if isinstance(value, (datetime, pd.Timestamp)):
                json_data[key] = value.isoformat()
            elif isinstance(value, np.ndarray):
                json_data[key] = value.tolist()
            elif isinstance(value, pd.DataFrame):
                json_data[key] = value.to_dict('records')
            else:
                json_data[key] = value
        
        return json_data
    
    def _calculate_win_rate(self, trades: List) -> float:
        """Calcule le win rate"""
        if not trades:
            return 0.0
        
        winning_trades = len([t for t in trades if t.get('return', 0) > 0])
        return (winning_trades / len(trades)) * 100
    
    def cleanup_old_files(self, days_old: int = 30):
        """Nettoie les anciens fichiers"""
        cutoff_time = datetime.now().timestamp() - (days_old * 24 * 3600)
        
        for subdir in ['backtests', 'cache']:
            dir_path = os.path.join(self.data_dir, subdir)
            if os.path.exists(dir_path):
                for filename in os.listdir(dir_path):
                    filepath = os.path.join(dir_path, filename)
                    if os.path.isfile(filepath):
                        if os.path.getmtime(filepath) < cutoff_time:
                            os.remove(filepath)
