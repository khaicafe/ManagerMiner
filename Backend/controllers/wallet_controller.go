package controllers

import (
	"fmt"
	"io"
	"net/http"

	"backend/models"

	"github.com/gin-gonic/gin"
)

func GetWallets(c *gin.Context) {
	var wallets []models.Wallet
	if err := models.DB.Preload("Coin").Find(&wallets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, wallets)
}

func GetWallet(c *gin.Context) {
	id := c.Param("id")
	var wallet models.Wallet
	if err := models.DB.Preload("Coin").First(&wallet, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		return
	}
	c.JSON(http.StatusOK, wallet)
}

func CreateWallet(c *gin.Context) {
	var wallet models.Wallet
	if err := c.ShouldBindJSON(&wallet); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := models.DB.Create(&wallet).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, wallet)
}

func UpdateWallet(c *gin.Context) {
	id := c.Param("id")
	var wallet models.Wallet
	if err := models.DB.First(&wallet, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		return
	}
	if err := c.ShouldBindJSON(&wallet); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := models.DB.Save(&wallet).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, wallet)
}

func DeleteWallet(c *gin.Context) {
	id := c.Param("id")
	if err := models.DB.Delete(&models.Wallet{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func FetchHashvault(c *gin.Context) {
	address := c.Param("address")
	url := fmt.Sprintf(
		"https://api.hashvault.pro/v3/monero/wallet/%s/stats?chart=total&inactivityThreshold=10&order=name&period=daily&poolType=false&workers=true",
		address,
	)

	resp, err := http.Get(url)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(resp.StatusCode, "application/json", body)
}
