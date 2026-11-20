const ApiDdz = require('./ApiDdz');
const ApiRoom = require('../../../src/api/ApiRoom');
const gameLogic = require('./DDZGameLogic');
const Enums = require('../../../src/const/Enums');
const UserModel = require("../../../src/model/UserModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const ApiHall = require('../../../src/api/ApiHall');
const AudioUtil = require('../../../src/utils/AudioUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const DDZModel = require('./DDZModel');
const NodePoolManager = require('../../../src/utils/NodePoolManager');

cc.Class({
    extends: cc.Component,

    properties: {
        cardItem: cc.Prefab,
        optButtons: cc.Node,
        roomIdLbl: cc.Label,
        roundLbl: cc.Label,
        deal: cc.Node,
        baseCards: cc.Node,
        rangCountLbl: cc.Label,
        lai_Card: require('DDZCard'),
        headLeft: cc.Prefab,
        headRight: cc.Prefab,
        _seats: [],
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

        /**用户脚本列表 下标为本地座位号*/
        _userList: [],
        /**手牌脚本列表 */
        _handCardList: [],
        /**出牌脚本列表 */
        _outCardList: [],
    },

    start() {
        DDZModel.init({
            cardItem: this.cardItem
        });
        this._reviewRecord = this.node.nodeParams.reviewRecord;
        this._inited = true;
        NodePoolManager.init('ddzCardPool', this.cardItem, 30);
        this.showBtnAnim();
        this._seatsInit();
        this._init();
    },

    _seatsInit() {
        let baseData = this._reviewRecord[0];
        if (!baseData) return;
        gameLogic.init(baseData.baseRoomRecords.gameRule);
        DDZModel.gameRule = baseData.baseRoomRecords.gameRule;
        this._userArray = baseData.baseRoomRecords.userArray;
        this._maxRound = baseData.baseRoomRecords.gameRule.bureau;
        this.roomIdLbl.string = `房号:${baseData.baseRoomRecords.roomID}`;
        this.lai_Card.node.active = !!DDZModel.getGameRuleByKey("isLai");
        this.lai_Card.updateFlowerLai(DDZModel.getLaiZi().join());
        for (const user of this._userArray) {
            if (user.uid == UserModel.getData('uid')) {
                this._myChairId = user.chairID;
            }
        }

        this.checkHeadPos();
    },
    checkHeadPos() {
        let chairCount = this._maxPlayerCount = this._userArray.length;
        if (this._userList.length == chairCount) {
            return
        }
        let headPos = [0, 1, 3]
        if (chairCount == 2) {
            headPos = [0, 2]
        }
        this._userList.length = 0
        this._handCardList.length = 0
        this._outCardList.length = 0
        for (let i = 0; i < headPos.length; i++) {
            let idx = headPos[i]
            let h = cc.find("head" + idx, this.node)
            h.removeAllChildren()
            let headNode = null
            if (idx == 0 || idx == 3) {
                headNode = cc.instantiate(this.headLeft)
            } else {
                headNode = cc.instantiate(this.headRight)
            }
            if (cc.isValid(headNode)) {
                headNode.parent = h
                this._userList.push(headNode.getComponent("DDZSeat"))
                this._userList[i].initRes({
                    deal: this.deal,
                    comp: this,
                    index: i,
                })
            }
            let handCard = cc.find("handCard" + idx, this.node)
            let outCard = cc.find("outCard" + idx, this.node)
            this._handCardList.push(handCard.getComponent("DDZCardMgr"))
            this._handCardList[i].init(idx)
            this._handCardList[i].addTouchEvent()

            this._outCardList.push(outCard.getComponent("DDZCardMgr"))
            this._outCardList[i].init(idx)
        }
        this._userArray.forEach(user => {
            let idx = this.getIndexByChairID(user.chairID);
            this._userList[idx].review(user)
        });
    },

    update(dt) {
        if (!this._inited) return;
        if (this._isResult) return;
        this._timeCheck += dt * this._speed;
        if (this._timeCheck >= 1.2) {
            this._timeCheck = 0;
            if (!this._pause) {
                this._onNextAct();
            }
        }
    },

    _init() {
        this._isResult = false;
        this._actIdx = 0;
        this._timeCheck = 0;
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
        let user = this._userArray.find((item) => {
            return item.uid == uid;
        });
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

    resetTable() {
        this._userList.forEach(com => {
            com.reset()
        });
        this._handCardList.forEach(com => {
            com.reset()
        });
        this._outCardList.forEach(com => {
            com.reset()
        });
    },


    _setIndex(idx) {
        if (!this._reviewRecord[this._curRound]) return;
        let baseData = this._reviewRecord[this._curRound];
        if (idx == 0) {
            this.resetTable();
            let resultList = baseData.result;
            let bankerUid = baseData.bankerUid;
            DDZModel.setBankerUID(bankerUid);
            // console.log("baseData", baseData)
            for (let index = 0; index < resultList.length; index++) {
                let user = resultList[index];
                let beginCards = user.beginCards || [];
                let localIndex = this.getIndexByUID(user.uid);
                this._userList[localIndex].showBanker(bankerUid == user.uid);
                this._handCardList[localIndex].updateCards(beginCards, false, false, user.uid);
            }
            this._operateRecords = baseData.operateRecords.slice();
            let baseCards = baseData.baseRoomRecords.baseCards || [];
            let bankRangPaiCount = baseData.baseRoomRecords.bankRangPaiCount;
            this.rangCountLbl.string = `让${bankRangPaiCount}张`;
            this.roundLbl.string = `局数:${this._curRound + 1}/${this._maxRound}`
            for (let index = 0; index < this.baseCards.children.length; index++) {
                AssetsManager.loadSpriteFrame({
                    path: `sprite/cards/${baseCards[index] || 0}`,
                    sprite: this.baseCards.children[index].getComponent(cc.Sprite)
                });
            }
        }


        if (!this._operateRecords[idx]) return;
        let data = this._operateRecords[idx];
        let cards = data.operateInfo.cards;
        let cardType = data.operateInfo.cardType;
        let handCards = data.operateInfo.handCards;
        let optType = data.operateInfo.operateType;
        let localIndex = this.getIndexByUID(data.uid);
        this._userList.forEach(ctrl => ctrl.showOption());
        this._handCardList[localIndex].updateCards(handCards, false, false, data.uid);
        this.showUserOutCard(data.uid, cards, cardType, true);
        if (optType == ApiDdz.operateType.PASS) {
            this._userList[localIndex].showOption("buchu");
            DDZModel.playUserSound(`res/audio/man/man_buyao1`, data.uid);
        } else if (optType == ApiDdz.operateType.OUT) {
            DDZModel.playOptSoundAinm(cards, cardType, (ainmNode) => {
                if (cardType == ApiDdz.cardType.WANG_BOMB) {
                    ainmNode.setPosition(cc.v2(0, 80));
                    this.node.addChild(ainmNode);
                } else {
                    this._outCardList[localIndex].setAniNode(ainmNode);
                }
            }, data.uid);
        }
        if (idx == this._operateRecords.length - 1) {
            this._isResult = true;
            let nodeParams = { // 创建结束界面
                bundle: Enums.bundleType.DDZ,
                resultData: baseData,
                myChairID: this._myChairId,
                isBureauFull: this._curRound == this._maxRound,
                curBureau: this._curRound,
                maxBureau: this._maxRound,
                path: 'res/prefab/DDZResultDialog',
                isReview: true
            };
            AssetsManager.createDialog(nodeParams);
            return;
        }
    },

    showUserOutCard(uid, outList, outType, outAinm = true) {
        if (!uid) return;
        let localIndex = this.getIndexByUID(uid);
        this._outCardList.forEach(ctrl => ctrl.updateCards([]));
        DDZModel.switchLaiziOutCard(outList, outType, (haveLaiZi, runList) => {
            if (haveLaiZi) {
                this._outCardList[localIndex].updateLaiZiCards(runList, outAinm, uid);
            } else {
                this._outCardList[localIndex].updateCards(runList, false, outAinm, uid);
            }
        });
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

    onDestroy() {
        NodePoolManager.clear('ddzCardPool');
    },

});