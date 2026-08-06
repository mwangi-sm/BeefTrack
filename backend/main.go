package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/routes"
	"backend/internal/utils"
)

// Helper to write safe, formatted JSON responses
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Invalid configuration: %v", err)
	}
	verifier, err := utils.NewJWKSVerifier(cfg.SupabaseJWKSURL, cfg.SupabaseIssuer)
	if err != nil {
		log.Fatalf("Unable to configure Supabase JWT verification: %v", err)
	}

	fmt.Println("Starting BeefTrace Backend...")

	// 2. Initialize the ONE Supabase client for the whole backend
	db, err := database.NewDB(cfg)
	if err != nil {
		fmt.Println("Notice:", err, "— database writes will be mocked.")
		db = nil
	} else {
		fmt.Println("Connected to Supabase successfully!")
	}

	mux := http.NewServeMux()

	// Register admin routes
	routes.AdminRoutes(mux, verifier)

	// --- Health Check ---
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]string{
			"status":  "OK",
			"message": "Server is healthy and running",
		})
	})

	// --- Real Database Endpoint: Create Animal ---
	mux.HandleFunc("POST /api/animals", func(w http.ResponseWriter, r *http.Request) {
		var animal database.Animal
		if err := json.NewDecoder(r.Body).Decode(&animal); err != nil {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
			return
		}

		if db != nil {
			if err := db.CreateAnimal(&animal); err != nil {
				respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
				return
			}
		}

		respondJSON(w, http.StatusCreated, map[string]string{
			"status":  "OK",
			"message": "Animal registered successfully!",
		})
	})

	// --- Real Database Endpoint: Create Organization ---
	mux.HandleFunc("POST /api/organizations", func(w http.ResponseWriter, r *http.Request) {
		var org database.Organization
		if err := json.NewDecoder(r.Body).Decode(&org); err != nil {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
			return
		}

		if db != nil {
			if err := db.CreateOrganization(&org); err != nil {
				respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
				return
			}
		}

		respondJSON(w, http.StatusCreated, map[string]string{
			"status":  "OK",
			"message": "Organization created successfully!",
		})
	})

	// --- Existing Placeholders (Auth & Comments) ---
	mux.HandleFunc("POST /signup", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusCreated, map[string]string{"status": "OK", "message": "User signed up successfully"})
	})
	mux.HandleFunc("POST /login", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]string{"status": "OK", "message": "User logged in successfully"})
	})
	mux.HandleFunc("POST /comment", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusCreated, map[string]string{"status": "OK", "message": "Comment created successfully"})
	})
	mux.HandleFunc("GET /comments", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]string{"status": "OK", "message": "Retrieved all comments successfully"})
	})
	mux.HandleFunc("GET /comment/{id}", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]string{"status": "OK", "message": "Retrieved comment by ID successfully"})
	})
	mux.HandleFunc("PUT /comment/{id}", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]string{"status": "OK", "message": "Updated comment by ID successfully"})
	})
	mux.HandleFunc("DELETE /comment/{id}", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]string{"status": "OK", "message": "Deleted comment by ID successfully"})
	})

	fmt.Printf("Server running on http://localhost:%s\n", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, mux); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
