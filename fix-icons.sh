#!/bin/bash
for res in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  mkdir -p android/app/src/main/res/mipmap-${res}
  cp app-icons/mipmap-${res}.png android/app/src/main/res/mipmap-${res}/ic_launcher.png
  cp app-icons/mipmap-${res}.png android/app/src/main/res/mipmap-${res}/ic_launcher_round.png
  cp app-icons/mipmap-${res}.png android/app/src/main/res/mipmap-${res}/ic_launcher_foreground.png
done

# Remove adaptive icon XML that overrides our PNG
find android/app/src/main/res -name "ic_launcher.xml" -delete
find android/app/src/main/res -name "ic_launcher_round.xml" -delete
