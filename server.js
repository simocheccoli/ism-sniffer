'use strict';

var express   	 = require('express');
var app          = express();
var bodyParser   = require('body-parser');
var http 		 = require('http').createServer(app);
var port    	 = process.env.PORT || 8080;
var socketio     = require('socket.io');
var sp           = require('serialport');
var SerialPort	 = sp.SerialPort; // localize object constructor
var logger		 = require('./logger');
var _ 			 = require('lodash');
var commandTypes = require('./constants').commandTypes;
var bandTypes    = require('./constants').bandTypes;
var mongoose     = require('mongoose');
var Packet       = require('./models/packet');
var Command      = require('./models/command');

var socketServer;
var serialPort;
var tempBuffer = new Buffer(69); // 3 packets of 23
var dataIn = 0;

var portStatus = {
	state: 'closed',
	baud: 115200,
	portName: 'COM6',
	band: 3
};

function initSocketIO(httpServer,debug)
{
	socketServer = socketio.listen(httpServer);

	if(debug === false)
	{
		socketServer.set('log level', 1); // socket.io debug OFF
	}

	socketServer.on('connection', function (socket) {
		logger.info('user connected');

		socket.on('serial:open', function(data) {
            logger.debug('Open request at '+data.baud+' on '+data.port);
			portStatus.baud = data.baud;
			portStatus.portName = data.port;
			serialPort.path = data.port;
			serialPort.options.baudRate = data.baud;
            dataIn = 0;
			serialPort.open();
			socket.emit('serial:open:ok', {port: data.port});
		});

		socket.on('serial:close', function(data) {
            logger.debug('Close request on '+data.port);
            dataIn = 0;
			serialPort.close();
            socket.emit('serial:close:ok', {port: data.port});
		});

		socket.on('serial:list', function() {
			sp.list(function(err, ports) {
				if(err) {
					logger.warn('err ' + err);
    			} else {
    				socket.emit('serial:ports', ports);
                    logger.debug(ports);
    			}
			});
		});

		socket.on('serial:band', function() {
			serialPort.write('$255\r\n');
            if(portStatus.band === 4) {
                portStatus.band = 1;
            } else {
                portStatus.band += 1;
            }
			logger.debug('Switch to '+bandTypes[portStatus.band]+' band requested');
		});

        socket.on('disconnect', function () {
            logger.info('user disconnected');
        });
    });
}

function serialListener()
{
    /*
    var parsePackets = function(emitter, buffer) {
        if(buffer.length === 23) {
            dataIn = 0;
            emitter.emit('data', buffer);
        } else {
            if(dataIn > 0) {
                if(dataIn + buffer.length === 23) {
                    buffer.copy(tempBuffer, dataIn);
                    emitter.emit('data', tempBuffer);
                } else {
                    logger.warn('Packet loss? : '+dataIn+' and '+buffer.length);
                }
                dataIn = 0;
            } else if (buffer.length > 23) {
                dataIn = 0;
                logger.debug(buffer.length+' byte packet received. Ignoring for now.');
            } else {
                buffer.copy(tempBuffer);
                dataIn = buffer.length;
            }
        }
    };
    */
    var parseSmarter = function(emitter, buffer) {
        if((buffer[4] === 32) && (buffer[buffer.length-1] === 10)) {
            emitter.emit('data', buffer);
            dataIn = 0;
        } else {
            if(buffer[4] === 32) {
                buffer.copy(tempBuffer);
                dataIn = buffer.length;
            } else if (buffer[buffer.length-1] === 10) {
                if(dataIn > 0) {
                    if((dataIn + buffer.length) < tempBuffer.length) {
                        logger.trace('Copying '+buffer.length+' bytes at '+dataIn);
                        buffer.copy(tempBuffer, dataIn);
                        dataIn += buffer.length;
                        if((dataIn > 23) && (dataIn%23 === 0)) { // overlapping packets ?
                            logger.debug('Joined packets. Splitting into '+dataIn/23);
                            _.each(_.range(dataIn/23), function(item) {
                                emitter.emit('data', tempBuffer.slice(item*23,(item+1)*23));
                            });
                        } else {
                            emitter.emit('data', tempBuffer);
                        }
                    } else {
                        logger.warn('Preventing overflow. Packets dropped.');
                        dataIn = 0;
                    }
                } else {
                    logger.debug('Errr....not sure '+buffer.length);
                }
                dataIn = 0;
            } else { // some sort of short middle of a packet
                logger.debug(buffer.length+' packet. Not sure. Copying.');
                if((dataIn + buffer.length) < tempBuffer.length) {
                    buffer.copy(tempBuffer, dataIn);
                    dataIn += buffer.length;
                } else {
                    logger.warn('Preventing overflow. Packets dropped.');
                    dataIn = 0;
                }
            }
        }
    };

	serialPort = new SerialPort(portStatus.portName, {
		parser      : parseSmarter, //parsePackets,
		baudrate    : portStatus.baud,
		dataBits    : 8,
		parity      : 'none',
		stopBits    : 1,
		flowControl : false
	}, false);

	serialPort.on('open', function (err) {
		if(err) {
			logger.warn('err ' + err);
		} else {
			if(portStatus.state !== 'closed') {
				logger.warn('Port already open');
			} else {
				logger.info(portStatus.portName + ' open serial communication. Listening on '+bandTypes[portStatus.band]+' band.');
				portStatus.state = 'open';
			}
		}
	});

	serialPort.on('close', function (err) {
		if(err) {
			logger.warn('err ' + err);
		} else {
			portStatus.state = 'closed';
		}
	});

	serialPort.on('data', function(data) {
		var packet = new Packet();
        /*
         *  <TIME>       5        Sniffer ticks and space   5
         *  <LENGTH>     1        Packet length             1
         *  <CMD>        1        Command type              1
         *  <IMEI>       8        Hardware ID               1  <SECURITY>
         *  <SIGNATURE>  2        0x55 0xAA                 8  <WB_ID><UNUSED>
         *  <PAYLOAD>    5/21/37  Depends on command type
         */
    	if(data[4] === 32) { //space
            // data[0:3] = 29 68 00 00 => timestamp: 0x00006829 in systicks
            packet.systick = data[0]+Math.pow(16,2)*data[1]+Math.pow(16,4)*data[2]+Math.pow(16,8)*data[3];
            packet.size = data.readUInt8(5);
            var total = 6+packet.size; // 4 bytes time, space, size, \n
            if((data[total] === 10)) { //LF
                packet.command = data.readUInt8(6);
                packet.rf_band = portStatus.band;

                if(packet.command === 0) { // cmd(1), flags(1), from(4), time(4)
                    packet.hardware = data.readUInt32LE(8, true);
                    packet.payload = data.slice(12, total);
                } else {
                    if(portStatus.band>2) { // Colorado
                        if((data[15] === 85) && (data[16] === 170)) {
                            packet.hardware = data.readUInt32LE(7, true) + Math.pow(2,32)*data.readUInt32LE(11, true); // 64bits LSB First
                            packet.payload = data.slice(17, total);
                        } else {
                            logger.warn('Checksum not found. Logging as hardware 0.');
                            packet.payload = data.slice(7, total);
                        }
                    } else { // Click
                        packet.hardware = data.readUInt32LE(8, true); // WB_ID
                        packet.payload = data.slice(16, total);
                    }
                }

                //data.copy(packet.payload, 0, 7, total); // buf.copy(targetBuffer, [targetStart], [sourceStart], [sourceEnd])
                packet.save(function(err) {
                    if(err)
                        logger.warn('Error inserting packet into database');

                    if(commandTypes[packet.command] === undefined) {
                        logger.warn('['+packet.systick+'] new command type '+packet.command);
                    } else {
                        switch(packet.command) {
                            case 0:
                                logger.info('['+packet.systick+'] '+commandTypes[packet.command]);
                                break;
                            case 1:
                                logger.info('['+packet.systick+'] '+commandTypes[packet.command]+' '+packet.hardware+' Status:'+packet.payload[0]+' Period:'+packet.payload[1]+' Battery:'+packet.payload.readUInt16LE(2, true)+'mv Reports:'+packet.payload[4]);
                                break;
                            default:
                                logger.info('['+packet.systick+'] '+commandTypes[packet.command]+' '+packet.hardware+' '+packet.payload.length);
                                break;
                        }
                    }
                    socketServer.sockets.emit('serial:data', packet);
                });
            } else {
                logger.warn('Not terminated at '+packet.systick+' with '+packet.size+' byte payload ending in '+data[total]);
            }
        } else {
            logger.warn('bad');
        }
	});

	serialPort.on('error', function(err) {
		if(err) {
			logger.warn('err ' + err);
		}
	});

	//serialPort.open();
}

function startServer(debug)
{
	app.use(express.static(__dirname + '/public'));
    app.use(bodyParser());

    // ROUTES FOR OUR API
    // =============================================================================
    var router = express.Router();              // get an instance of the express Router

    // middleware to use for all requests
    router.use(function(req, res, next) {
        // do logging
        logger.trace('API request');
        next(); // make sure we go to the next routes and don't stop here
    });

    // test route to make sure everything is working (accessed at GET http://localhost:8080/api)
    router.get('/', function(req, res) {
        res.json({ message: 'Welcome to our api!' });
    });

    // on routes that end in /command
    // ----------------------------------------------------
    router.route('/commands')
        // create a command (accessed at POST http://localhost:8080/api/commands)
        .post(function(req, res) {
            var command = new Command();      // create a new instance of the Command model
            command.name = req.body.name;     // set the command name (comes from the request)
            command.type = req.body.type;
            // save the command and check for errors
            command.save(function(err) {
                if (err) { res.send(err); }
                res.json({ message: 'Command created!' });
                logger.debug('New command created. ['+command.type+' '+command.name+']');
            });
        })
        // get all the commands (accessed at GET http://localhost:8080/api/commands)
        .get(function(req, res) {
            Command.find(function(err, commands) {
                if (err) { res.send(err); }
                res.json(commands);
                logger.debug('All commands sent.');
            });
        });
    // on routes that end in /commands/:command_id
    // ----------------------------------------------------
    router.route('/commands/:command_id')
        // get the command with that id
        .get(function(req, res) {
            Command.findById(req.params.command_id, function(err, command) {
                if (err) { res.send(err); }
                res.json(command);
                logger.debug('Command ['+command.type+' '+command.name+'] sent.');
            });
        })
        // update the command with this id
        .put(function(req, res) {
            Command.findById(req.params.command_id, function(err, command) {
                if (err) { res.send(err); }
                command.name = req.body.name;
                command.type = req.body.type;
                command.save(function(err) {
                    if (err) { res.send(err); }
                    res.json({ message: 'Command updated!' });
                    logger.debug('Command ['+command.type+' '+command.name+'] updated.');
                });
            });
        })
        // delete the command with this id
        .delete(function(req, res) {
            Command.remove({
                _id: req.params.command_id
            }, function(err, command) {
                if (err) { res.send(err); }
                res.json({ message: 'Successfully deleted' });
                logger.debug('Command ['+command+'] deleted.');
            });
        });

    app.use('/api', router);

	http.listen(port);
	logger.info('Server started on port ' + port);

    mongoose.connect('mongodb://localhost/buddi');

	serialListener();
	initSocketIO(http,debug);
}

startServer(false);

exports.start = startServer;
