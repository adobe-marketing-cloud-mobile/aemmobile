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
var project = require('./project');
var path = require("path");
var FS = require('q-io/fs');
var fs = require("fs");
var serve = require('./serve');
var emulator = require('./android-emulator');
var shell = require('shelljs');
var androidApp = require('./app-android');
var randomPort = require('./random-port');
var config = require('./config');
var deviceSerialNum = null;

module.exports = run;

function run(args)
{
    return randomPort()
        .then(function(port) {
            return emulator.start('AEMM_Tablet', port);
        })
        .then(function (emulatorId) {
            deviceSerialNum = emulatorId;
            return installApk(deviceSerialNum);
        })
        .then(function () {
            return serve({}, "android");
        })
        .then(function (servResponse) {
            var defer = Q.defer();

            var orientation = config.getValueFromConfig('screenOrientation');
            if (!orientation) {
                // portrait by default
                orientation = 'portrait';
            }

            var userHome = process.env.HOME;
            //var launchCmd = path.join(userHome, 'platforms/android/sdk/platform-tools/adb') + ' -s ' + deviceSerialNum +
            //    ' shell am start -n "com.adobe.dps.preflight/com.adobe.dps.viewer.collectionview.CollectionActivity"' +
            //        ' -e phonegapServer 10.0.2.2:3000' + ' -e initialOrientation ' + orientation;
            var launchCmd = path.join(userHome, 'platforms/android/sdk/platform-tools/adb') + ' -s ' + deviceSerialNum +
                ' shell am start -n "com.adobe.dps.viewer/com.adobe.dps.viewer.collectionview.CollectionActivity"'
            shell.exec(launchCmd, {
                silent: false
            }, function (code, output) {
                if (code == 0) {
                    defer.resolve();
                } else {
                    deferred.reject(new Error("Launching AEM Mobile app in emulator failed."));
                }
            });

            return defer.promise;
        });
};

function installApk(deviceSerialNum)
{
    return androidApp.getInstalledAppBinaryPath("emulator")
        .then((jupiterPath) => {
            var defer = Q.defer();

            var checkCmd = path.join(process.env.HOME, 'platforms/android/sdk/platform-tools/adb') + ' -s ' + deviceSerialNum +
                ' install ' + '"' + jupiterPath + '"';
            shell.exec(checkCmd, {
                silent: false
            }, function(code, output) {
                if (code == 0) {
                    defer.resolve();
                } else {
                    deferred.reject(new Error("Installing AEM Mobile app apk failed: " + jupiterPath));
                }
            });

            return defer.promise;
        })
}

var getArgs = function(ipAddress, port)
{
    var args;
    // Get list of articles to serve
    var wwwFolder = path.join(project.projectRootPath(), "/www");
    return FS.list(wwwFolder)
        .then( function (fileArray) {
            var i = 0;
            var fileArray2 = [];
            for (i = 0; i < fileArray.length; i++)
            {
                if (!fileArray[i].startsWith("."))
                {
                    fileArray2.push(fileArray[i]);
                }
            }
            // fileArray.reduce( function (item) {
            // 	return null;
            // });
            let articles = fileArray2.join(" ");
            args = ["-phonegapServer", ipAddress + ":" + port, "-serveArticles", articles];
            return args;
        });
}
