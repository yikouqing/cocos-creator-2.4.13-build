const CCUtil = require('../../utils/CCUtil');
const ConfigModel = require('../../model/ConfigModel');
const AssetsManager = require('../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        spine: sp.Skeleton,
        _chatProp: null,
        _propCfg: null,
    },

    start() {
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 5);
        // console.log('加载礼物')
        this.spine.setCompleteListener((trackEntry, loopCount) => {
            if (!this._propCfg) return;
            if (trackEntry.animation.name == this._propCfg.appear) {
                let senderPos = CCUtil.postionConvert(this._chatProp.sender, this._chatProp.parent);
                let receiverPos = CCUtil.postionConvert(this._chatProp.reciever, this._chatProp.parent);
                let beizerPos = cc.v2();
                this.spine.clearTracks();
                this.spine.setAnimation(0, this._propCfg.move, true);
                this.node.stopAllActions();
                if (this._chatProp.rid != this._chatProp.sid) {
                    cc.tween(this.node)
                        .bezierTo(1, senderPos, beizerPos, receiverPos)
                        .call(() => {
                            this.spine.clearTracks();
                            AssetsManager.playEffect({
                                path: this._propCfg.audio
                            });
                            this.spine.setAnimation(0, this._propCfg.end, false);
                        }).start();
                } else {
                    this.node.stopAllActions();
                    this.node.setPosition(receiverPos);
                    cc.tween(this.node)
                        .delay(1)
                        .call(() => {
                            this.spine.clearTracks();
                            AssetsManager.playEffect({
                                path: this._propCfg.audio
                            });
                            this.spine.setAnimation(0, this._propCfg.end, false);
                        }).start();
                }
            } else if (trackEntry.animation.name == this._propCfg.end) {
                this.node.destroy();
            }
        });
        // console.log('道具数据', this.node['_chat_prop']);
        this._chatProp = this.node['_chat_prop'];
        if (!this._chatProp) {
            this.node.destroy();
            return;
        }
        this._propCfg = ConfigModel.getGiftConfig(this._chatProp.id);
        if (!this._propCfg) {
            this.node.destroy();
            return;
        }
        let senderPos = CCUtil.postionConvert(this._chatProp.sender, this._chatProp.parent);
        let receiverPos = CCUtil.postionConvert(this._chatProp.reciever, this._chatProp.parent);
        let beizerPos = cc.v2();
        if (senderPos.x != receiverPos.x) {
            beizerPos.x = (senderPos.x + receiverPos.x) / 2;
            beizerPos.y = (senderPos.y + receiverPos.y) / 2 + 200;
        } else {
            beizerPos.x = (senderPos.x + receiverPos.x) / 2 + senderPos.x > 0 ? -150 : 150; //中心点偏移
            beizerPos.y = (senderPos.y + receiverPos.y) / 2;
        }
        this.node.stopAllActions();
        this.node.setPosition(senderPos);
        this.spine.clearTracks();
        this.spine.premultipliedAlpha = false;
        this.spine.setSkin('default');
        // console.log('表情测试', this._chatProp);
        if (this._propCfg.appear == '') {
            if (this._propCfg.move == '') {
                if (this._propCfg.end == '') {
                    this.node.destroy();
                } else {
                    if (this._chatProp.rid != this._chatProp.sid) {
                        cc.tween(this.node)
                            .bezierTo(1, senderPos, beizerPos, receiverPos)
                            .call(() => {
                                this.spine.clearTracks();
                                AssetsManager.playEffect({
                                    path: this._propCfg.audio
                                });
                                this.spine.setAnimation(0, this._propCfg.end, false);
                            }).start();
                    } else {
                        this.node.stopAllActions();
                        this.node.setPosition(receiverPos);
                        cc.tween(this.node)
                            .delay(1)
                            .call(() => {
                                this.spine.clearTracks();
                                AssetsManager.playEffect({
                                    path: this._propCfg.audio
                                });
                                this.spine.setAnimation(0, this._propCfg.end, false);
                            }).start();
                    }
                }
            } else {
                this.spine.clearTracks();
                this.spine.setAnimation(0, this._propCfg.move, true);
                if (this._chatProp.rid != this._chatProp.sid) {
                    cc.tween(this.node)
                        .bezierTo(1, senderPos, beizerPos, receiverPos)
                        .call(() => {
                            this.spine.clearTracks();
                            AssetsManager.playEffect({
                                path: this._propCfg.audio
                            });
                            this.spine.setAnimation(0, this._propCfg.end, false);
                        }).start();
                } else {
                    this.node.stopAllActions();
                    this.node.setPosition(receiverPos);
                    cc.tween(this.node)
                        .delay(1)
                        .call(() => {
                            this.spine.clearTracks();
                            AssetsManager.playEffect({
                                path: this._propCfg.audio
                            });
                            this.spine.setAnimation(0, this._propCfg.end, false);
                        }).start();
                }
            }
        } else {
            this.spine.clearTracks();
            this.spine.setAnimation(0, this._propCfg.appear, false);
        }
    }

});