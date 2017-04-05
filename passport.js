let LocalStrategy    = require('passport-local').Strategy,
    Model            = require('./model.js'),
    bcrypt           = require('bcrypt-nodejs'),
    User             = Model.User;

module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        Model.grabParentCredentials(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local', new LocalStrategy(function(username, password, done) {
        new Model.Parent({username: username}).fetch().then(function(data) {
            let user = data;
            if (user === null) {
                return done(null, false, { message: 'Invalid username or password' });
            } else {
                user = data.toJSON();
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false, { message: 'Invalid password' });
                } else {
                    return done(null, user);
                }
            }
        });
    }));

};