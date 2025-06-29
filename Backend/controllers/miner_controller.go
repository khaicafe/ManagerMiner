package controllers

import (
	"backend/models"
	"backend/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func GetAllMiners(c *gin.Context) {
	var miners []models.MinerStatus

	// Lấy các bản ghi mới nhất mỗi miner (theo Name)
	err := models.DB.
		Raw(`
			SELECT * FROM miner_statuses m1
			WHERE m1.id = (
				SELECT MAX(m2.id)
				FROM miner_statuses m2
				WHERE m2.name = m1.name
			)
			ORDER BY m1.reported_at DESC
		`).Scan(&miners).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "models error"})
		return
	}

	c.JSON(http.StatusOK, miners)
}

func UpdateMinersList(c *gin.Context) {
	var payload []struct {
		ID             uint   `json:"id"`
		PoolURL        string `json:"pool_url"`
		PoolPort       int    `json:"pool_port"`
		WalletAddress  string `json:"wallet_address"`
		MaxThreadsHint int    `json:"max_threads_hint"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := models.DB.Begin()

	var updatedDeviceIDs []string

	for _, minerData := range payload {
		var miner models.MinerStatus
		err := tx.First(&miner, minerData.ID).Error
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{
				"error": fmt.Sprintf("Miner ID %d not found", minerData.ID),
			})
			return
		}

		// Update 4 field gốc
		miner.PoolURL = minerData.PoolURL
		miner.PoolPort = minerData.PoolPort
		miner.WalletAddress = minerData.WalletAddress
		miner.MaxThreadsHint = minerData.MaxThreadsHint

		// Ghi đè field config từ client gửi lên
		miner.PoolURLConfig = minerData.PoolURL
		miner.PoolPortConfig = minerData.PoolPort
		miner.WalletAddressConfig = minerData.WalletAddress
		miner.MaxThreadsHintConfig = minerData.MaxThreadsHint

		if err := tx.Save(&miner).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Thu thập deviceID (không trùng)
		if miner.DeviceID != "" {
			updatedDeviceIDs = append(updatedDeviceIDs, miner.DeviceID)
		}
	}

	tx.Commit()

	// Loại bỏ deviceID trùng lặp
	uniqueDeviceIDs := make(map[string]bool)
	var userIDs []string
	for _, id := range updatedDeviceIDs {
		if !uniqueDeviceIDs[id] {
			uniqueDeviceIDs[id] = true
			userIDs = append(userIDs, id)
		}
	}

	if len(userIDs) > 0 {
		utils.NotifyNewToUsers(userIDs, "update_config")
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated miners successfully"})
}

type MinerDevice struct {
	DeviceID string `json:"deviceID"`
}

func StartMining(c *gin.Context) {
	var req []MinerDevice

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var userIDs []string
	for _, miner := range req {
		userIDs = append(userIDs, miner.DeviceID)
		models.DB.Model(&models.MinerStatus{}).
			Where("device_id = ?", miner.DeviceID).
			Update("is_mining", "Running")
	}

	if len(req) > 0 {
		utils.NotifyNewToUsers(userIDs, "start_miner")
	}
}

func StopMining(c *gin.Context) {
	var req []MinerDevice

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userIDs []string
	for _, miner := range req {
		userIDs = append(userIDs, miner.DeviceID)
		models.DB.Model(&models.MinerStatus{}).
			Where("device_id = ?", miner.DeviceID).
			Update("is_mining", "Stopped")
	}

	if len(req) > 0 {
		utils.NotifyNewToUsers(userIDs, "stop_miner")
	}
}

type UpdateMaxHintRequest struct {
	DeviceID       string `json:"deviceID"`
	MaxThreadsHint int    `json:"max_threads_hint"`
}

func UpdateMaxHint(c *gin.Context) {
	var req UpdateMaxHintRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fmt.Printf("🔔 Received UpdateMaxHintRequest: %+v\n", req)

	var miner models.MinerStatus
	if err := models.DB.Where("device_id = ?", req.DeviceID).First(&miner).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Miner not found",
		})
		return
	}

	miner.MaxThreadsHint = req.MaxThreadsHint
	miner.MaxThreadsHintConfig = req.MaxThreadsHint
	if err := models.DB.Save(&miner).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update max_threads_hint",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Updated max_threads_hint successfully",
	})
}

//////////////////////////////

type ConfigUpdateRequest struct {
	RXThreads  []int `json:"rx_threads"`
	Priority   int   `json:"priority"`
	Background bool  `json:"background"`
}

//	{
//	  "rx_threads": [0, 2, 4],
//	  "priority": 5,
//	  "background": true
//	}
func UpdateXMRigConfig(c *gin.Context) {
	var req ConfigUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	configPath := "./xmrig/config.json"
	data, err := os.ReadFile(configPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read config"})
		return
	}

	var config map[string]interface{}
	if err := json.Unmarshal(data, &config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid JSON"})
		return
	}

	// Cập nhật các giá trị
	cpu := config["cpu"].(map[string]interface{})
	cpu["rx"] = req.RXThreads
	cpu["priority"] = req.Priority
	cpu["yield"] = true
	config["background"] = req.Background

	// Ghi lại file
	updatedData, _ := json.MarshalIndent(config, "", "  ")
	if err := os.WriteFile(configPath, updatedData, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write config"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Config updated. Please restart XMRig manually."})
}
