const DGNModel = require('./DGNModel');
const ApiDgn = require('./ApiDgn');

cc.Class({
	extends: cc.Component,
	properties: {},

	onLoad() {
		this.tick = 0;
		this.schedule(() => {
			--this.tick;
			if (this.tick < 0) {
				this.tick = 0;
			}
		}, 1);
	},

	refrush() {
		this.tick = DGNModel.getTick();
	},

	update() {
		let label1 = cc.find("Label", this.node);
		var gameStatus = DGNModel.getGameStatus();
		if (gameStatus == ApiDgn.gameStatus.NONE) {
			label1.getComponent(cc.Label).string = `准备倒计时：${this.tick}`;
			label1.active = (DGNModel.getCurBureau() > 0);
		} else if (gameStatus == ApiDgn.gameStatus.CHOOSE_BANK) {
			let user = DGNModel.getUserByChairID(DGNModel.getNextBankerChairID());
			if (user) {
				label1.getComponent(cc.Label).string = `玩家${user.userInfo.nickname}正在选择上庄：${this.tick}`;
				label1.active = true;
			}
		} else if (gameStatus == ApiDgn.gameStatus.POUR_SCORE) {
			label1.getComponent(cc.Label).string = `开始下注：${this.tick}`;
			label1.active = true;
		} else if (gameStatus == ApiDgn.gameStatus.SHOW_CARDS) {
			label1.getComponent(cc.Label).string = `开始亮牌：${this.tick}`;
			label1.active = true;
		} else if (gameStatus == ApiDgn.gameStatus.RESULT) {
			label1.active = false;
		}
		let label2 = cc.find("Label2", this.node);
		label2.getComponent(cc.Label).string = `第${DGNModel.getBankerTurn()}/${DGNModel.getBankerPourTurn()}把`;
		label2.active = false;//(DGNModel.getCurBureau() > 0);
	},
});