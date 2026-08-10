package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/types"
)

type AdminDashboardHandler struct{}

func NewAdminDashboardHandler() *AdminDashboardHandler {
	return &AdminDashboardHandler{}
}

type AdminUserSummary struct {
	TotalUsers           int64 `json:"totalUsers"`
	ActiveUsers          int64 `json:"activeUsers"`
	SuspendedUsers       int64 `json:"suspendedUsers"`
	LockedUsers          int64 `json:"lockedUsers"`
	TotalFarmers         int64 `json:"totalFarmers"`
	TotalVets            int64 `json:"totalVets"`
	TotalAgents          int64 `json:"totalAgents"`
	TotalTransporters    int64 `json:"totalTransporters"`
	TotalSlaughterhouses int64 `json:"totalSlaughterhouses"`
	TotalProcessors      int64 `json:"totalProcessors"`
	TotalDistributors    int64 `json:"totalDistributors"`
	TotalTraders         int64 `json:"totalTraders"`
	TotalRetailers       int64 `json:"totalRetailers"`
	TotalConsumers       int64 `json:"totalConsumers"`
}

type AdminTraceabilitySummary struct {
	TotalOrganizations          int64 `json:"totalOrganizations"`
	AnimalsRegistered           int64 `json:"animalsRegistered"`
	AnimalsActive               int64 `json:"animalsActive"`
	LivestockMovements          int64 `json:"livestockMovements"`
	ActiveTransportTrips        int64 `json:"activeTransportTrips"`
	SlaughterRecords            int64 `json:"slaughterRecords"`
	ProcessingBatches           int64 `json:"processingBatches"`
	DistributionShipments       int64 `json:"distributionShipments"`
	ConsumerQrScans             int64 `json:"consumerQrScans"`
	PendingVerificationRequests int64 `json:"pendingVerificationRequests"`
	ActiveAlerts                int64 `json:"activeAlerts"`
	TraceabilityGaps            int64 `json:"traceabilityGaps"`
	DiseaseReports              int64 `json:"diseaseReports"`
}

type ChartPoint struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

type NamedMetric struct {
	Name  string `json:"name"`
	Value int64  `json:"value"`
}

type AdminDashboardCharts struct {
	RegistrationsTrend        []ChartPoint  `json:"registrationsTrend"`
	RoleBreakdown             []NamedMetric `json:"roleBreakdown"`
	AccountStatusBreakdown    []NamedMetric `json:"accountStatusBreakdown"`
	AnimalsRegisteredTrend    []ChartPoint  `json:"animalsRegisteredTrend"`
	TraceabilityActivityTrend []ChartPoint  `json:"traceabilityActivityTrend"`
	ComplianceBreakdown       []NamedMetric `json:"complianceBreakdown"`
	DiseaseReportsTrend       []ChartPoint  `json:"diseaseReportsTrend"`
	DiseaseCasesByLocation    []NamedMetric `json:"diseaseCasesByLocation"`
}

func (h *AdminDashboardHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireAdminClaims(w, r); !ok {
		return
	}

	writeAdminJSON(w, http.StatusOK, map[string]interface{}{
		"users":        AdminUserSummary{},
		"traceability": AdminTraceabilitySummary{},
		"dataStatus":   "No aggregate data source is wired for this legacy endpoint yet.",
	})
}

func (h *AdminDashboardHandler) GetUserSummary(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireAdminClaims(w, r); !ok {
		return
	}
	writeAdminJSON(w, http.StatusOK, AdminUserSummary{})
}

func (h *AdminDashboardHandler) GetTraceabilitySummary(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireAdminClaims(w, r); !ok {
		return
	}
	writeAdminJSON(w, http.StatusOK, AdminTraceabilitySummary{})
}

func (h *AdminDashboardHandler) GetCharts(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireAdminClaims(w, r); !ok {
		return
	}
	writeAdminJSON(w, http.StatusOK, AdminDashboardCharts{
		RegistrationsTrend:        []ChartPoint{},
		RoleBreakdown:             []NamedMetric{},
		AccountStatusBreakdown:    []NamedMetric{},
		AnimalsRegisteredTrend:    []ChartPoint{},
		TraceabilityActivityTrend: []ChartPoint{},
		ComplianceBreakdown:       []NamedMetric{},
		DiseaseReportsTrend:       []ChartPoint{},
		DiseaseCasesByLocation:    []NamedMetric{},
	})
}

func (h *AdminDashboardHandler) GetRecentActivity(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireAdminClaims(w, r); !ok {
		return
	}
	writeAdminJSON(w, http.StatusOK, []map[string]interface{}{})
}

func (h *AdminDashboardHandler) GetPendingApprovals(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireAdminClaims(w, r); !ok {
		return
	}
	writeAdminJSON(w, http.StatusOK, []map[string]interface{}{})
}

func (h *AdminDashboardHandler) GetRecentRegistrations(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireAdminClaims(w, r); !ok {
		return
	}
	writeAdminJSON(w, http.StatusOK, []map[string]interface{}{})
}

func (h *AdminDashboardHandler) GetSystemAlerts(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireAdminClaims(w, r); !ok {
		return
	}
	writeAdminJSON(w, http.StatusOK, []map[string]interface{}{})
}

func (h *AdminDashboardHandler) GetAdminProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAdminClaims(w, r)
	if !ok {
		return
	}

	profile := map[string]interface{}{
		"id":        claims.Subject,
		"adminId":   claims.Subject,
		"email":     claims.Email,
		"role":      claims.AppMetadata.Role,
		"is_active": true,
		"source":    "supabase_auth",
	}
	writeAdminJSON(w, http.StatusOK, profile)
}

func requireAdminClaims(w http.ResponseWriter, r *http.Request) (*types.SupabaseClaims, bool) {
	claims, ok := types.AuthClaimsFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return nil, false
	}
	return claims, true
}

func writeAdminJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
