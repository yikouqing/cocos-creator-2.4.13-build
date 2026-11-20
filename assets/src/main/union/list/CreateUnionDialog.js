const AssetsManager = require('../../../utils/AssetsManager')
const Utils = require('../../../utils/Utils');
const ApiHall = require('../../../api/ApiHall');
const UserModel = require('../../../model/UserModel');
const ConfigModel = require('../../../model/ConfigModel');
const Enums = require('../../../const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        unionName: cc.EditBox,
        phoneNum: cc.EditBox,
        modeLay: cc.Node,
        _cb: null,
        _unionType: 0,
        _skinId: 0,
        _createMode: 0,
    },

    onLoad() {
        this._cb = !!this.node.nodeParams ? this.node.nodeParams.cb : null;
        this._skinId = !!this.node.nodeParams ? this.node.nodeParams.skinId : null;
        this._skinId = this._skinId || Enums.bundleType.UNION_DF;
        this._createMode = !!this.node.nodeParams ? this.node.nodeParams.createMode : null;
        if (!ConfigModel.getData('canChooseUnionMode')) this._unionType = ConfigModel.getData('defaultUnionMode');
    },

    start() {
        this.modeLay.active = cc.sys.isBrowser || !!ConfigModel.getData('canChooseUnionMode');


    },

    onBtnClick(event, parameter) {
        if (parameter === 'putong') {
            this._unionType = 1;
        } else if (parameter === 'bisai') {
            this._unionType = 0;
        }
        if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'create') {
            let unionName = this.unionName.string;
            if (!unionName) {
                AssetsManager.tipDialog("请输入俱乐部名称");
                return;
            }
            if (Utils.getCharCount(unionName) > 12) {
                AssetsManager.tipDialog("俱乐部名称不得多于6个字");
                return;
            }
            /**手机号验证 */
            let r = /^[1][3,4,5,6,7,8,9][0-9]{9}$/
            if (!r.test(this.phoneNum.string)) {
                AssetsManager.tipDialog("请输入正确的手机号")
                return
            }
            let phone = parseInt(this.phoneNum.string)
            let reqData = {
                unionType: this._unionType,
                unionSkinId: this._skinId,
                unionName: unionName,
                ownerPhone: phone,
            }
            ApiHall.createUnionRequest(reqData, (res) => {
                let tips = this._createMode == 'switch' ? "创建成功，立即切换联盟？" : "创建成功，立即进入联盟？";
                AssetsManager.popDialog({
                    content: tips,
                    ok: () => {
                        this._cb && this._cb(res.msg.unionID);
                        this.node.destroy();
                    }
                });

            });
        }
    }
});