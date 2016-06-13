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
var exec = require('child-process-promise').exec;
var cordova_lib = require('cordova-lib');
var cordova = cordova_lib.cordova;
var events = cordova_lib.events;
var path = require('path');

module.exports.install = install;
function install()
{
	return Q().then( () => {
		return exec('xcodebuild -version')
		.then( (result) => {
			return Q();
		})
		.catch( (err) => {
			events.emit("warn", "You must install Xcode to run in the simulator.  You can get it from the Mac App Store.");
		});
	})
	.then( () => {
		return checkForCodeSignRequired();
	})
	.then( (required) => {
		if (required) {
			return changeCodeSignPolicy(required);
		}	
	})
	.then( () => {
		events.emit("log", "The ios platform is ready to use.");
		return Q();
	});
}

module.exports.add = add;
function add(spec)
{
	let target_repo = "https://github.com/adobe-marketing-cloud-mobile/aemm-ios.git";
    return Q.fcall( () => {
		var target = spec ? target_repo + "@" + spec : target_repo; 
        return cordova.raw.platform("add", target);
    }).then( function () {
		events.emit("results", "Finished installing ios platform.");	
	});
}

function checkForCodeSignRequired() {
	return Q()
	.then( () => {
		var settingsPlist;
		return exec('xcode-select -p')
		.then( (result) => {
			settingsPlist = path.resolve(result.stdout.trim(), 'Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/SDKSettings.plist');
			return exec('/usr/libexec/PlistBuddy -c "Print DefaultProperties:CODE_SIGNING_REQUIRED" ' + settingsPlist)
			.then( (codeSignRequired) => {
				if (codeSignRequired.stdout.trim() === "NO") {
					return Q(false);
				} else {
					return Q(settingsPlist);
				}
			}).catch( (err) => {
				console.log("Error!");
			});
		});
	});
}

function changeCodeSignPolicy(settingsPlist) {
	return Q().then( () => {
		events.emit("info", "You may need to enter your admin password to change Xcode's code signing policy.\naemm requires Xcode to allow building unsigned frameworks.")
	})
	.then( () => {
		return exec('/usr/libexec/PlistBuddy -c "Set DefaultProperties:CODE_SIGNING_REQUIRED NO" ' + settingsPlist);
	});
}