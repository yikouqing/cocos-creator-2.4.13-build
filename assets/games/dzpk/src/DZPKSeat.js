const CCUtil = require('../../../src/utils/CCUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Utils = require('../../../src/utils/Utils');
const DZPKModel = require('./DZPKModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const UserModel = require('../../../src/model/UserModel');
const ApiDzpk = require('./ApiDzpk');
const Enums = require('../../../src/const/Enums');
const ConfigModel = require('../../../src/model/ConfigModel');
const NodePoolManager = require('../../../src/utils/NodePoolManager');

cc.Class({
    extends: cc.Component,

    properties: {
        empty: cc.Node, //空位标记
        player: cc.Node, //玩家节点
        head: cc.Sprite, //玩家头像
        nick: cc.Label, //玩家昵称
        score: cc.Label, //玩家分数        
        banker: cc.Node, //庄家标记
        bankerSprite: cc.Sprite, //
        pourNode: cc.Node, //下分节点
        pourScore: cc.Label, //下分LABEL
        opNode: cc.Node, //操作节点
        opType: cc.Sprite, //操作类型
        deals: cc.Node, //发牌节点
        holdsLay: cc.Node,
        holds: [require('DZPKCard')],
        timer: cc.ProgressBar, //计时器
        timeCount: cc.Label, //计时计数
        lizi: cc.Node, //计时器粒子效果
        win: cc.Node,
        pourBar: cc.Node,
        cardTypeNode: cc.Node,
        cardType: cc.Label,

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
        _bankerPos: null,
    },

    //初始化
    init(data) {
        this._deal = data.deal;
        this.node.active = false;
        this.empty.active = false;
        this.player.active = false;
        this._opPos = this.opNode.getPosition();
        this._pourPos = this.pourNode.getPosition();
        this._bankerPos = this.banker.getPosition();
        this._pourBarPos = CCUtil.postionConvert(this.pourBar, this.player);
        this._pourStartPos = CCUtil.postionConvert(this.player, this.pourNode.parent);
        let dealStartPos = CCUtil.postionConvert(this._deal, this.deals);
        for (let index = 0; index < this.deals.children.length; index++) {
            this.deals.children[index].dealStartPos = dealStartPos;
            this.deals.children[index].dealEndPos = this.deals.children[index].getPosition();
            this.deals.children[index].curDealCardIndex = index;
        }
        let tdealStartPos = CCUtil.postionConvert(this._deal, this.holdsLay);
        let cardSize = this.holds[0].node.getContentSize();
        let cardLane = 10;
        let handCardsPos = this._getCardsPos(0, 2, cardSize, 0.5, cardLane);
        for (let index = 0; index < this.holds.length; index++) {
            this.holds[index].node.dealStartPos = tdealStartPos;
            this.holds[index].node.dealEndPos = this.holds[index].node.getPosition();
            this.holds[index].node.curDealCardIndex = index;
            this.holds[index].node.handCardsPos = handCardsPos;
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
        let gameStatus = DZPKModel.getGameStatus();
        let playStatus = user.playStatus;
        this.head.spriteFrame = null;
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
        for (let index = 0; index < this.holds.length; index++) {
            this.holds[index].node.uid = user.uid;
        }
        //庄家显示
        this.banker.stopAllActions();
        this.banker.setPosition(this._bankerPos);
        if ((DZPKModel.getBankerUID() == user.uid ||
            DZPKModel.getBBUID() == user.uid ||
            DZPKModel.getSBUID() == user.uid) &&
            gameStatus != ApiDzpk.gameStatus.NONE) {
            this.banker.active = true;
            let mark = '';
            if (DZPKModel.getBankerUID() == user.uid) {
                mark = 'd';
            } else if (DZPKModel.getBBUID() == user.uid) {
                mark = 'b';
            } else if (DZPKModel.getSBUID() == user.uid) {
                mark = 's';
            }
            if (mark.length != 0) {
                // console.log('庄家同步', mark)
                AssetsManager.loadSpriteFrame({
                    path: `res/sprite/chip/${mark}`,
                    sprite: this.bankerSprite,
                    bundle: Enums.bundleType.DZPK
                });
            } else {
                this.bankerSprite.spriteFrame = null;
            }
        } else {
            this.bankerSprite.spriteFrame = null;
            this.banker.active = false;
        }
        //操作时间显示
        if (gameStatus == ApiDzpk.gameStatus.USER_OPERATE &&
            playStatus == ApiRoom.playStatus.PLAYING &&
            DZPKModel.getCurOperateUID() == user.uid) {
            let time = DZPKModel.getTick();
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
        this.score.string = Utils.formatNumberWithDecimal(DZPKModel.getUserTotalScoreByUID(user.uid), 1);
        if (gameStatus == ApiDzpk.gameStatus.NONE ||
            playStatus == ApiRoom.playStatus.NONE ||
            playStatus == ApiRoom.playStatus.WATCH ||
            playStatus == ApiRoom.playStatus.READY) {
            this.deals.active = false;
            this.pourNode.active = false;
            this.opNode.active = false;
            this.opType.spriteFrame = null;
            this.holdsLay.active = false;
        } else {
            //手牌处理
            let userOperateStatus = DZPKModel.getUserOperateStatusByUID(user.uid);
            this.deals.active = gameStatus != ApiDzpk.gameStatus.RESULT &&
                user.uid != UserModel.getData('uid') &&
                userOperateStatus != ApiDzpk.operateType.CANCEL &&
                !UserModel.getData('isTest');
            if (this.deals.active) {
                for (let index = 0; index < this.deals.children.length; index++) {
                    let card = this.deals.children[index];
                    if (!card) continue;
                    card.stopAllActions();
                    card.scaleX = 1;
                    card.setPosition(card.dealEndPos);
                }
            }
            if ((gameStatus == ApiDzpk.gameStatus.DEAL ||
                gameStatus == ApiDzpk.gameStatus.TURN ||
                gameStatus == ApiDzpk.gameStatus.FLOP ||
                gameStatus == ApiDzpk.gameStatus.RIVER ||
                gameStatus == ApiDzpk.gameStatus.RESULT) &&
                user.uid != UserModel.getData('uid') &&
                playStatus != ApiRoom.playStatus.WATCH &&
                playStatus != ApiRoom.playStatus.NONE) {
                let cards = DZPKModel.getUserHandCardsByUID(user.uid);
                if (!!UserModel.getData('isTest')) {
                    this.holdsLay.active = true;
                    let cardSize = this.holds[0].node.getContentSize();
                    let cardLane = 10;
                    let handCardsPos = this._getCardsPos(0, 2, cardSize, 0.5, cardLane);
                    for (let index = 0; index < this.holds.length; index++) {
                        if (!cards[index]) {
                            this.holds[index].cardBack(false);
                            continue;
                        }
                        // console.log('获取到的手牌', cards[index]);
                        this.holds[index].node.stopAllActions();
                        this.holds[index].node.setPosition(handCardsPos[index]);
                        this.holds[index].cardSync(cards[index]);
                    }
                    this.cardTypeNode.active = true;
                    this.cardType.string = DZPKModel.getUserHandCardsTypeNameByUID(user.uid);
                } else {
                    this.cardTypeNode.active = false;
                    this.cardType.string = '';
                    this.holdsLay.active = false;
                }
            } else {
                this.holds.active = false;
                for (let index = 0; index < this.holds.length; index++) {
                    this.holds[index].cardBack(false);
                }
            }
            //操作类型处理
            if (userOperateStatus > 0 && gameStatus != ApiDzpk.gameStatus.NONE) {
                this.opNode.active = true;
                this.opNode.stopAllActions();
                this.opNode.scale = 1;
                AssetsManager.loadSpriteFrame({
                    bundle: Enums.bundleType.DZPK,
                    path: `res/sprite/op/op_${userOperateStatus}`,
                    sprite: this.opType
                });
            } else {
                this.opNode.active = false;
                this.opType.spriteFrame = null;
            }
            let userTurnPourScore = DZPKModel.getUserTurnPourScoreByUID(user.uid);
            if (parseInt(userTurnPourScore) > 0) {
                this.pourNode.active = true;
                this.pourNode.stopAllActions();
                this.pourScore.string = Utils.formatNumberWithDecimal(userTurnPourScore, 1);
                this.pourNode.setPosition(this._pourPos);
            } else {
                this.pourNode.active = false;
                this.pourScore.string = '';
            }
        }
    },

    cardTypeSync(uid) {
        let userPlayStatus = DZPKModel.getUserPlayStatusByUID(uid);
        if (userPlayStatus == ApiRoom.playStatus.NONE || userPlayStatus == ApiRoom.playStatus.WATCH) {
            this.cardTypeNode.active = false;
            this.cardType.string = '';
            this.holdsLay.active = false;
        } else {
            this.cardTypeNode.active = true;
            this.cardType.string = DZPKModel.getUserHandCardsTypeNameByUID(uid);
        }
    },

    opSync(user) {
        let opType = DZPKModel.getUserOperateStatusByUID(user.uid);
        this.opNode.stopAllActions();
        if (opType == ApiDzpk.operateType.QIAO ||
            opType == ApiDzpk.operateType.GEN ||
            opType == ApiDzpk.operateType.FEN) {
            this.opNode.scale = 1;
        } else {
            this.opNode.active = false;
            this.opNode.scale = 0;
        }
        for (let index = 0; index < this.deals.children.length; index++) {
            this.deals.children[index].uid = user.uid;
        }
        for (let index = 0; index < this.holds.length; index++) {
            this.holds[index].node.uid = user.uid;
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
        this.score.string = Utils.formatNumberWithDecimal(DZPKModel.getUserTotalScoreByUID(user.uid), 1);
        this.pourScore.string = Utils.formatNumberWithDecimal(DZPKModel.getUserTurnPourScoreByUID(user.uid), 1);
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

    blind(data, user) {
        this.timer.progress = 0;
        this._endTime = 0;
        this._duration = 0;
        this.lizi.angle = 0;
        this.timer.node.active = false;
        this.lizi.active = false;
        this.timeCount.string = '';
        if (user.uid == data.bigblindUid || user.uid == data.littleblindUid) {
            this.pourNode.active = true;
            let blindScore = user.uid == data.bigblindUid ? data.bigblindPourScore : data.littleblindPourScore;
            this.score.string = Utils.formatNumberWithDecimal(DZPKModel.getUserTotalScoreByUID(user.uid), 1);
            this.pourScore.string = Utils.formatNumberWithDecimal(blindScore, 1);
            this.pourNode.stopAllActions();
            this.pourNode.setPosition(this._pourStartPos);
            cc.tween(this.pourNode)
                .to(0.3, {
                    position: cc.v3(this._pourPos)
                }, {
                    easing: 'expoOut'
                })
                .start();
            this.banker.active = true;
            this.banker.stopAllActions();
            this.banker.setPosition(this._bankerPos);
            let mark = user.uid == DZPKModel.getBankerUID() ? 'd' : user.uid == data.bigblindUid ? 'b' : 's';
            AssetsManager.loadSpriteFrame({
                path: `res/sprite/chip/${mark}`,
                sprite: this.bankerSprite,
                bundle: Enums.bundleType.DZPK
            });
        } else {
            this.pourNode.active = false;
            this.pourNode.stopAllActions();
            this.banker.active = DZPKModel.getBankerUID() == user.uid;
            this.banker.stopAllActions();
            this.banker.setPosition(this._bankerPos);
        }
    },

    leave() {
        if (this.win) this.win.destroyAllChildren();
        this._user = null;
        this.empty.active = true;
        this.player.active = false;
        this.opNode.active = false;
        this.opType.spriteFrame = null;
        this.holdsLay.active = false;
        for (let index = 0; index < this.deals.children.length; index++) {
            this.deals.children[index].uid = null;
        }
        for (let index = 0; index < this.holds.length; index++) {
            this.holds[index].node.uid = null;
            this.holds[index].cardBack(false);
        }
        this.timer.node.active = false;
        this.timeCount.string = '';
        this.lizi.active = false;
        this.timer.progress = 0;
        this.banker.active = false;
        this.node.active = true;
    },

    test(uid) {
        this.holdsLay.active = true;
        let cardSize = this.holds[0].node.getContentSize();
        let cardLane = 10;
        let handCardsPos = this._getCardsPos(0, 2, cardSize, 0.5, cardLane);
        let cards = DZPKModel.getUserHandCardsByUID(uid);
        for (let index = 0; index < this.holds.length; index++) {
            if (!cards[index]) {
                this.holds[index].cardBack(false);
                continue;
            }
            this.holds[index].node.stopAllActions();
            this.holds[index].node.setPosition(handCardsPos[index]);
            this.holds[index].cardSync(cards[index]);
        }
        this.cardTypeNode.active = true;
        this.cardType.string = DZPKModel.getUserHandCardsTypeNameByUID(uid);
    },

    //轮结算
    turn(pool, user) {
        let gameStatus = DZPKModel.getGameStatus();
        let userOperateStatus = DZPKModel.getUserOperateStatusByUID(user.uid);
        this.timer.node.active = false;
        this.timeCount.string = '';
        this.lizi.active = false;
        this.timer.progress = 0;
        this.opNode.stopAllActions();
        this.opNode.scale = 1;
        this.score.string = Utils.formatNumberWithDecimal(DZPKModel.getUserTotalScoreByUID(user.uid), 1);
        if ((userOperateStatus == ApiDzpk.operateType.QIAO ||
            userOperateStatus == ApiDzpk.operateType.CANCEL) &&
            gameStatus != ApiDzpk.gameStatus.NONE) {
            this.opNode.active = true;
            this.opNode.setPosition(this._opPos);
            AssetsManager.loadSpriteFrame({
                bundle: Enums.bundleType.DZPK,
                path: `res/sprite/op/op_${userOperateStatus}`,
                sprite: this.opType
            });
        } else {
            this.opNode.active = false;
            this.opType.spriteFrame = null;
        }
        this.pourNode.stopAllActions();
        this.pourNode.setPosition(this._pourPos);
        let userPlayStatus = DZPKModel.getUserPlayStatusByUID(user.uid);
        if (userOperateStatus == ApiDzpk.operateType.NONE &&
            userPlayStatus == ApiRoom.playStatus.PLAYING) {
            this.pourNode.active = true;
            AssetsManager.playEffect({
                path: `res/audio/chips`,
                bundle: Enums.bundleType.DZPK
            });
            let startPos = CCUtil.postionConvert(this.pourBar, this.player);
            let endPos = CCUtil.postionConvert(pool, this.player);
            this.pourNode.active = false;
            for (let index = 0; index < 5; index++) {
                let chip = NodePoolManager.get('dzpkPourGoldPool');
                if (!chip) continue;
                this.player.addChild(chip);
                chip.stopAllActions();
                chip.opacity = 255;
                chip.setPosition(startPos);
                cc.tween(chip)
                    .delay(0.2 * index)
                    .to(0.5, {
                        position: cc.v3(endPos),
                        opacity: 0
                    }, {
                        easing: 'expoOut'
                    })
                    .call(() => {
                        NodePoolManager.put('dzpkPourGoldPool', chip)
                    })
                    .start();
            }
        } else {
            this.pourNode.active = false;
        }
    },

    hide() {
        this._index = -1;
        this.node.active = false;
        this.empty.active = false;
        this.player.active = false;
    },

    //分牌
    show(data) {

    },

    //玩家操作
    op() {
        this.opNode.stopAllActions();
        this.opNode.scale = 0;
        this.opNode.active = false;
        let time = DZPKModel.getTick();
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
        this.opNode.scale = 1;
        this.opNode.active = true;
        AssetsManager.loadSpriteFrame({
            bundle: Enums.bundleType.DZPK,
            path: `res/sprite/op/op_${data.operateType}`,
            sprite: this.opType
        });
        if (data.operateType == ApiDzpk.operateType.DA ||
            data.operateType == ApiDzpk.operateType.GEN ||
            data.operateType == ApiDzpk.operateType.QIAO ||
            data.operateType == ApiDzpk.operateType.XIU) {
            this.pourNode.stopAllActions();
            this.pourNode.active = true;
            this.pourNode.setPosition(this._pourPos);
            if (data.operateType == ApiDzpk.operateType.DA ||
                data.operateType == ApiDzpk.operateType.GEN ||
                data.operateType == ApiDzpk.operateType.QIAO) {
                this.score.string = Utils.formatNumberWithDecimal(DZPKModel.getUserTotalScoreByUID(data.uid), 1);
                this.pourScore.string = Utils.formatNumberWithDecimal(DZPKModel.getUserTurnPourScoreByUID(data.uid), 1);
                let chip = NodePoolManager.get('dzpkPourGoldPool');
                if (!!chip) {
                    chip.stopAllActions();
                    chip.opacity = 255;
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
                                path: `res/audio/chip`,
                                bundle: Enums.bundleType.DZPK
                            });
                        })
                        .call(() => {
                            NodePoolManager.put('dzpkPourGoldPool', chip)
                        })
                        .start();
                }
            }
        } else if (data.operateType == ApiDzpk.operateType.CANCEL) {
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
        if (data.operateType == ApiDzpk.operateType.CANCEL) {
            audio = 'fold';
        } else if (data.operateType == ApiDzpk.operateType.DA) {
            audio = 'da';
        } else if (data.operateType == ApiDzpk.operateType.GEN) {
            audio = 'gen';
        } else if (data.operateType == ApiDzpk.operateType.QIAO) {
            audio = 'qiao';
        } else if (data.operateType == ApiDzpk.operateType.XIU) {
            audio = 'xiu';
        }
        AssetsManager.playEffect({
            path: `res/audio/${audio}`,
            bundle: Enums.bundleType.DZPK
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

    button(isBanker, curBankerIndex, lastBankerIndex, lastBankerPos) {
        if (!!isBanker) {
            this.banker.active = true;
            this.banker.stopAllActions();
            // console.log('德州扑克-定庄推送', isBanker, lastBankerPos);
            if (lastBankerIndex == curBankerIndex) {
                this.banker.setPosition(this._bankerPos);
            } else {
                AssetsManager.loadSpriteFrame({
                    path: `res/sprite/chip/d`,
                    sprite: this.bankerSprite,
                    bundle: Enums.bundleType.DZPK
                });
                this.banker.setPosition(lastBankerPos);
                cc.tween(this.banker)
                    .to(0.3, {
                        position: cc.v3(this._bankerPos)
                    })
                    .start();
            }
        } else {
            this.bankerSprite.spriteFrame = null;
            this.banker.stopAllActions();
            this.banker.setPosition(this._bankerPos);
            this.banker.active = false;
        }
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
        if (DZPKModel.checkInSeat()) return;
        let data = {
            path: 'res/prefab/DZPKBuyDialog',
            bundle: Enums.bundleType.DZPK
        }
        AssetsManager.createDialog(data);
    },

    headClick() {
        if (!this._user) return;
        let user = this._user;
        try {
            let params = {
                fromChairID: DZPKModel.getMyChairID(),
                toChairID: user.chairID,
                canSendGift: DZPKModel.getMyChairID() < DZPKModel.getChairCount(),
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
        // console.log('买入', score);
        this.score.string = Utils.formatNumberWithDecimal(score, 1);
    },

    small(user) {
        this.deals.active = false;
        this.pourNode.stopAllActions();
        this.pourNode.active = false;
        this.score.string = Utils.formatNumberWithDecimal(DZPKModel.getUserTotalScoreByUID(user.uid), 1);
        let startPos = CCUtil.postionConvert(user.pool, this.player);
        for (let index = 0; index < 5; index++) {
            let gold = NodePoolManager.get('dzpkPourGoldPool');
            gold.stopAllActions();
            gold.opacity = 0;
            gold.parent = this.player;
            gold.setPosition(startPos);
            cc.tween(gold)
                .delay(user.delay)
                .call(() => {
                    if (index != 0) return;
                    AssetsManager.playEffect({
                        path: `res/audio/chips`,
                        bundle: Enums.bundleType.DZPK
                    });
                })
                .delay(index * 0.1)
                .to(0.35, {
                    position: cc.v3(0, 0),
                    opacity: 255
                })
                .call(() => {
                    NodePoolManager.put('dzpkPourGoldPool', gold);
                })
                .start();
        }
        AssetsManager.loadAsset({
            path: 'res/prefab/DZPKWinItem',
            aType: cc.Prefab,
            bundle: Enums.bundleType.DZPK
        }, (item) => {
            if (!cc.isValid(this.node)) return;
            let win = cc.instantiate(item);
            win.getComponent('DZPKWinItem') &&
                win.getComponent('DZPKWinItem').bind(user.score);
            this.player.addChild(win);
            win.setPosition(cc.v2(0, 0));
            cc.tween(win)
                .by(0.15, {
                    position: cc.v3(0, this.player.height / 2)
                })
                .by(0.1, {
                    position: cc.v3(0, -5)
                })
                .delay(0.25)
                .to(0.3, {
                    opacity: 0
                })
                .removeSelf()
                .start();
        });
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

    getBankerPos() {
        return this._bankerPos;
    },

});