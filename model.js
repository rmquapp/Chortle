/**
 * Created by Diaz on 2017-03-21.
 */

let DB = require('./db').DB,
    knex = DB.knex;

// Models of objects we are using from the db
let Parent = DB.Model.extend({
    tableName: 'parent',
    idAttribute: 'id',
});

let AssignedChore = DB.Model.extend({
    tableName: 'assigned_chore',
    idAttribute: 'id',
});

let ChoreTemplate = DB.Model.extend({
    tableName: 'chore_template',
    idAttribute: 'id'
});

let Child = DB.Model.extend({
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
    let loginParent = {
        local: {
            username: null,
            password: null,
            id:       null,
            role:     null,
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
            loginParent.local.role           = 'parent';

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
    let loginChild = {
        local: {
            username: null,
            password: null,
            id      : null,
            role    : null,
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
           loginChild.local.username    = row.username;
           loginChild.local.password    = row.password;
           loginChild.local.id          = row.id;
           loginChild.local.role      = 'child';
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
    let childrenFromParent = [];

    knex.select('child.id', 'child.name', 'child.piggybank')
        .from('child')
        .where('child.p_id', '=', parentId).then( function (row) {
            for (let i = 0; i < row.length; i++) {
                childrenFromParent.push(row[i]);
            }
            callback(null, childrenFromParent);
    })
}
/*
 * Assigned chore database functionality
 */

// Given a child Id, obtain all the chores assigned to it
function getAssignedChoreChild(childId, callback) {
    let assignedChores = [];

    knex.select('assigned_chore.id', 'assigned_chore.name', 'assigned_chore.description', 'assigned_chore.value', 'assigned_chore.status')
        .from('assigned_chore')
        .where('assigned_chore.owner', '=', childId). then ( function (row) {
            for (let i = 0; i < row.length; i++) {
                assignedChores.push(row[i]);
            }
            callback(null, {assigned_chores: assignedChores});
    });
}

// given a parent id, obtain all the chores from children
function getAssignedChoresParent(parentId, callback) {
    let assignedChores = [];
    knex.select(
            'assigned_chore.id as chore_id',
            'assigned_chore.name as chore_name',
            'assigned_chore.description',
            'assigned_chore.value',
            'assigned_chore.status',
            'child.name as child_name',
            'child.id as child_id')
        .from('assigned_chore')
        .leftOuterJoin('child', 'child.id', 'assigned_chore.owner')
        .where('child.p_id', '=', parentId)
        .then ( function (row) {
            for (let i = 0; i < row.length; i++) {
                assignedChores.push(row[i]);
            }
            callback(null, {assigned_chores: assignedChores});
    });
}

// given a chore id, obtain all the chores from children
function getAssignedChore(choreId, callback) {
    knex.select(
            'assigned_chore.id',
            'assigned_chore.name',
            'assigned_chore.owner',
            'assigned_chore.description',
            'assigned_chore.value',
            'assigned_chore.status')
        .from('assigned_chore')
        .where('assigned_chore.id', '=', choreId)
        .then ( function (row) {
            if (row.length <= 0) {
                callback(null, null);
            }
            else {
                callback(null, row[0]);
            }
        });
}

function deleteAssignedChore(choreId, callback) {

    knex('assigned_chore')
        .where('assigned_chore.id', '=', choreId)
        .del()
        .then ( function (row) {
            if (row.length <= 0) {
                callback(null, null);
            }
            else {
                callback(null, "assigned_chore with id " + choreId + " deleted");
            }
        });
}
/*
 * Chore template database functionality
 */
function getChoreTemplateParent(parentId, callback) {

    knex.select('chore_template.id', 'chore_template.owner', 'chore_template.name', 'chore_template.description',
        'chore_template.value')
        .from('chore_template')
        .where('chore_template.owner', '=', parentId)
        .then ( function (row) {
            if (row.length <= 0) {
                callback(null, null);
            }
            else {
                callback(null, {chore_template: row});
            }
        });
}

function getChoreTemplate(choreId, callback) {

    knex.select('chore_template.id', 'chore_template.owner', 'chore_template.name', 'chore_template.description',
        'chore_template.value')
        .from('chore_template')
        .where('chore_template.id', '=', choreId)
        .then ( function (row) {
            if (row.length <= 0) {
                callback(null, null);
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
                callback(null, null);
            }
            else {
                callback(null, " chore_template with id " + choreId + " deleted");
            }
        });
}

function getChild(childId, callback) {

    knex.select('child.id', 'child.username', 'child.name', 'child.p_id',
        'child.piggybank')
        .from('child')
        .where('child.id', '=', childId)
        .then ( function (row) {
            if (row.length <= 0) {
                callback(null, null);
            }
            else {
                callback(null, row[0]);
            }
        });
}

function setStatusAssignedChore(choreId, status, callback) {

    knex('assigned_chore')
        .where('assigned_chore.id', '=', choreId)
        .update({status: status})
        .then( function (row) {
            if (row.length <=0) {
                callback('Could not update assigned chore', null);
            }
            else {
                callback(null, " assigned chore with id " + choreId + " was updated");
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
    getAssignedChoresParent : getAssignedChoresParent,
    getAssignedChoreChild   : getAssignedChoreChild,
    getChoreTemplateParent  : getChoreTemplateParent,
    getChoreTemplate        : getChoreTemplate,
    deleteChoreTemplate     : deleteChoreTemplate,
    getAssignedChore        : getAssignedChore,
    deleteAssignedChore     : deleteAssignedChore,
    getChild                : getChild,
    setStatusAssignedChore   : setStatusAssignedChore,
    Parent                  : Parent,
    AssignedChore           : AssignedChore,
    ChoreTemplate           : ChoreTemplate,
    Child                   : Child,
};
