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
/*!
 * Module dependencies.
 */

var ip = require('ip'),
    os = require('os');

/**
 * Get IP address of local machine.
 *
 * Finds and returns the IP address of the network adapter used to communicate
 * with the Internet. We cannot simply use the first network adapters IP address,
 * because some virtual machines and specifically the Windows Phone simulator
 * will add their own network adapters. Often the network adapters are arranged
 * alphabetically, so the first adapter may not be a valid address.
 *
 * Our solution is to attempt to ping an external address and then lookup
 * the local address used to make the request. If this fails - because the
 * external service is unavailable or the user is not connected to the Internet -
 * then we fallback on the first adapter's address.
 *
 * Arguments:
 *
 *   - `callback` {Function} will be triggered on competion.
 *     - `e` {Error} is null unless there is an error.
 *     - `address` {String} is the primary IP address.
 *     - `addresses` {[String]} is an array of addresses (primary is first).
 *
 * Example:
 *
 *    ip.address(function(e, address, address) {
 *        console.log('error:', e);
 *        console.log('IP address:', address);
 *        console.log('IP addresses:', addresses.join(', '));
 *    });
 */

module.exports.address = function(callback) {
    var interfaces = os.networkInterfaces();
    var addresses = [ip.address()];

    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                // address is not the primary address
                if (address.address !== addresses[0]) {
                    addresses.push(address.address);
                }
            }
        }
    }

    callback(null, addresses[0], addresses);
};