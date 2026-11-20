
cc.Class({
    extends: cc.Component,

    properties: {
        itemContent: cc.Node,//列表
        btnAbove: cc.Node,//上一级
        btnNext: cc.Node,//下一级
        itemOffset: cc.Vec2,//中心偏移量

        _content: [],
        _unitAngle: 0,//单位角度  如 360/(个数)
        _angle: 0, //记录旋转的角度
        _initAngle: 0,
        _movelastX: 0,//上次坐标X
        _touchMoved: false,    //是否在滑动
        _startX: null,  //开始的X坐标
        _isplaying: false,  //是否正在惯性滑动
        _len: 0, //房间个数
        _initSize: null,
        _distSize: null,
    },

    init(data) {
        this._movelastX = 0;
        this._touchMoved = false;
        this._startX = cc.v2(0, 0);
        this._initSize = this.itemContent.getContentSize();
        this._distSize = data.dist;
        let prefab = data.prefab;
        let callback = data.callback;
        let list = data.list || [];
        this._isplaying = false;
        this._len = 0; //房间的个数
        this._content = [];
        this.itemContent.destroyAllChildren();
        this._initAllItems(prefab, list, callback);
        if (this._len <= 2) {
            if (this.btnAbove) this.btnAbove.active = false;
            if (this.btnNext) this.btnNext.active = false;
            return;
        } else {
            if (this.btnAbove) this.btnAbove.active = true;
            if (this.btnNext) this.btnNext.active = true;
        }
        this._updatePositionWithAnimation();
        this.node.on(cc.Node.EventType.TOUCH_START, (touch, event) => {
            this.scheduleOnce(() => {
                for (let i = 0; i < this._content.length; i++) {
                    this._content[i].stopAllActions();
                }
            }, 0.5);
            this._touchMoved = false;
            let pos = this.node.convertToNodeSpaceAR(touch.getLocation());
            let rect = cc.rect(0, 0, this.node.width, this.node.height);
            return rect.contains(pos);
        });

        this.node.on(cc.Node.EventType.TOUCH_MOVE, (event, captureListeners) => {
            this._setAngle((this._getAngle() - event.getDelta().x / 400));
            this._updatePosition(this._getAngle());
            this._isplaying = true;
            let touch = event.touch;
            let lt = cc.v2(touch.getLocation().x, touch.getLocation().y);
            let deltaMove = lt.sub(touch.getStartLocation());
            if (deltaMove.mag() > 7) {
                if (!this._touchMoved && event.target !== this.node) {
                    let cancelEvent = new cc.Event.EventTouch(event.getTouches(), event.bubbles);
                    cancelEvent.type = cc.Node.EventType.TOUCH_CANCEL;
                    cancelEvent.touch = event.touch;
                    cancelEvent['simulate'] = true;
                    event.target.dispatchEvent(cancelEvent);
                    this._touchMoved = true;
                }
            }
        });
        this.node.on(cc.Node.EventType.TOUCH_END, this._touchEnd, this)
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._touchCancel, this)
        this.node.on(cc.Node.EventType.MOUSE_UP, this._mouseEnd, this)
    },

    _touchCancel(event) {
        if (this._touchMoved || this.node == event.target) {
            this._touchMoved = false;
            let XOffset = event._x - this._startX.x;
            this._rectify(XOffset < 0);
            this._updatePositionWithAnimation();
        }
    },

    _touchEnd(touch, event) {
        if (!this._isplaying) return;
        if (this._touchMoved) touch.stopPropagation();
        this._touchMoved = false;
        this._isplaying = false;
        let xDelta = touch.getLocation().x - touch.getStartLocation().x;
        this._rectify(xDelta * -1 > 0);
        this._updatePositionWithAnimation();
    },

    _mouseEnd(event) {
        if (!this._isplaying) return;
        if (this.touchMoved) event.stopPropagation();
        this._touchMoved = false;
        let XOffset = event._x - this._startX.x;
        this._isplaying = false;
        this._rectify(XOffset < 0);
        this._updatePositionWithAnimation();
    },

    _addItem(prefab, data, index, callback) {
        let itemNode = cc.instantiate(prefab);
        this.itemContent.addChild(itemNode);
        this._content.push(itemNode);
        itemNode.x = this.itemOffset.x;
        itemNode.y = this.itemOffset.y;
        this._unitAngle = 2 * Math.PI / this._content.length;
        this._len = this._content.length;
        callback && callback(itemNode, data, index);
        return itemNode;
    },

    //初始6个房间   data roominfo数组  ，name游戏脚本名字 level 开发者自定义数据
    _initAllItems(prefab, data, callback) {
        if (data.length <= 0) return;
        let roomLen = data.length;
        if (roomLen <= 2) {
            //2个一下 不可以滑动
            this._addItem(prefab, data[0], 0, callback)
            if (roomLen == 2) {
                this._addItem(prefab, data[1], 1, callback);
                this._angle = this._unitAngle * -2 + this._unitAngle * 1 + this._getAddNumber();
                this._updatePositionWithAnimation();
            }
            return;
        }

        for (let i = roomLen - 1; i >= 0; i--) {
            let itemNode = this._addItem(prefab, data[i], i, callback)
            itemNode.on(cc.Node.EventType.TOUCH_START, (touch, event) => {
                this._touchMoved = false;
                this._startX = touch.getLocation();
                for (let i = 0; i < this._content.length; i++) {
                    this._content[i].stopAllActions();
                }
            })
            itemNode.on(cc.Node.EventType.TOUCH_MOVE, (event, captureListeners) => {
                let touch = event.touch;
                let lt = cc.v2(touch.getLocation().x, touch.getLocation().y);
                let deltaMove = lt.sub(touch.getStartLocation());
                if (deltaMove.mag() > 7) {
                    if (!this._touchMoved && event.target !== this.node) {
                        let cancelEvent = new cc.Event.EventTouch(event.getTouches(), event.bubbles);
                        cancelEvent.type = cc.Node.EventType.TOUCH_CANCEL;
                        cancelEvent.touch = event.touch;
                        cancelEvent['simulate'] = true;
                        event.target.dispatchEvent(cancelEvent);
                        this._touchMoved = true;
                    }
                }
                this._isplaying = true;
                this._setAngle((this._getAngle() - event.getDelta().x / 400));
                this._updatePosition(this._getAngle());
            }, this)
            itemNode.on(cc.Node.EventType.MOUSE_UP, this._mouseEnd, this)
        }
        this._angle = -this._unitAngle + this._getAddNumber();
    },

    //当滑到中间的位置 设置到固定的角度
    _rectify(forward, isLeftRight = false) {
        let angle = this._getAngle();
        while (angle < 0) angle += Math.PI * 2;
        while (angle > Math.PI * 2) angle -= Math.PI * 2;
        if (!isLeftRight) {
            if (forward) {
                angle = angle + this._getUnitAngle() / 3 * 2;
            } else {
                angle = angle + this._getUnitAngle() / 3 * 1.2;
            }
            angle += this._getAddNumber();
        }
        this._setAngle(angle);
    },

    _getAddNumber() {
        let num = 0;
        if (this._len == 6) {
            num = 2.5 * this._unitAngle / 5;
        } else if (this.len == 5) {
            num = 0;
        } else if (this._len == 4) {
            num = 0;
        } else if (this.len == 3) {
            num = 1.5 * this._unitAngle / 3;
        } else if (this._len == 2) {
            num = 1 * this._unitAngle / 2;
        } else if (this._len == 1) {
            num = 0;
        }
        return num;
    },

    _setAngle(angle) {
        this._angle = angle;
    },

    _getAngle() {
        return this._angle;
    },

    _getUnitAngle() {
        return this._unitAngle;
    },

    _getDist() {
        this._distSize = this._distSize || new cc.Size(400, 100);
        return this._distSize;
    },

    //滑动时 改变包括 坐标点 缩放 深度 透明度
    _updatePosition(deltaX) {
        let dis = this._getDist();
        for (let i = 0; i < this._len; i++) {
            let x = this.itemOffset.x + dis.width * Math.sin(i * this._unitAngle + deltaX);
            let y = this.itemOffset.y + dis.height * Math.cos(i * this._unitAngle + deltaX);
            let roomItem = this._content[i];
            roomItem.position = cc.v3(x, y);
            roomItem.zIndex = -y;
            let angle = i * this._getUnitAngle() + deltaX;
            roomItem.scale = (0.8 - 0.2 * Math.cos(angle));
            let _angle = (angle + Math.PI * 2) % (Math.PI * 2);
            let opacity = 255 * 5 / 6 - 255 / 3 * Math.cos(_angle);
            roomItem.opacity = opacity > 255 ? 255 : opacity;
        }
        return;
    },

    //当滑动完成 转到固定的角度 
    _updatePositionWithAnimation(value) {
        if (this._touchMoved) return;
        let toAngle = value || 0;
        for (let i = 0; i < this._content.length; i++) {
            this._content[i].stopAllActions();
        }
        let dis = this._getDist();
        for (let i = 0; i < this._content.length; i++) {
            let x = this.itemOffset.x + dis.width * Math.sin(i * this._unitAngle + this._getAngle() + toAngle);
            let y = this.itemOffset.y + dis.height * Math.cos(i * this._unitAngle + this._getAngle() + toAngle);
            let angle = i * this._getUnitAngle() + this._getAngle() + toAngle;
            let _angle = (angle + Math.PI * 2) % (Math.PI * 2);
            let opacity = 255 * 5 / 6 - 255 / 3 * Math.cos(_angle);
            opacity = opacity > 255 ? 255 : opacity;
            let scale = 1;
            if (this._len > 2) {
                scale = 0.8 - 0.2 * Math.cos(i * this._getUnitAngle() + this._getAngle() + toAngle);
            }
            cc.tween(this._content[i])
                .to(1, { position: cc.v3(x, y), scale: scale, opacity: opacity }, { easing: 'quadOut' })
                .call(() => {
                    this._isplaying = false;
                })
                .start();
            this._content[i].zIndex = -y;
        }
        return;
    },

    playRight() {
        this._setAngle(this._getAngle() - this._unitAngle);
        this._rectify(false, true);
        this._updatePositionWithAnimation();
    },

    playLeft() {
        this._setAngle(this._getAngle() + this._unitAngle);
        this._rectify(true, true);
        this._updatePositionWithAnimation();
    }

})
