package controllers

import (
	"fmt"
	"io"
	"net/http"
	"regexp"

	"github.com/gin-gonic/gin"
)

type WalletRequest struct {
	Wallet string `json:"wallet"`
}

type WalletResponse struct {
	Wallet           string `json:"wallet"`
	ConfirmedBalance string `json:"confirmed_balance"`
}

func GetHashVaultBalance(c *gin.Context) {
	var req WalletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	balance, err := crawlHashVaultDashboard(req.Wallet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := WalletResponse{
		Wallet:           req.Wallet,
		ConfirmedBalance: balance,
	}

	c.JSON(http.StatusOK, resp)
}

func crawlHashVaultDashboard(wallet string) (string, error) {
	url := fmt.Sprintf("https://monero.hashvault.pro/en/dashboard")

	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	html := string(body)

	balance := extractConfirmedBalance(html)
	if balance == "" {
		return "", fmt.Errorf("Không tìm thấy Confirmed Balance cho ví %s", wallet)
	}

	return balance, nil
}

func extractConfirmedBalance(html string) string {
	re := regexp.MustCompile(`Confirmed Balance.*?([0-9]+\.[0-9]+)`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return match[1]
	}
	return ""
}
