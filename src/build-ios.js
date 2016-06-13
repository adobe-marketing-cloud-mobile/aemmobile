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
var cordova_lib = require('cordova-lib'),
    cordova = cordova_lib.cordova;

module.exports.build = build;

function build(args)
{
    return Q().then( function() {
        var cmd = "build";
        var opts = {
            platforms: [ "ios" ],
            options: {
                debug: args.debug,
                release: args.release,
                device: args.device,
                emulator: args.emulator,
                codeSignIdentity: "Don't Code Sign",
                noSign: true
            },
            verbose: false,
            silent: false,
            browserify: false,
            fetch: false,
            nohooks: [],
            searchpath : ""
        };

        return cordova.raw[cmd].call(null, opts);
    });
};

