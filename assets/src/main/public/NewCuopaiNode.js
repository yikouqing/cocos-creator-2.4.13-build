const AssetsManager = require('../../utils/AssetsManager');
const MessageCallback = require('../../utils/MessageCallback');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
cc.Class({
    extends: cc.Component,

    properties: {
        cardBack: cc.Node,
        cardBackSprite: cc.Sprite,
        card: cc.Node,
        cardSprite: cc.Sprite,
        cardSmallNode: cc.Node,
        cardSmallList: cc.Node,
        returnSpeed: 0.5,  // 返回速度
        _cb: null,
    },



    onLoad() {
        // 初始化位置
        this.originalPos = cc.v2(0, 0);
        this.card.active = false;
        // 初始化状态
        this.isDragging = false;
        MessageCallback.addListener('UpdateGameCardBg', this);
        // 注册触摸事件
        this.cardBack.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.cardBack.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.cardBack.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.cardBack.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

    },

    onDestroy() {
        MessageCallback.removeListener('UpdateGameCardBg', this);
        this.cardBack.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.cardBack.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.cardBack.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.cardBack.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    },


    start() {
        // 原始位置
        this.originalPos = this.cardBack.position;
        // 传入的数据
        let data = this.node.nodeParams;
        this._cb = data.cb;
        // 牌面
        let card = data.card || 0;
        this.cardSmall = data.cards || [];
        if (!!card) {
            this.card.active = true;
            AssetsManager.loadSpriteFrame({
                path: `/sprite/cards/${card}`,
                sprite: this.cardSprite
            });
        }
        this.showCardSmallList();
    },


    // 小牌
    showCardSmallList() {
        if (this.cardSmall.length > 0) {
            for (let i = 0; i < this.cardSmall.length; i++) {
                let card = this.cardSmall[i];
                let cardNode = cc.instantiate(this.cardSmallNode);
                cardNode.active = true;
                let cardSprite = cardNode.getComponent(cc.Sprite);
                if (i == this.cardSmall.length - 1) {
                    AssetsManager.loadSpriteFrame({
                        path: ConfigModel.getCardUrl(),
                        sprite: cardSprite
                    });
                } else {
                    AssetsManager.loadSpriteFrame({
                        path: `/sprite/cards/${card}`,
                        sprite: cardSprite
                    });
                }

                cardNode.parent = this.cardSmallList;
                cardNode.y = 0;
            }
        }


        console.log('cardSmall', this.cardSmallList);


    },

    messageCallbackHandler(route, msg) {
        if (route === 'UpdateGameCardBg') {
            this.updateCardsBgSprite();
        }
    },

    onTouchStart(event) {
        this.isDragging = true;
        // 获取触摸点相对于牌背节点的坐标
        // this.touchOffset = this.cardBack.convertToNodeSpaceAR(event.getLocation());
        this.touchOffset = CCUtil.postionConvert(this.cardBack, AssetsManager.root);

    },
    onTouchMove(event) {
        if (!this.isDragging) return;
        let touch = event.touch;
        let item = cc.v2(touch.getLocation().x, touch.getLocation().y);
        let deltaMove = item.sub(touch.getStartLocation());
        this.cardBack.setPosition(
            this.touchOffset.x + deltaMove.x,
            this.touchOffset.y + deltaMove.y
        );

    },
    onTouchEnd(event) {
        this.isDragging = false;

        // 获取两个节点的世界包围盒
        const cardBackBBox = this.cardBack.getBoundingBoxToWorld();
        const displayCardBBox = this.card.getBoundingBoxToWorld();
        // 计算两个包围盒的交集区域
        const intersection = cardBackBBox.intersects(displayCardBBox);
        if (!intersection) {
            this.onCardBackLeave();

        } else {
            // 弹性效果
            // cc.tween(this.cardBack)
            //     .to(this.returnSpeed, { position: this.originalPos }, { easing: 'elasticOut' })
            //     .start();
            // 平滑效果
            cc.tween(this.cardBack)
                .to(this.returnSpeed, { position: this.originalPos })
                .start();
        }

    },


    updateCardsBgSprite() {
        if (!this.cardBackSprite) return;
        AssetsManager.loadSpriteFrame({
            path: ConfigModel.getCardUrl(),
            sprite: this.cardBackSprite
        });
    },




    update(dt) {
        // 获取两个节点的世界包围盒
        // const cardBackBBox = this.cardBack.getBoundingBoxToWorld();
        // const displayCardBBox = this.card.getBoundingBoxToWorld();
        // // 计算两个包围盒的交集区域
        // // const intersection = cc.Rect.fromMinMax(cardBackBBox, displayCardBBox);
        // const intersection = cardBackBBox.intersects(displayCardBBox);
        // if (!intersection) {
        //     this.onCardBackLeave();

        // }

    },

    onCardBackLeave() {
        // 延迟
        this.scheduleOnce(() => {
            let lastBackCard = this.cardSmall[this.cardSmall.length - 1];
            let showCard = this.cardSmall[this.cardSmall.length - 1]
            AssetsManager.loadSpriteFrame({
                path: `/sprite/cards/${showCard}`,
                sprite: lastBackCard.getComponent(cc.Sprite)
            });
            this._cb && this._cb();
        }, 1)

        this.node.destroy();
    }

    // update (dt) {},
});
