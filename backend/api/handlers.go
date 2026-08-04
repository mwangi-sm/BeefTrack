package api

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/database"
)

// Server holds dependencies like the database connection
type Server struct {
	DB *database.DB
}

// NewServer initializes a new Server instance
func NewServer(db *database.DB) *Server {
	return &Server{DB: db}
}

// HealthCheck verifies the API server is alive
func (s *Server) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "message": "BeefTrace API is running"})
}

// CreateOrganizationHandler handles POST /api/organizations
func (s *Server) CreateOrganizationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var org database.Organization
	if err := json.NewDecoder(r.Body).Decode(&org); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if err := s.DB.CreateOrganization(&org); err != nil {
		http.Error(w, "Failed to create organization", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(org)
}

// CreateAnimalHandler handles POST /api/animals
func (s *Server) CreateAnimalHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var animal database.Animal
	if err := json.NewDecoder(r.Body).Decode(&animal); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if err := s.DB.CreateAnimal(&animal); err != nil {
		http.Error(w, "Failed to register animal", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(animal)
}

// GetAnimalHandler handles GET /api/animals?tag=XYZ123
func (s *Server) GetAnimalHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	tag := r.URL.Query().Get("tag")
	if tag == "" {
		http.Error(w, "Missing tag parameter", http.StatusBadRequest)
		return
	}

	animal, err := s.DB.GetAnimalByTag(tag)
	if err != nil {
		http.Error(w, "Animal not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(animal)
}

// ProcessingRecord tracks processing and cutting details (Processor Dashboard)
type ProcessingRecord struct {
	ID          int64     `json:"id"`
	CarcassID   int64     `json:"carcass_id"`
	ProcessorID int64     `json:"processor_id"`
	CutType     string    `json:"cut_type"`
	Weight      float64   `json:"weight"`
	PackageDate string    `json:"package_date"`
	CreatedAt   time.Time `json:"created_at"`
}
