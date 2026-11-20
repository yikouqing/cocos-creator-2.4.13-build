const MessageCallback = require('../../utils/MessageCallback');
const Enums = require('../../const/Enums');
const Utils = require('../../utils/Utils');
const CCUtil = require('../../utils/CCUtil');
const ConfigModel = require('../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        noticeText: cc.RichText,
        rootNode: cc.Node,
        noticeContent: cc.Node,

        _speed: 110,
        _visible: false,
        _curBroadcast: null,
    },

    start() {
        MessageCallback.addListener("BroadcastPush", this);
        MessageCallback.addListener("BroadcastSyncPush", this);
        MessageCallback.addListener("BroadcastVisibleSync", this);
        this._speed = 110;
        this._visible = true;
        CCUtil.touchPierce(this.noticeContent);
        CCUtil.touchPierce(this.noticeText.node);
        this.loopBroadcastContent = this.node.nodeParams.loopBroadcastContent;
        this.loopBroadcastContent = this.loopBroadcastContent || '';
        this.broadcastMode = this.node.nodeParams.broadcastMode;
        this.broadcastPos = this.node.nodeParams.broadcastPos;
        if (!!this.broadcastPos) this.node.setPosition(this.broadcastPos);
        this.broadcastTime = parseInt(ConfigModel.getData('broadcastTime')) > 0 ? parseInt(ConfigModel.getData('broadcastTime')) : 10;
        this.broadcasts = [];
        this.onAir();
    },

    _showBroadcast() {
        let isShow = (!!this._curBroadcast && this._curBroadcast.content.length > 0) && !!this._visible;
        this.node.active = !!isShow;
    },

    onDestroy() {
        MessageCallback.removeListener("BroadcastPush", this);
        MessageCallback.removeListener("BroadcastSyncPush", this);
        MessageCallback.removeListener("BroadcastVisibleSync", this);
    },

    sync(content) {
        // console.log('sync', content, this._curBroadcast);
        if (!!this._curBroadcast && this._curBroadcast.content === content) return;
        this.broadcasts = this.broadcasts || [];
        if (!!content) {
            this.broadcasts.push({
                type: Enums.broadcastType.LOOP,
                content: content
            });
        }
        this.onAir();
    },

    onAir() {
        if (this.broadcasts.length == 0) {
            let content = '';
            if (this.broadcastMode == 'union') {
                content = this.loopBroadcastContent;
            } else {
                content = ConfigModel.getData('loopBroadcastContent');
                content = content || '';
            }
            if (!!content) {
                this.broadcasts.push({
                    type: Enums.broadcastType.LOOP,
                    content: content
                });
            }
        }
        this.noticeText.node.x = this.noticeContent.width / 2;
        this._curBroadcast = this.broadcasts.shift();
        this._showBroadcast();
        if (!this._curBroadcast) return;
        if (this._curBroadcast.type === Enums.broadcastType.LOOP || this._curBroadcast.type === Enums.broadcastType.SYSTEM) {
            let content = this._curBroadcast.content.replace(/[\r\n]/g, '');
            this.noticeText.string = "<outline width=1 color=#000000><color=#ffffff>" + content + "</c></outline>";
        } else if (this._curBroadcast.type === Enums.broadcastType.BIG_WIN) {
            let game = ConfigModel.getBundleConfig(this._curBroadcast.content.kind);
            let gameName = !!game ? game.name : '未知';
            let nickname = Utils.convertNickname(this._curBroadcast.content.nickname);
            let goldCount = Utils.formatNumberWithDecimal(this._curBroadcast.content.gold, 1);
            this.noticeText.string = '玩家<color=#00ff00>' + nickname + '</c>财运亨通,在<color=#D66F00>' + gameName + '</color>一把赢得<color=#E4D313>' + goldCount + '元</color>！';
        }
    },

    messageCallbackHandler(route, msg) {
        switch (route) {
            case 'BroadcastPush':
                if (msg.type === Enums.broadcastType.BIG_WIN) {
                    let broadcasts = msg.broadcasts || [];
                    broadcasts.forEach((broadcast) => {
                        this.broadcasts.push({
                            type: msg.type,
                            content: broadcast
                        });
                        if (this.broadcasts.length > 10) this.broadcasts.shift();
                    });
                } else {
                    this.broadcasts.push(msg);
                    if (this.broadcasts.length > 10) this.broadcasts.shift();
                }
                this.onAir();
                break;
            case "BroadcastVisibleSync":
                this._visible = !!msg;
                this._showBroadcast();
                break;
            case "BroadcastSyncPush":
                this.sync(msg);
                break;
        }
    },

    update(dt) {
        if (!this._curBroadcast || !this._visible) return;
        if (this.noticeText.node.x <= -this.noticeContent.width / 2 - this.noticeText.node.getBoundingBox().size.width - 100) {
            this.onAir();
            return;
        }
        this.noticeText.node.x -= this._speed * dt;
    }
});