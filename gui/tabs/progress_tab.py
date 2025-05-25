import tkinter as tk
from tkinter import ttk
from config import Config

class ProgressTab:
    """Onglet de progression du backtest"""
    
    def __init__(self, notebook, main_app):
        self.notebook = notebook
        self.main_app = main_app
        
        self.create_tab()
    
    def create_tab(self):
        """Crée l'onglet progression"""
        self.frame = tk.Frame(self.notebook, bg=Config.COLORS["bg_secondary"])
        self.notebook.add(self.frame, text="🔄 Progression")
        
        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(
            self.frame, 
            variable=self.progress_var, 
            maximum=100, 
            length=400
        )
        self.progress_bar.pack(pady=20)
        
        # Status
        self.status_var = tk.StringVar(value="⏳ En attente...")
        status_label = tk.Label(
            self.frame, 
            textvariable=self.status_var,
            bg=Config.COLORS["bg_secondary"], 
            fg=Config.COLORS["text_primary"], 
            font=('Arial', 12)
        )
        status_label.pack(pady=10)
        
        # Métriques temps réel
        self.create_live_metrics()
    
    def create_live_metrics(self):
        """Crée les métriques en temps réel"""
        metrics_frame = tk.Frame(self.frame, bg=Config.COLORS["bg_secondary"])
        metrics_frame.pack(fill='x', padx=20, pady=20)
        
        self.live_metrics = {}
        metrics_data = [
            ("💰 Capital", "capital"),
            ("📈 Rendement", "return"),
            ("🎯 Trades", "trades"),
            ("🌙 Moon Shots", "moon_shots")
        ]
        
        for i, (label, key) in enumerate(metrics_data):
            row = i // 2
            col = i % 2
            
            metric_frame = tk.Frame(
                metrics_frame, 
                bg=Config.COLORS["bg_primary"], 
                relief='solid', 
                borderwidth=1
            )
            metric_frame.grid(row=row, column=col, padx=10, pady=10, sticky='ew')
            
            tk.Label(
                metric_frame, 
                text=label, 
                bg=Config.COLORS["bg_primary"], 
                fg=Config.COLORS["accent_green"], 
                font=('Arial', 12, 'bold')
            ).pack(pady=5)
            
            self.live_metrics[key] = tk.StringVar(value="--")
            tk.Label(
                metric_frame, 
                textvariable=self.live_metrics[key], 
                bg=Config.COLORS["bg_primary"], 
                fg=Config.COLORS["text_primary"], 
                font=('Arial', 14, 'bold')
            ).pack(pady=5)
        
        metrics_frame.grid_columnconfigure(0, weight=1)
        metrics_frame.grid_columnconfigure(1, weight=1)
    
    def update_progress(self, progress, status, metrics=None):
        """Met à jour la progression"""
        self.progress_var.set(progress)
        self.status_var.set(status)
        
        if metrics:
            self.live_metrics['capital'].set(f"${metrics.get('capital', 0):,.0f}")
            self.live_metrics['return'].set(f"{metrics.get('return', 0):+.2f}%")
            self.live_metrics['trades'].set(f"{metrics.get('trades', 0)} ({metrics.get('win_rate', 0):.1f}%)")
            self.live_metrics['moon_shots'].set(str(metrics.get('moon_shots', 0)))
    
    def reset(self):
        """Reset la progression"""
        self.progress_var.set(0)
        self.status_var.set("⏳ En attente...")
        for key in self.live_metrics:
            self.live_metrics[key].set("--")