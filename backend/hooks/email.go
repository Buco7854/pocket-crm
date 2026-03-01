package hooks

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/gif"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"pocket-crm/services"
)

// errCampaignNoContacts is returned by executeCampaignSend when a campaign has no contacts.
var errCampaignNoContacts = errors.New("campaign has no contacts")

// transparentGIF is a 1×1 transparent GIF pixel, generated once at startup.
var transparentGIF []byte

func init() {
	img := image.NewPaletted(image.Rect(0, 0, 1, 1), color.Palette{color.Transparent})
	img.SetColorIndex(0, 0, 0)
	var buf bytes.Buffer
	if err := gif.Encode(&buf, img, nil); err != nil {
		// Fallback: minimal hard-coded transparent GIF (35 bytes)
		transparentGIF = []byte{
			0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
			0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01,
			0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01,
			0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44, 0x00, 0x3b,
		}
		return
	}
	transparentGIF = buf.Bytes()
}

// generateCampaignID returns a random 16-char hex string to group bulk sends.
func generateCampaignID() string {
	b := make([]byte, 8)
	rand.Read(b) //nolint:errcheck
	return hex.EncodeToString(b)
}

// RegisterEmailRoutes registers all custom email API routes on the PocketBase server.
func RegisterEmailRoutes(app core.App) {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// ── Public tracking endpoints (called from email clients, no auth) ──────
		se.Router.GET("/api/crm/email/track-open/{logId}", buildTrackOpen(app))
		se.Router.GET("/api/crm/email/track-click/{logId}", buildTrackClick(app))

		// ── Protected endpoints (require authenticated user) ──────────────────
		se.Router.POST("/api/crm/send-email", buildSendEmail(app)).Bind(apis.RequireAuth())
		se.Router.POST("/api/crm/send-campaign", buildSendCampaign(app)).Bind(apis.RequireAuth())
		se.Router.POST("/api/crm/campaigns/{id}/send", buildSendCampaignById(app)).Bind(apis.RequireAuth())
		se.Router.GET("/api/crm/campaigns/{id}/runs", buildCampaignRuns(app)).Bind(apis.RequireAuth())
		se.Router.GET("/api/crm/email/global-stats", buildGlobalStats(app)).Bind(apis.RequireAuth())
		se.Router.GET("/api/crm/email/campaign-stats-list", buildCampaignStatsList(app)).Bind(apis.RequireAuth())
		se.Router.GET("/api/crm/email/campaign-stats/{campaignId}", buildCampaignStats(app)).Bind(apis.RequireAuth())
		se.Router.GET("/api/crm/email/smtp-status", buildSMTPStatus(app)).Bind(apis.RequireAuth())

		return se.Next()
	})

	log.Println("[hooks] Email routes registered (send-email, send-campaign, track-open, track-click, campaign-stats)")
}

// ─── Send single email ────────────────────────────────────────────────────────

func buildSendEmail(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		var body struct {
			TemplateID     string            `json:"template_id"`
			ContactID      string            `json:"contact_id"`      // optional
			RecipientEmail string            `json:"recipient_email"` // used if no contact_id
			RecipientName  string            `json:"recipient_name"`  // optional
			Variables      map[string]string `json:"variables"`
		}
		if err := e.BindBody(&body); err != nil {
			return e.BadRequestError("Invalid request body", err)
		}
		if body.TemplateID == "" {
			return e.BadRequestError("template_id is required", nil)
		}

		params := services.EmailSendParams{
			TemplateID: body.TemplateID,
			SentByID:   e.Auth.Id,
			Variables:  body.Variables,
			BaseURL:    app.Settings().Meta.AppURL,
		}

		// If a contact_id is provided, load the contact to fill recipient info
		if body.ContactID != "" {
			contact, err := app.FindRecordById("contacts", body.ContactID)
			if err != nil {
				return e.BadRequestError("Contact not found", err)
			}
			params.RecipientEmail = contact.GetString("email")
			params.RecipientName = contact.GetString("first_name") + " " + contact.GetString("last_name")
			params.RecipientContactID = body.ContactID

			// Auto-populate common variables from the contact
			if params.Variables == nil {
				params.Variables = map[string]string{}
			}
			params.Variables["first_name"] = contact.GetString("first_name")
			params.Variables["last_name"] = contact.GetString("last_name")
			params.Variables["email"] = contact.GetString("email")
		} else {
			if body.RecipientEmail == "" {
				return e.BadRequestError("recipient_email is required when contact_id is not provided", nil)
			}
			params.RecipientEmail = body.RecipientEmail
			params.RecipientName = body.RecipientName
		}

		if err := services.SendTemplatedEmail(app, params); err != nil {
			return e.BadRequestError("Failed to send email", err)
		}

		return e.JSON(http.StatusOK, map[string]string{"status": "sent"})
	}
}

// ─── Send campaign (bulk) ─────────────────────────────────────────────────────

func buildSendCampaign(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		var body struct {
			TemplateID string   `json:"template_id"`
			ContactIDs []string `json:"contact_ids"`
			CampaignID string   `json:"campaign_id"` // optional override
		}
		if err := e.BindBody(&body); err != nil {
			return e.BadRequestError("Invalid request body", err)
		}
		if body.TemplateID == "" {
			return e.BadRequestError("template_id is required", nil)
		}
		if len(body.ContactIDs) == 0 {
			return e.BadRequestError("contact_ids must not be empty", nil)
		}

		campaignID := body.CampaignID
		if campaignID == "" {
			campaignID = generateCampaignID()
		}

		baseURL := app.Settings().Meta.AppURL
		sentByID := e.Auth.Id

		var sent, failed int
		var errors []string

		for _, contactID := range body.ContactIDs {
			contact, err := app.FindRecordById("contacts", contactID)
			if err != nil {
				failed++
				errors = append(errors, fmt.Sprintf("contact %s: %v", contactID, err))
				continue
			}

			recipientEmail := contact.GetString("email")
			if recipientEmail == "" {
				failed++
				errors = append(errors, fmt.Sprintf("contact %s has no email", contactID))
				continue
			}

			params := services.EmailSendParams{
				TemplateID:         body.TemplateID,
				RecipientEmail:     recipientEmail,
				RecipientName:      contact.GetString("first_name") + " " + contact.GetString("last_name"),
				RecipientContactID: contactID,
				SentByID:           sentByID,
				CampaignID:         campaignID,
				BaseURL:            baseURL,
				Variables: map[string]string{
					"first_name": contact.GetString("first_name"),
					"last_name":  contact.GetString("last_name"),
					"email":      recipientEmail,
				},
			}

			if err := services.SendTemplatedEmail(app, params); err != nil {
				failed++
				errors = append(errors, fmt.Sprintf("contact %s: %v", contactID, err))
			} else {
				sent++
			}
		}

		return e.JSON(http.StatusOK, map[string]interface{}{
			"campaign_id": campaignID,
			"sent":        sent,
			"failed":      failed,
			"errors":      errors,
		})
	}
}

// ─── Track email open (pixel) ─────────────────────────────────────────────────

func buildTrackOpen(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		logId := e.Request.PathValue("logId")

		// Update email_log asynchronously (best-effort)
		go func() {
			logRec, err := app.FindRecordById("email_logs", logId)
			if err != nil {
				return
			}
			openCount := logRec.GetInt("open_count") + 1
			logRec.Set("open_count", openCount)
			if logRec.GetString("opened_at") == "" {
				logRec.Set("opened_at", time.Now().UTC().Format("2006-01-02 15:04:05.000Z"))
				logRec.Set("status", "ouvert")
			}
			if err := app.Save(logRec); err != nil {
				log.Printf("[email] track-open save error for %s: %v", logId, err)
			}
		}()

		// Return transparent GIF immediately
		e.Response.Header().Set("Content-Type", "image/gif")
		e.Response.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
		e.Response.Header().Set("Pragma", "no-cache")
		e.Response.WriteHeader(http.StatusOK)
		e.Response.Write(transparentGIF) //nolint:errcheck
		return nil
	}
}

// ─── Track link click (redirect) ─────────────────────────────────────────────

func buildTrackClick(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		logId := e.Request.PathValue("logId")
		targetURL := e.Request.URL.Query().Get("url")

		// Update email_log asynchronously (best-effort)
		go func() {
			logRec, err := app.FindRecordById("email_logs", logId)
			if err != nil {
				return
			}
			clickCount := logRec.GetInt("click_count") + 1
			logRec.Set("click_count", clickCount)
			if logRec.GetString("clicked_at") == "" {
				logRec.Set("clicked_at", time.Now().UTC().Format("2006-01-02 15:04:05.000Z"))
			}
			logRec.Set("status", "clique")
			if err := app.Save(logRec); err != nil {
				log.Printf("[email] track-click save error for %s: %v", logId, err)
			}
		}()

		// Redirect to original URL (or home if missing/unsafe)
		if targetURL == "" {
			http.Redirect(e.Response, e.Request, "/", http.StatusFound)
			return nil
		}
		parsed, err := url.ParseRequestURI(targetURL)
		if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") {
			http.Redirect(e.Response, e.Request, "/", http.StatusFound)
			return nil
		}
		http.Redirect(e.Response, e.Request, targetURL, http.StatusFound)
		return nil
	}
}

// ─── SMTP status ─────────────────────────────────────────────────────────────

func buildSMTPStatus(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		smtp := app.Settings().SMTP
		configured := smtp.Enabled && smtp.Host != ""
		return e.JSON(http.StatusOK, map[string]bool{"configured": configured})
	}
}

// ─── Core campaign send logic ─────────────────────────────────────────────────

type campaignSendResult struct {
	RunID     string
	RunNumber int
	Sent      int
	Failed    int
}

// executeCampaignSend creates a campaign_run, sends emails to all contacts,
// and updates the campaign status to "envoye". It is called both by the HTTP
// handler and by the background scheduler.
func executeCampaignSend(app core.App, campaign *core.Record, senderID string) (*campaignSendResult, error) {
	campaignId := campaign.Id
	templateId := campaign.GetString("template")

	// Parse contact_ids from JSON field
	var contactIDs []string
	raw, _ := json.Marshal(campaign.Get("contact_ids"))
	json.Unmarshal(raw, &contactIDs) //nolint:errcheck

	if len(contactIDs) == 0 {
		return nil, errCampaignNoContacts
	}

	baseURL := app.Settings().Meta.AppURL
	now := time.Now().UTC().Format("2006-01-02 15:04:05.000Z")

	// Count existing runs to assign the next run_number
	var runCount int
	app.DB().NewQuery("SELECT COUNT(*) FROM campaign_runs WHERE campaign = {:id}"). //nolint:errcheck
											Bind(dbx.Params{"id": campaignId}).Row(&runCount)

	// Create the campaign_run record before sending
	runsCol, err := app.FindCollectionByNameOrId("campaign_runs")
	if err != nil {
		return nil, fmt.Errorf("campaign_runs collection not found: %w", err)
	}
	runRec := core.NewRecord(runsCol)
	runRec.Set("campaign", campaignId)
	runRec.Set("run_number", runCount+1)
	runRec.Set("total", len(contactIDs))
	runRec.Set("sent_by", senderID)
	runRec.Set("sent_at", now)
	if err := app.Save(runRec); err != nil {
		return nil, fmt.Errorf("failed to create campaign run: %w", err)
	}
	runID := runRec.Id

	campaign.Set("status", "en_cours")
	campaign.Set("total", len(contactIDs))
	if err := app.Save(campaign); err != nil {
		return nil, fmt.Errorf("failed to update campaign: %w", err)
	}

	var sent, failed int

	for _, contactID := range contactIDs {
		contact, err := app.FindRecordById("contacts", contactID)
		if err != nil {
			failed++
			continue
		}
		recipientEmail := contact.GetString("email")
		if recipientEmail == "" {
			failed++
			continue
		}
		params := services.EmailSendParams{
			TemplateID:         templateId,
			RecipientEmail:     recipientEmail,
			RecipientName:      contact.GetString("first_name") + " " + contact.GetString("last_name"),
			RecipientContactID: contactID,
			SentByID:           senderID,
			CampaignID:         campaignId,
			RunID:              runID,
			BaseURL:            baseURL,
			Variables: map[string]string{
				"first_name": contact.GetString("first_name"),
				"last_name":  contact.GetString("last_name"),
				"email":      recipientEmail,
			},
		}
		if err := services.SendTemplatedEmail(app, params); err != nil {
			failed++
		} else {
			sent++
		}
	}

	// Update run record with final counts
	runRec.Set("sent", sent)
	runRec.Set("failed", failed)
	app.Save(runRec) //nolint:errcheck

	campaign.Set("status", "envoye")
	campaign.Set("sent", campaign.GetInt("sent")+sent)
	campaign.Set("failed", campaign.GetInt("failed")+failed)
	app.Save(campaign) //nolint:errcheck

	return &campaignSendResult{
		RunID:     runID,
		RunNumber: runCount + 1,
		Sent:      sent,
		Failed:    failed,
	}, nil
}

// ─── Background scheduler for programmed campaigns ───────────────────────────

// RegisterCampaignScheduler starts a goroutine (60 s tick) that auto-sends
// campaigns whose status is "programmee" and scheduled_at <= now.
func RegisterCampaignScheduler(app core.App) {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		go func() {
			ticker := time.NewTicker(60 * time.Second)
			defer ticker.Stop()
			for range ticker.C {
				runScheduledCampaigns(app)
			}
		}()
		return se.Next()
	})
	log.Println("[hooks] Campaign scheduler registered (60s interval)")
}

func runScheduledCampaigns(app core.App) {
	now := time.Now().UTC().Format("2006-01-02 15:04:05.000Z")
	campaigns, err := app.FindAllRecords("campaigns",
		dbx.And(
			dbx.HashExp{"status": "programmee"},
			dbx.NewExp("scheduled_at > '' AND scheduled_at <= {:now}", dbx.Params{"now": now}),
		),
	)
	if err != nil {
		log.Printf("[scheduler] Failed to query scheduled campaigns: %v", err)
		return
	}
	for _, campaign := range campaigns {
		createdBy := campaign.GetString("created_by")
		log.Printf("[scheduler] Triggering campaign %s (%s)", campaign.Id, campaign.GetString("name"))
		if _, err := executeCampaignSend(app, campaign, createdBy); err != nil {
			log.Printf("[scheduler] Campaign %s failed: %v", campaign.Id, err)
		}
	}
}

// ─── Send campaign by campaign record ID ─────────────────────────────────────

func buildSendCampaignById(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		campaignId := e.Request.PathValue("id")

		campaign, err := app.FindRecordById("campaigns", campaignId)
		if err != nil {
			return e.NotFoundError("Campaign not found", err)
		}
		if campaign.GetString("status") == "en_cours" {
			return e.BadRequestError("Campaign is currently being sent", nil)
		}

		result, err := executeCampaignSend(app, campaign, e.Auth.Id)
		if err != nil {
			if errors.Is(err, errCampaignNoContacts) {
				return e.BadRequestError("Campaign has no contacts", nil)
			}
			return e.InternalServerError("Failed to send campaign", err)
		}

		return e.JSON(http.StatusOK, map[string]interface{}{
			"campaign_id": campaignId,
			"run_id":      result.RunID,
			"run_number":  result.RunNumber,
			"sent":        result.Sent,
			"failed":      result.Failed,
		})
	}
}

// ─── List runs for a campaign ─────────────────────────────────────────────────

type campaignRunRow struct {
	ID        string `db:"id"`
	RunNumber int    `db:"run_number"`
	Total     int    `db:"total"`
	Sent      int    `db:"sent"`
	Failed    int    `db:"failed"`
	SentAt    string `db:"sent_at"`
}

func buildCampaignRuns(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		campaignID := e.Request.PathValue("id")

		var rows []campaignRunRow
		err := app.DB().NewQuery(`
			SELECT id, run_number, total, sent, failed, sent_at
			FROM campaign_runs
			WHERE campaign = {:campaignId}
			ORDER BY run_number ASC
		`).Bind(dbx.Params{"campaignId": campaignID}).All(&rows)
		if err != nil {
			return e.InternalServerError("Failed to query campaign runs", err)
		}

		type runResponse struct {
			ID        string `json:"id"`
			RunNumber int    `json:"run_number"`
			Total     int    `json:"total"`
			Sent      int    `json:"sent"`
			Failed    int    `json:"failed"`
			SentAt    string `json:"sent_at"`
		}

		result := make([]runResponse, 0, len(rows))
		for _, r := range rows {
			result = append(result, runResponse{
				ID:        r.ID,
				RunNumber: r.RunNumber,
				Total:     r.Total,
				Sent:      r.Sent,
				Failed:    r.Failed,
				SentAt:    r.SentAt,
			})
		}

		return e.JSON(http.StatusOK, result)
	}
}

// ─── Global statistics (aggregate over ALL email_logs, not paginated) ────────

func buildGlobalStats(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		var row struct {
			Total   int `db:"total"`
			Sent    int `db:"sent"`
			Failed  int `db:"failed"`
			Opened  int `db:"opened"`
			Clicked int `db:"clicked"`
		}
		err := app.DB().NewQuery(`
			SELECT
				COUNT(*) AS total,
				COALESCE(SUM(CASE WHEN status IN ('envoye','ouvert','clique') THEN 1 ELSE 0 END), 0) AS sent,
				COALESCE(SUM(CASE WHEN status = 'echoue' THEN 1 ELSE 0 END), 0) AS failed,
				COALESCE(SUM(CASE WHEN open_count > 0 THEN 1 ELSE 0 END), 0) AS opened,
				COALESCE(SUM(CASE WHEN click_count > 0 THEN 1 ELSE 0 END), 0) AS clicked
			FROM email_logs
		`).One(&row)
		if err != nil {
			return e.InternalServerError("Failed to query global stats", err)
		}

		openRate := 0.0
		clickRate := 0.0
		if row.Sent > 0 {
			openRate = float64(row.Opened) / float64(row.Sent) * 100
			clickRate = float64(row.Clicked) / float64(row.Sent) * 100
		}

		return e.JSON(http.StatusOK, map[string]interface{}{
			"total":      row.Total,
			"sent":       row.Sent,
			"failed":     row.Failed,
			"opened":     row.Opened,
			"clicked":    row.Clicked,
			"open_rate":  fmt.Sprintf("%.1f", openRate),
			"click_rate": fmt.Sprintf("%.1f", clickRate),
		})
	}
}

// ─── Campaign stats list (JOIN campaigns + email_logs, server-aggregated) ─────

type campaignStatsListRow struct {
	CampaignID   string `db:"campaign_id"`
	CampaignName string `db:"campaign_name"`
	Status       string `db:"campaign_status"`
	Total        int    `db:"total"`
	Sent         int    `db:"sent"`
	Failed       int    `db:"failed"`
	Opened       int    `db:"opened"`
	Clicked      int    `db:"clicked"`
}

func buildCampaignStatsList(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		var rows []campaignStatsListRow
		err := app.DB().NewQuery(`
			SELECT
				c.id          AS campaign_id,
				c.name        AS campaign_name,
				c.status      AS campaign_status,
				COUNT(el.id)  AS total,
				SUM(CASE WHEN el.status IN ('envoye','ouvert','clique') THEN 1 ELSE 0 END) AS sent,
				SUM(CASE WHEN el.status = 'echoue' THEN 1 ELSE 0 END) AS failed,
				SUM(CASE WHEN el.open_count > 0 THEN 1 ELSE 0 END) AS opened,
				SUM(CASE WHEN el.click_count > 0 THEN 1 ELSE 0 END) AS clicked
			FROM campaigns c
			INNER JOIN email_logs el ON el.campaign_id = c.id
			GROUP BY c.id, c.name, c.status
			ORDER BY MAX(el.created) DESC
		`).All(&rows)
		if err != nil {
			return e.InternalServerError("Failed to query campaign stats list", err)
		}

		type item struct {
			CampaignID   string `json:"campaign_id"`
			CampaignName string `json:"campaign_name"`
			Status       string `json:"campaign_status"`
			Total        int    `json:"total"`
			Sent         int    `json:"sent"`
			Failed       int    `json:"failed"`
			Opened       int    `json:"opened"`
			Clicked      int    `json:"clicked"`
			OpenRate     string `json:"open_rate"`
			ClickRate    string `json:"click_rate"`
		}

		result := make([]item, 0, len(rows))
		for _, r := range rows {
			openRate := 0.0
			clickRate := 0.0
			if r.Sent > 0 {
				openRate = float64(r.Opened) / float64(r.Sent) * 100
				clickRate = float64(r.Clicked) / float64(r.Sent) * 100
			}
			result = append(result, item{
				CampaignID:   r.CampaignID,
				CampaignName: r.CampaignName,
				Status:       r.Status,
				Total:        r.Total,
				Sent:         r.Sent,
				Failed:       r.Failed,
				Opened:       r.Opened,
				Clicked:      r.Clicked,
				OpenRate:     fmt.Sprintf("%.1f", openRate),
				ClickRate:    fmt.Sprintf("%.1f", clickRate),
			})
		}

		return e.JSON(http.StatusOK, result)
	}
}

// ─── Campaign statistics (single campaign, kept for backwards compat) ─────────

type campaignStatsRow struct {
	Total   int `db:"total"`
	Sent    int `db:"sent"`
	Failed  int `db:"failed"`
	Opened  int `db:"opened"`
	Clicked int `db:"clicked"`
}

func buildCampaignStats(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		campaignID := e.Request.PathValue("campaignId")
		if campaignID == "" {
			return e.BadRequestError("campaignId is required", nil)
		}

		var stats campaignStatsRow
		err := app.DB().NewQuery(`
			SELECT
				COUNT(*) AS total,
				COALESCE(SUM(CASE WHEN status IN ('envoye','ouvert','clique') THEN 1 ELSE 0 END), 0) AS sent,
				COALESCE(SUM(CASE WHEN status = 'echoue' THEN 1 ELSE 0 END), 0) AS failed,
				COALESCE(SUM(CASE WHEN open_count > 0 THEN 1 ELSE 0 END), 0) AS opened,
				COALESCE(SUM(CASE WHEN click_count > 0 THEN 1 ELSE 0 END), 0) AS clicked
			FROM email_logs
			WHERE campaign_id = {:campaignId}
		`).Bind(dbx.Params{"campaignId": campaignID}).One(&stats)
		if err != nil {
			return e.InternalServerError("Failed to query campaign stats", err)
		}

		openRate := 0.0
		clickRate := 0.0
		if stats.Sent > 0 {
			openRate = float64(stats.Opened) / float64(stats.Sent) * 100
			clickRate = float64(stats.Clicked) / float64(stats.Sent) * 100
		}

		return e.JSON(http.StatusOK, map[string]interface{}{
			"campaign_id": campaignID,
			"total":       stats.Total,
			"sent":        stats.Sent,
			"failed":      stats.Failed,
			"opened":      stats.Opened,
			"clicked":     stats.Clicked,
			"open_rate":   fmt.Sprintf("%.1f", openRate),
			"click_rate":  fmt.Sprintf("%.1f", clickRate),
		})
	}
}
