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

var aemmConfig = require('../config');
var exec = require('child-process-promise').exec;
var Q = require('q');
var phoneGap = require('connect-aemmobile');
var project = require('./project');
var path = require("path");
var FS = require('q-io/fs');
var fs = require("fs");
var appBinary = require('./app');
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;

/**
 * Server Default Settings
 */
var ServeDefaults = {
    port: 3000,
    autoreload: true,
    localtunnel: false
};

module.exports = serve;

function serve(options) 
{
	return getCordovaRoot()
	.then( (cordovaRootPath) => {
		events.emit("log", 'starting app server...');
		events.emit("log", "Use Ctrl-C to exit")
		
		if (!options) throw new Error('requires option parameter');

		// optional parameters
		options.port = options.port || ServeDefaults.port;
		options.autoreload = (typeof options.autoreload === 'boolean') ? options.autoreload : ServeDefaults.autoreload;
		options.localtunnel = (typeof options.localtunnel === 'boolean') ? options.localtunnel : ServeDefaults.localtunnel;
		options.cordovaRoot = cordovaRootPath;
		options.customMiddleware = [articleMiddleware];


		var deferred = Q.defer()

		phoneGap.listen(options)
		.on('log', function() {
			console.log.apply(this, arguments);
		})
		.on('error', function(e) {
			console.error.call(this, (e.message || e));
			deferred.reject(e);
		})
		.on('complete', function(data) {
			deferred.resolve(data);
		});
		
		return deferred.promise;
	});
}

function articleMiddleware(options)
{
	// return the request listener
    return function(req, res, next) {
        if (req.url.indexOf('articles.json') >= 0 ) 
		{
			project.articleList()
			.then( (articleList) => {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end( JSON.stringify(articleList) );
			}).catch( (err) => 
			{
				events.emit("error", `Failed to get article list: ${err}`);
				next();
			});
			
        } else 
		{
            next();
        }
    };

}

function getCordovaRoot()
{
	// Try to get app path from emulator first, then device
	// We use ios only here because Android does not need this.  If we have an iOS build
	// we can use it and Android will work fine with it because they intercept the calls on the client
	// side
	return Q.fcall( () => {
		return appBinary.getInstalledAppBinaryPath("ios", "emulator")
		.catch( () => {
			return appBinary.getInstalledAppBinaryPath("ios", "device")
		})		
	})
	.then( (appPath) => {
		let cordovaRoot = path.join(appPath, "Frameworks", "CordovaPlugins.framework", "www");
		return cordovaRoot;
	})
	.catch( () => {
		return null;
	});

}