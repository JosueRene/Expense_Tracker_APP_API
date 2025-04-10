const jwt = require('jsonwebtoken')
const RevokedToken = require('../models/revokedToken-model')

const authenticationToken = async(req, res, next) => {
    const token = req.cookies.AuthToken;
    if(!token) return res.status(400).json({message: "Access Denied!"})

    // Check if Token is blacklisted ( if is in database )
    const isRevoked = await RevokedToken.findOne({ token })
    if(isRevoked) {
        return res.status(401).json({message: "Token Revoked!"})
    }
    
    try{
            // Verify whether the extracted token was signed with the right secret key!
            const decodedToken = await jwt.verify(token, process.env.PRIVATEKEY)
            req.userId = decodedToken._id // Attach the userId from the token to the request object
            next() // Proceed with the next middleware or route handler

    } catch(error) {
        console.error(error)
        return res.status(401).json({message: "Invalid Token"})
    }
}

module.exports = authenticationToken