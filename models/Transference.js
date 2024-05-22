const mongoose = require('../db/conn')

const { Schema } = mongoose

const Transference = mongoose.model(
  'Transference',
  new Schema({
    amount: {
      type: String,
      required: true
    },
    payer: Object,
    receiver: Object
  }, {
    timestamps: true
  })
)

module.exports = Transference
