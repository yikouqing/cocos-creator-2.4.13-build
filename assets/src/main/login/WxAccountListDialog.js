const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
const Configs = require('../../const/Configs');
const Utils = require('../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        userListRoot: cc.Node,
        userInfoItem: cc.Node,

        pageLabel: cc.Label,
    },

    start() {
        this.curIndex = 0;
        this.maxIndex = 0;
        this.accountInfoArr = [];
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'left') {
            if (this.curIndex === 0) return;
            this.curIndex--;
            this.updateList();
        } else if (parameter === 'right') {
            if (this.curIndex >= this.maxIndex) return;
            this.curIndex++;
            this.updateList();
        }
    },

    selectUser(event, parameter) {
        // Global.wxAccountInfo = this.accountInfoArr[parameter] || null;
    },

    updateList() {
        this.maxIndex = Math.floor((this.accountInfoArr.length + 1) / 20);
        if ((this.accountInfoArr.length + 1) % 20 === 0) {
            this.maxIndex--;
        }
        this.userListRoot.removeAllChildren();
        this.pageLabel.string = (this.curIndex + 1) + "/" + (this.maxIndex + 1);
        for (let i = this.curIndex * 20; i < this.accountInfoArr.length; ++i) {
            let accountInfo = this.accountInfoArr[i];
            let node = cc.instantiate(this.userInfoItem);
            node.active = true;
            AssetsManager.loadSpriteFrame({
                path: accountInfo.avatar,
                sprite: node.getChildByName("avatar").getComponent(cc.Sprite)
            });
            node.getChildByName("nickname").getComponent(cc.Label).string = accountInfo.nickname;
            node.parent = this.userListRoot;
            node.getComponent(cc.Button).clickEvents[0].customEventData = i.toString();
            if (i >= (this.curIndex * 20 + 19)) break;
        }
    }
});