'use strict';

var events          = require('events');
var util            = require('util');
var sp              = require('serialport');
var SerialPort      = sp.SerialPort;
var logger          = require('./logger');
var _               = require('lodash');
var Packet          = require('./models/packet');
var config          = require('./config');

var SerialListener = function() {

    this.tempBuffer = new Buffer(69); // 3 packets of 23
    this.dataIn = 0;

    var self = this;
    this.setup(function(err, serial) {
        if (err) {
            if(self.listeners('error').length)
                self.emit('error', err);
            else
                throw new Error(err);
        } else {
            self.serialPort = serial;
            self.emit('connected');
        }
    });
}

util.inherits(SerialListener, events.EventEmitter);

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

SerialListener.prototype.setup = function(callback) {
    var self = this;
    var parseSmarter = function(emitter, buffer) {
        if((buffer[4] === 32) && (buffer[buffer.length-1] === 10)) {
            emitter.emit('data', buffer);
            self.dataIn = 0;
        } else {
            if(buffer[4] === 32) {
                buffer.copy(self.tempBuffer);
                self.dataIn = buffer.length;
            } else if (buffer[buffer.length-1] === 10) {
                if(self.dataIn > 0) {
                    if((self.dataIn + buffer.length) < self.tempBuffer.length) {
                        logger.trace('Copying '+buffer.length+' bytes at '+self.dataIn);
                        buffer.copy(self.tempBuffer, self.dataIn);
                        self.dataIn += buffer.length;
                        if((self.dataIn > 23) && (self.dataIn%23 === 0)) { // overlapping packets ?
                            logger.debug('Joined packets. Splitting into '+self.dataIn/23);
                            _.each(_.range(self.dataIn/23), function(item) {
                                emitter.emit('data', self.tempBuffer.slice(item*23,(item+1)*23));
                            });
                        } else {
                            emitter.emit('data', self.tempBuffer);
                        }
                    } else {
                        logger.warn('Preventing overflow. Packets dropped.');
                        self.dataIn = 0;
                    }
                } else {
                    logger.debug('Errr....not sure '+buffer.length);
                }
                self.dataIn = 0;
            } else { // some sort of short middle of a packet
                logger.debug(buffer.length+' packet. Not sure. Copying.');
                if((self.dataIn + buffer.length) < self.tempBuffer.length) {
                    buffer.copy(self.tempBuffer, self.dataIn);
                    self.dataIn += buffer.length;
                } else {
                    logger.warn('Preventing overflow. Packets dropped.');
                    self.dataIn = 0;
                }
            }
        }
    };
    // Just set the first available port
    sp.list(function(err, ports) {
        if(err) {
            logger.warn('Error in serial setup: ' + err);
        } else {
            config.device.ports = ports;
            config.device.portName = config.device.ports[0].comName;
            logger.info('Serial port '+config.device.portName+' selected.');
            var serialPort = new SerialPort(config.device.portName, {
                parser      : parseSmarter, //parsePackets,
                baudrate    : config.device.baud,
                dataBits    : 8,
                parity      : 'none',
                stopBits    : 1,
                flowControl : false
            }, false);

            serialPort.on('open', function (err) {
                if(err) {
                    logger.warn('err ' + err);
                } else {
                    if(config.device.state !== 'closed') {
                        logger.warn('Port already open');
                    } else {
                        logger.debug('Sending $25'+config.device.band+' to serial port.');
                        //serialPort.write('$25'+config.band+'\r\n');
                        //serialPort.flush();
                        logger.info(config.device.portName + ' open serial communication. Listening on '+config.bandTypes[config.device.band]+' band.');
                        self.dataIn = 0;
                        config.device.state = 'open';
                    }
                }
            });

            serialPort.on('close', function (err) {
                if(err) {
                    logger.warn('err ' + err);
                } else {
                    config.device.state = 'closed';
                    self.dataIn = 0;
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
                        packet.rf_band = config.device.band;

                        if(packet.command === 0) { // cmd(1), flags(1), from(4), time(4)
                            packet.hardware = data.readUInt32LE(8, true);
                            packet.payload = data.slice(12, total);
                        } else {
                            if(config.device.band>2) { // Colorado
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

                            if(config.commandTypes[packet.command] === undefined) {
                                logger.warn('['+packet.systick+'] new command type '+packet.command);
                            } else {
                                switch(packet.command) {
                                    case 0:
                                        logger.info('['+packet.systick+'] '+config.commandTypes[packet.command]);
                                        break;
                                    case 1:
                                        logger.info('['+packet.systick+'] '+config.commandTypes[packet.command]+' '+packet.hardware+' Status:'+packet.payload[0]+' Period:'+packet.payload[1]+' Battery:'+packet.payload.readUInt16LE(2, true)+'mv Reports:'+packet.payload[4]);
                                        break;
                                    default:
                                        logger.info('['+packet.systick+'] '+config.commandTypes[packet.command]+' '+packet.hardware+' '+packet.payload.length);
                                        break;
                                }
                            }
                            config.socketServer.sockets.emit('serial:data', packet);
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

            callback(err, serialPort);
        }
    });
    //this.serialPort.open();
};

SerialListener.prototype.getPorts = function() {
    sp.list(function(err, ports) {
        if(err) {
            logger.warn('err ' + err);
        } else {
            config.device.ports = ports;
        }
    });
};

// object and instance
exports = module.exports = new SerialListener();
// object no instance
//module.exports = SerialListener;
