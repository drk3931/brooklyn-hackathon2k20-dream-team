//written by deepak khemraj github.com/drk3931

const { check, validationResult } = require('express-validator');
var User = require('../models/User')

var passport = require('passport');
const jwt = require('jsonwebtoken');
const geolib = require('geolib');

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

async function userAddItem(req,res,next){

    try{

        let user = await User.findOne({phone:req.body.phone});

        if(!user){
            throw new Error("User not found")
        }

        if(req.body.itemToDonate){
            user.itemsToDonate.push(req.body.itemToDonate);
        }
        else{
            throw new Error("Body does not contain itemsToDonate")
        }
        user.save();
        return res.status(200).json(user.itemsToDonate);
    }
    catch(err){
        return res.status(400).json(err)
    }
    
}


async function getItemsNearLocation(req,res,next){

    try{

        let lat = req.body.latitude;
        let long = req.body.longitude;

        if(!lat || !long){
            throw new Error("please supply latitude and longitude")
        }

        let users = await User.find({});
        let foundCloseby = [];
        
        users.forEach((user=>{

            user.itemsToDonate.map(
                (item)=>{
                    let itemLat = item.latitude;
                    let itemLon = item.longitude;

                    let distanceMeters = geolib.getDistance(
                        { latitude: itemLat, longitude: itemLon },
                        { latitude: lat, longitude: long }
                    );

                    const numMiles =  5;
                    const asMeters = 1609.34 * numMiles;
                    
                    if(distanceMeters <= asMeters){
                        foundCloseby.push(item);
                    }

                }
            )

        }));

        res.status(200).json({closeby:foundCloseby});

    }
    catch(err){
        return res.status(400).json(err)
    }

  
    
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
        loginFunction
    ],
    userAddItem:[
        checkToken,
        userAddItem
    ],
    getItemsNearLocation:[
        checkToken,
        getItemsNearLocation
    ]
  
}