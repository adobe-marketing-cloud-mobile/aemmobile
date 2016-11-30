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

var Q = require('q');
var path = require('path');
var jsonfile = require('jsonfile');
var project = require('./project');
var cordova_lib = require('../lib/cordova').lib;
var events = cordova_lib.events;

var pathToProjectConfig = null;
var configFile = null;

module.exports = config;
function config(opts)
{
    opts = opts || {};
    opts.options = opts.options || {};
    var getKey = opts.options.get;
    var setKey = opts.options.set;
    var unsetKey = opts.options.unset;

    return getConfigFile()
    .then( (configFile) => {
        if (opts.options.list)
        {
            if (!configFile)
            {
                throw new Error("No valid config file found.");
            }
            else
            {
                events.emit("log", JSON.stringify(configFile));
                return Q();
            }
        }
        if (opts.options.get || opts.options.get === "")
        {
            if (opts.options.get === "")
            {
                throw new Error("`aemm config --get` must be passed a key. See `aemm help config` for more info.");
            }
            return getValueFromConfig(getKey)
            .then( (val) => {
                if (val === undefined) {
                    events.emit("warn", getKey + " is not set.");
                } else {
                    events.emit("log", val);
                }
                return Q();
            });
        }
        if (opts.options.set || opts.options.set === "")
        {
            if (opts.options.setValue === undefined || opts.options.set === "") {
                throw new Error("`aemm config --set` must be passed a key and a value. See `aemm help config` for more info.");
            }
            return setValueInConfig(setKey, opts.options.setValue);
        }
        if (opts.options.unset || opts.options.unset === "")
        {
            if (opts.options.unset === "") {
                throw new Error("`aemm config --unset` must be passed a key. See `aemm help config` for more info.");
            }
            return removeKeyFromConfig(unsetKey);
        }
        else
        {
            throw new Error("Unrecognized command. See `aemm help config` for correct usage.");
        }
    });
}

module.exports.getValueFromConfig = getValueFromConfig;
function getValueFromConfig(key)
{
    return getConfigFile()
    .then( (configFile) => {
        return Q(configFile[`${key}`]);
    });
}

function setValueInConfig(key, value)
{
    return getPathToProjectConfig()
    .then( (pathToProjectConfig) => {
        return getConfigFile()
        .then( (configFile) => {
            configFile[`${key}`] = value;
            jsonfile.writeFileSync(pathToProjectConfig, configFile);
            return Q();
        });
    });
}

function removeKeyFromConfig(key)
{
    return getPathToProjectConfig()
    .then( (pathToProjectConfig) => {
        return getConfigFile()
        .then( (configFile) => {
            delete configFile[`${key}`];
            jsonfile.writeFileSync(pathToProjectConfig, configFile);
            return Q();
        });
    });
}

function getPathToProjectConfig()
{
    if (pathToProjectConfig) {
        return Q(pathToProjectConfig);
    } else {
        return project.projectRootPath()
        .then( (projectRootPath) => {
            pathToProjectConfig = path.join(projectRootPath, "config.json");
            return Q(pathToProjectConfig);
        });
    }
}

function getConfigFile()
{
    if (configFile) {
        return Q(configFile);
    } else {
        return getPathToProjectConfig()
        .then( (pathToProjectConfig) => {
            try {
                configFile = require(pathToProjectConfig);
            } catch (err) {
                // It's not a problem if the file is non-existent, just give them an empty object to get started.
                if (err.code == 'MODULE_NOT_FOUND') {
                    return Q({});
                }
                throw err;
            }
            return Q(configFile);
        });
    }
}