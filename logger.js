'use strict';

var winston = require('winston');

// Set up logger
var customColors = {
  trace: 'white',
  debug: 'cyan',
  info: 'green',
  warn: 'yellow',
  crit: 'red',
  fatal: 'red'
};

var pad2 = function(n) { return n<10 ? '0'+n : ''+n; };
var pad3 = function(n) {
  if(n>99) {
    return ''+n;
  } else if (n>9) {
    return '0'+n;
  } else {
    return '00'+n;
  }
};

var logger = new (winston.Logger)({
  colors: customColors,
  levels: {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    crit: 4,
    fatal: 5
  },
  transports: [
    new (winston.transports.Console)({
      level: 'debug', //trace',
      colorize: true,
      //timestamp: true
      timestamp: function() {
        var d = new Date();
        /* dd/mm/yyyy HH:MM:SS.sss */
        return pad2(d.getDate())+'/'+pad2(d.getMonth()+1)+'/'+d.getFullYear()+' '+d.toLocaleTimeString()+'.'+pad3(d.getMilliseconds());
        /* yyyy-mm-dd HH:MM:SS.sss */
        //return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())+' '+d.toLocaleTimeString()+'.'+pad3(d.getMilliseconds());
      }
    })/*,
    new (winston.transports.File)({
      filename: 'data.log',
      handleExceptions: true
    })*/
  ]
});

winston.addColors(customColors);

// Extend logger object to properly log 'Error' types
var origLog = logger.log;

logger.log = function (level, msg) {
  var objType = Object.prototype.toString.call(msg);
  if (objType === '[object Error]') {
    origLog.call(logger, level, msg.toString());
  } else {
    origLog.call(logger, level, msg);
  }
};
/* LOGGER EXAMPLES
  logger.trace('testing');
  logger.debug('testing');
  logger.info('testing');
  logger.warn('testing');
  logger.crit('testing');
  logger.fatal('testing');
*/

module.exports = logger;