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

var nopt = require('nopt');
var Q = require('q');
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;
var AEMMError = require('./AEMMError');
var logger = require('cordova-common').CordovaLogger.get();

var commands = {
    app: require('./app.js'),
    article: require('./article.js'),
    config: require("./config.js"),
    help: require("./help.js"),
    platform: require("./platform.js"),
    plugin: require("./plugin.js"),
    project: require('./project.js'),
    run: require('./run.js'),
    serve: require('./serve.js')
}

module.exports = cli;
function cli(inputArgs, callback)
{
	var knownOpts =
	{ 
		'version' : Boolean,
		'help' : Boolean,
		'target' : String,
        'get' : String,
        'set' : String,
        'unset' : String,
        'list' : Boolean,
        'verbose' : Boolean,
        'silent' : Boolean
	};

    var shortHands =
        {
          'v' : '--version'
        , 'h' : '--help'
        };

    var args = nopt(knownOpts, shortHands, inputArgs);

    // Check for version
	if (args.version)
	{
		let cmdLineToolInfo = require('../package.json');

		console.log(`Version ${cmdLineToolInfo.version}`);
		return;
	}
/*    
    process.on('uncaughtException', function(err) {
        logger.error(err);
        process.exit(1);
    });
*/
    logger.subscribe(events);

    if (args.silent) {
        logger.setLevel('error');
    }

    if (args.verbose) {
        logger.setLevel('verbose');
    }
    
	var remain = args.argv.remain;
	var commandName = remain[0];
	var subCommandName = remain[1];
	
	if ( !commandName || args.help ) 
	{
		subCommandName = commandName;
		commandName = "help";
    }
	
	Q.fcall( () => {

		// Make sure we have a command with the right name
		if (!commands.hasOwnProperty(commandName))
		{
			let cmdLineToolInfo = require('../package.json');
			var message = '`' + cmdLineToolInfo.name + '` does not know `' + commandName + '`; try `' +
				cmdLineToolInfo.name + ' help` for a list of all the available commands.';
			throw new AEMMError(message);
		}
		
		let cmd = commands[commandName];
		remain.shift();
		let cmdPromise = null;
		// if cmd is a function, call it
		if (typeof cmd === 'function')
		{
			// Add args as first parameter.
			let newArgs = [args].concat(remain);
			cmdPromise = cmd.apply(this, newArgs);
		} else
		{
			// Look for an appropriate sub command
			if (!cmd.hasOwnProperty(subCommandName))
			{
				let cmdLineToolInfo = require('../package.json');
				var message = '`' + cmdLineToolInfo.name + ' ' + commandName + '` does not have a subcommand of `' +
					subCommandName + '`; try `' + cmdLineToolInfo.name + ' help ' + commandName +
					'` for a list of all the available sub commands within ' + commandName + '.';
				throw new AEMMError(message);
			}
			let subCommand = cmd[subCommandName];
			remain.shift();

			let newArgs = [args].concat(remain);
			cmdPromise = subCommand.apply(this, newArgs)
		}
		return cmdPromise;
	})
	.then( (result) => {
		// if the result is a list from Q.allSettled, then we may have a mixture of errors and successes.  Check for this and write out errors
		if (Array.isArray(result))
		{
			result.forEach( (item) => {
				if (item.state && item.state === "rejected" && item.reason)
				{
				    throw new AEMMError(item.reason);
				}
			});
		}
	})
	.catch( (err) => {
		throw new AEMMError(err.message);
	})
	.finally( function () {
		if (callback)
		{
			callback();
		}
	}).done();
	
	
}