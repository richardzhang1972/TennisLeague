const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
const User = require('../models/user');
const bcrypt = require('bcryptjs');

passport.serializeUser((user, done) => {
    done(null, user.id);
})


passport.deserializeUser((id, done) => {
    User.findById(id)
        .then((user) => {        
            if (!user) {
                //console.log("User not found for id:", id);
                done(null, null); // Pass null as the user to indicate no user found
            } else {
                //console.log("Deserialized user:", user);
                done(null, user);
            }
        })
        .catch((err) => {
            console.error("Error finding user:", err); // Log any errors
            done(err, null);
        });
});

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, (email, password, done) => {
    User.findOne({ email: email.toLowerCase() })
        .then(user => {
            if (!user) {
                return done(null, false);
            }
            if (user.password) {
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) {
                        throw err;
                    }
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false)
                    }
                })
            } else {
                return done(null, false)
            }
        })
        .catch(err => {
            console.log(err);
        });
}))