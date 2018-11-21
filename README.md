[![Build status](https://ci.appveyor.com/api/projects/status/mc3stvfqt98mmlnk/branch/master?svg=true)](https://ci.appveyor.com/project/adzellman/aemmobile-ju6lf)
[![Build Status](https://travis-ci.org/adobe-marketing-cloud-mobile/aemmobile.svg?branch=master)](https://travis-ci.org/adobe-marketing-cloud-mobile/aemmobile)
[![codecov.io](https://codecov.io/github/adobe-marketing-cloud-mobile/aemmobile/coverage.svg?branch=master)](https://codecov.io/github/adobe-marketing-cloud-mobile/aemmobile?branch=master)
[![bitHound Overall Score](https://www.bithound.io/github/adobe-marketing-cloud-mobile/aemmobile/badges/score.svg)](https://www.bithound.io/github/adobe-marketing-cloud-mobile/aemmobile)
[![NPM](https://nodei.co/npm/aemm.png)](https://nodei.co/npm/aemm/)

# AEM Mobile

Command line tool for building AEM Mobile apps with Cordova content

## Operating System
* Mac OS X (iOS and Android)
* Windows (Android only)

## Prerequisites
Mac OS X:
* node (v6.2.2 or greater) must be installed
* For iOS, Xcode(v7.0 or greater) must be installed
* For Android, Java must be installed:
  https://support.apple.com/downloads/java
* For Android, Chrome needs to be installed for debugging HTML content via chrome://inspect

Windows:
* Java SDK:
  http://www.oracle.com/technetwork/java/javase/downloads/index.html
* VisualStudio Community 2015:
  https://www.visualstudio.com/en-us/products/visual-studio-community-vs.aspx
* node (v6.2.2 or greater):
  https://nodejs.org/en/
* Python 2.7:
  https://www.python.org/download/releases/2.7/
* Chrome needs to be installed for debugging HTML content via chrome://inspect

## Installation
You need npm installed to run the command line tool. On Windows, run commands in PowerShell instead of Command Prompt.

1.  Install npm:
    https://nodejs.org/en/
2.  Install aemm:
	
~~~~
	sudo npm install -g aemm
~~~~
	
If that doesn't work, do the following...

1.  Install npm
    https://nodejs.org/en/
2.  Get the app from the repo and then use npm install and link.

~~~~
	git clone https://github.com/adobe-marketing-cloud-mobile/aemmobile.git
	cd aemmobile
	sudo npm -g install
	sudo npm link
~~~~

For Android, you may see a couple compilation errors related to node-gyp when running "npm install" on Mac OS X and Windows.
It's safe to ignore them. They don't affect the functionalities of this tool.

If the installation fails due to errors with a specific module, troubleshoot by clearing your npm cache and reinstalling.  

~~~~
	sudo npm remove -g aemm
	sudo npm cache clean
	sudo npm install -g aemm
~~~~

This will resolve current issues with the npm async module.


#### Usage

There are 2 types of workflow this tool is designed for:
* Developing custom HTML content.
* Developing custom application with custom plugins.

##### SUDO NOTE
> Command samples below are not always proceeded with **sudo**.  Some commands on MAC will fail without it.  For instance, permissions may not be available to set temporary and necessary environment variables.  If you encounter errors, try using **sudo** before the command.

Commands for both workflows:

`aemm platform install <platform>`

    sudo aemm platform install android
 
Accept several Android SDK license agreements. This installs and updates various Android SDKs, build tools and setup system environment for developing Android application.
You may need to open a new terminal to have the new system environment settings take effect.

	sudo aemm platform install ios

`aemm project create [PROJECT_NAME or PATH]`

	aemm project create TestProject
	
	aemm project create /path/to/TestProject

You must run the following commands inside the directory created with `aemm project create [PROJECT_NAME or PATH]`.  

`aemm article create [articleName]`

	aemm article create Article1
	
	aemm article create Article1 Article2 Article3
 
 
###### 1. Developing custom HTML content

`aemm app install <platform>`

	aemm app install ios

	aemm app install android
	
	aemm app install --list
	
	aemm app install ios 2016.5

You must run the following commands inside the directory created with `aemm project create [PROJECT_NAME or PATH]`:

`aemm run [platform]`

	aemm run ios

	aemm run android

	aemm run ios --list
	
	aemm run ios --target "iPhone-6s, 9.2"
	
Note: The `run` command without the `--device` parameter will run the application in the emulator/simulator.


###### 2. Developing custom application with custom plugins.

You must run the following commands inside the directory created with `aemm project create [PROJECT_NAME or PATH]`.

Add the platforms you want to target your application for:

`aemm platform add [platform]`

	aemm platform add android
	
	aemm platform add ios

Add the plugins you want to be included in your application:

`aemm plugin add [plugin_0] [plugin_1] [...]`

	aemm plugin add cordova-plugin-device cordova-plugin-contacts


`aemm build [platform]`

	aemm build android
	
	aemm build ios --device

Note: the `--device` parameter for the `build` command is for ios only.
	
`aemm run [platform]`

	aemm run ios

	aemm run android

	aemm run android --device

	aemm run ios --list
	
	aemm run ios --target "iPhone-6s, 9.2"

Note: The `run` command without the `--device` parameter will run the application in the emulator/simulator.

## NOTE

aemm was built on cordova and delegates many commands to cordova-lib. You may experience errors that recommend that you try to run a cordova command.
In most of such cases, please first try to replace cordova with aemm, then execute the recommended action.
