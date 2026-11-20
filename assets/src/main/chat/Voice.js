const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
const NativeUtil = require('../../utils/NativeUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        voice: cc.Node,
        timeBar: cc.Node,
        maxTime: 15000,
        _touchTime: null,
    },

    init() {
        this.voice.active = false;
        this.timeBar.scaleX = 0.0;
    },

    send() {
        if (!!this._touchTime) {
            // console.log("停止并上传");
            NativeUtil.gvStopAndUploadRecord();
        } else {
            NativeUtil.gvStopRecord();
        }
        this._touchTime = null;
        this.voice.active = false;
    },

    on(time) {
        this._touchTime = time;
        this.voice.active = true;
        let root = AssetsManager.getRoot();
        let targetPos = CCUtil.postionConvert(root, this.node.parent);
        this.node.setPosition(targetPos);
        NativeUtil.gvStartRecord();
    },

    end(time) {
        if (time - this._touchTime < 1000) {
            AssetsManager.tipDialog('语音小于1秒,无法发送~');
            this.voice.active = false;
            this._touchTime = null;
            NativeUtil.gvStopRecord();
        } else {
            this.send();
        }
    },

    cancel() {
        AssetsManager.tipDialog('取消语音~');
        NativeUtil.gvStopRecord();
        this._touchTime = null;
        this.voice.active = false;
    },

    update(dt) {
        if (!!this._touchTime) {
            var time = Date.now() - this._touchTime;
            if (time >= this.maxTime) {
                this.send();
            } else {
                var percent = time / this.maxTime;
                this.timeBar.scaleX = 1 - percent;
            }
        }
    },
});