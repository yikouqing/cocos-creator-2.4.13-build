
cc.Class({
    extends: cc.Component,

    properties: {
        liePfb: cc.Prefab, //平摊的牌
        lieLayout: cc.Node,
        /**手牌脚本列表 */
        _lieTileList: null,
        /**手牌id列表 */
        _tileIdList: null,
    },


    onDestroy() { },

    /**初始化 只能调用一次 */
    init() {
        this._lieTileList = []
        this._tileIdList = []
        for (let i = 0; i < 20; i++) {
            let lie = cc.instantiate(this.liePfb)
            let lcom = lie.addComponent('TTZSingleTile')
            lcom.init()
            lcom.setNodeShow(false)
            this._lieTileList.push(lcom)
            lie.name = i + ""
            lie.parent = this.lieLayout
        }
    },

    /**
     * 刷新摊开的牌
     * @param {Array} tileArr 手牌数组
     */
    updateLieTiles(tileArr = []) {
        this._tileIdList = tileArr
        this.lieLayout.active = true
        this.node.active = true
        for (let i = 0; i < this._lieTileList.length; i++) {
            const com = this._lieTileList[i];
            const t = tileArr[i];
            if (t || t == 0) {
                com.flower = t
                com.setNodeShow(true)
                com.setNodeOpacity(255)
            } else {
                com.setNodeShow(false)
            }
        }
    },

    /**设置所有手牌的隐藏和显示 */
    setAllCardShow(isShow) {
        this._lieTileList.forEach(com => {
            com.setNodeShow(isShow)
        });
    },

    reset() {
        this.setAllCardShow(false)
    },



    // update (dt) {},
});