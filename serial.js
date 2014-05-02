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

    //this.tempBuffer = new Buffer(69); // 3 packets of 23
    //this.dataIn = 0;

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

SerialListener.prototype.setup = function(callback) {
    var self = this;
    var newTempBuffer = new Buffer(0);

    var parsePackets = function(emitter, buffer) {
        // packet structure:
        // timestamp(4), space(1), length(1), command(1), IMEI(8), signature(2), payload(5/21/37), lf(1)
        // preamble(6) + length + lf(1) i.e 7+length
        if(newTempBuffer.length > 0) {
            var temp = Buffer.concat([newTempBuffer, buffer]);
            if(_.contains(temp, 32) && _.contains(temp, 10)) { // space and LF
                if(temp.length === (temp.readUInt8(5)+7)) {
                    logger.trace('Sending joined packet ('+newTempBuffer.length+'+'+buffer.length+')');
                    emitter.emit('data', temp);
                    newTempBuffer.length = 0;
                } else {
                    var outPackets = [];
                    var lastPktEnd = 0;
                    var lastPktStart = 0;
                    _.each(temp, function(value, index) { // check for joined packets
                        //logger.trace('Value: '+value+' Index:'+index);
                        if(value === 32) {
                            var pktLen = index + temp[index+1] + 2; // offset + length byte + length + lf
                            if(pktLen < temp.length) {
                                if(temp[pktLen] === 10) { // this is a packet
                                    lastPktEnd = pktLen+1;
                                    lastPktStart = index-4;
                                    // buf.slice([start], [end])
                                    outPackets.push(temp.slice(lastPktStart, lastPktEnd));
                                }
                            }
                        }
                    });

                    if(outPackets.length > 0) {
                        _.each(outPackets, function(item, index) {
                            logger.trace('Sending split packet '+(index+1)+' of '+outPackets.length+' '+item.toString('hex'));
                            emitter.emit('data', item);
                        });
                        if(lastPktEnd === temp.length) { // complete
                            newTempBuffer.length = 0;
                            logger.trace('Data complete. Resetting('+newTempBuffer.length+')');
                        } else { // save for next time
                            newTempBuffer = temp.slice(lastPktStart, temp.length);
                            logger.trace('lastPktEnd: '+lastPktEnd+' lastPktStart: '+lastPktStart+' tempLen: '+temp.length);
                            logger.trace('Data left over. ('+newTempBuffer.length+') '+newTempBuffer.toString('hex'));
                        }
                    } else {
                        //encoding: ascii utf8 utf16le ucs2 base64 binary hex
                        //More: http://nodejs.org/api/buffer.html#buffer_buffer
                        logger.warn('Invalid packet('+temp.length+'). Dropping. '+temp.toString('hex'));
                        newTempBuffer.length = 0;
                    }
                }
            }
        } else {
            if(buffer.length > 22) { // might need to check config.device.band for min size
                if(_.contains(buffer, 32) && _.contains(buffer, 10)) { // space and LF
                    if(buffer.length === (buffer.readUInt8(5)+7)) { // standalone good packet
                        emitter.emit('data', buffer);
                        newTempBuffer.length = 0;
                    } else { // probably multiple packets
                        newTempBuffer = Buffer.concat([newTempBuffer, buffer]);
                        logger.trace('Saving part packet (+'+buffer.length+')');
                    }
                } else { // part of packet
                    newTempBuffer = Buffer.concat([newTempBuffer, buffer]);
                    logger.trace('Saving part packet (+'+buffer.length+')');
                }
            } else { // packet too small
                newTempBuffer = Buffer.concat([newTempBuffer, buffer]);
                logger.trace('Saving part packet (+'+buffer.length+')');
            }
        }
    };
    /*
    var parseSmarter = function(emitter, buffer) {
        if((buffer[4] === 32) && (buffer[buffer.length-1] === 10)) {
            emitter.emit('data', buffer);
            self.dataIn = 0;
        } else {
            if(buffer[4] === 32) {  // Start of packet
                buffer.copy(self.tempBuffer);
                self.dataIn = buffer.length;
            } else if (buffer[buffer.length-1] === 10) { // End of packet
                if(self.dataIn > 0) { // previous data
                    if((self.dataIn + buffer.length) < self.tempBuffer.length) {
                        logger.trace('Copying '+buffer.length+' bytes at '+self.dataIn);
                        buffer.copy(self.tempBuffer, self.dataIn);
                        self.dataIn += buffer.length;
                        if((self.dataIn > 23) && (self.dataIn%23 === 0)) { // overlapping packets ?
                            logger.debug('Joined packets. Splitting into '+self.dataIn/23);
                            _.times(self.dataIn/23, function(item) {
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
    */
    // Just set the first available port
    sp.list(function(err, ports) {
        if(err) {
            logger.warn('Error in serial setup: ' + err);
        } else {
            config.device.ports = ports;
            config.device.portName = config.device.ports[0].comName;
            logger.info('Serial port '+config.device.portName+' selected.');
            var serialPort = new SerialPort(config.device.portName, {
                parser      : parsePackets, //parseSmarter, //
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
                        serialPort.write('$25'+config.band+'\r\n');
                        //serialPort.flush();
                        logger.info(config.device.portName + ' open serial communication. Listening on '+config.bandTypes[config.device.band]+' band.');
                        //self.dataIn = 0;
                        config.device.state = 'open';
                    }
                }
            });

            serialPort.on('close', function (err) {
                if(err) {
                    logger.warn('err ' + err);
                } else {
                    config.device.state = 'closed';
                    //self.dataIn = 0;
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

                        if((packet.command > 0) && (packet.command < 17)) {
                            packet.product = 'Tag';
                        } else if ((packet.command >= 17) && (packet.command < 31)) {
                            packet.product = 'Wristband';
                        } else if ((packet.command >= 69) && (packet.command < 128)) {
                            packet.product = 'RF Debug';
                        } else if ((packet.command >= 128) && (packet.command < 160)) {
                            packet.product = 'SmartBeacon';
                        } else if ((packet.command >= 160) && (packet.command < 208)) {
                            packet.product = 'Clip';
                        } else if ((packet.command >= 208) && (packet.command < 230)) {
                            packet.product = 'Dock';
                        }

                        switch(packet.command) {
                            case 0:   // ISM_REQUEST_BROADCAST
                                packet.hardware = data.readUInt32LE(8, true); // cmd(1), flags(1), from(4), time(4)
                                packet.payload = data.slice(7, total);
                                break;

                            case 1:   // could be RF_TAG_PROTOCOL_CMD_PERIODIC or ISM_REQUEST_ALLOWED
                                if((data[15] === 85) && (data[16] === 170)) {
                                    packet.hardware = data.readUInt32LE(7, true) + Math.pow(2,32)*data.readUInt32LE(11, true); // 64bits LSB First
                                    packet.payload = data.slice(17, total);
                                } else {
                                    packet.command = 254; // reassign because of overlap
                                    packet.hardware = data.readUInt32LE(8, true); // cmd(1), flags(1), from(4), time(4)
                                    packet.payload = data.slice(7, total);
                                }
                                break;

                            case 128: // SB_PROTOCOL_CMD_TIME

                            default:
                                if(config.device.band>2) { // Colorado
                                    if((data[15] === 85) && (data[16] === 170)) {
                                        packet.hardware = data.readUInt32LE(7, true) + Math.pow(2,32)*data.readUInt32LE(11, true); // 64bits LSB First
                                        packet.payload = data.slice(17, total);
                                    } else {
                                        logger.warn('Checksum not found. Command:'+packet.command);
                                        logger.debug(data.toString('hex'));
                                        packet.payload = data.slice(7, total);
                                    }
                                } else { // Click
                                    packet.hardware = data.readUInt32LE(8, true); // WB_ID
                                    packet.payload = data.slice(16, total);
                                }
                                break;
                        }

                        //data.copy(packet.payload, 0, 7, total); // buf.copy(targetBuffer, [targetStart], [sourceStart], [sourceEnd])
                        packet.save(function(err) {
                            if(err)
                                logger.warn('Error inserting packet into database');

                            if(config.commandTypes[packet.command] === undefined) {
                                logger.warn('['+packet.systick+'] new command type '+packet.command);
                                logger.debug(data.toString('hex'));
                            } else {
                                logger.info('['+packet.systick+'] '+config.commandTypes[packet.command]);
                                /*
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
                                }*/
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
