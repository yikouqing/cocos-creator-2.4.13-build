const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const ConfigModel = require('../../../model/ConfigModel');
const Utils = require('../../../utils/Utils');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        listContent: cc.Node,
        userItemPrefab: cc.Prefab,
        _opUsers: [],
        _group: null,
    },

    start() {
        this._opUsers = [];
        this._group = !this.node.nodeParams || !this.node.nodeParams.group ? {} : this.node.nodeParams.group;
        let userList = this._group.userList || [];
        this._userSync(userList);
    },

    btnClicks(event, params) {
        switch (params) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'add':
                this._onAddClick();
                break;
            case 'del':
                this._onDelClick();
                break;
        }
    },

    _userSync(users) {
        this.listContent.destroyAllChildren();
        users.forEach(user => {
            let userItem = cc.instantiate(this.userItemPrefab);
            this.listContent.addChild(userItem);
            user.unionID = this._group.unionID;
            user.onUserCheck = this._onUserCheck.bind(this);
            userItem.getComponent('UnionForbiddenGroupUserListItem') && userItem.getComponent('UnionForbiddenGroupUserListItem').initWidget(user);
        });
    },

    _onAddClick() {
        if (!this._group) return;
        AssetsManager.createDialog({
            path: "res/prefab/union/main/InputDialog",
            bundle: ConfigModel.getSkin(),
            cb: (content) => {
                // console.log('添加玩家', [content]);
                let reqData = {
                    unionID: this._group.unionID,
                    ruleID: this._group.ruleID,
                    type: 1,
                    userList: [content]
                };
                ApiHall.modifyForbiddenRuleRequest(reqData, (res) => {
                    // console.log('添加玩家', res);
                    if (res.code == 0) {
                        this._group.onSync();
                        let userList = !res.ruleData || !res.ruleData.userList ? [] : res.ruleData.userList;
                        this._userSync(userList);
                        AssetsManager.tipDialog('操作成功！');
                    }
                });
            },
            maxLength: 6
        });
    },

    _onDelClick() {
        if (!this._group) return;
        if (!this._opUsers || this._opUsers.length == 0) {
            AssetsManager.tipDialog('请先选择您要删除的玩家！');
            return;
        }
        let reqData = {
            unionID: this._group.unionID,
            ruleID: this._group.ruleID,
            type: 0,
            userList: this._opUsers
        };
        ApiHall.modifyForbiddenRuleRequest(reqData, (res) => {
            // console.log('删除玩家', res);
            if (res.code == 0) {
                this._group.onSync();
                let userList = !res.ruleData || !res.ruleData.userList ? [] : res.ruleData.userList;
                this._userSync(userList);
                AssetsManager.tipDialog('操作成功！');
            }
        });
    },

    _onUserCheck(user) {
        if (!user) return;
        this._opUsers = this._opUsers || [];
        let userIndex = this._opUsers.indexOf(user.uid);
        if (userIndex != -1) {
            this._opUsers.splice(userIndex, 1);
        } else {
            this._opUsers.push(user.uid);
        }
    },

});