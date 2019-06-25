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

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var Q = require('q');
var spinner = require('simple-spinner');
var ini = require('ini');
var config = require('./config');
var getUserHome = require('../utils/getUserHome');

module.exports = {
    start: function(name, port) {
        return config.getValueFromConfig('screenOrientation')
        .then( (orientation) => {
            var defer = Q.defer();
            var userHome = getUserHome();

            if (!orientation) {
                // portrait by default
                orientation = 'portrait';
            }

            // launch emulator in the orientation specified in the config
            var avdName = name + '.avd';
            var avdConfigIni = path.join(userHome, ".android", "avd", avdName, 'config.ini');
            var avdConfig = ini.parse(fs.readFileSync(avdConfigIni, 'utf-8'));

            avdConfig['hw.initialOrientation'] = orientation;

            fs.writeFileSync(avdConfigIni, ini.stringify(avdConfig, null));

            function checkBooted(port) {
                if (defer.promise.isRejected()) {
                    spinner.stop();
                    return;
                }
                var checkCmd = null;
                var serialNum = 'emulator-' + port;
                if (process.platform == 'win32') {
                    checkCmd = path.join(userHome,'platforms', 'android', 'sdk', 'platform-tools', 'adb') + ' -s ' + serialNum + 
                        ' shell pm path android | findstr package:/system/framework/framework-res.apk';
                } else if (process.platform == 'darwin') {
                    checkCmd = path.join(userHome, 'platforms', 'android', 'sdk', 'platform-tools', 'adb') + ' -s ' + serialNum + 
                        ' shell pm path android | grep package:/system/framework/framework-res.apk';
                } else {
                    spinner.stop();
                    defer.reject(new Error("Platform not supported: ", process.platform));
                    return;
                }

                shell.exec(checkCmd, {
                    silent: true
                }, function(code, output) {
                    if (code !== 0) {
                        setTimeout(checkBooted.bind(this, port), 500);
                    } else {
                        // Give the emulator a bit more time to initialize
                        setTimeout(function () {
                            spinner.stop();
                            defer.resolve(serialNum);
                        }, 3000);
                    }
                });
            }
            
            var cmd = path.join(userHome,'platforms','android','sdk','emulator','emulator') + ' -wipe-data -avd ' + name + ' -port ' + port + ' -gpu host';

            shell.exec(cmd, {
                async: true
            }, function(code, output) {
                if (code !== 0) {
                    defer.reject(output);
                }
            });

            // start polling for device ready
            spinner.start();
            checkBooted(port);

            return defer.promise;
        });
    }
};