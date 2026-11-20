const AssetsManager = require('../../../utils/AssetsManager')
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const MessageCallback = require('../../../utils/MessageCallback');
const ConfigModel = require('../../../model/ConfigModel');
const SubManager = require('../../../utils/SubManager');
const Enums = require('../../../const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        unionListItemWidgetPrefab: cc.Prefab,
        unionList: cc.Node,
        createUnionBtn: cc.Node,
        joinUnionBtn: cc.Node,
        _recordArr: [],
        _unions: [],
        _cb: null
    },

    onLoad() {
        this._unions = [];
        MessageCallback.addListener('ReconnectSuccess', this);
        MessageCallback.addListener('UpdateUserInfoPush', this);
        MessageCallback.addListener('UnionListSync', this);
        this.createUnionBtn.active = !!UserModel.isAgent;
        this.joinUnionBtn.active = ConfigModel.getData('canJoinUnion') == 'true';
        this._cb = !!this.node.nodeParams ? this.node.nodeParams.cb : null;
        this.createUnionList(UserModel.getData('userUnions'));
    },

    start() {
        ApiHall.getUserUnionListRequest((res) => {
            this.createUnionList(res.msg.recordArr);
        })
    },

    onDestroy() {
        MessageCallback.removeListener('ReconnectSuccess', this);
        MessageCallback.removeListener('UpdateUserInfoPush', this);
        MessageCallback.removeListener('UnionListSync', this);
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'ReconnectSuccess':
                ApiHall.getUserUnionListRequest((res) => {
                    if (!cc.isValid(this.node)) return;
                    this.createUnionList(res.msg.recordArr);
                });
                break;
            case 'UpdateUserInfoPush':
                this.onUserInfoPush(data);
                break;
            case 'UnionListSync':
                this.createUnionList(data);
                break;
        }
    },

    onUserInfoPush(data) {
        if (!data) return;
        if (data.hasOwnProperty('unionInfo')) {
            //联盟列表刷新
            ApiHall.getUserUnionListRequest((res) => {
                if (!cc.isValid(this.node)) return;
                this.createUnionList(res.msg.recordArr);
            });
        } else if (data.hasOwnProperty('isAgent')) {
            //代理创建
            this.createUnionBtn.active = !!data['isAgent']
        }

    },

    createUnionList(unionList) {
        if (!unionList || !Array.isArray(unionList)) return;
        UserModel.setData('userUnions', unionList);
        let lastEnterUnionID = UserModel.getOpUnionId();
        let lastEnterUnionIndex = unionList.findIndex(union => {
            return union.unionID == lastEnterUnionID;
        });
        if (lastEnterUnionIndex != -1) {
            let tempUnions = unionList.slice();
            let union = tempUnions[lastEnterUnionIndex];
            unionList.splice(lastEnterUnionIndex, 1);
            unionList.unshift(union);
        }
        let showCount = unionList.length;
        let unionCount = this._unions.length;
        let showUnionItem = (curNode, unionObj) => {
            let curNodeCtrl = curNode.getComponent('UnionListItemWidgetCtrl');
            if (!!curNode && !!curNodeCtrl) {
                curNodeCtrl.bind(unionObj, this.enterUnion.bind(this));
                curNode.active = !!unionObj;
            }
        }
        if (unionCount >= showCount) {
            this._unions.forEach((curNode, index) => {
                showUnionItem(curNode, unionList[index]);
            })
        } else { //节点不足
            unionList.forEach((unionObj, index) => {
                let curNode = this._unions[index];
                if (!curNode) {
                    curNode = cc.instantiate(this.unionListItemWidgetPrefab);
                    curNode.parent = this.unionList;
                    this._unions.push(curNode);
                }
                showUnionItem(curNode, unionObj);
            })
        }
    },

    onBtnClick(event, parameter) {
        if (parameter === 'back') {
            if (!!this._cb) {
                //联盟过来的
                SubManager.enterBundle(Enums.bundleType.HALL);
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'createUnion') {
            this._onSkin();
        } else if (parameter === 'joinUnion') {
            let unionInfo = UserModel.getData('unionInfo');
            if (unionInfo.length >= 20) {
                AssetsManager.tipDialog("最多加入20个不同的亲友圈");
                return;
            }
            AssetsManager.createDialog({
                path: "res/prefab/union/list/JoinUnionDialog",
                bundle: ConfigModel.getSkin(),
                cb: this.enterUnion.bind(this)
            });
        } else if (parameter === 'refresh') {
            ApiHall.getUserUnionListRequest((res) => {
                if (!cc.isValid(this.node)) return;
                this.createUnionList(res.msg.recordArr);
            });
        }
    },

    _onCreate() {
        AssetsManager.skinDialog({
            skinType: Enums.bundleType.UNION,
            cb: this._onSkin.bind(this)
        });
    },

    _onSkin(skinId) {
        AssetsManager.createDialog({
            path: "res/prefab/union/list/CreateUnionDialog",
            skinId: Enums.bundleType.UNION_DF,
            bundle: ConfigModel.getSkin(),
            cb: this.enterUnion.bind(this)
        });
    },

    enterUnion(unionID) {
        if (!unionID) {
            AssetsManager.tipDialog("俱乐部信息错误、请稍后再试!");
            return
        }
        UserModel.setOpUnionId(unionID); //记录操作联盟的ID
        ApiHall.getUnionInfoRequest({ unionID: unionID }, (res) => {
            if (!cc.isValid(this.node)) return;
            UserModel.setData('curUnionData', res.msg);
            if (!!this._cb) {
                this._cb(unionID);
                this.node.destroy();
            } else {
                SubManager.enterBundle(Enums.bundleType.UNION);
            }
        });
    },


});