/**3
 * 文字滚动效果
 * 注意使用此脚本会改变父节点
 */
cc.Class({
    extends: cc.Component,

    properties: {
        maskWidth: {
            displayName: "自定义遮罩的宽度",
            default: 0,
        },
        moveAuto: {
            displayName: "是否自动移动",
            default: false,
        },
        moveNum: {
            displayName: "左右为一次",
            default: 1,
        },
        _type: 3, //运动的方向 -1向左  1向右 3停止
        _timeCheck: 0,
        _stopCheck: 0,
        _dw: 0, //动态变化的宽度
        /**是否需要移动 */
        _isMove: false,
        /**记录上一次node的长度 */
        _oldWidth: 0,

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.TIME_INTERVAL = 0.02 //运动的时间间隔,秒
        this.DISTANCE_INTERVAL = 1 //运动的距离间隔，像素
        this.STOP_INTERVAL = 2 //停止的时间间隔,秒
        this._startMove = this.moveAuto;
        this._oldWidth = 0;
    },

    start() {
        if (this.maskWidth <= 0) return;
        if (!this.node.getComponent(cc.Label)) return;
        let Label = this.node.getComponent(cc.Label);
        Label.overflow = cc.Label.Overflow.NONE;
        Label._forceUpdateRenderData();

        let lableMask = new cc.Node("lableMask");
        lableMask.parent = this.node.parent
        let mask = lableMask.addComponent(cc.Mask)
        mask.type = cc.Mask.Type.RECT
        lableMask.width = this.maskWidth
        lableMask.height = this.node.height;
        lableMask.anchorX = this.node.anchorX
        lableMask.anchorY = this.node.anchorY
        lableMask.setPosition(this.node.getPosition())
        this.changeParent(this.node, lableMask);
        this.checkNodeWidth();
        lableMask.on(cc.Node.EventType.TOUCH_START, (event) => {//TOUCH_END
            if (!this._startMove) {
                this._type = -1;
                this._moveCount = 0;
                this._startMove = true;
            }
        }, this, true);
    },

    checkNodeWidth() {
        let lableMask = this.node.parent
        if (!lableMask || !lableMask.getComponent(cc.Mask)) return;
        if (this.node.width != this._oldWidth) {
            this._oldWidth = this.node.width
            if (this.node.width - this.maskWidth >= 5) {
                this.node.setAnchorPoint(0, 0.5)
                let x = 0
                if (lableMask.anchorX == 0.5) {
                    x = -(this.maskWidth / 2)
                    this._dw = this.maskWidth
                } else if (lableMask.anchorX == 1) {
                    x = -this.maskWidth
                    this._dw = this.maskWidth * 2
                } else if (lableMask.anchorX == 0) {
                    x = 0
                    this._dw = 0
                }
                this.node.setPosition(x, 0)
                this._isMove = true
            } else {
                this.node.anchorX = lableMask.anchorX
                this.node.anchorY = lableMask.anchorY
                this.node.setPosition(0, 0)
                this._isMove = false
            }
        }
    },

    update(dt) {
        if (!this._startMove) return;
        this.checkNodeWidth()
        if (!this._isMove || this.maskWidth <= 0) return;
        if (this._type == 3) {
            this._stopCheck += dt
            if (this._stopCheck >= this.STOP_INTERVAL) {
                this._stopCheck = 0
                if (this.node.x <= -(this._dw / 2 + (this.node.width - this.maskWidth) + 2)) {
                    this._type = 1;
                    this._moveCount += 1;
                } else if (this.node.x >= -(this._dw / 2)) {
                    this._type = -1;
                    this._moveCount += 1;
                }
                if (!this.moveAuto && this._moveCount > this.moveNum && this._type == -1) {//回到左侧再暂停
                    this._startMove = false;
                }
            }
            return
        }
        this._timeCheck += dt
        if (this._timeCheck >= this.TIME_INTERVAL) {
            this._timeCheck = 0
            if (this.node.width > this.maskWidth) {
                this.node.x += this.DISTANCE_INTERVAL * this._type
                if (this.node.x <= -(this._dw / 2 + (this.node.width - this.maskWidth) + 2)) {
                    this._type = 3
                } else if (this.node.x >= -(this._dw / 2)) {
                    this._type = 3
                }
            }
        }
    },

    changeParent(node, parent) {
        var pos1 = node.convertToWorldSpaceAR(cc.v2(0, 0));
        var pos2 = parent.convertToNodeSpaceAR(pos1);
        node.setPosition(pos2)
        node.parent = parent
    }
});