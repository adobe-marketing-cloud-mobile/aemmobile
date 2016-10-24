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
var path = require('path');
var exec = require('child-process-promise').exec;
var cordova_lib = require('../lib/cordova').lib;
var cordova = cordova_lib.cordova;
var events = cordova_lib.events;

var settingsPlist;

module.exports.install = install;
function install()
{
	return Q().then( () => {
		return exec('xcodebuild -version')
		.then( (result) => {
			return Q();
		})
		.catch( (err) => {
			throw new Error('You must install Xcode to run in the simulator.  You can get it from the Mac App Store.');
		});
	})
	.then( () => {
		return disableCodeSigning();
	})
	.then( () => {
		events.emit('log', 'The ios platform is ready to use.');
		return Q();
	});
}

module.exports.post_add = post_add;
function post_add()
{
    return Q.fcall( () => {
		events.emit('info', 'Ensuring core AEM Mobile plugins are installed.');
        var targets = [
			'aemm-plugin-navto',
			'aemm-plugin-inappbrowser',
			'aemm-plugin-fullscreen-video',
			'aemm-plugin-html-contract'
			];
        return cordova.raw.plugin('add', targets);
    })
	.then( function () {
		events.emit('results', 'Finished adding ios platform.');	
	});
}

function disableCodeSigning() {
	return isCodeSigningDisabled()
	.then( (codeSigningDisabled) => {
		if (!codeSigningDisabled) {
			return changeCodeSigningPolicy('NO')
			.then( () => {
				return isCodeSigningDisabled();
			})
			.catch( () => { 
					// sudo script didn't work
					events.emit('warn', 'aemm tried to fix your code signing properties in Xcode, but was unable to.');
					events.emit('warn', 'Please run the following command:');
					events.emit('warn', 'sudo /usr/libexec/PlistBuddy -c "Set DefaultProperties:CODE_SIGNING_REQUIRED NO" "$(xcode-select -p)/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/SDKSettings.plist"');
					throw new Error('Changing code signing policy failed. Please see the message above.');
			});
		} 
	});
}

module.exports.isCodeSigningDisabled = isCodeSigningDisabled;
function isCodeSigningDisabled() {
	return loadSdkSettingsPlist()
	.then( () => {
		return exec('/usr/libexec/PlistBuddy -c "Print DefaultProperties:CODE_SIGNING_REQUIRED" ' + settingsPlist);
	})
	.then( (codeSigningRequired) => {
		if (codeSigningRequired.stdout.trim() === 'NO') {
			return Q(true);
		} else {
			return Q(false);
		}
	});
}

function changeCodeSigningPolicy(required) {
	var codeSigningRequired = ((required === true) || (required !== 'NO')) ? 'YES' : 'NO';
	return loadSdkSettingsPlist()
	.then( () => isCodeSigningDisabled() )
	.then( (codeSigningDisabled) => {
		// We only need to change it if it's not already the value we want.
		if (codeSigningDisabled === (codeSigningRequired === 'YES')) {
			events.emit('info', 'aemm requires Xcode to allow building unsigned frameworks.');
			events.emit('info', 'sudo may prompt you for your password to change the Xcode code signing policy.');
		
			var command = 'sudo ' + '/usr/libexec/PlistBuddy -c "Set DefaultProperties:CODE_SIGNING_REQUIRED ' + codeSigningRequired + '" ' + settingsPlist;

			return exec(command)
			.then( () => isCodeSigningDisabled())
			.then( (codeSigningDisabled) => {
				if (codeSigningDisabled === (codeSigningRequired === 'YES')) {
					throw new Error('aemm was unable to change the Xcode code signing policy.');
				}
			});
		} else {
			events.emit('verbose', 'CODE_SIGNING_REQUIRED was already set to the desired value.');
		}
	});
}

function loadSdkSettingsPlist() {
	if (settingsPlist) {
		return Q();
	} else {
		return exec('xcode-select -p')
		.then( (result) => {
			settingsPlist = path.join(result.stdout.trim(), 'Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/SDKSettings.plist');
			return Q();
		});
	}
}
