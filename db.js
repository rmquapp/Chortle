let env = process.env.NODE_ENV || 'development';
let knex = null;

// Connect to local db or the heroku db
if (env === 'development') {
    knex = require('knex')({
        client: 'pg',
        // Uncomment to enable SQL query logging in console.
        // debug   : true,
        connection: {
            host    : '127.0.0.1',
            user    : process.env.whoami,
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


let DB = require('bookshelf')(knex);

module.exports.DB = DB;