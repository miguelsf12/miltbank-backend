const User = require('../models/User')
const Exchange = require('../models/Exchange')
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')

module.exports = class ExchangeController {
  static async exchange(req, res) {
    try {
      const token = getToken(req)
      const user = await getUserByToken(token)

      // console.log(req.body)

      const { amountInForeignCurrency, amountPaidInReais, moedaSelecionada, cotacao } = req.body

      const exchange = new Exchange({
        amountInForeignCurrency,
        amountPaidInReais,
        coin: moedaSelecionada,
        cotacao: {
          ...cotacao
        },
        payer: {
          id: user._id,
          name: user.name,
          cpf: user.cpf,
          numberOfAccount: user.numberOfAccount,
        },
      })

      await exchange.save()
      
      console.log(exchange)
      return res.status(200).json({ message: 'Operação concluida!' })
    } catch (error) {
      console.error('Erro ao fazer a operação:', error)
      res.status(500).json({ message: 'Erro interno do servidor ao fazer a operação' })
    }


  }
}
