package main

// try to convert database module to a 'class' style module if you can

import (
	"io"
	"log"
	"os"
	"time"

	"github.com/yingshaoxo/gopython/disk_tool"
	"github.com/yingshaoxo/gopython/string_tool"
	"github.com/yingshaoxo/gopython/time_tool"
	"github.com/yingshaoxo/tgask/2022/database"
	"github.com/yingshaoxo/tgask/2022/store"
	"github.com/yingshaoxo/tgask/2022/tools"
	"gorm.io/gorm"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

var bot *tgbotapi.BotAPI
var err error

var db *gorm.DB

func setup_logger(log_file_path string) {
	// delete old log
	disk_tool.Remove_a_file_or_folder(log_file_path)
	// set log file
	f, err := os.OpenFile(log_file_path, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("error opening file: %v", err)
	}
	// defer f.Close()
	wrt := io.MultiWriter(os.Stdout, f)
	log.SetOutput(wrt)
}

func telegram_bot_loop() {
	var buttons = tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("Confirm", "Confirm"),
		),
	)

	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60

	updates := bot.GetUpdatesChan(u)

	for update := range updates {
		if update.CallbackQuery != nil {
			chat_id := string_tool.Int64_to_string(update.CallbackQuery.Message.Chat.ID)
			user_id := string_tool.Int64_to_string(update.CallbackQuery.From.ID)
			log.Println("get button callback", chat_id, user_id)

			if update.CallbackQuery.Data == "Confirm" {
				// it is human
				log.Println("user hited the confirm button", chat_id, user_id)

				err := database.Delete_a_user_record(db, chat_id, user_id)

				if err == nil {
					log.Println("Deleted a record because the user is human")
					// bot.Request(tgbotapi.DeleteMessageConfig{ChatID: update.CallbackQuery.Message.Chat.ID, MessageID: update.CallbackQuery.Message.MessageID})
					// log.Println("Deleted the message I sent out")
					temporary_messages, _ := database.Delete_all_temporary_messages_that_was_related_to_a_user_in_a_specific_chat_group(
						db,
						chat_id,
						user_id,
					)
					for _, temporary_message := range temporary_messages {
						the_chat_id, _ := string_tool.String_to_int64(temporary_message.Chat_id)
						the_message_id, _ := string_tool.String_to_int64(temporary_message.Message_id)
						bot.Request(tgbotapi.DeleteMessageConfig{
							ChatID:    the_chat_id,
							MessageID: int(the_message_id),
						})
					}
					log.Println("Human: Deleted those temporary message generated during the process")
				}
			}
			continue
		}

		if update.Message == nil { // ignore any non-Message Updates
			continue
		}

		log.Printf("[%s] %s", update.Message.From.UserName, update.Message.Text)

		if len(update.Message.Text) == 0 {
			if update.Message.LeftChatMember != nil || update.Message.NewChatMembers != nil {
				bot.Request(tgbotapi.DeleteMessageConfig{ChatID: update.Message.Chat.ID, MessageID: update.Message.MessageID})

				var new_users []tgbotapi.User
				new_users = update.Message.NewChatMembers
				for _, user := range new_users {
					log.Println(user.ID)
					chat_id := string_tool.Int64_to_string(update.Message.Chat.ID)
					user_id := string_tool.Int64_to_string(user.ID)
					log.Println("add a new user record: ", chat_id, user_id)
					database.Add_a_new_user_record(db, chat_id, user_id, false)

					// send confirm button out
					msg := tgbotapi.NewMessage(update.Message.Chat.ID, "Hi, "+user.FirstName+user.LastName+"!"+"\n\n"+"Please click the confirm button to let me know that you are a human.")
					msg.ReplyMarkup = buttons
					the_msg_bot_sent, err := bot.Send(msg)
					if err == nil {
						// save bot sent temporary messages to database so that we can delete it later
						temporary_msg_id := string_tool.Int_to_string(the_msg_bot_sent.MessageID)
						temporary_msg_chat_id := chat_id
						temporary_msg_user_id := user_id
						database.Save_temporary_message_if_it_is_in_the_old_user_record_table(
							db,
							temporary_msg_id,
							temporary_msg_chat_id,
							temporary_msg_user_id,
						)
						log.Println("save a temporary message: ", temporary_msg_id, temporary_msg_chat_id, temporary_msg_user_id)
					}
				}
			}
		}

		// save user sent temporary messages to database so that we can delete it later
		// include pictures and so on
		temporary_msg_id := string_tool.Int_to_string(update.Message.MessageID)
		temporary_msg_chat_id := string_tool.Int64_to_string(update.Message.Chat.ID)
		temporary_msg_user_id := string_tool.Int64_to_string(update.Message.From.ID)
		database.Save_temporary_message_if_it_is_in_the_old_user_record_table(
			db,
			temporary_msg_id,
			temporary_msg_chat_id,
			temporary_msg_user_id,
		)
	}
}

func my_operation_loop() {
	for 1+1 == 2 {
		time.Sleep(10 * time.Second)

		unverified_users := database.Get_unverified_users_record(db)
		for _, user := range unverified_users {
			current_timestamp_string := string_tool.Int64_to_string(time_tool.Get_current_time_as_timestamp())
			the_user_registering_timestamp_string := user.Register_time

			bigger := tools.Check_if_two_timestamps_has_a_distance_that_bigger_than_x_seconds(
				current_timestamp_string,
				the_user_registering_timestamp_string,
				"30", //30 seconds
			)

			if bigger {
				chat_id, _ := string_tool.String_to_int64(user.Chat_id)
				user_id, _ := string_tool.String_to_int64(user.User_id)
				bot.Request(tgbotapi.KickChatMemberConfig{
					ChatMemberConfig: tgbotapi.ChatMemberConfig{
						ChatID: chat_id,
						UserID: user_id,
					},
					UntilDate:      0,
					RevokeMessages: true,
				})

				database.Delete_a_user_record(db, user.Chat_id, user.User_id)
				log.Println("kicked a new user out: ", chat_id, user_id)

				// delete all temporary messages generated during this verifying process
				temporary_msg_chat_id := string_tool.Int64_to_string(chat_id)
				temporary_msg_user_id := string_tool.Int64_to_string(user_id)
				temporary_messages, _ := database.Delete_all_temporary_messages_that_was_related_to_a_user_in_a_specific_chat_group(
					db,
					temporary_msg_chat_id,
					temporary_msg_user_id,
				)
				for _, temporary_message := range temporary_messages {
					the_chat_id, _ := string_tool.String_to_int64(temporary_message.Chat_id)
					the_message_id, _ := string_tool.String_to_int64(temporary_message.Message_id)
					bot.Request(tgbotapi.DeleteMessageConfig{
						ChatID:    the_chat_id,
						MessageID: int(the_message_id),
					})
				}
				log.Println("Not human: Delete all temporary messages generated during this verifying process")
			}
		}
	}
}

func main() {
	// set logger
	current_path := disk_tool.Get_current_working_directory()
	if len(current_path) != 0 {
		log_file_path := disk_tool.Path_join(current_path, "log.txt")
		//built_in_functions.Print(log_file_path)
		setup_logger(log_file_path)
	}

	// set database
	db = database.Init_database(store.Sqlite_database_file_path)

	// get bot token
	var bot_token string
	if len(os.Args) >= 2 {
		bot_token = os.Args[1]
	} else {
		bot_token = "684605925:AAFbYOs_jl1YOLervKFpMv8RKA94pG_Ek8s"
	}
	log.Println(bot_token)

	// run bot
	bot, err = tgbotapi.NewBotAPI(bot_token)
	if err != nil {
		log.Panic(err)
	}
	bot.Debug = true
	log.Printf("Authorized on account %s", bot.Self.UserName)

	go telegram_bot_loop()

	// run my operation loop
	my_operation_loop()
}
