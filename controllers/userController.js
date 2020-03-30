//written by deepak khemraj github.com/drk3931

const { check, validationResult } = require('express-validator');
var User = require('../models/User')

var passport = require('passport');
const jwt = require('jsonwebtoken');
const geocoder = require('../GeoCoder');

// Twilio setup
const accountSID = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = require('twilio')(accountSID, authToken);
const service = client.notify.services(process.env.TWILIO_NOTIFY_SERVICE_SID);

const numbers = [/* ... */]; // TODO: Populate numbers from function
const bindings = numbers.map(number => {
  return JSON.stringify({ binding_type: 'sms', address: number });
});

service.notifications
  .create({
    toBinding: bindings,
    body: 'Hey there! There\'s food available for pickup nearby!'
  })
  .then(notification => {
    console.log(notification);
  })
  .catch(err => {
    console.error(err);
  });
// End of Twilio

function checkToken(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
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


    if (jwt.decode(req.headers.authorization)) {
        return res.status(200).json({ message: 'already logged in' })
    }

    passport.authenticate('local', {session:false},function (err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.status(403).json(info) }

        const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET);
        return res.json({ userPhone: user.phone, token });


    })(req, res, next);

}

async function userAddItem(req, res, next) {

    let address = req.body.address,latitude,longitude;

    if(!address){
        latitude = req.body.latitude;
        longitude = req.body.longitude;
    }else{
        const res = await geocoder.geocode(address);
        latitude = res.latitude;
        longitude = res.longitude;
    }

    if(!latitude || !longitude){
        return res.status(400).json({"err":"no location info could be accessed"})
    }


    try {

        let user = await User.findOne({ phone: req.user.phone });



        user.itemsToDonate.push({
            itemType:itemToDonate.itemType,
            itemDescription:itemToDonate.itemDescription,
            latitude: latitude,
            longitude:longitude
        });
        user.save();
        return res.status(200).json(user.itemsToDonate);
    }
    catch (err) {
        return res.status(400).json(err)
    }

}


async function getItemsNearLocation(req, res, next) {


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

        res.status(200).json({ closeby: foundCloseby });

    }
    catch (err) {
        return res.status(400).json(err)
    }



}

module.exports = {
    createUser: [
        check('phone').isMobilePhone(),
        check('password').isLength({ min: 6 }),
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
        getItemsNearLocation
    ]

}
