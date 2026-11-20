const ABUtil = require('./ABUtil');
const ABUnpack = require('./ABUnpack');
const ABModule = require('./ABModule');
const Enums = require('../const/Enums');
const Events = require('../const/Events')
const Configs = require('../const/Configs');
const Utils = require('./Utils');
const ConfigModel = require('../model/ConfigModel');
const AssetsManager = require('./AssetsManager');
const CacheManager = require('./CacheManager');

var exp = module.exports;
exp.init = function (app) {
    this.bundleEnable = !!Configs.bundleEnable && !cc.sys.isBrowser && !Configs.development;
    if (!this.bundleEnable) return;
    if (typeof (jsb) == 'undefined') return;
    this.reqLoopInterval && clearInterval(this.reqLoopInterval);
    this.remoteVersionInited = false;
    this.nativeRootPath = ""; // native ab根路径 , 以 / 结尾
    let absPath1 = jsb.fileUtils.fullPathForFilename(app.resources.nativeUrl).replace("//", "/");
    let absPath2 = jsb.fileUtils.fullPathForFilename(app.links.nativeUrl).replace("//", "/");
    let testLen = absPath1.length > absPath2.length ? absPath2.length : absPath1.length;
    for (let i = 0; i < testLen; i++) {
        if (absPath1[i] != absPath2[i]) {
            this.nativeRootPath = absPath1.substring(0, i);
            break;
        }
    }
    this.hotUpdate = true;
    this.lastReqVersionInfoTime = 0;
    this.detectNewVersionInterval = 15000; // 自动检测版本间隔
    this.modules = {};
    this.localDataKey = Configs.localVersionConfigKey;
    let versionData = CacheManager.getItem(this.localDataKey);
    if (!versionData) {
        this.localVersion = this.createDefaultVersionData();
    } else {
        this.localVersion = JSON.parse(versionData);
    }
    this.romoteVersion = this.createDefaultVersionData();
    this.initDownloadVersions();
}

//初始化下载过的模块
exp.initDownloadVersions = function () {
    this.downLoadList = [];
    let bundles = this.localVersion['modules'];
    for (const bundle in bundles) {
        if (!bundles[bundle]['resource']) continue;
        this.downLoadList.push({
            bundle: bundle,
            resource: bundles[bundle]['resource'], //记录版本号
            version: bundles[bundle]['version'], //记录版本号
            status: Enums.bundleDownloadStatus.done, //记录状态
        });
    }
}

exp.execUnpackage = function (onComplete) {
    ABUnpack.execUnpackage(onComplete);
}

exp.getNativePath = function () {
    return this.nativeRootPath;
}

exp.versionInfoReqs = function () {
    if (!this.bundleEnable) {
        this.remoteVersionInited = true;
        cc.systemEvent.emit(Events.clientEvents.onBundleVersionReq, null);
        return;
    }
    this.bundleResUrl = ConfigModel.getData('remoteResourceUrl');
    if (!Utils.isNetworkAddress(this.bundleResUrl)) return;
    if (this.hotUpdate) {
        this.versionInfoReq();
        this.reqLoopInterval && clearInterval(this.reqLoopInterval);
        this.reqLoopInterval = setInterval(() => {
            this.versionInfoReq();
        }, this.detectNewVersionInterval);
    }
}

// 更新AB版本号 , 新包安装解压资源后覆盖版本号
exp.setLocalBundleVersion = function (bundle) {
    let bundles = this.romoteVersion['modules'];
    for (let key in bundles) {
        if (bundle == key) {
            let resource = bundles[key]['resource'];
            let version = bundles[key]['version'];
            if (!this.localVersion['modules'][key])
                this.localVersion['modules'][key] = {};
            this.localVersion['modules'][key]['resource'] = resource;
            this.localVersion['modules'][key]['version'] = version;
            CacheManager.setItem(this.localDataKey, JSON.stringify(this.localVersion));
            break;
        }
    }
}

exp.getLocalVersion = function () {
    return this.localVersion
}

exp.getBundleVersion = function (bundle) {
    let bundleConfig = ConfigModel.getBundleConfig(bundle);
    if (!this.localVersion || !this.localVersion['modules'] || !bundleConfig) return 'none';
    let modules = this.localVersion['modules'];
    let resVer = 'none';
    for (let key in modules) {
        if (bundleConfig.bundle == key) {
            let module = modules[key];
            resVer = module['version'];
            break;
        }
    }
    return resVer;
}

exp.getRomoteVersion = function () {
    return this.romoteVersion;
}

//检查是否在队列中
exp.getBundleInDownloadList = function (bundle) {
    let bundleTemp = null;
    for (const list of this.downLoadList) {
        if (list.bundle == bundle) {
            bundleTemp = list;
            break;
        }
    }
    return bundleTemp;
}

//刷新下载队列状态
exp.updateStatusInList = function (bundle, status) {
    for (const list of this.downLoadList) {
        if (list.bundle == bundle) {
            list.status = status;
            break;
        }
    }
}

//获取下载中的子包
exp.getDownloadingInDownloads = function () {
    let bundleDowning = null;
    for (const bundle of this.downLoadList) {
        if (bundle.status == Enums.bundleDownloadStatus.download) {
            bundleDowning = bundle;
            break;
        }
    }
    return bundleDowning;
}

//获取等待中的子包
exp.getHoldingInDownloads = function () {
    let bundleHold = null;
    for (const bundle of this.downLoadList) {
        if (bundle.status == Enums.bundleDownloadStatus.hold) {
            bundleHold = bundle;
            break;
        }
    }
    return bundleHold;
}

exp.createDefaultVersionData = function () {
    let ret = {
        version: "1.0.0", //大版本
        modules: {}
    }
    return ret;
}


// 置顶更新模块
exp.hotUpdateMultiModule = function (bundle, callback) {
    if (this.isNeedReqVersionInfo()) {
        this.versionInfoReq(() => {
            this.doHotUpdateMulti(bundle, callback)
        })
    } else {
        this.doHotUpdateMulti(bundle, callback)
    }
}

exp.doHotUpdateMulti = function (bundle, callback) {
    if (!this.hotUpdate) {
        callback && callback();
        return;
    }
    let bundles = [];
    bundles.push(bundle);
    bundles = this.getDependModule(bundles);
    let needUpdate = false;
    let needRestart = false;
    // 所有module更新完成
    let onAllFinished = () => {
        CacheManager.setItem(this.localDataKey, JSON.stringify(this.localVersion))
        callback && callback();
    }

    let needUpdateBundles = [];
    // 下载 assets bundle 资源
    let loadAssets = () => {
        ABUtil.sequenceMis(needUpdateBundles, () => {
            // 所有任务完成
            this.setLocalBundleVersion(bundle);
            this.updateStatusInList(bundle, Enums.bundleDownloadStatus.done);
            cc.systemEvent.emit(Events.clientEvents.onBundleDownloadFinished, {
                bundle: bundle
            });
            callback && callback();
        }, (bdl, idx, onExec) => {
            // 每个预加载任务
            let bundleModule = this.modules[needUpdateBundles[idx]];
            bundleModule.loadAssets((finish, total, item) => {
                cc.systemEvent.emit(Events.clientEvents.onBundleDownloadProgress, {
                    bundle: bundle,
                    finish: finish,
                    total: total
                });
            }, (items) => {
                onExec();
            })
        })
    }
    // ------------------------------------------- 顺序下载配置 
    ABUtil.sequenceMis(bundles, () => {
        // 所有配置下载完成
        if (needUpdate) {
            loadAssets();
        } else {
            onAllFinished();
        }

    }, (bdl, idx, onExec) => {
        // 每个预加载任务
        let bItem = bundles[idx];
        // console.log('加载', idx, bItem);
        this.hotUpdateModule(bItem, (hotret) => {
            let {
                haveNewVer,
                needRestart
            } = hotret;
            if (haveNewVer) {
                needUpdate = true;
                needUpdateBundles.push(bItem);
            }
            if (needRestart) {
                needRestart = true;
            }
            onExec();
        })
    });
}

// 获取依赖模块, 并排序
exp.getDependModule = function (names, h) {
    h = h || 1;
    let rms = this.romoteVersion.modules;
    let ret = {}
    for (let idx in names) {
        let n_1 = names[idx]
        ret[n_1] = {
            name: n_1,
            priority: rms[n_1].priority
        }
        let depends = this.getDependModule(rms[n_1].depend || [], h + 1)
        for (let j in depends) {
            let n_2 = depends[j]
            ret[n_2] = {
                name: n_2,
                priority: rms[n_2].priority
            }
        }
    }
    //排序, 优先级高的先更新 
    if (h == 1) {
        let minfos = Object.values(ret)
        minfos.sort((a, b) => {
            return a.priority > b.priority ? -1 : 1;
        })
        ret = {}
        for (let idx in minfos) {
            ret[minfos[idx].name] = 1;
        }
    }
    return Object.keys(ret)
}

// 更新到最新版本 
exp.hotUpdateModule = function (bundle, callback) {
    if (!this.hotUpdate) {
        let ret = {
            haveNewVer: false,
            needRestart: false
        };
        callback && callback(ret);
        return;
    }
    let localRes = this.localVersion['modules'][bundle]['resource'];
    let romoteRes = this.romoteVersion['modules'][bundle]['resource'];
    let remoteVersion = this.romoteVersion['modules'][bundle]['version'];
    let module = this.modules[bundle];
    let ret = {
        haveNewVer: (localRes != romoteRes),
        needRestart: false
    }
    let loadBundle = (module, ver, cb) => {
        module.load(ver, () => {
            if (localRes != romoteRes) {
                this.localVersion['modules'][bundle]['resource'] = romoteRes;
                this.localVersion['modules'][bundle]['version'] = remoteVersion;
            }
            cb && cb();
        });
    }
    if (!module) {
        // 未加载过, 更新后不需要重启
        module = new ABModule(bundle, this.hotUpdate);
        loadBundle(module, romoteRes, () => {
            this.modules[bundle] = module;
            callback && callback(ret);
        });
    } else {
        // 已加载, 若有更新则更新后重启
        if (localRes == romoteRes) {
            callback && callback(ret);
        } else {
            ret.needRestart = true;
            loadBundle(module, romoteRes, () => {
                callback && callback(ret);
            })
        }
    }
    return ret;
}

exp.getModule = function (bundle) {
    return this.modules[bundle];
}

exp.addModule = function (bundle, callback) {
    let module = this.getModule(bundle);
    if (!!module) {
        callback && callback(bundle);
        return;
    }
    let resource = this.romoteVersion['modules'][bundle]['resource'];
    module = new ABModule(bundle, this.hotUpdate);
    module.load(resource, () => {
        this.modules[bundle] = module;
        callback && callback(module);
    });
}

exp.removeModule = function (bundle) {
    let module = this.getModule(bundle);
    if (!module) return;
    module.release();
    delete this.modules[bundle];
}

//------------------------------------------------------------------->> 查询新版本
exp.isNeedReqVersionInfo = function () {
    if (Configs.reqVersionImmediately) return true;
    let curTime = (new Date()).getTime();
    return curTime - this.lastReqVersionInfoTime > this.detectNewVersionInterval;
}

exp.getBundleResUrl = function () {
    return this.bundleResUrl;
}

exp.getBundleVerConfigUrl = function () {
    return `${this.bundleResUrl}/verconfig.json?renew=${Utils.createUUID()}`;
}

exp.getBundleDownloadUrl = function (bundle) {
    return `${this.bundleResUrl}/remote/${bundle}`;
}

exp.versionInfoReq = function (verCallback) {
    if (!this.hotUpdate) {
        verCallback && verCallback();
        return;
    }
    if (this.httpReqHandler) {
        this.httpReqHandler.abort()
    }
    let verUrl = this.getBundleVerConfigUrl();
    this.httpReqHandler = ABUtil.makeXMLHttp({
        url: verUrl,
        callback: (res) => {
            if (!res) return;
            this.httpReqHandler = null;
            this.romoteVersion = res;
            let needSave = false;
            for (let bundle in res['modules']) {
                if (!this.localVersion['modules'][bundle])
                    this.localVersion['modules'][bundle] = {};
                // 运营中新增模块
                if (!this.localVersion['modules'][bundle]['version']) {
                    this.localVersion['modules'][bundle]['version'] = res['modules'][bundle]['version'];
                    needSave = true;
                }
            }
            if (needSave) CacheManager.setItem(this.localDataKey, JSON.stringify(this.localVersion));
            this.lastReqVersionInfoTime = Date.now();
            //请求成功一次记录一下
            if (!this.remoteVersionInited) {
                this.remoteVersionInited = true;
                cc.systemEvent.emit(Events.clientEvents.onBundleVersionReq, null);
            }
            verCallback && verCallback();
        }
    })
}

//加载 bundle
exp.loadBundle = function (bundle, callback) {
    if (!this.bundleEnable) {
        this.loadLocalBundle(bundle, callback);
        return;
    }
    //添加下载模块
    let inDownload = this.checkBundleDownloadedByBundleName(bundle);
    if (!inDownload) {
        AssetsManager.tipDialog('请先下载游戏模块！');
        return;
    }
    this.hotUpdateMultiModule(bundle, () => {
        this.addModule(bundle, (module) => {
            callback && callback(module);
        });
    });
}

//添加 bundle
exp.addBundle = function (bundle, callback) {
    if (!this.bundleEnable) return;
    //添加下载模块
    // console.log('加载模块', bundle);
    this.updateDownLoadList(bundle);
    this.hotUpdateMultiModule(bundle, () => {
        this.addModule(bundle, (module) => {
            callback && callback(module);
        });
    });
}

//记录模块
exp.updateDownLoadList = function (bundle) {
    let isDownload = false;
    for (let index = 0; index < this.downLoadList.length; index++) {
        if (this.downLoadList[index].bundle == bundle) {
            isDownload = true;
            if (this.downLoadList[index].status != Enums.bundleDownloadStatus.done) {
                this.downLoadList[index].status = Enums.bundleDownloadStatus.download;
            }
            break;
        }
    }
    if (isDownload) return; //在下载列表不重复添加
    this.downLoadList.push({
        bundle: bundle,
        status: Enums.bundleDownloadStatus.download
    });
}

//获取BGAME-UNDLE实例
exp.checkBundleDownloadedByBundleName = function (bundle) {
    let downloaded = false;
    for (const item of this.downLoadList) {
        if (item.bundle == bundle) {
            downloaded = true;
            break;
        }
    }
    return downloaded;
}

//获取下载完成实例
exp.getBundleInDownloadByType = function (type) {
    let bundleConfig = ConfigModel.getBundleConfig(type);
    if (!bundleConfig) return null;
    let bundle = null;
    for (const item of this.downLoadList) {
        if (item.bundle == bundleConfig.bundle &&
            item.status == Enums.bundleDownloadStatus.done) {
            bundle = item;
            break;
        }
    }
    return bundle ? bundle : null;
}

exp.loadLocalBundle = function (bname, cb) {
    let bundle = cc.assetManager.getBundle(bname);
    if (!!bundle) {
        cb && cb(bundle);
    } else {
        cc.assetManager.loadBundle(bname, (error, bdl) => {
            if (!!error) return;
            bundle = bdl;
            cb && cb(bundle);
        });
    }
}

//检测是否有更新
exp.checkUpdate = function (type) {
    if (!this.bundleEnable) return false;
    let config = ConfigModel.getBundleConfig(type);
    if (!config) return false;
    let bundle = config.bundle;
    if (!bundle) return false;
    let download = this.getBundleInDownloadByType(type);
    if (!download) return false;
    let localRes = this.localVersion['modules'][bundle]['resource'];
    let romoteRes = this.romoteVersion['modules'][bundle]['resource'];
    return localRes != romoteRes;
}

//获取远程版本号
exp.getRemoteVersion = function (type) {
    let config = ConfigModel.getBundleConfig(type);
    if (!config) return '1.0.0';
    return {
        resource: this.romoteVersion['modules'][bundle]['resource'],
        version: this.romoteVersion['modules'][bundle]['version']
    };
}

//获取本地版本号
exp.getLocalVersion = function (type) {
    let config = ConfigModel.getBundleConfig(type);
    if (!config) return {
        resource: 'none',
        version: '1.0.0'
    };
    return {
        resource: this.localVersion['modules'][bundle]['resource'],
        version: this.localVersion['modules'][bundle]['version']
    };
}

//获取BUNDLE 是否启用状态
exp.getBundleEnable = function () {
    return this.bundleEnable;
}

//获取 BUNDLE 资源
exp.getBundleByType = function (type) {
    let config = ConfigModel.getBundleConfig(type);
    // console.trace("获取bundle", type, config)
    if (!!config) {
        let bundle = cc.assetManager.getBundle(config.bundle);
        return bundle;
    } else {
        return cc.resources;
    }
}