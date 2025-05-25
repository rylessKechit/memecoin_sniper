import tkinter as tk
from tkinter import ttk
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure
import numpy as np
import seaborn as sns
from config import Config

class ChartsTab:
    """Onglet des graphiques"""
    
    def __init__(self, notebook, main_app):
        self.notebook = notebook
        self.main_app = main_app
        self.current_chart = None
        
        self.create_tab()
    
    def create_tab(self):
        """Crée l'onglet graphiques"""
        self.frame = tk.Frame(self.notebook, bg=Config.COLORS["bg_secondary"])
        self.notebook.add(self.frame, text="📈 Graphiques")
        
        # Boutons pour les différents graphiques
        self.create_chart_buttons()
        
        # Frame pour l'affichage
        self.chart_display_frame = tk.Frame(self.frame, bg=Config.COLORS["bg_secondary"])
        self.chart_display_frame.pack(fill='both', expand=True, padx=10, pady=5)
    
    def create_chart_buttons(self):
        """Crée les boutons de sélection de graphiques"""
        buttons_frame = tk.Frame(self.frame, bg=Config.COLORS["bg_secondary"])
        buttons_frame.pack(fill='x', padx=10, pady=5)
        
        chart_types = [
            ("📈 Évolution Capital", self.show_capital_evolution),
            ("📊 Rendements Mensuels", self.show_monthly_returns),
            ("🎯 Distribution Trades", self.show_trade_distribution),
            ("🔥 Heatmap Performance", self.show_performance_heatmap),
            ("📉 Drawdown", self.show_drawdown_chart),
            ("🎪 Corrélation", self.show_correlation_matrix)
        ]
        
        for i, (text, command) in enumerate(chart_types):
            row = i // 3
            col = i % 3
            
            btn = tk.Button(
                buttons_frame, 
                text=text, 
                command=command,
                bg=Config.COLORS["accent_blue"], 
                fg='#ffffff', 
                font=('Arial', 9),
                width=15
            )
            btn.grid(row=row, column=col, padx=5, pady=2, sticky='ew')
        
        # Configure grid weights
        for i in range(3):
            buttons_frame.grid_columnconfigure(i, weight=1)
    
    def clear_chart(self):
        """Efface le graphique actuel"""
        for widget in self.chart_display_frame.winfo_children():
            widget.destroy()
    
    def show_capital_evolution(self):
        """Affiche l'évolution du capital"""
        if not self.main_app.backtest_results:
            self.show_no_data_message()
            return
        
        self.clear_chart()
        
        fig, ax = plt.subplots(figsize=Config.CHART_CONFIG["figsize"], 
                              facecolor=Config.COLORS["bg_secondary"])
        ax.set_facecolor(Config.COLORS["bg_secondary"])
        
        # Données
        capital = self.main_app.backtest_results['capital']
        months = list(range(len(capital)))
        initial_capital = capital[0] if capital else 10000
        
        # Graphique principal
        ax.plot(months, capital, color=Config.COLORS["accent_green"], 
               linewidth=3, marker='o', markersize=4, label='Capital')
        ax.fill_between(months, capital, alpha=0.3, color=Config.COLORS["accent_green"])
        
        # Ligne de capital initial
        ax.axhline(y=initial_capital, color=Config.COLORS["accent_red"], 
                  linestyle='--', alpha=0.7, label='Capital Initial')
        
        # Styling
        ax.set_title('📈 Évolution du Capital', color=Config.COLORS["accent_green"], 
                    fontsize=16, fontweight='bold')
        ax.set_xlabel('Mois', color=Config.COLORS["text_primary"])
        ax.set_ylabel('Capital ($)', color=Config.COLORS["text_primary"])
        ax.tick_params(colors=Config.COLORS["text_primary"])
        ax.grid(True, alpha=0.3, color='#444444')
        ax.legend(facecolor=Config.COLORS["bg_primary"], 
                 edgecolor=Config.COLORS["accent_green"], 
                 labelcolor=Config.COLORS["text_primary"])
        
        # Annotations
        if len(capital) > 1:
            total_return = ((capital[-1] - capital[0]) / capital[0]) * 100
            ax.annotate(f'Rendement Total: {total_return:+.1f}%',
                       xy=(len(capital)-1, capital[-1]),
                       xytext=(len(capital)*0.7, capital[-1]*1.1),
                       arrowprops=dict(arrowstyle='->', color=Config.COLORS["accent_green"]),
                       color=Config.COLORS["accent_green"], fontweight='bold')
        
        plt.tight_layout()
        self.embed_chart(fig)
    
    def show_monthly_returns(self):
        """Affiche les rendements mensuels"""
        if not self.main_app.backtest_results:
            self.show_no_data_message()
            return
        
        self.clear_chart()
        
        fig, ax = plt.subplots(figsize=Config.CHART_CONFIG["figsize"], 
                              facecolor=Config.COLORS["bg_secondary"])
        ax.set_facecolor(Config.COLORS["bg_secondary"])
        
        # Données
        returns = self.main_app.backtest_results.get('returns', [])
        months = [f'M{i+1}' for i in range(len(returns))]
        
        # Couleurs selon performance
        colors = [Config.COLORS["accent_green"] if r > 0 else Config.COLORS["accent_red"] for r in returns]
        
        # Graphique
        bars = ax.bar(months, returns, color=colors, alpha=0.8, edgecolor='white', linewidth=0.5)
        
        # Labels sur les barres
        for bar, ret in zip(bars, returns):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + (0.5 if height > 0 else -1.5),
                   f'{ret:+.1f}%', ha='center', va='bottom' if height > 0 else 'top', 
                   color=Config.COLORS["text_primary"], fontsize=9, fontweight='bold')
        
        # Ligne de référence
        ax.axhline(y=0, color='#666666', linestyle='-', alpha=0.8)
        
        # Styling
        ax.set_title('📊 Rendements Mensuels', color=Config.COLORS["accent_green"], 
                    fontsize=16, fontweight='bold')
        ax.set_xlabel('Mois', color=Config.COLORS["text_primary"])
        ax.set_ylabel('Rendement (%)', color=Config.COLORS["text_primary"])
        ax.tick_params(colors=Config.COLORS["text_primary"])
        ax.grid(True, alpha=0.3, color='#444444', axis='y')
        
        plt.xticks(rotation=45)
        plt.tight_layout()
        self.embed_chart(fig)
    
    def show_trade_distribution(self):
        """Affiche la distribution des performances"""
        if not self.main_app.backtest_results:
            self.show_no_data_message()
            return
        
        self.clear_chart()
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6), 
                                      facecolor=Config.COLORS["bg_secondary"])
        
        # Données
        trades = [t for t in self.main_app.backtest_results.get('trades', []) if t.get('action') == 'SELL']
        returns = [t['return'] for t in trades]
        
        if not returns:
            self.show_no_data_message()
            return
        
        # Histogramme des rendements
        ax1.set_facecolor(Config.COLORS["bg_secondary"])
        n, bins, patches = ax1.hist(returns, bins=20, alpha=0.8, edgecolor='white')
        
        # Coloration des barres
        for i, patch in enumerate(patches):
            if bins[i] < 0:
                patch.set_facecolor(Config.COLORS["accent_red"])
            elif bins[i] > 100:
                patch.set_facecolor(Config.COLORS["accent_gold"])
            else:
                patch.set_facecolor(Config.COLORS["accent_green"])
        
        ax1.set_title('📊 Distribution des Rendements', color=Config.COLORS["accent_green"], fontweight='bold')
        ax1.set_xlabel('Rendement (%)', color=Config.COLORS["text_primary"])
        ax1.set_ylabel('Nombre de Trades', color=Config.COLORS["text_primary"])
        ax1.tick_params(colors=Config.COLORS["text_primary"])
        ax1.grid(True, alpha=0.3, color='#444444')
        ax1.axvline(x=0, color='#666666', linestyle='--', alpha=0.8)
        ax1.axvline(x=100, color=Config.COLORS["accent_gold"], linestyle='--', alpha=0.8, label='Moon Shot (100%+)')
        ax1.legend(facecolor=Config.COLORS["bg_primary"], labelcolor=Config.COLORS["text_primary"])
        
        # Camembert Win/Loss
        ax2.set_facecolor(Config.COLORS["bg_secondary"])
        winners = len([r for r in returns if r > 0])
        losers = len([r for r in returns if r <= 0])
        moon_shots = len([r for r in returns if r >= 100])
        
        if winners + losers > 0:
            # Ajustement pour les moon shots
            regular_winners = winners - moon_shots
            
            sizes = []
            labels = []
            colors = []
            
            if regular_winners > 0:
                sizes.append(regular_winners)
                labels.append('Gagnants')
                colors.append(Config.COLORS["accent_green"])
            
            if losers > 0:
                sizes.append(losers)
                labels.append('Perdants')
                colors.append(Config.COLORS["accent_red"])
            
            if moon_shots > 0:
                sizes.append(moon_shots)
                labels.append('Moon Shots')
                colors.append(Config.COLORS["accent_gold"])
            
            wedges, texts, autotexts = ax2.pie(sizes, labels=labels, colors=colors, 
                                              autopct='%1.1f%%', startangle=90,
                                              textprops={'color': Config.COLORS["text_primary"]})
            ax2.set_title('🎯 Répartition des Trades', color=Config.COLORS["accent_green"], fontweight='bold')
        
        plt.tight_layout()
        self.embed_chart(fig)
    
    def show_performance_heatmap(self):
        """Affiche une heatmap de performance"""
        if not self.main_app.backtest_results:
            self.show_no_data_message()
            return
        
        self.clear_chart()
        
        fig, ax = plt.subplots(figsize=Config.CHART_CONFIG["figsize"], 
                              facecolor=Config.COLORS["bg_secondary"])
        ax.set_facecolor(Config.COLORS["bg_secondary"])
        
        # Données
        returns = self.main_app.backtest_results.get('returns', [])
        
        if len(returns) < 12:
            # Si moins de 12 mois, créer une heatmap simple
            cols = min(6, len(returns))
            rows = (len(returns) + cols - 1) // cols
        else:
            # Grille 12 mois (année)
            cols = 12
            rows = (len(returns) + 11) // 12
        
        # Préparer les données
        padded_returns = returns + [0] * (rows * cols - len(returns))
        heatmap_data = np.array(padded_returns).reshape(rows, cols)
        
        # Créer la heatmap
        im = ax.imshow(heatmap_data, cmap='RdYlGn', aspect='auto', vmin=-20, vmax=20)
        
        # Annotations
        for i in range(rows):
            for j in range(cols):
                month_idx = i * cols + j
                if month_idx < len(returns):
                    text = ax.text(j, i, f'{returns[month_idx]:.1f}%',
                                 ha="center", va="center", color='#000000', fontweight='bold')
        
        # Styling
        ax.set_title('🔥 Heatmap Performance Mensuelle', color=Config.COLORS["accent_green"], 
                    fontsize=16, fontweight='bold')
        ax.set_xlabel('Mois', color=Config.COLORS["text_primary"])
        ax.set_ylabel('Période', color=Config.COLORS["text_primary"])
        
        # Ticks
        ax.set_xticks(range(cols))
        ax.set_yticks(range(rows))
        ax.set_xticklabels([f'M{j+1}' for j in range(cols)], color=Config.COLORS["text_primary"])
        ax.set_yticklabels([f'P{i+1}' for i in range(rows)], color=Config.COLORS["text_primary"])
        
        # Colorbar
        cbar = plt.colorbar(im, ax=ax)
        cbar.set_label('Rendement (%)', color=Config.COLORS["text_primary"])
        cbar.ax.tick_params(colors=Config.COLORS["text_primary"])
        
        plt.tight_layout()
        self.embed_chart(fig)
    
    def show_drawdown_chart(self):
        """Affiche le graphique de drawdown"""
        if not self.main_app.backtest_results:
            self.show_no_data_message()
            return
        
        self.clear_chart()
        
        fig, ax = plt.subplots(figsize=Config.CHART_CONFIG["figsize"], 
                              facecolor=Config.COLORS["bg_secondary"])
        ax.set_facecolor(Config.COLORS["bg_secondary"])
        
        # Calcul du drawdown
        capital = self.main_app.backtest_results['capital']
        if not capital:
            self.show_no_data_message()
            return
        
        # Calcul du drawdown cumulé
        peak = capital[0]
        drawdowns = []
        
        for cap in capital:
            if cap > peak:
                peak = cap
            drawdown = (peak - cap) / peak * 100
            drawdowns.append(-drawdown)  # Négatif pour affichage
        
        months = list(range(len(drawdowns)))
        
        # Graphique
        ax.fill_between(months, drawdowns, 0, alpha=0.6, color=Config.COLORS["accent_red"], label='Drawdown')
        ax.plot(months, drawdowns, color=Config.COLORS["accent_red"], linewidth=2)
        
        # Ligne de référence
        ax.axhline(y=0, color='#666666', linestyle='-', alpha=0.8)
        
        # Max drawdown
        max_dd = min(drawdowns)
        max_dd_idx = drawdowns.index(max_dd)
        ax.plot(max_dd_idx, max_dd, 'o', color='white', markersize=8, markeredgecolor=Config.COLORS["accent_red"], markeredgewidth=2)
        ax.annotate(f'Max DD: {abs(max_dd):.1f}%', 
                   xy=(max_dd_idx, max_dd), 
                   xytext=(max_dd_idx + len(months)*0.1, max_dd*0.5),
                   arrowprops=dict(arrowstyle='->', color=Config.COLORS["accent_red"]),
                   color=Config.COLORS["accent_red"], fontweight='bold')
        
        # Styling
        ax.set_title('📉 Analyse du Drawdown', color=Config.COLORS["accent_green"], 
                    fontsize=16, fontweight='bold')
        ax.set_xlabel('Mois', color=Config.COLORS["text_primary"])
        ax.set_ylabel('Drawdown (%)', color=Config.COLORS["text_primary"])
        ax.tick_params(colors=Config.COLORS["text_primary"])
        ax.grid(True, alpha=0.3, color='#444444')
        ax.legend(facecolor=Config.COLORS["bg_primary"], labelcolor=Config.COLORS["text_primary"])
        
        plt.tight_layout()
        self.embed_chart(fig)
    
    def show_correlation_matrix(self):
        """Affiche une matrice de corrélation (simulée)"""
        if not self.main_app.backtest_results:
            self.show_no_data_message()
            return
        
        self.clear_chart()
        
        fig, ax = plt.subplots(figsize=Config.CHART_CONFIG["figsize"], 
                              facecolor=Config.COLORS["bg_secondary"])
        ax.set_facecolor(Config.COLORS["bg_secondary"])
        
        # Données simulées pour la corrélation
        metrics = ['Rendement', 'Volume', 'Volatilité', 'RSI', 'MACD', 'Social Sentiment']
        
        # Matrice de corrélation simulée
        np.random.seed(42)  # Pour la reproductibilité
        correlation_matrix = np.random.rand(len(metrics), len(metrics))
        correlation_matrix = (correlation_matrix + correlation_matrix.T) / 2  # Symétrique
        np.fill_diagonal(correlation_matrix, 1)  # Diagonale = 1
        correlation_matrix = correlation_matrix * 2 - 1  # Valeurs entre -1 et 1
        
        # Heatmap
        im = ax.imshow(correlation_matrix, cmap='RdBu', vmin=-1, vmax=1)
        
        # Labels
        ax.set_xticks(range(len(metrics)))
        ax.set_yticks(range(len(metrics)))
        ax.set_xticklabels(metrics, rotation=45, ha='right', color=Config.COLORS["text_primary"])
        ax.set_yticklabels(metrics, color=Config.COLORS["text_primary"])
        
        # Annotations
        for i in range(len(metrics)):
            for j in range(len(metrics)):
                text = ax.text(j, i, f'{correlation_matrix[i, j]:.2f}',
                             ha="center", va="center", color='white', fontweight='bold')
        
        # Styling
        ax.set_title('🎪 Matrice de Corrélation des Indicateurs', 
                    color=Config.COLORS["accent_green"], fontsize=16, fontweight='bold')
        
        # Colorbar
        cbar = plt.colorbar(im, ax=ax)
        cbar.set_label('Corrélation', color=Config.COLORS["text_primary"])
        cbar.ax.tick_params(colors=Config.COLORS["text_primary"])
        
        plt.tight_layout()
        self.embed_chart(fig)
    
    def embed_chart(self, fig):
        """Intègre un graphique matplotlib dans tkinter"""
        canvas = FigureCanvasTkAgg(fig, self.chart_display_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill='both', expand=True)
        self.current_chart = canvas
    
    def show_no_data_message(self):
        """Affiche un message quand il n'y a pas de données"""
        self.clear_chart()
        
        message_label = tk.Label(
            self.chart_display_frame,
            text="📊 Aucune donnée à afficher\n\nLancez un backtest pour voir les graphiques",
            bg=Config.COLORS["bg_secondary"],
            fg=Config.COLORS["text_primary"],
            font=('Arial', 14),
            justify='center'
        )
        message_label.pack(expand=True)
    
    def update_charts(self, results):
        """Met à jour les graphiques avec les nouveaux résultats"""
        # Affiche par défaut l'évolution du capital
        self.show_capital_evolution()
    
    def reset(self):
        """Reset tous les graphiques"""
        self.clear_chart()
        self.show_no_data_message()
