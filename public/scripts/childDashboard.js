/**
 * Created by amygelowitz on 2017-03-20.
 */
// https://docs.angularjs.org/guide/module
(function (angular) {
    'use strict';
    let app = angular.module("childDashboard", ['dndLists', 'ngRoute']);
    app.controller("childDashboardCtrl", function ($scope, $http) {

        $scope.models = {
            selected: null,
            choreList: [],
            pendingApprovalList: [],
            funds: 0
        };

        $scope.updateChecked = function(checked, chore) {
            let status = 'completed';
            if(checked) {
                status = 'completed';
            } else {
                status = 'assigned';
            }
                let data = {
                    id : chore.id,
                    name : chore.name,
                    description : chore.description,
                    value : chore.value,
                    status: status
                }
            $http.put('/child/assigned_chore',data)
                .success(function (data) {
                    $scope.loadData();
                })
                .error(function (error) {
                    console.log("Error updating child assigned_chore endpoint");
                });
        };

        $scope.loadData = function () {
            $http.get('child/assigned_chore').
            success(function(response) {
                let assigned_chores = response["assigned_chores"];
                $scope.models.pendingApprovalList = [];
                $scope.models.choreList = [];
                for (let i = 0; i < assigned_chores.length; i++) {
                    let chore = {
                        id:assigned_chores[i]["id"],
                        name:assigned_chores[i]["name"],
                        description:assigned_chores[i]["description"],
                        value:assigned_chores[i]["value"],
                        status: $scope.formatStatus(assigned_chores[i]["status"])
                    };
                    if(assigned_chores[i]["status"] === "completed"){
                        chore.checked = true;
                        $scope.models.pendingApprovalList.push(chore);
                    } else {
                        $scope.models.choreList.push(chore);
                    }
                    // ensures the same chore is selected on a re-fetch
                    if($scope.models.selected != null && $scope.models.selected.id == chore.id){
                        $scope.models.selected = chore;
                    }
                }
                if($scope.models.selected == null){
                    if($scope.models.choreList.length > 0) {
                        $scope.models.selected = $scope.models.choreList[0];
                    } else if($scope.models.pendingApprovalList.length > 0){
                        $scope.models.selected = $scope.models.pendingApprovalList[0];
                    }
                }
            }).
            error(function(error) {
                console.log("Error accessing child assigned chores endpoint");
            });

            $http.get('/child/funds').
            success(function(response) {
                $scope.models.funds = response["funds"];
            }).
            error(function(error) {
                console.log("Error accessing child funds endpoint");
            });
        };

        //initial load
        $scope.loadData();

        $scope.formatStatus = function(status){
            switch(status){
                case 'completed':
                    return "Pending Approval";
                case 'assigned':
                    return "To Be Completed";
            }
        }
    });

})(window.angular);