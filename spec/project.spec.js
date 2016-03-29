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
var project = require('../src/project');
var article = require('../src/article');
var path = require('path');
var os = require('os');
var FS = require('q-io/fs');
var projectName = 'TestProject';
var tmpDir = path.join(os.tmpdir(), "AEMMTesting");
var projectPath = path.join(tmpDir, projectName);


describe('project.create(options, projectPath)', function() 
{
    beforeEach(function(done) 
	{
		FS.makeTree(tmpDir) 
		.then( () => {
			process.chdir(tmpDir);
			spyOn(console, 'log');
		})
		.finally(done);
    });
	
	afterEach( function(done) {
		FS.removeTree(tmpDir)
		.finally(done);
	});


	// project create
    it('should fail if no path is passed in', function(done) 
	{
		project.create({}, undefined)
		.then( () => done.fail("Did not return error as expected") )
		.catch( (err) => expect(err.message).toMatch(/At least the dir must be provided to create new project/) )
		.finally( done );
    });

	// project create Test1
    it('should create expected file structure', function(done) 
	{
        project.create({}, projectName)
		.then( () => {
			var cordovaDirs = ['hooks', 'platforms', 'plugins'];
			let projectDir = path.join(process.cwd(), projectName);
			cordovaDirs.forEach(function(d) {
				expect(path.join(projectDir, d)).not.toExist();
			});

			// Expect config.xml
			expect(path.join(projectDir, 'config.xml')).toExist();

			// Check if Article file exists
			expect(path.join(projectDir, 'www', "SampleArticle", 'index.html')).toExist();

		})
		.catch( (err) => done.fail(err) )
		.finally(done);
    });

	

	// project create /tmp/fullpath
    it('should handle full path', function(done) 
	{
		var fullPathDir = path.join(os.tmpdir(), "FullPath");

        project.create({}, fullPathDir)
		.then( () => {
			expect(path.join(fullPathDir, 'config.xml')).toExist();
		})
		.catch( (err) => done.fail(err) )
		.finally( () => {
			FS.removeTree(fullPathDir)
			.finally(done);
		});
    });
	
	// project create /tmp/doesnotexist/trythis
    it('should fail if given an invalid path', function(done) 
	{
		var fullPathDir = path.join(os.tmpdir(), "FullPath");

        project.create({}, "/tmp/doesnotexist/trythis")
		.then( () => {
			done.fail("Should have failed, but didn't");
		})
		.catch( (err) => expect(err.message).toMatch(/no such file or directory/))
		.finally( () => {
			FS.removeTree(fullPathDir)
			.finally(done);
		});
    });

	// project create /directoryDoesExist
    it('should fail if the given path already exists', function(done) 
	{
        project.create({}, projectName)
		.then( () => {
			project.create({}, projectName)
			.then(() => done.fail( "Did not return error as expected"))
			.catch( (err) => expect(err.message).toMatch(/Path already exists and is not empty/) )
			.finally( done );
		})
		.catch( (err) => done.fail(err) )

    });

    it('should return Article List', function(done) 
	{
		let articleName = "TestArticle";
        project.create({}, projectName)
		.then( () => {
			process.chdir(projectPath);	
			return  article.create({}, articleName);		
		})
		.then( () => project.articleList() )
		.then( (articleList) => {
			expect(articleList.length).toBe(2);
			expect(articleList[0].metadata.entityName).toBe("SampleArticle");
			expect(articleList[1].metadata.entityName).toBe(articleName);
		})
		.catch( (err) => done.fail(err) )
		.finally(done);
    });

	// project create /directoryDoesExist
    it('should only return folders in Article list, not files', function(done) 
	{
        project.create({}, projectName)
		.then( () => {
			process.chdir(projectPath);
			// create a file too
			return FS.write(path.join(projectPath, "www", "Hello.txt"), "Hello, World!\n")	
		})
		.then( () => project.articleList() )
		.then( (articleList) => {
			expect(articleList.length).toBe(1);
			expect(articleList[0].metadata.entityName).toBe("SampleArticle");
		})
		.catch( (err) => done.fail(err) )
		.finally(done);
    });

    it('should return metadata from metadata.json if it exists', function(done) 
	{
        project.create({}, projectName)
		.then( () => {
			process.chdir(projectPath);	
			
			let metadata = { 
				rootPath: "FakeRoot",
				metadata: {
					shortTitle: "My Short Title"
				}
			};
			return FS.write( path.join(projectPath, "www", "SampleArticle", "metadata.json"), JSON.stringify(metadata))
			.then( () => {
				project.articleList()
				.then( (articleList) => {
					expect(articleList.length).toBe(1);
					expect(articleList[0].rootPath).toBe("FakeRoot");
					expect(articleList[0].metadata.shortTitle).toBe("My Short Title");
				});
			});
			
		})
		.catch( (err) => done.fail(err) )
		.finally(done);
    });

    it('should return empty article list when there are no articles', function(done) 
	{
        project.create({}, projectName)
		.then( () => FS.removeTree( path.join( projectPath, "www", "SampleArticle" ) ) ) // delete SampleArticle
		.then( () => {
			process.chdir(projectPath);	
			
			project.articleList()
			.then( (articleList) => {
				expect(articleList.length).toBe(0);
			});
		})
		.catch( (err) => done.fail(err) )
		.finally(done);
    });

});
