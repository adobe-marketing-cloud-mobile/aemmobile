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
var build_android = rewire('../src/build-android');


describe('build-android', function() {
    var build = build_android.__get__('build');

    beforeEach(function () {
        spyOn(cordova.raw, 'build');
    });

    describe('build method', function() {
        it('should call cordova build', function(done) {
            return build({})
            .then( () =>{
                expect(cordova.raw.build.calls.argsFor(0)[0].platforms).toEqual(['android']);
                done();
            });
        });
    });
});