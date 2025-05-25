import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import json
from config import Config

class ParameterPanel:
    """Panel de configuration des paramètres"""
    
    def __init__(self, parent, main_app):
        self.parent = parent
        self.main_app = main_app
        self.vars = {}
        
        self.create_panel()
        self.initialize_default_values()
    
    def create_panel(self):
        """Crée le panel des paramètres"""
        self.frame = tk.Frame(
            self.parent, 
            bg=Config.COLORS["bg_secondary"], 
            relief='solid', 
            borderwidth=2,
            width=350
        )
        self.frame.pack(side='left', fill='y', padx=(0, 10), pady=5)
        self.frame.pack_propagate(False)
        
        # Titre
        ttk.Label(self.frame, text="⚙️ Configuration Bot", style='Title.TLabel').pack(pady=10)
        
        # Scrollable content
        self.create_scrollable_content()
        
        # Sections de paramètres
        self.create_capital_section()
        self.create_period_section()
        self.create_trading_section()
        self.create_takeprofit_section()
        
        # Boutons de contrôle
        self.create_control_buttons()
        self.create_utility_buttons()
    
    def create_scrollable_content(self):
        """Crée le contenu scrollable"""
        self.canvas = tk.Canvas(self.frame, bg=Config.COLORS["bg_secondary"], highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(self.frame, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = tk.Frame(self.canvas, bg=Config.COLORS["bg_secondary"])
        
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )
        
        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        
        self.canvas.pack(side="left", fill="both", expand=True, padx=10)
        self.scrollbar.pack(side="right", fill="y")
    
    def create_section_frame(self, title):
        """Crée un frame de section avec titre"""
        section_frame = tk.Frame(
            self.scrollable_frame, 
            bg=Config.COLORS["bg_tertiary"], 
            relief='solid', 
            borderwidth=1
        )
        section_frame.pack(fill='x', pady=10, padx=5)
        
        # Titre de section
        ttk.Label(section_frame, text=title, style='Section.TLabel').pack(pady=5)
        
        # Frame de contenu
        content_frame = tk.Frame(section_frame, bg=Config.COLORS["bg_secondary"])
        content_frame.pack(fill='both', expand=True, padx=5, pady=5)
        
        return content_frame
    
    def create_capital_section(self):
        """Section Capital et Position"""
        frame = self.create_section_frame("💰 Capital et Position")
        
        self.add_parameter(frame, "Capital Initial ($)", "initial_capital", 10000, 1000, 1000000)
        self.add_parameter(frame, "Taille Position (%)", "position_size", 2.0, 0.5, 10.0)
    
    def create_period_section(self):
        """Section Période"""
        frame = self.create_section_frame("📅 Période Backtest")
        
        # Date début
        start_frame = tk.Frame(frame, bg=Config.COLORS["bg_secondary"])
        start_frame.pack(fill='x', pady=5)
        
        tk.Label(start_frame, text="📅 Début:", 
                bg=Config.COLORS["bg_secondary"], 
                fg=Config.COLORS["accent_green"], 
                font=('Arial', 10, 'bold')).pack(anchor='w')
        
        date_frame = tk.Frame(start_frame, bg=Config.COLORS["bg_secondary"])
        date_frame.pack(fill='x')
        
        self.vars['start_year'] = tk.StringVar(value="2023")
        self.vars['start_month'] = tk.StringVar(value="1")
        
        ttk.Combobox(date_frame, textvariable=self.vars['start_year'], 
                    values=[str(y) for y in range(2020, 2026)], width=8).pack(side='left', padx=(0,5))
        ttk.Combobox(date_frame, textvariable=self.vars['start_month'], 
                    values=[str(m) for m in range(1, 13)], width=8).pack(side='left')
        
        # Date fin
        end_frame = tk.Frame(frame, bg=Config.COLORS["bg_secondary"])
        end_frame.pack(fill='x', pady=5)
        
        tk.Label(end_frame, text="📅 Fin:", 
                bg=Config.COLORS["bg_secondary"], 
                fg=Config.COLORS["accent_green"], 
                font=('Arial', 10, 'bold')).pack(anchor='w')
        
        date_frame2 = tk.Frame(end_frame, bg=Config.COLORS["bg_secondary"])
        date_frame2.pack(fill='x')
        
        self.vars['end_year'] = tk.StringVar(value="2024")
        self.vars['end_month'] = tk.StringVar(value="12")
        
        ttk.Combobox(date_frame2, textvariable=self.vars['end_year'], 
                    values=[str(y) for y in range(2020, 2026)], width=8).pack(side='left', padx=(0,5))
        ttk.Combobox(date_frame2, textvariable=self.vars['end_month'], 
                    values=[str(m) for m in range(1, 13)], width=8).pack(side='left')
    
    def create_trading_section(self):
        """Section Paramètres Trading"""
        frame = self.create_section_frame("🎯 Paramètres Trading")
        
        self.add_parameter(frame, "Seuil Détection", "detection_threshold", 30, 10, 90)
        self.add_parameter(frame, "Stop Loss (%)", "stop_loss", -20, -50, -5)
        self.add_parameter(frame, "Holding Max (jours)", "max_holding_days", 8, 1, 30)
    
    def create_takeprofit_section(self):
        """Section Take Profits"""
        frame = self.create_section_frame("🚀 Take Profits")
        
        self.add_parameter(frame, "Take Profit 1 (%)", "tp1", 35, 10, 100)
        self.add_parameter(frame, "Take Profit 2 (%)", "tp2", 80, 50, 200)
        self.add_parameter(frame, "Take Profit 3 (%)", "tp3", 200, 100, 500)
        self.add_parameter(frame, "Take Profit 4 (%)", "tp4", 500, 300, 1000)
        self.add_parameter(frame, "Take Profit 5 (%)", "tp5", 1200, 800, 2000)
    
    def add_parameter(self, parent, name, var_name, default, min_val, max_val):
        """Ajoute un paramètre avec slider"""
        param_frame = tk.Frame(parent, bg=Config.COLORS["bg_secondary"])
        param_frame.pack(fill='x', pady=3)
        
        # Label
        tk.Label(param_frame, text=name, 
                bg=Config.COLORS["bg_secondary"], 
                fg=Config.COLORS["text_primary"], 
                font=('Arial', 9)).pack(anchor='w')
        
        # Variable
        self.vars[var_name] = tk.DoubleVar(value=default)
        
        # Frame pour scale et valeur
        scale_frame = tk.Frame(param_frame, bg=Config.COLORS["bg_secondary"])
        scale_frame.pack(fill='x')
        
        # Scale
        scale = tk.Scale(scale_frame, from_=min_val, to=max_val, 
                       orient='horizontal', variable=self.vars[var_name],
                       bg=Config.COLORS["bg_secondary"], 
                       fg=Config.COLORS["accent_green"], 
                       highlightbackground=Config.COLORS["bg_secondary"],
                       resolution=0.1 if isinstance(default, float) else 1)
        scale.pack(side='left', fill='x', expand=True)
        
        # Entry pour valeur précise
        entry = tk.Entry(scale_frame, textvariable=self.vars[var_name], 
                       width=8, 
                       bg=Config.COLORS["bg_primary"], 
                       fg=Config.COLORS["text_primary"])
        entry.pack(side='right', padx=(5,0))
    
    def create_control_buttons(self):
        """Crée les boutons de contrôle"""
        control_frame = tk.Frame(self.scrollable_frame, bg=Config.COLORS["bg_secondary"])
        control_frame.pack(fill='x', pady=20)
        
        self.start_button = tk.Button(
            control_frame, 
            text="🚀 Lancer Backtest", 
            command=self.main_app.start_backtest,
            bg=Config.COLORS["accent_green"], 
            fg='#000000', 
            font=('Arial', 12, 'bold'),
            height=2
        )
        self.start_button.pack(fill='x', pady=5)
        
        self.stop_button = tk.Button(
            control_frame, 
            text="⏹️ Arrêter", 
            command=self.main_app.stop_backtest,
            bg=Config.COLORS["accent_red"], 
            fg='#ffffff', 
            font=('Arial', 12, 'bold'),
            height=2, 
            state='disabled'
        )
        self.stop_button.pack(fill='x', pady=5)
    
    def create_utility_buttons(self):
        """Crée les boutons utilitaires"""
        util_frame = tk.Frame(self.scrollable_frame, bg=Config.COLORS["bg_secondary"])
        util_frame.pack(fill='x', pady=10)
        
        buttons = [
            ("💾 Sauvegarder Config", self.save_config, Config.COLORS["accent_blue"]),
            ("📁 Charger Config", self.load_config, Config.COLORS["accent_blue"]),
            ("📊 Export CSV", self.export_csv, Config.COLORS["accent_orange"]),
            ("🗑️ Reset", self.reset_all, "#666666"),
        ]
        
        for text, command, color in buttons:
            tk.Button(util_frame, text=text, command=command,
                     bg=color, fg='#ffffff', font=('Arial', 10)).pack(fill='x', pady=2)
    
    def initialize_default_values(self):
        """Initialise les valeurs par défaut"""
        for key, value in Config.DEFAULT_CONFIG.items():
            if key in self.vars:
                self.vars[key].set(value)
    
    def get_parameters(self):
        """Récupère tous les paramètres"""
        params = {}
        for key, var in self.vars.items():
            try:
                params[key] = var.get()
            except:
                params[key] = str(var.get())
        return params
    
    def set_running_state(self, is_running):
        """Configure l'état des boutons selon le statut du backtest"""
        if is_running:
            self.start_button.config(state='disabled')
            self.stop_button.config(state='normal')
        else:
            self.start_button.config(state='normal')
            self.stop_button.config(state='disabled')
    
    def save_config(self):
        """Sauvegarde la configuration"""
        config = self.get_parameters()
        
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
        if not self.main_app.backtest_results:
            messagebox.showwarning("Attention", "Aucun résultat à exporter!")
            return
        
        filename = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv"), ("All files", "*.*")],
            title="Exporter les trades"
        )
        
        if filename:
            try:
                import pandas as pd
                df = pd.DataFrame(self.main_app.backtest_results['trades'])
                df.to_csv(filename, index=False)
                messagebox.showinfo("Succès", f"Données exportées vers {filename}")
            except Exception as e:
                messagebox.showerror("Erreur", f"Erreur lors de l'export: {e}")
    
    def reset_all(self):
        """Reset tous les paramètres"""
        self.initialize_default_values()
        if hasattr(self.main_app, 'results_panel'):
            self.main_app.results_panel.reset_all()
        messagebox.showinfo("Reset", "Configuration réinitialisée!")

print("Structure de base créée! Continuez avec les autres modules...")