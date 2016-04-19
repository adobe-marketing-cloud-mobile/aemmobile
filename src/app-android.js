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
var Q = require('q');
var path = require("path");
var FS = require('q-io/fs');
var fs = require("fs");
var downloadFile = require('../utils/downloadFile');
var os = require('os');
var app = require('./app');
var config = require('../config.json');
var plist = require('plist');
var AEMMError = require('./AEMMError');

const aemmAppName = "AEMM.apk";
const aemmVerName = "version.txt";

module.exports.getInstalledAppBinaryPath = getInstalledAppBinaryPath;
function getInstalledAppBinaryPath(deviceType)
{
	return app.getParentPathForAppBinary("android", deviceType)
	.then( (parentPath) => {
		let viewerPath = path.join(parentPath, aemmAppName);
		if ( !fs.existsSync(viewerPath) )
		{
			throw new AEMMError(`No application found at ${parentPath}; try 'aemm app install android'.`);			
		}
		
		return viewerPath;
	});

}

module.exports.getAppVersion = getAppVersion;
function getAppVersion(deviceType)
{
	return app.getParentPathForAppBinary("android", deviceType)
		.then(function (appBinaryParentPath) {
			let versionPath = path.join(appBinaryParentPath, aemmVerName);

			if ( !fs.existsSync(versionPath) )
			{
				throw new AEMMError(`No application found at ${appBinaryParentPath}`);
			}

			return fs.readFileSync(versionPath,'utf8')
		});
}


module.exports.installFromFilePath = installFromFilePath;
function installFromFilePath(version, filepath, deviceType)
{
	let apkAppPath = filepath;
	let binaryParentPath = null;
	return app.getParentPathForAppBinary("android", deviceType)
		.then(function (appBinaryParentPath) {
			binaryParentPath = appBinaryParentPath;
			return FS.makeTree(binaryParentPath)
				.then(function() {
					let targetPath = path.join(binaryParentPath, aemmAppName);
					return FS.copy(apkAppPath, targetPath)
						.then(function() {
							let versionPath = path.join(binaryParentPath, aemmVerName);

							var deferred = Q.defer();
							fs.writeFile(versionPath, version, function(err) {
								if(err) {
									console.error("Could not write file: %s", err);
								}
								deferred.resolve();
							});

							return deferred.promise;
						});
				});
		});
}