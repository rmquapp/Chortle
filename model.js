var DB = require('./db').DB,
    knex = DB.knex;

var User = DB.Model.extend({
    tableName: 'parent',
    idAttribute: 'id',
});


// ------------------------------
// createNewUser
// ------------------------------
// Makes a new user in the database with
// automatic incremented ID. Then, returns
// that user's ID after the user is created.
function createNewUser(callback) {
    new User().save().then(function(user) {
        callback(user.toJSON().id);
    });
}

// ------------------------------
// grabUserCredentials
// ------------------------------
// Returns a JSON list of a single user like this:
// {
//     local: {
//          username: 'sampleun'
//          password: 'samplepw'
//     },
//     facebook: {
//          ...
//     },
//     twitter: {
//          ...
//     },
//     google: {
//          ...
//     },
// }
function grabUserCredentials(userId, callback) {
    // Skeleton JSON
    var loginUser = {
        local: {
            username: null,
            password: null,
        },
    };

    // SQL joins to get all credentials/tokens of a single user
    // to fill in loginUser JSON.
    knex.select('parent.id', 'parent.username', 'parent.password')
        .from('parent')
        .where('parent.id', '=', userId).then(function(row) {
        row = row[0];

        if (!row) {
            callback('Could not find user with that ID', null);
        } else {
            // Fill in loginUser JSON
            loginUser.local.username      = row.username;
            loginUser.local.password      = row.password;

            callback(null, loginUser);
        }
    });
};

module.exports = {
    createNewUser       : createNewUser,
    grabUserCredentials : grabUserCredentials,
    User                : User,
};/**
 * Created by Diaz on 2017-03-21.
 */
