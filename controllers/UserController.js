const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Helpers
const createUserToken = require('../helpers/create-user-token')
const getUserByToken = require('../helpers/get-user-by-token')
const getToken = require('../helpers/get-token')

module.exports = class UserController {
  static async register(req, res) {
    const { name, birth_date, cpf, email, password, confirmPassword } = req.body
    const { cep, logradouro, complemento, bairro, localidade, uf, } = req.body

    const address = {
      cep,
      logradouro,
      complemento,
      bairro,
      localidade,
      uf,
    }

    // Validação
    const fieldsToValidate = {
      name: 'O nome é obrigatório',
      birth_date: 'A data de nascimento é obrigatória',
      cpf: 'O CPF é obrigatório',
      email: 'O email é obrigatório',
      password: 'A senha é obrigatória',
      confirmPassword: 'A confirmação de senha é obrigatória',
    }

    for (const field in fieldsToValidate) {
      if (!req.body[field]) {
        res.status(422).json({ message: fieldsToValidate[field] })
        return
      }
    }

    if (password !== confirmPassword) {
      res.status(422).json({ message: 'As senhas não conferem!' })
      return
    }

    // Checar se usuário existe
    const userEmail = await User.findOne({ email: email })
    const userCpf = await User.findOne({ cpf: cpf })

    if (userEmail) {
      res.status(422).json({ message: 'Já existe uma conta com este email!' })
      return
    }

    if (userCpf) {
      res.status(422).json({ message: 'Já existe uma conta com este CPF!' })
      return
    }


    // Criar senha
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    // Criar usuário
    const user = new User({
      name,
      birth_date,
      cpf,
      email,
      address,
      password: passwordHash
    })

    try {
      const newUser = await user.save()
      await createUserToken(newUser, req, res)
    } catch (error) {
      res.status(500).json({ message: error })
    }
  }

  static async login(req, res) {
    const { cpf, password } = req.body

    const fieldsToValidate = {
      cpf: 'O CPF é obrigatório',
      password: 'A senha é obrigatória'
    }

    for (const field in fieldsToValidate) {
      if (!req.body[field]) {
        res.status(422).json({ message: fieldsToValidate[field] })
        return
      }
    }

    const user = await User.findOne({ cpf: cpf })

    if (!user) {
      res.status(422).json({ message: 'Essa conta não existe' })
      return
    }

    // verifique se a senha corresponde à senha do banco de dados
    const checkPassword = await bcrypt.compare(password, user.password)

    if (!checkPassword) {
      res.status(422).json({ message: 'Senha inválida' })
      return
    }

    await createUserToken(user, req, res)
  }

  static async checkUser(req, res) {
    let currentUser

    if (req.headers.authorization) {
      const token = getToken(req)
      const decodedToken = jwt.verify(token, 'nossosecret')

      currentUser = await User.findById(decodedToken.id).lean()
      currentUser.password = undefined

      if (typeof currentUser.amount === 'number') {
        const formattedAmount = currentUser.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        currentUser.amount = formattedAmount
      }
    } else {
      currentUser = null
    }

    res.status(200).send(currentUser)
  }

  static async getUserById(req, res) {
    const id = req.params.id

    const user = await User.findById(id).select('-password')

    if (!user) {
      res.status(422).json({
        message: 'Usuário não encontrado!'
      })
      return
    }

    res.status(200).json({ user })
  }

  static async editUser(req, res) {
    // checar se usuário existe
    const token = getToken(req)
    const user = await getUserByToken(token)

    if (!user) {
      res.status(422).json({
        message: 'Usuário não encontrado!'
      })
      return
    }

    if (req.file) {
      user.image = req.file.filename
    }

    const userModified = req.body
    console.log(userModified)

    // telefone validation
    if (userModified.telefone) {
      const userExistsTel = await User.findOne({ telefone: userModified.telefone })
      if (user.telefone !== userModified.telefone && userExistsTel) {
        res.status(422).json({ message: 'Por favor, utilize outro número!' })
        return
      } else if (userModified.telefone) {
        user.telefone = userModified.telefone
        if (user.pix.tipo === 'telefone') {
          user.pix.chave = user.telefone
        }
      }
    }

    // email validation
    if (userModified.email) {
      const userExistsMail = await User.findOne({ email: userModified.email })
      if (user.email !== userModified.email && userExistsMail) {
        res.status(422).json({ message: 'Por favor, utilize outro e-mail!' })
        return
      } else if (userModified.email) {
        user.email = userModified.email
        if (user.pix.tipo === 'email') {
          user.pix.chave = user.email
        }
      }
    }

    // Atualizar endereço
    if (userModified.address) {
      user.address = userModified.address;
    }

    // password validation
    if (userModified.newPassword != userModified.confirmNewPassword) {
      res.status(422).json({ message: 'As senhas não conferem!' })
      return
    } else if (userModified.newPassword === userModified.confirmNewPassword && userModified.newPassword != null) {
      // creating password
      const salt = await bcrypt.genSalt(12)
      const passwordHash = await bcrypt.hash(userModified.newPassword, salt)

      user.password = passwordHash
    }

    try {
      // returns user updated data
      const updatedUser = await User.findOneAndUpdate({
        _id: user.id
      },
        { $set: user },
        { new: true },
      )
      res.status(200).json({ message: 'Usuário atualizado com sucesso!' })
    } catch (error) {
      res.status(500).json({ message: error })
      return
    }
  }

  static async forgotpassword(req, res) {
    const { name, cpf, email, newPassword } = req.body

    const fieldsToValidate = {
      name: 'O nome é obrigatório',
      cpf: 'O CPF é obrigatório',
      email: 'O email é obrigatório'
    }

    const userReq = {
      name,
      cpf,
      email
    }

    for (const field in fieldsToValidate) {
      if (!userReq[field]) {
        res.status(422).json({ message: fieldsToValidate[field] })
        return
      }
    }

    if (!newPassword) {
      res.status(422).json({ message: 'A senha é obrigatória!' })
      return
    }

    try {
      // achar usuário
      const user = await User.findOne({ name, cpf, email }).select('-password')
      console.log(user)

      if (!user) {
        return res.status(422).json({ message: 'Usuário não encontrado. Verifique os dados fornecidos.' })
      }

      const salt = bcrypt.genSaltSync(10)
      const passwordHash = bcrypt.hashSync(newPassword, salt)

      user.password = passwordHash
      await user.save()

      res.status(200).json({ message: 'Senha alterada com sucesso!' })
    } catch (error) {
      res.status(500).json({ message: error })
      return
    }

  }
}
