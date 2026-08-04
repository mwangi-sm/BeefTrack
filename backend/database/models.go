package database

import "time"

// Organization represents farms, slaughterhouses, markets, retailers, etc.
type Organization struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Location  string    `json:"location"`
	CreatedAt time.Time `json:"created_at"`
}

// Animal represents an individual cattle tracked in the system
type Animal struct {
	ID           int64     `json:"id"`
	TagNumber    string    `json:"tag_number"`
	Breed        string    `json:"breed,omitempty"`
	Sex          string    `json:"sex,omitempty"`
	DateOfBirth  string    `json:"date_of_birth,omitempty"`
	Status       string    `json:"status"`
	CurrentOwner int64     `json:"current_owner,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// AnimalEvent logs key events in an animal's lifecycle
type AnimalEvent struct {
	ID        int64     `json:"id"`
	AnimalID  int64     `json:"animal_id"`
	EventType string    `json:"event_type"`
	EventDate time.Time `json:"event_date"`
	FromOrg   *int64    `json:"from_org,omitempty"`
	ToOrg     *int64    `json:"to_org,omitempty"`
	Location  string    `json:"location,omitempty"`
	Notes     string    `json:"notes,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// TransportTrip tracks cattle movement between locations
type TransportTrip struct {
	ID                  int64      `json:"id"`
	AnimalID            int64      `json:"animal_id"`
	VehicleRegistration string     `json:"vehicle_registration"`
	DriverName          string     `json:"driver_name"`
	Origin              string     `json:"origin"`
	Destination         string     `json:"destination"`
	DepartureTime       *time.Time `json:"departure_time,omitempty"`
	ArrivalTime         *time.Time `json:"arrival_time,omitempty"`
}

// SlaughterRecord records when and where an animal was processed
type SlaughterRecord struct {
	ID               int64     `json:"id"`
	AnimalID         int64     `json:"animal_id"`
	SlaughterhouseID int64     `json:"slaughterhouse_id"`
	CarcassID        string    `json:"carcass_id"`
	SlaughterDate    time.Time `json:"slaughter_date"`
}

// ProductBatch links consumer-facing QR/batch codes to the slaughter record
type ProductBatch struct {
	ID          int64     `json:"id"`
	CarcassID   string    `json:"carcass_id"`
	BatchCode   string    `json:"batch_code"`
	ProductName string    `json:"product_name"`
	ProducedAt  time.Time `json:"produced_at"`
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
