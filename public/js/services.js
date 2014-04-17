'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('snifferApp.services', []).
	value('version', '0.1').
	factory('socket', ['$rootScope', 'io', function($rootScope, io) {
		var socket = io.connect(),
		events = {},
		that = {};

		var addCallback = function(name, callback) {
        	var event = events[name],
            	wrappedCallback = wrapCallback(callback);

        	if (!event) {
            	event = events[name] = [];
        	}

        	event.push({ callback: callback, wrapper: wrappedCallback });
        	return wrappedCallback;
    	};

		var removeCallback = function(name, callback) {
        	var event = events[name],
           		wrappedCallback;

			if (event) {
				for(var i = event.length - 1; i >= 0; i--) {
					if (event[i].callback === callback) {
						wrappedCallback = event[i].wrapper;
						event.slice(i, 1);
						break;
					}
				}
			}
			return wrappedCallback;
		};

		var removeAllCallbacks = function(name) {
			delete events[name];
		};

		var wrapCallback = function(callback) {
			var wrappedCallback = angular.noop;

			if (callback) {
				wrappedCallback = function() {
					var args = arguments;
					$rootScope.$apply(function() {
						callback.apply(socket, args);
					});
				};
			}
			return wrappedCallback;
		};

		var listener = function(name, callback) {
			return {
				bindTo: function(scope) {
					if (scope !== null) {
						scope.$on('$destroy', function() {
							that.removeListener(name, callback);
						});
					}
				}
			};
		};

		that = {
			on: function(name, callback) {
				socket.on(name, addCallback(name, callback));
				return listener(name, callback);
			},
			once: function(name, callback) {
				socket.once(name, addCallback(name, callback));
				return listener(name, callback);
			},
			removeListener: function(name, callback) {
				socket.removeListener(name, removeCallback(name, callback));
			},
			removeAllListeners: function(name) {
				socket.removeAllListeners(name);
				removeAllCallbacks(name);
			},
			emit: function(name, data, callback) {
				if (callback) {
					socket.emit(name, data, wrapCallback(callback));
				}
				else {
					socket.emit(name, data);
				}
			}
		};

    	return that;
	}])./*
	factory('socket', ['socketFactory', function (socketFactory) {
		var mySocket = socketFactory();
		mySocket.forward('error');
		return mySocket;
	}]).*/
	factory('io', [function() {
    	return io;
	}]).
	factory('config', ['socket', function(socket) {
		var config = {
			ports: [],
			port: 'COM6',
			bauds: [500000, 230400, 115200, 57600, 38400, 19200, 9600, 4800, 2400, 1800, 1200, 600, 300, 200, 150, 134, 110, 75, 50],
			baud: null,
			bands: ['915', '903', '868', '433.5', '868.3', '315'],
			band: null,

			setDefaults: function() {
				config.baud = config.bauds[config.bauds.indexOf(115200)];
				config.band = config.bands[config.bands.indexOf('868')];
				//socket.emit('ism:get');
				//config.ports = config.getPorts();
				//config.port = config.getPorts[0];
			},

			getPorts: function() {
				socket.emit('ism:get');
			}
		};
		
		socket.on('serial:ports', function(data) {
			angular.forEach(data, function(value, key) {
				config.ports.push(value.comName);
			});
			console.log(config.ports);
		});

		config.setDefaults();

  		return config;
	}]);