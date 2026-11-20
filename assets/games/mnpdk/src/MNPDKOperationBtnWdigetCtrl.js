cc.Class({
    extends: cc.Component,

    properties: {
        outCardNode: cc.Node,
        readyNode: cc.Node,
        /**鼓春按钮节点 */
        guchunNode: cc.Node,
        /**拉回来按钮节点 */
        lahuilaiNode: cc.Node,
    },

    onLoad() {
        this.clearWidget()
    },

    startReady() {
        this.outCardNode.active = false;
        this.readyNode.active = true;
    },

    startOutCard(isNewTurn, enablePass, bichu) {
        this.outCardNode.active = true;
        this.readyNode.active = false;
        // console.log("按钮显示", isNewTurn, enablePass, bichu, !isNewTurn && (enablePass || !bichu))
        this.outCardNode.getChildByName('buchu').active = !isNewTurn && (enablePass || !bichu);
        this.outCardNode.getChildByName('tip').active = !isNewTurn && !enablePass;
        this.outCardNode.getChildByName('outCard').active = !enablePass;
    },

    clearWidget() {
        this.outCardNode.active = false;
        this.readyNode.active = false;
        this.guchunNode.active = false;
        this.lahuilaiNode.active = false;
    },

    getClockNode() {
        let btnName = "selfClockNode"
        if (this.outCardNode.active) return this.outCardNode.getChildByName(btnName);
        if (this.readyNode.active) return this.readyNode.getChildByName(btnName);
        if (this.guchunNode.active) return this.guchunNode.getChildByName(btnName);
        if (this.lahuilaiNode.active) return this.lahuilaiNode.getChildByName(btnName);
        return null;
    },

    showGuChunNode() {
        this.clearWidget()
        this.guchunNode.active = true
    },

    showLaNode() {
        this.clearWidget()
        this.lahuilaiNode.active = true
    }
});