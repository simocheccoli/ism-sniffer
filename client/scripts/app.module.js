/**
 * @ngdoc module
 * @name snifferApp
 * @module snifferApp
 * @requires ui.bootstrap
 * @requires ui.router
 * @requires ngResources
 * @requires ngMessages
 * @requires btford.socket-io @see https://github.com/btford/angular-socket-io
 * @description
 * Application to view logs from ISM sniffer
 */
angular.module('snifferApp', [
  'ui.bootstrap',
  'ui.router',
  'ngResource',
  'ngMessages',
  'btford.socket-io'])
.value('version', '0.0.5')
.constant('_', window._);
