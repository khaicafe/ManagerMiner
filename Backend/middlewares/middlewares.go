package middlewares

import (
	"backend/utils"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			//c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			//c.Abort()
			// log.Println("No Authorization header")
			c.Next()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		// log.Printf("authHeader:%v (type: %T) \n", authHeader, authHeader)
		// log.Printf("Token:%v (type: %T) \n", tokenString, tokenString)
		claims := &utils.Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return utils.GetJWTKey(), nil
		})

		if err != nil || !token.Valid {
			log.Println("Invalid token")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid token"})
			c.Abort()
			// c.Next()
			return
		}

		c.Set("mobile_number", claims.MobileNumber)
		c.Set("role", claims.Role)
		c.Set("customer_id", claims.CustomerID)
		log.Println("Role:", claims.Role)
		log.Println("Mobile Number:", claims.MobileNumber)
		log.Println("Customer ID:", claims.CustomerID)
		c.Next()
	}
}
