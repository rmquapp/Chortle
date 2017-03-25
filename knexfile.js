// Update with your config settings.
require('dotenv').config();

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
                host    : '127.0.0.1',
                user    : 'Diaz',
                password: null,
                database: 'chortle-seng513',
                charset : 'utf8',
            },
    debug: true
  },


  production: {
    client: 'postgresql',
    connection: {
                database: process.env.DATABASE_URL + '?ssl=true'
            },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
