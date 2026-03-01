package hooks

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

// RegisterStatsRoutes registers all analytics/statistics API routes.
func RegisterStatsRoutes(app core.App) {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/api/crm/stats/dashboard", buildDashboardStats(app)).Bind(apis.RequireAuth())
		se.Router.GET("/api/crm/stats/sales", buildSalesStats(app)).Bind(apis.RequireAuth())
		se.Router.GET("/api/crm/stats/clients", buildClientStats(app)).Bind(apis.RequireAuth())
		se.Router.GET("/api/crm/stats/commercials", buildCommercialStats(app)).Bind(apis.RequireAuth())
		se.Router.GET("/api/crm/stats/financial", buildFinancialStats(app)).Bind(apis.RequireAuth())
		se.Router.GET("/api/crm/stats/marketing", buildMarketingStats(app)).Bind(apis.RequireAuth())
		return se.Next()
	})
	log.Println("[hooks] Stats routes registered (dashboard, sales, clients, commercials, financial, marketing)")
}

// parsePeriodDates returns ISO8601 strings for current period start,
// previous period start, and previous period end.
func parsePeriodDates(e *core.RequestEvent) (start, prevStart, prevEnd string) {
	period := e.Request.URL.Query().Get("period")
	now := time.Now().UTC()
	const layout = "2006-01-02 15:04:05.000Z"

	var startT, prevStartT, prevEndT time.Time
	switch period {
	case "week":
		startT = now.AddDate(0, 0, -7)
		prevStartT = now.AddDate(0, 0, -14)
		prevEndT = startT
	case "quarter":
		startT = now.AddDate(0, -3, 0)
		prevStartT = now.AddDate(0, -6, 0)
		prevEndT = startT
	case "year":
		startT = now.AddDate(-1, 0, 0)
		prevStartT = now.AddDate(-2, 0, 0)
		prevEndT = startT
	default: // month
		startT = now.AddDate(0, -1, 0)
		prevStartT = now.AddDate(0, -2, 0)
		prevEndT = startT
	}
	return startT.Format(layout), prevStartT.Format(layout), prevEndT.Format(layout)
}

// evolutionPct calculates percentage evolution between two values.
func evolutionPct(current, previous float64) float64 {
	if previous == 0 {
		if current > 0 {
			return 100
		}
		return 0
	}
	return (current - previous) / previous * 100
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

func buildDashboardStats(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		start, prevStart, prevEnd := parsePeriodDates(e)

		// Revenue — current period
		var revCurrent float64
		app.DB().NewQuery(`SELECT COALESCE(SUM(value), 0) FROM leads WHERE status = 'gagne' AND closed_at >= {:start}`). //nolint:errcheck
			Bind(dbx.Params{"start": start}).Row(&revCurrent)

		// Revenue — previous period
		var revPrevious float64
		app.DB().NewQuery(`SELECT COALESCE(SUM(value), 0) FROM leads WHERE status = 'gagne' AND closed_at >= {:start} AND closed_at < {:end}`). //nolint:errcheck
			Bind(dbx.Params{"start": prevStart, "end": prevEnd}).Row(&revPrevious)

		// New prospects — current period
		var prospectsCurrent int
		app.DB().NewQuery(`SELECT COUNT(*) FROM leads WHERE created >= {:start}`). //nolint:errcheck
			Bind(dbx.Params{"start": start}).Row(&prospectsCurrent)

		// New prospects — previous period
		var prospectsPrevious int
		app.DB().NewQuery(`SELECT COUNT(*) FROM leads WHERE created >= {:start} AND created < {:end}`). //nolint:errcheck
			Bind(dbx.Params{"start": prevStart, "end": prevEnd}).Row(&prospectsPrevious)

		// Meetings today (reunion tasks not completed/cancelled)
		var meetingsToday int
		app.DB().NewQuery(`SELECT COUNT(*) FROM tasks WHERE type = 'reunion' AND status NOT IN ('terminee', 'annulee') AND date(due_date) = date('now')`). //nolint:errcheck
			Row(&meetingsToday)

		// Overdue tasks
		var overdueTasks int
		app.DB().NewQuery(`SELECT COUNT(*) FROM tasks WHERE status IN ('a_faire', 'en_cours') AND due_date != '' AND due_date < datetime('now')`). //nolint:errcheck
			Row(&overdueTasks)

		// Pipeline by stage
		type pipelineStageRow struct {
			Stage  string  `db:"stage" json:"stage"`
			Count  int     `db:"count" json:"count"`
			Amount float64 `db:"amount" json:"amount"`
		}
		pipelineRows := make([]pipelineStageRow, 0)
		app.DB().NewQuery(`
			SELECT status AS stage, COUNT(*) AS count, COALESCE(SUM(value), 0) AS amount
			FROM leads
			WHERE status NOT IN ('gagne', 'perdu')
			GROUP BY status
		`).All(&pipelineRows) //nolint:errcheck

		// Recent activities (last 10)
		type activityRow struct {
			ID          string `db:"id" json:"id"`
			Type        string `db:"type" json:"type"`
			Description string `db:"description" json:"description"`
			Created     string `db:"created" json:"created"`
			UserID      string `db:"user_id" json:"user_id"`
			UserName    string `db:"user_name" json:"user_name"`
		}
		activityRows := make([]activityRow, 0)
		app.DB().NewQuery(`
			SELECT a.id, a.type, a.description, a.created,
			       COALESCE(a.user, '') AS user_id,
			       COALESCE(u.name, '') AS user_name
			FROM activities a
			LEFT JOIN users u ON a.user = u.id
			ORDER BY a.created DESC
			LIMIT 10
		`).All(&activityRows) //nolint:errcheck

		// Revenue trend (last 12 months, ascending)
		type monthRevRow struct {
			Month   string  `db:"month" json:"month"`
			Revenue float64 `db:"revenue" json:"revenue"`
		}
		revTrendRows := make([]monthRevRow, 0)
		app.DB().NewQuery(`
			SELECT strftime('%Y-%m', closed_at) AS month, COALESCE(SUM(value), 0) AS revenue
			FROM leads
			WHERE status = 'gagne'
			GROUP BY month
			ORDER BY month ASC
		`).All(&revTrendRows) //nolint:errcheck

		return e.JSON(http.StatusOK, map[string]interface{}{
			"revenue": map[string]interface{}{
				"current":       revCurrent,
				"previous":      revPrevious,
				"evolution_pct": fmt.Sprintf("%.1f", evolutionPct(revCurrent, revPrevious)),
			},
			"new_prospects": map[string]interface{}{
				"current":       prospectsCurrent,
				"previous":      prospectsPrevious,
				"evolution_pct": fmt.Sprintf("%.1f", evolutionPct(float64(prospectsCurrent), float64(prospectsPrevious))),
			},
			"meetings_today":    meetingsToday,
			"overdue_tasks":     overdueTasks,
			"pipeline_by_stage": pipelineRows,
			"recent_activities": activityRows,
			"revenue_trend":     revTrendRows,
		})
	}
}

// ─── Sales Stats ──────────────────────────────────────────────────────────────

func buildSalesStats(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		start, _, _ := parsePeriodDates(e)

		// Revenue by month (all time, ascending)
		type monthRevRow struct {
			Month   string  `db:"month" json:"month"`
			Revenue float64 `db:"revenue" json:"revenue"`
		}
		revenueByMonth := make([]monthRevRow, 0)
		app.DB().NewQuery(`
			SELECT strftime('%Y-%m', closed_at) AS month, COALESCE(SUM(value), 0) AS revenue
			FROM leads
			WHERE status = 'gagne'
			GROUP BY month
			ORDER BY month ASC
		`).All(&revenueByMonth) //nolint:errcheck

		// Revenue by salesperson (current period)
		type salesRow struct {
			Name    string  `db:"name" json:"name"`
			Revenue float64 `db:"revenue" json:"revenue"`
			Deals   int     `db:"deals" json:"deals"`
		}
		bySalesperson := make([]salesRow, 0)
		app.DB().NewQuery(`
			SELECT COALESCE(u.name, 'N/A') AS name, COALESCE(SUM(l.value), 0) AS revenue, COUNT(*) AS deals
			FROM leads l
			LEFT JOIN users u ON l.owner = u.id
			WHERE l.status = 'gagne' AND l.closed_at >= {:start}
			GROUP BY l.owner
			ORDER BY revenue DESC
		`).Bind(dbx.Params{"start": start}).All(&bySalesperson) //nolint:errcheck

		// Pipeline distribution (active leads only)
		type pipeRow struct {
			Stage  string  `db:"stage" json:"stage"`
			Count  int     `db:"count" json:"count"`
			Amount float64 `db:"amount" json:"amount"`
		}
		pipeline := make([]pipeRow, 0)
		app.DB().NewQuery(`
			SELECT status AS stage, COUNT(*) AS count, COALESCE(SUM(value), 0) AS amount
			FROM leads
			WHERE status NOT IN ('gagne', 'perdu')
			GROUP BY status
		`).All(&pipeline) //nolint:errcheck

		// Conversion funnel (all stages)
		type funnelRow struct {
			Stage string `db:"stage" json:"stage"`
			Count int    `db:"count" json:"count"`
		}
		funnel := make([]funnelRow, 0)
		app.DB().NewQuery(`
			SELECT status AS stage, COUNT(*) AS count
			FROM leads
			GROUP BY status
		`).All(&funnel) //nolint:errcheck

		// Conversion rate (won / total)
		var wonCount, totalCount int
		app.DB().NewQuery(`SELECT COUNT(*) FROM leads WHERE status = 'gagne'`). //nolint:errcheck
			Row(&wonCount)
		app.DB().NewQuery(`SELECT COUNT(*) FROM leads`). //nolint:errcheck
			Row(&totalCount)
		convRate := 0.0
		if totalCount > 0 {
			convRate = float64(wonCount) / float64(totalCount) * 100
		}

		// Average days to close
		var avgCloseDays float64
		app.DB().NewQuery(`
			SELECT COALESCE(AVG(julianday(closed_at) - julianday(created)), 0)
			FROM leads
			WHERE status = 'gagne' AND closed_at != '' AND closed_at IS NOT NULL
		`).Row(&avgCloseDays) //nolint:errcheck

		return e.JSON(http.StatusOK, map[string]interface{}{
			"revenue_by_month": revenueByMonth,
			"by_salesperson":   bySalesperson,
			"pipeline":         pipeline,
			"funnel":           funnel,
			"conversion_rate":  fmt.Sprintf("%.1f", convRate),
			"avg_close_days":   fmt.Sprintf("%.0f", avgCloseDays),
		})
	}
}

// ─── Client Stats ─────────────────────────────────────────────────────────────

func buildClientStats(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		start, _, _ := parsePeriodDates(e)

		// Total contacts with 'client' tag
		var totalClients int
		app.DB().NewQuery(`SELECT COUNT(*) FROM contacts WHERE tags LIKE '%client%'`). //nolint:errcheck
			Row(&totalClients)

		// New clients in current period
		var newClients int
		app.DB().NewQuery(`SELECT COUNT(*) FROM contacts WHERE tags LIKE '%client%' AND created >= {:start}`). //nolint:errcheck
			Bind(dbx.Params{"start": start}).Row(&newClients)

		// Active clients (contacts with a won lead in current period)
		var activeClients int
		app.DB().NewQuery(`
			SELECT COUNT(DISTINCT l.contact)
			FROM leads l
			WHERE l.status = 'gagne' AND l.closed_at >= {:start} AND l.contact != ''
		`).Bind(dbx.Params{"start": start}).Row(&activeClients) //nolint:errcheck

		// Segmentation by city
		type cityRow struct {
			City  string `db:"city" json:"city"`
			Count int    `db:"count" json:"count"`
		}
		byCity := make([]cityRow, 0)
		app.DB().NewQuery(`
			SELECT comp.city AS city, COUNT(DISTINCT c.id) AS count
			FROM contacts c
			JOIN companies comp ON c.company = comp.id
			WHERE comp.city != '' AND comp.city IS NOT NULL
			GROUP BY comp.city
			ORDER BY count DESC
			LIMIT 10
		`).All(&byCity) //nolint:errcheck

		// Segmentation by industry (via company)
		type industryRow struct {
			Industry string `db:"industry" json:"industry"`
			Count    int    `db:"count" json:"count"`
		}
		byIndustry := make([]industryRow, 0)
		app.DB().NewQuery(`
			SELECT COALESCE(comp.industry, 'autre') AS industry, COUNT(DISTINCT c.id) AS count
			FROM contacts c
			JOIN companies comp ON c.company = comp.id
			WHERE comp.industry != '' AND comp.industry IS NOT NULL
			GROUP BY industry
			ORDER BY count DESC
			LIMIT 10
		`).All(&byIndustry) //nolint:errcheck

		// Average basket (mean of per-contact won lead totals)
		var avgBasket float64
		app.DB().NewQuery(`
			SELECT COALESCE(AVG(lead_total), 0) FROM (
				SELECT l.contact, SUM(l.value) AS lead_total
				FROM leads l
				WHERE l.status = 'gagne'
				GROUP BY l.contact
			)
		`).Row(&avgBasket) //nolint:errcheck

		// Top 10 clients by LTV (sum of won lead values)
		type topClientRow struct {
			ContactID string  `db:"contact_id" json:"contact_id"`
			Name      string  `db:"name" json:"name"`
			LTV       float64 `db:"ltv" json:"ltv"`
		}
		topClients := make([]topClientRow, 0)
		app.DB().NewQuery(`
			SELECT c.id AS contact_id,
			       c.first_name || ' ' || c.last_name AS name,
			       COALESCE(SUM(l.value), 0) AS ltv
			FROM contacts c
			LEFT JOIN leads l ON l.contact = c.id AND l.status = 'gagne'
			GROUP BY c.id
			HAVING ltv > 0
			ORDER BY ltv DESC
			LIMIT 10
		`).All(&topClients) //nolint:errcheck

		return e.JSON(http.StatusOK, map[string]interface{}{
			"total_clients":  totalClients,
			"new_clients":    newClients,
			"active_clients": activeClients,
			"by_city":        byCity,
			"by_industry":    byIndustry,
			"avg_basket":     fmt.Sprintf("%.0f", avgBasket),
			"top_clients":    topClients,
		})
	}
}

// ─── Commercial Stats (Leaderboard) ──────────────────────────────────────────

func buildCommercialStats(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		start, _, _ := parsePeriodDates(e)

		type leaderRow struct {
			UserID     string  `db:"user_id" json:"user_id"`
			Name       string  `db:"name" json:"name"`
			Won        int     `db:"won" json:"won"`
			Revenue    float64 `db:"revenue" json:"revenue"`
			TotalLeads int     `db:"total_leads" json:"total_leads"`
			Calls      int     `db:"calls" json:"calls"`
			Emails     int     `db:"emails" json:"emails"`
			Meetings   int     `db:"meetings" json:"meetings"`
			TotalTasks int     `db:"total_tasks" json:"total_tasks"`
		}
		leaders := make([]leaderRow, 0)
		app.DB().NewQuery(`
			SELECT
				u.id   AS user_id,
				u.name AS name,
				COALESCE(w.won, 0)          AS won,
				COALESCE(w.revenue, 0)      AS revenue,
				COALESCE(tl.total_leads, 0) AS total_leads,
				COALESCE(t.calls, 0)        AS calls,
				COALESCE(t.emails, 0)       AS emails,
				COALESCE(t.meetings, 0)     AS meetings,
				COALESCE(t.total_tasks, 0)  AS total_tasks
			FROM users u
			LEFT JOIN (
				SELECT owner, COUNT(*) AS won, COALESCE(SUM(value), 0) AS revenue
				FROM leads
				WHERE status = 'gagne' AND closed_at >= {:start}
				GROUP BY owner
			) w ON w.owner = u.id
			LEFT JOIN (
				SELECT owner, COUNT(*) AS total_leads
				FROM leads
				WHERE created >= {:start}
				GROUP BY owner
			) tl ON tl.owner = u.id
			LEFT JOIN (
				SELECT assignee,
				       SUM(CASE WHEN type = 'appel'   THEN 1 ELSE 0 END) AS calls,
				       SUM(CASE WHEN type = 'email'   THEN 1 ELSE 0 END) AS emails,
				       SUM(CASE WHEN type = 'reunion' THEN 1 ELSE 0 END) AS meetings,
				       COUNT(*) AS total_tasks
				FROM tasks
				WHERE created >= {:start}
				GROUP BY assignee
			) t ON t.assignee = u.id
			WHERE u.role IN ('admin', 'commercial')
			ORDER BY revenue DESC
		`).Bind(dbx.Params{"start": start}).All(&leaders) //nolint:errcheck

		type leaderResult struct {
			UserID      string  `json:"user_id"`
			Name        string  `json:"name"`
			Won         int     `json:"won"`
			Revenue     float64 `json:"revenue"`
			TotalLeads  int     `json:"total_leads"`
			SuccessRate string  `json:"success_rate"`
			Calls       int     `json:"calls"`
			Emails      int     `json:"emails"`
			Meetings    int     `json:"meetings"`
			TotalTasks  int     `json:"total_tasks"`
		}
		results := make([]leaderResult, len(leaders))
		for i, l := range leaders {
			rate := 0.0
			if l.TotalLeads > 0 {
				rate = float64(l.Won) / float64(l.TotalLeads) * 100
			}
			results[i] = leaderResult{
				UserID:      l.UserID,
				Name:        l.Name,
				Won:         l.Won,
				Revenue:     l.Revenue,
				TotalLeads:  l.TotalLeads,
				SuccessRate: fmt.Sprintf("%.1f", rate),
				Calls:       l.Calls,
				Emails:      l.Emails,
				Meetings:    l.Meetings,
				TotalTasks:  l.TotalTasks,
			}
		}

		return e.JSON(http.StatusOK, map[string]interface{}{
			"leaderboard": results,
		})
	}
}

// ─── Financial Stats ──────────────────────────────────────────────────────────

func buildFinancialStats(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		// Invoice counts/amounts by status
		type invoiceStatusRow struct {
			Status string  `db:"status" json:"status"`
			Count  int     `db:"count" json:"count"`
			Amount float64 `db:"amount" json:"amount"`
		}
		byStatus := make([]invoiceStatusRow, 0)
		app.DB().NewQuery(`
			SELECT status, COUNT(*) AS count, COALESCE(SUM(total), 0) AS amount
			FROM invoices
			GROUP BY status
		`).All(&byStatus) //nolint:errcheck

		// Average payment delay (days)
		var avgDelay float64
		app.DB().NewQuery(`
			SELECT COALESCE(AVG(julianday(paid_at) - julianday(issued_at)), 0)
			FROM invoices
			WHERE status = 'payee'
			  AND paid_at   != '' AND paid_at   IS NOT NULL
			  AND issued_at != '' AND issued_at IS NOT NULL
		`).Row(&avgDelay) //nolint:errcheck

		// Revenue forecast (probability-weighted open leads)
		var forecast float64
		app.DB().NewQuery(`
			SELECT COALESCE(SUM(
				CASE status
					WHEN 'nouveau'     THEN value * 0.10
					WHEN 'contacte'    THEN value * 0.20
					WHEN 'qualifie'    THEN value * 0.40
					WHEN 'proposition' THEN value * 0.60
					WHEN 'negociation' THEN value * 0.80
					ELSE 0
				END
			), 0)
			FROM leads
			WHERE status NOT IN ('gagne', 'perdu')
		`).Row(&forecast) //nolint:errcheck

		// Forecast breakdown by stage
		type forecastRow struct {
			Stage       string  `db:"stage" json:"stage"`
			TotalAmount float64 `db:"total_amount" json:"total_amount"`
			Weighted    float64 `db:"weighted" json:"weighted"`
		}
		forecastByStage := make([]forecastRow, 0)
		app.DB().NewQuery(`
			SELECT status AS stage,
			       COALESCE(SUM(value), 0) AS total_amount,
			       COALESCE(SUM(
			           CASE status
			               WHEN 'nouveau'     THEN value * 0.10
			               WHEN 'contacte'    THEN value * 0.20
			               WHEN 'qualifie'    THEN value * 0.40
			               WHEN 'proposition' THEN value * 0.60
			               WHEN 'negociation' THEN value * 0.80
			               ELSE 0
			           END
			       ), 0) AS weighted
			FROM leads
			WHERE status NOT IN ('gagne', 'perdu')
			GROUP BY status
		`).All(&forecastByStage) //nolint:errcheck

		// Revenue by month from paid invoices
		type monthRevenueRow struct {
			Month  string  `db:"month" json:"month"`
			Amount float64 `db:"amount" json:"amount"`
		}
		revenueByMonth := make([]monthRevenueRow, 0)
		app.DB().NewQuery(`
			SELECT strftime('%Y-%m', paid_at) AS month, COALESCE(SUM(total), 0) AS amount
			FROM invoices
			WHERE status = 'payee'
			  AND paid_at != '' AND paid_at IS NOT NULL
			GROUP BY month
			ORDER BY month ASC
		`).All(&revenueByMonth) //nolint:errcheck

		return e.JSON(http.StatusOK, map[string]interface{}{
			"by_status":         byStatus,
			"avg_payment_delay": fmt.Sprintf("%.0f", avgDelay),
			"forecast":          fmt.Sprintf("%.0f", forecast),
			"forecast_by_stage": forecastByStage,
			"revenue_by_month":  revenueByMonth,
		})
	}
}

// ─── Marketing Stats ──────────────────────────────────────────────────────────

func buildMarketingStats(app core.App) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		start, _, _ := parsePeriodDates(e)

		// Leads by month (all time, ascending)
		type monthCountRow struct {
			Month string `db:"month" json:"month"`
			Count int    `db:"count" json:"count"`
		}
		leadsByMonth := make([]monthCountRow, 0)
		app.DB().NewQuery(`
			SELECT strftime('%Y-%m', created) AS month, COUNT(*) AS count
			FROM leads
			GROUP BY month
			ORDER BY month ASC
		`).All(&leadsByMonth) //nolint:errcheck

		// Lead source distribution (current period)
		type sourceRow struct {
			Source string `db:"source" json:"source"`
			Count  int    `db:"count" json:"count"`
		}
		bySource := make([]sourceRow, 0)
		app.DB().NewQuery(`
			SELECT COALESCE(source, 'autre') AS source, COUNT(*) AS count
			FROM leads
			WHERE created >= {:start}
			GROUP BY source
			ORDER BY count DESC
		`).Bind(dbx.Params{"start": start}).All(&bySource) //nolint:errcheck

		// Total leads in period
		var totalLeads int
		app.DB().NewQuery(`SELECT COUNT(*) FROM leads WHERE created >= {:start}`). //nolint:errcheck
			Bind(dbx.Params{"start": start}).Row(&totalLeads)

		// Email stats (current period)
		var emailRow struct {
			Total   int `db:"total" json:"total"`
			Sent    int `db:"sent" json:"sent"`
			Opened  int `db:"opened" json:"opened"`
			Clicked int `db:"clicked" json:"clicked"`
		}
		app.DB().NewQuery(`
			SELECT
				COUNT(*) AS total,
				COALESCE(SUM(CASE WHEN status IN ('envoye','ouvert','clique') THEN 1 ELSE 0 END), 0) AS sent,
				COALESCE(SUM(CASE WHEN open_count  > 0 THEN 1 ELSE 0 END), 0) AS opened,
				COALESCE(SUM(CASE WHEN click_count > 0 THEN 1 ELSE 0 END), 0) AS clicked
			FROM email_logs
			WHERE sent_at >= {:start}
		`).Bind(dbx.Params{"start": start}).One(&emailRow) //nolint:errcheck

		openRate := 0.0
		clickRate := 0.0
		if emailRow.Sent > 0 {
			openRate = float64(emailRow.Opened) / float64(emailRow.Sent) * 100
			clickRate = float64(emailRow.Clicked) / float64(emailRow.Sent) * 100
		}

		return e.JSON(http.StatusOK, map[string]interface{}{
			"leads_by_month": leadsByMonth,
			"by_source":      bySource,
			"total_leads":    totalLeads,
			"email_stats": map[string]interface{}{
				"total":      emailRow.Total,
				"sent":       emailRow.Sent,
				"open_rate":  fmt.Sprintf("%.1f", openRate),
				"click_rate": fmt.Sprintf("%.1f", clickRate),
			},
		})
	}
}
