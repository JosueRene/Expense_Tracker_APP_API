const router = require('express').Router()
const {User, validate} = require('../models/signup-model')
const bcrypt = require('bcrypt')

router.route('/signup').post(async(req,res) => {
    try {

            const {error} = validate(req.body)
            if(error) {
                console.error(error)
                return res.status(400).json({message: error.details[0].message})
            }

            const user = await User.findOne({email: req.body.email})
            if(user) {
                return res.status(400).json({message: "User With This Email Exists!"})
            }

            const saltpassword = await bcrypt.genSalt(10)
            const hashpassword = await bcrypt.hash(req.body.password, saltpassword)

            await new User({...req.body, password: hashpassword}).save()
            return res.status(200).json({message: "New User Registered!"})            

        
    } catch(error) {
        console.error(error)
        return res.status(500).json({message: "Internal Server Error!" + error})
    }
})

module.exports = router