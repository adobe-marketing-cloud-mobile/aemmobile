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
var plugin = rewire('../src/plugin');
var project = require('../src/project');

describe('plugin', function() {

    describe('plugin method', function() {

        var pluginFn = plugin.__get__('plugin');
        
        beforeEach(function () {
            spyOn(project, 'projectRootPath').and.returnValue(Q('/my/fake/dir/'));
        });

        it('should pass the command through to cordova', function(done) {
            spyOn(cordova.raw, 'plugin');
            this.wrapper(pluginFn('fakeSubCommand', ['plugin1', 'plugin2']), done, function() {
                expect(cordova.raw.plugin.calls.argsFor(0)[0]).toEqual('fakeSubCommand');
                expect(cordova.raw.plugin.calls.argsFor(0)[1][0]).toEqual('plugin1');
                expect(cordova.raw.plugin.calls.argsFor(0)[1][1]).toEqual('plugin2');
            });
        });

        it('should throw when there is an error', function(done) {
            spyOn(cordova.raw, 'plugin').and.callFake(function() {
                throw new Error("cordova plugin error");
            });

            this.wrapperError(pluginFn(), "cordova plugin error", done, function() {});
        });

    });

});