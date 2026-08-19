package transporter

import (
	repo "backend/internal/repositories/transporter"
	"context"
	"fmt"
	"strings"
)

type Service struct{ repo *repo.Repository }

func New(r *repo.Repository) *Service { return &Service{r} }
func pagination(page, size int) (int, int) {
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 25
	}
	return (page - 1) * size, page*size - 1
}
func (s *Service) Deliveries(c context.Context, actor, status string, page, size int) ([]repo.Delivery, int64, error) {
	from, to := pageRange(page, size)
	return s.repo.Deliveries(c, actor, strings.TrimSpace(status), from, to)
}
func pageRange(page, size int) (int, int) { return pagination(page, size) }
func (s *Service) History(c context.Context, actor string, page, size int) ([]repo.Delivery, int64, error) {
	from, to := pageRange(page, size)
	return s.repo.Deliveries(c, actor, "delivered", from, to)
}
func (s *Service) Delivery(c context.Context, actor, id string) (repo.Delivery, error) {
	return s.repo.Delivery(c, actor, id)
}
func (s *Service) Accept(c context.Context, actor, id string) (repo.Delivery, error) {
	return s.repo.UpdateDelivery(c, actor, id, "assigned", map[string]interface{}{"status": "accepted"})
}
func (s *Service) Start(c context.Context, actor, id string) (repo.Delivery, error) {
	d, e := s.repo.Delivery(c, actor, id)
	if e != nil {
		return d, e
	}
	if d.Status != "assigned" && d.Status != "accepted" && d.Status != "overdue" {
		return d, fmt.Errorf("invalid status transition")
	}
	return s.repo.UpdateDelivery(c, actor, id, "", map[string]interface{}{"status": "in_transit"})
}
func (s *Service) Issue(c context.Context, actor, id, note string) (repo.Delivery, error) {
	if strings.TrimSpace(note) == "" {
		return repo.Delivery{}, fmt.Errorf("issue note is required")
	}
	return s.repo.UpdateDelivery(c, actor, id, "", map[string]interface{}{"status": "issue", "notes": strings.TrimSpace(note)})
}
func (s *Service) ActiveTrip(c context.Context, actor string) (*repo.Trip, error) {
	return s.repo.ActiveTrip(c, actor)
}
func (s *Service) TripStatus(c context.Context, actor, status string) (*repo.Trip, error) {
	if status != "in_transit" && status != "paused" && status != "delivered" {
		return nil, fmt.Errorf("invalid status")
	}
	return s.repo.UpdateTrip(c, actor, status)
}
func (s *Service) Notifications(c context.Context, actor string, page, size int) ([]repo.Notification, int64, error) {
	from, to := pageRange(page, size)
	return s.repo.Notifications(c, actor, from, to)
}
func (s *Service) ReadNotification(c context.Context, actor, id string) error {
	return s.repo.ReadNotification(c, actor, id)
}
func (s *Service) Profile(c context.Context, actor string) (repo.Profile, error) {
	return s.repo.Profile(c, actor)
}
func (s *Service) UpdateProfile(c context.Context, actor string, values map[string]interface{}) (repo.Profile, error) {
	allowed := map[string]string{"fullName": "full_name", "phoneNumber": "phone_number", "nationalId": "national_id", "driversLicenceNo": "drivers_licence_no", "licenceExpiryDate": "licence_expiry_date", "vehicleRegistration": "registration_number", "vehicleType": "vehicle_type", "vehicleCapacity": "capacity", "refrigerationAvailable": "refrigeration_available"}
	out := map[string]interface{}{}
	for k, col := range allowed {
		if v, ok := values[k]; ok {
			out[col] = v
		}
	}
	if len(out) == 0 {
		return repo.Profile{}, fmt.Errorf("no supported profile fields supplied")
	}
	return s.repo.UpdateProfile(c, actor, out)
}
