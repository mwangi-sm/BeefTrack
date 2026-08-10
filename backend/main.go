package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/routes"
	"backend/internal/utils"

	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
)

// Helper to write safe, formatted JSON responses
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// Farmer represents a registered farmer
type Farmer struct {
	ID               string `json:"id,omitempty"`
	Gender           string `json:"gender,omitempty"`
	DateOfBirth      string `json:"date_of_birth,omitempty"`
	NationalIDNumber string `json:"national_id_number,omitempty"`
	FarmRegNo        string `json:"farm_reg_no,omitempty"`
	IDPhotoURL       string `json:"id_photo_url,omitempty"`
	FarmerIDPhotoURL string `json:"farmer_id_photo_url,omitempty"`
	FarmerPhotoURL   string `json:"farmer_photo_url,omitempty"`
	Country          string `json:"country,omitempty"`
	County           string `json:"county,omitempty"`
	SubCounty        string `json:"sub_county,omitempty"`
	Ward             string `json:"ward,omitempty"`
	VillageEstate    string `json:"village_estate,omitempty"`
	GPSLocation      string `json:"gps_location,omitempty"`
	CreatedAt        string `json:"created_at,omitempty"`
}

func main() {
	// 1. Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Println("Notice: No .env file found, relying on environment variables")
	}

	// 2. Load configuration from transporter_dashboard
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Invalid configuration: %v", err)
	}

	// 3. Initialize JWT Verifier
	verifier, err := utils.NewJWKSVerifier(cfg.SupabaseJWKSURL, cfg.SupabaseIssuer)
	if err != nil {
		log.Fatalf("Unable to configure Supabase JWT verification: %v", err)
	}

	fmt.Println("Starting BeefTrace Backend...")

	// 4. Initialize Supabase client (from main branch logic) for legacy endpoints
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY")

	var supabaseClient *supabase.Client
	if supabaseURL != "" && supabaseKey != "" {
		client, clientErr := supabase.NewClient(supabaseURL, supabaseKey, nil)
		if clientErr == nil {
			supabaseClient = client
		} else {
			log.Printf("Notice: Failed to initialize Supabase client: %v\n", clientErr)
		}
	} else {
		fmt.Println("Notice: SUPABASE_URL or SUPABASE_KEY not found in environment.")
	}

	// 5. Initialize structured DB client (from transporter_dashboard)
	db, err := database.NewDB(cfg)
	if err != nil {
		fmt.Println("Notice:", err, "— database writes will be mocked.")
		db = nil
	} else {
		fmt.Println("Connected to Supabase structured database successfully!")
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

	// ==========================================
	// FARMERS API ENDPOINTS
	// ==========================================

	// GET /api/farmers - Fetch all farmers
	mux.HandleFunc("GET /api/farmers", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		
		if supabaseClient == nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		// Query the farmers table: SELECT * FROM farmers
		data, _, err := supabaseClient.From("farmers").Select("*", "exact", false).Execute()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, `{"error":"Failed to fetch farmers: %s"}`, err.Error())
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write(data)
	})

	// POST /api/farmers - Insert a new farmer
	mux.HandleFunc("POST /api/farmers", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var farmer Farmer
		if err := json.NewDecoder(r.Body).Decode(&farmer); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"Invalid request payload"}`))
			return
		}

		if supabaseClient != nil {
			// Insert the farmer into the database
			_, _, err := supabaseClient.From("farmers").Insert(farmer, false, "", "", "").Execute()
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, `{"error":"Failed to save farmer: %s"}`, err.Error())
				return
			}
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"status":"OK","message":"Farmer registered successfully!"}`))
	})

	// ==========================================
	// OTHER API ENDPOINTS
	// ==========================================

	// POST /api/animals
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

	// POST /api/organizations
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

	// --- Auth & Comments ---
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