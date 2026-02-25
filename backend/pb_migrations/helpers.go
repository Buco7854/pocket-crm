package pb_migrations

import "github.com/pocketbase/pocketbase/core"

func strPtr(s string) *string {
	return &s
}

func floatPtr(f float64) *float64 {
	return &f
}

// findOrCreateBase returns the existing base collection or a new one.
func findOrCreateBase(app core.App, name string) *core.Collection {
	col, err := app.FindCollectionByNameOrId(name)
	if err != nil {
		col = core.NewBaseCollection(name)
	}
	return col
}
