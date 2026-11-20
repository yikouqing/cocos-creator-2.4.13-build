var NetworkManager = require('../../src/utils/NetworkManager');
var Utils = require('../../src/utils/Utils');

var api = module.exports;

//进入大厅
api.entry = function (data, cbRouter, cbFail) {
    let route = 'connector.entryHandler.entry';
    let requestData = {
        deviceID: data.deviceID,
        token: data.token,
        userInfo: data.userInfo
    };
    NetworkManager.send(route, requestData, cbRouter || 'EntryHallResponse', cbFail);
};

api.resetPassword = function (data, cbRouter, cbFail) {
    let route = 'hall.userHandler.resetPassword';
    let requestData = {
        account: data.account,
        password: data.password,
        smsCode: data.smsCode
    };
    NetworkManager.send(route, requestData, cbRouter || 'ResetPasswordResponse', cbFail);
};

//进入大厅
api.logout = function (cbRouter, cbFail) {
    let route = 'connector.entryHandler.logout';
    let requestData = {};
    NetworkManager.send(route, requestData, cbRouter || 'LogoutResponse', cbFail || 'LogoutFailed');
};

//查找玩家，获取玩家信息
api.searchRequest = function (data, cbRouter) {
    let route = 'hall.userHandler.searchUserData';
    let requestData = {
        uid: data.uid
    };
    NetworkManager.send(route, requestData, cbRouter || 'SearchResponse')
};

api.noteRequest = function (data, cbRouter) {
    let route = 'hall.userHandler.note';
    let requestData = {
        nickname: data.nick,
        message: data.message,
        contact: data.contact
    };
    NetworkManager.send(route, requestData, cbRouter || 'NoteResponse')
};

api.getHallNoticeRequest = function (cbRouter) {
    let route = 'hall.userHandler.getHallNotice';
    NetworkManager.send(route, {}, cbRouter || 'HallNoticeResponse')
};

//查找玩家，获取玩家信息
api.searchByPhoneRequest = function (data, cbRouter) {
    let route = 'hall.userHandler.searchByPhone';
    let requestData = {
        phone: data.phone
    };
    NetworkManager.send(route, requestData, cbRouter);
};

//绑定手机号
api.bindPhoneRequest = (data, cbRouter) => {
    let route = 'hall.userHandler.bindPhone';
    let requestData = {
        phone: data.phone,
        smsCode: data.smsCode,
        password: data.password
    };
    NetworkManager.send(route, requestData, cbRouter || 'BindPhoneResponse');
};

//绑定账号
api.bindAccountRequest = (data, cbRouter) => {
    let route = 'hall.userHandler.bindAccount';
    let requestData = {
        account: data.account,
        password: data.password
    };
    NetworkManager.send(route, requestData, cbRouter || 'BindAccountResponse');
};

// 实名认证
api.authRealNameRequest = function (data, cbRouter) {
    let route = 'hall.userHandler.authRealName';
    let requestData = {
        name: data.name,
        idCard: data.idCard
    };
    NetworkManager.send(route, requestData, cbRouter || 'AuthRealNameResponse');
};

// 位置
api.updateUserAddressRequest = function (data, cbRouter) {
    let route = 'hall.userHandler.updateUserAddress';
    let requestData = {
        address: data.address,
        location: data.location
    };
    NetworkManager.send(route, requestData, cbRouter);
};

api.deleteEmailRequest = function (data, cbRouter) {
    let route = 'hall.emailHandler.deleteEmail';
    let requestData = {
        emailID: data.emailID
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 更换头像 性别等
api.updateUserInfoRequest = function (data, cbRouter) {
    let route = 'hall.userHandler.updateUserInfo';
    let requestData = data
    NetworkManager.send(route, requestData, cbRouter);
};

// --------------------------------------------联盟相关------------------------------------------
// 创建联盟
api.createUnionRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.createUnion';
    let requestData = {
        unionType: data.unionType,
        unionName: data.unionName,
        ownerPhone: data.ownerPhone,
        unionSkinId: data.unionSkinId
    };
    NetworkManager.send(route, requestData, cbRouter || 'CreateUnionResponse');
};

api.joinUnionRoomWatchRequest = function (data) {
    let route = 'game.unionHandler.joinWatch';
    let requestData = {
        unionID: data.unionID,
        roomID: data.roomID,
        gameType: data.gameType
    };
    NetworkManager.send(route, requestData, data.succ || 'JoinWatchSucc', data.fail || 'JoinWatchFail');
}

api.createUnionRoomAgainRequest = function (data) {
    let route = 'game.unionHandler.createRoomAgain';
    let requestData = {
        unionID: data.unionID,
        roomID: data.roomID,
        gameRule: data.gameRule,
        gameRuleID: data.gameRuleID
    };
    NetworkManager.send(route, requestData, data.succ || 'CreateUnionRoomAgainSucc', data.fail || 'CreateUnionRoomAgainFail');
}

// 加入联盟
api.joinUnionRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.joinUnion';
    let requestData = {
        inviteID: data.inviteID
    };
    NetworkManager.send(route, requestData, cbRouter || 'JoinUnionResponse');
};

// 申请加入联盟
api.askJoinUnionRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.askJoinUnion';
    let requestData = {
        inviteID: data.inviteID,
        uid: data.uid,
    };
    NetworkManager.send(route, requestData, cbRouter || 'AskJoinUnionRequest');
};

// 审核
api.joinUnionApprove = function (data, cbRouter) {
    let route = 'hall.unionHandler.joinUnionApprove';
    let requestData = {
        uid: data.uid,
        inviteID: data.inviteID,
        approveType: data.approveType,
    };
    NetworkManager.send(route, requestData, cbRouter || 'joinUnionApprove');
};

// 查看申请列表
api.askJoinUnionListRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.askJoinUnionList';
    let requestData = {
        unionID: data.unionID,
    };
    NetworkManager.send(route, requestData, cbRouter || ' askJoinUnionList');
};

// 退出联盟
api.exitUnionRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.exitUnion';
    let requestData = {
        unionID: data.unionID
    };
    NetworkManager.send(route, requestData, cbRouter || 'ExitUnionResponse');
};

// 邀请加入联盟
api.inviteJoinUnionRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.inviteJoinUnion';
    let requestData = {
        uid: data.uid,
        unionID: data.unionID,
        partner: data.partner
    };
    NetworkManager.send(route, requestData, cbRouter || 'InviteJoinUnionResponse');
};

// 操作邀请加入联盟
api.operationInviteJoinUnionRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.operationInviteJoinUnion';
    let requestData = {
        uid: data.uid,
        unionID: data.unionID,
        agree: data.agree
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 获取联盟列表
api.getUserUnionListRequest = function (cbRouter) {
    let route = 'hall.unionHandler.getUserUnionList';
    let requestData = {};
    NetworkManager.send(route, requestData, cbRouter || 'GetUserUnionListResponse');
};

// 获取联盟详细信息
api.getUnionInfoRequest = function (data, cbRouter) {
    let route = 'game.unionHandler.getUnionInfo';
    let requestData = {
        unionID: data.unionID
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetUnionInfoResponse');
};

// 获取房间列表
api.getUnionRoomListRequest = function (data, cbRouter) {
    let route = 'game.unionHandler.getUnionRoomList';
    let requestData = {
        unionID: data.unionID
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetUnionRoomListResponse');
};

// 更新公告
api.updateAllUnionNoticeRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.updateUnionNotice';
    let requestData = {
        unionID: data.unionID,
        notice: data.notice
    };
    NetworkManager.send(route, requestData, cbRouter || 'UpdateUnionNoticeResponse');
};

// 更新公告
api.updateUnionNoticeRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.updateUnionNotice';
    let requestData = {
        unionID: data.unionID,
        notice: data.notice
    };
    NetworkManager.send(route, requestData, cbRouter || 'UpdateUnionNoticeResponse');
};

// 保险柜
api.saveBoxOperationRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.saveBoxOperation';
    let requestData = {
        count: data.count,
        unionID: data.unionID
    };
    NetworkManager.send(route, requestData, cbRouter || 'SaveBoxOperationResponse');
};

// 返利
api.safeBoxOperationRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.safeBoxOperation';
    let requestData = {
        unionID: data.unionID,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter || 'SafeBoxScoreResponse');
};

// 保险柜操作记录
api.safeBoxOperationRecordRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.safeBoxOperationRecord';
    let requestData = {
        type: data.type,
        startIndex: data.startIndex,
        count: data.count,
        unionID: data.unionID
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 获取成员列表
api.getMemberListRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getMemberList';
    let requestData = {
        unionID: data.unionID,
        matchData: data.matchData,
        startIndex: data.startIndex,
        count: data.count,
        partnerPage: data.partnerPage,
        isMyMember: data.isMyMember,
        type: data.type, //所有成员1  下级玩家 2  队长3 
        searchUid: data.searchUid,
        uid: data.uid,
    };
    // console.log('成员请求包', requestData)
    NetworkManager.send(route, requestData, cbRouter || 'GetMemberListResponse');
};

// 获取保底抽水
api.getTeamFixScoreRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getTeamFixScore';
    let requestData = {
        unionID: data.unionID,
        startIndex: data.startIndex,
        count: data.count,
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetTeamFixScoreResponse');
};

/**
 * 设置玩家牌桌抽水
 * @param {*} unionID 
 * @param {*} gameRuleID 
 * @param {*} userList 
 * @param {*} cbRouter 
 */
api.setUserRuleRateRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.setUserRate';
    let requestData = {
        unionID: data.unionID,
        gameRuleID: data.gameRuleID,
        userList: data.userList,
    };
    NetworkManager.send(route, requestData, cbRouter || 'SetUserRuleRateResponse');
};

/**
 * 获取玩家玩法抽水列表
 * @param {*} unionID 
 * @param {*} uid 
 * @param {*} gameRuleID 
 * @param {*} cbRouter 
 */
api.getUserRuleRateListRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.getUserRate';
    let requestData = {
        unionID: data.unionID,
        uid: data.uid,
        gameRuleID: data.gameRuleID,
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetUserRuleRateListResponse');
};

api.updateUserRateRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.updateUserRate';
    let requestData = {
        unionID: data.unionID,
        memberUid: data.memberUid,
        fixScoreRate: data.fixScoreRate,
        rebateRate: data.rebateRate,
        type: data.type,
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetUserRateResponse');
};

// 获取成员统计信息
api.getMemberStatisticsInfoRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getMemberStatisticsInfo';
    let requestData = {
        unionID: data.unionID,
        matchData: data.matchData
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 获取成员列表
api.getMemberScoreListRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getMemberScoreList';
    let requestData = {
        unionID: data.unionID,
        matchData: data.matchData,
        startIndex: data.startIndex,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetMemberListResponse');
};

// 经营统计
api.getOperateStaticisRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.userPayDetailModel';
    let requestData = {
        unionID: data.unionID,
        startIndex: data.startIndex,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetOperateStaticisResponse');
};

// 获取成员积分日志
api.getUserScoreListRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getUserScore';
    let requestData = {
        uid: data.uid,
        unionID: data.unionID,
        dayTime: data.dayTime,
        startIndex: data.startIndex,
        count: data.count,
        type: data.type
    };
    // console.log('积分日志', requestData)
    NetworkManager.send(route, requestData, cbRouter || 'GetUserScoreListResponse');
};

// 获取隔离列表
api.getForbiddenUsersRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.userBlockList';
    let requestData = {
        unionID: data.unionID,
        startIndex: data.startIndex,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetForbiddenUsersResponse');
};

api.addForbiddenRuleRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.addUserBlockRule';
    let requestData = {
        unionID: data.unionID,
    };
    NetworkManager.send(route, requestData, cbRouter || 'AddForbiddenRuleResponse');
};

api.delForbiddenRuleRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.deleteUserBlockRule';
    let requestData = {
        unionID: data.unionID,
        ruleID: data.ruleID
    };
    NetworkManager.send(route, requestData, cbRouter || 'DelForbiddenRuleResponse');
};

api.modifyForbiddenRuleRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.modifyUserToRule';
    let requestData = {
        unionID: data.unionID,
        ruleID: data.ruleID,
        type: data.type,
        userList: data.userList
    };
    NetworkManager.send(route, requestData, cbRouter || 'ModifyForbiddenRuleResponse');
};

// 获取团队详情成员列表
api.getTeamDrawListRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getTeamScore';
    let requestData = {
        unionID: data.unionID,
        startIndex: data.startIndex,
        uid: data.uid,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetMemberListResponse');
};

// 获取团队详情成员列表
api.getTeamDrawDetailRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getTeamDetail';
    let requestData = {
        unionID: data.unionID
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetMemberListResponse');
};

// 获取团队详情列表
api.getTeamDrawDetailListRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getTeamScoreDetail';
    let requestData = {
        unionID: data.unionID,
        startIndex: data.startIndex,
        uid: data.uid,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetMemberListResponse');
};

// 修改成员积分
api.modifyScoreRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.modifyScore';
    let requestData = {
        unionID: data.unionID,
        memberUid: data.memberUid,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter || 'ModifyScoreResponse');
};

// 获取玩家层级关系列表
api.getUserSpreadsRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.userDirectSeriesSuperior';
    let requestData = {
        unionID: data.unionID,
        memberUid: data.memberUid,
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetUserSpreadsResponse');
};

api.getUnionListSuggestedRequest = function (cbRouter) {
    let route = 'hall.unionHandler.unionMainList';
    let requestData = {};
    NetworkManager.send(route, requestData, cbRouter || 'UnionListSuggestedResponse');
}

// 获取返利记录
api.getUnionScoreDetailRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.userScoreRecord';
    let requestData = {
        unionID: data.unionID,
        startIndex: data.startIndex,
        count: data.count,
    };
    NetworkManager.send(route, requestData, cbRouter);
};

//设置成员参数
api.memberSetingRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.memberSeting';
    let requestData = {
        unionID: data.unionID,
        memberUid: data.memberUid,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter || 'ModifyScoreResponse');
};

// 查看积分修改日志
api.getModifyScoreRecordRequest = function (data, cbRouter) {
    // console.log('改分记录', matchData)
    let route = 'hall.unionHandler.getScoreModifyRecord';
    let requestData = {
        unionID: data.unionID,
        matchData: data.matchData,
        startIndex: data.startIndex,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 添加合伙人
api.addPartnerRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.addPartner';
    let requestData = {
        unionID: data.unionID,
        memberUid: data.memberUid
    };
    NetworkManager.send(route, requestData, cbRouter || 'AddPartnerResponse');
};

// 设为管理员
api.addManagerRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.addManager';
    let requestData = {
        isDel: data.isDel,
        unionID: data.unionID,
        memberUid: data.memberUid
    };
    NetworkManager.send(route, requestData, cbRouter || 'AddPartnerResponse');
};

// 修改队长
api.removePartner = function (data, cbRouter) {
    let route = 'hall.unionHandler.removePartner';
    let requestData = {
        memberUid: data.memberUid,
        unionID: data.unionID,
        partnerUid: data.partnerUid
    };
    NetworkManager.send(route, requestData, cbRouter || 'ModifyPartnerResponse');
};

// 取消队长
api.removeCaptainPartner = function (data, cbRouter) {
    let route = 'hall.unionHandler.removeCaptainPartner';
    let requestData = {
        memberUid: data.memberUid,
        unionID: data.unionID,
        operationUid: data.operationUid,
        isPartner: data.isPartner
    };
    NetworkManager.send(route, requestData, cbRouter || 'ModifyPartnerResponse');
};

// 修改返利比例
api.updateUnionRebateRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.updateUnionRebate';
    let requestData = {
        unionID: data.unionID,
        memberUid: data.memberUid,
        rebateRate: data.rebateRate
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 修改返利比例
api.updateUnionTicketRateRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.updateUnionTicketRebate';
    let requestData = {
        unionID: data.unionID,
        memberUid: data.memberUid,
        ticketRate: data.ticketRate
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 修改警戒值
api.updateUnionLimitRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.updateLimitScore';
    let requestData = {
        unionID: data.unionID,
        memberUid: data.memberUid,
        limitScore: data.limitScore
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 赠送积分
api.giveScoreRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.giveScore';
    let requestData = {
        unionID: data.unionID,
        giveUid: data.giveUid,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 获取赠送记录
api.getGiveScoreRecordRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getGiveScoreRecord';
    let requestData = {
        unionID: data.unionID,
        matchData: data.matchData,
        startIndex: data.startIndex,
        count: data.count,
        total: data.total
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 获取游戏记录
api.getGameRecordRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getGameRecord';
    let requestData = {
        matchData: data.matchData,
        startIndex: data.startIndex,
        count: data.count,
        uid: data.uid
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 获取游戏记录
api.getTotalGameRecordRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getGameRecordTotal';
    let requestData = {
        matchData: data.matchData,
        startIndex: data.startIndex,
        count: data.count,
        uid: data.uid
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 根据回访码获取对应的记录
api.getGameReplayRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getGameReplay';
    let requestData = {
        replayCode: data.replayCode
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 获取游戏录像
api.getVideoRecordRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getVideoRecord';
    let requestData = {
        videoRecordID: data.videoRecordID
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 获取返利记录
api.getUnionRebateRecordRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getUnionRebateRecord';
    let requestData = {
        matchData: data.matchData,
        startIndex: data.startIndex,
        count: data.count,
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 获取返利记录
api.getUnionRebateRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getTeamRebate';
    let requestData = {
        unionID: data.unionID,
        startIndex: data.startIndex,
        count: data.count,
    };
    NetworkManager.send(route, requestData, cbRouter);
};

api.getUnionMyRebateRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getMyRebate';
    let requestData = {
        unionID: data.unionID,
        startIndex: data.startIndex,
        count: data.count,
        type: data.type
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 更新禁止游戏状态
api.updateForbidGameStatusRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.updateForbidGameStatus';
    let requestData = {
        unionID: data.unionID,
        uid: data.uid,
        forbid: data.forbid
    };
    NetworkManager.send(route, requestData, cbRouter);
};

//从联盟删除玩家
api.deleteUserRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.deleteUserForUnion';
    let requestData = {
        unionID: data.unionID,
        uid: data.uid
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 更新禁止游戏状态
api.getRankRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getRank';
    let requestData = {
        unionID: data.unionID,
        matchData: data.matchData,
        startIndex: data.startIndex,
        count: data.count,
        sortData: data.sortData
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 更新禁止游戏状态
api.getMemberDelRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.userDelRecord';
    let requestData = {
        unionID: data.unionID,
        startIndex: data.startIndex,
        count: data.count,
    };
    NetworkManager.send(route, requestData, cbRouter || "MemberDelResponse");
};

// 更新禁止游戏状态
api.getRankSingleDrawRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.getRankSingleDraw';
    let requestData = {
        unionID: data.unionID,
        matchData: data.matchData,
        startIndex: data.startIndex,
        count: data.count,
        sortData: data.sortData
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 快速加入
api.quickJoinRequest = function (data) {
    let route = 'game.unionHandler.quickJoin';
    let requestData = {
        unionID: data.unionID,
        gameRuleID: data.gameRuleID
    };
    NetworkManager.send(route, requestData, data.succ || 'QuickJoinSucc', data.fail || 'QuickJoinFail');
};

// 快速加入
api.getHongBaoRequest = function (data, cbRouter) {
    let route = 'game.unionHandler.getHongBao';
    let requestData = {
        unionID: data.unionID
    };
    NetworkManager.send(route, requestData, cbRouter);
};
// --------------------------------------------联盟管理相关------------------------------------------
// 添加房间列表规则
api.addRoomRuleListRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.addRoomRuleList';
    let requestData = {
        unionID: data.unionID,
        gameType: data.gameType,
        ruleName: data.ruleName,
        roomRule: data.roomRule
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 更新房间列表规则
api.updateRoomRuleListRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.updateRoomRuleList';
    let requestData = {
        unionID: data.unionID,
        _id: data.ruleID,
        gameType: data.gameType,
        ruleName: data.ruleName,
        roomRule: data.roomRule
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 移除房间列表规则
api.removeRoomRuleListRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.removeRoomRuleList';
    let requestData = {
        unionID: data.unionID,
        roomRuleID: data.roomRuleID
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 转移联盟
api.transferUnionRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.transferUnion';
    let requestData = {
        unionID: data.unionID,
        transferUid: data.transferUid
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 修改联盟名字
api.updateUnionNameRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.updateUnionName';
    let requestData = {
        unionID: data.unionID,
        unionName: data.unionName
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 设置联盟服务费
api.updateUnionServiceFeeRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.updateUnionServerScore';
    let requestData = {
        unionID: data.unionID,
        serverScore: data.serverScore
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 设置联盟查看保底抽水
api.updateShowFixScoreRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.updateShowFixScore';
    let requestData = {
        unionID: data.unionID,
        memberUid: data.memberUid,
        isShow: data.isShow
    };
    NetworkManager.send(route, requestData, cbRouter || 'UpdateShowFixScoreResponse');
};

// 设置联盟查看保底抽水
api.updateUserFixScoreRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.updateUserFixScore';
    let requestData = {
        unionID: data.unionID,
        memberUid: data.memberUid,
        fixScoreRate: data.fixScoreRate
    };
    NetworkManager.send(route, requestData, cbRouter || 'UpdateUserFixScoreResponse');
};

// 设置邀请好友
api.getAllOnLineList = function (data, cbRouter) {
    let route = 'hall.unionHandler.getAllOnLineList';
    let requestData = {
        unionID: data.unionID,
        matchData: data.matchData,
        startIndex: data.startIndex,
        count: data.count,
    };
    NetworkManager.send(route, requestData, cbRouter || 'getAllOnLineList');
};

// 设置联盟牌桌排序
api.updateUnionTableSortRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.updateUnionTableSort';
    let requestData = {
        unionID: data.unionID,
        tableSort: data.tableSort,
    };
    //0-空桌在后 1-空桌在前 
    // console.log('切换排序----1', requestData)
    NetworkManager.send(route, requestData, cbRouter);
};

// 设置联盟牌桌颜色
api.updateUnionSkinRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.updateUnionTableColor';
    let requestData = {
        unionID: data.unionID,
        tableColor: data.tableColor,
        unionBg: data.unionBg,
        tableStyle: data.tableStyle
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 设置联盟抽水模式
api.updateUnionPumpRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.UpdatePumpWaterPattern';
    let requestData = {
        unionID: data.unionID,
        pumpWaterPattern: data.pumpWaterPattern
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 批量设置联盟信息
api.updateUnionInfoRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.updateUnionInfo';
    let requestData = {
        unionID: data.unionID,
        unionInfo: data.unionInfo
    };
    // console.log('联盟设置', unionInfo)
    NetworkManager.send(route, requestData, cbRouter);
};

// 解散联盟
api.dismissUnionRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.deleteUnion';
    let requestData = {
        unionID: data.unionID,
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 合伙人公告
api.updatePartnerNoticeSwitchRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.updatePartnerNoticeSwitch';
    let requestData = {
        unionID: data.unionID,
        isOpen: data.isOpen
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 打烊设置
api.updateOpeningStatusRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.updateOpeningStatus';
    let requestData = {
        unionID: data.unionID,
        isOpen: data.isOpen
    };
    NetworkManager.send(route, requestData, cbRouter);
};

/**
 * 解散房间
 * @param {*} data 
 * @param {*} cbRouter 
 */
api.dismissRoomRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.dismissRoom';
    let requestData = {
        unionID: data.unionID,
        roomID: data.roomID
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 设置红包活动
api.hongBaoSettingRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.hongBaoSetting';
    let requestData = {
        unionID: data.unionID,
        status: data.status,
        startTime: data.startTime,
        endTime: data.endTime,
        count: data.count,
        totalScore: data.totalScore
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 红包抽奖状态设置
api.updateLotteryStatusRequest = function (data, cbRouter) {
    let route = 'game.unionMgrHandler.updateLotteryStatus';
    let requestData = {
        unionID: data.unionID,
        isOpen: data.isOpen
    };
    NetworkManager.send(route, requestData, cbRouter);
};

// 操作申请加入联盟的请求
// --------------------------------------------充值相关------------------------------------------
// 充值
api.rechargeRequest = function (data, cbRouter) {
    let route = 'hall.rechargeHandler.recharge';
    let requestData = {
        count: data.count,
        rechargePlatform: data.rechargePlatform,
        rechargeInfo: data.rechargeInfo
    };
    NetworkManager.send(route, requestData, cbRouter || 'RechargeResponse');
};

api.getRecordDataRequest = function (data, cbRouter) {
    let route = 'hall.recordHandler.getRecordData';
    let requestData = {
        recordType: data.recordType,
        startIndex: data.startIndex,
        count: data.count,
        matchData: data.matchData
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetRecordDataResponse')
};

api.getDirectlyMemberRecordDataRequest = function (data, cbRouter) {
    let route = 'hall.recordHandler.getDirectlyMemberRecordData';
    let requestData = {
        startIndex: data.startIndex,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetDirectlyMemberRecordDataResponse')
};

api.getAgentMemberRecordDataRequest = function (data, cbRouter) {
    let route = 'hall.recordHandler.getAgentMemberRecordData';
    let requestData = {
        startIndex: data.startIndex,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetAgentMemberRecordDataResponse')
};

api.createRoomRequest = function (data) {
    let route = 'game.unionHandler.createRoom';
    let requestData = {
        unionID: data.unionID,
        gameRule: data.gameRule,
        gameRuleID: data.gameRuleID,
        roomID: data.roomID,
        createAndWatch: data.createAndWatch,
        gameType: data.gameType
    };
    // console.log('创建房间', requestData);
    NetworkManager.send(route, requestData, data.succ || 'CreateRoomSuccess', data.fail || 'CreateRoomFail');
};

api.joinRoomRequest = function (data) {
    let route = 'hall.gameHandler.joinRoom';
    let requestData = {
        roomID: data.roomID,
        gameType: data.gameType
    };
    NetworkManager.send(route, requestData, data.cbRouter || 'JoinRoomResponse', data.cbFail || 'JoinRoomFailed');
};

api.readEmailRequest = function (data, cbRouter) {
    let route = 'hall.emailHandler.readEmail';
    let requestData = {
        emailID: data.emailID
    };
    NetworkManager.send(route, requestData, cbRouter || 'ReadEmailResponse')
};

api.sendCustomerServiceMsgRequest = function (data, cbRouter) {
    let route = 'hall.emailHandler.sendCustomerServiceMsg';
    let requestData = {
        content: data.content
    };
    NetworkManager.send(route, requestData, cbRouter || 'SendCustomerServiceMsgResponse');
};

api.getNetDelay = function (success) {
    let route = 'connector.reportHandler.getNetworkDelay';
    let reqTime = Date.now();
    NetworkManager.send(route, {}, () => {
        let time = (Date.now() - reqTime) / 2;
        success && success({
            code: 0,
            msg: {
                delay: parseInt(time)
            }
        })
    }, () => {
        success && success({
            code: 0,
            msg: {
                delay: 460
            }
        })
    });
};

// 获取联盟玩家禁止游戏列表
api.getUnionUserGameLimitRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.userLimitRecord';
    let requestData = {
        uid: data.uid,
        unionID: data.unionID
    };
    NetworkManager.send(route, requestData, cbRouter || 'UnionUserGameLimitResponse');
};

// 刷新联盟玩家禁止游戏列表
api.addUnionUserGameLimitRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.userLimitAdd';
    let requestData = {
        uid: data.uid,
        unionID: data.unionID,
        list: data.list
    };
    NetworkManager.send(route, requestData, cbRouter || 'AddUnionUserGameLimitResponse');
};

//批量修改玩家积分  只能增加
api.modifyRobotScoresRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.updateRobotScore';
    let requestData = {
        unionID: data.unionID,
        userList: data.userList,
        count: data.count
    };
    // console.log('批量投放', requestData)
    NetworkManager.send(route, requestData, cbRouter || 'ModifyRobotScoresResponse');
};

api.getRechargeOrderRequest = function (data, cbRouter) {
    let route = 'hall.rechargeHandler.rechargeItem';
    let requestData = {
        type: data.type,
        count: data.count
    };
    // console.log('清单数据', requestData)
    NetworkManager.send(route, requestData, cbRouter || 'GetRechargeOrderResponse');
};

api.getRechargeRecordRequest = function (data, cbRouter) {
    let route = 'hall.rechargeHandler.orderList';
    let requestData = {
        startIndex: data.startIndex,
        count: data.count,
    };
    NetworkManager.send(route, requestData, cbRouter || 'GetRechargeRecordResponse');
};

api.getRechargeRequest = function (cbRouter) {
    let route = 'hall.rechargeHandler.goldList';
    let requestData = {};
    NetworkManager.send(route, requestData, cbRouter || 'GetRechargeResponse');
};

// 钻石
api.transferGoldRequest = function (data, cbRouter) {
    let route = 'hall.userHandler.transferGold';
    let requestData = {
        uid: data.uid,
        count: data.count
    };
    NetworkManager.send(route, requestData, cbRouter || 'SearchResponse')
};

/**输赢限制 */
api.setUserWinScoreLimitRequest = function (data, cbRouter) {
    let route = 'hall.unionHandler.setWinningLimitScore';
    let requestData = {
        unionID: data.unionID,
        memberUid: data.memberUid,
        operationUid: data.operationUid,
        floatScore: data.floatScore,
        targetScore: data.targetScore,
    };
    NetworkManager.send(route, requestData, cbRouter || 'SetUserWinScoreLimitResponse')
};