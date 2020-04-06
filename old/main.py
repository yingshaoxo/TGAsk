#!/usr/bin/env python
# -*- coding: utf-8 -*-
import logging
import threading
import maya
from auto_everything.base import IO
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler, MessageHandler, Filters
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
import os
import time

"""
export master_user_id=
export telegram_bot_token=
"""

master_user_id = int(os.getenv("master_user_id", "131513300"))
TOKEN = os.getenv("telegram_bot_token", "")
print(master_user_id)
print(TOKEN)


io = IO()
lock = threading.RLock()

ROOT_DIR = "."
logging.basicConfig(filename=os.path.join(ROOT_DIR, "__main.log"),
                    level=logging.DEBUG, filemode='w', format='%(levelname)s - %(message)s')

data = {
    "question": "1+1=? (不回答会被踢出群)",
    "answer": [
        "2",
        "3",
    ],
    "right_answer_index": 1
}
data = io.read_settings("data", data)

waitting_for_master = False

people = {
    # chat_id 324253: "maya timestring"
}
people = io.read_settings("people", people)

historical_message = {
    "id_list": []
}
historical_message = io.read_settings(
    "historical_message", historical_message)


def handle_useless_msg(bot, update, new_msg_id_list):
    global historical_message

    chat_type = update.message.chat.type

    if "group" in chat_type:
        logging.debug(f"new_msg_id_list: {new_msg_id_list}")
        logging.debug(f"historical_message: {historical_message['id_list']}")

        lock.acquire()
        historical_message.update(
            {"id_list": historical_message["id_list"] + new_msg_id_list}
        )
        io.write_settings("historical_message", historical_message)
        lock.release()

        logging.debug(
            f"new_historical_message: {historical_message['id_list']}")


def clearn(bot, update):
    chat_type = update.message.chat.type

    if "group" in chat_type:
        if len(historical_message["id_list"]) > 0:
            lock.acquire()
            for msg_id in historical_message["id_list"]:
                try:
                    bot.delete_message(update.message.chat_id, msg_id)
                except Exception as e:
                    print(e)
            historical_message["id_list"] = []
            io.write_settings("historical_message", historical_message)
            lock.release()

        bot.delete_message(update.message.chat_id, update.message.message_id)


def set(bot, update):
    global waitting_for_master

    if update.message.from_user.id != master_user_id:
        Message = update.message.reply_text(
            f"You are not admin!\nAdmin is @yingshaoxo ({master_user_id})\n\nYour user_id is:\n{str(update.message.from_user.id)}")

        handle_useless_msg(
            bot, update, [update.message.message_id, Message.message_id])
    else:
        Message1 = update.message.reply_text(
            f"What's your question? \n\nExample:")

        Message2 = update.message.reply_text(
            f"you + me = ?\nNone\nWe\n2")

        handle_useless_msg(
            bot, update, [update.message.message_id, Message1.message_id, Message2.message_id])

        if waitting_for_master == False:
            waitting_for_master = True
        else:
            pass


def handle_text_msg(bot, update):
    global waitting_for_master
    global io

    chat_type = update.message.chat.type
    logging.debug(f"chat_type is {chat_type}")

    if update.message.from_user.id != master_user_id:
        if "group" in chat_type:
            kick_them_out_if_possible(bot, update)
    else:
        if "group" in chat_type:
            kick_them_out_if_possible(bot, update)

        if waitting_for_master == True:
            try:
                text = update.message.text
                text = text.strip()
                lines = text.split("\n")
                lines = [line.strip() for line in lines if line.strip() != ""]

                question = lines[0]
                answer = lines[1:-1]
                index = int(lines[-1])

                if index > len(answer):
                    Message = update.message.reply_text(
                        f"The last line should less than or equal to {len(answer)}")
                    handle_useless_msg(
                        bot, update, [update.message.message_id, Message.message_id])
                    raise Exception

                lock.acquire()
                new_data = {
                    "question": question + " (不回答会被踢出群)",
                    "answer": answer,
                    "right_answer_index": index
                }
                data.update(new_data)
                io.write_settings("data", data)
                lock.release()

                waitting_for_master = False
                Message = update.message.reply_text(
                    f"OK, I got it!\n\nQuestion: {question}\nAnswer: {answer[index-1]}")
                handle_useless_msg(
                    bot, update, [update.message.message_id, Message.message_id])
            except Exception as e:
                Message1 = update.message.reply_text(
                    f"I got this error: {e} \n Can you try again?\n\nExample:")
                handle_useless_msg(bot, update, [Message.message_id])
                Message2 = update.message.reply_text(
                    f"you + me = ?\nNone\nWe\n2")
                handle_useless_msg(
                    bot, update, [Message1.message_id, Message2.message_id])


def handle_all_msg(bot, update):
    new_members = update.message.new_chat_members
    if new_members:
        lock.acquire()
        for user in new_members:
            people.update({
                user.id: str(maya.now())
            })
            print(f"{user.id} came to this group")
        io.write_settings("people", people)
        ask(bot, update)
        lock.release()

    #left_member = update.message.left_chat_member

    kick_them_out_if_possible(bot, update)
    handle_useless_msg(bot, update, [update.message.message_id])


def kick_them_out_if_possible(bot, update):
    if people != {}:
        lock.acquire()
        kicked_people = []
        for user_id in people:
            past = maya.parse(people[user_id])
            now = maya.now()
            time_passed = (now - past).seconds
            logging.debug(
                f"how long {user_id} haven't send a message: {str(time_passed)}")
            if (time_passed > 60 * 3):  # I will give you 3 minutes to answer my question
                print(f"{user_id} has to be kicked out")
                result = bot.kick_chat_member(update.message.chat_id, user_id)
                if result == True:
                    kicked_people.append(user_id)
                else:
                    bot.leave_chat(update.message.chat_id)
        for user_id in kicked_people:
            del people[user_id]
        io.write_settings("people", people)
        lock.release()


def ask(bot, update):
    chat_type = update.message.chat.type

    if "group" in chat_type:
        keyboard = []
        for text in data["answer"]:
            keyboard.append(
                [InlineKeyboardButton(text, callback_data=text)]
            )
        reply_markup = InlineKeyboardMarkup(keyboard)

        Message = update.message.reply_text(
            data["question"], reply_markup=reply_markup)

        bot.pin_chat_message(update.message.chat_id,
                             Message.message_id, disable_notification=True)

        handle_useless_msg(
            bot, update, [update.message.message_id, Message.message_id])
    else:
        Message = update.message.reply_text(
            f"You are not admin!\nAdmin is @yingshaoxo ({master_user_id})\n\nYour user_id is:\n{str(update.message.from_user.id)}")


def button(bot, update):
    query = update.callback_query

    right_answer = data['answer'][data["right_answer_index"]-1]
    if query.data == right_answer:
        user_id = query.from_user.id
        if user_id in people:
            lock.acquire()
            del people[user_id]
            io.write_settings("people", people)
            lock.release()
            Message = bot.send_message(
                chat_id=query.message.chat_id, text="You're right.\n\nWelcome!")
            time.sleep(3)
            Message.delete()
    else:
        try:
            if query.from_user.id in people.keys():
                kicked_people = []
                result = bot.kick_chat_member(
                    query.message.chat_id, query.from_user.id)
                if result == True:
                    lock.acquire()

                    kicked_people.append(query.from_user.id)
                    for user_id in kicked_people:
                        del people[user_id]
                    io.write_settings("people", people)

                    lock.release()
                else:
                    bot.leave_chat(query.message.chat_id)
        except Exception as e:
            print(e)


def error(bot, update, error):
    """Log Errors caused by Updates."""
    print(f"{error}")


def main():
    # Create the Updater and pass it your bot's token.
    updater = Updater(TOKEN)

    updater.dispatcher.add_handler(CommandHandler('set', set))
    updater.dispatcher.add_handler(CommandHandler('ask', ask))
    updater.dispatcher.add_handler(CommandHandler('clearn', clearn))
    updater.dispatcher.add_handler(CallbackQueryHandler(button))

    updater.dispatcher.add_handler(
        MessageHandler(Filters.text, handle_text_msg))
    updater.dispatcher.add_handler(
        MessageHandler(Filters.all, handle_all_msg))

    updater.dispatcher.add_error_handler(error)

    # Start the Bot
    updater.start_polling()

    # Run the bot until the user presses Ctrl-C or the process receives SIGINT,
    # SIGTERM or SIGABRT
    updater.idle()


if __name__ == '__main__':
    main()
