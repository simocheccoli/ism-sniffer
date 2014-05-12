'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * Packet Schema
 */
var PacketSchema = new Schema({
    raw      : { type: String, default: '' },
    systick  : { type: Number, default: 0 },
    logged   : { type: Date,   default: Date.now },
    size     : { type: Number, default: 0 },
    command  : { type: Number, default: 0 },
    hardware : { type: Number, default: 0 },
    rf_band  : { type: Number, default: 0 },
    product  : { type: String, default: '' },
    payload  : Buffer
});

//mongoose.model('Command', CommandSchema);
module.exports = mongoose.model('Packet', PacketSchema);
