package services

import (
	"fmt"
	"log"
	"net/mail"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/mailer"
)

// EmailSendParams holds the parameters for sending a single templated email.
type EmailSendParams struct {
	TemplateID         string
	RecipientEmail     string
	RecipientName      string
	RecipientContactID string            // optional — links email_log to a contact
	SentByID           string            // user who triggered the send
	Variables          map[string]string // {{key}} → value substitution
	CampaignID         string            // optional — groups bulk sends together
	RunID              string            // optional — links email_log to a specific campaign_run
	BaseURL            string            // app base URL used to inject tracking pixel
}

// SendTemplatedEmail renders a template with variable substitution, creates an
// email_log record, injects a tracking pixel, sends via PocketBase mailer, and
// updates the log status (envoye / echoue).
func SendTemplatedEmail(app core.App, params EmailSendParams) error {
	// 1. Load email template
	template, err := app.FindRecordById("email_templates", params.TemplateID)
	if err != nil {
		return fmt.Errorf("template %q not found: %w", params.TemplateID, err)
	}

	// 2. Inject date variables (cannot be overridden by caller)
	now := time.Now()
	dateVars := map[string]string{
		"day":   fmt.Sprintf("%02d", now.Day()),
		"month": fmt.Sprintf("%02d", int(now.Month())),
		"year":  fmt.Sprintf("%d", now.Year()),
		"date":  now.Format("02/01/2006"),
	}
	if params.Variables == nil {
		params.Variables = map[string]string{}
	}
	for k, v := range dateVars {
		if _, exists := params.Variables[k]; !exists {
			params.Variables[k] = v
		}
	}

	// 3. Render subject and body
	subject := renderVars(template.GetString("subject"), params.Variables)
	body := renderVars(template.GetString("body"), params.Variables)

	// 4. Create email_log with status "en_attente"
	logCol, err := app.FindCollectionByNameOrId("email_logs")
	if err != nil {
		return fmt.Errorf("email_logs collection not found: %w", err)
	}
	logRec := core.NewRecord(logCol)
	logRec.Set("template", params.TemplateID)
	logRec.Set("recipient_email", params.RecipientEmail)
	if params.RecipientContactID != "" {
		logRec.Set("recipient_contact", params.RecipientContactID)
	}
	logRec.Set("subject", subject)
	logRec.Set("status", "en_attente")
	logRec.Set("sent_by", params.SentByID)
	if params.CampaignID != "" {
		logRec.Set("campaign_id", params.CampaignID)
	}
	if params.RunID != "" {
		logRec.Set("run_id", params.RunID)
	}
	logRec.Set("open_count", 0)
	logRec.Set("click_count", 0)
	if err := app.Save(logRec); err != nil {
		return fmt.Errorf("failed to create email_log: %w", err)
	}

	// 5. Inject 1×1 tracking pixel at end of HTML body
	if params.BaseURL != "" {
		pixel := fmt.Sprintf(
			`<img src="%s/api/crm/email/track-open/%s" width="1" height="1" style="display:none" alt="" />`,
			strings.TrimRight(params.BaseURL, "/"),
			logRec.Id,
		)
		body += "\n" + pixel
	}

	// 6. Resolve sender info from PocketBase settings
	senderAddr := app.Settings().Meta.SenderAddress
	senderName := app.Settings().Meta.SenderName
	if senderAddr == "" {
		senderAddr = "noreply@pocketcrm.app"
	}
	if senderName == "" {
		senderName = "Pocket CRM"
	}

	// 7. Build and send message
	msg := &mailer.Message{
		From:    mail.Address{Address: senderAddr, Name: senderName},
		To:      []mail.Address{{Address: params.RecipientEmail, Name: params.RecipientName}},
		Subject: subject,
		HTML:    body,
	}

	sendErr := app.NewMailClient().Send(msg)

	// 8. Update log with result
	if sendErr != nil {
		logRec.Set("status", "echoue")
		logRec.Set("error_message", sendErr.Error())
		if saveErr := app.Save(logRec); saveErr != nil {
			log.Printf("[email_service] failed to mark log %s as echoue: %v", logRec.Id, saveErr)
		}
		return fmt.Errorf("email send failed: %w", sendErr)
	}

	logRec.Set("status", "envoye")
	logRec.Set("sent_at", time.Now().UTC().Format("2006-01-02 15:04:05.000Z"))
	if err := app.Save(logRec); err != nil {
		log.Printf("[email_service] failed to mark log %s as envoye: %v", logRec.Id, err)
	}

	return nil
}

// renderVars replaces {{key}} placeholders in tmpl with values from vars.
func renderVars(tmpl string, vars map[string]string) string {
	result := tmpl
	for k, v := range vars {
		result = strings.ReplaceAll(result, "{{"+k+"}}", v)
	}
	return result
}
