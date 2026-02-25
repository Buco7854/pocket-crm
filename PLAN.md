# Pocket-CRM — Plan de Developpement Complet

## Contexte

Projet d'etudes : CRM web. Ce document sert de tracker de progression — cocher `[x]` au fur et a mesure.

**Stack** : React 19 + TypeScript + Tailwind CSS 4 + Vite 7 | Zustand (state) | React Router v7 | react-i18next (i18n FR/EN) | lucide-react (icons) | PocketBase **en tant que framework Go** (binaire custom) | Docker

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
    ├── package.json / vite.config.ts / tsconfig.json / tsconfig.app.json
    └── src/
        ├── main.tsx / App.tsx
        ├── router/index.tsx              # React Router v7 (createBrowserRouter)
        ├── lib/pocketbase.ts             # SDK singleton type
        ├── types/
        │   ├── models.ts                 # Interfaces TS (User, Contact, Company, Lead, Task, etc.)
        │   └── pocketbase.ts             # Types expand PocketBase
        ├── i18n/
        │   ├── index.ts                  # Config react-i18next
        │   ├── fr.json                   # Traductions francaises
        │   └── en.json                   # Traductions anglaises
        ├── store/
        │   └── authStore.ts              # Zustand auth store
        ├── hooks/                        # useAuth, useTheme, useCollection, etc.
        ├── components/
        │   ├── layout/   (AppLayout, AppSidebar, AppTopbar, AppBreadcrumb, ThemeSwitcher, LocaleSwitcher)
        │   ├── ui/       (Button, Input, Select, Modal, Table, Card, Badge, Alert, Pagination, SearchFilter)
        │   ├── contacts/ (ContactList, ContactForm, ContactDetail)
        │   ├── companies/(CompanyList, CompanyForm, CompanyDetail)
        │   ├── leads/    (LeadList, LeadForm, LeadDetail, PipelineBoard)
        │   ├── tasks/    (TaskList, TaskForm, TaskCalendar, TaskReminder)
        │   ├── dashboard/(KpiCard, RevenueChart, ConversionFunnel, ActivityFeed)
        │   └── email/    (EmailTemplateEditor, EmailCampaignList)
        └── pages/        (LoginPage, RegisterPage, DashboardPage, ContactsPage, CompaniesPage, LeadsPage, PipelinePage, TasksPage, EmailPage, SettingsPage)
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
- [x] 1.9 — **Frontend React 19 + TS** : scaffolded avec Vite 7 (`@vitejs/plugin-react`)
- [x] 1.10 — `cd frontend && npm install`
- [x] 1.11 — Installer Tailwind CSS 4 (`tailwindcss @tailwindcss/vite`) + config
- [x] 1.12 — Configurer Tailwind dans `src/style.css` (CSS custom properties, theme tokens)
- [x] 1.13 — Installer PocketBase JS SDK : `npm install pocketbase`
- [x] 1.14 — Installer Zustand : `npm install zustand`
- [x] 1.15 — Installer React Router : `npm install react-router-dom`
- [x] 1.16 — Installer react-i18next : `npm install react-i18next i18next`
- [x] 1.17 — Installer lucide-react : `npm install lucide-react`
- [x] 1.18 — Configurer `tsconfig.app.json` (paths aliases `@/` -> `src/`, jsx: react-jsx, strict mode)
- [x] 1.19 — Ecrire `docker-compose.yml` (services pocketbase + frontend, ports, volumes)
- [x] 1.20 — Configurer `vite.config.ts` (proxy /api et /_ -> pocketbase:8090, alias @/)
- [x] 1.21 — Verifier : PocketBase Admin sur :8090/_/, React dev sur :3000
- [x] 1.22 — Creer superuser PocketBase via CLI
- [x] 1.23 — Commit initial

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
- [x] 3.1 — Creer `src/types/models.ts` : interfaces TS pour toutes les entites
- [x] 3.2 — Creer `src/types/pocketbase.ts` : types expand PB, ListResult, RecordModel
- [x] 3.3 — Creer `src/lib/pocketbase.ts` : singleton SDK type
- [x] 3.4 — Configurer Zustand store dans `src/store/authStore.ts`
- [x] 3.5 — Configurer i18n dans `src/i18n/index.ts` (react-i18next)
- [x] 3.6 — Creer `src/i18n/fr.json` : traductions francaises
- [x] 3.7 — Creer `src/i18n/en.json` : traductions anglaises
- [x] 3.8 — Enregistrer I18nextProvider dans `main.tsx`

### 3B — Layout et Navigation
- [x] 3.9 — Configurer React Router (`router/index.tsx`) avec createBrowserRouter, route guards (RequireAuth, RequireGuest, RequireRole)
- [x] 3.10 — `AppLayout.tsx` : sidebar + topbar + Outlet
- [x] 3.11 — `AppSidebar.tsx` : navigation i18n + visibilite par role (lucide-react icons)
- [x] 3.12 — `AppTopbar.tsx` : breadcrumb, search, user dropdown
- [x] 3.13 — `ThemeSwitcher.tsx` : dropdown Light/Dark/System
- [x] 3.14 — `LocaleSwitcher.tsx` : dropdown FR/EN
- [x] 3.15 — `AppBreadcrumb.tsx` : useMatches() + handle.breadcrumb

### 3C — Composants UI reutilisables
- [x] 3.16 — `Button.tsx`
- [x] 3.17 — `Input.tsx`
- [x] 3.18 — `Select.tsx`
- [x] 3.19 — `Modal.tsx` (createPortal)
- [x] 3.20 — `Table.tsx`
- [x] 3.21 — `Card.tsx`
- [x] 3.22 — `Badge.tsx`
- [x] 3.23 — `Alert.tsx`
- [x] 3.24 — `Pagination.tsx`
- [x] 3.25 — `SearchFilter.tsx`

### 3D — Theme et structure
- [x] 3.26 — Theme CSS custom properties (couleurs CRM + pipeline + dark mode classic gray)
- [x] 3.27 — Stub pages pour toutes les routes (React.lazy + Suspense)
- [x] 3.28 — Wirer `App.tsx` : RouterProvider
- [x] 3.29 — Verifier navigation, responsive, switch FR/EN, switch theme
- [x] 3.30 — Commit

---

## Phase 4 : Auth & Integration API

- [x] 4.1 — `store/authStore.ts` : state, derived (isAuthenticated, userRole, isAdmin, isCommercial, userInitials), actions
- [x] 4.2 — Implementer `login()`
- [x] 4.3 — Implementer `register()`
- [x] 4.4 — Implementer `logout()`
- [x] 4.5 — Persistance auth (pb.authStore.onChange listener dans Zustand init)
- [x] 4.6 — `LoginPage.tsx`
- [x] 4.7 — `RegisterPage.tsx`
- [x] 4.8 — Route guards : RequireAuth, RequireGuest, RequireRole (wrapper components)
- [x] 4.9 — Hook `useAuth.ts` (wraps Zustand + useNavigate)
- [x] 4.10 — Mettre a jour Sidebar/Topbar avec role
- [x] 4.11 — Hook generique `useCollection.ts` (CRUD PocketBase)
- [x] 4.12 — Intercepteur erreurs SDK 401
- [x] 4.13 — Tester le flow complet auth
- [x] 4.14 — Commit

---

## Phase 5 : Pages Metier

### 5A — Contacts
- [x] 5.1 — Hook `useContacts.ts`
- [x] 5.2 — `ContactList.tsx`
- [x] 5.3 — `ContactForm.tsx`
- [x] 5.4 — `ContactDetail.tsx`
- [x] 5.5 — `ContactsPage.tsx` — integration complete

### 5B — Entreprises
- [x] 5.6 — Hook `useCompanies.ts`
- [x] 5.7 — `CompanyList.tsx`
- [x] 5.8 — `CompanyForm.tsx`
- [x] 5.9 — `CompanyDetail.tsx`
- [x] 5.10 — `CompaniesPage.tsx`

### 5C — Taches
- [x] 5.11 — Hook `useTasks.ts`
- [x] 5.12 — `TaskList.tsx`
- [x] 5.13 — `TaskForm.tsx`
- [x] 5.14 — `TaskDetail.tsx`
- [x] 5.15 — `TasksPage.tsx`

### 5D — Leads & Pipeline
- [x] 5.16 — Hook `useLeads.ts`
- [x] 5.17 — `LeadList.tsx`
- [x] 5.18 — `LeadForm.tsx`
- [x] 5.19 — `LeadDetail.tsx`
- [x] 5.20 — `PipelineBoard.tsx` (Kanban drag-and-drop HTML5 natif)
- [x] 5.21 — `LeadsPage.tsx`
- [x] 5.22 — `PipelinePage.tsx`
- [ ] 5.23 — Realtime PocketBase sur leads
- [ ] 5.24 — Tester tous les CRUD, expands, roles, i18n
- [ ] 5.25 — Commit

---

## Phase 6 : Automatisation Email

- [ ] 6.1 — Configurer SMTP dans PocketBase Admin
- [ ] 6.2 — `EmailTemplateEditor.tsx`
- [ ] 6.3 — `EmailCampaignList.tsx`
- [ ] 6.4 — `EmailPage.tsx` (onglets Modeles + Historique)
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

- [ ] 7.1 — Installer recharts (ou chart.js + react-chartjs-2)
- [ ] 7.2 — Hook `useDashboard.ts`
- [ ] 7.3 — Calculs KPI
- [ ] 7.4 — (Optionnel) Route Go GET /api/crm/dashboard-stats
- [ ] 7.5 — `KpiCard.tsx`
- [ ] 7.6 — `RevenueChart.tsx`
- [ ] 7.7 — `ConversionFunnel.tsx`
- [ ] 7.8 — `ActivityFeed.tsx`
- [ ] 7.9 — `DashboardPage.tsx` — integration complete
- [ ] 7.10 — Squelettes de chargement (Skeleton)
- [ ] 7.11 — Auto-refresh + refresh manuel
- [ ] 7.12 — Tester avec donnees seed
- [ ] 7.13 — Commit

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
- [ ] 8.8 — Installer vitest, @testing-library/react, jsdom
- [ ] 8.9 — Configurer Vitest
- [ ] 8.10 — Tests auth store (Zustand)
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
- [ ] 8.23 — `SettingsPage.tsx` (profil + gestion users + langue)
- [ ] 8.24 — Persister preference langue localStorage
- [ ] 8.25 — Favicon et titre app
- [ ] 8.26 — README.md complet
- [ ] 8.27 — Revue finale
- [ ] 8.28 — Commit final
