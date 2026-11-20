const Enums = require('../../../src/const/Enums');
const BRNNModel = require("./BRNNModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiBrnn = require('./ApiBrnn');
const CCUtil = require("../../../src/utils/CCUtil")
const Utils = require("../../../src/utils/Utils")

cc.Class({
    extends: cc.Component,

    properties: {
        btnChipPfb: cc.Prefab,
        chipLay: cc.Node,
        _chipList: [],
    },

    onLoad() {
        cc.systemEvent.on("betOnceSucss", this.updateChipInteractable, this)
    },
    onDestroy() {
        cc.systemEvent.off("betOnceSucss", this.updateChipInteractable, this)
    },

    init(data) {
        this.chipLay.removeAllChildren()
        this._chipList = Utils.deepCopy(BRNNModel.getGameRuleByKey("pourRate"))
        let baseScore = BRNNModel.getGameRuleByKey("baseScore")
        for (let i = 0; i < this._chipList.length; i++) {
            this._chipList[i] *= baseScore //这里根据底分进行变化
            let chipNum = this._chipList[i]

            let chipNode = cc.instantiate(this.btnChipPfb)
            chipNode.parent = this.chipLay
            AssetsManager.loadSpriteFrame({
                path: "res/sprite/chips/" + i,
                sprite: chipNode.getComponent(cc.Sprite),
                bundle: Enums.bundleType.BRNN,
            });
            let txt = cc.find("txt_chipNum", chipNode).getComponent(cc.Label)
            txt.string = chipNum + ""
            chipNode.name = i + ""
            chipNode.on("click", this.btnClickCallFunc, this)
            cc.find("selectAni", chipNode).active = false
        }
        this.updateChipInteractable(true)
    },

    /**根据自己的积分切换按钮状态 */
    updateChipInteractable(isInit = false) {
        let myScore = parseInt(BRNNModel.getMyScore())
        let selectChipNum = BRNNModel.getSelectChip()
        let maxIdx = null //当下最大的筹码
        let isChange = false //是否需要变化选择
        let childrenList = this.chipLay.children
        childrenList.forEach(node => {
            let idx = parseInt(node.name)
            let chipNum = this._chipList[idx]
            let canClick = chipNum <= myScore
            // console.log("set interactable==", chipNum, myScore, canClick)
            node.getComponent(cc.Button).interactable = canClick
            if (canClick) {
                maxIdx = idx
            }
            if (!canClick && selectChipNum == chipNum) {
                isChange = true
            }
        });

        /**设置选择动画的显示和更新已经选择的筹码 */
        for (let i = 0; i < childrenList.length; i++) {
            const chip = childrenList[i];
            cc.find("selectAni", chip).active = false
        }
        for (let i = 0; i < childrenList.length; i++) {
            const chip = childrenList[i];
            let chipIdx = parseInt(chip.name)
            let chipNum = this._chipList[chipIdx]
            let show = (chipIdx == maxIdx && isChange) || (!isChange && (selectChipNum == chipNum || chipIdx == maxIdx || (i == childrenList.length - 1 && !isShowed)))
            // console.log("按钮显示", chip.name, chipIdx, maxIdx, isChange, selectChipNum, chipNum, i, show)
            cc.find("selectAni", chip).active = show
            if (show) {
                BRNNModel.setSelectChip(chipNum)
                break;
            }
        }
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        let node = event.node || event.target
        // console.log("点击了按钮", node.name)
        this.chipLay.children.forEach(chip => {
            cc.find("selectAni", chip).active = chip.name == node.name
        });
        let idx = parseInt(node.name)
        BRNNModel.setSelectChip(this._chipList[idx])
    },
});