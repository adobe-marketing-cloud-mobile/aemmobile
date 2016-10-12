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

var rewire = require('rewire');
var helpers = require('./helpers');
var cli = rewire("../src/aemm-cli");
var Q = require('q');
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;
var logger = require('cordova-common').CordovaLogger.get();

describe("aemm-cli", function () {

    beforeEach(function () {
        // Event registration is currently process-global. Since all jasmine
        // tests in a directory run in a single process (and in parallel),
        // logging events registered as a result of the "--verbose" flag in
        // CLI testing below would cause lots of logging messages printed out by other specs.

        // This is required so that fake events chaining works (events.on('log').on('verbose')...)
        var FakeEvents = function FakeEvents() {};
        FakeEvents.prototype.on = function fakeOn () {
            return new FakeEvents();
        };

        spyOn(events, "on").and.returnValue(new FakeEvents());
    
        // Spy and mute output
        spyOn(logger, 'results');
        spyOn(logger, 'warn');
        spyOn(console, 'log');
        spyOn(process.stderr, 'write');
    });

    describe("options", function () 
    {
        describe("version", function () 
        {
            var version = require("../package").version;

            it("will spit out the version with -v", function (done) 
            {
                cli(["node", "aemm", "-v"], function() {
                    expect(logger.results).toHaveBeenCalledWith(version);
                    done();
                });
            });

            it("will spit out the version with --version", function (done) 
            {
                cli(["node", "aemm", "--version"], function() {
                    expect(logger.results).toHaveBeenCalledWith(version);
                    done();
                });
            });

            it("will spit out the version with -v anywhere", function (done) 
            {
                cli(["node", "aemm", "one", "-v", "three"], function() {
                    expect(logger.results).toHaveBeenCalledWith(version);
                    done();
                });
            });
        });
    });

    describe("cli method", function() {
        var cliMethod = cli.__get__('cli');
        cli.__set__('nopt', require('nopt'));
        var helpSpy = {
            mockHelp: function() { }
        };

        beforeEach( function() {
            spyOn(helpSpy, 'mockHelp').and.returnValue('help got called.');
            cli.__set__('help', helpSpy.mockHelp);
        });

        it('should launch help if there is not a command', function(done) {
            var ret = cliMethod([]);
            expect(ret).toEqual('help got called.');
            expect(helpSpy.mockHelp).toHaveBeenCalledWith([]);
            done();
        });
    });

});


