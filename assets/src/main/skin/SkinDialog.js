const AssetsManager = require('../../utils/AssetsManager');
const ABManager = require('../../utils/ABManager');
const SubManager = require('../../utils/SubManager');
const ConfigModel = require('../../model/ConfigModel');
const UserModel = require('../../model/UserModel');
const Enums = require('../../const/Enums');
const MessageCallback = require('../../utils/MessageCallback');
const CacheManager = require('../../utils/CacheManager');

cc.Class({
    extends: cc.Component,

    properties: {
        pageCtrl: require('CircleEdgeView'),
        pageItem: cc.Prefab,
        skinItem: cc.Prefab,
        page: cc.Node,
        pageList: cc.Node,
        right: cc.Node,
        skinList: cc.Node,
        skinSprite: cc.Sprite,
        homeTog: cc.Toggle,
        unionTog: cc.Toggle,
        popTog: cc.Toggle,

        _pastSkinId: 0,
        _curSkinId: 0,
        _skinItems: [],
        _pageItems: [],
        _skinType: null
    },

    start() {
        MessageCallback.addListener('OnSkinSelectClick', this);
        MessageCallback.addListener('OnSkinPageClick', this);
        this._skinType = Enums.bundleType.PAGE;
        this._cb = !!this.node.nodeParams ? this.node.nodeParams.cb : null;
        this.suggests = ConfigModel.getSkinSuggests();
        this._pageShow();
        this._pageInit();
    },

    messageCallbackHandler(route, msg) {
        switch (route) {
            case 'OnSkinSelectClick':
                this._onSkinSync(msg);
                break;
            case 'OnSkinPageClick':
                this._onPageSync(msg);
                break;
            default:
                break;
        }
    },

    // 推荐
    _pageInit() {
        this.page.active = true;
        this._pageItems = [];
        this._pageId = parseInt(CacheManager.getItem('pageSkinId'))
        let callback = (page, suggest, index) => {
            page.getComponent('SkinPageItem').init(this._pageId, suggest.skinId, index);
            this._pageItems.push(page.getComponent('SkinPageItem'));
        }
        let pages = {
            prefab: this.pageItem,
            list: this.suggests,
            callback: callback
        }
        this.pageCtrl && this.pageCtrl.init(pages);
    },

    // 主页 弹窗 联盟
    _skinInit(type) {
        this.skinList.destroyAllChildren()
        this._skinItems = [];
        this._curSkinId = ConfigModel.getSkin(type);
        this._pastSkinId = this._curSkinId;
        let skins = ConfigModel.getSkins(type);
        // skins.push(null);
        for (let i = 0; i < skins.length; i++) {
            let item = skins[i];
            if (!!item && this.suggests.length > 1) {
                this.suggests.forEach((suggest) => {
                    if (item.skinId == suggest.pop || item.skinId == suggest.union || item.skinId == suggest.hall) {
                        let skin = cc.instantiate(this.skinItem);
                        this.skinList.addChild(skin);
                        let comp = skin.getComponent('SkinItem');
                        if (comp) {
                            if (item) item.curId = this._curSkinId;
                            comp.init(item);
                            this._skinItems.push(comp);
                        }
                    }
                })
            }
        }

        // skins.forEach((item, index, items) => {
        //     let skin = cc.instantiate(this.skinItem);
        //     this.skinList.addChild(skin);
        //     let comp = skin.getComponent('SkinItem');
        //     if (comp) {
        //         if (item) item.curId = this._curSkinId;
        //         comp.init(item);
        //         this._skinItems.push(comp);
        //     }
        // });
        this._onCurSkinSync();
    },

    // 推荐 
    _onSkinSync(skin) {
        if (this._curSkinId == skin.skinId) return;
        this._curSkinId = skin.skinId;
        for (const item of this._skinItems) {
            if (!item) continue;
            item.sync(skin);
        }
        this._onCurSkinSync();
    },

    //推荐同步
    _onPageSync(skin) {
        if (this._pageId == skin) return;
        this._pageId = skin;
        this._pageItems.forEach((page) => {
            page && page.sync(skin);
        })
    },

    _onCurSkinSync() {
        AssetsManager.loadSpriteFrame({
            path: `sprite/skin/skin${this._curSkinId}`,
            sprite: this.skinSprite
        });
    },

    onButtonClick(event, parameter) {
        if (parameter == 'tuijian') {
            this._skinType = Enums.bundleType.PAGE;
        } else if (parameter == 'home') {
            this._skinType = Enums.bundleType.HALL;
            this._skinInit(this._skinType);
        } else if (parameter == 'union') {
            this._skinType = Enums.bundleType.UNION;
            this._skinInit(this._skinType);
        } else if (parameter == 'pop') {
            this._skinType = Enums.bundleType.POP
            this._skinInit(this._skinType);
        } else if (parameter == 'confirm') {
            this._onConfirm();
        }
        if (parameter != 'confirm') this._pageShow();
    },

    _pageShow() {
        this.page.active = this._skinType == Enums.bundleType.PAGE;
        this.right.active = !this.page.active;
    },

    onClose() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

    _onConfirm() {
        if (this._skinType == Enums.bundleType.PAGE) {
            let skins = ConfigModel.getSuggestSkin(this._pageId);
            if (!skins) {
                AssetsManager.tipDialog('获取配置异常~');
                return;
            }
            for (const key in skins) {
                if (key == 'skinId') continue;
                let skin = ConfigModel.getSkinConfig(skins[key]);
                if (!skin) continue;
                ConfigModel.setSkin(skin.type, skin.skinId);
            }
            CacheManager.setItem('pageSkinId', this._pageId);
            UserModel.release();
        } else {
            if (this._pastSkinId == this._curSkinId) {
                AssetsManager.tipDialog('当前UI使用中...');
                return;
            }
            let isDownload = SubManager.checkLoad(this._curSkinId);
            let needUpdate = ABManager.checkUpdate(this._curSkinId);
            if (!isDownload || !!needUpdate) {
                AssetsManager.subLoadDialog({
                    type: this._curSkinId,
                    action: !isDownload ? 1 : 2, //1-加载 2-更新
                    cb: () => {
                        this._onDownLogic(this._skinType, this._curSkinId);
                    }
                })
                return;
            }
            this._onDownLogic(this._skinType, this._curSkinId);
        }
    },

    _onDownLogic(type, skinId) {
        ConfigModel.setSkin(type, skinId);
        UserModel.release();// 重启
    },

    onDestroy() {
        MessageCallback.removeListener('OnSkinPageClick', this);
        MessageCallback.removeListener('OnSkinSelectClick', this);
    }

});