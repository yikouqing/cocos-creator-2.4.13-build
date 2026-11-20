const Utils = require("../../../utils/Utils");
const AssetsManager = require("../../../utils/AssetsManager");
const UserModel = require("../../../model/UserModel");
const ConfigModel = require("../../../model/ConfigModel");
const ApiHall = require("../../../api/ApiHall");
const Enums = require("../../../const/Enums");
const MessageCallback = require("../../../utils/MessageCallback");

cc.Class({
  extends: cc.Component,

  properties: {
    togDayang: cc.Toggle,
    btnHongBaoLay: cc.Node,
    togHongbao: cc.Toggle,
    btnUnionInviteLay: cc.Node,
    togInvite: cc.Toggle,
    togAllowEmpty: cc.Toggle,
    togYunXuFuFen: cc.Toggle, //允许负分
    unionFeeEditBox: cc.EditBox,
    unionNameEditBox: cc.EditBox,
    fullTableLimitEditBox: cc.EditBox,
    unionNoticeEditBox: cc.EditBox,
    btnZhuanrang: cc.Node,
    btnJiesan: cc.Node,
    serviceFeeNode: cc.Node,
    gaoji: cc.Node,

    _updateUnionCallback: null,
  },

  onLoad() {
    MessageCallback.addListener("OnUnionServiceFeeUpdate", this);
    MessageCallback.addListener("OnUnionRuleListUpdate", this);
  },

  start() {
    this._updateUnionCallback =
      !!this.node.nodeParams && !!this.node.nodeParams.updateUnion
        ? this.node.nodeParams.updateUnion
        : null;
    this.unionInfo = this.node.nodeParams.unionInfo;
    this.serviceFeeNode.active =
      this.unionInfo.unionType != Enums.UnionType.NORMAL;
    this.togDayang.isChecked = !this.unionInfo.opening;
    this.btnUnionInviteLay.active = !!ConfigModel.getData("unionInvite");
    this.togInvite.isChecked =
      !!ConfigModel.getData("unionInvite") && !!this.unionInfo.isInvite;
    this.btnJiesan.active = this.unionInfo.ownerUid == UserModel.getData("uid");
    this.btnZhuanrang.active =
      this.unionInfo.ownerUid == UserModel.getData("uid");
    this.btnHongBaoLay.active = !!ConfigModel.getData("hongBaoEnable");
    this.togHongbao.isChecked =
      !!ConfigModel.getData("hongBaoEnable") &&
      !!this.unionInfo.resultLotteryInfo &&
      !!this.unionInfo.resultLotteryInfo.status;
    this.togAllowEmpty.isChecked = !!this.unionInfo.emptyTable;
    this.unionNoticeEditBox.string = this.unionInfo.notice || "";
    this.unionNameEditBox.string = this.unionInfo.unionName || "";
    this.unionFeeEditBox.enable =
      this.unionInfo.ownerUid == UserModel.getData("uid");
    this.unionFeeEditBox.string = this.unionInfo.serverScore || 0;
    this.fullTableLimitEditBox.string = this.unionInfo.fullTableLimit || 0;
    this.gaoji.active = false;
    if (this.togYunXuFuFen)
      this.togYunXuFuFen.isChecked = !!this.unionInfo.canNegativeScore;
  },

  messageCallbackHandler(route, data) {
    switch (route) {
      case "OnUnionServiceFeeUpdate":
        this._onUnionServiceFeeUpdate(data);
        break;
      case "OnUnionRuleListUpdate":
        this._onUnionRuleListUpdate(data);
        break;
    }
  },

  _onUnionRuleListUpdate(data) {
    if (!this.unionInfo) return;
    this.unionInfo.roomRuleList = data;
  },

  _onUnionServiceFeeUpdate(data) {
    this.unionInfo = this.unionInfo || {};
    this.unionInfo.serverScore = data;
  },

  onUnionFeeEditEnd() {
    let unionFee = this.unionFeeEditBox.string;
    if (!unionFee) {
      AssetsManager.tipDialog("请输入0-100的整数");
      return;
    }
    if (parseInt(unionFee) < 0 || parseInt(unionFee) > 100) {
      AssetsManager.tipDialog("请输入0-100的整数");
      return;
    }
  },

  onBtnClick(event, parameter) {
    if (parameter === "transfer") {
      AssetsManager.createDialog({
        bundle: ConfigModel.getSkin(),
        path: "res/prefab/union/manager/UnionTransferDialog",
        unionInfo: this.unionInfo,
      });
    } else if (parameter === "close") {
      if (this.node.getComponent("DialogCtrl")) {
        this.node.getComponent("DialogCtrl").out();
      } else {
        this.node.destroy();
      }
    } else if (parameter === "unionDismiss") {
      AssetsManager.popDialog({
        content: `确定要解散联盟 [${this.unionInfo.unionName}] 吗？`,
        ok: () => {
          ApiHall.dismissUnionRequest(
            {
              unionID: this.unionInfo.unionID,
            },
            (res) => {
              MessageCallback.emitMessage("OnUnionDismissSync", null);
              if (this.node.getComponent("DialogCtrl")) {
                this.node.getComponent("DialogCtrl").out();
              } else {
                this.node.destroy();
              }
            }
          );
        },
        no: () => { },
      });
    } else if (parameter === "baocun") {
      let unionFee = this.unionFeeEditBox.string;
      if (
        unionFee.length == 0 ||
        isNaN(parseFloat(unionFee)) ||
        parseInt(unionFee) != parseFloat(unionFee) ||
        parseFloat(unionFee) < 0 ||
        parseFloat(unionFee) > 100
      ) {
        AssetsManager.tipDialog("服务费须输入0-100的整数！");
        return;
      }
      let unionName = this.unionNameEditBox.string.length;
      if (unionName == 0) {
        AssetsManager.tipDialog("联盟名称不能为空！");
        return;
      }
      if (Utils.getCharCount(unionName) > 12) {
        AssetsManager.tipDialog("联盟名称不得多于6个字");
        return;
      }
      let notice = this.unionNoticeEditBox.string;
      if (Utils.getCharCount(notice) > 100) {
        AssetsManager.tipDialog("联盟公告不得多于50个字");
        return;
      }
      if (this.fullTableLimitEditBox.string.length == 0) {
        this.fullTableLimitEditBox.string = "0";
      }
      let param = {
        isInvite: this.togInvite.isChecked,
        emptyTable: this.togAllowEmpty.isChecked,
        unionOpen: !this.togDayang.isChecked,
        hbOpen: this.togHongbao.isChecked,
        unionName: this.unionNameEditBox.string,
        unionNotice: this.unionNoticeEditBox.string,
        unionFee: parseInt(this.unionFeeEditBox.string),
        fullTableLimit: parseInt(this.fullTableLimitEditBox.string),
        canNegativeScore: !!this.togYunXuFuFen.isChecked, //允许负分
        showRank: false, //排行榜
        inviteLimit: false, //禁止加入申请
        joinVerify: false, //加入申请审核
        propsLimit: false, //禁用道具
        tableHideCount: 0, //隐藏已开桌桌子数
        disApplyCount: 0, //解散申请次数
        unReadyKick: 0, //超时踢出
        groupLimit: false, //禁止同组
        dismissType: 0, //解散条件  0-全部同意 1-部分同意
        tableSort: 0, //空桌前后
      };
      let reqData = {
        unionID: this.unionInfo.unionID,
        unionInfo: param,
      };
      ApiHall.updateUnionInfoRequest(reqData, (res) => {
        if (res.code != 0) {
          AssetsManager.tipDialog("修改失败，请稍候再试！");
          return;
        }
        !!this._updateUnionCallback && this._updateUnionCallback();
        //联盟列表刷新
        ApiHall.getUserUnionListRequest((res) => {
          UserModel.setData("userUnions", res.msg.recordArr);
        });
        if (this.node.getComponent("DialogCtrl")) {
          this.node.getComponent("DialogCtrl").out();
        } else {
          this.node.destroy();
        }
      });
    } else if (parameter === "gaoji") {
      this.gaoji.active = true;
    } else if (parameter === "gaojiClose") {
      this.gaoji.active = false;
    } else if (parameter === "guanli") {
      //团队的返利
      AssetsManager.createDialog({
        path: "res/prefab/union/partner/UnionMemberDelRecordDialog",
        bundle: ConfigModel.getSkin(),
        unionID: this.unionInfo.unionID,
      });
    } else if (parameter === "geli") {
      AssetsManager.unionTeamDialog({
        showPages: ["geli"],
      });
    }
  },

  onDestroy() {
    MessageCallback.addListener("OnUnionRuleListUpdate", this);
    MessageCallback.removeListener("OnUnionServiceFeeUpdate", this);
  },
});
