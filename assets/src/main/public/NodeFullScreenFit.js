const CCUtil = require('../../utils/CCUtil');

cc.Class({
    extends: cc.Component,

    start() {
        //须确保初始设计图大于或等于设计尺寸
        if (this.node.getComponent(cc.Widget)) this.node.removeComponent(cc.Widget);
        let designSize = cc.view.getDesignResolutionSize();
        let designRate = designSize.width / designSize.height;
        let nodeSize = this.node.getContentSize();
        let deviceSize = cc.sys.isBrowser ? cc.view.getCanvasSize() : cc.view.getFrameSize();
        let deviceRate = deviceSize.width / deviceSize.height;
        let fitHeight = deviceRate >= designRate;
        let fitRate = 1;
        if (!!fitHeight) {
            fitRate = deviceSize.width / (nodeSize.width * (deviceSize.height / designSize.height));
        } else {
            fitRate = deviceSize.height / (nodeSize.height * (deviceSize.width / designSize.width));
        }
        this.node.scale = fitRate < 1 ? 1 : fitRate;
    },
});