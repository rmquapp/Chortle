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

/*
 * Error messages
 */
let ERROR = {
    NOT_LOGGED: "User not logged in",
    NOT_AUTHORIZED: "User not authorized to do this change",
};

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
        res.render('/');
    } else {
        res.render('pages/login');
    }
});

// Authenticate user functionality
router.post('/signin', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/signin'
}));


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
    if (request.isAuthenticated()) {
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
            })

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
    } else {
        response.send({error: 'User not logged in'});
    }
});

// Keeping this in case is being used by the front end
// router.post('/chore_template') should be used instead to conform with naming convention for chore_template resource
router.post('/chore-template', function(req, res, next) {
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


/**
 *
 * Chore template endpoints
 */

/*
 * Via GET https://chortle-seng513.herokuapp.com/chore_template
 *
 * It requires user authenticated
 * It returns all the chore_template entries found for user (parent)
 * in an array following this format:
 *  {
 *      id: 2, (id of the chore_template
 *      owner: 2 (parent.id of chore template
 *      name: "Name of the chore template",
 *      description: "Description of this chore template",
 *      value: 20 (monetary value of this chore)
 *  }
 */
router.get('/chore_template', function(request, response) {
    if (!request.isAuthenticated()) {
        response.send({error: ERROR.NOT_LOGGED});
    }
    else {
        let parentId = request.user.local.id;
        Model.getChoreTemplateParent(parentId, function (error, data) {
            if (error) {
                response.send({error: error});
            }
            else {
                if (data) {
                    response.send(data);
                }
            }
        });
    }
});

/*
 * Via POST https://chortle-seng513.herokuapp.com/chore_template
 * Requires user authenticated and a form with the following:
 * {
 *  name: "Name of chore template",
 *  description: "Description of this chore template",
 *  value: 20
 * }
 * It returns a json object with the chore_template that was just created
 */
router.post('/chore_template', function (request, response) {
    if (!request.isAuthenticated()) {
        response.send({error: ERROR.NOT_LOGGED});
    }
    else {
        let jsonKeys = ['name', 'description', 'value'];
        let parentId = request.user.local.id;

        // Ensure name, description and value are present in the form received
        for (var i = 0; i < jsonKeys.length; i++) {
            if (!request.body.hasOwnProperty(jsonKeys[i])) {
                return response.send({error: "Missing parameter: " + jsonKeys[i]});
            }
        }

        // Create new chore_template object
        var choreTemplate = new Model.ChoreTemplate({
            owner : parentId,
            name  : request.body.name,
            description : request.body.description,
            value : request.body.value
        });

        choreTemplate.save({}, {method: 'insert'}).then ( function (model) {
            response.json(model);
        });

    }
});

/*
 * Via PUT https://chortle-seng513.herokuapp.com/chore_template
 * Requires user authenticated and a form with the following:
 * {
 *  id : 2 (id of the chore_template)
 *  name : "Name of chore template",
 *  description : "Description of this chore template",
 *  value : 20
 * }
 * It returns a json object with the chore_template that was updated
 */
router.put('/chore_template', function (request, response) {
    if (!request.isAuthenticated()) {
        response.send({error: ERROR.NOT_LOGGED});
    }
    else {
        let jsonKeys = ['id', 'name', 'description', 'value'];
        let parentId = request.user.local.id;
        // Ensure id, name, description and value are present in the form received
        for (var i = 0; i < jsonKeys.length; i++) {
            if (!request.body.hasOwnProperty(jsonKeys[i])) {
                return response.send({error: "Missing parameter: " + jsonKeys[i]});
            }
        }

        // Obtain chore_template from db, ensure it belongs to parent with id parentId
        Model.getChoreTemplate(request.body.id, function (error, oldChoreTemplate) {
            if (error) {
                return response.send({error: error});
            }
            else {
                if (oldChoreTemplate.owner != parentId) {
                    return response.send({error: ERROR.NOT_AUTHORIZED});
                }
                else {
                    // Create new chore_template object
                    var choreTemplate = new Model.ChoreTemplate({
                        id          : request.body.id,
                        owner       : parentId,
                        name        : request.body.name,
                        description : request.body.description,
                        value       : request.body.value
                    });

                    choreTemplate.save({}, {method: 'update'}).then ( function (model) {
                        response.json(model);
                    });
                }
            }
        });

    }
});

/*
 * Via DELETE https://chortle-seng513.herokuapp.com/chore_template/:id
 * Requires user authenticated. It will only delete chore_template entries that belong to parent
 * It returns a json object with the message
 */
router.delete('/chore_template/:id', function (request, response) {
    if (!request.isAuthenticated()) {
        response.send({error: ERROR.NOT_LOGGED});
    }
    else {
        let choreId = request.params.id;
        let parentId = request.user.local.id;
        if (choreId) {
            Model.getChoreTemplate(choreId, function (error, oldChoreTemplate) {
                if (error) {
                    return response.send({error: error});
                }
                else {

                    if (oldChoreTemplate.owner !== parentId) {
                        return response.send({error: ERROR.NOT_AUTHORIZED});
                    }
                    else {
                        Model.deleteChoreTemplate(choreId, function (error, message) {
                           if (error) {
                               return response.send({error: error});
                           }
                           else {
                               response.send({delete_chore_template: message});
                           }
                        });
                    }

                }
            });
        }
    }
});

/**
 *
 * Assigned chores endpoints
 */

/*
 * Via GET https://chortle-seng513.herokuapp.com/parent/assigned_chore
 *
 * It requires user of type parent authenticated
 * It returns all the assigned_chores entries found for children of parent
 * in an array following this format:
 *  {
 *      id: 2, (id of the chore_template
 *      owner: 2 (parent.id of chore template
 *      name: "Name of the chore template",
 *      description: "Description of this chore template",
 *      value: 20 (monetary value of this chore)
 *  }
 */
router.get('/parent/assigned_chore', function (request, response) {
    if (!request.isAuthenticated()) {
        response.send({error: ERROR.NOT_LOGGED});
    }
    else {
        let parentId = request.user.local.id;
        Model.getAssignedChoresParent(parentId, function (error, data) {
            if (error) {
                response.send({error: error});
            }
            else {
                if (data) {
                    response.send(data);
                }
            }
        });
    }
});

/*
 * Via GET https://chortle-seng513.herokuapp.com/child/assigned_chore
 *
 * It requires user of type child authenticated
 * It returns all the assigned_chores entries found for child
 *  {
 *      id: 2, (id of the chore_template
 *      owner: 2 (parent.id of chore template
 *      name: "Name of the chore template",
 *      description: "Description of this chore template",
 *      value: 20 (monetary value of this chore)
 *  }
 */
router.get('/child/assigned_chore', function (request, response) {
    if (!request.isAuthenticated()) {
        response.send({error: ERROR.NOT_LOGGED});
    }
    else {
        let childId = request.user.local.id;
        Model.getAssignedChoreChild(childId, function (error, data) {
            if (error) {
                response.send({error: error});
            }
            else {
                if (data) {
                    response.send(data);
                }
            }
        });
    }
});

/*
 * Via POST https://chortle-seng513.herokuapp.com/assigned_chore
 * Requires parent authenticated and a form with the following:
 * {
 *  name: "Name of chore template",
 *  owner: 2 (id of the child assigned)
 *  description: "Description of this chore template",
 *  value: 20
 *  status: 'assigned'
 * }
 * It returns a json object with the assigned_chore that was just created
 */
router.post('/assigned_chore', function (request, response) {
    if (!request.isAuthenticated()) {
        response.send({error: ERROR.NOT_LOGGED});
    }
    else {
        let jsonKeys = ['name', 'owner', 'description', 'value'];
        let parentId = request.user.local.id;

        // Ensure name, description and value are present in the form received
        for (var i = 0; i < jsonKeys.length; i++) {
            if (!request.body.hasOwnProperty(jsonKeys[i])) {
                return response.send({error: "Missing parameter: " + jsonKeys[i]});
            }
        }
        // Ensure child belongs to parent
        let childId = request.body.owner;
        Model.grabChildrenFromParent(parentId, function (error, children) {
            if (error) {
                return response.send({error: error});
            }
            else {
                let childFound = false;

                for ( var i=0; i < children.length; i++) {
                    if(childId === children[i].id) {
                        childFound = true;
                        return;
                    }
                }
                if (childFound) {

                    // Create new assigned_chore object
                    var assignedChore = new Model.AssignedChore({
                        owner : request.body.owner,
                        name  : request.body.name,
                        description : request.body.description,
                        value : request.body.value,
                        status: request.body.status,
                    });

                    assignedChore.save({}, {method: 'insert'}).then ( function (model) {
                        response.json(model);
                    });
                }
                else {
                    return response.send({error: ERROR.NOT_AUTHORIZED});
                }

            }

        });

    }
});

/*
 * Via PUT https://chortle-seng513.herokuapp.com/assigned_chore
 * Requires parent authenticated and a form with the following:
 * {
 *  id : 2 (id of the assigned_chore)
 *  owner: 3 (child id that the chore_template is assigned to)
 *  name : "Name of chore template",
 *  description : "Description of this chore template",
 *  value : 20
 *  status: 'assigned'
 * }
 * It returns a json object with the chore_template that was updated
 */
router.put('/assigned_chore', function (request, response) {
    if (!request.isAuthenticated()) {
        response.send({error: ERROR.NOT_LOGGED});
    }
    else {
        let jsonKeys = ['id', 'owner', 'name', 'description', 'value', 'status'];
        // Ensure id, name, description and value are present in the form received
        for (var i = 0; i < jsonKeys.length; i++) {
            if (!request.body.hasOwnProperty(jsonKeys[i])) {
                return response.send({error: "Missing parameter: " + jsonKeys[i]});
            }
        }

        // Obtain assigned_chore from db, ensure it exists
        Model.getAssignedChore(request.body.id, function (error, oldAssignedChore) {
            if (error) {
                return response.send({error: error});
            }
            else {
                // Create new chore_template object
                var assignedChore = new Model.AssignedChore({
                    id          : request.body.id,
                    owner       : request.body.owner,
                    name        : request.body.name,
                    description : request.body.description,
                    value       : request.body.value,
                    status      : request.body.status,
                });

                assignedChore.save({}, {method: 'update'}).then ( function (model) {
                    response.json(model);
                });
            }
        });
    }
});

/*
 * Via PUT https://chortle-seng513.herokuapp.com/child/assigned_chore
 * Requires child authenticated and a form with the following:
 * {
 *  id : 2 (id of the assigned_chore)
 *  name : "Name of chore template",
 *  description : "Description of this chore template",
 *  value : 20
 *  status: 'assigned'
 * }
 * It returns a json object with the chore_template that was updated
 */
router.put('/child/assigned_chore', function (request, response) {
    if (!request.isAuthenticated()) {
        response.send({error: ERROR.NOT_LOGGED});
    }
    else {
        let jsonKeys = ['id', 'name', 'description', 'value', 'status'];
        let childId = request.user.local.id;
        // Ensure id, name, description and value are present in the form received
        for (var i = 0; i < jsonKeys.length; i++) {
            if (!request.body.hasOwnProperty(jsonKeys[i])) {
                return response.send({error: "Missing parameter: " + jsonKeys[i]});
            }
        }

        // Obtain assigned_chore from db, ensure it exists
        Model.getAssignedChore(request.body.id, function (error, oldAssignedChore) {
            if (error) {
                return response.send({error: error});
            }
            else {
                // Create new chore_template object
                var assignedChore = new Model.AssignedChore({
                    id          : request.body.id,
                    owner       : childId,
                    name        : request.body.name,
                    description : request.body.description,
                    value       : request.body.value,
                    status      : request.body.status,
                });

                assignedChore.save({}, {method: 'update'}).then ( function (model) {
                    response.json(model);
                });
            }
        });
    }
});

/*
 * Via DELETE https://chortle-seng513.herokuapp.com/assigned_chore/:id
 * Requires parent authenticated. It will only delete assigned_chore entries that belong to children of the parent
 * It returns a json object with the message
 */
router.delete('/assigned_chore', function (request, response) {
    if (!request.isAuthenticated()) {
        response.send({error: ERROR.NOT_LOGGED});
    }
    else {
        let choreId = request.params.id;
        let role = request.user.local.role;
        if (choreId && role === 'parent') {
            Model.getAssignedChore(choreId, function (error, oldChoreTemplate) {
                if (error) {
                    return response.send({error: error});
                }
                else {
                    Model.deleteAssignedChore(choreId, function (error, message) {
                        if (error) {
                            return response.send({error: error});
                        }
                        else {
                            response.send({delete_chore_template: message});
                        }
                    });
                }
            });
        }
        else {
            return response.send({error: ERROR.NOT_AUTHORIZED});
        }
    }
});


// Function to create chores
router.post('/chores', function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect(307, '/');
    }
    else {
        var jsonKeys = ['parentId', 'owner', 'name', 'description', 'value', 'status'];

        var choreToCreate = req.body;
        for (var i = 0; i < jsonKeys.length; i++) {
            if (!choreToCreate.hasOwnProperty(jsonKeys[i])) {
                return res.json({"error": "Missing parameter in assigned chore"});
            }

        }
        // Check child assigned (owner) exists
        Model.grabChildCredentials(choreToCreate['owner'], function (error, data) {
            if (error) {
                return res.json({"error": error});
            }
        });
        // Check parent has child with id == owner
        Model.grabChildrenFromParent(choreToCreate["parentId"], function (error, data) {
            if (error) {
                return res.json({"error": error});
            }
            else {
                if (!data.includes(parseInt(choreToCreate['owner']))) {
                    return res.json({"error": "Child assigned to chore does not belong to parent"});
                }
            }
        });


        var assignedChore = new Model.AssignedChore({
            owner       : choreToCreate.owner,
            name        : choreToCreate.name,
            description : choreToCreate.description,
            value       : choreToCreate.value,
            status      : choreToCreate.status
        });

        assignedChore.save({}, {method: 'insert'}).then(function(model) {

            res.json(assignedChore);
        });
    }
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
