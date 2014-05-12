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
  		if(input.command === 1) { // RF_TAG_PROTOCOL_CMD_PERIODIC
  			if(input.payload[0]&1)  { out += 'Left strap on '; }  else { out += 'Left strap off '; }
  			if(input.payload[0]&2)  { out += 'Right strap on '; } else { out += 'Right strap off '; }
  			if(input.payload[0]&16) { out += 'On charge '; } else { out += 'Off charge '; }
  			//if(input.payload[0]&128) { out += 'Left strap on'; } else { out += 'Left strap off'; };
  			out += 'Status:'+input.payload[0]+' Period:'+input.payload[1]+' Battery:'+(input.payload[2]+256*input.payload[3])+'mv Reports:'+input.payload[4];
  		} else if(input.command === 17) { // WB_PROTOCOL_CMD_Periodic
        // STATUS(1), PERIOD(2), BATTERY(2), NEXT_CH(1)
        if(input.payload[0]&1)   { out += 'Button Alert, '; }
        if(input.payload[0]&2)   { out += 'Fall Detected, '; }
        if(input.payload[0]&4)   { out += 'Alert Cancellation, '; }
        if(input.payload[0]&16)  { out += 'Charger Connected, '; }
        if(input.payload[0]&32)  { out += 'Charging, '; }
        if(input.payload[0]&64)  { out += 'Repeat Packet, '; }
        if(input.payload[0]&128) { out += 'Reports Available, '; }
        out += 'Period:'+(input.payload[1]+256*input.payload[2])+' Battery:'+(input.payload[3]+256*input.payload[4])+'mv Next CH:'+input.payload[5];
      } else if(input.command === 160) { // CLIP_PROTOCOL_CMD_ACK_and_Time_Update
        // DATE(2), TIME(2), TIME_MS(2)
        out += 'Date:'+(input.payload[0]+256*input.payload[1])+' Time:'+(input.payload[2]+256*input.payload[3])+' Ms:'+(input.payload[4]+256*input.payload[5]);
      } else if(input.command === 166) { // CLIP_PROTOCOL_CMD_ACK_and_Battery_Info
        // STATUS(1), WRIST_CLEAR(1), DUMMY(1), BATTERY(2), RSSI(1)
        if(input.payload[0]&1)   { out += 'Button Alert, '; }
        if(input.payload[0]&2)   { out += 'Fall Detected, '; }
        if(input.payload[0]&4)   { out += 'Alert Cancellation, '; }
        if(input.payload[0]&8)   { out += 'Search Confirmation, '; }
        if(input.payload[0]&16)  { out += 'Charger Connected, '; }
        if(input.payload[0]&32)  { out += 'Charging, '; }
        if(input.payload[1]&1)   { out += 'WB Clear Alert, '; }
        if(input.payload[1]&2)   { out += 'Clip Alert, '; }
        if(input.payload[1]&4)   { out += 'Clip ACK WB Cancel, '; }
        out += 'Battery:'+(input.payload[3]+256*input.payload[4])+'mv RSSI:'+(input.payload[5]-256);
      } else if(input.command === 208) { // DOCK_PROTOCOL_CMD_Dock_Status
        // DOCK_RF_ID(4), STATUS(1), VER_NUM(4), DUMMY(1)
        out += 'Dock ID:'+(input.payload[0]+256*input.payload[1]+65536*input.payload[2]+16777216*input.payload[3]);
        out += ' Status:'+input.payload[4];
        out += ' Version:'+(input.payload[5]+256*input.payload[6]+65536*input.payload[7]+16777216*input.payload[8]);
      } else {
        /*angular.forEach(input.payload, function(value, key) {
  				out += '0x'+value.toString(16)+' ';
  			});*/
        if(input.raw.length > 50) {
          out += '0x'+input.raw.substr(0,49)+'\n'+input.raw.substr(50);
        } else {
          out += '0x'+input.raw;
        }
  		}
  		return out;
  	};
  }]);
