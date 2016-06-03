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

var FS = require('q-io/fs');
var Q = require('q');
var path = require('path');
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;

module.exports = help;

function help(args) 
{
	var args = args || [];
	var command = ((args)[0] || 'general');
	return Q.fcall( () => {
		return FS.read( path.join(__dirname, "..", "help", `${command}.txt`))
		.then(function (helpDoc) {
			events.emit("log", helpDoc);
		});
	})
	.catch((error) => {
		var name = require("../package").name;
		events.emit("error", `'help ${command}' is not a ${name} command. See '${name} help'`);
	});
};

