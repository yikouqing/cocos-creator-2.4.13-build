cc.Class({
    extends: cc.Component,

    properties: {
        outCardNode: cc.Node,
        btn_tip: cc.Button,
        btn_pass: cc.Button,
        btn_out: cc.Button,
        clock: cc.Node,
    },

    gameInit() {

    },

    showOptNode(isShow, onlyPass = false) {
        this.outCardNode.active = isShow

        this.btn_out.node.active = !onlyPass
        this.btn_tip.node.active = !onlyPass
    },

    /**显示闹钟 */
    setClock(clockNode = null) {
        if (!clockNode) {
            this.clock.removeAllChildren()
        } else {
            this.clock.addChild(clockNode)
        }
    },
});