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
var platformRequire = require('../utils/platformRequire');
var path = require("path");
var cordova_lib = require('cordova-lib'),
    cordova = cordova_lib.cordova;

module.exports.install = install;
module.exports.add = add;
module.exports.remove = remove;

function install(options, platform)
{
    return Q.fcall( () => {
        if (platform)
        {
            var platformInstallBinary = platformRequire("platform", platform);

            return platformInstallBinary.install();
        } else
        {
            throw new Error("Could not find a platform for the specifed file path.  Are you sure the path is correct?");
        }
    });
}

function add(options, platform)
{
    return Q.fcall( () => {
        if (platform)
        {
            var platformAddBinary = platformRequire("platform", platform);

            return platformAddBinary.add();
        } else
        {
            throw new Error("Could not find a platform for the specifed file path.  Are you sure the path is correct?");
        }
    });
}

function remove(options, platform)
{
    return Q.fcall( () => {
        var cmd = "platform";
        var subcommand = "remove"; // sub-command like "add", "ls", "rm" etc.
        var targets = platform;

        var download_opts = {};

        return cordova.raw[cmd](subcommand, targets, download_opts);
    });
}

