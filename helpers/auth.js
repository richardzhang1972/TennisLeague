module.exports = {
    requireLogin: (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        } else {
            // res.render("login", {message: ""});
            res.redirect('/');
        }
    },

    // ensureGuest: (req, res, next) => {
    //     if (req.isAuthenticated()) {
    //         res.redirect('/profile');
    //     } else {
    //         return next();
    //     }
    // }
}