//User.js by deepak khemraj github.com/drk3931

var bcrypt = require('bcrypt')
var mongoose = require('mongoose')
var env = require('dotenv')

var userSchema = new mongoose.Schema({

    password: { type: String, minlength:6, required: [true,'User password required'] },


    
    phone: {
        type: String,
        validate: {
            validator: function (v) {
                return /\d{3}-\d{3}-\d{4}/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        },
        required: [true, 'User phone number required'],
        index: { unique: true },
        zipcode:{type:String, required:true},
   
    },

    itemsToDonate:[
        {
            itemType: {
                type: String,
                enum : ['food','clothing','books','other'],
                default: 'other',
                required:true
            },
            itemDescription: {
                type: String,
                required:true
            },
            longitude:{
                type: Number,
                required:true
            },
            latitude:{
                type: Number,
                required:true
            },
            address:{
                type: String,
                required:false
            },

            
        }
    ]



});

let SALT_WORK_FACTOR = 5
userSchema.pre('save', async function (next) {
    var user = this;
    if (!user.isModified('password')) return next();

    try {
        let salt = await bcrypt.genSalt(SALT_WORK_FACTOR)
        let hash = await bcrypt.hash(user.password, salt)
        this.password = hash;
        next()
    }
    catch (err) {
        next(err)
    }


});


userSchema.methods.comparePassword = async function (candidatePassword) {

    try {
        let match = await bcrypt.compare(candidatePassword, this.password);
        return match
    }
    catch (err) {
        throw err
    }

};


module.exports = mongoose.model('User', userSchema);