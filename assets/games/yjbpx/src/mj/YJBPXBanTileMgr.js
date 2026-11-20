const YJBPXLogic = require('../YJBPXLogic');
const YJBPXModel = require('../YJBPXModel');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const Enums = require('../../../../src/const/Enums');
const ApiYjbpx = require('../ApiYjbpx');
const ApiRoom = require('../../../../src/api/ApiRoom');
const CCUtil = require('../../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        tilePfb: cc.Prefab,
        gangLay: cc.Node,
        huLay: cc.Node,
        _idx: -1,
        _tileComList: [],
    },

    init(idx) {
        this._idx = idx;
        this.gangLay.active = false;
        this.huLay.active = false;
    },

    getNewTile(parentNode) {
        let tile = cc.instantiate(this.tilePfb);
        tile.parent = parentNode;
        let comp = tile.addComponent("YJBPXSingleTile");
        comp.init();
        comp.setNodeShow(true);
        return comp;
    },

    setBanMaShowAll(banMaList) {
        let gangIdx = 0
        let setNode = (idx, layout, tileId) => {
            let node = layout.children[idx]
            if (node) {
                let com = node.getComponent("YJBPXSingleTile")
                com.flower = tileId
                com.setNodeShow(true)
                com.setNodeOpacity(255)
            } else {
                let com = this.getNewTile(layout)
                com.flower = tileId
            }
        }

        for (let i = 0; i < banMaList.length; i++) {
            const banMaInfo = banMaList[i];
            let opt = banMaInfo.type;
            let showId = banMaInfo.TouCard
            let lay = this.gangLay.getChildByName("lay")
            if (YJBPXModel.optCheck(opt) == 1) {
                this.gangLay.active = true
                setNode(gangIdx, lay, showId)
                gangIdx++
            } else if (YJBPXModel.optCheck(opt) == 2) {
                lay = this.huLay.getChildByName("lay")
                this.huLay.active = true
                setNode(0, lay, showId)
            }
        }


    },

    /**设置杠或者胡翻牌显示 */
    setBanMaShow(banMaInfo, ainNode = null) {
        let opt = banMaInfo.type;
        let showId = banMaInfo.TouCard
        let lay = this.gangLay.getChildByName("lay")
        if (YJBPXModel.optCheck(opt) == 1) {
            this.gangLay.active = true
        } else if (YJBPXModel.optCheck(opt) == 2) {
            lay = this.huLay.getChildByName("lay")
            this.huLay.active = true
        }
        /**按顺序查找容器里面的没有显示的牌，如果所有牌都已经显示了，新建一张牌 */
        let showNode = null
        for (let i = 0; i < lay.children.length; i++) {
            const node = lay.children[i];
            if (!node.active) {
                showNode = node
                let com = node.getComponent("YJBPXSingleTile")
                com.flower = showId
                com.setNodeShow(true)
                com.setNodeOpacity(255)
                break;
            }
        }
        if (!showNode) {
            let com = this.getNewTile(lay)
            showNode = com.node
            com.flower = showId
        }

        this.node.getComponent(cc.Layout).updateLayout()
        lay.getComponent(cc.Layout).updateLayout()

        /**播放翻牌动画 */
        if (cc.isValid(ainNode)) {
            showNode.opacity = 0
            let url = "res/prefab/mj/lieTile0"
            AssetsManager.loadAsset({
                path: url,
                aType: cc.Prefab,
                bundle: Enums.bundleType.YJBPX
            }, (pfb) => {
                if (!pfb) {
                    showNode.opacity = 255
                    console.error("load pfb err,url=", url)
                    return
                }
                let flyNode = cc.instantiate(pfb)
                flyNode.parent = ainNode
                let endPos = CCUtil.postionConvert(showNode, ainNode)
                let flyCom = flyNode.addComponent("YJBPXSingleTile")
                flyCom.init()
                flyCom.flower = showId
                flyCom.setNodeShow(true)
                flyCom.setCover(true)
                // console.log("flyNode=", endPos.x, endPos.y, flyNode.scale, flyNode.opacity, flyNode.position, flyNode.active)
                cc.tween(flyNode).to(0.1, { scale: 2 }).to(0.1, { scale: 1.7 })
                    .call(() => { flyCom.setCover(false) }).delay(0.2)
                    .to(0.5, { position: endPos, scale: 0.5 })
                    .call(() => {
                        showNode.opacity = 255
                        flyNode.destroy()
                    }).start()
            })
        }
    },

    reset() {
        this.gangLay.active = false;
        this.huLay.active = false;
        let gangList = this.gangLay.getChildByName("lay").children;
        let huList = this.huLay.getChildByName("lay").children;
        let hideTiles = (list) => {
            list.forEach(node => {
                node.active = false
            });
        }
        hideTiles(gangList)
        hideTiles(huList)
    },
});