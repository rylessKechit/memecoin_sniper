import tkinter as tk
from tkinter import ttk, messagebox
import threading
from datetime import datetime

from .styles import StyleManager
from .parameter_panel import ParameterPanel
from .results_panel import ResultsPanel
from core.backtest_engine import BacktestEngine
from utils.validators import ParameterValidator
from config import Config

class MemecoinTradingGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("🤖 Memecoin Trading Bot - Interface Graphique")
        self.root.geometry("1400x800")
        self.root.configure(bg=Config.COLORS["bg_primary"])
        
        # Variables
        self.backtest_results = None
        self.is_running = False
        self.backtest_thread = None
        
        # Managers
        self.style_manager = StyleManager()
        self.backtest_engine = BacktestEngine()
        self.validator = ParameterValidator()
        
        # Configuration des styles
        self.style_manager.setup_styles()
        
        # Construction de l'interface
        self.create_interface()
        
    def create_interface(self):
        """Crée l'interface principale"""
        
        # Titre principal
        self.create_header()
        
        # Frame principal
        main_frame = tk.Frame(self.root, bg=Config.COLORS["bg_primary"])
        main_frame.pack(fill='both', expand=True, padx=10, pady=5)
        
        # Panel des paramètres (gauche)
        self.parameter_panel = ParameterPanel(main_frame, self)
        
        # Panel des résultats (droite)
        self.results_panel = ResultsPanel(main_frame, self)
        
    def create_header(self):
        """Crée l'en-tête de l'application"""
        header_frame = tk.Frame(self.root, bg=Config.COLORS["bg_primary"], height=80)
        header_frame.pack(fill='x', padx=10, pady=5)
        header_frame.pack_propagate(False)
        
        title_label = ttk.Label(
            header_frame, 
            text="🤖 Memecoin Trading Bot - Interface Graphique Pro",
            style='Title.TLabel'
        )
        title_label.pack(expand=True)
        
        subtitle_label = ttk.Label(
            header_frame,
            text="🧠 Analyse Comportementale Intelligente | 📊 Backtesting Avancé",
            style='Subtitle.TLabel'
        )
        subtitle_label.pack()
    
    def start_backtest(self):
        """Lance le backtest"""
        if self.is_running:
            return
        
        # Validation des paramètres
        params = self.parameter_panel.get_parameters()
        validation_result = self.validator.validate_parameters(params)
        
        if not validation_result.is_valid:
            messagebox.showerror("Erreur", validation_result.error_message)
            return
        
        # Configuration de l'UI
        self.is_running = True
        self.parameter_panel.set_running_state(True)
        self.results_panel.reset_progress()
        
        # Lance le backtest en thread séparé
        self.backtest_thread = threading.Thread(
            target=self._run_backtest_thread,
            args=(params,),
            daemon=True
        )
        self.backtest_thread.start()
    
    def _run_backtest_thread(self, params):
        """Exécute le backtest en arrière-plan"""
        try:
            # Callback pour les mises à jour de progression
            def progress_callback(progress, status, metrics=None):
                self.root.after(0, lambda: self.results_panel.update_progress(progress, status, metrics))
            
            # Lance le backtest
            results = self.backtest_engine.run_backtest(params, progress_callback)
            
            # Finalisation
            self.backtest_results = results
            self.root.after(0, self._backtest_completed)
            
        except Exception as e:
            self.root.after(0, lambda: self._backtest_error(str(e)))
    
    def _backtest_completed(self):
        """Appelé quand le backtest est terminé"""
        self.is_running = False
        self.parameter_panel.set_running_state(False)
        self.results_panel.display_results(self.backtest_results)
        messagebox.showinfo("Succès", "Backtest terminé avec succès!")
    
    def _backtest_error(self, error_msg):
        """Appelé en cas d'erreur"""
        self.is_running = False
        self.parameter_panel.set_running_state(False)
        messagebox.showerror("Erreur", f"Erreur pendant le backtest: {error_msg}")
    
    def stop_backtest(self):
        """Arrête le backtest"""
        self.is_running = False
        self.parameter_panel.set_running_state(False)
        self.results_panel.update_progress(0, "⏹️ Arrêté par l'utilisateur")