# Cocos Creator 2.4.13 Android APK CI build

This repository contains the extracted Cocos Creator 2.4.13 frontend project only. The manually triggered GitHub Actions workflow attempts to build an Android debug APK; it does not build Web or iOS.

The source archive contained embedded credentials. Before upload, WeChat app secrets, license/crypto values, the unused JSAPI ticket, and the Creator XXTEA key were removed or blanked. JavaScript encryption is disabled for this trial build. These sanitized settings are for compilation testing only and are not production-ready; do not distribute generated artifacts without restoring valid credentials securely and reviewing encryption and signing settings.

The Android artifact, if the build succeeds, is an unsigned/debug APK suitable for testing, not a release-signed package. The workflow retains APKs and diagnostic logs for seven days. The frontend configuration still points at private service URLs, so a successful APK build does not imply that login, licensing, backend APIs, or hot updates will work at runtime.
