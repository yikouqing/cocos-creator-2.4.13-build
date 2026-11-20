const AssetsManager = require('../../../src/utils/AssetsManager');
const DZPKModel = require('./DZPKModel');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        btnFold: cc.Node,
        foldMark: cc.Node,
        btnFoldXiu: cc.Node,
        foldXiuMark: cc.Node,
        btnXiu: cc.Node,
        xiuMark: cc.Node,
        btnGen: cc.Node,
        genMark: cc.Node,

        _comp: null,
        _opType: -1, //0-丢 1-休|丢 2-休 3-跟
    },

    init(comp) {
        this._comp = comp;
        this.clear();
    },

    sync() {
        let needPour = DZPKModel.getNeedPourScoreByUID(UserModel.getData('uid'));
        this.node.active = true;
        this.btnFold.active = needPour > 0;
        this.btnFoldXiu.active = needPour == 0;
        this.btnXiu.active = needPour == 0;
        this.btnGen.active = needPour > 0;
        if (this._opType == -1) {
            this.foldMark.active = false;
            this.foldXiuMark.active = false;
            this.genMark.active = false;
            this.xiuMark.active = false;
        } else if (this._opType == 1) {
            if (needPour > 0) {
                this.foldMark.active = false;
                this.foldXiuMark.active = false;
                this.genMark.active = false;
                this.xiuMark.active = false;
                this._opType = -1;
            }
        } else if (this._opType == 2) {
            if (needPour > 0) {
                this.foldMark.active = false;
                this.foldXiuMark.active = false;
                this.genMark.active = false;
                this.xiuMark.active = false;
                this._opType = -1;
            }
        } else if (this._opType == 3) {
            if (needPour == 0) {
                this.foldMark.active = false;
                this.foldXiuMark.active = false;
                this.genMark.active = false;
                this.xiuMark.active = false;
                this._opType = -1;
            }
        }
    },

    onClick(event, param) {

        if (isNaN(parseInt(param))) return;
        let opType = parseInt(param);
        if (opType == 0) {
            this.foldXiuMark.active = false;
            this.xiuMark.active = false;
            this.genMark.active = false;
            this.foldMark.active = this._opType != opType;
        } else if (opType == 1) {
            this.foldMark.active = false;
            this.xiuMark.active = false;
            this.genMark.active = false;
            this.foldXiuMark.active = this._opType != opType;
        } else if (opType == 2) {
            this.foldMark.active = false;
            this.foldXiuMark.active = false;
            this.genMark.active = false;
            this.xiuMark.active = this._opType != opType;
        } else if (opType == 3) {
            this.foldMark.active = false;
            this.foldXiuMark.active = false;
            this.xiuMark.active = false;
            this.genMark.active = this._opType != opType;
        }
        this._opType = this._opType == opType ? -1 : opType;
        // console.log('设定预操作为', this._opType);
    },

    getOption() {
        return this._opType;
    },

    clear() {
        this.node.active = false;
        this._opType = -1;
        this.foldMark.active = false;
        this.foldXiuMark.active = false;
        this.genMark.active = false;
        this.xiuMark.active = false;
    }

});