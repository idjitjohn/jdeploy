# Webhook Deployer - Web Application

Transformation complète du système CLI en application web full-stack.

## Stack Technique

- **Backend**: Fastify + MongoDB + Socket.IO
- **Frontend**: HTML + Vanilla JavaScript
- **Auth**: JWT avec cookies HTTP-only
- **Base de données**: MongoDB avec Mongoose
- **Temps réel**: Socket.IO pour logs et statuts PM2

## Installation et Configuration

### 1. Prérequis

- Node.js 16+
- MongoDB (local ou distant)
- PM2 (global): `yarn global add pm2`
- Nginx (optionnel pour production)

### 2. Installation des dépendances

```bash
yarn install
```

### 3. Configuration MongoDB

Démarrer MongoDB localement:

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
net start MongoDB
```

Ou utiliser MongoDB Atlas (cloud) en modifiant `MONGO_URI` dans `.env`.

### 4. Migration des données

Le fichier `.env` est déjà configuré avec:

```
MONGO_URI=mongodb://localhost:27017/webhook-deployer
JWT_SECRET=change-this-secret-in-production-random-key-32-chars
PORT=50000
```

**Migrer deploy.config.json vers MongoDB**:

```bash
yarn mock
```

Cela va:
- Créer un utilisateur admin (username: `admin`, password: `admin123`)
- Migrer les paths, domains, repositories, templates vers MongoDB
- Être idempotent (peut être exécuté plusieurs fois)

### 5. Démarrage du serveur

```bash
# Mode développement (avec auto-reload)
yarn dev

# Mode production
yarn start
```

Le serveur démarre sur `http://localhost:50000`

## Utilisation

### Interface Web

1. **Login**: http://localhost:50000
   - Username: `admin`
   - Password: `admin123`

2. **Dashboard**: http://localhost:50000/dashboard.html
   - Vue PM2 en temps réel (Socket.IO)
   - Liste des repositories
   - Actions: Deploy, Restart, Stop

### API Endpoints

Toutes les routes nécessitent une authentification JWT (sauf `/api/webhook`).

**Authentification**:
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - User info

**Repositories**:
- `GET /api/repositories` - List
- `GET /api/repositories/:id` - Details
- `POST /api/repositories` - Create
- `PUT /api/repositories/:id` - Update
- `DELETE /api/repositories/:id` - Delete

**Deployments**:
- `POST /api/deployments/:repoName/start?branch=main` - Start
- `POST /api/deployments/:repoName/stop` - Stop
- `POST /api/deployments/:repoName/restart` - Restart
- `POST /api/deployments/:repoName/reload` - Graceful reload
- `DELETE /api/deployments/:repoName` - Delete PM2 process

**Domains**:
- `GET /api/domains` - List
- `POST /api/domains` - Create (avec upload certificat)
- `DELETE /api/domains/:id` - Delete

**Templates**:
- `GET /api/templates` - List (system + custom)
- `POST /api/templates` - Create custom
- `PUT /api/templates/:id` - Update (custom only)
- `DELETE /api/templates/:id` - Delete (custom only)

**Logs**:
- `GET /api/logs/:repoName?branch=main&limit=50` - Historique
- `GET /api/logs/deployment/:logId` - Details + contenu

**System**:
- `GET /api/system/status` - PM2 + Nginx + uptime
- `POST /api/system/nginx/reload` - Reload nginx
- `POST /api/system/sudo/authenticate` - Tester sudo password

**Webhook** (public):
- `POST /api/webhook` - GitHub/GitLab webhook handler

### Socket.IO Events

**Client → Server**:
- `subscribe:pm2` - S'abonner aux mises à jour PM2
- `unsubscribe:pm2` - Se désabonner
- `subscribe:deployment` - S'abonner aux logs déploiement
- `unsubscribe:deployment` - Se désabonner

**Server → Client**:
- `pm2:status` - Statut PM2 (toutes les 5s)
- `deployment:log` - Ligne de log en temps réel
- `deployment:status` - Changement statut déploiement

## Architecture

```
/listener
├── server/                   # Backend Fastify
│   ├── index.js             # Point d'entrée
│   ├── config/
│   │   └── database.js      # Connexion MongoDB
│   ├── models/              # Schemas Mongoose
│   │   ├── User.js
│   │   ├── Repository.js
│   │   ├── Domain.js
│   │   ├── Template.js
│   │   ├── DeploymentLog.js
│   │   └── Configuration.js
│   ├── routes/              # API REST
│   │   ├── auth.js
│   │   ├── repositories.js
│   │   ├── deployments.js
│   │   ├── domains.js
│   │   ├── templates.js
│   │   ├── webhook.js
│   │   ├── logs.js
│   │   └── system.js
│   ├── services/            # Logique métier
│   │   ├── authService.js
│   │   ├── deploymentService.js
│   │   ├── pm2Service.js
│   │   └── nginxService.js
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   └── errorHandler.js
│   ├── socket/
│   │   └── index.js         # Socket.IO handlers
│   └── utils/
│       ├── sudo.js          # Session-based sudo
│       └── interpolation.js # Variables $cf$, $rf$...
│
├── public/                  # Frontend HTML
│   ├── index.html          # Login page
│   └── dashboard.html      # Dashboard PM2 + repos
│
├── scripts/
│   ├── mock.js             # Migration config → DB
│   ├── listener.js         # CLI (toujours fonctionnel)
│   └── deploy.js           # CLI deploy
│
└── templates/              # Templates système (migrés en DB)
```

## Fonctionnalités

### ✅ Implémenté

- ✅ Authentification JWT avec cookies HTTP-only
- ✅ API REST complète (auth, repos, deployments, domains, templates, webhook, logs, system)
- ✅ MongoDB avec Mongoose (6 schemas)
- ✅ Script mock pour migration JSON → DB
- ✅ Service layer (deployment, PM2, nginx, auth)
- ✅ Socket.IO pour PM2 status temps réel
- ✅ Webhook GitHub/GitLab (signature HMAC)
- ✅ Gestion sudo avec session password
- ✅ DeploymentLog avec historique
- ✅ Pages HTML: Login + Dashboard basique
- ✅ Rate limiting (100 req/15min)
- ✅ CORS configuré
- ✅ Error handling global

### 📋 À compléter (optionnel)

- Frontend complet (repositories.html, domains.html, templates.html, logs.html)
- Live log streaming via Socket.IO
- Refactoring CLI scripts pour lire depuis MongoDB
- Tests unitaires et d'intégration
- CSS/SCSS styling avancé
- Upload fichiers certificats SSL
- Dashboard metrics avancés

## CLI Existant (toujours fonctionnel)

Les commandes CLI d'origine fonctionnent toujours:

```bash
yarn listener list
yarn listener start <repo>
yarn listener stop <repo>
yarn listener restart <repo>
yarn repo    # Ajouter repository
yarn domain  # Ajouter domain
```

## Sécurité

- JWT tokens en HTTP-only cookies (XSS protection)
- HMAC-SHA256 pour webhooks GitHub
- Bcrypt (10 rounds) pour passwords
- Rate limiting (100 req/15min)
- Session-based sudo (expiration 15min)
- CORS configuré
- Input validation sur tous endpoints

## Déploiement Production

1. Mettre à jour `.env`:
   ```
   NODE_ENV=production
   MONGO_URI=mongodb://...
   JWT_SECRET=<secret-fort-32-chars>
   PORT=50000
   CORS_ORIGIN=https://your-domain.com
   ```

2. Build CSS (si nécessaire):
   ```bash
   yarn build:css
   ```

3. Démarrer avec PM2:
   ```bash
   pm2 start server/index.js --name webhook-deployer
   pm2 save
   ```

4. Nginx reverse proxy (optionnel):
   ```nginx
   server {
     listen 80;
     server_name deployer.example.com;

     location / {
       proxy_pass http://localhost:50000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

## Troubleshooting

**MongoDB connection failed**:
- Vérifier que MongoDB est démarré
- Vérifier `MONGO_URI` dans `.env`

**Port 50000 already in use**:
- Changer `PORT` dans `.env`
- Ou arrêter l'ancien serveur Express

**PM2 processes not showing**:
- Vérifier que PM2 est installé: `pm2 list`
- Lancer un process test: `pm2 start server/index.js`

**Sudo operations fail**:
- Utiliser `/api/system/sudo/authenticate` avec password
- Ou configurer sudoers NOPASSWD pour nginx

## Support

Pour toute question ou bug, créer une issue sur GitHub.
