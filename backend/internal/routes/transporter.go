package routes

import (
	"net/http"

	"backend/internal/database"
	transporterhandlers "backend/internal/handlers/transporter"
	"backend/internal/middleware"
	transporterrepo "backend/internal/repositories/transporter"
	transporterservice "backend/internal/services/transporter"
	"backend/internal/utils"
)

// TransporterRoutes contains only endpoints backed by the current Supabase
// schema. Authentication and role enforcement are deliberately applied before
// every handler; ownership checks are additionally performed by the repository.
func TransporterRoutes(mux *http.ServeMux, verifier *utils.JWKSVerifier, db *database.DB) {
	h := transporterhandlers.New(transporterservice.New(transporterrepo.New(db)))
	require := func(next http.Handler) http.Handler {
		return middleware.RequireAuth(verifier)(middleware.RequireRole("transporter")(next))
	}
	mux.Handle("GET /api/transporter/deliveries", require(http.HandlerFunc(h.Deliveries)))
	mux.Handle("GET /api/transporter/deliveries/history", require(http.HandlerFunc(h.History)))
	mux.Handle("GET /api/transporter/deliveries/{id}", require(http.HandlerFunc(h.Delivery)))
	mux.Handle("POST /api/transporter/deliveries/{id}/accept", require(http.HandlerFunc(h.Accept)))
	mux.Handle("POST /api/transporter/deliveries/{id}/start", require(http.HandlerFunc(h.Start)))
	mux.Handle("POST /api/transporter/deliveries/{id}/issue", require(http.HandlerFunc(h.Issue)))
	// Movement endpoints are the canonical transporter workflow.  Legacy
	// delivery/trip routes remain mounted for consumers that have not migrated.
	mux.Handle("GET /api/transporter/movements", require(http.HandlerFunc(h.Movements)))
	mux.Handle("GET /api/transporter/movements/active", require(http.HandlerFunc(h.ActiveMovement)))
	mux.Handle("GET /api/transporter/movements/history", require(http.HandlerFunc(h.MovementHistory)))
	mux.Handle("GET /api/transporter/movements/{id}", require(http.HandlerFunc(h.Movement)))
	mux.Handle("POST /api/transporter/movements/{id}/accept", require(http.HandlerFunc(h.AcceptMovement)))
	mux.Handle("POST /api/transporter/movements/{id}/start", require(http.HandlerFunc(h.StartMovement)))
	mux.Handle("POST /api/transporter/movements/{id}/tracking", require(http.HandlerFunc(h.AddTracking)))
	mux.Handle("POST /api/transporter/movements/{id}/deliver", require(http.HandlerFunc(h.DeliverMovement)))
	mux.Handle("GET /api/transporter/trip/active", require(http.HandlerFunc(h.ActiveTrip)))
	mux.Handle("PATCH /api/transporter/trip/status", require(http.HandlerFunc(h.TripStatus)))
	mux.Handle("GET /api/transporter/notifications", require(http.HandlerFunc(h.Notifications)))
	mux.Handle("POST /api/transporter/notifications/{id}/read", require(http.HandlerFunc(h.ReadNotification)))
	mux.Handle("GET /api/transporter/profile", require(http.HandlerFunc(h.Profile)))
	mux.Handle("PATCH /api/transporter/profile", require(http.HandlerFunc(h.UpdateProfile)))
}
