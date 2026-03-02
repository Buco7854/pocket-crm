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
├── docker-compose.prod.yml
├── .env / .env.example / .gitignore / README.md
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI/CD pipeline
│
├── docs/                        # Rapport de projet & livrables documentaires
│   ├── rapport.md               # Rapport de projet complet
│   ├── analyse-besoins.md       # Analyse des besoins
│   ├── use-case-diagram.png     # Diagramme UML Use Case
│   ├── mcd-diagram.png          # Modele Conceptuel de Donnees (Merise)
│   ├── architecture.md          # Architecture technique + diagramme
│   ├── fonctionnalites.md       # Description des fonctionnalites
│   └── workflow-pipeline.md     # Justification du workflow et pipeline choisis
│
├── backend/
│   ├── main.go                # Point d'entree Go custom (importe PocketBase comme lib)
│   ├── go.mod / go.sum
│   ├── Dockerfile             # Build Go multi-stage
│   ├── hooks/
│   │   ├── email.go           # Routes/hooks custom email
│   │   ├── leads.go           # Hooks lifecycle leads + activities
│   │   ├── tasks.go           # Hooks rappels taches
│   │   └── invoices.go        # Hooks facturation
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
        │   ├── models.ts                 # Interfaces TS (User, Contact, Company, Lead, Task, Invoice, etc.)
        │   └── pocketbase.ts             # Types expand PocketBase
        ├── i18n/
        │   ├── index.ts                  # Config react-i18next
        │   ├── fr.json                   # Traductions francaises
        │   └── en.json                   # Traductions anglaises
        ├── store/
        │   └── authStore.ts              # Zustand auth store
        ├── hooks/                        # useAuth, useTheme, useCollection, useInvoices, etc.
        ├── components/
        │   ├── layout/   (AppLayout, AppSidebar, AppTopbar, AppBreadcrumb, ThemeSwitcher, LocaleSwitcher)
        │   ├── ui/       (Button, Input, Select, Modal, Table, Card, Badge, Alert, Pagination, SearchFilter)
        │   ├── contacts/ (ContactList, ContactForm, ContactDetail)
        │   ├── companies/(CompanyList, CompanyForm, CompanyDetail)
        │   ├── leads/    (LeadList, LeadForm, LeadDetail, PipelineBoard)
        │   ├── tasks/    (TaskList, TaskForm, TaskCalendar, TaskReminder)
        │   ├── invoices/ (InvoiceList, InvoiceForm, InvoiceDetail)
        │   ├── dashboard/(KpiCard, RevenueChart, ConversionFunnel, ActivityFeed,
        │   │              SalesStats, ClientStats, CommercialLeaderboard,
        │   │              MarketingStats, FinancialStats)
        │   └── email/    (EmailTemplateEditor, EmailCampaignList, EmailStats)
        └── pages/        (LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage,
                           DashboardPage, ContactsPage, CompaniesPage, LeadsPage,
                           PipelinePage, TasksPage, InvoicesPage, EmailPage, SettingsPage)
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

### `invoices`
| Champ | Type | Notes |
|-------|------|-------|
| number | TextField | Required, unique (ex: FAC-2026-001) |
| contact | Relation -> contacts | Client facture |
| company | Relation -> companies | Entreprise facturee |
| lead | Relation -> leads | Lead associe (optionnel) |
| owner | Relation -> users | Commercial responsable |
| amount | NumberField | Montant HT |
| tax_rate | NumberField | Taux TVA (%) |
| total | NumberField | Montant TTC |
| status | SelectField | `brouillon`, `emise`, `payee`, `en_retard`, `annulee` |
| issued_at | DateField | Date d'emission |
| due_at | DateField | Date d'echeance |
| paid_at | DateField | Date de paiement effectif |
| items | JSONField | Lignes de facture [{description, qty, unit_price}] |
| notes | EditorField | Optional |

### `email_templates`
name, subject, body (EditorField), type (marketing/transactionnel/relance/bienvenue), active (bool), created_by -> users

### `email_logs`
template -> email_templates, recipient_email, recipient_contact -> contacts, subject, status (envoye/echoue/en_attente/ouvert/clique), sent_at, opened_at, clicked_at, open_count (NumberField), click_count (NumberField), error_message, sent_by -> users, campaign_id (TextField, optionnel — pour grouper les envois d'une campagne). **Ecriture par hooks Go uniquement.**

### `activities`
type (creation/modification/email/appel/note/statut_change), description, user -> users, contact/lead/company (optionnels), metadata (JSON). **Ecriture par hooks Go uniquement.**

### Regles API (resume)
- **Lecture** : tout utilisateur authentifie
- **Creation contacts/companies/leads/invoices** : admin ou commercial
- **Creation tasks** : tout authentifie
- **Modification** : admin ou owner/assignee
- **Suppression** : admin uniquement
- **email_logs / activities** : lecture seule (ecriture par hooks Go)
- **invoices** : creation/modification admin ou commercial owner ; suppression admin uniquement

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
- [x] 4.13 — `ForgotPasswordPage.tsx` : formulaire demande de reinitialisation mot de passe (pb.collection('users').requestPasswordReset)
- [x] 4.14 — `ResetPasswordPage.tsx` : formulaire saisie nouveau mot de passe (pb.collection('users').confirmPasswordReset)
- [x] 4.15 — Ajouter lien "Mot de passe oublie ?" sur LoginPage
- [x] 4.16 — Routes /forgot-password et /reset-password dans le router
- [x] 4.17 — Tester le flow complet auth
- [x] 4.18 — Commit

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
- [x] 5.15b — `TaskCalendar.tsx` : vue calendrier mensuel/hebdomadaire des taches et RDV
- [x] 5.15c — `TaskReminder.tsx` : composant notifications echeances proches + taches en retard
- [x] 5.15d — Integrer calendrier et rappels dans `TasksPage.tsx` (onglets Liste / Calendrier)

### 5D — Leads & Pipeline
- [x] 5.16 — Hook `useLeads.ts`
- [x] 5.17 — `LeadList.tsx`
- [x] 5.18 — `LeadForm.tsx`
- [x] 5.19 — `LeadDetail.tsx`
- [x] 5.20 — `PipelineBoard.tsx` (Kanban drag-and-drop HTML5 natif)
- [x] 5.21 — `LeadsPage.tsx`
- [x] 5.22 — `PipelinePage.tsx`
- [x] 5.23 — Realtime PocketBase sur leads
- [x] 5.24 — Tester tous les CRUD, expands, roles, i18n
- [x] 5.25 — Commit

### 5E — Factures (Invoices)
- [x] 5.26 — Creer collection `invoices` dans PocketBase (migration)
- [x] 5.27 — API rules sur `invoices`
- [x] 5.28 — Ajouter interface `Invoice` dans `src/types/models.ts`
- [x] 5.29 — Hook `useInvoices.ts`
- [x] 5.30 — `InvoiceList.tsx` : liste des factures avec filtres (statut, date, client)
- [x] 5.31 — `InvoiceForm.tsx` : creation/edition facture avec lignes dynamiques
- [x] 5.32 — `InvoiceDetail.tsx` : detail facture avec bouton marquer payee
- [x] 5.33 — `InvoicesPage.tsx` — integration complete
- [x] 5.34 — Route /invoices dans le router + lien sidebar
- [x] 5.35 — **Go** `backend/hooks/invoices.go` : hook auto-calcul total TTC, hook alerte facture en retard
- [x] 5.36 — Donnees de test : 5-10 factures variees (brouillon, emise, payee, en retard)
- [x] 5.37 — Commit

---

## Phase 6 : Automatisation Email & Suivi Performance

### 6A — Envoi d'emails
- [x] 6.1 — Configurer SMTP dans PocketBase Admin (Brevo ou autre)
- [x] 6.2 — `EmailTemplateEditor.tsx` : editeur de modeles email personnalisables
- [x] 6.3 — `EmailCampaignList.tsx` : liste des campagnes avec statuts
- [x] 6.4 — `EmailPage.tsx` (onglets Modeles + Campagnes + Historique + Statistiques)
- [x] 6.5 — Bouton "Envoyer Email" sur ContactDetail
- [x] 6.6 — Action frontend appel route custom
- [x] 6.7 — **Go** `backend/hooks/email.go` : route POST /api/crm/send-email
- [x] 6.8 — **Go** `backend/services/email_service.go`
- [x] 6.9 — **Go** `backend/hooks/leads.go` : hooks lifecycle (creation activity auto)
- [x] 6.10 — **Go** Hook welcome email a l'inscription
- [x] 6.11 — **Go** Hook notification assignation lead
- [x] 6.12 — **Go** Route POST /api/crm/send-campaign : envoi en masse a une liste de contacts
- [x] 6.13 — Enregistrer hooks dans `main.go`

### 6B — Suivi et analyse des performances email
- [x] 6.14 — **Go** Route GET /api/crm/email/track-open/:logId : pixel tracking ouverture (met a jour opened_at, open_count dans email_logs)
- [x] 6.15 — **Go** Route GET /api/crm/email/track-click/:logId : redirect tracking clic (met a jour clicked_at, click_count dans email_logs)
- [x] 6.16 — Injecter pixel tracking et liens trackes dans les emails envoyes (email_service.go)
- [x] 6.17 — `EmailStats.tsx` : composant statistiques campagne (taux ouverture, taux clic, bounces)
- [x] 6.18 — **Go** Route GET /api/crm/email/campaign-stats/:campaignId : stats agregees par campagne
- [x] 6.19 — Integrer EmailStats dans EmailPage (onglet Statistiques)
- [x] 6.20 — Tester tous les flux email (envoi unitaire, campagne, tracking, stats)
- [x] 6.21 — Commit

---

## Phase 7 : Dashboard Analytique & Statistiques Completes

### 7A — Infrastructure dashboard
- [x] 7.1 — Installer recharts (ou chart.js + react-chartjs-2)
- [x] 7.2 — Hook `useDashboard.ts` : appels API stats + state
- [x] 7.3 — **Go** Route GET /api/crm/stats/dashboard : calculs agreg. cote serveur (CA, conversions, pipeline, etc.)
- [x] 7.4 — `KpiCard.tsx` : composant carte KPI reutilisable (valeur, evolution, icone, couleur)
- [x] 7.5 — Squelettes de chargement (Skeleton) pour tous les widgets
- [x] 7.6 — Auto-refresh + refresh manuel + filtre periode (semaine / mois / trimestre / annee)

### 7B — Dashboard intelligent (page d'accueil)
- [x] 7.7 — Widget CA du mois en cours
- [x] 7.8 — Widget evolution CA vs mois precedent (% et fleche)
- [x] 7.9 — Widget objectif atteint (%) avec barre de progression
- [x] 7.10 — Widget nouveaux prospects du mois
- [x] 7.11 — Widget RDV du jour (liste des taches type reunion pour aujourd'hui)
- [x] 7.12 — Widget taches urgentes / en retard
- [x] 7.13 — `ActivityFeed.tsx` : flux d'activite recente (derniers evenements)
- [x] 7.14 — `DashboardPage.tsx` — integration de tous les widgets

### 7C — Statistiques commerciales (Ventes)
- [x] 7.15 — `SalesStats.tsx` : composant page stats commerciales
- [x] 7.16 — CA total par periode (mois / trimestre / annee) avec graphique evolution
- [x] 7.17 — CA par commercial (graphique barres)
- [x] 7.18 — Pipeline : nombre d'opportunites, montant total, repartition par etape (graphique barres empilees)
- [x] 7.19 — `ConversionFunnel.tsx` : funnel de conversion visuel (Prospect -> Qualifie -> Proposition -> Negoce -> Gagne)
- [x] 7.20 — Taux de conversion (Prospect -> Client, Proposition -> Vente, delai moyen de transformation)
- [x] 7.21 — `RevenueChart.tsx` : graphique evolution CA dans le temps (line chart)

### 7D — Statistiques clients
- [x] 7.22 — `ClientStats.tsx` : composant page stats clients
- [x] 7.23 — Nombre total de clients, nouveaux clients par periode, clients actifs/inactifs
- [x] 7.24 — Segmentation clients : par ville, par secteur d'activite (industry), par taille d'entreprise
- [x] 7.25 — Panier moyen (montant moyen des leads gagnes par client)
- [x] 7.26 — Lifetime Value (LTV) : valeur totale par client (somme leads gagnes + factures payees)
- [x] 7.27 — Top clients les plus rentables (classement)

### 7E — Performance des commerciaux
- [x] 7.28 — `CommercialLeaderboard.tsx` : classement des commerciaux
- [x] 7.29 — Nombre d'appels, RDV, emails par commercial (via activities)
- [x] 7.30 — Nombre de ventes (leads gagnes) par commercial
- [x] 7.31 — Taux de reussite par commercial (leads gagnes / leads totaux)
- [ ] 7.32 — Objectifs vs Realise (si objectifs definis dans settings)
- [x] 7.33 — Leaderboard : classement type tableau des scores

### 7F — Statistiques financieres
- [x] 7.34 — `FinancialStats.tsx` : composant page stats financieres
- [x] 7.35 — Nombre de factures emises / payees / en retard / annulees
- [x] 7.36 — Montant total factures payees vs impayees (graphique camembert)
- [x] 7.37 — Delai moyen de paiement (jours entre emission et paiement)
- [x] 7.38 — Previsions de revenus : leads en cours ponderes par probabilite (basee sur etape pipeline)

### 7G — Statistiques marketing
- [x] 7.39 — `MarketingStats.tsx` : composant page stats marketing
- [x] 7.40 — Nombre de leads generes par periode
- [x] 7.41 — Source des leads (graphique camembert : site_web, email, telephone, salon, recommandation, autre)
- [x] 7.42 — Cout par lead (si champ budget renseigne sur campagnes)
- [x] 7.43 — ROI des campagnes email (leads generes vs emails envoyes)
- [x] 7.44 — Taux d'ouverture et taux de clic emails (depuis email_logs)

### 7H — Integration et finalisation
- [x] 7.45 — Page `/stats` ou onglets dans DashboardPage regroupant toutes les categories
- [x] 7.46 — Navigation entre les sections de stats (onglets ou sous-pages)
- [x] 7.48 — Tester avec donnees seed (verifier coherence des chiffres)
- [x] 7.49 — Commit

---

## Phase 8 : Deploiement, CI/CD, Tests & Polish

### 8A — Docker Production
- [x] 8.1 — `frontend/Dockerfile` production multi-stage
- [x] 8.2 — `frontend/nginx.conf`
- [x] 8.3 — Optimiser `backend/Dockerfile` production
- [x] 8.4 — `docker-compose.prod.yml`
- [x] 8.5 — Volume Docker nomme pb_data
- [x] 8.6 — Injection VITE_PB_URL
- [ ] 8.7 — Tester build production

### 8B — CI/CD Pipeline (15% de la note)
- [x] 8.8 — Creer `.github/workflows/ci.yml` : pipeline GitHub Actions
- [x] 8.9 — Job lint : ESLint sur le frontend (npm run lint)
- [x] 8.10 — Job test : Vitest (npm run test)
- [x] 8.11 — Job build : build frontend (npm run build) + build Go backend
- [x] 8.12 — Job deploy : deploiement automatique sur push branche main (Docker build + push ou Vercel/autre)
- [x] 8.13 — Badges CI/CD dans le README (build status)
- [x] 8.14 — Strategie de branches documentee (main = production, develop = pre-production, feature branches)

### 8C — Tests
- [x] 8.15 — Installer vitest, @testing-library/react, jsdom
- [x] 8.16 — Configurer Vitest
- [x] 8.17 — Tests auth store (Zustand)
- [x] 8.18 — Tests composants UI
- [x] 8.19 — Tests pipeline
- [x] 8.20 — Tests integration
- [x] 8.21 — Tests i18n completude
- [x] 8.22 — Scripts npm test
- [x] 8.23 — Executer tous les tests

### 8D — Polish UX
- [x] 8.24 — Toast notifications i18n
- [x] 8.25 — Confirmation suppression i18n
- [x] 8.26 — Etats vides i18n
- [x] 8.27 — Validation formulaires i18n
- [x] 8.28 — Responsive mobile/tablet/desktop
- [ ] 8.29 — Raccourcis clavier
- [x] 8.30 — `SettingsPage.tsx` (profil + gestion users + langue)
- [x] 8.31 — Persister preference langue localStorage
- [x] 8.32 — Favicon et titre app
- [x] 8.33 — README.md complet (instructions installation, screenshots, stack, diagrammes)
- [x] 8.34 — Revue finale code + securite
- [x] 8.35 — Commit

---

## Phase 9 : Rapport de Projet & Documentation (10% de la note)

### 9A — Analyse et modelisation
- [ ] 9.1 — Rediger l'analyse des besoins (`docs/analyse-besoins.md`) : contexte entreprise, problematique, objectifs
- [ ] 9.2 — Diagramme UML Use Case (`docs/use-case-diagram.png`) : acteurs (admin, commercial, standard) et cas d'utilisation
- [ ] 9.3 — Modele Conceptuel de Donnees Merise MCD (`docs/mcd-diagram.png`) : entites, associations, cardinalites
- [ ] 9.4 — Architecture technique (`docs/architecture.md`) : diagramme architecture (frontend, backend, BDD, services externes) + justification des choix

### 9B — Documentation fonctionnelle
- [ ] 9.5 — Description des fonctionnalites (`docs/fonctionnalites.md`) : chaque module detaille avec captures d'ecran
- [ ] 9.6 — Documentation du workflow et pipeline de ventes choisis (`docs/workflow-pipeline.md`) : justification des etapes, originalite (bonus 5-10%)
- [ ] 9.7 — Documentation technique dans le code : commentaires pertinents sur les parties complexes

### 9C — Rapport final
- [ ] 9.8 — Assembler le rapport complet (`docs/rapport.md`) : table des matieres, toutes les sections ci-dessus
- [ ] 9.9 — Relecture et mise en forme
- [ ] 9.10 — Commit documentation

---

## Phase 10 : Presentation & Livraison

- [ ] 10.1 — Preparer le jeu de test complet : scenarios realistes (creation contacts, passage leads dans le pipeline, envoi emails, generation factures)
- [ ] 10.2 — Peupler la BDD avec des donnees de demonstration convaincantes
- [ ] 10.3 — Preparer la presentation orale : slides (contexte, demo, architecture, bilan)
- [ ] 10.4 — Enregistrer une courte video de demonstration du CRM et du workflow choisi
- [ ] 10.5 — Verifier le lien vers l'application deployee
- [ ] 10.6 — Verifier que le depot GitHub est complet et propre (README, .env.example, pas de secrets)
- [ ] 10.7 — Tag de release finale sur GitHub
- [ ] 10.8 — Commit final
