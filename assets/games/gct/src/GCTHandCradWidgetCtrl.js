const gameLogic = require('./GCTGameLogic');
const ApiGct = require('./ApiGct');
const analyseOutCard = require('./GCTAnalyseOutCard');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad() {
        this.isTouchListening = false;
    },

    initWidget() {
        this.cardNodeArr = [];
        this.selectedCardArr = [];
        this.searchOutCardResultArr = [];
        this.ignoreCardValueArr = [];
    },

    resetWidget() {
        this.node.stopAllActions();
        this.unscheduleAllCallbacks();
        this.node.removeAllChildren();
        this.removeTouchCardEvent();
        this.cardNodeArr = [];
        this.selectedCardArr = [];
    },

    onSendCard(cardDataArr, isTween, cb) {
        for (let i = 0; i < cardDataArr.length; ++i) {
            this.addCardNode(cardDataArr[i], i, isTween, cb);
        }
    },

    startGame() {
        this.addTouchCardEvent();
    },

    addCardNode(cardData, i, isTween, cb) {
        let node = AssetsManager.createSpriteNode({
            path: 'sprite/cards/' + cardData,
            width: 180,
            height: 260
        });
        node.cardData = cardData;
        node.cardUp = false;
        node.zIndex = i + 1;
        this.cardNodeArr.push(node);
        if (isTween) {
            this.scheduleOnce(() => {
                node.parent = this.node;
                cb && cb(i + 1);
            }, (i + 1) * 0.1);
        } else {
            node.parent = this.node;
            cb && cb(i + 1);
        }
    },

    addTouchCardEvent() {
        if (!this.isTouchListening) {
            this.isTouchListening = true;
            this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchCardStart, this);
            this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchCardEnd, this);
            this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCardEnd, this);
        }
    },

    removeTouchCardEvent() {
        if (this.isTouchListening) {
            this.isTouchListening = false;
            this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchCardStart, this);
            this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchCardEnd, this);
            this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCardEnd, this);
        }
    },

    onTouchCard(node) {
        if (!node) return;
        node.cardUp = !node.cardUp;
        node.y = !node.cardUp ? 0 : 30;
        if (node.cardUp) {
            this.selectedCardArr.push(node.cardData);
        } else {
            let index = this.selectedCardArr.indexOf(node.cardData);
            if (index >= 0) {
                this.selectedCardArr.splice(index, 1);
            }
        }
    },

    onTouchCardStart(event) {
        let touchStartPos = this.node.convertTouchToNodeSpaceAR(event.touch);
        this.touchStartCardIndex = this.getTouchPosIndex(touchStartPos);
    },

    onTouchMove(event) {
        let curPos = this.node.convertTouchToNodeSpaceAR(event.touch);
        let index = this.getTouchPosIndex(curPos);
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            let node = this.cardNodeArr[i];
            let preColor = node.color;
            node.color = ((i >= this.touchStartCardIndex && i <= index) || (i >= index && i <= this.touchStartCardIndex)) ? cc.Color.GRAY : cc.Color.WHITE;
            let curColor = node.color;
            if (preColor.r != curColor.r) {
                AssetsManager.playEffect({
                    path: "res/audio/main/sound_select_card",
                    bundle: Enums.bundleType.GCT
                });
            }
        }
    },

    onTouchCardEnd(event) {
        let curPos = this.node.convertTouchToNodeSpaceAR(event.touch);
        let index = this.getTouchPosIndex(curPos);
        let count = 0;
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            let node = this.cardNodeArr[i];
            node.color = cc.Color.WHITE;
            if ((i >= this.touchStartCardIndex && i <= index) || (i >= index && i <= this.touchStartCardIndex)) {
                this.onTouchCard(node);
                count++;
            }
        }
        AssetsManager.playEffect({
            path: "res/audio/main/sound_select_card",
            bundle: Enums.bundleType.GCT
        });
        if (this.selectedCardArr.length <= 3 || count <= 3) return;
        let gctMainLogic = this.node.parent.getComponent('GCTMainDialog');
        let gameRule = gctMainLogic.getGameRule();
        if (gameLogic.getCardType(this.selectedCardArr, gameRule) !== ApiGct.cardType.ERROR) return;

        if (!!gctMainLogic.turnCardDataArr && gctMainLogic.turnCardDataArr.length > 0) {
            this.searchOutCard(gctMainLogic.turnCardDataArr, true)
            return
        }

        // 自动筛选
        let cardTypeResultArr = [];
        analyseOutCard.analyseOutCardTypeActive(this.selectedCardArr, cardTypeResultArr);
        // console.log("自动筛选结果==", cardTypeResultArr)
        if (cardTypeResultArr[ApiGct.cardType.SINGLE_LINE].cardTypeCount > 0) {
            let cardTypeResult = cardTypeResultArr[ApiGct.cardType.SINGLE_LINE];
            let maxCardCountIndex = 0;
            for (let i = 1; i < cardTypeResult.cardTypeCount; ++i) {
                if (cardTypeResult.eachHandCardCount[i] > cardTypeResult.eachHandCardCount[maxCardCountIndex]) {
                    maxCardCountIndex = i;
                }
            }
            let cardDataArr = cardTypeResult.cardDataArr[maxCardCountIndex];
            let selectedCardArr = this.selectedCardArr.slice();
            gameLogic.removeCard(cardDataArr, selectedCardArr);
            this.setSelectedCard(selectedCardArr);
        } else if (cardTypeResultArr[ApiGct.cardType.DOUBLE_LINE].cardTypeCount > 0) {
            let cardTypeResult = cardTypeResultArr[ApiGct.cardType.DOUBLE_LINE];
            let maxCardCountIndex = 0;
            for (let i = 1; i < cardTypeResult.cardTypeCount; ++i) {
                if (cardTypeResult.eachHandCardCount[i] > cardTypeResult.eachHandCardCount[maxCardCountIndex]) {
                    maxCardCountIndex = i;
                }
            }
            let cardDataArr = cardTypeResult.cardDataArr[maxCardCountIndex];
            let selectedCardArr = this.selectedCardArr.slice();
            gameLogic.removeCard(cardDataArr, selectedCardArr);
            this.setSelectedCard(selectedCardArr);
        } else if (cardTypeResultArr[ApiGct.cardType.THREE_LINE_TAKE_TWO].cardTypeCount > 0) {
            let cardTypeResult = cardTypeResultArr[ApiGct.cardType.THREE_LINE_TAKE_TWO];
            let maxCardCountIndex = 0;
            for (let i = 1; i < cardTypeResult.cardTypeCount; ++i) {
                if (cardTypeResult.eachHandCardCount[i] > cardTypeResult.eachHandCardCount[maxCardCountIndex]) {
                    maxCardCountIndex = i;
                }
            }
            let cardDataArr = cardTypeResult.cardDataArr[maxCardCountIndex];
            let selectedCardArr = this.selectedCardArr.slice();
            gameLogic.removeCard(cardDataArr, selectedCardArr);
            this.setSelectedCard(selectedCardArr);
        } else if (cardTypeResultArr[ApiGct.cardType.BOMB_CARD].cardTypeCount > 0) {
            let cardDataArr = cardTypeResultArr[ApiGct.cardType.BOMB_CARD].cardDataArr[0];
            let selectedCardArr = this.selectedCardArr.slice();
            gameLogic.removeCard(cardDataArr, selectedCardArr);
            this.setSelectedCard(selectedCardArr);
        } else if (cardTypeResultArr[ApiGct.cardType.SINGLE].cardTypeCount > 0) {
            let cardDataArr = cardTypeResultArr[ApiGct.cardType.SINGLE].cardDataArr[0];
            let selectedCardArr = this.selectedCardArr.slice();
            gameLogic.removeCard(cardDataArr, selectedCardArr);
            this.setSelectedCard(selectedCardArr);
        } else if (cardTypeResultArr[ApiGct.cardType.DOUBLE].cardTypeCount > 0) {
            let cardDataArr = cardTypeResultArr[ApiGct.cardType.DOUBLE].cardDataArr[0];
            let selectedCardArr = this.selectedCardArr.slice();
            gameLogic.removeCard(cardDataArr, selectedCardArr);
            this.setSelectedCard(selectedCardArr);
        }
    },

    getTouchPosIndex(pos) {
        if (this.cardNodeArr.length > 0) {
            let lastNode = this.cardNodeArr[this.cardNodeArr.length - 1];
            let layOut = this.node.getComponent(cc.Layout)
            if (pos.x >= lastNode.x - lastNode.width / 2) {
                return this.cardNodeArr.length - 1;
            } else {
                let len = lastNode.x - lastNode.width / 2 - pos.x;
                let offset = lastNode.width + layOut.spacingX;
                let index = this.cardNodeArr.length - Math.floor(len / offset) - 2;
                if (index < 0) index = 0;
                return index;
            }
        }
    },

    getSelectedCard() {
        return this.selectedCardArr;
    },

    getAllCard() {
        let cardDataArr = [];
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            cardDataArr.push(this.cardNodeArr[i].cardData);
        }
        return cardDataArr;
    },

    setSelectedCard(cardDataArr) {
        for (let i = 0; i < cardDataArr.length; ++i) {
            let cardData = cardDataArr[i];
            for (let j = 0; j < this.cardNodeArr.length; ++j) {
                if (this.cardNodeArr[j].cardData === cardData) {
                    this.onTouchCard(this.cardNodeArr[j]);
                    break;
                }
            }
        }
    },

    resetCardPos() {
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            let node = this.cardNodeArr[i];
            if (node.cardUp) {
                node.cardUp = false;
                node.y = 0;
            }
        }
        this.selectedCardArr = [];
    },

    addCard(cardDataArr, cb) {
        function nodeMove(node) {
            node.runAction(cc.sequence([cc.delayTime(1), cc.callFunc(() => {
                node.cardUp = false;
                node.y = 0;
                cb && cb();
            })]));
        }
        for (let i = 0; i < cardDataArr.length; ++i) {
            let cardData = cardDataArr[i];
            let node = AssetsManager.createSpriteNode({
                path: 'sprite/cards/' + cardData,
                width: 180,
                height: 260
            });
            node.cardData = cardData;
            node.cardUp = true;
            node.y = 30;
            node.parent = this.node;
            let cardValue = gameLogic.getCardLogicValue(cardData);
            for (let j = 0; j < this.cardNodeArr.length; ++j) {
                let tempCardData = this.cardNodeArr[j].cardData;
                let tempCardValue = gameLogic.getCardLogicValue(tempCardData);
                if (tempCardValue < cardValue || (tempCardValue === cardValue && tempCardData < cardData)) {
                    this.cardNodeArr.splice(j, 0, node);
                    break;
                }
                if (j === this.cardNodeArr.length - 1) {
                    this.cardNodeArr.push(node);
                    break;
                }
            }
            nodeMove(node, (i === (cardDataArr.length - 1)) ? cb : null);
        }
        // 重新设置数序
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            this.cardNodeArr[i].zIndex = i + 1;
        }
    },

    removeCard(cardDataArr) {
        this.selectedCardArr = [];
        for (let i = 0; i < cardDataArr.length; ++i) {
            let cardData = cardDataArr[i];
            for (let j = 0; j < this.cardNodeArr.length; ++j) {
                if (this.cardNodeArr[j].cardData === cardData) {
                    this.cardNodeArr[j].destroy();
                    this.cardNodeArr.splice(j, 1);
                    break;
                }
            }
        }
    },

    searchOutCard(turnCardDataArr, isSelected = false) {
        let handCardDataArr = [];
        if (isSelected === true) {
            handCardDataArr = this.selectedCardArr
        } else {
            for (let i = 0; i < this.cardNodeArr.length; ++i) {
                handCardDataArr.push(this.cardNodeArr[i].cardData);
            }
        }
        let gctMainLogic = this.node.parent.getComponent('GCTMainDialog');
        let gameRule = gctMainLogic.getGameRule();
        if (this.searchOutCardResultArr.length > 0) {
            // 移除牌
            let lastSearchOutCardResult = this.searchOutCardResultArr[this.searchOutCardResultArr.length - 1];
            let cardType = gameLogic.getCardType(lastSearchOutCardResult, gameRule);
            //当玩家最后一手牌符合甩尾规则时客户端不需要选牌，服务端直接推送三带一或四带二对局结束 
            if (cardType === ApiGct.cardType.THREE_LINE || cardType === ApiGct.cardType.THREE_LINE_TAKE_TWO) {
                let analyseResult = gameLogic.analyseCardDataArr(lastSearchOutCardResult);
                let firstCardValue = gameLogic.getCardLogicValue(analyseResult.threeCardData[analyseResult.threeCardData.length - 1]);
                this.ignoreCardValueArr.push(firstCardValue);
            } else if (cardType === ApiGct.cardType.FOUR_LINE_TAKE_THREE) {
                let analyseResult = gameLogic.analyseCardDataArr(lastSearchOutCardResult);
                let firstCardValue = gameLogic.getCardLogicValue(analyseResult.fourCardData[analyseResult.fourCardData.length - 1]);
                this.ignoreCardValueArr.push(firstCardValue);
            } else {
                let firstCardValue = gameLogic.getCardLogicValue(lastSearchOutCardResult[lastSearchOutCardResult.length - 1]);
                this.ignoreCardValueArr.push(firstCardValue);
            }
            gameLogic.removeCardByValue(this.ignoreCardValueArr, handCardDataArr);
        }

        let resultCardArr = gameLogic.searchOutCard(handCardDataArr, turnCardDataArr, gameRule);
        if (resultCardArr.length === 0) {
            if (this.searchOutCardResultArr.length === 0) {
                return false;
            } else {
                resultCardArr = this.searchOutCardResultArr[0];
                this.searchOutCardResultArr = [];
                this.ignoreCardValueArr = [];
            }
        }

        this.resetCardPos();

        this.setSelectedCard(resultCardArr);

        this.searchOutCardResultArr.push(resultCardArr);
        return true;
    },

    resetSearchOutCardState() {
        this.searchOutCardResultArr = [];
        this.ignoreCardValueArr = [];
    }
});