# 🤖 Memecoin Trading Bot - Backend API

> **Backend haute performance pour stratégie de trading memecoin avec intégration CoinGecko et backtesting avancé**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue)](https://python.org)
[![CoinGecko](https://img.shields.io/badge/CoinGecko-API-orange)](https://coingecko.com)

## 🎯 Vue d'Ensemble

Ce backend implémente la **logique exacte** de votre bot de trading memecoin GUI (Tkinter) sous forme d'API REST moderne. Il conserve toute la sophistication de votre stratégie originale tout en ajoutant une interface web professionnelle.

### 🔥 Fonctionnalités Clés

- **🧠 Logique Identique** : Porte votre stratégie GUI vers une API scalable
- **📊 Intégration CoinGecko** : Données crypto temps réel et historiques
- **⚡ Backtesting Avancé** : Simulations multi-périodes avec métriques détaillées
- **🔄 Temps Réel** : Suivi live des backtests via polling
- **📈 Métriques Complètes** : Sharpe ratio, max drawdown, profit factor, etc.
- **💾 Configuration** : Sauvegarde/chargement des paramètres
- **🌐 API REST** : Interface moderne pour frontends (Next.js, React, etc.)

## 🏗️ Architecture

```
backend/
├── 🧠 core/                    # Logique métier
│   ├── coingecko_api.py       # Interface CoinGecko API
│   ├── memecoin_bot.py        # Votre stratégie originale (GUI)
│   └── backtest_engine.py     # Moteur de backtesting
├── 🌐 api/                     # Endpoints REST
│   ├── backtest.py            # Gestion des backtests
│   ├── data.py                # Données crypto et market
│   └── config.py              # Configurations utilisateur
├── 📊 models/                  # Schémas Pydantic
│   └── schemas.py             # Types et validation
├── 🔧 utils/                   # Utilitaires
│   └── storage.py             # Stockage in-memory
├── 💾 data/                    # Persistance locale
│   ├── configs/               # Configurations sauvées
│   └── backtests/             # Résultats historiques
└── 🚀 app.py                   # Point d'entrée FastAPI
```

## 📦 Installation

### Prérequis

- Python 3.8+
- pip ou poetry

### Installation Rapide

```bash
# Clone et navigation
git clone [your-repo]
cd backend

# Environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/macOS
# ou
venv\Scripts\activate     # Windows

# Installation des dépendances
pip install -r requirements.txt

# Création des dossiers
mkdir -p data/configs data/backtests
```

### Dépendances Principales

```txt
fastapi==0.104.1          # Framework API moderne
uvicorn[standard]==0.24.0 # Serveur ASGI
pydantic==2.4.2          # Validation données
requests==2.31.0         # CoinGecko API calls
numpy==1.25.2            # Calculs numériques
pandas==2.1.1            # Analyse de données
```

## 🚀 Démarrage

### Lancement Standard

```bash
python app.py
```

### Lancement Développement

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Vérification

- **API Base** : http://localhost:8000
- **Documentation** : http://localhost:8000/docs
- **Status** : http://localhost:8000/api/status

## 🔧 Configuration

### Variables d'Environnement

```bash
# .env (optionnel)
COINGECKO_API_KEY=your_api_key     # Pro API si disponible
RATE_LIMIT_DELAY=1.2               # Délai entre requêtes
MAX_BACKTEST_DURATION=36           # Mois maximum
LOG_LEVEL=INFO
```

### Paramètres par Défaut

```python
# Configuration type backtest
{
    "initial_capital": 10000,      # Capital de départ ($)
    "position_size": 2.0,          # Taille position (%)
    "start_year": 2023,            # Début période
    "start_month": 1,
    "end_year": 2024,              # Fin période
    "end_month": 12,
    "detection_threshold": 30,     # Seuil détection (%)
    "stop_loss": -20,              # Stop loss (%)
    "max_holding_days": 8,         # Holding max (jours)
    "tp1": 35,                     # Take profit 1 (%)
    "tp2": 80,                     # Take profit 2 (%)
    "tp3": 200,                    # Take profit 3 (%)
    "tp4": 500,                    # Take profit 4 (%)
    "tp5": 1200                    # Take profit 5 (%)
}
```

## 📡 API Reference

### 🎯 Backtesting

#### Lancer un Backtest

```http
POST /api/backtest/start
Content-Type: application/json

{
    "initial_capital": 10000,
    "position_size": 2.0,
    "start_year": 2023,
    "start_month": 1,
    "end_year": 2024,
    "end_month": 6
}
```

#### Suivre la Progression

```http
GET /api/backtest/{backtest_id}/status

Response:
{
    "id": "uuid",
    "status": "running",           # running, completed, failed
    "progress": 75.5,              # Pourcentage
    "message": "📅 Analyse mois 9/12",
    "live_metrics": {
        "capital": "$12,450",
        "return": "+24.5%",
        "trades": "89 (68.5%)",
        "moon_shots": "3"
    }
}
```

#### Récupérer les Résultats

```http
GET /api/backtest/{backtest_id}/results

Response:
{
    "summary": {
        "total_return": 45.7,
        "win_rate": 68.2,
        "total_trades": 142,
        "moon_shots": 8
    },
    "metrics": {
        "sharpe_ratio": 2.34,
        "max_drawdown": -18.5,
        "profit_factor": 3.42
    },
    "trades": [...],              # Détail tous les trades
    "monthly_data": [...],        # Performance mensuelle
    "charts_data": {...}          # Données pour graphiques
}
```

### 📊 Données Market

#### Liste Memecoins

```http
GET /api/data/memecoin-list

Response:
{
    "memecoins": [
        {"id": "dogecoin", "name": "Dogecoin", "symbol": "DOGE"},
        {"id": "shiba-inu", "name": "Shiba Inu", "symbol": "SHIB"},
        {"id": "pepe", "name": "Pepe", "symbol": "PEPE"}
    ]
}
```

#### Prix Historique

```http
GET /api/data/price/{coin_id}?days=30

Response:
{
    "coin_id": "dogecoin",
    "data": [0.08234, 0.08456, ...],  # Prix historiques
    "last_updated": "2024-01-15T10:30:00"
}
```

#### Market Overview

```http
GET /api/data/market-overview

Response:
{
    "market_data": {
        "bitcoin": {"current_price": 42500, "price_change_24h": 2.3},
        "ethereum": {"current_price": 2650, "price_change_24h": 1.8}
    },
    "total_market_cap": "2.1T"
}
```

### ⚙️ Configuration

#### Sauvegarder Config

```http
POST /api/config/save

{
    "name": "Ma Stratégie Agressive",
    "description": "Config pour memecoins volatiles",
    "config": { /* paramètres backtest */ }
}
```

#### Lister Configs

```http
GET /api/config/list

Response:
{
    "configs": [
        {
            "filename": "aggressive.json",
            "name": "Ma Stratégie Agressive",
            "created_at": "2024-01-15T10:00:00"
        }
    ]
}
```

## 🧠 Logique de Trading

### Stratégie Implémentée

Votre backend conserve **exactement** la logique de votre GUI original :

1. **🎯 Détection** : Seuil configurable pour identifier les opportunités
2. **📊 Position Sizing** : Pourcentage fixe du capital
3. **⏱️ Holding Period** : Maximum 8 jours par défaut
4. **🛡️ Risk Management** :
   - Stop loss : -20% par défaut
   - Take profits étagés : 35%, 80%, 200%, 500%, 1200%
5. **🚀 Moon Shot Detection** : Identification des gains >100%

### Métriques Calculées

- **Performance** : Rendement total, P&L, win rate
- **Risque** : Volatilité, max drawdown, Sharpe ratio
- **Trading** : Profit factor, meilleur/pire trade
- **Spéciales** : Moon shots, streak de gains/pertes

## 🔗 Intégration Frontend

### Next.js Example

```typescript
// utils/api.ts
const API_BASE = "http://localhost:8000/api";

export async function startBacktest(config: BacktestConfig) {
  const response = await fetch(`${API_BASE}/backtest/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  return response.json();
}

export async function getBacktestStatus(id: string) {
  const response = await fetch(`${API_BASE}/backtest/${id}/status`);
  return response.json();
}
```

### React Hook Example

```typescript
function useBacktest() {
  const [status, setStatus] = useState(null);

  const pollStatus = (id: string) => {
    const interval = setInterval(async () => {
      const data = await getBacktestStatus(id);
      setStatus(data);

      if (data.status === "completed") {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  return { status, pollStatus };
}
```

## 🧪 Tests et Validation

### Test Rapide API

```bash
# Status général
curl http://localhost:8000/api/status

# Test backtest court
curl -X POST http://localhost:8000/api/backtest/start \
  -H "Content-Type: application/json" \
  -d '{
    "initial_capital": 1000,
    "start_year": 2024,
    "start_month": 1,
    "end_year": 2024,
    "end_month": 3
  }'
```

### Validation Logique

Le backend reproduit **fidèlement** :

- ✅ Génération de trades réalistes
- ✅ Application des règles de sortie
- ✅ Calcul des métriques
- ✅ Gestion des moon shots
- ✅ Progression mensuelle

## 🔧 Développement

### Structure des Données

```python
# Format trade (identique GUI)
{
    "month": 1,
    "token": "PEPE",
    "return": 45.6,
    "pnl": 912.34,
    "action": "SELL",
    "date": "2024-01-15",
    "holding_days": 3
}

# Format résultat mensuel
{
    "month": 1,
    "starting_capital": 10000,
    "ending_capital": 10456,
    "return_pct": 4.56,
    "trades_count": 12,
    "winning_trades": 8,
    "moon_shots": 1
}
```

### Ajout de Nouvelles Métriques

```python
# Dans backtest_engine.py
def calculate_custom_metric(trades):
    # Votre logique
    return metric_value

# Dans calculate_final_metrics()
final_results['metrics']['custom_metric'] = calculate_custom_metric(trades)
```

## 🚨 Production

### Optimisations Recommandées

- **Database** : Remplacer storage in-memory par PostgreSQL/MongoDB
- **Cache** : Ajouter Redis pour les résultats CoinGecko
- **Queue** : Celery pour backtests longs en background
- **Monitoring** : Prometheus + Grafana
- **Auth** : JWT pour sécurisation API

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🆘 Support

### Logs

```bash
# Logs en temps réel
tail -f logs/app.log

# Debug CoinGecko
export LOG_LEVEL=DEBUG
python app.py
```

### Issues Communes

- **Rate Limiting** : CoinGecko limite à 10-50 req/min
- **Memory Usage** : Backtests longs consomment de la RAM
- **CORS** : Vérifier origin pour frontend

---

## 🎉 Conclusion

Ce backend transforme votre excellent bot GUI en API moderne tout en **préservant 100%** de votre logique de trading sophistiquée. Il est prêt pour :

- ✅ **Frontend React/Next.js** professionnel
- ✅ **Scaling** vers base de données
- ✅ **Déploiement** cloud (Docker, Kubernetes)
- ✅ **Monitoring** et alertes
- ✅ **Multi-utilisateurs** avec authentification

**🚀 Votre stratégie de trading est maintenant accessible via une API moderne !**
