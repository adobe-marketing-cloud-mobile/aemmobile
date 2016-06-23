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
var platformRequire = require('../utils/platformRequire');
var path = require("path");
var exec = require('child-process-promise').exec;
var aemmConfig = require('./aemm-config');
var rp = require('request-promise');
var os = require('os');
var downloadFile = require('../utils/downloadFile');
var url = require('url');
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;

module.exports.getApplicationSupportPath = getApplicationSupportPath;
function getApplicationSupportPath()
{
	if (process.platform == 'win32') {
		return exec('echo path')
			.then( function(processResponse) {
				return path.join(getUserHome(), 'aemm/app/');
			});
	} else if (process.platform == 'darwin') {
		return exec('osascript -e "posix path of (path to application support folder from user domain)"')
			.then(function (processResponse) {
				let appSupportPath = path.join(processResponse.stdout.trim(), "com.adobe.aemmobile");
				return appSupportPath;
			});
	}
}

module.exports.getInstalledAppBinaryPath = getInstalledAppBinaryPath;
function getInstalledAppBinaryPath(platform, deviceType)
{
	return Q.fcall( () => {
		var platformAppBinary = platformRequire("app", platform);

		if (!platformAppBinary)
		{
			throw new Error(`Invalid platform(${platform}) sent to getInstalledAppBinaryPath())`);
		}
		return platformAppBinary.getInstalledAppBinaryPath(deviceType);
	})
}

module.exports.getParentPathForAppBinary = getParentPathForAppBinary;
function getParentPathForAppBinary(platform, deviceType)
{
	return getApplicationSupportPath()
	.then( function(appSupportPath) {
		let aemmPath = path.join( appSupportPath, platform, deviceType);
		try {
			let binaryPath =  fs.realpathSync( aemmPath );
			return binaryPath;
		} catch (e) 
		{
			return aemmPath;
		}
	});
}

//returns promise of app path where binary has been installed
module.exports.ensureInstalledBinary = ensureInstalledBinary;
function ensureInstalledBinary(platform, deviceName) 
{
	return getInstalledAppBinaryPath(platform, deviceName)
	.then( function(binaryPath) {
		return binaryPath;
	})
	.catch( (err) => {
		throw Error("You must install downloaded app binary before using this command.  See 'aemm app install'.");
	})
}

module.exports.version = displayAppVersion;
function displayAppVersion(options, platform)
{
	const deviceType = "emulator";
	const platformList = platform ? [platform] : ["ios", "android"];

	return Q.fcall( () => {
		const promises = platformList.map( (platform) => {
			const platformAppBinary = platformRequire("app", platform);
			return platformAppBinary.getAppVersion(deviceType)
			.then( (appVersion) => {
				events.emit('log', `${platform} version:\n${appVersion ? appVersion : "No app install for ios."}\n`);
			})	
		});
		
		return Q.all(promises)
		.then( () => true );
	});
}

module.exports.install = install;
function install(options, urlOrFilepathOrPlatform, appVersion)
{
	return Q.fcall( () => {
		if (options.list)
		{
			return listAppVersions(urlOrFilepathOrPlatform);
		}
		const deviceType = "emulator";

		let installPromise = null;
		if (urlOrFilepathOrPlatform === "ios" || urlOrFilepathOrPlatform === "android")
		{
			installPromise =  installFromServerInConfig(urlOrFilepathOrPlatform, deviceType, appVersion);
		} 
		else if (urlOrFilepathOrPlatform) 
		{
			installPromise = installFromFile(appVersion, urlOrFilepathOrPlatform, deviceType);
		}
		else
		{
			events.emit("warn", `You need to indicate a plaftorm for the app you would like to install.\n\tPlease see your options below:`)
			return listAppVersions();
		}
	
		return installPromise.then( () => events.emit("log", "Install complete"));
	});
	
}

function installFromServerInConfig(platform, deviceType, specificVersion)
{
	return Q.fcall( () => {
		return rp( remoteBinaryVersionsUrl() )
		.then( (response) => {
			let versions = JSON.parse( response );
			const versionDict = versions[platform];
			const getVersion = specificVersion || versionDict["latest"];
			const appUrl = versionDict[getVersion];
			
			if (!appUrl)
			{
				throw new Error("Did not find specified version.  See 'aemm help app' for more info or run 'aemm app install --list' to see available versions.");
			}

			const resolvedUrl = resolveTemplatedEnvironmentUrl(appUrl);

			events.emit("log", specificVersion ? `Downloading version ${specificVersion}` : `Downloading latest version(${getVersion})`);
			return installFromUrl(platform, getVersion, resolvedUrl, deviceType);
		});
	});
}



function installFromFile(version, urlOrFilepath, deviceType)
{
	return Q.fcall( () => {
		// determine platform from type of file
		let ext = path.extname(urlOrFilepath).toLowerCase();
		let platform = null;
		if (ext === ".ipa")
		{
			platform = "ios";
		}
		
		if (ext === ".apk")
		{
			platform = "android";
		}
				
		if (platform)
		{
			let foundUrl = urlOrFilepath.match(/http[s]?:\/\//);
			if (foundUrl)
			{
				events.emit("log", `Downloading ${urlOrFilepath}`);
				return installFromUrl(platform, version, urlOrFilepath, deviceType);
			} else
			{
				const platformAppBinary = platformRequire("app", platform);
				return platformAppBinary.installFromFilePath(version, urlOrFilepath, deviceType);
			}
		} else
		{
			throw new Error("Could not find a platform for the specifed file path.  Are you sure the path is correct?");
		}
	});
}

module.exports.installFromUrl = installFromUrl;
function installFromUrl(platform, version, appUrl, deviceType)
{
	let tmpIpaFile = path.join(os.tmpdir(), "appBinary");
    const resolvedUrl = url.resolve(remoteBinaryVersionsUrl(), appUrl);
	return downloadFile(resolvedUrl, tmpIpaFile)
	.then( () => {
		const platformAppBinary = platformRequire("app", platform);

		return platformAppBinary.installFromFilePath(version, tmpIpaFile, deviceType);
	});
}

function listAppVersions(platform)
{
	return Q.fcall( () => {
		return rp( remoteBinaryVersionsUrl() )
		.then( (response) => {
			let versions = JSON.parse( response );
			if (platform && versions[platform])
			{
				logVersions(platform, versions[platform]);
			} else {
				for (const dictPlatform in versions)
				{
					logVersions(dictPlatform, versions[dictPlatform]);
				}			
			}			
		})
		.catch( (err) => {
			throw new Error(`Error getting versions from server: ${err}`);
		});
	});
}

function logVersions(platform, versionDict)
{
	events.emit("log", `Available app versions for ${platform}...`);
	for (const version in versionDict)
	{
		// Don't write out "latest"
		if (version !== "latest")
		{
			events.emit("log", version);
		}
	}
	
}

module.exports.update = update;
function update(options, optionalPlatform)
{
	const deviceType = "emulator";

	return rp( remoteBinaryVersionsUrl() ) 
	.then( (response) => {
		let versionInfo = JSON.parse( response );
		
		const platformList = optionalPlatform ? [optionalPlatform] : ["ios", "android"];
		
		let promise = Q();
		platformList.forEach( (platform) => {
			promise = promise.then( () => {
				const platformAppBinary = platformRequire("app", platform);
				return platformAppBinary.getAppVersion(deviceType)
				.catch( (err) => {
					events.emit("log", `No app found for ${platform}`);
					return null;
				})
				.then( (appVersion) => {					
					// If there is no app version, that likely means there is no app, so there is nothing to update
					if (!appVersion) 
					{
						return false;
					}
					const platformVersions = versionInfo[platform];
					if (appVersion !== platformVersions["latest"])
					{
						let latest = platformVersions[platformVersions["latest"]];
						if (!latest)
						{
							throw new Error("Could not determine latest update.  Please install specific version.  See 'aemm help app' for more info");
						}
						return installFromFile(platformVersions["latest"], latest, deviceType);
					} else {
						events.emit("log", `${platform} app binary is up to date.`)
					}
					return false;
				});
				
			});
		});
		return promise;

	})
	.then( () => {
		events.emit("log", "Update Complete");
	});
}

function remoteBinaryVersionsUrl()
{
	return resolveTemplatedEnvironmentUrl(aemmConfig.get().remoteBinaryVersionsUrl);
}

function resolveTemplatedEnvironmentUrl(templatedUrl)
{
	return templatedUrl.replace( "{AEMM_ENV}", aemmConfig.get().AEMM_ENV);
}

function getUserHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}