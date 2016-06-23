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
var path = require("path");
var shell = require('shelljs');
var spawn = require('cross-spawn-async');
var getUserHome = require('../utils/getUserHome');
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;

module.exports = function() {
    return setEnvVariables();
}

function setEnvVariables() {
    return setAndroid_Home()
        .then( () => {
            setPaths();
        });
}

function setAndroid_Home() {
    var android_home = path.join(getUserHome(), 'platforms/android/sdk');

    return isEnvVariableSet("ANDROID_HOME", android_home)
        .then( (code) => {
            // 0 == true, otherwise false
            if (code != 0) {
                return setEnvVariable("ANDROID_HOME", android_home);
            }
        });
}

function setPaths() {
    var tools_path = path.join(getUserHome(), 'platforms/android/sdk/tools');
    return setPath(tools_path)
        .then ( () => {
            var platformtools_path = path.join(getUserHome(), 'platforms/android/sdk/platform-tools');
            return setPath(platformtools_path);
        });
}

function setPath(path) {
    return isEnvVariableSet("Path", path)
        .then( (code) => {
            return getEnvVariable("Path")
                .then( (output) => {
                    var path_value = output + ';' + path;
                    return setEnvVariable("Path", path_value);
                });
        });
}

function isEnvVariableSet(name, value) {
    var deferred = Q.defer();

    var command = "echo %" + name + "% | find " + '"' + value + '"';
    shell.exec(command, {
        silent: false
    }, function (code, output) {
        deferred.resolve(code);
    });

    return deferred.promise;
}

function setEnvVariable(name, value) {
    var deferred = Q.defer();

    var command = "powershell";
    var script = "[Environment]::SetEnvironmentVariable(" + '"' + name + '", "' + value + '", ' + "\"User\")";
    var proc = spawn(command, [script], { stdio: 'inherit' });

    proc.on("error", function (error) {
        deferred.reject(new Error("Failed to set environment variable(" + name + ") " + error.message));
    });
    proc.on("exit", function(code) {
        if (code !== 0) {
            deferred.reject(new Error("Set environment variable(" + name + ") exited with code " + code));
        } else {
            events.emit("log", "Set environment variable(" + name + ") successfully");
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getEnvVariable(name) {
    var deferred = Q.defer();

    var output = null;
    var command = "powershell";
    var script = "[Environment]::GetEnvironmentVariable(" + '"' + name + '"' + ',' + "\"User\")";
    var proc = spawn(command, [script], { stdout: 'inherit' });

    proc.stdout.on('data', (data) => {
        // convert uint8array to string
        output = String.fromCharCode.apply(null, data).replace(/(\r\n|\n|\r)/gm,"");
    });
    proc.on("error", function (error) {
        deferred.reject(new Error("Failed to get environment variable(" + name + ") " + error.message));
    });
    proc.on("exit", function(code) {
        if (code !== 0) {
            deferred.reject(new Error("get environment variable(" + name + ") exited with code " + code));
        } else {
            events.emit("log", "get environment variable(" + name + ") successfully");
            deferred.resolve(output);
        }
    });

    return deferred.promise;
}