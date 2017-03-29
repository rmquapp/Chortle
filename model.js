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
            id:       null
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
            loginParent.local.id            = row.id;

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

    knex.select('child.id', 'child.name')
        .from('child')
        .where('child.p_id', '=', parentId).then( function (row) {
            if (row.length <= 0) {
                callback('Could not find children for parent', null);
            }
            else {
                for (var i = 0; i < row.length; i++) {
                    childrenFromParent.push(row[i]);
                }
                callback(null, childrenFromParent);
            }
    })
}

// Given the child Id, obtain all the chores assigned to it
function getAllAssignedChores(childId, callback) {
    var assignedChores = [];

    knex.select('assigned_chore.id', 'assigned_chore.name', 'assigned_chore.description', 'assigned_chore.value', 'assigned_chore.status')
        .from('assigned_chore')
        .where('assigned_chore.owner', '=', childId). then ( function (row) {
            if (row.length <= 0) {
                callback('Could not assigned chores for child', null);
            }
            else {
                for (var i = 0; i < row.length; i++) {
                    assignedChores.push(row[i]);
                }
                callback(null, {assigned_chores: assignedChores});
            }
    });
}

function getAssignedChoresParent(parentId, callback) {
    var assignedChores = [];

    knex.select('assigned_chore.id', 'assigned_chore.name', 'assigned_chore.description', 'assigned_chore.value',
        'assigned_chore.status', 'child.name as child_name')
        .from('assigned_chore').leftOuterJoin('child', 'child.p_id', parentId)
        .then ( function (row) {
        if (row.length <= 0) {
            callback('Could not find assigned chores', null);
        }
        else {
            for (var i = 0; i < row.length; i++) {
                assignedChores.push(row[i]);
            }
            callback(null, {assigned_chores: assignedChores});
        }
    });
}

function getChoreTemplateParent(parentId, callback) {
    var choreTemplate = [];

    knex.select('chore_template.id', 'chore_template.owner', 'chore_template.name', 'chore_template.description',
        'chore_template.value')
        .from('chore_template')
        .where('chore_template.owner', '=', parentId)
        .then ( function (row) {
            if (row.length <= 0) {
                callback('Could not find chores template', null);
            }
            else {
                callback(null, {chore_template: row});
            }
        });
}

function getChoreTemplate(choreId, callback) {
    var choreTemplate = null;

    knex.select('chore_template.id', 'chore_template.owner', 'chore_template.name', 'chore_template.description',
        'chore_template.value')
        .from('chore_template')
        .where('chore_template.id', '=', choreId)
        .then ( function (row) {
            if (row.length <= 0) {
                callback('Could not find chores template', null);
            }
            else {
                callback(null, row[0]);
            }
        });
}

function deleteChoreTemplate(choreId, callback) {

    knex('chore_template')
        .where('chore_template.id', '=', choreId)
        .del()
        .then ( function (row) {
            if (row.length <= 0) {
                callback('Could not find chores template', null);
            }
            else {
                callback(null, " chore_template with id " + choreId + " deleted");
            }
        });
}
module.exports = {
    createNewParent         : createNewParent,
    grabParentCredentials   : grabParentCredentials,
    createNewChild          : createNewChild,
    grabChildCredentials    : grabChildCredentials,
    createNewAssignedChore  : createNewAssignedChore,
    createNewChoreTemplate  : createNewChoreTemplate,
    grabChildrenFromParent  : grabChildrenFromParent,
    getAllAssignedChores    : getAllAssignedChores,
    getAssignedChoresParent : getAssignedChoresParent,
    getChoreTemplateParent  : getChoreTemplateParent,
    getChoreTemplate        : getChoreTemplate,
    deleteChoreTemplate     : deleteChoreTemplate,
    Parent                  : Parent,
    AssignedChore           : AssignedChore,
    ChoreTemplate           : ChoreTemplate,
    Child                   : Child,
};
