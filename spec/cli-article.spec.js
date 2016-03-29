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
var article = require('../src/article');

describe("aemm cli article:", function () {
    beforeEach(function () {
        spyOn(console, 'log');
		spyOn(process.stderr, 'write');
    });

	describe("create", function () {

		beforeEach(function () {
			spyOn(article, 'create');
		});

		it("will call article create", function (done) {
			let articleName = "TestArticle";
			cli(["node", "aemm", "article", "create", articleName], (err) => {
				expect(err).not.toBeTruthy();
				expect(article.create.calls.mostRecent().args[0].argv).not.toBeNull();
				expect(article.create.calls.mostRecent().args[1]).toMatch(articleName);
				done();
			});
		});

	});

		it("will fail if an invalid subcommand is called", function (done) {
			cli(["node", "aemm", "article", "bogus"], (err) => {
				expect(err.message).toBe("aemm article does not have a subcommand of 'bogus'; try 'aemm help article' for a list of all the available sub commands within article.");
				done();
			});
		});
	
 
});
