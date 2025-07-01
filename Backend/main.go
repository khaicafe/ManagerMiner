package main

import (
	"backend/models"
	"backend/routes"
	"backend/utils"
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"
	"github.com/kardianos/service"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var logger service.Logger
var socketServer *socketio.Server

type program struct{}

func (p *program) Start(s service.Service) error {
	go p.run()
	return nil
}

func (p *program) run() {
	fmt.Println("Service is running...")

	DB, err := gorm.Open(sqlite.Open("./db/data.db?_busy_timeout=5000"), &gorm.Config{})
	if err != nil {
		panic("failed to connect to database")
	}
	err = DB.Exec("PRAGMA journal_mode=WAL;").Error
	if err != nil {
		log.Fatalf("failed to enable WAL mode: %v", err)
	}

	DB.AutoMigrate(
		&models.User{},
		&models.MinerStatus{},
		&models.Pool{},
		&models.Coin{},
		&models.Wallet{},
	)

	models.DB = DB
	models.SeedDefaultData(DB)

	WEBSOCKET_PATH := "/api/socket-io/"
	r := routes.SetupRouter()

	socketServer, err = utils.InitSocketServer()
	if err != nil {
		log.Fatal("Socket.IO initialization failed:", err)
	}

	r.GET(WEBSOCKET_PATH+"*any", gin.WrapH(socketServer))
	r.POST(WEBSOCKET_PATH+"*any", gin.WrapH(socketServer))

	go func() {
		if err := socketServer.Serve(); err != nil {
			log.Fatalf("SocketIO listen error: %s\n", err)
		}
	}()
	defer socketServer.Close()

	err = r.Run(":8080")
	if err != nil {
		log.Fatal(err)
	}
}

func (p *program) Stop(s service.Service) error {
	fmt.Println("Service stopping...")
	if socketServer != nil {
		socketServer.Close()
	}
	return nil
}

func main() {
	svcConfig := &service.Config{
		Name:        "AgentServer",
		DisplayName: "Agent Server Service",
		Description: "Agent Server runs the Monero mining manager backend.",
	}

	prg := &program{}
	s, err := service.New(prg, svcConfig)
	if err != nil {
		log.Fatal(err)
	}

	logger, err = s.Logger(nil)
	if err != nil {
		log.Fatal(err)
	}

	if len(os.Args) > 1 {
		if os.Args[1] == "dev" {
			prg.run()
			return
		}
		err := service.Control(s, os.Args[1])
		if err != nil {
			log.Fatalf("Valid actions: install, uninstall, start, stop, restart, dev. Error: %s", err)
		}
		return
	}

	err = s.Run()
	if err != nil {
		logger.Error(err)
	}
}
