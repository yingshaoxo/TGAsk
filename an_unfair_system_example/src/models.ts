import mongoose from 'mongoose';

const { Schema } = mongoose;

export const connect = async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test');
}


// accounts table
export interface Interface_Account {
  id: number,
  createdDate: Date,
  lastActiveDate: Date,
  hidden: boolean,
  balance: number
}
const AccountSchema = new Schema<Interface_Account>({
  id: Number, // String is shorthand for {type: String}
  createdDate: { type: Date, default: Date.now },
  lastActiveDate: { type: Date, default: Date.now },
  hidden: { type: Boolean, default: false },
  balance: Number,
});
export const AccountModel = mongoose.model<Interface_Account>('Account', AccountSchema);


// guessing(or bet) table
export interface Interface_MarketGuessing {
  id: number,
  guess: number,
  moneyOnBet: number,
}
const MarketGuessingSchema = new Schema<Interface_MarketGuessing>({
  id: Number,
  guess: Number,
  moneyOnBet: Number,
})
export const MarketGuessingModel = mongoose.model<Interface_MarketGuessing>('MarketGuessing', MarketGuessingSchema);


// personal task process table
export const TaskTypeMap = {
  bet: 1
}
export type TaskTypeMap_Keys = keyof typeof TaskTypeMap;
export type TaskTypeMap_Values = typeof TaskTypeMap[TaskTypeMap_Keys];
export interface Process_Map_Value {
  progressList: number[],
  nameToProgressMap: {
    chooseBetDirection: number,
    chooseBetMoney: number,
    done: number,
  }
}
export const ProcessMap = {
  1: {
    progressList: [0, 1, 2],
    nameToProgressMap: {
      chooseBetDirection: 0,
      chooseBetMoney: 1,
      done: 2,
    }
  } as Process_Map_Value
}
export type ProcessMap_Keys = keyof typeof ProcessMap;
export type ProcessMap_Values = typeof ProcessMap[ProcessMap_Keys];
export interface Interface_PersonalTaskProcess {
  id: number,
  taskType: number,
  process: number,
  data: any,
}
const PersonalTaskProcessModelSchema = new Schema<Interface_PersonalTaskProcess>({
  id: Number,
  taskType: Number,
  process: Number,
  data: { type: Schema.Types.Mixed, default: {} },
})
export const PersonalTaskProcessModel = mongoose.model<Interface_PersonalTaskProcess>('PersonalTaskProcess', PersonalTaskProcessModelSchema);