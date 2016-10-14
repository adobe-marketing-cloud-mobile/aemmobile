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
var exec = require('child-process-promise').exec;
var cordova_lib = require('cordova-lib');
var cordova = cordova_lib.cordova;
var events = cordova_lib.events;
var path = require('path');
var shell = require('shelljs');

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
		return disableCodeSigning();
	})
	.then( () => {
		events.emit("log", "The ios platform is ready to use.");
		return Q();
	});
}

module.exports.post_add = post_add;
function post_add()
{
    return Q.fcall( () => {
		events.emit("info", "Ensuring core AEM Mobile plugins are installed.");
        var targets = [
			"aemm-plugin-navto",
			"aemm-plugin-inappbrowser",
			"aemm-plugin-fullscreen-video",
			"aemm-plugin-html-contract"
			];
        return cordova.raw.plugin("add", targets);
    })
	.then( function () {
		events.emit("results", "Finished adding ios platform.");	
	});
}

function disableCodeSigning() {
	var settingsPlist = null;
	return getSDKSettingsPlist()
	.then( (sdkSettingsPlist) => {
		settingsPlist = sdkSettingsPlist;
		return isCodeSigningDisabled(settingsPlist);
	})
	.then( (codeSigningDisabled) => {
		if (!codeSigningDisabled) {
			return changeCodeSigningPolicy(settingsPlist);
		} 
	});
}

module.exports.isCodeSigningDisabled = isCodeSigningDisabled;
function isCodeSigningDisabled(settingsPlist) {
	return Q().then( () => {
		return settingsPlist ? Q(settingsPlist) : getSDKSettingsPlist();
	})
	.then( (settingsPlist) => {
		return exec('/usr/libexec/PlistBuddy -c "Print DefaultProperties:CODE_SIGNING_REQUIRED" ' + settingsPlist);
	})
	.then( (codeSigningRequired) => {
		if (codeSigningRequired.stdout.trim() === "NO") {
			return Q(true);
		} else {
			return Q(false);
		}
	});
}

function changeCodeSigningPolicy(settingsPlist, enabled) {
	return Q().then( () => {
		events.emit("info", "aemm requires Xcode to allow building unsigned frameworks.");
		events.emit("info", "sudo may prompt you for your password to change Xcode's code signing policy.");
	})
	.then( () => {
		var deferred = Q.defer();
		var val = (enabled || enabled !== "NO") ? "YES" : "NO";
		var command = 'sudo ' + '/usr/libexec/PlistBuddy -c "Set DefaultProperties:CODE_SIGNING_REQUIRED ' + val + '" ' + settingsPlist;
		
		shell.exec(command, {
			silent: false
		}, function (code, output) {
			if (code === 0) {
				deferred.resolve();
			} else {
				deferred.reject(new Error("Changing code signing policy failed. Please see the message above."));
			}
		});

		return deferred.promise;
	});
}

function getSDKSettingsPlist() {
	return exec('xcode-select -p')
	.then( (result) => {
		return Q(path.resolve(result.stdout.trim(), 'Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/SDKSettings.plist'));
	});
}
