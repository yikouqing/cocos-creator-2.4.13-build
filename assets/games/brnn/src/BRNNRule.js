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
        btn_close: cc.Node
    },

    onLoad() {
        this.btn_close.on("click", () => {
            this.node.destroy()
        }, this)
    },
});