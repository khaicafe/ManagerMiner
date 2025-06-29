package controllers

import (
	"net/http"

	"backend/models"

	"github.com/gin-gonic/gin"
)

func GetCoins(c *gin.Context) {
	var coins []models.Coin
	if err := models.DB.Preload("Pools").Find(&coins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, coins)
}

func GetCoin(c *gin.Context) {
	id := c.Param("id")
	var coin models.Coin
	if err := models.DB.Preload("Pools").First(&coin, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Coin not found"})
		return
	}
	c.JSON(http.StatusOK, coin)
}

func CreateCoin(c *gin.Context) {
	var coin models.Coin
	if err := c.ShouldBindJSON(&coin); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := models.DB.Create(&coin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, coin)
}

func UpdateCoin(c *gin.Context) {
	id := c.Param("id")
	var coin models.Coin
	if err := models.DB.First(&coin, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Coin not found"})
		return
	}
	if err := c.ShouldBindJSON(&coin); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := models.DB.Save(&coin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, coin)
}

func DeleteCoin(c *gin.Context) {
	id := c.Param("id")
	if err := models.DB.Delete(&models.Coin{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
