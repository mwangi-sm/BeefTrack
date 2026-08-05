package utils

import (
	"encoding/json"
	"net/http"
)

// Response is the standard envelope every BeefTrace API endpoint returns.
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// Success writes a JSON response with the standard success envelope.
func Success(w http.ResponseWriter, status int, message string, data interface{}) {
	writeJSON(w, status, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Fail writes a JSON response with the standard failure envelope. `detail`
// must be a safe, user-facing description — never a raw SQL error, stack
// trace, or anything that leaks internal implementation.
func Fail(w http.ResponseWriter, status int, message string, detail string) {
	writeJSON(w, status, Response{
		Success: false,
		Message: message,
		Error:   detail,
	})
}

func writeJSON(w http.ResponseWriter, status int, payload Response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	// If encoding fails there's nothing more we can safely tell the
	// client — status and headers are already written at this point.
	_ = json.NewEncoder(w).Encode(payload)
}
