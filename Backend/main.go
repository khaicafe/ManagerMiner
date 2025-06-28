package main

import (
	"backend/models"
	"backend/routes"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func init() {
	// os.MkdirAll("db", os.ModePerm) // đảm bảo thư mục "data" tồn tại
	DB, err := gorm.Open(sqlite.Open("./db/data.db?_busy_timeout=5000"), &gorm.Config{})
	// DB.LogMode(true)
	if err != nil {
		panic("failed to connect to database")
	}

	// Thiết lập chế độ WAL (Write-Ahead Logging)
	err = DB.Exec("PRAGMA journal_mode=WAL;").Error
	if err != nil {
		log.Fatalf("failed to enable WAL mode: %v", err)
	}

	DB.AutoMigrate(
		&models.User{},
		&models.MinerStatus{},
	)

	models.DB = DB
	// Seed data if necessary
	models.SeedDefaultData(DB)

	log.Println("🔐 Lấy token từ Tuya...")
}

func main() {

	r := routes.SetupRouter()

	r.Run(":8080")
}
