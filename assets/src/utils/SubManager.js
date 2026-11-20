const ApiHall = require('../api/ApiHall');
const AssetsManager = require('../../src/utils/AssetsManager');
const ABManager = require('./ABManager');
const Configs = require('../const/Configs');
const Enums = require('../const/Enums');
const ConfigModel = require('../model/ConfigModel');
const UserModel = require('../model/UserModel');
const CacheManager = require('../utils/CacheManager');

var exp = module.exports;

exp.enterBundle = function (type) {
    let bundleId = null;
    if (type == Enums.bundleType.GAME) {
        bundleId = UserModel.getData('gameType');
        if (!bundleId) {
            AssetsManager.tipDialog('房间初始化失败~');
            return;
        }
    } else {
        bundleId = ConfigModel.getSkin(type);
    }
    let isDownload = this.checkLoad(bundleId);
    let needUpdate = ABManager.checkUpdate(bundleId);
    let bundleConfig = ConfigModel.getBundleConfig(bundleId);
    if (!bundleConfig) return;
    let scene = bundleConfig.hs;
    if (!isDownload || !!needUpdate) {
        AssetsManager.subLoadDialog({
            type: bundleId,
            action: !isDownload ? 1 : 2, //1-加载 2-更新
            cb: () => {
                this.enterBundle(type);
            }
        })
        return;
    }
    ABManager.loadBundle(bundleConfig.bundle, () => {
        let bundle = cc.assetManager.getBundle(bundleConfig.bundle);
        if (!bundle) return;
        bundle.loadScene(scene, (err, sa) => {
            if (!!err) return;
            cc.director.runScene(sa);
        });
    });
};

//检测游戏是否下载
exp.checkLoad = function (type) {
    let bundleEnable = ABManager.getBundleEnable();
    if (!bundleEnable) return true;
    let download = ABManager.getBundleInDownloadByType(type);
    return download;
}

exp.getBundles = function (classify) {
    let adds = CacheManager.getItem(Configs.gamesAdded);
    let list = ConfigModel.getBundles();
    let records = adds && adds.length > 0 ? adds.split(',') : [];
    let tempBundles = [];
    //可添加玩法用缓存 不可添加展示全部
    let games = ConfigModel.getData("canAddGames") ? records : list;
    let showGameList = ConfigModel.getData('showGameList');
    if (!!showGameList) games = showGameList;
    games.forEach(item => {
        const game = parseInt(item);
        if (!!ConfigModel.canCreate(game)) {
            let itemConf = ConfigModel.getBundleConfig(game);
            if (!!classify) {
                if (classify == itemConf.classify) {
                    tempBundles.push(game);
                }
            } else {
                tempBundles.push(game);
            }
        }
    });
    tempBundles.sort((a, b) => {
        return a - b;
    });
    tempBundles.sort((a, b) => {
        let ac = ConfigModel.getBundleConfig(a);
        let bc = ConfigModel.getBundleConfig(b);
        return !!ac && !!bc && bc.sort - ac.sort;
    });
    return tempBundles.slice();
}

exp.getDefaultType = function () {
    let games = this.getBundles();
    return games.shift();
}

/**
 * 获取默认的一个类型
 * @param {} classify 
 * @returns 
 */
exp.getClassDefault = function (classify) {
    let games = this.getBundles();
    let tempBundle = -1;
    if (classify > 0) {
        tempBundle = games.find((game) => {
            let gItem = ConfigModel.getBundleConfig(game);
            return !!gItem && gItem.classify == classify;
        });
    } else {
        tempBundle = games.shift();
    }
    return tempBundle;
}

exp.delBundle = function (type) {
    let gameList = this.getBundles();
    let matchIndex = gameList.indexOf(type);
    if (matchIndex == -1) return;
    gameList.splice(matchIndex, 1);
    gameList.sort((a, b) => {
        return a - b;
    })
    CacheManager.setItem(Configs.gamesAdded, gameList.join(','));
}

exp.addBundle = function (type) {
    let gameList = this.getBundles();
    if (gameList.indexOf(type) != -1) return;
    gameList.push(type);
    gameList.sort((a, b) => {
        return a - b;
    })
    CacheManager.setItem(Configs.gamesAdded, gameList.join(','));
}

//检测是否添加过
exp.checkBundle = function (type) {
    let gameList = this.getBundles();
    return gameList.indexOf(type) != -1;
}

exp.exitBundle = function (unionID) {
    if (!!unionID) {
        UserModel.setOpUnionId(unionID);
        ApiHall.getUnionInfoRequest({
            unionID: unionID
        }, (res) => {
            UserModel.setData('curUnionData', res.msg);
            this.enterBundle(Enums.bundleType.UNION);
        });
    } else {
        this.enterBundle(Enums.bundleType.HALL);
    }
}

exp.loadBundle = function (type, cb) {
    let bundleId = ConfigModel.getSkin(type);
    let isDownload = this.checkLoad(bundleId);
    let needUpdate = ABManager.checkUpdate(bundleId);
    if (!isDownload || !!needUpdate) {
        //调用下载页面
        AssetsManager.subLoadDialog({
            type: bundleId,
            action: !isDownload ? 1 : 2, //1-加载 2-更新
            cb: () => {
                this.loadBundle(type, cb);
            }
        })
        return;
    }
    let bundleConfig = ConfigModel.getBundleConfig(bundleId);
    if (!bundleConfig) return;
    ABManager.loadBundle(bundleConfig.bundle, () => {
        let bundle = cc.assetManager.getBundle(bundleConfig.bundle);
        if (!bundle) return;
        cb && cb(bundleId);
    });
};