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
var Q = require('q'),
    util = require('util'),
    shell = require('shelljs');

var cordova = require('../utils/cordovaUtils');

module.exports = plugin;
function plugin(argv) {
    return Q.fcall( () => {
        var cmd = cordova.getPathToCordovaBinary() + " plugin " + argv.argv.remain.join(" ");
        shell.exec(cmd);
    }).catch(function (err) {
        console.log(util.inspect(err));
    }).done();
}