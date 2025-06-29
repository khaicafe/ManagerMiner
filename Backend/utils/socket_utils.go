package utils

import (
	"backend/models"
	"fmt"
	"log"
	"sync"

	socketio "github.com/googollee/go-socket.io"
)

var SocketServer *socketio.Server

type Notification struct {
	ID      string `json:"id"`
	Content string `json:"content"`
}

var (
	notifications = make(map[string][]Notification)           // Stores notifications per user ID
	userSockets   = make(map[string]map[string]socketio.Conn) // Stores multiple socket connections per user ID
	mu            sync.Mutex
)

// InitSocketServer initializes the Socket.IO server
func InitSocketServer() (*socketio.Server, error) {
	SocketServer = socketio.NewServer(nil)

	// On client connection
	SocketServer.OnConnect("/", func(s socketio.Conn) error {
		log.Println("Client connected:", s.ID())
		s.SetContext("") // Initial context is empty
		return nil
	})

	// On registering a user
	SocketServer.OnEvent("/", "registerUser", func(s socketio.Conn, userID string) {
		mu.Lock()
		if userSockets[userID] == nil {
			userSockets[userID] = make(map[string]socketio.Conn)
		}
		userSockets[userID][s.ID()] = s // Store the socket connection under the user ID and socket ID
		s.SetContext(userID)            // Store the user ID in the socket's context
		mu.Unlock()

		// Handle reconnected notifications
		handleClientReconnect(userID, s)
		log.Println("✅ User registered:", userID, "with socket ID:", s.ID())

		// ghi nhận trạng thái status
		err := updateMinerStatus(userID, true)
		if err != nil {
			log.Println("Error updating online status:", err)
		} else {
			log.Println("✅ Device", userID, "is Online")
		}
	})

	// On receiving a notification from a client
	SocketServer.OnEvent("/", "notification_Client", func(s socketio.Conn, data map[string]interface{}) {
		log.Println("Received notification from client:", data)

		if message, ok := data["message"].(string); ok {
			log.Println("Message content:", message)

			// Notify specific users (example: POS users)
			userIDs := []string{"POS"}
			NotifyNewToUsers(userIDs, "notify_kitchen")
		} else {
			log.Println("Invalid data format from client")
		}
	})

	// On client disconnection
	SocketServer.OnDisconnect("/", func(s socketio.Conn, reason string) {
		userID, ok := s.Context().(string)
		if !ok {
			log.Println("Could not get userID from context")
			return
		}

		log.Println("Client disconnected:", s.ID(), "User:", userID, "Reason:", reason)

		mu.Lock()
		if sockets, exists := userSockets[userID]; exists {
			delete(sockets, s.ID()) // Remove this specific socket connection
			if len(sockets) == 0 {
				delete(userSockets, userID) // Remove the user if no sockets remain
			}
		}
		mu.Unlock()

		// ghi nhận trạng thái status
		err := updateMinerStatus(userID, false)
		if err != nil {
			log.Println("Error updating offline status:", err)
		} else {
			log.Println("✅ Device", userID, "is OFFLINE")
		}

		fmt.Println("User disconnected:", userID, "Socket:", s.ID())
	})

	return SocketServer, nil
}

// Hàm để gửi thông báo đến tất cả client
func BroadcastToAll(event string, data interface{}) {
	SocketServer.BroadcastToRoom("/", "orders", "new_order", data)
}

// NotifyUser sends a notification to all active connections of a user
// and ensures that notifications[userID] retains a fixed length.
func NotifyUser(userID string, notification Notification) {
	const maxNotifications = 10 // Set the fixed length of the notifications array

	mu.Lock()
	defer mu.Unlock()

	// Check if the user has active connections
	if sockets, ok := userSockets[userID]; ok {
		for _, socket := range sockets {
			socket.Emit("notification", notification)
		}
		log.Println("✅ Notification sent to user:", userID)
	} else {
		// Save the notification if the user is not connected
		notifications[userID] = append(notifications[userID], notification)

		// Trim the notifications array to the fixed length
		if len(notifications[userID]) > maxNotifications {
			notifications[userID] = notifications[userID][len(notifications[userID])-maxNotifications:]
		}

		log.Println("❌ User not connected. Notification saved for user:", userID)
	}
}

// NotifyNewToUsers sends a notification to multiple users
func NotifyNewToUsers(userIDs []string, content string) {
	for _, userID := range userIDs {
		notification := Notification{
			ID:      userID, // Or generate a unique ID
			Content: content,
		}
		// Gửi thông báo cho user
		// NotifyUser(userID, notification)
		go func() {
			NotifyUser(userID, notification)
		}()
	}
}

// HandleClientReconnect handles resending saved notifications when a client reconnects
func handleClientReconnect(userID string, s socketio.Conn) {
	mu.Lock()
	defer mu.Unlock()

	if notif, exists := notifications[userID]; exists {
		uniqueNotifications := make(map[string]Notification)
		for _, notification := range notif {
			uniqueNotifications[notification.Content] = notification
		}

		for _, uniqueNotification := range uniqueNotifications {
			s.Emit("notification", uniqueNotification)
		}
		delete(notifications, userID) // Clear notifications after sending
	}
}

func updateMinerStatus(deviceID string, online bool) error {
	result := models.DB.Model(&models.MinerStatus{}).
		Where("device_id = ?", deviceID).
		Update("status", online)

	return result.Error
}
