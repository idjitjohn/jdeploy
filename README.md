# JDeploy - Webhook Deployer

Automated webhook listener for Git deployment. Listen to GitHub and GitLab webhooks, automatically deploy code, manage processes with PM2, and configure Nginx reverse proxies.

## Core Features

- **Multi-platform Webhooks** - GitHub and GitLab webhook support
- **Automatic Deployments** - Trigger builds on git push events
- **PM2 Integration** - Manage processes with auto-restart and monitoring
- **Nginx Configuration** - Auto-setup reverse proxies for deployed apps
- **Multi-repository** - Deploy multiple repos with separate configurations
- **Template System** - Pre-configured templates (React, Next.js, NestJS, Node.js, Static)
- **Environment-based Branching** - Deploy different branches to prod, staging, dev
- **SSL/TLS Ready** - HTTPS webhook endpoints with certificate support

## Quick Start

### Prerequisites

- Node.js 14+
- Yarn
- Git
- PM2 (for process management)
- Nginx (recommended, for reverse proxy)
- Root/sudo access (for Nginx configuration)

### Installation & Setup

```bash
# Clone and setup
git clone <repo-url> jdeploy
cd jdeploy
yarn install

# Interactive initial setup
yarn self-deploy
```

This creates `deploy.config.json` and configures:
- Webhook listener domain and port
- SSL certificates for HTTPS
- PM2 auto-start settings

## Configuration

### Project Structure

```
jdeploy/
├── server.js                   Main webhook listener
├── deploy.config.json          Configuration (auto-generated)
├── .env                        Environment variables
│
├── scripts/
│   ├── deploy.js               Runs deployment commands
│   ├── listener.js             CLI to manage deployments
│   ├── add-repo.js             Add new repository
│   ├── add-domain.js           Add new domain
│   ├── self-deploy.js          Initial setup
│   ├── setup-nginx.js          Nginx configuration
│   └── validation.js           Config validation
│
├── templates/                  Deployment templates
│   ├── react.json
│   ├── nextjs.json
│   ├── nestjs.json
│   ├── node.json
│   └── static.json
│
└── text-env/                   Local dev Nginx configs
```

### Configuration File Format

The `deploy.config.json` stores:

```json
{
  "self": {
    "domain": "webhook.example.com",
    "port": "50000"
  },
  "paths": {
    "home": "/home/user/deployments",
    "nginxAvailable": "/etc/nginx/sites-available",
    "nginxEnabled": "/etc/nginx/sites-enabled"
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
      "branches": {
        "main": {
          "type": "prod",
          "pm2Name": "my-app-prod"
        }
      },
      "commands": [...],
      "preDeploy": [],
      "postDeploy": [],
      "nginx": { "enabled": true },
      "env": { "NODE_ENV": "$type$" }
    }
  ]
}
```

Templates are loaded from `templates/` directory, not stored in config.

## Usage

### Add Repository

```bash
yarn repo
```

Interactive setup for:
- Repository name and Git URL
- Deployment template (React, Next.js, NestJS, Node.js, Static)
- Domain and port
- Branch mapping (main → prod, develop → staging, etc.)

### Add Domain

```bash
yarn domain
```

Configure a domain with SSL certificates:
- Domain name
- Certificate path
- Private key path

### Manage Deployments

List all deployments and their status:
```bash
yarn listener list
```

Example output:

id │ name                │ type   │ port │ status
────┼─────────────────────┼────────┼──────┼──────────
0  │ my-app:main         │ prod   │ 3000 │ ● online
1  │ my-app:develop      │ staging│ 3001 │ ● online


**Start** - Deploy, enable Nginx, and start PM2:
```bash
yarn listener start <repo-name>
yarn listener start <repo-name>:<branch-type>
```

**Stop** - Disable Nginx and stop PM2:
```bash
yarn listener stop <repo-name>
```

**Restart** - Redeploy and restart PM2:
```bash
yarn listener restart <repo-name>
```

**Reload** - Graceful zero-downtime restart:
```bash
yarn listener reload <repo-name>
```

**View details**:
```bash
yarn listener describe <repo-name>
yarn listener logs <repo-name>
```

**Manage webhook listener**:
```bash
yarn listener restart self
yarn listener stop self
```

### Start Webhook Server

```bash
# Development (auto-reload)
yarn dev

# Production
yarn start

# Check health
curl http://localhost:50000/health
```

## Templates

Pre-configured templates for common frameworks:

| Template | Build Output | Runs | Use Case |
|----------|--------------|------|----------|
| **React** | `build/` | PM2 serve (SPA mode) | React SPAs |
| **Next.js** | `.next/` + `public/` | `yarn start` | React SSR/SSG |
| **NestJS** | `dist/` | `node dist/main.js` | Node.js APIs |
| **Node.js** | `dist/` | `node dist/index.js` | Node.js apps |
| **Static** | All files | PM2 serve | HTML/CSS/JS sites |

Each template defines:
- Build commands (fetch, install, build)
- Which artifacts to copy (`$cf$` → `$rf$`)
- How to start with PM2
- Nginx reverse proxy config

#### Variable Substitution

Available variables in commands and configs:

| Variable | Example | Purpose |
|----------|---------|---------|
| `$cf$` | `/home/user/clone-folder` | Clone with source code |
| `$rf$` | `/home/user/release-folder` | Deployed app directory |
| `$branch$` | `main` | Git branch name |
| `$type$` | `prod` | Environment (prod/staging/dev) |
| `$port$` | `3000` | App port |
| `$pm2Name$` | `my-app-prod` | PM2 process name |
| `$name$` | `my-app` | Repository name |
| `$domain$` | `example.com` | Domain name |
| `$home$` | `/home/user` | Home directory |

#### Custom Template

Create `templates/custom.json`:

```json
{
  "name": "Custom",
  "description": "Custom setup",
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

## Environment Variables

Create `.env`:

```env
NODE_ENV=production
WEBHOOK_PORT=50000
WEBHOOK_SECRET=your-very-long-secret-key-here
WEBHOOK_BRANCH=main
GITHUB_TOKEN=ghp_your-github-token-here
```

Required variables:
- `WEBHOOK_SECRET` - HMAC secret for GitHub/GitLab webhook verification
- `WEBHOOK_PORT` - Port for webhook listener (default: 50000)
- `WEBHOOK_BRANCH` - Which branch triggers deployments (or `*` for all)
- `GITHUB_TOKEN` - Optional, for private repo access

## GitHub/GitLab Setup

### GitHub Webhook

1. Go to repository → Settings → Webhooks → Add webhook
2. **Payload URL**: `https://webhook.example.com/webhook`
3. **Content type**: `application/json`
4. **Secret**: Your `WEBHOOK_SECRET` from `.env`
5. **Events**: Select "Push events"
6. Click "Add webhook"

**Optional**: Create Personal Access Token for private repos:
- Settings → Developer settings → Personal access tokens
- Scopes: `repo`, `read:user`
- Add to `.env` as `GITHUB_TOKEN`

### GitLab Webhook

1. Go to project → Settings → Webhooks
2. **URL**: `https://webhook.example.com/webhook`
3. **Secret token**: Your `WEBHOOK_SECRET`
4. **Events**: Check "Push events"
5. Click "Add webhook"

## How It Works

1. Webhook received from GitHub/GitLab
2. Signature verification (HMAC-SHA256)
3. Branch check against configuration
4. `deploy.js` spawned in background
5. Commands executed:
   - Pre-deploy hooks (if defined)
   - Main deployment (fetch, build, copy artifacts)
   - Post-deploy hooks (PM2 restart, etc.)
6. Logs written to `~/deploy-logs/<repo>-<branch>-<timestamp>.log`

## Logging

View webhook server logs:
```bash
# Live logs
pm2 logs webhook-deployer

# Or if running in dev
yarn dev
```

View deployment logs:
```bash
yarn listener logs <repo-name>
ls -lh ~/deploy-logs/
```

View PM2 process logs:
```bash
pm2 logs <app-name>
pm2 logs
```

## Security

- Webhook signatures validated with HMAC-SHA256
- SSL/TLS for HTTPS endpoints
- Secrets stored in `.env` (not committed)
- PM2 process isolation
- Nginx permission checks

## Troubleshooting

**Config not found**
```bash
yarn self-deploy
```

**Check webhook status**
```bash
yarn listener list
yarn listener describe <repo-name>
```

**View deployment logs**
```bash
yarn listener logs <repo-name>
tail ~/deploy-logs/
```

**Nginx issues**
- Verify directories exist: `/etc/nginx/sites-available` and `sites-enabled`
- Check permissions on nginx directories
- Test config: `sudo nginx -t`

**PM2 issues**
```bash
pm2 list           # Show all processes
pm2 logs <name>    # View process logs
pm2 delete <name>  # Remove process
pm2 kill           # Kill PM2 daemon
```

**Test webhook manually**
```bash
curl -X POST http://localhost:50000/webhook \
  -H "Content-Type: application/json" \
  -d '{"ref": "refs/heads/main", "repository": {"name": "test"}}'
```

## Scripts

| Script | Purpose |
|--------|---------|
| `server.js` | Main webhook listener server |
| `deploy.js` | Executes deployment commands |
| `listener.js` | CLI for managing deployments |
| `add-repo.js` | Add new repository |
| `add-domain.js` | Add new domain |
| `self-deploy.js` | Initial setup |
| `setup-nginx.js` | Configure Nginx |

## Development

Run with auto-reload:
```bash
yarn dev
```

Run in production:
```bash
yarn start
pm2 start server.js
```

## License

MIT
