const SGModel = require('./SGModel');
const ApiSg = require('./ApiSg');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        _winRate: 40
    },

    onLoad() {
        MessageCallback.addListener('GameMessagePush', this);
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            switch (msg.type) {
                case ApiSg.GAME_SUBSTRATUM_TRADE_CARDS_PUSH:
                    let str = msg.data.trust ? "设置成功" : "设置失败，请稍后重试"
                    AssetsManager.tipDialog(str);
                    if (msg.data.trust) {
                        this.node.destroy();
                    }
                    break;
                default:
                    break;
            }
        }
    },

    onBtnClick(event) {
        switch (event.target.name) {
            case "btn_enter":
                ApiRoom.gameMessageNotify(
                    ApiSg.gameSubstratumTradeCardsNotify(SGModel.getMyChairID(), 100));
                break;
            case "btn_close":
                ApiRoom.gameMessageNotify(
                    ApiSg.gameSubstratumTradeCardsNotify(SGModel.getMyChairID(), 0));
                break;
            case "mask":
                this.node.destroy()
                break
            case "40":
            case "60":
            case "80":
            case "100":
                if (event.isChecked) {
                    this._winRate = parseInt(event.target.name)
                }
                break;
            default:
                break;
        }
    }
});