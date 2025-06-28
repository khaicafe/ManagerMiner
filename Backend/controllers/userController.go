package controllers

import (
	"backend/models"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"backend/utils"
	"strconv"
	"time"
)

// CreateUser - Tạo mới một người dùng
func CreateUser(c *gin.Context) {
	var input models.User
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Kiểm tra xem mobile_number đã tồn tại chưa
	var existingUser models.User
	if err := models.DB.Where("mobile_number = ?", input.MobileNumber).First(&existingUser).Error; err == nil {
		// Nếu tìm thấy user với mobile_number đã tồn tại
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mobile number already in use"})
		return
	}

	// Sử dụng mật khẩu mặc định là "mavik"
	defaultPassword := "mavik"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(defaultPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Gán mật khẩu đã mã hóa vào user
	input.Password = string(hashedPassword)

	// Tạo user mới
	if err := models.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusOK, input)
}

// UpdateUser - Cập nhật thông tin người dùng

// UpdateUserPassword - Cập nhật mật khẩu người dùng
func UpdateUserPasswordBK(c *gin.Context) {

	var input struct {
		Name            string `json:"name" binding:"required"`
		PhoneNumber     string `json:"mobile_number" binding:"required"`
		Role            string `json:"role" binding:"required"`
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword" `
	}
	if err := c.ShouldBindJSON(&input); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Input: %+v\n", input)
	// log.Println("Request Params:", c)

	phoneNumber := c.Param("phone")

	// Tìm người dùng theo ID
	var user models.User
	if err := models.DB.Where("mobile_number = ?", phoneNumber).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found!"})
		return
	}

	if input.CurrentPassword != "" && input.NewPassword != "" {

		// Xác thực mật khẩu hiện tại
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.CurrentPassword)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
			return
		}

		// Mã hóa mật khẩu mới
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash new password"})
			return
		}

		updates := map[string]interface{}{
			"password":      string(hashedPassword),
			"name":          input.Name,        // Biến lưu tên mới
			"mobile_number": input.PhoneNumber, // biến lưu phone new
			"role":          input.Role,        // Biến lưu vai trò mới

		}
		// Cập nhật mật khẩu mới
		if err := models.DB.Model(&user).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user details"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
		return
	}
	updates := map[string]interface{}{
		"name": input.Name, // Biến lưu tên mới
		"role": input.Role, // Biến lưu vai trò mới

	}
	// Cập nhật mật khẩu mới
	if err := models.DB.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user details"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func UpdateUserPassword(c *gin.Context) {
	var input struct {
		Name            string `json:"name" binding:"required"`
		PhoneNumber     string `json:"mobile_number" binding:"required"` // Sửa chữ cái đầu thành viết hoa
		Role            string `json:"role" binding:"required"`
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}

	// Kiểm tra dữ liệu đầu vào
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Input: %+v\n", input)

	// Lấy số điện thoại hiện tại từ URL hoặc body request
	phoneNumber := c.Param("phone")

	// Tìm người dùng theo số điện thoại hiện tại
	var user models.User
	if err := models.DB.Where("mobile_number = ?", phoneNumber).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found!"})
		return
	}

	// Nếu người dùng muốn đổi mật khẩu
	if input.CurrentPassword != "" && input.NewPassword != "" {
		// Kiểm tra mật khẩu hiện tại
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.CurrentPassword)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
			return
		}

		// Mã hóa mật khẩu mới
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash new password"})
			return
		}

		// Chuẩn bị dữ liệu cập nhật
		updates := map[string]interface{}{
			"password":      string(hashedPassword),
			"name":          input.Name,
			"mobile_number": input.PhoneNumber, // Sử dụng phone mới từ input
			"role":          input.Role,
		}

		log.Printf("Updates: %+v\n", updates)

		// Cập nhật thông tin user
		if err := models.DB.Model(&user).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user details"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
		return
	}

	// Nếu không đổi mật khẩu, chỉ cập nhật thông tin khác
	updates := map[string]interface{}{
		"name":          input.Name,
		"mobile_number": input.PhoneNumber, // Cập nhật số điện thoại
		"role":          input.Role,
	}

	log.Printf("Updates: %+v\n", updates)

	// Thực hiện cập nhật
	if err := models.DB.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user details"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
}

// DeleteUser - Xóa người dùng
func DeleteUser(c *gin.Context) {
	var user models.User
	if err := models.DB.Where("id = ?", c.Param("id")).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found!"})
		return
	}

	models.DB.Delete(&user)
	c.JSON(http.StatusOK, gin.H{"data": true})
}

// FindUsers - Lấy danh sách người dùng
func FindUsers(c *gin.Context) {
	var users []models.User
	models.DB.Find(&users)
	c.JSON(http.StatusOK, users)
}

// GetAllUsers - Lấy tất cả người dùng
func GetAllUsers(c *gin.Context) {
	var users []models.User
	if err := models.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve users"})
		return
	}

	// c.JSON(http.StatusOK, gin.H{"data": users})
	c.JSON(http.StatusOK, users)
}

/////////////////// auth user //////////////////////

func Signup(c *gin.Context) {
	var input struct {
		MobileNumber string `json:"mobile_number" binding:"required"`
		Password     string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := models.DB.Where("mobile_number = ?", input.MobileNumber).First(&user).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User already exists"})
		return
	}

	otp := utils.GenerateOTP()
	// err := utils.SendOTP(input.MobileNumber, otp)
	// if err != nil {
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
	// 	return
	// }

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	user = models.User{
		MobileNumber: input.MobileNumber,
		Password:     string(hashedPassword),
		OTP:          otp,
		OTPExpiresAt: time.Now().Add(1 * time.Hour),
		ResendCount:  0,
	}
	models.DB.Create(&user)

	c.JSON(http.StatusOK, gin.H{"message": "OTP sent successfully"})
}

func SendOTP(c *gin.Context) {
	var input struct {
		MobileNumber string `json:"mobile_number" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := models.DB.Where("mobile_number = ?", input.MobileNumber).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	otp := utils.GenerateOTP()
	// err := utils.SendOTP(input.MobileNumber, otp)
	// if err != nil {
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
	// 	return
	// }

	user.OTP = otp
	user.OTPExpiresAt = time.Now().Add(1 * time.Hour)
	user.ResendCount = 0
	models.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{"message": "OTP sent successfully"})
}

func VerifySignupOTP(c *gin.Context) {
	var input struct {
		MobileNumber string `json:"mobile_number" binding:"required"`
		OTP          string `json:"otp" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := models.DB.Where("mobile_number = ?", input.MobileNumber).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if user.OTP != input.OTP || time.Now().After(user.OTPExpiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	user.OTP = ""
	user.ResendCount = 0
	models.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{"message": "User verified successfully"})
}

func ResendOTP(c *gin.Context) {
	var input struct {
		MobileNumber string `json:"mobile_number" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := models.DB.Where("mobile_number = ?", input.MobileNumber).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	resendDelay := time.Duration(1<<user.ResendCount) * time.Minute
	if time.Now().Before(user.OTPExpiresAt.Add(-resendDelay)) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You need to wait before resending OTP"})
		return
	}

	otp := utils.GenerateOTP()
	// err := utils.SendOTP(input.MobileNumber, otp)
	// if err != nil {
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
	// 	return
	// }

	user.OTP = otp
	user.OTPExpiresAt = time.Now().Add(1 * time.Hour)
	user.ResendCount++
	models.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{"message": "OTP resent successfully"})
}

func Login(c *gin.Context) {
	var input struct {
		MobileNumber string `json:"mobile_number" binding:"required"`
		Password     string `json:"password" binding:"required"`
	}
	// Ghi log thông tin về input, sau đó dừng chương trình với log.Fatal
	log.Printf("An error occurred: %+v", input)

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := models.DB.Where("mobile_number = ?", input.MobileNumber).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}

	token, err := utils.GenerateJWT(strconv.FormatUint(uint64(user.ID), 10), user.MobileNumber, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}

func ResetPassword(c *gin.Context) {
	var input struct {
		MobileNumber string `json:"mobile_number" binding:"required"`
		OTP          string `json:"otp" binding:"required"`
		NewPassword  string `json:"new_password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := models.DB.Where("mobile_number = ?", input.MobileNumber).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if user.OTP != input.OTP {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid OTP"})
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	user.Password = string(hashedPassword)
	user.OTP = ""
	models.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}
