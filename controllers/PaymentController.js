const getReceiver = require('../helpers/get-receiver')
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')
const User = require('../models/User')
const Transference = require('../models/Transference')
const jwt = require('jsonwebtoken')
const { ObjectId } = require('mongoose').Types

module.exports = class PaymentController {
  static async pixCreateKey(req, res) {
    try {
      const token = getToken(req)
      const user = await getUserByToken(token)

      const { pixCpf, pixTelefone, pixEmail } = req.body
      let tipoPix, chavePix

      // Determine o tipo de PIX e o valor correspondente
      if (pixCpf) {
        if (user.cpf !== pixCpf) {
          return res.status(400).json({ message: 'Chave PIX inválida' })
        }
        tipoPix = 'cpf'
        chavePix = pixCpf
      } else if (pixTelefone) {
        if (user.telefone !== pixTelefone) {
          return res.status(400).json({ message: 'Chave PIX inválida' })
        }
        tipoPix = 'telefone'
        chavePix = pixTelefone
      } else if (pixEmail) {
        if (user.email !== pixEmail) {
          return res.status(400).json({ message: 'Chave PIX inválida' })
        }
        tipoPix = 'email'
        chavePix = pixEmail
      } else {
        return res.status(400).json({ message: 'Chave PIX inválida' })
      }

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' })
      }

      // Atualize os campos de PIX com base no tipo e valor
      user.pix = {
        tipo: tipoPix,
        chave: chavePix
      }

      // Salve as alterações no banco de dados
      await user.save()

      return res.status(200).json({ message: 'Chave PIX cadastrada com sucesso!' })
    } catch (error) {
      console.error('Erro ao criar chave PIX:', error)
      return res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }

  static async checkReceiver(req, res) {
    const key = req.body.key

    const token = getToken(req)
    const user = await getUserByToken(token)
    const receiver = await getReceiver(key)

    // console.log(receiver)

    if (!receiver) {
      return res.status(400).json({ message: 'Chave PIX inválida' })
    }

    if (user.pix.chave === key) {
      return res.status(400).json({ message: 'Chave PIX inválida' })
    }

    return res.status(200).send({ key })
  }

  static async getReceiver(req, res) {
    const { key } = req.query

    if (key && typeof key === 'string') {
      const userReceiver = await User.findOne({ "pix.chave": key }).select('name cpf pix.chave numberOfAccount -_id')

      if (!userReceiver) {
        return res.status(400).json({ message: 'Chave PIX inválida' })
      }

      function ocultarCPF(cpf) {
        const partes = cpf.split('-')
        const numeros = partes[0].split('.')

        numeros[0] = '***'
        partes[1] = '**'

        return `${numeros.join('.')}-${partes[1]}`
      }

      const cpfOculto = ocultarCPF(userReceiver.cpf)

      userReceiver.cpf = cpfOculto

      res.status(200).send(userReceiver)
    }
  }

  static async confirmPayment(req, res) {
    const amountString = req.body.amount

    const amount = parseFloat(amountString.replace(/[^\d,]/g, '').replace(',', '.'))

    const receiver = req.body.receiverData // tem necessidade ? 

    const token = getToken(req)
    const user = await getUserByToken(token)
    user.password = undefined

    if (amount == 0) {
      return res.status(400).json({ message: 'Insira uma quantia!' })
    }

    if (amount > user.amount) {
      return res.status(400).json({ message: 'Saldo insuficiente!' })
    }

    res.status(200).send(amountString)
  }

  static async makePayment(req, res) {
    try {
      const amountString = req.body.amount
      const receiverData = req.body.receiverData

      const amountToPay = parseFloat(amountString.replace(/[^\d,]/g, '').replace(',', '.'))

      const receiver = await getReceiver(receiverData.pix.chave)

      const token = getToken(req)
      const user = await getUserByToken(token)

      if (amountToPay > user.amount) {
        return res.status(400).json({ message: 'Saldo insuficiente!' })
      }

      const newPayerAmount = parseFloat(user.amount) - parseFloat(amountToPay)
      const newReceiverAmount = parseFloat(receiver.amount) + parseFloat(amountToPay)

      const updatedPayer = await User.findOneAndUpdate(
        { _id: user._id },
        { $set: { amount: parseFloat(newPayerAmount.toFixed(2)) } },
        { new: true }
      )

      const updatedReceiver = await User.findOneAndUpdate(
        { _id: receiver._id },
        { $set: { amount: parseFloat(newReceiverAmount.toFixed(2)) } },
        { new: true }
      )

      const transference = new Transference({
        amount: amountString,
        payer: {
          id: user._id,
          name: user.name,
          cpf: user.cpf,
          numberOfAccount: user.numberOfAccount,
          method: 'pix',
          pix: user.pix
        },
        receiver: {
          id: receiver._id,
          name: receiver.name,
          cpf: receiver.cpf,
          numberOfAccount: receiver.numberOfAccount,
          method: 'pix',
          pix: receiver.pix
        }
      })

      const newTransference = await transference.save()

      res.status(200).json({ message: 'Pagamento feito!', transferenceId: newTransference._id })
    } catch (error) {
      console.error('Erro ao fazer pagamento:', error)
      res.status(500).json({ message: 'Erro interno do servidor ao fazer pagamento' })
    }
  }

  static async getTransferences(req, res) {
    try {
      const token = getToken(req)

      const decodedToken = jwt.verify(token, 'nossosecret')

      const transferMade = await Transference.find({ 'payer.id': new ObjectId(decodedToken.id) })

      const transferReceived = await Transference.find({ 'receiver.id': new ObjectId(decodedToken.id) })

      res.status(200).send({ transferMade, transferReceived })
    } catch (error) {
      console.error('Erro ao buscar transferência:', error)
      res.status(500).json({ message: 'Erro interno do servidor ao buscar transferência' })
    }
  }

  static async getTransferenceById(req, res) {
    try {
      const id = req.params.id

      const transference = await Transference.findById(id)

      if (!transference) {
        return res.status(404).json({ message: 'Transferência não encontrada!' })
      }

      res.status(200).send(transference)
    } catch (error) {
      console.error(`Erro ao buscar a transferência ${id}:`, error)
      res.status(500).json({ message: 'Erro interno do servidor ao buscar a transferência' })
    }
  }
}
