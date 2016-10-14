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
var FS = require('q-io/fs');
var fs = require('fs');
var Q = require('q');
var platformRequire = require('../utils/platformRequire');
var path = require("path");
var rp = require('request-promise');
var semver = require('semver');
var _ = require('underscore');
var cordova_lib = require('cordova-lib'),
    cordova = cordova_lib.cordova,
    events = cordova_lib.events;
var aemmConfig = require('./aemm-config');
var platforms = aemmConfig.get().platforms;
var project = require('./project');

module.exports.install = install;
module.exports.add = add;
module.exports.remove = remove;
module.exports.rm = remove;

function install(options, platform)
{
    return Q.fcall( () => {
        var platformInstallBinary = platformRequire("platform", platform);
        return platformInstallBinary.install();
    });
}

function add(options, target)
{
    var platform;
    var installedPlatformsList;
    var platformsDir;
    var platformsJsonPath;
    return project.projectRootPath()
    .then( (projectRootPath) => {
        if (!platform) {
            platformsDir = path.join(projectRootPath, "platforms");
            platformsJsonPath = path.join(platformsDir, "platforms.json");
            return FS.exists(platformsDir)
            .then ( (platformsDirExists) => {
                if (platformsDirExists) {
                    return FS.exists(platformsJsonPath)
                    .then( (jsonExists) => {
                        if (jsonExists) {
                            return JSON.parse(fs.readFileSync(platformsJsonPath));
                        }
                        else { return Q({}); }
                    });
                } 
                else { return Q({}); }
            })
            .then( (platformsJson) => {
                installedPlatformsList = _.map(platformsJson, function(num, key) { return key; });
                return Q();
            });
        }
        else { return Q(); }
    })
    .then( () => {
        if (!target) {
            throw new Error("No platform specified. See `aemm help platform`.");
        }
        else
        {
            var parts = target.split('@');
            platform = parts[0];
            var spec = parts[1];
            if (!(platform in platforms)) {
                // Try this as a file path or github URL.
                platform = null;
                return Q(target);
            } else {
                var target_repo = platforms[platform].repo_url;
                return getReleaseVersions(platform)
                .then( (versions) => {
                    if (_.contains(versions, spec)) {
                        return Q(target_repo + "#" + spec); 
                    }
                    else if (!spec || semver.validRange(spec)) {
                        var range = spec ? spec : platforms[platform].version;
                        // Do a semver check here.
                        events.emit("verbose", `Looking for a match for spec ${range} in versions: ${versions}`);
                        var tag_name = semver.maxSatisfying(versions, range);
                        if (!tag_name) {
                            throw new Error("No version of the platform found matching the supplied range.");
                        }
                        return Q(target_repo + "#" + tag_name);
                    }
                    else {
                        throw new Error("No release found with supplied version.\nTo use the latest recommended version, please use `aemm platform add <platform>`.");
                    }
                });
            }
        }
    })
    .then( (newTarget) => {
        return cordova.raw.platform("add", newTarget);
    })
    .then( () => {
        if (!platform) {
            var newPlatformsJson = JSON.parse(fs.readFileSync(platformsJsonPath));
            var newPlatformsList = _.map(newPlatformsJson, function(num, key) { return key;});

            // We should have an array of length 1 because we should have only installed one platform during this operation.
            platform = _.first(_.difference(newPlatformsList, installedPlatformsList));
        }

        if (platform in platforms){
            var platformModule = platformRequire("platform", platform);
            return platformModule.post_add();
        }
        else {
            events.emit("info", "Custom platform provided. Skipping post_add. This may result in missing some aemm plugins.");
        }
    });
}

function remove(options, platform)
{
    return project.projectRootPath()
    .then( () => {
        var cmd = "platform";
        var subcommand = "remove"; // sub-command like "add", "ls", "rm" etc.
        var targets = platform;

        var download_opts = {};

        return cordova.raw[cmd](subcommand, targets, download_opts);
    });
}

function getReleaseVersions(platform) {
    var options = {
        "uri": platforms[platform].releases_url,
        "headers": {
            "User-Agent": "aemm"
        },
        json: true
    };
    events.emit("verbose", `Request:\n${JSON.stringify(options)}`);
    return rp(options)
    .then( (response) => {
        var versions = [];
        events.emit("verbose", `Response:\n${JSON.stringify(response)}`);
        if (response) {
            for (var i=0, len = response.length; i < len; i++) {
                versions.push(response[i].name);
            }
        }
        return Q(versions);
    });
}