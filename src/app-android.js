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
var project = require('./project');
var constants = require('../utils/constants');

function getCustomAppBinaryPath()
{
	return project.projectRootPath()
	.then( (projectRootPath) => {
		var customAppPath = path.join(projectRootPath, 'platforms/android/build/outputs/apk/android-debug.apk');
		return FS.exists(customAppPath)
		.then( (exists) => {
			if (!exists) {
				return Q(null);
			}
			else {
				return Q(customAppPath);
			}
		});
	});
}

module.exports.getInstalledAppBinaryPath = getInstalledAppBinaryPath;
function getInstalledAppBinaryPath(deviceType)
{
	return getCustomAppBinaryPath()
	.then( (customAppPath) => {
		if (customAppPath !== null) {
			return Q(customAppPath);
		}

		return app.getParentPathForAppBinary("android", deviceType)
			.then((parentPath) => {
				var viewerPath = path.join(parentPath, constants.APP_NAME_PREBUILT);
				if (!fs.existsSync(viewerPath)) {
					throw new Error(`No application found at ${parentPath}`);
				}

				return Q(viewerPath);
			});
	});
}

module.exports.getAppVersion = getAppVersion;
function getAppVersion(deviceType)
{
	return app.getParentPathForAppBinary("android", deviceType)
		.then(function (appBinaryParentPath) {
			var versionPath = path.join(appBinaryParentPath, constants.APP_VERSION_FILE);

			if ( !fs.existsSync(versionPath) )
			{
				throw new Error(`No application found at ${appBinaryParentPath}`);
			}

			return fs.readFileSync(versionPath,'utf8');
		});
}


module.exports.installFromFilePath = installFromFilePath;
function installFromFilePath(version, filepath, deviceType)
{
	var apkAppPath = filepath;
	var binaryParentPath = null;
	return app.getParentPathForAppBinary("android", deviceType)
		.then(function (appBinaryParentPath) {
			binaryParentPath = appBinaryParentPath;
			return FS.makeTree(binaryParentPath)
				.then(function() {
					var targetPath = path.join(binaryParentPath, constants.APP_NAME_PREBUILT);
					return FS.copy(apkAppPath, targetPath)
						.then(function() {
							var versionPath = path.join(binaryParentPath, constants.APP_VERSION_FILE);

							var deferred = Q.defer();
							fs.writeFile(versionPath, version, function(err) {
								if(err) {
									throw new Error(`Could not write file: ${err}`);
								}
								deferred.resolve();
							});

							return deferred.promise;
						});
				});
		});
}
