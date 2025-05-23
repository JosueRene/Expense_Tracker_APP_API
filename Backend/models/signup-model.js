const mongoose = require('mongoose')
const joi = require('joi')
const passwordComplexity = require('joi-password-complexity')
const jwt = require('jsonwebtoken')

const signupSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}, {timestamps: true})

signupSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({_id: this._id}, process.env.PRIVATEKEY, {expiresIn: "1d"})
    return token
}

const User = mongoose.model('user', signupSchema)

const validate = (data) => {
    const schema = joi.object({
        username: joi.string().required().label("Username"),
        email: joi.string().email().required().label("Email"),
        password: passwordComplexity().required().label("Password") 
    })

    return schema.validate(data)
}

module.exports = {User, validate}