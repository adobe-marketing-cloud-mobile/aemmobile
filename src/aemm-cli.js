/**
    Copyright (c) 2016 Adobe Systems Incorporated. All rights reserved.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
 */
"use strict";
/**
 * Module dependencies.
 */

var path = require('path'),
    help = require('./help'),
    nopt,
    Q = require('q');

var cordova_lib = require('cordova-lib'),
    events = cordova_lib.events,
    CordovaError  = cordova_lib.CordovaError,
    logger = require('cordova-common').CordovaLogger.get();

/*
 * init
 *
 * initializes nopt and underscore
 * nopt and underscore are require()d in try-catch below to print a nice error
 * message if one of them is not installed.
 */
function init() {
    try {
        nopt = require('nopt');
    } catch (e) {
        console.error(
            'Please run npm install from this directory:\n\t' +
            path.dirname(__dirname)
        );
        process.exit(2);
    }
}

var commands = {
    app: require('./app.js'),
    article: require('./article.js'),
    build: require('./build.js'),
    config: require('./config.js'),
    help: require('./help.js'),
    package: require('./package.js'),
    platform: require('./platform.js'),
    plugin: require('./plugin.js'),
    project: require('./project.js'),
    run: require('./run.js'),
    serve: require('./serve.js')
}

module.exports = function (inputArgs, cb) {
    var cb = cb || function(){};
    
    init();
    
    inputArgs = inputArgs || process.argv;
    var cmd = inputArgs[2]; // e.g: inputArgs= 'node aemm run ios'
    
    if(cmd === '--version' || cmd === '-v') {
        cmd = 'version';
    } else if(!cmd || cmd === '--help' || cmd === '-h') {
        cmd = 'help';
    }
    
    Q().then(function() {
        return cli(inputArgs); 
    }).then(function () {
        cb(null);
    }).fail(function (err) {
        cb(err);
        throw err;
    }).done();
}

function cli(inputArgs)
{
    
    var knownOpts =
        { 'verbose' : Boolean
        , 'version' : Boolean
        , 'help' : Boolean
        , 'silent' : Boolean
        , 'target' : String
        , 'get' : String
        , 'set' : String
        , 'unset' : String
        , 'list' : Boolean
        , 'device' : Boolean
        , 'emulator' : Boolean
        , 'debug' : Boolean
        , 'release' : Boolean
        };

    var shortHands =
        { 'd' : '--verbose'
        , 'v' : '--version'
        , 'h' : '--help'
        };

    var args = nopt(knownOpts, shortHands, inputArgs);
    
    // For CordovaError print only the message without stack trace unless we
    // are in a verbose mode.
    process.on('uncaughtException', function(err) {
        logger.error(err);
        process.exit(1);
    });
    
    logger.subscribe(events);

    if (args.silent) {
        logger.setLevel('error');
    }

    if (args.verbose) {
        logger.setLevel('verbose');
    }

    // Check for version
    if (args.version)
    {
        let aemmVersion = require('../package.json').version;

        logger.results(aemmVersion);
        return Q();
    }
    
    // If there were arguments protected from nopt with a double dash, keep
    // them in unparsedArgs. For example:
    // cordova build ios -- --verbose --whatever
    // In this case "--verbose" is not parsed by nopt and args.vergbose will be
    // false, the unparsed args after -- are kept in unparsedArgs and can be
    // passed downstream to some scripts invoked by Cordova.
    var unparsedArgs = [];
    var parseStopperIdx =  args.argv.original.indexOf('--');
    if (parseStopperIdx != -1) {
        unparsedArgs = args.argv.original.slice(parseStopperIdx + 1);
    }

    // args.argv.remain contains both the undashed args (like platform names)
    // and whatever unparsed args that were protected by " -- ".
    // "undashed" stores only the undashed args without those after " -- " .
    var remain = args.argv.remain;
    var undashed = remain.slice(0, remain.length - unparsedArgs.length);
    var commandName = undashed[0];
    var subCommandName;
    args.argv.undashed = undashed;
    
    if ( !commandName || commandName == 'help' || args.help ) {
        if (!args.help && remain[0] == 'help') {
            remain.shift();
        }
        return help(remain);
    }
    
    // Make sure we have a command with the right name
    if (!commands.hasOwnProperty(commandName))
    {
        let cmdLineToolInfo = require('../package.json');
        var message = `${cmdLineToolInfo.name} does not know '${commandName}'; try '${cmdLineToolInfo.name} help' for a list of all the available commands.`;
        throw new CordovaError(message);
    }
    
    let cmd = commands[commandName];
    remain.shift();
    // if cmd is a function, call it
    if (typeof cmd === 'function')
    {
        // Add args as first parameter.
        let newArgs = [args].concat(remain);
        return cmd.apply(this, newArgs);
    } else
    {
        subCommandName = undashed[1];
        // Look for an appropriate sub command
        if (!cmd.hasOwnProperty(subCommandName))
        {
            let cmdLineToolInfo = require('../package.json');
            var message = `${cmdLineToolInfo.name} ${commandName} does not have a subcommand of '${subCommandName}'; try '${cmdLineToolInfo.name} help ${commandName}' for a list of all the available sub commands within ${commandName}.`;
            throw new CordovaError(message);
        }
        let subCommand = cmd[subCommandName];
        remain.shift();

        let newArgs = [args].concat(remain);
        return subCommand.apply(this, newArgs);
    }
}