import TelegramBot from "node-telegram-bot-api";
import * as business_logic from './business_logic'


export const commandMap = {
  checkAccounts: "checkAccounts",
  checkGuessing: "checkGuessing",
  deleteAll: "deleteAll",

  balance: "balance",
  add: "add",

  betUP: "betUp",
  betDown: "betDown",
  betKeep: "betKeep",

  reveal: "reveal",
}


export const default_message = `
We have commands of:

/checkAccounts

/checkGuessing

/deleteAll

/balance

\`/add 1\`

\`/betUp 1\`

\`/betDown 1\`

\`/betKeep 1\`

/reveal
`.trim()
// ` + Object.values(commandMap).map((str: string) => `/${str}`).join("\n\n")


export const command_responser = async (command: string, content: string,
  bot: TelegramBot, chatId: number, userId: number) => {
  let result = ""
  switch (command) {
    case commandMap.checkAccounts:
      result = await business_logic.getAccountsListString()
      break;
    case commandMap.checkGuessing:
      result = await business_logic.getBetInfoListString()
      break;
    case commandMap.deleteAll:
      result = await business_logic.deleteAllAccount()
      result = await business_logic.deleteAllGuessing()
      break;
    case commandMap.balance:
      const money = await business_logic.getBalance(userId)
      result = `You have balance of ${money}`
      break;
    case commandMap.add:
      const moneyLeft = await business_logic.modifyBalance(userId, Number(content) ?? 0)
      result = `Now, You have balance of ${moneyLeft ?? 0}`
      break;
    case commandMap.betUP:
      result = await business_logic.betOn(userId, 1, Number(content) ?? 0)
      break;
    case commandMap.betDown:
      result = await business_logic.betOn(userId, -1, Number(content) ?? 0)
      break;
    case commandMap.betKeep:
      result = await business_logic.betOn(userId, 0, Number(content) ?? 0)
      break;
    case commandMap.reveal:
      const resultList = await business_logic.revealResultToEveryOne();
      result = resultList.join("\n")
      result = result == "" ? "No one bet on it yet" : result
      break;
    default:
      result = default_message
      break;
  }
  console.log(result)
  if (result.includes("`")) {
    bot.sendMessage(chatId, result,
      {
        parse_mode: 'MarkdownV2',
      }
    )
  } else {
    bot.sendMessage(chatId, result)
  }
}