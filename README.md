# Webhook Deployer

Automated webhook listener for Git deployment. Supports GitHub and GitLab webhooks with automatic deployment triggering, PM2 process management, and Nginx reverse proxy configuration.

**📚 Documentation:**
- [README.md](README.md) - This file, quick start and reference
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detailed deployment flow and troubleshooting
- [TEMPLATES_SUMMARY.md](TEMPLATES_SUMMARY.md) - Framework-specific deployment details

## Features

- **Multi-platform Support**: GitHub and GitLab webhooks
- **Automatic Deployments**: Trigger builds on git push events
- **PM2 Integration**: Process management and auto-restart
- **Nginx Configuration**: Automatic reverse proxy setup
- **Multiple Repositories**: Manage multiple repos with different branches
- **Template System**: Pre-configured deployment templates (React, Next.js, NestJS, Node.js, Static)
- **SSL/TLS Support**: HTTPS webhooks with certificate management
- **Branch-based Deployments**: Deploy different branches to different environments (prod, staging, dev)

## Quick Start

### Prerequisites

- Node.js 14+
- Yarn
- Git
- PM2 (for process management)
- Nginx (optional, for reverse proxy)

### Installation

```bash
# Clone the repository
git clone <repo-url> webhook-deployer
cd webhook-deployer

# Install dependencies
yarn install

# Initial setup (interactive)
yarn self-deploy
```

### Initial Configuration

Run `yarn self-deploy` to configure:
1. Self-hosting domain and port
2. SSL certificates
3. Webhook service subdomain
4. PM2 auto-start (optional)

## Configuration

### Directory Structure

```
webhook-deployer/
├── .env                    # Environment variables
├── deploy.config.json      # Main configuration file
├── server.js              # Webhook listener server
├── scripts/
│   ├── deploy.js          # Deployment executor
│   ├── add-repo.js        # Add new repository
│   ├── add-domain.js      # Add new domain
│   ├── listener.js        # Listener management CLI
│   ├── self-deploy.js     # Initial setup
│   └── setup-nginx.js     # Nginx configuration
├── templates/             # Deployment templates
│   ├── react.json
│   ├── nextjs.json
│   ├── nestjs.json
│   ├── node.json
│   └── static.json
└── text-env/             # Local nginx configs (development only)
```

### deploy.config.json Structure

```json
{
  "templates": {
    "react": {
      "postDeploy": [
        "pm2 delete $pm2Name$ || true",
        "pm2 serve $rf$ $port$ --name $pm2Name$ --namespace \"$port$\" --spa"
      ]
    },
    "nextjs": {
      "postDeploy": [
        "cd $rf$",
        "yarn install --production",
        "pm2 delete $pm2Name$ 2>/dev/null || true",
        "pm2 start \"yarn start\" --name $pm2Name$ --namespace \"$port$\" --cwd $rf$"
      ]
    },
    "nestjs": {
      "postDeploy": [
        "cd $rf$",
        "yarn install --production",
        "pm2 delete $pm2Name$ 2>/dev/null || true",
        "pm2 start dist/main.js --name $pm2Name$ --namespace \"$port$\" --cwd $rf$"
      ]
    }
  },
  "paths": {
    "home": "/path/to/deployment/root",
    "nginxAvailable": "/path/to/nginx/sites-available",
    "nginxEnabled": "/path/to/nginx/sites-enabled"
  },
  "domains": [
    {
      "name": "example.com"
    }
  ],
  "repositories": [
    {
      "name": "my-app",
      "repoUrl": "https://github.com/user/my-app.git",
      "template": "nextjs",
      "domain": "example.com",
      "port": "3000",
      "commands": [
        "cd $cf$",
        "git fetch origin $branch$",
        "git checkout $branch$",
        "git reset --hard origin/$branch$",
        "yarn install",
        "yarn build",
        "rm -rf $rf$/.next $rf$/public $rf$/package.json $rf$/yarn.lock $rf$/.env*",
        "cp -r $cf$/.next $rf$/",
        "test -d $cf$/public && cp -r $cf$/public $rf$/ || true",
        "cp $cf$/package.json $rf$/",
        "cp $cf$/yarn.lock $rf$/ 2>/dev/null || cp $cf$/package-lock.json $rf$/ 2>/dev/null || true",
        "cp $cf$/.env* $rf$/ 2>/dev/null || true"
      ],
      "preDeploy": [],
      "nginx": {
        "enabled": true,
        "template": [...]
      },
      "env": {
        "NODE_ENV": "$type$"
      },
      "branches": {
        "main": {
          "type": "prod",
          "pm2Name": "my-app-prod"
        },
        "develop": {
          "type": "staging",
          "pm2Name": "my-app-staging"
        }
      }
    }
  ],
  "self": {
    "domain": "webhook.example.com",
    "subdomain": "webhook",
    "port": "50000"
  }
}
```

## Usage

### Add a New Repository

```bash
yarn repo
```

Interactive prompt will guide you through:
1. Repository name and URL
2. Template selection (or custom setup)
3. Domain and port configuration
4. Branch configuration (main, develop, etc.)

### Add a Domain

```bash
yarn domain
```

Configure a new domain with:
1. Domain name
2. SSL certificate (certificate.crt)
3. Private key (private.key)

### Listener Management

View all configured listeners with status and ports:
```bash
yarn listener list
```

Output shows configured repositories with their ports and current status:
```
  id │ name                     │ branch   │ type   │ port   │ status
  ───┼──────────────────────────┼──────────┼────────┼────────┼─────────
  0  │ todo:main                │ main     │ prod   │ 3000   │ ● online
  1  │ izob:develop             │ develop  │ prod   │ 5509   │ ● online
```

**Start a listener** (trigger deployment + enable nginx + start PM2):
```bash
yarn listener start <repo-name>
yarn listener start <repo-name>:<branch-type>  # Specific type (prod, staging, dev)
```

Full flow:
1. ✓ Enable nginx reverse proxy
2. ✓ Trigger fresh deployment (fetch code, build, copy artifacts)
3. ✓ Start PM2 process

**Stop a listener** (disable nginx + stop PM2):
```bash
yarn listener stop <repo-name>
yarn listener stop <repo-name>:<branch-type>
```

**Restart a listener** (trigger deployment + restart PM2):
```bash
yarn listener restart <repo-name>
yarn listener restart <repo-name>:<branch-type>
```

Full flow:
1. ✓ Enable nginx reverse proxy
2. ✓ Trigger fresh deployment
3. ✓ Restart PM2 process

**Reload a listener** (trigger deployment + gracefully reload PM2):
```bash
yarn listener reload <repo-name>
yarn listener reload <repo-name>:<branch-type>
```

Full flow:
1. ✓ Enable nginx reverse proxy
2. ✓ Trigger fresh deployment
3. ✓ Gracefully reload PM2 process (zero downtime)

View listener details:
```bash
yarn listener describe <repo-name>
```

View logs:
```bash
yarn listener logs <repo-name>
```

Manage webhook listener itself:
```bash
yarn listener restart self
yarn listener stop self
```

### Start Webhook Listener

```bash
# Development mode with auto-reload
yarn dev

# Production mode
yarn start

# Via PM2
pm2 start ecosystem.config.js
```

### Health Check

```bash
curl http://localhost:50000/health
```

## Deployment Templates

### Available Templates

Each template in `templates/` defines:
- **Build commands** - How to compile the application
- **Artifact copying** - What to copy from clone to release folder
- **Post-deploy hooks** - PM2 process management
- **Nginx configuration** - Reverse proxy setup

1. **React** - SPA with yarn build output (build/)
   - Copies: build folder
   - PM2: serves static files with --spa flag

2. **Next.js** - React SSR/SSG framework
   - Copies: .next/, public/, package.json, lock file, .env* files
   - PM2: runs "yarn start" with production dependencies

3. **NestJS** - Node.js backend API
   - Copies: dist/, package.json, lock file, .env* files
   - PM2: runs dist/main.js with production dependencies

4. **Node.js** - Standard Node.js application
   - Copies: dist/, package.json, lock file, .env* files
   - PM2: runs dist/index.js with production dependencies

5. **Static** - Pure HTML/CSS/JS website
   - Copies: all files from code folder
   - PM2: serves files as static content

### Template Structure

Each template.json contains:

```json
{
  "name": "Template Name",
  "description": "Template description",
  "commands": [
    "cd $cf$",
    "git fetch origin $branch$",
    "git checkout $branch$",
    "git reset --hard origin/$branch$",
    "yarn install",
    "yarn build",
    "rm -rf $rf$/dist",
    "cp -r $cf$/dist $rf$/"
  ],
  "preDeploy": [],
  "postDeploy": [
    "pm2 delete $pm2Name$ || true",
    "pm2 start dist/index.js --name $pm2Name$ --namespace \"$port$\""
  ],
  "nginx": {
    "enabled": true,
    "template": [...]
  },
  "env": {
    "NODE_ENV": "$type$"
  }
}
```

### Artifact Copying

Templates handle copying artifacts from clone folder (`$cf$`) to release folder (`$rf$`):

- **Build artifacts** - dist/, .next/, build/
- **Configuration** - package.json, yarn.lock, package-lock.json
- **Environment files** - All .env* files (e.g., .env, .env.prod, .env.local)

This ensures each deployed version has:
1. Fresh build output
2. Correct dependencies configuration
3. Environment-specific settings

### Custom Templates

Create a custom template in `templates/custom.json`:

```json
{
  "name": "Custom",
  "description": "Custom deployment configuration",
  "commands": [
    "cd $cf$",
    "git fetch origin $branch$",
    "git checkout $branch$",
    "git reset --hard origin/$branch$",
    "yarn install",
    "yarn build",
    "rm -rf $rf$/dist",
    "cp -r $cf$/dist $rf$/"
  ],
  "preDeploy": [],
  "postDeploy": [
    "pm2 delete $pm2Name$ || true",
    "pm2 start dist/app.js --name $pm2Name$ --namespace \"$port$\""
  ],
  "nginx": {
    "enabled": true,
    "template": [
      "server {",
      "  listen 80;",
      "  server_name $name$.$domain$;",
      "  location / {",
      "    proxy_pass http://localhost:$port$;",
      "  }",
      "}"
    ]
  },
  "env": {
    "NODE_ENV": "$type$"
  }
}
```

### PM2 Namespace for Port Tracking

The `--namespace "$port$"` flag in postDeploy commands makes the port visible in PM2's process list without changing the process name. This allows you to quickly identify which port each process is using:

```bash
pm2 list
# Shows port in the namespace column:
# │ name        │ namespace │ status │
# │ todo-prod   │ 3000      │ online │
```

## Environment Variables

Create `.env` file with:

```env
NODE_ENV=production
WEBHOOK_PORT=50000
WEBHOOK_SECRET=your-very-long-secret-key-here
WEBHOOK_BRANCH=main
GITHUB_TOKEN=ghp_your-github-token-here
```

### Variable Substitutions in Deployment

Use these variables in deploy commands:

- `$cf$` - Code folder path (clone folder with source code)
- `$rf$` - Release folder path (deployment folder for running app)
- `$branch$` - Current branch name
- `$pm2Name$` - PM2 process name
- `$port$` - Application port (used in PM2 namespace for display)
- `$home$` - Home directory (from config)
- `$name$` - Repository name
- `$domain$` - Domain name
- `$type$` - Branch type (prod, staging, dev)

## GitHub Setup

### Create Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Click "Generate new token"
3. Select scopes: `repo`, `read:user`
4. Copy token to `.env` as `GITHUB_TOKEN`

### Add Webhook

1. Go to repository → Settings → Webhooks
2. Click "Add webhook"
3. Payload URL: `https://webhook.example.com/webhook`
4. Content type: `application/json`
5. Secret: Use your `WEBHOOK_SECRET` from config
6. Events: Select "Push events"
7. Click "Add webhook"

## GitLab Setup

### Add Webhook

1. Go to repository → Settings → Webhooks
2. URL: `https://webhook.example.com/webhook`
3. Secret token: Use your `WEBHOOK_SECRET`
4. Trigger: Check "Push events"
5. Click "Add webhook"

## Deployment Flow

1. **Webhook Received**: GitHub/GitLab sends push event
2. **Verification**: Webhook signature is validated
3. **Branch Check**: Verify webhook matches configured branch
4. **Deployment Spawned**: `deploy.js` runs in background
5. **Commands Executed**: Pre-deploy → main → post-deploy
6. **PM2 Restart**: Application restarts (if configured)
7. **Logs**: Stored in `~/deploy-logs/`

## Logging

### Webhook Logs
```bash
yarn listener logs <repo-name>
```

### PM2 Logs
```bash
pm2 logs
pm2 logs <app-name>
```

### Deployment Logs
Located in: `~/deploy-logs/<repo-name>-<branch>-<timestamp>.log`

## Security

- Webhook signatures are verified using HMAC-SHA256
- SSL/TLS certificates for HTTPS endpoints
- Environment variables for sensitive data
- PM2 process isolation
- Permission checks for nginx operations

## Troubleshooting

### Check Webhook Listener Status
```bash
yarn listener list
```

### Test Webhook Connectivity
```bash
curl -X POST https://webhook.example.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"ref": "refs/heads/main", "repository": {"name": "test"}}'
```

### View Configuration
```bash
yarn listener describe <repo-name>
```

### Common Issues

**Configuration not found**
```bash
yarn self-deploy
```

**Nginx permission denied**
- Ensure nginx config directories exist
- Check file permissions on `/text-env/sites-available`

**PM2 process not starting**
```bash
pm2 list
pm2 logs <app-name>
pm2 kill
pm2 start ecosystem.config.js
```

**Deployment failing**
1. Check logs: `yarn listener logs <repo-name>`
2. Verify git URL accessible
3. Check branch exists: `git branch -a`
4. Test deployment command manually

## Scripts Reference

### `server.js`
Main webhook listener server. Listens for GitHub/GitLab webhooks and triggers deployments.

### `deploy.js`
Executes deployment commands for a repository. Runs in background when webhook received.

### `listener.js`
CLI for managing PM2 processes and Nginx configurations.

### `add-repo.js`
Interactive script to add new repositories to configuration.

### `add-domain.js`
Interactive script to add new domains with SSL certificates.

### `self-deploy.js`
Initial setup script for webhook listener configuration.

### `setup-nginx.js`
Generates and installs Nginx configuration for webhook listener.

## Development

### Run in Development Mode
```bash
yarn dev
```

Auto-reloads on file changes using nodemon.

### Environment
- Development: `NODE_ENV=development` in `.env`
- Production: `NODE_ENV=production` and use PM2

## License

MIT

## Support

For issues and feature requests, check logs and configuration:

```bash
# View webhook listener logs
pm2 logs webhook-deployer

# View repository deployment logs
ls -lh ~/deploy-logs/

# Check configuration
cat deploy.config.json | jq '.repositories[] | {name, domain, port}'
```
