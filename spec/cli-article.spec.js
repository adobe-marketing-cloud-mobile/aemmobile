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

var cli = require("../src/aemm-cli");
var Q = require('q');
var article = require('../src/article');
var cordova_lib = require('cordova-lib');
var events = cordova_lib.events;
var logger = require('cordova-common').CordovaLogger.get();

describe("aemm cli article:", function () {
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

    describe("create", function () {

        beforeEach(function () {
            spyOn(article, 'create');
        });

        it("will call article create", function (done) {
            let articleName = "TestArticle";
            cli(["node", "aemm", "article", "create", articleName], (err) => {
                expect(err).not.toBeTruthy();
                expect(article.create).toHaveBeenCalledWith({ argv : { remain : [ 'TestArticle' ], cooked : [ 'article', 'create', 'TestArticle' ], original : [ 'article', 'create', 'TestArticle' ] } }, 'TestArticle');
                done();
            });
        });

    });
/*
        // Ignoring negative tests.
        it("will fail if an invalid subcommand is called", function (done) {
            cli(["node", "aemm", "article", "bogus"], (err) => {
                expect(err.message).toBe("aemm article does not have a subcommand of 'bogus'; try 'aemm help article' for a list of all the available sub commands within article.");
                done();
            });
        });
*/
});
