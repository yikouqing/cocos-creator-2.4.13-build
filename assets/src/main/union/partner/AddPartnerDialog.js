const AssetsManager = require('../../../utils/AssetsManager');
const MessageCallback = require('../../../utils/MessageCallback');
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        queryUserInfo: cc.Node,
        avatar: cc.Sprite,
        nickname: cc.Label,
        uid: cc.Label,
        uidEditBox: cc.EditBox
    },

    start() {
        this.queryUserData = null;
        this.unionID = this.node.nodeParams.unionID;
        this._cb = this.node.nodeParams.cb;
    },

    onClose() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

    onBtnClick(event, parameter) {
        if (parameter === 'query') {
            this.queryUserInfo.active = false;
            if (this.uidEditBox.string.length !== 6) {
                AssetsManager.tipDialog("请输入正确的用户ID");
                return;
            }
            ApiHall.searchRequest({ uid: this.uidEditBox.string }, (res) => {
                let userData = res.msg.userData;
                AssetsManager.loadSpriteFrame({
                    path: userData.avatar,
                    sprite: this.avatar
                });
                this.nickname.string = "昵称:" + userData.nickname;
                this.uid.string = "ID:" + userData.uid;
                this.queryUserInfo.active = true;
                this.queryUserData = userData;
            });
        } else if (parameter === 'confirm') {
            if (!this.queryUserData) return;
            let reqData = {
                unionID: this.unionID,
                memberUid: this.queryUserData.uid
            };
            ApiHall.addPartnerRequest(reqData, () => {
                AssetsManager.tipDialog("邀请成功");
                MessageCallback.emitMessage('UnionMainMemberSync');
                this.onClose();
            });
        } else if (parameter === 'cancel') {
            this.queryUserInfo.active = false;
        } else if (parameter === 'close') {
            this.onClose();
        } else if (parameter === 'input') {
            AssetsManager.createDialog({
                path: "res/prefab/union/main/InputDialog",
                bundle: ConfigModel.getSkin(),
                cb: (content) => {
                    this.uidEditBox.string = content;
                },
                maxLength: 6
            });
        } else if (parameter === 'addpartner') {
            if (this.uidEditBox.string.length !== 6) {
                AssetsManager.tipDialog("请输入正确的用户ID");
                return;
            }
            let reqData = {
                unionID: this.unionID,
                memberUid: this.uidEditBox.string
            };
            ApiHall.addPartnerRequest(reqData, (res) => {
                AssetsManager.tipDialog("邀请成功");
                MessageCallback.emitMessage('UnionMainMemberSync');
                this.node.destroy();
            });
        }
    }

    // update (dt) {},
});