# AEM Mobile

Command line tool for building AEM Mobile apps with Cordova content

## Prerequisites
* npm(v4.1 or greater) must be installed
* Java must be installed for developing Android Application:
  https://support.apple.com/downloads/java
* On iOS, Xcode(v7.0 or greater) must be installed

## Operating System
* Mac OS X 

## Installation 

You need npm installed to run the command line tool

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



#### Usage

`aemm platform install <platform>`

    aemm platform install android
 
Accept several Android SDK license agreements.
 
`aemm app install <platform>`

	aemm app install ios

	aemm app install android
	
	aemm app install --list
	
	aemm app install ios 2016.3.0

`aemm project create [PROJECT_NAME or PATH]`

	aemm project create TestProject
	
	aemm project create /path/to/TestProject

For the following commands, must be inside folder created with `aemm project create [PROJECT_NAME or PATH]`.  

`aemm article create [articleName]`

	aemm article create Article1
	
	aemm article create Article1 Article2 Article3

`aemm run [platform]`

	aemm run ios
	
	aemm run android
	
	aemm run ios --list
	
	aemm run ios --target "iPhone-6s, 9.2"
