'use strict';

/* Controllers */

angular.module('snifferApp.controllers', []).
    controller('MonitorController', ['$scope', 'socket', 'config', function($scope, socket, config) {
        $scope.footer = 'Press connect to start';
        $scope.connected = false;
	    $scope.config = config;
	    $scope.sniffer = '';
	    //$scope.dataset = [];
	    
	    $scope.doClear = function() {
	    	$scope.sniffer = '';
	    };

        $scope.doConnect = function() {
            $scope.connected = !$scope.connected;
            if($scope.connected) {
            	socket.emit('ism:connect', config.port);
            	$scope.footer = 'Device connected to ' + config.port;
            } else {
            	socket.emit('ism:disconnect', config.port);
            	$scope.footer = 'Press connect to start';
            }
        };

        socket.on('serial:data', function(data) {
        	$scope.sniffer += data.rx + '\n';
        	//$scope.dataset.push(data.rssi);
        	$scope.time.append(new Date().getTime(), data.rssi);
        	//$scope.$digest();
        });
        
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
		});
    }]).
    controller('ConfigController', ['$scope', function($scope) {
    
    }]).
	controller('DataController', [function() {

	}]);