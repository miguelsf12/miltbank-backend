const User = require('../models/User')
const Exchange = require('../models/Exchange')
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')
const { convertCurrencyToFloat } = require('../helpers/currency-helper')
const { ObjectId } = require('mongodb')

module.exports = class ExchangeController {
  static async exchange(req, res) {
    try {
      const token = getToken(req)
      const user = await getUserByToken(token)

      const { amountInForeignCurrency, amountPaidInReais, moedaSelecionada, cotacao } = req.body

      // Converte os valores para float
      const amountInForeignCurrencyFloat = convertCurrencyToFloat(amountInForeignCurrency)
      const amountPaidInReaisFloat = convertCurrencyToFloat(amountPaidInReais)

      if (amountPaidInReaisFloat > user.amount) {
        return res.status(400).json({ message: 'Saldo insuficiente!' })
      }

      const exchange = new Exchange({
        amountInForeignCurrency: amountInForeignCurrencyFloat,
        amountPaidInReais: amountPaidInReaisFloat,
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

      // Salvando operação de cambio
      await exchange.save()

      // Atualizar a carteira com a nova moeda
      if (!user.wallet.coins) {
        user.wallet.coins = []
      }

      // Verificar se a moeda já existe na carteira
      const coinIndex = user.wallet.coins.findIndex(coin => coin.symbol === moedaSelecionada)
      if (coinIndex !== -1) {
        // Atualizar a quantidade existente
        user.wallet.coins[coinIndex].amount += amountInForeignCurrencyFloat
      } else {
        // Adicionar nova moeda à carteira
        user.wallet.coins.push({
          symbol: moedaSelecionada,
          amount: amountInForeignCurrencyFloat
        })
      }

      // Atualizar o amount
      user.amount -= amountPaidInReaisFloat

      await user.save()

      console.log(exchange)
      return res.status(200).json({ message: 'Operação concluida!' })
    } catch (error) {
      console.error('Erro ao fazer a operação:', error)
      res.status(500).json({ message: 'Erro interno do servidor ao fazer a operação' })
    }
  }

  // Posso buscar informações da moeda e enviar
  static async getCoins(req, res) {
    try {
      const token = getToken(req)
      const user = await getUserByToken(token)

      const simboloDaMoeda = req.params.simboloDaMoeda

      const userCoins = user.wallet.coins.find(coin => coin.symbol === simboloDaMoeda)

      console.log(userCoins)
      res.status(200).send(userCoins)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao obter informações da moeda' })
    }
  }

  static async getExchangeBySymbol(req, res) {
    try {
      const simboloDaMoeda = req.params.simboloDaMoeda

      const token = getToken(req)
      const user = await getUserByToken(token)

      const latestExchanges = await Exchange.find({ 'payer.id': new ObjectId(user._id), coin: simboloDaMoeda })

      if (latestExchanges.length === 0) {
        res.status(404).json({ message: 'Operação não encontrada!' })
        return
      }

      // NO FRONTEND SEPARAR AS ULTIMAS (5)

      console.log(latestExchanges)

      res.status(200).send(latestExchanges)
    } catch (error) {
      console.error(error)
      res.status(500).send({ message: 'Erro interno do servidor' })
    }
  }
}
