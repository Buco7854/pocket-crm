package main

import (
	"log"

	"github.com/pocketbase/pocketbase"
	"github.com/spf13/cobra"

	// Auto-register Go migrations on startup
	_ "pocket-crm/pb_migrations"

	"pocket-crm/seeds"
)

func main() {
	app := pocketbase.New()

	// Dev-only command: ./pocket-crm seed
	app.RootCmd.AddCommand(&cobra.Command{
		Use:   "seed",
		Short: "Populate the database with test data (dev only)",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := app.Bootstrap(); err != nil {
				return err
			}
			return seeds.Run(app)
		},
	})

	// Custom hooks and routes will be registered here in Phase 6
	// Example:
	// hooks.RegisterLeadHooks(app)
	// hooks.RegisterEmailRoutes(app)

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
