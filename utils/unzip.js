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
"use strict";

var Q = require('q');
var decompressZip = require('decompress-zip');

module.exports = function(zipFile, outputPath)
{
    var deferred = Q.defer();

    console.log("unzipping file: " + zipFile);

    var unzipper = new decompressZip(zipFile)

    unzipper.on('error', function (err) {
        console.log("unzip failed: " + err);
        deferred.reject(new Error("Failed to unzip file: " + zipFile));
    });

    unzipper.on('extract', function (log) {
        console.log("unzip completed.");
        deferred.resolve(outputPath);
    });

    unzipper.on('progress', function (fileIndex, fileCount) {
        // console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
    });

    unzipper.extract({
        path: outputPath
    });

    return deferred.promise;
}
