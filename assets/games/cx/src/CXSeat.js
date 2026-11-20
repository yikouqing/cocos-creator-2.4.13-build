const CCUtil = require('../../../src/utils/CCUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Utils = require('../../../src/utils/Utils');
const CXModel = require('./CXModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const UserModel = require('../../../src/model/UserModel');
const ApiCx = require('./ApiCx');
const Enums = require('../../../src/const/Enums');
const NodePoolManager = require('../../../src/utils/NodePoolManager');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        touCards: [cc.Sprite], //头道牌组
        weiCards: [cc.Sprite], //尾道牌组
        empty: cc.Node, //空位标记
        player: cc.Node, //玩家节点
        head: cc.Sprite, //玩家头像
        nick: cc.Label, //玩家昵称
        score: cc.Label, //玩家分数        
        banker: cc.Node, //庄家标记
        pourNode: cc.Node, //下分节点
        pourScore: cc.Label, //下分LABEL
        opNode: cc.Node, //操作节点
        opType: cc.Sprite, //操作类型
        deals: cc.Node, //发牌节点
        fenpaiNode: cc.Node, //分牌节点
        touTypeNode: cc.Node,
        touCardType: cc.Label, //头道类型
        weiTypeNode: cc.Node,
        weiCardType: cc.Label, //尾道类型
        tdeals: cc.Node, //后手发牌
        timer: cc.ProgressBar, //计时器
        timeCount: cc.Label, //计时计数
        lizi: cc.Node, //计时器粒子效果
        win: cc.Node,
        pourBar: cc.Node,

        _index: -1,
        _deal: null,
        _user: null,
        _userInfo: null,
        _endTime: 0,
        _duration: 0,
        _opPos: null,
        _comp: null,
        _handCards: null,
        _pourPos: null,
        _pourBarPos: null,
        _pourStartPos: null,
        _handCardsRelativePos: null,
    },

    //初始化
    init(data) {
        this._deal = data.deal;
        this.node.active = false;
        this.empty.active = false;
        this.player.active = false;
        this._opPos = this.opNode.getPosition();
        this._pourPos = this.pourNode.getPosition();
        this._pourBarPos = CCUtil.postionConvert(this.pourBar, this.player);
        this._pourStartPos = CCUtil.postionConvert(this.player, this.pourNode.parent);
        let dealStartPos = CCUtil.postionConvert(this._deal, this.deals);
        for (let index = 0; index < this.deals.children.length; index++) {
            this.deals.children[index].dealStartPos = dealStartPos;
            this.deals.children[index].dealEndPos = this.deals.children[index].getPosition();
            this.deals.children[index].curDealCardIndex = index;
        }
        let tdealStartPos = CCUtil.postionConvert(this._deal, this.tdeals);
        this._handCardsRelativePos = {};
        let cardSize = this.tdeals.children[0].getContentSize();
        let cardLane = 10;
        let dir = 1;
        if (data.index > 0 && data.index < 4) {
            dir = 1;
        } else {
            dir = 2;
        }
        this._handCardsRelativePos.two = this._getCardsPos(dir, 2, cardSize, 0, cardLane);
        this._handCardsRelativePos.three = this._getCardsPos(dir, 3, cardSize, 0, cardLane);
        this._handCardsRelativePos.four = this._getCardsPos(dir, 4, cardSize, 0, cardLane);
        for (let index = 0; index < this.tdeals.children.length; index++) {
            this.tdeals.children[index].dealStartPos = tdealStartPos;
            this.tdeals.children[index].dealEndPos = this.tdeals.children[index].getPosition();
            this.tdeals.children[index].curDealCardIndex = index;
            this.tdeals.children[index].two = this._handCardsRelativePos.two;
            this.tdeals.children[index].three = this._handCardsRelativePos.three;
            this.tdeals.children[index].four = this._handCardsRelativePos.four;
        }
    },

    //初始化
    bind(index) {
        this.node.active = true;
        this._index = index;
        this.empty.active = true;
        this.player.active = false;
    },

    sit(user) {
        this._user = user;
        this._userInfo = user.userInfo;
        this.node.active = true;
        this.empty.active = false;
        this.player.active = true;
        let playStatus = user.playStatus;
        let gameStatus = CXModel.getGameStatus();
        if (!!this._userInfo) {
            this.nick.string = CCUtil.stringClamp(user.userInfo.nickname, 7, '..');
            AssetsManager.loadSpriteFrame({
                path: user.userInfo.avatar,
                sprite: this.head
            });
        }
        if (this.win) this.win.destroyAllChildren();
        for (let index = 0; index < this.deals.children.length; index++) {
            this.deals.children[index].uid = user.uid;
        }
        for (let index = 0; index < this.tdeals.children.length; index++) {
            this.tdeals.children[index].uid = user.uid;
        }
        //绑定UID 发牌用
        //庄家显示
        this.banker.active = CXModel.getBankerUID() == user.uid && gameStatus != ApiCx.gameStatus.NONE;
        //操作时间显示
        if (gameStatus == ApiCx.gameStatus.USER_OPERATE &&
            playStatus == ApiRoom.playStatus.PLAYING &&
            CXModel.getCurOperateUID() == user.uid) {
            let time = CXModel.getTick();
            this._endTime = Date.now() + time.time * 1000;
            this._duration = time.duration * 1000;
            this.lizi.angle = 0;
            this.timer.node.active = true;
            this.lizi.active = true;
            this.timeCount.string = time.time;
        } else {
            this.timer.node.active = false;
            this.timeCount.string = '';
            this._duration = 0;
            this._endTime = 0;
            this.lizi.active = false;
        }
        this.score.string = Utils.formatNumberWithDecimal(CXModel.getUserTotalScoreByUID(user.uid), 1);
        if (gameStatus == ApiCx.gameStatus.NONE ||
            playStatus == ApiRoom.playStatus.NONE ||
            playStatus == ApiRoom.playStatus.WATCH ||
            playStatus == ApiRoom.playStatus.READY) {
            this.banker.active = false;
            this.deals.active = false;
            this.pourNode.active = false;
            this.opNode.active = false;
            this.opType.spriteFrame = null;
            this.fenpaiNode.active = false;
            this.tdeals.active = false;
        } else {
            //手牌处理
            let userOperateStatus = CXModel.getUserOperateStatusByUID(user.uid);
            this.deals.active = gameStatus != ApiCx.gameStatus.RESULT &&
                user.uid != UserModel.getData('uid') &&
                userOperateStatus != ApiCx.operateType.FOLD &&
                userOperateStatus != ApiCx.operateType.FEN &&
                !UserModel.getData('isTest')
            if (this.deals.active) {
                for (let index = 0; index < this.deals.children.length; index++) {
                    let card = this.deals.children[index];
                    if (!card) continue;
                    card.stopAllActions();
                    card.scaleX = 1;
                    card.setPosition(card.dealEndPos);
                }
            }
            if ((gameStatus == ApiCx.gameStatus.SEND_CARDS ||
                gameStatus == ApiCx.gameStatus.USER_OPERATE) &&
                user.uid != UserModel.getData('uid') &&
                userOperateStatus != ApiCx.operateType.FEN) {
                let cards = CXModel.getUserHandCardsByUID(user.uid);
                this.tdeals.active = true;
                if (!UserModel.getData('isTest')) {
                    for (let index = 0; index < this.tdeals.children.length; index++) {
                        this.tdeals.children[index].stopAllActions();
                        this.tdeals.children[index].scaleX = 1;
                        if (index >= 2 && !!cards[index]) {
                            this.tdeals.children[index].active = true;
                            this.tdeals.children[index].setPosition(this._handCardsRelativePos.two[index - 2]);
                            AssetsManager.loadSpriteFrame({
                                path: 'sprite/cards/' + cards[index],
                                sprite: this.tdeals.children[index].getComponent(cc.Sprite)
                            });
                        } else {
                            this.tdeals.children[index].active = false;
                        }
                    }
                } else {
                    let deal = CXModel.getCurDealTurn();
                    let handCount = 2;
                    let relativePos = null;
                    if (deal == 1) {
                        relativePos = this._handCardsRelativePos.two;
                        handCount = 2;
                    } else if (deal == 2) {
                        if (!!cards[deal]) {
                            relativePos = this._handCardsRelativePos.three;
                            handCount = 3;
                        } else {
                            relativePos = this._handCardsRelativePos.two;
                            handCount = 2;
                        }
                    } else if (deal == 3) {
                        if (!cards[deal - 1]) {
                            relativePos = this._handCardsRelativePos.two;
                            handCount = 2;
                        } else {
                            if (!cards[deal]) {
                                relativePos = this._handCardsRelativePos.three;
                                handCount = 3;
                            } else {
                                relativePos = this._handCardsRelativePos.four;
                                handCount = 4;
                            }
                        }
                    }
                    for (let index = 0; index < this.tdeals.children.length; index++) {
                        if (index < handCount) {
                            this.tdeals.children[index].active = true;
                            this.tdeals.children[index].stopAllActions();
                            this.tdeals.children[index].scaleX = 1;
                            this.tdeals.children[index].setPosition(relativePos[index]);
                            this.tdeals.children[index].handCardId = cards[index];
                            AssetsManager.loadSpriteFrame({
                                path: 'sprite/cards/' + cards[index],
                                sprite: this.tdeals.children[index].getComponent(cc.Sprite)
                            });
                        } else {
                            this.tdeals.children[index].active = false;
                            AssetsManager.loadSpriteFrame({
                                path: 'sprite/cards/' + 0,
                                sprite: this.tdeals.children[index].getComponent(cc.Sprite)
                            });
                        }
                    }
                }
            } else {
                this.tdeals.active = false;
                //重置牌组
                for (let index = 0; index < this.tdeals.children.length; index++) {
                    this.tdeals.children[index].active = false;
                    AssetsManager.loadSpriteFrame({
                        path: 'sprite/cards/' + 0,
                        sprite: this.tdeals.children[index].getComponent(cc.Sprite)
                    });
                }
            }
            //分牌处理
            let endCards = CXModel.getUserEndCardsByUID(user.uid);
            if (gameStatus == ApiCx.gameStatus.RESULT &&
                userOperateStatus == ApiCx.operateType.FEN &&
                !!endCards) {
                this.fen(endCards);
            } else {
                this.reFen();
            }
            //操作类型处理
            if (userOperateStatus > 0) {
                this.opNode.active = true;
                this.opNode.stopAllActions();
                this.opNode.scale = 1;
                AssetsManager.loadSpriteFrame({
                    bundle: Enums.bundleType.CX,
                    path: `res/sprite/op/op_${userOperateStatus}`,
                    sprite: this.opType
                });
            } else {
                this.opNode.active = false;
            }
            if ((gameStatus == ApiCx.gameStatus.SEND_CARDS ||
                gameStatus == ApiCx.gameStatus.USER_OPERATE) &&
                userOperateStatus != ApiCx.operateType.NONE) {
                this.pourScore.string = Utils.formatNumberWithDecimal(CXModel.getUserPourScoreByUID(user.uid), 1);
                this.pourNode.stopAllActions();
                this.pourNode.setPosition(this._opPos);
            } else {
                this.pourNode.active = false;
                this.pourScore.string = '';
            }
        }
    },

    opSync(user) {
        let opType = CXModel.getUserOperateStatusByUID(user.uid);
        this.opNode.stopAllActions();
        if (opType == ApiCx.operateType.QIAO || opType == ApiCx.operateType.GEN || opType == ApiCx.operateType.FEN) {
            this.opNode.scale = 1;
        } else {
            this.opNode.active = false;
            this.opNode.scale = 0;
        }
        for (let index = 0; index < this.deals.children.length; index++) {
            this.deals.children[index].uid = user.uid;
        }
        for (let index = 0; index < this.tdeals.children.length; index++) {
            this.tdeals.children[index].uid = user.uid;
        }
    },

    base(user) {
        this.timer.progress = 0;
        this._endTime = 0;
        this._duration = 0;
        this.lizi.angle = 0;
        this.timer.node.active = false;
        this.lizi.active = false;
        this.timeCount.string = '';
        this.score.string = Utils.formatNumberWithDecimal(CXModel.getUserTotalScoreByUID(user.uid), 1);
        this.pourScore.string = Utils.formatNumberWithDecimal(user.score, 1);
        this.pourNode.active = true;
        this.pourNode.stopAllActions();
        this.pourNode.setPosition(this._pourStartPos);
        cc.tween(this.pourNode)
            .to(0.3, {
                position: cc.v3(this._pourPos)
            }, {
                easing: 'expoOut'
            })
            .start();
    },

    leave() {
        if (this.win) this.win.destroyAllChildren();
        this._user = null;
        this.empty.active = true;
        this.player.active = false;
        this.opNode.active = false;
        this.opType.spriteFrame = null;
        this.fenpaiNode.active = false;
        this.touCardType.string = '';
        for (let index = 0; index < this.touCards.length; index++) {
            this.touCards[index].spriteFrame = null;
        }
        this.weiCardType.string = '';
        for (let index = 0; index < this.weiCards.length; index++) {
            this.weiCards[index].spriteFrame = null;
        }
        this.tdeals.active = false;
        for (let index = 0; index < this.deals.children.length; index++) {
            this.deals.children[index].uid = null;
        }
        for (let index = 0; index < this.tdeals.children.length; index++) {
            this.tdeals.children[index].uid = null;
            AssetsManager.loadSpriteFrame({
                path: 'sprite/cards/' + 0,
                sprite: this.tdeals.children[index].getComponent(cc.Sprite)
            });
        }
        this.timer.node.active = false;
        this.timeCount.string = '';
        this.lizi.active = false;
        this.timer.progress = 0;
        this.banker.active = false;
        this.node.active = true;
    },

    hide() {
        this._index = -1;
        this.node.active = false;
        this.empty.active = false;
        this.player.active = false;
    },

    fen(user) {
        let data = Utils.clone(user);
        this.tdeals.active = false;
        this.fenpaiNode.active = true;
        if (data.oneType == ApiCx.cardType.SHANHUA) {
            data.oneCards = data.oneCards || [];
            data.twoCards = data.twoCards || [];
            let oneCard = data.oneCards.pop();
            data.twoCards.unshift(oneCard);
        }
        if (!!data.oneCards) {
            let oneCards = data.oneCards;
            for (let index = 0; index < oneCards.length; index++) {
                if (!this.touCards[index]) continue;
                AssetsManager.loadSpriteFrame({
                    path: ConfigModel.getCardUrl(oneCards[index]),
                    sprite: this.touCards[index]
                });
            }
            this.touTypeNode.active = true;
            this.touCardType.string = ApiCx.cardTypeName[data.oneType];
        }
        if (!!data.twoCards) {
            let twoCards = data.twoCards;
            for (let index = 0; index < twoCards.length; index++) {
                if (!this.weiCards[index]) continue;
                AssetsManager.loadSpriteFrame({
                    path: ConfigModel.getCardUrl(twoCards[index]),
                    sprite: this.weiCards[index]
                });
            }
            if (data.oneType != ApiCx.cardType.SHANHUA) {
                this.weiTypeNode.active = true;
                this.weiCardType.string = ApiCx.cardTypeName[data.twoType];
            } else {
                this.weiCardType.string = "";
                this.weiTypeNode.active = false;
            }
        }
    },

    reFen() {
        this.fenpaiNode.active = false;
        this.touCardType.string = '';
        this.touTypeNode.active = false;
        for (let index = 0; index < this.touCards.length; index++) {
            this.touCards[index].node.stopAllActions();
            this.touCards[index].spriteFrame = null;
            this.touCards[index].node.scaleX = 1;
        }
        this.weiCardType.string = '';
        this.weiTypeNode.active = false;
        for (let index = 0; index < this.weiCards.length; index++) {
            this.weiCards[index].node.stopAllActions();
            this.weiCards[index].spriteFrame = null;
            this.weiCards[index].node.scaleX = 1;
        }
    },

    //分牌
    show(data) {
        if (data.uid == CXModel.getMyUid()) {
            let endCards = CXModel.getUserEndCardsByUID(data.uid);
            this.fen(endCards);
        }
        this.opNode.active = true;
        this.opNode.stopAllActions();
        this.opNode.scale = 0;
        AssetsManager.loadSpriteFrame({
            bundle: Enums.bundleType.CX,
            path: `res/sprite/op/op_${data.operateType}`,
            sprite: this.opType
        });
        cc.tween(this.opNode)
            .to(0.3, {
                scale: 1
            })
            .call(() => {
                AssetsManager.playEffect({
                    path: `res/audio/fen`,
                    bundle: Enums.bundleType.CX
                });
            })
            .start();
    },

    //玩家操作
    op() {
        this.opNode.stopAllActions();
        this.opNode.scale = 0;
        this.opNode.active = false;
        let time = CXModel.getTick();
        this._endTime = Date.now() + time.time * 1000;
        this._duration = time.duration * 1000;
        this.lizi.angle = 0;
        this.timer.node.active = true;
        this.lizi.active = true;
        this.timeCount.string = time.time;
    },

    action(data) {
        this.timer.progress = 0;
        this._endTime = 0;
        this._duration = 0;
        this.lizi.angle = 0;
        this.timer.node.active = false;
        this.timeCount.string = '';
        this.lizi.active = false;
        this.opNode.stopAllActions();
        this.opNode.scale = 0;
        this.opNode.active = true;
        AssetsManager.loadSpriteFrame({
            bundle: Enums.bundleType.CX,
            path: `res/sprite/op/op_${data.operateType}`,
            sprite: this.opType
        });
        cc.tween(this.opNode)
            .to(0.3, {
                scale: 1
            })
            .start();
        if (data.operateType == ApiCx.operateType.DA ||
            data.operateType == ApiCx.operateType.GEN ||
            data.operateType == ApiCx.operateType.QIAO ||
            data.operateType == ApiCx.operateType.XIU) {
            this.pourNode.stopAllActions();
            this.pourNode.active = true;
            this.pourNode.setPosition(this._pourPos);
            if (data.operateType == ApiCx.operateType.DA ||
                data.operateType == ApiCx.operateType.GEN ||
                data.operateType == ApiCx.operateType.QIAO) {
                this.score.string = Utils.formatNumberWithDecimal(CXModel.getUserTotalScoreByUID(data.uid), 1);
                this.pourScore.string = Utils.formatNumberWithDecimal(CXModel.getUserPourScoreByUID(data.uid), 1);
                let chip = NodePoolManager.get('cxPourGoldPool');
                if (!!chip) {
                    this.player.addChild(chip);
                    chip.setPosition(cc.v2(0, 0));
                    cc.tween(chip)
                        .to(0.35, {
                            position: cc.v3(this._pourBarPos)
                        }, {
                            easing: 'expoOut'
                        })
                        .call(() => {
                            AssetsManager.playEffect({
                                path: `res/audio/pour`,
                                bundle: Enums.bundleType.CX
                            });
                        })
                        .call(() => {
                            NodePoolManager.put('cxPourGoldPool', chip)
                        })
                        .start();
                }
            }
        } else if (data.operateType == ApiCx.operateType.FOLD) {
            this.pourNode.stopAllActions();
            this.pourNode.setPosition(this._pourPos);
            this.pourNode.active = false;
            if (this.deals.active && !UserModel.getData("isTest")) {
                let dealCount = this.deals.children.length;
                for (let index = 0; index < dealCount; index++) {
                    let card = this.deals.children[index];
                    if (!card) continue;
                    card.active = true;
                    card.stopAllActions();
                    card.scaleX = 1;
                    card.setPosition(card.dealEndPos);
                    cc.tween(card)
                        .to(0.2, {
                            position: cc.v3(card.dealStartPos)
                        })
                        .call(() => {
                            if (index == dealCount - 1) {
                                this.deals.active = false;
                            }
                        })
                        .start();
                }
            }
        }
        let audio = '';
        if (data.operateType == ApiCx.operateType.FOLD) {
            audio = 'fold';
        } else if (data.operateType == ApiCx.operateType.DA) {
            audio = 'da';
        } else if (data.operateType == ApiCx.operateType.GEN) {
            audio = 'gen';
        } else if (data.operateType == ApiCx.operateType.QIAO) {
            audio = 'qiao';
        } else if (data.operateType == ApiCx.operateType.XIU) {
            audio = 'xiu';
        }
        AssetsManager.playEffect({
            path: `res/audio/${audio}`,
            bundle: Enums.bundleType.CX
        });
    },

    update(dt) {
        if (this.timer.node.active) {
            let left = this._endTime - Date.now();
            if (left <= 0) {
                this.timer.node.active = false;
                this.timeCount.string = '';
                return;
            } else {
                this.timeCount.string = Math.floor(left / 1000);
                let progress = left / this._duration;
                this.lizi.angle = 0 - 360 * (1 - progress);
                this.timer.progress = progress; //设置总时长为10s 用于中途回复计时状态
                // if (left <= 5000) {
                //     this.light.color = cc.color("#FF0000");
                // }
            }
        }
    },

    button(isBanker) {
        this.banker.active = isBanker;
    },

    btnClicks(event, param) {

        switch (param) {
            case 'sit':
                this.sitClick();
                break;
            case 'head':
                this.headClick();
                break;
        }
    },

    sitClick() {
        if (CXModel.checkInSeat()) return;
        let data = {
            path: 'res/prefab/CXBuyDialog',
            bundle: Enums.bundleType.CX
        }
        AssetsManager.createDialog(data);
    },

    headClick() {
        if (!this._user) return;
        let user = this._user;
        try {
            let params = {
                canSendGift: CXModel.getMyChairID() < CXModel.getChairCount(),
                fromChairID: CXModel.getMyChairID(),
                toChairID: user.chairID,
                avatar: user.userInfo.avatar,
                id: user.userInfo.uid,
                ip: user.userInfo.lastLoginIP,
                location: user.userInfo.location,
                gold: user.userInfo.score,
                name: user.userInfo.nickname,
            };
            AssetsManager.headDialog(params);
        } catch (e) { }
    },

    bring(score) {
        this.score.string = Utils.formatNumberWithDecimal(score, 1);
    },

    small(user) {
        this.pourNode.stopAllActions();
        this.pourNode.active = false;
        let endCards = CXModel.getUserEndCardsByUID(user.uid);
        let userOperateStatus = CXModel.getUserOperateStatusByUID(user.uid);
        if (!!endCards && userOperateStatus == ApiCx.operateType.FEN) {
            this.fen(endCards);
        } else {
            this.reFen();
        }
        this.score.string = Utils.formatNumberWithDecimal(CXModel.getUserTotalScoreByUID(user.uid), 1);
        if (user.win > 0) {
            AssetsManager.loadAsset({
                path: 'res/prefab/CXEffectWin',
                aType: cc.Prefab,
                bundle: Enums.bundleType.CX
            }, (item) => {
                if (!cc.isValid(this.win)) return;
                this.win.destroyAllChildren();
                let win = cc.instantiate(item);
                this.win.addChild(win);
            });
            AssetsManager.loadAsset({
                path: 'res/prefab/CXWinItem',
                aType: cc.Prefab,
                bundle: Enums.bundleType.CX
            }, (item) => {
                if (!cc.isValid(this.node)) return;
                let win = cc.instantiate(item);
                win.getComponent('CXWinItem') &&
                    win.getComponent('CXWinItem').bind(user.win);
                this.player.addChild(win);
                cc.tween(win)
                    .by(0.45, {
                        position: cc.v3(0, this.player.height / 2 + win.height / 2)
                    })
                    .by(0.25, {
                        position: cc.v3(0, -5)
                    })
                    .delay(1)
                    .to(0.5, {
                        opacity: 0
                    })
                    .removeSelf()
                    .start();
            });
        } else {
            if (this.win) this.win.destroyAllChildren();
        }

    },

    /**
     * 
     * @param {*} dir 0 -居中 1-右左 2-左右
     * @param {*} count 
     * @returns 
     */
    _getCardsPos(dir, count, size, offset, lane) {
        let perWidth = size.width * (1 - offset);
        let perHeight = size.height * (1 - offset);
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
            //锚点cc.v2(1,0.5) 从右到左
            startPos = cc.v2(-0.5 * size.width, 0);
            for (let index = 0; index < count; index++) {
                let rowIndex = Math.floor(index / lane);
                let colIndex = Math.floor(index % lane);
                let laneCount = rowIndex < totalRow ? lane : count % lane != 0 ? count % lane : lane;
                pos.push(cc.v2(startPos.x - (laneCount - 1 - colIndex) * perWidth, startPos.y - rowIndex * perHeight));
            }
        } else if (dir == 2) {
            //锚点cc.v2(0,0.5) 从左到右
            startPos = cc.v2(0.5 * size.width, 0);
            for (let index = 0; index < count; index++) {
                let rowIndex = Math.floor(index / lane);
                let colIndex = Math.floor(index % lane);
                pos.push(cc.v2(startPos.x + colIndex * perWidth, startPos.y - rowIndex * perHeight));
            }
        }
        return pos;
    },

});