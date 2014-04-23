'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * Command Schema
 */
var CommandSchema = new Schema({
    type: {
        type: Number,
        default: 0
    },
    name: {
        type: String,
        default: '',
        trim: true
    }
});

//mongoose.model('Command', CommandSchema);
module.exports = mongoose.model('Command', CommandSchema);