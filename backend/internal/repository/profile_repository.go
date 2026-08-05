package repository

type Profile struct {
	ID           string  `json:"id" db:"id"`
	FullName     string  `json:"full_name" db:"full_name"`
	Email        string  `json:"email" db:"email"`
	Phone        *string `json:"phone" db:"phone"`
	Role         string  `json:"role" db:"role"`
	AdminID      *string `json:"admin_id" db:"admin_id"`
	ProfilePhoto *string `json:"profile_photo" db:"profile_photo"`
}
