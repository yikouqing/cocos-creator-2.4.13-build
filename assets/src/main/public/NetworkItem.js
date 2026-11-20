const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ApiHall = require('../../api/ApiHall');

cc.Class({
	extends: cc.Component,
	properties: {
		timeLabel: cc.Label,
		netContent: cc.Node,
	},

	onLoad() {
		this.node.active = false;
		return;
		this.schedule(() => {
			ApiHall.getNetDelay((res) => {
				if (this.netContent) {
					if (res.delayTime <= Enums.networkState.BEST) {
						this.netContent.width = 34;
					} else if (res.delayTime <= Enums.networkState.GOOD) {
						this.netContent.width = 29;
					} else if (res.delayTime <= Enums.networkState.NORMAL) {
						this.netContent.width = 23;
					} else if (res.delayTime <= Enums.networkState.BAD) {
						AssetsManager.tipDialog("当前网络状态差！");
						this.netContent.width = 10;
					} else {
						AssetsManager.tipDialog("当前网络状态极差！");
						this.netContent.width = 5;
					}
				}
			});
		}, 10);

		this.schedule(() => {
			let curData = new Date();
			let hour = curData.getHours();
			let min = curData.getMinutes();
			if (hour < 10) {
				hour = '0' + hour;
			}
			if (min < 10) {
				min = '0' + min;
			}
			if (this.timeLabel) {
				this.timeLabel.string = hour + ':' + min;
			}
		}, 1);
	},
});