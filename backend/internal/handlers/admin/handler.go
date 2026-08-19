package admin

import (
	repo "backend/internal/repositories/admin"
	svc "backend/internal/services/admin"
	"backend/internal/types"
	"backend/internal/utils"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
)

type Handler struct{ service *svc.Service }

func New(s *svc.Service) *Handler { return &Handler{s} }
func actor(r *http.Request) (string, bool) {
	c, ok := types.AuthClaimsFromContext(r.Context())
	return c.Subject, ok
}
func fail(w http.ResponseWriter, err error) {
	if errors.Is(err, errNotFound) || errors.Is(err, repo.ErrNotFound) {
		utils.Fail(w, 404, "Resource not found.", "not found")
		return
	}
	switch err.Error() {
	case "invalid request", "invalid status", "invalid organization status", "invalid entity type", "invalid notification id", "rejection reason is required":
		utils.Fail(w, 400, "Invalid request.", err.Error())
	default:
		utils.Fail(w, 409, "Operation could not be completed.", err.Error())
	}
}

var errNotFound = errors.New("not found")

func (h *Handler) Users(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	size, _ := strconv.Atoi(q.Get("pageSize"))
	v, total, e := h.service.Users(r.Context(), q.Get("role"), q.Get("status"), q.Get("search"), page, size)
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Users retrieved", paged(v, page, size, total))
}
func (h *Handler) UserStatus(w http.ResponseWriter, r *http.Request) {
	var p struct {
		Status string `json:"status"`
	}
	if json.NewDecoder(r.Body).Decode(&p) != nil {
		utils.Fail(w, 400, "Invalid request.", "invalid JSON")
		return
	}
	a, _ := actor(r)
	if e := h.service.UserStatus(r.Context(), r.PathValue("id"), p.Status, a); e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "User status updated", nil)
}
func (h *Handler) Organizations(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	size, _ := strconv.Atoi(q.Get("pageSize"))
	v, total, e := h.service.Organizations(r.Context(), q.Get("type"), q.Get("status"), q.Get("search"), page, size)
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Organizations retrieved", paged(v, page, size, total))
}
func (h *Handler) OrganizationStatus(w http.ResponseWriter, r *http.Request) {
	var p struct {
		Status string `json:"status"`
	}
	if json.NewDecoder(r.Body).Decode(&p) != nil {
		utils.Fail(w, 400, "Invalid request.", "invalid JSON")
		return
	}
	a, _ := actor(r)
	if e := h.service.OrganizationStatus(r.Context(), r.PathValue("id"), p.Status, a); e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Organization status updated", nil)
}
func (h *Handler) VerifyOrganization(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	if e := h.service.VerifyOrganization(r.Context(), r.PathValue("id"), a); e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Organization verified", nil)
}
func (h *Handler) SlaughterhouseStatus(w http.ResponseWriter, r *http.Request) {
	var p struct {
		Status string `json:"status"`
	}
	if json.NewDecoder(r.Body).Decode(&p) != nil {
		utils.Fail(w, 400, "Invalid request.", "invalid JSON")
		return
	}
	a, _ := actor(r)
	if e := h.service.SlaughterhouseStatus(r.Context(), r.PathValue("id"), p.Status, a); e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Slaughterhouse status updated", nil)
}
func (h *Handler) VerifySlaughterhouse(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	if e := h.service.VerifySlaughterhouse(r.Context(), r.PathValue("id"), a); e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Slaughterhouse verified", nil)
}
func (h *Handler) Approvals(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	size, _ := strconv.Atoi(q.Get("pageSize"))
	v, total, e := h.service.Approvals(r.Context(), q.Get("status"), q.Get("entityType"), page, size)
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Approvals retrieved", paged(v, page, size, total))
}
func (h *Handler) Approve(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	if e := h.service.Review(r.Context(), r.PathValue("id"), a, "approved", ""); e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Approval approved", nil)
}
func (h *Handler) Reject(w http.ResponseWriter, r *http.Request) {
	var p struct {
		Reason string `json:"reason"`
	}
	if json.NewDecoder(r.Body).Decode(&p) != nil {
		utils.Fail(w, 400, "Invalid request.", "invalid JSON")
		return
	}
	a, _ := actor(r)
	if e := h.service.Review(r.Context(), r.PathValue("id"), a, "rejected", strings.TrimSpace(p.Reason)); e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Approval rejected", nil)
}
func (h *Handler) Review(w http.ResponseWriter, r *http.Request) {
	var p struct {
		Status string `json:"status"`
		Reason string `json:"reason"`
	}
	if json.NewDecoder(r.Body).Decode(&p) != nil {
		utils.Fail(w, 400, "Invalid request.", "invalid JSON")
		return
	}
	a, _ := actor(r)
	if e := h.service.Review(r.Context(), r.PathValue("id"), a, p.Status, strings.TrimSpace(p.Reason)); e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Approval reviewed", nil)
}
func (h *Handler) Notifications(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	size, _ := strconv.Atoi(q.Get("pageSize"))
	v, total, e := h.service.Notifications(r.Context(), a, q.Get("unreadOnly") == "true", page, size)
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Notifications retrieved", paged(v, page, size, total))
}
func (h *Handler) ReadNotification(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	if e := h.service.ReadNotification(r.Context(), r.PathValue("id"), a); e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Notification marked read", nil)
}
func (h *Handler) ReadAllNotifications(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	if e := h.service.ReadAll(r.Context(), a); e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Notifications marked read", nil)
}
func (h *Handler) AuditLogs(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	size, _ := strconv.Atoi(q.Get("pageSize"))
	items, total, e := h.service.AuditLogs(r.Context(), q.Get("actor"), q.Get("search"), q.Get("from"), q.Get("to"), page, size)
	if e != nil {
		fail(w, e)
		return
	}
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 25
	}
	utils.Success(w, 200, "Audit logs retrieved", map[string]interface{}{"items": items, "page": page, "pageSize": size, "total": total})
}
func (h *Handler) Traceability(w http.ResponseWriter, r *http.Request) {
	v, e := h.service.Traceability(r.Context(), r.URL.Query().Get("tag"))
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, http.StatusOK, "Slaughterhouse traceability retrieved", v)
}
func paged(items interface{}, page, size int, total int64) map[string]interface{} {
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 25
	}
	return map[string]interface{}{"items": items, "page": page, "pageSize": size, "total": total}
}
func Unavailable(feature string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		utils.Fail(w, http.StatusNotImplemented, "Feature unavailable.", feature+" is not backed by a verified schema object")
	}
}
