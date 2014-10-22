/**
 * @ngdoc controller
 * @name ng.controller:DataController
 * @requires $scope
 * @requires socket
 * @description
 * Controller to view data 
 */
angular.module('snifferApp')
.controller('DataController', [
  '$scope',
  'socket',
function($scope, socket) {
  'use strict';

  $scope.footer = 'Enter device number to query';
  $scope.charge = false;
  $scope.left = false;
  $scope.right = false;

  $scope.getStatus = function() {
    socket.emit('device:get', $scope.imei);
  };

  socket.on('device:status', function(data) {
    console.log(JSON.stringify(data));
  });
}]);
