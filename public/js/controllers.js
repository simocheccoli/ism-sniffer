'use strict';

/* Controllers */

angular.module('snifferApp.controllers', []).
    controller('MonitorController', ['$scope', 'socket', 'config', function($scope, socket, config) {
        $scope.footer = 'Press connect to start';
        $scope.config = config;
        $scope.predicate = 'logged';
        $scope.reverse = true;

        $scope.$on('socket:error', function (ev, data) {
            console.log('Socket error: '+ev+' : '+data);
        });

        $scope.doClear = function() {
            config.dataset.length = 0;
        };

        $scope.doConnect = function() {
            if(!config.connected) {
                //console.log('Sending open');
                socket.emit('serial:open', { baud: config.baud, port: config.port, band: config.band });
            } else {
                //console.log('Sending close');
                socket.emit('serial:close', { port: config.port });
            }
        };

        $scope.showData = function(index) {
            console.log(index+' clicked. '+JSON.stringify(config.dataset[index]));
        };

        socket.on('serial:close:ok', function(data) {
            config.connected = false;
            $scope.footer = 'Press connect to start';
            console.log(data.port+' closed ok');
        });
        socket.on('serial:open:ok', function(data) {
            config.connected = true;
            $scope.footer = 'Device connected to ' + config.port;
            console.log(data.port+' opened ok');
        });
        /*
        $scope.smoothie = new SmoothieChart();
        $scope.time = new TimeSeries();
        //setInterval(function() {
          //    $scope.time.append(new Date().getTime(), Math.random());
          //}, 1000);
        $scope.smoothie.streamTo(document.getElementById('rssi_chart'));
        $scope.smoothie.addTimeSeries($scope.time, {
            strokeStyle: '#ff0000',
            fillStyle: 'rgba(255, 0, 0, 0.4)',
            lineWidth: 2
        });*/
    }]).
    controller('ConfigController', ['$scope', function($scope) {
        $scope.footer = 'Change me';
    }]).
    controller('DataController', ['$scope', 'socket', function($scope, socket) {
        $scope.footer = 'Enter device number to query';
        $scope.charge = false;
        $scope.left = false;
        $scope.right = false;

        $scope.getStatus = function() {
          socket.emit('device:get', $scope.imei);
        };

        socket.on('device:status', function(data) {
          console.log(JSON.stringify(data));
        });
    }]).
    controller('SearchController', ['$scope', 'socket', function($scope, socket) {
        $scope.footer = 'Search from database';
        $scope.alerts = [];

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
          };

        $scope.getPackets = function() {
            socket.emit('packets:get', {hardware: $scope.imei, hide: $scope.hide});
        };

        socket.on('packets', function(data) {
            $scope.packets = data;
        });

        socket.on('packets:error', function(data) {
            $scope.alerts.push({type: 'danger', msg: JSON.stringify(data)});
        });
    }]).
    controller('DebugController', ['$scope', 'config', function($scope, config) {
        $scope.header = 'Debug Monitoring';
        $scope.footer = 'SmartBeacon Debugging';
        $scope.paused = false;
        $scope.hardware = 'IMEI';
        $scope.monitored = [];
        $scope.dataLen = 10;
        $scope.alerts = [];

        $scope.closeAlert = function(index) {
          $scope.alerts.splice(index, 1);
        };

        $scope.addMonitor = function() {
          var newMon = {
            name: $scope.hardware,
            data: []
          };
          $scope.monitored.push(newMon);
        };

        $scope.removeMonitor = function(index) {
          $scope.monitored.splice(index, 1);
        };

        $scope.$watch(config.dataset, function(newValue, oldValue) {
          console.log(JSON.stringify(newValue));
          if (newValue === oldValue) { return; } // AKA first run
          if(!$scope.paused) {
            angular.forEach($scope.monitored,  function(value) {
              if(newValue.hardware === value.hardware) {
                value.data.push(newValue);
                if(value.data.length > $scope.dataLen) {
                  value.data.splice(0, 1); // cut the oldest
                }
              }
            });
          }
        });

    }]);
