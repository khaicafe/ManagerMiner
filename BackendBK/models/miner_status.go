package models

import (
	"time"

	"gorm.io/gorm"
)

type MinerStatus struct {
	gorm.Model
	Name            string    `json:"name"`
	IPAddress       string    `json:"ip"`
	CPUModel        string    `json:"cpu_model"` // ✅ Thêm dòng này
	CPUUsage        float64   `json:"cpu_usage"` // 👈 mới
	Hashrate        float64   `json:"hashrate"`
	Temperature     float64   `json:"temperature"`
	Uptime          int       `json:"uptime"`
	Platform        string    `json:"platform"`
	ReportedAt      time.Time `json:"reported_at"`
	Status          string    `json:"status" gorm:"-"`
	LastAcceptedLog string    `json:"last_log"`
}
