import mongoose from 'mongoose';

const { Schema } = mongoose;

export const connect = async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test');
}


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


export interface Interface_MarketGuessing {
  id: number,
  guess: number,
  moneyOnBet: number,
}
const MarketGuessingSchema = new Schema({
  id: Number,
  guess: Number,
  moneyOnBet: Number,
})
export const MarketGuessingModel = mongoose.model<Interface_MarketGuessing>('MarketGuessing', MarketGuessingSchema);