(function (angular) {
    'use strict';
    let app = angular.module("parentView", ['dndLists']);
    app.controller("parentViewCtrl", function($scope, $http) {
        $scope.models = {
            childInfo: {},
            childrenLists:[],
            choreTemplates:[],
            parentId: 0,
            parentName: undefined,
            selected: null,
            selectedBank: null
        };

        $http.get('parent').
        success(function (response) {
            $scope.models.parentId = response["pid"];
            $scope.models.parentName = response["name"];
        });

        $http.get('chores').
        success(function(data, status, headers, config) {
            // Loop through returned JSON and populate the children's data into the model
            for (let child in data['lists']) {
                let childList = data['lists'][child]['chores'];
                childList.child_id = data['lists'][child]['child_id'];
                childList.child_name = data['lists'][child]['child_name'];
                $scope.models.childrenLists.push(childList);
            }
            $scope.models.childrenLists.sort(function(a, b){return a.child_name.localeCompare(b.child_name)});
            // Loop through the chore templates and populate the templates for the model
            for (let template in data['template']){
                $scope.models.choreTemplates.push(data['template'][template]);
            }
        }).
        error(function(data, status, headers, config) {
            console.log("Error accessing chores endpoint");
        });

        $http.get('child').
        success(function(response) {
            let children = response["children"];
            let childInfo;
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                let name = child["name"];
                let child_id = child["id"];
                childInfo = {
                    "id": child_id,
                    "piggybank": child["piggybank"],
                    "name": name
                };
                $scope.models.childInfo[child_id] = childInfo;
            }
        }).
        error(function(error) {
            console.log("Error accessing chores endpoint");
        });

        $scope.insertedCallback = function(item,list, closure){
            // Determine if the chore is a template or from another child
            if(item.hasOwnProperty("assigned_child_id")){
                //Dragged from Self
                if(item.assigned_child_id === list.child_id){
                    return;
                }
                // Dragged from another child
                let reassignedChore = {
                    "id": item.id,
                    "owner": list.child_id,
                    "name": item.name,
                    "description": item.description,
                    "value": item.value,
                    "status": item.status,
                };

                // Update with a puth request to API
                $http.put("assigned_chore", reassignedChore).success( function(updatedChore) {
                    item.assigned_child_id = list.child_id;
                    if(closure){
                        closure(item);
                    }
                });
            } else {
                // Dragged from a template
                let newChore =
                    {
                        "owner": parseInt(list.child_id),
                        "name": item['name'],
                        "description": item['description'],
                        "value": parseInt(item['value']) || 0,
                        "status": "assigned"
                    };
                // Add new chore to database
                $http.post("assigned_chore", newChore).success(function(chore) {
                    // Update ID to reflect database
                    item["id"] = chore["id"];
                    item["assigned_child_id"] = list.child_id;
                    item["status"] = "assigned";
                    if(closure){
                        closure(item);
                    }
                }).error(function(error) {
                    console.log("Failed to add chore: " + error);
                });
            }
        };

        $scope.addChoreTemplate = function() {
            let newChoreTemplate =
                {
                    "owner": $scope.models.parentId,
                    "name": $('#add-chore-title').val(),
                    "description": $('#add-chore-description').val(),
                    "value": parseInt($('#add-chore-value').val()) || 0
                };
            $('#add-chore-modal').modal('hide');

            // Insert new chore template into database
            $http.post("chore-template", newChoreTemplate).success(function(chore) {
                // Add new chore template to list of chore templates
                $scope.models.choreTemplates.push(chore);
            }).error(function(error) {
                console.log("Failed to add chore template");
            });
        };

        $scope.saveChore = function() {
            let assignee = document.getElementById('selectChild').value || "Unassigned";
            let item = $scope.models.selected;
            let fromTemplate = !$scope.models.selected.hasOwnProperty("assigned_child_id");
            let editedChoreTemplate =
                {
                    "id": item.id,
                    "name": $('#edit-chore-title').val(),
                    "description": $('#edit-chore-description').val(),
                    "value": parseInt($('#edit-chore-value').val()) || 0,
                }

            // Since the parent can assign AND edit a chore we should push both to the db
            let status = item.status || 'assigned';
            let assignedChore =
                {
                    "id": item.id,
                    "name": $('#edit-chore-title').val(),
                    "description": $('#edit-chore-description').val(),
                    "value": parseInt($('#edit-chore-value').val()) || 0,
                    "status": status
                }

            // Set the list the chore came from just to remove it, if re-assign was successful
            let originatingList;
            if(!fromTemplate){
                assignedChore["assigned_child_id"] = item["assigned_child_id"];
                for (let i = 0; i < $scope.models.childrenLists.length; i++) {
                    if ($scope.models.childrenLists[i].child_id === item["assigned_child_id"]) {
                        originatingList = $scope.models.childrenLists[i];
                    }
                }
            }

            // If we are assigning the chore
            if (assignee !== "Unassigned"){
                for (let i = 0; i < $scope.models.childrenLists.length; i++) {
                    if ($scope.models.childrenLists[i].child_id === assignee) {
                         $scope.insertedCallback(
                             assignedChore,
                             $scope.models.childrenLists[i],
                            function(item){
                                $scope.models.childrenLists[i].push(item);
                                // If needed remove from originating child list
                                if(!fromTemplate && originatingList){
                                    for(let j=0; j<originatingList.length; j++){
                                        if(originatingList[j]["id"] === item["id"]){
                                            originatingList.splice(j,1);
                                        }
                                    }
                                }
                            });
                    }
                }
            }

            if(fromTemplate){
                // If we updated the template
                let updated = !(
                    editedChoreTemplate["id"] === item["id"] &&
                    editedChoreTemplate["name"] === item["name"] &&
                    editedChoreTemplate["description"] === item['description'] &&
                    editedChoreTemplate["value"] === item['value']);
                if(updated){
                    // Update chore template
                    $http.put("chore_template", editedChoreTemplate).success(function(response) {
                        item["id"] = editedChoreTemplate["id"];
                        item["name"] = editedChoreTemplate["name"];
                        item['description'] = editedChoreTemplate["description"];
                        item['value'] = editedChoreTemplate["value"];
                    }).error(function(error) {
                        console.log("Failed to add chore template");
                    });
                }

            }

            $('#edit-chore-modal').modal('hide');
        };

        $scope.movedCallBack = function(item, list, index){
            for(let i=0; i<list.length; i++){
                if(list[i]["id"] === item["id"]){
                    list.splice(i,1);
                    return;
                }
            }
        };

        $scope.choreClicked = function(item) {
            $('#edit-chore-modal').modal('show');

            $('#edit-chore-title').val(item['name']);
            $('#edit-chore-description').val(item['description']);
            $('#edit-chore-value').val(item['value']);

            $scope.models.selected = item;

            // Remove old select options
            removeOptions(document.getElementById('selectChild'));

            // Populate select input for assigning a chore to a child
            let children = [];
            let assignee = item["assigned_child_id"] || 0;

            if(!item.hasOwnProperty("assigned_child_id")){
                let emptyChild = {
                    "id": null,
                    "name": ""
                };
                children.push(emptyChild);
            }
            for( let info in $scope.models.childInfo){
                let child = $scope.models.childInfo[info];
                children.push(child);
            }
            children.sort(function(a, b){
                return a['name'].localeCompare(b['name']);
            });

            let select = document.getElementById('selectChild');
            for (let i = 0; i < children.length; i++) {
                let opt = document.createElement('option');
                opt.value = children[i]['id'];
                opt.innerHTML = "&nbsp&nbsp" + children[i]["name"] + "&nbsp&nbsp&nbsp&nbsp&nbsp";
                select.appendChild(opt);
            }
                select.value = assignee;


            if (item["status"] === 'completed') {
                document.getElementById('approve').classList.toggle("show");
            } else {
                document.getElementById('approve').classList.remove("show");
            }
        }

        $scope.deleteChore = function() {

            let list;
            let assigned = $scope.models.selected.hasOwnProperty("assigned_child_id");
            if (!assigned) {
                list = $scope.models.choreTemplates;
            }
            else {
                for(let i=0; i < $scope.models.childrenLists.length; i++){
                    if($scope.models.childrenLists[i].child_id === $scope.models.selected["assigned_child_id"]){
                        list = $scope.models.childrenLists[i];
                        break;
                    }
                }
            }

            for (let i = 0; i < list.length; i++) {
                if (list[i]["id"] === $scope.models.selected["id"]) {
                    list.splice(i, 1);
                    break;
                }
            }
            $('#edit-chore-modal').modal('hide');

            // Delete from database
            if (!assigned) {
                //Delete chore template from database
                $http.delete("/chore_template/:" + $scope.models.selected["id"], $scope.models.selected)
                    .success(function(response) {
                }).error(function(error) {
                    console.log("Failed to add chore template");
                });
            }
            else {
                //Delete assigned chore from database
                $http.delete("/assigned_chore/:" + $scope.models.selected["id"], $scope.models.selected)
                    .success(function(response) {
                }).error(function(error) {
                    console.log("Failed to add assigned chore");
                });
            }
        }

        $scope.approveChore = function () {
            let item = $scope.models.selected;
            let childId = $scope.models.selected["assigned_child_id"];

            $('#edit-chore-modal').modal('hide');

            $http.put("/child/add_funds", {childId: childId, value: parseInt(item.value)})
                .success(function(data) {
                    if ( data.success) {
                        window.location = '/';
                    }
                })
                .error(function (error) {
                    console.log("Failed to add assigned chore");
                });

            $scope.deleteChore();
        }

        $scope.showPiggybankModal = function(list) {
            $scope.models.selectedBank = $scope.models.childInfo[list.child_id];

            $('#piggybank-modal').modal('show');
            document.getElementById("piggybank-modal-title").innerHTML = $scope.models.selectedBank["name"] + "'s Piggybank";
            let value = $scope.models.childInfo[list.child_id]["piggybank"];
            document.getElementById("cashoutValue").value = value;
            document.getElementById("cashoutValue").max = value;
        }

        $scope.emptyPiggybank = function() {
            if ($scope.models.selectedBank !== null) {
                let childId = $scope.models.selectedBank["id"];
                let value = document.getElementById("cashoutValue").value;
                let data = {
                    "childId": childId,
                    "value": value
                };

                $http.put("/child/remove_funds", data).success(function(response) {
                    if (response.error) {
                        $('#warning').text(response.error);
                        return;
                    }

                    // Update piggybank on screen
                    $scope.models.selectedBank["piggybank"] = response["piggybank"];
                    $scope.models.selectedBank = null;
                    $('#piggybank-modal').modal('hide');
                }).error(function(error) {
                    $('#warning').text("Failed to withdraw funds");
                    $scope.models.selectedBank = null;
                });
            }
        }
    });

    $(function(){
        $("#add").on("click",function() {
            $('#add-chore-modal').modal('show');

            $('#add-chore-title').val("");
            $('#add-chore-description').val(null);
            $('#add-chore-value').val(null);

            $('#add-chore-title').focus();
            return false;
        });

        $("#add-child").on("click", function () {
            $("#addChild").modal('show');

            $('#child-name').val("");
            $('#child-psw').val("");
            $('#child-psw-repeat').val("");
            $('#child-username').val("");

            return false;
        });
    });

    // Doesn't work, help pls
    $('#chore-modal').on('show.bs.modal', function () {
        window.setTimeout(function ()
        {
            $('#add-chore-title').focus();
        }, 0);
    });

    function removeOptions(selectbox)
    {
        let i;
        for(i = selectbox.options.length - 1 ; i >= 0 ; i--)
        {
            selectbox.remove(i);
        }
    }
})(window.angular);

//https://scotch.io/tutorials/submitting-ajax-forms-with-jquery#submitting-the-form-using-ajax-magicjs
$(document).ready(function() {

    // process the form
    $('#addChildForm').submit(function (event) {

        // get the form data
        let formData = {
            'name': $('input[name=name]').val(),
            'username': $('input[name=username]').val(),
            'pwd': $('input[name=pwd]').val(),
            'pwdRepeat': $('input[name=pwdRepeat]').val(),
        };

        // process the form
        $.ajax({
            type: 'POST', // define the type of HTTP verb we want to use (POST for our form)
            url: '/child', // the url where we want to POST
            data: formData, // our data object
            dataType: 'json', // what type of data do we expect back from the server
            encode: true
        })
        // using the done promise callback
            .done(function (data) {

                if ( !data.success) {
                    $('#warning').text(data.error);
                } else {
                    window.location = "/";
                }
            });

        // stop the form from submitting the normal way and refreshing the page
        event.preventDefault();
    });
});