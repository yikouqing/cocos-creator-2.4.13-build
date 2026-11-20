const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const ApiQzsss = require('./ApiQzsss');

cc.Class({
    extends: cc.Component,

    properties: {
        pro_qiepai: cc.ProgressBar,
        txt_countDown: cc.Label,
        _countDown: 0,
        _timeCheck: 0,
        _isUpdate: false
    },

    onLoad() {
        let CardsNode = cc.find("CardsNode", this.node)
        CardsNode.children.forEach(node => {
            let com = node.addComponent('QZSSSCard')
            com.init()
        });
        this.txt_countDown.string = this.node.nodeParams.countDown
        this._countDown = parseInt(this.node.nodeParams.countDown)
        if (this._countDown > 0) {
            this._isUpdate = true
        }
    },

    start() {

    },

    onBtnClick(event, param) {
        switch (param) {
            case "move":
                this.pro_qiepai.progress = event.progress;
                break;
            case "enter":
                ApiRoom.gameMessageNotify(ApiQzsss.gameUserWashCardNotify());
                this.node.destroy()
                break;
            default:
                break;
        }
    },

    update(dt) {
        if (this._isUpdate) {
            this._timeCheck += dt
            if (this._timeCheck >= 1) {
                this._timeCheck = 0
                this._countDown--
                this.txt_countDown.string = this._countDown + ""
                if (this._countDown <= 0) {
                    this._isUpdate = false
                    this.node.destroy()
                }
            }
        }
    },
});