package controllers

import (
	"backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ReportMinerStatus(c *gin.Context) {
	var input models.MinerStatus
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existing models.MinerStatus
	if err := models.DB.Where("name = ? AND ip_address = ?", input.Name, input.IPAddress).First(&existing).Error; err != nil {
		// ❌ Không tồn tại -> tạo mới
		if err := models.DB.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Created"})
		return
	}

	// ✅ Tồn tại -> cập nhật
	input.ID = existing.ID
	if err := models.DB.Save(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot update"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}
