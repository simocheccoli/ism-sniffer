'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('snifferApp.services', []).
    value('version', '0.0.4').
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
        port: '',
        bauds: [500000, 230400, 115200, 57600, 38400, 19200, 9600, 4800, 2400, 1800, 1200, 600, 300, 200, 150, 134, 110, 75, 50],
        baud: null,
        bands: [{index: 0x01, name:'EU_CLIP'}, {index:0x02, name:'US_CLIP'}, {index:0x03, name:'EU_TAG'}, {index:0x04, name:'US_TAG'}],
        band: null,
        connected: false,
        dataset: [],
        datapoints: 100,
        hardwares: [],

        setDefaults: function() {
          config.baud = config.bauds[config.bauds.indexOf(115200)];
          config.band = config.bands[3];
          socket.emit('config:get');
        },

        getConfig: function() {
          socket.emit('config:get');
        }
      };

      socket.on('config', function(data) {
        angular.forEach(data.ports, function(value) { // function(value, key)
          config.ports.push({name: value.comName, info: value.manufacturer});
        });
        config.baud = data.baud;
        config.port = data.portName;
        config.band = data.band;
        console.log(config.ports);
      });

      socket.on('serial:data', function(data) {
        if(!config.connected) { config.connected = true; }

        /*if(data.command !== 0) { // ignore these for now
          var found = false;
          angular.forEach(config.dataset, function(value, key) {
            if(data.hardware === value.hardware) { // update
              angular.copy(data, value);
              found = true;
            }
          });
          if(!found) { // add
            config.dataset.push(data);
          }
        }*/
        config.dataset.push(data);
        if(config.dataset.length > config.datapoints) {
          config.dataset.splice(0, 1); // cut the oldest
        }

        if(config.hardwares.indexOf(data.hardware) === -1) {
          config.hardwares.push(data.hardware);
        }

      });

      config.setDefaults();

      return config;
    }]);
