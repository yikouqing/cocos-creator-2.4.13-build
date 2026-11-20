const AssetsManager = require('../../utils/AssetsManager');
const UserModel = require('../../model/UserModel');
const ApiHall = require('../../api/ApiHall');
const SubManager = require('../../utils/SubManager');
const Enums = require('../../const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        mark: cc.Node,
        empty: cc.Node,
        unionName: cc.Label,
        unionId: cc.Label,
        rank: cc.Label,
        btnEnable: cc.Button,

        _union: null
    },

    bind(index, data) {
        this._union = data;
        this.mark.active = !!data;
        this.empty.active = !this.mark.active;
        this.unionName.string = !!data ? data.unionName : '';
        this.unionId.string = !!data ? data.unionID : '';
        this.rank.string = index < 3 ? index + 1 : '';
        this.btnEnable.interactable = !!data;
    },

    onClick() {
        if (!this._union) return;
        let unionItem = UserModel.getUnionInfo(this._union.unionID);
        if (!unionItem) {
            if (!this._union.inviteID) return;
            AssetsManager.popDialog({
                content: `确定要申请加入联盟[${this._union.unionName}(ID:${this._union.unionID})]吗?`,
                ok: () => {
                    ApiHall.joinUnionRequest({
                        inviteID: this._union.inviteID
                    }, (res) => {
                        ApiHall.getUserUnionListRequest((res) => {
                            UserModel.setData('userUnions', res.msg.recordArr);
                            UserModel.setOpUnionId(this._union.unionID);
                            ApiHall.getUnionInfoRequest({ unionID: this._union.unionID }, (res) => {
                                if (!cc.isValid(this.node)) return;
                                UserModel.setData('curUnionData', res.msg);
                                SubManager.enterBundle(Enums.bundleType.UNION);
                            });
                        });
                    });
                },
                no: () => { }
            });
        } else {
            UserModel.setOpUnionId(this._union.unionID);
            ApiHall.getUnionInfoRequest({ unionID: this._union.unionID }, (res) => {
                if (!cc.isValid(this.node)) return;
                UserModel.setData('curUnionData', res.msg);
                SubManager.enterBundle(Enums.bundleType.UNION);
            });
        }

    },

});