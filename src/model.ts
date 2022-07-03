import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';

const { Schema } = mongoose;

const AccountSchema = new Schema({
  id: Number, // String is shorthand for {type: String}
  createdDate: { type: Date, default: Date.now },
  lastActiveDate: { type: Date, default: Date.now },
  hidden: { type: Boolean, default: false },
  balance: Number,
});

const MarketGuessingSchema = new Schema({
  id: Number,
  guess: Number,
  moneyOnBet: Number,
})

export const AccountModel = mongoose.model('Account', AccountSchema);
export const MarketGuessingModel = mongoose.model('MarketGuessing', MarketGuessingSchema);