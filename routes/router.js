/**
 * Created by Diaz on 2017-03-21.
 *
 * The endpoints of the API will reside in here as well as the calling to render the pages
 */
let express = require('express');
let router = express.Router();
let passport = require('passport');
let pg = require('pg'); // USING THIS TEMPORARILY
// Used to encrypt user password before adding it to db.
let bcrypt = require('bcrypt-nodejs');

// Bookshelf postgres db ORM object. Basically it makes
// it simple and less error port to insert/query the db.
let Model = require('../model.js');

router.get('/', function(req, res, next) {
    // If user is not authenticated, redirect them
    // to the signin page.
    if (!req.isAuthenticated()) {
        console.log("Not authenticated");
        res.redirect('/signin');
    } else {
        let user = req.user;
        res.render('pages/index');
        console.log("authenticated");

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
        res.render('pages/signup', { title: 'Sign Up' });
    }
});

// Processing the page for user registration
router.post('/signup', function(req, res, next) {
    // Here, req.body is { username, password }
    var parent = req.body;

    // Before making the account, try and fetch a username to see if it already exists.
    var usernamePromise = new Model.Parent({ username: parent.username }).fetch();

    return usernamePromise.then(function(model) {
        if (model) {
            res.render('signup', { title: 'signup', errorMessage: 'username already exists' });
        } else {
            var password = parent.password;
            var hash = bcrypt.hashSync(password);

            // Make a new postgres db row of the account
            var signUpParent = new Model.Parent({
                username: parent.username,
                password: hash,
                email: parent.email,
                name: parent.first + " " + parent.last});

            signUpParent.save({}, {method: 'insert'}).then(function(model) {
                // Sign in the newly registered user
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

// Processing the page for adding a child
router.post('/addChild', function(req, res, next) {
  // Here, req.body is { name, username, pwd, pwd-repeat }
  let child = req.body;

  console.log(child.pwd);
  console.log(child.pwdRepeat);

  // Make sure password typed correctly
  if (child.pwd !== child.pwdRepeat) {
    res.status(500).send({ error: 'password mismatch'});
    return;
  }

  // Try and fetch a username to see if it already exists.
  let usernamePromise = new Model.Child({ username: child.username }).fetch();

  return usernamePromise.then(function(model) {
    if (model) {
      res.status(500).send({ error: 'username already exists'});
    } else {
      let password = child.pwd;
      let hash = bcrypt.hashSync(password);

      // Make a new postgres db row of the account
      let newChild = new Model.Child({
        name: child.name,
        username: child.username,
        p_id: 1,
        password: hash
      });

      newChild.save({}, {method: 'insert'}).then(function(model) {
        // close modal and refresh page
        res.redirect('/');
      });
    }
  });
});

// Get the chores from the assigned_chore table associated to a parent
router.get('/chores', function(request, response) {

    var choresJson = {};

    Model.getAssignedChoresParent(1, function (error, data) {
        if (error) {
            response.send({error: error});
        }
        else {
            if (data) {
                response.send(data);

            }

        }
    });

});


// Function to create chores
router.post('/chores', function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect(307, '/');
    }
    else {
        var jsonKeys = ['owner', 'name', 'description', 'value'];

        var choreToCreate = req.body;
        for (var i = 0; i < jsonKeys.length; i++) {
            if (!choreToCreate.hasOwnProperty(jsonKeys[i])) {
                return res.json({"error": "Missing parameter in assigned chore"});
            }

        }
        // // Check child assigned (owner) exists
        // Model.grabChildCredentials(choreToCreate['owner'], function (error, data) {
        //     if (error) {
        //         return res.json({"error": error});
        //     }
        // });
        // Check parent has child with id == owner
        // Model.grabChildrenFromParent(choreToCreate["parentId"], function (error, data) {
        //     if (error) {
        //         return res.json({"error": error});
        //     }
        //     else {
        //         if (!data.includes(parseInt(choreToCreate['owner']))) {
        //             return res.json({"error": "Child assigned to chore does not belong to parent"});
        //         }
        //     }
        // });


        var choreTemplate = new Model.ChoreTemplate({
            owner       : choreToCreate.owner,
            name        : choreToCreate.name,
            description : choreToCreate.description,
            value       : choreToCreate.value
        });

        choreTemplate.save({}, {method: 'insert'}).then(function(model) {

            res.json(choreTemplate);
        });
    }
});


// Get the chore template associated to a parent
router.get('/chore_template', function(request, response) {

    var choresTemplateJson = [];

    Model.getChoreTemplateParent(1, function (error, data) {
        if (error) {
            response.send({error: error});
        }
        else {
            if (data) {
                response.send({chore_template: data});
            }
        }
    });

});


// Get the children from the child table
router.get('/children', function(request, response) {
    var children = [];

    Model.grabChildrenFromParent(1, function(error, data) {
        if (error) {
            response.send({error: error});
        }
        else {
            if (data) {
                response.send({children: data});
            }
        }
    });

});

module.exports = router;
