package main

import (
	"log"

	"github.com/pocketbase/pocketbase"
)

func main() {
	app := pocketbase.New()

	// Custom hooks and routes will be registered here in Phase 6
	// Example:
	// hooks.RegisterLeadHooks(app)
	// hooks.RegisterEmailRoutes(app)

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
