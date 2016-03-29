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
emulator_name="AEMM_Tablet"

$HOME_DIR/platforms/android/sdk/tools/android list avd | grep $emulator_name &> /dev/null
if [ $? == 0 ]; then
    $HOME_DIR/platforms/android/sdk/tools/android delete avd -n $emulator_name
fi
echo "no" | $HOME_DIR/platforms/android/sdk/tools/android create avd --force -n $emulator_name --device "Nexus 7" -t "android-23" --abi default/x86_64 --skin "Nexus-7" --sdcard 1024M
