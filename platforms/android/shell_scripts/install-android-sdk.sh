#!/bin/bash

###############################################################################
#    Copyright (c) 2016 Adobe Systems Incorporated. All rights reserved.
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
###############################################################################

cd ~
HOME_DIR=`pwd`

if [ -f "$HOME_DIR/Library/Android/sdk/tools/android" ]
then
    # Ensure the platform dir exists
    mkdir -p platforms/android >/dev/null 2>/dev/null
    # Create a symlink to the SDK directory
    ln -s "$HOME_DIR/Library/Android/sdk" platforms/android/sdk
    ANDROID="$HOME_DIR/Library/Android/sdk/tools/android"
elif [ -f "$HOME_DIR/platforms/android/sdk/tools/android" ]
then
    ANDROID="$HOME_DIR/platforms/android/sdk/tools/android"
elif [ ! "x$ANDROID_HOME" == "x" ]
then
    # Ensure the platform dir exists
    mkdir -p platforms/android >/dev/null 2>/dev/null
    # Create a symlink to the SDK directory
    ln -s ${ANDROID_HOME} platforms/android/sdk
    ANDROID="$ANDROID_HOME/tools/android"
else
    # Ensure the tmp directory exists
    mkdir tmp >/dev/null 2>/dev/null

    # Ensure the Android platform directory exists
    mkdir -p platforms/android >/dev/null 2>/dev/null

    SDK_VERSION="r24.4.1"
    echo "Downloading $SDK_VERSION SDK..."
    # Download the SDK Tools
    if [ "$(uname)" == "Darwin" ]
    then
        curl -o tmp/sdk.zip "http://dl.google.com/android/android-sdk_$SDK_VERSION-macosx.zip" >/dev/null 2>/dev/null
        unzip tmp/sdk.zip -d tmp
        mv tmp/android-sdk-macosx platforms/android/sdk
    elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]
    then
        wget -O tmp/sdk.tgz "http://dl.google.com/android/android-sdk_$SDK_VERSION-linux.tgz" >/dev/null 2>/dev/null
        tar xvzf tmp/sdk.tgz tmp
        mv tmp/android-sdk-linux platforms/android/sdk
    fi
    ANDROID="$HOME_DIR/platforms/android/sdk/tools/android"
fi
