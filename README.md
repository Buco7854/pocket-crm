# Pocket CRM

> CRM web complet pour la gestion des contacts, entreprises, opportunités, tâches, factures, campagnes email et analyse de performance commerciale.

![CI/CD](https://github.com/Buco7854/pocket-crm/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## Table des matières

1. [Présentation du projet](#présentation-du-projet)
2. [Stack technique](#stack-technique)
3. [Architecture](#architecture)
4. [Fonctionnalités](#fonctionnalités)
5. [Schéma de la base de données](#schéma-de-la-base-de-données)
6. [Workflow & Pipeline de vente](#workflow--pipeline-de-vente)
7. [Prérequis](#prérequis)
8. [Démarrage rapide](#démarrage-rapide)
9. [Déploiement production](#déploiement-production)
10. [CI/CD](#cicd)
11. [Tests](#tests)
12. [Variables d'environnement](#variables-denvironnement)
13. [Commandes utiles](#commandes-utiles)
14. [Structure du projet](#structure-du-projet)
15. [Diagrammes](#diagrammes)
16. [Licence](#licence)

---

## Présentation du projet

**Pocket CRM** est une application web full-stack de type CRM (Customer Relationship Management) développée dans le cadre d'une formation en Communication Digitale. Elle permet de centraliser la gestion des contacts, entreprises, opportunités commerciales, tâches, factures et campagnes d'emailing, tout en offrant un tableau de bord analytique complet.

L'application adopte une architecture conteneurisée avec Docker, utilisant PocketBase comme framework backend Go et React comme frontend. L'ensemble est déployable en quelques commandes, sans infrastructure serveur complexe à gérer.

**Entreprise fictive** : une agence de conseil en transformation digitale qui souhaite suivre ses prospects, gérer son pipeline de vente et mesurer le ROI de ses actions marketing.

---

## Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 19 + TypeScript + Tailwind CSS 4 + Vite 7 |
| **State management** | Zustand 5 |
| **Routing** | React Router v7 |
| **Internationalisation** | react-i18next (FR / EN) |
| **Icônes** | lucide-react |
| **Graphiques** | Recharts |
| **Backend** | PocketBase (framework Go) — binaire custom avec hooks |
| **Base de données** | SQLite (intégrée à PocketBase) |
| **Email** | SMTP configurable (Brevo, Mailgun, ou tout serveur SMTP) |
| **Conteneurisation** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions → GHCR (GitHub Container Registry) |
| **Tests** | Vitest + Testing Library |
| **Linting** | ESLint + TypeScript strict mode |

---

## Architecture

L'application suit une architecture à 3 couches conteneurisées :

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client (Navigateur)                       │
│   React 19 + TypeScript + Tailwind CSS 4 + Vite 7               │
│   Zustand (state) │ React Router v7 │ Recharts │ react-i18next  │
│   PocketBase JS SDK (REST + SSE Realtime)                        │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTP / SSE
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Conteneur Frontend (Nginx)                     │
│   Fichiers statiques (dist/) + env.js (config runtime)           │
│   Reverse proxy : /api/* et /_/* → PocketBase                    │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Conteneur Backend (Go)                         │
│   PocketBase (framework)                                         │
│   ├── hooks/email.go      → Routes email + tracking pixel/clic  │
│   ├── hooks/leads.go      → Activités auto + notification owner │
│   ├── hooks/invoices.go   → Calcul TTC auto + détection retard  │
│   ├── hooks/stats.go      → 6 endpoints statistiques            │
│   ├── hooks/marketing_expenses.go → Validation dépenses         │
│   ├── services/email_service.go   → SMTP + tracking             │
│   ├── seeds/seed.go       → Données de démonstration            │
│   └── pb_migrations/      → Schéma BDD auto-appliqué            │
│                                                                  │
│   SQLite (pb_data/) ←── Volume Docker persistant                 │
└───────────────────────────┬──────────────────────────────────────┘
                            │ SMTP
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Serveur SMTP externe                            │
│           (Brevo, Mailgun, ou tout fournisseur SMTP)             │
└──────────────────────────────────────────────────────────────────┘
```

**Diagramme complet** : voir [`docs/architecture-diagram.png`](./docs/architecture-diagram.png)

### Justification des choix techniques

| Choix | Justification |
|-------|---------------|
| **PocketBase** | Backend complet en un seul binaire Go : API REST, authentification JWT, realtime SSE, admin UI, migrations. Pas de serveur Node.js/Django/NestJS à maintenir. |
| **SQLite** | Suffisant pour un CRM mono-instance, pas de serveur PostgreSQL/MySQL à administrer. Les données persistent dans un volume Docker. |
| **React 19 + Vite 7** | Framework frontend mature avec écosystème riche. Vite offre un HMR instantané et des builds rapides. |
| **Tailwind CSS 4** | Utilitaires CSS atomiques, dark mode natif, pas de fichiers CSS séparés à gérer. |
| **Zustand** | State management minimal (< 1 KB) sans boilerplate Redux. |
| **Docker** | Environnement reproductible, déploiement simplifié, isolation des services. |
| **SMTP générique** | Pas de dépendance à un seul fournisseur (Brevo, Mailgun, Postfix…). Configurable via variables d'environnement. |

---

## Fonctionnalités

### Authentification & Rôles
- Login / Inscription / Déconnexion
- Réinitialisation de mot de passe par email
- 3 rôles : **Administrateur**, **Commercial**, **Standard**
- JWT via PocketBase Auth, guards de route côté frontend
- Intercepteur global 401 (déconnexion automatique si token expiré)

### Gestion des Contacts
- CRUD complet (création, lecture, modification, suppression)
- Fiches détaillées : nom, email, téléphone, poste, entreprise
- Tags multiples : prospect, client, partenaire, fournisseur
- Recherche full-text et filtres combinés (entreprise, tags)
- Envoi d'email direct depuis la fiche contact
- Historique des communications (email logs)

### Gestion des Entreprises
- CRUD complet avec fiches détaillées
- Champs : industrie, site web, taille (TPE/PME/ETI/GE), CA, adresse
- Association des contacts à une entreprise
- Filtrage par taille

### Gestion des Leads & Pipeline
- CRUD avec 7 statuts pipeline : Nouveau → Contacté → Qualifié → Proposition → Négociation → Gagné / Perdu
- 4 niveaux de priorité (basse, moyenne, haute, urgente)
- Sources de leads (site web, email, téléphone, salon, recommandation)
- Attribution à un commercial (owner)
- **Pipeline Kanban** : vue en colonnes avec drag-and-drop HTML5 natif
- Realtime PocketBase (SSE) : mise à jour automatique du pipeline
- Auto-fill `closed_at` lors du passage en Gagné/Perdu
- Liaison optionnelle à une campagne d'origine

### Gestion des Tâches
- CRUD avec types (appel, email, réunion, suivi, autre)
- Statuts : à faire, en cours, terminée, annulée
- 3 vues : **Liste** (filtrable/triable), **Calendrier mensuel**, **Rappels**
- Échéances avec détection automatique des retards
- Rappels visuels : tâches en retard, à faire aujourd'hui, à venir (48h)

### Facturation
- Création de factures avec lignes dynamiques (description, quantité, prix unitaire)
- Calcul automatique du total TTC (hook Go côté serveur)
- Détection automatique des factures en retard
- 5 statuts : brouillon, émise, payée, en retard, annulée
- Changement de statut rapide depuis la fiche

### Email & Campagnes
- **Modèles d'email** : éditeur HTML avec variables dynamiques (`{{first_name}}`, `{{date}}`, etc.)
- **Campagnes email** : envoi en masse à une sélection de contacts
- **Programmation** : planification d'envoi à une date/heure (scheduler Go 60s)
- **Tracking** : pixel d'ouverture (1×1 GIF) + redirection de liens cliqués
- **Statistiques** : taux d'ouverture, taux de clic, envoyés/échoués par campagne
- **Historique** : journal complet de tous les emails envoyés
- **Vérification SMTP** : alerte si SMTP non configuré

### Campagnes Marketing (non-email)
- Gestion des campagnes multi-canaux : publicité, réseaux sociaux, événements, SEO
- Liaison des leads à leur campagne d'origine
- Suivi du ROI par campagne

### Dépenses Marketing
- Saisie des dépenses par canal (email, site web, salon, téléphone, recommandation)
- Association optionnelle à une campagne
- Validation automatique de cohérence (catégorie ↔ type de campagne)

### Tableau de Bord Analytique
- **KPI en temps réel** : CA du mois, nouveaux prospects, réunions du jour, tâches en retard
- **Évolution** vs période précédente (flèche ↑↓ + pourcentage)
- **Objectif CA** : barre de progression vs période précédente
- **Graphique CA** : courbe d'évolution sur 12+ mois
- **Pipeline actif** : répartition par étape (barres avec montant)
- **Flux d'activité** : 10 dernières actions (appels, emails, créations, changements de statut)
- **Filtre de période** : 7 jours / 30 jours / 90 jours / 1 an

### Statistiques Avancées (5 onglets)

| Onglet | Métriques |
|--------|-----------|
| **Ventes** | CA par mois (line chart), CA par commercial (bar chart), entonnoir de conversion, taux de conversion, délai moyen de closing |
| **Clients** | Total/nouveaux/actifs, segmentation ville + secteur (pie charts), panier moyen, LTV, top 10 clients |
| **Commerciaux** | Leaderboard : ventes, CA, taux de succès, appels, emails, réunions par commercial |
| **Finance** | Factures par statut (pie), délai moyen de paiement, prévisionnel pondéré par étape pipeline, CA factures payées par mois |
| **Marketing** | Leads générés, sources (pie), ROI/ROAS global et par canal, coût par lead, performance par campagne |

### UX / Interface
- **Responsive** : mobile, tablette, desktop
- **Dark mode** : clair / sombre / système
- **i18n** : interface complète en français et anglais
- **Recherche globale** : Ctrl+K / Cmd+K, recherche multi-entités
- **Raccourcis clavier** : navigation, recherche
- **Toasts** : notifications contextuelles (succès, erreur, avertissement)
- **Confirmation de suppression** : dialogue modal avant toute suppression
- **Squelettes de chargement** : skeleton loaders sur tous les widgets

---

## Schéma de la base de données

L'application utilise 12 collections PocketBase (SQLite) :

| Collection | Type | Rôle |
|-----------|------|------|
| `users` | Auth | Utilisateurs avec rôles |
| `companies` | Base | Entreprises partenaires/clientes |
| `contacts` | Base | Personnes de contact |
| `leads` | Base | Opportunités commerciales (pipeline) |
| `tasks` | Base | Tâches et rendez-vous |
| `invoices` | Base | Factures avec lignes |
| `email_templates` | Base | Modèles d'email |
| `email_logs` | Base (hook-only write) | Journal d'envoi avec tracking |
| `campaigns` | Base | Campagnes marketing (email + autres) |
| `campaign_runs` | Base (hook-only write) | Historique des envois par campagne |
| `activities` | Base (hook-only write) | Journal d'activité automatique |
| `marketing_expenses` | Base | Dépenses marketing par canal |

**Diagramme MCD complet** : voir [`docs/mcd-diagram.png`](./docs/mcd-diagram.png)

### Règles d'accès API

| Opération | Standard | Commercial | Admin |
|-----------|----------|------------|-------|
| Lecture (list/view) | ✅ Tout authentifié | ✅ | ✅ |
| Création contacts/entreprises/leads/factures | ❌ | ✅ | ✅ |
| Création tâches | ✅ | ✅ | ✅ |
| Modification | ❌ (sauf assignee/owner) | ✅ owner | ✅ |
| Suppression | ❌ | ❌ | ✅ |
| email_logs / activities | Lecture seule | Lecture seule | Lecture seule |

---

## Workflow & Pipeline de vente

Le pipeline commercial suit 7 étapes avec des probabilités de conversion pondérées (utilisées dans le prévisionnel financier) :

```
Nouveau (10%) → Contacté (20%) → Qualifié (40%) → Proposition (60%) → Négociation (80%) → Gagné (100%)
                                                                                          → Perdu (0%)
```

**Processus métier** :

1. **Acquisition** : un lead entre dans le CRM via différentes sources (site web, salon, recommandation…), éventuellement lié à une campagne marketing.
2. **Qualification** : le commercial contacte le prospect, identifie le besoin et le budget. Le lead avance dans le pipeline via le Kanban drag-and-drop.
3. **Proposition** : rédaction et envoi d'une offre. Les modèles d'email permettent un suivi personnalisé.
4. **Négociation** : discussion des conditions. Les tâches (appels, réunions) sont planifiées pour le suivi.
5. **Closing** : le lead passe en "Gagné" (auto-remplissage de `closed_at`) ou "Perdu". Une facture peut être créée.
6. **Analyse** : le dashboard et les statistiques permettent de mesurer la performance : taux de conversion, CA par commercial, ROI des campagnes.

**Automatisations** :
- Création automatique d'une activité à chaque changement de statut d'un lead
- Notification email au commercial lors de l'attribution d'un lead
- Détection automatique des factures en retard
- Envoi programmé de campagnes email (scheduler toutes les 60 secondes)

**Diagramme complet** : voir [`docs/workflow-pipeline.png`](./docs/workflow-pipeline.png)

---

## Prérequis

- **Docker** ≥ 24 & **Docker Compose** ≥ 2
- **Node.js** ≥ 20 (pour le développement frontend)
- **Go** ≥ 1.24 (pour le développement backend)

---

## Démarrage rapide

### Avec Docker (recommandé)

```bash
# 1. Cloner le projet
git clone https://github.com/Buco7854/pocket-crm.git
cd pocket-crm

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs (email admin, SMTP, etc.)

# 3. Lancer en développement
docker compose -f docker-compose.dev.yml up --build

# 4. (Optionnel) Peupler avec des données de test
docker compose -f docker-compose.dev.yml exec pocketbase /pb/pocket-crm seed --force

# Frontend  → http://localhost:3000
# Admin PocketBase → http://localhost:8090/_/
```

### Développement local (sans Docker)

```bash
# Backend (terminal 1)
cd backend
go run . serve --http=0.0.0.0:8090

# Seed des données de test
cd backend
go run . seed --force

# Frontend (terminal 2)
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Comptes de test (après seed)

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | `admin@pocketcrm.test` | `admin123456` |
| Commercial | `commercial@pocketcrm.test` | `commercial123456` |
| Standard | `standard@pocketcrm.test` | `standard123456` |

---

## Déploiement production

```bash
docker compose up -d
```

Le `docker-compose.yml` de production utilise les images pré-construites depuis GHCR (GitHub Container Registry), poussées automatiquement par le pipeline CI/CD à chaque push sur `main`.

Le conteneur frontend injecte `PB_URL` dans `env.js` au démarrage via `docker-entrypoint.sh`, permettant une configuration runtime sans rebuild.

---

## CI/CD

Le pipeline GitHub Actions (`.github/workflows/ci.yml`) s'exécute sur chaque push et pull request :

```
Push / PR → Lint (ESLint) → Tests (Vitest) → Build Frontend (Vite) → Build Backend (Go)
                                                                              ↓
Push main → Build & Push images Docker → GHCR (ghcr.io/buco7854/pocket-crm-*)
```

### Stratégie de branches

| Branche | Rôle |
|---------|------|
| `main` | Production — déclenche le build Docker + push GHCR |
| `develop` | Pré-production — intégration continue |
| `feature/*` | Nouvelles fonctionnalités |
| `fix/*` | Corrections de bugs |

---

## Tests

```bash
cd frontend && npm test
```

Suite de tests Vitest couvrant :

| Catégorie | Fichier | Vérifié |
|-----------|---------|---------|
| **Auth store** | `authStore.test.ts` | État initial, login, logout, hasRole, clearError |
| **Composants UI** | `components.test.tsx` | Button (variants, loading, disabled), Badge (tous les statuts pipeline/facture), Alert (types, dismissible), Card |
| **Pipeline** | `pipeline.test.ts` | 7 statuts, ordre, won/lost/closed, canAdvance, calculs valeur pipeline, taux de conversion |
| **i18n** | `i18n.test.ts` | Complétude FR ↔ EN (toutes les clés présentes dans les deux langues), namespaces requis, statuts pipeline/tâches/factures |

---

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PB_ADMIN_EMAIL` | Email du super-admin PocketBase | `admin@pocket-crm.local` |
| `PB_ADMIN_PASSWORD` | Mot de passe du super-admin | `changeme123` |
| `SMTP_HOST` | Serveur SMTP | `smtp.brevo.com` |
| `SMTP_PORT` | Port SMTP | `587` |
| `SMTP_USER` | Identifiant SMTP | — |
| `SMTP_PASSWORD` | Mot de passe SMTP | — |
| `SMTP_FROM` | Adresse expéditeur | `noreply@pocket-crm.local` |
| `SMTP_SENDER_NAME` | Nom expéditeur | `Pocket CRM` |
| `SMTP_TLS` | SSL pour port 465 | `false` |
| `PB_APP_URL` | URL publique du backend (pour tracking pixels) | `http://localhost:8090` |
| `PB_URL` | URL de l'API PocketBase (injectée dans nginx) | `http://localhost:8090` |

---

## Commandes utiles

```bash
# Tests frontend
cd frontend && npm test

# Lint
cd frontend && npm run lint

# Build frontend (production)
cd frontend && npm run build

# Build backend (Go)
cd backend && go build -o pocket-crm .

# Seed données de test
cd backend && go run . seed --force

# Lancer PocketBase en dev
cd backend && go run . serve --http=0.0.0.0:8090
```

---

## Structure du projet

```
pocket-crm/
├── docker-compose.yml          # Production (images GHCR)
├── docker-compose.dev.yml      # Développement (build local)
├── .env.example                # Template variables d'environnement
├── .github/workflows/
│   ├── ci.yml                  # Pipeline CI : lint → test → build
│   └── publish.yml             # Build & push images Docker → GHCR
│
├── docs/                       # Documentation & diagrammes
│   ├── architecture-diagram.png
│   ├── mcd-diagram.png
│   ├── use-case-diagram.png
│   └── workflow-pipeline.png
│
├── backend/
│   ├── main.go                 # Point d'entrée Go (PocketBase + hooks)
│   ├── Dockerfile              # Multi-stage build Go
│   ├── go.mod / go.sum
│   ├── hooks/
│   │   ├── email.go            # Routes API email + tracking
│   │   ├── leads.go            # Hooks lifecycle leads
│   │   ├── invoices.go         # Auto-calcul TTC + retard
│   │   ├── stats.go            # 6 endpoints statistiques
│   │   └── marketing_expenses.go
│   ├── services/
│   │   └── email_service.go    # Logique SMTP + pixel + link tracking
│   ├── seeds/
│   │   └── seed.go             # Données de démonstration
│   ├── pb_migrations/
│   │   ├── 0001_create_collections.go
│   │   └── helpers.go
│   └── pb_data/                # (gitignored) données runtime
│
└── frontend/
    ├── Dockerfile              # Multi-stage build Node → Nginx
    ├── Dockerfile.dev          # Dev avec HMR
    ├── nginx.conf              # Reverse proxy + SPA fallback
    ├── docker-entrypoint.sh    # Injection env.js au runtime
    ├── package.json
    ├── vite.config.ts
    ├── eslint.config.js
    └── src/
        ├── main.tsx            # Point d'entrée React
        ├── App.tsx
        ├── style.css           # Tailwind + CSS custom properties
        ├── router/index.tsx    # Routes + guards (RequireAuth, RequireRole)
        ├── lib/pocketbase.ts   # Singleton SDK
        ├── store/authStore.ts  # Zustand auth
        ├── i18n/               # FR + EN complets
        ├── types/models.ts     # Interfaces TypeScript
        ├── hooks/              # useAuth, useCollection, useDashboard, etc.
        ├── components/
        │   ├── layout/         # AppLayout, Sidebar, Topbar, GlobalSearch
        │   ├── ui/             # Button, Input, Select, Modal, Table, etc.
        │   ├── contacts/       # ContactList, ContactForm, ContactDetail
        │   ├── companies/      # CompanyList, CompanyForm, CompanyDetail
        │   ├── leads/          # LeadList, LeadForm, PipelineBoard
        │   ├── tasks/          # TaskList, TaskCalendar, TaskReminder
        │   ├── invoices/       # InvoiceList, InvoiceForm, InvoiceDetail
        │   ├── email/          # EmailTemplateEditor, EmailCampaignList, EmailStats
        │   ├── marketing/      # MarketingExpenseForm, MarketingCampaignForm
        │   ├── dashboard/      # KpiCard, ActivityFeed, PipelineWidget
        │   └── stats/          # SalesStats, ClientStats, CommercialLeaderboard, etc.
        ├── pages/              # DashboardPage, ContactsPage, PipelinePage, etc.
        └── test/               # authStore, components, pipeline, i18n tests
```

---

## Diagrammes

Tous les diagrammes sont au format **PNG** :

| Diagramme | Fichier | Description |
|-----------|---------|-------------|
| **Cas d'utilisation (UML)** | [`docs/use-case-diagram.png`](./docs/use-case-diagram.png) | Acteurs (Admin, Commercial, Standard) et cas d'utilisation par module |
| **MCD Merise** | [`docs/mcd-diagram.png`](./docs/mcd-diagram.png) | 12 entités, attributs, relations et cardinalités |
| **Architecture technique** | [`docs/architecture-diagram.png`](./docs/architecture-diagram.png) | 3 couches (Client, Nginx, Backend Go), flux de données, services externes |
| **Workflow pipeline** | [`docs/workflow-pipeline.png`](./docs/workflow-pipeline.png) | 7 étapes du pipeline de vente, probabilités, automatisations |

---

## Licence

Distribué sous licence [MIT](./LICENSE).
