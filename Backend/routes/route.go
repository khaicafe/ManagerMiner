package routes

import (
	"backend/controllers"
	"backend/middlewares"
	"backend/models"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Set("db", models.DB)
		c.Next()
	})

	// Configure CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	r.Use(middlewares.AuthMiddleware())

	var user models.User
	if err := models.DB.Where("role = ?", "admin").First(&user).Error; err != nil {
		r.POST("/api/setup", controllers.InitialSetup)
	}

	r.GET("/favicon.ico", func(c *gin.Context) {
		c.Status(204)
	})

	// API routes
	api := r.Group("/api")
	{
		api.GET("/ping", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "pong"})
		})

		// user system
		api.POST("/auth/signup", controllers.Signup)
		api.POST("/auth/verify-signup-otp", controllers.VerifySignupOTP)
		api.POST("/auth/send-otp", controllers.SendOTP)
		api.POST("/auth/resend-otp", controllers.ResendOTP)
		api.POST("/auth/login", controllers.Login)
		api.POST("/auth/reset-password", controllers.ResetPassword)

		//
		api.POST("/report", controllers.ReportMinerStatus)
		api.GET("/miners", controllers.GetAllMiners)
		api.POST("/miners/update-list", controllers.UpdateMinersList)
		api.GET("/miners/config/:deviceID", controllers.GetMinerConfig)
		api.POST("miners/start", controllers.StartMining)
		api.POST("miners/stop", controllers.StopMining)
		api.POST("/miners/update-maxhint", controllers.UpdateMaxHint)

		//
		api.GET("/local-ip", func(c *gin.Context) {
			localIP := controllers.GetLocalIP()
			c.JSON(http.StatusOK, gin.H{
				"local_ip": localIP,
			})
		})

		//
		api.GET("/coins-all", controllers.GetAllCoins)
		api.DELETE("/coins/:id/full", controllers.DeleteCoinFull)
		api.POST("/coins/full", controllers.CreateCoinFull)
		api.PUT("/coins/:id/full", controllers.UpdateCoinFull)

		// Coin
		api.GET("/coins", controllers.GetCoins)
		api.GET("/coins/:id", controllers.GetCoin)
		api.POST("/coins", controllers.CreateCoin)
		api.PUT("/coins/:id", controllers.UpdateCoin)
		api.DELETE("/coins/:id", controllers.DeleteCoin)

		// Pool
		api.GET("/pools", controllers.GetPools)
		api.GET("/pools/:id", controllers.GetPool)
		api.POST("/pools", controllers.CreatePool)
		api.PUT("/pools/:id", controllers.UpdatePool)
		api.DELETE("/pools/:id", controllers.DeletePool)

		// Wallet
		api.GET("/wallets", controllers.GetWallets)
		api.GET("/wallets/:id", controllers.GetWallet)
		api.POST("/wallets", controllers.CreateWallet)
		api.PUT("/wallets/:id", controllers.UpdateWallet)
		api.DELETE("/wallets/:id", controllers.DeleteWallet)

	}

	// Serve frontend build (React)
	r.Static("/assets", filepath.Join("..", "BackOffice", "dist", "assets"))
	r.StaticFile("/vite.svg", filepath.Join("..", "BackOffice", "dist", "vite.svg"))
	r.StaticFile("/", filepath.Join("..", "BackOffice", "dist", "index.html"))

	// Fallback to index.html for SPA routes
	r.NoRoute(func(c *gin.Context) {
		uri := c.Request.RequestURI
		if filepath.Ext(uri) == "" {
			c.File(filepath.Join("dist", "index.html"))
		} else {
			c.Status(http.StatusNotFound)
		}
	})

	return r
}
