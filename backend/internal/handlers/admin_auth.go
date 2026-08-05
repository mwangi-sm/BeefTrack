package handlers

import (
	"net/http"

	"backend/internal/utils"
)

// AdminAuthHandler retains legacy endpoint paths while authentication is moved
// to the React client and Supabase Auth.
type AdminAuthHandler struct{}

func NewAdminAuthHandler() *AdminAuthHandler {
	return &AdminAuthHandler{}
}

// Login no longer accepts credentials or issues tokens. The React client must
// call Supabase Auth directly and send its access token to protected APIs.
func (h *AdminAuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	utils.Fail(w, http.StatusGone, "This login endpoint has been retired.", "sign in with Supabase Auth in the client and send the access token as a bearer token")
}

// Logout retains the route contract but does not own the Supabase session.
// The React client must call supabase.auth.signOut().
func (h *AdminAuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	utils.Success(w, http.StatusOK, "Sign out with Supabase Auth in the client.", nil)
}

// RefreshToken no longer accepts or creates local sessions. The React client
// should let the Supabase client refresh its session.
func (h *AdminAuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	utils.Fail(w, http.StatusGone, "This refresh endpoint has been retired.", "refresh the session with Supabase Auth in the client")
}
