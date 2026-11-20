const MessageCallback = require('../../utils/MessageCallback');
const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
const Events = require('../../const/Events');
const Enums = require('../../const/Enums');
const tips = `DEFAULT>默认缩放\nLEFT_TO_RIGHT>从左往右进入\nRIGHT_TO_LEFT>从右往左进入\nTOP_TO_DOWN>从上往下进入\nDOWN_TO_TOP>从下往上进入`;

cc.Class({
    extends: cc.Component,

    properties: {
        actionType: {
            tooltip: `弹窗动画类型\n:${tips}`,
            default: Enums.dialogAction.DEFAULT,
            type: Enums.dialogAction,
            displayName: "动画类型"
        },
        actionNode: cc.Node,
        scaleVal: 1,
        _actionPos: null,
        _action: false,
    },

    start() {
        MessageCallback.addListener(Events.clientEvents.onDialogRelease, this);
        this._init();
    },

    messageCallbackHandler(route, msg) {
        if (route === Events.clientEvents.onDialogRelease) {
            if (!Array.isArray(msg)) return;
            let name = this.node.name;
            if (!msg.includes(name)) return;
            this.out();
        }
    },

    _init() {
        if (!!this.actionNode) {
            this._action = true;
            this.actionNode.stopAllActions();
            this.actionNode.opacity = 0;
            if (this.actionType == Enums.dialogAction.DEFAULT) {
                this.actionNode.setScale(0);
                cc.tween(this.actionNode)
                    .to(0.3, {
                        scale: this.scaleVal || 1,
                        opacity: 255
                    }, {
                        easing: 'backOut'
                    })
                    .call(() => {
                        this._action = false;
                    })
                    .start();
            } else if (this.actionType == Enums.dialogAction.DOWN_OPACITY) {
                // 回弹效果 
                let height = cc.view.getFrameSize().height
                let showPos = cc.v2(0, height)
                this._opcityPos = cc.v2(showPos.x, showPos.y);
                this.actionNode.setPosition(this._opcityPos)
                this.actionNode.opacity = 0;
                cc.tween(this.actionNode)
                    .to(0.2, {
                        opacity: 255,
                        position: cc.v3(0, 0, 0)
                    }, { easing: 'backOut' })
                    .call(() => {
                        this._action = false;
                    })
                    .start();
            } else {
                this.actionNode.getComponent(cc.Widget) && this.actionNode.getComponent(cc.Widget).updateAlignment();
                this._actionPos = {
                    show: cc.v2(),
                    hide: cc.v2()
                };
                this._actionPos.show = this.actionNode.getPosition(cc.v2());
                if (this.actionType == Enums.dialogAction.LEFT_TO_RIGHT) {
                    this._actionPos.hide = cc.v2(this._actionPos.show.x - this.actionNode.width, this._actionPos.show.y);
                } else if (this.actionType == Enums.dialogAction.RIGHT_TO_LEFT) {
                    this._actionPos.hide = cc.v2(this._actionPos.show.x + this.actionNode.width, this._actionPos.show.y);

                } else if (this.actionType == Enums.dialogAction.TOP_TO_DOWN) {
                    this._actionPos.hide = cc.v2(this._actionPos.show.x, this._actionPos.show.y + this.actionNode.height);

                } else if (this.actionType == Enums.dialogAction.DOWN_TO_TOP) {
                    this._actionPos.hide = cc.v2(this._actionPos.show.x, this._actionPos.show.y - this.actionNode.height);
                }

                let targetNode = this.node.nodeParams.targetNode;
                if (targetNode) {
                    let targetPos = CCUtil.postionConvert(targetNode, this.actionNode.parent);
                    this._actionPos.show.x = targetPos.x;
                }
                this.actionNode.setPosition(this._actionPos.hide);
                cc.tween(this.actionNode)
                    .to(0.6, {
                        opacity: 255,
                        position: cc.v3(this._actionPos.show)
                    }, {
                        easing: 'expoOut'
                    })
                    .call(() => {
                        this._action = false;
                    })
                    .start();

            }


        }
    },





    out() {
        if (!!this.actionNode) {
            if (this._action) return;
            this.actionNode.stopAllActions();
            this._action = true;
            if (this.actionType == Enums.dialogAction.DEFAULT) {
                cc.tween(this.actionNode)
                    .to(0.3, {
                        scale: 0,
                        opacity: 0
                    }, {
                        easing: 'backIn'
                    })
                    .call(() => {
                        this.node.destroy();
                    })
                    .start();
            } else if (this.actionType == Enums.dialogAction.DOWN_OPACITY) {
                cc.tween(this.actionNode)
                    .to(0.2, {
                        opacity: 0,
                        position: this._opcityPos
                    })
                    .call(() => {
                        this._action = false;
                        this.node.destroy();
                    })
                    .start();

            } else {
                this.actionNode.setPosition(this._actionPos.show);
                cc.tween(this.actionNode)
                    .to(0.2, {
                        opacity: 255,
                        position: cc.v3(this._actionPos.hide)
                    })
                    .call(() => {
                        this._action = false;
                        this.node.destroy();
                    })
                    .start();
            }
        } else {
            this.node.destroy();
        }
    },

    onDestroy() {
        MessageCallback.removeListener(Events.clientEvents.onDialogRelease, this);
    },

});