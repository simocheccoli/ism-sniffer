/**
 * @ngdoc controller
 * @name ng.controller:DataController
 * @requires $scope
 * @description
 * Controller to view data
 */
angular.module('snifferApp')
.controller('DataController', [
  '$scope',
  '$log',
function($scope, $log) {
  'use strict';

  $scope.footer = 'Enter device number to query';
  $scope.charge = false;
  $scope.left = false;
  $scope.right = false;

  $scope.getStatus = function() {
    $scope.$emit('device:get', $scope.imei); // firing an event upwards
  };

  //$scope.$root.$on('device:status', function(data) {
  $scope.$on('device:status', function(event, data) {
    //if(!$scope.listening) { event.stopPropagation(); }
    $log.debug(JSON.stringify(data));
  });
}]);
