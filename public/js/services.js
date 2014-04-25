'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('snifferApp.services', []).
	value('version', '0.0.2').
	factory('socket', ['socketFactory', function (socketFactory) {
		var mySocket = socketFactory();
		mySocket.forward('error');
		return mySocket;
		//return socketFactory();
	}]).
	constant('_', window._).
	factory('config', ['socket', function(socket) {
		var config = {
			ports: [],
			port: 'COM6',
			bauds: [500000, 230400, 115200, 57600, 38400, 19200, 9600, 4800, 2400, 1800, 1200, 600, 300, 200, 150, 134, 110, 75, 50],
			baud: null,
			bands: [{index: 0x01, name:'EU_CLIP'}, {index:0x02, name:'US_CLIP'}, {index:0x03, name:'EU_TAG'}, {index:0x04, name:'US_TAG'}],
			band: null,

			setDefaults: function() {
				config.baud = config.bauds[config.bauds.indexOf(115200)];
				config.band = config.bands[config.bands.indexOf('868')];
				socket.emit('serial:list');
				//config.ports = config.getPorts();
				//config.port = config.getPorts[0];
			},

			getPorts: function() {
				socket.emit('serial:list');
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