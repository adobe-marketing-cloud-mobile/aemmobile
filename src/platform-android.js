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
var os = require('os');
var decompressZip = require('decompress-zip');
var downloadFile = require('../utils/downloadFile');
var spawn = require('cross-spawn-async');

const skinName = "Nexus-7";

module.exports.install = install;
function install() {
    //return installSdk();
    //return updateSdk();
    //return createAvd();
    //return installHAXM();
    return installSdk()
        .then( () => {
            return updateSdk();
        })
        .then( () => {
            return createAvd();
        })
        .then( () => {
            return installHAXM();
        })
}

function updateSdk() {
    var deferred = Q.defer();

    var androidCmd = path.join(getUserHome(), 'platforms/android/sdk/tools/android');
    var proc = spawn(androidCmd, ['--silent', 'update', 'sdk', '--all',
        '--no-ui', '--filter', 'platform-tool,tool,android-23,sys-img-x86_64-android-23,extra-intel-Hardware_Accelerated_Execution_Manager'], { stdio: 'inherit' });

    proc.on("error", function (error) {
        deferred.reject(new Error("Installing Android platform encountered error " + error.message));
    });
    proc.on("exit", function(code) {
        if (code !== 0) {
            deferred.reject(new Error("Installing Android platform exited with code " + code));
        } else {
            console.log("Android SDK is updated successfully.");
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function installSdk() {
    var deferred = Q.defer();
    var sdkDownloadUrl = null;
    var sdkInstallPath = path.join(getUserHome(), 'platforms/android/sdk');
    var tempSdkDownloadFilePath = path.join(os.tmpdir(), 'android_sdk.zip');
    var tempSdkUnzipRoot = path.join(os.tmpdir(), 'platform');
    var tempSdkUnzipPath = null;

    if (process.platform == 'win32') {
        sdkDownloadUrl = 'http://dl.google.com/android/android-sdk_r24.4.1-windows.zip';
        tempSdkUnzipPath = path.join(tempSdkUnzipRoot, 'android-sdk-windows');
    } else if (process.platform == 'darwin') {
        sdkDownloadUrl = 'http://dl.google.com/android/android-sdk_r24.4.1-macosx.zip';
        tempSdkUnzipPath = path.join(tempSdkUnzipRoot, 'android-sdk-macosx');
    } else {
        console.log("Unsupported OS: %s", process.platform);
        return;
    }

    // Check whether SDK is installed already
    fs.access(sdkInstallPath, fs.F_OK, function(err) {
        if (!err) {
            deferred.resolve();
        } else {
            FS.makeTree(sdkInstallPath)
            .then( () => {
                return downloadFile(sdkDownloadUrl, tempSdkDownloadFilePath)
            })
            .then( () => {
                return unzipFile(tempSdkDownloadFilePath, tempSdkUnzipRoot)
            })
            .then( () => {
                return FS.copyTree(tempSdkUnzipPath, sdkInstallPath)
            })
            .then ( () => {
                return FS.removeTree(tempSdkUnzipRoot)
                    .catch( (err) => false ); // We don't care if it does not exist when we try to delete it
            })
            .then( () => {
                console.log("Android SDK is installed successfully.");
                deferred.resolve();
            })
        }
    });

    return deferred.promise;
}

function installHAXM() {
    var deferred = Q.defer();
    var command = null;

    if (process.platform == 'win32') {
        command = path.join(getUserHome(), 'platforms/android/sdk/extras/intel/Hardware_Accelerated_Execution_Manager/silent_install.bat');
    } else if (process.platform == 'darwin') {
        command = 'sudo ' + path.join(getUserHome(), 'platforms/android/sdk/extras/intel/Hardware_Accelerated_Execution_Manager/silent_install.sh');
    } else {
        console.log("Unsupported OS: %s", process.platform);
        return;
    }

    var workingDir = path.join(getUserHome(), 'platforms/android/sdk/extras/intel/Hardware_Accelerated_Execution_Manager');
    shell.cd(workingDir);
    shell.exec(command, {
        silent: false
    }, function (code, output) {
        if (code == 0) {
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function createAvd() {
    var skinFrom = path.join(__dirname, '..', 'platforms/android/skins', skinName);
    var skinTo = path.join(getUserHome(), 'platforms/android/sdk/platforms/android-23/skins', skinName);

    return FS.makeTree(skinTo)
        .then( () => {
            return FS.copyTree(skinFrom, skinTo)
        })
        .then( () => {
            var deferred = Q.defer();

            var command = 'echo "no" | ' + path.join(getUserHome(), 'platforms/android/sdk/tools/android.bat') + ' create avd --force -n AEMM_Tablet --device "Nexus 7" -t "android-23" --abi default/x86_64 --skin "Nexus-7" --sdcard 1024M';
            shell.exec(command, {
                silent: false
            }, function (code, output) {
                if (code == 0) {
                    console.log("AVD:AEMM_Tablet is created successfully.");
                    deferred.resolve();
                }
            });

            return deferred.promise;
        });
}

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function unzipFile(zipFile, outputPath) {
    var deferred = Q.defer();

    var unzipper = new decompressZip(zipFile)

    unzipper.on('error', function (err) {
        deferred.reject(new Error("Failed to unzip the file"));
    });

    unzipper.on('extract', function (log) {
        deferred.resolve(outputPath);
    });

    unzipper.on('progress', function (fileIndex, fileCount) {
        // console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
    });

    unzipper.extract({
        path: outputPath
    });

    return deferred.promise;
}
