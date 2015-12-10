/**
 * @ngdoc service
 * @name ng.service:socketService
 * @requires $rootScope
 * @description
 * Service which $broadcasts socket events with $on
 */
angular.module('snifferApp')
.factory('socketService', [
  '$rootScope',
  '$window',
  '$log',
function($rootScope, $window, $log) {
  'use strict';

  var socket = $window.io.connect();

  socket.on('socket:error', function (ev, data) {
    $log.error('Socket error: '+ev+' : '+data);
  });

  // Send events from socket downwards to all children
  socket.on('device:status', function(data) {
    $rootScope.$broadcast('device:status', data);
  });

  socket.on('serial:close:ok', function(data) {
    $rootScope.$broadcast('serial:close:ok', data);
  });

  socket.on('serial:open:ok', function(data) {
    $rootScope.$broadcast('serial:open:ok', data);
  });

  socket.on('packets', function(data) {
    $rootScope.$broadcast('packets', data);
  });

  socket.on('packets:error', function(data) {
    $rootScope.$broadcast('packets:error', data);
  });

  // Received events from controllers forwarded to socket
  $rootScope.$on('device:get', function(event, data) {
    socket.emit('device:get', data);
  });

  $rootScope.$on('serial:open', function(event, data) {
    socket.emit('serial:open', data);
  });

  $rootScope.$on('serial:close', function(event, data) {
    socket.emit('serial:close', data);
  });

  $rootScope.$on('packets:get', function(event, data) {
    socket.emit('packets:get', data);
  });

}]);
