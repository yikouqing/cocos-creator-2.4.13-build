const NNModel = require('./NNModel');
const ApiNn = require('./ApiNn');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiRoom = require('../../../src/api/ApiRoom');

cc.Class({
    extends: cc.Component,

    properties: {
        testItem: cc.Prefab,
        userList: cc.Node,
        _userTrades: null,
        _winRate: 40
    },

    onLoad() {
        MessageCallback.addListener('GameMessagePush', this);
        ApiRoom.gameMessageNotify(ApiNn.getGetTestCardsNotify());
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    loadList(list) {
        if (!list) return;
        this._userTrades = list;
        this.userList.destroyAllChildren();
        let users = NNModel.getPlayerTakeSeats();
        users.forEach((user) => {
            let CurObj = list[user.userInfo.uid];
            let item = cc.instantiate(this.testItem);
            this.userList.addChild(item);
            user.winRate = CurObj && !!CurObj.winrate ? 100 : 0;
            user.Cards = CurObj && CurObj.Cards ? CurObj.Cards : [];
            if (item.getComponent("NNTestUserItem")) {
                item.getComponent("NNTestUserItem").bind(user);
            }
        });
    },

    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            switch (msg.type) {
                case ApiNn.GAME_SUBSTRATUM_TRADE_CARDS_PUSH:
                    // console.log(msg.data)
                    if (msg.data.trust.type != 1) return;
                    ApiRoom.gameMessageNotify(ApiNn.getGetTestCardsNotify());
                    break;
                case ApiNn.GAME_INQTIRE_ARRCARDS_PUSH:
                    this.loadList(msg.data.SubstratumTradeCards);
                    break;
                default:
                    break;
            }
        }
    },

    onBtnClick(event) {
        switch (event.target.name) {
            case "btn_enter":
                ApiRoom.gameMessageNotify(ApiNn.gameSubstratumTradeCardsNotify(NNModel.getMyChairID(), 100));
                break;
            case "btn_close":
                ApiRoom.gameMessageNotify(ApiNn.gameSubstratumTradeCardsNotify(NNModel.getMyChairID(), 0));
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
    },

    onClose() {
        this.node.destroy();
    },

});