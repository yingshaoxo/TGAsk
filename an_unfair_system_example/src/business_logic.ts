import { Models } from 'mongoose'
import * as models from './models'

const makeSureGuessInRange = (guess: number) => {
  if (
    (guess === -1) ||
    (guess === 0) ||
    (guess === 1)
  ) {
    return true
  } else {
    return false
  }
}

export const guessToString = (guess: any) => {
  if ((guess == null) || (guess == undefined)) {
    return 'undefined'
  }
  if (guess == 0) {
    return 'keep'
  } else if (guess == 1) {
    return 'up'
  } else if (guess == -1) {
    return 'down'
  }
}

export const stringToGuess = (str: string | null | undefined) => {
  if ((str == null) || (str == undefined)) {
    return null
  }

  if (str == "keep") {
    return 0
  }
  if (str == "up") {
    return 1
  }
  if (str == "down") {
    return -1
  }
}

const getRatio = (guess: number | undefined | null) => {
  if (guess === -1) {
    return 2
  } else if (guess == 0) {
    return 30
  } else if (guess == 1) {
    return 2
  }
  return 1
}

export const checkIfAccountExists = async (id: number): Promise<Boolean> => {
  return (await models.AccountModel.exists({ id })) ? true : false
}

export const createAccount = async (id: number): Promise<Boolean> => {
  try {
    if (!await models.AccountModel.exists({ id })) {
      const account = new models.AccountModel({
        id: id,
        balance: 0,
      })
      await account.save()
      return true
    } else {
      return false
    }
  } catch (e) {
    console.log(e)
    return false
  }
}

export const deleteAllAccount = async () => {
  await models.AccountModel.deleteMany()
  return "success"
}

export const deleteAllGuessing = async () => {
  await models.MarketGuessingModel.deleteMany()
  return "success"
}

export const getBalance = async (id: number) => {
  const user = await models.AccountModel.findOne({ id: id });
  if (user) {
    return user.balance ?? 0
  } else {
    return 0
  }
}

export const modifyBalance = async (id: number, changes: number) => {
  const user = await models.AccountModel.findOne({ id: id });
  if (user?.balance != null) {
    user.balance += changes
    await user.save()
    return user.balance
  } else {
    return null
  }
}

export const betOn = async (id: number, guess: number, money: number): Promise<string> => {
  try {
    if (!makeSureGuessInRange(guess)) {
      return "Error, guess should only be -1, 0, 1"
    }

    const user = await models.AccountModel.findOne({ id: id });
    if (!user) {
      return "Error, can't get account info"
    }
    const balance = user.balance;
    if (balance == null) {
      return "Error, can't get balance"
    }
    if (balance < money) {
      return `Error, you don't have enough money, the balance you have is ${balance}, you money you want to spend is ${money}`
    } else {
      const moneyLeft = balance - money;
      user.balance = moneyLeft;

      const marketGuessing = new models.MarketGuessingModel({
        id,
        guess,
        moneyOnBet: money
      })

      await marketGuessing.save()
      await user.save()

      return `Success, now you have a bet on ${guessToString(guess)} with money of ${money}`
    }
  } catch (e) {
    console.log(e)

    return `Error, unknown`
  }
}

export const revealResultToEveryOne = async () => {
  const all = await models.MarketGuessingModel.find({})

  let onUp = 0
  let onKeep = 0
  let onDown = 0
  for (const oneRow of all) {
    if (oneRow.guess == -1) {
      onDown += (oneRow.moneyOnBet ?? 0) * getRatio(-1)
    } else if (oneRow.guess == 0) {
      onKeep += (oneRow.moneyOnBet ?? 0) * getRatio(0)
    } else if (oneRow.guess == 1) {
      onUp += (oneRow.moneyOnBet ?? 0) * getRatio(1)
    }
  }

  let result = 1
  if ((onUp < onKeep) && (onUp < onDown)) {
    result = 1
  } else if ((onKeep < onUp) && (onKeep < onDown)) {
    result = 0
  } else if ((onDown < onUp) && (onDown < onKeep)) {
    result = -1
  }

  let messageList = []
  let operationList = []
  for (const oneRow of all) {
    if (oneRow.guess === result) {
      const moneyWin = getRatio(result) * (oneRow.moneyOnBet ?? 0)
      messageList.push(`Congratulations! The market is ${guessToString(result)}, you win ${moneyWin}!`)
      operationList.push({
        id: oneRow.id,
        money: moneyWin
      })
    } else {
      const moneyLose = (oneRow.moneyOnBet ?? 0)
      messageList.push(`Sorry! The market is ${guessToString(result)}, you lost ${moneyLose}!`)
      operationList.push({
        id: oneRow.id,
        money: -moneyLose
      })
    }
    await models.MarketGuessingModel.deleteOne({
      id: oneRow.id,
      guess: oneRow.guess,
      moneyOnBet: oneRow.moneyOnBet,
    })
  }

  for (const operation of operationList) {
    try {
      const user = await models.AccountModel.findOne({
        id: operation.id
      })
      if (user?.balance) {
        user.balance += operation.money
        await user.save()
      }
    } catch (e) {
      console.log(e)
    }
  }

  return messageList
}

export const getBetInfoListString = async () => {
  let all = await models.MarketGuessingModel.find({}) as any
  all = all.map((e: any) => {
    return `id: ${e.id}, guess: ${guessToString(e.guess)}, moneyOnBet: ${e.moneyOnBet}\n`
  })
  const result = all.join("")
  if (result == "") {
    return "No bet info yet"
  } else {
    return result
  }
}

export const getAccountsListString = async () => {
  let all = await models.AccountModel.find({}) as any
  all = all.map((e: any) => {
    return `id: ${e.id}, balance: ${e.balance}\n`
  })
  const result = all.join("")
  if (result == "") {
    return "No accounts data yet"
  } else {
    return result
  }
}

export const has_process = async (id: number) => {
  return (await models.PersonalTaskProcessModel.exists({ id })) ? true : false
}

export const process_has_been_done = async (id: number) => {
  const one_process = await models.PersonalTaskProcessModel.findOne({ id })
  if (!one_process) {
    return true
  } else {
    if (one_process.taskType != null) {
      const processValue = models.ProcessMap[one_process.taskType as models.ProcessMap_Keys] as models.Process_Map_Value
      if (one_process.process >= processValue.progressList[processValue.progressList.length - 1]) {
        return true
      } else {
        return false
      }
    }
  }
  return true
}

export const add_a_process = async (id: number, taskType: models.TaskTypeMap_Values, process = 0, data = {}) => {
  if (await has_process(id)) {
    return false
  }

  console.log(id, taskType, process, data)

  const newProcess = new models.PersonalTaskProcessModel({
    id,
    taskType,
    process,
    data
  })
  await newProcess.save()

  return true
}

export const get_process = async (id: number) => {
  return await models.PersonalTaskProcessModel.findOne({ id })
}

export const push_the_process = async (id: number) => {
  const one_process = await models.PersonalTaskProcessModel.findOne({ id })
  if (one_process) {
    one_process.process += 1
    await one_process.save()

    if (await process_has_been_done(id)) {
      await models.PersonalTaskProcessModel.deleteMany({ id })
    }
  }
}

export const get_process_num = async (id: number) => {
  const one_process = await models.PersonalTaskProcessModel.findOne({ id })
  if (!one_process) {
    return null
  } else {
    return one_process.process
  }
}