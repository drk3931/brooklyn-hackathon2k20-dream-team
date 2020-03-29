//db connection handler 
var mongoose = require('mongoose')
function connect() {

    return mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',{ useCreateIndex:true, useNewUrlParser: true,useUnifiedTopology: true }).then(
        (res) => {
            console.log('Successful DB Connect');
        }
    ).catch((err) => {
        console.error('ERROR: failed to connect to db');

    });

}


module.exports = {
    connect
}