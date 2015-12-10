/**
 * @ngdoc module
 * @name snifferApp
 * @module snifferApp
 * @requires ui.bootstrap
 * @requires ui.router
 * @requires ngResources
 * @requires ngMessages
 * @description
 * Application to view logs from ISM sniffer
 */
angular.module('snifferApp', [
  'ui.bootstrap',
  'ui.router',
  'ngResource',
  'ngMessages'])
.value('version', '0.0.5')
.constant('_', window._)
.run(['socketService', function (socketsService) { }]);
