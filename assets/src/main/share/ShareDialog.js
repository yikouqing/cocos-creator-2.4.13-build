let NativeUtil = require('../../utils/NativeUtil');
const AssetsManager = require('../../utils/AssetsManager');
const Configs = require('../../const/Configs');
const ConfigModel = require('../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {},

    onBtnClick(event, param) {

        switch (param) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'mask':

                this.node.destroy();

                break;
            case 'wx': {
                let url = ConfigModel.downloadUrl || "http://web.hyqp.top/download";
                let title = Configs.appName;
                let imgPath = ConfigModel.downloadUrl || "http://web.hyqp.top/icon.png";
                let description = "您的好友邀您一起游戏，点击即可下载游戏，等你来玩";
                NativeUtil.wxShareUrl(0, url, title, description);
            }
            break;
        case 'friend': {
            let url = ConfigModel.downloadUrl || "http://web.hyqp.top/download";
            let title = Configs.appName;
            let imgPath = ConfigModel.iconUrl || "http://web.hyqp.top/icon.png";
            let description = "您的好友邀您一起游戏，点击即可下载游戏，等你来玩";
            NativeUtil.wxShareUrl(1, url, title, description);
        }
        break;
        }
    }

    // update (dt) {},
});