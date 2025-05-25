import tkinter as tk
from tkinter import ttk
from config import Config
import numpy as np

class MetricsTab:
    """Onglet des métriques détaillées"""
    
    def __init__(self, notebook, main_app):
        self.notebook = notebook
        self.main_app = main_app
        
        self.create_tab()
    
    def create_tab(self):
        """Crée l'onglet métriques"""
        self.frame = tk.Frame(self.notebook, bg=Config.COLORS["bg_secondary"])
        self.notebook.add(self.frame, text="📊 Métriques")
        
        # Scrollable frame
        self.create_scrollable_content()
        
        # Sections de métriques
        self.create_metrics_sections()
    
    def create_scrollable_content(self):
        """Crée le contenu scrollable"""
        canvas = tk.Canvas(self.frame, bg=Config.COLORS["bg_secondary"])
        scrollbar = ttk.Scrollbar(self.frame, orient="vertical", command=canvas.yview)
        self.scrollable_frame = tk.Frame(canvas, bg=Config.COLORS["bg_secondary"])
        
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
    
    def create_metrics_sections(self):
        """Crée les sections de métriques"""
        self.detailed_metrics = {}
        
        sections = [
            ("💰 Performance Globale", [
                "total_return", "total_pnl", "win_rate", "total_trades",
                "monthly_return", "annual_return"
            ]),
            ("📈 Analyse Risque", [
                "volatility", "max_drawdown", "sharpe_ratio", "profit_factor",
                "sortino_ratio", "calmar_ratio"
            ]),
            ("🚀 Performance Trades", [
                "best_trade", "worst_trade", "avg_gain", "avg_loss",
                "largest_win", "largest_loss"
            ]),
            ("🌙 Détection Spéciale", [
                "moon_shots", "moon_rate", "avg_holding", "success_rate",
                "detection_accuracy", "false_positives"
            ])
        ]
        
        for section_name, metrics in sections:
            self.create_metrics_section(section_name, metrics)
    
    def create_metrics_section(self, title, metrics):
        """Crée une section de métriques"""
        section_frame = tk.Frame(
            self.scrollable_frame, 
            bg=Config.COLORS["bg_tertiary"], 
            relief='solid', 
            borderwidth=1
        )
        section_frame.pack(fill='x', pady=10, padx=5)
        
        # Titre
        tk.Label(
            section_frame, 
            text=title, 
            bg=Config.COLORS["bg_tertiary"], 
            fg=Config.COLORS["accent_green"], 
            font=('Arial', 11, 'bold')
        ).pack(pady=5)
        
        # Contenu
        content_frame = tk.Frame(section_frame, bg=Config.COLORS["bg_secondary"])
        content_frame.pack(fill='both', expand=True, padx=5, pady=5)
        
        for metric in metrics:
            metric_frame = tk.Frame(content_frame, bg=Config.COLORS["bg_secondary"])
            metric_frame.pack(fill='x', pady=2)
            
            self.detailed_metrics[metric] = tk.StringVar(value="--")
            tk.Label(
                metric_frame, 
                textvariable=self.detailed_metrics[metric],
                bg=Config.COLORS["bg_secondary"], 
                fg=Config.COLORS["text_primary"], 
                font=('Arial', 11),
                anchor='w'
            ).pack(fill='x')
    
    def display_metrics(self, results):
        """Affiche les métriques calculées"""
        if not results:
            return
        
        # Calculs des métriques
        metrics = self.calculate_metrics(results)
        
        # Mise à jour de l'affichage
        self.update_metrics_display(metrics)
    
    def calculate_metrics(self, results):
        """Calcule toutes les métriques"""
        initial_capital = results.get('initial_capital', 10000)
        final_capital = results['capital'][-1] if results['capital'] else initial_capital
        
        trades = [t for t in results.get('trades', []) if t.get('action') == 'SELL']
        returns = [t['return'] for t in trades] if trades else []
        monthly_returns = results.get('returns', [])
        
        # Performance globale
        total_return = ((final_capital - initial_capital) / initial_capital) * 100
        total_pnl = final_capital - initial_capital
        
        # Analyse des trades
        winning_trades = [r for r in returns if r > 0]
        losing_trades = [r for r in returns if r <= 0]
        
        win_rate = (len(winning_trades) / len(returns) * 100) if returns else 0
        avg_gain = np.mean(winning_trades) if winning_trades else 0
        avg_loss = np.mean(losing_trades) if losing_trades else 0
        best_trade = max(returns) if returns else 0
        worst_trade = min(returns) if returns else 0
        
        # Moon shots
        moon_shots = len([r for r in returns if r >= 100])
        moon_rate = (moon_shots / len(returns) * 100) if returns else 0
        
        # Métriques de risque
        volatility = np.std(monthly_returns) if monthly_returns else 0
        
        # Max Drawdown
        max_dd = 0
        if results['capital']:
            peak = results['capital'][0]
            for cap in results['capital']:
                if cap > peak:
                    peak = cap
                else:
                    dd = (peak - cap) / peak * 100
                    max_dd = max(max_dd, dd)
        
        # Ratios
        sharpe_ratio = (np.mean(monthly_returns) / volatility) if volatility > 0 else 0
        profit_factor = (avg_gain * len(winning_trades)) / (abs(avg_loss) * len(losing_trades)) if losing_trades and avg_loss != 0 else 0
        
        # Rendements périodiques
        periods = len(monthly_returns)
        monthly_return = np.mean(monthly_returns) if monthly_returns else 0
        annual_return = ((1 + monthly_return/100) ** 12 - 1) * 100 if monthly_return != 0 else 0
        
        return {
            'total_return': total_return,
            'total_pnl': total_pnl,
            'win_rate': win_rate,
            'total_trades': len(trades),
            'monthly_return': monthly_return,
            'annual_return': annual_return,
            'volatility': volatility,
            'max_drawdown': max_dd,
            'sharpe_ratio': sharpe_ratio,
            'profit_factor': profit_factor,
            'sortino_ratio': 0,  # À implémenter
            'calmar_ratio': annual_return / max_dd if max_dd > 0 else 0,
            'best_trade': best_trade,
            'worst_trade': worst_trade,
            'avg_gain': avg_gain,
            'avg_loss': avg_loss,
            'largest_win': max([t.get('pnl', 0) for t in trades], default=0),
            'largest_loss': min([t.get('pnl', 0) for t in trades], default=0),
            'moon_shots': moon_shots,
            'moon_rate': moon_rate,
            'avg_holding': 8,  # À récupérer des paramètres
            'success_rate': win_rate,
            'detection_accuracy': 85,  # À calculer
            'false_positives': 15,  # À calculer
        }
    
    def update_metrics_display(self, metrics):
        """Met à jour l'affichage des métriques"""
        # Performance Globale
        self.detailed_metrics['total_return'].set(f"Rendement Total: {metrics['total_return']:+.2f}%")
        self.detailed_metrics['total_pnl'].set(f"P&L Total: ${metrics['total_pnl']:+,.0f}")
        self.detailed_metrics['win_rate'].set(f"Win Rate: {metrics['win_rate']:.1f}%")
        self.detailed_metrics['total_trades'].set(f"Total Trades: {metrics['total_trades']}")
        self.detailed_metrics['monthly_return'].set(f"Rendement Mensuel Moyen: {metrics['monthly_return']:+.2f}%")
        self.detailed_metrics['annual_return'].set(f"Rendement Annuel Projeté: {metrics['annual_return']:+.1f}%")
        
        # Analyse Risque
        self.detailed_metrics['volatility'].set(f"Volatilité: {metrics['volatility']:.2f}%")
        self.detailed_metrics['max_drawdown'].set(f"Max Drawdown: {metrics['max_drawdown']:.2f}%")
        self.detailed_metrics['sharpe_ratio'].set(f"Ratio Sharpe: {metrics['sharpe_ratio']:.2f}")
        self.detailed_metrics['profit_factor'].set(f"Profit Factor: {metrics['profit_factor']:.2f}")
        self.detailed_metrics['sortino_ratio'].set(f"Ratio Sortino: {metrics['sortino_ratio']:.2f}")
        self.detailed_metrics['calmar_ratio'].set(f"Ratio Calmar: {metrics['calmar_ratio']:.2f}")
        
        # Performance Trades
        self.detailed_metrics['best_trade'].set(f"Meilleur Trade: +{metrics['best_trade']:.1f}%")
        self.detailed_metrics['worst_trade'].set(f"Pire Trade: {metrics['worst_trade']:.1f}%")
        self.detailed_metrics['avg_gain'].set(f"Gain Moyen: +{metrics['avg_gain']:.1f}%")
        self.detailed_metrics['avg_loss'].set(f"Perte Moyenne: {metrics['avg_loss']:.1f}%")
        self.detailed_metrics['largest_win'].set(f"Plus Gros Gain: ${metrics['largest_win']:+,.0f}")
        self.detailed_metrics['largest_loss'].set(f"Plus Grosse Perte: ${metrics['largest_loss']:+,.0f}")
        
        # Détection Spéciale
        self.detailed_metrics['moon_shots'].set(f"Moon Shots: {metrics['moon_shots']}")
        self.detailed_metrics['moon_rate'].set(f"Taux Moon Shot: {metrics['moon_rate']:.1f}%")
        self.detailed_metrics['avg_holding'].set(f"Holding Moyen: {metrics['avg_holding']:.0f} jours")
        self.detailed_metrics['success_rate'].set(f"Taux Succès: {metrics['success_rate']:.1f}%")
        self.detailed_metrics['detection_accuracy'].set(f"Précision Détection: {metrics['detection_accuracy']:.0f}%")
        self.detailed_metrics['false_positives'].set(f"Faux Positifs: {metrics['false_positives']:.0f}%")
    
    def reset(self):
        """Reset toutes les métriques"""
        for key in self.detailed_metrics:
            self.detailed_metrics[key].set("--")