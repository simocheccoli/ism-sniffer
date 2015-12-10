/**
 * @ngdoc controller
 * @name ng.controller:SearchController
 * @requires $scope
 * @description
 * Controller to search for data
 */
angular.module('snifferApp')
.controller('SearchController', [
  '$scope',
function($scope) {
  'use strict';

  $scope.footer = 'Search from database';
  $scope.alerts = [];

  $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };

  $scope.getPackets = function() {
      $scope.$emit('packets:get', {hardware: $scope.imei, hide: $scope.hide});
  };

  $scope.$on('packets', function(data) {
      $scope.packets = data;
  });

  $scope.$on('packets:error', function(data) {
      $scope.alerts.push({type: 'danger', msg: JSON.stringify(data)});
  });
}]);
