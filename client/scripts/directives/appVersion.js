/**
 * @ngdoc directive
 * @name ng.directive:appVersion
 * @requires version
 * @description
 * Current app version
 */
angular.module('snifferApp')
.directive('appVersion', [
  'version',
function(version) {
  'use strict';
  
  //return function(scope, elm, attrs) {
  return function(scope, elm) {
    elm.text(version);
  };
}]);
