const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiCnjj = require('./ApiCnjj');

cc.Class({
    extends: cc.Component,

    properties: {
        _operateList: null
    },

    onLoad() {
        if (!this.node.nodeParams || !this.node.nodeParams.operateList || this.node.nodeParams.operateList.length != 2) {
            this.node.destroy()
            return
        }
        this._operateList = this.node.nodeParams.operateList
        CCUtil.nodeRecursive(this.node, (node) => {
            if (node.getComponent(cc.Button)) {
                node.on("click", this.onButtonClick, this)
            }
        })
    },

    onButtonClick(event) {
        let node = event.node || event.target
        switch (node.name) {
            case "btn_jx":
                ApiRoom.gameMessageNotify(ApiCnjj.gameBankerChooseNotify(this._operateList[1]))
                break;
            case "btn_xz":
                ApiRoom.gameMessageNotify(ApiCnjj.gameBankerChooseNotify(this._operateList[0]))
                break;
        }
        this.node.destroy()
    }
});