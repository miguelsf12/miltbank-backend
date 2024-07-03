const ExchangeController = require('../controllers/ExchangeController')
const verifyToken = require('../helpers/verify-token')
const router = require('express').Router()

router.post('/exchange', verifyToken, ExchangeController.exchange)

module.exports = router