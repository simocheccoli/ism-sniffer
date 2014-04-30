'use strict';

/* Filters */

angular.module('snifferApp.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
		return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]).
  filter('packet', [function() {
  	return function(input) {
  		var out = '';
  		if(input.command === 1) {
  			if(input.payload[0]&1)   { out += 'Left strap on, '; }  else { out += 'Left strap off, '; }
  			if(input.payload[0]&2)   { out += 'Right strap on, '; } else { out += 'Right strap off, '; }
  			if(input.payload[0]&16)  { out += 'On charge, '; } else { out += 'Off charge, '; }
  			//if(input.payload[0]&128) { out += 'Left strap on'; } else { out += 'Left strap off'; };
  			out += 'Status:'+input.payload[0]+' Period:'+input.payload[1]+' Battery:'+(input.payload[2]+256*input.payload[3])+'mv Reports:'+input.payload[4];
  		} else {
  			angular.forEach(input.payload, function(value, key) {
  				out += '0x'+value.toString(16)+' ';
  			});
			//out = JSON.stringify(input.payload).toString(16);
  		}
  		return out;
  	};
  }]);