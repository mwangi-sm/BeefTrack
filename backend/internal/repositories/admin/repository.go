// Package admin contains the Supabase/PostgREST data access used by Admin services.
package admin

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"backend/internal/database"
)

type Repository struct{ db *database.DB }

var ErrNotFound = fmt.Errorf("not found")

func New(db *database.DB) *Repository { return &Repository{db: db} }

func (r *Repository) ready() error {
	if r == nil || r.db == nil || r.db.Client == nil {
		return fmt.Errorf("database unavailable")
	}
	return nil
}

func updated(data []byte) error {
	var rows []json.RawMessage
	if err := json.Unmarshal(data, &rows); err != nil {
		return fmt.Errorf("decode update response: %w", err)
	}
	if len(rows) == 0 {
		return ErrNotFound
	}
	return nil
}

type User struct {
	ID                 string `json:"id"`
	FullName           string `json:"fullName"`
	Email              string `json:"email"`
	Phone              string `json:"phone"`
	Role               string `json:"role"`
	AccountStatus      string `json:"accountStatus"`
	VerificationStatus string `json:"verificationStatus"`
	CreatedAt          string `json:"createdAt"`
}

// filterSearch removes PostgREST filter grammar from user supplied search
// terms. The remaining text is still passed as a value to ilike, never as a
// filter expression.
func filterSearch(value string) string {
	return strings.NewReplacer(
		",", " ", "(", " ", ")", " ", ".", " ", "*", " ", "%", " ",
	).Replace(value)
}

func pageRange(page, pageSize int) (int, int) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 25
	}
	return (page - 1) * pageSize, page*pageSize - 1
}

func (r *Repository) Users(ctx context.Context, role, status, search string, page, pageSize int) ([]User, int64, error) {
	if err := r.ready(); err != nil {
		return nil, 0, err
	}
	q := r.db.Client.From("profiles").Select("id,full_name,email,phone,role,account_status,verification_status,created_at", "", false)
	if role != "" {
		q = q.Eq("role", role)
	}
	if status != "" {
		q = q.Eq("account_status", status)
	}
	if search != "" {
		search = filterSearch(search)
		q = q.Or("full_name.ilike.*"+search+"*,email.ilike.*"+search+"*,phone.ilike.*"+search+"*", "")
	}
	var rows []struct {
		ID                 string    `json:"id"`
		FullName           string    `json:"full_name"`
		Email              string    `json:"email"`
		Phone              string    `json:"phone"`
		Role               string    `json:"role"`
		AccountStatus      string    `json:"account_status"`
		VerificationStatus string    `json:"verification_status"`
		CreatedAt          time.Time `json:"created_at"`
	}
	from, to := pageRange(page, pageSize)
	data, total, err := q.Order("created_at", nil).Range(from, to, "").ExecuteWithContext(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("list profiles: %w", err)
	}
	if err := json.Unmarshal(data, &rows); err != nil {
		return nil, 0, fmt.Errorf("decode profiles: %w", err)
	}
	out := make([]User, len(rows))
	for i, v := range rows {
		out[i] = User{v.ID, v.FullName, v.Email, v.Phone, v.Role, v.AccountStatus, v.VerificationStatus, v.CreatedAt.Format(time.RFC3339)}
	}
	return out, total, nil
}
func (r *Repository) UpdateUserStatus(ctx context.Context, id, status string) error {
	if err := r.ready(); err != nil {
		return err
	}
	data, _, err := r.db.Client.From("profiles").Update(map[string]string{"account_status": status}, "representation", "").Eq("id", id).ExecuteWithContext(ctx)
	if err != nil {
		return err
	}
	return updated(data)
}

type Organization struct {
	ID, Name, Type, Location, Status, CreatedAt string
	Verified                                    bool
}

func (r *Repository) Organizations(ctx context.Context, orgType, status, search string, page, pageSize int) ([]Organization, int64, error) {
	if err := r.ready(); err != nil {
		return nil, 0, err
	}
	q := r.db.Client.From("organizations").Select("id,name,organization_type,county,address,status,verified,created_at", "", false)
	if orgType != "" {
		q = q.Eq("organization_type", orgType)
	}
	if status == "active" {
		status = "approved"
	}
	if status != "" {
		q = q.Eq("status", status)
	}
	if search != "" {
		search = filterSearch(search)
		q = q.Or("name.ilike.*"+search+"*,county.ilike.*"+search+"*,address.ilike.*"+search+"*", "")
	}
	var rows []struct {
		ID        string    `json:"id"`
		Name      string    `json:"name"`
		Type      string    `json:"organization_type"`
		County    string    `json:"county"`
		Address   string    `json:"address"`
		Status    string    `json:"status"`
		Verified  bool      `json:"verified"`
		CreatedAt time.Time `json:"created_at"`
	}
	from, to := pageRange(page, pageSize)
	data, total, err := q.Order("created_at", nil).Range(from, to, "").ExecuteWithContext(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("list organizations: %w", err)
	}
	if err := json.Unmarshal(data, &rows); err != nil {
		return nil, 0, fmt.Errorf("decode organizations: %w", err)
	}
	out := make([]Organization, len(rows))
	for i, v := range rows {
		location := v.Address
		if location == "" {
			location = v.County
		}
		// The established Admin UI calls an enabled organization "active".
		// PostgreSQL stores the equivalent approved state as "approved".
		presentationStatus := v.Status
		if presentationStatus == "approved" {
			presentationStatus = "active"
		}
		out[i] = Organization{v.ID, v.Name, v.Type, location, presentationStatus, v.CreatedAt.Format(time.RFC3339), v.Verified}
	}
	return out, total, nil
}
func (r *Repository) UpdateOrganization(ctx context.Context, id, status string, verified *bool) error {
	return r.updateOrganization(ctx, id, status, verified, "")
}
func (r *Repository) UpdateSlaughterhouse(ctx context.Context, id, status string, verified *bool) error {
	return r.updateOrganization(ctx, id, status, verified, "slaughterhouse")
}
func (r *Repository) updateOrganization(ctx context.Context, id, status string, verified *bool, organizationType string) error {
	if err := r.ready(); err != nil {
		return err
	}
	values := map[string]interface{}{"status": status}
	if verified != nil {
		values["verified"] = *verified
	}
	q := r.db.Client.From("organizations").Update(values, "representation", "").Eq("id", id)
	if organizationType != "" {
		q = q.Eq("organization_type", organizationType)
	}
	data, _, err := q.ExecuteWithContext(ctx)
	if err != nil {
		return err
	}
	return updated(data)
}

type Approval struct {
	ID, EntityType, EntityID, Name, Role, Type, Status, ReviewedBy, RejectionReason string
	SubmittedAt, ReviewedAt                                                         time.Time
}

func (r *Repository) Approvals(ctx context.Context, status, entityType string, page, pageSize int) ([]Approval, int64, error) {
	if err := r.ready(); err != nil {
		return nil, 0, err
	}
	q := r.db.Client.From("admin_approvals").Select("id,entity_type,entity_id,name,role,type,submitted_at,status,reviewed_by,reviewed_at,rejection_reason", "", false)
	if status != "" {
		q = q.Eq("status", status)
	}
	if entityType != "" {
		q = q.Eq("entity_type", entityType)
	}
	var rows []struct {
		ID              string     `json:"id"`
		EntityType      string     `json:"entity_type"`
		EntityID        string     `json:"entity_id"`
		Name            string     `json:"name"`
		Role            string     `json:"role"`
		Type            string     `json:"type"`
		SubmittedAt     time.Time  `json:"submitted_at"`
		Status          string     `json:"status"`
		ReviewedBy      string     `json:"reviewed_by"`
		ReviewedAt      *time.Time `json:"reviewed_at"`
		RejectionReason string     `json:"rejection_reason"`
	}
	from, to := pageRange(page, pageSize)
	data, total, err := q.Order("submitted_at", nil).Range(from, to, "").ExecuteWithContext(ctx)
	if err != nil {
		return nil, 0, err
	}
	if err := json.Unmarshal(data, &rows); err != nil {
		return nil, 0, fmt.Errorf("decode approvals: %w", err)
	}
	out := make([]Approval, len(rows))
	for i, v := range rows {
		out[i] = Approval{ID: v.ID, EntityType: v.EntityType, EntityID: v.EntityID, Name: v.Name, Role: v.Role, Type: v.Type, Status: v.Status, ReviewedBy: v.ReviewedBy, RejectionReason: v.RejectionReason, SubmittedAt: v.SubmittedAt}
		if v.ReviewedAt != nil {
			out[i].ReviewedAt = *v.ReviewedAt
		}
	}
	return out, total, nil
}
func (r *Repository) Approval(ctx context.Context, id string) (Approval, error) {
	// Fetch the requested row directly rather than loading all approvals.
	q := r.db.Client.From("admin_approvals").Select("id,entity_type,entity_id,name,role,type,submitted_at,status,reviewed_by,reviewed_at,rejection_reason", "", false).Eq("id", id)
	var direct []struct {
		ID              string     `json:"id"`
		EntityType      string     `json:"entity_type"`
		EntityID        string     `json:"entity_id"`
		Name            string     `json:"name"`
		Role            string     `json:"role"`
		Type            string     `json:"type"`
		SubmittedAt     time.Time  `json:"submitted_at"`
		Status          string     `json:"status"`
		ReviewedBy      string     `json:"reviewed_by"`
		ReviewedAt      *time.Time `json:"reviewed_at"`
		RejectionReason string     `json:"rejection_reason"`
	}
	if _, err := q.ExecuteToWithContext(ctx, &direct); err != nil {
		return Approval{}, err
	}
	if len(direct) == 0 {
		return Approval{}, ErrNotFound
	}
	v := direct[0]
	a := Approval{ID: v.ID, EntityType: v.EntityType, EntityID: v.EntityID, Name: v.Name, Role: v.Role, Type: v.Type, Status: v.Status, ReviewedBy: v.ReviewedBy, RejectionReason: v.RejectionReason, SubmittedAt: v.SubmittedAt}
	if v.ReviewedAt != nil {
		a.ReviewedAt = *v.ReviewedAt
	}
	return a, nil
}
func (r *Repository) ReviewApproval(ctx context.Context, id, actor, status, reason string) error {
	if err := r.ready(); err != nil {
		return err
	}
	now := time.Now().UTC()
	data, _, err := r.db.Client.From("admin_approvals").Update(map[string]interface{}{"status": status, "reviewed_by": actor, "reviewed_at": now, "rejection_reason": reason, "updated_at": now}, "representation", "").Eq("id", id).Eq("status", "pending").ExecuteWithContext(ctx)
	if err != nil {
		return err
	}
	return updated(data)
}
func (r *Repository) Activity(ctx context.Context, actor, text, action, entityType, entityID string) error {
	if err := r.ready(); err != nil {
		return err
	}
	values := map[string]interface{}{"actor_id": actor, "text": text, "action": action, "entity_type": entityType}
	if entityID != "" {
		values["entity_id"] = entityID
	}
	_, _, err := r.db.Client.From("admin_activity").Insert(values, false, "", "", "").ExecuteWithContext(ctx)
	return err
}

type Notification struct {
	ID, Type, Text, CreatedAt string
	Unread                    bool
}

type AuditLog struct {
	ID, Actor, Activity, Action, EntityType, EntityID, CreatedAt string
}

func (r *Repository) AuditLogs(ctx context.Context, actor, search, from, to string, page, pageSize int) ([]AuditLog, int64, error) {
	if err := r.ready(); err != nil {
		return nil, 0, err
	}
	q := r.db.Client.From("admin_activity").Select("id,actor_id,text,action,entity_type,entity_id,created_at", "exact", false)
	if actor != "" {
		q = q.Eq("actor_id", actor)
	}
	if search != "" {
		q = q.Ilike("text", "*"+filterSearch(search)+"*")
	}
	if from != "" {
		q = q.Gte("created_at", from)
	}
	if to != "" {
		q = q.Lte("created_at", to+"T23:59:59Z")
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 25
	}
	var rows []struct {
		ID         string    `json:"id"`
		ActorID    string    `json:"actor_id"`
		Text       string    `json:"text"`
		Action     string    `json:"action"`
		EntityType string    `json:"entity_type"`
		EntityID   string    `json:"entity_id"`
		CreatedAt  time.Time `json:"created_at"`
	}
	data, total, err := q.Order("created_at", nil).Range((page-1)*pageSize, page*pageSize-1, "").ExecuteWithContext(ctx)
	if err != nil {
		return nil, 0, err
	}
	if err := json.Unmarshal(data, &rows); err != nil {
		return nil, 0, fmt.Errorf("decode audit logs: %w", err)
	}
	out := make([]AuditLog, len(rows))
	for i, v := range rows {
		out[i] = AuditLog{v.ID, v.ActorID, v.Text, v.Action, v.EntityType, v.EntityID, v.CreatedAt.Format(time.RFC3339)}
	}
	return out, total, nil
}

func (r *Repository) Notifications(ctx context.Context, recipient string, unread bool, page, pageSize int) ([]Notification, int64, error) {
	if err := r.ready(); err != nil {
		return nil, 0, err
	}
	q := r.db.Client.From("admin_notifications").Select("id,type,title,message,read,created_at", "", false).Eq("recipient_id", recipient)
	if unread {
		q = q.Eq("read", "false")
	}
	var rows []struct {
		ID        string    `json:"id"`
		Type      string    `json:"type"`
		Title     string    `json:"title"`
		Message   string    `json:"message"`
		Read      bool      `json:"read"`
		CreatedAt time.Time `json:"created_at"`
	}
	from, to := pageRange(page, pageSize)
	data, total, err := q.Order("created_at", nil).Range(from, to, "").ExecuteWithContext(ctx)
	if err != nil {
		return nil, 0, err
	}
	if err := json.Unmarshal(data, &rows); err != nil {
		return nil, 0, fmt.Errorf("decode notifications: %w", err)
	}
	out := make([]Notification, len(rows))
	for i, v := range rows {
		out[i] = Notification{v.ID, v.Type, v.Title + ": " + v.Message, v.CreatedAt.Format(time.RFC3339), !v.Read}
	}
	return out, total, nil
}
func (r *Repository) ReadNotification(ctx context.Context, id, recipient string) error {
	if err := r.ready(); err != nil {
		return err
	}
	data, _, err := r.db.Client.From("admin_notifications").Update(map[string]interface{}{"read": true, "read_at": time.Now().UTC()}, "representation", "").Eq("id", id).Eq("recipient_id", recipient).ExecuteWithContext(ctx)
	if err != nil {
		return err
	}
	return updated(data)
}
func (r *Repository) ReadAllNotifications(ctx context.Context, recipient string) error {
	if err := r.ready(); err != nil {
		return err
	}
	_, _, err := r.db.Client.From("admin_notifications").Update(map[string]interface{}{"read": true, "read_at": time.Now().UTC()}, "representation", "").Eq("recipient_id", recipient).Eq("read", "false").ExecuteWithContext(ctx)
	return err
}
