package tests

import (
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/yingshaoxo/tgask/2022/database"
	"github.com/yingshaoxo/tgask/2022/store"

	"github.com/yingshaoxo/gopython/json_tool"
	"github.com/yingshaoxo/gopython/terminal_tool"

	"context"

	"gorm.io/gorm"
)

var db *gorm.DB
var my_context context.Context
var cancel context.CancelFunc

var chat_id string = "11"

func TestMain(m *testing.M) {
	my_context, cancel = context.WithTimeout(context.Background(), 10000*time.Second)
	defer cancel()

	db = database.Init_database(store.Sqlite_test_database_file_path)
	fmt.Println("database initialized")
	defer func() {
	}()

	code := m.Run()
	fmt.Printf("the code of TestMain returns: %v", code)

	// disk_tool.Remove_a_file_or_folder("test.db")
	os.Exit(code)
}

func Test_if_database_exists(t *testing.T) {
	result := terminal_tool.Run_command("ls -l")
	// built_in_functions.Print(result)
	if !strings.Contains(result, "test.db") {
		t.Fatalf("There should have a file called 'test.db'")
	}
}

func Test_get_a_user(t *testing.T) {
	_, err := database.Get_a_user_record(db, "11111111", "0000000000")
	if err == nil {
		t.Fatalf("There should not have a user")
	}
}

func Test_add_users(t *testing.T) {
	err := database.Add_a_new_user_record(db, chat_id, "1", false)
	if err != nil {
		t.Fatalf("We should be able to add a user")
	}

	err = database.Add_a_new_user_record(db, chat_id, "2", true)
	if err != nil {
		t.Fatalf("We should be able to add a user")
	}
}

func Test_get_a_user2(t *testing.T) {
	_, err := database.Get_a_user_record(db, chat_id, "1")
	// fmt.Println(a_user)
	if err != nil {
		t.Fatalf("There should have a user")
	}
}

func Test_get_a_unverified_user_list(t *testing.T) {
	user_list := database.Get_unverified_users_record(db)

	for _, user := range user_list {
		println(json_tool.Convert_struct_object_to_json_string(user))
	}

	if len(user_list) == 0 {
		t.Fatalf("There should have users")
	}
}

// func Test_drop_user_table(t *testing.T) {
// 	err := database.Delete_new_user_table(db)
// 	if err != nil {
// 		t.Fatalf("It should remove the new_users table: \n" + err.Error())
// 	}
// }

func Test_temporary_message_functions(t *testing.T) {
	result := database.Delete_all_temporary_messages(db)
	if result == false {
		t.Fatalf("It should delete all messages")
	}

	result = database.Save_temporary_message_if_it_is_in_the_old_user_record_table(
		db,
		"77",
		chat_id,
		"1",
	)

	if result == false {
		t.Fatalf("The message should get saved")
	}

	messages := database.Get_all_temporary_messages(db)
	if len(messages) == 0 {
		t.Fatalf("The message should have messages")
	}

	database.Delete_all_temporary_messages_that_was_related_to_a_user_in_a_specific_chat_group(db,
		chat_id,
		"1",
	)
	messages = database.Get_all_temporary_messages(db)
	if len(messages) != 0 {
		t.Fatalf("The list should be empty now")
	}

	database.Save_temporary_message_if_it_is_in_the_old_user_record_table(
		db,
		"77",
		chat_id,
		"1",
	)
	database.Save_temporary_message_if_it_is_in_the_old_user_record_table(
		db,
		"78",
		chat_id,
		"2",
	)
	database.Delete_all_temporary_messages_that_was_related_to_a_user_in_a_specific_chat_group(db,
		chat_id,
		"1",
	)
	messages = database.Get_all_temporary_messages(db)
	if len(messages) == 0 {
		t.Fatalf("The list should have one message")
	}
	message := messages[0]
	if message.User_id != "2" {
		t.Fatalf("function Delete_all_temporary_messages_that_was_related_to_a_user_in_a_specific_chat_group() not work")
	}
}
