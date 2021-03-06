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

beforeEach(function() {
    this.wrapper = function (p, done, post) {
        p.then(post, function(err) {
            expect(err.stack).toBeUndefined();
        }).fin(done);
    };

    this.wrapperError = function (p, done, post) {
        p.then(function() {
            fail("Expected an error to be thrown, but there was none.");
        }, function(err) {
            expect(err).toBeDefined();
            expect(err.stack).toBeDefined();
            return post(err);
        }).fin(done);
    };
});
