const ApiZgz = require('./ApiZgz');
const gameLogic = require('./ZGZGameLogic');
const Enums = require('../../../src/const/Enums');
const UserModel = require("../../../src/model/UserModel")
const ConfigModel = require('../../../src/model/ConfigModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Utils = require('../../../src/utils/Utils');
const CCUtil = require('../../../src/utils/CCUtil');
const ZGZModel = require("./ZGZModel")

cc.Class({
    extends: cc.Component,

    properties: {
        animationNode: cc.Node,
        aniPfb: cc.Prefab,
        headLeft: cc.Prefab,
        headRight: cc.Prefab,
        txt_roomId: cc.Label,
        txt_round: cc.Label,
        txt_beishu: cc.Label,
        text_Rule: cc.Label,
        btn_stop: cc.Node,
        btn_play: cc.Node,
        txt_progress: cc.Label,
        progress_opt: cc.ProgressBar,

        /**结算界面节点 */
        _result: null,
        /**操作按钮组 */
        _optButtons: null,

        /**房间回放数据 */
        _gameReviewData: null,
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
        this._nowRound = 0;
        this._gameReviewData = this.node.nodeParams.reviewRecord || [];
        let CurObj = this._gameReviewData[this._nowRound] || null;
        if (!this._gameReviewData.length || !CurObj) {
            AssetsManager.tipDialog(`回放数据错误`);
            this.node.destroy()
            return
        }
        ZGZModel.initData(CurObj.gameRule);
        this.text_Rule.string = ZGZModel.getShowRule();
        let bundleObj = ConfigModel.getBundleConfig(Enums.bundleType.ZGZ);
        this.txt_roomId.string = `${bundleObj.name} 房号:${CurObj.roomID}  底分:${ZGZModel.getGameRuleByKey("baseScore") || 0}`;
        /**找到自己的座位号 */
        let result = CurObj.result || [];
        for (let i = 0; i < result.length; i++) {
            const id = result[i].uid;
            if (id === UserModel.getData("uid")) {
                this._myChairId = result[i].chairID;
                break
            }
        }
        this._maxRound = this._gameReviewData.length
        this._result = cc.find("result", this.node)
        this._optButtons = cc.find("buttons", this.node)
        CCUtil.nodeRecursive(this.node, (n) => {
            if (n.getComponent(cc.Button)) {
                n.on("click", this.onBtnClick, this)
            }
        })
        //当局最大玩家数
        this._maxPlayerNum = result.length
        if (this._maxPlayerNum > 5) {
            this._maxPlayerNum = 5
        }
        this.checkHeadPos()
        this.showButtonsAni(0)
    },

    /**判断人数，初始化头像位置 */
    checkHeadPos() {
        let headPos = [0, 1, 2, 3, 4]
        this._userList.length = 0
        this._handCardList.length = 0
        this._outCardList.length = 0

        for (let i = 0; i < headPos.length; i++) {
            let idx = headPos[i]
            let h = cc.find("head" + idx, this.node)
            h.getComponent(cc.Sprite).enabled = false;
            h.removeAllChildren()
            let headNode = null
            if (idx == 0 || idx == 3 || idx == 4) {
                headNode = cc.instantiate(this.headLeft)
            } else {
                headNode = cc.instantiate(this.headRight)
            }
            if (cc.isValid(headNode)) {
                headNode.parent = h
                this._userList.push(headNode.getComponent("ZGZHead"))
                this._userList[i].initRes()
            }

            let handCard = cc.find("handCard" + idx, this.node)
            let outCard = cc.find("outCard" + idx, this.node)
            this._handCardList.push(handCard.getComponent("ZGZCardMgr"))
            this._handCardList[i].init(idx)
            this._handCardList[i].addTouchEvent()

            this._outCardList.push(outCard.getComponent("ZGZCardMgr"))
            this._outCardList[i].init(idx)
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

        if (!this._pause && this._gameReviewData[this._nowRound]) {
            let baseData = this._gameReviewData[this._nowRound]
            let len = baseData.operateRecords.length
            if (this._actIdx >= len) {
                return
            }
            let targetTime = 1 / this._speed
            let targetProgress = (this._actIdx + 1) / len
            targetProgress = targetProgress > 1 ? 1 : targetProgress
            let lastProgress = this._actIdx / len
            lastProgress = lastProgress > 1 ? 1 : lastProgress
            let add = (targetProgress - lastProgress) / (targetTime / dt)
            let now = this.progress_opt.progress + add
            now = now > targetProgress ? targetProgress : now
            this.progress_opt.progress = now
            this.txt_progress.string = Math.floor(this.progress_opt.progress * 100) + "%"
        }
    },

    init() {
        ZGZModel.reset();
        this.progress_opt.progress = 0;
        this.txt_progress.string = "";
        let CurObj = this._gameReviewData[this._nowRound];
        console.log("CurObj", CurObj)
        ZGZModel.setTakingOperate(CurObj.plusInfo.takingOperate);
        ZGZModel.setUserWinStatus(CurObj.plusInfo.userWinStatus);
        /**局数 */
        this.txt_round.string = `局数:${this._nowRound + 1}/${this._maxRound}`;
        this.txt_beishu.string = `倍数:${ZGZModel.getStatMultiple()}`;
        this.initHeads()
        /**获取开局的手牌 */
        let operateRecords = CurObj.operateRecords || [];
        this._actIdx = operateRecords.findIndex(item => item.type === ApiZgz.operateType.OUT);
        if (this._actIdx == -1) this._actIdx = operateRecords.length
        this._actIdx -= 1;
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
                opacity: 255
            }).union().repeatForever().start()
        }, dt);
    },

    /**按钮响应 */
    onBtnClick(event) {
        let node = event.target || event.node
        this.showButtonsAni(2);
        switch (node.name) {
            case "btn_speed":
                this.onSpeedUp(node)
                break;
            case "btn_pre":
                this.onPreRound()
                break;
            case "btn_play":
                this.onPlay()
                break;
            case "btn_stop":
                this.onPause()
                break;
            case "btn_next":
                this.onNextRound()
                break;
            case "btn_exit":
                this.node.destroy()
                break;
        }
    },

    /**上一个动作 */
    onPreAct() {
        let curIndex = this._actIdx;
        --this._actIdx;
        if (this._actIdx < 0) {
            this._actIdx = 0;
            this.progress_opt.progress = 0
            this.txt_progress.string = ""
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
        AssetsManager.clearDialog(['ZGZResultDialog']);
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
            AssetsManager.tipDialog(`没有第${this._nowRound + 1}局的数据`);
            --this._nowRound;
            return;
        } else {
            this.destroyReult()
            this.init();
        }
    },

    /**暂停 */
    onPause() {
        this._pause = true;
        this.btn_play.active = true
        this.btn_stop.active = false
    },

    onPlay() {
        this._pause = false;
        this.btn_play.active = false
        this.btn_stop.active = true
    },
    /**加速 */
    onSpeedUp(node) {
        this._speed *= 2;
        if (this._speed > 4) {
            this._speed = 1;
        }
        let txt_speed = cc.find("txt_speed", node)
        txt_speed.getComponent(cc.Label).string = "x" + this._speed
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
            this._handCardList[idx].updateCards(user.beginCards);
            this._userList[idx].initReview(user)
        }
    },

    playOptAinmAndSound(optData, idx, isWoman) {
        let audioUrl = "", ainmType = 0;
        let cardArr = optData.cards || [];
        let cardType = optData.cardType || 0;
        let cardVale = gameLogic.getCardValue(cardArr[0]);
        if (cardType === ApiZgz.cardType.BOMB_CARD3
            || cardType === ApiZgz.cardType.BOMB_CARD4) {
            if (cardType === ApiZgz.cardType.BOMB_CARD4) {
                audioUrl += "man_zhadan4";
            } else {
                audioUrl += "man_zhadan";
            }
            ainmType = 1;
        } else if (cardType === ApiZgz.cardType.TIAN_BOMB) {
            if (ZGZModel.isArraysEqual(cardArr, [3, 35])) {
                audioUrl += "man_wangzha2";
            } else {
                audioUrl += "man_wangzha";
            }
            ainmType = 2;
        } else if (cardType === ApiZgz.cardType.DOUBLE) {
            audioUrl += "man_dui" + cardVale;
        } else if (cardType === ApiZgz.cardType.SINGLE) {
            if (cardVale == 3) {
                let cardID = cardArr[0];
                if (cardID == 3 || cardID == 35) {
                    audioUrl += `man_${cardVale}_${cardID}`;
                } else {
                    audioUrl += `man_${cardVale}_hei`;
                }
            } else {
                audioUrl += "man_" + cardVale;
            }
        }
        if (!!audioUrl) {
            isWoman = true;
            audioUrl = "res/audio/man/" + audioUrl;
            if (isWoman) audioUrl = audioUrl.replace(/man/g, "woman");
            AssetsManager.playEffect({
                bundle: Enums.bundleType.ZGZ,
                path: audioUrl,
            });
        }
        if (!!ainmType) {
            let aniNode = cc.instantiate(this.aniPfb)
            let aniCom = aniNode.getComponent("ZGZActAnimation")
            let timeScale = 1;
            if (ainmType == 1) {
                aniNode.x += idx == 0 ? 0 : idx == 1 || idx == 2 ? 80 : -80;
                aniNode.scale = idx == 0 ? 1 : 0.6;
                timeScale = ainmType < 10 ? 0.7 : 1.2;
                this._outCardList[idx].setAniNode(aniNode)
            } else {
                this.animationNode.removeAllChildren()
                aniNode.parent = this.animationNode
            }
            aniCom.showOptAni(ainmType, timeScale)
        }
    },



    setIndex(index) {
        let data = this._gameReviewData[this._nowRound]
        let outCardData = data.operateRecords[index]
        if (!outCardData) {
            this._isShowRes = true
            data.bundle = Enums.bundleType.ZGZ
            data.isReview = true
            data.path = 'res/prefab/ZGZResultDialog'
            data.parent = this._result
            this.scheduleOnce(() => {
                AssetsManager.createDialog(data);
            }, 1)
        } else {
            this._outCardList.forEach(com => {
                com.updateCards()
            });
            this._userList.forEach(com => {
                com.setPassNode(false)
            });
            let idx = this.getUserIdxByUid(outCardData.uid)
            if (outCardData.type == ApiZgz.operateType.OUT) {
                let hcom = this._handCardList[idx]
                hcom && hcom.updateCards(outCardData.handCards)
                let ocom = this._outCardList[idx]
                this.playOptAinmAndSound(outCardData, idx);
                ocom && ocom.updateCards(outCardData.cards, false, true);
            } else if (outCardData.type == ApiZgz.operateType.PASS) {
                /**展示过 */
                let com = this._userList[idx]
                com && com.setPassNode(true)
                let audio = "res/audio/man/man_buyao1";
                audio = audio.replace(/man/g, "woman");
                AssetsManager.playEffect({
                    path: audio,
                    bundle: Enums.bundleType.ZGZ
                });
            }
            this._lastOut = outCardData.cards
        }
    },
});