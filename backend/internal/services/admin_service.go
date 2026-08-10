package services

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"backend/internal/database"
)

// AdminService handles real Supabase aggregation for admin dashboard operations.
type AdminService struct {
	db *database.DB
}

// NewAdminService creates a new AdminService.
func NewAdminService(db *database.DB) *AdminService {
	return &AdminService{db: db}
}

type UserSummary struct {
	TotalUsers                  int64 `json:"totalUsers"`
	TotalFarmers                int64 `json:"totalFarmers"`
	TotalSlaughterhouses        int64 `json:"totalSlaughterhouses"`
	TotalSlaughterhouseOfficers int64 `json:"totalSlaughterhouseOfficers"`
	TotalTransporters           int64 `json:"totalTransporters"`
	TotalDistributors           int64 `json:"totalDistributors"`
	TotalProcessors             int64 `json:"totalProcessors"`
	TotalRetailers              int64 `json:"totalRetailers"`
}

type TraceabilitySummary struct {
	AnimalsRegistered  int64 `json:"animalsRegistered"`
	AnimalsActive      int64 `json:"animalsActive"`
	AnimalsTransported int64 `json:"animalsTransported"`
	AnimalsSlaughtered int64 `json:"animalsSlaughtered"`
	CarcassRecords     int64 `json:"carcassRecords"`
	MeatBatches        int64 `json:"meatBatches"`
	CompletedChains    int64 `json:"completedChains"`
}

type TrendPoint struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}
type RoleBreakdown struct {
	Name  string `json:"name"`
	Value int64  `json:"value"`
}
type DashboardCharts struct {
	RegistrationsTrend []TrendPoint    `json:"registrationsTrend"`
	RoleBreakdown      []RoleBreakdown `json:"roleBreakdown"`
}
type ListItem struct {
	ID           string `json:"id"`
	Name         string `json:"name,omitempty"`
	Role         string `json:"role,omitempty"`
	Type         string `json:"type,omitempty"`
	SubmittedAt  string `json:"submittedAt,omitempty"`
	RegisteredAt string `json:"registeredAt,omitempty"`
	Text         string `json:"text,omitempty"`
	Time         string `json:"time,omitempty"`
	Severity     string `json:"severity,omitempty"`
}

var roleTables = map[string]string{
	"Farmers": "farmers", "Slaughterhouses": "slaughterhouses", "Slaughterhouse officers": "slaughterhouse_officers", "Transporters": "transporters", "Distributors": "distributors", "Processors": "processors", "Retailers": "retailers",
}

func (s *AdminService) requireDB() error {
	if s == nil || s.db == nil || s.db.Client == nil {
		return fmt.Errorf("supabase database client is not configured")
	}
	return nil
}
func (s *AdminService) count(table string) (int64, error) {
	if err := s.requireDB(); err != nil {
		return 0, err
	}
	_, c, err := s.db.Client.From(table).Select("id", "exact", true).Execute()
	if err != nil {
		return 0, fmt.Errorf("%s table query failed: %w", table, err)
	}
	return c, nil
}
func (s *AdminService) countEq(table, col, val string) (int64, error) {
	if err := s.requireDB(); err != nil {
		return 0, err
	}
	_, c, err := s.db.Client.From(table).Select("id", "exact", true).Eq(col, val).Execute()
	if err != nil {
		return 0, fmt.Errorf("%s table query failed: %w", table, err)
	}
	return c, nil
}

func (s *AdminService) GetUserSummary() (*UserSummary, error) {
	out := &UserSummary{}
	for label, table := range roleTables {
		c, err := s.count(table)
		if err != nil {
			return nil, err
		}
		switch label {
		case "Farmers":
			out.TotalFarmers = c
		case "Slaughterhouses":
			out.TotalSlaughterhouses = c
		case "Slaughterhouse officers":
			out.TotalSlaughterhouseOfficers = c
		case "Transporters":
			out.TotalTransporters = c
		case "Distributors":
			out.TotalDistributors = c
		case "Processors":
			out.TotalProcessors = c
		case "Retailers":
			out.TotalRetailers = c
		}
		out.TotalUsers += c
	}
	return out, nil
}

func (s *AdminService) GetTraceabilitySummary() (*TraceabilitySummary, error) {
	animals, err := s.count("animals")
	if err != nil {
		return nil, err
	}
	active, err := s.countEq("animals", "status", "active")
	if err != nil {
		return nil, err
	}
	transported, err := s.count("transport_trips")
	if err != nil {
		return nil, err
	}
	slaughtered, err := s.count("slaughter_records")
	if err != nil {
		return nil, err
	}
	batches, err := s.count("product_batches")
	if err != nil {
		return nil, err
	}
	completed := batches
	if slaughtered < completed {
		completed = slaughtered
	}
	return &TraceabilitySummary{AnimalsRegistered: animals, AnimalsActive: active, AnimalsTransported: transported, AnimalsSlaughtered: slaughtered, CarcassRecords: slaughtered, MeatBatches: batches, CompletedChains: completed}, nil
}

func (s *AdminService) GetDashboardCharts() (*DashboardCharts, error) {
	users, err := s.GetUserSummary()
	if err != nil {
		return nil, err
	}
	trend, err := s.registrationTrend()
	if err != nil {
		return nil, err
	}
	return &DashboardCharts{RegistrationsTrend: trend, RoleBreakdown: []RoleBreakdown{{"Farmers", users.TotalFarmers}, {"Slaughterhouses", users.TotalSlaughterhouses}, {"Slaughterhouse officers", users.TotalSlaughterhouseOfficers}, {"Transporters", users.TotalTransporters}, {"Distributors", users.TotalDistributors}, {"Processors", users.TotalProcessors}, {"Retailers", users.TotalRetailers}}}, nil
}

func (s *AdminService) registrationTrend() ([]TrendPoint, error) {
	points := make([]TrendPoint, 0, 7)
	for i := 6; i >= 0; i-- {
		day := time.Now().UTC().AddDate(0, 0, -i)
		next := day.AddDate(0, 0, 1)
		var total int64
		for _, table := range roleTables {
			if err := s.requireDB(); err != nil {
				return nil, err
			}
			_, c, err := s.db.Client.From(table).Select("id", "exact", true).Gte("created_at", day.Format("2006-01-02")).Lt("created_at", next.Format("2006-01-02")).Execute()
			if err != nil {
				return nil, fmt.Errorf("%s table query failed: %w", table, err)
			}
			total += c
		}
		points = append(points, TrendPoint{Date: day.Format("Jan 02"), Count: total})
	}
	return points, nil
}

func (s *AdminService) GetPendingApprovals(limit int) ([]ListItem, error) {
	return s.selectItems("admin_approvals", limit, "submitted_at")
}
func (s *AdminService) GetAlerts(limit int) ([]ListItem, error) {
	return s.selectItems("system_alerts", limit, "created_at")
}
func (s *AdminService) GetActivity(limit int) ([]ListItem, error) {
	return s.selectItems("admin_activity", limit, "created_at")
}

func (s *AdminService) GetRecentRegistrations(limit int) ([]ListItem, error) {
	items, err := s.selectItems("admin_recent_registrations", limit, "created_at")
	if err == nil {
		return items, nil
	}
	return nil, fmt.Errorf("admin_recent_registrations view is required for recent registrations: %w", err)
}

func (s *AdminService) selectItems(table string, limit int, order string) ([]ListItem, error) {
	if err := s.requireDB(); err != nil {
		return nil, err
	}
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	data, _, err := s.db.Client.From(table).Select("*", "exact", false).Order(order, nil).Limit(limit, "").Execute()
	if err != nil {
		return nil, fmt.Errorf("%s table or view is required: %w", table, err)
	}
	var rows []map[string]any
	if err := json.Unmarshal(data, &rows); err != nil {
		return nil, err
	}
	out := make([]ListItem, 0, len(rows))
	for _, r := range rows {
		out = append(out, mapRow(r))
	}
	return out, nil
}

func mapRow(r map[string]any) ListItem {
	return ListItem{ID: str(r, "id"), Name: first(r, "name", "full_name", "email"), Role: str(r, "role"), Type: str(r, "type"), SubmittedAt: first(r, "submittedAt", "submitted_at", "created_at"), RegisteredAt: first(r, "registeredAt", "registered_at", "created_at"), Text: first(r, "text", "message", "description"), Time: first(r, "time", "created_at"), Severity: first(r, "severity", "level")}
}
func str(m map[string]any, k string) string {
	if v, ok := m[k]; ok && v != nil {
		return strings.TrimSpace(fmt.Sprint(v))
	}
	return ""
}
func first(m map[string]any, keys ...string) string {
	for _, k := range keys {
		if v := str(m, k); v != "" {
			return v
		}
	}
	return ""
}
