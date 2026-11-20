
cc.Class({
    extends: cc.Component,

    properties: {
        listNode: cc.Node,

        _mCircleA: 0,//椭圆的a
        _mCircleB: 0,//椭圆的b
        _mRoleNum: 0,
        _mHead: null,
        _mOnAction: false,
        _mCurrentRole: null,//操作链表用的指针
        _mSelectRole: null,//被选中的角色，在椭圆最低点
        _mLast: null,
    },

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
    },

    _onTouchStart(event) {
        console.log(event)
        event._propagationStopped = false;
    },

    _onTouchEnd(event) {
        event._propagationStopped = false;
        let startTouch = event.getStartLocation();
        let endTouch = event.getLocation();
        if (startTouch.x < endTouch.x && Math.abs(startTouch.x - endTouch.x) > 100) {//左向右滑动
            if (!!this._mOnAction) return;
            this._changeToFore();
        } else if (startTouch.x > endTouch.x && Math.abs(startTouch.x - endTouch.x) > 100) {
            if (!!this._mOnAction) return;
            this._changeToNext();
        }
    },

    init(data) {
        console.log('ceshi-1', data)
        this._mRoleNum = 0;
        this._mHead = null;
        this._mOnAction = false;
        data.list = data.list || [];
        data.prefab = data.prefab || null;
        data.circle = data.circle || cc.size(320, 80);
        this._mCircleA = data.circle.width;
        this._mCircleB = data.circle.height;
        if (!data.prefab) return;
        for (let i = 0; i < data.list.length; i++) {
            let item = cc.instantiate(data.prefab);
            item.name = "item" + i;
            item.mPositionIndex = 0;
            item.mIsSelected = false;
            item.mDistance = 0;
            item.mColorB = 255;
            item.mColorG = 255;
            item.mColorR = 255;
            this._addItem(item);
            data.callback && data.callback(item, data.list[i], i);
        }
        this._distancesSync();
        this._zOrdersSync();
        this._appearanceInit();
    },

    //更新每个节点的明暗，越远越暗
    _colorSync() {
        this._mCurrentRole = this._mSelectRole;
        for (let i = 0; i < this._mRoleNum; i++) {
            this._mCurrentRole.mColorR = 255;
            this._mCurrentRole.mColorG = 255;
            this._mCurrentRole.mColorB = 255;
            for (let j = 0; j < this._mCurrentRole.mDistance; j++) {
                this._mCurrentRole.mColorR *= 0.6;
                this._mCurrentRole.mColorG *= 0.6;
                this._mCurrentRole.mColorB *= 0.6;
            }
            this._mCurrentRole.opacity = this._mCurrentRole.mColorR;
            this._mCurrentRole = this._mCurrentRole.mNextRole;
        }
    },

    //初始化颜色和缩放
    _appearanceInit() {
        this._mCurrentRole = this._mSelectRole;
        for (let i = 0; i < this._mRoleNum; i++) {
            let scale = 1;
            for (let j = 0; j < this._mCurrentRole.mDistance; j++) {
                scale *= 0.8;
                this._mCurrentRole.mColorR *= 0.6;
                this._mCurrentRole.mColorG *= 0.6;
                this._mCurrentRole.mColorB *= 0.6;
            }
            this._mCurrentRole.scale = scale;
            this._mCurrentRole.opacity = this._mCurrentRole.mColorR;
            this._mCurrentRole = this._mCurrentRole.mNextRole;
        }
        this._mSelectRole.scale = 1.0;
    },

    //更新每个节点到中央节点的距离
    _distancesSync() {
        this._mCurrentRole = this._mSelectRole;
        let distance = 0;
        for (let i = 0; i <= this._mRoleNum / 2; i++) {
            this._mCurrentRole.mDistance = distance;
            ++distance;
            this._mCurrentRole = this._mCurrentRole.mNextRole;

        }
        this._mCurrentRole = this._mSelectRole;
        distance = 0;
        for (let i = 0; i <= this._mRoleNum / 2; i++) {
            this._mCurrentRole.mDistance = distance;
            ++distance;
            this._mCurrentRole = this._mCurrentRole.mForeRole;
        }
        this._mSelectRole.mDistance = 0;
    },

    //更新遮盖关系
    _zOrdersSync() {
        this._mSelectRole.zIndex = this._mRoleNum;
        this._mSelectRole.mDistance = 0;
        this._mCurrentRole = this._mSelectRole;
        for (let i = 0; i <= this._mRoleNum / 2; i++) {
            this._mCurrentRole.zIndex = this._mRoleNum - this._mCurrentRole.mDistance;
            this._mCurrentRole = this._mCurrentRole.mNextRole;
        }
        for (let i = this._mRoleNum / 2 + 1; i < this._mRoleNum; i++) {
            this._mCurrentRole.zIndex = Math.abs(this._mRoleNum / 2 - this._mCurrentRole.mDistance);
            this._mCurrentRole = this._mCurrentRole.mNextRole;
        }
    },

    //添加一个角色到链表
    _addItem(item) {
        // console.log('ceshi--2', this._mHead)
        if (!this._mHead) {
            this._mHead = item;
            this.listNode.addChild(item)
            this._mLast = this._mHead;
            this._mLast.mNextRole = this._mHead;
            this._mHead.mForeRole = this._mHead;
            this._mCurrentRole = this._mHead;
            this._mRoleNum++;
            this._mCurrentRole.mPositionIndex = this._mRoleNum;
            this._mSelectRole = item;
        } else {
            this._mLast.mNextRole = item;
            item.mNextRole = this._mHead;
            item.mForeRole = this._mLast;
            this._mHead.mForeRole = item;
            this.listNode.addChild(item);
            this._mLast = item;
            this._mRoleNum++;
            item.mPositionIndex = this._mRoleNum;
        }
        let x, y, t;
        // console.log('偏移量---', this._mCircleA, this._mCircleB)
        while (1) {
            t = 360 / this._mRoleNum * (this._mCurrentRole.mPositionIndex - 1) - 90;
            t = t * Math.PI / 180;
            x = this._mCircleA * Math.cos(t);
            y = this._mCircleB * Math.sin(t);
            this._mCurrentRole.x = x;
            this._mCurrentRole.y = y;
            // console.log('cos--1', Math.cos(t))
            // console.log('sin--2', Math.sin(t))
            this._mCurrentRole = this._mCurrentRole.mNextRole;
            if (this._mCurrentRole == this._mHead) break;
        }
    },

    //从右向左
    _changeToNext() {
        this._mSelectRole = this._mSelectRole.mNextRole;
        if (this._mCurrentRole.mNextRole) {
            this._mSelectRole.zIndex = this._mRoleNum;
            for (let i = 0; i < this._mRoleNum; i++) {
                this._mCurrentRole.mNextPositionX = this._mCurrentRole.mForeRole.x;
                this._mCurrentRole.mNextPositionY = this._mCurrentRole.mForeRole.y;
                this._mOnAction = true;
                let moveToNext = cc.moveTo(0.4, cc.v2(this._mCurrentRole.mNextPositionX, this._mCurrentRole.mNextPositionY))
                let scaleToFore = cc.scaleTo(0.4, this._mCurrentRole.mForeRole.scale)
                let spawnAction = cc.spawn(moveToNext, scaleToFore)
                let actions = cc.sequence(spawnAction, cc.callFunc(() => {
                    this._zOdersSyncCallback();
                }), cc.callFunc(() => {
                    this._actionEnd();
                }));
                this._mCurrentRole.runAction(actions);
                this._mCurrentRole = this._mCurrentRole.mNextRole;
            }
            this._distancesSync();
            this._colorSync();
        }
        // console.log("当前展示", this._mCurrentRole);
    },

    _zOdersSyncCallback() {
        this._zOrdersSync();
    },

    _actionEnd() {
        this._mOnAction = false;
    },

    //从左向右
    _changeToFore() {
        this._mSelectRole = this._mSelectRole.mForeRole;
        if (this._mCurrentRole.mForeRole) {
            for (let i = 0; i < this._mRoleNum; i++) {
                this._mCurrentRole.mNextPositionX = this._mCurrentRole.mNextRole.x;
                this._mCurrentRole.mNextPositionY = this._mCurrentRole.mNextRole.y;
                this._mOnAction = true;
                let moveToFore = cc.moveTo(0.4, cc.v2(this._mCurrentRole.mNextPositionX, this._mCurrentRole.mNextPositionY))
                let scaleToFore = cc.scaleTo(0.4, this._mCurrentRole.mNextRole.scale)
                let spawnAction = cc.spawn(moveToFore, scaleToFore);
                let actions = cc.sequence(spawnAction, cc.callFunc(() => {
                    this._actionEnd();
                }));
                this._mCurrentRole.runAction(actions);
                this._mCurrentRole = this._mCurrentRole.mNextRole;
            }
            this._distancesSync();
            this._zOrdersSync();
            this._colorSync();

        }
        // console.log("当前展示", this._mCurrentRole);
    },

    _isOnAction() {
        return this._mOnAction;
    },

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
    },

});
