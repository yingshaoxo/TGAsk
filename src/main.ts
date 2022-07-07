import { Message, CallbackQuery } from "node-telegram-bot-api";
import * as models from './models'
import * as business_logic from './business_logic'
import * as msg_handler from './msg_handler'

const TelegramBot = require('node-telegram-bot-api');

const main = async () => {
  await models.connect()

  // replace the value below with the Telegram token you receive from @BotFather
  const token = '684605925:AAEH3vsZ4ilg9EysZdAwDH8KE2R-NECdV5E';

  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(token, { polling: true });


  // Matches "/[whatever]"
  bot.onText(/\/(.+)/, async (msg: Message, match: any[]) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id
    if (!userId) {
      return
    }

    let full_command = match[1]; // the captured "whatever"
    let command = ""
    let content = ""; // the captured "whatever"

    const splits = full_command.split(" ")
    if (splits.length >= 2) {
      command = splits[0]
      splits.shift()
      content = splits.join(" ")
    } else {
      command = splits[0]
    }

    console.log(`\n\nget command: ${command}\nget content: ${content}`)
    await msg_handler.command_response(command, content, bot, chatId, userId)
  });


  bot.on('message', async (msg: Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id

    if (!userId) {
      return
    }

    await business_logic.createAccount(userId)

    if (msg.text?.startsWith('/')) {
      return
    } else {
      console.log(`get text: ${msg.text}`)
      msg_handler.text_response(
        msg.text ?? "",
        bot,
        chatId,
        userId
      )
    }
  });


  bot.on("callback_query", async (callback_query: CallbackQuery) => {
    const user_id = callback_query.from.id
    const chat_id = callback_query?.message?.chat?.id ?? null
    const content = callback_query.data ?? ""
    if ((chat_id == null) || (content == "")) {
      return
    }

    console.log(user_id, chat_id, content)

    msg_handler.callback_response(
      content,
      bot,
      chat_id,
      user_id
    )
  })
}

main()