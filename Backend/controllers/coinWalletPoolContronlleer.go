package controllers

import (
	"errors"
	"net/http"
	"strings"

	"backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetAllCoins(c *gin.Context) {
	var coins []models.Coin

	err := models.DB.
		Preload("Pools").
		Preload("Wallets").
		Find(&coins).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, coins)
}

// hàm đang sai logic
func DeleteCoinFull(c *gin.Context) {
	coinId := c.Param("id")

	// Xóa wallets
	if err := models.DB.
		Unscoped().
		Where("coin_id = ?", coinId).
		Delete(&models.Wallet{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Xóa quan hệ many2many coin_pools
	if err := models.DB.Exec(
		"DELETE FROM coin_pools WHERE coin_id = ?", coinId).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Xóa pools không còn liên kết với coin nào
	if err := models.DB.Exec(`
		DELETE FROM pools 
		WHERE id NOT IN (SELECT pool_id FROM coin_pools)
	`).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Xóa coin
	if err := models.DB.
		Unscoped().
		Delete(&models.Coin{}, coinId).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Coin and related data deleted"})
}

func CreateCoinFull(c *gin.Context) {
	var req struct {
		CoinName string `json:"coinName"`
		Pool     struct {
			Name string `json:"name"`
			Url  string `json:"url"`
			Port int    `json:"port"`
		} `json:"pool"`
		Wallet struct {
			Name    string `json:"name"`
			Address string `json:"address"`
		} `json:"wallet"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Bắt đầu transaction
	tx := models.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var coin models.Coin
	// ---- Check Coin ----
	err := tx.Where("name = ?", req.CoinName).First(&coin).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Chưa tồn tại → tạo mới
			coin = models.Coin{Name: req.CoinName}
			if err := tx.Create(&coin).Error; err != nil {
				if strings.Contains(err.Error(), "Duplicate entry") {
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": "Coin name must be unique"})
					return
				}
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// ---- Check Pool ----
	var pool models.Pool
	err = tx.Where("name = ?", req.Pool.Name).First(&pool).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Tạo mới Pool
			pool = models.Pool{
				Name:        req.Pool.Name,
				URL:         req.Pool.Url,
				Port:        req.Pool.Port,
				EnableTLS:   true,
				Description: req.Pool.Name,
			}
			if err := tx.Create(&pool).Error; err != nil {
				if strings.Contains(err.Error(), "Duplicate entry") {
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": "Pool name must be unique"})
					return
				}
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// ---- Gắn quan hệ Coin-Pool ----
	// Check nếu đã tồn tại relation, tránh duplicate
	var cnt int64
	tx.Table("coin_pools").
		Where("coin_id = ? AND pool_id = ?", coin.ID, pool.ID).
		Count(&cnt)
	if cnt == 0 {
		if err := tx.Model(&coin).Association("Pools").Append(&pool); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// ---- Check Wallet ----
	var wallet models.Wallet
	err = tx.Where("address = ?", req.Wallet.Address).First(&wallet).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Tạo mới wallet
			wallet = models.Wallet{
				Name:    req.Wallet.Name,
				Address: req.Wallet.Address,
				CoinID:  coin.ID,
			}
			if err := tx.Create(&wallet).Error; err != nil {
				if strings.Contains(err.Error(), "Duplicate entry") {
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet address must be unique"})
					return
				}
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		// Wallet tồn tại → kiểm tra cùng Coin hay không
		if wallet.CoinID != coin.ID {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet address belongs to another coin"})
			return
		}
	}

	// Commit transaction nếu mọi thứ OK
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Coin, Pool, Wallet created or linked successfully",
		"coinId":   coin.ID,
		"poolId":   pool.ID,
		"walletId": wallet.ID,
	})
}

func UpdateCoinFull(c *gin.Context) {
	coinId := c.Param("id")

	var req struct {
		CoinName string `json:"coinName"`
		Pool     struct {
			ID   uint   `json:"id"`
			Name string `json:"name"`
			Url  string `json:"url"`
			Port int    `json:"port"`
		} `json:"pool"`
		Wallet struct {
			ID      uint   `json:"id"`
			Name    string `json:"name"`
			Address string `json:"address"`
		} `json:"wallet"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// START TRANSACTION
	tx := models.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// ========================
	// COIN
	// ========================
	var coin models.Coin
	if err := tx.First(&coin, coinId).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Coin not found"})
		return
	}

	if coin.Name != req.CoinName {
		// Check trùng tên
		var existCoin models.Coin
		err := tx.Where("name = ? AND id <> ?", req.CoinName, coin.ID).First(&existCoin).Error
		if err == nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Coin name already exists"})
			return
		}
		coin.Name = req.CoinName
		if err := tx.Save(&coin).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// ========================
	// POOL
	// ========================
	if req.Pool.ID > 0 {
		var pool models.Pool
		if err := tx.First(&pool, req.Pool.ID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"error": "Pool not found"})
			return
		}

		needUpdate := false

		if pool.Name != req.Pool.Name {
			// Check trùng pool name
			var existPool models.Pool
			err := tx.Where("name = ? AND id <> ?", req.Pool.Name, pool.ID).First(&existPool).Error
			if err == nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": "Pool name already exists"})
				return
			}
			pool.Name = req.Pool.Name
			needUpdate = true
		}
		if pool.URL != req.Pool.Url {
			pool.URL = req.Pool.Url
			needUpdate = true
		}
		if pool.Port != req.Pool.Port {
			pool.Port = req.Pool.Port
			needUpdate = true
		}

		if needUpdate {
			if err := tx.Save(&pool).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	// ========================
	// WALLET
	// ========================
	if req.Wallet.ID > 0 {
		var wallet models.Wallet
		if err := tx.First(&wallet, req.Wallet.ID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
			return
		}

		needUpdate := false

		if wallet.Name != req.Wallet.Name {
			wallet.Name = req.Wallet.Name
			needUpdate = true
		}

		if wallet.Address != req.Wallet.Address {
			// Check duplicate address
			var count int64
			tx.Model(&models.Wallet{}).
				Where("address = ? AND id <> ?", req.Wallet.Address, wallet.ID).
				Count(&count)

			if count > 0 {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet address already exists"})
				return
			}
			wallet.Address = req.Wallet.Address
			needUpdate = true
		}

		if needUpdate {
			if err := tx.Save(&wallet).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	// COMMIT nếu không lỗi
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Coin, Pool, Wallet updated successfully",
	})
}
