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
  response.render('pages/index');
});

// Parent Registration Page
app.get('/parent-registration', function(request, response) {
    response.render('pages/parent-registration');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


