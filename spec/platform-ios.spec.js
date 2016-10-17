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
var cordova = require('cordova-lib').cordova;
var platform_ios = rewire('../src/platform-ios');

describe('platform-ios', function() {

    describe('post_add method', function() {

        var post_add = platform_ios.__get__('post_add');

        beforeEach(function () {
            spyOn(cordova.raw, 'plugin');
        });

        it('should call cordova to add the appropriate plugins', function(done) {
            this.wrapper(post_add(), done, function() {
                expect(cordova.raw.plugin.calls.argsFor(0)[0]).toEqual('add');
                expect(cordova.raw.plugin.calls.argsFor(0)[1]).toContain('aemm-plugin-fullscreen-video');
                expect(cordova.raw.plugin.calls.argsFor(0)[1]).toContain('aemm-plugin-html-contract');
                expect(cordova.raw.plugin.calls.argsFor(0)[1]).toContain('aemm-plugin-inappbrowser');
                expect(cordova.raw.plugin.calls.argsFor(0)[1]).toContain('aemm-plugin-navto');
            });
        });
    });

});
