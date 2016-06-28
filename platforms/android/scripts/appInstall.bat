@echo off

REM (1) prompt user, and read command line argument
:choice
set /P answer=This will build application with default set of plugins and will affect projects' plugin list[Y/N]?

REM (2) handle the command line argument we were given
if /I "%answer%" EQU "Y" goto :yes
if /I "%answer%" EQU "N" goto :no

:yes
cd %1

if exist "./platforms/android" goto build

call aemm platform add android@aar
goto build

:build
call aemm plugin add cordova-plugin-device cordova-plugin-globalization cordova-plugin-file-transfer cordova-plugin-media@ cordova-plugin-contacts cordova-plugin-vibration cordova-plugin-device-motion cordova-plugin-device-orientation cordova-plugin-camera cordova-plugin-dialogs cordova-plugin-geolocation cordova-plugin-file cordova-plugin-network-information cordova-plugin-device cordova-plugin-globalization cordova-plugin-file-transfer cordova-plugin-media cordova-plugin-contacts cordova-plugin-vibration cordova-plugin-device-motion cordova-plugin-device-orientation cordova-plugin-camera cordova-plugin-dialogs cordova-plugin-geolocation cordova-plugin-file cordova-plugin-network-information https://github.com/sinzianag/cordova-plugin-media-capture#addAudioPermissions aemm-plugin-application aemm-plugin-user aemm-plugin-context aemm-plugin-device
call aemm build android
exit

:no
exit
