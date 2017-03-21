/**
 * Created by amygelowitz on 2017-03-20.
 */

(function (angular) {
  'use strict';

  var app = angular.module("childrenApp", ['dndLists', 'ngRoute']);
  app.controller("childCtrl", function ($scope) {
    $scope.models = {
      selected: null,
      lists: {
        "CurrKids": [
          {
            name: "Ruby Windmuller"
          },
          {
            name: "Dexter Windmuller"
          },
          {
            name: "Toulouse Windmuller"
          }
        ],
      }
    };
  });
})(window.angular);
