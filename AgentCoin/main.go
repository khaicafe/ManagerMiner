package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
)

type Config struct {
	ServerURL   string `json:"server_url"`
	AccessToken string `json:"access_token"`
	MinerName   string `json:"miner_name"`
	Interval    int    `json:"interval_seconds"`
	XMRigAPI    string `json:"xmrig_api"`
}

type MinerStatus struct {
	Name            string  `json:"name"`
	IPAddress       string  `json:"ip"`
	Hashrate        float64 `json:"hashrate"`
	Temperature     float64 `json:"temperature"`
	Uptime          int     `json:"uptime"`
	Platform        string  `json:"platform"`
	LastAcceptedLog string  `json:"last_log"`  // ✅ Thêm dòng này
	CPUModel        string  `json:"cpu_model"` // ✅ Thêm dòng này
	CPUUsage        float64 `json:"cpu_usage"` // 👈 mới
}

func loadConfig() (*Config, error) {
	data, err := ioutil.ReadFile("config.json")

	if err != nil {
		return nil, err
	}
	var config Config
	err = json.Unmarshal(data, &config)
	return &config, err
}

func getXMRigStatus(apiURL, token string) (*MinerStatus, error) {
	req, err := http.NewRequest("GET", apiURL+"/1/summary", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// ✅ Đọc body 1 lần duy nhất
	body, _ := io.ReadAll(resp.Body)
	fmt.Println("🔍 Raw XMRig Response:", string(body))

	// ✅ Parse JSON từ biến body (KHÔNG dùng resp.Body nữa)
	var data struct {
		Hashrate struct {
			Total   []float64   `json:"total"`
			Threads [][]float64 `json:"threads"` // 👈 lấy thêm threads
		} `json:"hashrate"`
		Uptime int `json:"uptime"`
		CPU    struct {
			Brand string `json:"brand"`
		} `json:"cpu"`
	}

	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}

	hashrate := 0.0
	if len(data.Hashrate.Total) > 0 {
		hashrate = data.Hashrate.Total[0]
	}

	load, err := getCPULoadPercent()

	ip, err := getPublicIP()
	if err != nil {
		ip = "unknown"
	}

	temp, err := getCPUTemperature()
	if err != nil {
		fmt.Println("❌ Cannot get CPU temp:", err)
		temp = 0
	}
	fmt.Println("🌡️ CPU Temp:", temp)

	return &MinerStatus{
		Name:            "YourMinerName",
		IPAddress:       ip,
		Hashrate:        hashrate,
		Temperature:     temp, // 👈 gọi trực tiếp
		Uptime:          data.Uptime,
		Platform:        getPlatform(),
		LastAcceptedLog: readLastLogLine("xmrig.log"), // 👈 gọi đúng chỗ
		CPUModel:        data.CPU.Brand,               // ✅ mới thêm
		CPUUsage:        load,                         // ✅ gán vào đây
	}, nil
}

func sendStatus(config *Config, status *MinerStatus) error {
	status.Name = config.MinerName
	status.Platform = getPlatform()

	payload, _ := json.Marshal(status)
	req, _ := http.NewRequest("POST", config.ServerURL, bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.AccessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	fmt.Println("✅ Reported status successfully")
	return nil
}

func getPublicIP() (string, error) {
	resp, err := http.Get("https://api.ipify.org")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return strings.TrimSpace(string(body)), nil
}

func getPlatform() string {
	return fmt.Sprintf("%s-%s", runtime.GOOS, runtime.GOARCH)
}

func getCPULoadPercent() (float64, error) {
	percentages, err := cpu.Percent(time.Second, false) // false = tổng toàn hệ thống
	if err != nil || len(percentages) == 0 {
		return 0, err
	}
	return percentages[0], nil
}

func getCPUTemperature() (float64, error) {
	// ✅ Kiểm tra xem đã có lệnh osx-cpu-temp chưa
	_, err := exec.LookPath("osx-cpu-temp")
	if err != nil {
		fmt.Println("🔧 osx-cpu-temp chưa được cài, đang tiến hành cài đặt...")

		// ✅ Cài đặt bằng brew nếu chưa có
		installCmd := exec.Command("brew", "install", "osx-cpu-temp")
		var installOut bytes.Buffer
		installCmd.Stdout = &installOut
		installCmd.Stderr = &installOut

		if err := installCmd.Run(); err != nil {
			return 0, fmt.Errorf("❌ Lỗi khi cài đặt osx-cpu-temp: %v", err)
		}
		fmt.Println("✅ Đã cài xong osx-cpu-temp")
	}

	// ✅ Gọi lệnh để lấy nhiệt độ
	cmd := exec.Command("osx-cpu-temp")
	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("❌ Không thể lấy nhiệt độ CPU: %v", err)
	}

	// ✅ Parse kết quả, ví dụ: "58.5°C\n"
	tempStr := strings.TrimSpace(string(output))
	tempStr = strings.TrimSuffix(tempStr, "°C")
	temp, err := strconv.ParseFloat(tempStr, 64)
	if err != nil {
		return 0, fmt.Errorf("❌ Lỗi khi parse nhiệt độ: %v", err)
	}

	return temp, nil
}

func readLastLogLine(path string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		return "log unavailable"
	}

	lines := strings.Split(string(data), "\n")
	for i := len(lines) - 1; i >= 0; i-- {
		if strings.Contains(lines[i], "accepted") {
			return lines[i]
		}
	}
	return "no accepted log"
}

func killXMRig() error {
	cmd := exec.Command("pkill", "-f", "xmrig") // dùng -f để match full command line
	return cmd.Run()
}

func restartXMRig() error {
	if err := killXMRig(); err != nil {
		log.Printf("⚠️ Failed to kill xmrig: %v", err)
	}

	cmd := exec.Command("./xmrig/xmrig", "-c", "./xmrig/config.json")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Dir = "."

	return cmd.Start() // hoặc cmd.Run() nếu muốn block
}

func main() {

	go func() {
		time.Sleep(2 * time.Second) // chờ file config ổn định
		if err := restartXMRig(); err != nil {
			log.Printf("❌ Failed to restart XMRig: %v", err)
		} else {
			log.Println("✅ XMRig restarted successfully")
		}
	}()

	config, err := loadConfig()
	if err != nil {
		fmt.Println("❌ Failed to load config:", err)
		return
	}

	for {
		status, err := getXMRigStatus(config.XMRigAPI, config.AccessToken)

		if err != nil {
			fmt.Println("⚠️ Failed to get XMRig status:", err)
		} else {
			sendStatus(config, status)
		}
		time.Sleep(time.Duration(config.Interval) * time.Second)
	}
}
