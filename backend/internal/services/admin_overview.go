package services

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/database"
)

type OverviewMetric struct {
	Value     *int64 `json:"value"`
	Available bool   `json:"available"`
}

type AdminOverview struct {
	Users struct {
		Total     OverviewMetric `json:"total"`
		Active    OverviewMetric `json:"active"`
		Suspended OverviewMetric `json:"suspended"`
	} `json:"users"`
	UsersByRole  map[string]int64 `json:"usersByRole"`
	Verification struct {
		ProfilesByStatus      map[string]int64 `json:"profilesByStatus"`
		OrganizationsByStatus map[string]int64 `json:"organizationsByStatus"`
		VerifiedOrganizations OverviewMetric   `json:"verifiedOrganizations"`
	} `json:"verification"`
	Organizations struct {
		Total    OverviewMetric   `json:"total"`
		ByStatus map[string]int64 `json:"byStatus"`
	} `json:"organizations"`
	Animals   OverviewMetric `json:"animals"`
	Transport struct {
		Transporters              OverviewMetric   `json:"transporters"`
		PickupAssignments         OverviewMetric   `json:"pickupAssignments"`
		PickupAssignmentsByStatus map[string]int64 `json:"pickupAssignmentsByStatus"`
		ActiveAssignments         OverviewMetric   `json:"activeAssignments"`
	} `json:"transport"`
	Slaughter    OverviewMetric `json:"slaughter"`
	Processing   OverviewMetric `json:"processing"`
	Distribution struct {
		Total    OverviewMetric   `json:"total"`
		ByStatus map[string]int64 `json:"byStatus"`
	} `json:"distribution"`
	ProductBatches OverviewMetric `json:"productBatches"`
	Retail         struct {
		Retailers       OverviewMetric `json:"retailers"`
		IncomingBatches OverviewMetric `json:"incomingBatches"`
	} `json:"retail"`
	Disease struct {
		VetVisitsWithDisease OverviewMetric   `json:"vetVisitsWithDisease"`
		ByDisease            map[string]int64 `json:"byDisease"`
	} `json:"disease"`
	ConsumerQRScans OverviewMetric `json:"consumerQrScans"`
}

type AdminOverviewService struct{ db *database.DB }

func NewAdminOverviewService(db *database.DB) *AdminOverviewService {
	return &AdminOverviewService{db: db}
}
func metric(n int64) OverviewMetric { return OverviewMetric{Value: &n, Available: true} }
func unavailable() OverviewMetric   { return OverviewMetric{Available: false} }

func (s *AdminOverviewService) count(ctx context.Context, table string, filters map[string]string) (int64, error) {
	q := s.db.Client.From(table).Select("id", "exact", true)
	for key, value := range filters {
		q = q.Eq(key, value)
	}
	_, n, err := q.ExecuteWithContext(ctx)
	if err != nil {
		return 0, fmt.Errorf("count %s: %w", table, err)
	}
	return n, nil
}
func (s *AdminOverviewService) Get(ctx context.Context) (*AdminOverview, error) {
	if s.db == nil || s.db.Client == nil {
		return nil, fmt.Errorf("database unavailable")
	}
	o := &AdminOverview{}
	get := func(table string, f map[string]string) (OverviewMetric, error) {
		n, e := s.count(ctx, table, f)
		return metric(n), e
	}
	var err error
	if o.Users.Total, err = get("profiles", nil); err != nil {
		return nil, err
	}
	if o.Users.Active, err = get("profiles", map[string]string{"account_status": "active"}); err != nil {
		return nil, err
	}
	if o.Users.Suspended, err = get("profiles", map[string]string{"account_status": "suspended"}); err != nil {
		return nil, err
	}
	if o.Organizations.Total, err = get("organizations", nil); err != nil {
		return nil, err
	}
	if o.Verification.VerifiedOrganizations, err = get("organizations", map[string]string{"verified": "true"}); err != nil {
		return nil, err
	}
	for _, item := range []struct {
		table, column string
		out           *OverviewMetric
	}{{"animals", "", &o.Animals}, {"transporters", "", &o.Transport.Transporters}, {"pickup_assignments", "", &o.Transport.PickupAssignments}, {"slaughter_records", "", &o.Slaughter}, {"processing_records", "", &o.Processing}, {"product_batches", "", &o.ProductBatches}, {"retailers", "", &o.Retail.Retailers}, {"retailer_incoming_batches", "", &o.Retail.IncomingBatches}, {"distributor_shipments", "", &o.Distribution.Total}} {
		if *item.out, err = get(item.table, nil); err != nil {
			return nil, err
		}
	}
	type statusRow struct {
		Status string `json:"status"`
	}
	type verificationStatusRow struct {
		Status string `json:"verification_status"`
	}
	type roleRow struct {
		Role string `json:"role"`
	}
	type diseaseRow struct {
		Disease string `json:"disease_experienced"`
	}
	var roles []roleRow
	if _, err = s.db.Client.From("profiles").Select("role", "", false).ExecuteToWithContext(ctx, &roles); err != nil {
		return nil, err
	}
	o.UsersByRole = map[string]int64{}
	for _, r := range roles {
		if r.Role != "" {
			o.UsersByRole[r.Role]++
		}
	}
	var profileStatuses []verificationStatusRow
	if _, err = s.db.Client.From("profiles").Select("verification_status", "", false).ExecuteToWithContext(ctx, &profileStatuses); err != nil {
		return nil, err
	}
	o.Verification.ProfilesByStatus = map[string]int64{}
	for _, r := range profileStatuses {
		if r.Status != "" {
			o.Verification.ProfilesByStatus[r.Status]++
		}
	}
	var orgStatuses []statusRow
	if _, err = s.db.Client.From("organizations").Select("status", "", false).ExecuteToWithContext(ctx, &orgStatuses); err != nil {
		return nil, err
	}
	o.Organizations.ByStatus = map[string]int64{}
	o.Verification.OrganizationsByStatus = map[string]int64{}
	for _, r := range orgStatuses {
		if r.Status != "" {
			o.Organizations.ByStatus[r.Status]++
			o.Verification.OrganizationsByStatus[r.Status]++
		}
	}
	var pickupStatuses []statusRow
	if _, err = s.db.Client.From("pickup_assignments").Select("status", "", false).ExecuteToWithContext(ctx, &pickupStatuses); err != nil {
		return nil, err
	}
	o.Transport.PickupAssignmentsByStatus = map[string]int64{}
	for _, r := range pickupStatuses {
		if r.Status != "" {
			o.Transport.PickupAssignmentsByStatus[r.Status]++
		}
	}
	o.Transport.ActiveAssignments = unavailable()
	var shipmentStatuses []statusRow
	if _, err = s.db.Client.From("distributor_shipments").Select("status", "", false).ExecuteToWithContext(ctx, &shipmentStatuses); err != nil {
		return nil, err
	}
	o.Distribution.ByStatus = map[string]int64{}
	for _, r := range shipmentStatuses {
		if r.Status != "" {
			o.Distribution.ByStatus[r.Status]++
		}
	}
	var diseases []diseaseRow
	if _, err = s.db.Client.From("vet_visits").Select("disease_experienced", "", false).ExecuteToWithContext(ctx, &diseases); err != nil {
		return nil, err
	}
	o.Disease.ByDisease = map[string]int64{}
	var visits int64
	for _, r := range diseases {
		if d := strings.TrimSpace(r.Disease); d != "" {
			visits++
			o.Disease.ByDisease[d]++
		}
	}
	o.Disease.VetVisitsWithDisease = metric(visits)
	o.ConsumerQRScans = unavailable()
	return o, nil
}
