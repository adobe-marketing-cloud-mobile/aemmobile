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
var help = require('./help');

var pathToProjectConfig = null;
var file = null;

module.exports = config;
function config(options, args)
{
    var getKey = options.get;
    var setKey = options.set;
    var unsetKey = options.unset;

    return Q.fcall( () => {
        if (options.list)
        {
            file = getConfigFile();
            if (!file)
            {
                return events.emit("log", "No valid config file found.");
            }
            else
            {
                return events.emit("log", file);
            }
        }
        if (options.get)
        {
            return events.emit("log", getValueFromConfig(getKey));
        }
        if (options.set)
        {
            return setValueInConfig(setKey, args);
        }
        if (options.unset)
        {
            return removeKeyFromConfig(unsetKey);
        }
        else
        {
            help(null, "config");
        }
    });
}

module.exports.getValueFromConfig = getValueFromConfig;
function getValueFromConfig(key)
{
    return getConfigFile()[`${key}`];
}

function setValueInConfig(key, value)
{
    file = getConfigFile();
    file[`${key}`] = value;
    jsonfile.writeFileSync(getPathToProjectConfig(), file);
}

function removeKeyFromConfig(key)
{
    file = getConfigFile();
    delete file[`${key}`];
    jsonfile.writeFileSync(getPathToProjectConfig(), file);
}

function getPathToProjectConfig()
{
    if (!pathToProjectConfig)
    {
        pathToProjectConfig = path.join(project.projectRootPath(), "config.json");
    }
    return pathToProjectConfig;
}

function getConfigFile()
{
    if (!file)
    {
        try {
            file = require(getPathToProjectConfig());
        } catch (err) {
            // It's not a problem if the file is non-existent, just give them an empty object to get started.
            if (err.code == 'MODULE_NOT_FOUND') {
                return {};
            }
            throw err;
        }
    }
    return file;
}