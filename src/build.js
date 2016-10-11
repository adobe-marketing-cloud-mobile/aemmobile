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
var platformRequire = require('../utils/platformRequire');
var project = require('./project');
var promise_util = require('cordova-lib/src/util/promise-util');
var cordova_util = require('cordova-lib/src/cordova/util');
var _ = require('underscore');

module.exports = build;

function build(opts)
{
    return project.projectRootPath()
    .then( () => {
        return cordova_util.preProcessOptions(opts);
    })
    .then( () => {
        return promise_util.Q_chainmap(opts.platforms, function (platform) {
            var platformBuildModule = platformRequire("build", platform);
            return platformBuildModule.build(_.clone(opts));
        });
    })
    .catch( (err) => {
        if (err.message == "No platforms added to this project. Please use `cordova platform add <platform>`.") {
            throw new Error("No platforms added to this project. Please use `aemm platform add <platform>`.");
        }
        else {
            throw err;
        }
    });
}

