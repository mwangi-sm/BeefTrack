package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"backend/internal/config"
	"backend/internal/database"
	appmiddleware "backend/internal/middleware"
	"backend/internal/routes"
	"backend/internal/utils"

	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
)

// ==========================================
// DATA MODELS
// ==========================================

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

type Farm struct {
	ID                       string   `json:"id,omitempty"`
	FarmerID                 string   `json:"farmer_id,omitempty"`
	FarmName                 string   `json:"farm_name,omitempty"`
	OwnershipType            string   `json:"ownership_type,omitempty"`
	FarmSizeAcres            float64  `json:"farm_size_acres,omitempty"`
	WaterSource              []string `json:"water_source,omitempty"`
	FeedSources              []string `json:"feed_sources,omitempty"`
	FarmingPractices         string   `json:"farming_practices,omitempty"`
	WorkersCount             int      `json:"workers_count,omitempty"`
	VetServiceProviderName   string   `json:"vet_service_provider_name,omitempty"`
	VetServiceProviderNumber string   `json:"vet_service_provider_number,omitempty"`
	FarmPhotosUrls           []string `json:"farm_photos_urls,omitempty"`
	LeaseDocumentUrl         string   `json:"lease_document_url,omitempty"`
	TitleDeedUrl             string   `json:"title_deed_url,omitempty"`
	CreatedAt                string   `json:"created_at,omitempty"`
}

type Animal struct {
	ID             string `json:"id,omitempty"`
	FarmID         string `json:"farm_id,omitempty"`
	EnrollmentType string `json:"enrollment_type,omitempty"`
	OriginType     string `json:"origin_type,omitempty"`
	AnimalID       string `json:"animal_id,omitempty"`
	RfidTagNumber  string `json:"rfid_tag_number,omitempty"`
	Dob            string `json:"dob,omitempty"`
	Gender         string `json:"gender,omitempty"`
	Breed          string `json:"breed,omitempty"`
	BirthFarm      string `json:"birth_farm,omitempty"`
	CurrentFarm    string `json:"current_farm,omitempty"`
	DateAcquired   string `json:"date_acquired,omitempty"`
	AlternativeID  string `json:"alternative_id,omitempty"`
	CreatedAt      string `json:"created_at,omitempty"`
}

type HealthRecord struct {
	ID                  string  `json:"id,omitempty"`
	AnimalID            string  `json:"animal_id,omitempty"`
	CurrentWeightKg     float64 `json:"current_weight_kg,omitempty"`
	WeightRecordedDate  string  `json:"weight_recorded_date,omitempty"`
	CurrentHealthStatus string  `json:"current_health_status,omitempty"`
	VaccineName         string  `json:"vaccine_name,omitempty"`
	VaccinationDate     string  `json:"vaccination_date,omitempty"`
	Notes               string  `json:"notes,omitempty"`
	CreatedAt           string  `json:"created_at,omitempty"`
}

type VetVisit struct {
	ID                        string `json:"id,omitempty"`
	AnimalID                  string `json:"animal_id,omitempty"`
	DiseaseExperienced        string `json:"disease_experienced,omitempty"`
	TreatmentGiven            string `json:"treatment_given,omitempty"`
	VetDoctorName             string `json:"vet_doctor_name,omitempty"`
	VetDoctorID               string `json:"vet_doctor_id,omitempty"`
	VisitDate                 string `json:"visit_date,omitempty"`
	BeefTraceID               string `json:"beef_trace_id,omitempty"`
	DiseaseTestResultsUrl     string `json:"disease_test_results_url,omitempty"`
	IsPurchased               bool   `json:"is_purchased,omitempty"`
	PreviousOwnerName         string `json:"previous_owner_name,omitempty"`
	PreviousOwnerFarmerID     string `json:"previous_owner_farmer_id,omitempty"`
	PreviousOwnerFarmLocation string `json:"previous_owner_farm_location,omitempty"`
	CreatedAt                 string `json:"created_at,omitempty"`
}

type Retailer struct {
	ID                                 string `json:"id,omitempty"`
	ShopName                           string `json:"shop_name,omitempty"`
	TradingLicenseNumber               string `json:"trading_license_number,omitempty"`
	County                             string `json:"county,omitempty"`
	PhoneNumber                        string `json:"phone_number,omitempty"`
	ShopAddress                        string `json:"shop_address,omitempty"`
	FirstName                          string `json:"first_name,omitempty"`
	LastName                           string `json:"last_name,omitempty"`
	Email                              string `json:"email,omitempty"`
	TradingLicenseUrl                  string `json:"trading_license_url,omitempty"`
	KraPinCertificateUrl               string `json:"kra_pin_certificate_url,omitempty"`
	BusinessRegistrationCertificateUrl string `json:"business_registration_certificate_url,omitempty"`
	OwnerContactIdUrl                  string `json:"owner_contact_id_url,omitempty"`
	PublicHealthLicenseUrl             string `json:"public_health_license_url,omitempty"`
	StoreCategory                      string `json:"store_category,omitempty"`
	OperatingHours                     string `json:"operating_hours,omitempty"`
	StaffVerificationToolsCount        int    `json:"staff_verification_tools_count,omitempty"`
	PaymentMethod                      string `json:"payment_method,omitempty"`
	PaymentIdentifier                  string `json:"payment_identifier,omitempty"`
	CreatedAt                          string `json:"created_at,omitempty"`
}

type RetailerIncomingBatch struct {
	ID                 string `json:"id,omitempty"`
	RetailerID         string `json:"retailer_id,omitempty"`
	UniqueNo           string `json:"unique_no,omitempty"`
	AmountOfPacks      int    `json:"amount_of_packs,omitempty"`
	DistributorNo      string `json:"distributor_no,omitempty"`
	VerificationStatus string `json:"verification_status,omitempty"`
	ReceivedDate       string `json:"received_date,omitempty"`
}

type Transporter struct {
	ID                                string `json:"id,omitempty"`
	FullName                          string `json:"full_name,omitempty"`
	Email                             string `json:"email,omitempty"`
	PhoneNumber                       string `json:"phone_number,omitempty"`
	AccountType                       string `json:"account_type,omitempty"`
	ProfilePhotoUrl                   string `json:"profile_photo_url,omitempty"`
	NationalID                        string `json:"national_id,omitempty"`
	DriversLicenceNo                  string `json:"drivers_licence_no,omitempty"`
	LicenceExpiryDate                 string `json:"licence_expiry_date,omitempty"`
	RegistrationNumber                string `json:"registration_number,omitempty"`
	VehicleType                       string `json:"vehicle_type,omitempty"`
	Capacity                          string `json:"capacity,omitempty"`
	RefrigerationAvailable            bool   `json:"refrigeration_available,omitempty"`
	IdPassportUrl                     string `json:"id_passport_url,omitempty"`
	DriversLicenceUrl                 string `json:"drivers_licence_url,omitempty"`
	VehicleInsuranceCertUrl           string `json:"vehicle_insurance_cert_url,omitempty"`
	TransportPermitUrl                string `json:"transport_permit_url,omitempty"`
	PassportPhotosUrl                 string `json:"passport_photos_url,omitempty"`
	CompanyRegistrationCertificateUrl string `json:"company_registration_certificate_url,omitempty"`
	CreatedAt                         string `json:"created_at,omitempty"`
}

type Distributor struct {
	ID                            string  `json:"id,omitempty"`
	CompanyLogoUrl                string  `json:"company_logo_url,omitempty"`
	DistributorName               string  `json:"distributor_name,omitempty"`
	BusinessRegistrationNumber    string  `json:"business_registration_number,omitempty"`
	KraPin                        string  `json:"kra_pin,omitempty"`
	LicenseNumber                 string  `json:"license_number,omitempty"`
	YearsInOperation              int     `json:"years_in_operation,omitempty"`
	CompanyDescription            string  `json:"company_description,omitempty"`
	Industry                      string  `json:"industry,omitempty"`
	WebsiteLinks                  string  `json:"website_links,omitempty"`
	EmailAddress                  string  `json:"email_address,omitempty"`
	PhoneNumber                   string  `json:"phone_number,omitempty"`
	AlternativePhone              string  `json:"alternative_phone,omitempty"`
	ContactFullName               string  `json:"contact_full_name,omitempty"`
	ContactJobTitle               string  `json:"contact_job_title,omitempty"`
	ContactEmail                  string  `json:"contact_email,omitempty"`
	ContactPhone                  string  `json:"contact_phone,omitempty"`
	ContactNationalID             string  `json:"contact_national_id,omitempty"`
	ContactEmployeeNumber         string  `json:"contact_employee_number,omitempty"`
	WarehouseName                 string  `json:"warehouse_name,omitempty"`
	WarehouseCode                 string  `json:"warehouse_code,omitempty"`
	WarehouseType                 string  `json:"warehouse_type,omitempty"`
	WarehouseCapacityTons         float64 `json:"warehouse_capacity_tons,omitempty"`
	CurrentStorageCapacityPct     float64 `json:"current_storage_capacity_pct,omitempty"`
	WarehouseAddress              string  `json:"warehouse_address,omitempty"`
	County                        string  `json:"county,omitempty"`
	SubCounty                     string  `json:"sub_county,omitempty"`
	Town                          string  `json:"town,omitempty"`
	PostalAddress                 string  `json:"postal_address,omitempty"`
	GoogleMapsLocation            string  `json:"google_maps_location,omitempty"`
	Latitude                      float64 `json:"latitude,omitempty"`
	Longitude                     float64 `json:"longitude,omitempty"`
	StorageType                   string  `json:"storage_type,omitempty"`
	TempMonitoringEnabled         bool    `json:"temp_monitoring_enabled,omitempty"`
	MinTemp                       float64 `json:"min_temp,omitempty"`
	MaxTemp                       float64 `json:"max_temp,omitempty"`
	BarcodeScannerEnabled         bool    `json:"barcode_scanner_enabled,omitempty"`
	QrCodeScannerEnabled          bool    `json:"qr_code_scanner_enabled,omitempty"`
	FifoTrackingEnabled           bool    `json:"fifo_tracking_enabled,omitempty"`
	FefoTrackingEnabled           bool    `json:"fefo_tracking_enabled,omitempty"`
	CapacityAlertsEnabled         bool    `json:"capacity_alerts_enabled,omitempty"`
	LowStockAlertsEnabled         bool    `json:"low_stock_alerts_enabled,omitempty"`
	ExpiringProductsAlertsEnabled bool    `json:"expiring_products_alerts_enabled,omitempty"`
	DispatchAlertsEnabled         bool    `json:"dispatch_alerts_enabled,omitempty"`
	DeliveryRadius                string  `json:"delivery_radius,omitempty"`
	VehiclesManaged               int     `json:"vehicles_managed,omitempty"`
	AverageDailyDispatches        int     `json:"average_daily_dispatches,omitempty"`
	PreferredDeliveryTime         string  `json:"preferred_delivery_time,omitempty"`
	BusinessRegDocUrl             string  `json:"business_reg_doc_url,omitempty"`
	BusinessPermitUrl             string  `json:"business_permit_url,omitempty"`
	KraCertUrl                    string  `json:"kra_cert_url,omitempty"`
	FoodHandlingCertificateUrl    string  `json:"food_handling_certificate_url,omitempty"`
	WarehouseLicenseUrl           string  `json:"warehouse_license_url,omitempty"`
	InsuranceCertificateUrl       string  `json:"insurance_certificate_url,omitempty"`
	CreatedAt                     string  `json:"created_at,omitempty"`
}

type DistributorShipment struct {
	ID            string `json:"id,omitempty"`
	DistributorID string `json:"distributor_id,omitempty"`
	ShipmentID    string `json:"shipment_id,omitempty"`
	ShipmentTime  string `json:"shipment_time,omitempty"`
	Packs         int    `json:"packs,omitempty"`
	CutType       string `json:"cut_type,omitempty"`
	SourceOrigin  string `json:"source_origin,omitempty"`
	ShipmentDate  string `json:"shipment_date,omitempty"`
	Status        string `json:"status,omitempty"`
}

// Helper to write safe, formatted JSON responses
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
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
		fmt.Println("Notice: SUPABASE_URL or SUPABASE_KEY not found in environment. Database writes will fail or be mocked.")
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
	routes.AdminRoutes(mux, verifier, db)

	// --- Health Check ---
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]string{
			"status":  "OK",
			"message": "Server is healthy and running",
		})
	})

	// ==========================================
	// 1. FARMERS API ENDPOINTS
	// ==========================================

	// GET /api/farmers - Fetch all farmers
	mux.HandleFunc("GET /api/farmers", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if supabaseClient == nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

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
	// 2. FARMS API ENDPOINTS
	// ==========================================

	mux.HandleFunc("GET /api/farms", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if supabaseClient == nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		data, _, err := supabaseClient.From("farms").Select("*", "exact", false).Execute()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, `{"error":"Failed to fetch farms: %s"}`, err.Error())
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write(data)
	})

	mux.HandleFunc("POST /api/farms", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var farm Farm
		if err := json.NewDecoder(r.Body).Decode(&farm); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"Invalid request payload"}`))
			return
		}

		if supabaseClient != nil {
			_, _, err := supabaseClient.From("farms").Insert(farm, false, "", "", "").Execute()
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, `{"error":"Failed to save farm: %s"}`, err.Error())
				return
			}
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"status":"OK","message":"Farm registered successfully!"}`))
	})

	// ==========================================
	// 3. ANIMALS API ENDPOINTS
	// ==========================================

	mux.HandleFunc("GET /api/animals", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if supabaseClient == nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		data, _, err := supabaseClient.From("animals").Select("*", "exact", false).Execute()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, `{"error":"Failed to fetch animals: %s"}`, err.Error())
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write(data)
	})

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
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		respondJSON(w, http.StatusCreated, map[string]string{
			"status":  "OK",
			"message": "Animal registered successfully!",
		})
	})

	// ==========================================
	// 4. HEALTH RECORDS API ENDPOINTS
	// ==========================================

	mux.HandleFunc("GET /api/health-records", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if supabaseClient == nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		data, _, err := supabaseClient.From("health_records").Select("*", "exact", false).Execute()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, `{"error":"Failed to fetch health records: %s"}`, err.Error())
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write(data)
	})

	mux.HandleFunc("POST /api/health-records", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var healthRecord HealthRecord
		if err := json.NewDecoder(r.Body).Decode(&healthRecord); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"Invalid request payload"}`))
			return
		}

		if supabaseClient != nil {
			_, _, err := supabaseClient.From("health_records").Insert(healthRecord, false, "", "", "").Execute()
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, `{"error":"Failed to save health record: %s"}`, err.Error())
				return
			}
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"status":"OK","message":"Health record registered successfully!"}`))
	})

	// ==========================================
	// 5. VET VISITS API ENDPOINTS
	// ==========================================

	mux.HandleFunc("GET /api/vet-visits", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if supabaseClient == nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		data, _, err := supabaseClient.From("vet_visits").Select("*", "exact", false).Execute()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, `{"error":"Failed to fetch vet visits: %s"}`, err.Error())
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write(data)
	})

	mux.HandleFunc("POST /api/vet-visits", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var vetVisit VetVisit
		if err := json.NewDecoder(r.Body).Decode(&vetVisit); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"Invalid request payload"}`))
			return
		}

		if supabaseClient != nil {
			_, _, err := supabaseClient.From("vet_visits").Insert(vetVisit, false, "", "", "").Execute()
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, `{"error":"Failed to save vet visit: %s"}`, err.Error())
				return
			}
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"status":"OK","message":"Vet visit registered successfully!"}`))
	})

	// ==========================================
	// 6. RETAILERS API ENDPOINTS
	// ==========================================

	mux.HandleFunc("GET /api/retailers", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if supabaseClient == nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		data, _, err := supabaseClient.From("retailers").Select("*", "exact", false).Execute()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, `{"error":"Failed to fetch retailers: %s"}`, err.Error())
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write(data)
	})

	mux.HandleFunc("POST /api/retailers", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var retailer Retailer
		if err := json.NewDecoder(r.Body).Decode(&retailer); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"Invalid request payload"}`))
			return
		}

		if supabaseClient != nil {
			_, _, err := supabaseClient.From("retailers").Insert(retailer, false, "", "", "").Execute()
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, `{"error":"Failed to save retailer: %s"}`, err.Error())
				return
			}
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"status":"OK","message":"Retailer registered successfully!"}`))
	})

	// ==========================================
	// 7. RETAILER INCOMING BATCHES API ENDPOINTS
	// ==========================================

	mux.HandleFunc("GET /api/retailer-batches", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if supabaseClient == nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		data, _, err := supabaseClient.From("retailer_incoming_batches").Select("*", "exact", false).Execute()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, `{"error":"Failed to fetch retailer batches: %s"}`, err.Error())
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write(data)
	})

	mux.HandleFunc("POST /api/retailer-batches", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var batch RetailerIncomingBatch
		if err := json.NewDecoder(r.Body).Decode(&batch); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error":"Invalid request payload"}`))
			return
		}

		if supabaseClient != nil {
			_, _, err := supabaseClient.From("retailer_incoming_batches").Insert(batch, false, "", "", "").Execute()
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, `{"error":"Failed to save retailer batch: %s"}`, err.Error())
				return
			}
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"Database connection not initialized"}`))
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"status":"OK","message":"Retailer batch registered successfully!"}`))
	})

	handler := appmiddleware.CORS(cfg.AllowedOrigins)(mux)

	port := cfg.Port

	log.Printf("Server listening on port %s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
