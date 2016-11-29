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
var Q = require('q');
var cordova_lib = require('../lib/cordova').lib;
var events = cordova_lib.events;
var logger = require('cordova-common').CordovaLogger.get();

var cli = rewire("../src/aemm-cli");
var build = require('../src/build');
var plugin = require('../src/plugin');
var config = require('../src/config');

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

        // Prevent multiple listeners from getting attached to process.on('uncaughtException'). Jasmine will catch these instead.
        spyOn(process, 'on');
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
            spyOn(helpSpy, 'mockHelp');
            cli.__set__('help', helpSpy.mockHelp);
        });

        it('should error if the platform has an illegal subcommand', function(done) {
            var notRealSubCmdFn = function() {
                cliMethod(['node', 'aemm', 'platform', 'notRealCmd']);
            };
            expect(notRealSubCmdFn).toThrowError("aemm platform does not have a subcommand of 'notRealCmd'; try 'aemm help platform' for a list of all the available sub commands within platform.");
            done();
        });

        it('should call the build command', function(done) {
            spyOn(build, 'call');
            cliMethod(['node', 'aemm', 'build', 'platform1', 'platform2', '--', 'unparsedSomething']);
            expect(build.call.calls.argsFor(0)[1].platforms).toEqual([ 'platform1', 'platform2' ]);
            expect(build.call.calls.argsFor(0)[1].options.argv).toEqual([ 'unparsedSomething' ]);
            done();
        });

        it('should call the plugin command', function(done) {
            spyOn(plugin, 'call');
            cliMethod(['node', 'aemm', 'plugin', 'add', 'plugin1', 'plugin2']);
            expect(plugin.call).toHaveBeenCalledWith(null, 'add', ['plugin1', 'plugin2']);
            done();
        });

        it('should call the config command', function(done) {
            spyOn(config, 'call');
            cliMethod(['node', 'aemm', 'config', '--set', 'fakeSetKey', 'fakeSetValue']);
            expect(config.call.calls.argsFor(0)[1].options.set).toEqual('fakeSetKey');
            expect(config.call.calls.argsFor(0)[1].options.setValue).toEqual('fakeSetValue');
            done();
        });

        it('should error if there is an invalid command', function(done) {
            var notRealCmdFn = function() {
                cliMethod(['node', 'aemm', 'notRealCmd']);
            };
            expect(notRealCmdFn).toThrowError("aemm does not know 'notRealCmd'; try 'aemm help' for a list of all the available commands.");
            done();
        });

        describe('should set the logger level', function() {

            beforeEach(function() {
                spyOn(logger, 'setLevel');
            });

            it('to error when setting --silent', function(done) {
                cliMethod(['node', 'aemm', '--silent']);
                expect(helpSpy.mockHelp).toHaveBeenCalledWith([]);
                expect(logger.setLevel).toHaveBeenCalledWith('error');
                done();
            });
            it('to verbose when setting --verbose', function(done) {
                cliMethod(['node', 'aemm', '--verbose']);
                expect(helpSpy.mockHelp).toHaveBeenCalledWith([]);
                expect(logger.setLevel).toHaveBeenCalledWith('verbose');
                done();
            });
            it('to verbose when setting -d', function(done) {
                cliMethod(['node', 'aemm', '-d']);
                expect(helpSpy.mockHelp).toHaveBeenCalledWith([]);
                expect(logger.setLevel).toHaveBeenCalledWith('verbose');
                done();
            });
        });

        describe('should launch help', function() {

            it('if there is not a command', function(done) {
                cliMethod(['node', 'aemm']);
                expect(helpSpy.mockHelp).toHaveBeenCalledWith([]);
                done();
            });

            it('if help is the command', function(done) {
                cliMethod(['node', 'aemm', 'help']);
                expect(helpSpy.mockHelp).toHaveBeenCalledWith([]);
                done();
            });

            it('if help is a flag', function(done) {
                cliMethod(['node', 'aemm', '--help']);
                expect(helpSpy.mockHelp).toHaveBeenCalledWith([]);
                done();
            });

            it('if help is a short hand flag', function(done) {
                cliMethod(['node', 'aemm', '--h']);
                expect(helpSpy.mockHelp).toHaveBeenCalledWith([]);
                done();
            });

            it('for a command if help is the first command', function(done) {
                cliMethod(['node', 'aemm', 'help', 'myTestCommand']);
                expect(helpSpy.mockHelp).toHaveBeenCalledWith(['myTestCommand']);
                done();
            });

            it('for a command if help is a flag', function(done) {
                cliMethod(['node', 'aemm', '--help', 'myTestCommand']);
                expect(helpSpy.mockHelp).toHaveBeenCalledWith(['myTestCommand']);
                done();
            });

            it('for a command if help is a short hand flag', function(done) {
                cliMethod(['node', 'aemm', '--h', 'myTestCommand']);
                expect(helpSpy.mockHelp).toHaveBeenCalledWith(['myTestCommand']);
                done();
            });
        });
    });

});


