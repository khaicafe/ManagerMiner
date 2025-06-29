package models

import (
	"time"

	"gorm.io/gorm"
)

type MinerStatus struct {
	gorm.Model
	Name            string    `json:"name"`
	DeviceID        string    `json:"deviceID"`
	Worker          string    `json:"worker"`
	IPAddress       string    `json:"ip"`
	CPUModel        string    `json:"cpu_model"` // ✅ Thêm dòng này
	CPUUsage        float64   `json:"cpu_usage"` // 👈 mới
	Hashrate        float64   `json:"hashrate"`
	Threads         int       `json:"threads"`
	Temperature     float64   `json:"temperature"`
	Uptime          string    `json:"uptime"`
	Platform        string    `json:"platform"`
	ReportedAt      time.Time `json:"reported_at"`
	Status          bool      `json:"status"`
	LastAcceptedLog string    `json:"last_log"`
}
