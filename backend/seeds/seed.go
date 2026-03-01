package seeds

import (
	"fmt"
	"log"

	"github.com/pocketbase/pocketbase/core"
)

// collectionsToWipe lists all seeded collections in deletion-safe order
// (most dependent first to avoid FK conflicts).
var collectionsToWipe = []string{
	"campaign_runs", "campaigns", "email_logs", "email_templates",
	"activities", "tasks", "invoices", "leads", "contacts", "companies", "users",
}

// Run populates the database with rich test data producing interesting analytics.
// Today: 2026-02-28. Data spans Nov 2024 → Feb 2026 for realistic trend charts.
func Run(app core.App, force bool) error {
	existing, _ := app.CountRecords("users")
	if existing > 0 {
		if !force {
			return fmt.Errorf("database already contains %d users — aborting (use --force to overwrite)", existing)
		}
		log.Println("[seed] --force: wiping existing data…")
		for _, col := range collectionsToWipe {
			records, err := app.FindAllRecords(col)
			if err != nil {
				continue // collection may not exist yet
			}
			for _, r := range records {
				if err := app.Delete(r); err != nil {
					log.Printf("[seed] delete %s/%s: %v", col, r.Id, err)
				}
			}
			log.Printf("[seed] wiped %d records from %s", len(records), col)
		}
	}

	// ==========================================
	// USERS (3)
	// ==========================================
	usersCol, err := app.FindCollectionByNameOrId("users")
	if err != nil {
		return fmt.Errorf("find users: %w", err)
	}

	alice := core.NewRecord(usersCol)
	alice.Set("email", "admin@pocketcrm.test")
	alice.Set("emailVisibility", true)
	alice.Set("name", "Alice Martin")
	alice.Set("role", "admin")
	alice.Set("verified", true)
	alice.Set("phone", "+33 1 23 45 67 89")
	alice.SetPassword("admin123456")
	if err := app.Save(alice); err != nil {
		return fmt.Errorf("create alice: %w", err)
	}

	bob := core.NewRecord(usersCol)
	bob.Set("email", "commercial@pocketcrm.test")
	bob.Set("emailVisibility", true)
	bob.Set("name", "Bob Dupont")
	bob.Set("role", "commercial")
	bob.Set("verified", true)
	bob.Set("phone", "+33 6 12 34 56 78")
	bob.SetPassword("commercial123456")
	if err := app.Save(bob); err != nil {
		return fmt.Errorf("create bob: %w", err)
	}

	claire := core.NewRecord(usersCol)
	claire.Set("email", "standard@pocketcrm.test")
	claire.Set("emailVisibility", true)
	claire.Set("name", "Claire Moreau")
	claire.Set("role", "standard")
	claire.Set("verified", true)
	claire.SetPassword("standard123456")
	if err := app.Save(claire); err != nil {
		return fmt.Errorf("create claire: %w", err)
	}
	_ = claire

	// ==========================================
	// COMPANIES (8: 5 original + 3 new cities/industries)
	// ==========================================
	companiesCol, err := app.FindCollectionByNameOrId("companies")
	if err != nil {
		return fmt.Errorf("find companies: %w", err)
	}

	mkCompany := func(name, industry, city, size string, revenue float64, owner *core.Record) *core.Record {
		c := core.NewRecord(companiesCol)
		c.Set("name", name)
		c.Set("industry", industry)
		c.Set("city", city)
		c.Set("country", "France")
		c.Set("size", size)
		c.Set("revenue", revenue)
		c.Set("owner", owner.Id)
		if err := app.Save(c); err != nil {
			log.Printf("[seed] company %s: %v", name, err)
		}
		return c
	}

	acme     := mkCompany("Acme Corp",             "Technologie",                    "Paris",    "eti",              5_000_000, alice)
	biovert  := mkCompany("BioVert Solutions",      "Sante / Pharma",                 "Lyon",     "pme",              1_200_000, bob)
	dataflow := mkCompany("DataFlow Analytics",     "Data / Intelligence Artificielle","Bordeaux","tpe",                350_000, bob)
	ecologis := mkCompany("EcoLogis",               "Immobilier",                     "Marseille","pme",              2_800_000, alice)
	fintech  := mkCompany("FinTech Plus",           "Finance",                        "Paris",    "grande_entreprise",15_000_000, bob)
	sudlog   := mkCompany("SudLogiciel",            "Logiciel",                       "Toulouse", "pme",                750_000, alice)
	atlantic := mkCompany("AtlanticDev",            "Conseil IT",                     "Nantes",   "pme",                500_000, bob)
	medtech  := mkCompany("MedTech Côte d'Azur",   "MedTech",                        "Nice",     "eti",              3_200_000, alice)

	// ==========================================
	// CONTACTS (15)
	// ==========================================
	contactsCol, err := app.FindCollectionByNameOrId("contacts")
	if err != nil {
		return fmt.Errorf("find contacts: %w", err)
	}

	mkContact := func(first, last, email, position string, company *core.Record, owner *core.Record, tags []string) *core.Record {
		c := core.NewRecord(contactsCol)
		c.Set("first_name", first)
		c.Set("last_name", last)
		c.Set("email", email)
		c.Set("position", position)
		c.Set("company", company.Id)
		c.Set("owner", owner.Id)
		c.Set("tags", tags)
		if err := app.Save(c); err != nil {
			log.Printf("[seed] contact %s %s: %v", first, last, err)
		}
		return c
	}

	c1  := mkContact("Jean",     "Durand",   "jean.durand@acme.test",        "Directeur Technique",    acme,     alice, []string{"client"})
	c2  := mkContact("Marie",    "Lambert",  "marie.lambert@acme.test",      "Responsable Achats",     acme,     bob,   []string{"client"})
	c3  := mkContact("Pierre",   "Petit",    "pierre.petit@biovert.test",    "PDG",                    biovert,  bob,   []string{"client"})
	c4  := mkContact("Sophie",   "Bernard",  "sophie.bernard@biovert.test",  "Directrice R&D",         biovert,  bob,   []string{"client"})
	c5  := mkContact("Lucas",    "Roux",     "lucas.roux@dataflow.test",     "Data Scientist",         dataflow, alice, []string{"client"})
	c6  := mkContact("Emma",     "Garcia",   "emma.garcia@dataflow.test",    "CTO",                    dataflow, alice, []string{"client"})
	c7  := mkContact("Thomas",   "Leroy",    "thomas.leroy@ecologis.test",   "Responsable Commercial", ecologis, bob,   []string{"client"})
	c8  := mkContact("Lea",      "Moreau",   "lea.moreau@ecologis.test",     "Architecte",             ecologis, alice, []string{"client"})
	c9  := mkContact("Hugo",     "Simon",    "hugo.simon@fintech.test",      "CFO",                    fintech,  bob,   []string{"client"})
	c10 := mkContact("Camille",  "Fournier", "camille.fournier@fintech.test","Responsable Innovation",  fintech,  bob,   []string{"client"})
	c11 := mkContact("Nicolas",  "Blanc",    "nicolas.blanc@sudlog.test",    "CEO",                    sudlog,   alice, []string{"client"})
	c12 := mkContact("Isabelle", "Noir",     "isabelle.noir@sudlog.test",    "Directrice Commerciale", sudlog,   alice, []string{"prospect"})
	c13 := mkContact("Marc",     "Fontaine", "marc.fontaine@atlantic.test",  "CTO",                    atlantic, bob,   []string{"client"})
	c14 := mkContact("Chloé",    "Rousseau", "chloe.rousseau@medtech.test",  "CEO",                    medtech,  alice, []string{"client"})
	c15 := mkContact("Antoine",  "Girard",   "antoine.girard@medtech.test",  "Directeur R&D",          medtech,  alice, []string{"prospect"})
	_ = c12; _ = c15

	// ==========================================
	// LEADS (45: 29 won + 11 active + 5 lost)
	// ==========================================
	leadsCol, err := app.FindCollectionByNameOrId("leads")
	if err != nil {
		return fmt.Errorf("find leads: %w", err)
	}

	// setCreated force-updates the `created` column via raw SQL, bypassing
	// PocketBase's AutodateField which always overrides pre-set values on create.
	setCreated := func(table, id, ts string) {
		if _, err := app.DB().NewQuery(
			fmt.Sprintf(`UPDATE %s SET created = '%s 09:00:00.000Z' WHERE id = '%s'`, table, ts, id),
		).Execute(); err != nil {
			log.Printf("[seed] setCreated %s/%s: %v", table, id, err)
		}
	}

	// Won leads (status=gagne) — spread Nov 2024 → Feb 2026, growing revenue.
	// created = ~2 months before closed_at to show realistic sales cycles.
	mkWon := func(title string, value float64, owner *core.Record, contact *core.Record, company *core.Record, source, created, closedAt string) *core.Record {
		l := core.NewRecord(leadsCol)
		l.Set("title", title)
		l.Set("value", value)
		l.Set("status", "gagne")
		l.Set("priority", "haute")
		l.Set("source", source)
		l.Set("contact", contact.Id)
		l.Set("company", company.Id)
		l.Set("owner", owner.Id)
		l.Set("closed_at", closedAt+" 12:00:00.000Z")
		if err := app.Save(l); err != nil {
			log.Printf("[seed] won lead %s: %v", title, err)
		}
		setCreated("leads", l.Id, created)
		return l
	}

	// 29 won leads — revenue trend: ~15k → ~273k/month, clear upward trajectory
	mkWon("Audit système DataFlow",              15000, alice, c5,  dataflow, "site_web",      "2024-09-20", "2024-11-20")
	mkWon("Plateforme données BioVert Q4",       22000, bob,   c3,  biovert,  "salon",          "2024-10-20", "2024-12-15")
	mkWon("Logiciel gestion EcoLogis v1",        18000, alice, c8,  ecologis, "recommandation", "2024-11-01", "2024-12-28")
	mkWon("Extension contrat FinTech Q1",        28000, bob,   c9,  fintech,  "email",          "2024-11-25", "2025-01-22")
	mkWon("Migration cloud Acme Corp",           25000, alice, c1,  acme,     "recommandation", "2024-12-15", "2025-02-10")
	mkWon("Module analytique BioVert",           35000, bob,   c4,  biovert,  "telephone",      "2025-01-05", "2025-02-28")
	mkWon("Consulting IA DataFlow",              40000, alice, c6,  dataflow, "site_web",       "2025-01-20", "2025-03-18")
	mkWon("Refonte portail EcoLogis",            32000, bob,   c7,  ecologis, "recommandation", "2025-02-05", "2025-03-28")
	mkWon("Optimisation performance Acme",       55000, alice, c2,  acme,     "email",          "2025-02-15", "2025-04-12")
	mkWon("Audit sécurité FinTech Plus",         45000, bob,   c10, fintech,  "salon",          "2025-03-01", "2025-04-25")
	mkWon("Pipeline data BioVert v2",            48000, alice, c3,  biovert,  "recommandation", "2025-03-20", "2025-05-20")
	mkWon("Transformation digitale Acme",        65000, bob,   c1,  acme,     "telephone",      "2025-04-15", "2025-06-10")
	mkWon("Plateforme ML DataFlow",              52000, alice, c6,  dataflow, "site_web",       "2025-04-28", "2025-06-25")
	mkWon("Logiciel gestion EcoLogis v2",        70000, bob,   c8,  ecologis, "email",          "2025-05-20", "2025-07-15")
	mkWon("Conformité réglementaire FinTech",    60000, alice, c9,  fintech,  "recommandation", "2025-06-01", "2025-07-28")
	mkWon("Infrastructure cloud Acme",           85000, bob,   c2,  acme,     "site_web",       "2025-06-15", "2025-08-12")
	mkWon("Système veille BioVert",              72000, alice, c4,  biovert,  "salon",          "2025-07-01", "2025-08-27")
	mkWon("Data warehouse DataFlow",             90000, bob,   c5,  dataflow, "email",          "2025-07-18", "2025-09-15")
	mkWon("Portail client EcoLogis",             78000, alice, c7,  ecologis, "recommandation", "2025-08-02", "2025-09-28")
	mkWon("Module DORA FinTech",                 95000, bob,   c10, fintech,  "telephone",      "2025-08-18", "2025-10-14")
	mkWon("API marketplace Acme",                88000, alice, c1,  acme,     "recommandation", "2025-09-01", "2025-10-27")
	mkWon("CRM personnalisé BioVert",           105000, bob,   c3,  biovert,  "email",          "2025-09-15", "2025-11-12")
	mkWon("Intelligence décisionnelle DataFlow", 92000, alice, c6,  dataflow, "site_web",       "2025-09-28", "2025-11-26")
	mkWon("Smart building EcoLogis",            120000, bob,   c8,  ecologis, "salon",          "2025-10-15", "2025-12-10")
	mkWon("Cyber-résilience FinTech Q4",        110000, alice, c9,  fintech,  "recommandation", "2025-10-28", "2025-12-22")
	mkWon("DevSecOps Acme 2026",                135000, bob,   c2,  acme,     "email",          "2025-11-18", "2026-01-15")
	mkWon("Bioanalytics BioVert Q1 2026",       115000, alice, c4,  biovert,  "site_web",       "2025-11-30", "2026-01-28")
	mkWon("Data lakehouse DataFlow 2026",        145000, bob,   c5,  dataflow, "telephone",      "2025-12-15", "2026-02-12")
	mkWon("Smart city EcoLogis 2026",           128000, alice, c7,  ecologis, "recommandation", "2025-12-28", "2026-02-25")

	// Active pipeline leads (11) — various stages for pipeline widget & forecast
	mkActive := func(title string, value float64, status, source, priority string, owner, contact *core.Record, company *core.Record, created, expectedClose string) *core.Record {
		l := core.NewRecord(leadsCol)
		l.Set("title", title)
		l.Set("value", value)
		l.Set("status", status)
		l.Set("priority", priority)
		l.Set("source", source)
		l.Set("contact", contact.Id)
		l.Set("company", company.Id)
		l.Set("owner", owner.Id)
		l.Set("expected_close", expectedClose+" 00:00:00.000Z")
		if err := app.Save(l); err != nil {
			log.Printf("[seed] active lead %s: %v", title, err)
		}
		setCreated("leads", l.Id, created)
		return l
	}

	_ = mkActive("Nouveau projet SudLogiciel",         35000, "nouveau",     "site_web",      "moyenne",  alice, c11, sudlog,   "2026-02-20", "2026-04-30")
	_ = mkActive("Développement AtlanticDev Q2",       28000, "nouveau",     "email",         "basse",    bob,   c13, atlantic, "2026-02-15", "2026-05-15")
	_ = mkActive("Plateforme MedTech Connect",         45000, "contacte",    "recommandation","moyenne",  alice, c14, medtech,  "2026-01-25", "2026-04-15")
	_ = mkActive("Logiciel RH EcoLogis 2026",          60000, "contacte",    "telephone",     "haute",    bob,   c7,  ecologis, "2026-01-18", "2026-03-30")
	_ = mkActive("Sécurité FinTech 2026 v2",           85000, "qualifie",    "salon",         "haute",    alice, c9,  fintech,  "2026-01-05", "2026-03-20")
	_ = mkActive("Intégration ERP Acme 2026",          72000, "qualifie",    "site_web",      "moyenne",  bob,   c1,  acme,     "2025-12-20", "2026-03-15")
	_ = mkActive("Analytics BioVert Q2 2026",          95000, "qualifie",    "email",         "haute",    alice, c3,  biovert,  "2025-12-10", "2026-03-10")
	_ = mkActive("IA générative DataFlow Q2",         120000, "proposition", "recommandation","urgente",  bob,   c6,  dataflow, "2025-11-28", "2026-03-05")
	_ = mkActive("Plateforme IoT EcoLogis",           140000, "proposition", "telephone",     "urgente",  alice, c8,  ecologis, "2025-11-15", "2026-02-28")
	_ = mkActive("Transformation cloud FinTech Q2",   185000, "negociation", "salon",         "urgente",  bob,   c10, fintech,  "2025-10-30", "2026-02-28")
	_ = mkActive("DevOps Acme Enterprise",            165000, "negociation", "site_web",      "urgente",  alice, c2,  acme,     "2025-10-15", "2026-02-28")

	// Lost leads (5) — for realistic conversion rate (~60%)
	mkLost := func(title string, value float64, owner, contact *core.Record, company *core.Record, source, created string) {
		l := core.NewRecord(leadsCol)
		l.Set("title", title)
		l.Set("value", value)
		l.Set("status", "perdu")
		l.Set("priority", "moyenne")
		l.Set("source", source)
		l.Set("contact", contact.Id)
		l.Set("company", company.Id)
		l.Set("owner", owner.Id)
		if err := app.Save(l); err != nil {
			log.Printf("[seed] lost lead %s: %v", title, err)
		}
		setCreated("leads", l.Id, created)
	}

	mkLost("ERP BioVert — perdu concurrent",      42000, bob,   c4,  biovert,  "salon",          "2024-10-05")
	mkLost("Refonte DSI Acme — budget refusé",     55000, alice, c2,  acme,     "recommandation", "2025-02-20")
	mkLost("DataFlow migration — délais client",   38000, bob,   c5,  dataflow, "site_web",       "2025-05-10")
	mkLost("EcoLogis contrat cadre — concurrent",  70000, alice, c7,  ecologis, "telephone",      "2025-08-15")
	mkLost("FinTech audit Q3 — concurrent",        90000, bob,   c10, fintech,  "email",          "2025-11-20")

	// ==========================================
	// TASKS (10: 3 meetings today + 4 overdue + 3 completed)
	// ==========================================
	tasksCol, err := app.FindCollectionByNameOrId("tasks")
	if err != nil {
		return fmt.Errorf("find tasks: %w", err)
	}

	mkTask := func(title, taskType, status, priority, dueDate string, assignee, createdBy *core.Record) {
		t := core.NewRecord(tasksCol)
		t.Set("title", title)
		t.Set("type", taskType)
		t.Set("status", status)
		t.Set("priority", priority)
		t.Set("due_date", dueDate)
		t.Set("assignee", assignee.Id)
		t.Set("created_by", createdBy.Id)
		if err := app.Save(t); err != nil {
			log.Printf("[seed] task %s: %v", title, err)
		}
	}

	// 3 meetings TODAY (2026-02-28) → "meetings today" KPI = 3
	mkTask("Réunion présentation FinTech Q2",    "reunion", "a_faire", "urgente", "2026-02-28 09:00:00.000Z", alice, bob)
	mkTask("Démo produit IoT EcoLogis",          "reunion", "a_faire", "haute",   "2026-02-28 10:30:00.000Z", bob,   alice)
	mkTask("Kickoff DevOps Acme Enterprise",     "reunion", "a_faire", "haute",   "2026-02-28 14:00:00.000Z", alice, bob)

	// 4 overdue tasks (due before 2026-02-28, still open)
	mkTask("Relancer devis BioVert Analytics",   "appel",   "a_faire", "haute",   "2026-02-20 10:00:00.000Z", alice, alice)
	mkTask("Envoyer specs DataFlow Q2",          "email",   "en_cours","urgente", "2026-02-15 14:00:00.000Z", bob,   bob)
	mkTask("Suivi négociation FinTech v2",       "suivi",   "a_faire", "urgente", "2026-02-10 11:00:00.000Z", alice, bob)
	mkTask("Préparer contrat Acme Enterprise",   "autre",   "a_faire", "haute",   "2026-01-31 16:00:00.000Z", bob,   alice)

	// 3 completed tasks
	tc1 := core.NewRecord(tasksCol)
	tc1.Set("title", "Présentation SudLogiciel — avant-vente")
	tc1.Set("type", "reunion")
	tc1.Set("status", "terminee")
	tc1.Set("priority", "moyenne")
	tc1.Set("due_date", "2026-02-18 14:00:00.000Z")
	tc1.Set("completed_at", "2026-02-18 15:30:00.000Z")
	tc1.Set("assignee", alice.Id)
	tc1.Set("created_by", alice.Id)
	if err := app.Save(tc1); err != nil {
		log.Printf("[seed] task completed 1: %v", err)
	}

	tc2 := core.NewRecord(tasksCol)
	tc2.Set("title", "Clôture dossier Smart Building EcoLogis")
	tc2.Set("type", "autre")
	tc2.Set("status", "terminee")
	tc2.Set("priority", "haute")
	tc2.Set("due_date", "2025-12-08 16:00:00.000Z")
	tc2.Set("completed_at", "2025-12-10 10:00:00.000Z")
	tc2.Set("assignee", bob.Id)
	tc2.Set("created_by", bob.Id)
	if err := app.Save(tc2); err != nil {
		log.Printf("[seed] task completed 2: %v", err)
	}

	tc3 := core.NewRecord(tasksCol)
	tc3.Set("title", "Rapport cyber-résilience FinTech Q4")
	tc3.Set("type", "autre")
	tc3.Set("status", "terminee")
	tc3.Set("priority", "haute")
	tc3.Set("due_date", "2025-12-20 16:00:00.000Z")
	tc3.Set("completed_at", "2025-12-22 11:30:00.000Z")
	tc3.Set("assignee", alice.Id)
	tc3.Set("created_by", bob.Id)
	if err := app.Save(tc3); err != nil {
		log.Printf("[seed] task completed 3: %v", err)
	}
	_ = tc1; _ = tc2; _ = tc3

	// ==========================================
	// INVOICES (21: 16 paid + 5 other statuses)
	// Financial chart uses paid_at month → growing revenue visible
	// ==========================================
	invoicesCol, err := app.FindCollectionByNameOrId("invoices")
	if err != nil {
		return fmt.Errorf("find invoices: %w", err)
	}

	type InvoiceItem struct {
		Description string  `json:"description"`
		Qty         int     `json:"qty"`
		UnitPrice   float64 `json:"unit_price"`
	}

	mkPaid := func(number string, contact *core.Record, company *core.Record, owner *core.Record, amount float64, issuedAt, dueAt, paidAt, desc string) {
		inv := core.NewRecord(invoicesCol)
		inv.Set("number", number)
		inv.Set("contact", contact.Id)
		inv.Set("company", company.Id)
		inv.Set("owner", owner.Id)
		inv.Set("amount", amount)
		inv.Set("tax_rate", 20.0)
		inv.Set("total", amount*1.2)
		inv.Set("status", "payee")
		inv.Set("issued_at", issuedAt+" 00:00:00.000Z")
		inv.Set("due_at", dueAt+" 00:00:00.000Z")
		inv.Set("paid_at", paidAt+" 00:00:00.000Z")
		inv.Set("items", []InvoiceItem{{Description: desc, Qty: 1, UnitPrice: amount}})
		if err := app.Save(inv); err != nil {
			log.Printf("[seed] invoice %s: %v", number, err)
		}
	}

	// 16 paid invoices (Nov 2024 → Feb 2026) — growing monthly totals
	mkPaid("FAC-2024-001", c5,  dataflow, alice, 15000,  "2024-10-15", "2024-11-15", "2024-11-05", "Audit architecture DataFlow")
	mkPaid("FAC-2024-002", c3,  biovert,  bob,   40000,  "2024-11-20", "2024-12-20", "2024-12-12", "Plateforme données BioVert")
	mkPaid("FAC-2025-001", c9,  fintech,  bob,   28000,  "2024-12-20", "2025-01-20", "2025-01-15", "Extension contrat FinTech")
	mkPaid("FAC-2025-002", c1,  acme,     alice, 60000,  "2025-01-15", "2025-02-15", "2025-02-08", "Migration cloud + module analytique Acme")
	mkPaid("FAC-2025-003", c7,  ecologis, bob,   72000,  "2025-02-18", "2025-03-18", "2025-03-12", "Refonte portail + Consulting IA EcoLogis")
	mkPaid("FAC-2025-004", c2,  acme,     alice, 100000, "2025-03-20", "2025-04-20", "2025-04-15", "Optimisation performance + audit Acme")
	mkPaid("FAC-2025-005", c4,  biovert,  alice, 48000,  "2025-04-22", "2025-05-22", "2025-05-18", "Pipeline data BioVert v2")
	mkPaid("FAC-2025-006", c6,  dataflow, alice, 117000, "2025-05-25", "2025-06-25", "2025-06-12", "Transformation digitale + Plateforme ML")
	mkPaid("FAC-2025-007", c8,  ecologis, bob,   130000, "2025-06-18", "2025-07-18", "2025-07-10", "Gestion v2 + Conformité EcoLogis")
	mkPaid("FAC-2025-008", c10, fintech,  bob,   157000, "2025-07-20", "2025-08-20", "2025-08-15", "Infrastructure cloud + Système veille")
	mkPaid("FAC-2025-009", c1,  acme,     bob,   168000, "2025-08-22", "2025-09-22", "2025-09-16", "Data warehouse + Portail client")
	mkPaid("FAC-2025-010", c3,  biovert,  alice, 183000, "2025-09-25", "2025-10-25", "2025-10-20", "Module DORA + API marketplace")
	mkPaid("FAC-2025-011", c5,  dataflow, alice, 197000, "2025-10-28", "2025-11-28", "2025-11-18", "CRM personnalisé + Intelligence décisionnelle")
	mkPaid("FAC-2025-012", c7,  ecologis, bob,   230000, "2025-11-28", "2025-12-28", "2025-12-15", "Smart building + Cyber-résilience")
	mkPaid("FAC-2026-001", c9,  fintech,  bob,   250000, "2025-12-28", "2026-01-28", "2026-01-20", "DevSecOps + Bioanalytics Q1 2026")
	mkPaid("FAC-2026-002", c5,  dataflow, bob,   145000, "2026-01-25", "2026-02-25", "2026-02-18", "Data lakehouse DataFlow 2026")

	// 5 non-paid invoices for invoice status pie diversity
	inv17 := core.NewRecord(invoicesCol)
	inv17.Set("number", "FAC-2026-003")
	inv17.Set("contact", c14.Id)
	inv17.Set("company", medtech.Id)
	inv17.Set("owner", alice.Id)
	inv17.Set("amount", 45000.0)
	inv17.Set("tax_rate", 20.0)
	inv17.Set("total", 54000.0)
	inv17.Set("status", "emise")
	inv17.Set("issued_at", "2026-02-05 00:00:00.000Z")
	inv17.Set("due_at", "2026-03-05 00:00:00.000Z")
	inv17.Set("items", []InvoiceItem{{Description: "Plateforme MedTech Connect - phase 1", Qty: 1, UnitPrice: 45000}})
	app.Save(inv17) //nolint:errcheck

	inv18 := core.NewRecord(invoicesCol)
	inv18.Set("number", "FAC-2026-004")
	inv18.Set("contact", c6.Id)
	inv18.Set("company", dataflow.Id)
	inv18.Set("owner", alice.Id)
	inv18.Set("amount", 52000.0)
	inv18.Set("tax_rate", 20.0)
	inv18.Set("total", 62400.0)
	inv18.Set("status", "en_retard")
	inv18.Set("issued_at", "2025-12-01 00:00:00.000Z")
	inv18.Set("due_at", "2026-01-01 00:00:00.000Z")
	inv18.Set("items", []InvoiceItem{{Description: "IA générative DataFlow — acompte", Qty: 1, UnitPrice: 52000}})
	app.Save(inv18) //nolint:errcheck

	inv19 := core.NewRecord(invoicesCol)
	inv19.Set("number", "FAC-2026-005")
	inv19.Set("contact", c10.Id)
	inv19.Set("company", fintech.Id)
	inv19.Set("owner", bob.Id)
	inv19.Set("amount", 120000.0)
	inv19.Set("tax_rate", 20.0)
	inv19.Set("total", 144000.0)
	inv19.Set("status", "brouillon")
	inv19.Set("issued_at", "2026-02-20 00:00:00.000Z")
	inv19.Set("due_at", "2026-03-20 00:00:00.000Z")
	inv19.Set("items", []InvoiceItem{{Description: "Transformation cloud FinTech Q2", Qty: 1, UnitPrice: 120000}})
	app.Save(inv19) //nolint:errcheck

	inv20 := core.NewRecord(invoicesCol)
	inv20.Set("number", "FAC-2026-006")
	inv20.Set("contact", c8.Id)
	inv20.Set("company", ecologis.Id)
	inv20.Set("owner", alice.Id)
	inv20.Set("amount", 80000.0)
	inv20.Set("tax_rate", 20.0)
	inv20.Set("total", 96000.0)
	inv20.Set("status", "emise")
	inv20.Set("issued_at", "2026-02-15 00:00:00.000Z")
	inv20.Set("due_at", "2026-03-15 00:00:00.000Z")
	inv20.Set("items", []InvoiceItem{{Description: "Plateforme IoT EcoLogis — acompte 50%", Qty: 1, UnitPrice: 80000}})
	app.Save(inv20) //nolint:errcheck

	inv21 := core.NewRecord(invoicesCol)
	inv21.Set("number", "FAC-2025-013")
	inv21.Set("contact", c1.Id)
	inv21.Set("company", acme.Id)
	inv21.Set("owner", alice.Id)
	inv21.Set("amount", 24000.0)
	inv21.Set("tax_rate", 20.0)
	inv21.Set("total", 28800.0)
	inv21.Set("status", "annulee")
	inv21.Set("issued_at", "2025-11-10 00:00:00.000Z")
	inv21.Set("due_at", "2025-12-10 00:00:00.000Z")
	inv21.Set("items", []InvoiceItem{{Description: "Prestation annulée — restructuration interne", Qty: 1, UnitPrice: 24000}})
	app.Save(inv21) //nolint:errcheck
	_ = inv17; _ = inv18; _ = inv19; _ = inv20; _ = inv21

	// ==========================================
	// ACTIVITIES (20 curated — with historical created dates)
	// Lead hooks auto-generate activities during seed; wipe them first so only
	// our curated activities appear in the dashboard feed.
	// ==========================================
	activitiesCol, err := app.FindCollectionByNameOrId("activities")
	if err != nil {
		return fmt.Errorf("find activities: %w", err)
	}
	// Wipe auto-generated lead-hook activities before seeding curated ones
	if _, err := app.DB().NewQuery(`DELETE FROM activities`).Execute(); err != nil {
		log.Printf("[seed] wipe auto activities: %v", err)
	}

	mkActivity := func(actType, description, created string, user *core.Record) {
		a := core.NewRecord(activitiesCol)
		a.Set("type", actType)
		a.Set("description", description)
		a.Set("user", user.Id)
		if err := app.Save(a); err != nil {
			log.Printf("[seed] activity %s: %v", actType, err)
		}
		setCreated("activities", a.Id, created)
	}

	// Recent activities (top 10 will show in dashboard feed)
	mkActivity("appel",         "Confirmation de signature avec Hugo Simon (FinTech) — accord sur les conditions",                 "2026-02-27", bob)
	mkActivity("email",         "Envoi proposition commerciale personnalisée à AtlanticDev — suivi dans 5 jours",                 "2026-02-26", alice)
	mkActivity("note",          "Retour très positif de BioVert sur la démo produit — passent en comité le 05/03",                "2026-02-25", bob)
	mkActivity("statut_change", "Lead DataFlow 'IA générative Q2' passé en phase proposition après réunion technique",            "2026-02-24", alice)
	mkActivity("appel",         "Premier contact MedTech Côte d'Azur — besoin identifié en infrastructure cloud",                 "2026-02-20", bob)
	mkActivity("creation",      "Ouverture nouveau dossier SudLogiciel — lead qualifié via recommandation partenaire",            "2026-02-18", alice)
	mkActivity("email",         "Relance EcoLogis — troisième tentative sur le projet Portail IoT, réponse attendue",             "2026-02-15", bob)
	mkActivity("note",          "CR réunion stratégie commerciale Q1 2026 — objectif 500k€ CA atteint à 94%",                    "2026-02-10", alice)
	mkActivity("appel",         "Suivi FinTech Plus — accord de principe reçu, rédaction contrat en cours",                      "2026-02-05", bob)
	mkActivity("statut_change", "Acme Corp 'DevOps Enterprise' passé en négociation — dernier arbitrage budget",                  "2026-01-28", alice)
	// Older activities (historical context)
	mkActivity("appel",         "Négociation contrat cadre DataFlow — révision des conditions de paiement",                       "2026-01-20", bob)
	mkActivity("email",         "Envoi étude de cas personnalisée BioVert — 3 références clients similaires",                     "2026-01-15", alice)
	mkActivity("note",          "Point mi-Q4 objectifs commerciaux — Alice 95k€/mois, Bob 88k€/mois",                            "2025-12-20", bob)
	mkActivity("creation",      "Nouveau prospect FinTech Plus — extension de périmètre contrat existant",                        "2025-12-10", alice)
	mkActivity("appel",         "Réunion découverte EcoLogis — besoins IoT complexes, 3 sites pilotes identifiés",                "2025-11-25", bob)
	mkActivity("statut_change", "Lead Acme 'API marketplace' passé en qualification — budget validé par DSI",                    "2025-11-15", alice)
	mkActivity("email",         "Campagne de relance automne 2025 — 12 prospects contactés, 4 réponses positives",               "2025-10-20", bob)
	mkActivity("appel",         "Premier contact BioVert — identification du décideur, rendez-vous planifié",                     "2025-10-05", alice)
	mkActivity("note",          "Analyse concurrentielle marché logiciels B2B — 3 concurrents identifiés sur DataFlow",           "2025-09-15", bob)
	mkActivity("creation",      "Ouverture dossier DataFlow Analytics — lead entrant via formulaire site web",                    "2025-08-30", alice)

	// ==========================================
	// EMAIL (1 template + 4 campaigns + 40 logs)
	// ==========================================
	emailTemplatesCol, err := app.FindCollectionByNameOrId("email_templates")
	if err != nil {
		return fmt.Errorf("find email_templates: %w", err)
	}

	tplNewsletter := core.NewRecord(emailTemplatesCol)
	tplNewsletter.Set("name", "Newsletter mensuelle")
	tplNewsletter.Set("subject", "Actualités PocketCRM — {{month}}")
	tplNewsletter.Set("body", "<h1>Bonjour {{first_name}},</h1><p>Voici les actualités du mois.</p>")
	tplNewsletter.Set("type", "marketing")
	tplNewsletter.Set("active", true)
	tplNewsletter.Set("created_by", alice.Id)
	if err := app.Save(tplNewsletter); err != nil {
		return fmt.Errorf("create email template: %w", err)
	}

	campaignsCol, err := app.FindCollectionByNameOrId("campaigns")
	if err != nil {
		return fmt.Errorf("find campaigns: %w", err)
	}

	mkCampaign := func(name, status string, total, sent, failed int, creator *core.Record) *core.Record {
		c := core.NewRecord(campaignsCol)
		c.Set("name", name)
		c.Set("template", tplNewsletter.Id)
		c.Set("status", status)
		c.Set("total", total)
		c.Set("sent", sent)
		c.Set("failed", failed)
		c.Set("contact_ids", []string{})
		c.Set("created_by", creator.Id)
		if err := app.Save(c); err != nil {
			log.Printf("[seed] campaign %s: %v", name, err)
		}
		return c
	}

	camp1 := mkCampaign("Newsletter Automne 2025",   "envoye",   12, 11, 1, alice)
	camp2 := mkCampaign("Promo Fin d'Année 2025",    "envoye",   10, 10, 0, bob)
	camp3 := mkCampaign("Newsletter Q1 2026",        "envoye",   15, 14, 1, alice)
	camp4 := mkCampaign("Webinaire IA Agentic 2026", "en_cours",  8,  8, 0, bob)

	emailLogsCol, err := app.FindCollectionByNameOrId("email_logs")
	if err != nil {
		return fmt.Errorf("find email_logs: %w", err)
	}

	contacts := []*core.Record{c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c13, c14}

	// mkLog creates one email log entry
	mkLog := func(campaignId, sentAt string, contact *core.Record, sentBy *core.Record, status string, openCount, clickCount int) {
		l := core.NewRecord(emailLogsCol)
		l.Set("template", tplNewsletter.Id)
		l.Set("recipient_email", contact.GetString("email"))
		l.Set("recipient_contact", contact.Id)
		l.Set("subject", "Actualités PocketCRM")
		l.Set("status", status)
		l.Set("sent_at", sentAt+" 08:00:00.000Z")
		l.Set("sent_by", sentBy.Id)
		l.Set("campaign_id", campaignId)
		l.Set("open_count", openCount)
		l.Set("click_count", clickCount)
		if openCount > 0 {
			l.Set("opened_at", sentAt+" 14:00:00.000Z")
		}
		if clickCount > 0 {
			l.Set("clicked_at", sentAt+" 14:30:00.000Z")
		}
		if err := app.Save(l); err != nil {
			log.Printf("[seed] email_log: %v", err)
		}
	}

	// Campaign 1 — Automne 2025 (Oct 2025): 11 sent, 1 echec
	// open rate: 5/11 = 45%, click rate: 2/11 = 18%
	for i, c := range contacts[:11] {
		status := "envoye"
		openCount, clickCount := 0, 0
		switch i {
		case 0, 2, 5, 7, 9:
			openCount = 1 // 5 opens
		}
		switch i {
		case 2, 7:
			clickCount = 1 // 2 clicks
		}
		mkLog(camp1.Id, "2025-10-15", c, alice, status, openCount, clickCount)
	}
	// 1 failed log for camp1
	failed1 := core.NewRecord(emailLogsCol)
	failed1.Set("template", tplNewsletter.Id)
	failed1.Set("recipient_email", "bounce@invalid.example")
	failed1.Set("subject", "Actualités PocketCRM")
	failed1.Set("status", "echoue")
	failed1.Set("sent_at", "2025-10-15 08:00:00.000Z")
	failed1.Set("sent_by", alice.Id)
	failed1.Set("campaign_id", camp1.Id)
	failed1.Set("error_message", "Address does not exist")
	app.Save(failed1) //nolint:errcheck

	// Campaign 2 — Fin d'Année 2025 (Nov 2025): 10 sent, 0 echec
	// open rate: 6/10 = 60%, click rate: 3/10 = 30%
	for i, c := range contacts[:10] {
		openCount, clickCount := 0, 0
		switch i {
		case 0, 1, 3, 5, 6, 8:
			openCount = 1 // 6 opens
		}
		switch i {
		case 1, 5, 8:
			clickCount = 1 // 3 clicks
		}
		mkLog(camp2.Id, "2025-11-20", c, bob, "envoye", openCount, clickCount)
	}

	// Campaign 3 — Q1 2026 (Jan 2026): 14 sent, 1 echec
	// open rate: 8/14 = 57%, click rate: 4/14 = 28%
	for i, c := range contacts {
		openCount, clickCount := 0, 0
		switch i {
		case 0, 1, 2, 4, 6, 8, 10, 12:
			openCount = 1 // 8 opens
		}
		switch i {
		case 0, 4, 8, 10:
			clickCount = 1 // 4 clicks
		}
		mkLog(camp3.Id, "2026-01-20", c, alice, "envoye", openCount, clickCount)
	}
	failed3 := core.NewRecord(emailLogsCol)
	failed3.Set("template", tplNewsletter.Id)
	failed3.Set("recipient_email", "noreply@blocked.example")
	failed3.Set("subject", "Actualités PocketCRM")
	failed3.Set("status", "echoue")
	failed3.Set("sent_at", "2026-01-20 08:00:00.000Z")
	failed3.Set("sent_by", alice.Id)
	failed3.Set("campaign_id", camp3.Id)
	failed3.Set("error_message", "Mailbox full")
	app.Save(failed3) //nolint:errcheck

	// Campaign 4 — Webinaire IA (Feb 2026): 8 sent
	// open rate: 5/8 = 63%, click rate: 3/8 = 38%
	for i, c := range contacts[:8] {
		openCount, clickCount := 0, 0
		switch i {
		case 0, 2, 3, 5, 7:
			openCount = 1 // 5 opens
		}
		switch i {
		case 0, 3, 7:
			clickCount = 1 // 3 clicks
		}
		mkLog(camp4.Id, "2026-02-20", c, bob, "envoye", openCount, clickCount)
	}
	_ = camp1; _ = camp2; _ = camp3; _ = camp4

	fmt.Printf("Seed completed: 3 users, 8 companies, 15 contacts, 45 leads (29 won), 10 tasks, 21 invoices, 20 activities, 4 campaigns, 44 email logs\n")
	return nil
}
