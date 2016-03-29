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


describe('run:', function() 
{
    // beforeEach(function(done) 
	// {
	// 	let err = undefined;
	// 	FS.makeTree(tmpDir) 
	// 	.then( () => {
	// 		// process.chdir(tmpDir);
	// 		// spyOn(console, 'log');
	// 		// return project.create({}, projectPath)
	// 		// .then( ()=> process.chdir(projectPath) );
	// 	})
	// 	.catch((error) => err = error )
	// 	.finally( () => done(err));
    // });
	
	// afterEach( function(done) {
	// 	FS.removeTree(tmpDir)
	// 	.finally(done);
	// });


	// run (no platform specified)
    it('should fail if no platform is passed in', function(done) 
	{
		run({})
		.then(() => done.fail("Did not return error as expected"))
		.catch( (err) => expect(err.message).toBe("You must specify a platform.  See 'aemm help run' for more info.") )
		.finally( done );
    });

});
