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
            choreList: []
        };

        $http.get('child/assigned_chore').
        success(function(response) {
            let assigned_chores = response["assigned_chores"];
            for (let i = 0; i < assigned_chores.length; i++) {
                $scope.models.choreList.push({
                    id:assigned_chores[i]["id"],
                    name:assigned_chores[i]["name"],
                    description:assigned_chores[i]["description"],
                    value:assigned_chores[i]["value"],
                    status:assigned_chores[i]["status"]
                });
            }
            if($scope.models.selected == null && $scope.models.choreList.length > 0){
                $scope.models.selected = $scope.models.choreList[0];
            }
        }).
        error(function(error) {
            console.log("Error accessing child assigned chores endpoint");
        });


        $scope.$watch('models.choreList', function(model) {
            $scope.modelAsJson = angular.toJson(model, true);
        }, true);
        // $scope.$watch(
        //     function combinedWatch() {
        //         return {
        //             models: {
        //                 selected: $scope.models.selected,
        //                 choreList: $scope.models.choreList,
        //             }
        //     };
        // }, function (value) {
        //     if (!value.models.choreList) {
        //         // $scope.models.choreList = [];
        //         // let promise = service.getHistoricalDataWithQ();
        //         // promise.then(function (data) {
        //         //     $scope.models.choreList = data.choreList;
        //         // });
        //     }
        // }, true);
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