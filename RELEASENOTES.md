<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->
# aemm Release Notes

## 2.1.5 (Nov 27, 2018)

### Bug Fixes
* [Issue 71](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/71) Fix `IOS Sim Fails to load Sample Article `

## 2.1.2 (Feb 17, 2017)

### Bug Fixes
* [Issue 63](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/63) Fix `run ios --list`.
* [Issue 62](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/62) Fix `run ios --target`.
* [Issue 61](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/61) Fix `run ios --device`.

## 2.1.1 (Jan 31, 2017)

### Bug Fixes
* [Issue 58](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/58) Fix running Android app on device.
* [Issue 53](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/53) Better handling of an attempt to disable code signing.
* [Issue 49](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/49) Fix up config command.

## 2.1.0 (Oct 17, 2016)

### Features
* [Issue 33](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/33) Platforms at arbitrary git locations or local directories can now be added.
* [Issue 26](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/26) Grab the latest tagged release of platforms, allow user to declare a version.
* Notify users if a newer version of AEMM is available.
* Add --no-samples flag for creating projects without sample articles.
* Add continuous integration and code coverage.

### Bug Fixes
* [Issue 48](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/48) Allow args after '--' to be passed through.
* [Issue 45](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/45) Errors now instruct user to use `aemm help` instead of `cordova help`.
* [Issue 30](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/30) Improve messaging regarding Xcode's signing policy.
* [Issue 29](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/29) Errors now instruct user to use `aemm help` instead of `cordova help`.
* [Issue 28](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/28) Install core iOS plugins when platform is added.
* [Issue 21](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/21) Instruct user if they are using aemm commands on a non-aemm project.

## 2.0.1 (Jul 21, 2016)

### Bug Fixes
* [Issue 31](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/31) Require a minimum Node.js version of 6.2.2.

## 2.0.0 (Jul 18, 2016)

### Features
* Add plugin, platform [add/remove], build, and package commands.
* Add --device to the Android run command.
* Add Windows support for the Android platform.

### Bug Fixes
* [Issue 22](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/22) Check that CODE_SIGNING_REQUIRED is set to NO before build.
* [Issue 14](https://github.com/adobe-marketing-cloud-mobile/aemmobile/issues/14) Check if app URL exists before trying to use it.
