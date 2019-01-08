/**
 Copyright (c) 2018 Adobe Systems Incorporated. All rights reserved.
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
var shell = require('shelljs');
var cordova_lib = require('../lib/cordova').lib;
var events = cordova_lib.events;

var android_home = process.env['HOME'] + '/platforms/android/sdk';
var platform_tools = android_home + '/platform-tools';
var sdk_tools = android_home + '/tools';
var entire_path = process.env['PATH'] + ':' + platform_tools + ':' + sdk_tools;

module.exports = function() {
    return setEnvVariables();
}

function setEnvVariables() {
    if (process.env['ANDROID_HOME'] != android_home){
        return setAndroid_Home()
            .then( () => {
                if (process.env['PATH'].includes('platform-tools') && process.env['PATH'].includes('tools')){
                    return 
                } else { return setEnvVariable('PATH', entire_path) }
            });
    } else {return}
}

function setAndroid_Home() {
    return isEnvVariableSet('ANDROID_HOME', android_home)
        .then( (code) => {
            if (code != 0) {
                return setEnvVariable('ANDROID_HOME', android_home);
            }
        });
}

function isEnvVariableSet(name, value) {
    var deferred = Q.defer();
    var command = "echo $" + name + " | grep -q " + '"' + value + '"';
    shell.exec(command, {
        silent: false
    }, function (code, output) {
        deferred.resolve(code);
    });
    return deferred.promise;
}

function setEnvVariable(name, value) {
    var deferred = Q.defer();
    var command = 'echo export ' + name + '=\'"' + value + '"\' >> ~/.bash_profile && source ~/.bash_profile';
    shell.exec(command, {
        silent: false
    }, function (code, output) {
        if (code !== 0) {
            deferred.reject(new Error('Setting up environment variable (' + name + ') failed: exited with code ' + code));
        } else {
            events.emit('log', 'Setting up environment variable (' + name + '): success');
            deferred.resolve();
        }
    });
    return deferred.promise;
}
