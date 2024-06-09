const mongoose = require('../db/conn')
const generateEightDigitNumber = require('../helpers/generateNumbers');

const { Schema } = mongoose;

const AddressSchema = new Schema({
  cep: {
    type: String,
  },
  logradouro: {
    type: String,
  },
  complemento: {
    type: String,
  },
  bairro: {
    type: String,
  },
  localidade: {
    type: String,
  },
  uf: {
    type: String,
  },
}, { _id: false })

const PixSchema = new Schema({
  tipo: {
    type: String,
    enum: ['telefone', 'cpf', 'email'] // Permite apenas estes valores
  },
  chave: {
    type: String
  }
}, { _id: false })

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  birth_date: {
    type: String,
    required: true
  },
  cpf: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  telefone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: 1300.20,
  },
  address: AddressSchema,
  pix: PixSchema,
  numberOfAccount: {
    type: String,
    unique: true,
    validate: {
      validator: (v) => {
        return /^(\d{8}-1)$/.test(v);
      },
      message: props => `${props.value} não é um número de conta válido!`
    }
  }
}, { timestamps: true });

// Adicionando um hook beforeSave para gerar e verificar o número de conta no momento da criação
UserSchema.pre('save', async function (next) {
  if (!this.isNew) return next(); // Se o usuário já existir, não gerar novo número de conta

  let generatedNumber;
  let existingUser;

  do {
    generatedNumber = `${generateEightDigitNumber()}-1`;
    // Verificar se o número gerado já existe no banco de dados
    existingUser = await this.constructor.findOne({ numberOfAccount: generatedNumber });
    // Se existir, gere outro número
  } while (existingUser);

  // Atribuir o número de conta único ao usuário
  this.numberOfAccount = generatedNumber;
  next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
