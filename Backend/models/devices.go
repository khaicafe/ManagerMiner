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
	IsMining        string    `json:"is_mining"` // ✅ mới thêm
	// Client gửi lên
	PoolURL        string `json:"pool_url"`
	PoolPort       int    `json:"pool_port"`
	WalletAddress  string `json:"wallet_address"`
	MaxThreadsHint int    `json:"max_threads_hint"`

	// Config dùng thực tế
	PoolURLConfig        string `json:"pool_url_config"`
	PoolPortConfig       int    `json:"pool_port_config"`
	WalletAddressConfig  string `json:"wallet_address_config"`
	MaxThreadsHintConfig int    `json:"max_threads_hint_config"`
}
