package routes

import (
	"backend/internal/database"
	"backend/internal/middleware"
	adminrepo "backend/internal/repositories/admin"
	adminservice "backend/internal/services/admin"
	"backend/internal/types"
	"backend/internal/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// SlaughterhouseRoutes is deliberately separate from the legacy handlers in
// main.go. All access starts with the JWT subject, resolves its approved
// slaughterhouse organization, and then scopes every query to that chain.
func SlaughterhouseRoutes(mux *http.ServeMux, verifier *utils.JWKSVerifier, db *database.DB) {
	require := func(h http.Handler) http.Handler {
		return middleware.RequireAuth(verifier)(middleware.RequireRole("slaughterhouse")(h))
	}
	h := &slaughterhouseHandler{db: db, traceService: adminservice.New(adminrepo.New(db))}
	mux.Handle("GET /api/slaughterhouse/reception", require(http.HandlerFunc(h.receptions)))
	mux.Handle("POST /api/slaughterhouse/reception", require(http.HandlerFunc(h.receptions)))
	mux.Handle("GET /api/slaughterhouse/inspection", require(http.HandlerFunc(h.inspections)))
	mux.Handle("POST /api/slaughterhouse/inspection", require(http.HandlerFunc(h.inspections)))
	mux.Handle("GET /api/slaughterhouse/slaughter", require(http.HandlerFunc(h.operations)))
	mux.Handle("POST /api/slaughterhouse/slaughter", require(http.HandlerFunc(h.operations)))
	mux.Handle("GET /api/slaughterhouse/carcasses", require(http.HandlerFunc(h.carcasses)))
	mux.Handle("POST /api/slaughterhouse/carcasses", require(http.HandlerFunc(h.carcasses)))
	mux.Handle("GET /api/slaughterhouse/carcass-inspections", require(http.HandlerFunc(h.carcassInspections)))
	mux.Handle("POST /api/slaughterhouse/carcass-inspections", require(http.HandlerFunc(h.carcassInspections)))
	mux.Handle("GET /api/slaughterhouse/shipments", require(http.HandlerFunc(h.shipments)))
	mux.Handle("POST /api/slaughterhouse/shipments", require(http.HandlerFunc(h.shipments)))
	mux.Handle("GET /api/slaughterhouse/notifications", require(http.HandlerFunc(h.notifications)))
	mux.Handle("GET /api/slaughterhouse/profile", require(http.HandlerFunc(h.profile)))
	mux.Handle("PATCH /api/slaughterhouse/profile", require(http.HandlerFunc(h.profile)))
	mux.Handle("GET /api/slaughterhouse/traceability", require(http.HandlerFunc(h.traceability)))
	mux.Handle("GET /api/slaughterhouse/reports/{rest...}", require(http.HandlerFunc(unavailableSlaughterhouse("Reports"))))
	mux.Handle("GET /api/slaughterhouse/settings", require(http.HandlerFunc(unavailableSlaughterhouse("Settings"))))
}

type slaughterhouseHandler struct {
	db           *database.DB
	traceService *adminservice.Service
}

func (h *slaughterhouseHandler) organization(r *http.Request) (string, error) {
	if h.db == nil || h.db.Client == nil {
		return "", fmt.Errorf("database unavailable")
	}
	claims, ok := types.AuthClaimsFromContext(r.Context())
	if !ok || claims.Subject == "" {
		return "", fmt.Errorf("authentication required")
	}
	var profiles []struct {
		OrganizationID string `json:"organization_id"`
	}
	if _, err := h.db.Client.From("profiles").Select("organization_id", "", false).Eq("id", claims.Subject).ExecuteToWithContext(r.Context(), &profiles); err != nil {
		return "", err
	}
	if len(profiles) != 1 || profiles[0].OrganizationID == "" {
		return "", fmt.Errorf("slaughterhouse organization is not assigned")
	}
	var members []struct {
		OrganizationID string `json:"organization_id"`
	}
	if _, err := h.db.Client.From("organization_members").Select("organization_id", "", false).Eq("organization_id", profiles[0].OrganizationID).Eq("profile_id", claims.Subject).ExecuteToWithContext(r.Context(), &members); err != nil {
		return "", err
	}
	if len(members) != 1 {
		return "", fmt.Errorf("slaughterhouse membership is required")
	}
	var orgs []struct {
		ID string `json:"id"`
	}
	if _, err := h.db.Client.From("organizations").Select("id", "", false).Eq("id", profiles[0].OrganizationID).Eq("organization_type", "slaughterhouse").Eq("status", "approved").ExecuteToWithContext(r.Context(), &orgs); err != nil {
		return "", err
	}
	if len(orgs) != 1 {
		return "", fmt.Errorf("approved slaughterhouse organization is required")
	}
	return orgs[0].ID, nil
}

func decodeMap(r *http.Request) (map[string]interface{}, bool) {
	var v map[string]interface{}
	if json.NewDecoder(r.Body).Decode(&v) != nil {
		return nil, false
	}
	return v, true
}
func (h *slaughterhouseHandler) scopedTags(r *http.Request, org string) ([]string, error) {
	var rows []struct {
		TagID string `json:"tag_id"`
	}
	_, err := h.db.Client.From("animal_receptions").Select("tag_id", "", false).Eq("slaughterhouse_id", org).ExecuteToWithContext(r.Context(), &rows)
	out := make([]string, 0, len(rows))
	for _, v := range rows {
		out = append(out, v.TagID)
	}
	return out, err
}
func containsTag(tags []string, tag string) bool {
	for _, value := range tags {
		if value == tag {
			return true
		}
	}
	return false
}
func (h *slaughterhouseHandler) listOrInsert(w http.ResponseWriter, r *http.Request, table, ownerKey string, derived bool) {
	org, err := h.organization(r)
	if err != nil {
		utils.Fail(w, 403, "You do not have access to this slaughterhouse.", err.Error())
		return
	}
	if r.Method == http.MethodPost {
		v, ok := decodeMap(r)
		if !ok {
			utils.Fail(w, 422, "Invalid request.", "invalid JSON payload")
			return
		}
		if derived {
			tags, e := h.scopedTags(r, org)
			if e != nil {
				utils.Fail(w, 500, "Unable to validate record.", "database query failed")
				return
			}
			key := "animal_id"
			if table == "carcass_inspections" {
				key = "tag_id"
			}
			tag, _ := v[key].(string)
			if tag == "" || !containsTag(tags, tag) {
				utils.Fail(w, 404, "Resource not found.", "animal reception is not available to this slaughterhouse")
				return
			}
		}
		if ownerKey != "" {
			v[ownerKey] = org
		}
		if _, _, err = h.db.Client.From(table).Insert(v, false, "representation", "", "").ExecuteWithContext(r.Context()); err != nil {
			utils.Fail(w, 422, "Unable to save record.", "database rejected this record")
			return
		}
		utils.Success(w, 201, "Record created", v)
		return
	}
	q := h.db.Client.From(table).Select("*", "", false)
	if ownerKey != "" {
		q = q.Eq(ownerKey, org)
	} else if derived {
		tags, e := h.scopedTags(r, org)
		if e != nil {
			utils.Fail(w, 500, "Unable to load records.", "database query failed")
			return
		}
		if len(tags) == 0 {
			utils.Success(w, 200, "Records retrieved", []map[string]interface{}{})
			return
		}
		key := "animal_id"
		if table == "carcass_inspections" {
			key = "tag_id"
		}
		q = q.In(key, tags)
	}
	var rows []map[string]interface{}
	if _, err := q.ExecuteToWithContext(r.Context(), &rows); err != nil {
		utils.Fail(w, 500, "Unable to load records.", "database query failed")
		return
	}
	utils.Success(w, 200, "Records retrieved", rows)
}
func (h *slaughterhouseHandler) receptions(w http.ResponseWriter, r *http.Request) {
	h.listOrInsert(w, r, "animal_receptions", "slaughterhouse_id", false)
}
func (h *slaughterhouseHandler) inspections(w http.ResponseWriter, r *http.Request) {
	h.listOrInsert(w, r, "ante_mortem_inspections", "", true)
}
func (h *slaughterhouseHandler) operations(w http.ResponseWriter, r *http.Request) {
	h.listOrInsert(w, r, "slaughter_operations", "", true)
}
func (h *slaughterhouseHandler) carcasses(w http.ResponseWriter, r *http.Request) {
	h.listOrInsert(w, r, "carcasses", "", true)
}
func (h *slaughterhouseHandler) carcassInspections(w http.ResponseWriter, r *http.Request) {
	h.listOrInsert(w, r, "carcass_inspections", "", true)
}
func (h *slaughterhouseHandler) shipments(w http.ResponseWriter, r *http.Request) {
	h.listOrInsert(w, r, "slaughterhouse_shipments", "slaughterhouse_id", false)
}
func (h *slaughterhouseHandler) notifications(w http.ResponseWriter, r *http.Request) {
	claims, _ := types.AuthClaimsFromContext(r.Context())
	var rows []map[string]interface{}
	if _, e := h.db.Client.From("admin_notifications").Select("id,type,title,message,read,created_at", "", false).Eq("recipient_id", claims.Subject).ExecuteToWithContext(r.Context(), &rows); e != nil {
		utils.Fail(w, 500, "Unable to load notifications.", "database query failed")
		return
	}
	utils.Success(w, 200, "Notifications retrieved", rows)
}
func (h *slaughterhouseHandler) profile(w http.ResponseWriter, r *http.Request) {
	claims, _ := types.AuthClaimsFromContext(r.Context())
	if r.Method == http.MethodPatch {
		v, ok := decodeMap(r)
		if !ok {
			utils.Fail(w, 422, "Invalid request.", "invalid JSON payload")
			return
		}
		delete(v, "id")
		delete(v, "organization_id")
		if _, _, e := h.db.Client.From("profiles").Update(v, "representation", "").Eq("id", claims.Subject).ExecuteWithContext(r.Context()); e != nil {
			utils.Fail(w, 422, "Unable to update profile.", "database rejected this profile")
			return
		}
		utils.Success(w, 200, "Profile updated", v)
		return
	}
	var rows []map[string]interface{}
	if _, e := h.db.Client.From("profiles").Select("id,full_name,email,phone,profile_photo,organization_id,created_at,updated_at", "", false).Eq("id", claims.Subject).ExecuteToWithContext(r.Context(), &rows); e != nil || len(rows) != 1 {
		utils.Fail(w, 404, "Profile not found.", "not found")
		return
	}
	utils.Success(w, 200, "Profile retrieved", rows[0])
}
func (h *slaughterhouseHandler) traceability(w http.ResponseWriter, r *http.Request) {
	tag := strings.TrimSpace(r.URL.Query().Get("tag"))
	if tag == "" {
		utils.Fail(w, 422, "A tag is required.", "missing tag")
		return
	}
	org, err := h.organization(r)
	if err != nil {
		utils.Fail(w, 403, "You do not have access to this slaughterhouse.", err.Error())
		return
	}
	result, err := h.traceService.Traceability(r.Context(), tag)
	if err != nil {
		utils.Fail(w, 404, "Record not found.", "tag not found")
		return
	}
	reception, ok := result["reception"].(map[string]interface{})
	if !ok || reception["slaughterhouse_id"] != org {
		utils.Fail(w, 404, "Record not found.", "tag not found")
		return
	}
	utils.Success(w, 200, "Traceability retrieved", result)
}
func unavailableSlaughterhouse(feature string) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		utils.Fail(w, 501, "Feature unavailable.", feature+" is not backed by a verified API contract")
	}
}

var _ = strings.TrimSpace
