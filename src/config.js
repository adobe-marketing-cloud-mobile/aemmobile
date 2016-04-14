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

var Q = require('q');
var path = require('path');
var jsonfile = require('jsonfile');
var project = require('./project');

function configFile()
{
    var pathToProjectConfig = path.join(project.projectRootPath(), "/config.json");
    var file = null;
    try {
        file = require(pathToProjectConfig);
    } catch (err) {
        // It's not a problem if the file is non-existent.
        if (err.code == 'MODULE_NOT_FOUND') {
            return;
        }
        throw err;
    }
    return file;
}

module.exports = config;

function config(options, args) 
{
    var getKey = options.get;
    var setKey = options.set;
    var unsetKey = options.unset;
    
    return Q.fcall( () => {
        if (options.list)
        {
			return console.log(file);
		}
        if (options.get)
        {
            return console.log(getValueFromConfig(getKey));
        }
        if (options.set)
        {
            return setValueInConfig(setKey, args);    
        }
        if (options.unset)
        {
            return removeKeyFromConfig(unsetKey);
        }
    });
}

module.exports.getValueFromConfig = getValueFromConfig;
function getValueFromConfig(key)
{
    var file = configFile();
    return file[`${key}`];
}

function setValueInConfig(key, value)
{
    var pathToProjectConfig = path.join(project.projectRootPath(), "/config.json");
    var file = configFile();
    file[`${key}`] = value;
    jsonfile.writeFileSync(pathToProjectConfig, file);
}

function removeKeyFromConfig(key)
{
    var pathToProjectConfig = path.join(project.projectRootPath(), "/config.json");
    var file = configFile();
    delete file[`${key}`];
    jsonfile.writeFileSync(pathToProjectConfig, file);
}