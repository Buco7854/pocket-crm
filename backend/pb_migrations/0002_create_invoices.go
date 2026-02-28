package pb_migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		adminOnly := strPtr("@request.auth.role = 'admin'")
		adminOrCommercial := strPtr("@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'commercial')")
		adminOrCommercialOwner := strPtr("@request.auth.role = 'admin' || owner = @request.auth.id")

		// Resolve dependency collections
		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}
		contacts, err := app.FindCollectionByNameOrId("contacts")
		if err != nil {
			return err
		}
		companies, err := app.FindCollectionByNameOrId("companies")
		if err != nil {
			return err
		}
		leads, err := app.FindCollectionByNameOrId("leads")
		if err != nil {
			return err
		}

		// ==========================================
		// INVOICES
		// ==========================================
		invoices := findOrCreateBase(app, "invoices")

		invoices.Fields.Add(&core.TextField{
			Name:     "number",
			Required: true,
			Max:      50,
		})
		invoices.Fields.Add(&core.RelationField{
			Name:         "contact",
			CollectionId: contacts.Id,
			MaxSelect:    1,
		})
		invoices.Fields.Add(&core.RelationField{
			Name:         "company",
			CollectionId: companies.Id,
			MaxSelect:    1,
		})
		invoices.Fields.Add(&core.RelationField{
			Name:         "lead",
			CollectionId: leads.Id,
			MaxSelect:    1,
		})
		invoices.Fields.Add(&core.RelationField{
			Name:         "owner",
			CollectionId: users.Id,
			MaxSelect:    1,
			Required:     true,
		})
		invoices.Fields.Add(&core.NumberField{
			Name: "amount",
			Min:  floatPtr(0),
		})
		invoices.Fields.Add(&core.NumberField{
			Name: "tax_rate",
			Min:  floatPtr(0),
			Max:  floatPtr(100),
		})
		invoices.Fields.Add(&core.NumberField{
			Name: "total",
			Min:  floatPtr(0),
		})
		invoices.Fields.Add(&core.SelectField{
			Name:      "status",
			Required:  true,
			Values:    []string{"brouillon", "emise", "payee", "en_retard", "annulee"},
			MaxSelect: 1,
		})
		invoices.Fields.Add(&core.DateField{Name: "issued_at"})
		invoices.Fields.Add(&core.DateField{Name: "due_at"})
		invoices.Fields.Add(&core.DateField{Name: "paid_at"})
		invoices.Fields.Add(&core.JSONField{
			Name:    "items",
			MaxSize: 100000,
		})
		invoices.Fields.Add(&core.EditorField{Name: "notes", MaxSize: 50000})

		// API rules (5.27)
		// Lecture : tout utilisateur authentifié
		invoices.ListRule = strPtr("@request.auth.id != ''")
		invoices.ViewRule = strPtr("@request.auth.id != ''")
		// Création/modification : admin ou commercial propriétaire
		invoices.CreateRule = adminOrCommercial
		invoices.UpdateRule = adminOrCommercialOwner
		// Suppression : admin uniquement
		invoices.DeleteRule = adminOnly

		if err := app.Save(invoices); err != nil {
			return err
		}

		return nil
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("invoices")
		if err != nil {
			return nil // already gone
		}
		return app.Delete(col)
	})
}
