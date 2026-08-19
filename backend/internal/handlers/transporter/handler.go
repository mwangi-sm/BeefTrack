package transporter

import (
	repo "backend/internal/repositories/transporter"
	svc "backend/internal/services/transporter"
	"backend/internal/types"
	"backend/internal/utils"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
)

type Handler struct{ service *svc.Service }

func New(s *svc.Service) *Handler { return &Handler{s} }
func actor(r *http.Request) (string, bool) {
	c, ok := types.AuthClaimsFromContext(r.Context())
	if !ok {
		return "", false
	}
	return c.Subject, true
}
func paging(r *http.Request) (int, int) {
	p, _ := strconv.Atoi(r.URL.Query().Get("page"))
	z, _ := strconv.Atoi(r.URL.Query().Get("pageSize"))
	return p, z
}
func fail(w http.ResponseWriter, e error) {
	if errors.Is(e, repo.ErrUnsupportedIssue) {
		utils.Fail(w, 501, "Issue reporting is unavailable because no verified issue-persistence column exists.", e.Error())
		return
	}
	if errors.Is(e, repo.ErrUnsupportedSchema) {
		utils.Fail(w, 501, "This operation is unavailable until the remaining live transporter column contract is supplied.", e.Error())
		return
	}
	if errors.Is(e, repo.ErrNotFound) {
		utils.Fail(w, 404, "The requested record was not found.", "not found")
		return
	}
	if e.Error() == "invalid status transition" {
		utils.Fail(w, 409, "This action conflicts with the current record state.", e.Error())
		return
	}
	if e.Error() == "invalid status" || e.Error() == "issue note is required" {
		utils.Fail(w, 422, "Some information is invalid. Please review and try again.", e.Error())
		return
	}
	utils.Fail(w, 500, "The BeefTrace service could not complete the request.", "service unavailable")
}
func (h *Handler) Deliveries(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	p, z := paging(r)
	v, t, e := h.service.Deliveries(r.Context(), a, r.URL.Query().Get("status"), p, z)
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Deliveries retrieved", map[string]interface{}{"items": v, "total": t})
}
func (h *Handler) History(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	p, z := paging(r)
	v, t, e := h.service.History(r.Context(), a, p, z)
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Delivery history retrieved", map[string]interface{}{"items": v, "total": t})
}
func (h *Handler) Delivery(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	v, e := h.service.Delivery(r.Context(), a, r.PathValue("id"))
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Delivery retrieved", v)
}
func (h *Handler) Accept(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	v, e := h.service.Accept(r.Context(), a, r.PathValue("id"))
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Delivery accepted", v)
}
func (h *Handler) Start(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	v, e := h.service.Start(r.Context(), a, r.PathValue("id"))
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Trip started", v)
}
func (h *Handler) Issue(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	var b struct {
		Note string `json:"note"`
	}
	if json.NewDecoder(r.Body).Decode(&b) != nil {
		utils.Fail(w, 400, "Invalid request.", "invalid JSON")
		return
	}
	v, e := h.service.Issue(r.Context(), a, r.PathValue("id"), b.Note)
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Issue reported", v)
}
func (h *Handler) ActiveTrip(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	v, e := h.service.ActiveTrip(r.Context(), a)
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Active trip retrieved", v)
}
func (h *Handler) TripStatus(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	var b struct {
		Status string `json:"status"`
	}
	if json.NewDecoder(r.Body).Decode(&b) != nil {
		utils.Fail(w, 400, "Invalid request.", "invalid JSON")
		return
	}
	v, e := h.service.TripStatus(r.Context(), a, b.Status)
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Trip updated", v)
}
func (h *Handler) Notifications(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	p, z := paging(r)
	v, t, e := h.service.Notifications(r.Context(), a, p, z)
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Notifications retrieved", map[string]interface{}{"items": v, "total": t})
}
func (h *Handler) ReadNotification(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	if e := h.service.ReadNotification(r.Context(), a, r.PathValue("id")); e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Notification marked read", nil)
}
func (h *Handler) Profile(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	v, e := h.service.Profile(r.Context(), a)
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Profile retrieved", v)
}
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	a, _ := actor(r)
	var b map[string]interface{}
	if json.NewDecoder(r.Body).Decode(&b) != nil {
		utils.Fail(w, 400, "Invalid request.", "invalid JSON")
		return
	}
	v, e := h.service.UpdateProfile(r.Context(), a, b)
	if e != nil {
		fail(w, e)
		return
	}
	utils.Success(w, 200, "Profile updated", v)
}
