const YBMJModel = require('./YBMJModel');
const ApiYbmj = require('./ApiYbmj');
const ApiRoom = require('../../../src/api/ApiRoom');

cc.Class({
	extends: cc.Component,
	properties: {
		_isInit: false
	},

	init() {
		if (this._isInit) {
			return
		}
		this._isInit = true
		this.node.active = false;
		let btn_wan = cc.find("btn_wan", this.node)
		let btn_tong = cc.find("btn_tong", this.node)
		let btn_tiao = cc.find("btn_tiao", this.node)
		btn_wan.on("click", this.onButtonClick, this)
		btn_tong.on("click", this.onButtonClick, this)
		btn_tiao.on("click", this.onButtonClick, this)
	},

	gameInit(data) {
		this.init()
		if (data.gameStatus === ApiYbmj.gameStatus.DINGQUE) {
			if (YBMJModel.getDingQueType(YBMJModel.getMyUID()) === -1) {
				this.showBtn()
			}
		} else {
			this.node.active = false
		}
	},

	/**定缺状态 */
	onDingQueStatus(data) {
		if (data.gameStatus === ApiYbmj.gameStatus.DINGQUE) {
			this.showBtn()
		} else this.node.active = false
	},

	/**定缺完成 */
	onUserDingQue(data) {

	},

	hide() {
		this.node.active = false
	},

	showBtn() {
		let list = this.node.children
		list.forEach(btn => {
			cc.find("light", btn).active = false
		});
		let s = YBMJModel.getDingQueSuggest()
		if (s !== -1) {
			let name = "btn_wan"
			switch (s) {
				case ApiYbmj.queType.TONG:
					name = "btn_tong"
					break;
				case ApiYbmj.queType.TIAO:
					name = "btn_tiao"
					break;
			}
			cc.find(name + "/light", this.node).active = true
		}
		this.node.active = true
	},

	onButtonClick(event) {
		let type = 0
		switch (event.node.name) {
			case "btn_wan":
				type = ApiYbmj.queType.WAN;
				break;
			case "btn_tong":
				type = ApiYbmj.queType.TONG;
				break;
			case "btn_tiao":
				type = ApiYbmj.queType.TIAO;
				break;
		}
		ApiRoom.gameMessageNotify(ApiYbmj.gameDingQueNotify(type));
		this.node.active = false
	},
});