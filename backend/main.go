package main

import (
	"log"

	"github.com/pocketbase/pocketbase"
	"github.com/spf13/cobra"

	_ "pocket-crm/pb_migrations"

	"pocket-crm/hooks"
	"pocket-crm/seeds"
)

func main() {
	app := pocketbase.New()

	// Dev-only command: ./pocket-crm seed [--force]
	seedCmd := &cobra.Command{
		Use:   "seed",
		Short: "Populate the database with test data (dev only)",
		RunE: func(cmd *cobra.Command, args []string) error {
			force, _ := cmd.Flags().GetBool("force")
			if err := app.Bootstrap(); err != nil {
				return err
			}
			if err := app.RunAppMigrations(); err != nil {
				return err
			}
			return seeds.Run(app, force)
		},
	}
	seedCmd.Flags().Bool("force", false, "delete existing data before seeding")
	app.RootCmd.AddCommand(seedCmd)

	// Phase 5 — Invoice hooks (auto-calculate TTC total + overdue check)
	hooks.RegisterInvoiceHooks(app)

	// Phase 6 — Lead lifecycle hooks (activity tracking + owner notifications)
	hooks.RegisterLeadHooks(app)

	// Phase 6 — Email API routes + welcome hook
	hooks.RegisterEmailRoutes(app)

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
