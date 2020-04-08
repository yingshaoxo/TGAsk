from telegram.ext import Updater
from telegram.ext import CommandHandler
from telegram.ext import MessageHandler, Filters
import os
import urllib3


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
    # get basic info
    bot = context.bot
    chat_id = update.effective_chat.id
    message_id = update.message.message_id
    text = update.message.text

    message_types = []
    message_types.append(update.message.text)
    message_types.append(update.message.audio)
    message_types.append(update.message.document)
    message_types.append(update.message.animation)
    message_types.append(update.message.game)
    message_types.append(update.message.photo)
    message_types.append(update.message.sticker)
    message_types.append(update.message.video)
    message_types.append(update.message.voice)
    message_types.append(update.message.location)
    message_types.append(update.message.poll)
    if any(message_types):
        # normal message
        pass
    else:
        # useless notifacation
        bot.delete_message(chat_id=chat_id, message_id=message_id)

    """
    new_chat_members = iupdate.message.new_chat_members
    if new_chat_members:
        new_chat_members_id = [user.id for user in new_chat_members]
        print(f"new comming {update.message.from_user.username}")
    left_chat_member = update.message.left_chat_member
    if left_chat_member:
        left_chat_member_id = left_chat_member.id
        print(f"left {update.message.from_user.username}")

    # delete user comming and left notification
    if new_chat_members_id or left_chat_member_id:
        bot.delete_message(chat_id=chat_id, message_id=message_id)
        print(f"deleted {update.message.from_user.username}")
    """

    """
    # admin only
    admin_list = update.effective_chat.get_administrators()
    admin_id_list = [admin.user.id for admin in admin_list]
    user_who_sent = update.message.from_user.id
    if user_who_sent not in admin_id_list:
        # it's a spam
        bot.delete_message(chat_id=chat_id, message_id=message_id)
    """


echo_handler = MessageHandler(Filters.all, echo)
dispatcher.add_handler(echo_handler)


updater.start_polling()
