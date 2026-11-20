const ApiGd = require('./ApiGd');
const ApiRoom = require('../../../src/api/ApiRoom');
const gameLogic = require('./GDGameLogic');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require("../../../src/model/UserModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const ApiHall = require('../../../src/api/ApiHall');
const AudioUtil = require('../../../src/utils/AudioUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const GDModel = require('./GDModel');
const NodePoolManager = require('../../../src/utils/NodePoolManager');

cc.Class({
    extends: cc.Component,

    properties: {
        cardItem: cc.Prefab,
        optButtons: cc.Node,
        deal: cc.Node,
        roomIdLbl: cc.Label,
        roundLbl: cc.Label,
        node_LaiZi: cc.Node,
        node_LaiZiTips: cc.Node,
        node_ShowNode: cc.Node,
        show_Resist: cc.Node,
        seats: [require('GDHead')],
        _userList: [],
        /**房间回放数据 */
        _reviewRecord: null,
        _operateRecords: [],
        /**结算界面节点 */
        /**自己的座位 */
        _myChairId: 0,
        /**总局数 */
        _maxRound: 0,
        /**当前局数 */
        _curRound: 0,
        /**最大玩家数量 */
        _userArray: null,
        _maxPlayerCount: 0,
        /**时间 */
        _timeCheck: 0,
        /**是否暂停 */
        _pause: false,
        /**播放速度 */
        _speed: 1,
        /**动作序列 */
        _actIdx: 0,
        /**是否显示结算 */
        _isResult: false,
        _inited: false,
        _LaiziCard: 0,
    },

    start() {
        this._reviewRecord = this.node.nodeParams.reviewRecord;
        NodePoolManager.init('gdCardPool', this.cardItem, 30);
        GDModel.init({ cardItem: this.cardItem });
        this.show_Resist.active = false;
        this._tableInit()
    },

    _tableInit() {
        this._inited = true;
        this.showBtnAnim();
        for (let index = 0; index < this.seats.length; index++) {
            if (!this.seats[index]) continue;
            this.seats[index].bind({
                deal: this.deal,
                isReview: true,
                index: index,
                comp: this,
            });
        }
        this._seatsInit();
        this._init();
    },

    _seatsInit() {
        let baseData = this._reviewRecord[0];
        if (!baseData) return false;
        // console.log("baseData", baseData)
        this.roomIdLbl.string = `房号:${baseData.baseRoomRecords.roomID}`;
        this._maxRound = baseData.baseRoomRecords.gameRule.bureau || 1;
        let _userArray = baseData.baseRoomRecords.userArray || [];
        this._maxPlayerCount = _userArray.length;
        this._userList = [];
        this.seats.forEach((CurUser, index) => {
            if (this._maxPlayerCount == 2) {
                if (index != 1 && index != 3) {
                    this._userList.push(CurUser);
                }
            } else if (this._maxPlayerCount == 3) {
                if (index != 2) {
                    this._userList.push(CurUser);
                }
            } else {
                this._userList.push(CurUser);
            }
        })
    },


    _setIndex(idx) {
        if (!this._reviewRecord[this._curRound]) return;
        this.roundLbl.string = `局数:${this._curRound + 1}/${this._maxRound}`;
        let baseData = this._reviewRecord[this._curRound];

        if (idx == 0) {
            let _userArray = baseData.baseRoomRecords.userArray || [];

            let result = baseData.result || [];
            this._userArray = [];
            for (let index = 0; index < result.length; index++) {
                let CurUser = _userArray[index];
                let Curresult = result[index];
                if (CurUser.uid == Curresult.uid) {
                    for (const key in Curresult) {
                        CurUser[key] = Curresult[key];
                    }
                }
                if (CurUser.uid == UserModel.getData('uid')) {
                    this._myChairId = CurUser.chairID;
                }
                this._userArray.push(CurUser);
                // let localIndex = this.getIndexByUID(CurUser.uid);
                // if (!this._userList[localIndex]) continue;
                // CurUser.handCards = handCards[CurUser.uid];
                // this._userList[localIndex].review(CurUser);
            }
            this.showLaiZiTips(true);
            this._operateRecords = baseData.operateRecords.slice();
            let handCards = baseData.baseRoomRecords.handCards;
            for (let index = 0; index < this._userArray.length; index++) {
                const CurUser = this._userArray[index];
                let localIndex = this.getIndexByUID(CurUser.uid);
                if (!this._userList[localIndex]) continue;
                CurUser.handCards = handCards[CurUser.uid];
                this._userList[localIndex].review(CurUser);
            }
        }
        if (!this._operateRecords[idx]) return;
        let opt = this._operateRecords[idx];
        // console.log("总", this._operateRecords.length, "当前", idx, "opt", opt);
        this._userList.forEach((user) => {
            user.showisAuto(false)
        });
        let localIndex = this.getIndexByUID(opt.uid);
        this.showCardType(opt);

        if (this._userList[localIndex]) {
            this._userList[localIndex].out(opt);
        }
        if (idx == this._operateRecords.length - 1) {
            this._isResult = true;
            let nodeParams = { // 创建结束界面
                isReview: true,
                resultData: baseData,
                bundle: Enums.bundleType.GD,
                myChairID: this._myChairId,
                curBureau: this._curRound,
                maxBureau: this._maxRound,
                path: 'res/prefab/GDResultDialog',
                isBureauFull: this._curRound == this._maxRound,
            };
            AssetsManager.createDialog(nodeParams);
        }
    },

    showCardType(data) {
        if (!data.operateInfo) return;
        let cards = data.operateInfo.cards || [];
        let cardType = data.operateInfo.cardType || 0;
        let operateType = data.operateInfo.operateType || 0;
        if (operateType == ApiGd.operateType.PASS || cards.length == 0) return;
        if (cardType == ApiGd.cardType.TIAN_WANG_BOMB) { // 天王炸
            GDModel.showAinm(7, (node) => {
                this.node_ShowNode.destroyAllChildren();
                this.node_ShowNode.addChild(node);
            })
        }
    },

    _operateFilter(operateRecords) {
        if (!operateRecords) return [];
        for (let index = 0; index < operateRecords.length; index++) {
            if (!operateRecords[index]) continue;
            if (operateRecords[index].type != ApiGd.operateType.PASS &&
                operateRecords[index].type != ApiGd.operateType.OUT) {
                operateRecords.splice(index, 1);
            }
        }
        return operateRecords;
    },
    update(dt) {
        if (!this._inited) return;
        if (this._isResult) return;
        this._timeCheck += dt * this._speed;
        if (this._timeCheck >= 1.5) {
            this._timeCheck = 0;
            if (!this._pause) {
                this._onNextAct();
            }
        }
    },

    _init() {
        this._actIdx = 0;
        this._timeCheck = 0;
        this._isResult = false;
        this._setIndex(this._actIdx);
    },

    /**座位号转换 */
    getIndexByChairID(chairID) {
        return (chairID - this._myChairId + this._maxPlayerCount) % this._maxPlayerCount;
    },

    getIndexByUID(uid) {
        let user = this.getUserByUID(uid);
        let chairID = !!user ? user.chairID : 0;
        return this.getIndexByChairID(chairID);
    },

    getUserByUID(uid) {
        if (!this._userArray) return null;
        let user = null;
        for (let item of this._userArray) {
            if (item.uid == uid) {
                user = item;
                break;
            }
        }
        return user;
    },
    /**展示按钮动画 */
    showBtnAnim(dt = 2) {
        this.optButtons.stopAllActions();
        this.optButtons.opacity = dt === 2 ? 255 : 125;
        this.scheduleOnce(() => {
            cc.tween(this.optButtons)
                .to(2, {
                    opacity: 0
                }).to(2, {
                    opacity: 125
                })
                .union()
                .repeatForever()
                .start()
        }, dt);
    },

    /**按钮响应 */
    onBtnClick(event) {
        // console.log('按钮---', event);
        this.showBtnAnim(2);
        switch (event.target.name) {
            case "btn_preAct":
                this._onPreAct()
                break;
            case "btn_pause":
                this._onPause()
                break;
            case "btn_nextAct":
                this._onNextAct()
                break;
            case "btn_speedDown":
                this._onSpeedDown()
                break;
            case "btn_speedNormal":
                this._onSpeedNormal()
                break;
            case "btn_speedUp":
                this._onSpeedUp()
                break;
            case "btn_preRound":
                this._onPreRound()
                break;
            case "btn_nextRound":
                this._onNextRound()
                break;
            case "btn_close":
                this._onClose()
                break;
        }
    },

    _onClose() {
        this._inited = false;
        this.node.destroy();
    },

    /**上一个动作 */
    _onPreAct() {
        if (!this._inited) return;
        let curIndex = this._actIdx;
        this._actIdx--;
        if (this._actIdx < 0) {
            this._actIdx = 0;
        }
        if (curIndex != this._actIdx) {
            this._isResult = false;
            this._setIndex(this._actIdx);
        }
    },

    /**下一个动作 */
    _onNextAct() {
        if (!this._inited) return;
        this._actIdx++;
        this._setIndex(this._actIdx);
    },


    /**上一局 */
    _onPreRound() {
        if (!this._inited) return;
        let curBureau = this._curRound;
        this._curRound--;
        if (this._curRound < 0) {
            this._curRound = 0;
        }
        if (this._curRound == curBureau) {
            return;
        }
        this._init()
    },

    /**下一局 */
    _onNextRound() {
        if (!this._inited) return;
        this._curRound++;
        let reviewRecord = this._reviewRecord;
        if (!reviewRecord[this._curRound]) {
            AssetsManager.tipDialog(`暂时没有第${this._curRound + 1}的数据`);
            this._curRound--;
            return;
        } else {
            this._init();
        }
    },

    /**暂停 */
    _onPause() {
        if (!this._inited) return;
        this._pause = !this._pause;
    },

    /**加速 */
    _onSpeedUp() {
        if (!this._inited) return;
        this._speed *= 2;
        if (this._speed > 8) {
            this._speed = 8;
        }
    },

    /**减速 */
    _onSpeedDown() {
        if (!this._inited) return;
        this._speed /= 2;
        if (this._speed < 1 / 8) {
            this._speed = 1 / 8;
        }
    },

    /**恢复速度 */
    _onSpeedNormal() {
        if (!this._inited) return;
        this._speed = 1;
    },
    /**显示赖子提示 */
    showLaiZiTips(isShow) {
        let showVal = (type, myNum, duiNum) => {
            if (!this.node_LaiZi) return false;
            let show_wo = this.node_LaiZi.getChildByName("show_wo");
            let show_dui = this.node_LaiZi.getChildByName("show_dui");
            let myVal = `<color=${type == 1 ? "#FF0000" : "#000000"}>${myNum}</c>`;
            let duiVal = `<color=${type == 2 ? "#FF0000" : "#000000"}>${duiNum}</c>`;
            show_wo.getChildByName("rich_val").getComponent(cc.RichText).string = myVal;
            show_dui.getChildByName("rich_val").getComponent(cc.RichText).string = duiVal;
        }
        showVal(0, 0, 0);
        if (!this.node_LaiZiTips) return;
        this.node_LaiZiTips.active = false;
        if (isShow) {
            let datalist = [];
            let CarsUpgrade = [];
            let BankerUser = null;
            // if (this._curRound == 0) {
            for (let index = 0; index < this._userArray.length; index++) {
                let CurUser = this._userArray[index];
                if (CurUser.playerRanking == 1) {
                    CarsUpgrade = CurUser.CarsUpgrade || [];
                    datalist = CurUser.datalist || [];
                    BankerUser = CurUser;
                    break;
                }
            }

            // console.log("CarsUpgrade", CarsUpgrade, "BankerUser", BankerUser)
            if (!BankerUser || !CarsUpgrade.length) {
                this.showResist(datalist);
                return
            };
            let isHitMy = false;
            let myVal = CarsUpgrade[0] || 0;
            let duiVal = CarsUpgrade[1] || 0;
            let index = BankerUser.chairID % 2;
            let duiIndex = index == 0 ? 1 : 0;
            if (BankerUser.uid == UserModel.getData('uid')) {
                isHitMy = true;
                myVal = CarsUpgrade[index];
                duiVal = CarsUpgrade[duiIndex];
            } else {
                duiVal = CarsUpgrade[index];
                myVal = CarsUpgrade[duiIndex];
            }

            this.node_LaiZiTips.scale = 1;
            this.node_LaiZiTips.active = true;
            this._LaiziCard = CarsUpgrade[index] || 0;
            this.node_LaiZiTips.getChildByName("spr_wofang").active = isHitMy;
            this.node_LaiZiTips.getChildByName("spr_duifang").active = !isHitMy;
            let node_cardsNum = this.node_LaiZiTips.getChildByName("text_cardsNum");
            node_cardsNum.getComponent(cc.Label).string = isHitMy ? myVal : duiVal;
            cc.tween(this.node_LaiZiTips)
                .to(0.2, {
                    scale: 2
                })
                .delay(0.1)
                .to(0.2, {
                    scale: 1
                })
                .delay(0.5)
                .call(() => {
                    this.showResist(datalist);
                    this.node_LaiZiTips.active = false;
                    showVal(isHitMy ? 1 : 2, myVal, duiVal);
                })
                .start();
        };
    },


    showResist(datalist) {
        datalist.forEach((CurjinGang) => {
            if (CurjinGang.Cardstype == 3) {
                this.show_Resist.active = true;
                cc.tween(this.show_Resist)
                    .to(0.3, {
                        scale: 1.5
                    })
                    .delay(0.2)
                    .to(0.2, {
                        scale: 1
                    })
                    .delay(0.5)
                    .call(() => {
                        this.show_Resist.active = false;
                    })
                    .start()
            }
        })
    },

    onDestroy() {
        NodePoolManager.clear('gdCardPool')
    }

});