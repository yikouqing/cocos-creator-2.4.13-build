const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const AssetsManager = require('../../../utils/AssetsManager');
const Utils = require('../../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        unionName: cc.RichText,
        inviteCode: cc.Label,
        ownerAvatar: cc.Sprite,
        ownerNickname: cc.Label,
        txt_identity: cc.Label,
        unionTypeNormalMark: cc.Node,
        unionTypeMatchMark: cc.Node,
        txtColor: cc.Color,
        memberCount: cc.Label,

    },

    start() { },

    bind(unionInfo, cb) {
        if (!unionInfo) return;
        // < outline width = 2 color = #8C5229>
        this.unionName.node.color = this.txtColor;
        this.unionName.string = unionInfo.unionName;
        let unionList = UserModel.getData('unionInfo');
        let unionItem = unionList.find((ele) => {
            return ele.unionID === unionInfo.unionID;
        });
        // 1 普通场、 0比赛场
        this.unionTypeNormalMark.active = unionInfo.unionType == 1;
        this.unionTypeMatchMark.active = !this.unionTypeNormalMark.active;
        // this.inviteCode.string = Utils.stringSecurity(unionItem.inviteID, true);
        this.inviteCode.string = unionItem.inviteID;
        // this.ownerNickname.string = `${Utils.stringSecurity(unionInfo.ownerNickname,true)}`;
        this.ownerNickname.string = unionInfo.ownerNickname;
        if (this.memberCount) {
            this.memberCount.node.active = true;
            this.memberCount.string = unionInfo.memberCount
        };
        AssetsManager.loadSpriteFrame({
            path: unionInfo.ownerAvatar,
            sprite: this.ownerAvatar
        });
        this.unionInfo = unionInfo;
        this.callback = cb;
        /**新增我的身份 */
        let str = "成员"
        if (unionInfo.ownerUid === UserModel.getData('uid')) {
            str = "盟主"

        } else if (unionItem.manager) {
            str = "管理员"

        } else if (unionItem.partner) {
            str = "队长"
        }
        this.txt_identity.string = str
    },

    onBtnClick() {
        this.callback && this.callback(this.unionInfo.unionID);
    }

});