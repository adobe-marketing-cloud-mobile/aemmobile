#!/bin/sh

projectRoot=$1

# (1) prompt user, and read command line argument
read -p "This will build application with default set of plugins and will affect projects' plugin list[Y/N]? " answer

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

aemm plugin add cordova-plugin-device cordova-plugin-globalization cordova-plugin-file-transfer cordova-plugin-media@ cordova-plugin-contacts cordova-plugin-vibration cordova-plugin-device-motion cordova-plugin-device-orientation cordova-plugin-camera cordova-plugin-dialogs cordova-plugin-geolocation cordova-plugin-file cordova-plugin-network-information cordova-plugin-device cordova-plugin-globalization cordova-plugin-file-transfer cordova-plugin-media cordova-plugin-contacts cordova-plugin-vibration cordova-plugin-device-motion cordova-plugin-device-orientation cordova-plugin-camera cordova-plugin-dialogs cordova-plugin-geolocation cordova-plugin-file cordova-plugin-network-information https://github.com/sinzianag/cordova-plugin-media-capture#addAudioPermissions aemm-plugin-application aemm-plugin-user aemm-plugin-context aemm-plugin-device

aemm build android
