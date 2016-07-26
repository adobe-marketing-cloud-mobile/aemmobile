#!/usr/bin/env node

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

var semver = require('semver');
var engines = require('../package').engines;
var logger = require('cordova-common').CordovaLogger.get();

// Check node version		
if (!semver.satisfies(process.version, engines["node"]))
{
    logger.error("Invalid Node.js version(" + process.version + ").  AEMM requires Node.js version(" + engines["node"] + ")");
    process.exit(1);
}

var cli = require('../src/aemm-cli');
cli(process.argv);
