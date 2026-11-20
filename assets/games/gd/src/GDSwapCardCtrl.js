const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const GDModel = require('./GDModel');

cc.Class({
    extends: cc.Component,

    properties: {
        clock: cc.Node,

        show_opBtn: cc.Node,
        show_Swap: cc.Node,

        // Item_Cards: cc.Node,
        show_Resist: cc.Node,

        node_huan: cc.Node,
        node_jin: cc.Node,
        btn_jingong: cc.Button,
        btn_huangong: cc.Button,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this._pos_huan = this.node_huan.getPosition();
        this._pos_jin = this.node_jin.getPosition();
        this.jin = {
            uid: 0,
            cardID: 0,
        };
        this.fan = {
            uid: 0,
            cardID: 0,
        };
        this.clear();
    },

    showSwapBtn(type) {
        this.show_opBtn.active = true;
        this.show_Resist.active = false;
        this.clock.destroyAllChildren();
        this.btn_jingong.node.active = type;
        this.btn_huangong.node.active = !type;
        AssetsManager.loadAsset({
            path: 'res/prefab/GDClock',
            bundle: Enums.bundleType.GD,
            aType: cc.Prefab
        }, (item) => {
            if (!item || !cc.isValid(this.clock)) return;
            const clock = cc.instantiate(item);
            this.clock.addChild(clock);
        })
    },

    showBtnstate(state) {
        this.btn_jingong.interactable = state;
        this.btn_huangong.interactable = state;
    },

    hideSwapBtn() {
        this.show_opBtn.active = false;
    },

    /**显示换牌 */
    showSwapCard(userList, isAinm = false) {
        let Item_Cards = this.show_Swap.getChildByName("Item_Cards");
        let AllDatalist = GDModel.getonGameExchangelist();
        if (isAinm) {
            this.show_opBtn.active = false;
        }
        this.node_huan.destroyAllChildren();
        this.node_jin.destroyAllChildren();
        this.show_Swap.active = true;
        Item_Cards.active = false;
        this.node.active = true;
        let isMyJin = false;

        for (let index = 0; index < AllDatalist.length; index++) {
            let CurData = AllDatalist[index];
            let CurItem = cc.instantiate(Item_Cards);
            let operateType = parseInt(CurData.Cardstype || CurData.operateType || CurData.type);
            CurItem.getChildByName("spr_huan").active = operateType == 2;
            CurItem.getChildByName("spr_jin").active = operateType == 1;
            if (operateType == 1) {
                if (CurData.uid == GDModel.getMyUID()) {
                    isMyJin = true;
                }
                this.node_jin.addChild(CurItem);
            } else if (operateType == 2) {
                this.node_huan.addChild(CurItem);
            }
            CurItem.active = true;
            let cards = CurData.cards;
            let cardId = cards.length ? cards[0] : cards;
            AssetsManager.loadSpriteFrame({
                path: `sprite/cards/${cardId}`,
                sprite: CurItem.getComponent(cc.Sprite),
            });
        }
        this.node_jin.setPosition(isMyJin ? this._pos_jin : this._pos_huan);
        this.node_huan.setPosition(isMyJin ? this._pos_huan : this._pos_jin);
        if (isAinm && userList && userList.length) {
            let pos_jin = this.node_jin.getPosition();
            let pos_huan = this.node_huan.getPosition();
            let tween = (tweenNode, pos) => {
                if (!tweenNode || !pos) return;
                cc.tween(tweenNode)
                    .delay(0.5)
                    .to(0.5, {
                        position: pos
                    })
                    .start();
            }
            let showCards = () => {
                for (let index = 0; index < AllDatalist.length; index++) {
                    const CurData = AllDatalist[index];
                    let localIndex = GDModel.getIndexByUID(CurData.uid);
                    let CtrlUser = userList[localIndex];
                    if (CtrlUser) {
                        let cards = CurData.cards;
                        CtrlUser.showSwapCard(cards.length ? cards[0] : cards);
                    }
                }
            }
            tween(this.node_jin, pos_huan);
            tween(this.node_huan, pos_jin);
            this.scheduleOnce(showCards, 1);
            this.scheduleOnce(this.clear.bind(this), 2);
        }
    },

    showResist() {
        this.clear();
        this.show_Resist.scale = 1;
        this.show_Resist.active = true;
        cc.tween(this.show_Resist)
            .to(0.3, {
                scale: 1.5
            })
            .delay(0.2)
            .to(0.2, {
                scale: 1
            })
            .delay(0.5)
            .call(() => {
                this.clear();
            })
            .start()
    },
    clear() {
        this.show_Swap.active = false;
        this.show_opBtn.active = false;
        this.show_Resist.active = false;
        this.clock.destroyAllChildren();
    },
});