import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure
import seaborn as sns
from datetime import datetime, timedelta
import threading
import json
from dataclasses import asdict
import os

# Import de votre bot existant
try:
    from memecoin_bot import CoinGeckoAPI, SmartMemecoinBacktester, TradeAction, Trade, Position, MonthlyStats
except ImportError:
    # Si le fichier n'est pas trouvé, on va utiliser des classes simplifiées pour la démo
    print("⚠️  Module memecoin_bot non trouvé. Utilisation du mode démo.")

class MemecoinTradingGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("🤖 Memecoin Sniper Bot - Interface Graphique")
        self.root.geometry("1400x800")
        self.root.configure(bg='#1a1a2e')
        
        # Variables
        self.backtest_results = None
        self.is_running = False
        
        # Style
        self.setup_styles()
        
        # Interface
        self.create_widgets()
        
        # Données pour graphiques
        self.fig = None
        self.canvas = None
        
    def setup_styles(self):
        """Configuration des styles visuels"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # Couleurs personnalisées
        style.configure('Title.TLabel', 
                       background='#1a1a2e', 
                       foreground='#00ff88', 
                       font=('Arial', 16, 'bold'))
        
        style.configure('Subtitle.TLabel', 
                       background='#1a1a2e', 
                       foreground='#e0e0e0', 
                       font=('Arial', 12))
        
        style.configure('Metric.TLabel', 
                       background='#0f0f23', 
                       foreground='#00ff88', 
                       font=('Arial', 14, 'bold'),
                       relief='solid',
                       borderwidth=1)
        
        style.configure('Success.TButton', 
                       background='#00ff88', 
                       foreground='#000000',
                       font=('Arial', 12, 'bold'))
        
        style.configure('Danger.TButton', 
                       background='#ff4444', 
                       foreground='#ffffff',
                       font=('Arial', 12, 'bold'))
        
    def create_widgets(self):
        """Création de l'interface"""
        
        # Titre principal
        title_frame = tk.Frame(self.root, bg='#1a1a2e', height=80)
        title_frame.pack(fill='x', padx=10, pady=5)
        title_frame.pack_propagate(False)
        
        title_label = ttk.Label(title_frame, 
                               text="🤖 Memecoin Sniper Bot - Interface Graphique Pro",
                               style='Title.TLabel')
        title_label.pack(expand=True)
        
        subtitle_label = ttk.Label(title_frame,
                                  text="🧠 Analyse Comportementale Intelligente | 📊 Backtesting Avancé",
                                  style='Subtitle.TLabel')
        subtitle_label.pack()
        
        # Frame principal avec colonnes
        main_frame = tk.Frame(self.root, bg='#1a1a2e')
        main_frame.pack(fill='both', expand=True, padx=10, pady=5)
        
        # Colonne gauche - Paramètres
        self.create_parameters_panel(main_frame)
        
        # Colonne droite - Résultats et graphiques
        self.create_results_panel(main_frame)
        
    def create_parameters_panel(self, parent):
        """Panel des paramètres à gauche"""
        params_frame = tk.Frame(parent, bg='#0f0f23', relief='solid', borderwidth=2)
        params_frame.pack(side='left', fill='y', padx=(0, 10), pady=5)
        params_frame.configure(width=350)
        params_frame.pack_propagate(False)
        
        # Titre section
        ttk.Label(params_frame, text="⚙️ Configuration Bot", style='Title.TLabel').pack(pady=10)
        
        # Scrollable frame pour les paramètres
        canvas = tk.Canvas(params_frame, bg='#0f0f23', highlightthickness=0)
        scrollbar = ttk.Scrollbar(params_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#0f0f23')
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True, padx=10)
        scrollbar.pack(side="right", fill="y")
        
        # Variables de paramètres
        self.vars = {}
        
        # Paramètres Capital
        self.create_param_section(scrollable_frame, "💰 Capital et Position", [
            ("Capital Initial ($)", "initial_capital", 10000, 1000, 1000000),
            ("Taille Position (%)", "position_size", 2.0, 0.5, 10.0),
        ])
        
        # Paramètres Période
        period_frame = self.create_section_frame(scrollable_frame, "📅 Période Backtest")
        
        # Date début
        start_frame = tk.Frame(period_frame, bg='#0f0f23')
        start_frame.pack(fill='x', pady=5)
        tk.Label(start_frame, text="📅 Début:", bg='#0f0f23', fg='#00ff88', font=('Arial', 10, 'bold')).pack(anchor='w')
        
        start_date_frame = tk.Frame(start_frame, bg='#0f0f23')
        start_date_frame.pack(fill='x')
        
        self.vars['start_year'] = tk.StringVar(value="2023")
        self.vars['start_month'] = tk.StringVar(value="1")
        
        ttk.Combobox(start_date_frame, textvariable=self.vars['start_year'], 
                    values=[str(y) for y in range(2022, 2026)], width=8).pack(side='left', padx=(0,5))
        ttk.Combobox(start_date_frame, textvariable=self.vars['start_month'], 
                    values=[str(m) for m in range(1, 13)], width=8).pack(side='left')
        
        # Date fin
        end_frame = tk.Frame(period_frame, bg='#0f0f23')
        end_frame.pack(fill='x', pady=5)
        tk.Label(end_frame, text="📅 Fin:", bg='#0f0f23', fg='#00ff88', font=('Arial', 10, 'bold')).pack(anchor='w')
        
        end_date_frame = tk.Frame(end_frame, bg='#0f0f23')
        end_date_frame.pack(fill='x')
        
        self.vars['end_year'] = tk.StringVar(value="2024")
        self.vars['end_month'] = tk.StringVar(value="12")
        
        ttk.Combobox(end_date_frame, textvariable=self.vars['end_year'], 
                    values=[str(y) for y in range(2022, 2026)], width=8).pack(side='left', padx=(0,5))
        ttk.Combobox(end_date_frame, textvariable=self.vars['end_month'], 
                    values=[str(m) for m in range(1, 13)], width=8).pack(side='left')
        
        # Paramètres Trading
        self.create_param_section(scrollable_frame, "🎯 Paramètres Trading", [
            ("Seuil Détection", "detection_threshold", 30, 10, 90),
            ("Stop Loss (%)", "stop_loss", -20, -50, -5),
            ("Holding Max (jours)", "max_holding_days", 8, 1, 30),
        ])
        
        # Take Profits
        self.create_param_section(scrollable_frame, "🚀 Take Profits", [
            ("Take Profit 1 (%)", "tp1", 35, 10, 100),
            ("Take Profit 2 (%)", "tp2", 80, 50, 200),
            ("Take Profit 3 (%)", "tp3", 200, 100, 500),
            ("Take Profit 4 (%)", "tp4", 500, 300, 1000),
            ("Take Profit 5 (%)", "tp5", 1200, 800, 2000),
        ])
        
        # Boutons de contrôle
        control_frame = tk.Frame(scrollable_frame, bg='#0f0f23')
        control_frame.pack(fill='x', pady=20)
        
        self.start_button = tk.Button(control_frame, text="🚀 Lancer Backtest", 
                                     command=self.start_backtest,
                                     bg='#00ff88', fg='#000000', 
                                     font=('Arial', 12, 'bold'),
                                     height=2)
        self.start_button.pack(fill='x', pady=5)
        
        self.stop_button = tk.Button(control_frame, text="⏹️ Arrêter", 
                                    command=self.stop_backtest,
                                    bg='#ff4444', fg='#ffffff', 
                                    font=('Arial', 12, 'bold'),
                                    height=2, state='disabled')
        self.stop_button.pack(fill='x', pady=5)
        
        # Boutons utilitaires
        util_frame = tk.Frame(scrollable_frame, bg='#0f0f23')
        util_frame.pack(fill='x', pady=10)
        
        tk.Button(util_frame, text="💾 Sauvegarder Config", 
                 command=self.save_config,
                 bg='#4444ff', fg='#ffffff', 
                 font=('Arial', 10)).pack(fill='x', pady=2)
        
        tk.Button(util_frame, text="📁 Charger Config", 
                 command=self.load_config,
                 bg='#4444ff', fg='#ffffff', 
                 font=('Arial', 10)).pack(fill='x', pady=2)
        
        tk.Button(util_frame, text="📊 Export CSV", 
                 command=self.export_csv,
                 bg='#ff8800', fg='#ffffff', 
                 font=('Arial', 10)).pack(fill='x', pady=2)
        
        tk.Button(util_frame, text="🗑️ Reset", 
                 command=self.reset_all,
                 bg='#666666', fg='#ffffff', 
                 font=('Arial', 10)).pack(fill='x', pady=2)
        
    def create_param_section(self, parent, title, params):
        """Crée une section de paramètres"""
        frame = self.create_section_frame(parent, title)
        
        for param_name, var_name, default, min_val, max_val in params:
            param_frame = tk.Frame(frame, bg='#0f0f23')
            param_frame.pack(fill='x', pady=3)
            
            # Label
            tk.Label(param_frame, text=param_name, 
                    bg='#0f0f23', fg='#e0e0e0', 
                    font=('Arial', 9)).pack(anchor='w')
            
            # Variable et Scale
            self.vars[var_name] = tk.DoubleVar(value=default)
            
            # Frame pour scale et valeur
            scale_frame = tk.Frame(param_frame, bg='#0f0f23')
            scale_frame.pack(fill='x')
            
            scale = tk.Scale(scale_frame, from_=min_val, to=max_val, 
                           orient='horizontal', variable=self.vars[var_name],
                           bg='#0f0f23', fg='#00ff88', 
                           highlightbackground='#0f0f23',
                           resolution=0.1 if isinstance(default, float) else 1)
            scale.pack(side='left', fill='x', expand=True)
            
            # Entry pour valeur précise
            entry = tk.Entry(scale_frame, textvariable=self.vars[var_name], 
                           width=8, bg='#1a1a2e', fg='#e0e0e0')
            entry.pack(side='right', padx=(5,0))
    
    def create_section_frame(self, parent, title):
        """Crée un frame de section avec titre"""
        section_frame = tk.Frame(parent, bg='#16213e', relief='solid', borderwidth=1)
        section_frame.pack(fill='x', pady=10, padx=5)
        
        # Titre
        title_label = tk.Label(section_frame, text=title, 
                              bg='#16213e', fg='#00ff88', 
                              font=('Arial', 11, 'bold'))
        title_label.pack(pady=5)
        
        # Contenu
        content_frame = tk.Frame(section_frame, bg='#0f0f23')
        content_frame.pack(fill='both', expand=True, padx=5, pady=5)
        
        return content_frame
    
    def create_results_panel(self, parent):
        """Panel des résultats à droite"""
        results_frame = tk.Frame(parent, bg='#0f0f23', relief='solid', borderwidth=2)
        results_frame.pack(side='right', fill='both', expand=True, pady=5)
        
        # Titre
        ttk.Label(results_frame, text="📊 Résultats et Analyses", style='Title.TLabel').pack(pady=10)
        
        # Notebook pour onglets
        self.notebook = ttk.Notebook(results_frame)
        self.notebook.pack(fill='both', expand=True, padx=10, pady=5)
        
        # Onglet Progress
        self.create_progress_tab()
        
        # Onglet Métriques
        self.create_metrics_tab()
        
        # Onglet Graphiques
        self.create_charts_tab()
        
        # Onglet Trades
        self.create_trades_tab()
        
        # Onglet Analyse
        self.create_analysis_tab()
    
    def create_progress_tab(self):
        """Onglet de progression"""
        progress_frame = tk.Frame(self.notebook, bg='#0f0f23')
        self.notebook.add(progress_frame, text="🔄 Progression")
        
        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(progress_frame, variable=self.progress_var, 
                                          maximum=100, length=400)
        self.progress_bar.pack(pady=20)
        
        # Status
        self.status_var = tk.StringVar(value="⏳ En attente...")
        status_label = tk.Label(progress_frame, textvariable=self.status_var,
                               bg='#0f0f23', fg='#e0e0e0', font=('Arial', 12))
        status_label.pack(pady=10)
        
        # Métriques temps réel
        metrics_frame = tk.Frame(progress_frame, bg='#0f0f23')
        metrics_frame.pack(fill='x', padx=20, pady=20)
        
        self.live_metrics = {}
        metrics_names = [
            ("💰 Capital", "capital"),
            ("📈 Rendement", "return"),
            ("🎯 Trades", "trades"),
            ("🌙 Moon Shots", "moon_shots")
        ]
        
        for i, (label, key) in enumerate(metrics_names):
            row = i // 2
            col = i % 2
            
            frame = tk.Frame(metrics_frame, bg='#1a1a2e', relief='solid', borderwidth=1)
            frame.grid(row=row, column=col, padx=10, pady=10, sticky='ew')
            
            tk.Label(frame, text=label, bg='#1a1a2e', fg='#00ff88', 
                    font=('Arial', 12, 'bold')).pack(pady=5)
            
            self.live_metrics[key] = tk.StringVar(value="--")
            tk.Label(frame, textvariable=self.live_metrics[key], 
                    bg='#1a1a2e', fg='#e0e0e0', 
                    font=('Arial', 14, 'bold')).pack(pady=5)
        
        metrics_frame.grid_columnconfigure(0, weight=1)
        metrics_frame.grid_columnconfigure(1, weight=1)
    
    def create_metrics_tab(self):
        """Onglet des métriques détaillées"""
        metrics_frame = tk.Frame(self.notebook, bg='#0f0f23')
        self.notebook.add(metrics_frame, text="📊 Métriques")
        
        # Scrollable frame
        canvas = tk.Canvas(metrics_frame, bg='#0f0f23')
        scrollbar = ttk.Scrollbar(metrics_frame, orient="vertical", command=canvas.yview)
        scrollable_metrics = tk.Frame(canvas, bg='#0f0f23')
        
        scrollable_metrics.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_metrics, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Métriques détaillées
        self.detailed_metrics = {}
        
        sections = [
            ("💰 Performance Globale", ["total_return", "total_pnl", "win_rate", "total_trades"]),
            ("📈 Analyse Risque", ["volatility", "max_drawdown", "sharpe_ratio", "profit_factor"]),
            ("🚀 Trades Performance", ["best_trade", "worst_trade", "avg_gain", "avg_loss"]),
            ("🌙 Détection Spéciale", ["moon_shots", "moon_rate", "avg_holding", "success_rate"])
        ]
        
        for section_name, metrics in sections:
            section_frame = self.create_section_frame(scrollable_metrics, section_name)
            
            for metric in metrics:
                metric_frame = tk.Frame(section_frame, bg='#0f0f23')
                metric_frame.pack(fill='x', pady=2)
                
                self.detailed_metrics[metric] = tk.StringVar(value="--")
                tk.Label(metric_frame, textvariable=self.detailed_metrics[metric],
                        bg='#0f0f23', fg='#e0e0e0', font=('Arial', 11)).pack(anchor='w')
    
    def create_charts_tab(self):
        """Onglet des graphiques"""
        self.charts_frame = tk.Frame(self.notebook, bg='#0f0f23')
        self.notebook.add(self.charts_frame, text="📈 Graphiques")
        
        # Buttons pour différents graphiques
        chart_buttons_frame = tk.Frame(self.charts_frame, bg='#0f0f23')
        chart_buttons_frame.pack(fill='x', padx=10, pady=5)
        
        chart_types = [
            ("📈 Évolution Capital", self.show_capital_chart),
            ("📊 Rendements Mensuels", self.show_monthly_returns),
            ("🎯 Distribution Trades", self.show_trade_distribution),
            ("🔥 Heatmap Performance", self.show_performance_heatmap)
        ]
        
        for text, command in chart_types:
            tk.Button(chart_buttons_frame, text=text, command=command,
                     bg='#4444ff', fg='#ffffff', font=('Arial', 10)).pack(side='left', padx=5)
        
        # Frame pour les graphiques
        self.chart_display_frame = tk.Frame(self.charts_frame, bg='#0f0f23')
        self.chart_display_frame.pack(fill='both', expand=True, padx=10, pady=5)
    
    def create_trades_tab(self):
        """Onglet détail des trades"""
        trades_frame = tk.Frame(self.notebook, bg='#0f0f23')
        self.notebook.add(trades_frame, text="💼 Trades")
        
        # Treeview pour les trades
        columns = ('Mois', 'Token', 'Action', 'Rendement', 'P&L', 'Date')
        self.trades_tree = ttk.Treeview(trades_frame, columns=columns, show='headings', height=15)
        
        for col in columns:
            self.trades_tree.heading(col, text=col)
            self.trades_tree.column(col, width=100)
        
        # Scrollbars
        v_scrollbar = ttk.Scrollbar(trades_frame, orient="vertical", command=self.trades_tree.yview)
        h_scrollbar = ttk.Scrollbar(trades_frame, orient="horizontal", command=self.trades_tree.xview)
        self.trades_tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        self.trades_tree.pack(side="left", fill="both", expand=True)
        v_scrollbar.pack(side="right", fill="y")
        h_scrollbar.pack(side="bottom", fill="x")
        
        # Statistiques des trades
        trades_stats_frame = tk.Frame(trades_frame, bg='#1a1a2e', width=200)
        trades_stats_frame.pack(side='right', fill='y', padx=10)
        trades_stats_frame.pack_propagate(False)
        
        tk.Label(trades_stats_frame, text="📊 Stats Trades", 
                bg='#1a1a2e', fg='#00ff88', font=('Arial', 12, 'bold')).pack(pady=10)
        
        self.trades_stats = {}
        stats_labels = ["Total", "Gagnants", "Perdants", "Moon Shots", "Win Rate"]
        
        for label in stats_labels:
            frame = tk.Frame(trades_stats_frame, bg='#1a1a2e')
            frame.pack(fill='x', pady=5, padx=5)
            
            tk.Label(frame, text=f"{label}:", bg='#1a1a2e', fg='#e0e0e0', 
                    font=('Arial', 10)).pack(anchor='w')
            
            self.trades_stats[label] = tk.StringVar(value="--")
            tk.Label(frame, textvariable=self.trades_stats[label], 
                    bg='#1a1a2e', fg='#00ff88', 
                    font=('Arial', 11, 'bold')).pack(anchor='w')
    
    def create_analysis_tab(self):
        """Onglet d'analyse avancée"""
        analysis_frame = tk.Frame(self.notebook, bg='#0f0f23')
        self.notebook.add(analysis_frame, text="🧠 Analyse")
        
        # Text widget pour l'analyse détaillée
        self.analysis_text = tk.Text(analysis_frame, bg='#1a1a2e', fg='#e0e0e0', 
                                    font=('Courier', 11), wrap='word')
        
        analysis_scrollbar = ttk.Scrollbar(analysis_frame, orient="vertical", command=self.analysis_text.yview)
        self.analysis_text.configure(yscrollcommand=analysis_scrollbar.set)
        
        self.analysis_text.pack(side="left", fill="both", expand=True)
        analysis_scrollbar.pack(side="right", fill="y")
    
    def start_backtest(self):
        """Lance le backtest en arrière-plan"""
        if self.is_running:
            return
        
        # Validation des paramètres
        try:
            start_year = int(self.vars['start_year'].get())
            start_month = int(self.vars['start_month'].get())
            end_year = int(self.vars['end_year'].get())
            end_month = int(self.vars['end_month'].get())
            
            start_date = datetime(start_year, start_month, 1)
            end_date = datetime(end_year, end_month, 1)
            
            if start_date >= end_date:
                messagebox.showerror("Erreur", "La date de fin doit être après la date de début")
                return
                
            months_diff = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month) + 1
            
        except Exception as e:
            messagebox.showerror("Erreur", f"Paramètres invalides: {e}")
            return
        
        # Configuration UI
        self.is_running = True
        self.start_button.config(state='disabled')
        self.stop_button.config(state='normal')
        self.status_var.set("🚀 Lancement du backtest...")
        self.progress_var.set(0)
        
        # Lance en thread séparé
        self.backtest_thread = threading.Thread(
            target=self.run_backtest_simulation, 
            args=(months_diff,),
            daemon=True
        )
        self.backtest_thread.start()
    
    def run_backtest_simulation(self, months):
        """Simulation du backtest (version simplifiée pour la démo)"""
        try:
            # Paramètres
            initial_capital = self.vars['initial_capital'].get()
            position_size = self.vars['position_size'].get()
            
            # Simulation des résultats
            results = {
                'months': [],
                'capital': [initial_capital],
                'returns': [],
                'trades': [],
                'monthly_stats': []
            }
            
            current_capital = initial_capital
            total_trades = 0
            winning_trades = 0
            moon_shots = 0
            
            # Simulation mensuelle
            for month in range(1, months + 1):
                if not self.is_running:
                    break
                
                # Mise à jour UI
                progress = (month / months) * 100
                self.root.after(0, lambda p=progress: self.progress_var.set(p))
                self.root.after(0, lambda m=month, t=months: self.status_var.set(f"📅 Mois {m}/{t}"))
                
                # Simulation performance mensuelle
                month_start_capital = current_capital
                
                # Génère trades aléatoires pour la démo
                month_trades = np.random.randint(8, 15)
                month_wins = 0
                month_moonshots = 0
                month_returns = []
                
                for trade in range(month_trades):
                    if not self.is_running:
                        break
                    
                    # Performance aléatoire réaliste
                    performance = self.generate_realistic_performance()
                    final_return = self.apply_exit_rules(performance)
                    
                    # P&L
                    position_size_usd = current_capital * (position_size / 100)
                    pnl = position_size_usd * (final_return / 100) - 40  # fees
                    
                    current_capital += pnl
                    total_trades += 1
                    month_returns.append(final_return)
                    
                    if final_return > 0:
                        month_wins += 1
                        winning_trades += 1
                    
                    if final_return >= 100:
                        month_moonshots += 1
                        moon_shots += 1
                    
                    # Store trade
                    results['trades'].append({
                        'month': month,
                        'token': f'TOKEN{trade+1}',
                        'return': final_return,
                        'pnl': pnl,
                        'action': 'SELL'
                    })
                
                # Stats mensuelles
                month_return = ((current_capital - month_start_capital) / month_start_capital) * 100
                results['months'].append(f"M{month}")
                results['capital'].append(current_capital)
                results['returns'].append(month_return)
                
                # Mise à jour métriques live
                total_return = ((current_capital - initial_capital) / initial_capital) * 100
                win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
                
                self.root.after(0, lambda: self.update_live_metrics(
                    current_capital, total_return, total_trades, moon_shots, win_rate
                ))
                
                # Pause pour effet visuel
                import time
                time.sleep(0.1)
            
            # Finalisation
            self.backtest_results = results
            self.root.after(0, self.backtest_completed)
            
        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("Erreur", f"Erreur pendant le backtest: {e}"))
            self.root.after(0, self.backtest_completed)
    
    def generate_realistic_performance(self):
        """Génère une performance réaliste pour la simulation"""
        # Facteurs de marché
        base_trend = np.random.normal(1.5, 3.0)
        volatility = np.random.uniform(40, 80)
        
        # Simulation sur 8 jours
        cumulative = 0
        for day in range(8):
            daily = np.random.normal(base_trend, volatility/12)
            
            # Events spéciaux
            if np.random.random() < 0.08:  # Moon shot
                daily += np.random.uniform(200, 800)
            elif np.random.random() < 0.05:  # Pump
                daily += np.random.uniform(50, 150)
            elif np.random.random() < 0.12:  # Dump
                daily -= np.random.uniform(30, 60)
            
            cumulative += daily
        
        return cumulative
    
    def apply_exit_rules(self, performance):
        """Applique les règles de sortie"""
        stop_loss = self.vars['stop_loss'].get()
        take_profits = [
            self.vars['tp1'].get(),
            self.vars['tp2'].get(),
            self.vars['tp3'].get(),
            self.vars['tp4'].get(),
            self.vars['tp5'].get()
        ]
        
        if performance <= stop_loss:
            return stop_loss
        
        for tp in sorted(take_profits, reverse=True):
            if performance >= tp:
                return tp
        
        return performance
    
    def update_live_metrics(self, capital, total_return, trades, moon_shots, win_rate):
        """Met à jour les métriques en temps réel"""
        self.live_metrics['capital'].set(f"${capital:,.0f}")
        self.live_metrics['return'].set(f"{total_return:+.2f}%")
        self.live_metrics['trades'].set(f"{trades} ({win_rate:.1f}%)")
        self.live_metrics['moon_shots'].set(str(moon_shots))
    
    def backtest_completed(self):
        """Appelé quand le backtest est terminé"""
        self.is_running = False
        self.start_button.config(state='normal')
        self.stop_button.config(state='disabled')
        self.status_var.set("✅ Backtest terminé!")
        self.progress_var.set(100)
        
        if self.backtest_results:
            self.update_all_results()
            messagebox.showinfo("Succès", "Backtest terminé avec succès!")
    
    def stop_backtest(self):
        """Arrête le backtest"""
        self.is_running = False
        self.start_button.config(state='normal')
        self.stop_button.config(state='disabled')
        self.status_var.set("⏹️ Arrêté par l'utilisateur")
    
    def update_all_results(self):
        """Met à jour tous les résultats"""
        if not self.backtest_results:
            return
        
        results = self.backtest_results
        initial_capital = self.vars['initial_capital'].get()
        final_capital = results['capital'][-1]
        
        # Calculs des métriques
        total_return = ((final_capital - initial_capital) / initial_capital) * 100
        total_pnl = final_capital - initial_capital
        
        trades = results['trades']
        sell_trades = [t for t in trades if t['action'] == 'SELL']
        
        if sell_trades:
            winning_trades = len([t for t in sell_trades if t['return'] > 0])
            win_rate = (winning_trades / len(sell_trades)) * 100
            moon_shots = len([t for t in sell_trades if t['return'] >= 100])
            
            returns = [t['return'] for t in sell_trades]
            winners = [r for r in returns if r > 0]
            losers = [r for r in returns if r <= 0]
            
            best_trade = max(returns)
            worst_trade = min(returns)
            avg_gain = np.mean(winners) if winners else 0
            avg_loss = np.mean(losers) if losers else 0
            
            # Calculs avancés
            monthly_returns = results['returns']
            volatility = np.std(monthly_returns) if monthly_returns else 0
            
            # Max Drawdown
            max_dd = 0
            peak = results['capital'][0]
            for cap in results['capital']:
                if cap > peak:
                    peak = cap
                else:
                    dd = (peak - cap) / peak * 100
                    max_dd = max(max_dd, dd)
            
            # Sharpe Ratio
            sharpe = np.mean(monthly_returns) / volatility if volatility > 0 else 0
            
            # Profit Factor
            profit_factor = (avg_gain * len(winners)) / (abs(avg_loss) * len(losers)) if losers and avg_loss != 0 else 0
        else:
            win_rate = moon_shots = best_trade = worst_trade = avg_gain = avg_loss = 0
            volatility = max_dd = sharpe = profit_factor = 0
        
        # Mise à jour métriques détaillées
        self.detailed_metrics['total_return'].set(f"Rendement Total: {total_return:+.2f}%")
        self.detailed_metrics['total_pnl'].set(f"P&L Total: ${total_pnl:+,.0f}")
        self.detailed_metrics['win_rate'].set(f"Win Rate: {win_rate:.1f}%")
        self.detailed_metrics['total_trades'].set(f"Total Trades: {len(sell_trades)}")
        
        self.detailed_metrics['volatility'].set(f"Volatilité: {volatility:.2f}%")
        self.detailed_metrics['max_drawdown'].set(f"Max Drawdown: {max_dd:.2f}%")
        self.detailed_metrics['sharpe_ratio'].set(f"Ratio Sharpe: {sharpe:.2f}")
        self.detailed_metrics['profit_factor'].set(f"Profit Factor: {profit_factor:.2f}")
        
        self.detailed_metrics['best_trade'].set(f"Meilleur Trade: +{best_trade:.1f}%")
        self.detailed_metrics['worst_trade'].set(f"Pire Trade: {worst_trade:.1f}%")
        self.detailed_metrics['avg_gain'].set(f"Gain Moyen: +{avg_gain:.1f}%")
        self.detailed_metrics['avg_loss'].set(f"Perte Moyenne: {avg_loss:.1f}%")
        
        self.detailed_metrics['moon_shots'].set(f"Moon Shots: {moon_shots}")
        moon_rate = (moon_shots / len(sell_trades) * 100) if sell_trades else 0
        self.detailed_metrics['moon_rate'].set(f"Taux Moon Shot: {moon_rate:.1f}%")
        self.detailed_metrics['avg_holding'].set(f"Holding Moyen: {self.vars['max_holding_days'].get():.0f} jours")
        self.detailed_metrics['success_rate'].set(f"Taux Succès: {win_rate:.1f}%")
        
        # Mise à jour tableau des trades
        self.update_trades_table()
        
        # Mise à jour analyse
        self.update_analysis()
        
        # Affiche le premier graphique
        self.show_capital_chart()
    
    def update_trades_table(self):
        """Met à jour le tableau des trades"""
        # Vide le tableau
        for item in self.trades_tree.get_children():
            self.trades_tree.delete(item)
        
        if not self.backtest_results:
            return
        
        # Ajoute les trades
        for trade in self.backtest_results['trades']:
            values = (
                trade['month'],
                trade['token'],
                trade['action'],
                f"{trade['return']:+.1f}%",
                f"${trade['pnl']:+.0f}",
                "2024-01-01"  # Date fictive
            )
            
            # Couleur selon performance
            item = self.trades_tree.insert('', 'end', values=values)
            if trade['return'] > 0:
                self.trades_tree.set(item, 'Rendement', f"{trade['return']:+.1f}%")
        
        # Stats trades
        trades = self.backtest_results['trades']
        sell_trades = [t for t in trades if t['action'] == 'SELL']
        
        if sell_trades:
            winners = [t for t in sell_trades if t['return'] > 0]
            losers = [t for t in sell_trades if t['return'] <= 0]
            moon_shots = [t for t in sell_trades if t['return'] >= 100]
            win_rate = len(winners) / len(sell_trades) * 100
            
            self.trades_stats['Total'].set(str(len(sell_trades)))
            self.trades_stats['Gagnants'].set(str(len(winners)))
            self.trades_stats['Perdants'].set(str(len(losers)))
            self.trades_stats['Moon Shots'].set(str(len(moon_shots)))
            self.trades_stats['Win Rate'].set(f"{win_rate:.1f}%")
    
    def update_analysis(self):
        """Met à jour l'analyse détaillée"""
        if not self.backtest_results:
            return
        
        results = self.backtest_results
        initial_capital = self.vars['initial_capital'].get()
        final_capital = results['capital'][-1]
        total_return = ((final_capital - initial_capital) / initial_capital) * 100
        
        analysis_text = f"""
🤖 ANALYSE DÉTAILLÉE DU BACKTEST MEMECOIN SNIPER BOT
{'='*70}

📊 RÉSUMÉ EXÉCUTIF:
{'='*30}
• Capital Initial: ${initial_capital:,.0f}
• Capital Final: ${final_capital:,.0f}
• Rendement Total: {total_return:+.2f}%
• Période: {len(results['monthly_stats'])} mois

🎯 PERFORMANCE TRADING:
{'='*30}
• Nombre total de trades: {len([t for t in results['trades'] if t['action'] == 'SELL'])}
• Trades gagnants: {len([t for t in results['trades'] if t['action'] == 'SELL' and t['return'] > 0])}
• Moon shots détectés: {len([t for t in results['trades'] if t['action'] == 'SELL' and t['return'] >= 100])}

📈 ANALYSE MENSUELLE:
{'='*30}
"""
        
        # Ajoute détails mensuels
        for i, month_return in enumerate(results['returns'][:6], 1):  # Premiers 6 mois
            analysis_text += f"• Mois {i}: {month_return:+.2f}%\n"
        
        if len(results['returns']) > 6:
            analysis_text += f"... et {len(results['returns']) - 6} autres mois\n"
        
        analysis_text += f"""
🧠 RECOMMANDATIONS IA:
{'='*30}
"""
        
        if total_return > 100:
            analysis_text += "✅ EXCELLENTE PERFORMANCE!\n"
            analysis_text += "• Stratégie très efficace\n"
            analysis_text += "• Continuer avec ces paramètres\n"
        elif total_return > 50:
            analysis_text += "✅ BONNE PERFORMANCE\n"
            analysis_text += "• Stratégie rentable\n"
            analysis_text += "• Possibilité d'optimisation\n"
        elif total_return > 0:
            analysis_text += "⚠️ PERFORMANCE POSITIVE MAIS FAIBLE\n"
            analysis_text += "• Ajuster les paramètres\n"
            analysis_text += "• Réduire les seuils ou stop loss\n"
        else:
            analysis_text += "❌ PERFORMANCE NÉGATIVE\n"
            analysis_text += "• Revoir complètement la stratégie\n"
            analysis_text += "• Tester avec des paramètres plus conservateurs\n"
        
        analysis_text += f"""

🎯 OPTIMISATIONS SUGGÉRÉES:
{'='*30}
• Taille position: Actuellement {self.vars['position_size'].get():.1f}%
• Stop loss: Actuellement {self.vars['stop_loss'].get():.0f}%
• Take profits: {self.vars['tp1'].get():.0f}% - {self.vars['tp5'].get():.0f}%

💡 PROCHAINES ÉTAPES:
{'='*30}
1. Analyser les meilleurs trades pour identifier les patterns
2. Ajuster les paramètres selon les recommandations
3. Tester sur une période différente
4. Comparer avec d'autres stratégies
"""
        
        self.analysis_text.delete(1.0, tk.END)
        self.analysis_text.insert(1.0, analysis_text)
    
    def show_capital_chart(self):
        """Affiche le graphique d'évolution du capital"""
        if not self.backtest_results:
            return
        
        # Clear previous chart
        for widget in self.chart_display_frame.winfo_children():
            widget.destroy()
        
        # Create matplotlib figure
        fig, ax = plt.subplots(figsize=(10, 6), facecolor='#0f0f23')
        ax.set_facecolor('#0f0f23')
        
        # Data
        months = list(range(len(self.backtest_results['capital'])))
        capital = self.backtest_results['capital']
        
        # Plot
        ax.plot(months, capital, color='#00ff88', linewidth=3, marker='o', markersize=4)
        ax.fill_between(months, capital, alpha=0.3, color='#00ff88')
        
        # Styling
        ax.set_title('📈 Évolution du Capital', color='#00ff88', fontsize=16, fontweight='bold')
        ax.set_xlabel('Mois', color='#e0e0e0')
        ax.set_ylabel('Capital ($)', color='#e0e0e0')
        ax.tick_params(colors='#e0e0e0')
        ax.grid(True, alpha=0.3, color='#444444')
        
        # Add initial capital line
        initial_capital = self.vars['initial_capital'].get()
        ax.axhline(y=initial_capital, color='#ff4444', linestyle='--', alpha=0.7, label='Capital Initial')
        ax.legend(facecolor='#1a1a2e', edgecolor='#00ff88', labelcolor='#e0e0e0')
        
        plt.tight_layout()
        
        # Embed in tkinter
        canvas = FigureCanvasTkAgg(fig, self.chart_display_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill='both', expand=True)
    
    def show_monthly_returns(self):
        """Affiche les rendements mensuels"""
        if not self.backtest_results:
            return
        
        # Clear previous chart
        for widget in self.chart_display_frame.winfo_children():
            widget.destroy()
        
        fig, ax = plt.subplots(figsize=(10, 6), facecolor='#0f0f23')
        ax.set_facecolor('#0f0f23')
        
        # Data
        months = self.backtest_results['months']
        returns = self.backtest_results['returns']
        
        # Colors based on performance
        colors = ['#00ff88' if r > 0 else '#ff4444' for r in returns]
        
        # Plot
        bars = ax.bar(months, returns, color=colors, alpha=0.8)
        
        # Add value labels on bars
        for bar, ret in zip(bars, returns):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + (0.5 if height > 0 else -1.5),
                   f'{ret:+.1f}%', ha='center', va='bottom' if height > 0 else 'top', 
                   color='#e0e0e0', fontsize=9)
        
        # Styling
        ax.set_title('📊 Rendements Mensuels', color='#00ff88', fontsize=16, fontweight='bold')
        ax.set_xlabel('Mois', color='#e0e0e0')
        ax.set_ylabel('Rendement (%)', color='#e0e0e0')
        ax.tick_params(colors='#e0e0e0')
        ax.grid(True, alpha=0.3, color='#444444', axis='y')
        ax.axhline(y=0, color='#666666', linestyle='-', alpha=0.8)
        
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # Embed in tkinter
        canvas = FigureCanvasTkAgg(fig, self.chart_display_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill='both', expand=True)
    
    def show_trade_distribution(self):
        """Affiche la distribution des performances des trades"""
        if not self.backtest_results:
            return
        
        # Clear previous chart
        for widget in self.chart_display_frame.winfo_children():
            widget.destroy()
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6), facecolor='#0f0f23')
        
        # Data
        trades = [t for t in self.backtest_results['trades'] if t['action'] == 'SELL']
        returns = [t['return'] for t in trades]
        
        if not returns:
            return
        
        # Histogram
        ax1.set_facecolor('#0f0f23')
        n, bins, patches = ax1.hist(returns, bins=20, alpha=0.8, edgecolor='#e0e0e0')
        
        # Color bars
        for i, patch in enumerate(patches):
            if bins[i] < 0:
                patch.set_facecolor('#ff4444')
            elif bins[i] > 100:
                patch.set_facecolor('#ffd700')  # Gold for moon shots
            else:
                patch.set_facecolor('#00ff88')
        
        ax1.set_title('📊 Distribution des Rendements', color='#00ff88', fontweight='bold')
        ax1.set_xlabel('Rendement (%)', color='#e0e0e0')
        ax1.set_ylabel('Nombre de Trades', color='#e0e0e0')
        ax1.tick_params(colors='#e0e0e0')
        ax1.grid(True, alpha=0.3, color='#444444')
        ax1.axvline(x=0, color='#666666', linestyle='--', alpha=0.8)
        ax1.axvline(x=100, color='#ffd700', linestyle='--', alpha=0.8, label='Moon Shot (100%+)')
        ax1.legend(facecolor='#1a1a2e', edgecolor='#00ff88', labelcolor='#e0e0e0')
        
        # Pie chart Win/Loss
        ax2.set_facecolor('#0f0f23')
        winners = len([r for r in returns if r > 0])
        losers = len([r for r in returns if r <= 0])
        moon_shots = len([r for r in returns if r >= 100])
        
        if winners + losers > 0:
            labels = ['Gagnants', 'Perdants']
            sizes = [winners, losers]
            colors = ['#00ff88', '#ff4444']
            
            if moon_shots > 0:
                labels.append('Moon Shots')
                sizes[0] -= moon_shots  # Remove moon shots from regular winners
                sizes.append(moon_shots)
                colors.append('#ffd700')
            
            wedges, texts, autotexts = ax2.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%',
                                              startangle=90, textprops={'color': '#e0e0e0'})
            ax2.set_title('🎯 Répartition Trades', color='#00ff88', fontweight='bold')
        
        plt.tight_layout()
        
        # Embed in tkinter
        canvas = FigureCanvasTkAgg(fig, self.chart_display_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill='both', expand=True)
    
    def show_performance_heatmap(self):
        """Affiche une heatmap de performance mensuelle"""
        if not self.backtest_results:
            return
        
        # Clear previous chart
        for widget in self.chart_display_frame.winfo_children():
            widget.destroy()
        
        fig, ax = plt.subplots(figsize=(10, 6), facecolor='#0f0f23')
        ax.set_facecolor('#0f0f23')
        
        # Prepare data for heatmap
        returns = self.backtest_results['returns']
        months = len(returns)
        
        # Create a 2D array for heatmap (reshape returns into rows)
        cols = min(12, months)  # Max 12 columns (months per year)
        rows = (months + cols - 1) // cols  # Calculate needed rows
        
        # Pad returns to fill the grid
        padded_returns = returns + [0] * (rows * cols - len(returns))
        heatmap_data = np.array(padded_returns).reshape(rows, cols)
        
        # Create heatmap
        im = ax.imshow(heatmap_data, cmap='RdYlGn', aspect='auto', vmin=-20, vmax=20)
        
        # Add text annotations
        for i in range(rows):
            for j in range(cols):
                month_idx = i * cols + j
                if month_idx < len(returns):
                    text = ax.text(j, i, f'{returns[month_idx]:.1f}%',
                                 ha="center", va="center", color='#000000', fontweight='bold')
        
        # Styling
        ax.set_title('🔥 Heatmap Performance Mensuelle', color='#00ff88', fontsize=16, fontweight='bold')
        ax.set_xlabel('Mois', color='#e0e0e0')
        ax.set_ylabel('Période', color='#e0e0e0')
        
        # Set ticks
        ax.set_xticks(range(cols))
        ax.set_yticks(range(rows))
        ax.set_xticklabels([f'M{j+1}' for j in range(cols)], color='#e0e0e0')
        ax.set_yticklabels([f'P{i+1}' for i in range(rows)], color='#e0e0e0')
        
        # Add colorbar
        cbar = plt.colorbar(im, ax=ax)
        cbar.set_label('Rendement (%)', color='#e0e0e0')
        cbar.ax.tick_params(colors='#e0e0e0')
        
        plt.tight_layout()
        
        # Embed in tkinter
        canvas = FigureCanvasTkAgg(fig, self.chart_display_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill='both', expand=True)
    
    def save_config(self):
        """Sauvegarde la configuration"""
        config = {}
        for key, var in self.vars.items():
            try:
                config[key] = var.get()
            except:
                config[key] = str(var.get())
        
        filename = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
            title="Sauvegarder la configuration"
        )
        
        if filename:
            try:
                with open(filename, 'w') as f:
                    json.dump(config, f, indent=4)
                messagebox.showinfo("Succès", "Configuration sauvegardée!")
            except Exception as e:
                messagebox.showerror("Erreur", f"Erreur lors de la sauvegarde: {e}")
    
    def load_config(self):
        """Charge une configuration"""
        filename = filedialog.askopenfilename(
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
            title="Charger une configuration"
        )
        
        if filename:
            try:
                with open(filename, 'r') as f:
                    config = json.load(f)
                
                for key, value in config.items():
                    if key in self.vars:
                        self.vars[key].set(value)
                
                messagebox.showinfo("Succès", "Configuration chargée!")
            except Exception as e:
                messagebox.showerror("Erreur", f"Erreur lors du chargement: {e}")
    
    def export_csv(self):
        """Exporte les résultats en CSV"""
        if not self.backtest_results:
            messagebox.showwarning("Attention", "Aucun résultat à exporter!")
            return
        
        filename = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv"), ("All files", "*.*")],
            title="Exporter les trades"
        )
        
        if filename:
            try:
                df = pd.DataFrame(self.backtest_results['trades'])
                df.to_csv(filename, index=False)
                messagebox.showinfo("Succès", f"Données exportées vers {filename}")
            except Exception as e:
                messagebox.showerror("Erreur", f"Erreur lors de l'export: {e}")
    
    def reset_all(self):
        """Reset tous les résultats"""
        self.backtest_results = None
        
        # Reset UI
        for key in self.live_metrics:
            self.live_metrics[key].set("--")
        
        for key in self.detailed_metrics:
            self.detailed_metrics[key].set("--")
        
        for key in self.trades_stats:
            self.trades_stats[key].set("--")
        
        # Clear trades table
        for item in self.trades_tree.get_children():
            self.trades_tree.delete(item)
        
        # Clear analysis
        self.analysis_text.delete(1.0, tk.END)
        
        # Clear charts
        for widget in self.chart_display_frame.winfo_children():
            widget.destroy()
        
        self.status_var.set("⏳ En attente...")
        self.progress_var.set(0)
        
        messagebox.showinfo("Reset", "Toutes les données ont été effacées!")


# Fonction principale
def main():
    """Lance l'interface graphique"""
    
    # Configuration matplotlib pour le dark theme
    plt.style.use('dark_background')
    
    root = tk.Tk()
    app = MemecoinTradingGUI(root)
    
    # Icon et configuration finale
    try:
        root.iconbitmap('icon.ico')  # Si vous avez un icon
    except:
        pass
    
    # Centrage de la fenêtre
    root.update_idletasks()
    x = (root.winfo_screenwidth() - root.winfo_width()) // 2
    y = (root.winfo_screenheight() - root.winfo_height()) // 2
    root.geometry(f"+{x}+{y}")
    
    # Message de bienvenue
    messagebox.showinfo("🤖 Memecoin Sniper Bot", 
                       "Interface graphique chargée!\n\n"
                       "✅ Configurez vos paramètres\n"
                       "✅ Sélectionnez la période\n"
                       "✅ Lancez le backtest\n"
                       "✅ Analysez les résultats\n\n"
                       "🚀 Bon trading!")
    
    root.mainloop()


if __name__ == "__main__":
    main()