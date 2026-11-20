const NativeUtil = require('../../../utils/NativeUtil');
const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const ConfigModel = require('../../../model/ConfigModel');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        queryLay: cc.Node,
        togPartner: cc.Toggle,
        avatar: cc.Sprite,
        queryNick: cc.Label,
        queryUid: cc.Label,
        uidInputLbl: cc.Label,

        _input: [],
        _query: null,
    },

    start() {
        this._input = [];
        this._query = null;
        this.unionID = this.node.nodeParams.unionID;
    },

    onInput(input) {
        this._input.push(input);
        this.uidInputLbl.string = this._input.join('');
    },

    onDel() {
        this._input = this._input || [];
        if (this._input.length == 0) return;
        this._input.pop();
        this.uidInputLbl.string = this._input.join('');
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
            this._input = this._input || [];
            let uid = this._input.join('');
            if (uid.length == 0) {
                AssetsManager.tipDialog("请输入正确的玩家ID~");
                return;
            }
            ApiHall.searchRequest({ uid: uid }, (res) => {
                this.queryLay.active = true;
                this._query = res.msg.userData;
                AssetsManager.loadSpriteFrame({
                    path: this._query.avatar,
                    sprite: this.avatar
                });
                this.queryNick.string = "昵称:" + this._query.nickname;
                this.queryUid.string = "ID:" + this._query.uid;
            });
        } else if (parameter === 'copy') {
            NativeUtil.copyText(this.inviteID.string);
        } else if (parameter === 'confirm') {
            if (!this._query) {
                AssetsManager.tipDialog("请确认要添加的玩家信息...");
                return;
            }
            let reqData = {
                uid: this._query.uid,
                unionID: this.unionID,
                partner: this.togPartner.isChecked
            };
            ApiHall.inviteJoinUnionRequest(reqData, () => {
                AssetsManager.tipDialog("邀请成功");
                MessageCallback.emitMessage('UnionMainMemberSync');
                this.onClose();
            });
        } else if (parameter === 'close') {
            this.onClose();
        } else if (parameter === 'copyCode') {
            NativeUtil.copyText(ConfigModel.downloadUrl);
        } else if (parameter.indexOf('inputnum') != -1) {
            this.onInput(parameter.slice(8));
        } else if (parameter === 'clear') {
            this._input = [];
            this.uidInputLbl.string = '';
        } else if (parameter === 'del') {
            this.onDel();
        }
    }

});