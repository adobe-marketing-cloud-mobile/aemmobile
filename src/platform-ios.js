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

module.exports.install = install;
function install()
{
    return exec('xcodebuild -version')
    .then( () => {
        events.emit("log", "The ios platform is ready to use.")
    })
    .catch( (err) => {
        events.emit("log", "You must install Xcode to run in the simulator.  You can get it from the Mac App Store.")
    });
}

module.exports.add = add;
function add()
{
    return Q.fcall( () => {
        return cordova.raw.platform("add", "https://github.com/adobe-marketing-cloud-mobile/aemm-ios.git");
    }).then( function () {
		events.emit("results", "Finished installing ios platform.");	
	});
}