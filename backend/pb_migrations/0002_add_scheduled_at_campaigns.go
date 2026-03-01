package pb_migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		campaigns, err := app.FindCollectionByNameOrId("campaigns")
		if err != nil {
			return err
		}

		// Add optional scheduled_at DateField
		campaigns.Fields.Add(&core.DateField{
			Name: "scheduled_at",
		})

		// Update status SelectField to include "programmee"
		if sf, ok := campaigns.Fields.GetByName("status").(*core.SelectField); ok {
			sf.Values = []string{"brouillon", "programmee", "en_cours", "envoye", "termine"}
		}

		return app.Save(campaigns)
	}, func(app core.App) error {
		campaigns, err := app.FindCollectionByNameOrId("campaigns")
		if err != nil {
			return err
		}

		// Remove scheduled_at field
		field := campaigns.Fields.GetByName("scheduled_at")
		if field != nil {
			campaigns.Fields.Remove(field.GetId())
		}

		// Revert status SelectField values
		if sf, ok := campaigns.Fields.GetByName("status").(*core.SelectField); ok {
			sf.Values = []string{"brouillon", "en_cours", "envoye", "termine"}
		}

		return app.Save(campaigns)
	}, "0002_add_scheduled_at_campaigns")
}
