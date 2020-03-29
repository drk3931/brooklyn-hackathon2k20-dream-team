'use strict';
const express = require('express')
const db = require('./db')
const passport = require('passport')
const mongoose = require('mongoose')


var app = express();

app.use((req, res, next) => {

    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'POST');
    res.append('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.append('Content-Type', 'application/json');
    next();
});

app.use(express.json());

//setup passport strategies
app.use(passport.initialize());

app.use('/api', require('./api'));

//error handling
app.use(function (err, req, res, next) {
    if (err && process.env.NODE_ENV == 'development') {

        res.status(500).send('There was an error \n' + err);
    }
    else {
        next();
    }

})

//404 handling
app.use(function (req, res, next) {
    res.status(404).type('txt').send('Not found');
})



app.listen(3000, () => {
    console.log('dream-team server is online @ port 3000')
});




