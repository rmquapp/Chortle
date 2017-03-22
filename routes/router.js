/**
 * Created by Diaz on 2017-03-21.
 *
 * The endpoints of the API will reside in here as well as the calling to render the pages
 */
var express = require('express');
var router = express.Router();
var passport = require('passport');
var pg = require('pg'); // USING THIS TEMPORARILY
// Used to encrypt user password before adding it to db.
var bcrypt = require('bcrypt-nodejs');

// Bookshelf postgres db ORM object. Basically it makes
// it simple and less error port to insert/query the db.
var Model = require('../model.js');

router.get('/', function(req, res, next) {
    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        var user = req.user;
        res.render('pages/index');
    }
});

// Serve the sign in form if not authenticated, otherwise show the main page
router.get('/signin', function(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.render('pages/login');
    }
});

// Authenticate user functionality
router.post('/signin', function(req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/signin'
    }, function(err, user, info) {
        if (err) {
            return res.render('pages/index', { title: 'Sign In', errorMessage: err.message });
        }

        if (!user) {
            return res.render('pages/index', { title: 'Sign In', errorMessage: info.message });
        }
        return req.logIn(user, function(err) {
            if (err) {
                return res.render('/', { title: 'Sign In', errorMessage: err.message });
            } else {
                return res.redirect('/');
            }
        });
    })(req, res, next);
});

// Serve page for signup
router.get('/signup', function(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.render('pages/parent-registration', { title: 'Sign Up' });
    }
});

// Processing the page for user registration
router.post('/signup', function(req, res, next) {
    // Here, req.body is { username, password }
    var user = req.body;

    // Before making the account, try and fetch a username to see if it already exists.
    var usernamePromise = new Model.User({ username: user.username }).fetch();

    return usernamePromise.then(function(model) {
        if (model) {
            res.render('signup', { title: 'signup', errorMessage: 'username already exists' });
        } else {
            var password = user.password;
            var hash = bcrypt.hashSync(password);

            // Make a new postgres db row of the account
            var signUpUser = new Model.User({
                username: user.username,
                password: hash,
                email: user.email,
                name: user.first + " " + user.last});

            signUpUser.save({}, {method: 'insert'}).then(function(model) {
                // Sign in the newly registered uesr
                res.redirect(307, '/signin');
            });
        }
    });
});

router.get('/signout', function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/', { errorMessage: 'You are not logged in' });
    } else {
        req.logout();
        res.redirect('/signin');
    }
});

// Get the chores from the assigned_chore table associated to a parent
router.get('/chores', function(request, response) {

    var choresJson = {};

    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        client.query('SELECT ac.id , ac.name chore_name, ac.description, ac.value, ac.status, ch.name ' +
            'FROM assigned_chore ac LEFT OUTER JOIN child ch ' +
            'ON (ac.owner = ch.id) WHERE ch.p_id = 1', function (err, result) {
            done();
            if (err) {
                console.error(err);
            }
            else {
                for (var i = 0; i  < result.rows.length; i++) {
                    var currentChore = result.rows[i];
                    if (choresJson[currentChore["name"]] == undefined) {
                        choresJson[currentChore["name"]] = [];
                    }
                    choresJson[currentChore["name"]].push(
                        {
                            "id": currentChore["id"],
                            "name": currentChore["chore_name"],
                            "description": currentChore["description"],
                            "value": currentChore["value"],
                            "status": currentChore["status"],
                        });

                }
                response.send(choresJson);
            }
        })
    });
});

// Get the chore template associated to a parent
router.get('/chore_template', function(request, response) {

    var choresTemplateJson = [];

    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        client.query('SELECT ct.id , ct.name, ct.description, ct.value ' +
            'FROM chore_template ct ' +
            'WHERE ct.owner = 1', function (err, result) {
            done();
            if (err) {
                console.error(err);
            }
            else {
                for (var i = 0; i  < result.rows.length; i++) {
                    var currentChore = result.rows[i];
                    choresTemplateJson.push(
                        {
                            "id": currentChore["id"],
                            "name": currentChore["name"],
                            "description": currentChore["description"],
                            "value": currentChore["value"]
                        });
                }
                response.send({"chore_template": choresTemplateJson});
            }
        })
    });
});


// Get the children from the child table
router.get('/children', function(request, response) {
    var children = [];
    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
        client.query('SELECT ch.id , ch.name, ch.username ' +
            'FROM child ch ' +
            'WHERE ch.p_id = 1', function (err, result) {
            done();
            if (err) {
                console.error(err);
            }
            else {
                for (var i = 0; i  < result.rows.length; i++) {
                    children.push(result.rows[i]);
                }
                response.send({"children": children});
            }
        })
    });
});

module.exports = router;
