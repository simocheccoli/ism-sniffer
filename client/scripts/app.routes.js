/**
 * @ngdoc object
 * @name RouteConfig
 * @module snifferApp
 * @description
 * Route configuration for the snifferApp module.
 */
angular.module('snifferApp')
.config([
  '$stateProvider',
  '$urlRouterProvider',
  '$locationProvider',
function($stateProvider, $urlRouterProvider, $locationProvider) {
  'use strict';

  // Application routes
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'home.html',
      controller: 'MonitorController'
    })
    .state('home.info', {
      url: '/info',
      onEnter: [
        '$stateParams',
        '$state',
        '$modal',
        function($stateParams, $state, $modal) {
          $modal.open({
            templateUrl: 'info.html',
            controller: ['$scope', function($scope) {
                $scope.dismiss = function() {
                  $scope.$dismiss();
              };

              $scope.save = function() {
                $scope.$close(true);
              };
            }]
          }).result.then(function(result) {
            if (result) {
              return $state.transitionTo('home');
            }
          });
        }]
    })
    .state('config', {
      url: '/config',
      templateUrl: 'config.html',
      controller: 'ConfigController'
    })
    .state('data', {
      url: '/data',
      templateUrl: 'data.html',
      controller: 'DataController'
    })
    .state('search', {
      url: '/search',
      templateUrl: 'search.html',
      controller: 'SearchController'
    })
    .state('debug', {
      url: '/debug',
      templateUrl: 'debug.html',
      controller: 'DebugController'
    });

  $urlRouterProvider.otherwise('/');

  // FIX for trailing slashes. Gracefully "borrowed" from https://github.com/angular-ui/ui-router/issues/50
  $urlRouterProvider.rule(function ($injector, $location) {
    var path = $location.url();

    // check to see if the path has a trailing slash
    if ('/' === path[path.length - 1]) {
      return path.replace(/\/$/, '');
    }

    if (path.indexOf('/?') > 0) {
      return path.replace('/?', '?');
    }

    return false;
  });

  $locationProvider.html5Mode(true);

}]);
