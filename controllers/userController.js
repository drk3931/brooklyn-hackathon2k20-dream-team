//written by deepak khemraj github.com/drk3931
'use strict';

const { check, validationResult } = require('express-validator');
var User = require('../models/User')

var passport = require('passport');
const jwt = require('jsonwebtoken');
const geocoder = require('../GeoCoder');
const geolib = require('geolib');


function checkToken(req, res, next) {
 
    let decoded = jwt.decode(req.headers.authorization);
    if (decoded) {
        req.user = decoded;
        next();
    }
    else {
        return res.status(401).json({ message: 'invalid token' })
    }
}



function loginFunction(req, res, next) {

    let toDecode = jwt.decode(req.headers.authorization);
    if (toDecode) {
        return res.status(200).json({ message: 'already logged in' })
    }

    passport.authenticate('local',function (err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.status(403).json(info) }

        const token = jwt.sign(user.toJSON(), "asdiuhasiduhasiduhasuidh",{expiresIn: '365d'});
        return res.json({ token });


    })(req, res, next);

}


async function userAddItem(req, res, next) {

    let address = req.body.address,latitude,longitude;

   
    let itemToDonate = req.body.itemToDonate;

    if(!address){
        latitude = req.body.latitude;
        longitude = req.body.longitude;
    }else{
        let res = await geocoder.geocode(address);
        latitude = res[0].latitude;
        longitude = res[0].longitude;
    
    }

    if(!latitude || !longitude){
        return res.status(400).json({"err":"no location info could be accessed"})
    }

    if(!itemToDonate){
        return res.status(400).json({"err":"itemToDonate is undefined"})

    }




    try {

        let user = await User.findOne({ phone: req.user.phone });

    
        if(!user){
            return res.status(400).json({error:"user not found"})

        }
        user.itemsToDonate.push({
            itemType:itemToDonate.itemType,
            itemDescription:itemToDonate.itemDescription,
            latitude: latitude,
            longitude:longitude
        });
        await user.save();


        //@edwin, you can send sms messages to the closeByUsers
        //it is an array of phone numbers within a five mile radius of where the food was posted.
        let closeByUsers = await getUsersNearCoordinate(req.user.phone,latitude,longitude);
        

        return res.status(200).json(closeByUsers);
    }
    catch (err) {
        console.log(err)
        return res.status(400).json(JSON.stringify(err))
    }

}

async function getUsersNearCoordinate(phone,lat,long){

    let users = await User.find({});

    let closeUsers = [];

    users.forEach(async u=>{

        if(!u.phone === phone){

            let zip = u.zip;
            let targLat = undefined, targLong = undefined;


            let zipCoord = await geocoder.geocode(zip);
            for(zipCoord in zipCoords[0]){
                if(zipCoords.state==="New York"){
                    targLat = zipCoord.latitude;
                    targLong = zipCoord.longitude; 
                }
            }

            if(targLat && targLong){

                let distanceMeters = geolib.getDistance(
                    { latitude: targLat, longitude: targLong },
                    { latitude: lat, longitude: long }
                );


                const numMiles = 5;
                const asMeters = 1609.34 * numMiles;


                if (distanceMeters <= asMeters) {
                    closeUsers.push(u.phone)
                }
                
            }
        }
    });
            
        

    return closeUsers;

}


async function getItemsNearLocation(req, res, next) {

    let lat = req.body.latitude;
    let long = req.body.longitude;


    try {

        let users = await User.find({});
        let foundCloseby = [];

        users.forEach((user => {


            user.itemsToDonate.map(
                (item) => {
                    let itemLat = item.latitude;
                    let itemLon = item.longitude;

                    let distanceMeters = geolib.getDistance(
                        { latitude: itemLat, longitude: itemLon },
                        { latitude: lat, longitude: long }
                    );

                    const numMiles = 5;
                    const asMeters = 1609.34 * numMiles;

                    if (distanceMeters <= asMeters) {
                        foundCloseby.push(item);
                    }

                }
            )

        }));

       res.status(200).json({items:foundCloseby});

    }
    catch (err) {

        console.log(err);
        return res.status(400).json(err)
    }



}

module.exports = {
    createUser: [
  //      check('phone').isMobilePhone(),
 //       check('password').isLength({ min: 6 }),
 //       check('zip').isPostalCode,
        //finally, make user
        function createUser(req, res) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            User.create({
                phone: req.body.phone,
                password: req.body.password,
                zipcode:req.body.zip
            }).then((res2) => {
                res.status(200).json({ message: "Successfully Made User" });
            }).catch((err) => {
                res.status(400).json({message: "User already exists"});
            })

        }
    ],
    loginUser: [
        loginFunction
    ],
    userAddItem: [
        checkToken,
        userAddItem
    ],
    getItemsNearLocation: [
        checkToken,
        check('longitude').isNumeric(),
        check('latitude').isNumeric(),
        getItemsNearLocation,
    ]

}


