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

var run = require('../src/run');
var project = require('../src/project');
var path = require('path');
var os = require('os');
var FS = require('q-io/fs');
var shell = require('shelljs'); 
var projectName = 'TestProject';
var tmpDir = path.join(os.tmpdir(), "AEMMTesting");
var projectPath = path.join(tmpDir, projectName);
var iossim = require('ios-sim');
var Q = require('q');
var app = require('../src/app');
var iosApp = require('../src/app-ios');
var phoneGap = require('connect-aemmobile');    
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;
var logger = require('cordova-common').CordovaLogger.get();

describe('run ios:', function() 
{
    beforeEach(function(done) 
    {
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
        spyOn(logger, 'log');
        spyOn(logger, 'info');
        spyOn(logger, 'warn');
        spyOn(console, 'log');
        spyOn(process.stderr, 'write');
        spyOn(events, 'emit');
        
        spyOn(iossim, "launch").and.callFake( function(value) {return Q.resolve(true);} );
        spyOn(app, "ensureInstalledBinary").and.callFake( function(value) {return Q.resolve(true);} );
        
        shell.rm('-rf', tmpDir);
        FS.makeTree(tmpDir) 
        .then( () => {
            process.chdir(tmpDir);
            return project.create({}, projectPath)
            .then( ()=> process.chdir(projectPath) );
        })
        .catch( (err) => done.fail(err) )
        .finally( done );
    });
    
    afterEach( function(done) 
    {
        FS.removeTree(tmpDir)
        .finally(done);
    });
                
    describe('valid sims:', function() 
    {
        var fullDeviceList = [
            "iPhone-6, 7.1",
            "iPhone-6, 8.1",
            "iPhone-6, 9.1",
            "iPhone-6, 9.2",
            "iPad-2, 7.1",
            "iPad-Retina, 8.2",
            "iPad-Air, 9.1",
            "iPad-Air-2, 9.2",
            "Apple-TV-1080p, tvOS 9.2",
        ];
        beforeEach(function() 
        {
            spyOn(iossim, "getdevicetypes").and.callFake(function(value) {return fullDeviceList;});  
            
            var serveStub = {
                on: function(event, callback) {
                    if (event === "complete")
                    {
                        callback({address: "10.0.0.1", addresses:["10.0.0.1"], port: 3000});
                    }
                    return this;
                }
            };
            spyOn(phoneGap,"listen").and.callFake(function(value) {return serveStub;});
            
        });

        // run ios
        it('should call iossim launch', function(done) 
        {
            run({ 'platforms' : [ 'ios' ] })
            .then( () => {
                var path = iossim.launch.calls.argsFor(0)[0];
                var target = iossim.launch.calls.argsFor(0)[1];
                var logPath = iossim.launch.calls.argsFor(0)[2];
                var cmdLineArgs = iossim.launch.calls.argsFor(0)[4];
                
                expect(path).toMatch(/AEMM.app/);
                expect(fullDeviceList.indexOf(target)).toBe(1);
                expect(logPath).toMatch(/Library\/Application Support\/com.adobe.aemmobile\/TestProject.sim.console.log/);
                expect(cmdLineArgs[0]).toMatch(/-phonegapServer/);
                expect(cmdLineArgs[1]).toBe("10.0.0.1:3000");
                done();
            })
            .catch( (err) => done.fail(`Unexpected Error: ${err}`) );           
            
        });

        // run ios --list
        it('should return filtered list of devices', function(done) 
        {
            run({ 'list': true, 'platforms' : [ 'ios' ] })
            .then( () => {
                var count = events.emit.calls.count();
                var calls = events.emit.calls;
                expect( calls.argsFor(count-5)[1].trim() ).toBe("Available ios virtual devices");
                expect( calls.argsFor(count-4)[1].trim() ).toBe("iPhone-6, 8.1");
                expect( calls.argsFor(count-3)[1].trim() ).toBe("iPhone-6, 9.2");
                expect( calls.argsFor(count-2)[1].trim() ).toBe("iPad-Retina, 8.2");
                expect( calls.argsFor(count-1)[1].trim() ).toBe("iPad-Air-2, 9.2");
                done();
            })
            .catch( (err) => done.fail(err) );
        });
        
        // run ios --target validTarget
        it('should run a specific target if one is given', function(done) 
        {
            run({ target: "iPhone-6, 9.2", 'platforms' : [ 'ios' ] })
            .then( () => {
                var target = iossim.launch.calls.argsFor(0)[1];
                
                expect(fullDeviceList.indexOf(target)).toBe(3);
                done();
            })
            .catch( (err) => done.fail(`Unexpected Error: ${err}`) );           
        });
    });
});
