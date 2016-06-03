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

var Q = require('q');
var project = require('./project');
var path = require("path");
var fs = require("fs");
var FS = require("q-io/fs");
var iossim = require('ios-sim');
var serve = require('./serve');
var iosApp = require('./app-ios');
var app = require('./app');
var config = require('./config');
var bplist = require('bplist');
var exec = require('child-process-promise').exec;
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;

module.exports = run;

function run(args) 
{
	let projectRootPath = null;
	var target = args.target;
	var deviceName = args.device ? "device" : "emulator";
	if (args.list)
	{
		return listSimulators();
	}
	return Q.fcall( () => 
	{
		// Make sure we are in a Cordova project folder
		projectRootPath = project.projectRootPath();
		
		let allValidTargets = aemmSimulatorList();
		if (allValidTargets.length === 0)
		{	
			return exec('xcode-select -p')
			.then( (response) => {
				let xcode = response.stdout.trim();
				let simsInstalled = iossim.getdevicetypes().join("\n");
				throw new Error(`No valid simulator devices installed in Xcode(${xcode}).
The following devices are installed\n${simsInstalled}
Valid devices must be iPhone or iPad and run iOS 8 or iOS 9.2 or greater.
Install simulator devices from Xcode.`);			
			});
		}
		
		if (target)
		{
			let filteredList = allValidTargets.filter( (targetItem) => targetItem.startsWith(target) );
			if (filteredList.length == 0)
			{
				throw Error(`Target device specified(${target}) could not be found in the list of available devices.  Run 'aemm run ios --list' for device list.`);
			}
			
			target = filteredList[0];
		} else
		{
			// Look first for an iPhone-6s.  No reason other than it is most popular phone
			let filteredList = allValidTargets.filter( (targetItem) => targetItem.startsWith("iPhone-6s") );
			target = filteredList.length > 0 ? filteredList[0] : allValidTargets[0];
			events.emit("info", `No target specified for emulator. Deploying to ${target} simulator`);
		}

	})
	.then( () => app.ensureInstalledBinary("ios", deviceName) )
	.then( function() {
		return serve({}, deviceName);
	})
	.then( function(serveResponse) {
		return startSimulator(target, deviceName, serveResponse.address, serveResponse.port, projectRootPath);	
	});
};

function listSimulators(args)
{
	return Q.fcall( () => 
	{
		let sims = aemmSimulatorList();
		events.emit("results", "Available ios virtual devices");
		sims.forEach((target) => events.emit("results", target) );
	});
}

function aemmSimulatorList()
{
	let targetTypes = iossim.getdevicetypes();
	let filteredList = targetTypes.filter( (item) => 
	{
		let components = item.split(", ");
		let versionNumber = Number(components[1]);
		if (versionNumber < 8.0 || (versionNumber >= 9.0 && versionNumber < 9.2))
		{
			return false;
		}
		return item.startsWith("iPhone") || item.startsWith("iPad") 
	});
	
	return filteredList;
}

var startSimulator = function(target, deviceName, ipAddress, port, projectRootPath)
{
	return getArgs(ipAddress, port)
	.then( function(args) {
		return iosApp.getInstalledAppBinaryPath(deviceName)
		.then( (jupiterPath) => {
			return modifyBinaryPlist(jupiterPath, "", "")
			.then( () => jupiterPath );
		})
		.then( function(jupiterPath) {
			return app.getApplicationSupportPath()
			.then( (applicationSupportPath) => {
				let logPath = path.join(applicationSupportPath, `${path.basename(projectRootPath)}.sim.console.log`);
				// Start a new log whenever we launch sim
				if (fs.existsSync())
				{
					fs.unlinkSync(logPath);
				}
				return iossim.launch(jupiterPath, target, logPath, false, args);						
			})
		});
	});
}

var getArgs = function(ipAddress, port) 
{
	return project.articleList( )
	.then( (articleList) => {
		let articleNames = articleList.map( (articleInfo) => articleInfo.metadata.entityName); 
		let articles = articleNames.join(" ");
		let args = ["-phonegapServer", ipAddress + ":" + port, "-serveArticles", articles];
		return args;
	});
	
// return ["-phonegapServer", ipAddress + ":" + port];

}


function modifyBinaryPlist(appPath)
{
	var appConfigPlistPath = path.join(appPath, "ApplicationConfig.plist");
	var bplist_parseFile = Q.nfbind( bplist.parseFile );
    
	return bplist_parseFile(appConfigPlistPath)
	.then( function(parseResults) {
		var appConfig = parseResults[0];

        var orientation = config.getValueFromConfig('screenOrientation');
        if (orientation) {
            appConfig.screenOrientation.tablet = orientation;
            appConfig.screenOrientation.phone = orientation;
        }
        
		delete appConfig.phoneIdKey;
		delete appConfig.tabletIdKey;
		delete appConfig.configServiceBaseURL;

		var plistXML = bplist.create(appConfig);
		
		
		var deferred = Q.defer();
		fs.writeFile(appConfigPlistPath, new Buffer(plistXML), function (err) {
			if (err) 
			{
				return deferred.reject(err);
			}
			return deferred.resolve(appConfigPlistPath);
		});
		
		return deferred.promise;			
	});
}

