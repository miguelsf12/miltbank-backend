const mongoose = require('../db/conn')

const { Schema } = mongoose

const Exchange = mongoose.model(
  'Exchange',
  new Schema({
    amountInForeignCurrency: {
      type: Number,
      required: true
    },
    amountPaidInReais: {
      type: Number,
      required: true
    },
    coin: {
      type: String,
      required: true
    },
    cotacao: {
      type: Object,
      required: true
    },
    payer: {
      type: Object,
      required: true
    },
  }, {
    timestamps: true
  })
)

module.exports = Exchange
