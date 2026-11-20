const AssetsManager = require('../../src/utils/AssetsManager');
const CacheManager = require('../utils/CacheManager');
const UserModel = require('../model/UserModel');
const ConfigModel = require('../model/ConfigModel');
const Configs = require('../const/Configs');

class HotUpdateModule {

    _updating = false;
    _storagePath = '';
    _manifest = null;
    _manifestUrl = '';
    _updateTask = null;
    _newVersion = '';

    constructor() {
        if (cc.sys.isBrowser || !!Configs.development) return;
        this._updating = false;
        this._storagePath = '';
        this._manifest = null;
        this._updateTask = null;
        this._manifestUrl = '';
        this._checkInterval = null;
        this._newVersion = '';
        AssetsManager.loadAsset({
            path: "ver/project",
            aType: cc.Asset
        }, (asset) => {
            if (!asset) return;
            this._manifest = asset;
            let aseetData = asset['_nativeAsset'];
            let json = JSON.parse(aseetData);
            this._manifestUrl = json['remoteManifestUrl'];
            this._updateTask = null;
            this.init();
            this._checkInterval = setInterval(() => {
                this.init();
            }, 10000);
        });
    }

    init() {
        if (!!this._updateTask) {
            this._updateTask.setEventCallback(null);
            this._updateTask = null;
        }
        this._storagePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remote-asset';
        this._updateTask = new jsb.AssetsManager('', this._storagePath, this.versionCompareHandle.bind(this));
        this._updateTask.setVerifyCallback((path, asset) => {
            let compressed = asset.compressed;
            let expectedMD5 = asset.md5;
            let relativePath = asset.path;
            let size = asset.size;
            return compressed ? true : true;
        });
        if (cc.sys.os === cc.sys.OS_ANDROID) this._updateTask.setMaxConcurrentTask(2);
        this.checkUpdate();
    }

    checkUpdate() {
        if (this._updateTask.getState() === jsb.AssetsManager.State.UNINITED) {
            let url = this._manifest.nativeUrl;
            if (cc.loader.md5Pipe) url = cc.loader.md5Pipe.transformURL(url);
            this._updateTask.loadLocalManifest(url);
        }
        if (!this._updateTask.getLocalManifest() ||
            !this._updateTask.getLocalManifest().isLoaded()) {
            this._checkInterval && clearInterval(this._checkInterval); //停止定时器
        } else {
            this._updateTask.setEventCallback(this.checkUpdateCallback.bind(this));
            this._updateTask.checkUpdate();
            this._updating = true;
        }
    }

    checkUpdateCallback(event) {
        let needUpdate = false;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                //没有本地的manifest文件
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST: //下载远程热更文件失败
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                break
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE: //最新版本
                //TODO进入登录
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND: //显示更新按钮 调用hotUpdate方法  
                needUpdate = true;
                break;
            default:
                break;
        }
        if (needUpdate) {
            let updateLog = ConfigModel.getData("hotUpdateLog");
            this._checkInterval && clearInterval(this._checkInterval);
            this._updateTask.setEventCallback(null);
            this._updating = false;
            AssetsManager.popDialog({
                content: `发现新版本${this._newVersion}:\n${updateLog}\n立即更新！`,
                ok: () => {
                    UserModel.release();
                }
            });
        }
    }

    startUpdate() {
        if (this._updateTask && !this._updating) {
            if (this._updateTask.getState() === jsb.AssetsManager.State.UNINITED) {
                let url = this._manifest.nativeUrl;
                if (cc.loader.md5Pipe) url = cc.loader.md5Pipe.transformURL(url);
                this._updateTask.loadLocalManifest(url);
                // console.log("url2==", url)
            }
            this._updateTask.setEventCallback(this.updateCallback.bind(this));
            this._updateTask.update();
            this._updating = true;
        }
    }

    updateCallback(event) {
        let needRestart = false;
        let failed = false;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                let percent = event.getDownloadedFiles() / event.getTotalFiles()
                // console.log("getPercent:", event.getPercent(), "getPercentByFile:", event.getPercentByFile(), "getDownloadedFiles / getTotalFiles:", event.getDownloadedFiles() + ' / ' + event.getTotalFiles(), "getDownloadedBytes / getTotalBytes:", event.getDownloadedBytes() + ' / ' + event.getTotalBytes());
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
            case jsb.EventAssetsManager.ERROR_UPDATING:
            case jsb.EventAssetsManager.UPDATE_FAILED:
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                failed = true;
                needRestart = true;
                this.updated();
                break;
            default:
                this._updating = false;
                break;
        }
    }

    updated() {
        this._updateTask.setEventCallback(null);
        this._updating = false;
        let searchPaths = jsb.fileUtils.getSearchPaths();
        let newPaths = this._updateTask.getLocalManifest().getSearchPaths();
        Array.prototype.unshift.apply(searchPaths, newPaths);
        cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
        jsb.fileUtils.setSearchPaths(searchPaths);
        setTimeout(() => {
            UserModel.release();
        }, 500);
    }

    versionCompareHandle(va, vb) {
        let A = va.split('.');
        let B = vb.split('.');
        this._newVersion = vb;
        for (let i = 0; i < A.length; ++i) {
            let a = parseInt(A[i]);
            let b = parseInt(B[i] || '0');
            if (a === b) {
                continue;
            } else {
                return a - b;
            }
        }
        if (B.length > A.length) {
            return -1;
        } else {
            return 0;
        }
    }

    release() {
        this._checkInterval && clearInterval(this._checkInterval);
        this._updateTask && this._updateTask.setEventCallback(null);
        this._updateTask = null;
    }

}

module.exports = HotUpdateModule;