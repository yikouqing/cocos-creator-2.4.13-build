const AssetsManager = require('../../../utils/AssetsManager')
const ApiHall = require('../../../api/ApiHall');
const UserModel = require('../../../model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        numbers: [cc.Label],
        _numbers: [],
        _cb: null
    },

    onLoad() {
        this._cb = !!this.node.nodeParams ? this.node.nodeParams.cb : null;
        for (let i = 0; i < this.numbers.length; i++) {
            this.numbers[i].string = '';
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
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                this._onNumerClick(param);
                break;
            case 'delete':
                this._onDelClick();
                break;
            case 'reset':
                this._onResetClick();
                break;
        }
    },

    _onResetClick() {
        if (this._numbers.length == 0) return;
        this._numbers = [];
        for (const item of this.numbers) {
            if (!item) continue;
            item.string = '';
        }
    },

    _onDelClick() {
        if (this._numbers.length <= 0) return;
        this._numbers.pop();
        for (let index = 0; index < this.numbers.length; index++) {
            if (index > this._numbers.length - 1) {
                if (!this.numbers[index]) continue;
                this.numbers[index].string = '';
                continue;
            }
            this.numbers[index].string = this._numbers[index];
        }
    },

    _onNumerClick(num) {
        if (this._numbers.length >= 8) return;
        this._numbers.push(num);
        for (let index = 0; index < this._numbers.length; index++) {
            if (!this.numbers[index]) continue;
            this.numbers[index].string = this._numbers[index];
        }
        if (this._numbers.length != 8) return;
        let inviteId = this._numbers.join('');
        let uid = UserModel.getData('uid');
        let reqData = {
            inviteID: inviteId,
            uid: uid,
        };
        ApiHall.askJoinUnionRequest(reqData, (res) => {
            // console.log('加入联盟申请', res);
            if (res.code == 0) {
                AssetsManager.tipDialog("已经发出加入申请成功")
            }
            // this._cb && this._cb(res.msg.unionID);
            this._onResetClick();
            this.node.destroy();
        });
    },


});