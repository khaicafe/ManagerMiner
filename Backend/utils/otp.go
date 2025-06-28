package utils

import (
	"fmt"
	"math/rand"
	"time"
)

func GenerateOTP() string {
	rand.Seed(time.Now().UnixNano())
	otp := rand.Intn(899999) + 100000 // Generate a 6-digit OTP
	return fmt.Sprintf("%06d", otp)
}
