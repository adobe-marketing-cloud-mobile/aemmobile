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
var cordova = require('cordova-lib').cordova;
var build_ios = rewire('../src/build-ios');

describe('build-ios', function() {
    var build = build_ios.__get__('build');

    beforeEach(function () {
        spyOn(cordova.raw, 'build');
    });

    describe('build method', function() {
        it('should call cordova build', function(done) {
            return build([])
            .then( () =>{
                expect(cordova.raw.build.calls.argsFor(0)[0].platforms).toEqual(['ios']);
                expect(cordova.raw.build.calls.argsFor(0)[0].options.codeSignIdentity).toEqual("Don't Code Sign");
                expect(cordova.raw.build.calls.argsFor(0)[0].options.noSign).toEqual(true);
                done();
            });
        });

        it('should not throw if code signing is enabled for device builds', function(done) {
            var platform = require('../src/platform-ios');
            spyOn(platform, 'isCodeSigningDisabled').and.returnValue(Q(true));
            this.wrapper( build({ 'options': { 'device' : true }}), done, function() {
                expect(platform.isCodeSigningDisabled).toHaveBeenCalled();
                expect(cordova.raw.build.calls.argsFor(0)[0].platforms).toEqual(['ios']);
                expect(cordova.raw.build.calls.argsFor(0)[0].options.device).toEqual(true);
                expect(cordova.raw.build.calls.argsFor(0)[0].options.codeSignIdentity).toEqual("Don't Code Sign");
                expect(cordova.raw.build.calls.argsFor(0)[0].options.noSign).toEqual(true);
                done();
            });
        });

        it('should throw if code signing is disabled for device builds', function(done) {
            var platform = require('../src/platform-ios');
            spyOn(platform, 'isCodeSigningDisabled').and.returnValue(Q(false));
            var errorMessage = "CODE_SIGNING_REQUIRED must be set to NO in order to build for device.\nYou can resolve this by running `aemm platform install ios`.";
            this.wrapperError(build({ 'options': { 'device' : true }}), errorMessage, done, function() { 
                expect(platform.isCodeSigningDisabled).toHaveBeenCalled();
                expect(cordova.raw.build.calls.argsFor(0)[0].platforms).toEqual(['ios']);
                expect(cordova.raw.build.calls.argsFor(0)[0].options.device).toEqual(true);
                expect(cordova.raw.build.calls.argsFor(0)[0].options.codeSignIdentity).toEqual("Don't Code Sign");
                expect(cordova.raw.build.calls.argsFor(0)[0].options.noSign).toEqual(true);
            });
        });
    });
});