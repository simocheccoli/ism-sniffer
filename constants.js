'use strict';

var commandTypes = {
    0x00: 'ISM_REQUEST_BROADCAST',
    0x01: 'RF_TAG_PROTOCOL_CMD_PERIODIC',
    0x02: 'RF_TAG_PROTOCOL_CMD_REPORT',
    0x10: 'RF_TAG_PROTOCOL_CMD_RF_ONLY_MODE_ACK',

    0x11: 'WB_PROTOCOL_CMD_Periodic',
    0x12: 'WB_PROTOCOL_CMD_Report',
    0x13: 'WB_PROTOCOL_CMD_Activity_Log_Data',
    0x14: 'WB_PROTOCOL_CMD_Rcvd_data_block_Ack',
    0x15: 'WB_PROTOCOL_CMD_Return_OTA_FW_CRC',
    0x16: 'WB_PROTOCOL_CMD_Return_FW_Version',
    0x17: 'WB_PROTOCOL_CMD_Return_FW_Write_Ack',

    0x45: 'NewRFDbg_PROTOCOL_Request_Dbg_Mode',
    0x46: 'NewRFDbg_PROTOCOL_Cancel_Dbg_Mode',
    0x47: 'NewRFDbg_PROTOCOL_Auth_Challenge',
    0x53: 'NewRFDbg_PROTOCOL_Auth_Response',
    0x54: 'NewRFDbg_PROTOCOL_Auth_Resp_OK',
    0x59: 'NewRFDbg_PROTOCOL_CMD_FROM_DUT',
    0x61: 'NewRFDbg_PROTOCOL_CMD_FROM_TESTER',

    0x81: 'SB_PROTOCOL_CMD_GENERAL_ACK',
    0x82: 'SB_PROTOCOL_CMD_SET_PERIOD',
    0x83: 'SB_PROTOCOL_CMD_REQUEST_REPORT',
    0x84: 'SB_PROTOCOL_CMD_RCVD_REPORT_ACK',

    0x90: 'SB_PROTOCOL_CMD_SET_RF_ONLY_MODE_1',
    0x91: 'SB_PROTOCOL_CMD_SET_RF_ONLY_MODE_2',
    0x92: 'SB_PROTOCOL_CMD_SET_TRACKER_MODE_1',
    0x93: 'SB_PROTOCOL_CMD_SET_TRACKER_MODE_2',

    0xA0: 'CLIP_PROTOCOL_CMD_ACK_and_Time_Update',
    0xA1: 'CLIP_PROTOCOL_CMD_Set_TX_Period',
    0xA2: 'CLIP_PROTOCOL_CMD_Request_Report',
    0xA3: 'CLIP_PROTOCOL_CMD_ACK_and_Request_Next_Report',
    0xA4: 'CLIP_PROTOCOL_CMD_ACK_Received_Report',
    0xA5: 'CLIP_PROTOCOL_CMD_Request_WB_FW_Version',
    0xA6: 'CLIP_PROTOCOL_CMD_ACK_and_Battery_Info',
    0xA7: 'CLIP_PROTOCOL_CMD_Request_Self_Test',
    0xA8: 'CLIP_PROTOCOL_CMD_Request_Enter_FlightMode',
    0xA9: 'CLIP_PROTOCOL_CMD_Request_DK_FW_Version',

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
    0xD7: 'DOCK_PROTOCOL_CMD_Return_FW_Write_Ack',
    0xD8: 'DOCK_PROTOCOL_CMD_Factory_RSSI_Req',
    0xD9: 'DOCK_PROTOCOL_CMD_Factory_RSSI_Rsp',
    0xDA: 'DOCK_PROTOCOL_CMD_Return_FW_Version'
};

exports.commandTypes = commandTypes;
/*
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/buddi');
var _ = require('lodash');
var Command = require('./models/command');

_.each(commandTypes, function(value, key) {
    //console.log('value: '+value+' key: '+key);
    var cmd = new Command();
    cmd.type = key;
    cmd.name = value;

    cmd.save(function(err) {
        if(err)
            console.log('Error inserting '+value);
        console.log(value+' added to database');
    });
});
*/