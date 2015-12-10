/**
 * @ngdoc controller
 * @name ng.controller:DebugController
 * @requires $scope
 * @requires $log
 * @requires config
 * @description
 * Controller for debugging
 */
angular.module('snifferApp')
.controller('DebugController', [
  '$scope',
  '$log',
  'config',
function($scope, $log, config) {
  'use strict';

  $scope.header = 'Debug Monitoring';
  $scope.footer = 'SmartBeacon Debugging';
  $scope.paused = false;
  $scope.hardware = 'IMEI';
  $scope.monitored = [];
  $scope.dataLen = 10;
  $scope.alerts = [];

  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };

  $scope.addMonitor = function() {
    var newMon = {
      name: $scope.hardware,
      data: []
    };
    $scope.monitored.push(newMon);
  };

  $scope.removeMonitor = function(index) {
    $scope.monitored.splice(index, 1);
  };

  $scope.$watch(config.dataset, function(newValue, oldValue) {
    $log.debug(JSON.stringify(newValue));
    if (newValue === oldValue) { return; } // AKA first run
    if(!$scope.paused) {
      angular.forEach($scope.monitored,  function(value) {
        if(newValue.hardware === value.hardware) {
          value.data.push(newValue);
          if(value.data.length > $scope.dataLen) {
            value.data.splice(0, 1); // cut the oldest
          }
        }
      });
    }
  });
}]);
