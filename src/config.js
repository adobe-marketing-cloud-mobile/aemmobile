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

var pathToProjectConfig = null;
var file = null;

module.exports = config;
function config(opts)
{
    var getKey = opts.options.get;
    var setKey = opts.options.set;
    var unsetKey = opts.options.unset;

    return getConfigFile()
    .then( (file) => {
        if (opts.options.list)
        {
            if (!file)
            {
                throw new Error("No valid config file found.");
            }
            else
            {
                events.emit("log", file);
                return Q();
            }
        }
        if (opts.options.get)
        {
            return getValueFromConfig(getKey)
            .then( (val) => {
                events.emit("log", val);
                return Q();
            });
        }
        if (opts.options.set)
        {
            return setValueInConfig(setKey, opts.options.argv);
        }
        if (opts.options.unset)
        {
            return removeKeyFromConfig(unsetKey);
        }
        else
        {
            throw new Error("Unrecognized command. See `aemm help config` for correct usage.")
        }
    });
}

module.exports.getValueFromConfig = getValueFromConfig;
function getValueFromConfig(key)
{
    return getConfigFile()
    .then( (file) => {
        return Q(file[`${key}`]);
    });
}

function setValueInConfig(key, value)
{
    var projectConfig = null;
    return getPathToProjectConfig()
    .then( (pathToProjectConfig) => {
        projectConfig = pathToProjectConfig;
        return getConfigFile()
        .then( (file) => {
            file[`${key}`] = value;
            jsonfile.writeFileSync(pathToProjectConfig, file);
            return Q();
        });
    });
}

function removeKeyFromConfig(key)
{
    var projectConfig = null;
    return getPathToProjectConfig()
    .then( (pathToProjectConfig) => {
        projectConfig = pathToProjectConfig;
        return getConfigFile()
        .then( (file) => {
            delete file[`${key}`];
            jsonfile.writeFileSync(projectConfig, file);
            return Q();
        });
    });
}

function getPathToProjectConfig()
{
    return project.projectRootPath()
    .then( (projectRootPath) => {
        if (!pathToProjectConfig) {
            pathToProjectConfig = path.join(projectRootPath, "config.json");
        }
        return Q(pathToProjectConfig);
    });
}

function getConfigFile()
{
    return getPathToProjectConfig()
    .then( (pathToProjectConfig) => {
        if (!file)
        {
            try {
                file = require(pathToProjectConfig);
            } catch (err) {
                // It's not a problem if the file is non-existent, just give them an empty object to get started.
                if (err.code == 'MODULE_NOT_FOUND') {
                    return {};
                }
                throw err;
            }
        }
        return Q(file);
    });
}