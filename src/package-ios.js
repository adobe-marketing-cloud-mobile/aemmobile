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
var path = require('path');
var iosApp = require('./app-ios');
var project = require('./project');
var FS = require('q-io/fs');
var os = require('os');
var shell = require('shelljs');
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;
var unzip = require('../utils/unzip');
var project = require('./project');

module.exports.package = packageBinary;

function packageBinary(args, platform) {
    // Ensure we are in an AEMM project.
    project.projectRootPath();
    return Q().then(function () {
        if (args.device && args.emulator) {
            return Q.reject('Cannot specify "device" and "emulator" options together.');
        }
        var platform =  args.device ? 'device' : 'emulator';
        
        if (platform === 'device')
        {
            // Copy the device framework into the provided path.
            var ipaPath = args.argv.undashed[2];
            if (!ipaPath) {
                throw new Error("You must provide an AEM Mobile .ipa, see `aemm help package`");
            }
            var tempIpaPath = path.join(os.tmpDir(), 'aemm_tmp_ipa');
            
            return FS.exists(tempIpaPath)
            .then( (exists) => {
                if (exists) {
                    return FS.removeTree(tempIpaPath);
                } else {
                    return Q();
                }
            })
            .then( () => {
                return unzip(ipaPath, tempIpaPath);
            })
            .then( () => {
                var appPath = path.join(tempIpaPath, "Payload", "Jupiter.app");
                return replaceFramework(appPath, 'device');
            })
            .then( () => {
                // Zip up the Payload directory
                var deferred = Q.defer();
                shell.cd(tempIpaPath);
                var cmd = "zip -0 -y -r zipped.ipa Payload/";
                events.emit('log', 'zipping Payload directory.');
                shell.exec(cmd, {silent:true}, function(code, stdout, stderr) {
                    if (code != 0) {
                        deferred.reject(stderr);
                    } else {
                        events.emit('results', "zip complete.");
                        deferred.resolve();
                    }
                });
                return deferred.promise;
            })
            .then( () => {
                // Backup the original .ipa
                var origIpaPath = path.join(path.dirname(ipaPath), path.basename(ipaPath,'.ipa') + "-orig.ipa");
                return FS.rename(ipaPath, origIpaPath);
            })
            .then( () => {
                return FS.rename(path.join(tempIpaPath, 'zipped.ipa'), ipaPath);
            });
        } else {
            // Copy the simulator framework into the simulator app.
            return iosApp.getInstalledAppBinaryPath('emulator')
            .then( (appPath) => {
                return replaceFramework(appPath, 'emulator');
            });
        }
    })
    .then( () => {
        events.emit("results", "Custom plugins successfully packaged into application binary.");
    });
}

function replaceFramework(appPath, platform) {
    var destinationPluginsPath = path.join(appPath, 'Frameworks', 'CordovaPlugins.framework');
    var sourcePluginsPath = path.join(project.projectRootPath(), 'platforms', 'ios', 'build', platform, 'CordovaPlugins.framework');
    
    return FS.exists(sourcePluginsPath)
    .then( (sourceExists) => {
        if (!sourceExists) {
            throw new Error("No built framework. Please run `aemm build ios`, see `aemm help build` for details.");
        } else {
            return FS.removeTree(destinationPluginsPath)
        }
    })
    .then( () => {
        return FS.copyTree(sourcePluginsPath, destinationPluginsPath);
    });
}