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
        res.redirect('/signin');
    } else {
        let user = req.user;
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

  // Make sure password typed correctly
  if (child.pwd !== child.pwdRepeat) {
    console.log("pwd err");
    res.status(500).send({ error: 'password mismatch'});
    return;
  }

  // Try and fetch a username to see if it already exists.
  let usernamePromise = new Model.Child({ username: child.username }).fetch();

  return usernamePromise.then(function(model) {
    if (model) {
      console.log("username err");
      res.status(500).send({ error: 'username already exists'});
    } else {
      let password = child.pwd;
      let hash = bcrypt.hashSync(password);

      // Make a new postgres db row of the account
      let newChild = new Model.Child({
        name: child.name,
        username: child.username,
        password: hash
      });

      newChild.save({}, {method: 'insert'}).then(function(model) {
        // close modal and refresh page
        res.render('pages/index');
      });
    }
  });
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
                    if (choresJson[currentChore["name"]] === undefined) {
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
            }
        })

        // Get chore templates
        choresJson["Unassigned"] = [];
        client.query('SELECT ct.id, ct.name, ct.description, ct.value ' +
            'FROM chore_template ct LEFT OUTER JOIN parent p ' +
            'ON (ct.owner = p.id) WHERE p.id = 1', function (err, result) {
            done();
            if (err) {
                console.error(err);
            }
            else {
                for (var i = 0; i  < result.rows.length; i++) {
                    var currentChore = result.rows[i];
                    choresJson["Unassigned"].push(
                        {
                            "id": currentChore["id"],
                            "name": currentChore["name"],
                            "description": currentChore["description"],
                            "value": currentChore["value"],
                        });
                }
            }
        });

        // Ensure that there are lists for all children
        // Otherwise the drag-and-drop effect won't work
        var lists = [];
        client.query('SELECT child.name FROM child WHERE child.p_id = 1', function (err, result) {
            done();
            if (err) {
                console.error(err);
            }
            else {
                for (var i = 0; i  < result.rows.length; i++) {
                    var listname = result.rows[i]["name"]
                    lists.push(result.rows[i]["name"]);
                    if (!(listname in choresJson)) {
                        choresJson[listname] = [];
                    }
                }

                // Send to controller
                response.send({selected: null, lists: choresJson});
            }
        });
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
