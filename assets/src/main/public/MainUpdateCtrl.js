const AssetsManager = require('../../../src/utils/AssetsManager');
const Configs = require('../../const/Configs');
const Events = require('../../const/Events');
const Enums = require('../../const/Enums');
const ConfigModel = require('../../model/ConfigModel');
const UserModel = require('../../model/UserModel');
const Utils = require('../../utils/Utils');
const SubManager = require('../../utils/SubManager');
const ABManager = require('../../utils/ABManager');
const CacheManager = require('../../utils/CacheManager');

cc.Class({
    extends: cc.Component,

    properties: {
        updateProgress: cc.ProgressBar,
        updateProgressLbl: cc.Label,

        _updating: false,
        _storagePath: '',
        _manifest: null,
        _manifestUrl: '',
        _updateTask: null,
        _skinId: null,
    },

    start() {
        cc.systemEvent.on(Events.clientEvents.onBundleDownloadProgress, this._onDownloadProgress, this); //下载中
        cc.systemEvent.on(Events.clientEvents.onBundleDownloadFinished, this._onUnpackageSuccess, this); //下载成功
    },

    init() {
        this.node.active = true;
        this.updateProgressLbl.string = '';
        if (cc.sys.isBrowser || !!Configs.development) {
            this._hotUpdateDone();
            return;
        }
        this._manifest = null;
        this.updateProgressLbl.string = "开始校验,请稍后...";
        AssetsManager.loadAsset({
            path: "ver/project",
            aType: cc.Asset
        }, (asset) => {
            if (!asset ||
                cc.sys.isBrowser ||
                !cc.isValid(this.node)) {
                this._hotUpdateDone();
                return;
            }
            this._manifest = asset;
            let aseetData = asset['_nativeAsset'];
            let json = JSON.parse(aseetData);
            let version = json.version;
            ConfigModel.setData('resVer', version);
            this._manifestUrl = json['remoteManifestUrl'];
            this.updateProgressLbl.string = '正在校验,请稍后...';
            this.updateProgress.progress = 0;
            this._storagePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remote-asset';
            this._updateTask = new jsb.AssetsManager('', this._storagePath, this._verCheck);
            this._updateTask.setVerifyCallback((path, asset) => {
                let compressed = asset.compressed;
                let expectedMD5 = asset.md5;
                let relativePath = asset.path;
                let size = asset.size;
                return compressed ? true : true;
            });
            if (cc.sys.os === cc.sys.OS_ANDROID) this._updateTask.setMaxConcurrentTask(2);
            this._checkUpdate();
        });
    },

    _onDownloadProgress(data) {
        let bundle = ConfigModel.getBundleConfig(data.bundle);
        if (!bundle) return;
        let deps = ConfigModel.getBundleDeps(data.bundle);
        if (bundle.type != this._skinId && !deps.includes(this._skinId)) return;
        this.node.active = true;
        this.updateProgress.progress = data.finish / data.total;
        this.updateProgressLbl.string = `资源加载,已完成${Utils.formatNumberWithDecimal((data.finish / data.total) * 100, 0)}%`;
    },

    _onUnpackageSuccess(data) {
        let bundle = ConfigModel.getBundleConfig(data.bundle);
        if (!bundle) return;
        let deps = ConfigModel.getBundleDeps(data.bundle);
        if (bundle.type != this._skinId && !deps.includes(this._skinId)) return;
        this._bundleUpdateDone();
    },

    updateBundle(skinId) {
        this.node.active = true;
        this.updateProgressLbl.string = "加载资源,请稍后...";
        this.updateProgress.progress = 0;
        this._skinId = skinId || ConfigModel.getSkin();
        let isDownload = SubManager.checkLoad(this._skinId);
        let needUpdate = ABManager.checkUpdate(this._skinId);
        if (!isDownload || !!needUpdate) {
            let bundle = ConfigModel.getBundleConfig(this._skinId);
            if (!bundle) return;
            ABManager.addBundle(bundle.bundle);
        } else {
            this._bundleUpdateDone();
        }
    },

    _bundleUpdateDone() {
        this.updateProgressLbl.string = "加载完成,请稍后...";
        this.updateProgress.progress = 1;
        this._updateTask && this._updateTask.setEventCallback(null);
        cc.systemEvent.emit(Events.clientEvents.onBundlePreviewFinished, null, this);
        this.node.active = false;
    },

    _hotUpdateDone() {
        this.updateProgressLbl.string = "加载完成,请稍后...";
        this.updateProgress.progress = 1;
        this._updateTask && this._updateTask.setEventCallback(null);
        cc.systemEvent.emit(Events.clientEvents.onHotUpdateDone, null, this);
        this.node.active = false;
    },

    _download() {
        this._updateTask && this._updateTask.setEventCallback(null);
        cc.game.end();
    },

    _checkUpdate() {
        this.updateProgressLbl.string = '开始校验,请稍后...';
        this.updateProgress.progress = 0;
        if (this._updateTask.getState() === jsb.AssetsManager.State.UNINITED) {
            let url = this._manifest.nativeUrl;
            if (cc.loader.md5Pipe) url = cc.loader.md5Pipe.transformURL(url);
            this._updateTask.loadLocalManifest(url);
        }
        if (!this._updateTask.getLocalManifest() ||
            !this._updateTask.getLocalManifest().isLoaded()) {
            this.updateProgressLbl.string = '文件丢失,请重新安装...';
            this.updateProgress.progress = 1;
            AssetsManager.popDialog({
                content: "文件丢失,请尝试重启APP修复！（如遇问题无法修复请联系客服）",
                ok: () => {
                    UserModel.release();
                }
            });
        } else {
            this._updateTask.setEventCallback(this._checkCallback.bind(this));
            this._updateTask.checkUpdate();
            this._updating = true;
        }
    },

    _checkCallback(event) {
        let needUpdate = false;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                //没有本地的manifest文件
                this.updateProgressLbl.string = '文件丢失,请重新安装...';
                AssetsManager.popDialog({
                    content: "安装包不完整，请重新下载最新的安装包!",
                    ok: () => {
                        this._download();
                    }
                });
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST: //下载远程热更文件失败
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.updateProgressLbl.string = '校验失败,请重启再试...';
                this.updateProgress.progress = 1;
                AssetsManager.popDialog({
                    content: '网络异常，请重启！',
                    ok: () => {
                        UserModel.release();
                    }
                });
                break
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE: //最新版本
                this._hotUpdateDone();
                //TODO进入登录
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND: //显示更新按钮 调用hotUpdate方法  
                this.updateProgressLbl.string = '发现新版本,请稍后...'
                needUpdate = true;
                break;
            default:
                break;
        }

        if (needUpdate) {
            this._updateTask.setEventCallback(null);
            this._updating = false;
            this._startUpdate();
        }
    },

    _startUpdate() {
        if (this._updateTask && !this._updating) {
            this.updateProgressLbl.string = '开始校验,请稍后..';
            if (this._updateTask.getState() === jsb.AssetsManager.State.UNINITED) {
                let url = this._manifest.nativeUrl;
                if (cc.loader.md5Pipe) url = cc.loader.md5Pipe.transformURL(url);
                this._updateTask.loadLocalManifest(url);
            }
            this._updateTask.setEventCallback(this._updateCallback.bind(this));
            this._updateTask.update();
            this._updating = true;
        }
    },

    _updateCallback(event) {
        let needRestart = false;
        let failed = false;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                // this.updateProgressLbl.string = `正在验证资源文件${event.getDownloadedFiles()}/${event.getTotalFiles()}`
                let percent = event.getDownloadedFiles() / event.getTotalFiles()
                this.updateProgress.progress = percent
                this.updateProgressLbl.string = `正在加载,已完成${Math.floor(percent * 100)}%`;
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
            case jsb.EventAssetsManager.ERROR_UPDATING:
            case jsb.EventAssetsManager.UPDATE_FAILED: {
                this.updateProgressLbl.string = `加载失败,错误码${event.getEventCode()}`;
                failed = true;
            }
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                this.updateProgressLbl.string = '加载完成,请稍后...'
                failed = true;
                needRestart = true;
                this._updated();
                break;
            default:
                this._updating = false;
                break;
        }
    },

    _updated() {
        this._updateTask.setEventCallback(null);
        this._updating = false;
        let searchPaths = jsb.fileUtils.getSearchPaths();
        let newPaths = this._updateTask.getLocalManifest().getSearchPaths();
        Array.prototype.unshift.apply(searchPaths, newPaths);
        cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
        jsb.fileUtils.setSearchPaths(searchPaths);
        UserModel.release();
    },

    _verCheck(va, vb) {
        let A = va.split('.');
        let B = vb.split('.');
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
    },

    onDestroy() {
        cc.systemEvent.off(Events.clientEvents.onBundleDownloadProgress, this._onDownloadProgress, this); //下载中
        cc.systemEvent.off(Events.clientEvents.onBundleDownloadFinished, this._onUnpackageSuccess, this); //下载成功
    },

});