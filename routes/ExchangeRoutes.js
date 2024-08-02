const router = require('express').Router()
const ExchangeController = require('../controllers/ExchangeController')
const verifyToken = require('../helpers/verify-token')

router.post('/exchange', verifyToken, ExchangeController.exchange)
router.get('/:simboloDaMoeda', verifyToken, ExchangeController.getCoins)
router.get('/getExchangeBySymbol/:simboloDaMoeda', verifyToken, ExchangeController.getExchangeBySymbol)

module.exports = router