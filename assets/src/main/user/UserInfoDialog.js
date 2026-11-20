const MessageCallback = require('../../utils/MessageCallback');
const ApiHall = require('../../api/ApiHall');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CacheManager = require('../../utils/CacheManager');
const UserModel = require('../../model/UserModel');
const NativeUtil = require('../../utils/NativeUtil');
const Enums = require('../../const/Enums');
const ApiHttp = require('../../api/ApiHttp');

cc.Class({
    extends: cc.Component,

    properties: {
        gpsShowNode: cc.Node,
        phoneLabel: cc.Label,
        addressLabel: cc.Label,
        btnAccBindNode: cc.Node,
        btnVerify: cc.Node,
        accBondMark: cc.Node,
        btnModifyFrame: cc.Node,
        btnAblum: cc.Node,
        togSex0: cc.Toggle,
        togSex1: cc.Toggle,
        txtCheckShiming: cc.Label,
    },

    onLoad() {
        MessageCallback.addListener('OnPickImageResult', this);
        MessageCallback.addListener('UpdateUserInfoPush', this);
        MessageCallback.addListener('OnLocationCallback', this);
        MessageCallback.addListener('ReconnectSuccess', this);
    },

    updatePlayerInfo() {
        let canModifyFrame = cc.sys.isBrowser || !!ConfigModel.getData('canModifyAvatar');
        if (this.btnModifyFrame) this.btnModifyFrame.active = canModifyFrame;
        let isBind = !!UserModel.getData('isBind') || !!UserModel.getData('mobilePhone') || !!UserModel.getData('account');
        this.btnAccBindNode.active = !isBind;
        this.accBondMark.active = isBind;
        let phoneLogin = ConfigModel.getData('phoneLogin');
        let key = phoneLogin ? 'mobilePhone' : 'account';
        this.phoneLabel.string = !!isBind ? `${UserModel.getData(key)}` : '';
        this.btnAblum.active = false;
        if (UserModel.getData('sex') === 0) {
            this.togSex0.isChecked = true
        } else {
            this.togSex1.isChecked = true
        }
        let realName = UserModel.getData('realName');
        if (!!realName && realName.length > 0) {
            let real = typeof (realName) == 'string' ? JSON.parse(realName) : realName;
            this.txtCheckShiming.string = real.name;
        } else {
            this.txtCheckShiming.string = "未认证";
        }
        let locationEnable = ConfigModel.getData('locationEnable');
        let showLocation = ConfigModel.getData('showLocation');
        if (this.gpsShowNode) this.gpsShowNode.active = !!locationEnable && !!showLocation;
    },

    locationSync() {
        let aMapLocation = NativeUtil.getLocation();
        if (!!aMapLocation) {
            this.addressLabel.string = aMapLocation.location;
        } else {
            this.addressLabel.string = '未获取到您的位置信息';
        }
    },

    start() {
        this.updatePlayerInfo();
        this.locationSync();
    },

    onDestroy() {
        MessageCallback.removeListener('UpdateUserInfoPush', this);
        MessageCallback.removeListener('OnPickImageResult', this);
        MessageCallback.removeListener('OnLocationCallback', this);
        MessageCallback.removeListener('ReconnectSuccess', this);
    },

    /**显示自己选的图片头像 */
    _onPickImageResult(data) {
        ApiHttp.uploadImage(data.base64, (res) => {
            CacheManager.setItem('pastModifyAvater', res.filePath);
            ApiHall.updateUserInfoRequest({
                avater: res.filePath
            }, () => {
                CacheManager.delItem('pastModifyAvater');
                AssetsManager.tipDialog('头像修改成功~');
            })
        });
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

    onChangeSex(event, param) {
        let sex = UserModel.getData('sex')
        let changSex = parseInt(param)
        console.log(sex, changSex)
        if (sex != changSex) {
            ApiHall.updateUserInfoRequest({
                sex: changSex
            }, () => {
                AssetsManager.tipDialog('性别修改成功~');
            })
        }
    },

    messageCallbackHandler(route, msg) {
        switch (route) {
            case 'UpdateUserInfoPush':
                this.updatePlayerInfo();
                break;
            case 'OnPickImageResult':
                this._onPickImageResult(msg);
                break;
            case 'OnLocationCallback':
                this.locationSync();
                break;
            case 'ReconnectSuccess':
                this._onReconnectSuccess();
                break;
        }
    },

    onBtnClk(event, param) {

        switch (param) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'settings':
                AssetsManager.setDialog({});
                break;
            case 'addGold':
                AssetsManager.tipDialog("暂未开启");
                break;
            case 'logout':
                UserModel.release(true);
                break;
            case 'bindPhone':
                let phoneLogin = ConfigModel.getData('phoneLogin');
                //手机登录绑定手机号 否则绑定账号
                AssetsManager.createDialog({
                    path: 'res/prefab/main/user/BindTelDialog',
                    bundle: ConfigModel.getSkin(),
                    bindType: !!phoneLogin ? 1 : 0
                });
                break;
            case 'changHead':
                AssetsManager.createDialog({
                    path: 'res/prefab/main/user/ChangeHeadDialog',
                    bundle: ConfigModel.getSkin(),
                });
                break;
            case 'bindVerify':
                AssetsManager.createDialog({
                    path: "res/prefab/main/user/AuthDialog",
                    bundle: ConfigModel.getSkin(),
                    verifyCallback: () => {
                        this.updatePlayerInfo();
                    }
                });
                break;
            case 'album':
                NativeUtil.pickImage({
                    type: Enums.PickImageMethod.Album,
                    needClip: 1, //0是不裁剪,1是裁剪
                    clipX: 100, //裁剪x尺寸
                    clipY: 100, //裁剪y尺寸
                });
                break
            case 'location':
                UserModel.locationSync();
                break;
        }
    },


});