const router = require('express').Router()
const {User} = require('../models/signup-model')
const RevokedToken = require('../models/revokedToken-model')
const joi = require('joi')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const rateLimit = require('express-rate-limit')

// Limit the Login Attempts!
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too Many Attempts. Try Again Later!"
})

router.route('/login').post(limiter, async(req,res)=> {
    try {

            const {error} = validate(req.body)
            if(error) {
                console.log(error)
                return res.status(400).json({message: error.details[0].message})
            }

            const user = await User.findOne({email: req.body.email})
            if(!user) {
                return res.status(400).json({message: "Invalid Email!"})
            }

            const comparepassword = await bcrypt.compare(req.body.password, user.password)
            if(!comparepassword){
                return res.status(400).json({message: "Incorrect Password"})
            }

            // Generate Token
            const token = user.generateAuthToken()

            // Set HTTP-only Cookie
            res.cookie('AuthToken', token, {
                httpOnly: true, // This means the cookie cannot be accessed through JavaScript on the client side (e.g., document.cookie)
                secure: true, // This ensures that the cookie is only sent over HTTPS connections (i.e., when the site is using a secure connection). It prevents the cookie from being sent over an unencrypted connection, adding an extra layer of security.
                sameSite: 'strict', // This prevents Cross-Site Request Forgery (CSRF) attacks by ensuring that the cookie is only sent when the request originates from the same site as the one that set the cookie
                maxAge: 60 * 60 * 1000
            })

            res.status(200).send({data: token, message: "User LoggedIn!", redirectUrl: "/expense-tracker/dashboard"})

    } catch(error) {
        console.error(error)
        return res.status(500).json({message: "Internal Server Error!" + error.message})
    }
})

const validate = (data) => {
    const schema = joi.object({
        email: joi.string().email().required().label("Email"),
        password: joi.string().required().label("Password") 
    })

    return schema.validate(data)
}


router.route('/logout').post(async(req, res)=> {
    try{
            console.log(req.cookies)

            const token = req.cookies.AuthToken // Extract the token we had previously attached on the response cookie named authToken
            if(!token) return res.status(400).json({message: "No Token Found!"})

            const jwtSecret = process.env.PRIVATEKEY // Get the Secret Key we have used to sign on tokens
            const decodedToken = jwt.verify(token, jwtSecret) // Verifying whether the extracted token was signed with the right Secret Key!

            // Since we want to add or insert this token in the RevokedToken model, we should also have an expiresAt field as it is in model
            const expiresAt = new Date(decodedToken.exp * 1000) // exp means expires and it's getting multiplied by 1000 which stands for milliseconds

            // Now, we have complete fields to fill into the revoked token model ( adding into the blicklist! )
            await new RevokedToken({token, expiresAt}).save()

            // Clear the Cookie
            res.clearCookie('AuthToken')
            return res.status(200).json({message: "User Logged Out!"})

    } catch(error) {
        return res.status(500).json({error: "Internal Server Error!" + error.message})
    }
})



module.exports = router