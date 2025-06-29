package models

import (
	"gorm.io/gorm"
)

type Pool struct {
	gorm.Model
	Name        string `gorm:"unique;not null" json:"name"`
	URL         string `json:"url"`
	Port        int    `json:"port"`
	EnableTLS   bool   `json:"enable_tls"`
	Description string `json:"description"`
}

type Coin struct {
	gorm.Model
	Name    string   `gorm:"unique;not null" json:"name"`
	Pools   []Pool   `json:"pools" gorm:"many2many:coin_pools;"`
	Wallets []Wallet `json:"wallets" gorm:"foreignKey:CoinID"`
}

type Wallet struct {
	gorm.Model
	Name         string `json:"name"`
	Address      string `gorm:"unique;not null" json:"address"`
	ExchangeName string `json:"exchange_name"`
	ExchangePass string `json:"exchange_pass"`
	PassWallet   string `json:"pass_wallet"`
	CoinID       uint   `json:"coin_id"`
	Coin         Coin   `json:"coin" gorm:"foreignKey:CoinID;references:ID"`
}
