# 🤖 Memecoin Trading Bot - Interface Web

Interface web moderne pour votre bot de trading memecoin avec backtesting en temps réel, analyse avancée et visualisation des données.

## 🏗️ Structure du Projet

```
memecoin-trading-system/
├── backend/                    # 🐍 API FastAPI
│   ├── app.py                 # Serveur principal
│   ├── models/
│   │   └── schemas.py         # Modèles Pydantic
│   ├── api/
│   │   ├── backtest.py        # Routes backtest
│   │   ├── config.py          # Routes configuration
│   │   └── data.py            # Routes données
│   ├── core/
│   │   ├── memecoin_bot.py    # VOTRE BOT ORIGINAL
│   │   └── backtest_engine.py # Moteur backtest
│   ├── utils/
│   │   └── storage.py         # Stockage global
│   └── data/                  # Données persistantes
│       ├── configs/           # Configurations sauvées
│       └── backtests/         # Résultats backtests
├── frontend/                  # ⚡ Interface Next.js
│   ├── app/
│   │   ├── layout.js          # Layout principal
│   │   ├── page.js            # Dashboard
│   │   ├── globals.css        # Styles globaux
│   │   ├── config/            # Page configuration
│   │   ├── backtest/          # Page backtest
│   │   └── analysis/          # Page analyse
│   ├── components/            # Composants React
│   ├── lib/                   # Utilitaires
│   └── public/                # Assets statiques
└── shared/                    # Données partagées
```

## 🚀 Installation Rapide

### 1. Prérequis

- Python 3.8+
- Node.js 18+
- npm ou yarn

### 2. Installation Backend (FastAPI)

```bash
# Créer le dossier principal
mkdir memecoin-trading-system
cd memecoin-trading-system

# Créer l'environnement virtuel Python
python -m venv backend_env
source backend_env/bin/activate  # Linux/Mac
# backend_env\Scripts\activate   # Windows

# Installer les dépendances Python
pip install fastapi uvicorn python-multipart numpy pandas requests

# Créer la structure backend
mkdir -p backend/{api,models,core,utils,data/{configs,backtests}}
```

### 3. Copier les Fichiers Backend

Copiez le contenu des artifacts dans les fichiers correspondants :

#### `backend/app.py`

```python
# Coller le contenu de l'artifact "backend/app.py - FastAPI Server Principal"
```

#### `backend/models/schemas.py`

```python
# Coller le contenu de l'artifact "models/schemas.py - Modèles Pydantic"
```

#### `backend/api/backtest.py`

```python
# Coller le contenu de l'artifact "api/backtest.py - Routes Backtest"
```

#### `backend/api/config.py`

```python
# Coller le contenu de l'artifact "api/config.py - Routes Configuration"
```

#### `backend/api/data.py`

```python
# Coller le contenu de l'artifact "api/data.py - Routes Données"
```

#### `backend/core/backtest_engine.py`

```python
# Coller le contenu de l'artifact "core/backtest_engine.py - Moteur de Backtest"
```

#### `backend/utils/storage.py`

```python
# Coller le contenu de l'artifact "utils/storage.py - Stockage Global"
```

#### `backend/core/memecoin_bot.py`

```python
# Coller VOTRE code original du bot ici
# Les classes CoinGeckoAPI, SmartMemecoinBacktester, etc.
```

### 4. Installation Frontend (Next.js)

```bash
# Créer le projet Next.js
mkdir frontend
cd frontend

# Initialiser le projet
npm init -y

# Installer Next.js et dépendances
npm install next@14.0.0 react@^18.2.0 react-dom@^18.2.0
npm install tailwindcss@^3.3.6 autoprefixer@^10.4.16 postcss@^8.4.31
npm install recharts@^2.8.0 axios@^1.6.0 lucide-react@^0.294.0
npm install framer-motion@^10.16.5 @headlessui/react@^1.7.17
npm install react-hot-toast@^2.4.1 date-fns@^2.30.0

# Installer les dépendances de développement
npm install --save-dev eslint@^8.54.0 eslint-config-next@14.0.0
```

### 5. Configuration Frontend

#### `frontend/package.json`

```json
# Remplacer le contenu par l'artifact "package.json"
```

#### `frontend/tailwind.config.js`

```javascript
# Créer et coller le contenu de l'artifact "Configuration Next.js"
```

#### `frontend/next.config.js`

```javascript
# Partie next.config.js de l'artifact "Configuration Next.js"
```

#### `frontend/postcss.config.js`

```javascript
# Partie postcss.config.js de l'artifact "Configuration Next.js"
```

### 6. Créer la Structure Frontend

```bash
# Créer les dossiers
mkdir -p app/{config,backtest,analysis}
mkdir -p components/{Dashboard,Charts,Config,Layout}
mkdir -p lib
mkdir -p public

# Créer les fichiers principaux
touch app/layout.js
touch app/page.js
touch app/globals.css
```

#### `frontend/app/layout.js`

```javascript
# Coller le contenu de l'artifact "app/layout.js - Layout Principal Next.js"
```

#### `frontend/app/globals.css`

```css
# Coller le contenu de l'artifact "app/globals.css - Styles Globaux"
```

#### `frontend/app/page.js`

```javascript
# Extraire la partie Dashboard de l'interface HTML complète
```

## 🎯 Lancement de l'Application

### 1. Démarrer le Backend

```bash
cd backend
source backend_env/bin/activate  # Activer l'environnement virtuel

# Lancer le serveur FastAPI
python app.py
```

Le backend sera accessible sur : `http://localhost:8000`
Documentation API : `http://localhost:8000/docs`

### 2. Démarrer le Frontend

```bash
cd frontend

# Lancer le serveur de développement
npm run dev
```

Le frontend sera accessible sur : `http://localhost:3000`

## 📊 Fonctionnalités

### 🎛️ Dashboard Principal

- Vue d'ensemble des performances
- Métriques en temps réel
- Actions rapides
- Status des backtests actifs

### ⚙️ Configuration

- Paramètres de trading personnalisables
- Sauvegarde/chargement de configurations
- Validation des paramètres
- Gestion des presets

### 🎯 Backtest

- Lancement de backtests en temps réel
- Suivi du progrès avec métriques live
- Visualisation des résultats
- Historique des trades

### 📈 Analyse Avancée

- Métriques de performance détaillées
- Analyse de risque
- Comparaison de stratégies
- Optimisation des paramètres

## 🔧 API Endpoints

### Backtest

- `POST /api/backtest/start` - Démarrer un backtest
- `GET /api/backtest/{id}/status` - Status en temps réel
- `GET /api/backtest/{id}/results` - Résultats complets
- `DELETE /api/backtest/{id}` - Arrêter un backtest

### Configuration

- `GET /api/configs` - Lister les configurations
- `POST /api/configs/{name}` - Sauvegarder une configuration
- `GET /api/configs/{name}` - Charger une configuration
- `DELETE /api/configs/{name}` - Supprimer une configuration

### Données

- `GET /api/data/memecoin-list` - Liste des memecoins
- `GET /api/data/price/{coin_id}` - Données de prix
- `GET /api/data/market-overview` - Aperçu du marché
- `GET /api/data/trending` - Cryptos tendance

## 🎨 Interface Utilisateur

### Design

- **Theme** : Cyber/Futuriste avec effets néon
- **Couleurs** : Palette sombre avec accents verts (#00ff88)
- **Effets** : Glass morphism, animations fluides, grille cyber
- **Responsive** : Adaptatif mobile/desktop

### Composants

- Graphiques interactifs (Recharts)
- Tables de données avec filtres
- Formulaires de configuration avancés
- Notifications toast en temps réel
- Barres de progression animées

## 🔒 Sécurité

- Validation des paramètres côté backend
- Gestion d'erreurs robuste
- CORS configuré pour le développement
- Sanitisation des inputs utilisateur

## 📝 Développement

### Ajout de Nouvelles Fonctionnalités

1. **Backend** : Ajouter routes dans `api/`
2. **Frontend** : Créer composants dans `components/`
3. **Tests** : Utiliser la documentation FastAPI automatique

### Structure des Données

Les configurations sont sauvées en JSON dans `backend/data/configs/`
Les résultats de backtests sont cachés en mémoire avec possibilité d'export

## 🐛 Dépannage

### Erreurs Communes

1. **Port déjà utilisé** : Changer le port dans `app.py` ou `next.config.js`
2. **CORS Error** : Vérifier que le backend autorise `localhost:3000`
3. **Module not found** : Vérifier l'activation de l'environnement virtuel
4. **API non accessible** : S'assurer que le backend est démarré

### Logs de Debug

- **Backend** : Les logs apparaissent dans le terminal FastAPI
- **Frontend** : Utiliser les DevTools du navigateur
- **API** : Tester avec la documentation Swagger sur `/docs`

## 🚀 Déploiement Production

### Backend (FastAPI)

```bash
# Installation des dépendances production
pip install gunicorn

# Lancement avec Gunicorn
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (Next.js)

```bash
# Build de production
npm run build

# Lancement en production
npm start
```

### Variables d'Environnement

Créer `.env.local` dans le frontend :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Memecoin Trading Bot
```

Créer `.env` dans le backend :

```env
ENVIRONMENT=production
API_HOST=0.0.0.0
API_PORT=8000
COINGECKO_API_KEY=your_api_key_here
```

## 📈 Optimisations Possibles

### Performance

- Cache Redis pour les données CoinGecko
- Base de données PostgreSQL pour persistance
- CDN pour les assets statiques
- Compression gzip

### Fonctionnalités Avancées

- WebSocket pour updates en temps réel
- Notifications push
- Export PDF des rapports
- Intégration Telegram/Discord
- Trading paper automatique
- Machine Learning pour optimisation

### Monitoring

- Logs structurés (JSON)
- Métriques Prometheus
- Health checks
- Alertes automatiques

## 🔧 Customisation

### Ajout de Nouveaux Indicateurs

1. **Backend** : Modifier `backtest_engine.py`

```python
def calculate_custom_metric(trades):
    # Votre logique de calcul
    return metric_value
```

2. **Frontend** : Ajouter dans les métriques

```javascript
const CustomMetric = ({ value }) => (
  <div className="metric-card">
    <div className="metric-value">{value}</div>
    <div className="metric-label">Custom Metric</div>
  </div>
);
```

### Nouveaux Types de Graphiques

```javascript
import { LineChart, BarChart, ScatterChart } from "recharts";

const CustomChart = ({ data }) => (
  <ScatterChart width={800} height={400} data={data}>
    {/* Configuration du graphique */}
  </ScatterChart>
);
```

### Intégration d'Autres APIs

```python
# Dans core/
class BinanceAPI:
    def get_price_data(self, symbol):
        # Intégration Binance
        pass

class DexScreenerAPI:
    def get_memecoin_data(self):
        # Intégration DexScreener
        pass
```

## 📚 Resources Utiles

### Documentation

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/en-US/)

### APIs Crypto

- [CoinGecko API](https://www.coingecko.com/en/api)
- [Binance API](https://binance-docs.github.io/apidocs/)
- [DexScreener API](https://docs.dexscreener.com/)

### Outils de Développement

- [Postman](https://www.postman.com/) - Test API
- [Figma](https://www.figma.com/) - Design UI/UX
- [Vercel](https://vercel.com/) - Déploiement frontend
- [Railway](https://railway.app/) - Déploiement backend

## 🤝 Contribution

### Workflow Git

```bash
# Cloner le repo
git clone your-repo-url
cd memecoin-trading-system

# Créer une branche feature
git checkout -b feature/nouvelle-fonctionnalite

# Développer et commiter
git add .
git commit -m "feat: ajout nouvelle fonctionnalité"

# Push et créer PR
git push origin feature/nouvelle-fonctionnalite
```

### Convention de Commits

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage, style
- `refactor:` Refactoring code
- `test:` Ajout tests
- `chore:` Maintenance

## 📄 License

MIT License - Voir le fichier LICENSE pour plus de détails.

## 🙏 Remerciements

- **CoinGecko** pour l'API de données crypto
- **FastAPI** pour le framework backend moderne
- **Next.js** pour le framework frontend React
- **Tailwind CSS** pour le système de design
- **Recharts** pour les graphiques interactifs

## 📞 Support

- **Issues** : Créer une issue GitHub
- **Email** : support@votre-domaine.com
- **Discord** : Rejoindre le serveur communautaire

---

**⚡ Ready to Trade Memecoins Like a Pro! 🚀**

Cette interface transforme votre bot Python en une application web professionnelle avec toutes les fonctionnalités modernes attendues d'un outil de trading avancé.
