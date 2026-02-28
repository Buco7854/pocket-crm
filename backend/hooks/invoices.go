package hooks

import (
	"log"
	"time"

	"github.com/pocketbase/pocketbase/core"
)

// RegisterInvoiceHooks attaches lifecycle hooks to the invoices collection.
//
// Hook 1 — Auto-calculate total TTC on create/update:
//
//	total = amount * (1 + tax_rate / 100)
//
// Hook 2 — Mark overdue invoices:
//
//	On every invoice save, if the invoice is "emise" and due_at < now → set status "en_retard"
func RegisterInvoiceHooks(app core.App) {
	// ----------------------------------------------------------------
	// HOOK 1 & 2 — Before create
	// ----------------------------------------------------------------
	app.OnRecordCreate("invoices").BindFunc(func(e *core.RecordEvent) error {
		calcTotal(e.Record)
		checkOverdue(e.Record)
		return e.Next()
	})

	// ----------------------------------------------------------------
	// HOOK 1 & 2 — Before update
	// ----------------------------------------------------------------
	app.OnRecordUpdate("invoices").BindFunc(func(e *core.RecordEvent) error {
		calcTotal(e.Record)
		checkOverdue(e.Record)
		return e.Next()
	})

	log.Println("[hooks] Invoice hooks registered (auto-total, overdue check)")
}

// calcTotal computes total TTC from amount and tax_rate.
func calcTotal(record *core.Record) {
	amount := record.GetFloat("amount")
	taxRate := record.GetFloat("tax_rate")
	total := amount * (1 + taxRate/100)
	record.Set("total", total)
}

// checkOverdue transitions "emise" invoices past their due_at to "en_retard".
func checkOverdue(record *core.Record) {
	status := record.GetString("status")
	if status != "emise" {
		return
	}
	dueAtStr := record.GetString("due_at")
	if dueAtStr == "" {
		return
	}
	dueAt, err := time.Parse("2006-01-02 15:04:05.000Z", dueAtStr)
	if err != nil {
		// Try alternate format
		dueAt, err = time.Parse("2006-01-02", dueAtStr[:10])
		if err != nil {
			return
		}
	}
	if time.Now().UTC().After(dueAt) {
		record.Set("status", "en_retard")
	}
}
