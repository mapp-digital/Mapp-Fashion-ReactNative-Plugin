#!/bin/bash

echo "Cleaning React Native project caches..."

rm -rf \
  node_modules \
  yarn.lock \
  package-lock.json \
  android/.gradle \
  android/build \
  android/app/build \
  android/.idea \
  android/local.properties \
  ios/Pods \
  ios/build \
  ios/DerivedData \
  ios/.xcworkspace \
  example/node_modules \
  example/yarn.lock \
  example/package-lock.json \
  example/android/.gradle \
  example/android/build \
  example/android/app/build \
  example/android/.idea \
  example/android/local.properties \
  example/ios/Pods \
  example/ios/build \
  example/ios/DerivedData \
  example/ios/.xcworkspace

echo "Optionally removing global Xcode DerivedData..."
echo "To remove: rm -rf ~/Library/Developer/Xcode/DerivedData"

echo "✅ Cleanup complete."
