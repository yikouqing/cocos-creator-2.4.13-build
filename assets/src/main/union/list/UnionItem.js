const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const AssetsManager = require('../../../utils/AssetsManager');
const Utils = require('../../../utils/Utils');
const Enums = require('../../../const/Enums');
const ConfigModel = require('../../../model/ConfigModel');
cc.Class({
    extends: cc.Component,

    properties: {
        ownerAvatar: cc.Sprite,
        unionID: cc.Label,
        unionName: cc.Label,
        memberCount: cc.Label,
        bishai: cc.Node,
        putong: cc.Node,
        check: cc.Node,
        plays: cc.Node,
        playsBg: cc.Node,
        unionNameColor: cc.Color,
    },

    start() {

    },
    // unionType 0比赛场  1普通场
    initWidget(unionInfo, cb) {
        let OpUnionID = UserModel.getOpUnionId();
        // console.log(unionInfo, OpUnionID, '加载');
        // 绿野丛林----
        if (cc.isValid(this.memberCount)) {
            this.check.active = false;
            if (this.plays) this.plays.active = OpUnionID == unionInfo.unionID;
            if (this.playsBg) this.playsBg.active = !this.plays.active;
            if (OpUnionID == unionInfo.unionID) {
                this.check.active = true;
                this.unionID.node.color = this.unionNameColor;
                this.unionName.node.color = this.unionNameColor;
                this.memberCount.node.color = this.unionNameColor;
            }
            this.bishai.active = unionInfo.unionType == 0;
            this.putong.active = !this.bishai.active;
            this.memberCount.string = `${unionInfo.memberCount}/${unionInfo.onlineCount}`;

        }

        let unionList = UserModel.getData('unionInfo');
        this.unionName.string = unionInfo.unionName;

        let unionItem = unionList.find((ele) => {
            return ele.unionID === unionInfo.unionID;
        });
        this.unionID.string = `ID:${unionInfo.unionID}`;
        AssetsManager.loadSpriteFrame({
            path: unionInfo.ownerAvatar,
            sprite: this.ownerAvatar
        });
        this.unionInfo = unionInfo;
        this.callback = cb;


    },

    onBtnClick() {
        this.callback(this.unionInfo.unionID);
    }

});