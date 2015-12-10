/**
 * @ngdoc controller
 * @name ng.controller:MonitorController
 * @requires $scope
 * @requires $log
 * @requires config
 * @description
 * Controller for serial data monitoring
 */
angular.module('snifferApp')
.controller('MonitorController', [
  '$scope',
  '$log',
  'config',
function($scope, $log, config) {
  'use strict';

  $scope.footer = 'Press connect to start';
  $scope.config = config;
  $scope.predicate = 'logged';
  $scope.reverse = true;

  /**
   * @ngdoc method
   * @name ng.controller:MonitorController#doClear
   * @methodOf ng.controller:MonitorController
   * @description
   * Clear the display
   */
  $scope.doClear = function() {
      config.dataset.length = 0;
  };

  /**
   * @ngdoc method
   * @name ng.controller:MonitorController#doConnect
   * @methodOf ng.controller:MonitorController
   * @description
   * Connect to the configured serial port
   */
  $scope.doConnect = function() {
      if(!config.connected) {
          //$log.debug('Sending open');
          $scope.$emit('serial:open', { baud: config.baud, port: config.port, band: config.band });
      } else {
          //$log.debug('Sending close');
          $scope.$emit('serial:close', { port: config.port });
      }
  };

  $scope.showData = function(index) {
      $log.debug(index+' clicked. '+JSON.stringify(config.dataset[index]));
  };

  $scope.$on('serial:close:ok', function(data) {
      config.connected = false;
      $scope.footer = 'Press connect to start';
      $log.debug(data.port+' closed ok');
  });
  $scope.$on('serial:open:ok', function(data) {
      config.connected = true;
      $scope.footer = 'Device connected to ' + config.port;
      $log.debug(data.port+' opened ok');
  });
  /*
  $scope.smoothie = new SmoothieChart();
  $scope.time = new TimeSeries();
  //setInterval(function() {
    //    $scope.time.append(new Date().getTime(), Math.random());
    //}, 1000);
  $scope.smoothie.streamTo(document.getElementById('rssi_chart'));
  $scope.smoothie.addTimeSeries($scope.time, {
      strokeStyle: '#ff0000',
      fillStyle: 'rgba(255, 0, 0, 0.4)',
      lineWidth: 2
  });*/

}]);
