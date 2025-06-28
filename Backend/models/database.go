package models

import (
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB
