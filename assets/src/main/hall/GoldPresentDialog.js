const ApiHall = require('../../api/ApiHall');
const AssetsManager = require('../../utils/AssetsManager');
const UserModel = require('../../model/UserModel');
cc.Class({
    extends: cc.Component,

    properties: {
        input: cc.Node,
        userInfo: cc.Node,
        head: cc.Sprite,
        userName: cc.Label,
        uid: cc.Label,
        inputBox: cc.EditBox,
        goldBox: cc.EditBox,
        goldNode: cc.Node
    },

    onLoad() {
        this.goldNode.active = false
        this.userInfo.active = false
    },
    // 搜索玩家
    onSearch() {
        if (this.inputBox.string.length !== 6) {
            AssetsManager.tipDialog("请输入正确的用户ID");
            return;
        }
        ApiHall.searchRequest({ uid: this.inputBox.string }, (res) => {
            // console.log(res, '输入玩家uid');
            let userData = res.msg.userData;
            this.uidUser = userData.uid;
            this.userInfo.active = true
            AssetsManager.loadSpriteFrame({
                path: userData.avatar,
                sprite: this.head
            });
            this.userName.string = "昵称:" + userData.nickname;
            this.uid.string = "ID:" + userData.uid;
            this.goldNode.active = true
        });

    },

    onPersentGold() {
        let gold = UserModel.getData('gold')
        if (parseFloat(this.goldBox.string) > gold) {
            AssetsManager.tipDialog("钻石不足！！！！");
            return;
        }
        let reqData = {
            uid: this.uidUser,
            count: parseFloat(this.goldBox.string)
        };
        ApiHall.transferGoldRequest(reqData, (res) => {
            if (res.code == 0) AssetsManager.tipDialog("赠送成功");
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        });
    },

    OnButtonClick(event, parameter) {
        if (parameter == 'search') {
            this.onSearch();
        } else if (parameter == 'yes') {
            this.onPersentGold();
        } else if (parameter == 'no') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        }
    },



});