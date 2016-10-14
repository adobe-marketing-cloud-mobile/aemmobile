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
var path = require('path');
var rewire = require('rewire');
var jsonfile = require('jsonfile');
var events = require('cordova-lib').events;
var config = rewire('../src/config');
var project = require('../src/project');

var cwd = process.cwd();

describe('config', function() {

    var fileResets = [];
    var getConfigFileReset;
    var getPathToProjectConfigReset;

    beforeEach(function() {
        fileResets.push(config.__set__('configFile', null));
        fileResets.push(config.__set__('pathToProjectConfig', null));
        
        getConfigFileReset = config.__set__('getConfigFile', function() {
            return Q({ 'fakeKey' : 'fakeValue' });
        });

        getPathToProjectConfigReset = config.__set__('getPathToProjectConfig', function() {
            return Q(path.resolve('/fake/path/to/project/'));
        });

        fileResets.push(getConfigFileReset, getPathToProjectConfigReset);
    });

    afterEach(function () {
        fileResets.forEach(function(func) {
            func();
        });
        fileResets = [];
    });

    describe('config method', function() {
        var configFn = config.__get__('config');
        
        beforeEach(function() {
            spyOn(events, 'emit');
        });

        describe('list', function() {
            var opts = {
                'options' : {
                    'list' : true
                }
            };

            it('should log the contents of the config file', function(done) {
                this.wrapper(configFn(opts), done, function() {
                    expect(events.emit.calls.argsFor(0)[0]).toEqual('log');
                    expect(events.emit.calls.argsFor(0)[1]).toEqual({ 'fakeKey' : 'fakeValue' });
                });
            });

            it('should throw if there is no config file.', function(done) {
                fileResets.push(config.__set__('getConfigFile', function() {
                    return Q(null);
                }));
                
                this.wrapperError(configFn(opts), 'No valid config file found.', done, function() { });
            });
        });

        describe('get', function() {
            var opts = {
                'options' : {
                    'get' : 'foo'
                }
            };

            beforeEach(function() {
                fileResets.push(config.__set__('getValueFromConfig', function() {
                    return Q('fake value from config');
                }));
            });

            it('should return a value from the config file', function(done) {
                this.wrapper(configFn(opts), done, function() {
                    expect(events.emit.calls.argsFor(0)[0]).toEqual('log');
                    expect(events.emit.calls.argsFor(0)[1]).toEqual('fake value from config');
                });
            });
        });

        describe('set', function() {
            var opts = {
                'options' : {
                    'argv' : ['the value to set'],
                    'set' : 'the key to set'
                }
            };
            var setSpy = jasmine.createSpy('setSpy');

            beforeEach(function() {
                fileResets.push(config.__set__('setValueInConfig', setSpy));
            });

            afterEach(function() {
                setSpy.calls.reset();
            });

            it('should set the value in the config', function(done) {
                this.wrapper(configFn(opts), done, function() {
                    expect(setSpy.calls.mostRecent().args[0]).toEqual('the key to set');
                    expect(setSpy.calls.mostRecent().args[1][0]).toEqual('the value to set');
                });
            });
        });

        describe('unset', function() {
            var opts = {
                'options' : {
                    'unset' : 'the key to unset'
                }
            };

            var removeSpy = jasmine.createSpy('removeSpy');
            
            beforeEach(function() {
                fileResets.push(config.__set__('removeKeyFromConfig', removeSpy));
            });

            afterEach(function() {
                removeSpy.calls.reset();
            });

            it('should unset the value in the config', function(done) {
                this.wrapper(configFn(opts), done, function() {
                    expect(removeSpy.calls.mostRecent().args[0]).toEqual('the key to unset');
                });
            });
        });

        describe('with no flags', function() {
            it('should throw an error', function(done) {
                var errMsg = 'Unrecognized command. See `aemm help config` for correct usage.';
                this.wrapperError(configFn(), errMsg, done, function() {});
            });
        });
    });

    describe('getValueFromConfig method', function() {
        var getValueFromConfig = config.__get__('getValueFromConfig');

        it('should get the correct value when given a key', function(done) {
            this.wrapper(getValueFromConfig('fakeKey'), done, function(retVal) {
                expect(retVal).toEqual('fakeValue');
            });
        });
    });

    describe('setValueInConfig method', function() {
        var setValueInConfig = config.__get__('setValueInConfig');

        it('should write the new setting to file.', function(done) { 
            spyOn(jsonfile, 'writeFileSync');
            this.wrapper(setValueInConfig('fakeKeyToSet', 'fakeValToSet'), done, function() {
                expect(jsonfile.writeFileSync.calls.argsFor(0)[0]).toEqual(path.resolve('/fake/path/to/project/'));
                expect(jsonfile.writeFileSync.calls.argsFor(0)[1].fakeKey).toEqual('fakeValue');
                expect(jsonfile.writeFileSync.calls.argsFor(0)[1].fakeKeyToSet).toEqual('fakeValToSet');
            });
        });
    });

    describe('removeKeyFromConfig method', function() {
        var removeKeyFromConfig = config.__get__('removeKeyFromConfig');

        it('should delete the key and value from the file.', function(done) {
            spyOn(jsonfile, 'writeFileSync');
            this.wrapper(removeKeyFromConfig('fakeKey'), done, function() {
                expect(jsonfile.writeFileSync.calls.argsFor(0)[0]).toEqual(path.resolve('/fake/path/to/project/'));
                expect(jsonfile.writeFileSync.calls.argsFor(0)[1]).toEqual({});
            });
        });
    });

    describe('getPathToProjectConfig method', function() {
        beforeEach(function() {
            var indexOfReset = fileResets.indexOf(getPathToProjectConfigReset);
            fileResets.splice(indexOfReset, indexOfReset + 1);
            getPathToProjectConfigReset();
        });
        
        var getPathToProjectConfig = config.__get__('getPathToProjectConfig');

        it('should return the path of the config file, if one is not cached already.', function(done) {
            fileResets.push(config.__set__('pathToProjectConfig', null));
            spyOn(project, 'projectRootPath').and.returnValue(Q(path.resolve('/path/to/project/config')));
            this.wrapper(getPathToProjectConfig(), done, function(retVal) {
                expect(retVal).toEqual(path.resolve('/path/to/project/config/config.json'));
            });
        });

        it('should return the cached path of the config file.', function(done) {
            fileResets.push(config.__set__('pathToProjectConfig', path.resolve('/cached/path/to/config.json')));
            spyOn(project, 'projectRootPath').and.returnValue(Q(path.resolve('/path/to/project/config')));
            this.wrapper(getPathToProjectConfig(), done, function(retVal) {
                expect(retVal).toEqual(path.resolve('/cached/path/to/config.json'));
                expect(project.projectRootPath).not.toHaveBeenCalled();
            });
        });
    });

    describe('getConfigFile method', function() {
        beforeEach(function() {
            var indexOfConfigReset = fileResets.indexOf(getConfigFileReset);
            fileResets.splice(indexOfConfigReset, indexOfConfigReset + 1);
            getConfigFileReset();
        });
        
        var getConfigFile = config.__get__('getConfigFile');

        it('should return an empty object if no file is present', function(done) {
            this.wrapper(getConfigFile(), done, function(retVal) {
                expect(retVal).toEqual({});
            });
        });

        it('should return the file contents if there is a config file', function(done) {
            var indexOfProjectPathReset = fileResets.indexOf(getPathToProjectConfigReset);
            fileResets.splice(indexOfProjectPathReset, indexOfProjectPathReset + 1);
            getPathToProjectConfigReset();
            fileResets.push(config.__set__('getPathToProjectConfig', function() {
                return Q(path.join(cwd,'spec/testfiles/fake-config.json'));
            }));

            this.wrapper(getConfigFile(), done, function(retVal) {
                expect(retVal.name).toEqual("My Fake Config File");
                expect(retVal.test).toBe(true);
            });
        });

        it('should return the file contents if there is a cached config file', function(done) {
            var fileObj = {
                'name' : 'cached file',
                'test' : true
            };
            fileResets.push(config.__set__("configFile", fileObj));

            this.wrapper(getConfigFile(), done, function(retVal) {
                expect(retVal.name).toEqual("cached file");
                expect(retVal.test).toBe(true);
            });
        });

        it('should throw if we get an error other than MODULE_NOT_FOUND', function(done) {
            fileResets.push(config.__set__('require', function() {
                throw Error("Some other error");
            }));

            this.wrapperError(getConfigFile(), "Some other error", done, function() {});
        });
    });
});