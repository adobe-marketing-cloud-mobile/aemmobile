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

var net = require('net');

/* return a free odd port number for android emulator */
var random_port = function(cb) {
    var from = 5554,
        to = 5680,
        range = (to - from) / 2,
        port = from + ~~(Math.random() * range) * 2;

    var server = net.createServer();
    server.listen(port, function (err) {
        server.once('close', function () {
            cb(port);
        });
        server.close();
    });
    server.on('error', function (err) {
        random_port(opts, cb);
    });
};

module.exports = random_port;