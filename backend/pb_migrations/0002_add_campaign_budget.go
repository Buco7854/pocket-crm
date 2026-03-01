package pb_migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		campaigns := findOrCreateBase(app, "campaigns")
		// Add budget field if not already present
		if campaigns.Fields.GetByName("budget") == nil {
			campaigns.Fields.Add(&core.NumberField{Name: "budget", Min: floatPtr(0)})
			if err := app.Save(campaigns); err != nil {
				return err
			}
		}
		return nil
	}, func(app core.App) error {
		// Rollback: remove budget field
		campaigns, err := app.FindCollectionByNameOrId("campaigns")
		if err != nil {
			return nil
		}
		if f := campaigns.Fields.GetByName("budget"); f != nil {
			campaigns.Fields.RemoveById(f.GetId())
			return app.Save(campaigns)
		}
		return nil
	})
}
