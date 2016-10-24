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
var cordova_lib = require('../lib/cordova').lib;
var cordova = cordova_lib.cordova;
var events = cordova_lib.events;
var platform_ios = rewire('../src/platform-ios');

describe('platform-ios', function() {

    var fileResets = [];

	afterEach(function () {
        fileResets.forEach(function(func) {
            func();
        });
        fileResets = [];
    });

    describe('install method', function() {

        var install = platform_ios.__get__('install');

        it('should warn the user if Xcode is not installed', function(done) {
            var execSpy = jasmine.createSpy('execSpy').and.callFake(function() {
                return Q.reject(new Error("fake error, no xcode present."));
            });

            fileResets.push(platform_ios.__set__('exec', execSpy));

            this.wrapperError(install(), done, function(err) {
                expect(err.message).toEqual("You must install Xcode to run in the simulator.  You can get it from the Mac App Store.");
            });
        });

        it('should disable code signing, then exit successfully', function(done) {
            var execSpy = jasmine.createSpy('execSpy').and.returnValue(Q());
            var disableSpy = jasmine.createSpy('disableSpy').and.returnValue(Q());
            fileResets.push(platform_ios.__set__('exec', execSpy));
            fileResets.push(platform_ios.__set__('disableCodeSigning', disableSpy));

            spyOn(events, 'emit');

            this.wrapper(install(), done, function() {
                expect(execSpy).toHaveBeenCalled();
                expect(disableSpy).toHaveBeenCalled();
                expect(events.emit.calls.argsFor(0)[0]).toEquals('log');
                expect(events.emit.calls.argsFor(0)[1]).toEqual('The ios platform is ready to use.');
            });
        });
    });

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

    describe('disableCodeSigning method', function() {
        var disableCodeSigning = platform_ios.__get__('disableCodeSigning');
        var settingsSpy = jasmine.createSpy('settingsSpy').and.returnValue(Q());

        beforeEach(function() {
            fileResets.push(platform_ios.__set__('loadSdkSettingsPlist', settingsSpy));

            spyOn(events, 'emit');
        });

        it('should do nothing if code signing is diabled', function(done) {
            var checkSpy = jasmine.createSpy('checkSpy').and.returnValue(Q(true));
            var changeSpy = jasmine.createSpy('changeSpy').and.returnValue(Q());
            fileResets.push(platform_ios.__set__('isCodeSigningDisabled', checkSpy));
            fileResets.push(platform_ios.__set__('changeCodeSigningPolicy', changeSpy));
            
            this.wrapper(disableCodeSigning(), done, function() {
                expect(checkSpy).toHaveBeenCalled();
                expect(changeSpy).not.toHaveBeenCalled();
                expect(events.emit).not.toHaveBeenCalled();
            });
        });

        it('should error if plist does not change', function(done) {
            var checkSpy = jasmine.createSpy('checkSpy').and.returnValue(Q(false));
            var changeSpy = jasmine.createSpy('changeSpy').and.returnValue(Q.reject());
            fileResets.push(platform_ios.__set__('isCodeSigningDisabled', checkSpy));
            fileResets.push(platform_ios.__set__('changeCodeSigningPolicy', changeSpy));

            this.wrapperError(disableCodeSigning(), done, function(err) {
                expect(checkSpy).toHaveBeenCalled();
                expect(changeSpy).toHaveBeenCalled();
                expect(events.emit.calls.argsFor(0)[0]).toEqual('warn');
                expect(events.emit.calls.argsFor(0)[1]).toEqual('aemm tried to fix your code signing properties in Xcode, but was unable to.');
                expect(events.emit.calls.argsFor(1)[0]).toEqual('warn');
                expect(events.emit.calls.argsFor(1)[1]).toEqual('Please run the following command:');
                expect(events.emit.calls.argsFor(2)[0]).toEqual('warn');
                expect(events.emit.calls.argsFor(2)[1]).toEqual('sudo /usr/libexec/PlistBuddy -c "Set DefaultProperties:CODE_SIGNING_REQUIRED NO" "$(xcode-select -p)/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/SDKSettings.plist"');
                expect(err.message).toEqual("Changing code signing policy failed. Please see the message above.");
            });
        });

        it('should change the plist, then exit normally', function(done) {
            var checkSpy = jasmine.createSpy('checkSpy').and.returnValues(Q(false), Q(true));
            var changeSpy = jasmine.createSpy('changeSpy').and.returnValue(Q());
            fileResets.push(platform_ios.__set__('isCodeSigningDisabled', checkSpy));
            fileResets.push(platform_ios.__set__('changeCodeSigningPolicy', changeSpy));

            this.wrapper(disableCodeSigning(), done, function() {
                expect(checkSpy).toHaveBeenCalled();
                expect(changeSpy).toHaveBeenCalled();
                expect(events.emit).not.toHaveBeenCalled();
            });
        });
    });

    describe('isCodeSigningDisabled method', function() {
        var isCodeSigningDisabled = platform_ios.__get__('isCodeSigningDisabled');
        var settingsSpy = jasmine.createSpy('settingsSpy').and.returnValue(Q());

        beforeEach(function() {
            fileResets.push(platform_ios.__set__('loadSdkSettingsPlist', settingsSpy));
        });

        it('should return false if CODE_SIGNING_REQUIRED is YES', function(done) {
            var execSpy = jasmine.createSpy('execSpy').and.callFake(function() {
                return Q({ 'stdout' : 'YES' });
            });

            fileResets.push(platform_ios.__set__('exec', execSpy));

            this.wrapper(isCodeSigningDisabled(), done, function(val) {
                expect(val).toEqual(false);
            });
        });

        it('should return true if CODE_SIGNING_REQUIRED is NO', function(done) {
            var execSpy = jasmine.createSpy('execSpy').and.callFake(function() {
                return Q({ 'stdout' : 'NO' });
            });

            fileResets.push(platform_ios.__set__('exec', execSpy));

            this.wrapper(isCodeSigningDisabled(), done, function(val) {
                expect(val).toEqual(true);
            });
        });
    });

    describe('changeCodeSigningPolicy method', function() {
        var changeCodeSigningPolicy = platform_ios.__get__('changeCodeSigningPolicy');

        beforeEach(function() {
            spyOn(events, 'emit');

            var settingsSpy = jasmine.createSpy('settingsSpy').and.returnValue(Q());
            fileResets.push(platform_ios.__set__('loadSdkSettingsPlist', settingsSpy));
        });

        it('should error out if the command fails to execute', function(done) {
            var execSpy = jasmine.createSpy('execSpy').and.callFake( function() {
                return Q.reject(new Error("My execution error."));
            });
            var disabledSpy = jasmine.createSpy('disabledSpy').and.returnValue(Q(false));
            fileResets.push(platform_ios.__set__('isCodeSigningDisabled', disabledSpy));

            fileResets.push(platform_ios.__set__('exec', execSpy));

            this.wrapperError(changeCodeSigningPolicy('NO'), done, function(err) {
                expect(err.message).toEqual("My execution error.");
            });
        });

        it('should post a message if the plist is not changed because the desired change is unnecessary.', function(done) {
            var execSpy = jasmine.createSpy('execSpy').and.returnValue(Q());
            var disabledSpy = jasmine.createSpy('disabledSpy').and.returnValue(Q(false));
            fileResets.push(platform_ios.__set__('exec', execSpy));
            fileResets.push(platform_ios.__set__('isCodeSigningDisabled', disabledSpy));

            this.wrapper(changeCodeSigningPolicy('YES'), done, function() {
                expect(events.emit.calls.argsFor(0)[0]).toEqual('verbose');
                expect(events.emit.calls.argsFor(0)[1]).toEqual('CODE_SIGNING_REQUIRED was already set to the desired value.');
                expect(execSpy).not.toHaveBeenCalled();
            });
        });

        it('should exit normally after changing the policy to NO', function(done) {
            var execSpy = jasmine.createSpy('execSpy').and.returnValue(Q());
            var disabledSpy = jasmine.createSpy('disabledSpy').and.returnValues(Q(false), Q(true));
            fileResets.push(platform_ios.__set__('exec', execSpy));
            fileResets.push(platform_ios.__set__('isCodeSigningDisabled', disabledSpy));
            
            this.wrapper(changeCodeSigningPolicy('NO'), done, function() {
                expect(events.emit.calls.argsFor(0)[0]).toEqual('info');
                expect(events.emit.calls.argsFor(0)[1]).toEqual('aemm requires Xcode to allow building unsigned frameworks.');
                expect(events.emit.calls.argsFor(1)[0]).toEqual('info');
                expect(events.emit.calls.argsFor(1)[1]).toEqual('sudo may prompt you for your password to change the Xcode code signing policy.');
                expect(execSpy).toHaveBeenCalled();
            });
        });

        it('should throw an error if aemm cannot change the code sign policy', function(done) {
            var execSpy = jasmine.createSpy('execSpy').and.returnValue(Q());
            var disabledSpy = jasmine.createSpy('disabledSpy').and.returnValues(Q(false), Q(false));
            fileResets.push(platform_ios.__set__('exec', execSpy));
            fileResets.push(platform_ios.__set__('isCodeSigningDisabled', disabledSpy));

            this.wrapperError(changeCodeSigningPolicy('NO'), done, function(err) {
                expect(err.message).toEqual('aemm was unable to change the Xcode code signing policy.');
            });
        });
    });

    describe('loadSdkSettingsPlist method', function() {
        var loadSdkSettingsPlist = platform_ios.__get__('loadSdkSettingsPlist');

        it('should return if there is already a settingsPlist', function(done) {
            fileResets.push(platform_ios.__set__('settingsPlist', 'My settingsPlist'));

            this.wrapper(loadSdkSettingsPlist(), done, function() {});
        });

        it('should set the settingsPlist if there is not already one', function(done) {
            var execResult = {
                'stdout' : path.resolve('/test/')
            };
            var execSpy = jasmine.createSpy('execSpy').and.returnValue(Q(execResult));
            fileResets.push(platform_ios.__set__('exec', execSpy));

            this.wrapper(loadSdkSettingsPlist(), done, function() {
                var fullResultPath = path.join('/test', 'Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/SDKSettings.plist');

                expect(execSpy.calls.argsFor(0)[0]).toEqual('xcode-select -p');
                expect(platform_ios.__get__('settingsPlist')).toEqual(fullResultPath);
            });
        });
    });
});
