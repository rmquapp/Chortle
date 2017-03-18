var cool = require('cool-ascii-faces');
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
    console.log(process.env.DATABASE_URL);
  response.render('pages/index');
});

app.get('/cool', function(request, response) {
  response.send(cool());
});

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
                response.send(choresJson);
            }
        })
    });
});
// app.get('/assigned_chore', function (request, response) {
//     var children = [];
//     pg.connect(process.env.DATABASE_URL, function (err, client, done) {
//         client.query('SELECT id FROM child WHERE p_id = 1', function (err, resultChildren) {
//             done();
//             if (err) {
//                 console.error(err);
//                 response.send("Error retrieving child " + err);
//             }
//             else {
//                 for (var i = 0; i < resultChildren; i++) {
//                     children.push(resultChildren[i]);
//                 }
//
//                 if (children.length != 0) {
//                     client.query('SELECT * FROM assigned_chore WHERE owner in (' + children.join(',') + ')', function (errChores, resultChores) {
//                         done();
//                         if (errChores) {
//                             console.error(err);
//                             response.send("Error " + errChores);
//                         }
//                         else {
//                             response.send(resultChores);
//                         }
//
//                     });
//                 }
//             }
//         });
//     });
// });

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


