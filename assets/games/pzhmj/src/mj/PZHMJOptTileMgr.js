const ApiPzhmj = require('../ApiPzhmj');
const PZHMJModel = require('../PZHMJModel');
const UserModel = require('../../../../src/model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        optPfb: cc.Prefab,
        /**本地位置号 */
        _idx: null,
        /**手牌脚本列表 */
        _tileMgrList: null,
    },

    /**初始化*/
    init(idx) {
        if (this._idx == null) {
            this._idx = idx;
        } else {
            // console.log("已经初始化过了")
            return;
        }
        this._tileMgrList = [];
        this.node.active = false;
    },

    /**更新操作手牌 */
    updateOptTiles(cards) {
        if (!cards || cards.length == 0) return;
        this.node.active = true;
        for (let i = 0; i < cards.length; i++) {
            const opt = cards[i];
            let list = [];
            if (opt.operate == ApiPzhmj.operateType.PENG) {
                list = [opt.card, opt.card, opt.card]
            } else {
                list = opt.plusInfo.cardList;
            }
            let tiles = this._tileMgrList[i];
            if (!tiles) {
                tiles = this.getNewOptNode(i);
            }
            tiles[0].node.parent.active = true;
            let tmp = UserModel.getData("isTest")
            for (let j = 0; j < tiles.length; j++) {
                const com = tiles[j];
                if (list[j]) {
                    com.flower = list[j];
                    com.setNodeShow(true);
                    com.setCover(false);
                } else {
                    com.setNodeShow(false);
                }
                if (opt.operate == ApiPzhmj.operateType.GANG_ZHI && opt.card != -1) { //暗杠
                    if (!!tmp) {
                        if (j == 3) {
                            com.setCover(true)
                        }
                    } else {
                        if ((this._idx == 0 && j == 3) || this._idx != 0) {
                            com.setCover(true);
                        }
                    }
                }
            }

            /**展示操作方向标记 */
            let qiOperateUid = opt.plusInfo.qiOperateUid
            if (qiOperateUid) {
                let img_provide_point = cc.find("img_provide_point", tiles[0].node.parent)
                if (opt.operate == ApiPzhmj.operateType.GANG_BU || opt.operate == ApiPzhmj.operateType.GANG_ZHI) {
                    img_provide_point.active = false
                } else {
                    let qiIdx = PZHMJModel.getUserIndexByUID(qiOperateUid);
                    let optIdx = PZHMJModel.getUserIndexByUID(opt.uid);
                    let chairCount = PZHMJModel.getChairCount()
                    let angles = [
                        [0, -90, 0, 90],
                        [180, 0, 0, 90],
                        [180, -90, 0, 90],
                        [180, -90, 0, 0],
                    ]
                    if (chairCount == 2) {
                        angles = [
                            [0, 0],
                            [180, 0]
                        ]
                    } else if (chairCount == 3) {
                        angles = [
                            [0, -90, 90],
                            [180, 0, 90],
                            [180, -90, 0]
                        ]
                    }
                    img_provide_point.angle = angles[optIdx][qiIdx]
                    img_provide_point.active = true
                }
            }
        }
    },

    /**获取一组新的操作牌 */
    getNewOptNode(i) {
        this._tileMgrList[i] = [];
        let opt = cc.instantiate(this.optPfb);
        opt.name = i + "";
        for (let j = 0; j < 4; j++) {
            let tile = cc.find("tile" + j, opt);
            let scom = tile.addComponent('PZHMJSingleTile');
            scom.init();
            scom.setNodeShow(false);
            this._tileMgrList[i].push(scom);
        }
        opt.parent = this.node;
        return this._tileMgrList[i];
    },

    /**设置牌变灰 */
    setTileGary(tileId = -1) {
        this._tileMgrList.forEach(tlist => {
            tlist.forEach(t => {
                if (t.node.parent.active && t.node.active) {
                    t.setGray(t.flower === tileId);
                }
            })
        })
    },

    reset() {
        this.node.active = false;
        this._tileMgrList.forEach(arr => {
            arr.forEach(t => {
                t.node.parent.active = false;
                t.setNodeShow(false);
            });
        });
    },
});