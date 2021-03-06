'use strict';

var logger          = require('./logger');
var _               = require('lodash');
var config          = require('./config');
//var serialListner     = require('./server').serialListner;
var serialListner     = require('./serial');
var socketio        = require('socket.io');
var Packet          = require('./models/packet');

var SocketServer = function(httpServer) {
    var users = [];
    this.socketServer = socketio.listen(httpServer);
    // for debug run DEBUG=socket.io* node server
    config.socketServer = this.socketServer;

    this.socketServer.on('connection', function (socket) {
            var user = {
            port: socket.handshake.address.port,
            ip: socket.handshake.address.address //socket.remoteAddress
        };
        users.push(user);
        logger.info('user '+users.length+' connected from '+user.ip);

        socket.on('serial:open', function(data) {
            logger.debug('Open request at '+data.baud+' on '+data.port);
            config.device.baud = data.baud;
            config.device.portName = data.port;
            config.device.band = data.band;
            //serialListner.setup();
            serialListner.serialPort.path = data.port;
            serialListner.serialPort.options.baudRate = data.baud;
            serialListner.serialPort.open(function(error) {
                if(error) {
                    logger.warn('Error closing serial port: '+error);
                } else {
                    if(config.device.state === 'open') {
                        socket.emit('serial:open:ok', {port: data.port});
                    }
                }
            });
        });

        socket.on('serial:close', function(data) {
            logger.debug('Close request on '+data.port);
            serialListner.serialPort.close(function(error) {
                if(error) {
                    logger.warn('Error closing serial port: '+error);
                } else {
                    socket.emit('serial:close:ok', {port: data.port});
                }
            });
        });

        socket.on('config:get', function() {
            serialListner.getPorts();
            logger.trace('Config requested sending '+JSON.stringify(config.device));
            socket.emit('config', config.device);
        });

        socket.on('config:set', function(data) {
            config.device.baud = data.baud;
            config.device.portName = data.port;
            config.device.band = data.band;
            logger.debug('Config updated: '+JSON.stringify(data));
        });

        socket.on('packets:get', function(data) {
            logger.debug('Packets from '+data.hardware+' requested');
            var search = {hardware: data.hardware};
            if(data.hide) {
                search.command = { $gt: 1 };
            }
            Packet.find(search).sort({logged:-1}).limit(100, function(err, packets) {
                if (err) {
                    logger.warn('Error fetching packets: '+err);
                    socket.emit('packets:error', err);
                }
                socket.emit('packets', packets);
            });
        });

        socket.on('disconnect', function () {
            users = _.reject(users, user);
            logger.info('user from '+user.ip+' disconneccted. '+users.length+' users connected.');
        });
    });
}

module.exports = SocketServer;
