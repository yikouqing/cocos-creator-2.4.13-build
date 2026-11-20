const CCUtil = require('../../utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {},
    /* --------------------------------segmentation-------------------------------- */
    start() {
        return
        if (!this.node.getComponent(cc.ScrollView) || !cc.isValid(this.node.getComponent(cc.ScrollView).content)) return;
        this.node.on("scrolling", this._updateOpacity, this);
        this.node.getComponent(cc.ScrollView).content.on(cc.Node.EventType.CHILD_ADDED, this._updateOpacity, this);
        this.node.getComponent(cc.ScrollView).content.on(cc.Node.EventType.CHILD_REMOVED, this._updateOpacity, this);
        this.node.getComponent(cc.ScrollView).content.on(cc.Node.EventType.CHILD_REORDER, this._updateOpacity, this);
    },

    /* 重叠检查 */
    _intersectCheck(node) {
        let scrollRect = CCUtil.getBoundingBoxToWorldWithoutChildren(this.node.getComponent(cc.ScrollView).content.parent);
        let nodeRect = CCUtil.getBoundingBoxToWorldWithoutChildren(node);
        // ------------------保险范围
        scrollRect.width += scrollRect.width * 0.5;
        scrollRect.height += scrollRect.height * 0.5;
        scrollRect.x -= scrollRect.width * 0.25;
        scrollRect.y -= scrollRect.height * 0.25;
        return scrollRect.intersects(nodeRect);
    },

    _updateOpacity() {
        this.node.getComponent(cc.ScrollView).content.children.forEach(v => {
            // console.log('Draw-Call', v.opacity);
            v.opacity = this._intersectCheck(v) ? 255 : 0;
        });
    },

});