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

func SeedXMRData(db *gorm.DB) {
	// Check xem đã seed chưa
	var count int64
	DB.Model(&Coin{}).Where("name = ?", "Monero").Count(&count)
	if count > 0 {
		log.Println("⚠️ XMR data already seeded.")
		return
	}

	// Tạo Pools
	pool1 := Pool{
		Name:        "HashVault Pool",
		URL:         "pool.hashvault.pro",
		Port:        443,
		EnableTLS:   true,
		Description: "Popular Monero pool",
	}

	pool2 := Pool{
		Name:        "SupportXMR Pool",
		URL:         "pool.supportxmr.com",
		Port:        443,
		EnableTLS:   true,
		Description: "Reliable XMR pool",
	}

	// Save Pools
	if err := db.Create(&pool1).Error; err != nil {
		log.Println("❌ Failed to seed pool1:", err)
		return
	}
	if err := db.Create(&pool2).Error; err != nil {
		log.Println("❌ Failed to seed pool2:", err)
		return
	}

	// Tạo Coin
	coin := Coin{
		Name:  "Monero",
		Pools: []Pool{pool1, pool2},
	}

	if err := db.Create(&coin).Error; err != nil {
		log.Println("❌ Failed to seed coin:", err)
		return
	}

	// Tạo Wallet
	wallet := Wallet{
		Name:    "MyXMRWallet",
		Address: "45HFhfydfAzBPrYiY9b4LEh7wDDmn7rE41aHr5rmLcznjnr3cZvNQ7o6wWZSM2oyPAfR5nGznTTsCbkp7oQjEU97AfsjCgQ",
		CoinID:  coin.ID,
	}

	if err := db.Create(&wallet).Error; err != nil {
		log.Println("❌ Failed to seed wallet:", err)
		return
	}

	log.Println("✅ XMR seeding complete!")
}

// SeedDefaultData - Run all the seeders to populate the database with default data
func SeedDefaultData(db *gorm.DB) {
	SeedUsers(db)
	SeedXMRData(db)
}
