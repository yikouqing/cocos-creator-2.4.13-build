const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const GDModel = require('./GDModel');
const ApiGd = require('./ApiGd');
const ConfigModel = require('../../../src/model/ConfigModel');
const UserModel = require('../../../src/model/UserModel');
const Enums = require('../../../src/const/Enums');
const GDGameLogic = require('./GDGameLogic');
const NativeUtil = require('../../../src/utils/NativeUtil');
const NodePoolManager = require('../../../src/utils/NodePoolManager');

cc.Class({
    extends: cc.Component,

    properties: {
        hands: cc.Node, //手牌节点
        outs: cc.Node, //出牌节点
        clock: cc.Node, //计时器节点
        banker: cc.Node,
        offline: cc.Node,
        host: cc.Node,
        head: cc.Sprite,
        option: cc.Sprite,
        nick: cc.Label,
        score: cc.Label, //玩家分数
        roundScore: cc.Label, //局结算分
        cardBackSprite: cc.Sprite,
        cardCount: cc.Label,
        emotion: cc.Node, //表情
        text: cc.Node,
        textLbl: cc.Label,

        _outs: [],
        _holds: [],
        _seat: null,
        _user: null,
        _effects: [],
        _handsLaneCount: 20,
        _outsLaneCount: 10,
        _offSetXRate: 0,
        _offSetYRate: 0,
        _bankerPos: cc.v2(),
        _isReview: false,
    },

    onLoad() {
        this.initRes();
    },

    initRes() {
        if (this._initRes) return;
        this.roundscoreroot = this.node.getChildByName("roundscore");
        this.spr_swap = this.node.getChildByName("spr_swap");
        this.spr_ming = this.node.getChildByName("spr_ming");
        this.spr_you = this.node.getChildByName("spr_you");
        this._bankerPos = this.banker.getPosition();
        this._initRes = true;
        this.leave();
    },

    /**显示离开状态 */
    leave() {
        this._user = null;
        this._clearOuts();
        this.clearStatus();
        this._initOption();
        this._initBanker();
        this._clearHolds();
        this.setTotalScore(null);
        this._clearEffects();
        this.showisAuto(false);
        this.showDuiYou(false);
        this.showCardNum(false);
        this.nick.string = '';
        this.score.string = '';
        this.textLbl.string = '';
        this.node.active = false;
        this.text.active = false;
        this.head.spriteFrame = false;
        if (this.spr_swap) this.spr_swap.active = false;
        if (this.spr_ming) this.spr_ming.active = false;
        if (this.roundScore) this.roundScore.string = '';
        if (this.emotion) this.emotion.destroyAllChildren();
        if (this.spr_ming) this.spr_ming.destroyAllChildren();
    },

    //初始化
    bind(seat) {
        if (!this._initRes) {
            this.initRes();
        }
        this.leave();
        this._seat = seat;
        this._offSetXRate = 0.6;
        this._offSetYRate = 0.7;
        this._outsLaneCount = 16;
        this._handsLaneCount = 27;
        this.node.active = false;
        this._isReview = seat.isReview;
    },

    getUserData() {
        return this._user;
    },

    /**用户进入 */
    sit(user) {
        this._user = user;
        this._clearOuts();
        this._clearHolds();
        this.node.active = true;
        this._userInfo = user.userInfo;
        let playStatus = user.playStatus;
        let gameStatus = GDModel.getGameStatus();
        if (this.spr_ming) this.spr_ming.destroyAllChildren();
        if (!!this._userInfo) {
            this.nick.string = CCUtil.stringClamp(this._userInfo.nickname, 7, '..');
            AssetsManager.loadSpriteFrame({
                path: this._userInfo.avatar,
                sprite: this.head
            });
        }
        let cardList = GDModel.getUserHandCardsByUID(user.uid);
        this.offline.active = user.userStatus == ApiRoom.userStatusEnum.OFFLINE;
        this.setUserScore(user.userInfo.score)
        this.showCardNum(GDModel.isShowCardCount(cardList.length), cardList.length);
        this.setTotalScore(GDModel.getTotalWinScoreByUID(user.uid));
        //操作时间显示
        if (gameStatus != ApiGd.gameStatus.GAME_END && gameStatus != ApiGd.gameStatus.NONE && GDModel.getCurOperateUID() == user.uid) {
            this.showClock();
        }
        this._holdsSync(user);
        this._outsSync(user);
    },

    showCardNum(isShow, num) {
        if (this.cardBackSprite) this.cardBackSprite.node.active = isShow;
        if (this.cardCount) this.cardCount.string = isShow ? `${num}` : "";
    },


    /**603-发牌-推送 */
    send(user) {
        this._clearHolds();
        this._initOption();
        this._initBanker();
        if (this._seat.index == 0) return;
        let gameStatus = GDModel.getGameStatus();
        let playStatus = GDModel.getUserPlayStatusByChairID(user.uid);
        if (user.uid != GDModel.getMyUID() &&
            gameStatus != ApiGd.gameStatus.NONE &&
            UserModel.getData('isTest') &&
            playStatus != ApiRoom.playStatus.WATCH) {
            this._showHolds(user, gameStatus == ApiGd.gameStatus.SEND_CARDS);
        }
    },

    _showHolds(user, isSend) {
        // return
        let posList = [],
            cardList = GDModel.getUserHandCardsByUID(user.uid);
        if (this._seat.index == 1 || this._seat.index == 2) { //右 扑克牌从右向左排布
            posList = this._getCardsPos(1, cardList.length, this._handsLaneCount);
        } else if (this._seat.index == 3) { //左 扑克牌从左向右排布 
            posList = this._getCardsPos(2, cardList.length, this._handsLaneCount);
        }
        this._holds = GDModel.addCardItem(this.hands, cardList, posList, (CardItem, index) => {
            if (isSend) {
                CardItem.opacity = 0;
                cc.tween(CardItem)
                    .delay(index * 0.02)
                    .to(0.08, {
                        opacity: 255
                    })
                    .start();
            }
        });
    },

    _outsSync(user) {
        let gameStatus = GDModel.getGameStatus();
        let playStatus = GDModel.getUserPlayStatusByUID(user.uid);
        if (user.uid == GDModel.getLastOutUID() &&
            playStatus != ApiRoom.playStatus.NONE &&
            playStatus != ApiRoom.playStatus.WATCH &&
            gameStatus == ApiGd.gameStatus.USER_OPERATE
        ) {
            let outsLsit = GDModel.getLastOutCards();
            this.showOutsCards(outsLsit);
        }
    },

    showOutsCards(cardList) {
        if (!cardList || !cardList.length) {
            this._clearOuts();
            return false
        };
        let posList = [];
        if (this._seat.index == 1 || this._seat.index == 2) { //右 扑克牌从右向左排布
            posList = this._getCardsPos(1, cardList.length, this._outsLaneCount);
        } else if (this._seat.index == 3) { //左 扑克牌从左向右排布 
            posList = this._getCardsPos(2, cardList.length, this._outsLaneCount);
        } else if (this._seat.index == 0) {
            let relativePos = CCUtil.postionConvert(this._seat.comp.node, this.outs.parent);
            posList = this._getCardsPos(0, cardList.length, this._outsLaneCount);
            this.outs.setPosition(cc.v2(relativePos.x, this.outs.y));
        }
        this._outs = GDModel.addCardItem(this.outs, cardList, posList);
    },



    _holdsSync(user) {
        this._clearHolds();
        if (this._seat.index == 0) return;
        let gameStatus = GDModel.getGameStatus();
        let playStatus = GDModel.getUserPlayStatusByUID(user.uid);
        if (user.uid != GDModel.getMyUID() &&
            gameStatus != ApiGd.gameStatus.NONE &&
            playStatus != ApiRoom.playStatus.NONE &&
            playStatus != ApiRoom.playStatus.WATCH &&
            (gameStatus == ApiGd.gameStatus.GAME_END || UserModel.getData('isTest'))) {
            this._showHolds(user, gameStatus == ApiGd.gameStatus.SEND_CARDS);
        }
    },


    /**604=操作提示-推送 */
    turn(user) {
        this._initOption();
        this.clearStatus();
        // console.log("操作推送===user", user)
        let gameStatus = GDModel.getGameStatus();
        if (gameStatus == ApiGd.gameStatus.USER_OPERATE) {
            if (!!user.isTurn) {
                if (this.outs) this.outs.destroyAllChildren();
            } else {
                let lastOutCards = GDModel.getLastOutCards();
                if (lastOutCards.length == 0) {
                    this._clearOuts();
                }
                return
            }
        }
        this.showClock();
    },

    /**610-操作结果-推送 */
    out(data) {
        this._initOption();
        this.clearStatus();
        this._setOptionPos();
        let cardType = data.operateInfo ? data.operateInfo.cardType : 0;
        let cards = data.operateInfo ? data.operateInfo.cards : data.cards ? data.cards : [];
        let operateType = data.operateInfo && data.operateInfo.operateType ? data.operateInfo.operateType : data.type ? data.type : 0;
        if (!cards.length) {
            this._clearOuts();
        }
        if (!!this._isReview) {
            this._reviewOuts(data);
            this._reviewHands(data);
            this.showisAuto(!!data.isAuto);
        } else {
            let cardList = GDModel.getUserHandCardsByUID(data.uid);
            this.showCardNum(GDModel.isShowCardCount(cardList.length), cardList.length);
            if (!!UserModel.getData('isTest') &&
                data.uid != GDModel.getMyUID()) {
                this._holdsSync(data);
            }
            this._outsSync(data);
        }

        let audio = '';
        if (operateType == ApiGd.operateType.PASS) {
            audio = `res/audio/man/man_buyao1`;
            this._showOption(`res/sprite/op/buchu`);
        } else {
            let ainmType = null;
            if (!cardType || !cards.length) return;
            if (cardType == ApiGd.cardType.SINGLE_LINE) {
                ainmType = 0;
                audio = `res/audio/man/man_shunzi`;
            } else if (cardType == ApiGd.cardType.DOUBLE_LINE) {
                ainmType = 1;
                audio = `res/audio/man/man_liandui`;
            } else if (cardType == ApiGd.cardType.THREE_LINE) { // 三不带
                ainmType = 2;
                audio = `res/audio/man/man_sandai`;
            } else if (cardType == ApiGd.cardType.THREE_LINE_TAKE_TWO) { //三带一对
                ainmType = 3;
                audio = `res/audio/man/man_sandaier`;
            } else if (cardType == ApiGd.cardType.STEEL_PLATE) { // 钢板
                ainmType = 4;
                audio = `res/audio/man/man_gangban`;
            } else if (cardType == ApiGd.cardType.BOMB_CARD) {
                ainmType = 6;
                audio = `res/audio/man/man_zhadan`;
            } else if (cardType == ApiGd.cardType.TONG_HUA_SUN) {
                ainmType = 5;
                audio = `res/audio/man/man_zhadan`;
            } else if (cardType == ApiGd.cardType.TIAN_WANG_BOMB) {
                audio = `res/audio/man/man_tianwangzha`;
            } else if (cardType == ApiGd.cardType.SINGLE) { //单张
                audio = `res/audio/man/man_${GDGameLogic.getCardValue(cards[0])}`;
            } else if (cardType == ApiGd.cardType.DOUBLE) { //对子
                audio = `res/audio/man/man_dui${GDGameLogic.getCardValue(cards[0])}`;
            }
            if (ainmType != null) {
                let cardLength = cards.length;
                let pos = this.outs.getPosition();
                let cardSize = GDModel.getCardSize();
                let laneCount = this._outsLaneCount;
                if (this._seat.index == 0) {
                    let relativePos = CCUtil.postionConvert(this._seat.comp.node, this.outs.parent);
                    pos = cc.v2(relativePos.x, this.outs.y);
                    this.outs.setPosition(pos);
                } else if (this._seat.index == 1 || this._seat.index == 2) {
                    laneCount = cardLength >= this._outsLaneCount ? this._outsLaneCount : cardLength % this._outsLaneCount;
                    pos = cc.v2(pos.x - 0.5 * cardSize.width * this.outs.scaleX - (laneCount - 1) * (1 - this._offSetXRate) * cardSize.width / 2 * this.outs.scaleX, pos.y - 0.5 * cardSize.height * this.outs.scaleY);
                } else if (this._seat.index == 3) {
                    laneCount = cardLength >= this._outsLaneCount ? this._outsLaneCount : cardLength % this._outsLaneCount;
                    pos = cc.v2(pos.x + 0.5 * cardSize.width * this.outs.scaleX + (laneCount - 1) * (1 - this._offSetXRate) * cardSize.width / 2 * this.outs.scaleX, pos.y - 0.5 * cardSize.height * this.outs.scaleY);
                }
                pos && GDModel.showAinm(ainmType, (node) => {
                    this._clearEffects();
                    this.node.addChild(node);
                    this._effects.push(node);
                }, pos);
            }
        }
        let user = GDModel.getUserInfoByUID(data.uid);
        if (user.sex == 1) {
            audio = audio.replace(/man/g, "woman");
        }
        AssetsManager.playEffect({
            path: audio,
            bundle: Enums.bundleType.GD
        });
    },
    /**显示状态 */
    showClock() {
        this.clearStatus();
        if (!this.clock) return;
        AssetsManager.loadAsset({
            path: 'res/prefab/GDClock',
            bundle: Enums.bundleType.GD,
            aType: cc.Prefab
        }, (item) => {
            if (!item || !cc.isValid(this.clock)) return;
            const clock = cc.instantiate(item);
            this.clock.addChild(clock);
        });
    },

    clearStatus() {
        if (this.clock) this.clock.destroyAllChildren();
    },
    /**显示准备状态 */
    ready() {
        // this._showOption('res/sprite/op/ready');
        // return
        this._initBanker();
        this.banker.scale = 0;
        var node = new cc.Node('readySprite');
        var sp = node.addComponent(cc.Sprite);
        node.parent = this.banker;
        AssetsManager.loadSpriteFrame({
            path: 'res/sprite/op/ready',
            bundle: Enums.bundleType.GD,
            sprite: sp,
        }, () => {
            this.banker.active = true;
            cc.tween(this.banker)
                .to(0.15, {
                    scale: 0.8
                })
                .start();
        });
    },

    /**显示抗贡 */
    showResist() {
        this._showOption('res/sprite/op/kanggong');
    },

    /**显示队友 */
    showDuiYou(isShow) {
        if (this.spr_you) this.spr_you.active = isShow;
    },

    /**显示排名 */
    showRanking(val, effectNode) {
        if (!this.spr_ming) return
        this.spr_ming.getComponent(cc.Sprite).spriteFrame = null;
        let playerRanking = GDModel.getplayerRanking();
        val = playerRanking[this._user.uid] || 0;
        this.spr_ming.active = !!val;
        if (!val) return;
        let show = () => {
            AssetsManager.loadSpriteFrame({
                bundle: Enums.bundleType.GD,
                path: `res/sprite/rank/spr_ming_${val}`,
                sprite: this.spr_ming.getComponent(cc.Sprite)
            });
            if (val != 1 || !effectNode) return;
            effectNode.scale = 1;
            effectNode.getChildByName("sp_xiaoji").active = false;
            effectNode.getChildByName("spr_xiaoji").active = true;
        }
        if (effectNode) {
            let startPos = CCUtil.postionConvert(effectNode.parent, this.spr_ming.parent);
            effectNode.parent = this.spr_ming;
            effectNode.setPosition(startPos);
            cc.tween(effectNode)
                .to(0.3, {
                    position: cc.v2(0, 80),
                    scale: 0.3
                })
                .call(show)
                .start();
        } else {
            show();
        }
    },

    /**显示换牌结果 */
    showSwapCard(cardId) {
        if (!this.spr_swap) return;
        this.spr_swap.active = !!cardId;
        cardId && AssetsManager.loadSpriteFrame({
            path: `sprite/cards/${cardId}`,
            sprite: this.spr_swap.getComponent(cc.Sprite)
        });
    },

    _clearHolds() {
        let holdsList = this._holds;
        for (let index = 0; index < holdsList.length; index++) {
            const element = holdsList[index];
            element && NodePoolManager.put('gdCardPool', element);
        }
        if (this.hands) {
            while (this.hands.childrenCount != 0) {
                let card = this.hands.children[0];
                card && NodePoolManager.put('gdCardPool', card);
            }
            this.hands.destroyAllChildren();
        }
        this._holds = [];
    },

    _clearOuts() {
        let outsList = this._outs;
        for (let index = 0; index < outsList.length; index++) {
            const element = outsList[index];
            element && NodePoolManager.put('gdCardPool', element);
        }
        if (this.outs) {
            while (this.outs.childrenCount != 0) {
                let card = this.outs.children[0];
                card && NodePoolManager.put('gdCardPool', card);
            }
            this.outs.destroyAllChildren();
        }
        this._outs = [];
    },

    cardBackSync(url) {
        if (!this.cardBackSprite) return;
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: this.cardBackSprite
        });
    },

    _initBanker() {
        if (!this.banker) return;
        this.banker.scale = 1;
        this.banker.active = false;
        this.banker.stopAllActions();
        this.banker.destroyAllChildren();
        this.banker.setPosition(this._bankerPos);
    },



    /**初始操作提示 */
    _initOption() {
        if (!this.option) return;
        this.option.node.scale = 0;
        this.option.spriteFrame = null;
        this.option.node.active = true;
        this.option.node.stopAllActions();
    },
    /**设置操作提示位置 */
    _setOptionPos() {
        if (!this.option) return;
        if (this._seat.index == 0) {
            let relativePos = CCUtil.postionConvert(this._seat.comp.node, this.option.node.parent);
            this.option.node.setPosition(cc.v2(relativePos.x, this.option.node.y));
        }
    },

    _showOption(path, time = 0.15, scale = 0.8) {
        this._initOption();
        this._setOptionPos();
        if (!this.option) return;
        this.option.node.active = true;
        AssetsManager.loadSpriteFrame({
            bundle: Enums.bundleType.GD,
            sprite: this.option,
            path: path,
        }, () => {
            cc.tween(this.option.node)
                .to(time, {
                    scale: scale
                })
                .start();
        });
    },


    /**设置分数 */
    setUserScore(s) {
        if (GDModel.scoreState() == 1) return
        if (this.score) this.score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (GDModel.scoreState() == 1) {
            if (this.roundscoreroot) {
                this.roundscoreroot.active = false;
            };
            if (this.score) {
                this.score.string = num;
                this.score.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
            };
            return
        }
        if (cc.isValid(this.roundscoreroot)) {
            this.roundScore.string = num;
            this.roundscoreroot.active = GDModel.scoreState() == 2;
            this.roundScore.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
        }
    },

    small(user) {
        this.setUserScore(GDModel.getUserTotalScoreByUID(user.uid));
        if (this.spr_ming) this.spr_ming.destroyAllChildren();
        if (this.spr_swap) this.spr_swap.active = false;
        this.showCardNum(false);
        this._initOption();
        this.scheduleOnce(() => {
            this._clearHolds();
            this._clearOuts();
        }, 1)
    },

    off() {
        this.offline.active = true;
    },


    _clearEffects() {
        if (!this._effects) return
        let effects = this._effects || [];
        for (const item of effects) {
            if (!item || !cc.isValid(item)) continue;
            item.destroy();
        }
    },

    update(dt) {
        if (!!this.text && !!this.text.active) {
            this.text.width = this.textLbl.node.width + 35;
            this.text.height = this.textLbl.node.height + 10;
        }
    },

    showisAuto(isShow) {
        if (this.node.getChildByName("spr_tuoguan")) {
            this.node.getChildByName("spr_tuoguan").active = isShow;
        }
    },





    /**回放 */
    review(user) {
        this.leave();
        this._user = user;
        this._offSetXRate = 0.7;
        this._offSetYRate = 0.7;
        this.node.active = true;
        this.nick.string = CCUtil.stringClamp(user.nickname, 7, '..');
        this.setUserScore(user.score);
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.head
        });

        let SwapCardID = 0;
        let datalist = user.datalist || [];
        for (let index = 0; index < datalist.length; index++) {
            let curData = datalist[index];
            if (curData.uid == user.uid) {
                SwapCardID = curData.cards ? curData.cards[0] : 0;
            }
        }
        this.showSwapCard(SwapCardID);
        //手牌处理


        this.option.node.scale = 0;
        this.option.node.stopAllActions();
        let Ranking = user.playerRanking || 0;
        this.spr_ming.active = !!Ranking;
        Ranking && AssetsManager.loadSpriteFrame({
            bundle: Enums.bundleType.GD,
            path: `res/sprite/rank/spr_ming_${Ranking}`,
            sprite: this.spr_ming.getComponent(cc.Sprite)
        });
        let handCardsList = user.handCards || [],
            posList = [];
        if (this._seat.index == 1 || this._seat.index == 2) { //右 扑克牌从右向左排布
            posList = this._getCardsPos(1, handCardsList.length, this._handsLaneCount);
        } else if (this._seat.index == 3) { //左 扑克牌从左向右排布 
            posList = this._getCardsPos(2, handCardsList.length, this._handsLaneCount);
        } else if (this._seat.index == 0) {
            posList = this._getCardsPos(0, handCardsList.length, 30);
            this._setOptionPos();
        }
        this.showCardNum(true, handCardsList.length);
        this._holds = GDModel.addCardItem(this.hands, handCardsList, posList);
    },

    _reviewHands(data) {
        let cardList = data.operateInfo && data.operateInfo.handCards ? data.operateInfo.handCards : null;
        if (!cardList) return
        let posList = [];
        if (this._seat.index == 0) {
            posList = this._getCardsPos(0, cardList.length, 30); //居中
        } else if (this._seat.index == 1 || this._seat.index == 2) { //右 扑克牌从右向左排布
            posList = this._getCardsPos(1, cardList.length, this._handsLaneCount);
        } else if (this._seat.index == 3) { //左 扑克牌从左向右排布 
            posList = this._getCardsPos(2, cardList.length, this._handsLaneCount);
        }
        this.showCardNum(true, cardList.length);
        this._holds = GDModel.addCardItem(this.hands, cardList, posList);
    },

    _reviewOuts(data) {
        let cardList = data.operateInfo && data.operateInfo.cards ? data.operateInfo.cards : [];
        this.showOutsCards(cardList);
    },


    onClick() {
        if (!this._user) return
        if (CCUtil.clickInterval(this.node, 0.5)) return;
        let user = this._user;
        let showHeadDetail = () => {
            try {
                let params = {
                    canSendGift: true,
                    fromChairID: GDModel.getMyChairID(),
                    toChairID: user.chairID,
                    avatar: user.userInfo.avatar,
                    id: user.uid,
                    ip: user.userInfo.lastLoginIP,
                    location: user.userInfo.location,
                    gold: GDModel.getUserTotalScoreByUID(user.uid),
                    name: user.userInfo.nickname,
                };
                AssetsManager.headDialog(params);
            } catch (e) { }
        }

        if (GDModel.getUserTest() && !!user) {
            AssetsManager.createDialog({
                user: user,
                optUid: user.uid,
                callback: showHeadDetail,
                bundle: Enums.bundleType.GD,
                path: "res/prefab/GDTestSelect",
            })
            return
        } else {
            showHeadDetail();
        }
    },

    /**玩家聊天 */
    chat(data) {
        if (!this._user) return;
        data.user = this._user;
        CCUtil.gameChat(data, this.textLbl.node, this.head.node, this.node)
    },

    /**
     * 
     * @param {*} dir 0 -居中 1-右左 2-左右
     * @param {*} count 
     * @returns 
     */
    _getCardsPos(dir, count, lane) {
        let cardSize = GDModel.getCardSize();
        let perWidth = cardSize.width * (1 - this._offSetXRate);
        let perHeight = cardSize.height * (1 - this._offSetYRate);
        let totalRow = Math.floor(count / lane);
        let pos = [];
        let startPos = cc.v2(0, 0);
        if (dir == 0) {
            //锚点cc.v2(0.5,0.5) 中心点散开
            let totalWidth = perWidth * (count - 1);
            startPos = cc.v2(-totalWidth / 2, 0);
            for (let index = 0; index < count; index++) {
                pos.push(cc.v2(startPos.x + index * perWidth, 0));
            }
        } else if (dir == 1) {
            //锚点cc.v2(1,1) 从右到左
            startPos = cc.v2(-0.5 * cardSize.width, -0.5 * cardSize.height);
            for (let index = 0; index < count; index++) {
                let rowIndex = Math.floor(index / lane);
                let colIndex = Math.floor(index % lane);
                let laneCount = rowIndex < totalRow ? lane : count % lane != 0 ? count % lane : lane;
                pos.push(cc.v2(startPos.x - (laneCount - 1 - colIndex) * perWidth, startPos.y - rowIndex * perHeight));
            }
        } else if (dir == 2) {
            //锚点cc.v2(0,1) 从左到右
            startPos = cc.v2(0.5 * cardSize.width, -0.5 * cardSize.height);
            for (let index = 0; index < count; index++) {
                let rowIndex = Math.floor(index / lane);
                let colIndex = Math.floor(index % lane);
                pos.push(cc.v2(startPos.x + colIndex * perWidth, startPos.y - rowIndex * perHeight));
            }
        }
        // console.log('获取牌节点位置', pos, count)
        return pos;
    },
});