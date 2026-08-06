package models

import "time"

// Admin represents an administrator account in the system
type Admin struct {
	ID          int64      `json:"id"`
	Email       string     `json:"email"`
	FullName    string     `json:"full_name"`
	Role        string     `json:"role"`
	IsActive    bool       `json:"is_active"`
	LastLoginAt *time.Time `json:"last_login_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// DashboardStats aggregates key metrics for the admin dashboard
type DashboardStats struct {
	TotalAnimals       int64 `json:"total_animals"`
	TotalOrganizations int64 `json:"total_organizations"`
	TotalUsers         int64 `json:"total_users"`
	TotalTransactions  int64 `json:"total_transactions"`
	ActiveAnimals      int64 `json:"active_animals"`
	PendingApprovals   int64 `json:"pending_approvals"`
}
