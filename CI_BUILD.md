# Cocos Creator 2.4.13 CI build

This repository contains the extracted Cocos Creator 2.4.13 frontend project only. The GitHub Actions workflow in `.github/workflows/build.yml` attempts Web Mobile, Android, and iOS builds on a macOS runner.

The source archive contained embedded credentials. Before upload, WeChat app secrets, license/crypto values, the unused JSAPI ticket, and the Creator XXTEA key were removed or blanked. JavaScript encryption is disabled for this trial build. These sanitized settings are for compilation testing only and are not a production-ready configuration; do not publish generated artifacts without restoring valid credentials through a secure deployment process and reviewing the encryption/signing setup.

The iOS workflow can generate an Xcode project and attempt an unsigned simulator build. It does not export a device-installable IPA because Apple signing certificates and provisioning profiles have not been configured.

Build artifacts are retained in the Actions run for seven days. The frontend configuration still points at local/private service URLs, so a successful build does not imply that login, licensing, backend APIs, or hot updates will work at runtime.
