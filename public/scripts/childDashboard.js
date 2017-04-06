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

        $http.get('child/assigned_chore').
        success(function(response) {
            let assigned_chores = response["assigned_chores"];
            for (let i = 0; i < assigned_chores.length; i++) {
                let chore = {
                    id:assigned_chores[i]["id"],
                    name:assigned_chores[i]["name"],
                    description:assigned_chores[i]["description"],
                    value:assigned_chores[i]["value"],
                    status:assigned_chores[i]["status"]
                };
                if(assigned_chores[i]["status"] === "completed"){
                    $scope.models.pendingApprovalList.push(chore);
                } else {
                    $scope.models.choreList.push(chore);
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
            console.log(response);
        }).
        error(function(error) {
            console.log("Error accessing child funds endpoint");
        });

        $scope.$watch(
            function combinedWatch() {
                return {
                    models: {
                        selected: $scope.models.selected,
                        choreList: $scope.models.choreList,
                        pendingApprovalList: $scope.models.pendingApprovalList,
                        funds: $scope.models.funds
                    }
            };
        }, function (value) {
            if (!value.models.choreList) {
                $scope.models.choreList = [];
                let promise = service.getHistoricalDataWithQ();
                promise.then(function (data) {
                    $scope.models.choreList = data.choreList;
                });
            }
            if (!value.models.pendingApprovalList) {
                $scope.models.pendingApprovalList = [];
                let promise = service.getHistoricalDataWithQ();
                promise.then(function (data) {
                    $scope.models.pendingApprovalList = data.pendingApprovalList;
                });
            }
            if (!value.models.funds) {
                $scope.models.funds = 0;
                let promise = service.getHistoricalDataWithQ();
                promise.then(function (data) {
                    $scope.models.funds = data.funds;
                });
            }
        }, true);
    });
// http://stackoverflow.com/questions/14154767/angular-js-refresh-service-inside-a-controller
    app.factory('service', function ($q, $http) {
        return {
            // return a promise to controller
            getHistoricalDataWithQ: function () {
                let deferred = $q.defer();
                let url = 'https://chortle-seng513.herokuapp.com/chores';
                $http.get(url)
                    .success(function (data) {
                        deferred.resolve(data);
                    })
                    .error(function (error) {
                        console.log(JSON.stringify(error));
                    });
                return deferred.promise;
            }
        }
    });
})(window.angular);