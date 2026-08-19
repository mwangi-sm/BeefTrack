package admin

import (
	repo "backend/internal/repositories/admin"
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

type Service struct{ repo *repo.Repository }

func New(r *repo.Repository) *Service { return &Service{r} }

func validID(id string) bool {
	parsed, err := uuid.Parse(id)
	return err == nil && parsed != uuid.Nil
}
func (s *Service) Users(c context.Context, role, status, search string, page, pageSize int) ([]repo.User, int64, error) {
	if status != "" && status != "active" && status != "suspended" && status != "pending" {
		return nil, 0, fmt.Errorf("invalid status")
	}
	return s.repo.Users(c, role, status, strings.TrimSpace(search), page, pageSize)
}
func (s *Service) UserStatus(c context.Context, id, status, actor string) error {
	if !validID(id) || (status != "active" && status != "suspended") {
		return fmt.Errorf("invalid request")
	}
	if err := s.repo.UpdateUserStatus(c, id, status); err != nil {
		return err
	}
	return s.repo.Activity(c, actor, "Updated user account status", "UPDATE", "profile", id)
}
func (s *Service) Organizations(c context.Context, typ, status, search string, page, pageSize int) ([]repo.Organization, int64, error) {
	return s.repo.Organizations(c, typ, status, strings.TrimSpace(search), page, pageSize)
}
func (s *Service) OrganizationStatus(c context.Context, id, status, actor string) error {
	if !validID(id) {
		return fmt.Errorf("invalid request")
	}
	if status == "active" {
		status = "approved"
	}
	if status != "approved" && status != "suspended" {
		return fmt.Errorf("invalid organization status")
	}
	if err := s.repo.UpdateOrganization(c, id, status, nil); err != nil {
		return err
	}
	return s.repo.Activity(c, actor, "Updated organization status", "UPDATE", "organization", id)
}
func (s *Service) VerifyOrganization(c context.Context, id, actor string) error {
	if !validID(id) {
		return fmt.Errorf("invalid request")
	}
	v := true
	if err := s.repo.UpdateOrganization(c, id, "approved", &v); err != nil {
		return err
	}
	return s.repo.Activity(c, actor, "Verified organization", "APPROVE", "organization", id)
}
func (s *Service) SlaughterhouseStatus(c context.Context, id, status, actor string) error {
	if !validID(id) {
		return fmt.Errorf("invalid request")
	}
	if status == "active" {
		status = "approved"
	}
	if status != "approved" && status != "suspended" {
		return fmt.Errorf("invalid organization status")
	}
	if err := s.repo.UpdateSlaughterhouse(c, id, status, nil); err != nil {
		return err
	}
	return s.repo.Activity(c, actor, "Updated slaughterhouse status", "UPDATE", "organization", id)
}
func (s *Service) VerifySlaughterhouse(c context.Context, id, actor string) error {
	if !validID(id) {
		return fmt.Errorf("invalid request")
	}
	v := true
	if err := s.repo.UpdateSlaughterhouse(c, id, "approved", &v); err != nil {
		return err
	}
	return s.repo.Activity(c, actor, "Verified slaughterhouse", "APPROVE", "organization", id)
}
func (s *Service) Approvals(c context.Context, status, typ string, page, pageSize int) ([]repo.Approval, int64, error) {
	if status != "" && status != "pending" && status != "approved" && status != "rejected" {
		return nil, 0, fmt.Errorf("invalid status")
	}
	if typ != "" && typ != "organization" && typ != "profile" {
		return nil, 0, fmt.Errorf("invalid entity type")
	}
	return s.repo.Approvals(c, status, typ, page, pageSize)
}
func (s *Service) Review(c context.Context, id, actor, status, reason string) error {
	if !validID(id) || (status != "approved" && status != "rejected") {
		return fmt.Errorf("invalid request")
	}
	a, err := s.repo.Approval(c, id)
	if err != nil {
		return err
	}
	if a.Status != "pending" {
		return fmt.Errorf("approval has already been reviewed")
	}
	if status == "rejected" && strings.TrimSpace(reason) == "" {
		return fmt.Errorf("rejection reason is required")
	}
	if err = s.repo.ReviewApproval(c, id, actor, status, reason); err != nil {
		return err
	}
	if a.EntityType == "organization" {
		v := status == "approved"
		if err = s.repo.UpdateOrganization(c, a.EntityID, status, &v); err != nil {
			return err
		}
	}
	action := "APPROVE"
	if status == "rejected" {
		action = "REJECT"
	}
	return s.repo.Activity(c, actor, "Reviewed approval request", action, a.EntityType, a.EntityID)
}
func (s *Service) Notifications(c context.Context, actor string, unread bool, page, pageSize int) ([]repo.Notification, int64, error) {
	return s.repo.Notifications(c, actor, unread, page, pageSize)
}
func (s *Service) ReadNotification(c context.Context, id, actor string) error {
	if !validID(id) {
		return fmt.Errorf("invalid notification id")
	}
	if err := s.repo.ReadNotification(c, id, actor); err != nil {
		return err
	}
	return s.repo.Activity(c, actor, "Marked notification read", "UPDATE", "admin_notification", id)
}
func (s *Service) ReadAll(c context.Context, actor string) error {
	if err := s.repo.ReadAllNotifications(c, actor); err != nil {
		return err
	}
	return s.repo.Activity(c, actor, "Marked all notifications read", "UPDATE", "admin_notification", "")
}
func (s *Service) AuditLogs(c context.Context, actor, search, from, to string, page, pageSize int) ([]repo.AuditLog, int64, error) {
	if actor != "" && !validID(actor) {
		return nil, 0, fmt.Errorf("invalid request")
	}
	return s.repo.AuditLogs(c, actor, strings.TrimSpace(search), from, to, page, pageSize)
}
func (s *Service) Traceability(c context.Context, tagID string) (map[string]interface{}, error) {
	tagID = strings.TrimSpace(tagID)
	if tagID == "" || len(tagID) > 255 {
		return nil, fmt.Errorf("invalid request")
	}
	return s.repo.Traceability(c, tagID)
}
