const AssetsManager = require('../../../utils/AssetsManager')

cc.Class({
    extends: cc.Component,

    properties: {
        inputNumber: cc.Label,
        _input: [],
    },

    // use this for initialization
    onLoad() {
        this.callback = this.node.nodeParams.cb;
        this.maxLength = this.node.nodeParams.maxLength;
    },

    onBtnClk(event, param) {

        switch (param) {
            case 'close': {
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
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
                // console.log('测试-输入', this._input)
                if (this._input.length >= this.maxLength) return;
                this._input.push(parseInt(param))
                this.inputNumber.string = this._input.join('');
                if (this._input.length == this.maxLength) {
                    this.callback(this._input.join(''));
                    this.node.destroy();
                }
                break;
            case 'delete':
                if (this._input.length === 0) return;
                this._input.splice(this._input.length - 1, 1);
                this.inputNumber.string = this._input.join('');
                break;
            case 'reset':
                this._input = [];
                this.inputNumber.string = '';
                break;
        }
    }
});