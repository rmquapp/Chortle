var env = process.env.NODE_ENV || 'development';
var knex = null;

// Connect to local db or the heroku db
if (env == 'development') {
    knex = require('knex')({
        client: 'pg',
        // Uncomment to enable SQL query logging in console.
        // debug   : true,
        connection: {
            host    : '127.0.0.1',
            user    : 'Diaz',
            password: null,
            database: 'chortle-seng513',
            charset : 'utf8',
        }
    });
} else {
    knex = require('knex')({
        client: 'pg',
        connection: process.env.DATABASE_URL
});
}


var DB = require('bookshelf')(knex);

module.exports.DB = DB;