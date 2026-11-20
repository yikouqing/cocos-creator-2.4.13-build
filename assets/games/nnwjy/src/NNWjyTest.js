const NNWjyModel = require('./NNWjyModel');
const ApiNnWjy = require('./ApiNnWjy');
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
        ApiRoom.gameMessageNotify(ApiNnWjy.getGetTestCardsNotify());
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    loadList(list) {
        if (!list) return;
        this._userTrades = list;
        this.userList.destroyAllChildren();
        let users = NNWjyModel.getPlayerTakeSeats();
        users.forEach((user) => {
            let CurObj = list[user.userInfo.uid];
            let item = cc.instantiate(this.testItem);
            this.userList.addChild(item);
            user.winRate = CurObj && !!CurObj.winrate ? 100 : 0;
            user.Cards = CurObj && CurObj.Cards ? CurObj.Cards : [];
            if (item.getComponent("NNWjyTestUserItem")) {
                item.getComponent("NNWjyTestUserItem").bind(user);
            }
        });
    },

    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            switch (msg.type) {
                case ApiNnWjy.GAME_SUBSTRATUM_TRADE_CARDS_PUSH:
                    // console.log(msg.data)
                    if (msg.data.trust.type != 1) return;
                    ApiRoom.gameMessageNotify(ApiNnWjy.getGetTestCardsNotify());
                    break;
                case ApiNnWjy.GAME_INQTIRE_ARRCARDS_PUSH:
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
                ApiRoom.gameMessageNotify(ApiNnWjy.gameSubstratumTradeCardsNotify(NNWjyModel.getMyChairID(), 100));
                break;
            case "btn_close":
                ApiRoom.gameMessageNotify(ApiNnWjy.gameSubstratumTradeCardsNotify(NNWjyModel.getMyChairID(), 0));
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