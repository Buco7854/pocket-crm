package seeds

import (
	"fmt"

	"github.com/pocketbase/pocketbase/core"
)

// Run populates the database with test data.
// Intended for development only — invoke via: ./pocket-crm seed
func Run(app core.App) error {
	// ==========================================
	// USERS (3)
	// ==========================================
	usersCol, err := app.FindCollectionByNameOrId("users")
	if err != nil {
		return fmt.Errorf("find users collection: %w", err)
	}

	// Skip if data already exists
	existing, _ := app.CountRecords("users")
	if existing > 0 {
		return fmt.Errorf("database already contains %d users — aborting to avoid duplicates", existing)
	}

	admin := core.NewRecord(usersCol)
	admin.Set("email", "admin@pocketcrm.test")
	admin.Set("emailVisibility", true)
	admin.Set("name", "Alice Martin")
	admin.Set("role", "admin")
	admin.Set("verified", true)
	admin.Set("phone", "+33 1 23 45 67 89")
	admin.SetPassword("admin123456")
	if err := app.Save(admin); err != nil {
		return fmt.Errorf("create admin user: %w", err)
	}

	commercial := core.NewRecord(usersCol)
	commercial.Set("email", "commercial@pocketcrm.test")
	commercial.Set("emailVisibility", true)
	commercial.Set("name", "Bob Dupont")
	commercial.Set("role", "commercial")
	commercial.Set("verified", true)
	commercial.Set("phone", "+33 6 12 34 56 78")
	commercial.SetPassword("commercial123456")
	if err := app.Save(commercial); err != nil {
		return fmt.Errorf("create commercial user: %w", err)
	}

	standard := core.NewRecord(usersCol)
	standard.Set("email", "standard@pocketcrm.test")
	standard.Set("emailVisibility", true)
	standard.Set("name", "Claire Moreau")
	standard.Set("role", "standard")
	standard.Set("verified", true)
	standard.SetPassword("standard123456")
	if err := app.Save(standard); err != nil {
		return fmt.Errorf("create standard user: %w", err)
	}

	// ==========================================
	// COMPANIES (5)
	// ==========================================
	companiesCol, err := app.FindCollectionByNameOrId("companies")
	if err != nil {
		return fmt.Errorf("find companies collection: %w", err)
	}

	acme := core.NewRecord(companiesCol)
	acme.Set("name", "Acme Corp")
	acme.Set("industry", "Technologie")
	acme.Set("website", "https://acme-corp.example.com")
	acme.Set("email", "contact@acme-corp.example.com")
	acme.Set("phone", "+33 1 00 00 00 01")
	acme.Set("address", "10 Rue de la Paix")
	acme.Set("city", "Paris")
	acme.Set("country", "France")
	acme.Set("size", "eti")
	acme.Set("revenue", 5000000)
	acme.Set("owner", admin.Id)
	if err := app.Save(acme); err != nil {
		return fmt.Errorf("create Acme Corp: %w", err)
	}

	biovert := core.NewRecord(companiesCol)
	biovert.Set("name", "BioVert Solutions")
	biovert.Set("industry", "Sante / Pharma")
	biovert.Set("website", "https://biovert.example.com")
	biovert.Set("email", "info@biovert.example.com")
	biovert.Set("phone", "+33 4 00 00 00 02")
	biovert.Set("address", "25 Avenue Jean Jaures")
	biovert.Set("city", "Lyon")
	biovert.Set("country", "France")
	biovert.Set("size", "pme")
	biovert.Set("revenue", 1200000)
	biovert.Set("owner", commercial.Id)
	if err := app.Save(biovert); err != nil {
		return fmt.Errorf("create BioVert: %w", err)
	}

	dataflow := core.NewRecord(companiesCol)
	dataflow.Set("name", "DataFlow Analytics")
	dataflow.Set("industry", "Data / Intelligence Artificielle")
	dataflow.Set("website", "https://dataflow.example.com")
	dataflow.Set("email", "hello@dataflow.example.com")
	dataflow.Set("phone", "+33 5 00 00 00 03")
	dataflow.Set("address", "8 Quai des Chartrons")
	dataflow.Set("city", "Bordeaux")
	dataflow.Set("country", "France")
	dataflow.Set("size", "tpe")
	dataflow.Set("revenue", 350000)
	dataflow.Set("owner", commercial.Id)
	if err := app.Save(dataflow); err != nil {
		return fmt.Errorf("create DataFlow: %w", err)
	}

	ecologis := core.NewRecord(companiesCol)
	ecologis.Set("name", "EcoLogis")
	ecologis.Set("industry", "Immobilier")
	ecologis.Set("website", "https://ecologis.example.com")
	ecologis.Set("email", "contact@ecologis.example.com")
	ecologis.Set("phone", "+33 4 00 00 00 04")
	ecologis.Set("address", "15 Boulevard Michelet")
	ecologis.Set("city", "Marseille")
	ecologis.Set("country", "France")
	ecologis.Set("size", "pme")
	ecologis.Set("revenue", 2800000)
	ecologis.Set("owner", admin.Id)
	if err := app.Save(ecologis); err != nil {
		return fmt.Errorf("create EcoLogis: %w", err)
	}

	fintech := core.NewRecord(companiesCol)
	fintech.Set("name", "FinTech Plus")
	fintech.Set("industry", "Finance")
	fintech.Set("website", "https://fintechplus.example.com")
	fintech.Set("email", "info@fintechplus.example.com")
	fintech.Set("phone", "+33 1 00 00 00 05")
	fintech.Set("address", "42 Avenue des Champs-Elysees")
	fintech.Set("city", "Paris")
	fintech.Set("country", "France")
	fintech.Set("size", "grande_entreprise")
	fintech.Set("revenue", 15000000)
	fintech.Set("owner", commercial.Id)
	if err := app.Save(fintech); err != nil {
		return fmt.Errorf("create FinTech Plus: %w", err)
	}

	// ==========================================
	// CONTACTS (10 — 2 per company)
	// ==========================================
	contactsCol, err := app.FindCollectionByNameOrId("contacts")
	if err != nil {
		return fmt.Errorf("find contacts collection: %w", err)
	}

	c1 := core.NewRecord(contactsCol)
	c1.Set("first_name", "Jean")
	c1.Set("last_name", "Durand")
	c1.Set("email", "jean.durand@acme-corp.example.com")
	c1.Set("phone", "+33 6 10 00 00 01")
	c1.Set("position", "Directeur Technique")
	c1.Set("company", acme.Id)
	c1.Set("owner", admin.Id)
	c1.Set("tags", []string{"client"})
	if err := app.Save(c1); err != nil {
		return fmt.Errorf("create contact Jean Durand: %w", err)
	}

	c2 := core.NewRecord(contactsCol)
	c2.Set("first_name", "Marie")
	c2.Set("last_name", "Lambert")
	c2.Set("email", "marie.lambert@acme-corp.example.com")
	c2.Set("phone", "+33 6 10 00 00 02")
	c2.Set("position", "Responsable Achats")
	c2.Set("company", acme.Id)
	c2.Set("owner", commercial.Id)
	c2.Set("tags", []string{"client"})
	if err := app.Save(c2); err != nil {
		return fmt.Errorf("create contact Marie Lambert: %w", err)
	}

	c3 := core.NewRecord(contactsCol)
	c3.Set("first_name", "Pierre")
	c3.Set("last_name", "Petit")
	c3.Set("email", "pierre.petit@biovert.example.com")
	c3.Set("phone", "+33 6 10 00 00 03")
	c3.Set("position", "PDG")
	c3.Set("company", biovert.Id)
	c3.Set("owner", commercial.Id)
	c3.Set("tags", []string{"prospect"})
	if err := app.Save(c3); err != nil {
		return fmt.Errorf("create contact Pierre Petit: %w", err)
	}

	c4 := core.NewRecord(contactsCol)
	c4.Set("first_name", "Sophie")
	c4.Set("last_name", "Bernard")
	c4.Set("email", "sophie.bernard@biovert.example.com")
	c4.Set("phone", "+33 6 10 00 00 04")
	c4.Set("position", "Directrice R&D")
	c4.Set("company", biovert.Id)
	c4.Set("owner", commercial.Id)
	c4.Set("tags", []string{"prospect"})
	if err := app.Save(c4); err != nil {
		return fmt.Errorf("create contact Sophie Bernard: %w", err)
	}

	c5 := core.NewRecord(contactsCol)
	c5.Set("first_name", "Lucas")
	c5.Set("last_name", "Roux")
	c5.Set("email", "lucas.roux@dataflow.example.com")
	c5.Set("phone", "+33 6 10 00 00 05")
	c5.Set("position", "Data Scientist")
	c5.Set("company", dataflow.Id)
	c5.Set("owner", admin.Id)
	c5.Set("tags", []string{"partenaire"})
	if err := app.Save(c5); err != nil {
		return fmt.Errorf("create contact Lucas Roux: %w", err)
	}

	c6 := core.NewRecord(contactsCol)
	c6.Set("first_name", "Emma")
	c6.Set("last_name", "Garcia")
	c6.Set("email", "emma.garcia@dataflow.example.com")
	c6.Set("phone", "+33 6 10 00 00 06")
	c6.Set("position", "CTO")
	c6.Set("company", dataflow.Id)
	c6.Set("owner", admin.Id)
	c6.Set("tags", []string{"partenaire", "client"})
	if err := app.Save(c6); err != nil {
		return fmt.Errorf("create contact Emma Garcia: %w", err)
	}

	c7 := core.NewRecord(contactsCol)
	c7.Set("first_name", "Thomas")
	c7.Set("last_name", "Leroy")
	c7.Set("email", "thomas.leroy@ecologis.example.com")
	c7.Set("phone", "+33 6 10 00 00 07")
	c7.Set("position", "Responsable Commercial")
	c7.Set("company", ecologis.Id)
	c7.Set("owner", commercial.Id)
	c7.Set("tags", []string{"prospect"})
	if err := app.Save(c7); err != nil {
		return fmt.Errorf("create contact Thomas Leroy: %w", err)
	}

	c8 := core.NewRecord(contactsCol)
	c8.Set("first_name", "Lea")
	c8.Set("last_name", "Moreau")
	c8.Set("email", "lea.moreau@ecologis.example.com")
	c8.Set("phone", "+33 6 10 00 00 08")
	c8.Set("position", "Architecte")
	c8.Set("company", ecologis.Id)
	c8.Set("owner", admin.Id)
	c8.Set("tags", []string{"fournisseur"})
	if err := app.Save(c8); err != nil {
		return fmt.Errorf("create contact Lea Moreau: %w", err)
	}

	c9 := core.NewRecord(contactsCol)
	c9.Set("first_name", "Hugo")
	c9.Set("last_name", "Simon")
	c9.Set("email", "hugo.simon@fintechplus.example.com")
	c9.Set("phone", "+33 6 10 00 00 09")
	c9.Set("position", "CFO")
	c9.Set("company", fintech.Id)
	c9.Set("owner", commercial.Id)
	c9.Set("tags", []string{"client"})
	if err := app.Save(c9); err != nil {
		return fmt.Errorf("create contact Hugo Simon: %w", err)
	}

	c10 := core.NewRecord(contactsCol)
	c10.Set("first_name", "Camille")
	c10.Set("last_name", "Fournier")
	c10.Set("email", "camille.fournier@fintechplus.example.com")
	c10.Set("phone", "+33 6 10 00 00 10")
	c10.Set("position", "Responsable Innovation")
	c10.Set("company", fintech.Id)
	c10.Set("owner", commercial.Id)
	c10.Set("tags", []string{"client", "partenaire"})
	if err := app.Save(c10); err != nil {
		return fmt.Errorf("create contact Camille Fournier: %w", err)
	}

	// ==========================================
	// LEADS (5)
	// ==========================================
	leadsCol, err := app.FindCollectionByNameOrId("leads")
	if err != nil {
		return fmt.Errorf("find leads collection: %w", err)
	}

	l1 := core.NewRecord(leadsCol)
	l1.Set("title", "Migration cloud Acme Corp")
	l1.Set("value", 75000)
	l1.Set("status", "qualifie")
	l1.Set("priority", "haute")
	l1.Set("source", "recommandation")
	l1.Set("contact", c1.Id)
	l1.Set("company", acme.Id)
	l1.Set("owner", admin.Id)
	l1.Set("expected_close", "2025-04-15 00:00:00.000Z")
	if err := app.Save(l1); err != nil {
		return fmt.Errorf("create lead Migration cloud: %w", err)
	}

	l2 := core.NewRecord(leadsCol)
	l2.Set("title", "Plateforme donnees BioVert")
	l2.Set("value", 45000)
	l2.Set("status", "proposition")
	l2.Set("priority", "moyenne")
	l2.Set("source", "salon")
	l2.Set("contact", c3.Id)
	l2.Set("company", biovert.Id)
	l2.Set("owner", commercial.Id)
	l2.Set("expected_close", "2025-05-30 00:00:00.000Z")
	if err := app.Save(l2); err != nil {
		return fmt.Errorf("create lead Plateforme BioVert: %w", err)
	}

	l3 := core.NewRecord(leadsCol)
	l3.Set("title", "Consulting IA DataFlow")
	l3.Set("value", 20000)
	l3.Set("status", "nouveau")
	l3.Set("priority", "basse")
	l3.Set("source", "site_web")
	l3.Set("contact", c5.Id)
	l3.Set("company", dataflow.Id)
	l3.Set("owner", admin.Id)
	l3.Set("expected_close", "2025-07-01 00:00:00.000Z")
	if err := app.Save(l3); err != nil {
		return fmt.Errorf("create lead Consulting IA: %w", err)
	}

	l4 := core.NewRecord(leadsCol)
	l4.Set("title", "Logiciel gestion EcoLogis")
	l4.Set("value", 120000)
	l4.Set("status", "negociation")
	l4.Set("priority", "urgente")
	l4.Set("source", "telephone")
	l4.Set("contact", c7.Id)
	l4.Set("company", ecologis.Id)
	l4.Set("owner", commercial.Id)
	l4.Set("expected_close", "2025-03-15 00:00:00.000Z")
	if err := app.Save(l4); err != nil {
		return fmt.Errorf("create lead Logiciel EcoLogis: %w", err)
	}

	l5 := core.NewRecord(leadsCol)
	l5.Set("title", "Audit securite FinTech Plus")
	l5.Set("value", 35000)
	l5.Set("status", "gagne")
	l5.Set("priority", "haute")
	l5.Set("source", "email")
	l5.Set("contact", c9.Id)
	l5.Set("company", fintech.Id)
	l5.Set("owner", commercial.Id)
	l5.Set("expected_close", "2025-02-28 00:00:00.000Z")
	l5.Set("closed_at", "2025-02-20 00:00:00.000Z")
	if err := app.Save(l5); err != nil {
		return fmt.Errorf("create lead Audit FinTech: %w", err)
	}

	// ==========================================
	// TASKS (5)
	// ==========================================
	tasksCol, err := app.FindCollectionByNameOrId("tasks")
	if err != nil {
		return fmt.Errorf("find tasks collection: %w", err)
	}

	t1 := core.NewRecord(tasksCol)
	t1.Set("title", "Appeler Jean Durand - suivi migration")
	t1.Set("description", "Discuter du calendrier de migration cloud")
	t1.Set("type", "appel")
	t1.Set("status", "a_faire")
	t1.Set("priority", "haute")
	t1.Set("due_date", "2025-03-10 10:00:00.000Z")
	t1.Set("assignee", admin.Id)
	t1.Set("created_by", admin.Id)
	t1.Set("contact", c1.Id)
	t1.Set("lead", l1.Id)
	t1.Set("company", acme.Id)
	if err := app.Save(t1); err != nil {
		return fmt.Errorf("create task appel Durand: %w", err)
	}

	t2 := core.NewRecord(tasksCol)
	t2.Set("title", "Envoyer proposition BioVert")
	t2.Set("description", "Finaliser et envoyer la proposition commerciale")
	t2.Set("type", "email")
	t2.Set("status", "en_cours")
	t2.Set("priority", "urgente")
	t2.Set("due_date", "2025-03-05 14:00:00.000Z")
	t2.Set("assignee", commercial.Id)
	t2.Set("created_by", admin.Id)
	t2.Set("contact", c3.Id)
	t2.Set("lead", l2.Id)
	t2.Set("company", biovert.Id)
	if err := app.Save(t2); err != nil {
		return fmt.Errorf("create task proposition BioVert: %w", err)
	}

	t3 := core.NewRecord(tasksCol)
	t3.Set("title", "Reunion decouverte DataFlow")
	t3.Set("description", "Premiere reunion pour comprendre les besoins IA")
	t3.Set("type", "reunion")
	t3.Set("status", "a_faire")
	t3.Set("priority", "moyenne")
	t3.Set("due_date", "2025-03-20 09:00:00.000Z")
	t3.Set("assignee", admin.Id)
	t3.Set("created_by", commercial.Id)
	t3.Set("contact", c5.Id)
	t3.Set("lead", l3.Id)
	t3.Set("company", dataflow.Id)
	if err := app.Save(t3); err != nil {
		return fmt.Errorf("create task reunion DataFlow: %w", err)
	}

	t4 := core.NewRecord(tasksCol)
	t4.Set("title", "Suivi negociation EcoLogis")
	t4.Set("type", "suivi")
	t4.Set("status", "a_faire")
	t4.Set("priority", "urgente")
	t4.Set("due_date", "2025-03-08 11:00:00.000Z")
	t4.Set("assignee", commercial.Id)
	t4.Set("created_by", commercial.Id)
	t4.Set("contact", c7.Id)
	t4.Set("lead", l4.Id)
	t4.Set("company", ecologis.Id)
	if err := app.Save(t4); err != nil {
		return fmt.Errorf("create task suivi EcoLogis: %w", err)
	}

	t5 := core.NewRecord(tasksCol)
	t5.Set("title", "Preparer rapport audit FinTech")
	t5.Set("description", "Rapport final de l'audit de securite")
	t5.Set("type", "autre")
	t5.Set("status", "terminee")
	t5.Set("priority", "haute")
	t5.Set("due_date", "2025-02-25 16:00:00.000Z")
	t5.Set("completed_at", "2025-02-24 15:30:00.000Z")
	t5.Set("assignee", admin.Id)
	t5.Set("created_by", commercial.Id)
	t5.Set("contact", c9.Id)
	t5.Set("lead", l5.Id)
	t5.Set("company", fintech.Id)
	if err := app.Save(t5); err != nil {
		return fmt.Errorf("create task rapport FinTech: %w", err)
	}

	// Suppress unused variable warnings
	_ = c2
	_ = c4
	_ = c6
	_ = c8
	_ = c10
	_ = standard
	_ = t1
	_ = t2
	_ = t3
	_ = t4
	_ = t5

	// ==========================================
	// INVOICES (8 — varied statuses)
	// ==========================================
	invoicesCol, err := app.FindCollectionByNameOrId("invoices")
	if err != nil {
		return fmt.Errorf("find invoices collection: %w", err)
	}

	// Helper: create invoice items JSON
	type InvoiceItem struct {
		Description string  `json:"description"`
		Qty         int     `json:"qty"`
		UnitPrice   float64 `json:"unit_price"`
	}

	inv1 := core.NewRecord(invoicesCol)
	inv1.Set("number", "FAC-2026-001")
	inv1.Set("contact", c1.Id)
	inv1.Set("company", acme.Id)
	inv1.Set("lead", l1.Id)
	inv1.Set("owner", admin.Id)
	inv1.Set("amount", 75000.0)
	inv1.Set("tax_rate", 20.0)
	inv1.Set("total", 90000.0)
	inv1.Set("status", "payee")
	inv1.Set("issued_at", "2026-01-15 00:00:00.000Z")
	inv1.Set("due_at", "2026-02-15 00:00:00.000Z")
	inv1.Set("paid_at", "2026-02-10 00:00:00.000Z")
	inv1.Set("items", []InvoiceItem{
		{Description: "Migration cloud - forfait", Qty: 1, UnitPrice: 60000},
		{Description: "Formation équipe (5 jours)", Qty: 5, UnitPrice: 3000},
	})
	if err := app.Save(inv1); err != nil {
		return fmt.Errorf("create invoice FAC-2026-001: %w", err)
	}

	inv2 := core.NewRecord(invoicesCol)
	inv2.Set("number", "FAC-2026-002")
	inv2.Set("contact", c3.Id)
	inv2.Set("company", biovert.Id)
	inv2.Set("lead", l2.Id)
	inv2.Set("owner", commercial.Id)
	inv2.Set("amount", 22500.0)
	inv2.Set("tax_rate", 20.0)
	inv2.Set("total", 27000.0)
	inv2.Set("status", "emise")
	inv2.Set("issued_at", "2026-02-01 00:00:00.000Z")
	inv2.Set("due_at", "2026-03-01 00:00:00.000Z")
	inv2.Set("items", []InvoiceItem{
		{Description: "Développement plateforme données - phase 1", Qty: 1, UnitPrice: 22500},
	})
	if err := app.Save(inv2); err != nil {
		return fmt.Errorf("create invoice FAC-2026-002: %w", err)
	}

	inv3 := core.NewRecord(invoicesCol)
	inv3.Set("number", "FAC-2026-003")
	inv3.Set("contact", c5.Id)
	inv3.Set("company", dataflow.Id)
	inv3.Set("owner", admin.Id)
	inv3.Set("amount", 8000.0)
	inv3.Set("tax_rate", 20.0)
	inv3.Set("total", 9600.0)
	inv3.Set("status", "brouillon")
	inv3.Set("issued_at", "2026-02-20 00:00:00.000Z")
	inv3.Set("due_at", "2026-03-20 00:00:00.000Z")
	inv3.Set("items", []InvoiceItem{
		{Description: "Audit architecture IA", Qty: 4, UnitPrice: 1500},
		{Description: "Rapport de recommandations", Qty: 1, UnitPrice: 2000},
	})
	if err := app.Save(inv3); err != nil {
		return fmt.Errorf("create invoice FAC-2026-003: %w", err)
	}

	inv4 := core.NewRecord(invoicesCol)
	inv4.Set("number", "FAC-2026-004")
	inv4.Set("contact", c7.Id)
	inv4.Set("company", ecologis.Id)
	inv4.Set("lead", l4.Id)
	inv4.Set("owner", commercial.Id)
	inv4.Set("amount", 45000.0)
	inv4.Set("tax_rate", 20.0)
	inv4.Set("total", 54000.0)
	inv4.Set("status", "en_retard")
	inv4.Set("issued_at", "2025-12-01 00:00:00.000Z")
	inv4.Set("due_at", "2026-01-01 00:00:00.000Z")
	inv4.Set("items", []InvoiceItem{
		{Description: "Licence logiciel gestion (annuelle)", Qty: 1, UnitPrice: 35000},
		{Description: "Installation et configuration", Qty: 1, UnitPrice: 10000},
	})
	if err := app.Save(inv4); err != nil {
		return fmt.Errorf("create invoice FAC-2026-004: %w", err)
	}

	inv5 := core.NewRecord(invoicesCol)
	inv5.Set("number", "FAC-2026-005")
	inv5.Set("contact", c9.Id)
	inv5.Set("company", fintech.Id)
	inv5.Set("lead", l5.Id)
	inv5.Set("owner", commercial.Id)
	inv5.Set("amount", 35000.0)
	inv5.Set("tax_rate", 20.0)
	inv5.Set("total", 42000.0)
	inv5.Set("status", "payee")
	inv5.Set("issued_at", "2025-11-15 00:00:00.000Z")
	inv5.Set("due_at", "2025-12-15 00:00:00.000Z")
	inv5.Set("paid_at", "2025-12-10 00:00:00.000Z")
	inv5.Set("items", []InvoiceItem{
		{Description: "Audit sécurité complet", Qty: 1, UnitPrice: 30000},
		{Description: "Rapport et plan de remédiation", Qty: 1, UnitPrice: 5000},
	})
	if err := app.Save(inv5); err != nil {
		return fmt.Errorf("create invoice FAC-2026-005: %w", err)
	}

	inv6 := core.NewRecord(invoicesCol)
	inv6.Set("number", "FAC-2026-006")
	inv6.Set("contact", c2.Id)
	inv6.Set("company", acme.Id)
	inv6.Set("owner", admin.Id)
	inv6.Set("amount", 12000.0)
	inv6.Set("tax_rate", 20.0)
	inv6.Set("total", 14400.0)
	inv6.Set("status", "emise")
	inv6.Set("issued_at", "2026-02-10 00:00:00.000Z")
	inv6.Set("due_at", "2026-03-10 00:00:00.000Z")
	inv6.Set("items", []InvoiceItem{
		{Description: "Maintenance applicative mensuelle", Qty: 3, UnitPrice: 4000},
	})
	if err := app.Save(inv6); err != nil {
		return fmt.Errorf("create invoice FAC-2026-006: %w", err)
	}

	inv7 := core.NewRecord(invoicesCol)
	inv7.Set("number", "FAC-2026-007")
	inv7.Set("contact", c6.Id)
	inv7.Set("company", dataflow.Id)
	inv7.Set("owner", admin.Id)
	inv7.Set("amount", 5500.0)
	inv7.Set("tax_rate", 20.0)
	inv7.Set("total", 6600.0)
	inv7.Set("status", "annulee")
	inv7.Set("issued_at", "2025-10-01 00:00:00.000Z")
	inv7.Set("due_at", "2025-11-01 00:00:00.000Z")
	inv7.Set("items", []InvoiceItem{
		{Description: "Prestation conseil annulée", Qty: 1, UnitPrice: 5500},
	})
	if err := app.Save(inv7); err != nil {
		return fmt.Errorf("create invoice FAC-2026-007: %w", err)
	}

	inv8 := core.NewRecord(invoicesCol)
	inv8.Set("number", "FAC-2026-008")
	inv8.Set("contact", c10.Id)
	inv8.Set("company", fintech.Id)
	inv8.Set("owner", commercial.Id)
	inv8.Set("amount", 18500.0)
	inv8.Set("tax_rate", 20.0)
	inv8.Set("total", 22200.0)
	inv8.Set("status", "brouillon")
	inv8.Set("issued_at", "2026-02-25 00:00:00.000Z")
	inv8.Set("due_at", "2026-03-25 00:00:00.000Z")
	inv8.Set("items", []InvoiceItem{
		{Description: "Développement module conformité DORA", Qty: 1, UnitPrice: 15000},
		{Description: "Tests et recette", Qty: 1, UnitPrice: 3500},
	})
	if err := app.Save(inv8); err != nil {
		return fmt.Errorf("create invoice FAC-2026-008: %w", err)
	}

	_ = inv1
	_ = inv2
	_ = inv3
	_ = inv4
	_ = inv5
	_ = inv6
	_ = inv7
	_ = inv8

	fmt.Println("Seed completed: 3 users, 5 companies, 10 contacts, 5 leads, 5 tasks, 8 invoices")
	return nil
}
