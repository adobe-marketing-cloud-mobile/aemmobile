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
"use strict"

var fs           = require('fs');


var customMatchers = {
    toExist: function(util, customEqualityTesters) {
        return {
            compare: function(actual) {
                var result = {};
                result.pass = fs.existsSync(actual);

                if (result.pass) {
                    result.message = `Expected no file to exist at ${actual}`;
                } else {
                    result.message =  `Expected a file to exist at ${actual}`;
                }
                return result;
            }
        };
    },
    
    toBeValidIPAddress:function(util, customEqualityTesters) {
        return {
            compare: function(potentialIPAddress) {
                let result = {pass: false};
                let portSplit = potentialIPAddress.split(":");
                if (portSplit.length > 2)
                {
                    result.message = `Invalid IP address.  More than one ':'.`;
                    return result;
                }
                
                // Check port
                if (portSplit.length == 2)
                {
                    let port = Number(portSplit[1]);
                    if (isNaN(port) || port < 0 )
                    {
                        result.message = `Invalid IP address.  Invalid port ${portSplit[1]}`;
                        return result;
                    }
                }
                
                let ipSplit = portSplit[0].split(".");
                if (ipSplit.length != 4)
                {
                    result.message = `Invalid IP address.  Expected 4 numbers separated by '.'`;
                    return result;
                }

                ipSplit.forEach((ipNumberString, index) => {
                    let ipNum = Number(ipNumberString);
                    if (isNaN(ipNum) || ipNum < 0 || ipNum > 255)
                    {
                        result.message = `Invalid IP address.  Number in position ${index} is invalid.`;
                        return result;
                    }
                });

                // passed, but we need to set a message for the 'not' case
                result.pass = true;
                result.message = `Expected ip address to be invalid`;
                return result;
            }
        };
    }
};