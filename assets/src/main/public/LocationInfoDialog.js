const AssetsManager = require('../../utils/AssetsManager');
const UserModel = require('../../model/UserModel');
const MessageCallback = require('../../utils/MessageCallback');
const ApiRoom = require('../../api/ApiRoom');

cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        _users: null,
        _chairCount: 2,
        _fangzuobi: false,
        _myChairId: 0,
        _locationDistanceCtrl: null
    },

    onDestroy() {
        MessageCallback.removeListener('RoomMessagePush', this);
    },

    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                let user = msg.data.roomUserInfo
                for (var i = 0; i < this._users.length; ++i) {
                    if (this._users[i] && this._users[i].userInfo.uid === user.userInfo.uid) {
                        this._users.splice(i, 1);
                        break;
                    }
                }
                this._users.push(user);
                let players = this.sortPlayers()
                this._locationDistanceCtrl && this._locationDistanceCtrl.bind(this._fangzuobi, players);
            } else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
                console.log("--===---", msg.data)
                let user = msg.data.roomUserInfo
                for (let i = 0; i < this._users.length; ++i) {
                    if (this._users[i] && this._users[i].userInfo.uid === user.userInfo.uid) {
                        this._users.splice(i, 1);
                        break;
                    }
                }
                let players = this.sortPlayers()
                this._locationDistanceCtrl && this._locationDistanceCtrl.bind(this._fangzuobi, players);
            }
        }
    },

    start() {
        this._users = !!this.node.nodeParams ? this.node.nodeParams.users || [] : [];
        this._users = this._users.slice()
        this._chairCount = !!this.node.nodeParams ? this.node.nodeParams.chairCount || 2 : 2;
        this._fangzuobi = !!this.node.nodeParams ? this.node.nodeParams.fangzuobi || false : false;
        let myUid = UserModel.getData("uid")
        //找出自己的座位号
        this._myChairId = 0;
        for (const user of this._users) {
            if (!user) continue;
            if (user.userInfo.uid == myUid) {
                this._myChairId = user.chairID
                break;
            }
        }
        // console.log("自己的座位号==", this._myChairId)
        this.init();
        MessageCallback.addListener('RoomMessagePush', this);
    },

    sortPlayers() {
        let players = new Array(this._chairCount).fill(null)

        //重新排列用户位置
        for (const user of this._users) {
            if (!user) continue;
            let idx = this.getUserChairIndex(user.chairID)
            if (!players[idx])
                players[idx] = user
        }
        if (players.length > 5) players.length = 5

        // console.log("重新排序过后", players, "-----", this._users)
        return players
    },

    init() {
        if (this._chairCount < 2) {
            this._chairCount = 2;
        } else if (this._chairCount > 5) {
            this._chairCount = 5;
        }
        let players = this.sortPlayers()
        let pathNum = this._chairCount;
        AssetsManager.loadAsset({
            path: `prefab/inter/LocationDistancePlayer${pathNum}`,
            aType: cc.Prefab
        }, (as) => {
            if (!as || !cc.isValid(this.node)) return;
            let distanceNode = cc.instantiate(as);
            distanceNode.parent = this.content;
            this._locationDistanceCtrl = distanceNode.getComponent('LocationDistanceCtrl')
            this._locationDistanceCtrl && this._locationDistanceCtrl.bind(this._fangzuobi, players);
        });
    },

    onCloseClick() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

    /**座位号转换 */
    getUserChairIndex(chairID) {
        return (chairID - this._myChairId + this._chairCount) % this._chairCount;
    },

});