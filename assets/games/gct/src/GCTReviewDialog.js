const ApiGct = require('./ApiGct');
const ApiRoom = require('../../../src/api/ApiRoom');
const gameLogic = require('./GCTGameLogic');
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
        shunziAnimationPrefab: cc.Prefab,
        zhandanAnimationPrefab: cc.Prefab,
        chuntianPrefab: cc.Prefab,
        animationNode: cc.Node,
        /**房间回放数据 */
        _gameReviewData: null,
        /**局数 */
        _bureau: cc.Label,
        /**结算界面节点 */
        _result: cc.Node,
        /**操作按钮组 */
        _optButtons: cc.Node,
        /**用户组 */
        _headNode: [],
        /**手牌数组 */
        _handCard: [],
        /**出的牌 */
        _outCardNode: cc.Node,
        /**自己的座位 */
        _myChairId: 0,
        /**手牌节点 */
        _handCardNode: [],
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
        _isShowRes: false
    },

    onLoad() {
        this._gameReviewData = this.node.nodeParams.list
        if (!this._gameReviewData[0].outCardDataArr) {
            AssetsManager.tipDialog("本条数据暂不支持视频回放！")
            this.node.destroy()
            return
        }
        /**找到自己的座位号 */
        let idArr = this._gameReviewData[0].idArr
        for (let i = 0; i < idArr.length; i++) {
            const id = idArr[i];
            if (id === UserModel.getData("uid")) {
                this._myChairId = i
                // console.log("自己的座位号==", i)
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
        this._outCardNode = cc.find("outCard", this.node)
        this._outCardNode.removeAllChildren()

        //当局最大玩家数
        this._maxPlayerNum = this._gameReviewData[this._nowRound].idArr.length
        if (this._maxPlayerNum > 3) {
            this._maxPlayerNum = 5
        }
        //根据人数获取头像 和 手牌容器 
        this._headNode = []
        this._handCardNode = []
        let two = [0, 2]
        let three = [0, 1, 4]
        for (let i = 0; i < 5; i++) {
            let head = cc.find("head" + i, this.node)
            let hc = cc.find("handCard" + i, this.node)
            hc.removeAllChildren()
            head.active = false
            if (this._maxPlayerNum === 2) {
                if (two.includes(i)) {
                    this._headNode.push(head)
                    this._handCardNode.push(hc)
                }
            } else if (this._maxPlayerNum === 3) {
                if (three.includes(i)) {
                    this._headNode.push(head)
                    this._handCardNode.push(hc)
                }
            } else if (i < this._maxPlayerNum) {
                this._headNode.push(head)
                this._handCardNode.push(hc)
            }
        }

        this.showButtonsAni(0)
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
        //清空数组
        this._handCard.length = 0
        /**获取开局的手牌 */
        let allHandCards = this._gameReviewData[this._nowRound].allHandCards
        for (let cid = 0; cid < allHandCards.length; cid++) {
            const handarr = allHandCards[cid];
            this._handCard[cid] = []
            handarr.forEach(cardList => {
                if (cardList && cardList.length > 0) {
                    cardList.forEach(card => {
                        this._handCard[cid].push(card)
                    });
                }
            });
        }
        this._outCardNode.removeAllChildren()
        this._bureau.string = `局数：${this._nowRound + 1}/${this._maxRound}`
        for (let i = 0; i < this._handCard.length; i++) {
            let idx = this.getUserChairIndex(i)
            const h = this._handCard[i];
            if (h && h.length > 0) {
                this.showHandCard(idx, h)
            }
        }
        this.initHeads()
        this._timeCheck = 0
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
        let data = this._gameReviewData[this._nowRound];
        if (this._actIdx > data.outCardDataArr.length) {
            this._actIdx = data.outCardDataArr.length
        }
        if (curIndex != this._actIdx) {
            this.setIndex(this._actIdx);
        }
    },

    /**关闭结算界面 */
    destroyReult() {
        this._isShowRes = false
        AssetsManager.clearDialog(['GCTResultDialog']);
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
        let data = this._gameReviewData[this._nowRound]
        let bankerChairID = this.getUserChairIndex(data.guChunInfo.bankerChairID)
        for (let i = 0; i < data.idArr.length; i++) {
            let chairId = this.getUserChairIndex(i)
            let headNode = this._headNode[chairId]
            headNode.active = true
            /**头像 */
            let headUrl = data.headArr[i]
            AssetsManager.loadSpriteFrame({
                path: headUrl,
                sprite: cc.find('head', headNode).getComponent(cc.Sprite)
            });
            /**名字 */
            cc.find("name", headNode).getComponent(cc.Label).string = data.nicknameArr[i]
            /**庄家 */
            cc.find("banker", headNode).active = chairId === bankerChairID
            /**鼓和拉的图标 */
            let gu = cc.find("gu", headNode)
            let la = cc.find("la", headNode)
            gu.active = false
            la.active = false
            if ((data.guChunInfo.guChunStatus === ApiGct.guChunStatus.GU_CHUN ||
                data.guChunInfo.guChunStatus === ApiGct.guChunStatus.PULL_BACK) &&
                data.guChunInfo.guChunChairID >= 0) {
                gu.active = data.guChunInfo.guChunChairID === i
                if (data.guChunInfo.guChunStatus === ApiGct.guChunStatus.PULL_BACK) {
                    la.active = data.guChunInfo.bankerChairID === i
                }
            }
            cc.find("buchu", headNode).active = false
            cc.find("light", headNode).active = false
        }
    },

    /**显示手牌 */
    showHandCard(idx, handarr) {
        // console.log("刷新牌", idx, handarr)
        let cardNode = this._handCardNode[idx]
        /**刷新显示 */
        cardNode.removeAllChildren()
        if (handarr.length > 0) {
            handarr = gameLogic.sortCardList(handarr)
            for (let i = 0; i < handarr.length; i++) {
                const card = handarr[i];
                let node = this.getNewCardNode(card)
                node.parent = cardNode
            }
        }
    },

    /**展示出的牌 */
    showOutCard(outCardData) {
        /**清楚所有的牌 */
        this._outCardNode.removeAllChildren()
        if (outCardData) {
            /**展示牌 */
            if (outCardData.cards) {
                if (outCardData.cards.length > 0) {
                    for (let i = 0; i < outCardData.cards.length; i++) {
                        const card = outCardData.cards[i];
                        let node = this.getNewCardNode(card)
                        node.parent = this._outCardNode
                    }
                    /**展示牌型和声音 */
                    this.playOutCardSound(true, outCardData.cards, outCardData.Type)
                }
            }
            this.showHeadBuchu(-1)
            if (outCardData.Type !== 0) {
                this.playOutCardAnimation(outCardData.cards, outCardData.Type)
            } else {
                let audio = "res/audio/man/man_buyao1";
                AssetsManager.playEffect({
                    path: audio,
                    bundle: Enums.bundleType.GCT
                });
                this.showHeadBuchu(this.getUserChairIndex(outCardData.chairID))
            }
            // 播放动画
            this._outCardNode.scale = 0.5 * 0.9;
            let action = cc.scaleTo(0.15, 0.5);
            action.easing(cc.easeBackOut());
            this._outCardNode.runAction(action)
        }
    },

    getNewCardNode(cardData) {
        let node = AssetsManager.createSpriteNode({
            path: 'sprite/cards/' + cardData,
            width: 160,
            height: 220
        });
        // node.name = cardData + ""
        return node
    },

    playOutCardSound(isFirst, cardDataArr, cardType) {
        // console.log("播放声音", cardDataArr, cardType)
        let audio = "";
        if (cardType === ApiGct.cardType.SINGLE) {
            let value = gameLogic.getCardValue(cardDataArr[0]);
            audio = "res/audio/man/man_" + value;
        } else if (cardType === ApiGct.cardType.DOUBLE) {
            let value = gameLogic.getCardValue(cardDataArr[0]);
            audio = "res/audio/man/man_dui" + value;
        } else if (cardType === ApiGct.cardType.THREE_LINE) {
            let value = gameLogic.getCardValue(cardDataArr[0]);
            audio = "res/audio/man/man_tuple" + value;
        } else if (cardType === ApiGct.cardType.SINGLE_LINE) {
            if (isFirst) {
                audio = "res/audio/man/man_shunzi";
            } else {
                audio = "res/audio/man/man_dani" + Utils.getRandomNum(1, 3);
            }
        } else if (cardType === ApiGct.cardType.DOUBLE_LINE) {
            if (isFirst) {
                audio = "res/audio/man/man_liandui";
            } else {
                audio = "res/audio/man/man_dani" + Utils.getRandomNum(1, 3);
            }
        } else if (cardType === ApiGct.cardType.THREE_LINE) {
            if (isFirst) {
                audio = "res/audio/man/man_feiji";
            } else {
                audio = "res/audio/man/man_dani" + Utils.getRandomNum(1, 3);
            }
        } else if (cardType === ApiGct.cardType.THREE_LINE_TAKE_ONE) {
            if (isFirst) {
                if (cardDataArr.length === 4) {
                    audio = "res/audio/man/man_sandaiyi";
                } else {
                    audio = "res/audio/man/man_feiji";
                }
            } else {
                audio = "res/audio/man/man_dani" + Utils.getRandomNum(1, 3);
            }
        } else if (cardType === ApiGct.cardType.THREE_LINE_TAKE_TWO) {
            if (isFirst) {
                if (cardDataArr.length === 5) {
                    audio = "res/audio/man/man_sandaiyidui";
                } else {
                    audio = "res/audio/man/man_feiji";
                }
            } else {
                audio = "res/audio/man/man_dani" + Utils.getRandomNum(1, 3);
            }
        } else if (cardType === ApiGct.cardType.BOMB_CARD) {
            audio = "res/audio/man/man_zhadan";
        } else if (cardType === ApiGct.cardType.FOUR_LINE_TAKE_TWO) {
            audio = "res/audio/man/man_sidaier";
        } else if (cardType === ApiGct.cardType.FOUR_LINE_TAKE_THREE) {
            audio = "res/audio/man/man_sidaisan";
        }

        AssetsManager.playEffect({
            path: audio,
            bundle: Enums.bundleType.GCT
        });
    },

    playOutCardAnimation(cardDataArr, cardType) {
        // console.log("播放了动画==", cardDataArr, cardType)
        if (cardType === ApiGct.cardType.BOMB_CARD) {
            this.showZhadanAnimation();
        } else if (cardType === ApiGct.cardType.THREE_LINE_TAKE_ONE) {
            if (cardDataArr.length > 4) {
                this.showFeijiAnimation();
            }
        } else if (cardType === ApiGct.cardType.THREE_LINE_TAKE_TWO) {
            if (cardDataArr.length > 5) {
                this.showFeijiAnimation();
            }
        } else if (cardType === ApiGct.cardType.SINGLE_LINE) {
            this.showShunziAnimation();
        } else if (cardType === ApiGct.cardType.DOUBLE_LINE) {
            this.showLianduiAnimation();
        }
    },

    // 顺子
    showShunziAnimation() {
        let node = cc.instantiate(this.shunziAnimationPrefab);
        node.parent = this.animationNode;
        let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
        ctrl.startAnimation(false, 1, function () {
            ctrl.node.removeFromParent();
        });

        let spriteNode = AssetsManager.createSpriteNode({
            path: 'res/sprite/shunzi/shunzi',
            bundle: Enums.bundleType.GCT
        });
        spriteNode.parent = node;
        spriteNode.x = -200;
        let moveAction = cc.moveTo(0.3, cc.v2(0, 0));
        moveAction.easing(cc.easeOut(3));
        spriteNode.runAction(cc.sequence([moveAction, cc.fadeOut(0.4), cc.removeSelf()]));
    },

    // 连对
    showLianduiAnimation() {
        let node = cc.instantiate(this.shunziAnimationPrefab);
        node.parent = this.animationNode;
        let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
        ctrl.startAnimation(false, 1, function () {
            ctrl.node.removeFromParent();
        });

        let spriteNode = AssetsManager.createSpriteNode({
            path: 'res/sprite/shunzi/liandui',
            bundle: Enums.bundleType.GCT
        });
        spriteNode.parent = node;
        spriteNode.x = -200;
        let moveAction = cc.moveTo(0.3, cc.v2(0, 0));
        moveAction.easing(cc.easeOut(3));
        spriteNode.runAction(cc.sequence([moveAction, cc.fadeOut(0.4), cc.removeSelf()]));
    },

    // 飞机
    showFeijiAnimation() {
        let feijiSpriteNode = AssetsManager.createSpriteNode({
            path: 'res/sprite/feiji/1q',
            bundle: Enums.bundleType.GCT
        });
        feijiSpriteNode.parent = this.animationNode;
        feijiSpriteNode.x = -800;
        feijiSpriteNode.y = 0;
        let moveAction1 = cc.moveTo(0.6, cc.v2(0, 0));
        moveAction1.easing(cc.easeOut(2));
        let moveAction2 = cc.moveTo(0.6, cc.v2(800, 0));
        moveAction2.easing(cc.easeIn(2));
        feijiSpriteNode.runAction(cc.sequence([moveAction1, moveAction2, cc.removeSelf()]));

        this.scheduleOnce(function () {
            let node = cc.instantiate(this.shunziAnimationPrefab);
            node.parent = this.animationNode;
            node.x = 0;
            node.y = -100;
            let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
            ctrl.startAnimation(false, 1, function () {
                ctrl.node.removeFromParent();
            });

            let spriteNode = AssetsManager.createSpriteNode({
                path: 'res/sprite/feiji/1w',
                bundle: Enums.bundleType.GCT
            });
            spriteNode.parent = node;
            spriteNode.x = -200;
            spriteNode.y = 0;
            let moveAction = cc.moveTo(0.3, cc.v2(0, 0));
            moveAction.easing(cc.easeOut(2));
            spriteNode.runAction(cc.sequence([moveAction, cc.fadeOut(0.4), cc.removeSelf()]));
        }.bind(this), 1);
    },

    // 炸弹
    showZhadanAnimation() {
        let spriteNode = AssetsManager.createSpriteNode({
            path: 'res/sprite/zhadan/o',
            bundle: Enums.bundleType.GCT
        });
        spriteNode.x = -200;
        spriteNode.parent = this.animationNode;
        spriteNode.runAction(cc.sequence([cc.jumpTo(0.3, cc.v2(0, 0), 100, 1), cc.callFunc(function () {
            let node = cc.instantiate(this.zhandanAnimationPrefab);
            node.parent = this.animationNode;
            let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
            ctrl.startAnimation(false, 1, function () {
                ctrl.node.removeFromParent();
            });
            spriteNode.removeFromParent();

            let zhandanNode = AssetsManager.createSpriteNode({
                path: 'res/sprite/zhadan/1',
                bundle: Enums.bundleType.GCT
            });
            zhandanNode.scale = 0.6;
            let action1 = cc.scaleTo(0.5, 1);
            action1.easing(cc.easeBackOut());
            zhandanNode.runAction(cc.sequence([action1, cc.delayTime(0.2), cc.fadeOut(0.3), cc.removeSelf()]));
            zhandanNode.parent = this.animationNode;
        }.bind(this))]));
    },

    /**显示座位的亮灯 */
    showHeadLight(idx) {
        for (let i = 0; i < this._headNode.length; i++) {
            const h = this._headNode[i];
            cc.find("light", h).active = false
        }
        if (idx >= 0) {
            let h1 = this._headNode[idx]
            cc.find("light", h1).active = true
        }
    },

    /**展示不出 */
    showHeadBuchu(idx) {
        for (let i = 0; i < this._headNode.length; i++) {
            const h = this._headNode[i];
            cc.find("buchu", h).active = false
        }
        if (idx >= 0) {
            let h1 = this._headNode[idx]
            cc.find("buchu", h1).active = true
        }
    },

    setIndex(index) {
        let data = this._gameReviewData[this._nowRound]
        let outCardData = data.outCardDataArr[index]
        if (!outCardData) {
            let dt = 1
            if (data.hasChuntian) {
                /* 有春天 */
                let node = cc.instantiate(this.chuntianPrefab);
                node.parent = this.node;
                let animation = node.getComponent(cc.Animation);
                animation.play('chuntian');
                node.runAction(cc.sequence(
                    cc.delayTime(2),
                    cc.removeSelf()
                ));
                dt += 2
            }
            /**展示结算界面 */
            let nodeParams = { // 创建结束界面
                bundle: Enums.bundleType.GCT,
                resultData: data,
                myChairID: this._myChairId,
                isBureauFull: false,
                isDismissing: () => {
                    return true
                },
                isReview: true,
                mainDialog: this,
                path: 'res/prefab/GCTResultDialog',
                parent: this._result,
            };
            this.scheduleOnce(() => {
                this._isShowRes = true
                AssetsManager.createDialog(nodeParams);
            }, dt)
        } else {
            let idx = this.getUserChairIndex(outCardData.chairID)
            let handarr = this._handCard[outCardData.chairID].slice()
            // console.log("手牌1==", handarr)
            /**把之前出过得牌删除掉 */
            for (let i = 0; i <= index; i++) {
                let oc = data.outCardDataArr[i]
                if (oc && oc.chairID === outCardData.chairID) {
                    let cards = oc.cards
                    if (cards) {
                        cards.forEach(c => {
                            let idx = handarr.indexOf(c)
                            if (idx !== -1) {
                                handarr.splice(idx, 1)
                            }
                        });
                    }
                }
            }
            // console.log("手牌2==", handarr)

            this.showHeadLight(idx)
            this.showOutCard(outCardData)
            if (outCardData.cards) {
                this.showHandCard(idx, handarr)
            }
        }
    },
});