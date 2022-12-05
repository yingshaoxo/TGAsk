package database

import (
	"errors"
	"log"

	"github.com/yingshaoxo/gopython/string_tool"
	"github.com/yingshaoxo/gopython/time_tool"

	// "gorm.io/driver/sqlite"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type NewUserRecord struct {
	gorm.Model
	Chat_id       string
	User_id       string
	Verified      bool
	Register_time string //timestamp, 10 digits

	// User_id       string `gorm:"column:user_id"`
	// Verified      bool   `gorm:"column:verified"`
	// Register_time string `gorm:"column:register_time"` //timestamp
}

func Init_database(sqlite_file_path string) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(sqlite_file_path), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	db.AutoMigrate(&NewUserRecord{})
	return db
}

func Delete_new_user_record_table(db *gorm.DB) error {
	err := db.Migrator().DropTable(&NewUserRecord{})
	return err
}

func Add_a_new_user_record(db *gorm.DB, chat_id string, user_id string, verified bool) error {
	_, err := Get_a_user_record(db, chat_id, user_id)
	if err == nil {
		return errors.New("user exists")
	}

	current_time := time_tool.Get_current_time_as_timestamp()
	timestamp_string := string_tool.Int64_to_string(current_time)
	user := NewUserRecord{Chat_id: chat_id, User_id: user_id, Verified: verified, Register_time: timestamp_string}
	operation_result := db.Create(&user)
	return operation_result.Error
}

func Get_a_user_record(db *gorm.DB, chat_id string, user_id string) (NewUserRecord, error) {
	var users []NewUserRecord
	operation_result := db.Where("Chat_id = ? AND User_id = ?", chat_id, user_id).Find(&users) // find product with code D42
	if operation_result.Error != nil {
		log.Println(operation_result.Error.Error())
	}

	if len(users) == 0 {
		return NewUserRecord{}, errors.New("not found")
	}

	return users[0], nil
}

func Get_unverified_users_record(db *gorm.DB) []NewUserRecord {
	var user_list []NewUserRecord

	operation_result := db.Where("Verified = ?", false).Find(&user_list)

	if operation_result.Error != nil {
		log.Println(operation_result.Error)
	}

	return user_list
}

// func Does_user_legal(db *gorm.DB, id string) bool {
// 	a_user, err := Get_a_user(db, id)

// 	if err != nil {
// 		return false
// 	}

// 	if a_user.Verified == true {
// 		return true
// 	} else {
// 		return false
// 	}
// }

func Confirm_a_user_record(db *gorm.DB, chat_id string, user_id string) error {
	a_user, err := Get_a_user_record(db, chat_id, user_id)

	if err != nil {
		return err
	}

	a_user.Verified = true
	db.Save(&a_user)

	/*
		db.Model(&a_user).Update("Verified", true)
	*/

	return nil
}

func Delete_a_user_record(db *gorm.DB, chat_id string, user_id string) error {
	a_user, err := Get_a_user_record(db, chat_id, user_id)

	if err != nil {
		return err
	}

	// db.Delete(&a_user)
	db.Unscoped().Delete(&a_user)

	return nil
}
