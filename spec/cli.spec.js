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

var helpers = require('./helpers');
var cli = require("../src/aemm-cli");
var Q = require('q');
var project = require('../src/project');
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;
var logger = require('cordova-common').CordovaLogger.get();

describe("aemm cli", function () {
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

        spyOn(events, "on").andReturn(new FakeEvents());
       
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

            beforeEach(function () 
            {
            });

            it("will spit out the version with -v", function (done) 
            {
                cli(["node", "aemm", "-v"], function() {
                    expect(logger.results.mostRecentCall.args[0]).toMatch(version);
                    done();
                });
            });

            it("will spit out the version with --version", function (done) 
            {
                cli(["node", "aemm", "--version"], function() {
                    expect(logger.results.mostRecentCall.args[0]).toMatch(version);
                    done();
                });
            });

            it("will spit out the version with -v anywhere", function (done) 
            {
                cli(["node", "aemm", "one", "-v", "three"], function() {
                    expect(logger.results.mostRecentCall.args[0]).toMatch(version);
                    done();
                });
            });
        });
    });
/*  
    describe("command responses", function() 
    {
        beforeEach(function () {
            // Event registration is currently process-global. Since all jasmine
            // tests in a directory run in a single process (and in parallel),
            // logging events registered as a result of the "--verbose" flag in
            // CLI testing below would cause lots of logging messages printed out by other specs.
            spyOn(console, 'error');
        });

        it("should log errors in command response to console ", function (done) 
        {
            //expect(function () { cli(["node", "aemm", "project", "doesntexist", "DontMatter"], null).toThrow();
            done();
        });
        
        it("should handle Q.allSettled multiple responses from command and report errors to console ", function (done)
        {
            spyOn(project, "create").and.returnValue( Q.allSettled( [
                Q.reject(new Error("Failure 1")), 
                Q.resolve(10), 
                Q.reject( new Error("Failure 2")),
                Q.resolve(20)
            ] ) );
            cli(["node", "aemm", "project", "create", "DontMatter"], (err) => 
            {
                expect(process.stderr.write.calls.all()[0].args[0].trim()).toBe(`Error: Failure 1`);
                expect(process.stderr.write.calls.all()[1].args[0].trim()).toBe(`Error: Failure 2`);
                done();
            });
        });
    });

    it("will error if invalid command is called", function (done) 
    {
        cli(["node", "aemm", "doesntExist", "DontMatter"], (err) => {
            expect(err.message).toBe("aemm does not know 'doesntExist'; try 'aemm help' for a list of all the available commands.");
            done();
        });
    });

    it("will error if invalid subcommand is called", function (done) 
    {
        let projectName = "TestProject";
        cli(["node", "aemm", "project", "doesntExist", projectName], (err) => {
            expect(err.message).toBe("aemm project does not have a subcommand of 'doesntExist'; try 'aemm help project' for a list of all the available sub commands within project.");
            done();
        });
    });
*/
 
});


