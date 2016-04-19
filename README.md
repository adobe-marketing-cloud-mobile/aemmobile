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
* For Android, Chrome needs to be installed for debugging via chrome://inspect

Windows:
* Java:
  https://java.com/en/download/manual.jsp
* VisualStudio Community 2015:
  https://www.visualstudio.com/en-us/products/visual-studio-community-vs.aspx
* npm(v4.4.2 LTS is recommended):
  https://nodejs.org/en/
* Python 2.7:
  https://www.python.org/download/releases/2.7/
* Chrome for debugging via chrome://inspect

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

`aemm platform install <platform>`

    aemm platform install android
 
Accept several Android SDK license agreements.
 
`aemm app install <platform>`

	aemm app install ios

	aemm app install android
	
	aemm app install --list
	
	aemm app install ios 2016.5

`aemm project create [PROJECT_NAME or PATH]`

	aemm project create TestProject
	
	aemm project create /path/to/TestProject

You must run the following commands inside the directory created with `aemm project create [PROJECT_NAME or PATH]`.  

`aemm article create [articleName]`

	aemm article create Article1
	
	aemm article create Article1 Article2 Article3

`aemm run [platform]`

	aemm run ios
	
	aemm run android
	
	aemm run ios --list
	
	aemm run ios --target "iPhone-6s, 9.2"
