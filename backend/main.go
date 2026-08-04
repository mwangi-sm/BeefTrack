package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/supabase-community/supabase-go"
)

// Data models matching your database tables
type Animal struct {
	TagNumber string `json:"tag_number"`
	Breed     string `json:"breed"`
	BirthDate string `json:"birth_date"`
}

type Organization struct {
	Name     string `json:"name"`
	Location string `json:"location"`
}

func main() {
	fmt.Println("Starting BeefTrace Backend...")

	// 1. Initialize Supabase Client
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY")

	var supabaseClient *supabase.Client
	var err error

	if supabaseURL != "" && supabaseKey != "" {
		supabaseClient, err = supabase.NewClient(supabaseURL, supabaseKey, nil)
		if err != nil {
			fmt.Println("Warning: Failed to initialize Supabase client:", err)
		} else {
			fmt.Println("Connected to Supabase successfully!")
		}
	} else {
		fmt.Println("Notice: SUPABASE_URL or SUPABASE_KEY not found in environment. Database writes will be mocked.")
	}

	mux := http.NewServeMux()

	// --- Health Check ---
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"OK","message":"Server is healthy and running"}`))
	})

	// --- Real Database Endpoint: Create Animal ---
	mux.HandleFunc("POST /api/animals", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var animal Animal
		if err := json.NewDecoder(r.Body).Decode(&animal); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"Invalid request payload"}`))
			return
		}

		if supabaseClient != nil {
			_, _, err := supabaseClient.From("animals").Insert(animal, false, "", "", "").Execute()
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, `{"error":"Failed to save animal: %s"}`, err.Error())
				return
			}
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"status":"OK","message":"Animal registered successfully!"}`))
	})

	// --- Real Database Endpoint: Create Organization ---
	mux.HandleFunc("POST /api/organizations", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var org Organization
		if err := json.NewDecoder(r.Body).Decode(&org); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"Invalid request payload"}`))
			return
		}

		if supabaseClient != nil {
			_, _, err := supabaseClient.From("organizations").Insert(org, false, "", "", "").Execute()
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, `{"error":"Failed to save organization: %s"}`, err.Error())
				return
			}
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"status":"OK","message":"Organization created successfully!"}`))
	})

	// --- Existing Placeholders (Auth & Comments) ---
	mux.HandleFunc("POST /signup", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"status":"OK","message":"User signed up successfully"}`))
	})
	mux.HandleFunc("POST /login", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"OK","message":"User logged in successfully"}`))
	})
	mux.HandleFunc("POST /comment", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"status":"OK","message":"Comment created successfully"}`))
	})
	mux.HandleFunc("GET /comments", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"OK","message":"Retrieved all comments successfully"}`))
	})
	mux.HandleFunc("GET /comment/{id}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"OK","message":"Retrieved comment by ID successfully"}`))
	})
	mux.HandleFunc("PUT /comment/{id}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"OK","message":"Updated comment by ID successfully"}`))
	})
	mux.HandleFunc("DELETE /comment/{id}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"OK","message":"Deleted comment by ID successfully"}`))
	})

	fmt.Println("Server running on http://localhost:8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
