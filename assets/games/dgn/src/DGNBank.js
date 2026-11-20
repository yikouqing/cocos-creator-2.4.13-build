const Enums = require('../../../src/const/Enums');
const ApiDgn = require('./ApiDgn');
const ApiRoom = require('../../../src/api/ApiRoom');
const DGNModel = require('./DGNModel');

cc.Class({
	extends: cc.Component,
	properties: {
		btnBuShang: cc.Node,
		btnShangZhuang: cc.Node,
		btnJiXu: cc.Node,
		btnXiaZhuang: cc.Node,
	},

	show() {
		let bankerChairID = DGNModel.getBankerChairID();
		this.btnBuShang.active = bankerChairID == null;
		this.btnShangZhuang.active = bankerChairID == null;
		this.btnJiXu.active = bankerChairID != null;
		this.btnXiaZhuang.active = bankerChairID != null;
		this.node.active = true;
	},

	onBtnClick(event, param) {
		switch (param) {
			case 'bushang':
			case 'xiazhuang':
				ApiRoom.gameMessageNotify(ApiDgn.chooseBankNotify(false));
				this.node.active = false;
				break;
			case 'shangzhuang':
			case 'jixu':
				ApiRoom.gameMessageNotify(ApiDgn.chooseBankNotify(true));
				this.node.active = false;
				break;
			default:
				break;
		}
	},

	reset() {
		this.btnBuShang.active = false;
		this.btnShangZhuang.active = false;
		this.btnJiXu.active = false;
		this.btnXiaZhuang.active = false;
		this.node.active = false;
	},

});