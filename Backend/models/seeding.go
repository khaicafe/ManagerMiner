package models

import (
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedUsers - Seeds the database with default users
func SeedUsers(db *gorm.DB) {
	// Hash password "1" for all users
	passwordHash, err := bcrypt.GenerateFromPassword([]byte("1"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	users := []User{
		{
			Name:         "Admin",
			MobileNumber: "123456",
			Role:         "admin",
			Password:     string(passwordHash),
			OTP:          "",
			OTPExpiresAt: time.Now(),
			ResendCount:  0,
		},
		{
			Name:         "Manager",
			MobileNumber: "112233",
			Role:         "manager",
			Password:     string(passwordHash),
			OTP:          "",
			OTPExpiresAt: time.Now(),
			ResendCount:  0,
		},
		{
			Name:         "Cashier",
			MobileNumber: "121212",
			Role:         "cashier",
			Password:     string(passwordHash),
			OTP:          "",
			OTPExpiresAt: time.Now(),
			ResendCount:  0,
		},
	}

	for _, user := range users {
		if err := db.FirstOrCreate(&user, User{MobileNumber: user.MobileNumber}).Error; err != nil {
			log.Fatalf("Cannot seed user %v: %v", user.Name, err)
		}
	}

	log.Println("Default users seeded successfully.")
}

// SeedDefaultData - Run all the seeders to populate the database with default data
func SeedDefaultData(db *gorm.DB) {
	SeedUsers(db)
}
