package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name         string    `json:"name"`
	MobileNumber string    `gorm:"unique" json:"mobile_number"`
	Role         string    `json:"role"`
	Password     string    `json:"password"`
	OTP          string    `json:"-"`
	OTPExpiresAt time.Time `json:"-"`
	ResendCount  int       `json:"-"`
	// Shifts       []Shift   `json:"shifts" gorm:"foreignKey:UserID"` // Liên kết với bảng Shift
}
