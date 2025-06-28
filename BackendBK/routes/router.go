package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	r.POST("/api/report", controllers.ReportMinerStatus)
	r.GET("/api/miners", controllers.GetAllMiners)

}
