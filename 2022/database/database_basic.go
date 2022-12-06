package database

import (
	"errors"
	"fmt"
	"log"

	"github.com/yingshaoxo/gopython/string_tool"
	"github.com/yingshaoxo/gopython/time_tool"

	// "gorm.io/driver/sqlite"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

type NewUserRecord struct {
	gorm.Model
	Chat_id       string
	User_id       string
	Verified      bool
	Register_time string //timestamp, 10 digits, actually represents seconds
}

type TemporaryMessageRecord struct {
	gorm.Model
	Message_id string
	Chat_id    string
	User_id    string
}

func Init_database(sqlite_file_path string) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(sqlite_file_path), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "",   // table name prefix, table for `User` would be `t_users`
			SingularTable: true, // use singular table name, table for `User` would be `user` with this option enabled
			NoLowerCase:   false,
			// NameReplacer:  strings.NewReplacer("CID", "Cid"), // use name replacer to change struct/field name before convert it to db name
		},
	})
	if err != nil {
		panic("failed to connect database")
	}
	db.AutoMigrate(&NewUserRecord{})
	db.AutoMigrate(&TemporaryMessageRecord{})
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

func Save_temporary_message_if_it_is_in_the_old_user_record_table(db *gorm.DB, message_id string, chat_id string, user_id string) bool {
	_, err := Get_a_user_record(db, chat_id, user_id)
	if err != nil {
		// not found
		return false
	}

	_, err = Get_a_temporary_message(db, message_id, chat_id, user_id)
	if err == nil {
		// found
		return false
	}

	a_message := TemporaryMessageRecord{Message_id: message_id, Chat_id: chat_id, User_id: user_id}
	operation_result := db.Create(&a_message)

	if operation_result.Error == nil {
		return true
	} else {
		return false
	}
}

func Get_a_temporary_message(db *gorm.DB, message_id string, chat_id string, user_id string) (TemporaryMessageRecord, error) {
	var temporary_messages []TemporaryMessageRecord

	operation_result := db.Where("Message_id = ? AND Chat_id = ? AND User_id = ?", message_id, chat_id, user_id).Find(&temporary_messages)
	if operation_result.Error != nil {
		return TemporaryMessageRecord{}, operation_result.Error
	} else {
		if len(temporary_messages) == 0 {
			return TemporaryMessageRecord{}, errors.New("not found")
		} else {
			return temporary_messages[0], nil
		}
	}
}

func Get_all_temporary_messages(db *gorm.DB) []TemporaryMessageRecord {
	var all_temporary_messages []TemporaryMessageRecord

	operation_result := db.Find(&all_temporary_messages)
	if operation_result.Error != nil {
		log.Println(operation_result.Error.Error())
		return []TemporaryMessageRecord{}
	} else {
		return all_temporary_messages
	}
}

func Delete_all_temporary_messages(db *gorm.DB) bool {
	// var all_temporary_messages []TemporaryMessageRecord
	// operation_result := db.Find(&all_temporary_messages)
	// if operation_result.Error != nil {
	// 	return false
	// }

	// for _, message := range all_temporary_messages {
	// 	db.Unscoped().Delete(&message)
	// }

	// return true

	/*
		db.Where("name = ?", "jinzhu").Delete(&email)
		// DELETE from emails where id = 10 AND name = "jinzhu";
	*/

	statement := &gorm.Statement{DB: db}
	statement.Parse(&TemporaryMessageRecord{})

	sql_command := fmt.Sprintf("DELETE FROM %s", statement.Schema.Table)
	operation_result := db.Exec(sql_command)
	if operation_result.Error != nil {
		return false
	}

	return true
}

func Delete_all_temporary_messages_that_was_related_to_a_user_in_a_specific_chat_group(db *gorm.DB, chat_id string, user_id string) ([]TemporaryMessageRecord, bool) {
	var all_temporary_messages []TemporaryMessageRecord
	operation_result := db.Where("Chat_id = ? AND User_id = ?", chat_id, user_id).Find(&all_temporary_messages)
	if operation_result.Error != nil {
		return all_temporary_messages, false
	}

	for _, message := range all_temporary_messages {
		db.Unscoped().Delete(&message)
	}

	return all_temporary_messages, true
}
