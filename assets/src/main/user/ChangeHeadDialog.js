const MessageCallback = require('../../utils/MessageCallback');
const ApiHall = require('../../api/ApiHall');
const AssetsManager = require('../../utils/AssetsManager');
const CacheManager = require('../../utils/CacheManager');
const Enums = require('../../const/Enums');
const UserModel = require('../../model/UserModel');
const NativeUtil = require('../../utils/NativeUtil');
const Utils = require('../../utils/Utils');
const Configs = require('../../const/Configs');
const headUrl = "sprite/head/morentouxiang";
const ApiHttp = require('../../api/ApiHttp');

cc.Class({
    extends: cc.Component,

    properties: {
        avatar: cc.Sprite,
        content: cc.Node,
        _selectHeadUrl: ""
    },

    onLoad() {
        if (cc.sys.os == cc.sys.OS_WINDOWS) { }
        MessageCallback.addListener('OnPickImageResult', this);
        MessageCallback.addListener('UpdateUserInfoPush', this);
        MessageCallback.addListener('ReconnectSuccess', this);
    },


    messageCallbackHandler(route, msg) {
        if (route === 'OnPickImageResult') {
            this._onPickImageResult(msg);
        } else if (route === 'UpdateUserInfoPush') {
            this._UpdateUserInfo()
        } else if (route === 'ReconnectSuccess') {
            this._onReconnectSuccess()
        }
    },

    onDestroy() {
        MessageCallback.removeListener('OnPickImageResult', this);
        MessageCallback.removeListener('UpdateUserInfoPush', this);
        MessageCallback.removeListener('ReconnectSuccess', this);
    },

    start() {
        this._UpdateUserInfo()
        this.list = []
        for (let i = 1; i <= Configs.sysFrameCount; i++) {
            this.list.push(i)
        }
        this.updateRanHead()

    },


    _UpdateUserInfo() {
        AssetsManager.loadSpriteFrame({
            path: UserModel.getData('avatar'),
            sprite: this.avatar
        });

    },

    updateRanHead() {
        this.content.removeAllChildren();
        if (!this.list.length) return;
        let list = Utils.shuffle(this.list);
        for (let i = 1; i <= 28; i++) {
            let idx = list[i]
            let url = headUrl + idx
            let head = new cc.Node("" + idx)
            head.setContentSize(100, 100);
            head.addComponent(cc.Button);
            let sp = head.addComponent(cc.Sprite)
            sp.trim = false;
            sp.type = cc.Sprite.Type.SIMPLE;
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM
            AssetsManager.loadSpriteFrame({
                path: url,
                sprite: sp
            }, () => {
                head.parent = this.content
            });
            head.on("click", this._headClick, this)
        }
    },

    _onReconnectSuccess() {
        let pastModifyAvater = CacheManager.getItem('pastModifyAvater');
        if (!pastModifyAvater || typeof (pastModifyAvater) != 'string' || pastModifyAvater.length == 0) return;
        ApiHall.updateUserInfoRequest({
            avater: pastModifyAvater
        }, () => {
            CacheManager.delItem('pastModifyAvater');
        })
    },

    /**显示自己选的图片头像 */
    _onPickImageResult(data) {
        ApiHttp.uploadImage(data.base64, (res) => {
            CacheManager.setItem('pastModifyAvater', res.filePath);
            ApiHall.updateUserInfoRequest({ avater: res.filePath }, () => {
                CacheManager.delItem('pastModifyAvater');
                AssetsManager.tipDialog('头像修改成功~');
            })
        });
    },

    /**本地头像点击 */
    _headClick(event) {
        this._selectHeadUrl = headUrl + event.node.name
        AssetsManager.loadSpriteFrame({
            path: this._selectHeadUrl,
            sprite: this.avatar
        });
    },

    selfDestroy() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

    onBtnClk(event, param) {
        switch (param) {
            case 'close':
                this.selfDestroy()
                break;
            case 'enter':
                /**发送更换头像 */
                ApiHall.updateUserInfoRequest({ avater: this._selectHeadUrl }, (res) => { })
                this.selfDestroy()
                break;
            case 'changHead':
                this.updateRanHead()
                break;
            case 'album':
                NativeUtil.pickImage({
                    type: Enums.PickImageMethod.Album,
                    needClip: 1, //0是不裁剪,1是裁剪
                    clipX: 100, //裁剪x尺寸
                    clipY: 100, //裁剪y尺寸
                });
                break
            case 'camera':
                NativeUtil.pickImage({
                    type: Enums.PickImageMethod.Camera,
                    needClip: 1, //0是不裁剪,1是裁剪
                    clipX: 100, //裁剪x尺寸
                    clipY: 100, //裁剪y尺寸
                });
                break;
        }
    },
});