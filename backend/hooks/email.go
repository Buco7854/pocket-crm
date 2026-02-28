package hooks

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
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
		se.Router.GET("/api/crm/email/campaign-stats/{campaignId}", buildCampaignStats(app)).Bind(apis.RequireAuth())

		return se.Next()
	})

	log.Println("[hooks] Email routes registered (send-email, send-campaign, track-open, track-click, campaign-stats)")
}

// ─── Send single email ────────────────────────────────────────────────────────

func buildSendEmail(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		var body struct {
			TemplateID    string            `json:"template_id"`
			ContactID     string            `json:"contact_id"`      // optional
			RecipientEmail string           `json:"recipient_email"` // used if no contact_id
			RecipientName  string           `json:"recipient_name"`  // optional
			Variables     map[string]string `json:"variables"`
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

// ─── Campaign statistics ──────────────────────────────────────────────────────

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
				SUM(CASE WHEN status IN ('envoye','ouvert','clique') THEN 1 ELSE 0 END) AS sent,
				SUM(CASE WHEN status = 'echoue' THEN 1 ELSE 0 END) AS failed,
				SUM(CASE WHEN open_count > 0 THEN 1 ELSE 0 END) AS opened,
				SUM(CASE WHEN click_count > 0 THEN 1 ELSE 0 END) AS clicked
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
