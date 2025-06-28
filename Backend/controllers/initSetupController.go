package controllers

import (
	"backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func InitialSetup(c *gin.Context) {
	// Check if any admin user exists
	var user models.User
	if err := models.DB.Where("role = ?", "admin").First(&user).Error; err == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin account already exists"})
		return
	}

	var input struct {
		MobileNumber string `json:"mobile_number" binding:"required"`
		Password     string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create admin user
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	admin := models.User{
		MobileNumber: input.MobileNumber,
		Password:     string(hashedPassword),
		Role:         "admin",
	}
	models.DB.Create(&admin)

	c.JSON(http.StatusOK, gin.H{"message": "Admin account created successfully"})
}
