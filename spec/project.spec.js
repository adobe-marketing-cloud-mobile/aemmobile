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
var path = require('path');
var os = require('os');
var FS = require('q-io/fs');
var fs = require('fs');
var project = rewire('../src/project');
var article = require('../src/article');
var projectName = 'TestProject';
var tmpDir = path.join(os.tmpdir(), "AEMMTesting");
var projectPath = path.join(tmpDir, projectName);

describe('project', function() {
	
	var fileResets = [];

	afterEach(function () {
        fileResets.forEach(function(func) {
            func();
        });
        fileResets = [];
    });
	
	describe('preserveWwwDir method', function() {
		var preserveWwwDir = project.__get__('preserveWwwDir');
		
		beforeEach(function() {
			spyOn(FS, 'write').and.returnValue(Q());
		});

		it('should create a .placeholder file in the www directory', function(done) {
			this.wrapper(preserveWwwDir('/preservedproject'), done, function() {
				expect(FS.write.calls.argsFor(0)[0]).toEqual(path.join('/preservedproject', 'www', '.placeholder'));
				expect(FS.write.calls.argsFor(0)[1]).toEqual('# This file guarantees that the www directory will remain.');
			});
		});
	});

	describe('create method', function() {
		var create = project.__get__('create');

		it('should behave correctly with --no-samples', function(done) {
			var opts = {
				'samples' : false
			};

			// Need these so unit tests will pass on windows
			var resolvedPath = path.resolve('/fakepath');

			var cordovaSpy = jasmine.createSpy('cordovaSpy').and.returnValue(Q());
			var artifactsSpy = jasmine.createSpy('artifactsSpy').and.returnValue(Q());
			var metadataSpy = jasmine.createSpy('metadataSpy').and.returnValue(Q());
			var scaffoldingSpy = jasmine.createSpy('scaffoldingSpy').and.returnValue(Q());
			var wwwSpy = jasmine.createSpy('wwwSpy').and.returnValue(Q());

			fileResets.push(project.__set__('createCordovaApp', cordovaSpy));
			fileResets.push(project.__set__('removeUnwantedCordovaArtifacts', artifactsSpy));
			fileResets.push(project.__set__('populateProjectMetadata', metadataSpy));
			fileResets.push(project.__set__('createAEMMScaffolding', scaffoldingSpy));
			fileResets.push(project.__set__('preserveWwwDir', wwwSpy));

			this.wrapper(create(opts, resolvedPath), done, function() {
				expect(cordovaSpy.calls.mostRecent().args[0]).toEqual(resolvedPath);
				expect(artifactsSpy.calls.mostRecent().args[0]).toEqual(resolvedPath);
				expect(metadataSpy.calls.mostRecent().args[0]).toEqual(resolvedPath);
				expect(wwwSpy.calls.mostRecent().args[0]).toEquals(resolvedPath);
				expect(scaffoldingSpy).not.toHaveBeenCalled();
			});
		});
	});
});

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
			var projectDir = path.join(process.cwd(), projectName);
			cordovaDirs.forEach(function(d) {
				expect(fs.existsSync(path.join(projectDir, d))).toBe(false);
			});

			// Expect config.xml
			expect(fs.existsSync(path.join(projectDir, 'config.xml'))).toBe(true);

			// Check if Article file exists
			expect(fs.existsSync(path.join(projectDir, 'www', "SampleArticle", 'index.html'))).toBe(true);

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
			expect(fs.existsSync(path.join(fullPathDir, 'config.xml'))).toBe(true);
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
		.catch( (err) => done.fail(err) );

    });

    it('should return Article List', function(done) 
	{
		var articleName = "TestArticle";
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
			return FS.write(path.join(projectPath, "www", "Hello.txt"), "Hello, World!\n");
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
			
			var metadata = { 
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
