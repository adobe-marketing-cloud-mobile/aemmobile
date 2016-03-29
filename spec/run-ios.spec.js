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
var run = require('../src/run');
var project = require('../src/project');
var path = require('path');
var os = require('os');
var FS = require('q-io/fs');
var projectName = 'TestProject';
var tmpDir = path.join(os.tmpdir(), "AEMMTesting");
var projectPath = path.join(tmpDir, projectName);
var iossim = require('ios-sim');
var Q = require('q');
var app = require('../src/app');
var iosApp = require('../src/app-ios');
var phoneGap = require('connect-aemmobile');	

describe('run ios:', function() 
{
	beforeEach(function(done) 
	{
		spyOn(iossim, "launch").and.returnValue( Q.resolve( true ) );
		spyOn(app, "ensureInstalledBinary").and.returnValue( Q.resolve(true) );
		spyOn(console, "log");
		
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
	
	describe('no simulators:', function() 
	{
		let fullDeviceList = [
			"iPhone-6, 7.1",
			"iPhone-6, 9.1",
			"Apple-TV-1080p, tvOS 9.2",
			"Apple-Watch-38mm, watchOS 2.1",
			"Apple-Watch-42mm, watchOS 2.1"
		];
		
		it('should fail if no valid simulators are installed', function(done)
		{
			spyOn(iossim, "getdevicetypes").and.returnValue( fullDeviceList );		
			
			run({}, "ios")
			.then( () => done.fail("Did not fail with no valid simulators"))
			.catch( (err) => {
				const lines = err.message.split('\n');
				expect(lines[0]).toMatch(/No valid simulator devices installed in Xcode\([A-z\/.]*\)\./);
				expect(lines[1]).toBe("The following devices are installed");
				expect(lines[2]).toBe("iPhone-6, 7.1");
				expect(lines[3]).toBe("iPhone-6, 9.1");
				expect(lines[4]).toBe("Apple-TV-1080p, tvOS 9.2");
				expect(lines[5]).toBe("Apple-Watch-38mm, watchOS 2.1");
				expect(lines[6]).toBe("Apple-Watch-42mm, watchOS 2.1");
				expect(lines[7]).toBe("Valid devices must be iPhone or iPad and run iOS 8 or iOS 9.2 or greater.");
				expect(lines[8]).toBe("Install simulator devices from Xcode.");
			})
			.finally( done );
			

		});
	});

				
	describe('valid sims:', function() 
	{
		let fullDeviceList = [
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
			spyOn(iossim, "getdevicetypes").and.returnValue( fullDeviceList );	
			
			let serveStub = {
				on: function(event, callback) {
					if (event === "complete")
					{
						callback({address: "10.0.0.1", addresses:["10.0.0.1"], port: 3000});
					}
					return this;
				}
			};
			spyOn(phoneGap,"listen").and.returnValue( serveStub );
			
		});

		// run ios
		it('should call iossim launch', function(done) 
		{
			run({}, "ios")
			.then( () => {
				let path = iossim.launch.calls.mostRecent().args[0];
				let target = iossim.launch.calls.mostRecent().args[1];
				let logPath = iossim.launch.calls.mostRecent().args[2];
				let cmdLineArgs = iossim.launch.calls.mostRecent().args[4];
				
				expect(path).toMatch(/AEMM.app/);
				expect(fullDeviceList.indexOf(target)).toBe(1);
				expect(logPath).toMatch(/Library\/Application Support\/com.adobe.cq.mobile\/TestProject.sim.console.log/);
				expect(cmdLineArgs[0]).toMatch(/-phonegapServer/);
				expect(cmdLineArgs[1]).toBe("10.0.0.1:3000");
				done();
			})
			.catch( (err) => done.fail(`Unexpected Error: ${err}`) );			
			
		});

		

		// run ios --list
	    it('should return filtered list of devices', function(done) 
		{
			run({ list: true }, "ios")
			.then( () => {
				let count = console.log.calls.count();
				let calls = console.log.calls.all();
				expect( calls[count-5].args[0].trim() ).toBe("Available ios virtual devices");
				expect( calls[count-4].args[0].trim() ).toBe("iPhone-6, 8.1");
				expect( calls[count-3].args[0].trim() ).toBe("iPhone-6, 9.2");
				expect( calls[count-2].args[0].trim() ).toBe("iPad-Retina, 8.2");
				expect( calls[count-1].args[0].trim() ).toBe("iPad-Air-2, 9.2");
				done();
			})
			.catch( (err) => done.fail(err) );
	    });
		
		// run ios --target validTarget
	    it('should run a specific target if one is given', function(done) 
		{
			run({target: "iPhone-6, 9.2"}, "ios")
			.then( () => {
				let target = iossim.launch.calls.mostRecent().args[1];
				
				expect(fullDeviceList.indexOf(target)).toBe(3);
				done();
			})
			.catch( (err) => done.fail(`Unexpected Error: ${err}`) );			
	    });

		// run ios --target invalidTarget
	    it('should fail if the specified target is invalid', function(done) 
		{
			run({target: "iPhone-6, 9.1"}, "ios")
			.then( () => {
				done.fail(`Expected Error but got success`);
			})
			.catch( (err) => {
				expect(err.message).toBe("Target device specified(iPhone-6, 9.1) could not be found in the list of available devices.  Run 'aemm run ios --list' for device list.");
				done();
			});			
	    });
		
	});


});
