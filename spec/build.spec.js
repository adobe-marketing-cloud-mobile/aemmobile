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

var Q = require('q');
var rewire = require('rewire');
var cordova_util = require('cordova-lib/src/cordova/util');
var build = rewire('../src/build');
var build_android = require('../src/build-android');
var build_ios = require('../src/build-ios');
var project = require('../src/project');

describe('build', function () {
    
    describe('build method', function() {

        beforeEach(function() {
            spyOn(project, 'projectRootPath').and.returnValue(Q('/my/fake/dir/'));
            spyOn(cordova_util, 'preProcessOptions').and.callFake(function (opts) {
                opts = opts || {};
                opts.platforms = opts.platforms || [];
                if (opts.platforms.length === 0) {
                    throw new Error('This is the "no platforms" error'); 
                }
                return opts;
            });
        });

        var buildFn = build.__get__('build');

        it('should call build-ios', function(done) {
            spyOn(build_ios, 'build');

            this.wrapper(build({ 'platforms' : [ 'ios' ]}), done, function () {
                expect(build_ios.calls.argsFor(0)[1].platforms).toEqual(['ios']);
            });
        });
        
        it('should call build-android', function(done) {
            spyOn(build_android, 'build');

            this.wrapper(build({ 'platforms' : [ 'android' ]}), done, function () {
                expect(build_android.calls.argsFor(0)[1].platforms).toEqual(['android']);
            });
        });

        it('should error if there are no platforms', function(done) {
            this.wrapperError(build(), done, function (err) {
                expect(err.message).toEqual('This is the "no platforms" error');
            });
        });

        it('should error if illegal platforms are passed in', function(done) {
            this.wrapperError(build({ 'platforms' : [ 'notPlatform' ]}), done, function (err) {
                expect(err.message).toEqual('Invalid platform - notPlatform');
            });
        });
    });
});