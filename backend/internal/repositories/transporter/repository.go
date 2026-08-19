package transporter

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"backend/internal/database"
)

var (
	ErrNotFound          = fmt.Errorf("not found")
	ErrUnsupportedSchema = fmt.Errorf("operation requires transporter columns not supplied by the live schema contract")
	ErrUnsupportedIssue  = fmt.Errorf("issue persistence is unavailable: no verified issue column was supplied")
)

type Repository struct{ db *database.DB }

func New(db *database.DB) *Repository { return &Repository{db: db} }
func (r *Repository) ready() error {
	if r == nil || r.db == nil || r.db.Client == nil {
		return fmt.Errorf("database unavailable")
	}
	return nil
}

// Delivery is the compatibility view of pickup_assignments. ID is bigint and TripID is UUID.
type Delivery struct {
	ID         int64  `json:"id"`
	TripID     string `json:"tripId"`
	Status     string `json:"status"`
	AssignedAt string `json:"assignedAt,omitempty"`
	PickupTime string `json:"pickupTime,omitempty"`
}

// Trip is backed by trip_tracking. Both ID fields are bigint; TripID is UUID.
type Trip struct {
	ID           int64  `json:"id"`
	AssignmentID int64  `json:"assignmentId"`
	TripID       string `json:"tripId"`
	Status       string `json:"status"`
}
type Notification struct {
	ID     string `json:"id"`
	Text   string `json:"text"`
	Type   string `json:"type"`
	Time   string `json:"time"`
	Unread bool   `json:"unread"`
}

type Profile struct {
	ID                  string  `json:"id"`
	TransporterID       string  `json:"transporterId"`
	FullName            string  `json:"fullName"`
	Email               string  `json:"email"`
	Phone               string  `json:"phone"`
	ProfilePhoto        string  `json:"photo"`
	AccountStatus       string  `json:"accountStatus"`
	VerificationStatus  string  `json:"verificationStatus"`
	TransporterType     string  `json:"transporterType"`
	NationalID          string  `json:"nationalId"`
	LicenseNumber       string  `json:"licenseNumber"`
	CompanyName         string  `json:"companyName"`
	BusinessRegNumber   string  `json:"businessRegNumber"`
	VehicleRegistration string  `json:"vehicleRegistration"`
	VehicleType         string  `json:"vehicleType"`
	VehicleCapacity     float64 `json:"vehicleCapacity"`
	VehicleMake         string  `json:"vehicleMake"`
	VehicleModel        string  `json:"vehicleModel"`
}
type assignmentRow struct {
	ID         int64      `json:"id"`
	TripID     string     `json:"trip_id"`
	Status     string     `json:"status"`
	AssignedAt time.Time  `json:"assigned_at"`
	PickupTime *time.Time `json:"pickup_time"`
}

func decode(data []byte, out interface{}) error { return json.Unmarshal(data, out) }

// transporterID resolves auth subject (profiles.id), never treating it as transporters.id.
func (r *Repository) transporterID(ctx context.Context, profileID string) (string, error) {
	if err := r.ready(); err != nil {
		return "", err
	}
	var rows []struct {
		ID string `json:"id"`
	}
	data, _, err := r.db.Client.From("transporters").Select("id", "", false).Eq("profile_id", profileID).ExecuteWithContext(ctx)
	if err != nil {
		return "", err
	}
	if err = decode(data, &rows); err != nil {
		return "", err
	}
	if len(rows) == 0 {
		return "", ErrNotFound
	}
	return rows[0].ID, nil
}

func (r *Repository) hasRow(ctx context.Context, table, column, value string) (bool, error) {
	data, _, err := r.db.Client.From(table).Select(column, "", false).Eq(column, value).Range(0, 0, "").ExecuteWithContext(ctx)
	if err != nil {
		return false, err
	}
	var rows []map[string]interface{}
	if err = decode(data, &rows); err != nil {
		return false, err
	}
	return len(rows) > 0, nil
}

func (r *Repository) assignments(ctx context.Context, actor, status string, from, to int, id *int64) ([]assignmentRow, int64, error) {
	transporterID, err := r.transporterID(ctx, actor)
	if err != nil {
		return nil, 0, err
	}
	q := r.db.Client.From("pickup_assignments").Select("id,trip_id,status,assigned_at,pickup_time", "exact", false).Eq("transporter_id", transporterID)
	if status != "" {
		q = q.Eq("status", status)
	}
	if id != nil {
		q = q.Eq("id", strconv.FormatInt(*id, 10))
	}
	data, total, err := q.Order("assigned_at", nil).Range(from, to, "").ExecuteWithContext(ctx)
	if err != nil {
		return nil, 0, err
	}
	var rows []assignmentRow
	if err = decode(data, &rows); err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}
func asDeliveries(rows []assignmentRow) []Delivery {
	out := make([]Delivery, len(rows))
	for i, row := range rows {
		out[i] = Delivery{ID: row.ID, TripID: row.TripID, Status: row.Status, AssignedAt: row.AssignedAt.Format(time.RFC3339)}
		if row.PickupTime != nil {
			out[i].PickupTime = row.PickupTime.Format(time.RFC3339)
		}
	}
	return out
}
func (r *Repository) Deliveries(ctx context.Context, actor, status string, from, to int) ([]Delivery, int64, error) {
	rows, total, err := r.assignments(ctx, actor, status, from, to, nil)
	if err != nil {
		return nil, 0, err
	}
	return asDeliveries(rows), total, nil
}
func (r *Repository) Delivery(ctx context.Context, actor, id string) (Delivery, error) {
	assignmentID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return Delivery{}, ErrNotFound
	}
	rows, _, err := r.assignments(ctx, actor, "", 0, 0, &assignmentID)
	if err != nil {
		return Delivery{}, err
	}
	if len(rows) == 0 {
		return Delivery{}, ErrNotFound
	}
	return asDeliveries(rows)[0], nil
}
func (r *Repository) UpdateDelivery(ctx context.Context, actor, id, from string, values map[string]interface{}) (Delivery, error) {
	assignmentID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return Delivery{}, ErrNotFound
	}
	if _, err = r.Delivery(ctx, actor, id); err != nil {
		return Delivery{}, err
	}
	q := r.db.Client.From("pickup_assignments").Update(values, "representation", "").Eq("id", strconv.FormatInt(assignmentID, 10))
	if from != "" {
		q = q.Eq("status", from)
	}
	data, _, err := q.ExecuteWithContext(ctx)
	if err != nil {
		return Delivery{}, err
	}
	var rows []map[string]interface{}
	if decode(data, &rows) != nil || len(rows) == 0 {
		return Delivery{}, ErrNotFound
	}
	return r.Delivery(ctx, actor, id)
}

// History is defined by the existence of a delivery_records row. It does not
// infer completion from a legacy deliveries table or a guessed timestamp.
func (r *Repository) History(ctx context.Context, actor string, from, to int) ([]Delivery, int64, error) {
	transporterID, err := r.transporterID(ctx, actor)
	if err != nil {
		return nil, 0, err
	}
	var rows []struct {
		AssignmentID int64  `json:"assignment_id"`
		TripID       string `json:"trip_id"`
	}
	data, total, err := r.db.Client.From("delivery_records").Select("assignment_id,trip_id,pickup_assignments!inner(id,trip_id,transport_trips!inner(id,transporter_id))", "exact", false).Eq("pickup_assignments.transport_trips.transporter_id", transporterID).Range(from, to, "").ExecuteWithContext(ctx)
	if err != nil {
		return nil, 0, err
	}
	if err = decode(data, &rows); err != nil {
		return nil, 0, err
	}
	out := make([]Delivery, len(rows))
	for i, row := range rows {
		out[i] = Delivery{ID: row.AssignmentID, TripID: row.TripID, Status: "delivered"}
	}
	return out, total, nil
}

func (r *Repository) ActiveTrip(ctx context.Context, actor string) (*Trip, error) {
	transporterID, err := r.transporterID(ctx, actor)
	if err != nil {
		return nil, err
	}
	var rows []struct {
		ID           int64 `json:"id"`
		AssignmentID int64 `json:"assignment_id"`
		Assignment   struct {
			TripID string `json:"trip_id"`
			Status string `json:"status"`
		} `json:"pickup_assignments"`
	}
	data, _, err := r.db.Client.From("trip_tracking").Select("id,assignment_id,pickup_assignments!inner(trip_id,status,transport_trips!inner(id,transporter_id))", "", false).Eq("pickup_assignments.transport_trips.transporter_id", transporterID).Order("id", nil).ExecuteWithContext(ctx)
	if err != nil {
		return nil, err
	}
	if err = decode(data, &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	v := rows[0]
	return &Trip{ID: v.ID, AssignmentID: v.AssignmentID, TripID: v.Assignment.TripID, Status: v.Assignment.Status}, nil
}
func (r *Repository) UpdateTrip(ctx context.Context, actor, status string) (*Trip, error) {
	t, err := r.ActiveTrip(ctx, actor)
	if err != nil || t == nil {
		return t, err
	}
	if _, err = r.UpdateDelivery(ctx, actor, strconv.FormatInt(t.AssignmentID, 10), "", map[string]interface{}{"status": status}); err != nil {
		return nil, err
	}
	t.Status = status
	return t, nil
}

func (r *Repository) Notifications(ctx context.Context, actor string, from, to int) ([]Notification, int64, error) {
	if err := r.ready(); err != nil {
		return nil, 0, err
	}
	var rows []struct {
		ID        string    `json:"id"`
		Title     string    `json:"title"`
		Message   string    `json:"message"`
		Type      string    `json:"type"`
		Read      bool      `json:"read"`
		CreatedAt time.Time `json:"created_at"`
	}
	data, total, err := r.db.Client.From("admin_notifications").Select("id,title,message,type,read,created_at", "exact", false).Eq("recipient_id", actor).Order("created_at", nil).Range(from, to, "").ExecuteWithContext(ctx)
	if err != nil {
		return nil, 0, err
	}
	if err = decode(data, &rows); err != nil {
		return nil, 0, err
	}
	out := make([]Notification, len(rows))
	for i, v := range rows {
		out[i] = Notification{v.ID, v.Title + ": " + v.Message, v.Type, v.CreatedAt.Format(time.RFC3339), !v.Read}
	}
	return out, total, nil
}
func (r *Repository) ReadNotification(ctx context.Context, actor, id string) error {
	data, _, err := r.db.Client.From("admin_notifications").Update(map[string]interface{}{"read": true, "read_at": time.Now().UTC()}, "representation", "").Eq("id", id).Eq("recipient_id", actor).ExecuteWithContext(ctx)
	if err != nil {
		return err
	}
	var rows []map[string]interface{}
	if decode(data, &rows) != nil || len(rows) == 0 {
		return ErrNotFound
	}
	return nil
}
func (r *Repository) Profile(ctx context.Context, actor string) (Profile, error) {
	transporterID, err := r.transporterID(ctx, actor)
	if err != nil {
		return Profile{}, err
	}
	var profileRows []struct {
		FullName           string `json:"full_name"`
		Email              string `json:"email"`
		Phone              string `json:"phone"`
		ProfilePhoto       string `json:"profile_photo"`
		AccountStatus      string `json:"account_status"`
		VerificationStatus string `json:"verification_status"`
	}
	data, _, err := r.db.Client.From("profiles").Select("full_name,email,phone,profile_photo,account_status,verification_status", "", false).Eq("id", actor).ExecuteWithContext(ctx)
	if err != nil {
		return Profile{}, err
	}
	if err = decode(data, &profileRows); err != nil {
		return Profile{}, err
	}
	if len(profileRows) == 0 {
		return Profile{}, ErrNotFound
	}
	p := Profile{ID: actor, TransporterID: transporterID, FullName: profileRows[0].FullName, Email: profileRows[0].Email, Phone: profileRows[0].Phone, ProfilePhoto: profileRows[0].ProfilePhoto, AccountStatus: profileRows[0].AccountStatus, VerificationStatus: profileRows[0].VerificationStatus}
	var transporterRows []struct {
		Type string `json:"transporter_type"`
	}
	data, _, err = r.db.Client.From("transporters").Select("transporter_type", "", false).Eq("id", transporterID).ExecuteWithContext(ctx)
	if err != nil {
		return Profile{}, err
	}
	if err = decode(data, &transporterRows); err != nil {
		return Profile{}, err
	}
	if len(transporterRows) > 0 {
		p.TransporterType = transporterRows[0].Type
	}
	if p.TransporterType == "company" {
		var rows []struct {
			CompanyName        string `json:"company_name"`
			RegistrationNumber string `json:"registration_number"`
		}
		data, _, err = r.db.Client.From("company_transporters").Select("company_name,registration_number", "", false).Eq("transporter_id", transporterID).ExecuteWithContext(ctx)
		if err != nil {
			return Profile{}, err
		}
		if err = decode(data, &rows); err != nil {
			return Profile{}, err
		}
		if len(rows) > 0 {
			p.CompanyName, p.BusinessRegNumber = rows[0].CompanyName, rows[0].RegistrationNumber
		}
	} else {
		var rows []struct {
			NationalID string `json:"national_id"`
			License    string `json:"driving_license_no"`
		}
		data, _, err = r.db.Client.From("individual_transporters").Select("national_id,driving_license_no", "", false).Eq("transporter_id", transporterID).ExecuteWithContext(ctx)
		if err != nil {
			return Profile{}, err
		}
		if err = decode(data, &rows); err != nil {
			return Profile{}, err
		}
		if len(rows) > 0 {
			p.NationalID, p.LicenseNumber = rows[0].NationalID, rows[0].License
		}
	}
	var vehicles []struct {
		Registration string  `json:"registration_number"`
		Type         string  `json:"vehicle_type"`
		Capacity     float64 `json:"capacity"`
		Make         string  `json:"make"`
		Model        string  `json:"model"`
	}
	data, _, err = r.db.Client.From("vehicles").Select("registration_number,vehicle_type,capacity,make,model", "", false).Eq("transporter_id", transporterID).Order("created_at", nil).Range(0, 0, "").ExecuteWithContext(ctx)
	if err != nil {
		return Profile{}, err
	}
	if err = decode(data, &vehicles); err != nil {
		return Profile{}, err
	}
	if len(vehicles) > 0 {
		v := vehicles[0]
		p.VehicleRegistration, p.VehicleType, p.VehicleCapacity, p.VehicleMake, p.VehicleModel = v.Registration, v.Type, v.Capacity, v.Make, v.Model
	}
	return p, nil
}
func (r *Repository) UpdateProfile(ctx context.Context, actor string, values map[string]interface{}) (Profile, error) {
	transporterID, err := r.transporterID(ctx, actor)
	if err != nil {
		return Profile{}, err
	}
	var transporterRows []struct {
		Type string `json:"transporter_type"`
	}
	data, _, err := r.db.Client.From("transporters").Select("transporter_type", "", false).Eq("id", transporterID).ExecuteWithContext(ctx)
	if err != nil {
		return Profile{}, err
	}
	if err = decode(data, &transporterRows); err != nil {
		return Profile{}, err
	}
	if len(transporterRows) == 0 {
		return Profile{}, ErrNotFound
	}
	transporterType := transporterRows[0].Type
	profiles := map[string]interface{}{}
	for api, column := range map[string]string{"fullName": "full_name", "email": "email", "phone": "phone", "photo": "profile_photo"} {
		if value, ok := values[api]; ok {
			profiles[column] = value
		}
	}
	if len(profiles) > 0 {
		if _, _, err = r.db.Client.From("profiles").Update(profiles, "", "").Eq("id", actor).ExecuteWithContext(ctx); err != nil {
			return Profile{}, err
		}
	}
	individual := map[string]interface{}{}
	if value, ok := values["fullName"]; ok {
		individual["full_name"] = value
	}
	if value, ok := values["nationalId"]; ok {
		individual["national_id"] = value
	}
	if value, ok := values["licenseNumber"]; ok {
		individual["driving_license_no"] = value
	}
	if transporterType == "individual" && len(individual) > 0 {
		exists, checkErr := r.hasRow(ctx, "individual_transporters", "transporter_id", transporterID)
		if checkErr != nil {
			return Profile{}, checkErr
		}
		if exists {
			_, _, err = r.db.Client.From("individual_transporters").Update(individual, "", "").Eq("transporter_id", transporterID).ExecuteWithContext(ctx)
		} else {
			individual["transporter_id"] = transporterID
			_, _, err = r.db.Client.From("individual_transporters").Insert(individual, false, "", "", "").ExecuteWithContext(ctx)
		}
		if err != nil {
			return Profile{}, err
		}
	}
	company := map[string]interface{}{}
	if value, ok := values["companyName"]; ok {
		company["company_name"] = value
	}
	if value, ok := values["businessRegNumber"]; ok {
		company["registration_number"] = value
	}
	if value, ok := values["contactPerson"]; ok {
		company["contact_person"] = value
	}
	if transporterType == "company" && len(company) > 0 {
		exists, checkErr := r.hasRow(ctx, "company_transporters", "transporter_id", transporterID)
		if checkErr != nil {
			return Profile{}, checkErr
		}
		if exists {
			_, _, err = r.db.Client.From("company_transporters").Update(company, "", "").Eq("transporter_id", transporterID).ExecuteWithContext(ctx)
		} else {
			company["transporter_id"] = transporterID
			_, _, err = r.db.Client.From("company_transporters").Insert(company, false, "", "", "").ExecuteWithContext(ctx)
		}
		if err != nil {
			return Profile{}, err
		}
	}
	vehicle := map[string]interface{}{}
	for api, column := range map[string]string{"vehicleRegistration": "registration_number", "vehicleType": "vehicle_type", "vehicleCapacity": "capacity", "vehicleMake": "make", "vehicleModel": "model"} {
		if value, ok := values[api]; ok {
			vehicle[column] = value
		}
	}
	if len(vehicle) > 0 {
		var existing []struct {
			ID int64 `json:"id"`
		}
		data, _, queryErr := r.db.Client.From("vehicles").Select("id", "", false).Eq("transporter_id", transporterID).Range(0, 0, "").ExecuteWithContext(ctx)
		if queryErr != nil {
			return Profile{}, queryErr
		}
		if queryErr = decode(data, &existing); queryErr != nil {
			return Profile{}, queryErr
		}
		if len(existing) > 0 {
			_, _, err = r.db.Client.From("vehicles").Update(vehicle, "", "").Eq("id", strconv.FormatInt(existing[0].ID, 10)).Eq("transporter_id", transporterID).ExecuteWithContext(ctx)
		} else {
			vehicle["transporter_id"] = transporterID
			_, _, err = r.db.Client.From("vehicles").Insert(vehicle, false, "", "", "").ExecuteWithContext(ctx)
		}
		if err != nil {
			return Profile{}, err
		}
	}
	return r.Profile(ctx, actor)
}
