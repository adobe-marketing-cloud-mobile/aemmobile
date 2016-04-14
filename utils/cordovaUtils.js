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
var cordova = require('cordova');
var path = require('path');

module.exports.cordovaProjectRoot = function ()
{
	return cordova.cordova_lib.cordova.findProjectRoot(process.cwd());	
}

module.exports.getPathToCordovaBinary = getPathToCordovaBinary;
function getPathToCordovaBinary() {
    var aemmBinDir = path.dirname(process.mainModule.filename);
    var cordovaBin = path.join(aemmBinDir, "../node_modules/cordova/bin/cordova");
    return cordovaBin;
}