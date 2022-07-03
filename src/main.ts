import { Message } from "node-telegram-bot-api";

const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = '684605925:AAEH3vsZ4ilg9EysZdAwDH8KE2R';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Matches "/echo [whatever]"
bot.onText(/\/(.+) (.+)/, (msg: Message, match: any[]) => {
  const chatId = msg.chat.id;

  const command = match[1]; // the captured "whatever"
  const content = match[2]; // the captured "whatever"

  console.log(`get command: ${msg.text}`)

  bot.sendMessage(chatId, content);
});

bot.on('message', (msg: Message) => {
  const chatId = msg.chat.id;

  if (msg.text?.startsWith('/')) {
    return
  }

  console.log(`get text: ${msg.text}`)

  bot.sendMessage(chatId, 'Received your message');
});