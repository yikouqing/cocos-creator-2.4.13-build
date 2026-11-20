const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager');
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        userListRoot: cc.Node,
        userMemberListItemWidget: cc.Prefab,
        pageLabel: cc.Label,
        uidEditBox: cc.EditBox
    },

    start() {
        this.unionID = this.node.nodeParams.unionInfo.unionID;
        this.unionOwnerID = this.node.nodeParams.unionInfo.ownerUid;
        this.curIndex = 0;
        this.maxIndex = 0;
        this.updateList();
        MessageCallback.addListener("UnionMainMemberSync", this);
    },

    onDestroy() {
        MessageCallback.removeListener("UnionMainMemberSync", this);
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'UnionMainMemberSync':
                this.updateList();
                break;
        }
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'addMember') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/AddMemberDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID
            });
        } else if (parameter === 'query') {
            let uid = this.uidEditBox.string;
            if (uid.length !== 6) {
                AssetsManager.tipDialog("请输入正确的用户ID");
                return;
            }
            let matchData = {
                uid: uid,
                unionInfo: {
                    $elemMatch: {
                        unionID: this.unionID
                    }
                }
            };
            if (this.unionOwnerID !== UserModel.getData('uid')) {
                matchData.unionInfo.$elemMatch.spreaderID = UserModel.getData('uid');
            }
            let reqData = {
                unionID: this.unionID,
                matchData: matchData,
                startIndex: 0,
                count: 1,
                partnerPage: false,
                isMyMember: false
            };
            ApiHall.getMemberListRequest(reqData, (res) => {
                this.curIndex = 0;
                this.maxIndex = 0;
                this.pageLabel.string = (this.curIndex + 1) + "/" + (this.maxIndex + 1);

                this.userListRoot.removeAllChildren();
                for (let i = 0; i < res.msg.recordArr.length; ++i) {
                    let node = cc.instantiate(this.userMemberListItemWidget);
                    let ctrl = node.getComponent('UserMemberListItemWidgetCtrl');
                    ctrl.initWidget(res.msg.recordArr[i], this.unionID, this.unionOwnerID);
                    node.parent = this.userListRoot;
                }
            });
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

    updateList() {
        let matchData = {
            unionInfo: {
                $elemMatch: {
                    unionID: this.unionID
                }
            }
        };
        if (this.unionOwnerID !== UserModel.getData('uid')) {
            matchData.unionInfo.$elemMatch.spreaderID = UserModel.getData('uid');
        }
        let reqData = {
            unionID: this.unionID,
            matchData: matchData,
            startIndex: this.curIndex * 20,
            count: 20,
            partnerPage: false,
            isMyMember: false
        };
        ApiHall.getMemberListRequest(reqData, (res) => {
            this.maxIndex = Math.floor((res.msg.totalCount + 1) / 20);
            if ((res.msg.totalCount + 1) % 20 === 0) {
                this.maxIndex--;
            }
            this.userListRoot.removeAllChildren();
            this.ctrlArr = [];
            this.pageLabel.string = (this.curIndex + 1) + "/" + (this.maxIndex + 1);
            // 添加自己
            if (this.unionOwnerID !== UserModel.getData('uid')) {
                let node = cc.instantiate(this.userMemberListItemWidget);
                let ctrl = node.getComponent('UserMemberListItemWidgetCtrl');
                ctrl.initWidget({
                    nickname: UserModel.getData('nickname'),
                    avatar: UserModel.getData('avatar'),
                    uid: UserModel.getData('uid'),
                    prohibitGame: UserModel.getUnionInfo(this.unionID).prohibitGame
                }, this.unionID, this.unionOwnerID);
                node.parent = this.userListRoot;
                this.ctrlArr.push(ctrl);
            }
            for (let i = 0; i < res.msg.recordArr.length; ++i) {
                let node = cc.instantiate(this.userMemberListItemWidget);
                let ctrl = node.getComponent('UserMemberListItemWidgetCtrl');
                ctrl.initWidget(res.msg.recordArr[i], this.unionID, this.unionOwnerID);
                node.parent = this.userListRoot;
                this.ctrlArr.push(ctrl);
            }
        });
    },
});