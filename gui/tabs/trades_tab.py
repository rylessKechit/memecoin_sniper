import tkinter as tk
from tkinter import ttk
from config import Config

class TradesTab:
    """Onglet détaillé des trades"""
    
    def __init__(self, notebook, main_app):
        self.notebook = notebook
        self.main_app = main_app
        
        self.create_tab()
    
    def create_tab(self):
        """Crée l'onglet des trades"""
        self.frame = tk.Frame(self.notebook, bg=Config.COLORS["bg_secondary"])
        self.notebook.add(self.frame, text="💼 Trades")
        
        # Panel principal
        main_panel = tk.Frame(self.frame, bg=Config.COLORS["bg_secondary"])
        main_panel.pack(fill='both', expand=True, padx=10, pady=5)
        
        # Tableau des trades
        self.create_trades_table(main_panel)
        
        # Panel des statistiques
        self.create_stats_panel(main_panel)
    
    def create_trades_table(self, parent):
        """Crée le tableau des trades"""
        # Frame pour le tableau
        table_frame = tk.Frame(parent, bg=Config.COLORS["bg_secondary"])
        table_frame.pack(side='left', fill='both', expand=True, padx=(0, 10))
        
        # En-tête
        tk.Label(table_frame, text="📋 Historique des Trades", 
                bg=Config.COLORS["bg_secondary"], fg=Config.COLORS["accent_green"], 
                font=('Arial', 12, 'bold')).pack(pady=5)
        
        # Treeview
        columns = ('Mois', 'Token', 'Action', 'Rendement', 'P&L', 'Date', 'Holding')
        self.trades_tree = ttk.Treeview(table_frame, columns=columns, show='headings', height=20)
        
        # Configuration des colonnes
        column_widths = {'Mois': 60, 'Token': 80, 'Action': 60, 'Rendement': 80, 
                        'P&L': 80, 'Date': 100, 'Holding': 70}
        
        for col in columns:
            self.trades_tree.heading(col, text=col)
            self.trades_tree.column(col, width=column_widths.get(col, 100), anchor='center')
        
        # Scrollbars
        v_scrollbar = ttk.Scrollbar(table_frame, orient="vertical", command=self.trades_tree.yview)
        h_scrollbar = ttk.Scrollbar(table_frame, orient="horizontal", command=self.trades_tree.xview)
        self.trades_tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Pack du tableau avec scrollbars
        table_container = tk.Frame(table_frame, bg=Config.COLORS["bg_secondary"])
        table_container.pack(fill='both', expand=True)
        
        self.trades_tree.pack(side="left", fill="both", expand=True)
        v_scrollbar.pack(side="right", fill="y")
        h_scrollbar.pack(side="bottom", fill="x")
        
        # Filtres
        self.create_filters(table_frame)
    
    def create_filters(self, parent):
        """Crée les filtres pour les trades"""
        filter_frame = tk.Frame(parent, bg=Config.COLORS["bg_tertiary"], relief='solid', borderwidth=1)
        filter_frame.pack(fill='x', pady=5)
        
        tk.Label(filter_frame, text="🔍 Filtres", 
                bg=Config.COLORS["bg_tertiary"], fg=Config.COLORS["accent_green"], 
                font=('Arial', 10, 'bold')).pack(pady=2)
        
        controls_frame = tk.Frame(filter_frame, bg=Config.COLORS["bg_tertiary"])
        controls_frame.pack(fill='x', padx=5, pady=2)
        
        # Filtre par type
        tk.Label(controls_frame, text="Type:", bg=Config.COLORS["bg_tertiary"], 
                fg=Config.COLORS["text_primary"]).pack(side='left', padx=5)
        
        self.filter_type = tk.StringVar(value="Tous")
        type_combo = ttk.Combobox(controls_frame, textvariable=self.filter_type, 
                                 values=["Tous", "Gagnants", "Perdants", "Moon Shots"], width=10)
        type_combo.pack(side='left', padx=5)
        type_combo.bind('<<ComboboxSelected>>', self.apply_filters)
        
        # Filtre par rendement minimum
        tk.Label(controls_frame, text="Rendement min:", bg=Config.COLORS["bg_tertiary"], 
                fg=Config.COLORS["text_primary"]).pack(side='left', padx=5)
        
        self.filter_min_return = tk.StringVar(value="")
        min_return_entry = tk.Entry(controls_frame, textvariable=self.filter_min_return, width=8)
        min_return_entry.pack(side='left', padx=5)
        min_return_entry.bind('<KeyRelease>', self.apply_filters)
        
        # Bouton reset
        reset_btn = tk.Button(controls_frame, text="Reset", command=self.reset_filters,
                             bg=Config.COLORS["accent_orange"], fg='white', font=('Arial', 8))
        reset_btn.pack(side='right', padx=5)
    
    def create_stats_panel(self, parent):
        """Crée le panel des statistiques"""
        stats_frame = tk.Frame(parent, bg=Config.COLORS["bg_primary"], width=250, relief='solid', borderwidth=1)
        stats_frame.pack(side='right', fill='y', padx=10)
        stats_frame.pack_propagate(False)
        
        # Titre
        tk.Label(stats_frame, text="📊 Statistiques Trades", 
                bg=Config.COLORS["bg_primary"], fg=Config.COLORS["accent_green"], 
                font=('Arial', 12, 'bold')).pack(pady=10)
        
        # Métriques rapides
        self.trades_stats = {}
        stats_data = [
            ("Total Trades", "total"),
            ("Trades Gagnants", "winners"),
            ("Trades Perdants", "losers"),
            ("Moon Shots (>100%)", "moon_shots"),
            ("Win Rate", "win_rate"),
            ("Profit Factor", "profit_factor"),
            ("Meilleur Trade", "best_trade"),
            ("Pire Trade", "worst_trade"),
            ("Gain Moyen", "avg_gain"),
            ("Perte Moyenne", "avg_loss"),
            ("P&L Total", "total_pnl"),
            ("Holding Moyen", "avg_holding")
        ]
        
        for label, key in stats_data:
            self.create_stat_item(stats_frame, label, key)
        
        # Graphique mini (pie chart)
        self.create_mini_chart(stats_frame)
    
    def create_stat_item(self, parent, label, key):
        """Crée un élément de statistique"""
        item_frame = tk.Frame(parent, bg=Config.COLORS["bg_primary"])
        item_frame.pack(fill='x', pady=3, padx=10)
        
        tk.Label(item_frame, text=f"{label}:", 
                bg=Config.COLORS["bg_primary"], fg=Config.COLORS["text_primary"], 
                font=('Arial', 9), anchor='w').pack(anchor='w')
        
        self.trades_stats[key] = tk.StringVar(value="--")
        tk.Label(item_frame, textvariable=self.trades_stats[key], 
                bg=Config.COLORS["bg_primary"], fg=Config.COLORS["accent_green"], 
                font=('Arial', 10, 'bold'), anchor='w').pack(anchor='w')
    
    def create_mini_chart(self, parent):
        """Crée un mini graphique"""
        chart_frame = tk.Frame(parent, bg=Config.COLORS["bg_secondary"], relief='solid', borderwidth=1)
        chart_frame.pack(fill='x', padx=10, pady=10)
        
        tk.Label(chart_frame, text="📈 Répartition", 
                bg=Config.COLORS["bg_secondary"], fg=Config.COLORS["accent_green"], 
                font=('Arial', 10, 'bold')).pack(pady=5)
        
        # Canvas pour mini graphique
        self.mini_canvas = tk.Canvas(chart_frame, width=200, height=120, 
                                    bg=Config.COLORS["bg_secondary"], highlightthickness=0)
        self.mini_canvas.pack(pady=5)
    
    def display_trades(self, results):
        """Affiche les trades dans le tableau"""
        # Vide le tableau
        for item in self.trades_tree.get_children():
            self.trades_tree.delete(item)
        
        if not results or 'trades' not in results:
            return
        
        self.all_trades = results['trades']
        self.filtered_trades = self.all_trades.copy()
        
        # Populate le tableau
        self.populate_table()
        
        # Met à jour les statistiques
        self.update_trade_stats()
    
    def populate_table(self):
        """Remplit le tableau avec les trades filtrés"""
        # Vide le tableau
        for item in self.trades_tree.get_children():
            self.trades_tree.delete(item)
        
        # Ajoute les trades filtrés
        for i, trade in enumerate(self.filtered_trades):
            # Couleur selon performance
            if trade.get('return', 0) >= 100:
                tags = ('moon_shot',)
            elif trade.get('return', 0) > 0:
                tags = ('winner',)
            else:
                tags = ('loser',)
            
            values = (
                f"M{trade.get('month', i+1)}",
                trade.get('token', f'TOKEN{i+1}'),
                trade.get('action', 'SELL'),
                f"{trade.get('return', 0):+.1f}%",
                f"${trade.get('pnl', 0):+.0f}",
                trade.get('date', '2024-01-01'),
                f"{trade.get('holding_days', 8)}j"
            )
            
            self.trades_tree.insert('', 'end', values=values, tags=tags)
        
        # Configuration des couleurs
        self.trades_tree.tag_configure('winner', background='#1a4d1a')
        self.trades_tree.tag_configure('loser', background='#4d1a1a')
        self.trades_tree.tag_configure('moon_shot', background='#4d4d1a')
    
    def apply_filters(self, event=None):
        """Applique les filtres aux trades"""
        if not hasattr(self, 'all_trades'):
            return
        
        filtered = self.all_trades.copy()
        
        # Filtre par type
        filter_type = self.filter_type.get()
        if filter_type == "Gagnants":
            filtered = [t for t in filtered if t.get('return', 0) > 0]
        elif filter_type == "Perdants":
            filtered = [t for t in filtered if t.get('return', 0) <= 0]
        elif filter_type == "Moon Shots":
            filtered = [t for t in filtered if t.get('return', 0) >= 100]
        
        # Filtre par rendement minimum
        try:
            min_return = float(self.filter_min_return.get() or -999)
            filtered = [t for t in filtered if t.get('return', 0) >= min_return]
        except ValueError:
            pass
        
        self.filtered_trades = filtered
        self.populate_table()
        self.update_trade_stats()
    
    def reset_filters(self):
        """Reset tous les filtres"""
        self.filter_type.set("Tous")
        self.filter_min_return.set("")
        self.apply_filters()
    
    def update_trade_stats(self):
        """Met à jour les statistiques des trades"""
        if not hasattr(self, 'filtered_trades'):
            return
        
        trades = self.filtered_trades
        if not trades:
            # Reset toutes les stats
            for key in self.trades_stats:
                self.trades_stats[key].set("--")
            return
        
        # Calculs
        returns = [t.get('return', 0) for t in trades]
        pnls = [t.get('pnl', 0) for t in trades]
        
        winners = [r for r in returns if r > 0]
        losers = [r for r in returns if r <= 0]
        moon_shots = [r for r in returns if r >= 100]
        
        win_rate = (len(winners) / len(returns) * 100) if returns else 0
        profit_factor = (sum([abs(p) for p in pnls if p > 0]) / sum([abs(p) for p in pnls if p < 0])) if any(p < 0 for p in pnls) else 0
        
        # Mise à jour
        self.trades_stats['total'].set(str(len(trades)))
        self.trades_stats['winners'].set(str(len(winners)))
        self.trades_stats['losers'].set(str(len(losers)))
        self.trades_stats['moon_shots'].set(str(len(moon_shots)))
        self.trades_stats['win_rate'].set(f"{win_rate:.1f}%")
        self.trades_stats['profit_factor'].set(f"{profit_factor:.2f}")
        self.trades_stats['best_trade'].set(f"{max(returns):+.1f}%" if returns else "--")
        self.trades_stats['worst_trade'].set(f"{min(returns):+.1f}%" if returns else "--")
        self.trades_stats['avg_gain'].set(f"{sum(winners)/len(winners):+.1f}%" if winners else "--")
        self.trades_stats['avg_loss'].set(f"{sum(losers)/len(losers):+.1f}%" if losers else "--")
        self.trades_stats['total_pnl'].set(f"${sum(pnls):+,.0f}")
        self.trades_stats['avg_holding'].set("8.0j")  # À calculer selon les données réelles
        
        # Met à jour le mini graphique
        self.update_mini_chart(len(winners), len(losers), len(moon_shots))
    
    def update_mini_chart(self, winners, losers, moon_shots):
        """Met à jour le mini graphique"""
        self.mini_canvas.delete("all")
        
        total = winners + losers + moon_shots
        if total == 0:
            return
        
        # Paramètres du graphique
        cx, cy = 100, 60
        radius = 40
        
        # Calcul des angles
        start_angle = 0
        
        colors = [Config.COLORS["accent_green"], Config.COLORS["accent_red"], Config.COLORS["accent_gold"]]
        values = [winners - moon_shots, losers, moon_shots]  # Ajustement pour les moon shots
        labels = ["Gagnants", "Perdants", "Moon Shots"]
        
        for i, (value, color, label) in enumerate(zip(values, colors, labels)):
            if value > 0:
                extent = (value / total) * 360
                self.mini_canvas.create_arc(
                    cx - radius, cy - radius, cx + radius, cy + radius,
                    start=start_angle, extent=extent, fill=color, outline='white', width=1
                )
                start_angle += extent
        
        # Légende
        y_offset = 0
        for i, (value, color, label) in enumerate(zip(values, colors, labels)):
            if value > 0:
                self.mini_canvas.create_rectangle(10, 10 + y_offset, 20, 20 + y_offset, fill=color, outline='white')
                self.mini_canvas.create_text(25, 15 + y_offset, text=f"{label}: {value}", 
                                           anchor='w', fill=Config.COLORS["text_primary"], font=('Arial', 8))
                y_offset += 15
    
    def reset(self):
        """Reset l'onglet des trades"""
        for item in self.trades_tree.get_children():
            self.trades_tree.delete(item)
        
        for key in self.trades_stats:
            self.trades_stats[key].set("--")
        
        self.mini_canvas.delete("all")
        
        self.filter_type.set("Tous")
        self.filter_min_return.set("")
