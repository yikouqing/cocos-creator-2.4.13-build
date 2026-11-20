const ApiQjmj = require('./ApiQjmj');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        node_Item: cc.Node,
        node_List: [cc.Node],
    },

    start() {
        let jiList = [
            ApiQjmj.gameJIpai.BENJI,
            ApiQjmj.gameJIpai.XINGQIJI,
            ApiQjmj.gameJIpai.FANPAIJI,
            ApiQjmj.gameJIpai.YAOBAIJI,
        ];
        this.node_List.forEach(CurNode => {
            CurNode.active = false;
            CurNode.destroyAllChildren();
            CurNode.getComponent(cc.Sprite).enabled = false;
        });
        this.node_Item.active = false;
        let myUid = UserModel.getData('uid');
        let gameRule = this.node.nodeParams.gameRule;
        let maPaiInfo = this.node.nodeParams.maPaiInfo;
        this._userArray = this.node.nodeParams.result;
        this._callback = this.node.nodeParams.callback;
        this._maxPlayerCount = gameRule.maxPlayerCount;
        this.node_Item.addComponent('QJMJSingleTile');
        // console.log("翻牌显示===maPaiInfo", maPaiInfo, "gameRule", gameRule)
        let showList = [];
        let headPos = [0, 1, 2, 3];
        if (this._maxPlayerCount == 2) {
            headPos = [0, 2];
        } else if (this._maxPlayerCount == 3) {
            headPos = [0, 1, 3];
        }
        headPos.forEach((index) => {
            showList.push(this.node_List[index]);
        })
        this._userArray.forEach((user) => {
            if (user.uid == myUid) {
                this._myChairId = user.chairID;
            }
        })
        let showCur = (cardID, index) => {
            let addNode = showList[index];
            if (!cardID || !addNode || !this.node_Item) return;
            let node = cc.instantiate(this.node_Item);
            let ctrl = node.getComponent('QJMJSingleTile');
            node.parent = addNode;
            addNode.active = true;
            ctrl.init();
            node.scale = 2;
            node.active = true;
            ctrl.flower = cardID;
            cc.tween(node)
                .delay(0.2)
                .to(0.3, {
                    scale: 1
                })
                .start();
        }
        let maCards = maPaiInfo.maCards || [];//0为中鸡 1为上鸡 2为下鸡
        if (!!maCards.length) {
            let ctrl = this.node_Item.getComponent('QJMJSingleTile');
            ctrl.init();
            ctrl.setCover(true);
            let cardID = maCards[0];
            this.node_Item.active = true;
            cardID && this.scheduleOnce(() => {
                ctrl.flower = cardID;
            }, 0.5);
        };
        // let maRate = maPaiInfo.maRate;
        // for (const uid in maRate) {
        //     let list = maRate[uid] || [];
        //     let index = this.getIndexByUID(uid);
        //     list.forEach((id) => {
        //         showCur(id, index);
        //     })
        // }
        this.scheduleOnce(() => {
            this._callback && this._callback();
            this.node.destroy();
        }, 2.5);
    },

    getIndexByUID(uid) {
        let user = this.getUserByUID(uid);
        let chairID = !!user ? user.chairID : 0;
        return this.getIndexByChairID(chairID);
    },

    getUserByUID(uid) {
        let user = null;
        if (!this._userArray) return null;
        for (let item of this._userArray) {
            if (item.uid == uid) {
                user = item;
                break;
            }
        }
        return user;
    },

    /**座位号转换 */
    getIndexByChairID(chairID) {
        return (chairID - this._myChairId + this._maxPlayerCount) % this._maxPlayerCount;
    },
});