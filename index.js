const express = require('express')
const cors = require('cors')

const app = express()

// Config JSON response
app.use(express.json())

// Solve CORS
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))

// Public folder for images
app.use(express.static('public'))

// Routes
const UserRoutes = require('./routes/userRoutes')
const PaymentRoutes = require('./routes/paymentRoutes')
const ExchangeRoutes = require('./routes/exchangeRoutes')

app.use('/users', UserRoutes)
app.use('/payments', PaymentRoutes)
app.use('/exchanges', ExchangeRoutes)

app.listen(5000)
