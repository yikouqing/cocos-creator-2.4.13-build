const ApiHall = require('../../../api/ApiHall');
const AssetsManager = require('../../../utils/AssetsManager');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        idEditVox: cc.EditBox,
        userInfoNode: cc.Node,
        userAvatar: cc.Sprite,
        userNick: cc.Label,
        userId: cc.Label,

        _matchedPlayer: null,
        _uid: null,
        _unionId: null,
    },

    start() {
        this._uid = !!this.node.nodeParams ? this.node.nodeParams.uid || null : null;
        this._unionId = !!this.node.nodeParams ? this.node.nodeParams.unionId || null : null;
    },

    onBtnClick(event, param) {

        switch (param) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'modifySearch':
                this.userInfoNode.active = false;
                if (this.idEditVox.string.length !== 6) {
                    AssetsManager.tipDialog("请输入正确的用户ID");
                    return;
                }
                ApiHall.searchRequest({ uid: this.idEditVox.string }, (res) => {
                    if (!cc.isValid(this.node)) return;
                    this.userInfoNode.active = true;
                    let userData = res.msg.userData;
                    AssetsManager.loadSpriteFrame({
                        path: userData.avatar,
                        sprite: this.userAvatar
                    });
                    this.userNick.string = "昵称:" + userData.nickname;
                    this.userId.string = "ID:" + userData.uid;
                    this._matchedPlayer = userData;
                });
                break;
            case 'partnerModify':
                if (!this._uid || !this._matchedPlayer) return;
                //处理修改逻辑
                let reqData = {
                    memberUid: this._matchedPlayer.uid,
                    unionID: this._unionId,
                    partnerUid: this._uid
                };
                ApiHall.removePartner(reqData, (res) => {
                    AssetsManager.tipDialog("修改队长成功！");
                    MessageCallback.emitMessage('UnionMainMemberSync');
                    this.node.destroy();
                });
                break;
        }
    }

});