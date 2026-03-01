package hooks

import (
	"fmt"
	"log"
	"net/mail"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/mailer"
)

// RegisterLeadHooks attaches lifecycle hooks to the leads collection.
//
// Hook 1 — OnRecordCreate: create a "creation" activity entry.
// Hook 2 — OnRecordUpdate: detect status changes (create statut_change activity)
//
//	and owner changes (send notification email to the new owner).
func RegisterLeadHooks(app core.App) {
	// ── After creation: record creation activity ──────────────────────────────
	app.OnRecordCreate("leads").BindFunc(func(e *core.RecordEvent) error {
		// Auto-set closed_at when created directly as won or lost
		if status := e.Record.GetString("status"); (status == "gagne" || status == "perdu") && e.Record.GetString("closed_at") == "" {
			e.Record.Set("closed_at", time.Now().UTC().Format("2006-01-02 15:04:05.000Z"))
		}
		if err := e.Next(); err != nil {
			return err
		}
		createLeadActivity(app, e.Record, "creation",
			fmt.Sprintf("Opportunité \"%s\" créée", e.Record.GetString("title")),
		)
		return nil
	})

	// ── Before update: detect status / owner changes ──────────────────────────
	app.OnRecordUpdate("leads").BindFunc(func(e *core.RecordEvent) error {
		// Fetch current state from DB before the save
		oldRecord, err := app.FindRecordById("leads", e.Record.Id)
		if err != nil {
			// Cannot compare — just proceed
			return e.Next()
		}

		newStatus := e.Record.GetString("status")
		oldStatus := oldRecord.GetString("status")
		newOwner := e.Record.GetString("owner")
		oldOwner := oldRecord.GetString("owner")
		leadTitle := e.Record.GetString("title")

		// Auto-set closed_at when transitioning to won or lost
		if (newStatus == "gagne" || newStatus == "perdu") && newStatus != oldStatus && e.Record.GetString("closed_at") == "" {
			e.Record.Set("closed_at", time.Now().UTC().Format("2006-01-02 15:04:05.000Z"))
		}

		if err := e.Next(); err != nil {
			return err
		}

		// Status change activity
		if newStatus != oldStatus {
			desc := fmt.Sprintf(
				"Opportunité \"%s\" : statut changé de \"%s\" → \"%s\"",
				leadTitle, oldStatus, newStatus,
			)
			createLeadActivity(app, e.Record, "statut_change", desc)
		}

		// Owner change notification
		if newOwner != oldOwner && newOwner != "" {
			sendLeadAssignmentEmail(app, e.Record, newOwner)
		}

		return nil
	})

	log.Println("[hooks] Lead hooks registered (activity tracking, owner notification)")
}

// createLeadActivity inserts a new record into the activities collection.
func createLeadActivity(app core.App, lead *core.Record, activityType, description string) {
	col, err := app.FindCollectionByNameOrId("activities")
	if err != nil {
		log.Printf("[leads] activities collection not found: %v", err)
		return
	}
	rec := core.NewRecord(col)
	rec.Set("type", activityType)
	rec.Set("description", description)
	rec.Set("user", lead.GetString("owner"))
	rec.Set("lead", lead.Id)
	if companyID := lead.GetString("company"); companyID != "" {
		rec.Set("company", companyID)
	}
	if contactID := lead.GetString("contact"); contactID != "" {
		rec.Set("contact", contactID)
	}
	if err := app.Save(rec); err != nil {
		log.Printf("[leads] failed to create activity for lead %s: %v", lead.Id, err)
	}
}

// sendLeadAssignmentEmail notifies the new owner by email (best-effort).
func sendLeadAssignmentEmail(app core.App, lead *core.Record, newOwnerID string) {
	owner, err := app.FindRecordById("users", newOwnerID)
	if err != nil {
		log.Printf("[leads] new owner %s not found: %v", newOwnerID, err)
		return
	}
	ownerEmail := owner.GetString("email")
	if ownerEmail == "" {
		return
	}

	senderAddr := app.Settings().Meta.SenderAddress
	senderName := app.Settings().Meta.SenderName
	if senderAddr == "" {
		senderAddr = "noreply@pocketcrm.app"
	}
	if senderName == "" {
		senderName = "Pocket CRM"
	}

	leadTitle := lead.GetString("title")
	ownerName := owner.GetString("name")

	msg := &mailer.Message{
		From: mail.Address{Address: senderAddr, Name: senderName},
		To:   []mail.Address{{Address: ownerEmail, Name: ownerName}},
		Subject: fmt.Sprintf("[CRM] Opportunité assignée : %s", leadTitle),
		HTML: fmt.Sprintf(`
<p>Bonjour %s,</p>
<p>L'opportunité <strong>%s</strong> vous a été assignée.</p>
<p>Connectez-vous à Pocket CRM pour en voir les détails.</p>
<p>— L'équipe Pocket CRM</p>
`, ownerName, leadTitle),
	}

	if err := app.NewMailClient().Send(msg); err != nil {
		log.Printf("[leads] failed to send assignment email to %s: %v", ownerEmail, err)
	}
}
