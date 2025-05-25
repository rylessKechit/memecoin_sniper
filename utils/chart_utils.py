import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np
import seaborn as sns
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from config import Config

class ChartUtils:
    """Utilitaires pour la création de graphiques"""
    
    def __init__(self):
        self.setup_style()
    
    def setup_style(self):
        """Configure le style des graphiques"""
        plt.style.use('dark_background')
        
        # Configuration globale
        plt.rcParams.update({
            'figure.facecolor': Config.COLORS["bg_secondary"],
            'axes.facecolor': Config.COLORS["bg_secondary"],
            'axes.edgecolor': Config.COLORS["text_primary"],
            'axes.labelcolor': Config.COLORS["text_primary"],
            'xtick.color': Config.COLORS["text_primary"],
            'ytick.color': Config.COLORS["text_primary"],
            'text.color': Config.COLORS["text_primary"],
            'font.size': 10,
            'axes.titlesize': 14,
            'axes.labelsize': 12,
            'xtick.labelsize': 10,
            'ytick.labelsize': 10,
            'legend.fontsize': 10,
            'grid.color': '#444444',
            'grid.alpha': 0.3
        })
    
    def create_performance_chart(self, capital_evolution: List[float], 
                               initial_capital: float) -> plt.Figure:
        """Crée un graphique de performance"""
        fig, ax = plt.subplots(figsize=Config.CHART_CONFIG["figsize"])
        
        months = list(range(len(capital_evolution)))
        
        # Ligne principale
        ax.plot(months, capital_evolution, 
               color=Config.COLORS["accent_green"], 
               linewidth=3, marker='o', markersize=4, 
               label='Capital')
        
        # Zone de remplissage
        ax.fill_between(months, capital_evolution, initial_capital,
                       alpha=0.3, color=Config.COLORS["accent_green"])
        
        # Ligne de référence
        ax.axhline(y=initial_capital, 
                  color=Config.COLORS["accent_red"], 
                  linestyle='--', alpha=0.7, 
                  label='Capital Initial')
        
        # Annotations
        if len(capital_evolution) > 1:
            final_return = ((capital_evolution[-1] - initial_capital) / initial_capital) * 100
            ax.annotate(f'Rendement: {final_return:+.1f}%',
                       xy=(len(months)-1, capital_evolution[-1]),
                       xytext=(len(months)*0.7, capital_evolution[-1]*1.1),
                       arrowprops=dict(arrowstyle='->', 
                                     color=Config.COLORS["accent_green"]),
                       color=Config.COLORS["accent_green"], 
                       fontweight='bold')
        
        # Styling
        ax.set_title('📈 Évolution du Capital', 
                    color=Config.COLORS["accent_green"], 
                    fontweight='bold')
        ax.set_xlabel('Mois')
        ax.set_ylabel('Capital ($)')
        ax.grid(True)
        ax.legend()
        
        plt.tight_layout()
        return fig
    
    def create_returns_heatmap(self, monthly_returns: List[float]) -> plt.Figure:
        """Crée une heatmap des rendements mensuels"""
        fig, ax = plt.subplots(figsize=(12, 8))
        
        # Organisé les données en grille (3 années x 12 mois)
        years = 3
        months_per_year = 12
        
        # Pad les données si nécessaire
        padded_returns = monthly_returns + [0] * (years * months_per_year - len(monthly_returns))
        data_matrix = np.array(padded_returns[:years * months_per_year]).reshape(years, months_per_year)
        
        # Création de la heatmap
        im = ax.imshow(data_matrix, cmap='RdYlGn', aspect='auto', vmin=-20, vmax=20)
        
        # Labels des axes
        months_labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                        'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
        years_labels = ['2024', '2023', '2022']
        
        ax.set_xticks(range(months_per_year))
        ax.set_yticks(range(years))
        ax.set_xticklabels(months_labels)
        ax.set_yticklabels(years_labels)
        
        # Annotations avec les valeurs
        for i in range(years):
            for j in range(months_per_year):
                if i * months_per_year + j < len(monthly_returns):
                    value = monthly_returns[i * months_per_year + j]
                    text = ax.text(j, i, f'{value:.1f}%',
                                 ha="center", va="center", 
                                 color='black', fontweight='bold')
        
        # Colorbar
        cbar = plt.colorbar(im, ax=ax)
        cbar.set_label('Rendement Monthly (%)')
        
        ax.set_title('🔥 Heatmap Performance Mensuelle', 
                    color=Config.COLORS["accent_green"], 
                    fontweight='bold')
        
        plt.tight_layout()
        return fig
    
    def create_trade_distribution(self, trade_returns: List[float]) -> plt.Figure:
        """Crée un graphique de distribution des trades"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        
        # Histogramme
        n, bins, patches = ax1.hist(trade_returns, bins=20, alpha=0.8, edgecolor='white')
        
        # Coloration des barres
        for i, patch in enumerate(patches):
            if bins[i] < 0:
                patch.set_facecolor(Config.COLORS["accent_red"])
            elif bins[i] > 100:
                patch.set_facecolor(Config.COLORS["accent_gold"])
            else:
                patch.set_facecolor(Config.COLORS["accent_green"])
        
        ax1.set_title('📊 Distribution des Rendements')
        ax1.set_xlabel('Rendement (%)')
        ax1.set_ylabel('Nombre de Trades')
        ax1.grid(True)
        ax1.axvline(x=0, color='white', linestyle='--', alpha=0.8)
        ax1.axvline(x=100, color=Config.COLORS["accent_gold"], 
                   linestyle='--', alpha=0.8, label='Moon Shot')
        ax1.legend()
        
        # Pie chart
        winners = len([r for r in trade_returns if r > 0])
        losers = len([r for r in trade_returns if r <= 0])
        moon_shots = len([r for r in trade_returns if r >= 100])
        
        # Ajustement pour éviter double comptage
        regular_winners = winners - moon_shots
        
        sizes = []
        labels = []
        colors = []
        
        if regular_winners > 0:
            sizes.append(regular_winners)
            labels.append(f'Gagnants\n({regular_winners})')
            colors.append(Config.COLORS["accent_green"])
        
        if losers > 0:
            sizes.append(losers)
            labels.append(f'Perdants\n({losers})')
            colors.append(Config.COLORS["accent_red"])
        
        if moon_shots > 0:
            sizes.append(moon_shots)
            labels.append(f'Moon Shots\n({moon_shots})')
            colors.append(Config.COLORS["accent_gold"])
        
        if sizes:
            wedges, texts, autotexts = ax2.pie(sizes, labels=labels, colors=colors, 
                                              autopct='%1.1f%%', startangle=90)
            
            # Amélioration du texte
            for autotext in autotexts:
                autotext.set_color('white')
                autotext.set_fontweight('bold')
        
        ax2.set_title('🎯 Répartition des Trades')
        
        plt.tight_layout()
        return fig
    
    def create_drawdown_chart(self, capital_evolution: List[float]) -> plt.Figure:
        """Crée un graphique de drawdown"""
        fig, ax = plt.subplots(figsize=Config.CHART_CONFIG["figsize"])
        
        # Calcul du drawdown
        peak = capital_evolution[0]
        drawdowns = []
        
        for capital in capital_evolution:
            if capital > peak:
                peak = capital
            drawdown = (peak - capital) / peak * 100
            drawdowns.append(-drawdown)  # Négatif pour l'affichage
        
        months = list(range(len(drawdowns)))
        
        # Graphique
        ax.fill_between(months, drawdowns, 0, 
                       alpha=0.6, color=Config.COLORS["accent_red"])
        ax.plot(months, drawdowns, 
               color=Config.COLORS["accent_red"], linewidth=2)
        
        # Max drawdown
        max_dd = min(drawdowns)
        max_dd_idx = drawdowns.index(max_dd)
        ax.plot(max_dd_idx, max_dd, 'o', 
               color='white', markersize=8, 
               markeredgecolor=Config.COLORS["accent_red"], 
               markeredgewidth=2)
        
        ax.annotate(f'Max DD: {abs(max_dd):.1f}%',
                   xy=(max_dd_idx, max_dd),
                   xytext=(max_dd_idx + len(months)*0.1, max_dd*0.5),
                   arrowprops=dict(arrowstyle='->', 
                                 color=Config.COLORS["accent_red"]),
                   color=Config.COLORS["accent_red"], 
                   fontweight='bold')
        
        ax.axhline(y=0, color='white', linestyle='-', alpha=0.8)
        
        ax.set_title('📉 Analyse du Drawdown', 
                    color=Config.COLORS["accent_green"], 
                    fontweight='bold')
        ax.set_xlabel('Mois')
        ax.set_ylabel('Drawdown (%)')
        ax.grid(True)
        
        plt.tight_layout()
        return fig
    
    def create_correlation_matrix(self, data: Dict[str, List[float]]) -> plt.Figure:
        """Crée une matrice de corrélation"""
        fig, ax = plt.subplots(figsize=Config.CHART_CONFIG["figsize"])
        
        # Pour la démo, utilise des données simulées
        metrics = ['Rendement', 'Volume', 'Volatilité', 'RSI', 'MACD', 'Sentiment']
        
        # Matrice de corrélation simulée
        np.random.seed(42)
        correlation_matrix = np.random.rand(len(metrics), len(metrics))
        correlation_matrix = (correlation_matrix + correlation_matrix.T) / 2
        np.fill_diagonal(correlation_matrix, 1)
        correlation_matrix = correlation_matrix * 2 - 1  # [-1, 1]
        
        # Heatmap
        im = ax.imshow(correlation_matrix, cmap='RdBu', vmin=-1, vmax=1)
        
        # Labels
        ax.set_xticks(range(len(metrics)))
        ax.set_yticks(range(len(metrics)))
        ax.set_xticklabels(metrics, rotation=45, ha='right')
        ax.set_yticklabels(metrics)
        
        # Annotations
        for i in range(len(metrics)):
            for j in range(len(metrics)):
                text = ax.text(j, i, f'{correlation_matrix[i, j]:.2f}',
                             ha="center", va="center", 
                             color='white', fontweight='bold')
        
        # Colorbar
        cbar = plt.colorbar(im, ax=ax)
        cbar.set_label('Corrélation')
        
        ax.set_title('🎪 Matrice de Corrélation des Indicateurs',
                    color=Config.COLORS["accent_green"], 
                    fontweight='bold')
        
        plt.tight_layout()
        return fig
    
    def add_watermark(self, fig: plt.Figure, text: str = "Memecoin Trading Bot"):
        """Ajoute un watermark au graphique"""
        fig.text(0.99, 0.01, text, 
                fontsize=8, color='gray', alpha=0.5,
                ha='right', va='bottom',
                transform=fig.transFigure)
    
    def save_chart(self, fig: plt.Figure, filename: str, directory: str = "exports"):
        """Sauvegarde un graphique"""
        if not os.path.exists(directory):
            os.makedirs(directory)
        
        filepath = os.path.join(directory, filename)
        
        # Ajout du watermark
        self.add_watermark(fig)
        
        # Sauvegarde
        fig.savefig(filepath, dpi=300, bbox_inches='tight', 
                   facecolor=Config.COLORS["bg_secondary"])
        
        return filepath
