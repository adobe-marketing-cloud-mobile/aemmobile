# AEM Mobile

Command line tool for building AEM Mobile apps with Cordova content

## Operating System
* Mac OS X (iOS and Android)
* Windows (Android only)

## Prerequisites
Mac OS X:
* npm(v4.4.2 LTS is recommended) must be installed
* For iOS, Xcode(v7.0 or greater) must be installed
* For Android, Java must be installed:
  https://support.apple.com/downloads/java
* For Android, Chrome needs to be installed for debugging HTML content via chrome://inspect

Windows:
* Java SDK:
  http://www.oracle.com/technetwork/java/javase/downloads/index.html
* VisualStudio Community 2015:
  https://www.visualstudio.com/en-us/products/visual-studio-community-vs.aspx
* npm(v4.4.5 LTS is recommended):
  https://nodejs.org/en/
* Python 2.7:
  https://www.python.org/download/releases/2.7/
* Chrome needs to be installed for debugging HTML content via chrome://inspect

## Installation
You need npm installed to run the command line tool. On Windows, run commands in PowerShell instead of Command Prompt.

1.  Install npm:
    https://nodejs.org/en/
2.  Install aemm
	
~~~~
	npm install -g aemm
~~~~
	
if that doesn't work, do the following...

1.  Install npm
    https://nodejs.org/en/
2.  Get the app from the repo and then use npm install and link.

~~~~
	git clone https://github.com/adobe-marketing-cloud-mobile/aemmobile.git
	cd aemmobile
	npm -g install
	npm link
~~~~

For Android, you may see couple compilation errors related to node-gyp when running "npm install" on Mac OS X and Windows.
It's safe to ignore them. They don't affect the functionalities of this tool.

#### Usage

There are 2 types of workflow this tool is designed for:
* Developing custom HTML content.
* Developing custom application with custom plugins.

Commands for both workflows:

`aemm platform install <platform>`

    aemm platform install android
 
Accept several Android SDK license agreements. This installs and updates various Android SDKs, build tools and setup system environment for developing Android application.
You may need to open a new terminal to have the new system environment settings take effect.

`aemm project create [PROJECT_NAME or PATH]`

	aemm project create TestProject
	
	aemm project create /path/to/TestProject

You must run the following commands inside the directory created with `aemm project create [PROJECT_NAME or PATH]`.  

`aemm article create [articleName]`

	aemm article create Article1
	
	aemm article create Article1 Article2 Article3
 
 
###### 1. Developing custom HTML content
  
You must run the following commands inside the directory created with `aemm project create [PROJECT_NAME or PATH]`:

`aemm app install <platform>`

	aemm app install ios

	aemm app install android
	
	aemm app install --list
	
	aemm app install ios 2016.5

`aemm run [platform]`

	aemm run ios

	aemm run ios -- device

	aemm run android

	aemm run android --device

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

	aemm run ios --device

	aemm run android

	aemm run android --device

	aemm run ios --list
	
	aemm run ios --target "iPhone-6s, 9.2"

Note: The `run` command without the `--device` parameter will run the application in the emulator/simulator.

## NOTE

aemm was built on cordova and delegates many commands to cordova-lib. You may experience errors that recommend that you try to run a cordova command.
In most of such cases, please first try to replace cordova with aemm, then execute the recommended action.
