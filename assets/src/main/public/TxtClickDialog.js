const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
cc.Class({
    extends: cc.Component,

    properties: {
        Parent: cc.Node,
    },

    start() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onClickTime, this)
        this.node.on(cc.Node.EventType.TOUCH_END, this.onClickTimeEnd, this)
    },


    onClickTime() {
        // 按下的时间
        this.time = new Date;
        this.noeTime = this.time.getTime();

        this.schedule(() => {
            // 计算松开和按下的时间差
            var currentTime = new Date().getTime();
            if (currentTime - this.noeTime > 1000) { // 长按的定义是超过1000毫秒
                // 显示的内容
                let string = this.node.getComponent(cc.Label).string
                let pos = this.node.getPosition();
                AssetsManager.createDialog({
                    path: 'prefab/inter/OnClickDialog ',
                    pos: pos,
                    string: string,
                    parent: this.Parent

                })
                // 取消计时器
                this.unscheduleAllCallbacks();
            }
        }, 1);




    },


    onClickTimeEnd() {

    },


});