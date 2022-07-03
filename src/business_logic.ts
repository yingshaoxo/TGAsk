import { Models } from 'mongoose'
import * as models from './model'

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

const guessToString = (guess: any) => {
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

export const betOn = async (id: number, guess: number, money: number): Promise<String> => {
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

      return `Success, now you have a bet on ${guess} with money of ${money}`
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
  const all = await models.MarketGuessingModel.find({})
  return all.map((e) => {
    return `id: ${e.id}, guess: ${guessToString(e.guess)}, moneyOnBet: ${e.moneyOnBet}\n`
  })
}

export const getAccountsListString = async () => {
  const all = await models.AccountModel.find({})
  return all.map((e) => {
    return `id: ${e.id}, balance: ${e.balance}\n`
  })
}