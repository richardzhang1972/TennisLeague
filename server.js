const express = require('express');
const Handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const app = express();
// setup view engine
app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    handlebars: allowInsecurePrototypeAccess(Handlebars)
}));
app.set('view engine', 'handlebars');

//use body parser middleware
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// connect to MongoDB
const mongoose = require('mongoose');
const Keys = require('./config/keys');
mongoose.connect(Keys.MongoDB, {
    //autoIndex: false
}).then(() => {
    console.log('Server is connected to MongoDB')
}).catch((err) => {
    console.log(err)
});

//Authentification
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
app.use(cookieParser());
app.use(session({
    secret: 'mysecret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
require('./passport/local');
const bcrypt = require('bcryptjs');


//Make user global object
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

//Load models
const Message = require('./models/message');
const User = require('./models/user');
const { requireLogin } = require('./helpers/auth');

// environment var for port
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});

app.get("/about", (req, res) => {
    res.render('about', { title: 'About' });
});

app.route('/contactUs')
    .get((req, res) => {
        res.render('contactUs', { title: 'Contact' });
    })
    .post((req, res) => {
        //console.log(req.body);
        const newMessage = {
            fullname: req.body.fullname,
            email: req.body.email,
            message: req.body.message,
            date: new Date()
        }
        new Message(newMessage).save().then(message => {
            Message.find({}).then((messages) => {
                console.log(messages);
                if (messages) {
                    res.render('newmessage', {
                        title: 'Sent',
                        messages: messages
                    });
                } else {
                    res.render('noMessage', {
                        title: 'Not Found'
                    });
                };
            })
        });

    });

app.route("/login")
    .get(function (req, res) {
        res.render("login");
    })
    .post(passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/loginErrors",
        failureFlash: true
    }));

app.get('/loginErrors', (req, res) => {
    res.render('home', {
        error: 'Cannot login with the email and password, please try again'
    });
});

app.get('/logout', (req, res) => {
    req.logOut((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
})

app.get('/newAccount', (req, res) => {
    req.render('newAccount', {
        title: 'SIgnup'
    });
})

app.get('/profile', requireLogin, (req, res) => {
    User.findById(req.user._id).then((err, user) => {
        if (err) throw err;
        res.render('profile', {
            title: 'Profile',
            user: user
        });
    });
});

app.route('/profileEdit')
    .get(requireLogin, (req, res) => {
        User.findById(req.user._id).then((err, user) => {
            res.render('profileEdit', {
                title: 'Profile Edit',
                user: user
            })
        })
    })
    .post((req, res) => {
        User.findById(req.user._id).then((err, user) => {
            if (err) {
                console.err(err);
            } else {
                user.birthday = req.body.birthday;
                user.cityState = req.body.cityState;
                user.displayname = req.body.displayname;
                user.gender = req.body.gender;
                user.status = req.body.status;
                user.state = req.body.cityState.split(', ')[1];
                user.zipcode = req.body.zipcode;
                user.save(err => {
                    if (err) {
                        throw err;
                    } else {
                        res.redirect(`/profile/${req.user._id}`);
                    }
                })
            }
        })
    })

app.route('/signup')
    .get((req, res) => {
        res.render('signup', { title: 'Signup' })
    })
    .post((req, res) => {
        if (req.body) {
            User.findOne({ email: req.body.email.toLowerCase() })
                .then(user => {
                    if (user) {
                        res.render('signup', {
                            title: 'Signup',
                            firstname: req.body.firstname,
                            lastname: req.body.lastname,
                            error: 'Email already exists, please try again',
                            phonenumber: req.body.phonenumber,
                            gender: req.body.gender
                        });
                    } else {
                        var salt = bcrypt.genSaltSync(10);
                        var hash = bcrypt.hashSync(req.body.password, salt);
                        const newUser = {
                            firstname: req.body.firstname,
                            lastname: req.body.lastname,
                            email: req.body.email.toLowerCase(),
                            password: hash,
                            phonenumber: req.body.phonenumber,
                            gender: req.body.gender
                        };
                        new User(newUser).save().then(() => {
                            res.render('home', {
                                message: 'Thank you for signing up.  Please login now'
                            });
                        });
                    }
                })
        }
    })


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});