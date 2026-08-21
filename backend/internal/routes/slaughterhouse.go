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
	"log"
	"github.com/google/uuid"
	"net/http"
	"strings"
	"time"
)


func SlaughterhouseRoutes(mux *http.ServeMux, verifier *utils.JWKSVerifier, db *database.DB) {
	require := func(h http.Handler) http.Handler {
		return middleware.RequireAuth(verifier)(middleware.RequireRole("slaughterhouse")(h))
	}
	h := &slaughterhouseHandler{db: db, traceService: adminservice.New(adminrepo.New(db))}
	mux.Handle("GET /api/slaughterhouse/reception", require(http.HandlerFunc(h.receptions)))
	mux.Handle("POST /api/slaughterhouse/reception", require(http.HandlerFunc(h.receptions)))
	mux.Handle("PATCH /api/slaughterhouse/reception/{tag}/status", require(http.HandlerFunc(h.receptionStatus)))
	mux.Handle("GET /api/slaughterhouse/inspection", require(http.HandlerFunc(h.inspections)))
	mux.Handle("POST /api/slaughterhouse/inspection", require(http.HandlerFunc(h.inspections)))
	mux.Handle("PATCH /api/slaughterhouse/inspection/{id}/outcome", require(http.HandlerFunc(h.inspectionOutcome)))
	mux.Handle("GET /api/slaughterhouse/slaughter", require(http.HandlerFunc(h.operations)))
	mux.Handle("POST /api/slaughterhouse/slaughter", require(http.HandlerFunc(h.operations)))
	mux.Handle("PATCH /api/slaughterhouse/slaughter/{id}/stage", require(http.HandlerFunc(h.operationStage)))
	mux.Handle("GET /api/slaughterhouse/carcasses", require(http.HandlerFunc(h.carcasses)))
	mux.Handle("POST /api/slaughterhouse/carcasses", require(http.HandlerFunc(h.carcasses)))
	mux.Handle("GET /api/slaughterhouse/carcass-inspections", require(http.HandlerFunc(h.carcassInspections)))
	mux.Handle("POST /api/slaughterhouse/carcass-inspections", require(http.HandlerFunc(h.carcassInspections)))
	mux.Handle("GET /api/slaughterhouse/shipments", require(http.HandlerFunc(h.shipments)))
	mux.Handle("POST /api/slaughterhouse/shipments", require(http.HandlerFunc(h.shipments)))
	mux.Handle("PATCH /api/slaughterhouse/shipments/{id}/status", require(http.HandlerFunc(h.shipmentStatus)))
	mux.Handle("GET /api/slaughterhouse/notifications", require(http.HandlerFunc(h.notifications)))
	mux.Handle("PATCH /api/slaughterhouse/notifications/{id}/read", require(http.HandlerFunc(h.readNotification)))
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
	var officers []struct {
		OrganizationID string `json:"organization_id"`
	}
	if _, err := h.db.Client.From("slaughterhouse_officers").Select("organization_id", "", false).Eq("profile_id", claims.Subject).ExecuteToWithContext(r.Context(), &officers); err != nil {
		log.Printf("slaughterhouse.organization: %s %s db query failed for profile=%s: %v", r.Method, r.URL.Path, claims.Subject, err)
		return "", err
	}
	if len(officers) != 1 || officers[0].OrganizationID == "" {
		log.Printf("slaughterhouse.organization: profile=%s officers_found=%d", claims.Subject, len(officers))
		return "", fmt.Errorf("slaughterhouse organization is not assigned")
	}
	var orgs []struct {
		ID string `json:"id"`
	}
	if _, err := h.db.Client.From("organizations").Select("id", "", false).Eq("id", officers[0].OrganizationID).Eq("organization_type", "slaughterhouse").Eq("status", "approved").ExecuteToWithContext(r.Context(), &orgs); err != nil {
		log.Printf("slaughterhouse.organization: %s %s org lookup failed org_id=%s: %v", r.Method, r.URL.Path, officers[0].OrganizationID, err)
		return "", err
	}
	if len(orgs) != 1 {
		log.Printf("slaughterhouse.organization: profile=%s org_id=%s approved_found=%d", claims.Subject, officers[0].OrganizationID, len(orgs))
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
		if !allowCreateFields(table, v) {
			utils.Fail(w, 400, "Invalid request.", "payload contains unsupported fields")
			return
		}
		switch table {
		case "animal_receptions":
			v["status"] = "pending"
		case "ante_mortem_inspections":
			v["outcome"] = "pending"
		case "slaughter_operations":
			v["stage"] = "waiting"
			delete(v, "started_at")
			delete(v, "completed_at")
		case "slaughterhouse_shipments":
			v["status"] = "scheduled"
		case "carcass_inspections":
			outcome, _ := v["outcome"].(string)
			if !map[string]bool{"passed": true, "conditionally_passed": true, "condemned": true}[outcome] {
				utils.Fail(w, 422, "Invalid carcass inspection outcome.", "outcome must be passed, conditionally_passed, or condemned")
				return
			}
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
		if err := h.validateCreate(r, org, table, v); err != nil {
			utils.Fail(w, 409, "Workflow requirement not met.", err.Error())
			return
		}
		if table == "ante_mortem_inspections" || table == "slaughter_operations" {
			v["id"] = uuid.NewString()
		}
		data, _, err := h.db.Client.From(table).Insert(v, false, "representation", "", "").ExecuteWithContext(r.Context())
		if err != nil {
			utils.Fail(w, 422, "Unable to save record.", "database rejected this record")
			return
		}
		var created []map[string]interface{}
		if json.Unmarshal(data, &created) != nil || len(created) != 1 {
			utils.Fail(w, 500, "Unable to read created record.", "database returned an invalid create response")
			return
		}
		utils.Success(w, 201, "Record created", created[0])
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
func allowCreateFields(table string, v map[string]interface{}) bool {
	allowed := map[string]map[string]bool{
		"animal_receptions":        {"tag_id": true, "farmer": true, "transporter": true, "vehicle_number": true, "number_of_animals": true, "condition": true, "injuries": true, "arrival_date": true, "arrival_time": true, "breed": true, "weight": true, "batch": true, "status": true},
		"ante_mortem_inspections":  {"animal_id": true, "vet": true, "batch": true, "health_check": true, "body_condition": true, "signs_of_disease": true, "temperature": true, "notes": true, "outcome": true},
		"slaughter_operations":     {"animal_id": true, "batch": true, "staff": true, "method": true, "facility": true, "remarks": true, "stage": true, "started_at": true, "completed_at": true},
		"carcasses":                {"id": true, "animal_id": true, "weight": true, "grade": true, "quality": true, "inspection_result": true, "storage": true},
		"carcass_inspections":      {"carcass_id": true, "tag_id": true, "inspector": true, "outcome": true, "reason": true, "comments": true},
		"slaughterhouse_shipments": {"id": true, "carcass_id": true, "destination": true, "processor": true, "driver": true, "vehicle": true, "departure": true, "status": true},
	}
	for key := range v {
		if !allowed[table][key] {
			return false
		}
	}
	return true
}
func (h *slaughterhouseHandler) validateCreate(r *http.Request, org, table string, v map[string]interface{}) error {
	stringValue := func(key string) string { value, _ := v[key].(string); return strings.TrimSpace(value) }
	if table == "slaughter_operations" {
		var rows []struct {
			Outcome string `json:"outcome"`
		}
		_, err := h.db.Client.From("ante_mortem_inspections").Select("outcome", "", false).Eq("animal_id", stringValue("animal_id")).Eq("outcome", "approved").ExecuteToWithContext(r.Context(), &rows)
		if err != nil || len(rows) == 0 {
			return fmt.Errorf("an approved ante-mortem inspection is required")
		}
	}
	if table == "carcasses" {
		var rows []struct {
			ID string `json:"id"`
		}
		_, err := h.db.Client.From("slaughter_operations").Select("id", "", false).Eq("animal_id", stringValue("animal_id")).Eq("stage", "completed").ExecuteToWithContext(r.Context(), &rows)
		if err != nil || len(rows) == 0 {
			return fmt.Errorf("a completed slaughter operation is required")
		}
	}
	if table == "carcass_inspections" {
		var rows []struct {
			AnimalID string `json:"animal_id"`
		}
		_, err := h.db.Client.From("carcasses").Select("animal_id", "", false).Eq("id", stringValue("carcass_id")).ExecuteToWithContext(r.Context(), &rows)
		if err != nil || len(rows) != 1 || rows[0].AnimalID != stringValue("tag_id") || !containsTag(mustTags(h, r, org), rows[0].AnimalID) {
			return fmt.Errorf("carcass is not available to this slaughterhouse")
		}
	}
	if table == "slaughterhouse_shipments" {
		var inspections []struct {
			Outcome string `json:"outcome"`
		}
		_, err := h.db.Client.From("carcass_inspections").Select("outcome", "", false).Eq("carcass_id", stringValue("carcass_id")).In("outcome", []string{"passed", "conditionally_passed"}).ExecuteToWithContext(r.Context(), &inspections)
		if err != nil || len(inspections) != 1 {
			return fmt.Errorf("a passed or conditionally passed carcass inspection is required")
		}
	}
	return nil
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
func statusPayload(r *http.Request, field string, allowed map[string]bool) (string, bool) {
	v, ok := decodeMap(r)
	if !ok {
		return "", false
	}
	value, _ := v[field].(string)
	value = strings.TrimSpace(value)
	return value, allowed[value]
}
func (h *slaughterhouseHandler) receptionStatus(w http.ResponseWriter, r *http.Request) {
	org, err := h.organization(r)
	if err != nil {
		utils.Fail(w, 403, "You do not have access to this slaughterhouse.", err.Error())
		return
	}
	status, ok := statusPayload(r, "status", map[string]bool{"accepted": true, "rejected": true})
	if !ok {
		utils.Fail(w, 422, "Invalid reception status.", "status must be accepted or rejected")
		return
	}
	tag := strings.TrimSpace(r.PathValue("tag"))
	var rows []struct {
		Status string `json:"status"`
	}
	if _, err := h.db.Client.From("animal_receptions").Select("status", "", false).Eq("tag_id", tag).Eq("slaughterhouse_id", org).ExecuteToWithContext(r.Context(), &rows); err != nil {
		utils.Fail(w, 500, "Unable to validate reception.", "database query failed")
		return
	}
	if len(rows) != 1 {
		utils.Fail(w, 404, "Reception not found.", "not available to this slaughterhouse")
		return
	}
	if rows[0].Status != "pending" {
		utils.Fail(w, 409, "Reception has already been decided.", "invalid reception transition")
		return
	}
	if _, _, err := h.db.Client.From("animal_receptions").Update(map[string]interface{}{"status": status}, "representation", "").Eq("tag_id", tag).Eq("slaughterhouse_id", org).ExecuteWithContext(r.Context()); err != nil {
		utils.Fail(w, 422, "Unable to update reception.", "database rejected this reception update")
		return
	}
	utils.Success(w, 200, "Reception updated", nil)
}
func (h *slaughterhouseHandler) inspectionOutcome(w http.ResponseWriter, r *http.Request) {
	org, err := h.organization(r)
	if err != nil {
		utils.Fail(w, 403, "You do not have access to this slaughterhouse.", err.Error())
		return
	}
	outcome, ok := statusPayload(r, "outcome", map[string]bool{"approved": true, "rejected": true})
	if !ok {
		utils.Fail(w, 422, "Invalid inspection outcome.", "outcome must be approved or rejected")
		return
	}
	id := strings.TrimSpace(r.PathValue("id"))
	var inspections []struct {
		AnimalID string `json:"animal_id"`
		Outcome  string `json:"outcome"`
	}
	if _, err := h.db.Client.From("ante_mortem_inspections").Select("animal_id,outcome", "", false).Eq("id", id).ExecuteToWithContext(r.Context(), &inspections); err != nil {
		utils.Fail(w, 500, "Unable to validate inspection.", "database query failed")
		return
	}
	if len(inspections) != 1 || !containsTag(mustTags(h, r, org), inspections[0].AnimalID) {
		utils.Fail(w, 404, "Inspection not found.", "not available to this slaughterhouse")
		return
	}
	if inspections[0].Outcome != "pending" {
		utils.Fail(w, 409, "Inspection has already been decided.", "invalid inspection transition")
		return
	}
	if _, _, err := h.db.Client.From("ante_mortem_inspections").Update(map[string]interface{}{"outcome": outcome}, "representation", "").Eq("id", id).ExecuteWithContext(r.Context()); err != nil {
		utils.Fail(w, 422, "Unable to update inspection.", "database rejected this inspection update")
		return
	}
	utils.Success(w, 200, "Inspection updated", nil)
}
func mustTags(h *slaughterhouseHandler, r *http.Request, org string) []string {
	tags, _ := h.scopedTags(r, org)
	return tags
}
func (h *slaughterhouseHandler) operationStage(w http.ResponseWriter, r *http.Request) {
	org, err := h.organization(r)
	if err != nil {
		utils.Fail(w, 403, "You do not have access to this slaughterhouse.", err.Error())
		return
	}
	stage, ok := statusPayload(r, "stage", map[string]bool{"in_progress": true, "completed": true})
	if !ok {
		utils.Fail(w, 422, "Invalid slaughter stage.", "stage must be in_progress or completed")
		return
	}
	id := strings.TrimSpace(r.PathValue("id"))
	var rows []struct {
		AnimalID string `json:"animal_id"`
		Stage    string `json:"stage"`
	}
	if _, err := h.db.Client.From("slaughter_operations").Select("animal_id,stage", "", false).Eq("id", id).ExecuteToWithContext(r.Context(), &rows); err != nil {
		utils.Fail(w, 500, "Unable to validate slaughter operation.", "database query failed")
		return
	}
	if len(rows) != 1 || !containsTag(mustTags(h, r, org), rows[0].AnimalID) {
		utils.Fail(w, 404, "Slaughter operation not found.", "not available to this slaughterhouse")
		return
	}
	if (rows[0].Stage != "waiting" && stage == "in_progress") || (rows[0].Stage != "in_progress" && stage == "completed") {
		utils.Fail(w, 409, "Invalid slaughter transition.", "invalid slaughter stage transition")
		return
	}
	update := map[string]interface{}{"stage": stage}
	if stage == "in_progress" {
		update["started_at"] = time.Now().UTC()
	}
	if stage == "completed" {
		update["completed_at"] = time.Now().UTC()
	}
	if _, _, err := h.db.Client.From("slaughter_operations").Update(update, "representation", "").Eq("id", id).ExecuteWithContext(r.Context()); err != nil {
		utils.Fail(w, 422, "Unable to update slaughter operation.", "database rejected this slaughter update")
		return
	}
	utils.Success(w, 200, "Slaughter operation updated", nil)
}
func (h *slaughterhouseHandler) shipmentStatus(w http.ResponseWriter, r *http.Request) {
	org, err := h.organization(r)
	if err != nil {
		utils.Fail(w, 403, "You do not have access to this slaughterhouse.", err.Error())
		return
	}
	status, ok := statusPayload(r, "status", map[string]bool{"in_transit": true, "delivered": true, "delayed": true})
	if !ok {
		utils.Fail(w, 422, "Invalid shipment status.", "status must be in_transit, delivered, or delayed")
		return
	}
	id := strings.TrimSpace(r.PathValue("id"))
	var rows []struct {
		Status string `json:"status"`
	}
	if _, err := h.db.Client.From("slaughterhouse_shipments").Select("status", "", false).Eq("id", id).Eq("slaughterhouse_id", org).ExecuteToWithContext(r.Context(), &rows); err != nil {
		utils.Fail(w, 500, "Unable to validate shipment.", "database query failed")
		return
	}
	if len(rows) != 1 {
		utils.Fail(w, 404, "Shipment not found.", "not available to this slaughterhouse")
		return
	}
	if (rows[0].Status != "scheduled" && status == "in_transit") || (rows[0].Status != "in_transit" && status == "delivered") || rows[0].Status == "delivered" {
		utils.Fail(w, 409, "Invalid shipment transition.", "invalid shipment status transition")
		return
	}
	if _, _, err := h.db.Client.From("slaughterhouse_shipments").Update(map[string]interface{}{"status": status}, "representation", "").Eq("id", id).Eq("slaughterhouse_id", org).ExecuteWithContext(r.Context()); err != nil {
		utils.Fail(w, 422, "Unable to update shipment.", "database rejected this shipment update")
		return
	}
	utils.Success(w, 200, "Shipment updated", nil)
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
func (h *slaughterhouseHandler) readNotification(w http.ResponseWriter, r *http.Request) {
	claims, _ := types.AuthClaimsFromContext(r.Context())
	id := strings.TrimSpace(r.PathValue("id"))
	if id == "" {
		utils.Fail(w, 422, "A notification ID is required.", "missing notification id")
		return
	}
	var existing []struct {
		ID string `json:"id"`
	}
	if _, err := h.db.Client.From("admin_notifications").Select("id", "", false).Eq("id", id).Eq("recipient_id", claims.Subject).ExecuteToWithContext(r.Context(), &existing); err != nil {
		utils.Fail(w, 500, "Unable to validate notification.", "database query failed")
		return
	}
	if len(existing) != 1 {
		utils.Fail(w, 404, "Notification not found.", "notification is not available to this user")
		return
	}
	if _, _, err := h.db.Client.From("admin_notifications").Update(map[string]interface{}{"read": true}, "representation", "").Eq("id", id).Eq("recipient_id", claims.Subject).ExecuteWithContext(r.Context()); err != nil {
		utils.Fail(w, 422, "Unable to update notification.", "database rejected this notification update")
		return
	}
	utils.Success(w, 200, "Notification marked read", nil)
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
