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
var platform = require('./platform-ios');
var cordova_lib = require('cordova-lib'),
    cordova = cordova_lib.cordova;

module.exports.build = build;

function build(opts)
{
    var cmd = "build";
    opts.platforms = [ "ios" ];
    opts.options.codeSignIdentity = "Don't Code Sign";
    opts.options.noSign = true;

    return Q()
    .then( function() {
        if (opts.options.device) {
            return platform.isCodeSigningDisabled()
            .then( (codeSignDisabled) => {
                if (!codeSignDisabled) {
                    throw new Error("CODE_SIGNING_REQUIRED must be set to NO in order to build for device.\nYou can resolve this by running `aemm platform install ios`.");
                }
            });
        }
    })
    .then( () => {
        return cordova.raw[cmd].call(null, opts);
    });
}
