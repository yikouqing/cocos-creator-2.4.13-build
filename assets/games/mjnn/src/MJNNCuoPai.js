const ApiMjnn = require('./ApiMjnn');
const MJNNModel = require("./MJNNModel")
const CCUtil = require("../../../src/utils/CCUtil")
const ApiRoom = require('../../../src/api/ApiRoom');

cc.Class({
    extends: cc.Component,

    properties: {
        tilePfb: cc.Prefab,
        _cardList: [],
        _endCount: 0
    },

    start() {
        let uid = MJNNModel.getMyUID();
        let handCards = MJNNModel.getUserCards(uid);
        if (!handCards) {
            this.node.destroy();
            return
        }
        let cardId = handCards.pop();
        // console.log("handCards-搓牌", handCards, cardId)
        this._initPos = [cc.v2(0, 0), cc.v2(0, 0)];
        this._endPos = [cc.v2(150, 0), cc.v2(-150, 0)];
        for (let i = 0; i < 2; i++) {
            let node = cc.instantiate(this.tilePfb);
            node.scale = 3;
            let com = node.addComponent('MJNNSingleTile');
            com.init();
            if (i == 0) com.flower = cardId;
            com.setCover(i == 1);
            node.setPosition(this._initPos[i]);
            node.name = (i + 1) + "";
            node.parent = this.node;
            node.zIndex = i + 1;
            this._cardList.push(com);
            if (i == 1) this.setTouchListener(com.node);
        }
    },

    setTouchListener(node) {
        node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
    },

    removeTouchListener(node) {
        node.off(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        node.off(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        node.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        node.off(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
    },

    /**触摸响应 */
    touchStart(event) {
        event.target.stopAllActions();
    },

    touchMove(event) {
        event.target.x += event.getDeltaX();
        event.target.y += event.getDeltaY();
    },

    touchEnd(event) {
        let rect1 = CCUtil.getBoundingBoxToWorldWithoutChildren(this._cardList[0].node);
        let rect2 = CCUtil.getBoundingBoxToWorldWithoutChildren(this._cardList[1].node);
        if (!rect1.intersects(rect2)) {
            this._endCount++;
            if (this._endCount == 1) {
                this.firstEnd();
            } else if (this._endCount == 2) {
                this.secondEnd();
            }
        } else {
            if (this._endCount == 0) {
                this.moveAni(this._cardList[1].node, this._initPos[1]);
            } else if (this._endCount == 1) {
                this.moveAni(this._cardList[0].node, this._initPos[1]);
            }
        }
    },

    moveAni(node, endPos, callFunc) {
        cc.tween(node)
            .to(0.5, {
                position: endPos
            }).call(() => {
                callFunc && callFunc()
            }).start();
    },

    firstEnd() {
        this.removeTouchListener(this._cardList[1].node);
        // this.setTouchListener(this._cardList[0].node);//不再添加触摸
        /**交换层级 */
        this._cardList[0].node.zIndex = 2;
        this._cardList[1].node.zIndex = 1;
        /**交换位置 */
        this.moveAni(this._cardList[0].node, this._initPos[1]);
        this.moveAni(this._cardList[1].node, this._initPos[0], () => {
            this._cardList[1].setCover(true);
            this._cardList[1].setNodeShow(false);
            this.scheduleOnce(() => {
                ApiRoom.gameMessageNotify(ApiMjnn.showCardsNotify())
                this.node.destroy();
            }, 0.5);
        })
    },

    secondEnd() {
        this.removeTouchListener(this._cardList[0].node);
        this.removeTouchListener(this._cardList[1].node);
        let ep1 = 0,
            ep2 = 1;
        if (this._cardList[0].node.x < 0) {
            ep1 = 1;
            ep2 = 0;
        }
        this.moveAni(this._cardList[0].node, this._endPos[ep1]);
        this.moveAni(this._cardList[1].node, this._endPos[ep2], () => {
            this.scheduleOnce(() => {
                ApiRoom.gameMessageNotify(ApiMjnn.showCardsNotify());
                this.node.destroy();
            }, 0.5);
        })
    },
});