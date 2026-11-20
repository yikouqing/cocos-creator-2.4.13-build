const Utils = require("../../../utils/Utils");
const AssetsManager = require("../../../utils/AssetsManager");
const UserModel = require("../../../model/UserModel");
const ConfigModel = require("../../../model/ConfigModel");
const ApiHall = require("../../../api/ApiHall");
const Enums = require("../../../const/Enums");
const MessageCallback = require("../../../utils/MessageCallback");
const CCUtil = require("../../../utils/CCUtil");

cc.Class({
  extends: cc.Component,

  properties: {
    unionNameEdit: cc.EditBox, //联盟名称
    unionNoticeEdit: cc.EditBox, //联盟公告
    unionFeeEditBox: cc.EditBox, //服务费
    togDaYang: cc.Toggle, //打烊
    togGameInvite: cc.Toggle, //游戏邀请
    togRank: cc.Toggle, //排行榜
    togJoinApplyLimit: cc.Toggle, //不接受进圈申请
    togJoinVerify: cc.Toggle, //进圈审核
    togPropsLimit: cc.Toggle, //禁用道具
    togDisLimitCount: cc.Toggle, //单局解散次数限制
    togYunXuFuFen: cc.Toggle, //允许负分
    togRoomHide0: cc.Toggle, //不隐藏
    togRoomHide1: cc.Toggle, //全部隐藏
    togRoomHide2: cc.Toggle, //隐藏1/2
    togRoomHide3: cc.Toggle, //隐藏1/3
    togReadyKick30: cc.Toggle, //超时踢出30秒
    togReadyKick60: cc.Toggle, //超时踢出60秒
    togReadyKick180: cc.Toggle, //超时踢出180秒
    togGroupLimit: cc.Toggle, //同组禁入
    togNoTable: cc.Toggle, //禁止空桌
    togDisType0: cc.Toggle, //全部同意
    togDisType1: cc.Toggle, //一半人同意
    togRoomQian: cc.Toggle, //开打在前
    togRoomHou: cc.Toggle, //开打在后
    btnZhuanRang: cc.Node, //转让联盟
    btnJieSan: cc.Node, //解散联盟
    applyBar: cc.Node, //申请状态红点

    _updateUnionCallback: null,
    _tableHideCount: 0,
  },

  onLoad() {
    MessageCallback.addListener("OnUnionRuleListUpdate", this);
    MessageCallback.addListener("OnUnionServiceFeeUpdate", this);
    MessageCallback.addListener("OnApplyJoinStatusSync", this);
  },

  start() {
    let unionRankEnable =
      cc.sys.isBrowser || ConfigModel.getData("unionRankEnable");
    this.unionInfo = this.node.nodeParams.unionInfo;
    // console.log("this.unionInfo", this.unionInfo)
    this._updateUnionCallback =
      !!this.node.nodeParams && !!this.node.nodeParams.updateUnion
        ? this.node.nodeParams.updateUnion
        : null;
    this.unionNoticeEdit.string = this.unionInfo.notice || "";
    this.unionNameEdit.string = this.unionInfo.unionName || "";
    this.unionFeeEditBox.enable =
      this.unionInfo.ownerUid == UserModel.getData("uid");
    this.unionFeeEditBox.string = this.unionInfo.serverScore || 0;
    this.togDaYang.isChecked = !this.unionInfo.opening;
    this.togGameInvite.enable =
      !!ConfigModel.getData("unionInvite") || cc.sys.isBrowser;
    this.togGameInvite.isChecked =
      (!!ConfigModel.getData("unionInvite") || cc.sys.isBrowser) &&
      !!this.unionInfo.isInvite;
    this.togRank.isChecked = !!this.unionInfo.showRank && unionRankEnable;
    CCUtil.setGrayShader(this.togRank.node, !unionRankEnable);
    this.togRank.interactable = unionRankEnable;
    this.togJoinApplyLimit.isChecked = !!this.unionInfo.inviteLimit;
    this.togGroupLimit.isChecked = !this.unionInfo.groupLimit;
    this.togNoTable.isChecked = this.unionInfo.emptyTable;
    this.togJoinVerify.isChecked = !this.unionInfo.joinVerify;
    this.togPropsLimit.isChecked = !!this.unionInfo.propsLimit;
    this._tableHideCount = this.unionInfo.tableHideCount || 0;
    this._disApplyCount = this.unionInfo.disApplyCount || 0;
    this.togDisLimitCount.isChecked = this._disApplyCount > 0;
    this.togDisType1.isChecked = this.unionInfo.dismissType > 0;
    if (this.togYunXuFuFen)
      this.togYunXuFuFen.isChecked = !!this.unionInfo.canNegativeScore;
    if (this._tableHideCount == 1) {
      this.togRoomHide1.isChecked = true;
    } else if (this._tableHideCount == 2) {
      this.togRoomHide2.isChecked = true;
    } else if (this._tableHideCount == 3) {
      this.togRoomHide3.isChecked = true;
    } else {
      this.togRoomHide0.isChecked = true;
    }
    if (!!this.unionInfo.emptyTable) {
      this.togRoomHou.isChecked = true;
    } else {
      this.togRoomQian.isChecked = true;
    }
    this._unReadyKick = this.unionInfo.unReadyKick || 0;
    if (this._unReadyKick == 60) {
      this.togReadyKick60.isChecked = true;
    } else if (this._unReadyKick == 180) {
      this.togReadyKick180.isChecked = true;
    } else {
      this.togReadyKick30.isChecked = true;
      this._unReadyKick = 30;
    }
    this.btnJieSan.active = this.unionInfo.ownerUid == UserModel.getData("uid");
    this.btnZhuanRang.active =
      this.unionInfo.ownerUid == UserModel.getData("uid");
    this._applyStatusSync(!!this.node.nodeParams.hasNewApply);
  },

  messageCallbackHandler(route, data) {
    switch (route) {
      case "OnApplyJoinStatusSync":
        this._applyStatusSync(data);
        break;
      case "OnUnionServiceFeeUpdate":
        this._onUnionServiceFeeUpdate(data);
        break;
      case "OnUnionRuleListUpdate":
        this._onUnionRuleListUpdate(data);
        break;
    }
  },

  _applyStatusSync(isShow) {
    this.applyBar.active = !!isShow;
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
    let unionFee = parseInt(this.unionFeeEditBox.string);
    if (isNaN(unionFee)) {
      AssetsManager.tipDialog("请输入0-100的整数");
      return;
    }
    this.unionFeeEditBox.string = `${unionFee}`;
  },

  onBtnClick(event, parameter) {
    if (parameter === "transfer") {
      AssetsManager.createDialog({
        bundle: ConfigModel.getSkin(),
        path: "res/prefab/union/manager/UnionTransferDialog",
        unionInfo: this.unionInfo,
      });
    } else if (parameter === "close") {
      if (this.node.getComponent("DialogWidgetCtrl")) {
        this.node.getComponent("DialogWidgetCtrl").out();
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
              if (this.node.getComponent("DialogWidgetCtrl")) {
                this.node.getComponent("DialogWidgetCtrl").out();
              } else {
                this.node.destroy();
              }
            }
          );
        },
        no: () => { },
      });
    } else if (parameter === "baocun") {
      let unionFee = parseInt(this.unionFeeEditBox.string);
      if (
        isNaN(unionFee) ||
        parseFloat(unionFee) < 0 ||
        parseFloat(unionFee) > 100
      ) {
        AssetsManager.tipDialog("服务费须输入0-100的整数！");
        return;
      }
      let unionName = this.unionNameEdit.string.length;
      if (unionName == 0) {
        AssetsManager.tipDialog("联盟名称不能为空！");
        return;
      }
      if (Utils.getCharCount(unionName) > 12) {
        AssetsManager.tipDialog("联盟名称不得多于6个字");
        return;
      }
      let notice = this.unionNoticeEdit.string;
      if (notice.length != 0 && Utils.getCharCount(notice) > 100) {
        AssetsManager.tipDialog("联盟公告不得多于50个字");
        return;
      }
      let param = {
        hbOpen: false, //红包开关
        isInvite: this.togGameInvite.isChecked, //游戏邀请
        emptyTable: this.togNoTable.isChecked, //允许空桌
        unionOpen: !this.togDaYang.isChecked, //联盟开启
        unionName: this.unionNameEdit.string, //联盟名称
        unionNotice: this.unionNoticeEdit.string, //联盟公告
        showRank: this.togRank.isChecked, //排行榜
        inviteLimit: this.togJoinApplyLimit.isChecked, //禁止加入申请
        joinVerify: !this.togJoinVerify.isChecked, //加入申请审核
        propsLimit: this.togPropsLimit.isChecked, //禁用道具
        tableHideCount: this._tableHideCount, //隐藏已开桌桌子数
        disApplyCount: this._disApplyCount, //解散申请次数
        unReadyKick: this._unReadyKick, //超时踢出
        groupLimit: !this.togGroupLimit.isChecked, //同组禁入
        unionFee: parseInt(this.unionFeeEditBox.string), //服务费
        fullTableLimit: 0, //满桌限制
        tableSort: this.togRoomHou.isChecked ? 0 : 1, //空桌前后
        dismissType: this.togDisType1.isChecked ? 1 : 0, //解散条件  0-全部同意 1-部分同意
        canNegativeScore: !!this.togYunXuFuFen.isChecked, //允许负分
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
        if (this.node.getComponent("DialogWidgetCtrl")) {
          this.node.getComponent("DialogWidgetCtrl").out();
        } else {
          this.node.destroy();
        }
      });
    } else if (parameter.indexOf("hidecount") != -1) {
      this._tableHideCount = parseInt(parameter.slice(9));
      this._tableHideCount = isNaN(this._tableHideCount)
        ? 0
        : this._tableHideCount;
    } else if (parameter.indexOf("discount") != -1) {
      this._disApplyCount = parseInt(parameter.slice(8));
      if (this.togDisLimitCount.isChecked == true) {
        this._disApplyCount = isNaN(this._disApplyCount)
          ? 0
          : this._disApplyCount;
      } else {
        this._disApplyCount = 0;
      }
    } else if (parameter.indexOf("readykick") != -1) {
      this._unReadyKick = parseInt(parameter.slice(9));
      this._unReadyKick = isNaN(this._unReadyKick) ? 30 : this._unReadyKick;
    } else if (parameter === "shenhe") {
      AssetsManager.unionTeamDialog({
        showPages: ["apply"],
      });
    }
  },

  onDestroy() {
    MessageCallback.removeListener("OnApplyJoinStatusSync", this);
    MessageCallback.removeListener("OnUnionRuleListUpdate", this);
    MessageCallback.removeListener("OnUnionServiceFeeUpdate", this);
  },
});
