const User = require('../models/User')

const getReceiver = async (key) => {
  let userReceiver
  const accountNumberRegex = /^\d{8}-\d$/

  if (!accountNumberRegex.test(key)) {
    userReceiver = await User.findOne({ "pix.chave": key })
  } else {
    userReceiver = await User.findOne({ "numberOfAccount": key })
  }

  return userReceiver
}

module.exports = getReceiver
