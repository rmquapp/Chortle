/**
 * Created by amygelowitz on 2017-03-20.
 */

// https://docs.angularjs.org/guide/module
(function (angular) {
  'use strict';

  let app = angular.module("childrenApp", ['dndLists', 'ngRoute']);

  app.controller("childCtrl", function ($scope, service) {
    $scope.models = {
      selected: true,
      list: []
    };

    $scope.$watch(function combinedWatch() {
      return {
        models: {
          selected: $scope.selected,
          list: $scope.list,
        }
      };
    }, function (value) {
      if (!value.models.list) {
        $scope.models.list = [];

        let promise = service.getHistoricalDataWithQ();

        promise.then(function (data) {
          $scope.models.list = data.children;
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
        let url = 'https://chortle-seng513.herokuapp.com/children';

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
