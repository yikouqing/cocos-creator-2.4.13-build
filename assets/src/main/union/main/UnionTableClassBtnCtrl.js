const AssetsManager = require('../../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        gameList: cc.Node,
        gameItem: cc.Prefab, //游戏列表

        _gameTypeComps: [],
        _gameTypeCounts: 0,
        _curSelectedGameType: -1,
        _comp: null,
        _roomRuleList: [],
        _loaded: false,
    },

    onLoad() {
        this._curSelectedGameType = -1;
    },

    start() {

    },

    initWidget(comp) {
        this._comp = comp;
    },

    updateBtn(gameType, unionInfo) {
        if (!this.node.active) return;
        this._curSelectedGameType = gameType;
        let rooms = unionInfo.roomRuleList || [];
        rooms = this._arrayFilter(rooms);
        if (this._gameTypeComps.length > rooms.length) {
            //节点节点有多的
            for (let index = 0; index < this._gameTypeComps.length; index++) {
                if (!this._gameTypeComps[index]) continue;
                if (index < rooms.length && !!rooms[index]) {
                    rooms[index].selectedGameType = gameType;
                    rooms[index].comp = this;
                    this._gameTypeComps[index].getComponent('UnionTableClassGameItem').bind(rooms[index]);
                } else {
                    this._gameTypeComps[index].getComponent('UnionTableClassGameItem').clear();
                }
            }
        } else {
            //节点不足
            let tempRoomItem = this._gameTypeComps;
            for (let index = 0; index < rooms.length; index++) {
                if (index < tempRoomItem.length) {
                    if (tempRoomItem.length != 0 && !!tempRoomItem[index]) {
                        if (!!rooms[index]) {
                            rooms[index].selectedGameType = gameType;
                            rooms[index].comp = this;
                            tempRoomItem[index].getComponent('UnionTableClassGameItem').bind(rooms[index]);
                        } else {
                            tempRoomItem[index].getComponent('UnionTableClassGameItem').clear();
                        }
                    }
                } else {
                    if (!rooms[index]) continue;
                    // console.log('测试-rooms', index, rooms.length, this._gameTypeComps.length)
                    let node = cc.instantiate(this.gameItem);
                    rooms[index].selectedGameType = gameType;
                    rooms[index].comp = this;
                    node.getComponent('UnionTableClassGameItem').bind(rooms[index]);
                    node.parent = this.gameList;
                    this._gameTypeComps.push(node);
                }
            }
        }
    },

    _arrayFilter(rooms) {
        rooms.sort((a, b) => {
            let aType = a.gameType || a.gameRule.gameType;
            let bType = b.gameType || b.gameRule.gameType;
            return aType - bType;
        });
        let filter = [];
        for (const room of rooms) {
            let roomGameType = room.gameType || room.gameRule.gameType;
            let findGameRule = filter.find((item) => {
                let itemGameType = item.gameType || item.gameRule.gameType;
                return itemGameType == roomGameType;
            });
            if (!!findGameRule) continue;
            filter.push(room);
        }
        return filter;
    },

    //切换显示游戏列表按钮

    onGameClick(gameType) {
        if (!this._comp) return;
        this.syncGameCheck(gameType);
        this._comp.onGameTypeClick(gameType); //对象传递
    },

    syncGameCheck(gameType) {
        for (const comp of this._gameTypeComps) {
            if (!comp || !comp.getComponent('UnionTableClassGameItem')) continue;
            comp.getComponent('UnionTableClassGameItem').sync(gameType);
        }
    },

    onAllClick() {

        if (!this._comp) return;
        this.syncGameCheck(-1);
        this._comp.onGameTypeClick(-1); //对象传递
    },

});