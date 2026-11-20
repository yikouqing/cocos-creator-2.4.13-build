const AssetsManager = require('../../../utils/AssetsManager');
const MessageCallback = require('../../../utils/MessageCallback');
const ApiHall = require('../../../api/ApiHall');
const ConfigModel = require('../../../model/ConfigModel');
const Enums = require('../../../const/Enums');
const CacheManager = require('../../../utils/CacheManager');

cc.Class({
    extends: cc.Component,

    properties: {
        unionBgTogs: [cc.Toggle],
        unionTableStyleTogs: [cc.Toggle],
        mjTbale: cc.Node,
        Tbale: cc.Node,
        _unionInfo: null,
    },

    start() {
        this._unionInfo = !!this.node.nodeParams ? this.node.nodeParams.unionInfo || {} : {};
        this._init();
    },

    _init() {
        let tableStyle = 0,
            unionBg = 0;
        let canUnionOwnerModifySkin = parseInt(ConfigModel.getData('canUnionOwnerModifySkin'));
        this.loadTableSprite();
        if (canUnionOwnerModifySkin == 1 || canUnionOwnerModifySkin == 0) {
            tableStyle = this._unionInfo.tableStyle || 0;
            unionBg = this._unionInfo.unionBg || 0;
        } else {
            unionBg = CacheManager.getItem('unionBg');
            tableStyle = CacheManager.getItem('unionTableStyle');
            tableStyle = parseInt(tableStyle) >= 0 ? parseInt(tableStyle) : 0;
            unionBg = parseInt(unionBg) >= 0 ? parseInt(unionBg) : 0;
        }
        if (this.unionBgTogs[unionBg]) this.unionBgTogs[unionBg].isChecked = true;
        if (this.unionTableStyleTogs[tableStyle]) this.unionTableStyleTogs[tableStyle].isChecked = true;
    },

    loadTableSprite() {
        // 联盟背景
        for (let i = 0; i < this.unionBgTogs.length; i++) {
            let item = this.unionBgTogs[i].node.getChildByName('unionbg')
            let path = 'res/sprite/unionbg/unionBg'
            if (i > 0) {
                path = `res/sprite/unionbg/unionBg${i}`
            }
            AssetsManager.loadSpriteFrame({
                bundle: ConfigModel.getSkin(Enums.bundleType.UNION),
                path: path,
                sprite: item.getComponent(cc.Sprite)
            })
        }
        // 方桌 圆桌
        AssetsManager.loadSpriteFrame({
            bundle: ConfigModel.getSkin(Enums.bundleType.UNION),
            path: `res/sprite/tables/1-2`,
            sprite: this.Tbale.getComponent(cc.Sprite)
        })
        AssetsManager.loadSpriteFrame({
            bundle: ConfigModel.getSkin(Enums.bundleType.UNION),
            path: `res/sprite/tables/mj-1-2`,
            sprite: this.mjTbale.getComponent(cc.Sprite)
        })
    },

    btnClicks(event, params) {
        if (params === 'close') {
            this._onCloseClick();
        } else if (params.indexOf('style') != -1) {
            this._onTableClick(params);
        } else if (params.indexOf('unionbg') != -1) {
            this._onBackgroundClick(params);
        }
    },

    _onBackgroundClick(params) {
        let type = parseInt(params.slice(7));
        let unionBgType = 0;
        if (type == 2) {
            unionBgType = 1;
        } else if (type == 3) {
            unionBgType = 2;
        } else if (type == 4) {
            unionBgType = 3;
        }
        let canUnionOwnerModifySkin = parseInt(ConfigModel.getData('canUnionOwnerModifySkin'));
        if (canUnionOwnerModifySkin == 1 || canUnionOwnerModifySkin == 0) {
            if (this._unionInfo.unionBgg == unionBgType) return;
            let data = {
                unionID: this._unionInfo.unionID,
                tableColor: this._unionInfo.tableColor,
                unionBg: unionBgType,
                tableStyle: this._unionInfo.tableStyle
            }
            ApiHall.updateUnionSkinRequest(data, (res) => {
                if (res.code != 0) {
                    AssetsManager.tipDialog('联盟背景设置失败！');
                    return;
                }
                this._unionInfo.unionBg = res.msg.unionBg;
                MessageCallback.emitMessage('OnUnionSkinSync', {
                    syncType: 0,
                    value: res.msg.unionBg
                });
            })
        } else {
            let unionBg = CacheManager.getItem('unionBg');
            unionBg = parseInt(unionBg) >= 0 ? parseInt(unionBg) : 0;
            if (unionBg == unionBgType) return;
            CacheManager.setItem('unionBg', unionBgType.toString());
            MessageCallback.emitMessage('OnUnionSkinSync', {
                syncType: 0,
                value: unionBgType
            });
        }
    },

    _onTableClick(params) {
        let tableStyle = parseInt(params.slice(5));
        let canUnionOwnerModifySkin = parseInt(ConfigModel.getData('canUnionOwnerModifySkin'));
        if (canUnionOwnerModifySkin == 1 || canUnionOwnerModifySkin == 0) {
            if (this._unionInfo.tableStyle == tableStyle) return;
            let data = {
                unionID: this._unionInfo.unionID,
                tableColor: this._unionInfo.tableColor,
                unionBg: this._unionInfo.unionBg,
                tableStyle: tableStyle
            }
            ApiHall.updateUnionSkinRequest(data, (res) => {
                if (res.code != 0) {
                    AssetsManager.tipDialog('修改桌子样式失败！');
                    return;
                }
                this._unionInfo.tableStyle = res.msg.tableStyle;
                MessageCallback.emitMessage('OnUnionSkinSync', {
                    syncType: 2,
                    value: res.msg.tableStyle
                });
            })
        } else if (canUnionOwnerModifySkin == 2) {
            let tableStyle = CacheManager.getItem('unionTableStyle');
            if (parseInt(tableStyle) == tableStyle) return;
            CacheManager.setItem('unionTableStyle', tableStyle.toString());
            MessageCallback.emitMessage('OnUnionSkinSync', {
                syncType: 2,
                value: tableStyle
            });
        } else {
            AssetsManager.tipDialog('暂无修改权限！');
        }
    },

    _onCloseClick() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

});