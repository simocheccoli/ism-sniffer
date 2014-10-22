/**
 * @ngdoc controller
 * @name ng.controller:ConfigController
 * @requires $scope
 * @description
 * Controller for configuration
 */
angular.module('snifferApp')
.controller('ConfigController', [
  '$scope',
function($scope) {
  'use strict';

  $scope.footer = 'Change me';
}]);
