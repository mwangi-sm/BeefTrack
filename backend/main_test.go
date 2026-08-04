package main

import (
	"bytes"
	"io"
	"net/http"
	"testing"
)

func TestCreateOrganizationAndAnimal(t *testing.T) {
	baseURL := "http://localhost:8080"

	// 1. Test POST /api/organizations
	orgJSON := []byte(`{
		"name": "Green Valley Farm",
		"type": "farm",
		"location": "Nakuru"
	}`)

	resp, err := http.Post(baseURL+"/api/organizations", "application/json", bytes.NewBuffer(orgJSON))
	if err != nil {
		t.Fatalf("Failed to send POST request: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Create Org Response (%d): %s", resp.StatusCode, string(body))

	if resp.StatusCode != http.StatusCreated {
		t.Errorf("Expected status 201 Created, got %d", resp.StatusCode)
	}

	// 2. Test POST /api/animals
	animalJSON := []byte(`{
		"tag_number": "KE-BEEF-001",
		"breed": "Boran",
		"sex": "M",
		"date_of_birth": "2024-03-15",
		"status": "alive",
		"current_owner": 1
	}`)

	resp, err = http.Post(baseURL+"/api/animals", "application/json", bytes.NewBuffer(animalJSON))
	if err != nil {
		t.Fatalf("Failed to register animal: %v", err)
	}
	defer resp.Body.Close()

	body, _ = io.ReadAll(resp.Body)
	t.Logf("Create Animal Response (%d): %s", resp.StatusCode, string(body))

	// 3. Test GET /api/animals?tag=KE-BEEF-001
	resp, err = http.Get(baseURL + "/api/animals?tag=KE-BEEF-001")
	if err != nil {
		t.Fatalf("Failed to fetch animal: %v", err)
	}
	defer resp.Body.Close()

	body, _ = io.ReadAll(resp.Body)
	t.Logf("Get Animal Response (%d): %s", resp.StatusCode, string(body))
}
