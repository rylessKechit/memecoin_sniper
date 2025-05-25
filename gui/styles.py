import tkinter as tk
from tkinter import ttk
from config import Config

class StyleManager:
    """Gestionnaire des styles visuels"""
    
    def __init__(self):
        self.colors = Config.COLORS
    
    def setup_styles(self):
        """Configure tous les styles"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # Styles de labels
        style.configure('Title.TLabel', 
                       background=self.colors["bg_primary"], 
                       foreground=self.colors["accent_green"], 
                       font=('Arial', 16, 'bold'))
        
        style.configure('Subtitle.TLabel', 
                       background=self.colors["bg_primary"], 
                       foreground=self.colors["text_primary"], 
                       font=('Arial', 12))
        
        style.configure('Section.TLabel', 
                       background=self.colors["bg_secondary"], 
                       foreground=self.colors["accent_green"], 
                       font=('Arial', 11, 'bold'))
        
        style.configure('Metric.TLabel', 
                       background=self.colors["bg_tertiary"], 
                       foreground=self.colors["accent_green"], 
                       font=('Arial', 14, 'bold'),
                       relief='solid',
                       borderwidth=1)
        
        # Styles de boutons
        style.configure('Success.TButton', 
                       background=self.colors["accent_green"], 
                       foreground='#000000',
                       font=('Arial', 12, 'bold'))
        
        style.configure('Danger.TButton', 
                       background=self.colors["accent_red"], 
                       foreground='#ffffff',
                       font=('Arial', 12, 'bold'))
        
        style.configure('Primary.TButton', 
                       background=self.colors["accent_blue"], 
                       foreground='#ffffff',
                       font=('Arial', 10))
        
        # Styles de notebook
        style.configure('TNotebook', 
                       background=self.colors["bg_secondary"],
                       borderwidth=0)
        
        style.configure('TNotebook.Tab', 
                       background=self.colors["bg_tertiary"],
                       foreground=self.colors["text_primary"],
                       padding=[12, 8])