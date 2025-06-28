package main

import (
	"backend/database"
	"backend/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	database.InitDatabase()
	routes.SetupRoutes(r)

	r.Run(":8081")

}
