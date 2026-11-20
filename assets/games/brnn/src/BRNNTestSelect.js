const ApiBrnn = require('./ApiBrnn');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const ApiHall = require('../../../src/api/ApiHall');
const AudioUtil = require('../../../src/utils/AudioUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Codes = require('../../../src/const/Codes');
const BRNNModel = require("./BRNNModel")
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');

cc.Class({
    extends: cc.Component,

    properties: {
        _pourIndex: 0,
        _isWin: 1,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        /**添加按钮事件 */
        CCUtil.nodeRecursive(this.node, (node) => {
            let tog = node.getComponent(cc.Toggle)
            let btn = node.getComponent(cc.Button)
            let eventName = ""
            if (tog) {
                eventName = "toggle"
            } else if (btn) {
                eventName = "click"
            }
            if (eventName != "") {
                node.on(eventName, this.onButtonClick, this)
            }
        })

        MessageCallback.addListener('GameMessagePush', this);
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            if (msg.type === ApiBrnn.GAME_GET_TEST_WIN_PUSH) {
                if (msg.data.isSuccess) {
                    AssetsManager.tipDialog("设置成功")
                    this.node.destroy()
                } else {
                    AssetsManager.tipDialog("设置失败,请稍候重试")
                }
            }
        }
    },


    onButtonClick(event) {
        let node = event.node || event.target
        // console.log("点击了按钮", node.name)
        let tog = node.getComponent(cc.Toggle)
        if (node.name.startsWith("index")) {
            this._pourIndex = parseInt(node.name.slice(5));
        } else if (node.name.startsWith("isWin")) {
            this._isWin = parseInt(node.name.slice(5));
            if (this._isWin == 2) {
                this._isWin = -1
            }
        } else if (node.name == "btn_cancel") {
            this.node.destroy()
        } else if (node.name == "btn_enter") {
            // console.log("发送了消息===", this._pourIndex, this._isWin)
            ApiRoom.gameMessageNotify(ApiBrnn.gameGetTestWinNotify(this._pourIndex, this._isWin));
        }
    },
});