package controllers

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func GetAllMiners(c *gin.Context) {
	var miners []models.MinerStatus

	// Lấy các bản ghi mới nhất mỗi miner (theo Name)
	err := database.DB.
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Lọc thêm trạng thái online nếu muốn
	for i := range miners {
		if time.Since(miners[i].ReportedAt) < 90*time.Second {
			miners[i].Status = "online"
		} else {
			miners[i].Status = "offline"
		}
	}

	c.JSON(http.StatusOK, miners)
}

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
