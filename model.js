/**
 * Created by Diaz on 2017-03-21.
 */

var DB = require('./db').DB,
    knex = DB.knex;

// Models of objects we are using from the db
var Parent = DB.Model.extend({
    tableName: 'parent',
    idAttribute: 'id',
});

var AssignedChore = DB.Model.extend({
    tableName: 'assigned_chore',
    idAttribute: 'id',
});

var ChoreTemplate = DB.Model.extend({
    tableName: 'chore_template',
    idAttribute: 'id'
});

var Child = DB.Model.extend({
    tableName: 'child',
    idAttribute: 'id'
});

// Parent functionality
// ------------------------------
// createNewParent
// ------------------------------
// Makes a new user in the database with
// automatic incremented ID. Then, returns
// that user's ID after the user is created.
function createNewParent(callback) {
    new Parent().save().then(function(parent) {
        callback(parent.toJSON().id);
    });
}

// ------------------------------
// grabParentCredentials
// ------------------------------
// Returns a JSON list of a single user like this:
// {
//     local: {
//          username: 'sampleun'
//          password: 'samplepw'
//      }
// }

function grabParentCredentials(userId, callback) {
    // Skeleton JSON
    var loginParent = {
        local: {
            username: null,
            password: null,
        },
    };

    // SQL joins to get all credentials/tokens of a single user
    // to fill in loginParent JSON.
    knex.select('parent.id', 'parent.username', 'parent.password')
        .from('parent')
        .where('parent.id', '=', userId).then(function(row) {
        row = row[0];

        if (!row) {
            callback('Could not find user with that ID', null);
        } else {
            // Fill in loginParent JSON
            loginParent.local.username      = row.username;
            loginParent.local.password      = row.password;

            callback(null, loginParent);
        }
    });
};

// Child functionality
function createNewChild(callback) {
    new Child().save().then(function (child) {
        callback(child.toJSON().id);
    });
}


function grabChildCredentials(childId, callback) {
    var loginChild = {
        local: {
            username: null,
            password: null
        }
    };

    knex.select('child.id', 'child.username', 'child.password')
        .from('child')
        .where('child.id', '=', childId).then(function(row) {
       row = row[0];

       if (!row) {
           callback('Could not find child user with that ID', null);
       }
       else {
           loginChild.local.username = row.username;
           loginChild.local.password = row.password;
           callback(null, loginChild);
       }
    });
}

// Assigned Chores functionality
function createNewAssignedChore(callback) {
    new AssignedChore().save().then(function (assignedChore) {
        callback(assignedChore.toJSON().id);
    })
}

// Chore template functionality
function createNewChoreTemplate(callback) {
    new TemplateChore().save().then(function (choreTemplate) {
        callback(choreTemplate.toJSON().id);
    })
}

function grabChildrenFromParent(parentId, callback) {
    var childrenFromParent = [];

    knex.select('child.id')
        .from('child')
        .where('child.p_id', '=', parentId).then( function (row) {
            if (row.length <= 0) {
                callback('Could not find children for parent', null);
            }
            else {
                for (var i = 0; i < row.length; i++) {
                    childrenFromParent.push(row[i].id);
                }
                callback(null, childrenFromParent);
            }
    })
}

module.exports = {
    createNewParent         : createNewParent,
    grabParentCredentials   : grabParentCredentials,
    createNewChild          : createNewChild,
    grabChildCredentials    : grabChildCredentials,
    createNewAssignedChore  : createNewAssignedChore,
    createNewChoreTemplate  : createNewChoreTemplate,
    grabChildrenFromParent  : grabChildrenFromParent,
    Parent                  : Parent,
    AssignedChore           : AssignedChore,
    ChoreTemplate           : ChoreTemplate,
    Child                   : Child,
};
