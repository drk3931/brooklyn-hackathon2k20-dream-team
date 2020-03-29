const { check, validationResult } = require('express-validator');
var User = require('../models/User')

var passport = require('passport');
const jwt = require('jsonwebtoken');

function checkToken(req,res,next)
{
    if(jwt.decode(req.headers.authorization)){
        next();
    }
    else{
        return res.status(401).json({ message: 'invalid token' })
    }
}


function loginFunction(req, res, next) {


    if(jwt.decode(req.headers.authorization)){
        return res.status(200).json({ message: 'already logged in' }) 
    }
    
    passport.authenticate('local', function (err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.status(403).json(info) }
                            
      const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET);
      return res.json({user:user.toJSON(), token});
  
  
    })(req,res,next);
  
  }

module.exports = {
    createUser: [
        //finally, make user
        function createUser(req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            User.create({
                phone: req.body.phone,
                password: req.body.password
            }).then((res2) => {
                res.status(200).json({ message:"Successfully Made User" });
            }).catch((err) => {
                console.log(err)
                res.status(503).json(err);
            })

        }
    ],
    loginUser: [
        (req,res,next)=>{
            loginFunction(req,res,next)
        }
    ],
  
}