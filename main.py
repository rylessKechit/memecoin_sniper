# main.py - Point d'entrée principal
import sys
import os
from gui.main_window import MemecoinTradingGUI
import tkinter as tk
from tkinter import messagebox

def main():
    """Lance l'application GUI du trading bot"""
    try:
        # Configuration matplotlib pour le dark theme
        import matplotlib.pyplot as plt
        plt.style.use('dark_background')
        
        # Création de la fenêtre principale
        root = tk.Tk()
        app = MemecoinTradingGUI(root)
        
        # Configuration de l'icône si disponible
        try:
            root.iconbitmap('assets/icon.ico')
        except:
            pass
        
        # Centrage de la fenêtre
        root.update_idletasks()
        x = (root.winfo_screenwidth() - root.winfo_width()) // 2
        y = (root.winfo_screenheight() - root.winfo_height()) // 2
        root.geometry(f"+{x}+{y}")
        
        # Message de bienvenue
        messagebox.showinfo("🤖 Memecoin Trading Bot", 
                           "Interface graphique chargée!\n\n"
                           "✅ Configurez vos paramètres\n"
                           "✅ Sélectionnez la période\n"
                           "✅ Lancez le backtest\n"
                           "✅ Analysez les résultats\n\n"
                           "🚀 Bon trading!")
        
        # Lancement de l'application
        root.mainloop()
        
    except Exception as e:
        messagebox.showerror("Erreur", f"Erreur lors du lancement: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()