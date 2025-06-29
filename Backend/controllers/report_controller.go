package controllers

import (
	"backend/models"
	"backend/utils"
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func ReportMinerStatus(c *gin.Context) {
	var input models.MinerStatus
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var existing models.MinerStatus
	if err := models.DB.Where("device_id = ? ", input.DeviceID).First(&existing).Error; err != nil {
		// ❌ Không tồn tại -> tạo mới
		if err := models.DB.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Created"})
		return
	}
	// Update các field client gửi lên (nhưng KHÔNG update config)
	input.PoolURLConfig = existing.PoolURLConfig
	input.PoolPortConfig = existing.PoolPortConfig
	input.WalletAddressConfig = existing.WalletAddressConfig
	input.MaxThreadsHintConfig = existing.MaxThreadsHintConfig

	// ✅ Tồn tại -> kiểm tra xem có khác config không
	needNotify := false

	if input.PoolURL != existing.PoolURLConfig {
		log.Printf("[Notify] PoolURL changed: old='%s' new='%s'\n", existing.PoolURLConfig, input.PoolURL)
		needNotify = true
	}

	if input.PoolPort != existing.PoolPortConfig {
		log.Printf("[Notify] PoolPort changed: old=%d new=%d\n", existing.PoolPortConfig, input.PoolPort)
		needNotify = true
	}

	if input.WalletAddress != existing.WalletAddressConfig {
		log.Printf("[Notify] WalletAddress changed: old='%s' new='%s'\n", existing.WalletAddressConfig, input.WalletAddress)
		needNotify = true
	}

	if input.MaxThreadsHint != existing.MaxThreadsHintConfig {
		log.Printf("[Notify] MaxThreadsHint changed: old=%d new=%d\n", existing.MaxThreadsHintConfig, input.MaxThreadsHint)
		needNotify = true
	}

	// ✅ Tồn tại -> cập nhật
	input.ID = existing.ID
	if err := models.DB.Save(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot update"})
		return
	}

	if needNotify {
		log.Printf("Miner %s config changed → notify update_config", input.DeviceID)
		utils.NotifyNewToUsers([]string{input.DeviceID}, "update_config")
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}

func UpdateMiningStatus(deviceID string, isMining bool) error {
	result := models.DB.Model(&models.MinerStatus{}).
		Where("device_id = ?", deviceID).
		Update("is_mining", isMining)

	return result.Error
}

func GetMinerConfig(c *gin.Context) {
	deviceID := c.Param("deviceID")

	var miner models.MinerStatus
	err := models.DB.Where("device_id = ?", deviceID).First(&miner).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Miner not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pool_url_config":         miner.PoolURLConfig,
		"pool_port_config":        miner.PoolPortConfig,
		"wallet_address_config":   miner.WalletAddressConfig,
		"max_threads_hint_config": miner.MaxThreadsHintConfig,
	})
}
