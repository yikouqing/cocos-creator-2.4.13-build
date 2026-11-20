const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CXModel = require('./CXModel');

cc.Class({
    extends: cc.Component,

    properties: {
        actionNode: cc.Node,
        listNode: cc.Node,
        lookCount: cc.Label,

        _actionPos: null,
        _actionStatus: 0, //0-静止 1-执行中
    },

    start() {
        this.lookCount.string = '围观';
        this.actionNode.getComponent(cc.Widget) && this.actionNode.getComponent(cc.Widget).updateAlignment();
        this._actionPos = {
            show: cc.v2(),
            hide: cc.v2()
        };
        this._actionPos.hide = this.actionNode.getPosition(cc.v2());
        this._actionPos.show = cc.v2(this._actionPos.hide.x + this.actionNode.width, this._actionPos.hide.y);
        this.actionNode.opacity = 0;
        this.actionNode.setPosition(this._actionPos.hide);
        this._actionStatus = 1;
        cc.tween(this.actionNode)
            .to(0.6, {
                opacity: 255,
                position: cc.v3(this._actionPos.show)
            }, {
                easing: 'expoOut'
            })
            .call(() => {
                this._actionStatus = 0;
            })
            .start();
        this.init();
    },

    init() {
        let users = CXModel.getLookOnUsers();
        if (!users) return;
        this.lookCount.string = `围观(${users.length})`;
        AssetsManager.loadAsset({
            path: 'res/prefab/CXLookPlayer',
            aType: cc.Prefab,
            bundle: Enums.bundleType.CX
        }, (item) => {
            if (!cc.isValid(this.node)) return;
            this.listNode.destroyAllChildren();
            for (let index = 0; index < users.length; index++) {
                const player = cc.instantiate(item);
                this.listNode.addChild(player);
                player.getComponent('CXLookPlayer') &&
                    player.getComponent('CXLookPlayer').bind(users[index]);
            }
        })
    },

    btnClicks(event, param) {

        switch (param) {
            case 'close':
                this.close();
                break;
        }
    },

    close() {
        if (this._actionStatus == 1) return;
        this._actionStatus = 1;
        this.actionNode.stopAllActions();
        cc.tween(this.actionNode)
            .to(0.6, {
                opacity: 255,
                position: cc.v3(this._actionPos.hide)
            }, {
                easing: 'expoOut'
            })
            .call(() => {
                this.node.destroy();
            })
            .start();
    },


});