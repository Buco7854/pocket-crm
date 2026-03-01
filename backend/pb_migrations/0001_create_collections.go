package pb_migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// Common API rules
		auth := strPtr("@request.auth.id != ''")
		adminOnly := strPtr("@request.auth.role = 'admin'")
		adminOrCommercial := strPtr("@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'commercial')")

		// ==========================================
		// USERS (update existing auth collection)
		// ==========================================
		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			users = core.NewAuthCollection("users")
		}
		users.Fields.Add(&core.TextField{
			Name:     "name",
			Required: true,
			Max:      200,
		})
		users.Fields.Add(&core.SelectField{
			Name:      "role",
			Required:  true,
			Values:    []string{"admin", "commercial", "standard"},
			MaxSelect: 1,
		})
		users.Fields.Add(&core.FileField{
			Name:      "avatar",
			MaxSize:   5242880,
			MaxSelect: 1,
			MimeTypes: []string{"image/jpeg", "image/png", "image/gif", "image/webp"},
		})
		users.Fields.Add(&core.TextField{
			Name: "phone",
			Max:  50,
		})

		users.ListRule = auth
		users.ViewRule = auth
		users.CreateRule = strPtr("")
		users.UpdateRule = strPtr("id = @request.auth.id || @request.auth.role = 'admin'")
		users.DeleteRule = adminOnly

		if err := app.Save(users); err != nil {
			return err
		}

		// ==========================================
		// COMPANIES
		// ==========================================
		companies := findOrCreateBase(app, "companies")
		companies.Fields.Add(&core.TextField{Name: "name", Required: true, Max: 300})
		companies.Fields.Add(&core.TextField{Name: "industry", Max: 200})
		companies.Fields.Add(&core.URLField{Name: "website"})
		companies.Fields.Add(&core.EmailField{Name: "email"})
		companies.Fields.Add(&core.TextField{Name: "phone", Max: 50})
		companies.Fields.Add(&core.TextField{Name: "address", Max: 500})
		companies.Fields.Add(&core.TextField{Name: "city", Max: 200})
		companies.Fields.Add(&core.TextField{Name: "country", Max: 200})
		companies.Fields.Add(&core.SelectField{
			Name:      "size",
			Values:    []string{"tpe", "pme", "eti", "grande_entreprise"},
			MaxSelect: 1,
		})
		companies.Fields.Add(&core.NumberField{Name: "revenue", Min: floatPtr(0)})
		companies.Fields.Add(&core.RelationField{
			Name:         "owner",
			CollectionId: users.Id,
			MaxSelect:    1,
		})
		companies.Fields.Add(&core.EditorField{Name: "notes", MaxSize: 50000})
		companies.Fields.Add(&core.FileField{
			Name:      "logo",
			MaxSize:   5242880,
			MaxSelect: 1,
			MimeTypes: []string{"image/jpeg", "image/png", "image/svg+xml", "image/webp"},
		})

		companies.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		companies.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})

		companies.ListRule = auth
		companies.ViewRule = auth
		companies.CreateRule = adminOrCommercial
		companies.UpdateRule = strPtr("@request.auth.role = 'admin' || owner = @request.auth.id")
		companies.DeleteRule = adminOnly

		if err := app.Save(companies); err != nil {
			return err
		}

		// ==========================================
		// CONTACTS
		// ==========================================
		contacts := findOrCreateBase(app, "contacts")
		contacts.Fields.Add(&core.TextField{Name: "first_name", Required: true, Max: 200})
		contacts.Fields.Add(&core.TextField{Name: "last_name", Required: true, Max: 200})
		contacts.Fields.Add(&core.EmailField{Name: "email"})
		contacts.Fields.Add(&core.TextField{Name: "phone", Max: 50})
		contacts.Fields.Add(&core.TextField{Name: "position", Max: 200})
		contacts.Fields.Add(&core.RelationField{
			Name:         "company",
			CollectionId: companies.Id,
			MaxSelect:    1,
		})
		contacts.Fields.Add(&core.RelationField{
			Name:         "owner",
			CollectionId: users.Id,
			MaxSelect:    1,
		})
		contacts.Fields.Add(&core.EditorField{Name: "notes", MaxSize: 50000})
		contacts.Fields.Add(&core.SelectField{
			Name:      "tags",
			Values:    []string{"prospect", "client", "partenaire", "fournisseur"},
			MaxSelect: 4,
		})

		contacts.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		contacts.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})

		contacts.ListRule = auth
		contacts.ViewRule = auth
		contacts.CreateRule = adminOrCommercial
		contacts.UpdateRule = strPtr("@request.auth.role = 'admin' || owner = @request.auth.id")
		contacts.DeleteRule = adminOnly

		if err := app.Save(contacts); err != nil {
			return err
		}

		// ==========================================
		// LEADS
		// ==========================================
		leads := findOrCreateBase(app, "leads")
		leads.Fields.Add(&core.TextField{Name: "title", Required: true, Max: 300})
		leads.Fields.Add(&core.NumberField{Name: "value", Min: floatPtr(0)})
		leads.Fields.Add(&core.SelectField{
			Name:      "status",
			Required:  true,
			Values:    []string{"nouveau", "contacte", "qualifie", "proposition", "negociation", "gagne", "perdu"},
			MaxSelect: 1,
		})
		leads.Fields.Add(&core.SelectField{
			Name:      "priority",
			Values:    []string{"basse", "moyenne", "haute", "urgente"},
			MaxSelect: 1,
		})
		leads.Fields.Add(&core.SelectField{
			Name:      "source",
			Values:    []string{"site_web", "email", "telephone", "salon", "recommandation", "autre"},
			MaxSelect: 1,
		})
		leads.Fields.Add(&core.RelationField{
			Name:         "contact",
			CollectionId: contacts.Id,
			MaxSelect:    1,
		})
		leads.Fields.Add(&core.RelationField{
			Name:         "company",
			CollectionId: companies.Id,
			MaxSelect:    1,
		})
		leads.Fields.Add(&core.RelationField{
			Name:         "owner",
			CollectionId: users.Id,
			MaxSelect:    1,
		})
		leads.Fields.Add(&core.DateField{Name: "expected_close"})
		leads.Fields.Add(&core.DateField{Name: "closed_at"})
		leads.Fields.Add(&core.EditorField{Name: "notes", MaxSize: 50000})

		leads.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		leads.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})

		leads.ListRule = auth
		leads.ViewRule = auth
		leads.CreateRule = adminOrCommercial
		leads.UpdateRule = strPtr("@request.auth.role = 'admin' || owner = @request.auth.id")
		leads.DeleteRule = adminOnly

		if err := app.Save(leads); err != nil {
			return err
		}

		// ==========================================
		// TASKS
		// ==========================================
		tasks := findOrCreateBase(app, "tasks")
		tasks.Fields.Add(&core.TextField{Name: "title", Required: true, Max: 300})
		tasks.Fields.Add(&core.EditorField{Name: "description", MaxSize: 50000})
		tasks.Fields.Add(&core.SelectField{
			Name:      "type",
			Values:    []string{"appel", "email", "reunion", "suivi", "autre"},
			MaxSelect: 1,
		})
		tasks.Fields.Add(&core.SelectField{
			Name:      "status",
			Required:  true,
			Values:    []string{"a_faire", "en_cours", "terminee", "annulee"},
			MaxSelect: 1,
		})
		tasks.Fields.Add(&core.SelectField{
			Name:      "priority",
			Values:    []string{"basse", "moyenne", "haute", "urgente"},
			MaxSelect: 1,
		})
		tasks.Fields.Add(&core.DateField{Name: "due_date"})
		tasks.Fields.Add(&core.DateField{Name: "reminder_at"})
		tasks.Fields.Add(&core.DateField{Name: "completed_at"})
		tasks.Fields.Add(&core.RelationField{
			Name:         "assignee",
			CollectionId: users.Id,
			MaxSelect:    1,
		})
		tasks.Fields.Add(&core.RelationField{
			Name:         "created_by",
			CollectionId: users.Id,
			MaxSelect:    1,
			Required:     true,
		})
		tasks.Fields.Add(&core.RelationField{
			Name:         "contact",
			CollectionId: contacts.Id,
			MaxSelect:    1,
		})
		tasks.Fields.Add(&core.RelationField{
			Name:         "lead",
			CollectionId: leads.Id,
			MaxSelect:    1,
		})
		tasks.Fields.Add(&core.RelationField{
			Name:         "company",
			CollectionId: companies.Id,
			MaxSelect:    1,
		})

		tasks.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		tasks.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})

		tasks.ListRule = auth
		tasks.ViewRule = auth
		tasks.CreateRule = auth
		tasks.UpdateRule = strPtr("@request.auth.role = 'admin' || assignee = @request.auth.id || created_by = @request.auth.id")
		tasks.DeleteRule = adminOnly

		if err := app.Save(tasks); err != nil {
			return err
		}

		// ==========================================
		// EMAIL_TEMPLATES
		// ==========================================
		emailTemplates := findOrCreateBase(app, "email_templates")
		emailTemplates.Fields.Add(&core.TextField{Name: "name", Required: true, Max: 300})
		emailTemplates.Fields.Add(&core.TextField{Name: "subject", Required: true, Max: 500})
		emailTemplates.Fields.Add(&core.EditorField{Name: "body", Required: true, MaxSize: 100000})
		emailTemplates.Fields.Add(&core.SelectField{
			Name:      "type",
			Required:  true,
			Values:    []string{"marketing", "transactionnel", "relance", "bienvenue"},
			MaxSelect: 1,
		})
		emailTemplates.Fields.Add(&core.BoolField{Name: "active"})
		emailTemplates.Fields.Add(&core.RelationField{
			Name:         "created_by",
			CollectionId: users.Id,
			MaxSelect:    1,
			Required:     true,
		})

		emailTemplates.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		emailTemplates.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})

		emailTemplates.ListRule = auth
		emailTemplates.ViewRule = auth
		emailTemplates.CreateRule = adminOnly
		emailTemplates.UpdateRule = strPtr("@request.auth.role = 'admin' || created_by = @request.auth.id")
		emailTemplates.DeleteRule = adminOnly

		if err := app.Save(emailTemplates); err != nil {
			return err
		}

		// ==========================================
		// EMAIL_LOGS (write by hooks only)
		// ==========================================
		emailLogs := findOrCreateBase(app, "email_logs")
		emailLogs.Fields.Add(&core.RelationField{
			Name:         "template",
			CollectionId: emailTemplates.Id,
			MaxSelect:    1,
		})
		emailLogs.Fields.Add(&core.EmailField{Name: "recipient_email", Required: true})
		emailLogs.Fields.Add(&core.RelationField{
			Name:         "recipient_contact",
			CollectionId: contacts.Id,
			MaxSelect:    1,
		})
		emailLogs.Fields.Add(&core.TextField{Name: "subject", Required: true, Max: 500})
		emailLogs.Fields.Add(&core.SelectField{
			Name:      "status",
			Required:  true,
			Values:    []string{"envoye", "echoue", "en_attente"},
			MaxSelect: 1,
		})
		emailLogs.Fields.Add(&core.DateField{Name: "sent_at"})
		emailLogs.Fields.Add(&core.TextField{Name: "error_message", Max: 1000})
		emailLogs.Fields.Add(&core.RelationField{
			Name:         "sent_by",
			CollectionId: users.Id,
			MaxSelect:    1,
			Required:     true,
		})
		emailLogs.Fields.Add(&core.TextField{Name: "campaign_id", Max: 50})
		emailLogs.Fields.Add(&core.NumberField{Name: "open_count", Min: floatPtr(0)})
		emailLogs.Fields.Add(&core.NumberField{Name: "click_count", Min: floatPtr(0)})
		emailLogs.Fields.Add(&core.DateField{Name: "opened_at"})
		emailLogs.Fields.Add(&core.DateField{Name: "clicked_at"})
		emailLogs.Fields.Add(&core.TextField{Name: "run_id", Max: 50})

		emailLogs.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		emailLogs.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})

		emailLogs.ListRule = auth
		emailLogs.ViewRule = auth
		// Create/Update/Delete = nil → hook-only (API disabled)

		if err := app.Save(emailLogs); err != nil {
			return err
		}

		// ==========================================
		// ACTIVITIES (write by hooks only)
		// ==========================================
		activities := findOrCreateBase(app, "activities")
		activities.Fields.Add(&core.SelectField{
			Name:      "type",
			Required:  true,
			Values:    []string{"creation", "modification", "email", "appel", "note", "statut_change"},
			MaxSelect: 1,
		})
		activities.Fields.Add(&core.TextField{Name: "description", Required: true, Max: 1000})
		activities.Fields.Add(&core.RelationField{
			Name:         "user",
			CollectionId: users.Id,
			MaxSelect:    1,
			Required:     true,
		})
		activities.Fields.Add(&core.RelationField{
			Name:         "contact",
			CollectionId: contacts.Id,
			MaxSelect:    1,
		})
		activities.Fields.Add(&core.RelationField{
			Name:         "lead",
			CollectionId: leads.Id,
			MaxSelect:    1,
		})
		activities.Fields.Add(&core.RelationField{
			Name:         "company",
			CollectionId: companies.Id,
			MaxSelect:    1,
		})
		activities.Fields.Add(&core.JSONField{Name: "metadata", MaxSize: 50000})

		activities.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		activities.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})

		activities.ListRule = auth
		activities.ViewRule = auth
		// Create/Update/Delete = nil → hook-only (API disabled)

		if err := app.Save(activities); err != nil {
			return err
		}

		// ==========================================
		// INVOICES
		// ==========================================
		invoices := findOrCreateBase(app, "invoices")
		invoices.Fields.Add(&core.TextField{Name: "number", Required: true, Max: 50})
		invoices.Fields.Add(&core.RelationField{Name: "contact", CollectionId: contacts.Id, MaxSelect: 1})
		invoices.Fields.Add(&core.RelationField{Name: "company", CollectionId: companies.Id, MaxSelect: 1})
		invoices.Fields.Add(&core.RelationField{Name: "lead", CollectionId: leads.Id, MaxSelect: 1})
		invoices.Fields.Add(&core.RelationField{Name: "owner", CollectionId: users.Id, MaxSelect: 1, Required: true})
		invoices.Fields.Add(&core.NumberField{Name: "amount", Min: floatPtr(0)})
		invoices.Fields.Add(&core.NumberField{Name: "tax_rate", Min: floatPtr(0), Max: floatPtr(100)})
		invoices.Fields.Add(&core.NumberField{Name: "total", Min: floatPtr(0)})
		invoices.Fields.Add(&core.SelectField{
			Name:      "status",
			Required:  true,
			Values:    []string{"brouillon", "emise", "payee", "en_retard", "annulee"},
			MaxSelect: 1,
		})
		invoices.Fields.Add(&core.DateField{Name: "issued_at"})
		invoices.Fields.Add(&core.DateField{Name: "due_at"})
		invoices.Fields.Add(&core.DateField{Name: "paid_at"})
		invoices.Fields.Add(&core.JSONField{Name: "items", MaxSize: 100000})
		invoices.Fields.Add(&core.EditorField{Name: "notes", MaxSize: 50000})

		invoices.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		invoices.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})

		invoices.ListRule = auth
		invoices.ViewRule = auth
		invoices.CreateRule = adminOrCommercial
		invoices.UpdateRule = strPtr("@request.auth.role = 'admin' || owner = @request.auth.id")
		invoices.DeleteRule = adminOnly

		if err := app.Save(invoices); err != nil {
			return err
		}

		// ==========================================
		// CAMPAIGNS
		// ==========================================
		campaigns := findOrCreateBase(app, "campaigns")
		campaigns.Fields.Add(&core.TextField{Name: "name", Required: true, Max: 300})
		campaigns.Fields.Add(&core.SelectField{
			Name:      "type",
			Required:  true,
			Values:    []string{"email", "ads", "social", "event", "seo", "autre"},
			MaxSelect: 1,
		})
		campaigns.Fields.Add(&core.RelationField{Name: "template", CollectionId: emailTemplates.Id, MaxSelect: 1, Required: false})
		campaigns.Fields.Add(&core.JSONField{Name: "contact_ids", MaxSize: 500000})
		campaigns.Fields.Add(&core.SelectField{
			Name:      "status",
			Required:  true,
			Values:    []string{"brouillon", "programmee", "en_cours", "envoye", "termine"},
			MaxSelect: 1,
		})
		campaigns.Fields.Add(&core.DateField{Name: "scheduled_at"})
		campaigns.Fields.Add(&core.NumberField{Name: "total", Min: floatPtr(0)})
		campaigns.Fields.Add(&core.NumberField{Name: "sent", Min: floatPtr(0)})
		campaigns.Fields.Add(&core.NumberField{Name: "failed", Min: floatPtr(0)})
		campaigns.Fields.Add(&core.TextField{Name: "campaign_key", Max: 50})
		campaigns.Fields.Add(&core.RelationField{Name: "created_by", CollectionId: users.Id, MaxSelect: 1, Required: true})
		campaigns.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		campaigns.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})

		campaigns.ListRule = auth
		campaigns.ViewRule = auth
		campaigns.CreateRule = adminOrCommercial
		campaigns.UpdateRule = strPtr("@request.auth.role = 'admin' || created_by = @request.auth.id")
		campaigns.DeleteRule = adminOnly

		if err := app.Save(campaigns); err != nil {
			return err
		}

		// Second-pass: add campaign_id to leads (campaigns must exist first)
		leads.Fields.Add(&core.RelationField{Name: "campaign_id", CollectionId: campaigns.Id, MaxSelect: 1})
		if err := app.Save(leads); err != nil {
			return err
		}

		// ==========================================
		// CAMPAIGN_RUNS (write by hooks only)
		// ==========================================
		campaignRuns := findOrCreateBase(app, "campaign_runs")
		campaignRuns.Fields.Add(&core.RelationField{Name: "campaign", CollectionId: campaigns.Id, MaxSelect: 1, Required: true})
		campaignRuns.Fields.Add(&core.NumberField{Name: "run_number", Min: floatPtr(1)})
		campaignRuns.Fields.Add(&core.NumberField{Name: "total", Min: floatPtr(0)})
		campaignRuns.Fields.Add(&core.NumberField{Name: "sent", Min: floatPtr(0)})
		campaignRuns.Fields.Add(&core.NumberField{Name: "failed", Min: floatPtr(0)})
		campaignRuns.Fields.Add(&core.RelationField{Name: "sent_by", CollectionId: users.Id, MaxSelect: 1})
		campaignRuns.Fields.Add(&core.DateField{Name: "sent_at"})
		campaignRuns.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		campaignRuns.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})

		campaignRuns.ListRule = auth
		campaignRuns.ViewRule = auth
		// Create/Update/Delete = nil → hook-only (API disabled)

		if err := app.Save(campaignRuns); err != nil {
			return err
		}

		// ==========================================
		// MARKETING_EXPENSES
		// ==========================================
		marketingExpenses := findOrCreateBase(app, "marketing_expenses")
		marketingExpenses.Fields.Add(&core.DateField{Name: "date", Required: true})
		marketingExpenses.Fields.Add(&core.NumberField{Name: "amount", Required: true, Min: floatPtr(0)})
		marketingExpenses.Fields.Add(&core.SelectField{
			Name:      "category",
			Required:  true,
			Values:    []string{"email", "site_web", "salon", "telephone", "recommandation", "autre"},
			MaxSelect: 1,
		})
		marketingExpenses.Fields.Add(&core.TextField{Name: "description", Max: 500})
		marketingExpenses.Fields.Add(&core.RelationField{Name: "campaign_id", CollectionId: campaigns.Id, MaxSelect: 1})
		marketingExpenses.Fields.Add(&core.RelationField{Name: "created_by", CollectionId: users.Id, Required: true, MaxSelect: 1})
		marketingExpenses.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		marketingExpenses.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})

		marketingExpenses.ListRule = auth
		marketingExpenses.ViewRule = auth
		marketingExpenses.CreateRule = adminOrCommercial
		marketingExpenses.UpdateRule = adminOrCommercial
		marketingExpenses.DeleteRule = adminOnly

		if err := app.Save(marketingExpenses); err != nil {
			return err
		}

		return nil
	}, func(app core.App) error {
		// Down: delete collections in reverse dependency order
		names := []string{
			"marketing_expenses",
			"campaign_runs",
			"campaigns",
			"activities",
			"email_logs",
			"email_templates",
			"tasks",
			"invoices",
			"leads",
			"contacts",
			"companies",
			"users",
		}
		for _, name := range names {
			col, err := app.FindCollectionByNameOrId(name)
			if err == nil {
				if err := app.Delete(col); err != nil {
					return err
				}
			}
		}
		return nil
	}, "0001_create_collections")
}
