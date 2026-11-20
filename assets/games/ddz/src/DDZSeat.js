const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const DDZModel = require('./DDZModel');
const ApiDdz = require('./ApiDdz');
const ConfigModel = require('../../../src/model/ConfigModel');
const UserModel = require('../../../src/model/UserModel');
const Enums = require('../../../src/const/Enums');
const DDZGameLogic = require('./DDZGameLogic');
const NativeUtil = require('../../../src/utils/NativeUtil');
const NodePoolManager = require('../../../src/utils/NodePoolManager');
const DDZUtils = require('./DDZUtil');
cc.Class({
    extends: cc.Component,

    properties: {
        head: cc.Sprite,
        offline: cc.Node,
        host: cc.Node,
        nick: cc.Label,
        score: cc.Label, //玩家分数
        roundScoreNode: cc.Node, //局结算分
        roundScore: cc.Label, //局结算分
        banker: cc.Node,
        option: cc.Sprite,
        cardBackSprite: cc.Sprite,
        cardCount: cc.Label,
        clock: cc.Node, //计时器节点
        outs: cc.Node, //出牌节点
        hands: cc.Node, //手牌节点
        emotion: cc.Node, //表情
        text: cc.Node,
        textLbl: cc.Label,

        _seat: null,
        _user: null,
        _handsLaneCount: 20,
        _outsLaneCount: 10,
        _holds: [],
        _outs: [],
        _offSetXRate: 0,
        _offSetYRate: 0,
        _bankerPos: cc.v2(),
        _effects: [],
        _isReview: false,
    },

    /**初始化资源 */
    initRes(seat) {
        if (this._inited) {
            return
        }
        this._seat = seat;
        this._inited = true;
        this._bankerPos = this.banker.getPosition();
        this.leave();
    },

    leave() {
        this._user = null;
        this.nick.string = '';
        this.textLbl.string = '';
        this.node.active = false;
        this.text.active = false;
        this.head.spriteFrame = null;
        if (this.emotion) this.emotion.destroyAllChildren();
        this.setTotalScore("0");
        this.setUserScore()
        this.reset();
    },

    reset() {
        this.showClock(false);
        this.showOption(false);
        this.showBanker(false);
        this.setCardCount(false);
    },

    sit(user) {
        if (!user) return;
        this._user = user;
        this.node.active = true;
        let userInfo = user.userInfo;
        if (!!userInfo) {
            this.nick.string = CCUtil.stringClamp(user.userInfo.nickname, 7, '..');
            AssetsManager.loadSpriteFrame({
                path: user.userInfo.avatar,
                sprite: this.head
            });
        }
        this.offline.active = user.userStatus == ApiRoom.userStatusEnum.OFFLINE;
        this.setTotalScore(DDZModel.getTotalWinScoreByUID(user.uid));
        this.setUserScore(user.userInfo.score)
    },

    showClock(isShow) {
        if (this.clock) this.clock.destroyAllChildren();
        isShow && AssetsManager.loadAsset({
            path: 'res/prefab/DDZClock',
            bundle: Enums.bundleType.DDZ,
            aType: cc.Prefab
        }, (item) => {
            if (!item || !cc.isValid(this.clock)) return;
            this.clock.destroyAllChildren();
            const clock = cc.instantiate(item);
            this.clock.addChild(clock);
        });
    },

    showOption(name, ishide = true) {
        if (!this.option) return;
        this.option.spriteFrame = null;
        this.option.node.active = true;
        this.option.node.stopAllActions();
        if (!name) return;
        this.showClock(false);
        AssetsManager.loadSpriteFrame({
            path: 'res/sprite/op/' + name,
            bundle: Enums.bundleType.DDZ,
            sprite: this.option
        });
        this.option.node.scale = 0;
        cc.tween(this.option.node)
            .to(0.15, {
                scale: 1
            })
            .delay(1)
            .call(() => {
                if (ishide) {
                    this.showOption();
                }
            })
            .start();
    },

    showBanker(isShow, isAinm) {
        if (!this.banker) return
        this.banker.stopAllActions();
        this.banker.destroyAllChildren();
        if (isShow) {
            AssetsManager.loadAsset({
                path: 'res/prefab/DDZEffectLord',
                bundle: Enums.bundleType.DDZ,
                aType: cc.Prefab,
            }, (item) => {
                this.banker.destroyAllChildren();
                if (!item || !cc.isValid(this.banker)) return;
                const banker = cc.instantiate(item);
                banker.setPosition(cc.v2(0, 0));
                this.banker.addChild(banker);
            });
            if (!!isAinm) {
                let startPos = CCUtil.postionConvert(this._seat.deal, this.banker.parent);
                this.banker.setPosition(startPos);
                this.banker.scale = 0;
                cc.tween(this.banker)
                    .to(0.3, {
                        scale: 1.1
                    })
                    .delay(0.5)
                    .to(0.1, {
                        scale: 1
                    })
                    .to(0.6, {
                        position: cc.v3(this._bankerPos)
                    })
                    .start();
            }
        }
    },

    /**设置牌数量 */
    setCardCount(isShow, num = 0) {
        isShow = isShow && DDZModel.isShowCardCount(num);
        if (this.cardCount) this.cardCount.string = `${num}`;
        if (this.cardBackSprite) this.cardBackSprite.node.active = isShow;
    },

    /**设置分数 */
    setUserScore(s) {
        if (DDZModel.scoreState() == 1) return
        if (this.score) this.score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (DDZModel.scoreState() == 1) {
            if (this.roundScoreNode) this.roundScoreNode.active = false;
            if (this.score) {
                this.score.string = num;
                this.score.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
            };
            return
        }
        if (!!this.roundScore && !!cc.isValid(this.roundScore)) {
            this.roundScore.string = num;
            this.roundScore.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
        }
        if (this.roundScoreNode) this.roundScoreNode.active = DDZModel.scoreState() == 2;
    },

    small(user) {
        this.setCardCount(false);
        this.setUserScore(DDZModel.getUserTotalScoreByUID(user.uid))
    },

    off() {
        this.offline.active = true;
    },

    review(user) {
        this._user = user;
        this.node.active = true;
        this.setUserScore(user.score)
        if (this.roundScoreNode) this.roundScoreNode.active = false;
        this.nick.string = CCUtil.stringClamp(user.nickname, 7, '..');
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.head
        });
    },

    update(dt) {
        if (!!this.text && !!this.text.active) {
            this.text.width = this.textLbl.node.width + 35;
            this.text.height = this.textLbl.node.height + 10;
        }
    },
    onClick(event) {
        if (!this._user) return
        if (CCUtil.clickInterval(event.target, 0.5)) return;
        let user = this._user;
        let showHeadDetail = () => {
            try {
                let params = {
                    canSendGift: true,
                    fromChairID: DDZModel.getMyChairID(),
                    toChairID: user.chairID,
                    avatar: user.userInfo.avatar,
                    id: user.uid,
                    ip: user.userInfo.lastLoginIP,
                    location: user.userInfo.location,
                    gold: DDZModel.getUserTotalScoreByUID(user.uid),
                    name: user.userInfo.nickname,
                };
                AssetsManager.headDialog(params);
            } catch (e) { }
        }
        if (DDZModel.getUserTest() && !!user && !!user.userInfo.uid) {
            AssetsManager.createDialog({
                path: "res/prefab/DDZSelectTest",
                bundle: Enums.bundleType.DDZ,
                callback: showHeadDetail,
                user: user,
            })
            return
        } else {
            showHeadDetail();
        }
    },

    chat(data) {
        if (!this._user) return;
        data.user = this._user;
        CCUtil.gameChat(data, this.textLbl.node, this.head.node, this.node)
    },

    cardBackSync(url) {
        if (!this.cardBackSprite) return;
        AssetsManager.loadSpriteFrame({
            sprite: this.cardBackSprite,
            path: url,
        });
    },
});