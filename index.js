var express = require('express');
var pg = require('pg');

var app = express();

app.set('port', (process.env.PORT || 5000));

// DB get endpoint
app.get('/db', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT name FROM child', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
});

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    //console.log(process.env.DATABASE_URL);
  response.render('pages/index');
});

// Parent Registration Page
app.get('/parent-registration', function(request, response) {
    response.render('pages/parent-registration');
});

// Login Page
app.get('/login', function(request, response) {
    response.render('pages/login');
});

// Child Registration Page
app.get('/child-registration', function(request, response) {
    response.render('pages/child-registration');
});

/*
    Server side REST API endpoints
 */

// Get the chores from the assigned_chore table associated to a parent
app.get('/chores', function(request, response) {

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

                // Ensure that there are lists for all children and also for unassigned chores
                var lists = ["Unassigned"];
                client.query('SELECT child.name FROM child WHERE child.p_id = 1', function (err, result) {
                    done();
                    if (err) {
                        console.error(err);
                    }
                    else {
                        for (var i = 0; i  < result.rows.length; i++) {
                            var listname = result.rows[i]["name"]
                            lists.push(result.rows[i]["name"]);
                        }

                        // Add any empty lists to choresJson, otherwise the drag-and-drop effect won't work
                        for (var index in lists) {
                            if (!(lists[index] in choresJson)) {
                                choresJson[lists[index]] = [];
                            }
                        }
                        response.send({selected: null, lists: choresJson});
                    }
                });
            }
        });
    });
});

// Get the chore template associated to a parent
app.get('/chore_template', function(request, response) {

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
app.get('/children', function(request, response) {
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

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


