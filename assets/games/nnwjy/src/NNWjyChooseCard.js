
const AssetsManager = require('../../../src/utils/AssetsManager');
const NNWjyModel = require('./NNWjyModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiNnWjy = require('./ApiNnWjy');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        chooseItem: [require('NNWjyChooseCardItem')],

        _cardId: null
    },

    start() {
        MessageCallback.addListener('RoomMessagePush', this);
        MessageCallback.addListener('GameMessagePush', this);
        cc.systemEvent.on('OnNiuNiuChooseFoldCard', this._sync, this);
        this._init();
    },

    _init() {
        let cards = NNWjyModel.getHandCardsByChairID(NNWjyModel.getMyChairID());
        if (!cards) {
            AssetsManager.tipDialog('选牌初始化失败~');
            this.onDestroy.destroy();
            return;
        }
        this.chooseItem.forEach((card, index) => {
            card.bind(cards[index]);
        });
    },

    _sync(card) {
        this._cardId = card;
    },

    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.node.destroy();
            }
        } else if (route === 'GameMessagePush') {
            if (msg.type === ApiNnWjy.GAME_STATUS_PUSH) {
                this.node.destroy();
            } else if (msg.type === ApiNnWjy.GAME_OPERATE_CARDS_PUSH
                || msg.type === ApiNnWjy.GAME_RUFFIAN_RECORD_PUSH) {
                if (msg.data.chairID != NNWjyModel.getMyChairID()) return;
                this.node.destroy();
            } else if (msg.type === ApiNnWjy.GAME_RESULT_PUSH) {
                this.node.destroy();
            } else if (msg.type === ApiNnWjy.GAME_END_PUSH) {
                this.node.destroy();
            }
        }
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
        MessageCallback.removeListener('RoomMessagePush', this);
        cc.systemEvent.off('OnNiuNiuChooseFoldCard', this._sync, this);
    },

    onSubmit() {
        if (!this._cardId) {
            AssetsManager.tipDialog('请选择不要的牌~');
            return;
        }
        ApiRoom.gameMessageNotify(ApiNnWjy.gameOperateCardsNotify(this._cardId));
    },

});
