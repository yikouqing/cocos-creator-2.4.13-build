const Events = require('../const/Events')
const Enums = require('../const/Enums');
const ABManager = require('./ABManager');

class ABModule {

    constructor(bname, update) {
        this.bname = bname;
        this.update = update;
        this.bundle = null;
        this.downLoadFailed = false;
    }

    load(version, callback) {
        let config = {};
        if (version) config['version'] = version;
        let isValid = true;
        // console.log('测试', JSON.stringify(ABManager))
        let bundleUrl = ABManager.getBundleDownloadUrl(this.bname);
        // console.log('加载-URL', bundleUrl);
        cc.assetManager.loadBundle(bundleUrl, config, (err, bundle) => {
            if (!isValid) return;
            isValid = false;
            if (!err) {
                this.bundle = bundle;
                callback && callback();
            } else {
                // 错误重试
                this.downLoadFailed = true;
                // console.log("下载失败");
                ABManager.removeModule(this.bname);
                cc.systemEvent.emit(Events.clientEvents.onBundleDownloadFailed, {
                    bundName: this.bname
                }, this);
                ABManager.updateStatusInList(this.bname, Enums.bundleDownloadStatus.failed);
            }
        });
    }

    // 下载资源
    loadAssets(onProgress, onComplete) {
        let is_Valid = true;
        let autoAtlas = [];
        let resMap = this.bundle._config.assetInfos._map;
        for (let idx in resMap) {
            let item = resMap[idx]
            if (!item.path && item.nativeVer) {
                let url = cc.assetManager.utils.getUrlWithUuid(item.uuid, {
                    __nativeName__: ".png",
                    nativeExt: cc.path.extname(".png"),
                    isNative: true
                });
                if (url) {
                    autoAtlas.push(url);
                }
            }
        }
        let extNum = autoAtlas.length;
        let finishNum = 0;
        let is_2Valid = true;
        let preloadAutoAtlas = () => {
            if (autoAtlas.length == 0) {
                if (!is_2Valid) return;
                is_2Valid = false;
                onComplete && onComplete();
                return;
            }
            cc.assetManager.preloadAny(autoAtlas, {
                __requestType__: 'url',
                type: null,
                bundle: this.bundle.name
            }, (finish, total, item) => {
                if (!is_2Valid) return;
                onProgress && onProgress(finish + finishNum, total + finishNum, item);
            }, (error, items) => {
                if (!is_2Valid) return;
                is_2Valid = false;
                if (!error) {
                    onComplete && onComplete();
                } else {
                    this.downLoadFailed = true;
                    cc.systemEvent.emit(Events.clientEvents.onBundleDownloadFailed, {
                        bundName: this.bname
                    }, this);
                    ABManager.updateStatusInList(this.bname, Enums.bundleDownloadStatus.failed);
                }
            });

        }
        this.bundle.preloadDir("/", (finish, total, item) => {
            if (!is_Valid) return;
            finishNum = total;
            onProgress && onProgress(finish, total + extNum, item);
        }, (error, items) => {
            if (!is_Valid) return;
            is_Valid = false;
            if (!error) {
                preloadAutoAtlas();
            } else {
                this.downLoadFailed = true;
                cc.systemEvent.emit(Events.clientEvents.onBundleDownloadFailed, {
                    bundName: this.bname
                }, this);
                ABManager.updateStatusInList(this.bname, Enums.bundleDownloadStatus.failed);
            }
        })
    }

    //释放BUNDLE
    release() {
        if (!this.bundle) return;
        cc.assetManager.removeBundle(this.bundle);
        this.bundle = null;
    }

}

module.exports = ABModule;