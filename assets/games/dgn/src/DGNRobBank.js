const Enums = require('../../../src/const/Enums');
const ApiDgn = require('./ApiDgn');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');

cc.Class({
	extends: cc.Component,
	properties: {},

	onQiangClick() {
		ApiRoom.gameMessageNotify(ApiDgn.gameRobBankNotify(1));
		this.node.active = false;
	},

	onBuQiangClick() {
		ApiRoom.gameMessageNotify(ApiDgn.gameRobBankNotify(0));
		this.node.active = false;
	},
});