const ApiFxj = require('../ApiFxj');

cc.Class({
    extends: cc.Component,

    properties: {
        optPfb: cc.Prefab,
        /**本地位置号 */
        _idx: null,
        /**手牌脚本列表 */
        _tileMgrList: null,
        /**鬼牌列表 */
        _ghostList: [],
    },

    /**初始化*/
    init(idx, ghostList) {
        if (this._idx == null) {
            this._idx = idx
            this._ghostList = ghostList
        } else {
            // console.log("已经初始化过了")
            return
        }
        this._tileMgrList = []
        this.node.active = false
    },

    /**更新操作手牌 */
    updateOptTiles(optArr) {
        if (!optArr || optArr.length == 0) {
            return
        }
        this.node.active = true
        for (let i = 0; i < optArr.length; i++) {
            const opt = optArr[i];
            let list = []
            if (opt.operate == ApiFxj.operateType.PENG) {
                list = [opt.card, opt.card, opt.card]
            } else {
                list = opt.plusInfo.cardList
            }
            let tiles = this._tileMgrList[i]
            if (!tiles) {
                tiles = this.getNewOptNode(i)
            }
            if (list.length == 4) {
                let tmp = []
                list.forEach(t => {
                    if (this._ghostList.includes(t)) {
                        tmp.unshift(t)
                    } else {
                        tmp.push(t)
                    }
                });
                list = tmp
            }
            // console.log("更新的牌==", list)
            tiles[0].node.parent.active = true
            for (let j = 0; j < tiles.length; j++) {
                const com = tiles[j];
                if (list[j]) {
                    com.flower = list[j]
                    com.setNodeShow(true)
                    com.setCover(false)
                    com.setGhostIcon(this._ghostList.includes(list[j]))
                } else {
                    com.setNodeShow(false)
                }
                if (opt.operate == ApiFxj.operateType.GANG_ZHI && (j == 1 || j == 2)) { //暗杠
                    com.setCover(true)
                }
            }
        }
    },

    /**获取一组新的操作牌 */
    getNewOptNode(i) {
        this._tileMgrList[i] = []
        let opt = cc.instantiate(this.optPfb)
        opt.name = i + ""
        for (let j = 0; j < 4; j++) {
            let tile = cc.find("tile" + j, opt)
            let scom = tile.addComponent('FXJSingleTile')
            scom.init()
            scom.setNodeShow(false)
            this._tileMgrList[i].push(scom)
        }
        opt.parent = this.node
        return this._tileMgrList[i]
    },

    /**设置牌变灰 */
    setTileGary(tileId = -1) {
        this._tileMgrList.forEach(tlist => {
            tlist.forEach(t => {
                if (t.node.parent.active && t.node.active) {
                    t.setGray(t.flower === tileId)
                }
            })
        })
    },

    reset() {
        this.node.active = false
        this._tileMgrList.forEach(arr => {
            arr.forEach(t => {
                t.node.parent.active = false
                t.setNodeShow(false)
            })
        })
    },



    // update (dt) {},
});