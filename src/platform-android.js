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

/**
 * Module dependencies.
 */
var Q = require('q');
var path = require('path');
var fs = require('fs');
var FS = require('q-io/fs');
var shell = require('shelljs');
var os = require('os');
var downloadFile = require('../utils/downloadFile');
var getUserHome = require('../utils/getUserHome');
var unzip = require('../utils/unzip');
var setupEnv_win = require('../utils/setupEnv-android-win');
var setupEnv_mac = require('../utils/setupEnv-android-mac');
var spawn = require('cross-spawn-async');
var spinner = require('simple-spinner');
var cordova_lib = require('../lib/cordova').lib;
var events = cordova_lib.events;
var cordova = cordova_lib.cordova;

const skinName = 'Nexus-7';

var sdkInstallPath = path.join(getUserHome(), 'platforms','android','sdk');
var androidToolsPath = path.join(sdkInstallPath, 'tools');
var pathToBin = path.join(androidToolsPath,'bin');

module.exports.install = install;
module.exports.post_add = post_add;

function install() {
    return downloadSdk()
        .then( () => {
            return updateSdk();
        })
        .then( () => {
            return setupEnv();
        })
        .then( () => {
            return createAvd();
        })
        .then( () => {
            return installHAXM();
        });
}

function downloadSdk() {
    var deferred = Q.defer();
    var sdkDownloadUrl = null;
    var toolsDownloadUrl = null;
    var tmpSdkZip = path.join(os.tmpdir(), 'android_sdk.zip');
    var tmpSdkUnzipFolder = path.join(os.tmpdir(), 'android_sdk');
    var tmpToolsZip = path.join(os.tmpdir(), 'studio_tools.zip');
    var tmpToolsUnzipFolder = path.join(os.tmpdir(), 'studio_tools');
    //var sdkInstallPath = path.join(getUserHome(), 'platforms','android','sdk');
    //var toolsInstallPath = path.join(getUserHome(), 'platforms/android/sdk/tools');

    if (process.platform == 'win32') {
        //sdkDownloadUrl = 'http://dl.google.com/android/android-sdk_r24.4.1-windows.zip';
        toolsDownloadUrl = 'http://dl.google.com/android/repository/sdk-tools-windows-4333796.zip';
        var sdkContents = path.join(tmpSdkUnzipFolder, 'android-sdk-windows');
    } else if (process.platform == 'darwin') {
        //sdkDownloadUrl = 'http://dl.google.com/android/android-sdk_r24.4.1-macosx.zip';
        toolsDownloadUrl = 'http://dl.google.com/android/repository/sdk-tools-darwin-4333796.zip';
        var sdkContents = path.join(tmpSdkUnzipFolder, 'android-sdk-macosx');
    } else {
        events.emit('log', 'Unsupported OS: %s', process.platform);
        return;
    }

    fs.access(androidToolsPath, fs.F_OK, function(err) {
        if (!err) {
            // do download, just update
            deferred.resolve()
        } else {
            spinner.start();
            // download an older Android SDK with 'tools' - need the 'templates', 'ant' etc...
            // FS.makeTree(sdkInstallPath)
            // .then( () => {
            //     return downloadFile(sdkDownloadUrl, tmpSdkZip);
            // })
            // .then( () => {
            //     return unzip(tmpSdkZip, tmpSdkUnzipFolder);
            // })
            // .then( () => {
                
            //     return FS.copyTree(sdkContents, sdkInstallPath);
            // })
            // .then ( () => {
            //     return FS.removeTree(tmpSdkUnzipFolder)
            //         .catch( (err) => false );
            // })
            // // downloading the Tools for Android Studio to have support for avdmanager;
            // will be created at /platforms/android/sdk/ 
            //.then( () => {
                //return  
            FS.makeTree(androidToolsPath)
             //})
            .then( () => {
                return downloadFile(toolsDownloadUrl, tmpToolsZip)
            })
            .then( () => {
                return unzip(tmpToolsZip, tmpToolsUnzipFolder);
            })
            .then( () => {
                // copy contents of the folder, not the folder itself
                var tt = path.join(tmpToolsUnzipFolder, 'tools');
                return FS.copyTree(tt, androidToolsPath);
            })
            .then ( () => {
                return FS.removeTree(tmpToolsUnzipFolder)
                .catch( (err) => false );
            })
            .then( () => {
                spinner.stop();
                events.emit('log', '******** Android Studio Tools added successfully ********\n');
                deferred.resolve();
            });
        }
    });
    return deferred.promise;
}

function updateSdk() {
    var deferred = Q.defer();
    // ./android is deprecated after 25.2.3 and higher, so will use ./sdkmanager instead;
    // TO_DO:
    // This replaces the gradle folder that was being added with older version, and since it
    // was used on 'platform install', we need to make it available from other source    
    if (process.platform == 'win32') {
        var script= path.join(pathToBin, 'sdkmanager.bat');
        var proc = spawn('powershell', [script, '--install', 
                            'sources;android-27',
                            'platform-tools',
                            'patcher;v4',
                            'build-tools;27.0.1',
                            'emulator',
                            'system-images;android-27;default;x86',
                            'platforms;android-27',
                            'extras;android;m2repository',
                            'extras;google;m2repository',
                            'extras;intel;Hardware_Accelerated_Execution_Manager',
                            'extras;google;google_play_services'], { stdio: 'inherit' });
    } else if (process.platform == 'darwin') {
        var script = path.join(pathToBin, 'sdkmanager');
        var proc = spawn('sh', [script, '--install', 
                            'sources;android-27',
                            'platform-tools',
                            'patcher;v4',
                            'build-tools;27.0.1',
                            'emulator',
                            'system-images;android-27;default;x86',
                            'platforms;android-27',
                            'extras;android;m2repository',
                            'extras;google;m2repository',
                            'extras;intel;Hardware_Accelerated_Execution_Manager',
                            'extras;google;google_play_services'], { stdio: 'inherit' });
    } else {
        events.emit('log', 'Platform not supported: ' + process.platform);
        return;
    }
    proc.on('error', function (error) {
        deferred.reject(new Error('Installing Android platform encountered error ' + error.message));
    });
    proc.on('exit', function(code) {
        if (code !== 0) {
            deferred.reject(new Error('Installing Android platform exited with code ' + code));
        } else {
            events.emit('log', '******** Android SDK added successfully. ********\n');
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function setupEnv() {
    if (process.platform == 'win32') {
        return setupEnv_win();
    } else if (process.platform == 'darwin') {
        return setupEnv_mac();
    } else {
        events.emit('log', 'Unsupported OS: %s', process.platform);
        return;
    }
}

function installHAXM() {
    var deferred = Q.defer();
    var command = null;
    var haxm_path = path.join(sdkInstallPath,'extras',
        'intel','Hardware_Accelerated_Execution_Manager');

    if (process.platform == 'win32') {
        command = path.join(haxm_path,'silent_install.bat');
    } else if (process.platform == 'darwin') {
        command = 'sudo ' + path.join(haxm_path, 'silent_install.sh');
            
    } else {
        events.emit('log', 'Unsupported OS: %s', process.platform);
        return;
    }
    spinner.start();
    shell.cd(haxm_path);
    shell.exec(command, {
        silent: false
    }, function (code, output) {
        spinner.stop();
        if (code === 0) {
            events.emit('log', '******** HAXM successfully. ********\n');
            deferred.resolve();
        } else {
            deferred.reject(new Error('Installing Intel HAXM failed.'));
        }
    });
    return deferred.promise;
}

function createAvd() {
    var skinFrom = path.join(__dirname, '..', 'platforms','android', 'skins', skinName);
    var skinTo = path.join(sdkInstallPath, 'platforms', 'android-27','skins', skinName);
    return FS.makeTree(skinTo)
        .then( () => {
            return FS.copyTree(skinFrom, skinTo);
        })
        .then( () => {
            var deferred = Q.defer();
            var command =  null;
            // ./android is deprecated, so will use ./avdmanager from Adnroid Studio Tools instead
            if (process.platform == 'win32') {
                command = path.join(androidToolsPath,'bin','avdmanager.bat') +
                          ' -s create avd -f -n AEMM_Tablet -b default/x86 ' +
                          '-k "system-images;android-27;default;x86" -c 1024M -d "Nexus 7"';
            } else if (process.platform == 'darwin') {
                // seems that the exec files become TextEdit format after unzip
                command = 'chmod -R 755 ' + androidToolsPath + ' && ' + 
                          path.join(androidToolsPath,'bin','avdmanager') +
                          ' -s create avd -f -n AEMM_Tablet -b default/x86 ' +
                          '-k "system-images;android-27;default;x86" -c 1024M -d "Nexus 7"' + ' && ' +
                          'chmod -R 755 ' + sdkInstallPath;
            } else {
                deferred.reject(new Error('Platform not supported: ' + process.platform));
                return;
            }

            shell.exec(command, {
                silent: false
            }, function (code, output) {
                if (code === 0) {
                    events.emit('log', '\n******** AVD is created successfully ********\n');
                    deferred.resolve();
                } else {
                    deferred.reject(new Error('Creating AVD failed'));
                }
            });
            return deferred.promise;
        });
}

function post_add()
{
    return Q.fcall( () => {
        // add aemm-plugin-navto by default to be consistent with our viewer app behavior.
        var targets = ['aemm-plugin-navto'];
        return cordova.raw.plugin('add', targets);
    })
    .then(() => {
        events.emit('results', 'Finished adding Android platform.');
    });
}
