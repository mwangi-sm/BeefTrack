package middleware

import (
	"log"
	"net/http"
	"runtime/debug"

	"backend/internal/utils"
)

// Recovery catches panics in any handler so one bad request can't take
// down the whole server, and never leaks a stack trace to the client.
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("panic recovered: %v\n%s", err, debug.Stack())
				utils.Fail(w, http.StatusInternalServerError, "Something went wrong.", "internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}
