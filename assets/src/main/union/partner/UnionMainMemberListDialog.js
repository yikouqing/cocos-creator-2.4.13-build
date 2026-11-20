const Utils = require('../../../utils/Utils');
const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const Enums = require('../../../const/Enums');
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const ConfigModel = require('../../../model/ConfigModel');
const titleName = {
    allmembers: '所有成员',
    mymember: '我的成员',
    tuanduitongji: '团队统计',
    partner: '队长',
    myrebate: '我的返利',
    apply: '申请审核',
    geli: '隔离列表',
    jifen: '积分管理',
    baodi: '保底抽水',
    gaifen: '改分记录',
    jifenrizhi: '积分日志',
    jingying: '经营统计',
}

cc.Class({
    extends: cc.Component,

    properties: {
        memberPrefab: cc.Prefab,
        partnerPrefab: cc.Prefab,
        scorePrefab: cc.Prefab,//积分管理
        modifyRecordPrefab: cc.Prefab,//改分记录
        rebateRecordPrefab: cc.Prefab,//我的返利
        scoreRecordPrefab: cc.Prefab,//积分日志
        teamFixScorePrefab: cc.Prefab,//保底抽水
        forbiddenGroupPrefab: cc.Prefab,//小黑屋
        joinCheckPrefab: cc.Prefab, //申请审核
        jingYingItemPrefab: cc.Prefab,//经营统计
        togTeamDraw: cc.Toggle, //团队统计
        togAllMember: cc.Toggle, //所有成员
        togMyMember: cc.Toggle, //我的成员
        togPartner: cc.Toggle, //我的队长
        togScoreManager: cc.Toggle,//积分管理
        togModifyRecord: cc.Toggle,//改分记录
        togScoreRecord: cc.Toggle,//积分日志
        togMyRebate: cc.Toggle,//我的返利
        togFixScore: cc.Toggle,//保底抽水
        togForbidden: cc.Toggle,//小黑屋
        togShenhe: cc.Toggle, //申请审核
        togJingYing: cc.Toggle,//经营统计
        titleMembers: cc.Node,
        titlePartner: cc.Node,
        titleScore: cc.Node,
        titleFixScore: cc.Node,
        titleModifyScore: cc.Node,
        titleMyRebate: cc.Node,
        titleScoreRecord: cc.Node,
        titleForbidden: cc.Node,
        titleShenhe: cc.Node, //申请审核
        titleJingYing: cc.Node,
        btnAddMember: cc.Node,
        btnAddPartner: cc.Node,
        mainSearchLay: cc.Node,
        idEditBox: cc.EditBox,
        listView: cc.Node,
        teamDrawView: cc.Node,
        sycyView: cc.Node,
        sycyViewScoreTitle: cc.Node,
        sycyViewRebateTitle: cc.Node,
        sycyContent: cc.Node,
        wdcyView: cc.Node,
        wdcyContent: cc.Node,
        partnerView: cc.Node,
        wddzViewRebateTitle: cc.Node,
        wddzViewScoreTitle: cc.Node,
        wddzViewFixLimitTitle: cc.Node,
        partnerContent: cc.Node,
        jfglView: cc.Node,
        jfglContent: cc.Node,
        gfjlView: cc.Node,
        gfjlContent: cc.Node,
        bdcsView: cc.Node,
        bdcsContent: cc.Node,
        wdflView: cc.Node,
        wdflContent: cc.Node,
        jfrzView: cc.Node,
        jfrzContent: cc.Node,
        gllbView: cc.Node,
        gllbContent: cc.Node,
        sqshView: cc.Node, // 申请审核
        sqshContent: cc.Node,
        jytjView: cc.Node,
        jytjContent: cc.Node,
        pageLabel: cc.Label,
        pageLay: cc.Node, //分页标签
        scoreModifyDateLbl: cc.Label,
        modifyScoreCountLay: cc.Node,
        scoreRecordTotalLabel: cc.Label,
        scoreRecordLastLabel: cc.Label,
        scoreRecordTodayLabel: cc.Label,
        scoreManagerInfoLay: cc.Node,
        totalPlayerCountLbl: cc.Label, //总人数
        totalPlayerScoreLbl: cc.Label, //总分数
        partnerInfoLay: cc.Node,
        partnerTotalPlayerCountLbl: cc.Label, //总人数
        partnerTotalPlayerScoreLbl: cc.Label, //总分数
        teamDetailTodayWins: cc.Label,
        teamDetailTodayBate: cc.Label,
        teamDetailYestodayWins: cc.Label,
        teamDetailYestodayBate: cc.Label,
        teamDetailTotalScore: cc.Label,
        teamDetailMyRebate: cc.Label,
        teamDetailTeamPlayers: cc.Label,
        teamDetailGameRounds: cc.Label,
        teamDetailPartner: cc.Label,
        teamDetailMembers: cc.Label,
        teamDetailLowMembers: cc.Label,
        teamDetailTodayTotalRebate: cc.Label,
        teamDetailYestodayTotalRebate: cc.Label,
        teamTestWinsNode: cc.Node,
        teamTestWinsLbl: cc.Label,
        fixScoreLay: cc.Node,
        fixTotalRate: cc.Label,
        myRebateLay: cc.Node,
        myRebateDrawScoreLay: cc.Node,
        myRebateScoreLbl: cc.Label,
        scoreRecordDateLay: cc.Node,
        scoreRecordDateLbl: cc.Label,
        forbiddenLay: cc.Node,
        btnMemberDelLog: cc.Node,
        applyRedBar: cc.Node,
        mainList: cc.Node,//五皮
        mainTitle: cc.Label,//五皮
        mainBtn: cc.Node,//五皮

        _userInfo: null,
        _unionInfo: null,
        _unionID: 0,
        _unionOwnerID: 0,
        _curIndex: 0,
        _maxAllMemberIndex: 0,
        _maxMyMemberIndex: 0,
        _maxPartnerIndex: 0,
        _maxGaiFenIndex: 0,
        _maxJiFenIndex: 0,
        _maxBaoDiIndex: 0,
        _maxFanLiIndex: 0,
        _maxRiZhiIndex: 0,
        _maxGeLiIndex: 0,
        _maxSqshIndex: 0,
        _maxJytjIndex: 0,
        _curTogType: '',
        _perCount: 10,
        _memberListReqType: 0, //0-所有成员 1-我的成员
        _recordListType: 'addScore', //改分记录类型
        _gaiveStartIndex: 0,
        _gaiveMaxCount: 0,
        _gaivePerCount: 0,
        _isPartner: false,
        _isManager: false,
        _showFixScore: false,
        _canDrawRebate: false,
        _canDrawRebateScore: 0,
        _dateIndex: 0,
        _scoreModifyDateIndex: 0,
        _scoreRecordType: 'jfrzqb',
        _showPages: null,//参数对照解释在本脚本最下方
        _curSpreaderId: null,//当前操作者的UID  新增
    },

    start() {
        MessageCallback.addListener("UnionMainMemberSync", this);
        this._init();
    },

    _init() {
        this._curTogType = null;
        this._dateIndex = 0;
        this._perCount = 10;
        this._gaivePerCount = 10;
        this._scoreModifyDateIndex = 0;
        this._scoreRecordType = 'jfrzqb';
        this._recordListType = 'addScore';
        this._myUid = UserModel.getData('uid');
        this._unionID = UserModel.getOpUnionId();
        this._userUnion = UserModel.getUserUnion(this._unionID);
        let curUnionData = UserModel.getData('curUnionData');
        this._userInfo = UserModel.getUnionInfo(this._unionID);
        if (!this._userInfo || !curUnionData) {
            AssetsManager.tableDialog('页面数据初始化失败~');
            return;
        }
        this._unionInfo = curUnionData.unionInfo;
        this._userInfo.uid = this._myUid;
        this._userInfo.avatar = UserModel.getData('avatar');
        this._userInfo.nickname = UserModel.getData('nickname');
        this._showPages = this.node.nodeParams.showPages;
        this._backPages = this.node.nodeParams.backPages;
        this._showFixScore = this._userInfo.showFixScore;
        this._curSpreaderId = this.node.nodeParams.spreaderID;
        this._curSpreaderId = this._curSpreaderId || this._myUid;
        this._unionOwnerID = this._unionInfo.ownerUid;
        this._isPartner = this._userInfo.partner; //合伙人
        this._isManager = this._userInfo.manager; //管理
        this._isOwner = this._myUid == this._unionOwnerID; //盟主
        this._isMatch = !!this._unionInfo && this._unionInfo.unionType != Enums.UnionType.NORMAL; //匹配场
        const allMemberPage = (!!this._isOwner || (!!this._isManager && !this._isPartner)) && (!this._showPages || !!this._showPages.includes('allmembers'));
        if (this.togAllMember) this.togAllMember.node.active = !!allMemberPage;
        const myMemberPage = (!!this._isOwner || !!this._isManager || !!this._isPartner) && (!this._showPages || !!this._showPages.includes('mymember'));
        if (this.togMyMember) this.togMyMember.node.active = !!myMemberPage;
        const partnerPage = (!!this._isOwner || this._isPartner || this._isManager) && (!this._showPages || !!this._showPages.includes('partner'));
        if (this.togPartner) this.togPartner.node.active = !!partnerPage;
        const teamDetailPage = (!!this._isOwner || !!this._isManager || !!this._isPartner) && !!this._isMatch && (!this._showPages || !!this._showPages.includes('tuanduitongji'));
        if (this.togTeamDraw) this.togTeamDraw.node.active = !!teamDetailPage;
        const baoDiPage = (!!this._isOwner || !!this._isManager || !!this._isPartner || !!this._showFixScore) && !!this._isMatch && (!this._showPages || !!this._showPages.includes('baodi'));
        if (this.togFixScore) this.togFixScore.node.active = !!baoDiPage;
        const jiFenRiZhiPage = (!!this._isOwner || !!this._isManager) && !!this._isMatch && (!this._showPages || !!this._showPages.includes('jifenrizhi'));
        if (this.togScoreRecord) this.togScoreRecord.node.active = !!jiFenRiZhiPage;
        const meRebatePage = (!!this._isOwner || !!this._isPartner) && !!this._isMatch && (!this._showPages || !!this._showPages.includes('myrebate'));
        if (this.togMyRebate) this.togMyRebate.node.active = !!meRebatePage;
        const youXiQuanXianPage = (!!this._isOwner || !!this._isManager) && (!this._showPages || !!this._showPages.includes('geli'));
        if (this.togForbidden) this.togForbidden.node.active = !!youXiQuanXianPage;
        const shenHeGuanLiPage = (!!this._isOwner || !!this._isManager) && (!this._showPages || !!this._showPages.includes('apply'));
        if (this.togShenhe) this.togShenhe.node.active = !!shenHeGuanLiPage;
        const gaiFenJiLuPage = !!this._isMatch && (this._isOwner || this._isPartner || this._isManager) && (!this._showPages || !!this._showPages.includes('gaifen'));
        if (this.togModifyRecord) this.togModifyRecord.node.active = !!gaiFenJiLuPage;
        const jiFenGuanLiPage = !!this._isMatch && (this._isOwner || this._isPartner || this._isManager) && (!this._showPages || !!this._showPages.includes('jifen'));
        if (this.togScoreManager) this.togScoreManager.node.active = !!jiFenGuanLiPage;
        const jingYingPage = (this._isOwner || this._isManager) && (!this._showPages || !!this._showPages.includes('jingying'));
        if (this.togJingYing) this.togJingYing.node.active = !!jingYingPage;
        // 传入参数为一个 不显示选择列表
        if (this.mainBtn && this._showPages) this.mainBtn.active = this._showPages.length != 1;
        this._showApplyRed(false);
        this._loadApplyList();
        let pageTag = 'allmembers';
        if (!!this._showPages) {
            if (!!allMemberPage) {
                if (this.togAllMember) this.togAllMember.isChecked = true;
                pageTag = 'allmembers';
            } else if (!!myMemberPage) {
                if (this.togMyMember) this.togMyMember.isChecked = true;
                pageTag = 'mymember';
            } else if (!!teamDetailPage) {
                if (this.togTeamDraw) this.togTeamDraw.isChecked = true;
                pageTag = 'tuanduitongji';
            } else if (!!partnerPage) {
                if (this.togPartner) this.togPartner.isChecked = true;
                pageTag = 'partner';
            } else if (!!jiFenGuanLiPage) {
                if (this.togScoreManager) this.togScoreManager.isChecked = true;
                pageTag = 'jifen';
            } else if (!!youXiQuanXianPage) {
                if (this.togForbidden) this.togForbidden.isChecked = true;
                pageTag = 'geli';
            } else if (!!baoDiPage) {
                if (this.togFixScore) this.togFixScore.isChecked = true;
                pageTag = 'baodi';
            } else if (!!meRebatePage) {
                if (this.togMyRebate) this.togMyRebate.isChecked = true;
                pageTag = 'myrebate';
            } else if (!!jiFenRiZhiPage) {
                if (this.togScoreRecord) this.togScoreRecord.isChecked = true;
                pageTag = 'jifenrizhi';
            } else if (!!shenHeGuanLiPage) {
                if (this.togShenhe) this.togShenhe.isChecked = true;
                pageTag = 'apply';
            } else if (!!gaiFenJiLuPage) {
                if (this.togModifyRecord) this.togModifyRecord.isChecked = true;
                pageTag = 'gaifen';
            } else if (!!jingYingPage) {
                if (this.togJingYing) this.togJingYing.isChecked = true;
                pageTag = 'jingying';
            }
        } else {
            if (this._isOwner || this._isManager) {
                pageTag = 'allmembers';
                if (this.togAllMember) this.togAllMember.isChecked = true;
            } else if (this._isPartner) {
                pageTag = 'mymember';
                if (this.togMyMember) this.togMyMember.isChecked = true;
            } else {
                pageTag = 'gaifen';
                if (this.togModifyRecord) this.togModifyRecord.isChecked = true;
            }
        }
        this._pageSwitch(pageTag);
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'UnionMainMemberSync':
                this._onPageSyncCallback();
                break;
        }
    },

    onDestroy() {
        MessageCallback.removeListener("UnionMainMemberSync", this);
    },

    _loadMemberList(memberType, isOwner) {
        this._memberListReqType = this._curTogType == 'allmembers' ? 0 : 1;
        let matchData = {
            unionInfo: {
                $elemMatch: {
                    unionID: this._unionID
                }
            }
        };
        if (this._memberListReqType == 1) {
            matchData.unionInfo.$elemMatch.spreaderID = this._curSpreaderId;
        }

        if (this.idEditBox.string.length > 0) {
            if (this.idEditBox.string.length !== 6) {
                AssetsManager.tipDialog("请输入正确的玩家ID");
                return;
            }
        }
        let searchUid = this.idEditBox.string.length == 6 ? this.idEditBox.string : null;
        let type = this._curTogType == 'allmembers' ? 1 : 2;
        let reqData = {
            unionID: this._unionID,
            matchData: matchData,
            startIndex: this._curIndex * this._perCount,
            count: this._perCount,
            partnerPage: isOwner,
            isMyMember: true,
            type: type,
            searchUid: searchUid,
        };
        ApiHall.getMemberListRequest(reqData, (res) => {
            let maxIndex = Math.floor(res.msg.recordCount / this._perCount);
            if (res.msg.recordCount % this._perCount != 0) maxIndex += 1;
            if (memberType == 'allmembers') {
                this._maxAllMemberIndex = maxIndex;
            } else {
                this._maxMyMemberIndex = maxIndex;
            }
            let content = memberType == 'allmembers' ? this.sycyContent : this.wdcyContent;
            if (!content || !cc.isValid(content)) return;
            content.destroyAllChildren();
            if (this._curTogType == 'allmembers' || this._curTogType == 'mymember') {
                if (maxIndex > 0) {
                    this.pageLabel.string = `${this._curIndex + 1}/${maxIndex}`;
                } else {
                    this.pageLabel.string = '0/0';
                }
            }
            let selfIndex = res.msg.recordArr.findIndex(item => item.uid == this._myUid);
            if (selfIndex > -1) {
                let selfPlayer = res.msg.recordArr[selfIndex];
                res.msg.recordArr.splice(selfIndex, 1);
                res.msg.recordArr.unshift(selfPlayer);
            }
            let ownerIndex = res.msg.recordArr.findIndex(item => item.uid == this._unionOwnerID);
            if (ownerIndex > -1) {
                let unionOwnerPlayer = res.msg.recordArr[ownerIndex];
                res.msg.recordArr.splice(ownerIndex, 1);
                res.msg.recordArr.unshift(unionOwnerPlayer);
            }
            for (let i = 0; i < res.msg.recordArr.length; ++i) {
                let node = cc.instantiate(this.memberPrefab);
                let ctrl = node.getComponent('UnionMemberListItem');
                ctrl.initWidget(this._unionInfo, res.msg.recordArr[i], this._unionID, this._unionOwnerID);
                node.parent = content;
            }
        });
    },

    _loadMyRebateList() {
        ApiHall.getUnionMyRebateRequest({
            unionID: this._unionID,
            startIndex: this._curIndex * this._perCount,
            count: this._perCount
        }, (res) => {
            this._maxFanLiIndex = Math.floor(res.msg.recordCount / this._perCount);
            if (res.msg.recordCount % this._perCount != 0) this._maxFanLiIndex += 1;
            if (this.myRebateDrawScoreLay) this.myRebateDrawScoreLay.active = parseFloat(res.msg.safeScore) > 0;
            this._canDrawRebate = parseFloat(res.msg.safeScore) > 0;
            this._canDrawRebateScore = res.msg.safeScore
            this.myRebateScoreLbl.string = `可领取${Utils.formatNumberWithSymbol(res.msg.safeScore, 2)}分`;
            this.wdflContent.destroyAllChildren();
            if (this._curTogType == 'myrebate') {
                if (this._maxFanLiIndex > 0) {
                    this.pageLabel.string = `${this._curIndex + 1}/${this._maxFanLiIndex}`;
                } else {
                    this.pageLabel.string = '0/0';
                }
            }
            for (let i = 0; i < res.msg.recordArr.length; ++i) {
                let node = cc.instantiate(this.rebateRecordPrefab);
                let ctrl = node.getComponent('UnionRebateRecordListItem');
                ctrl.initWidget(res.msg.recordArr[i]);
                node.parent = this.wdflContent;
            }
        });
    },

    _loadPartnerList(isOwner) {
        let matchData = {
            unionInfo: {
                $elemMatch: {
                    unionID: this._unionID,
                    spreaderID: !!this._userInfo.manager ? this._unionOwnerID : this._userInfo.uid,
                    partner: true
                }
            }
        };
        if (this.idEditBox.string.length > 0) {
            if (this.idEditBox.string.length !== 6) {
                AssetsManager.tipDialog("请输入正确的玩家ID");
                return;
            }

        }
        let searchUid = this.idEditBox.string.length == 6 ? this.idEditBox.string : null;
        let reqData = {
            unionID: this._unionID,
            matchData: matchData,
            startIndex: this._curIndex * this._perCount,
            count: this._perCount,
            partnerPage: isOwner,
            isMyMember: false,
            type: 3,
            searchUid: searchUid,
        };
        ApiHall.getMemberListRequest(reqData, (res) => {
            let recordArr = res.msg.recordArr;
            this._maxPartnerIndex = Math.floor(res.msg.recordCount / this._perCount);
            if (res.msg.recordCount % this._perCount != 0) this._maxPartnerIndex += 1;
            this.partnerTotalPlayerCountLbl.string = res.msg.totalCount;
            this.partnerTotalPlayerScoreLbl.string = Utils.formatNumberWithSymbol(res.msg.totalScore, 1);
            if (this._curTogType == 'partner') {
                if (this._maxPartnerIndex > 0) {
                    this.pageLabel.string = `${this._curIndex + 1}/${this._maxPartnerIndex}`;
                } else {
                    this.pageLabel.string = '0/0';
                }
            }
            this.partnerContent.removeAllChildren();
            for (let i = 0; i < recordArr.length; i++) {
                let record = recordArr[i];
                if (!record) continue;
                let item = cc.instantiate(this.partnerPrefab);
                item.parent = this.partnerContent;
                let ctrl = item.getComponent("UnionLowPartnerItem");
                item.showPages = this._showPages;
                ctrl.initWidget(this._unionInfo, record, this._unionID, this._unionOwnerID);
            }
        });
    },

    _loadScoreList() {
        let matchData = {
            unionInfo: {
                $elemMatch: {
                    unionID: this._unionID
                }
            }
        };
        if (!this._isOwner && !this._isManager) {
            matchData.unionInfo.$elemMatch.spreaderID = this._myUid;
        }
        if (this.idEditBox.string.length > 0) {
            if (this.idEditBox.string.length !== 6) {
                AssetsManager.tipDialog("请输入正确的玩家ID");
                return;
            }
            matchData.uid = this.idEditBox.string;
        }
        let reqData = {
            unionID: this._unionID,
            matchData: matchData,
            startIndex: this._curIndex * this._perCount,
            count: this._perCount
        };
        ApiHall.getMemberScoreListRequest(reqData, (res) => {
            let recordArr = res.msg.recordArr;
            this.totalPlayerCountLbl.string = res.msg.totalCount;
            this.totalPlayerScoreLbl.string = Utils.formatNumberWithSymbol(res.msg.totalScore, 1);
            this._maxJiFenIndex = Math.floor(res.msg.recordCount / this._perCount);
            if (res.msg.recordCount % this._perCount != 0) this._maxJiFenIndex += 1;
            if (this._curTogType == 'jifen') {
                if (this._maxJiFenIndex > 0) {
                    this.pageLabel.string = `${this._curIndex + 1}/${this._maxJiFenIndex}`;
                } else {
                    this.pageLabel.string = '0/0';
                }
            }
            this.jfglContent.removeAllChildren();
            // this.memberTotalScore.string = res.msg.totalScore;
            for (let i = 0; i < recordArr.length; i++) {
                let record = recordArr[i];
                let item = cc.instantiate(this.scorePrefab);
                let ctrl = item.getComponent("UnionMemberScoreItem");
                item.parent = this.jfglContent;
                ctrl.initWidget(record, this._unionID, this._unionOwnerID);
            }
        });
    },

    _showApplyRed(isShow) {
        MessageCallback.emitMessage('OnApplyJoinStatusSync', isShow);
        if (this.applyRedBar) this.applyRedBar.active = isShow && (this._isOwner || this._isManager);
    },

    _loadStaticisList() {
        let reqData = {
            unionID: this._unionID,
            startIndex: this._curIndex * this._perCount,
            count: this._perCount
        };
        ApiHall.getOperateStaticisRequest(reqData, (res) => {
            let recordArr = res.msg.recordArr;
            this._maxJytjIndex = Math.floor(res.msg.totalCount / this._perCount);
            if (res.msg.totalCount % this._perCount != 0) this._maxJytjIndex += 1;
            if (this._curTogType == 'jingying') {
                if (this._maxJytjIndex > 0) {
                    this.pageLabel.string = `${this._curIndex + 1}/${this._maxJytjIndex}`;
                } else {
                    this.pageLabel.string = '0/0';
                }
            }
            if (!cc.isValid(this.jytjContent)) return;
            this.jytjContent.removeAllChildren();
            for (let i = 0; i < recordArr.length; i++) {
                let record = recordArr[i];
                let item = cc.instantiate(this.jingYingItemPrefab);
                let ctrl = item.getComponent("UnionOperateStaticsYingItem");
                item.parent = this.jytjContent;
                ctrl.initWidget(record);
            }
        });
    },

    _loadApplyList() {
        if (!this._isOwner && !this._isManager) return;
        this._showApplyRed(false);
        if (this.sqshContent) this.sqshContent.removeAllChildren();
        ApiHall.askJoinUnionListRequest({ unionID: this._unionID }, (res) => {
            let recordArr = res.list || [];
            this._showApplyRed(!!recordArr.length);
            if (this.sqshContent) this.sqshContent.removeAllChildren();
            if (!this.sqshView.active || !recordArr.length) return;
            recordArr.forEach((record) => {
                record.onSync = this._onApplySync.bind(this);
                let item = cc.instantiate(this.joinCheckPrefab);
                let ctrl = item.getComponent("UnionJoinCheckItem");
                item.parent = this.sqshContent;
                ctrl.initWidget(record);
            })
        })
    },

    _loadForbiddenList() {
        let reqData = {
            unionID: this._unionID,
            startIndex: this._curIndex * this._perCount,
            count: this._perCount
        };
        ApiHall.getForbiddenUsersRequest(reqData, (res) => {
            let recordArr = res.msg.recordArr;
            this._maxGeLiIndex = Math.floor(res.msg.totalCount / this._perCount);
            if (res.msg.totalCount % this._perCount != 0) this._maxGeLiIndex += 1;
            if (this._curTogType == 'geli') {
                if (this._maxGeLiIndex > 0) {
                    this.pageLabel.string = `${this._curIndex + 1}/${this._maxGeLiIndex}`;
                } else {
                    this.pageLabel.string = '0/0';
                }
            }
            this.gllbContent.removeAllChildren();
            for (let i = 0; i < recordArr.length; i++) {
                let record = recordArr[i];
                let item = cc.instantiate(this.forbiddenGroupPrefab);
                let ctrl = item.getComponent("UnionForbiddenGroupListItem");
                item.parent = this.gllbContent;
                record.index = i;
                record.onSync = this._onForbiddenSync.bind(this);
                ctrl.initWidget(record);
            }
        });
    },

    _onApplySync() {
        this._curIndex = 0;
        this._maxSqshIndex = 0;
        this._loadApplyList();
    },

    _onForbiddenSync() {
        this._curIndex = 0;
        this._maxGeLiIndex = 0;
        this._loadForbiddenList();
    },

    _loadRecordList() {
        let dateTime = this._getDateTime();
        let type = 0;
        if (this._scoreRecordType == 'jfrzyf') {
            type = 1;
        } else if (this._scoreRecordType == 'jfrzsf') {
            type = 2;
        }
        let reqData = {
            unionID: this._unionID,
            dayTime: dateTime,
            startIndex: this._curIndex * this._perCount,
            count: this._perCount,
            type: type
        };
        if (this.idEditBox.string.length > 0) {
            reqData.uid = this.idEditBox.string.length;
        }
        ApiHall.getUserScoreListRequest(reqData, (res) => {
            // console.log('时间---1', res);
            let recordArr = res.msg.recordArr;
            this._maxRiZhiIndex = Math.floor(res.msg.totalCount / this._perCount);
            if (res.msg.totalCount % this._perCount != 0) this._maxRiZhiIndex += 1;
            if (this._curTogType == 'jifenrizhi') {
                if (this._maxRiZhiIndex > 0) {
                    this.pageLabel.string = `${this._curIndex + 1}/${this._maxRiZhiIndex}`;
                } else {
                    this.pageLabel.string = '0/0';
                }
            }
            this.jfrzContent.removeAllChildren();
            for (let i = 0; i < recordArr.length; i++) {
                let record = recordArr[i];
                let item = cc.instantiate(this.scoreRecordPrefab);
                let ctrl = item.getComponent("UnionScoreRecordListItem");
                item.parent = this.jfrzContent;
                ctrl.initWidget(record);
            }
        });
    },

    _getDateTime() {
        this._dateIndex = this._dateIndex || 0;
        let targetTime = Date.now() - this._dateIndex * Utils.getDayMinimumSeconds();
        let dateStr = Utils.getDateFormat(targetTime);
        this.scoreRecordDateLbl.string = dateStr.yyyymmdd;
        let yyyymmdd = dateStr.yyyymmdd.split('-');
        return yyyymmdd.join('');
    },

    _loadTeamList() {
        if (this.teamTestWinsNode) this.teamTestWinsNode.active = this._isOwner || !!this._isManager;
        ApiHall.getTeamDrawDetailRequest({
            unionID: this._unionID
        }, (res) => {
            res = res.msg;
            this.teamDetailTodayWins.string = `今日总输赢:${Utils.formatNumberWithSymbol(res.todayWin)}`;
            this.teamDetailTodayBate.string = `今日总抽水:${Utils.formatNumberWithSymbol(res.todayRebate)}`;
            this.teamDetailTodayTotalRebate.string = `今日实得:${Utils.formatNumberWithSymbol(res.curUserRebate)}`;
            this.teamDetailYestodayTotalRebate.string = `昨日实得:${Utils.formatNumberWithSymbol(res.curUserYesterdayRebate)}`;
            this.teamDetailYestodayWins.string = `昨日总输赢:${Utils.formatNumberWithSymbol(res.yesterdayWin)}`;
            this.teamDetailYestodayBate.string = `昨日总抽水:${Utils.formatNumberWithSymbol(res.yesterdayRebate)}`;
            this.teamDetailTotalScore.string = `总积分:${Utils.formatNumberWithSymbol(res.totalScore)}`;
            this.teamDetailMyRebate.string = `我的比例:${Utils.formatNumberWithSymbol(res.rebateRate * 100)}%`;
            this.teamDetailTeamPlayers.string = `总人数:${Utils.formatNumberWithSymbol(res.memberTotalCount)}`;
            this.teamDetailGameRounds.string = `游戏人次:${Utils.formatNumberWithSymbol(res.totalDraw)}`;
            this.teamDetailPartner.string = `${!!res.spreaderInfo ? 1 : 0}`;
            this.teamDetailMembers.string = `${res.memberCount}`;
            this.teamDetailLowMembers.string = `${res.outMemberCount}`;
            this.teamTestWinsLbl.string = `投放赢取:${Utils.formatNumberWithSymbol(res.testWin, 2)}`;
        });
    },

    _loadTeamFixScoreList() {
        let union = UserModel.getUnionInfo(this._unionID);
        let maxFixScoreRate = 1;
        if (this._unionOwnerID == this._myUid) {
            maxFixScoreRate = 1;
        } else if (union) {
            maxFixScoreRate = Math.floor(union.fixScoreRate);
        }
        let reqData = {
            unionID: this._unionID,
            startIndex: this._curIndex * this._perCount,
            count: this._perCount,
        };
        ApiHall.getTeamFixScoreRequest(reqData, (res) => {
            let recordArr = res.msg.recordArr;
            this.fixTotalRate.string = `${Math.floor(maxFixScoreRate * 100)}%`;
            this._maxBaoDiIndex = Math.floor(res.msg.recordCount / this._perCount);
            if (res.msg.recordCount % this._perCount != 0) this._maxBaoDiIndex += 1;
            if (this._curTogType == 'baodi') {
                if (this._maxBaoDiIndex > 0) {
                    this.pageLabel.string = `${this._curIndex + 1}/${this._maxBaoDiIndex}`;
                } else {
                    this.pageLabel.string = '0/0';
                }
            }
            this.bdcsContent.removeAllChildren();
            let userUnionInfo = UserModel.getUnionInfo(this._unionID);
            userUnionInfo = userUnionInfo || {};
            for (let i = 0; i < recordArr.length; i++) {
                let record = recordArr[i];
                if (!record) continue;
                let item = cc.instantiate(this.teamFixScorePrefab);
                record.unionID = this._unionID;
                record.unionOwnerID = this._unionOwnerID;
                record.manager = userUnionInfo.manager;
                record.partner = userUnionInfo.partner;
                record.maxFixScoreRate = maxFixScoreRate;
                item.attr({
                    nodeParams: record
                });
                item.parent = this.bdcsContent;
            }
        });
    },

    _loadGiveList() {
        if (this._gaiveStartIndex >= this._gaiveMaxCount) return;
        let day = Utils.getDayTime(this._scoreModifyDateIndex);
        this.scoreModifyDateLbl.string = day.yyyymmdd;
        let matchData = {
            "unionID": this._unionID,
            createTime: {
                $gte: day.gte,
                $lte: day.jte,
            }
        };
        if (this._recordListType === 'addScore') {
            matchData.uid = this._myUid;
            matchData.count = {
                $gt: 0
            };
        } else if (this._recordListType === 'jianScore') {
            matchData.uid = this._myUid;
            matchData.count = {
                $lt: 0
            };
        } else if (this._recordListType === 'selfAddScore') {
            matchData.gainUid = this._myUid;
            matchData.count = {
                $gt: 0
            };
        } else if (this._recordListType === 'selfJianScore') {
            matchData.gainUid = this._myUid;
            matchData.count = {
                $lt: 0
            };
        }
        if (this.idEditBox.string.length > 0) {
            if (this.idEditBox.string.length !== 6) {
                AssetsManager.tipDialog("请输入正确的玩家ID");
                return;
            }
            if (this._recordListType === 'addScore' || this._recordListType === 'jianScore') {
                matchData.gainUid = this.idEditBox.string;
            } else {
                matchData.uid = this.idEditBox.string;
            }
        }
        this._updateGaiFenDetail(null);
        let gaiveStartIndex = this._gaiveStartIndex;
        let reqData = {
            unionID: this._unionID,
            matchData: matchData,
            startIndex: gaiveStartIndex,
            count: this._gaiveMaxCount
        };
        ApiHall.getModifyScoreRecordRequest(reqData, (res) => {
            if (gaiveStartIndex != this._gaiveStartIndex) return;
            this._gaiveMaxCount = res.msg.totalCount;
            this._maxGaiFenIndex = Math.floor(res.msg.totalCount / this._gaivePerCount);
            if (res.msg.totalCount % this._gaivePerCount != 0) this._maxGaiFenIndex += 1;
            if (this._curTogType == 'gaifen') {
                if (this._maxGaiFenIndex > 0) {
                    this.pageLabel.string = `${this._curIndex + 1}/${this._maxGaiFenIndex}`;
                } else {
                    this.pageLabel.string = '0/0';
                }
            }
            let recordArr = res.msg.recordArr;
            this.gfjlContent.destroyAllChildren();
            if (recordArr.length > 0) {
                this._updateGaiFenDetail(res.msg);
                for (let i = 0; i < recordArr.length; i++) {
                    let record = recordArr[i];
                    let item = cc.instantiate(this.modifyRecordPrefab);
                    item.parent = this.gfjlContent;
                    let ctrl = item.getComponent("UnionChangeScoreRecordItem");
                    ctrl.initWidget(record);
                }
                this._gaiveStartIndex += this._gaivePerCount;
            }
        });
    },

    _updateGaiFenDetail(data) {
        let gfjlTotal = '总上分';
        let gfjlTodayTotal = '今日总上分';
        let gfjlPastTotal = '昨日总上分';
        if (this._recordListType === 'addScore') {
            gfjlTotal = '总上分';
            gfjlTodayTotal = '今日总上分';
            gfjlPastTotal = '昨日总上分';
        } else if (this._recordListType === 'jianScore') {
            gfjlTotal = '总下分';
            gfjlTodayTotal = '今日总下分';
            gfjlPastTotal = '昨日总下分';
        } else if (this._recordListType === 'selfAddScore') {
            gfjlTotal = '自己总上分';
            gfjlTodayTotal = '今日自己总上分';
            gfjlPastTotal = '昨日自己总上分';
        } else if (this._recordListType === 'selfJianScore') {
            gfjlTotal = '自己总下分';
            gfjlTodayTotal = '今日自己总下分';
            gfjlPastTotal = '昨日自己总下分';
        }
        // this.scoreRecordTodayLabel.string = `${gfjlTodayTotal}:${data?data.todayTotalCount:0}`;
        // this.scoreRecordLastLabel.string = `${gfjlPastTotal}:${data?data.yesterdayTotalCount:0}`;
        // this.scoreRecordTotalLabel.string = `${gfjlTotal}:${data?data.totalScoreCount:0}`;
        this.scoreRecordTotalLabel.string = `总计:${Utils.formatNumberWithSymbol(data ? data.totalScoreCount : 0, 2)}`;
    },

    _onPageSyncCallback() {
        let curTogType = this._curTogType;
        this._curTogType = null;
        this._pageSwitch(curTogType);
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            if (!!this._backPages && !!this._backPages.length > 0) {
                this.node.nodeParams.showPages = this._backPages;
                this.node.nodeParams.backPages = null;
                this.node.nodeParams.spreaderID = null;
                this._init();
            } else {
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
            }
        } else if (parameter === 'addMember') {
            if (this._unionOwnerID != this._myUid && !this._isPartner && !this._isManager) {
                AssetsManager.tipDialog('盟主/管理员/队长才能操作哦~');
                return;
            }
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/AddMemberDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this._unionID,
            });
        } else if (parameter === 'lowMember') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionLowMemberListDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this._unionID,
                userInfo: this._userInfo,
                unionInfo: this._unionInfo,
            });
        } else if (parameter === 'addPartner') {
            if (this._unionOwnerID != this._myUid && !this._isPartner) {
                AssetsManager.tipDialog('盟主/队长才能添加队长哦~');
                return;
            }
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/AddPartnerDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this._unionID,
            });
        } else if (parameter === 'query') {
            let uid = this.idEditBox.string;
            if (uid.length > 0 && uid.length !== 6) {
                AssetsManager.tipDialog("请输入正确的玩家ID");
                return;
            }
            if (this._curTogType == 'allmembers' || this._curTogType == "mymember") {
                this._curIndex = 0;
                if (this._curTogType == 'allmembers') {
                    this._maxAllMemberIndex = 0;
                } else {
                    this._maxMyMemberIndex = 0;
                }
                this.pageLabel.string = '0/0';
                this._loadMemberList(this._curTogType, false);
            } else if (this._curTogType == 'partner') {
                this._curIndex = 0;
                this._maxPartnerIndex = 0;
                this.pageLabel.string = '0/0';
                this._loadPartnerList(false);
            } else if (this._curTogType == 'jifen') {
                this._curIndex = 0;
                this._maxJiFenIndex = 0;
                this.pageLabel.string = '0/0';
                this._loadScoreList();
            } else if (this._curTogType == 'gaifen') {
                this._curIndex = 0;
                this._maxGaiFenIndex = 0;
                this._gaiveStartIndex = 0;
                this._gaivePerCount = 10;
                this._gaiveMaxCount = 10;
                this.pageLabel.string = '0/0';
                this._loadGiveList();
            } else if (this._curTogType == 'tuanduitongji') {
                this._curIndex = 0;
                this.pageLabel.string = '0/0';
                this._loadTeamList();
            } else if (this._curTogType == 'jifenrizhi') {
                this._curIndex = 0;
                this.pageLabel.string = '0/0';
                this._loadRecordList();
            }
        } else if (parameter === 'left') {
            let maxIndex = 0;
            if (this._curTogType == 'gaifen') {
                maxIndex = this._maxGaiFenIndex;
            } else if (this._curTogType == 'partner') {
                maxIndex = this._maxPartnerIndex;
            } else if (this._curTogType == 'mymember') {
                maxIndex = this._maxMyMemberIndex;
            } else if (this._curTogType == 'allmembers') {
                maxIndex = this._maxAllMemberIndex;
            } else if (this._curTogType == 'baodi') {
                maxIndex = this._maxBaoDiIndex;
            } else if (this._curTogType == 'myrebate') {
                maxIndex = this._maxFanLiIndex;
            } else if (this._curTogType == 'jifen') {
                maxIndex = this._maxJiFenIndex;
            } else if (this._curTogType == 'jifenrizhi') {
                maxIndex = this._maxRiZhiIndex;
            } else if (this._curTogType == 'geli') {
                maxIndex = this._maxGeLiIndex;
            } else if (this._curTogType == 'apply') {
                maxIndex = this._maxSqshIndex;
            } else if (this._curTogType == 'jingying') {
                maxIndex = this._maxJytjIndex;
            }
            if (this._curIndex === 0) {
                if (maxIndex == 0) return;
                this._curIndex = maxIndex;
            }
            this._curIndex--;

            this._gaiveStartIndex = this._curIndex * this._gaivePerCount;
            if (this._curTogType == 'allmembers' || this._curTogType == 'mymember') {

                this._loadMemberList(this._curTogType);
            } else if (this._curTogType == 'partner') {
                this._loadPartnerList(true);
            } else if (this._curTogType == 'jifen') {
                this._loadScoreList();
            } else if (this._curTogType == 'tuanduitongji') {
                this._loadTeamList();
            } else if (this._curTogType == 'gaifen') {
                this._loadGiveList();
            } else if (this._curTogType == 'baodi') {
                this._loadTeamFixScoreList();
            } else if (this._curTogType == 'myrebate') {
                this._loadMyRebateList();
            } else if (this._curTogType == 'jifenrizhi') {
                this._loadRecordList();
            } else if (this._curTogType == 'geli') {
                this._loadForbiddenList();
            } else if (this._curTogType == 'apply') {
                this._loadApplyList();
            } else if (this._curTogType == 'jingying') {
                this._loadStaticisList();
            }
        } else if (parameter === 'right') {
            let maxIndex = 0;
            if (this._curTogType == 'gaifen') {
                maxIndex = this._maxGaiFenIndex;
            } else if (this._curTogType == 'partner') {
                maxIndex = this._maxPartnerIndex;
            } else if (this._curTogType == 'mymember') {
                maxIndex = this._maxMyMemberIndex;
            } else if (this._curTogType == 'allmembers') {
                maxIndex = this._maxAllMemberIndex;
            } else if (this._curTogType == 'baodi') {
                maxIndex = this._maxBaoDiIndex;
            } else if (this._curTogType == 'myrebate') {
                maxIndex = this._maxFanLiIndex;
            } else if (this._curTogType == 'jifen') {
                maxIndex = this._maxJiFenIndex;
            } else if (this._curTogType == 'jifenrizhi') {
                maxIndex = this._maxRiZhiIndex;
            } else if (this._curTogType == 'geli') {
                maxIndex = this._maxGeLiIndex;
            } else if (this._curTogType == 'apply') {
                maxIndex = this._maxSqshIndex;
            } else if (this._curTogType == 'jingying') {
                maxIndex = this._maxJytjIndex;
            }
            if (this._curIndex >= maxIndex - 1) {
                this._curIndex = 0;
            } else {
                this._curIndex++;
            }
            this._gaiveStartIndex = this._curIndex * this._gaivePerCount;
            if (this._curTogType == 'allmembers' || this._curTogType == 'mymember') {
                this._loadMemberList(this._curTogType);
            } else if (this._curTogType == 'partner') {
                this._loadPartnerList(true);
            } else if (this._curTogType == 'jifen') {
                this._loadScoreList();
            } else if (this._curTogType == 'tuanduitongji') {
                this._loadTeamList();
            } else if (this._curTogType == 'gaifen') {
                this._loadGiveList();
            } else if (this._curTogType == 'baodi') {
                this._loadTeamFixScoreList();
            } else if (this._curTogType == 'myrebate') {
                this._loadMyRebateList();
            } else if (this._curTogType == 'jifenrizhi') {
                this._loadRecordList();
            } else if (this._curTogType == 'geli') {
                this._loadForbiddenList();
            } else if (this._curTogType == 'apply') {
                this._loadApplyList();
            } else if (this._curTogType == 'jingying') {
                this._loadStaticisList();
            }
        } else if (parameter == 'allmembers' ||
            parameter == 'mymember' ||
            parameter == 'myrebate' ||
            parameter == 'partner' ||
            parameter == 'baodi' ||
            parameter == 'jifen' ||
            parameter === 'gaifen' ||
            parameter === 'tuanduitongji' ||
            parameter === 'jifenrizhi' ||
            parameter === 'geli' ||
            parameter === 'apply' ||
            parameter === 'jingying') {
            this._pageSwitch(parameter);
        } else if (parameter === 'dateabove' || parameter === 'datenext') {
            this._dateIndex = this._dateIndex || 0;
            if (parameter === 'datenext') {
                if (this._dateIndex == 0) {
                    this._dateIndex = 2;
                } else {
                    this._dateIndex--;
                }
            } else if (parameter === 'dateabove') {
                if (this._dateIndex == 2) {
                    this._dateIndex = 0;
                } else {
                    this._dateIndex++;
                }
            }
            this._curIndex = 0;
            this._maxRiZhiIndex = 0;
            this.pageLabel.string = '0/0';
            this._loadRecordList();
        } else if (parameter === 'gfdateabove' || parameter === 'gfdatenext') {
            this._scoreModifyDateIndex = this._scoreModifyDateIndex || 0;
            if (parameter === 'gfdatenext') {
                if (this._scoreModifyDateIndex == 0) {
                    this._scoreModifyDateIndex = 2;
                } else {
                    this._scoreModifyDateIndex--;
                }
            } else if (parameter === 'gfdateabove') {
                if (this._scoreModifyDateIndex == 2) {
                    this._scoreModifyDateIndex = 0;
                } else {
                    this._scoreModifyDateIndex++;
                }
            }
            this._curIndex = 0;
            this._maxGaiFenIndex = 0;
            this.pageLabel.string = '0/0';
            this._gaiveStartIndex = 0;
            this._gaivePerCount = 10;
            this._gaiveMaxCount = 10;
            this.idEditBox.string = '';
            this._loadGiveList();
        } else if (parameter === 'addScore' ||
            parameter === 'jianScore' ||
            parameter === 'selfAddScore' ||
            parameter === 'selfJianScore') {
            if (this._recordListType == parameter) return;
            this._recordListType = parameter;
            this._curIndex = 0;
            this._maxGaiFenIndex = 0;
            this.pageLabel.string = '0/0';
            this._gaiveStartIndex = 0;
            this._gaivePerCount = 10;
            this._gaiveMaxCount = 10;
            this.idEditBox.string = '';
            this._loadGiveList();
        } else if (parameter === 'jfrzqb' ||
            parameter === 'jfrzyf' ||
            parameter === 'jfrzsf') {
            if (this._scoreRecordType == parameter) return;
            this._scoreRecordType = parameter;
            this._curIndex = 0;
            this._maxRiZhiIndex = 0;
            this.pageLabel.string = '0/0';
            this._loadRecordList();
        } else if (parameter === 'partnerRebate') {
            //团队的返利
            AssetsManager.createDialog({
                path: 'res/prefab/union/partner/UnionPartnerRebateDetailDialog',
                bundle: ConfigModel.getSkin(),
                uid: this._myUid,
                unionID: this._unionID
            });
        } else if (parameter === 'rebatedraw') {
            //团队的返利
            if (!this._canDrawRebate) {
                AssetsManager.tipDialog('暂无返利可领取！');
                return;
            }
            let reqData = {
                unionID: this._unionID,
                count: this._canDrawRebateScore
            };
            ApiHall.safeBoxOperationRequest(reqData, (res) => {
                if (res.code != 0) {
                    AssetsManager.tipDialog('领取失败，请稍候再试！');
                    return;
                }
                AssetsManager.tipDialog('领取成功！');
                if (this.myRebateDrawScoreLay) this.myRebateDrawScoreLay.active = false;
                this._canDrawRebate = false;
            });
        } else if (parameter === 'rebatedrawrecord') {
            //团队的返利
            AssetsManager.createDialog({
                path: 'res/prefab/union/partner/UnionRebateDrawRecordDialog',
                bundle: ConfigModel.getSkin(),
                unionID: this._unionID
            });
        } else if (parameter === 'dellog') {
            //团队的返利
            AssetsManager.createDialog({
                path: 'res/prefab/union/partner/UnionMemberDelRecordDialog',
                bundle: ConfigModel.getSkin(),
                unionID: this._unionID
            });
        } else if (parameter === 'forbiddennew') {
            if (CCUtil.clickInterval(event.target, 0.5, true)) return;
            ApiHall.addForbiddenRuleRequest({
                unionID: this._unionID
            }, (res) => {
                // console.log('添加规则', res);
                this._curIndex = 0;
                this._maxGeLiIndex = 0;
                this._loadForbiddenList();
            })
        } else if (parameter === 'mainList') {
            this.mainList.active = true;
            this._showPos = {
                show: cc.v2(),
                hide: cc.v2()
            }
            this.mainList.stopAllActions()
            this.mainList.getComponent(cc.Widget) && this.mainList.getComponent(cc.Widget).updateAlignment();
            this._showPos.hide = this.mainList.getPosition();
            this._showPos.show = cc.v2(this._showPos.hide.x + this.mainList.width + CCUtil.getFixWidget(), this._showPos.hide.y);
            this.mainList.opacity = 0;
            this.mainList.setPosition(this._showPos.hide);
            cc.tween(this.mainList)
                .to(0.3, {
                    opacity: 255,
                    position: cc.v3(this._showPos.show)
                })
                .start();
            // .delay(10)
            // .call(this._onMouenClose.bind(this))
        } else if (parameter === 'colseMainList') {
            this._onMouenClose()
        }
    },

    _onMouenClose() {
        this.mainList.stopAllActions()
        cc.tween(this.mainList)
            .to(0.3, {
                opacity: 0,
                position: cc.v3(this.mainList.getPosition())
            }).call(() => { this.mainList.active = false })
            .start();
    },

    _pageSwitch(parameter) {
        if (this.mainTitle) this.mainTitle.string = titleName[parameter] || '未知';
        if (this._curTogType == parameter) return;
        this._curTogType = parameter;
        this._curIndex = 0;
        this._dateIndex = 0;
        this._maxMyMemberIndex = 0;
        this._maxAllMemberIndex = 0;
        this._maxGaiFenIndex = 0;
        this._maxPartnerIndex = 0;
        this._maxRiZhiIndex = 0;
        this._maxGeLiIndex = 0;
        this._maxJiFenIndex = 0;
        this._maxBaoDiIndex = 0;
        this._maxFanLiIndex = 0;
        this._maxSqshIndex = 0;
        this._maxJytjIndex = 0;
        this._gaiveStartIndex = 0;
        this._gaivePerCount = 10;
        this._gaiveMaxCount = 10;
        //普通场
        if (this.sycyViewScoreTitle) this.sycyViewScoreTitle.active = !!this._isMatch;
        if (this.sycyViewRebateTitle) this.sycyViewRebateTitle.active = !!this._isMatch;
        if (this.wddzViewRebateTitle) this.wddzViewRebateTitle.active = !!this._isMatch;
        if (this.wddzViewFixLimitTitle) this.wddzViewFixLimitTitle.active = !!this._isMatch;
        if (this.wddzViewScoreTitle) this.wddzViewScoreTitle.active = !!this._isMatch;
        if (this.pageLay) this.pageLay.active = parameter == "baodi" ||
            parameter == "partner" ||
            parameter == "myrebate" ||
            parameter == "jifen" ||
            parameter == "allmembers" ||
            parameter == "mymember" ||
            parameter == "geli" ||
            parameter == "jifenrizhi" ||
            parameter == 'gaifen' ||
            parameter == 'jingying';
        this.pageLabel.string = '0/0';
        this.idEditBox.string = '';
        if (this.scoreManagerInfoLay) this.scoreManagerInfoLay.active = parameter == "jifen";
        if (this.partnerInfoLay) this.partnerInfoLay.active = parameter == "partner";
        if (this.modifyScoreCountLay) this.modifyScoreCountLay.active = parameter == "gaifen";
        if (this.mainSearchLay) this.mainSearchLay.active = parameter == "jifen" ||
            parameter == "jifenrizhi" ||
            parameter == "geli" ||
            parameter == "partner" ||
            parameter == "allmembers" ||
            parameter == "mymember";
        if (this.btnAddPartner) this.btnAddPartner.active = (this._isOwner ||
            !!this._isPartner ||
            !!this._isManager) && (parameter == "allmembers" ||
                parameter == "mymember");
        if (this.btnAddMember) this.btnAddMember.active = (this._isOwner ||
            !!this._isPartner ||
            !!this._isManager) &&
            (parameter == "allmembers" ||
                parameter == "mymember" ||
                parameter == "partner");
        if (this.btnMemberDelLog) this.btnMemberDelLog.active = (this._isOwner ||
            !!this._isManager) &&
            (parameter == "allmembers" ||
                parameter == "mymember" ||
                parameter == "partner") &&
            !!this._isMatch;
        if (this.titleMembers) this.titleMembers.active = parameter == 'allmembers' || parameter == 'mymember';
        if (this.titlePartner) this.titlePartner.active = parameter == 'partner';
        if (this.titleScore) this.titleScore.active = parameter == 'jifen';
        if (this.titleModifyScore) this.titleModifyScore.active = parameter == 'gaifen';
        if (this.titleFixScore) this.titleFixScore.active = parameter == 'baodi';
        if (this.fixScoreLay) this.fixScoreLay.active = parameter == 'baodi';
        if (this.teamDrawView) this.teamDrawView.active = parameter == 'tuanduitongji';
        if (this.titleMyRebate) this.titleMyRebate.active = parameter == 'myrebate';
        if (this.myRebateLay) this.myRebateLay.active = this.titleMyRebate.active;
        if (this.listView) this.listView.active = !this.teamDrawView.active;
        if (this.sycyView) this.sycyView.active = parameter == 'allmembers';
        if (this.wdcyView) this.wdcyView.active = parameter == 'mymember';
        if (this.partnerView) this.partnerView.active = parameter == 'partner';
        if (this.jfglView) this.jfglView.active = parameter == 'jifen';
        if (this.gfjlView) this.gfjlView.active = parameter == 'gaifen';
        if (this.bdcsView) this.bdcsView.active = parameter == 'baodi';
        if (this.wdflView) this.wdflView.active = parameter == 'myrebate';
        if (this.jfrzView) this.jfrzView.active = parameter == 'jifenrizhi';
        if (this.titleScoreRecord) this.titleScoreRecord.active = parameter == 'jifenrizhi';
        if (this.scoreRecordDateLay) this.scoreRecordDateLay.active = parameter == 'jifenrizhi';
        if (this.gllbView) this.gllbView.active = parameter == 'geli';
        if (this.titleForbidden) this.titleForbidden.active = parameter == 'geli';
        if (this.forbiddenLay) this.forbiddenLay.active = parameter == 'geli';
        if (this.sqshView) this.sqshView.active = parameter == 'apply'; //申请审核
        if (this.titleShenhe) this.titleShenhe.active = parameter == 'apply';
        if (this.titleJingYing) this.titleJingYing.active = parameter == 'jingying';
        if (this.jytjView) this.jytjView.active = parameter == 'jingying';
        if (parameter == "allmembers" || parameter == "mymember") {
            this._loadMemberList(parameter);
        } else if (parameter == "partner") {
            this._loadPartnerList(true);
        } else if (parameter == "myrebate") {
            this._loadMyRebateList();
        } else if (parameter == "baodi") {
            this._loadTeamFixScoreList();
        } else if (parameter == "tuanduitongji") {
            this._loadTeamList();
        } else if (parameter == "gaifen") {
            this._loadGiveList();
        } else if (parameter == "jifenrizhi") {
            this._loadRecordList();
        } else if (parameter == "geli") {
            this._loadForbiddenList();
        } else if (parameter == "jifen") {
            this._loadScoreList();
        } else if (parameter == 'apply') {
            this._loadApplyList();
        } else if (parameter == 'jingying') {
            this._loadStaticisList();
        }
    },


});

// 关于调用团队页面的使用说明：
// 1.新增showPages字段控制页面的显示，如果showPages不传（不能是空数组）则按原来的逻辑处理；
// 2.showPages字段非空时，如：['allmembers',...,'mymember']，则显示对应的页面；
// 注：以下是showPages中页面的对应关系
// allmembers-所有成员
// mymember-我的成员
// tuanduitongji-团队统计
// partner-合伙人
// myrebate-我的返利
// apply-申请审核
// geli-游戏权限/隔离列表
// jifen-积分管理
// jifenrizhi-积分日志
// baodi-保底抽水
// gaifen-改分记录
// 新框架团队页面的调整 后续用到的时候注意下