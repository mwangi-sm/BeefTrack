package database

import (
	"encoding/json"
	"fmt"
)

// FarmerProfile matches your Supabase table schema
type FarmerProfile struct {
	ID       string `json:"id,omitempty"`
	FullName string `json:"full_name"`
	Phone    string `json:"phone_number"`
	County   string `json:"county"`
}

// CreateFarmer inserts a record into Supabase
func (db *DB) CreateFarmer(farmer FarmerProfile) error {
	_, _, err := db.Client.From("farmer_profiles").Insert(farmer, false, "", "", "").Execute()
	if err != nil {
		return fmt.Errorf("failed to insert farmer: %w", err)
	}
	return nil
}

// GetFarmers fetches records from Supabase
func (db *DB) GetFarmers() ([]FarmerProfile, error) {
	data, _, err := db.Client.From("farmer_profiles").Select("*", "", false).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch farmers: %w", err)
	}

	var farmers []FarmerProfile
	if err := json.Unmarshal(data, &farmers); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return farmers, nil
}
