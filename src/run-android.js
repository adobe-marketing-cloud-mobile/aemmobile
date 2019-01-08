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
var project = require('./project');
var path = require("path");
var FS = require('q-io/fs');
var fs = require("fs");
var ip = require("ip");
var serve = require('./serve');
var emulator = require('./android-emulator');
var shell = require('shelljs');
var androidApp = require('./app-android');
var randomPort = require('./random-port');
var config = require('./config');
var deviceSerialNum = null;
var getUserHome = require('../utils/getUserHome');
var app = require('./app');
var constants = require('../utils/constants');

module.exports = run;

function run(opts) {
    var deviceName = opts.options.device ? "device" : "emulator";

    if (deviceName == "device") {
        return runOnDevice();
    } else {
        return runOnEmulator();
    }
}

function runOnDevice() {
    var apkInstalledType = constants.APK_TYPE_CUSTOM;

    return checkApk()
    .then( () => {
        return installApkOnDevice("device");
    })
    .then(function (apkType) {
        apkInstalledType = apkType;
        return serve({}, "android");
    })
    .then(function (servResponse) {
        return config.getValueFromConfig('screenOrientation')
        .then( (orientation) => {
            var defer = Q.defer();

            if (!orientation) {
                // portrait by default
                orientation = 'portrait';
            }

            var userHome = getUserHome();
            var launchActivity = "com.adobe.dps.viewer/com.adobe.dps.viewer.collectionview.CollectionActivity";
            if (apkInstalledType == constants.APK_TYPE_PREBUILT) {
                // prebuilt apk has different package name from custom apk
                launchActivity = "com.adobe.dps.preflight/com.adobe.dps.viewer.collectionview.CollectionActivity";
            }
            var serverIp = ip.address();
            var launchCmd = path.join(userHome, 'platforms/android/sdk/platform-tools/adb') + ' -d shell am start -n ' +
                launchActivity + ' -e phonegapServer ' + serverIp + ':3000' + ' -e initialOrientation ' + orientation;
            shell.exec(launchCmd, {
                silent: false
            }, function (code, output) {
                if (code === 0) {
                    defer.resolve();
                } else {
                    deferred.reject(new Error("Launching AEM Mobile app in emulator failed."));
                }
            });

            return defer.promise;
        });
    });
}

function runOnEmulator() {
    var apkInstalledType = constants.APK_TYPE_CUSTOM;

    return checkApk()
    .then( () => {
        return randomPort();
    })
    .then(function (port) {
        return emulator.start('AEMM_Tablet', port);
    })
    .then(function (emulatorId) {
        deviceSerialNum = emulatorId;
        return installApkOnEmulator(deviceSerialNum);
    })
    .then(function (apkType) {
        apkInstalledType = apkType;
        return serve({}, "android");
    })
    .then(function (servResponse) {
        return config.getValueFromConfig('screenOrientation')
        .then( (orientation) => {
            var defer = Q.defer();

            if (!orientation) {
                // portrait by default
                orientation = 'portrait';
            }

            var userHome = getUserHome();
            var launchActivity = "com.adobe.dps.viewer/com.adobe.dps.viewer.collectionview.CollectionActivity";
            if (apkInstalledType == constants.APK_TYPE_PREBUILT) {
                // prebuilt apk has different package name from custom apk
                launchActivity = "com.adobe.dps.preflight/com.adobe.dps.viewer.collectionview.CollectionActivity";
            }
            var launchCmd = path.join(userHome, 'platforms/android/sdk/platform-tools/adb') + ' -s ' + deviceSerialNum +
                ' shell am start -n ' + launchActivity + ' -e phonegapServer 10.0.2.2:3000' + ' -e initialOrientation ' + orientation;
            shell.exec(launchCmd, {
                silent: false
            }, function (code, output) {
                if (code === 0) {
                    defer.resolve();
                } else {
                    deferred.reject(new Error("Launching AEM Mobile app in emulator failed."));
                }
            });

            return defer.promise;
        });
    });
}

function checkApk() {
    return project.projectRootPath()
	.then( (projectRootPath) => {
        var deferred = Q.defer();

        var customPluginPath = path.join(projectRootPath, 'plugins');
        var customAppPath = path.join(projectRootPath, 'platforms/android');
        var customApkPath = path.join(projectRootPath, 'platforms/android/build/outputs/apk/android-debug.apk');
        if ( fs.existsSync(customAppPath) ) {
            if ( !fs.existsSync(customApkPath) ) {
                deferred.reject(new Error("No custom apk found, please run 'aemm build android'."));
            } else {
                deferred.resolve();
            }
        } else if ( fs.existsSync(customPluginPath) ) {
            deferred.reject(new Error("No platform found, please run 'aemm platform add android'."));
        } else {
            app.getParentPathForAppBinary("android", "emulator")
                .then((parentPath) => {
                    var prebuiltAppPath = path.join(parentPath, constants.APP_NAME_PREBUILT);
                    if (!fs.existsSync(prebuiltAppPath)) {
                        deferred.reject(new Error(`No apk found, please run 'aemm app install android'.`));
                    } else {
                        deferred.resolve();
                    }
                });
        }

        return deferred.promise;
    });
}

function installApkOnDevice()
{
    return androidApp.getInstalledAppBinaryPath("device")
        .then((apkPath) => {
            var defer = Q.defer();

            var apkType = constants.APK_TYPE_CUSTOM;    // custom apk by default
            if ( apkPath.indexOf(constants.APP_NAME_PREBUILT) > 0 ) {
                apkType = constants.APK_TYPE_PREBUILT;
            }

            var checkCmd = path.join(getUserHome(), 'platforms/android/sdk/platform-tools/adb') + ' -d install -r '
                + '"' + apkPath + '"';
            shell.exec(checkCmd, {
                silent: false
            }, function(code, output) {
                if (code === 0) {
                    defer.resolve(apkType);
                } else {
                    deferred.reject(new Error("Installing AEM Mobile app apk failed: " + apkPath));
                }
            });

            return defer.promise;
        });
}

function installApkOnEmulator(deviceSerialNum)
{
    return androidApp.getInstalledAppBinaryPath("emulator")
        .then((apkPath) => {
            var defer = Q.defer();

            var apkType = constants.APK_TYPE_CUSTOM;    // custom apk by default
            if ( apkPath.indexOf(constants.APP_NAME_PREBUILT) > 0 ) {
                apkType = constants.APK_TYPE_PREBUILT;
            }

            var checkCmd = path.join(getUserHome(), 'platforms/android/sdk/platform-tools/adb') + ' -s ' + deviceSerialNum +
                ' install ' + '"' + apkPath + '"';
            shell.exec(checkCmd, {
                silent: false
            }, function(code, output) {
                if (code === 0) {
                    defer.resolve(apkType);
                } else {
                    deferred.reject(new Error("Installing AEM Mobile app apk failed: " + apkPath));
                }
            });

            return defer.promise;
        });
}