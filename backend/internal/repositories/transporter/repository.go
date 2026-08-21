package transporter

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
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

// Movement is backed only by transport_movements.  The address fields are
// intentionally returned directly because no shipment/vehicle relation is
// assumed beyond the verified movement schema.
type Movement struct {
	ID                    string            `json:"id"`
	TransportRequestID    string            `json:"transportRequestId"`
	TransportProviderType string            `json:"transportProviderType"`
	ShipmentID            *int64            `json:"shipmentId,omitempty"`
	OriginAddress         string            `json:"originAddress"`
	DestinationAddress    string            `json:"destinationAddress"`
	ScheduledAt           string            `json:"scheduledAt,omitempty"`
	StartedAt             string            `json:"startedAt,omitempty"`
	DeliveredAt           string            `json:"deliveredAt,omitempty"`
	Status                string            `json:"status"`
	Notes                 string            `json:"notes,omitempty"`
	CreatedAt             string            `json:"createdAt,omitempty"`
	UpdatedAt             string            `json:"updatedAt,omitempty"`
	Tracking              []Tracking        `json:"tracking,omitempty"`
	Delivery              *MovementDelivery `json:"delivery,omitempty"`
}
type Tracking struct {
	ID         int64    `json:"id"`
	Latitude   float64  `json:"latitude"`
	Longitude  float64  `json:"longitude"`
	Speed      *float64 `json:"speed,omitempty"`
	RecordedAt string   `json:"recordedAt"`
}
type TrackingInput struct {
	Latitude  float64  `json:"latitude"`
	Longitude float64  `json:"longitude"`
	Speed     *float64 `json:"speed,omitempty"`
}
type MovementDelivery struct {
	ID            string `json:"id"`
	DeliveredAt   string `json:"deliveredAt"`
	ReceiverName  string `json:"receiverName"`
	ReceiverPhone string `json:"receiverPhone,omitempty"`
	Destination   string `json:"destination,omitempty"`
	Condition     string `json:"condition,omitempty"`
	Notes         string `json:"notes,omitempty"`
}
type DeliveryInput struct {
	ReceiverName  string `json:"receiverName"`
	ReceiverPhone string `json:"receiverPhone"`
	Destination   string `json:"destination"`
	Condition     string `json:"condition"`
	Notes         string `json:"notes"`
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

// transporterID resolves the verified JWT subject through profiles.id to the
// approved transporters.profile_id relationship; it never accepts an ID from
// the browser as proof of ownership.
func (r *Repository) transporterID(ctx context.Context, profileID string) (string, error) {
	if err := r.ready(); err != nil {
		return "", err
	}
	var profiles []struct {
		ID string `json:"id"`
	}
	data, _, err := r.db.Client.From("profiles").Select("id", "", false).Eq("id", profileID).ExecuteWithContext(ctx)
	if err != nil {
		return "", err
	}
	if err = decode(data, &profiles); err != nil {
		return "", err
	}
	if len(profiles) != 1 {
		return "", ErrNotFound
	}
	var rows []struct {
		ID string `json:"id"`
	}
	data, _, err = r.db.Client.From("transporters").Select("id", "", false).Eq("profile_id", profileID).ExecuteWithContext(ctx)
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

func (r *Repository) movementRows(ctx context.Context, actor, status string, from, to int, id string) ([]Movement, int64, error) {
	transporterID, err := r.transporterID(ctx, actor)
	if err != nil {
		return nil, 0, err
	}
	q := r.db.Client.From("transport_movements").Select("id,transport_request_id,transport_provider_type,shipment_id,origin_address,destination_address,scheduled_at,started_at,delivered_at,status,notes,created_at,updated_at", "exact", false).
		Eq("registered_transporter_id", transporterID).Eq("transport_provider_type", "registered")
	if status != "" {
		q = q.Eq("status", status)
	}
	if id != "" {
		q = q.Eq("id", id)
	}
	data, total, err := q.Order("created_at", nil).Range(from, to, "").ExecuteWithContext(ctx)
	if err != nil {
		return nil, 0, err
	}
	var rows []struct {
		ID                    string     `json:"id"`
		TransportRequestID    string     `json:"transport_request_id"`
		TransportProviderType string     `json:"transport_provider_type"`
		ShipmentID            *int64     `json:"shipment_id"`
		OriginAddress         string     `json:"origin_address"`
		DestinationAddress    string     `json:"destination_address"`
		ScheduledAt           *time.Time `json:"scheduled_at"`
		StartedAt             *time.Time `json:"started_at"`
		DeliveredAt           *time.Time `json:"delivered_at"`
		Status                string     `json:"status"`
		Notes                 string     `json:"notes"`
		CreatedAt             time.Time  `json:"created_at"`
		UpdatedAt             time.Time  `json:"updated_at"`
	}
	if err = decode(data, &rows); err != nil {
		return nil, 0, err
	}
	out := make([]Movement, len(rows))
	for i, v := range rows {
		out[i] = Movement{ID: v.ID, TransportRequestID: v.TransportRequestID, TransportProviderType: v.TransportProviderType, ShipmentID: v.ShipmentID, OriginAddress: v.OriginAddress, DestinationAddress: v.DestinationAddress, Status: v.Status, Notes: v.Notes, CreatedAt: v.CreatedAt.Format(time.RFC3339), UpdatedAt: v.UpdatedAt.Format(time.RFC3339)}
		if v.ScheduledAt != nil {
			out[i].ScheduledAt = v.ScheduledAt.Format(time.RFC3339)
		}
		if v.StartedAt != nil {
			out[i].StartedAt = v.StartedAt.Format(time.RFC3339)
		}
		if v.DeliveredAt != nil {
			out[i].DeliveredAt = v.DeliveredAt.Format(time.RFC3339)
		}
	}
	return out, total, nil
}
func (r *Repository) Movements(ctx context.Context, actor, status string, from, to int) ([]Movement, int64, error) {
	return r.movementRows(ctx, actor, status, from, to, "")
}
func (r *Repository) Movement(ctx context.Context, actor, id string) (Movement, error) {
	rows, _, err := r.movementRows(ctx, actor, "", 0, 0, id)
	if err != nil || len(rows) == 0 {
		if err == nil {
			err = ErrNotFound
		}
		return Movement{}, err
	}
	m := rows[0]
	if err = r.movementExtras(ctx, &m); err != nil {
		return Movement{}, err
	}
	return m, nil
}
func (r *Repository) movementExtras(ctx context.Context, m *Movement) error {
	data, _, err := r.db.Client.From("transport_movement_tracking").Select("id,latitude,longitude,speed,recorded_at", "", false).Eq("transport_movement_id", m.ID).Order("recorded_at", nil).ExecuteWithContext(ctx)
	if err != nil {
		return err
	}
	var tracking []struct {
		ID         int64     `json:"id"`
		Latitude   float64   `json:"latitude"`
		Longitude  float64   `json:"longitude"`
		Speed      *float64  `json:"speed"`
		RecordedAt time.Time `json:"recorded_at"`
	}
	if err = decode(data, &tracking); err != nil {
		return err
	}
	for _, v := range tracking {
		m.Tracking = append(m.Tracking, Tracking{ID: v.ID, Latitude: v.Latitude, Longitude: v.Longitude, Speed: v.Speed, RecordedAt: v.RecordedAt.Format(time.RFC3339)})
	}
	data, _, err = r.db.Client.From("transport_deliveries").Select("id,delivered_at,receiver_name,receiver_phone,destination,condition,notes", "", false).Eq("transport_movement_id", m.ID).Range(0, 0, "").ExecuteWithContext(ctx)
	if err != nil {
		return err
	}
	var deliveries []struct {
		ID            string    `json:"id"`
		DeliveredAt   time.Time `json:"delivered_at"`
		ReceiverName  string    `json:"receiver_name"`
		ReceiverPhone string    `json:"receiver_phone"`
		Destination   string    `json:"destination"`
		Condition     string    `json:"condition"`
		Notes         string    `json:"notes"`
	}
	if err = decode(data, &deliveries); err != nil {
		return err
	}
	if len(deliveries) > 0 {
		v := deliveries[0]
		m.Delivery = &MovementDelivery{ID: v.ID, DeliveredAt: v.DeliveredAt.Format(time.RFC3339), ReceiverName: v.ReceiverName, ReceiverPhone: v.ReceiverPhone, Destination: v.Destination, Condition: v.Condition, Notes: v.Notes}
	}
	return nil
}
func (r *Repository) UpdateMovement(ctx context.Context, actor, id, from string, values map[string]interface{}) (Movement, error) {
	m, err := r.Movement(ctx, actor, id)
	if err != nil {
		return Movement{}, err
	}
	if m.Status != from {
		return Movement{}, fmt.Errorf("invalid status transition")
	}
	transporterID, err := r.transporterID(ctx, actor)
	if err != nil {
		return Movement{}, err
	}
	data, _, err := r.db.Client.From("transport_movements").Update(values, "representation", "").Eq("id", id).Eq("registered_transporter_id", transporterID).Eq("transport_provider_type", "registered").Eq("status", from).ExecuteWithContext(ctx)
	if err != nil {
		return Movement{}, err
	}
	var rows []map[string]interface{}
	if decode(data, &rows) != nil || len(rows) == 0 {
		return Movement{}, fmt.Errorf("invalid status transition")
	}
	return r.Movement(ctx, actor, id)
}
func (r *Repository) ActiveMovement(ctx context.Context, actor string) (*Movement, error) {
	rows, _, err := r.movementRows(ctx, actor, "accepted", 0, 0, "")
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		rows, _, err = r.movementRows(ctx, actor, "in_transit", 0, 0, "")
		if err != nil || len(rows) == 0 {
			return nil, err
		}
	}
	m := rows[0]
	return &m, nil
}
func (r *Repository) MovementHistory(ctx context.Context, actor string, from, to int) ([]Movement, int64, error) {
	rows, total, err := r.movementRows(ctx, actor, "delivered", from, to, "")
	return rows, total, err
}
func (r *Repository) AddTracking(ctx context.Context, actor, id string, input TrackingInput) (Tracking, error) {
	m, err := r.Movement(ctx, actor, id)
	if err != nil {
		return Tracking{}, err
	}
	if m.Status != "in_transit" {
		return Tracking{}, fmt.Errorf("invalid status transition")
	}
	now := time.Now().UTC()
	data, _, err := r.db.Client.From("transport_movement_tracking").Insert(map[string]interface{}{"transport_movement_id": id, "latitude": input.Latitude, "longitude": input.Longitude, "speed": input.Speed, "recorded_at": now}, false, "representation", "", "").ExecuteWithContext(ctx)
	if err != nil {
		return Tracking{}, err
	}
	var rows []struct {
		ID int64 `json:"id"`
	}
	if err = decode(data, &rows); err != nil || len(rows) == 0 {
		return Tracking{}, ErrNotFound
	}
	return Tracking{ID: rows[0].ID, Latitude: input.Latitude, Longitude: input.Longitude, Speed: input.Speed, RecordedAt: now.Format(time.RFC3339)}, nil
}
func (r *Repository) DeliverMovement(ctx context.Context, actor, id string, input DeliveryInput) (Movement, error) {
	m, err := r.Movement(ctx, actor, id)
	if err != nil {
		return Movement{}, err
	}
	if m.Status != "in_transit" {
		return Movement{}, fmt.Errorf("invalid status transition")
	}
	data, _, err := r.db.Client.From("transport_deliveries").Select("id", "", false).Eq("transport_movement_id", id).Range(0, 0, "").ExecuteWithContext(ctx)
	if err != nil {
		return Movement{}, err
	}
	var existing []struct {
		ID string `json:"id"`
	}
	if err = decode(data, &existing); err != nil {
		return Movement{}, err
	}
	if len(existing) > 0 {
		return Movement{}, fmt.Errorf("duplicate delivery")
	}
	now := time.Now().UTC()
	_, _, err = r.db.Client.From("transport_deliveries").Insert(map[string]interface{}{"transport_movement_id": id, "delivered_at": now, "receiver_name": input.ReceiverName, "receiver_phone": input.ReceiverPhone, "destination": input.Destination, "condition": input.Condition, "notes": input.Notes}, false, "", "", "").ExecuteWithContext(ctx)
	if err != nil {
		return Movement{}, err
	}
	return r.UpdateMovement(ctx, actor, id, "in_transit", map[string]interface{}{"status": "delivered", "delivered_at": now, "updated_at": now})
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
func (r *Repository) legacyProfile(ctx context.Context, actor string) (Profile, error) {
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
func (r *Repository) legacyUpdateProfile(ctx context.Context, actor string, values map[string]interface{}) (Profile, error) {
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

// Profile reads the approved transporter identity record.  The profile is
// always resolved by its authenticated id, never by email or a client ID.
func (r *Repository) Profile(ctx context.Context, actor string) (Profile, error) {
	transporterID, err := r.transporterID(ctx, actor)
	if err != nil {
		return Profile{}, err
	}
	var rows []struct {
		FullName     string  `json:"full_name"`
		Email        string  `json:"email"`
		Phone        string  `json:"phone_number"`
		Photo        string  `json:"profile_photo_url"`
		AccountType  string  `json:"account_type"`
		NationalID   string  `json:"national_id"`
		License      string  `json:"drivers_licence_no"`
		Registration string  `json:"registration_number"`
		VehicleType  string  `json:"vehicle_type"`
		Capacity     float64 `json:"capacity"`
	}
	data, _, err := r.db.Client.From("transporters").Select("full_name,email,phone_number,profile_photo_url,account_type,national_id,drivers_licence_no,registration_number,vehicle_type,capacity", "", false).Eq("id", transporterID).Eq("profile_id", actor).ExecuteWithContext(ctx)
	if err != nil {
		return Profile{}, err
	}
	if err = decode(data, &rows); err != nil {
		return Profile{}, err
	}
	if len(rows) != 1 {
		return Profile{}, ErrNotFound
	}
	v := rows[0]
	return Profile{ID: actor, TransporterID: transporterID, FullName: v.FullName, Email: v.Email, Phone: v.Phone, ProfilePhoto: v.Photo, TransporterType: v.AccountType, NationalID: v.NationalID, LicenseNumber: v.License, VehicleRegistration: v.Registration, VehicleType: v.VehicleType, VehicleCapacity: v.Capacity}, nil
}

// UpdateProfile only accepts a small, schema-backed allowlist.  It creates a
// transporter only when real registration data is supplied during onboarding.
func (r *Repository) UpdateProfile(ctx context.Context, actor string, values map[string]interface{}) (Profile, error) {
	if err := r.ready(); err != nil {
		return Profile{}, err
	}
	var profileRows []struct {
		FullName string `json:"full_name"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		Photo    string `json:"profile_photo"`
	}
	data, _, err := r.db.Client.From("profiles").Select("full_name,email,phone,profile_photo", "", false).Eq("id", actor).ExecuteWithContext(ctx)
	if err != nil {
		return Profile{}, err
	}
	if err = decode(data, &profileRows); err != nil {
		return Profile{}, err
	}
	if len(profileRows) != 1 {
		return Profile{}, ErrNotFound
	}
	p := profileRows[0]
	allowed := map[string]string{"fullName": "full_name", "email": "email", "phone": "phone_number", "photo": "profile_photo_url", "accountType": "account_type", "nationalId": "national_id", "licenseNumber": "drivers_licence_no", "licenseExpiry": "licence_expiry_date", "vehicleRegistration": "registration_number", "vehicleType": "vehicle_type", "vehicleCapacity": "capacity", "refrigerationAvailable": "refrigeration_available"}
	updates := map[string]interface{}{}
	for api, column := range allowed {
		if value, ok := values[api]; ok {
			updates[column] = value
		}
	}
	if _, ok := updates["full_name"]; !ok {
		updates["full_name"] = p.FullName
	}
	if _, ok := updates["email"]; !ok {
		updates["email"] = p.Email
	}
	if _, ok := updates["phone_number"]; !ok {
		updates["phone_number"] = p.Phone
	}
	if _, ok := updates["profile_photo_url"]; !ok {
		updates["profile_photo_url"] = p.Photo
	}
	var existing []struct {
		ID string `json:"id"`
	}
	data, _, err = r.db.Client.From("transporters").Select("id", "", false).Eq("profile_id", actor).ExecuteWithContext(ctx)
	if err != nil {
		return Profile{}, err
	}
	if err = decode(data, &existing); err != nil {
		return Profile{}, err
	}
	if len(existing) == 0 {
		if registration, ok := updates["registration_number"].(string); !ok || strings.TrimSpace(registration) == "" {
			return Profile{}, fmt.Errorf("transporter setup is incomplete")
		}
		updates["profile_id"] = actor
		_, _, err = r.db.Client.From("transporters").Insert(updates, false, "", "", "").ExecuteWithContext(ctx)
	} else {
		_, _, err = r.db.Client.From("transporters").Update(updates, "", "").Eq("id", existing[0].ID).Eq("profile_id", actor).ExecuteWithContext(ctx)
	}
	if err != nil {
		return Profile{}, err
	}
	return r.Profile(ctx, actor)
}
