const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager')
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        bureau: cc.Label,
        itemContent: cc.Node
    },

    onLoad() {
        this.curIndex = 0;
        this.list = this.node.nodeParams.list;
        // console.log("数据==", this.list)
        this.refrushLayout();
    },

    refrushLayout() {
        this.bureau.string = this.curIndex + 1;
        let resultData = this.list[this.curIndex];
        this.itemContent.removeAllChildren();
        let allCardArr = resultData.allCardArr;
        let handCardArr = resultData.allHandCards;
        let item = cc.find('Item', this.node);
        for (let i = 0; i < resultData.nicknameArr.length; ++i) {
            if (resultData.nicknameArr[i] == null) {
                continue;
            }
            let node = cc.instantiate(item);
            node.parent = this.itemContent;
            node.active = true;
            let nameLabel = cc.find('name', node).getComponent(cc.Label);
            nameLabel.string = Utils.convertNickname(resultData.nicknameArr[i]);
            let idLabel = cc.find('id', node).getComponent(cc.Label);
            let id = resultData.idArr[i] || ""
            idLabel.string = 'ID:' + (id != UserModel.getData("uid") ? Utils.stringSecurity(id) : id);
            let headSprite = cc.find('head', node).getComponent(cc.Sprite);
            AssetsManager.loadSpriteFrame({
                path: resultData.headArr[i],
                sprite: headSprite
            });
            let card = cc.find('Card', node);
            for (let j = 0; j < handCardArr[i].length; ++j) {
                let handCardTemp = handCardArr[i];
                let cards = handCardTemp[j].concat([0]);
                let leftCards = allCardArr[i];
                for (let k = 0; k < cards.length; ++k) {
                    if (cards[k] == 0 || !cards[k]) continue;
                    let cardNode = cc.instantiate(card);
                    cardNode.active = true;
                    cardNode.y = 0;
                    AssetsManager.loadSpriteFrame({
                        path: 'sprite/cards/' + cards[k],
                        sprite: cardNode.getComponent(cc.Sprite)
                    });
                    cardNode.color = leftCards.indexOf(cards[k]) == -1 ? cc.Color.GRAY : cc.Color.WHITE;
                    this.scheduleOnce(() => {
                        cardNode.parent = cc.find('Layout', node);
                    }, 0.1)
                }
            }

            let gold = resultData.winArr[i];
            if (gold > 0) {
                let winLabel = cc.find('win', node).getComponent(cc.Label);
                winLabel.node.active = true;
                winLabel.string = '+' + (gold);
            } else {
                let loseLabel = cc.find('lose', node).getComponent(cc.Label);
                loseLabel.node.active = true;
                loseLabel.string = (gold);
            }

            let restLabel = cc.find('rest', node).getComponent(cc.Label);
            restLabel.string = '剩余牌数：' + resultData.allCardArr[i].length;

            let bombLabel = cc.find('bomb', node).getComponent(cc.Label);
            bombLabel.string = '炸弹数：' + resultData.bombArr[i];

            cc.find('icon', node).active = (resultData.winChairID == i);
        }
    },

    onBtnClick(event, parameters) {

        if (parameters === 'left') {
            --this.curIndex;
            if (this.curIndex < 0) {
                this.curIndex = this.list.length - 1;
            }
            this.refrushLayout();
        } else if (parameters === 'right') {
            ++this.curIndex;
            if (this.curIndex >= this.list.length) {
                this.curIndex = 0;
            }
            this.refrushLayout();
        } else if (parameters === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        }
    }
});