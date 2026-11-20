const NativeUtil = require('../../utils/NativeUtil');
const AssetsManager = require('../../utils/AssetsManager');
const AudioUtil = require('../../utils/AudioUtil');
const NetworkLogic = require('../../utils/NetworkLogic');
const Enums = require('../../const/Enums');
const LoginManager = require('../../utils/LoginManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const NetworkManager = require('../../utils/NetworkManager');
const ABManager = require('../../utils/ABManager');
const Utils = require('../../utils/Utils');
const Events = require('../../const/Events');
const ClickManager = require('../../utils/ClickManager');
const SubManager = require('../../utils/SubManager');
const NodePoolManager = require('../../utils/NodePoolManager');
const CacheManager = require('../../utils/CacheManager');

cc.Class({
    extends: cc.Component,

    properties: {
        mainUpdateCtrl: require('MainUpdateCtrl'),
        resources: cc.Asset,
        links: cc.Asset,
    },

    onLoad() {
        cc.systemEvent.on(Events.clientEvents.onHotUpdateDone, this._licenseCheck, this);
        cc.systemEvent.on(Events.clientEvents.onBundleVersionReq, this._onBundleFinished, this);
        cc.systemEvent.on(Events.clientEvents.onBundlePreviewFinished, this._onBundleFinished, this);
    },

    start() {
        NodePoolManager.clear();
        CacheManager.init();
        AssetsManager.init(this.node);
        ConfigModel.init();
        ClickManager.init();
        NativeUtil.init();
        AudioUtil.init();
        NetworkLogic.init();
        ABManager.init(this);
        NativeUtil.hideSplash();
        AssetsManager.loadAsset({
            path: 'json/configs',
            aType: cc.JsonAsset
        }, (asset) => {
            if (!asset) return;
            ConfigModel.setDatas(asset.json);
            this._updateCheck();
        });
    },

    _licenseCheck() {
        if (!!cc.sys.isBrowser) {
            let params = {
                license: ConfigModel.getAuthKey('licenseVal')
            }
            ConfigModel.checkLicense(params);
            this._onBundleFinished();
            return;
        }
        NetworkManager.httpRequest({
            url: ConfigModel.getUrl('license'),
            data: {},
            cb: (res) => {
                ConfigModel.checkLicense(res);
                ABManager.versionInfoReqs();
            }
        });
    },

    onDestroy() {
        ConfigModel.setData('lastScene', 'start');
        cc.systemEvent.off(Events.clientEvents.onHotUpdateDone, this._licenseCheck, this);
        cc.systemEvent.off(Events.clientEvents.onBundleVersionReq, this._onBundleFinished, this);
        cc.systemEvent.off(Events.clientEvents.onBundlePreviewFinished, this._onBundleFinished, this);
        AssetsManager.release();
    },

    _updateCheck() {
        if (!!this.mainUpdateCtrl) {
            this.mainUpdateCtrl.init();
        } else {
            this._licenseCheck();
        }
    },
    _appCheck() {
        if (cc.sys.isBrowser) return false;
        let iosVersion = ConfigModel.getData('iosVersion');
        let iosDownloadUrl = ConfigModel.getData('iosDownloadUrl');
        let androidVersion = ConfigModel.getData('androidVersion');
        let androidDownloadUrl = ConfigModel.getData('androidDownloadUrl');
        let remoteVersion = cc.sys.os == cc.sys.OS_IOS ? iosVersion : androidVersion;
        let downloadUrl = cc.sys.os == cc.sys.OS_IOS ? iosDownloadUrl : androidDownloadUrl;
        let localVersion = NativeUtil.getAppVersion();
        remoteVersion = remoteVersion || localVersion;
        let remoteArray = remoteVersion.split('.');
        let localArray = localVersion.split('.');
        let needUpdate = false;
        if (remoteArray.length > localArray.length) {
            needUpdate = true;
        } else {
            for (let index = 0; index < remoteArray.length; index++) {
                if (remoteArray[index] != localArray[index]) {
                    needUpdate = true;
                    break;
                }
            }
        }
        let expired = ConfigModel.getData('expired');
        expired = (cc.sys.os != cc.sys.OS_IOS && cc.sys.os != cc.sys.OS_ANDROID);
        if (!!expired || !needUpdate) return false;
        AssetsManager.popDialog({
            content: `检测到新版本 ${remoteVersion} ,请先下载更新！`,
            ok: () => {
                NativeUtil.openUrl(downloadUrl);
                cc.game.end();
            }
        });
        return true;
    },

    //登录游戏
    _onBundleFinished() {
        let popId = ConfigModel.getSkin(Enums.bundleType.POP);
        let hallId = ConfigModel.getSkin(Enums.bundleType.HALL);
        let isPopDownload = SubManager.checkLoad(popId);
        let popNeedUpdate = ABManager.checkUpdate(popId);
        let isHallDownload = SubManager.checkLoad(hallId);
        let hallNeedUpdate = ABManager.checkUpdate(hallId);
        let skinId = null;
        if (!isPopDownload || !!popNeedUpdate) {
            skinId = popId;
        } else if (!isHallDownload || !!hallNeedUpdate) {
            skinId = hallId;
        }
        if (!!skinId) {
            if (!this.mainUpdateCtrl) return;
            this.mainUpdateCtrl.updateBundle(skinId);
            return;
        }
        if (!!this._appCheck()) return;
        SubManager.loadBundle(Enums.bundleType.POP, () => {
            SubManager.loadBundle(Enums.bundleType.HALL, () => {
                let autoLogin = ConfigModel.getData('autoLogin');
                if (!!autoLogin) {
                    LoginManager.quick(null, false, (err) => {
                        if (!!err) {
                            AssetsManager.startDialog();
                        } else {
                            SubManager.enterBundle(Enums.bundleType.HALL);
                        }
                    });
                } else {
                    AssetsManager.startDialog();
                }
            });
        });
    },
    btnClick(event, param) {
        switch (param) {
            case 'repair':
                CacheManager.clear();
                NativeUtil.clearCache();
                break;
            default:
                break;
        }
    },

});