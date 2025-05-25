from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class ValidationResult:
    """Résultat de validation"""
    is_valid: bool
    error_message: Optional[str] = None
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []

class ParameterValidator:
    """Validateur de paramètres du trading bot"""
    
    def __init__(self):
        self.min_capital = 1000
        self.max_capital = 10000000
        self.min_position_size = 0.1
        self.max_position_size = 50.0
        self.min_stop_loss = -90
        self.max_stop_loss = -1
        self.min_take_profit = 1
        self.max_take_profit = 5000
    
    def validate_parameters(self, params: dict) -> ValidationResult:
        """Valide tous les paramètres"""
        errors = []
        warnings = []
        
        # Validation du capital
        capital_result = self.validate_capital(params.get('initial_capital'))
        if not capital_result.is_valid:
            errors.append(capital_result.error_message)
        warnings.extend(capital_result.warnings)
        
        # Validation de la taille de position
        position_result = self.validate_position_size(params.get('position_size'))
        if not position_result.is_valid:
            errors.append(position_result.error_message)
        warnings.extend(position_result.warnings)
        
        # Validation des dates
        date_result = self.validate_dates(
            params.get('start_year'), params.get('start_month'),
            params.get('end_year'), params.get('end_month')
        )
        if not date_result.is_valid:
            errors.append(date_result.error_message)
        warnings.extend(date_result.warnings)
        
        # Validation du stop loss
        stop_loss_result = self.validate_stop_loss(params.get('stop_loss'))
        if not stop_loss_result.is_valid:
            errors.append(stop_loss_result.error_message)
        warnings.extend(stop_loss_result.warnings)
        
        # Validation des take profits
        tp_result = self.validate_take_profits(params)
        if not tp_result.is_valid:
            errors.append(tp_result.error_message)
        warnings.extend(tp_result.warnings)
        
        # Validation des paramètres de détection
        detection_result = self.validate_detection_params(params)
        if not detection_result.is_valid:
            errors.append(detection_result.error_message)
        warnings.extend(detection_result.warnings)
        
        # Résultat final
        if errors:
            return ValidationResult(
                is_valid=False,
                error_message="\n".join(errors),
                warnings=warnings
            )
        
        return ValidationResult(is_valid=True, warnings=warnings)
    
    def validate_capital(self, capital) -> ValidationResult:
        """Valide le capital initial"""
        try:
            capital = float(capital)
        except (ValueError, TypeError):
            return ValidationResult(False, "Capital initial invalide")
        
        if capital < self.min_capital:
            return ValidationResult(False, f"Capital trop faible (minimum: ${self.min_capital:,})")
        
        if capital > self.max_capital:
            return ValidationResult(False, f"Capital trop élevé (maximum: ${self.max_capital:,})")
        
        warnings = []
        if capital < 5000:
            warnings.append("Capital faible: résultats peuvent être moins représentatifs")
        
        return ValidationResult(True, warnings=warnings)
    
    def validate_position_size(self, position_size) -> ValidationResult:
        """Valide la taille de position"""
        try:
            position_size = float(position_size)
        except (ValueError, TypeError):
            return ValidationResult(False, "Taille de position invalide")
        
        if position_size < self.min_position_size:
            return ValidationResult(False, f"Position trop petite (minimum: {self.min_position_size}%)")
        
        if position_size > self.max_position_size:
            return ValidationResult(False, f"Position trop importante (maximum: {self.max_position_size}%)")
        
        warnings = []
        if position_size > 10:
            warnings.append("Position importante: risque élevé")
        elif position_size < 1:
            warnings.append("Position petite: gains potentiels limités")
        
        return ValidationResult(True, warnings=warnings)
    
    def validate_dates(self, start_year, start_month, end_year, end_month) -> ValidationResult:
        """Valide les dates de backtest"""
        try:
            start_year = int(start_year)
            start_month = int(start_month)
            end_year = int(end_year)
            end_month = int(end_month)
        except (ValueError, TypeError):
            return ValidationResult(False, "Dates invalides")
        
        # Validation des limites
        if not (2020 <= start_year <= 2030):
            return ValidationResult(False, "Année de début hors limites (2020-2030)")
        
        if not (2020 <= end_year <= 2030):
            return ValidationResult(False, "Année de fin hors limites (2020-2030)")
        
        if not (1 <= start_month <= 12):
            return ValidationResult(False, "Mois de début invalide (1-12)")
        
        if not (1 <= end_month <= 12):
            return ValidationResult(False, "Mois de fin invalide (1-12)")
        
        # Validation de la logique
        start_date = datetime(start_year, start_month, 1)
        end_date = datetime(end_year, end_month, 1)
        
        if start_date >= end_date:
            return ValidationResult(False, "La date de fin doit être après la date de début")
        
        # Calcul de la durée
        months_diff = (end_year - start_year) * 12 + (end_month - start_month) + 1
        
        warnings = []
        if months_diff < 6:
            warnings.append("Période courte: résultats peuvent être moins fiables")
        elif months_diff > 36:
            warnings.append("Période longue: temps d'exécution important")
        
        return ValidationResult(True, warnings=warnings)
    
    def validate_stop_loss(self, stop_loss) -> ValidationResult:
        """Valide le stop loss"""
        try:
            stop_loss = float(stop_loss)
        except (ValueError, TypeError):
            return ValidationResult(False, "Stop loss invalide")
        
        if stop_loss > 0:
            return ValidationResult(False, "Stop loss doit être négatif")
        
        if stop_loss < self.min_stop_loss:
            return ValidationResult(False, f"Stop loss trop bas (minimum: {self.min_stop_loss}%)")
        
        if stop_loss > self.max_stop_loss:
            return ValidationResult(False, f"Stop loss trop haut (maximum: {self.max_stop_loss}%)")
        
        warnings = []
        if stop_loss < -50:
            warnings.append("Stop loss très large: risque de grosses pertes")
        elif stop_loss > -5:
            warnings.append("Stop loss très serré: risque de sorties prématurées")
        
        return ValidationResult(True, warnings=warnings)
    
    def validate_take_profits(self, params) -> ValidationResult:
        """Valide les niveaux de take profit"""
        take_profits = []
        
        for i in range(1, 6):
            tp_key = f'tp{i}'
            try:
                tp_value = float(params.get(tp_key, 0))
                take_profits.append(tp_value)
            except (ValueError, TypeError):
                return ValidationResult(False, f"Take profit {i} invalide")
        
        # Validation des valeurs
        for i, tp in enumerate(take_profits, 1):
            if tp < self.min_take_profit:
                return ValidationResult(False, f"Take profit {i} trop bas (minimum: {self.min_take_profit}%)")
            
            if tp > self.max_take_profit:
                return ValidationResult(False, f"Take profit {i} trop haut (maximum: {self.max_take_profit}%)")
        
        # Validation de l'ordre croissant
        for i in range(1, len(take_profits)):
            if take_profits[i] <= take_profits[i-1]:
                return ValidationResult(False, f"Take profit {i+1} doit être supérieur à TP{i}")
        
        warnings = []
        if take_profits[0] < 10:
            warnings.append("Premier take profit très bas: peu de gains garantis")
        
        if take_profits[-1] > 2000:
            warnings.append("Dernier take profit très haut: peu probable d'être atteint")
        
        return ValidationResult(True, warnings=warnings)
    
    def validate_detection_params(self, params) -> ValidationResult:
        """Valide les paramètres de détection"""
        try:
            threshold = float(params.get('detection_threshold', 30))
            max_holding = int(params.get('max_holding_days', 8))
        except (ValueError, TypeError):
            return ValidationResult(False, "Paramètres de détection invalides")
        
        if not (10 <= threshold <= 100):
            return ValidationResult(False, "Seuil de détection doit être entre 10 et 100")
        
        if not (1 <= max_holding <= 30):
            return ValidationResult(False, "Holding maximum doit être entre 1 et 30 jours")
        
        warnings = []
        if threshold < 20:
            warnings.append("Seuil bas: beaucoup de faux signaux possibles")
        elif threshold > 50:
            warnings.append("Seuil élevé: opportunités potentiellement manquées")
        
        if max_holding < 5:
            warnings.append("Holding court: sorties potentiellement prématurées")
        elif max_holding > 15:
            warnings.append("Holding long: capital immobilisé longtemps")
        
        return ValidationResult(True, warnings=warnings)
