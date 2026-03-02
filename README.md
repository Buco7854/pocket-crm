# Pocket CRM

> CRM web complet pour la gestion des contacts, entreprises, opportunités, tâches et factures.

![CI/CD](https://github.com/Buco7854/pocket-crm/actions/workflows/ci.yml/badge.svg)

## ⚙️ Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 19 + TypeScript + Tailwind CSS 4 + Vite 7 |
| **State** | Zustand 5 |
| **Routing** | React Router v7 |
| **i18n** | react-i18next (FR / EN) |
| **Icons** | lucide-react |
| **Charts** | Recharts |
| **Backend** | PocketBase (framework Go) — binaire custom |
| **BDD** | SQLite via PocketBase |
| **Déploiement** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |
| **Tests** | Vitest + Testing Library |

## ✨ Fonctionnalités

- **Contacts** — gestion complète avec tags, relations entreprise/propriétaire
- **Entreprises** — fiche entreprise, secteur, taille, CA
- **Pipeline de vente** — Kanban drag-and-drop avec 7 étapes (Nouveau → Gagné/Perdu)
- **Tâches** — liste, calendrier mensuel, rappels d'échéances
- **Factures** — création avec lignes, calcul TVA automatique, suivi des paiements
- **Email** — modèles, campagnes en masse, tracking ouverture/clic, statistiques
- **Dashboard analytique** — KPI, CA, pipeline, conversions, classement commerciaux
- **Statistiques** — ventes, clients, commerciaux, finance, marketing (ROI/ROAS)
- **Authentification** — JWT + PocketBase Auth, rôles (admin / commercial / standard)
- **i18n** — interface complète en Français et Anglais
- **Thèmes** — Clair / Sombre / Système

## 📋 Prérequis

- **Docker** ≥ 24 & **Docker Compose** ≥ 2
- **Node.js** ≥ 20 (pour le développement frontend)
- **Go** ≥ 1.24 (pour le développement backend)

## 🚀 Démarrage rapide

### Avec Docker (recommandé)

```bash
# 1. Cloner le projet
git clone https://github.com/Buco7854/pocket-crm.git
cd pocket-crm

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env : PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD, SMTP_*, VITE_PB_URL

# 3. Lancer en développement
docker compose -f docker-compose.dev.yml up

# Frontend  -> http://localhost:3000
# Admin PocketBase -> http://localhost:8090/_/
```

### Développement local (sans Docker)

```bash
# Backend
cd backend
go run . serve --http=0.0.0.0:8090

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
```

## 📦 Déploiement production

```bash
docker compose up -d
```

Variables d'environnement requises :

| Variable | Description |
|----------|-------------|
| `PB_ADMIN_EMAIL` | Email du super-admin PocketBase |
| `PB_ADMIN_PASSWORD` | Mot de passe du super-admin |
| `SMTP_HOST` | Serveur SMTP (ex. smtp.brevo.com) |
| `SMTP_PORT` | Port SMTP (ex. 587) |
| `SMTP_USER` | Identifiant SMTP |
| `SMTP_PASSWORD` | Mot de passe SMTP |
| `PB_URL` | URL publique de l'API PocketBase (injectée à l'exécution dans le conteneur nginx) |

## 🛠️ Commandes utiles

```bash
# Tests
cd frontend && npm test

# Lint
cd frontend && npm run lint

# Build frontend
cd frontend && npm run build

# Build backend
cd backend && go build -o pocket-crm .
```

## 🔄 CI/CD

Le pipeline GitHub Actions (`.github/workflows/ci.yml`) s'exécute sur chaque push :

1. **Lint** — ESLint TypeScript/React
2. **Tests** — Vitest (store, composants, pipeline, i18n)
3. **Build Frontend** — `vite build`
4. **Build Backend** — `go build`

### Stratégie de branches

| Branche | Rôle |
|---------|------|
| `main` | Production — déclenchement du build Docker |
| `develop` | Pré-production — intégration continue |
| `feature/*` | Nouvelles fonctionnalités |
| `fix/*` | Corrections de bugs |

## 🗄️ Schéma BDD

Collections PocketBase : `users`, `companies`, `contacts`, `leads`, `tasks`, `invoices`,
`email_templates`, `email_logs`, `activities`, `campaigns`, `marketing_expenses`.

Voir [PLAN.md](./PLAN.md) pour le détail des champs et règles API.

## 📄 Licence

Distribué sous licence [MIT](./LICENSE).
