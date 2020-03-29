var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

var User = require('./models/User')




passport.use(new LocalStrategy(
    { 
        usernameField: 'phone',    
        passwordField: 'password'
    },
    function (phone, password, done) {

        User.findOne({ phone: phone }, async function (err, user) {

            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect phone.' });
            }
            try {
                let isMatch = await user.comparePassword(password);

                if (isMatch) {
                    return done(null, user, null);
                }
                else {
                    return done(null, false, { message: 'Incorrect password.' })
                }

            }
            catch (err) {
                return done(err, false, err)
            }
        })
    }
));


passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

