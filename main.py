#!/usr/bin/env python
# -*- coding: utf-8 -*-
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


from telegram import InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, CallbackQueryHandler, MessageHandler, Filters
from auto_everything.base import IO
io = IO()
import maya


data = {
    "question": "1+1=?",
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


def set(bot, update):
    global waitting_for_master

    if update.message.from_user.id != master_user_id:
        update.message.reply_text(
            f"You are not admin!\nAdmin user_id is {master_user_id}\n\nYour user_id is:\n{str(update.message.from_user.id)}")
    else:
        update.message.reply_text(
            f"What's your question? \n\nExample:\nyou + me = ?\nNone\nWe\n2")

        if waitting_for_master == False:
            waitting_for_master = True
        else:
            pass


def handle_text_msg(bot, update):
    global waitting_for_master
    global io

    kick_them_out_if_possible(bot, update)

    if update.message.from_user.id != master_user_id:
        pass
    else:
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
                    update.message.reply_text(
                        f"The last line should less than or equal to {len(answer)}")
                    raise Exception

                new_data = {
                    "question": question,
                    "answer": answer,
                    "right_answer_index": index
                }
                data.update(new_data)
                io.write_settings("data", data)

                waitting_for_master = False
                update.message.reply_text(
                    f"OK, I got it!\n\nQuestion: {question}\nAnswer: {answer[index-1]}")
            except Exception as e:
                update.message.reply_text(
                    f"I got this error: {e} \n Can you try again?")


def handle_all_msg(bot, update):
    members = update.message.new_chat_members
    if members:
        for user in members:
            people.update({
                user.id: str(maya.now())
            })
            print(f"{user.id} came to this group")
        io.write_settings("people", people)
        time.sleep(61)
        kick_them_out_if_possible(bot, update)


def kick_them_out_if_possible(bot, update):
    if people != {}:
        kicked_people = []
        for user_id in people:
            past = maya.parse(people[user_id])
            now = maya.now()
            time_passed = (now - past).seconds
            if (time_passed > 60 * 1):
                print(f"{user_id} has to be kicked out")
                bot.kick_chat_member(update.message.chat_id, user_id)
                kicked_people.append(user_id)
        for user_id in kicked_people:
            del people[user_id]
        io.write_settings("people", people)


def ask(bot, update):
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


def button(bot, update):
    query = update.callback_query

    right_answer = data['answer'][data["right_answer_index"]-1]
    if query.data == right_answer:
        """
        bot.edit_message_text(text=f"you're right",
                              chat_id=query.message.chat_id,
                              message_id=query.message.message_id)
        """
        user_id = query.from_user.id
        if user_id in people:
            del people[user_id]
            io.write_settings("people", people)
    else:
        """
        bot.edit_message_text(text=f"you're wroung",
                              chat_id=query.message.chat_id,
                              message_id=query.message.message_id)
        """
        try:
            bot.kick_chat_member(query.message.chat_id, query.from_user.id)
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
    #updater.dispatcher.add_handler(CommandHandler('kick', kick_them_out_if_possible))
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
