var express             = require('express'),
    Model               = require('./model'),
    router              = require('./routes/router.js'),
    path                = require('path'),
    bcrypt              = require('bcrypt-nodejs'),
    passport            = require('passport'),
    session             = require('express-session'),
    bodyParser          = require('body-parser'),
    expressSanitizer    = require('express-sanitizer');
    app                 = express();

app.set('port', (process.env.PORT || 5000));

require('./passport.js')(passport);

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(expressSanitizer());
app.use(bodyParser.json());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'hamster kitten fight'
}));

app.use(passport.initialize());
app.use(passport.session());

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use('/', router);

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});