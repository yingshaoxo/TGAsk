from telegram.ext import Updater
from telegram.ext import CommandHandler
from telegram.ext import MessageHandler, Filters
import os


# Get environment variables
TOKEN = os.getenv('TOKEN')


updater = Updater(token=str(TOKEN), use_context=True)
dispatcher = updater.dispatcher


def start(update, context):
    context.bot.send_message(chat_id=update.effective_chat.id, text="""
I'm a bot, I delete useless information in telegram.

I'm still in developing. My developer is @yingshaoxo.
    """.strip())


start_handler = CommandHandler('start', start)
dispatcher.add_handler(start_handler)


def echo(update, context):
    bot = context.bot
    chat_id = update.effective_chat.id
    message_id = update.message.message_id
    text = update.message.text
    if text == None:
        admin_list = update.effective_chat.get_administrators()
        admin_id_list = [admin.user.id for admin in admin_list]
        user_who_sent = update.message.from_user.id
        if user_who_sent not in admin_id_list:
            # it's a spam
            bot.delete_message(chat_id=chat_id, message_id=message_id)
    #bot.send_message(chat_id=update.effective_chat.id, text=text)


echo_handler = MessageHandler(Filters.all, echo)
dispatcher.add_handler(echo_handler)


updater.start_polling()
