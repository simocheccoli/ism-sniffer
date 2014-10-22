/**
 * @ngdoc controller
 * @name ng.controller:SearchController
 * @requires $scope
 * @requires socket
 * @description
 * Controller to search for data
 */
angular.module('snifferApp')
.controller('SearchController', [
  '$scope',
  'socket',
function($scope, socket) {
  'use strict';

  $scope.footer = 'Search from database';
  $scope.alerts = [];

  $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };

  $scope.getPackets = function() {
      socket.emit('packets:get', {hardware: $scope.imei, hide: $scope.hide});
  };

  socket.on('packets', function(data) {
      $scope.packets = data;
  });

  socket.on('packets:error', function(data) {
      $scope.alerts.push({type: 'danger', msg: JSON.stringify(data)});
  });
}]);
