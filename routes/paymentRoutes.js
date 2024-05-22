const router = require('express').Router()
const PaymentController = require('../controllers/PaymentController')
const verifyToken = require('../helpers/verify-token')

router.post('/pixcreatekey', verifyToken, PaymentController.pixCreateKey)
router.post('/checkreceiver', verifyToken, PaymentController.checkReceiver)
router.get('/getreceiver', verifyToken, PaymentController.getReceiver)
router.post('/confirmpayment', verifyToken, PaymentController.confirmPayment)
router.post('/makepayment', verifyToken, PaymentController.makePayment)
router.get('/gettransferences', verifyToken, PaymentController.getTransferences)
router.get('/gettransference/:id', verifyToken, PaymentController.getTransferenceById)

module.exports = router
