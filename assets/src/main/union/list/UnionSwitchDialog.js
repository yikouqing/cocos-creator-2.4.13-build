const AssetsManager = require('../../../utils/AssetsManager')
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const MessageCallback = require('../../../utils/MessageCallback');
const ConfigModel = require('../../../model/ConfigModel');
const Enums = require('../../../const/Enums');
const SubManager = require('../../../utils/SubManager');

cc.Class({
    extends: cc.Component,

    properties: {
        unionItem: cc.Prefab,
        unionList: cc.Node,
        createUnionBtn: cc.Node,
        joinUnionBtn: cc.Node,
        _recordArr: [],
        _cb: null,
        _nodeTarget: null
    },

    onLoad() {
        MessageCallback.addListener('ReconnectSuccess', this);
        MessageCallback.addListener('UpdateUserInfoPush', this);
        MessageCallback.addListener('UnionListSync', this);
        this.createUnionBtn.active = !!UserModel.isAgent;
        this.joinUnionBtn.active = ConfigModel.getData('canJoinUnion') == 'true';
        this._cb = !!this.node.nodeParams ? this.node.nodeParams.cb : null;
        this._nodeTarget = !!this.node.nodeParams ? this.node.nodeParams.nodeTarget : null;
        this._recordArr = UserModel.getData('userUnions') || [];
    },

    start() {
        if (this._nodeTarget) this._nodeTarget.active = false;
        this.createUnionList(this._recordArr);
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
        // console.log('联盟列表', unionList)
        this.unionList.removeAllChildren();
        UserModel.setData('userUnions', unionList);
        let lastEnterUnionID = UserModel.getOpUnionId();
        if (!!lastEnterUnionID) {
            let unionInfo = unionList.find((e) => {
                return e.unionID === lastEnterUnionID;
            });
            if (!!unionInfo) {
                let node = cc.instantiate(this.unionItem);
                let ctrl = node.getComponent('UnionItem');
                ctrl.initWidget(unionInfo, this.enterUnion.bind(this));
                node.parent = this.unionList;
            }
        }
        for (let i = 0; i < unionList.length; ++i) {
            if (lastEnterUnionID === unionList[i].unionID) continue;
            let node = cc.instantiate(this.unionItem);
            // console.log(node, '111');
            let ctrl = node.getComponent('UnionItem');
            ctrl.initWidget(unionList[i], this.enterUnion.bind(this));
            node.parent = this.unionList;
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
            createMode: 'switch',
            skinId: skinId,
            bundle: ConfigModel.getSkin(),
            cb: this.enterUnion.bind(this)
        });
    },

    onBtnClick(event, parameter) {
        if (parameter === 'hide') {
            if (this._nodeTarget) {
                this._nodeTarget.active = true;
            }
            this.node.destroy();
        } else if (parameter === 'create') {
            this._onSkin();
        } else if (parameter === 'join') {
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

    enterUnion(unionID) {
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