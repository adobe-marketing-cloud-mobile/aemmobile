#!/bin/sh

projectRoot=$1

# (1) prompt user, and read command line argument
read -p "Build and install application with default set of plugins(Y/N)? " answer

# (2) handle the command line argument we were given
while true
do
  case $answer in
   [yY]* ) break;;

   [nN]* ) exit;;
  esac
done

cd $projectRoot

if (! [ -d "./platforms/android" ]) ; then
    aemm platform add android@aar
fi

aemm plugin add cordova-plugin-device@1.1.2 cordova-plugin-globalization@1.0.3 cordova-plugin-file-transfer@1.5.1 cordova-plugin-media@2.3.0 cordova-plugin-contacts@2.1.0 cordova-plugin-vibration@2.1.1 cordova-plugin-device-motion@1.2.1 cordova-plugin-device-orientation@1.0.3 cordova-plugin-camera@2.2.0 cordova-plugin-dialogs@1.2.1 cordova-plugin-geolocation@2.2.0 cordova-plugin-file@4.2.0 cordova-plugin-network-information@1.2.1 cordova-plugin-device@1.1.2 cordova-plugin-globalization@1.0.3 cordova-plugin-file-transfer@1.5.1 cordova-plugin-media@2.3.0 cordova-plugin-contacts@2.1.0 cordova-plugin-vibration@2.1.1 cordova-plugin-device-motion@1.2.1 cordova-plugin-device-orientation@1.0.3 cordova-plugin-camera@2.2.0 cordova-plugin-dialogs@1.2.1 cordova-plugin-geolocation@2.2.0 cordova-plugin-file@4.2.0 cordova-plugin-network-information@1.2.1 https://github.com/sinzianag/cordova-plugin-media-capture#addAudioPermissions aemm-plugin-application@1.1.1 aemm-plugin-user@1.2.1 aemm-plugin-context@1.1.0 aemm-plugin-device@1.1.3

aemm build android
