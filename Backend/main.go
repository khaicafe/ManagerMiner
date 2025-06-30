package main

import (
	"backend/models"
	"backend/routes"
	"backend/utils"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

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
		&models.Pool{},
		&models.Coin{},
		&models.Wallet{},
	)

	models.DB = DB
	// Seed data if necessary
	models.SeedDefaultData(DB)

}

func main() {
	env := os.Getenv("ENV")
	if env == "" {
		env = "dev"
	}

	err := godotenv.Load(".env." + env)
	if err != nil {
		log.Printf("⚠️ .env.%s not found. Trying fallback .env\n", env)

		err = godotenv.Load(".env")
		if err != nil {
			log.Fatal("Error loading .env file")
		}
	}

	r := routes.SetupRouter()
	// Khởi tạo server Socket.IO từ utils
	socketServer, err := utils.InitSocketServer()
	if err != nil {
		log.Fatal("Socket.IO initialization failed:", err)
	}
	WEBSOCKET_PATH := os.Getenv("WEBSOCKET_PATH")
	// Đăng ký http.Handler của socketServer vào Gin
	r.GET(WEBSOCKET_PATH+"*any", gin.WrapH(socketServer))
	r.POST(WEBSOCKET_PATH+"*any", gin.WrapH(socketServer))

	// Chạy server Socket.IO trên một goroutine riêng
	go func() {
		if err := socketServer.Serve(); err != nil {
			log.Fatalf("SocketIO listen error: %s\n", err)
		}
	}()
	defer socketServer.Close()

	r.Run(":8080")
	// r.Run("192.167.1.9:8080")

}
