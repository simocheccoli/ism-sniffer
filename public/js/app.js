'use strict';

// Declare app level module which depends on filters, and services
angular.module('snifferApp', [
	'ui.router',
    'ui.bootstrap',
	'btford.socket-io',
	'snifferApp.filters',
	'snifferApp.services',
	'snifferApp.directives',
	'snifferApp.controllers'
]);
//Setting up route
angular.module('snifferApp').config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
        // For unmatched routes:
        $urlRouterProvider.otherwise('/');

        // states for my app
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'views/home.html',
                controller: 'MonitorController'
            })
            .state('home.info', {
                url: '/info',
                onEnter: function($stateParams, $state, $modal, $resource) {
                    $modal.open({
                        templateUrl: 'views/info.html',
                        /*resolve: {
                          item: function() { new Item(123).get(); }
                        },*/
                        controller: ['$scope'/*, 'item'*/, function($scope/*, item*/) {
                          $scope.dismiss = function() {
                            $scope.$dismiss();
                          };

                          $scope.save = function() {
                            //item.update().then(function() {
                              $scope.$close(true);
                            //});
                          };
                        }]
                    }).result.then(function(result) {
                        if (result) {
                            return $state.transitionTo('home');
                        }
                    });
                }
            })
            .state('config', {
                url: '/config',
                templateUrl: 'views/config.html',
                controller: 'ConfigController'
            })
            .state('data', {
                url: '/data',
                templateUrl: 'views/data.html',
                controller: 'DataController'
            })
            .state('search', {
                url: '/search',
                templateUrl: 'views/search.html',
                controller: 'SearchController'
            })
            .state('debug', {
                url: '/debug',
                templateUrl: 'views/debug.html',
                controller: 'DebugController'
            });
    }
]);

//Setting HTML5 Location Mode
angular.module('snifferApp').config(['$locationProvider',
    function($locationProvider) {
        $locationProvider.hashPrefix('!');
    }
]);