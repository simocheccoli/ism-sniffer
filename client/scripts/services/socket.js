/**
 * @ngdoc service
 * @name ng.service:socket
 * @requires socketFactory
 * @description
 * Factory to provide sockets to application
 */
angular.module('snifferApp')
.factory('socket', [
  'socketFactory',
function(socketFactory) {
  'use strict';

  var mySocket = socketFactory();
  mySocket.forward('error');
  return mySocket;
  //return socketFactory();
}]);
