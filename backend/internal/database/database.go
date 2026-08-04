package database

import (
	"encoding/json"
	"fmt"
	"os"

	supabase "github.com/supabase-community/supabase-go"
)

// Animal and Organization types live in models.go — don't redeclare them here.

type DB struct {
	Client *supabase.Client
}

// NewDB builds the ONE Supabase client the whole backend should use.
// Do not construct supabase.Client anywhere else — pass this *DB around instead.
func NewDB() (*DB, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_ANON_KEY")

	if supabaseURL == "" || supabaseKey == "" {
		return nil, fmt.Errorf("SUPABASE_URL or SUPABASE_ANON_KEY environment variables are missing")
	}

	client, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize supabase client: %w", err)
	}

	return &DB{Client: client}, nil
}

func (db *DB) CreateOrganization(org *Organization) error {
	_, _, err := db.Client.From("organizations").Insert(org, false, "", "", "").Execute()
	if err != nil {
		return fmt.Errorf("failed to create organization: %w", err)
	}
	return nil
}

func (db *DB) CreateAnimal(animal *Animal) error {
	_, _, err := db.Client.From("animals").Insert(animal, false, "", "", "").Execute()
	if err != nil {
		return fmt.Errorf("failed to create animal: %w", err)
	}
	return nil
}

func (db *DB) GetAnimalByTag(tag string) (*Animal, error) {
	data, _, err := db.Client.From("animals").
		Select("*", "", false).
		Eq("tag_number", tag).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch animal: %w", err)
	}

	var animals []Animal
	if err := json.Unmarshal(data, &animals); err != nil {
		return nil, fmt.Errorf("failed to parse animal data: %w", err)
	}
	if len(animals) == 0 {
		return nil, fmt.Errorf("animal with tag %s not found", tag)
	}

	return &animals[0], nil
}