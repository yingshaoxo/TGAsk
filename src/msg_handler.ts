import TelegramBot from "node-telegram-bot-api";
import * as business_logic from './business_logic'
import * as models from './models'
import * as utils from './utils'


export const commandMap = {
  checkAccounts: "checkAccounts",
  checkGuessing: "checkGuessing",
  deleteAll: "deleteAll",

  balance: "balance",
  add: "add",

  bet: "bet",
  betUP: "betUp",
  betDown: "betDown",
  betKeep: "betKeep",

  reveal: "reveal",
  test: "test"
}


export const default_message = `
We have commands of:

/checkAccounts

/checkGuessing

/deleteAll

/balance

\`/add 1\`

/bet

\`/betUp 1\`

\`/betDown 1\`

\`/betKeep 1\`

/reveal

/test
`.trim()
// ` + Object.values(commandMap).map((str: string) => `/${str}`).join("\n\n")


export const command_response = async (command: string, content: string,
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
    case commandMap.bet:
      await business_logic.add_a_process(userId, models.TaskTypeMap.bet, 0, {})
      result = "Please choose a direction for the future!"
      const options = {
        reply_markup: {
          inline_keyboard: [[
            { text: "Up", callback_data: "up" },
            { text: "Keep", callback_data: "keep" },
            { text: "Down", callback_data: "down" },
          ]]
        },
        // parse_mode: 'HTML'
      };
      bot.sendMessage(chatId, result, options)
      return
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


export const callback_response = async (text: string, bot: TelegramBot,
  chatId: number, userId: number) => {
  if (await business_logic.has_process(userId)) {
    const theProcess = (await business_logic.get_process(userId))
    if (!theProcess) {
      return
    }

    const processType = theProcess?.taskType
    const processNum = theProcess?.process

    const predefined_process_value = models.ProcessMap[processType as models.ProcessMap_Keys] as models.Process_Map_Value

    switch (processType) {
      case models.TaskTypeMap.bet:
        if (processNum == predefined_process_value.nameToProgressMap.chooseBetDirection) {
          theProcess.data = {
            direction: text
          }
          await theProcess.save()
          await business_logic.push_the_process(userId)
          bot.sendMessage(chatId, `Great! You selected ${text}, now please tell me how much money you want to put on the table?`)
          return
        }
        break;
      default:
        break;
    }
  }
}



export const text_response = async (text: string, bot: TelegramBot,
  chatId: number, userId: number) => {

  const theProcess = (await business_logic.get_process(userId))
  if (!theProcess) {
    bot.sendMessage(chatId, default_message,
      {
        parse_mode: 'MarkdownV2',
      }
    );
    return
  }

  const processType = theProcess?.taskType
  const processNum = theProcess?.process

  const predefined_process_value = models.ProcessMap[processType as models.ProcessMap_Keys] as models.Process_Map_Value

  switch (processType) {
    case models.TaskTypeMap.bet:
      if (processNum == predefined_process_value.nameToProgressMap.chooseBetDirection) {
        bot.sendMessage(chatId, `You need to tell me the direction first, please click the button above, thanks.`)
        return
      }
      if (processNum == predefined_process_value.nameToProgressMap.chooseBetMoney) {
        if (utils.isNumber(text)) {
          const guess_direction = business_logic.stringToGuess(theProcess?.data?.direction)
          if (guess_direction == null) {
            return
          }
          const result = await business_logic.betOn(userId, guess_direction, Number(text))
          bot.sendMessage(chatId, result)
          await business_logic.push_the_process(userId)
          return
        }
        bot.sendMessage(chatId, `You need to give me a number.`)
        return
      }
      break;
    default:
      break;
  }
}