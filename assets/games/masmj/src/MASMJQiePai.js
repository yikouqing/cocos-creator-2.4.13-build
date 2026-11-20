const ApiRoom = require('../../../src/api/ApiRoom');
const CCUtil = require('../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        btn_enter: cc.Node,
        txt_countDown: cc.Label,
        cardLayout: cc.Node,
        _countDown: 0,
        _timeCheck: 0,
        _isUpdate: false
    },

    onLoad() {
        CCUtil.nodeRecursive(this.node, (node) => {
            if (node.name.startsWith("mj")) {
                let com = node.addComponent("MASMJSingleTile")
                com.init()
            }
        })
        this.btn_enter.on("click", this.onBtnClick, this)
        this.txt_countDown.string = this.node.nodeParams.countDown
        this._countDown = parseInt(this.node.nodeParams.countDown)
        if (this._countDown > 0) {
            this._isUpdate = true
        }

        this.cardLayout.on(cc.Node.EventType.TOUCH_END, this.onTouchCardEnd, this);
        this.cardLayout.on(cc.Node.EventType.TOUCH_START, this.onTouchCardStart, this);
        this.cardLayout.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.cardLayout.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCardEnd, this);
    },

    start() {

    },

    onBtnClick() {
        ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
        this.node.destroy()
    },

    onTouchCardStart(event) {
        this.touchStartPos = event.touch.getLocation()
    },
    onTouchMove(event) {
        this.checkChooseCard(event)
    },
    onTouchCardEnd(event) {
        this.checkChooseCard(event)
    },

    /**获取矩形 */
    getTouchRect(curPos) {
        let width = Math.abs(this.touchStartPos.x - curPos.x)
        width = width <= 2 ? 2 : width
        let x = this.touchStartPos.x,
            y = this.touchStartPos.y
        if (this.touchStartPos.x > curPos.x) {
            x -= width
        }
        return cc.rect(x, y, width, 2)
    },

    /**判断牌的滑动抬起和放下 */
    checkChooseCard(event) {
        let rect1 = this.getTouchRect(event.touch.getLocation())
        let showList = this.cardLayout.children
        for (let i = 0; i < showList.length; ++i) {
            let node1 = showList[i]
            if (!node1.active) {
                continue;
            }
            let rect2 = CCUtil.getBoundingBoxToWorldWithoutChildren(node1)
            let node2 = showList[i + 1]
            if (node2 && node2.active) {
                rect2.width += this.cardLayout.getComponent(cc.Layout).spacingX
            }
            let intersect = rect1.intersects(rect2)
            if (intersect) {
                for (let j = 0; j < showList.length; j++) {
                    const n = showList[j];
                    if (j <= i) {
                        n.y = 30
                    } else {
                        n.y = 0
                    }
                }
            }
        }
    },

    update(dt) {
        if (this._isUpdate) {
            this._timeCheck += dt
            if (this._timeCheck >= 1) {
                this._timeCheck = 0
                this._countDown--
                this.txt_countDown.string = this._countDown + ""
                if (this._countDown <= 0) {
                    this._isUpdate = false
                    this.onBtnClick()
                }
            }
        }
    },
});