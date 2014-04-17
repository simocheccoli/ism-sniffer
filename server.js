'use strict';

var express   	= require('express');
var app         = express();
var http 		= require('http').createServer(app);
var port    	= process.env.PORT || 8080;
var socketio    = require('socket.io');
var SerialPort	= require('serialport').SerialPort; // localize object constructor
var logger		= require('./logger');
var _ 			= require('lodash');

var socketServer;
var serialPort;

var portStatus = {
	state: 'closed',
	baud: 115200,
	portName: 'COM6',
	band: 0
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

		socketServer.on('serial:open', function(data) {
			portStatus.baud = data.baud;
			portStatus.portName = data.port;
			serialPort.path = data.port;
			serialPort.options.baudRate = data.baud;
			serialPort.open();
			//socket.emit('ok');
		});

		socket.on('serial:close', function(data) {
			serialPort.close();
		});

		socket.on('serial:list', function(data) {
			serialPort.list(function(err, ports) {
				if(err) {
					logger.warn('err ' + err);
    			} else {
    				socket.emit('serial:ports', ports);
    			}
			});
			logger.debug(ports);
		});

		socket.on('serial:band', function(data) {
			serialPort.write('$255\r\n');
			logger.debug('Switch band requested');
		});
    });
}

var commandTypes = {
    0x11: 'WB_PROTOCOL_CMD_Periodic',
    0x12: 'WB_PROTOCOL_CMD_Report',
    0x13: 'WB_PROTOCOL_CMD_Activity_Log_Data',
    0x14: 'WB_PROTOCOL_CMD_Rcvd_data_block_Ack',
    0x15: 'WB_PROTOCOL_CMD_Return_OTA_FW_CRC',
    0x16: 'WB_PROTOCOL_CMD_Return_FW_Version',

    0xA0: 'CLIP_PROTOCOL_CMD_ACK_and_Time_Update',
    0xA1: 'CLIP_PROTOCOL_CMD_Set_TX_Period',
    0xA2: 'CLIP_PROTOCOL_CMD_Request_Report',
    0xA3: 'CLIP_PROTOCOL_CMD_ACK_and_Request_Next_Report',
    0xA4: 'CLIP_PROTOCOL_CMD_ACK_Received_Report',
    0xA5: 'CLIP_PROTOCOL_CMD_Request_WB_FW_Version',
    0xA6: 'CLIP_PROTOCOL_CMD_ACK_and_Battery_Info',

    0xB0: 'CLIP_PROTOCOL_CMD_OTA_Upgrade_Start',
    0xB1: 'CLIP_PROTOCOL_CMD_Flash_Write',
    0xB2: 'CLIP_PROTOCOL_CMD_Check_FW_CRC',
    0xB3: 'CLIP_PROTOCOL_CMD_Activate_New_FW',

    0xC0: 'CLIP_PROTOCOL_CMD_DOCK_REPEAT_UP',
    0xC1: 'CLIP_PROTOCOL_CMD_DOCK_REPEAT_DOWN',

    0xD0: 'DOCK_PROTOCOL_CMD_Dock_Status',
    0xD1: 'DOCK_PROTOCOL_CMD_OTA_Upgrade_Start',
    0xD2: 'DOCK_PROTOCOL_CMD_Flash_Write',
    0xD3: 'DOCK_PROTOCOL_CMD_Activate_New_FW',
    0xD7: 'DOCK_PROTOCOL_CMD_Return_FW_Write_Ack'
};

function serialListener()
{
    var tempBuffer = new Buffer(50);
    var dataIn = 0;

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
                    logger.debug('Copying '+buffer.length+' bytes at '+dataIn);
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
                    logger.debug('Errr....not sure '+buffer.length);
                }
                dataIn = 0;
            } else {
                logger.debug(buffer.length+' packet. Not sure. '+buffer.toString());
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
				logger.info(portStatus.portName + ' open serial communication');
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
		// logger.trace(data.replace(/\./g, ''));
		var packet = {
            systick: 0,
            size: 0,
            command: 0,
            payload: new Buffer(50)
    		//payload: [],
    	};
        /*
    	_.each(data.split(' '), function(item) {
    		if(item.match(/pct:/)) {
    			packet.rx.push(parseInt(item.substr(4,5), 16));
    		}
    		else if(item.length === 2) {
    			packet.rx.push(parseInt(item, 16));
    		}
    		else if(item.match(/-[0-9][0-9][0-9]dBm/)) {
    			packet.rssi = parseInt(item.substr(0,4));
    		}
    	});

    	if(packet.rx.length > 1) {
    		socketServer.sockets.emit('serial:data', packet);
    		//logger.info(packet);
    	} else {
    		logger.trace('Skipping empty packet ' + data);
    	}
    	*/

    	if(data[4] === 32) { //space
            // data[0:3] = 29 68 00 00 => timestamp: 0x00006829 in systicks
            packet.systick = data[0]+Math.pow(16,2)*data[1]+Math.pow(16,4)*data[2]+Math.pow(16,8)*data[3];
            packet.size = data.readUInt8(5);
            var total = 6+packet.size+1; // 4 bytes time, space, size, \n
            if((data[total-1] === 10)) { //LF
                packet.command = data.readUInt8(6);
                data.copy(packet.payload, 0, 7, total-1); // buf.copy(targetBuffer, [targetStart], [sourceStart], [sourceEnd])
                if(commandTypes[packet.command] === undefined) {
                    logger.warn('['+packet.systick+'] new command type '+packet.command);
                } else {
                    logger.info('['+packet.systick+'] '+commandTypes[packet.command]+' '+packet.payload[0]+' '+packet.payload[1]+' '+packet.payload[2]+' '+packet.payload[3]+' '+packet.payload[4]+'...'+packet.payload[packet.size-1]);
                }
            } else {
                logger.warn('Not terminated at '+packet.systick+' with '+packet.size+' byte payload ending in '+data[total-1]);
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

	serialPort.open();
}

function startServer(debug)
{
	app.use(express.static(__dirname + '/public'));

	http.listen(port);
	logger.info('Server started on port ' + port);

	serialListener();
	initSocketIO(http,debug);
}

startServer(true);

exports.start = startServer;
