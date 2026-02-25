# Pocket-CRM — Plan de Developpement Complet

## Contexte

Projet d'etudes : CRM web. Le repertoire `pocket-crm` est vide, tout est a construire from scratch. Ce document sert de tracker de progression — cocher `[x]` au fur et a mesure.

**Stack** : Vue.js 3 (Composition API) + **TypeScript** + Tailwind CSS + Vite | PocketBase **en tant que framework Go** (binaire custom) | Docker | **i18n FR/EN** (vue-i18n)

**IMPORTANT** : Mettre a jour ce fichier en cochant `[x]` apres chaque tache realisee.

---

## Structure Cible du Projet

```
pocket-crm/
├── docker-compose.yml
├── .env / .env.example / .gitignore / README.md
│
├── backend/
│   ├── main.go                # Point d'entree Go custom (importe PocketBase comme lib)
│   ├── go.mod / go.sum
│   ├── Dockerfile             # Build Go multi-stage
│   ├── hooks/
│   │   ├── email.go           # Routes/hooks custom email
│   │   ├── leads.go           # Hooks lifecycle leads + activities
│   │   └── tasks.go           # Hooks rappels taches
│   ├── services/
│   │   └── email_service.go   # Logique envoi email reutilisable
│   ├── pb_migrations/         # Migrations schema auto-generees
│   └── pb_data/               # (gitignored) runtime data
│
└── frontend/
    ├── Dockerfile / nginx.conf
    ├── package.json / vite.config.ts / tailwind.config.ts / tsconfig.json / tsconfig.app.json
    └── src/
        ├── main.ts / App.vue
        ├── env.d.ts                      # Types environnement Vite
        ├── router/index.ts
        ├── lib/pocketbase.ts             # SDK singleton type
        ├── types/
        │   ├── models.ts                 # Interfaces TS (User, Contact, Company, Lead, Task, etc.)
        │   └── pocketbase.ts             # Types expand PocketBase
        ├── i18n/
        │   ├── index.ts                  # Config vue-i18n
        │   ├── fr.json                   # Traductions francaises
        │   └── en.json                   # Traductions anglaises
        ├── stores/                       # Pinia (auth, contacts, companies, leads, tasks, dashboard)
        ├── composables/                  # useAuth, useContacts, useCompanies, useLeads, useTasks, useDashboard, useI18n
        ├── components/
        │   ├── layout/   (AppLayout, AppSidebar, AppTopbar, AppBreadcrumb, LocaleSwitcher)
        │   ├── ui/       (BaseButton, BaseInput, BaseSelect, BaseModal, BaseTable, BaseCard, BaseBadge, BaseAlert, BasePagination, BaseSearchFilter)
        │   ├── contacts/ (ContactList, ContactForm, ContactDetail)
        │   ├── companies/(CompanyList, CompanyForm, CompanyDetail)
        │   ├── leads/    (LeadList, LeadForm, LeadDetail, PipelineBoard)
        │   ├── tasks/    (TaskList, TaskForm, TaskCalendar, TaskReminder)
        │   ├── dashboard/(KpiCard, RevenueChart, ConversionFunnel, ActivityFeed)
        │   └── email/    (EmailTemplateEditor, EmailCampaignList)
        └── views/         (Login, Register, Dashboard, Contacts, Companies, Leads, Pipeline, Tasks, Email, Settings)
```

---

## Schema Base de Donnees (Collections PocketBase)

### `users` (auth collection)
| Champ | Type | Notes |
|-------|------|-------|
| email/password/verified | system | Built-in |
| name | TextField | Required |
| role | SelectField | `admin`, `commercial`, `standard` |
| avatar | FileField | Optional |
| phone | TextField | Optional |

### `companies`
| Champ | Type | Notes |
|-------|------|-------|
| name | TextField | Required |
| industry, website, email, phone, address, city, country | divers | Optional |
| size | SelectField | `tpe`, `pme`, `eti`, `grande_entreprise` |
| revenue | NumberField | CA annuel |
| owner | Relation -> users | |
| notes | EditorField | Optional |
| logo | FileField | Optional |

### `contacts`
| Champ | Type | Notes |
|-------|------|-------|
| first_name, last_name | TextField | Required |
| email, phone, position | divers | Optional |
| company | Relation -> companies | |
| owner | Relation -> users | |
| notes | EditorField | Optional |
| tags | SelectField multiple | prospect, client, partenaire, fournisseur |

### `leads`
| Champ | Type | Notes |
|-------|------|-------|
| title | TextField | Required |
| value | NumberField | Montant attendu |
| status | SelectField | `nouveau`, `contacte`, `qualifie`, `proposition`, `negociation`, `gagne`, `perdu` |
| priority | SelectField | `basse`, `moyenne`, `haute`, `urgente` |
| source | SelectField | `site_web`, `email`, `telephone`, `salon`, `recommandation`, `autre` |
| contact | Relation -> contacts | |
| company | Relation -> companies | |
| owner | Relation -> users | |
| expected_close, closed_at | DateField | |
| notes | EditorField | Optional |

### `tasks`
| Champ | Type | Notes |
|-------|------|-------|
| title | TextField | Required |
| description | EditorField | Optional |
| type | SelectField | `appel`, `email`, `reunion`, `suivi`, `autre` |
| status | SelectField | `a_faire`, `en_cours`, `terminee`, `annulee` |
| priority | SelectField | `basse`, `moyenne`, `haute`, `urgente` |
| due_date, reminder_at, completed_at | DateField | |
| assignee, created_by | Relation -> users | |
| contact, lead, company | Relations optionnelles | |

### `email_templates`
name, subject, body (EditorField), type (marketing/transactionnel/relance/bienvenue), active (bool), created_by -> users

### `email_logs`
template -> email_templates, recipient_email, recipient_contact -> contacts, subject, status (envoye/echoue/en_attente), sent_at, error_message, sent_by -> users. **Ecriture par hooks Go uniquement.**

### `activities`
type (creation/modification/email/appel/note/statut_change), description, user -> users, contact/lead/company (optionnels), metadata (JSON). **Ecriture par hooks Go uniquement.**

### Regles API (resume)
- **Lecture** : tout utilisateur authentifie
- **Creation contacts/companies/leads** : admin ou commercial
- **Creation tasks** : tout authentifie
- **Modification** : admin ou owner/assignee
- **Suppression** : admin uniquement
- **email_logs / activities** : lecture seule (ecriture par hooks Go)

---

## Phase 1 : Setup & Environnement

- [x] 1.0 — Creer `PLAN.md` a la racine du projet
- [x] 1.1 — `git init` + `.gitignore` (node_modules, dist, pb_data, .env, *.log, backend/pocket-crm)
- [x] 1.2 — Creer `README.md` (nom projet, stack, instructions placeholder)
- [x] 1.3 — Creer `.env.example` (PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, VITE_PB_URL)
- [x] 1.4 — **Backend Go** : creer `backend/`, initialiser le module Go (`cd backend && go mod init pocket-crm`)
- [x] 1.5 — Installer la dependance PocketBase Go : `go get github.com/pocketbase/pocketbase`
- [x] 1.6 — Ecrire `backend/main.go` : importer PocketBase comme framework, initialiser l'app PB, demarrer le serveur
- [x] 1.7 — Creer les dossiers `backend/hooks/`, `backend/services/`, `backend/pb_migrations/`
- [x] 1.8 — Ecrire `backend/Dockerfile` : multi-stage (golang:1.24-alpine build + alpine run), expose port 8090
- [x] 1.9 — **Frontend Vue 3 + TS** : `npm create vite@latest frontend -- --template vue-ts`
- [x] 1.10 — `cd frontend && npm install`
- [x] 1.11 — Installer Tailwind CSS (`tailwindcss @tailwindcss/vite`) + config
- [x] 1.12 — Configurer directives Tailwind dans `src/style.css`
- [x] 1.13 — Installer ESLint + Prettier + config `.eslintrc.cjs`
- [x] 1.14 — Installer PocketBase JS SDK : `npm install pocketbase`
- [x] 1.15 — Installer Pinia : `npm install pinia`
- [x] 1.16 — Installer Vue Router : `npm install vue-router@4`
- [x] 1.17 — Installer vue-i18n : `npm install vue-i18n@next`
- [x] 1.18 — Configurer `tsconfig.app.json` (paths aliases `@/` -> `src/`, strict mode)
- [x] 1.19 — Creer `src/env.d.ts` pour les types d'environnement Vite
- [x] 1.20 — Ecrire `docker-compose.yml` (services pocketbase + frontend, ports, volumes)
- [x] 1.21 — Configurer `vite.config.ts` (proxy /api -> pocketbase:8090, alias @/)
- [x] 1.22 — Verifier : `docker-compose up`, PocketBase Admin sur :8090/_/, Vue dev sur :3000
- [x] 1.23 — Creer superuser PocketBase via CLI
- [x] 1.24 — Commit initial

---

## Phase 2 : Modelisation BDD dans PocketBase

- [x] 2.1 — Configurer collection `users` (auth) : ajouter champs name, role, avatar, phone
- [x] 2.2 — Definir API rules sur `users`
- [x] 2.3 — Creer collection `companies` avec tous les champs
- [x] 2.4 — API rules sur `companies`
- [x] 2.5 — Creer collection `contacts` avec tous les champs + relations company/owner
- [x] 2.6 — API rules sur `contacts`
- [x] 2.7 — Creer collection `leads` avec les 7 statuts pipeline + relations
- [x] 2.8 — API rules sur `leads`
- [x] 2.9 — Creer collection `tasks` avec relations assignee/created_by/contact/lead/company
- [x] 2.10 — API rules sur `tasks`
- [x] 2.11 — Creer collection `email_templates`
- [x] 2.12 — API rules sur `email_templates`
- [x] 2.13 — Creer collection `email_logs` (ecriture hook-only)
- [x] 2.14 — API rules sur `email_logs`
- [x] 2.15 — Creer collection `activities` (ecriture hook-only)
- [x] 2.16 — API rules sur `activities`
- [x] 2.17 — Exporter le schema en migrations dans `backend/pb_migrations/`
- [x] 2.18 — Creer donnees de test : 3 users, 5 companies, 10 contacts, 5 leads, 5 tasks
- [x] 2.19 — Verifier les relations avec les expand queries
- [x] 2.20 — Commit

---

## Phase 3 : Composants Frontend de Base

### 3A — Configuration de base et types TypeScript
- [ ] 3.1 — Creer `src/types/models.ts` : interfaces TS pour toutes les entites
- [ ] 3.2 — Creer `src/types/pocketbase.ts` : types expand PB, ListResult, RecordModel
- [ ] 3.3 — Creer `src/lib/pocketbase.ts` : singleton SDK type
- [ ] 3.4 — Configurer Pinia dans `main.ts`
- [ ] 3.5 — Configurer i18n dans `src/i18n/index.ts`
- [ ] 3.6 — Creer `src/i18n/fr.json` : traductions francaises
- [ ] 3.7 — Creer `src/i18n/en.json` : traductions anglaises
- [ ] 3.8 — Enregistrer vue-i18n dans `main.ts`

### 3B — Layout et Navigation
- [ ] 3.9 — Configurer Vue Router (`router/index.ts`) avec types RouteMeta
- [ ] 3.10 — `AppLayout.vue` : sidebar + topbar + router-view
- [ ] 3.11 — `AppSidebar.vue` : navigation i18n + visibilite par role
- [ ] 3.12 — `AppTopbar.vue` : breadcrumb, search, user dropdown
- [ ] 3.13 — `LocaleSwitcher.vue` : basculer FR/EN
- [ ] 3.14 — `AppBreadcrumb.vue`

### 3C — Composants UI reutilisables
- [ ] 3.15 — `BaseButton.vue`
- [ ] 3.16 — `BaseInput.vue`
- [ ] 3.17 — `BaseSelect.vue`
- [ ] 3.18 — `BaseModal.vue`
- [ ] 3.19 — `BaseTable.vue`
- [ ] 3.20 — `BaseCard.vue`
- [ ] 3.21 — `BaseBadge.vue`
- [ ] 3.22 — `BaseAlert.vue`
- [ ] 3.23 — `BasePagination.vue`
- [ ] 3.24 — `BaseSearchFilter.vue`

### 3D — Theme et structure
- [ ] 3.25 — Theme Tailwind (couleurs CRM + pipeline)
- [ ] 3.26 — Stub views pour toutes les routes
- [ ] 3.27 — Wirer `App.vue` : AppLayout / layout nu
- [ ] 3.28 — Verifier navigation, responsive, switch FR/EN
- [ ] 3.29 — Commit

---

## Phase 4 : Auth & Integration API

- [ ] 4.1 — `stores/auth.ts` : state, computed, actions
- [ ] 4.2 — Implementer `login()`
- [ ] 4.3 — Implementer `register()`
- [ ] 4.4 — Implementer `logout()`
- [ ] 4.5 — Persistance auth
- [ ] 4.6 — `LoginView.vue`
- [ ] 4.7 — `RegisterView.vue`
- [ ] 4.8 — Navigation guard `router.beforeEach()`
- [ ] 4.9 — Composable `useAuth.ts`
- [ ] 4.10 — Mettre a jour Sidebar/Topbar avec role
- [ ] 4.11 — Composable generique `useCollection.ts`
- [ ] 4.12 — Intercepteur erreurs SDK 401
- [ ] 4.13 — Tester le flow complet auth
- [ ] 4.14 — Commit

---

## Phase 5 : Vues Metier

### 5A — Contacts
- [ ] 5.1 — `stores/contacts.ts`
- [ ] 5.2 — `composables/useContacts.ts`
- [ ] 5.3 — `ContactList.vue`
- [ ] 5.4 — `ContactForm.vue`
- [ ] 5.5 — `ContactDetail.vue`
- [ ] 5.6 — `ContactsView.vue`

### 5B — Entreprises
- [ ] 5.7 — `stores/companies.ts`
- [ ] 5.8 — `composables/useCompanies.ts`
- [ ] 5.9 — `CompanyList.vue`
- [ ] 5.10 — `CompanyForm.vue`
- [ ] 5.11 — `CompanyDetail.vue`
- [ ] 5.12 — `CompaniesView.vue`

### 5C — Taches
- [ ] 5.13 — `stores/tasks.ts`
- [ ] 5.14 — `composables/useTasks.ts`
- [ ] 5.15 — `TaskList.vue`
- [ ] 5.16 — `TaskForm.vue`
- [ ] 5.17 — `TaskCalendar.vue`
- [ ] 5.18 — `TaskReminder.vue`
- [ ] 5.19 — `TasksView.vue`

### 5D — Leads & Pipeline
- [ ] 5.20 — `stores/leads.ts`
- [ ] 5.21 — `composables/useLeads.ts`
- [ ] 5.22 — `LeadList.vue`
- [ ] 5.23 — `LeadForm.vue`
- [ ] 5.24 — `LeadDetail.vue`
- [ ] 5.25 — `PipelineBoard.vue` (Kanban drag-and-drop)
- [ ] 5.26 — `LeadsView.vue`
- [ ] 5.27 — `PipelineView.vue`
- [ ] 5.28 — Realtime PocketBase sur leads
- [ ] 5.29 — Tester tous les CRUD, expands, roles, i18n
- [ ] 5.30 — Commit

---

## Phase 6 : Automatisation Email

- [ ] 6.1 — Configurer SMTP dans PocketBase Admin
- [ ] 6.2 — `EmailTemplateEditor.vue`
- [ ] 6.3 — `EmailCampaignList.vue`
- [ ] 6.4 — `EmailView.vue` (onglets Modeles + Historique)
- [ ] 6.5 — Bouton "Envoyer Email" sur ContactDetail
- [ ] 6.6 — Action frontend appel route custom
- [ ] 6.7 — **Go** `backend/hooks/email.go` : route POST /api/crm/send-email
- [ ] 6.8 — **Go** `backend/services/email_service.go`
- [ ] 6.9 — **Go** `backend/hooks/leads.go` : hooks lifecycle
- [ ] 6.10 — **Go** Hook welcome email
- [ ] 6.11 — **Go** Hook notification assignation lead
- [ ] 6.12 — Enregistrer hooks dans `main.go`
- [ ] 6.13 — Tester tous les flux email
- [ ] 6.14 — Commit

---

## Phase 7 : Dashboard Analytique

- [ ] 7.1 — Installer chart.js + vue-chartjs
- [ ] 7.2 — `stores/dashboard.ts`
- [ ] 7.3 — `composables/useDashboard.ts`
- [ ] 7.4 — Calculs KPI
- [ ] 7.5 — (Optionnel) Route Go GET /api/crm/dashboard-stats
- [ ] 7.6 — `KpiCard.vue`
- [ ] 7.7 — `RevenueChart.vue`
- [ ] 7.8 — `ConversionFunnel.vue`
- [ ] 7.9 — `ActivityFeed.vue`
- [ ] 7.10 — `DashboardView.vue`
- [ ] 7.11 — Squelettes de chargement
- [ ] 7.12 — Auto-refresh + refresh manuel
- [ ] 7.13 — Tester avec donnees seed
- [ ] 7.14 — Commit

---

## Phase 8 : Deploiement, Tests & Polish

### 8A — Docker Production
- [ ] 8.1 — `frontend/Dockerfile` production multi-stage
- [ ] 8.2 — `frontend/nginx.conf`
- [ ] 8.3 — Optimiser `backend/Dockerfile` production
- [ ] 8.4 — `docker-compose.prod.yml`
- [ ] 8.5 — Volume Docker nomme pb_data
- [ ] 8.6 — Injection VITE_PB_URL
- [ ] 8.7 — Tester build production

### 8B — Tests
- [ ] 8.8 — Installer vitest, @vue/test-utils, jsdom
- [ ] 8.9 — Configurer Vitest
- [ ] 8.10 — Tests auth store
- [ ] 8.11 — Tests composants UI
- [ ] 8.12 — Tests pipeline
- [ ] 8.13 — Tests integration
- [ ] 8.14 — Tests i18n completude
- [ ] 8.15 — Scripts npm test
- [ ] 8.16 — Executer tous les tests

### 8C — Polish UX
- [ ] 8.17 — Toast notifications i18n
- [ ] 8.18 — Confirmation suppression i18n
- [ ] 8.19 — Etats vides i18n
- [ ] 8.20 — Validation formulaires i18n
- [ ] 8.21 — Responsive mobile/tablet/desktop
- [ ] 8.22 — Raccourcis clavier
- [ ] 8.23 — `SettingsView.vue` (profil + gestion users + langue)
- [ ] 8.24 — Persister preference langue localStorage
- [ ] 8.25 — Favicon et titre app
- [ ] 8.26 — README.md complet
- [ ] 8.27 — Revue finale
- [ ] 8.28 — Commit final
