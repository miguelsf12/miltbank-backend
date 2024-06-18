const router = require('express').Router()
const UserController = require('../controllers/UserController')

// Middlewares
const verifyToken = require('../helpers/verify-token')
const { imageUpload } = require('../helpers/image-upload')

router.post('/forgotpassword', UserController.forgotpassword)
router.post('/register', UserController.register)
router.post('/login', UserController.login)
router.get('/checkuser', verifyToken, UserController.checkUser)
router.get('/:id', UserController.getUserById)
router.patch('/edit', verifyToken, imageUpload.single('image'), UserController.editUser)

module.exports = router
