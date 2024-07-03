const mongoose = require('../db/conn')

const { Schema } = mongoose

const Exchange = mongoose.model(
  'Exchange',
  new Schema({
    amountInForeignCurrency: {
      type: String,
      required: true
    },
    amountPaidInReais: {
      type: String,
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
