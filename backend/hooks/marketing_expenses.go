package hooks

import (
	"fmt"

	"github.com/pocketbase/pocketbase/core"
)

// RegisterMarketingExpenseHooks validates that a marketing expense's campaign_id
// (if set) references a campaign whose type matches the expense category:
//
//   - category == "email" → campaign.type must be "email"
//   - category != "email" → campaign.type must not be "email"
func RegisterMarketingExpenseHooks(app core.App) {
	validate := func(e *core.RecordEvent) error {
		campaignID := e.Record.GetString("campaign_id")
		if campaignID == "" {
			return e.Next()
		}

		campaign, err := app.FindRecordById("campaigns", campaignID)
		if err != nil {
			return fmt.Errorf("campagne introuvable : %w", err)
		}

		category := e.Record.GetString("category")
		campaignType := campaign.GetString("type")

		if category == "email" && campaignType != "email" {
			return fmt.Errorf("une dépense email doit être liée à une campagne email")
		}
		if category != "email" && campaignType == "email" {
			return fmt.Errorf("une dépense non-email ne peut pas être liée à une campagne email")
		}

		return e.Next()
	}

	app.OnRecordCreate("marketing_expenses").BindFunc(validate)
	app.OnRecordUpdate("marketing_expenses").BindFunc(validate)
}
