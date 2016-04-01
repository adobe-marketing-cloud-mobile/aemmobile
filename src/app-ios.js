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
var DecompressZip = require('decompress-zip');
var os = require('os');
var app = require('./app');
var config = require('../config.json');
var rp = require('request-promise');
var plist = require('plist');

const aemmAppName = "AEMM.app";

module.exports.getInstalledAppBinaryPath = getInstalledAppBinaryPath;
function getInstalledAppBinaryPath(deviceType)
{
	return app.getParentPathForAppBinary("ios", deviceType)
	.then( (parentPath) => {
		let viewerPath = path.join(parentPath, aemmAppName);
		if (path.extname(viewerPath) === ".app")
		{				
			try {
				viewerPath =  fs.realpathSync( viewerPath );
			} catch (e) 
			{
			}

			if ( fs.existsSync(path.join(viewerPath, "ApplicationConfig.plist")) )
			{
				return viewerPath;
			}
		}
		
		throw new Error(`No application found at ${parentPath}`);			
	});
}



function unzipFile(zipFile, outputPath)
{
	console.log("Extracting app");
	
	var deferred = Q.defer();

	var unzipper = new DecompressZip(zipFile)

	unzipper.on('error', function (err) {
		deferred.reject(new Error("Failed to extract the app from the specified ipa"));	
	});
	
	unzipper.on('extract', function (log) {
		deferred.resolve(outputPath);
	});
	
	unzipper.on('progress', function (fileIndex, fileCount) {
		// console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
	});
	
	unzipper.extract({
		path: outputPath
	});
		
	return deferred.promise;
}



module.exports.getAppVersion = getAppVersion;
function getAppVersion(deviceType)
{
	return getInstalledAppBinaryPath(deviceType)
	.then( (appBinaryPath) => {
		const infoPlistPath = path.join(appBinaryPath, "Info.plist");
		const properties = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
		return properties.CFBundleVersion;
	});
}


module.exports.installFromFilePath = installFromFilePath;
function installFromFilePath(version, filepath, deviceType)
{
	let binaryParentPath = null;
	return app.getParentPathForAppBinary("ios", deviceType)
	.then(function (appBinaryParentPath) {
		binaryParentPath = appBinaryParentPath;
		let unzipPath = path.join(os.tmpdir(), "AEMMDownload");
		return FS.removeTree(unzipPath)
		.catch(() => {}) // Don't care if it is not there and errors
		.then( () => unzipFile(filepath, unzipPath) ); 
	}).then(function(unzipPath) {
		let targetPath = path.join(binaryParentPath, aemmAppName);
		const payloadPath = path.join(unzipPath, "Payload");							
		return FS.makeTree(binaryParentPath)
		.then( () => {
			return FS.removeTree(targetPath)
			.catch( (err) => false ); // We don't care if it does not exist when we try to delete it 
		})
		.then( () => FS.list(payloadPath) )
		.then( (fileList) => {
			// Get .app directory in payload
			let ipaAppDir = null;
			fileList.forEach( (file) => {
				let viewerPath = path.join( payloadPath, file);
				if (path.extname(viewerPath) === ".app")
				{
					ipaAppDir = viewerPath;
				}
			});
			
			if (ipaAppDir)
			{
				return ipaAppDir;
			}
			throw new Error(`App not found in payload of ipa!`); 
		} )
		.then( (ipaAppDir)=> FS.copyTree(ipaAppDir, targetPath) );
	});

}