const SubManager = require('../../utils/SubManager');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require('../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        btnItem: cc.Node,
        layout: cc.Node,
        _data: null,
        _curIndex: null
    },

    onLoad() {
        this.btnItem.active = false
        this.node.on("click", () => {
            this.node.destroy()
        }, this)
    },

    onDestroy() {
        cc.systemEvent.emit("guanbixialakuang")
    },

    /**
     * 初始化
     * @param {object} data 数据
     * @param {cc.Node} scrollNode 滑动框
     * @param {cc.Node} targetNode 计算位置的目标节点
     * @param {number} curIndex 当前选择的key
     */
    init(data, scrollNode, targetNode, curIndex) {
        this._data = Utils.deepCopy(data)
        this._curIndex = curIndex
        let tarPos = CCUtil.postionConvert(targetNode, scrollNode) //计算在滑动区域的位置来确定layout的锚点
        // this.layout.anchorY = tarPos.y >= 0 ? 1 : 0 //滑动框的Y锚点为0.5
        this.layout.anchorY = (Math.abs(tarPos.y) >= (scrollNode.height / 2)) ? 0 : 1 //滑动框的Y锚点为1
        // console.log("layout的锚点===", this.layout.anchorY, tarPos.y)
        /**计算layout的实际位置 */
        let parentNode = AssetsManager.getRoot()
        this.node.parent = parentNode
        let parPos = CCUtil.postionConvert(targetNode, parentNode)
        if (this.layout.anchorY == 1) {
            parPos.y -= (targetNode.height / 2)
        } else {
            parPos.y += (targetNode.height / 2)
        }
        this.layout.setPosition(parPos)

        /**初始化列表 */
        for (const key in this._data) {
            if (Object.hasOwnProperty.call(this._data, key)) {
                if (key != 0) {
                    const str = this._data[key];
                    let btn = cc.instantiate(this.btnItem)
                    btn.parent = this.layout
                    btn.active = true
                    btn.x = 0
                    btn.name = key + ""
                    btn.getChildByName("bg").active = key == curIndex
                    btn.getChildByName("txt").getComponent(cc.Label).string = str
                    btn.on("click", this.onBtnClick, this)
                }
            }
        }
    },

    onBtnClick(event) {
        let node = event.node || event.target
        let index = parseInt(node.name)
        if (index != this._curIndex) {
            cc.systemEvent.emit("xialakuangSelect", index)
        }
        this.node.destroy()
    },
});