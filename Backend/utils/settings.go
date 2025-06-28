package utils

// func GetIntSetting(key string, defaultVal int) int {
// 	var s models.Setting
// 	if err := models.DB.Where("key = ?", key).First(&s).Error; err != nil {
// 		return defaultVal
// 	}
// 	val, err := strconv.Atoi(s.Value)
// 	if err != nil {
// 		return defaultVal
// 	}
// 	return val
// }

// func GetDurationSetting(key string, defaultVal time.Duration) time.Duration {
// 	val := GetIntSetting(key, int(defaultVal.Seconds()))
// 	return time.Duration(val) * time.Second
// }
