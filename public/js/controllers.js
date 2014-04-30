'use strict';

/* Controllers */

angular.module('snifferApp.controllers', []).
    controller('MonitorController', ['$scope', 'socket', 'config', function($scope, socket, config) {
        $scope.footer = 'Press connect to start';
        $scope.connected = false;
	    $scope.config = config;
	    $scope.dataset = [];

	    $scope.$on('socket:error', function (ev, data) {
	    	console.log('Socket error: '+ev+' : '+data);
    	});

	    $scope.doClear = function() {
	    	$scope.dataset.length = 0;
	    };

        $scope.doConnect = function() {
            if(!$scope.connected) {
            	console.log('Sending open');
            	socket.emit('serial:open', { baud: config.baud, port: config.port});
            } else {
            	console.log('Sending close');
            	socket.emit('serial:close', { port: config.port });
            }
        };

        $scope.showData = function(index) {
        	console.log(index+' clicked. '+JSON.stringify($scope.dataset[index]));
        };

        socket.on('serial:data', function(data) {
        	if(!$scope.connected)
        		$scope.connected = true;

        	if(data.command !== 0) { // ignore these for now
	        	var found = false;
	        	angular.forEach($scope.dataset, function(value, key) {
	        		if(data.hardware === value.hardware) { // update
	        			//console.log('Update '+data.hardware);
	        			angular.copy(data, value);
	        			found = true;
	        		}
				});
	        	if(!found) { // add
	        		//console.log('Add '+data.hardware);
	        		$scope.dataset.push(data);
	        	}
	        }
        	//$scope.time.append(new Date().getTime(), data.rssi);
        });
        socket.on('serial:close:ok', function(data) {
        	$scope.connected = false;
        	$scope.footer = 'Press connect to start';
        	console.log(data.port+' closed ok');
        });
        socket.on('serial:open:ok', function(data) {
        	$scope.connected = true;
        	$scope.footer = 'Device connected to ' + config.port;
        	console.log(data.port+' opened ok');
        });
        /*
        $scope.smoothie = new SmoothieChart();
        $scope.time = new TimeSeries();
        //setInterval(function() {
  		//	$scope.time.append(new Date().getTime(), Math.random());
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
    controller('DebugController', ['$scope', 'socket', function($scope, socket) {
    	$scope.header = 'Debug Monitoring';
    	$scope.footer = 'SmartBeacon Debugging';
    	$scope.paused = false;
    	$scope.hardwares = [];
    	$scope.hardware = 'IMEI';
    	$scope.monitored = [];
    	$scope.dataLen = 10;
    	$scope.alerts = [];

		$scope.closeAlert = function(index) {
    		$scope.alerts.splice(index, 1);
  		};

  		$scope.addMonitor = function() {
  			var newMon = {
  				hardware: $scope.hardware,
  				data: []
  			};
  			$scope.monitored.push(newMon);
  		};

  		$scope.removeMonitor = function(index) {
    		$scope.monitored.splice(index, 1);
    	};

    	socket.on('serial:data', function(data) {
    		if($scope.hardwares.indexOf(data.hardware) === -1) {
    			//console.log(data.hardware+' seen');
    			$scope.hardwares.push(data.hardware);
    		}

        	if(!$scope.paused) {
        		angular.forEach($scope.monitored,  function(value, key) {
        			if(data.hardware === value.hardware) {
        				value.data.push(data);
        				if(value.data.length > $scope.dataLen) {
        					value.data.splice(0, 1); // cut the oldest
        				}
        			}
        		});
        	}
        });
    }]);