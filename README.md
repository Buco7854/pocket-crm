# Pocket-CRM

CRM web pour la gestion de contacts, entreprises, leads et taches.

## Stack Technique

- **Frontend** : Vue.js 3 (Composition API) + TypeScript + Tailwind CSS + Vite
- **Backend** : PocketBase (framework Go)
- **Deploiement** : Docker
- **i18n** : Francais / Anglais

## Prerequis

- Docker & Docker Compose
- Node.js 20+ (pour le developpement frontend)
- Go 1.23+ (pour le developpement backend)

## Demarrage rapide

```bash
# Cloner le projet
git clone <repo-url>
cd pocket-crm

# Copier les variables d'environnement
cp .env.example .env

# Lancer avec Docker
docker-compose up

# Frontend : http://localhost:3000
# PocketBase Admin : http://localhost:8090/_/
```

## Structure du projet

Voir [PLAN.md](./PLAN.md) pour le plan de developpement detaille et le suivi de progression.
