package database

import (
	"fmt"
	"os"

	supabase "github.com/supabase-community/supabase-go"
)

type DB struct {
	Client *supabase.Client
}

func (db *DB) CreateOrganization(organization *Organization) any {
	panic("unimplemented")
}

func (db *DB) CreateAnimal(animal *Animal) any {
	panic("unimplemented")
}

func (db *DB) GetAnimalByTag(tag string) (any, any) {
	panic("unimplemented")
}

func NewDB() (*DB, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY")

	if supabaseURL == "" || supabaseKey == "" {
		return nil, fmt.Errorf("SUPABASE_URL or SUPABASE_KEY environment variables are missing")
	}

	client, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize supabase client: %w", err)
	}

	return &DB{Client: client}, nil
}
