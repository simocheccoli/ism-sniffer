'use strict';

var express         = require('express');
var app             = express();
var bodyParser      = require('body-parser');
var http            = require('http').createServer(app);
var logger          = require('./logger');
//var _               = require('lodash');
var mongoose        = require('mongoose');
var Command         = require('./models/command');
var config          = require('./config');
var SocketServer    = require('./socket');

var socketServer;

function startServer()
{
	app.use(express.static(__dirname + '/public'));
    app.use(bodyParser());

    // ROUTES FOR OUR API
    // =============================================================================
    var router = express.Router();              // get an instance of the express Router

    // middleware to use for all requests
    router.use(function(req, res, next) {
        // do logging
        logger.trace('API request');
        next(); // make sure we go to the next routes and don't stop here
    });

    // test route to make sure everything is working (accessed at GET http://localhost:8080/api)
    router.get('/', function(req, res) {
        res.json({ message: 'Welcome to our api!' });
    });

    // on routes that end in /command
    // ----------------------------------------------------
    router.route('/commands')
        // create a command (accessed at POST http://localhost:8080/api/commands)
        .post(function(req, res) {
            var command = new Command();      // create a new instance of the Command model
            command.name = req.body.name;     // set the command name (comes from the request)
            command.type = req.body.type;
            // save the command and check for errors
            command.save(function(err) {
                if (err) { res.send(err); }
                res.json({ message: 'Command created!' });
                logger.debug('New command created. ['+command.type+' '+command.name+']');
            });
        })
        // get all the commands (accessed at GET http://localhost:8080/api/commands)
        .get(function(req, res) {
            Command.find(function(err, commands) {
                if (err) { res.send(err); }
                res.json(commands);
                logger.debug('All commands sent.');
            });
        });
    // on routes that end in /commands/:command_id
    // ----------------------------------------------------
    router.route('/commands/:command_id')
        // get the command with that id
        .get(function(req, res) {
            Command.findById(req.params.command_id, function(err, command) {
                if (err) { res.send(err); }
                res.json(command);
                logger.debug('Command ['+command.type+' '+command.name+'] sent.');
            });
        })
        // update the command with this id
        .put(function(req, res) {
            Command.findById(req.params.command_id, function(err, command) {
                if (err) { res.send(err); }
                command.name = req.body.name;
                command.type = req.body.type;
                command.save(function(err) {
                    if (err) { res.send(err); }
                    res.json({ message: 'Command updated!' });
                    logger.debug('Command ['+command.type+' '+command.name+'] updated.');
                });
            });
        })
        // delete the command with this id
        .delete(function(req, res) {
            Command.remove({
                _id: req.params.command_id
            }, function(err, command) {
                if (err) { res.send(err); }
                res.json({ message: 'Successfully deleted' });
                logger.debug('Command ['+command+'] deleted.');
            });
        });

    app.use('/api', router);

	http.listen(config.port);
	logger.info('Server started on port ' + config.port);

    mongoose.connect(config.db);

	socketServer = new SocketServer(http);
}

startServer();
