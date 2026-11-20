const ApiLsmj = require('../ApiLsmj');
const LSMJModel = require('../LSMJModel');
const LSMJLogic = require('../LSMJLogic');

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
    updateOptTiles(cards, arrow = true) {
        if (!cards || cards.length == 0) return;
        this.node.active = true;
        for (let i = 0; i < cards.length; i++) {
            const opt = cards[i];
            let list = [];
            list = opt.plusInfo.cardList;
            let opCardIndex = list.findIndex(card => card == opt.card);
            if (opCardIndex != -1) {
                list.splice(opCardIndex, 1);
                list.push(opt.card);
            }
            let tiles = this._tileMgrList[i];
            if (!tiles) tiles = this.getNewOptNode(i);
            // console.log("更新的牌==", list)
            tiles[0].node.parent.active = true;
            let opt_txt_tip = cc.find("opt_tip/txt_tip", tiles[0].node.parent);
            let opt_laiZiCards = list.filter(card => LSMJModel.isLaiZiCard(card));
            if (!!opt_txt_tip) {
                let showTipOptFilter = [ApiLsmj.operateType.GANG_ZHI, ApiLsmj.operateType.GANG_CHI, ApiLsmj.operateType.GANG_BU];
                if (!!showTipOptFilter.includes(opt.operate) && opt_laiZiCards.length > 0) {
                    let laiZiCards = LSMJModel.getGhostCard();
                    let opt_tip = "";
                    laiZiCards.forEach(card => {
                        let laiZiList = opt_laiZiCards.filter(laiZiCard => laiZiCard == card);
                        if (laiZiList.length > 0) {
                            let color_list = ['万', '筒', '鸡'];
                            let color = LSMJLogic.getCardColor(card);
                            opt_tip += `${laiZiList.length}${color_list[color]}`
                        }
                    });
                    opt_txt_tip.getComponent(cc.Label).string = opt_tip;
                    opt_txt_tip.parent.active = true;
                } else {
                    opt_txt_tip.getComponent(cc.Label).string = "";
                    opt_txt_tip.parent.active = false;
                }
            }
            for (let j = 0; j < tiles.length; j++) {
                const com = tiles[j];
                if (list[j]) {
                    com.flower = list[j];
                    com.setNodeShow(true);
                    com.setCover(false);
                } else {
                    com.setNodeShow(false);
                }
                if ((opt.operate == ApiLsmj.operateType.GANG_ZHI && j != 3)) { //补杠
                    com.setCover(true);
                }
            }

            /**展示操作方向标记 */
            let qiOperateUid = opt.plusInfo.qiOperateUid
            if (qiOperateUid) {
                let img_provide_point = cc.find("img_provide_point", tiles[0].node.parent)
                if (opt.operate == ApiLsmj.operateType.GANG_BU || opt.operate == ApiLsmj.operateType.GANG_ZHI) {
                    img_provide_point.active = false
                } else {
                    let qiIdx = LSMJModel.getUserIndexByUID(qiOperateUid);
                    let optIdx = LSMJModel.getUserIndexByUID(opt.uid);
                    let chairCount = LSMJModel.getChairCount()
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
                    if (!!arrow) img_provide_point.angle = angles[optIdx][qiIdx]
                    img_provide_point.active = !!arrow;
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
            let scom = tile.addComponent('LSMJSingleTile');
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