const ApiZlm = require('./ApiZlm');
const ApiRoom = require('../../../src/api/ApiRoom');
const gameLogic = require('./ZLMGameLogic');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require("../../../src/model/UserModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const ApiHall = require('../../../src/api/ApiHall');
const AudioUtil = require('../../../src/utils/AudioUtil');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        animationNode: cc.Node,
        /**房间回放数据 */
        _gameReviewData: null,
        /**局数 */
        _bureau: cc.Label,
        /**结算界面节点 */
        _result: cc.Node,
        /**操作按钮组 */
        _optButtons: cc.Node,
        aniPfb: cc.Prefab,

        /**自己的座位 */
        _myChairId: 0,
        /**总局数 */
        _maxRound: 0,
        /**当前局数 */
        _nowRound: 0,
        /**最大玩家数量 */
        _maxPlayerNum: 0,
        /**时间 */
        _timeCheck: 0,
        /**是否暂停 */
        _pause: false,
        /**播放速度 */
        _speed: 1,
        /**动作序列 */
        _actIdx: 0,
        /**是否显示结算 */
        _isShowRes: false,

        /**用户脚本列表 下标为本地座位号*/
        _userList: [],
        /**手牌脚本列表 */
        _handCardList: [],
        /**出牌脚本列表 */
        _outCardList: [],
        _lastOut: []
    },

    onLoad() {
        this._gameReviewData = this.node.nodeParams.reviewRecord

        /**找到自己的座位号 */
        let result = this._gameReviewData[0].result
        for (let i = 0; i < result.length; i++) {
            const id = result[i].uid;
            if (id === UserModel.getData("uid")) {
                this._myChairId = result[i].chairID
                break
            }
        }
        this._maxRound = this._gameReviewData.length
        this._bureau = cc.find("info/bureau", this.node).getComponent(cc.Label)

        this._result = cc.find("result", this.node)
        this._optButtons = cc.find("buttons", this.node)
        this._optButtons.children.forEach(node => {
            node.on("click", this.onBtnClick, this)
        });
        let btn_close = cc.find("buttons/btn_close", this.node)
        btn_close.on("click", () => {
            this.node.destroy()
        }, this)

        //当局最大玩家数
        this._maxPlayerNum = this._gameReviewData[this._nowRound].result.length
        if (this._maxPlayerNum > 3) {
            this._maxPlayerNum = 3
        }
        this.checkHeadPos()
        this.showButtonsAni(0)
    },

    /**判断人数，初始化头像位置 */
    checkHeadPos() {
        let chairCount = this._maxPlayerNum
        let headPos = [0, 1, 3]
        if (chairCount == 2) {
            headPos = [0, 2]
        }
        this._userList.length = 0
        this._handCardList.length = 0
        this._outCardList.length = 0
        for (let i = 1; i < 4; i++) {
            let h = cc.find("head" + i, this.node)
            h.active = false
        }
        for (let i = 0; i < headPos.length; i++) {
            let h = cc.find("head" + headPos[i], this.node)
            this._userList.push(h.getComponent("ZLMHead"))
            this._userList[i].initRes()

            let handCard = cc.find("handCard" + headPos[i], this.node)
            let outCard = cc.find("outCard" + headPos[i], this.node)
            this._handCardList.push(handCard.getComponent("ZLMCardMgr"))
            this._handCardList[i].init(headPos[i])

            this._outCardList.push(outCard.getComponent("ZLMCardMgr"))
            this._outCardList[i].init(headPos[i])
        }
    },

    start() {
        this.init()
    },

    update(dt) {
        if (this._isShowRes) {
            return
        }
        this._timeCheck += dt * this._speed;
        if (this._timeCheck >= 1.2) {
            this._timeCheck = 0;
            if (!this._pause) {
                this.onNextAct();
            }
        }
    },

    init() {
        this._actIdx = -1
        /**局数 */
        this._bureau.string = `局数：${this._nowRound + 1}/${this._maxRound}`
        this.initHeads()
        /**获取开局的手牌 */
        let operateRecords = this._gameReviewData[this._nowRound].operateRecords
        for (let i = 0; i < this._maxPlayerNum; i++) {
            let info = operateRecords[i]
            let idx = this.getUserIdxByUid(info.uid)
            this._handCardList[idx].updateCards(info.cards)
            this._actIdx++
        }
        /**清空出的牌 */
        this._outCardList.forEach(com => {
            com.updateCards()
        });

        this._timeCheck = 0
        this._lastOut = []
    },

    /**通过UID获取玩家位置 */
    getUserIdxByUid(uid) {
        let chairId = 0
        this._userList.forEach(com => {
            let info = com.getUserData()
            if (info.uid == uid) {
                chairId = info.chairID
            }
        });
        let idx = this.getUserChairIndex(chairId)
        return idx
    },

    /**座位号转换 */
    getUserChairIndex(chairID) {
        return (chairID - this._myChairId + this._maxPlayerNum) % this._maxPlayerNum;
    },

    /**展示按钮动画 */
    showButtonsAni(dt = 2) {
        this._optButtons.stopAllActions();
        this._optButtons.opacity = dt === 2 ? 255 : 125;
        this.scheduleOnce(() => {
            cc.tween(this._optButtons).to(2, {
                opacity: 0
            }).to(2, {
                opacity: 125
            }).union().repeatForever().start()
        }, dt);
    },

    /**按钮响应 */
    onBtnClick(btn) {

        this.showButtonsAni(2);
        switch (btn.node.name) {
            case "btn_preAct":
                this.onPreAct()
                break;
            case "btn_pause":
                this.onPause()
                break;
            case "btn_nextAct":
                this.onNextAct()
                break;
            case "btn_speedDown":
                this.onSpeedDown()
                break;
            case "btn_speedNormal":
                this.onSpeedNormal()
                break;
            case "btn_speedUp":
                this.onSpeedUp()
                break;
            case "btn_preRound":
                this.onPreRound()
                break;
            case "btn_nextRound":
                this.onNextRound()
                break;
        }
    },

    /**上一个动作 */
    onPreAct() {
        let curIndex = this._actIdx;
        --this._actIdx;
        if (this._actIdx < 0) {
            this._actIdx = 0;
        }
        if (curIndex != this._actIdx) {
            this.destroyReult()
            this.setIndex(this._actIdx);
        }
    },

    /**下一个动作 */
    onNextAct() {
        let curIndex = this._actIdx;
        ++this._actIdx;
        let data = this._gameReviewData[this._nowRound].operateRecords;
        if (this._actIdx > data.length) {
            this._actIdx = data.length
        }
        if (curIndex != this._actIdx) {
            this.setIndex(this._actIdx);
        }
    },

    /**关闭结算界面 */
    destroyReult() {
        this._isShowRes = false
        AssetsManager.clearDialog(['ZLMResultDialog']);
    },

    /**上一局 */
    onPreRound() {
        let curBureau = this._nowRound;
        --this._nowRound;
        if (this._nowRound < 0) {
            this._nowRound = 0;
        }
        if (this._nowRound == curBureau) {
            return;
        }
        this.destroyReult()
        this.init()
    },

    /**下一局 */
    onNextRound() {
        ++this._nowRound;
        let reviewRecord = this._gameReviewData;
        if (!reviewRecord[this._nowRound]) {
            AssetsManager.tipDialog(`暂时没有第${this._nowRound + 1}的数据`);
            --this._nowRound;
            return;
        } else {
            this.destroyReult()
            this.init();
        }
    },

    /**暂停 */
    onPause() {
        this._pause = !this._pause;
        if (this._pause) {
            /* this.pauseLabel.string = '继续'; */
        } else {
            /* this.pauseLabel.string = '暂停'; */
        }
    },

    /**加速 */
    onSpeedUp() {
        this._speed *= 2;
        if (this._speed > 8) {
            this._speed = 8;
        }
    },

    /**减速 */
    onSpeedDown() {
        this._speed /= 2;
        if (this._speed < 1 / 8) {
            this._speed = 1 / 8;
        }
    },

    /**恢复速度 */
    onSpeedNormal() {
        this._speed = 1;
    },

    /**初始化用户信息 */
    initHeads() {
        let data = this._gameReviewData[this._nowRound].result
        for (let i = 0; i < data.length; i++) {
            const user = data[i];
            let idx = this.getUserChairIndex(user.chairID)
            this._userList[idx].initReview(user)
        }
    },

    /**
     * 播放牌型动画
     * @param {number} cardType 
     * @param {number} idx 
     * @param {number} len
     */
    playCardTypeAni(cardType, idx, len) {
        let type = null //0顺子 1连对 2三张 3三带一 4三带二 5飞机 6飞机带翅膀 7四带一 8四带二 9四代三 10炸弹 11 春天
        if (cardType === ApiZlm.cardType.BOMB_CARD || cardType === ApiZlm.cardType.TIAN_BOMB) {
            type = 10
        } else if (cardType === ApiZlm.cardType.DOUBLE_LINE) {
            type = 1
        } else if (cardType === ApiZlm.cardType.THREE_LINE) {
            type = 2
            if (len == 6) {
                type = 5
            }
        } else if (cardType === ApiZlm.cardType.THREE_LINE_TAKE_ONE) {
            type = 3
            if (len > 6) {
                type = 6
            }
        } else if (cardType === ApiZlm.cardType.THREE_LINE_TAKE_TWO) {
            type = 4
            if (len > 6) {
                type = 6
            }
        } else if (cardType === ApiZlm.cardType.FOUR_LINE_TAKE_X) {
            type = 7
            if (len == 6) {
                type = 8
            }
        } else if (cardType === ApiZlm.cardType.DOUBLE_LINE) {
            type = 1
        } else if (cardType === ApiZlm.cardType.SINGLE_LINE) {
            type = 0
        } else if (cardType == 100) {
            type = 11
        }
        if (type == null) {
            return
        }

        let com = this._outCardList[idx]
        let aniNode = cc.instantiate(this.aniPfb)
        let aniCom = aniNode.getComponent("ZLMActAnimation")

        let timeScale = 1
        if (type <= 10) {
            let sc = idx == 0 ? 1 : 0.6
            aniNode.scale = sc
            com.setAniNode(aniNode)
            timeScale = type < 10 ? 0.7 : 1.2
            aniNode.x += 50
        } else {
            this.animationNode.removeAllChildren()
            aniNode.parent = this.animationNode
        }
        aniCom.showOptAni(type, timeScale)
    },

    /**
     * 播放牌型声音
     * @param {number} cardType 
     * @param {Array<number>} cardArr
     */
    playOptSound(cardType, cardArr) {
        let len = cardArr.length
        let audioUrl = "res/audio/man/"
        let value = gameLogic.getCardValue(cardArr[0]);

        if (len > 3 && this._lastOut) {
            audioUrl = "res/audio/man/man_dani" + Utils.getRandomNum(1, 3);
        } else if (cardType === ApiZlm.cardType.BOMB_CARD || cardType === ApiZlm.cardType.TIAN_BOMB) {
            audioUrl += "man_zhadan"
        } else if (cardType === ApiZlm.cardType.THREE_LINE) {
            if (len >= 6) {
                audioUrl += "man_feiji"
            } else {
                audioUrl += "man_tuple" + value
            }
        } else if (cardType === ApiZlm.cardType.THREE_LINE_TAKE_ONE) {
            if (len > 6) {
                audioUrl += "man_feiji"
            } else {
                audioUrl += "man_sandaiyi"
            }
        } else if (cardType === ApiZlm.cardType.THREE_LINE_TAKE_TWO) {
            if (len > 6) {
                audioUrl += "man_feiji"
            } else {
                audioUrl += "man_sandaiyidui"
            }
        } else if (cardType === ApiZlm.cardType.FOUR_LINE_TAKE_X) {
            if (len == 6) {
                audioUrl += "man_sidaier"
            }
        } else if (cardType === ApiZlm.cardType.DOUBLE_LINE) {
            audioUrl += "man_liandui"
        } else if (cardType === ApiZlm.cardType.SINGLE_LINE) {
            audioUrl += "man_shunzi"
        } else if (cardType === ApiZlm.cardType.SINGLE) {
            audioUrl += "man_" + value
        } else if (cardType === ApiZlm.cardType.DOUBLE) {
            audioUrl += "man_dui" + value
        } else if (cardType == 100) {

        }

        AssetsManager.playEffect({
            path: audioUrl,
            bundle: Enums.bundleType.ZLM
        });
    },

    setIndex(index) {
        let data = this._gameReviewData[this._nowRound]
        let outCardData = data.operateRecords[index]
        if (!outCardData) {
            let dt = 1
            if (data.hasChuntian) {
                /* 有春天 */
                this.playCardTypeAni(100, 0, 0)
                dt += 1
            }
            this._isShowRes = true
            /**展示结算界面 */
            data.bundle = Enums.bundleType.ZLM
            data.isReview = true
            data.path = 'res/prefab/ZLMResultDialog'
            data.parent = this._result
            this.scheduleOnce(() => {
                AssetsManager.createDialog(data);
            }, dt)
        } else {
            this._outCardList.forEach(com => {
                com.updateCards()
            });
            this._userList.forEach(com => {
                com.setPassNode(false)
            });

            let idx = this.getUserIdxByUid(outCardData.uid)
            if (outCardData.type == ApiZlm.operateType.OUT) {
                /**刷新手牌 */
                let hcom = this._handCardList[idx]
                hcom && hcom.updateCards(outCardData.handCards)
                /**展示出的牌 */
                let ocom = this._outCardList[idx]
                ocom && ocom.updateCards(outCardData.cards)
                this.playCardTypeAni(outCardData.cardType, idx, outCardData.cards.length)
                this.playOptSound(outCardData.cardType, outCardData.cards)
            } else if (outCardData.type == ApiZlm.operateType.PASS) {
                /**展示过 */
                let com = this._userList[idx]
                com && com.setPassNode(true)

                let audio = "res/audio/man/man_buyao1";
                AssetsManager.playEffect({
                    path: audio,
                    bundle: Enums.bundleType.ZLM
                });
            }
            this._lastOut = outCardData.cards
        }
    },
});