/**
 * @ngdoc filter
 * @name ng.filter:interpolate
 * @description
 * Filter to show app version
 */
angular.module('snifferApp')
.filter('interpolate', [
  'version',
function(version) {
  'use strict';

  return function(text) {
		return String(text).replace(/\%VERSION\%/mg, version);
  };
}]);
