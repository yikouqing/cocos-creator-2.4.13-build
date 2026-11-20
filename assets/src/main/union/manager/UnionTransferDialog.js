const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager')
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        queryUserInfo: cc.Node,
        avatar: cc.Sprite,
        nickname: cc.Label,
        uid: cc.Label,
        inviteUserPhone: cc.EditBox
    },

    start() {
        this.queryUserData = null;
        this.unionID = this.node.nodeParams.unionInfo.unionID;
    },

    onBtnClick(event, parameter) {
        if (parameter === 'query') {
            this.queryUserInfo.active = false;
            if (this.inviteUserPhone.string.length !== 6) {
                AssetsManager.tipDialog("请输入正确的用户ID！");
                return;
            }
            if (this.inviteUserPhone.string === UserModel.getData('uid')) {
                AssetsManager.tipDialog("不能转移给自己！");
                return;
            }
            ApiHall.searchRequest({ uid: this.inviteUserPhone.string }, (res) => {
                let userData = res.msg.userData;
                AssetsManager.loadSpriteFrame(userData.avatar, this.avatar);
                this.nickname.string = "昵称:" + userData.nickname;
                this.uid.string = "ID:" + userData.uid;

                this.queryUserInfo.active = true;

                this.queryUserData = userData;
            });
        } else if (parameter === 'confirm') {
            if (!this.queryUserData) return;
            let unionInfoItem = this.queryUserData.unionInfo.find((ele) => {
                return ele.unionID === this.unionID
            });
            if (!unionInfoItem) {
                AssetsManager.tipDialog("转移目标玩家必须在联盟中！");
                return;
            }
            let reqData = {
                unionID: this.unionID,
                transferUid: this.queryUserData.uid
            };
            AssetsManager.popDialog({
                content: "是否确定转移联盟？",
                ok: () => {
                    ApiHall.transferUnionRequest(reqData, (res) => {
                        AssetsManager.tipDialog("转移成功！");
                        MessageCallback.emitMessage("UnionInfoSync");
                        if (this.node.getComponent('DialogWidgetCtrl')) {
                            this.node.getComponent('DialogWidgetCtrl').out();
                        } else {
                            this.node.destroy();
                        }
                    });
                },
                no: () => { }
            });
        } else if (parameter === 'cancel') {
            this.queryUserInfo.active = false;
        } else if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        }
    }

    // update (dt) {},
});