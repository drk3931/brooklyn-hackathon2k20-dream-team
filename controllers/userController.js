//written by deepak khemraj github.com/drk3931
'use strict';

const { check, validationResult } = require('express-validator');
var User = require('../models/User')

var passport = require('passport');
const jwt = require('jsonwebtoken');
const geocoder = require('../GeoCoder');
const geolib = require('geolib');


// Twilio setup
const accountSID = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = require('twilio')(accountSID, authToken);
const service = client.notify.services(process.env.TWILIO_NOTIFY_SERVICE_SID);

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

    passport.authenticate('local', function (err, user, info) {
        if (err) { return next(err); }
        if (!user) { return res.status(403).json(info) }

        const token = jwt.sign(user.toJSON(), "asdiuhasiduhasiduhasuidh", { expiresIn: '365d' });
        return res.json({ token });


    })(req, res, next);

}



async function userAddItem(req, res, next) {

    let address = req.body.address, latitude, longitude;


    let itemToDonate = req.body.itemToDonate;

    if (!address) {
        latitude = req.body.latitude;
        longitude = req.body.longitude;
        let components = await geocoder.geocode(`${latitude},${longitude}`);
        components = components[0];

        if (components) {
            address = `${components.streetNumber} ${components.streetName} , ${components.city} , ${components.zipcode}`;
        }
        else {
            return res.status(400).json({ "err": "no location info could be accessed" })
        }
    } else {
        let res = await geocoder.geocode(address);
        latitude = res[0].latitude;
        longitude = res[0].longitude;

    }

    if (!latitude || !longitude) {
        return res.status(400).json({ "err": "no location info could be accessed" })
    }

    if (!itemToDonate) {
        return res.status(400).json({ "err": "itemToDonate is undefined" })

    }



    try {

        let user = await User.findOne({ phone: req.user.phone });


        if (!user) {
            return res.status(400).json({ error: "user not found" })

        }


        let newItem = {
            itemType: itemToDonate.itemType,
            itemDescription: itemToDonate.itemDescription,
            latitude: latitude,
            longitude: longitude
        }


        user.itemsToDonate.push(newItem);
        await user.save();

        let closeByUsers = await getUsersNearCoordinate(req.user.phone, latitude, longitude);

        if (closeByUsers.length === 0) {
            return res.status(200).json(user.itemsToDonate);
        }

        // TODO: Needs to be tested. May fail because closeByUsers is async. If fails, add await to bindings.
        const bindings = closeByUsers.map(number => {
            return JSON.stringify({ binding_type: 'sms', address: number });
        });

        let bodyString = `Hey there! There\'s something available for pickup nearby. \n category: ${newItem.itemType} \n description: ${newItem.itemDescription} \n ${address}`;

        service.notifications
            .create({
                toBinding: bindings,
                body: bodyString
            })
            .then(notification => {
                console.log(notification);
            })
            .catch(err => {
                console.error(err);
            });

        return res.status(200).json(user.itemsToDonate);
    }
    catch (err) {
        console.log(err)
        return res.status(400).json(JSON.stringify(err))
    }

}

async function getUsersNearCoordinate(phone, lat, long) {

    let users = await User.find({});
    let closeUsers = [];

    for (let u of users) {

        if (!(u.phone === phone)) {

            let zip = u.zip;
            let targLat = undefined, targLong = undefined;


            let zipCoord = await geocoder.geocode(zip);


            for (let zOuter of zipCoord) {
                if (zOuter.state === "New York") {
                    targLat = zOuter.latitude;
                    targLong = zOuter.longitude;
                    break;
                }

            }


            if (targLat && targLong) {




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
        } else {


        }

    }

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

        res.status(200).json({ items: foundCloseby });

    }
    catch (err) {

        console.log(err);
        return res.status(400).json(err)
    }



}

module.exports = {
    createUser: [
        check('phone').isNumeric().isLength({ min: 10, max: 10 }),
        check('password').isLength({ min: 6 }),
        check('zipcode').isNumeric().isLength({ min: 5, max: 5 }),
        //finally, make user
        function createUser(req, res) {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }

            if (!req.body.phone || !req.body.password || !req.body.zipcode) {
                res.status(400).json({ message: "missing either phone, password, or zipcode " });
            }

            User.create({
                phone: req.body.phone,
                password: req.body.password,
                zip: req.body.zipcode
            }).then((res2) => {
                res.status(200).json({ message: "Successfully Made User" });
            }).catch((err) => {
                console.log(err)
                res.status(400).json({ message: "User already exists" });
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
