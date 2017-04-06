let LocalStrategy    = require('passport-local').Strategy,
    Model            = require('./model.js'),
    bcrypt           = require('bcrypt-nodejs');


module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        Model.grabParentCredentials(id, function(err, user) {
            if (err) {
                Model.grabChildCredentials(id, function(err, user) {
                    done(err, user);
                });
            } else {
                done(err, user);
            }

        });
    });

    passport.use('local', new LocalStrategy(function(username, password, done) {
        new Model.Parent({username: username}).fetch().then(function(data) {
            let user = data;
            if (user === null) {
                // Parent not found, attempt to find child
                new Model.Child({username: username}).fetch().then(function(data) {
                    let child = data;
                    if (child == null) {
                        return done(null, false, { message: 'Invalid username or password' });
                    }
                    else {

                        child = data.toJSON();
                        child.role = 'child';
                        if (!bcrypt.compareSync(password, child.password)) {
                            return done(null, false, { message: 'Invalid password' });
                        } else {
                            return done(null, child);
                        }
                    }
                });

            } else {

                // Use parent credentials
                user = data.toJSON();
                user.role = 'parent';
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false, { message: 'Invalid password' });
                } else {
                    return done(null, user);
                }
            }
        });
    }));

};