const CCUtil = require('../../utils/CCUtil');
const NativeUtil = require('../../utils/NativeUtil');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    start() {
        let widget = this.node.getComponent(cc.Widget),
            offset = CCUtil.getFixWidget();
        if (!widget) return;
        //设置只适配一次
        widget.alignMode = cc.Widget.AlignMode.ONCE;
        let frameSize = cc.sys.isBrowser ? cc.view.getCanvasSize() : cc.view.getFrameSize();
        if (frameSize.width >= frameSize.height) {
            if (widget.isAlignLeft) {
                widget.left += offset;
            }
            if (widget.isAlignRight) {
                widget.right += offset;
            }
            widget.updateAlignment();
        } else {
            if (widget.isAlignTop) {
                widget.top += offset;
            }
            if (widget.isAlignBottom) {
                widget.bottom += offset;
            }
            widget.updateAlignment();
        }
    }

});