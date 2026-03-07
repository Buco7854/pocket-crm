package main

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/spf13/cobra"

	_ "pocket-crm/pb_migrations"

	"pocket-crm/hooks"
	"pocket-crm/seeds"
)

func main() {
	// Load .env for local dev (Docker injects vars via env_file, so this is a no-op there)
	loadDotEnv()

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

	// Bootstrap from env vars: create superuser + apply SMTP settings
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		bootstrapFromEnv(app)
		return se.Next()
	})

	// Phase 5 — Invoice hooks (auto-calculate TTC total + overdue check)
	hooks.RegisterInvoiceHooks(app)

	// Phase 6 — Lead lifecycle hooks (activity tracking + owner notifications)
	hooks.RegisterLeadHooks(app)

	// Phase 6 — Email API routes + welcome hook
	hooks.RegisterEmailRoutes(app)

	// Phase 6 — Scheduled campaign background sender (60s cron)
	hooks.RegisterCampaignScheduler(app)

	// Phase 7 — Analytics & statistics routes
	hooks.RegisterStatsRoutes(app)

	// Campaign ↔ expense category type validation
	hooks.RegisterMarketingExpenseHooks(app)

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

// bootstrapFromEnv creates the superuser and configures SMTP from environment variables.
// Runs once after PocketBase has bootstrapped (settings + DB ready).
func bootstrapFromEnv(app *pocketbase.PocketBase) {
	// --- Superuser creation ---
	adminEmail := os.Getenv("PB_ADMIN_EMAIL")
	adminPwd := os.Getenv("PB_ADMIN_PASSWORD")
	if adminEmail != "" && adminPwd != "" {
		existing, _ := app.FindAuthRecordByEmail(core.CollectionNameSuperusers, adminEmail)
		if existing == nil {
			superusers, err := app.FindCollectionByNameOrId(core.CollectionNameSuperusers)
			if err != nil {
				log.Printf("[init] could not find _superusers collection: %v", err)
			} else {
				admin := core.NewRecord(superusers)
				admin.SetEmail(adminEmail)
				admin.SetPassword(adminPwd)
				if err := app.Save(admin); err != nil {
					log.Printf("[init] failed to create superuser %s: %v", adminEmail, err)
				} else {
					log.Printf("[init] superuser created: %s", adminEmail)
				}
			}
		} else {
			log.Printf("[init] superuser already exists: %s", adminEmail)
		}
	}

	// --- SMTP configuration ---
	// Env vars override in-memory settings so email sending always uses .env values.
	// Note: the Admin UI shows DB-persisted settings; use the UI to also update them there
	// if you want them visible in the dashboard.
	smtpHost := os.Getenv("SMTP_HOST")
	if smtpHost != "" {
		s := app.Settings()

		port, _ := strconv.Atoi(os.Getenv("SMTP_PORT"))
		if port == 0 {
			port = 587
		}

		tls := os.Getenv("SMTP_TLS") == "true"

		s.SMTP.Enabled = true
		s.SMTP.Host = smtpHost
		s.SMTP.Port = port
		s.SMTP.Username = os.Getenv("SMTP_USER")
		s.SMTP.Password = os.Getenv("SMTP_PASSWORD")
		s.SMTP.TLS = tls

		if v := os.Getenv("SMTP_FROM"); v != "" {
			s.Meta.SenderAddress = v
		}
		if v := os.Getenv("SMTP_SENDER_NAME"); v != "" {
			s.Meta.SenderName = v
		}
		if v := os.Getenv("PB_APP_URL"); v != "" {
			s.Meta.AppURL = v
		}

		log.Printf("[init] SMTP configured: %s:%d tls=%v (user=%s)", smtpHost, port, tls, os.Getenv("SMTP_USER"))
	}
}

// loadDotEnv reads a .env file from the current working directory and sets any
// unset environment variables. Variables already present in the environment
// (e.g. injected by Docker) take precedence and are never overwritten.
func loadDotEnv() {
	data, err := os.ReadFile(".env")
	if err != nil {
		return // no .env file — that's fine
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		if os.Getenv(key) == "" {
			os.Setenv(key, val) //nolint:errcheck
		}
	}
}
