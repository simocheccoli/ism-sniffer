'use strict';

var events = require('events');
var util = require('util');
var logger = require('./logger');
var Packet = require('./models/packet');

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

var SerialProxy = function(serialPort) {
    events.EventEmitter.call(this);
    var self = this;

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
		var packet = new Packet();
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

                if((data[15] === 85) && (data[16] === 170)) {
                    packet.product = 'Colorado';
                    packet.hardware = data.readUInt32LE(7, true) + Math.pow(2,32)*data.readUInt32LE(11, true); // 64bits LSB First
                    packet.payload = data.slice(17, total-1);
                } else {
                    packet.product = 'Click';
                    packet.hardware = data.readUInt32LE(8, true); // WB_ID
                    packet.payload = data.slice(16, total-1);
                }
                //self.emit('foo', packet);
                //data.copy(packet.payload, 0, 7, total); // buf.copy(targetBuffer, [targetStart], [sourceStart], [sourceEnd])
                if(commandTypes[packet.command] === undefined) {
                    logger.warn('['+packet.systick+'] new command type '+packet.command);
                } else {
                    logger.info('['+packet.systick+'] '+commandTypes[packet.command]+' '+packet.hardware+' '+packet.payload.length);
                }
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

	serialPort.open();
}

util.inherits(SerialProxy, events.EventEmitter);