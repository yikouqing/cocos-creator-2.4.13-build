const Enums = require('../../../src/const/Enums');
const BRNNModel = require("./BRNNModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiBrnn = require('./ApiBrnn');
const CCUtil = require("../../../src/utils/CCUtil")
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        item: cc.Node,
        content: cc.Node,
        _initX: -172,
        _initY: 600,
        _aniTime: 0.3,
        _data: null
    },

    onLoad() {
        this.item.active = false
        this.node.active = false
    },

    setData(data) {
        let userList = []
        if (data) {
            userList = data
        } else {
            let allUser = BRNNModel.roomUserInfoArr
            for (let i = 0; i < allUser.length; i++) {
                const user = allUser[i];
                if (user.uid != BRNNModel.myUid) {
                    userList.push(user.userInfo)
                }
            }
        }
        this.content.removeAllChildren()
        for (let i = 0; i < userList.length; i++) {
            const user = userList[i];
            let item = cc.instantiate(this.item)
            item.active = true
            item.parent = this.content
            item.x = 0

            let txt_name = cc.find("txt_name", item).getComponent(cc.Label)
            txt_name.string = user.nickname
            let txt_gold = cc.find("txt_gold", item).getComponent(cc.Label)
            txt_gold.string = user.score
            AssetsManager.loadSpriteFrame({
                path: user.avatar,
                sprite: cc.find("head", item).getComponent(cc.Sprite)
            });
        }
    },

    /**
     * 显示列表
     * @param {number} type 1其他列表  2庄家列表
     */
    showList(type) {
        this.node.stopAllActions()
        this.node.active = true
        if (type == 1) {
            this.setData()
            this.node.x = this._initX
            this.node.y = 0
            cc.tween(this.node).to(this._aniTime, {
                x: 172
            }, {
                easing: "backOut"
            }).start()
        } else if (type == 2) {
            this.node.y = this._initY
            this.node.x = 0
            cc.tween(this.node).to(this._aniTime, {
                y: 0
            }, {
                easing: "quadIn"
            }).start()
        }
    },

    /**隐藏列表 */
    hideList() {
        this.node.stopAllActions()
        if (this.node.x == 0) {
            cc.tween(this.node).to(this._aniTime, {
                y: this._initY
            }, {
                easing: "quadIn"
            }).start()
        } else if (this.node.y == 0) {
            cc.tween(this.node).to(this._aniTime, {
                x: this._initX
            }, {
                easing: "backIn"
            }).start()
        }
    }
});