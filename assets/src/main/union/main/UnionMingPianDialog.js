const UserModel = require('../../../model/UserModel');
const CCUtil = require('../../../utils/CCUtil');
const NativeUtil = require('../../../utils/NativeUtil');
const Configs = require('../../../const/Configs');
const ConfigModel = require('../../../model/ConfigModel');
const AssetsManager = require('../../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        txt_lmName: {
            type: cc.Label,
            displayName: "联盟名字",
            default: null,
        },
        txt_myNick: {
            type: cc.Label,
            displayName: "自己的名字",
            default: null,
        },
        txt_yqm: {
            type: cc.Label,
            displayName: "自己的邀请码",
            default: null,
        },
        headImg: {
            type: cc.Sprite,
            displayName: "自己的头像",
            default: null,
        },
        capNode: {
            type: cc.Node,
            displayName: "截图区域",
            default: null,
        },
    },

    start() {
        this._unionInfo = this.node.nodeParams.unionInfo;
        let unionInfoItem = UserModel.getUnionInfo(this._unionInfo.unionID);
        this.txt_lmName.string = `${this._unionInfo.unionName}`
        this.txt_myNick.string = `${CCUtil.stringClamp(UserModel.getData('nickname'), 10, '..')}`
        this.txt_yqm.string = `${unionInfoItem.inviteID}`;
        AssetsManager.loadSpriteFrame({
            path: UserModel.getData('avatar'),
            sprite: this.headImg
        });
    },

    onBtnClick(event, param) {
        switch (param) {
            case "close":
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case "copy":
                NativeUtil.copyText(this.txt_yqm.string)
                break;
            case "p": //分享朋友圈
                let path = CCUtil.capScreen(this.capNode);
                NativeUtil.wxShareImg(1, path, '我的名片');
                break;
            case "h": //分享好友
                let hPath = CCUtil.capScreen(this.capNode);
                NativeUtil.wxShareImg(0, hPath, '我的名片');
                break;
            default:
                break;
        }
    },

    /**
     * 
     * @param {*} type 0好友  1朋友圈
     */
    onShare(type) {
        let url = ConfigModel.downloadUrl || "http://web.hyqp.top/download";
        let title = Configs.appName;
        let imgPath = ConfigModel.iconUrl || "http://web.hyqp.top/icon.png";
        let description = "您的好友邀您一起游戏，点击即可下载游戏，等你来玩";
        NativeUtil.wxShareUrl(type, url, title, description);
    },
});