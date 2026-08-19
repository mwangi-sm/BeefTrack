package transporter

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"backend/internal/database"
)

var ErrNotFound = fmt.Errorf("not found")

type Repository struct{ db *database.DB }

func New(db *database.DB) *Repository { return &Repository{db: db} }
func (r *Repository) ready() error {
	if r == nil || r.db == nil || r.db.Client == nil {
		return fmt.Errorf("database unavailable")
	}
	return nil
}

type Delivery struct {
	ID             string `json:"id"`
	Pickup         string `json:"pickup"`
	Destination    string `json:"destination"`
	Farmer         string `json:"farmer"`
	Slaughterhouse string `json:"slaughterhouse"`
	Driver         string `json:"driver"`
	Vehicle        string `json:"vehicle"`
	ScheduledTime  string `json:"scheduledTime"`
	Animal         string `json:"animal"`
	Notes          string `json:"notes"`
	Status         string `json:"status"`
	CreatedAt      string `json:"createdAt"`
}
type Trip struct {
	ID                  string  `json:"id"`
	TripID              string  `json:"tripId"`
	DeliveryID          string  `json:"deliveryId"`
	ETA                 string  `json:"eta"`
	Status              string  `json:"status"`
	Route               string  `json:"route"`
	DistanceRemainingKm float64 `json:"distanceRemainingKm"`
	ProgressPercent     float64 `json:"progressPercent"`
	CurrentLat          float64 `json:"currentLat"`
	CurrentLng          float64 `json:"currentLng"`
	DestLat             float64 `json:"destLat"`
	DestLng             float64 `json:"destLng"`
}
type Notification struct {
	ID     string `json:"id"`
	Text   string `json:"text"`
	Type   string `json:"type"`
	Time   string `json:"time"`
	Unread bool   `json:"unread"`
}
type Profile struct {
	ID                     string `json:"id"`
	FullName               string `json:"fullName"`
	Email                  string `json:"email"`
	PhoneNumber            string `json:"phoneNumber"`
	AccountType            string `json:"accountType"`
	NationalID             string `json:"nationalId"`
	DriversLicenceNo       string `json:"driversLicenceNo"`
	LicenceExpiryDate      string `json:"licenceExpiryDate"`
	RegistrationNumber     string `json:"vehicleRegistration"`
	VehicleType            string `json:"vehicleType"`
	Capacity               string `json:"vehicleCapacity"`
	RefrigerationAvailable bool   `json:"refrigerationAvailable"`
}

type deliveryRow struct {
	ID             string    `json:"id"`
	Pickup         string    `json:"pickup"`
	Destination    string    `json:"destination"`
	Farmer         string    `json:"farmer"`
	Slaughterhouse string    `json:"slaughterhouse"`
	Driver         string    `json:"driver"`
	Vehicle        string    `json:"vehicle"`
	ScheduledTime  time.Time `json:"scheduled_time"`
	Animal         string    `json:"animal_summary"`
	Notes          string    `json:"notes"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
}

func decode(data []byte, out interface{}) error { return json.Unmarshal(data, out) }
func (r *Repository) Deliveries(ctx context.Context, actor, status string, from, to int) ([]Delivery, int64, error) {
	if err := r.ready(); err != nil {
		return nil, 0, err
	}
	q := r.db.Client.From("deliveries").Select("id,pickup,destination,farmer,slaughterhouse,driver,vehicle,scheduled_time,animal_summary,notes,status,created_at", "exact", false).Eq("transporter_id", actor)
	if status != "" {
		q = q.Eq("status", status)
	}
	var rows []deliveryRow
	data, total, err := q.Order("scheduled_time", nil).Range(from, to, "").ExecuteWithContext(ctx)
	if err != nil {
		return nil, 0, err
	}
	if err = decode(data, &rows); err != nil {
		return nil, 0, err
	}
	out := make([]Delivery, len(rows))
	for i, v := range rows {
		out[i] = Delivery{v.ID, v.Pickup, v.Destination, v.Farmer, v.Slaughterhouse, v.Driver, v.Vehicle, v.ScheduledTime.Format(time.RFC3339), v.Animal, v.Notes, v.Status, v.CreatedAt.Format(time.RFC3339)}
	}
	return out, total, nil
}
func (r *Repository) Delivery(ctx context.Context, actor, id string) (Delivery, error) {
	v, n, e := r.DeliveriesByID(ctx, actor, id)
	if e != nil {
		return Delivery{}, e
	}
	if n == 0 {
		return Delivery{}, ErrNotFound
	}
	return v, nil
}
func (r *Repository) DeliveriesByID(ctx context.Context, actor, id string) (Delivery, int, error) {
	if err := r.ready(); err != nil {
		return Delivery{}, 0, err
	}
	var rows []deliveryRow
	data, _, err := r.db.Client.From("deliveries").Select("id,pickup,destination,farmer,slaughterhouse,driver,vehicle,scheduled_time,animal_summary,notes,status,created_at", "", false).Eq("id", id).Eq("transporter_id", actor).ExecuteWithContext(ctx)
	if err != nil {
		return Delivery{}, 0, err
	}
	if err = decode(data, &rows); err != nil {
		return Delivery{}, 0, err
	}
	if len(rows) == 0 {
		return Delivery{}, 0, nil
	}
	v := rows[0]
	return Delivery{v.ID, v.Pickup, v.Destination, v.Farmer, v.Slaughterhouse, v.Driver, v.Vehicle, v.ScheduledTime.Format(time.RFC3339), v.Animal, v.Notes, v.Status, v.CreatedAt.Format(time.RFC3339)}, 1, nil
}
func (r *Repository) UpdateDelivery(ctx context.Context, actor, id, from string, values map[string]interface{}) (Delivery, error) {
	if err := r.ready(); err != nil {
		return Delivery{}, err
	}
	q := r.db.Client.From("deliveries").Update(values, "representation", "").Eq("id", id).Eq("transporter_id", actor)
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
func (r *Repository) ActiveTrip(ctx context.Context, actor string) (*Trip, error) {
	if err := r.ready(); err != nil {
		return nil, err
	}
	var rows []struct {
		ID         string  `json:"id"`
		TripID     string  `json:"trip_id"`
		DeliveryID string  `json:"delivery_id"`
		ETA        string  `json:"eta"`
		Status     string  `json:"status"`
		Route      string  `json:"route_description"`
		Distance   float64 `json:"distance_remaining_km"`
		Progress   float64 `json:"progress_percent"`
		CurrentLat float64 `json:"current_lat"`
		CurrentLng float64 `json:"current_lng"`
		DestLat    float64 `json:"dest_lat"`
		DestLng    float64 `json:"dest_lng"`
	}
	data, _, err := r.db.Client.From("trips").Select("id,trip_id,delivery_id,current_lat,current_lng,dest_lat,dest_lng,eta,distance_remaining_km,progress_percent,status,route_description", "", false).In("status", []string{"not_started", "in_transit", "paused"}).ExecuteWithContext(ctx)
	if err != nil {
		return nil, err
	}
	if err = decode(data, &rows); err != nil {
		return nil, err
	}
	for _, v := range rows {
		if _, e := r.Delivery(ctx, actor, v.DeliveryID); e == nil {
			return &Trip{v.ID, v.TripID, v.DeliveryID, v.ETA, v.Status, v.Route, v.Distance, v.Progress, v.CurrentLat, v.CurrentLng, v.DestLat, v.DestLng}, nil
		}
	}
	return nil, nil
}
func (r *Repository) UpdateTrip(ctx context.Context, actor, status string) (*Trip, error) {
	t, e := r.ActiveTrip(ctx, actor)
	if e != nil || t == nil {
		return t, e
	}
	data, _, e := r.db.Client.From("trips").Update(map[string]interface{}{"status": status, "updated_at": time.Now().UTC()}, "representation", "").Eq("id", t.ID).ExecuteWithContext(ctx)
	if e != nil {
		return nil, e
	}
	var rows []map[string]interface{}
	if decode(data, &rows) != nil || len(rows) == 0 {
		return nil, ErrNotFound
	}
	if status == "delivered" {
		_, e = r.UpdateDelivery(ctx, actor, t.DeliveryID, "", map[string]interface{}{"status": "delivered"})
		return t, e
	}
	t.Status = status
	return t, nil
}
func (r *Repository) Notifications(ctx context.Context, actor string, from, to int) ([]Notification, int64, error) {
	if err := r.ready(); err != nil {
		return nil, 0, err
	}
	var rows []struct {
		ID, Title, Message, Type string
		Read                     bool      `json:"read"`
		CreatedAt                time.Time `json:"created_at"`
	}
	data, total, e := r.db.Client.From("admin_notifications").Select("id,title,message,type,read,created_at", "exact", false).Eq("recipient_id", actor).Order("created_at", nil).Range(from, to, "").ExecuteWithContext(ctx)
	if e != nil {
		return nil, 0, e
	}
	if e = decode(data, &rows); e != nil {
		return nil, 0, e
	}
	out := make([]Notification, len(rows))
	for i, v := range rows {
		out[i] = Notification{v.ID, v.Title + ": " + v.Message, v.Type, v.CreatedAt.Format(time.RFC3339), !v.Read}
	}
	return out, total, nil
}
func (r *Repository) ReadNotification(ctx context.Context, actor, id string) error {
	data, _, e := r.db.Client.From("admin_notifications").Update(map[string]interface{}{"read": true, "read_at": time.Now().UTC()}, "representation", "").Eq("id", id).Eq("recipient_id", actor).ExecuteWithContext(ctx)
	if e != nil {
		return e
	}
	var rows []map[string]interface{}
	if decode(data, &rows) != nil || len(rows) == 0 {
		return ErrNotFound
	}
	return nil
}
func (r *Repository) Profile(ctx context.Context, actor string) (Profile, error) {
	if err := r.ready(); err != nil {
		return Profile{}, err
	}
	var rows []struct {
		ID            string `json:"id"`
		FullName      string `json:"full_name"`
		Email         string `json:"email"`
		Phone         string `json:"phone_number"`
		AccountType   string `json:"account_type"`
		NationalID    string `json:"national_id"`
		Licence       string `json:"drivers_licence_no"`
		Expiry        string `json:"licence_expiry_date"`
		Reg           string `json:"registration_number"`
		VehicleType   string `json:"vehicle_type"`
		Capacity      string `json:"capacity"`
		Refrigeration bool   `json:"refrigeration_available"`
	}
	data, _, e := r.db.Client.From("transporters").Select("id,full_name,email,phone_number,account_type,national_id,drivers_licence_no,licence_expiry_date,registration_number,vehicle_type,capacity,refrigeration_available", "", false).Eq("id", actor).ExecuteWithContext(ctx)
	if e != nil {
		return Profile{}, e
	}
	if e = decode(data, &rows); e != nil {
		return Profile{}, e
	}
	if len(rows) == 0 {
		return Profile{}, ErrNotFound
	}
	v := rows[0]
	return Profile{v.ID, v.FullName, v.Email, v.Phone, v.AccountType, v.NationalID, v.Licence, v.Expiry, v.Reg, v.VehicleType, v.Capacity, v.Refrigeration}, nil
}
func (r *Repository) UpdateProfile(ctx context.Context, actor string, values map[string]interface{}) (Profile, error) {
	data, _, e := r.db.Client.From("transporters").Update(values, "representation", "").Eq("id", actor).ExecuteWithContext(ctx)
	if e != nil {
		return Profile{}, e
	}
	var rows []map[string]interface{}
	if decode(data, &rows) != nil || len(rows) == 0 {
		return Profile{}, ErrNotFound
	}
	return r.Profile(ctx, actor)
}
