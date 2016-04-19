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
var net = require('net');
var attempts = 6; // max. # of attempts

/* return a free port number for android emulator */
function random_port() {
    var deferred = Q.defer();

    // port range by Android emulator/device
    var from = 5554,
        to = 5584,
        range = (to - from) / 2,
        port = from + ~~(Math.random() * range) * 2;

    var server = net.createServer();
    server.on('error', function(err) {
        attempts -= 1;
        if (attempts == 0) {
            deferred.reject(new Error("No ports are available"));
        } else {
            random_port();
        }
    });
    server.listen(port, function (err) {
        server.once('close', function () {
            deferred.resolve(port);
        });
        server.close();
    });

    return deferred.promise;
};

module.exports = random_port;