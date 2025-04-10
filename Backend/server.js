const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000
// use body-parser
const bodyparser = require('body-parser')
app.use(bodyparser.urlencoded({extended: true}))
app.use(bodyparser.json())
// use Express.json
app.use(express.json())
// Use cookie-parser
const cookieParser = require('cookie-parser')
app.use(cookieParser())
// use cors
const cors = require('cors')
app.use(cors())
// Use dotenv
require('dotenv').config({path: 'config.env'})

// Database Connection
const connectDB = require('./models/database')
connectDB()

// Use Routers
const signupRouter = require('./routers/signup-router')
const loginRouter = require('./routers/login-router')
const expenseRouter = require('./routers/expense-router')

app.use('/expense-tracker/account', signupRouter)
app.use('/expense-tracker/account', loginRouter)
app.use('/expense-tracker/dashboard', expenseRouter)



app.listen(PORT, ()=> {
    console.log(`Server Is Running on PORT ${PORT}`)
})