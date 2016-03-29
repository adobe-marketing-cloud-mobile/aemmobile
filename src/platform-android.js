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
var path = require("path");
var fs = require("fs");
var FS = require('q-io/fs');
var app = require('./app');
var shell = require('shelljs');

const skinName = "Nexus-7";

module.exports.install = install;
function install() {
    return installSdk()
        .then(function() {
            return updateSdk();
        })
        .then(function() {
            return createAvd();
        })
        .then(function() {
            return installHAXM();
        })
}

function updateSdk() {
    var deferred = Q.defer();

    var userHome = process.env.HOME;
    var androidCmd = userHome + '/platforms/android/sdk/tools/android';
    var spawn = require('child_process').spawn;
    var proc = spawn(androidCmd, ['--silent', 'update', 'sdk', '--all',
        '--no-ui', '--filter', 'platform-tool,tool,android-23,sys-img-x86_64-android-23,extra-intel-Hardware_Accelerated_Execution_Manager'], { stdio: 'inherit' });

    proc.on("error", function (error) {
        deferred.reject(new Error("Installing Android platform encountered error " + error.message));
    });
    proc.on("exit", function(code) {
        if (code !== 0) {
            deferred.reject(new Error("Installing Android platform exited with code " + code));
        } else {
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function installSdk() {
    var defer = Q.defer();

    var pathToInstallSdkScript = path.join(__dirname, '..', 'platforms/android/shell_scripts/install-android-sdk.sh');

    shell.exec(pathToInstallSdkScript, {
        silent: false
    }, function(code, output) {
        if (code == 0) {
            defer.resolve();
        }
    });

    return defer.promise;
}

function installHAXM() {
    var deferred = Q.defer();

    var userHome = process.env.HOME;
    var installCmd = 'sudo ' + userHome + '/platforms/android/sdk/extras/intel/Hardware_Accelerated_Execution_Manager/silent_install.sh';
    var spawn = require('child_process').spawn;
    var proc = spawn('sh', ['-c', installCmd], { stdio: 'inherit' });

    proc.on("error", function (error) {
        deferred.reject(new Error("Installing Intel HAXM encountered error " + error.message));
    });
    proc.on("exit", function(code) {
        if (code !== 0) {
            deferred.reject(new Error("Installing Intel HAXM exited with code " + code));
        } else {
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function createAvd() {
    var skinFrom = path.join(__dirname, '..', 'platforms/android/skins', skinName);
    var skinTo = path.join(process.env.HOME, 'platforms/android/sdk/platforms/android-23/skins', skinName);

    return FS.makeTree(skinTo)
    .then(function() {
        return FS.copyTree(skinFrom, skinTo)
            .then(function () {
                var defer = Q.defer();

                var pathToInstallAvdScript = path.join(__dirname, '..', 'platforms/android/shell_scripts/install-android-avd.sh');

                shell.exec(pathToInstallAvdScript, {
                    silent: false
                }, function (code, output) {
                    if (code == 0) {
                        defer.resolve();
                    }
                });

                return defer.promise;
            });
    });
}
