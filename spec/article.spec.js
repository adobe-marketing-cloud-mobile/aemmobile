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
var article = require('../src/article');
var project = require('../src/project');
var path = require('path');
var os = require('os');
var FS = require('q-io/fs');
var articleName = 'TestArticle';
let tmpDir = path.join(os.tmpdir(), "AEMMTesting");
var projectPath = path.join(tmpDir, "TestArticleProject");


describe('article.create(options, articlename)', () => 
{ 
	
    beforeEach( (done) => 
	{
		let err = undefined;
		FS.makeTree(tmpDir) 
		.then( () => {
			process.chdir(tmpDir);
			spyOn(console, 'log');
			return project.create({}, projectPath)
			.then( ()=> process.chdir(projectPath) );
		})
		.catch((error) => done.fail(err) )
		.finally( done );
    });
	
	afterEach( function(done) {
		FS.removeTree(tmpDir)
		.finally(done);
	});


	// article create 
    it('should fail if no name is passed in', (done) => 
	{
		article.create({}, undefined)
		.then( () => done.fail("Did not return error as expected") )
		.catch( (err) => expect(err.message).toMatch(/You must specify an article name with the 'article create' command./) )
		.finally( done );
    });

	// article create TestArticle
    it('should create expected file structure', (done) =>
	{
        article.create({}, articleName)
		.then( () => {
			// Check if Article file exists
			expect(path.join(projectPath, 'www', articleName, 'index.html')).toExist();

		})
		.catch( (err) => done.fail(err) )
		.finally(done);
    });

	// article create TestArticle TestArticle2 TestArticle3
    it('should create multiple articles if specified', (done) =>
	{
        article.create({}, articleName, `${articleName}2`, `${articleName}3`)
		.then( () => {
			// Check if Article file exists
			expect(path.join(projectPath, 'www', articleName, 'index.html')).toExist();
			expect(path.join(projectPath, 'www', `${articleName}2`, 'index.html')).toExist();
			expect(path.join(projectPath, 'www', `${articleName}3`, 'index.html')).toExist();

		})
		.catch( (err) => done.fail(err) )
		.finally(done);
    });

	// article create articleThatExists
	it('should fail if article exists', (done) =>
	{
        article.create({}, articleName)
		.then( () => {
			article.create({}, articleName)
			.then((results) => {
				expect(results[0].state).toBe("rejected");				
				expect(results[0].reason.message).toMatch(/Cannot create article/);
			})
			.catch( (err) => done.fail(err) )
			.finally( done );
		});
    });

	// article create articleThatExists articleThatDoesNotExist
	it('should create articles it can and fail for articles it cannot create when trying to create multiple articles', (done) =>
	{
		let existingArticle1 = "existingArticle1";
		let existingArticle2 = "existingArticle2";
		let newArticle1 = "newArticle1";
		let newArticle2 = "newArticle2";
		let err = undefined;
        article.create({}, existingArticle1, existingArticle2)
		.then( () => {
			article.create({}, existingArticle1, existingArticle2, newArticle1, newArticle2)
			.then((results) => {
				expect(results[0].state).toBe("rejected");
				expect(results[1].state).toBe("rejected");
				expect(results[0].reason).toMatch(/Cannot create article/);
				expect(results[1].reason).toMatch(/Cannot create article/);
				expect(results[2].state).toBe("fulfilled");
				expect(results[3].state).toBe("fulfilled");
				
				var x = expect(path.join(projectPath, 'www', newArticle1, 'index.html'));
				x.toExist();
				expect(path.join(projectPath, 'www', newArticle2, 'index.html')).toExist();
				
			})
			.catch( (err) => done.fail(err) )
			.finally( done );
		});
    });

	// article create articleThatExists
	it('should fail Article name is invalid', (done) =>
	{
        article.create({}, "#^&")
		.then((results) => {
			expect(results[0].state).toBe("rejected");				
			expect(results[0].reason.message).toMatch(/Article name has a limit of 64 alphanumeric characters. The value must start and end with a letter or number and can also contain dots, dashes and underscores./);
		})
		.catch( (err) => done.fail(err) )
		.finally( done );
    });
	
	it('Validate article names', (done) =>
	{
		var isArticleNameValid = article.testing.isArticleNameValid;

		expect(isArticleNameValid("abcdefghijklmnopqrstuvwxyz_abcdefghijklmnopqrstuvwxyz_abcdefghijk")).toBe(false);
		expect(isArticleNameValid("_abc")).toBe(false);
		expect(isArticleNameValid(".abc")).toBe(false);
		expect(isArticleNameValid("_abc")).toBe(false);
		expect(isArticleNameValid("a!a")).toBe(false);
		expect(isArticleNameValid("a@a")).toBe(false);
		expect(isArticleNameValid("a b")).toBe(false);

		expect(isArticleNameValid("abc")).toBe(true);
		expect(isArticleNameValid("a__b")).toBe(true);
		expect(isArticleNameValid("a..b")).toBe(true);
		expect(isArticleNameValid("a--b")).toBe(true);
		expect(isArticleNameValid("1")).toBe(true);
		expect(isArticleNameValid("abcdefghijklmnopqrstuvwxyz_abcdefghijklmnopqrstuvwxyz_abcdefghij")).toBe(true);
		
		
		expect(isArticleNameValid("1abc")).toBe(true);
		done();
	});


});

