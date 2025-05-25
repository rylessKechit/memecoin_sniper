import tkinter as tk
from tkinter import ttk
from config import Config
from .tabs.progress_tab import ProgressTab
from .tabs.metrics_tab import MetricsTab
from .tabs.charts_tab import ChartsTab
from .tabs.trades_tab import TradesTab
from .tabs.analysis_tab import AnalysisTab

class ResultsPanel:
    """Panel principal des résultats"""
    
    def __init__(self, parent, main_app):
        self.parent = parent
        self.main_app = main_app
        
        self.create_panel()
        self.create_tabs()
    
    def create_panel(self):
        """Crée le panel des résultats"""
        self.frame = tk.Frame(
            self.parent, 
            bg=Config.COLORS["bg_secondary"], 
            relief='solid', 
            borderwidth=2
        )
        self.frame.pack(side='right', fill='both', expand=True, pady=5)
        
        # Titre
        ttk.Label(self.frame, text="📊 Résultats et Analyses", style='Title.TLabel').pack(pady=10)
        
        # Notebook pour les onglets
        self.notebook = ttk.Notebook(self.frame)
        self.notebook.pack(fill='both', expand=True, padx=10, pady=5)
    
    def create_tabs(self):
        """Crée tous les onglets"""
        self.progress_tab = ProgressTab(self.notebook, self.main_app)
        self.metrics_tab = MetricsTab(self.notebook, self.main_app)
        self.charts_tab = ChartsTab(self.notebook, self.main_app)
        self.trades_tab = TradesTab(self.notebook, self.main_app)
        self.analysis_tab = AnalysisTab(self.notebook, self.main_app)
    
    def update_progress(self, progress, status, metrics=None):
        """Met à jour la progression"""
        self.progress_tab.update_progress(progress, status, metrics)
    
    def display_results(self, results):
        """Affiche tous les résultats"""
        self.metrics_tab.display_metrics(results)
        self.charts_tab.update_charts(results)
        self.trades_tab.display_trades(results)
        self.analysis_tab.generate_analysis(results)
    
    def reset_progress(self):
        """Reset la progression"""
        self.progress_tab.reset()
    
    def reset_all(self):
        """Reset tous les résultats"""
        self.progress_tab.reset()
        self.metrics_tab.reset()
        self.charts_tab.reset()
        self.trades_tab.reset()
        self.analysis_tab.reset()