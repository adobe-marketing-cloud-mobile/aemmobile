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
var ansi = require('ansi');

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
        'list' : Boolean
	};

    var shortHands =
        {
          'v' : '--version'
        , 'h' : '--help'
        };

    var args = nopt(knownOpts, shortHands, inputArgs);
	
	var remain = args.argv.remain;
	var commandName = remain[0];
	var subCommandName = remain[1];

	// Check for version
	if (args.version)
	{
		let cmdLineToolInfo = require('../package.json');

		console.log(`Version ${cmdLineToolInfo.version}`);
		return;
	}
	
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
			throw Error(`${cmdLineToolInfo.name} does not know '${commandName}'; try '${cmdLineToolInfo.name} help' for a list of all the available commands.`);
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
				throw Error(`${cmdLineToolInfo.name} ${commandName} does not have a subcommand of '${subCommandName}'; try '${cmdLineToolInfo.name} help ${commandName}' for a list of all the available sub commands within ${commandName}.`);
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
					outputError(item.reason);
				}
			});
		}
		if (callback)
		{
			callback();
		}
	})
	.catch( (err) => {
		outputError(err);
		
		if (callback)
		{
			callback(err);
		}
	});		
	
	
}

function outputError(error)
{
	var stderrCursor = ansi(process.stderr);
	stderrCursor.fg.red().bold().write(`Error: ${error.message}\n`).reset();
}