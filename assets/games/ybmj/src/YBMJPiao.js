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
		let btn_piao = cc.find("btn_piao", this.node)
		let btn_bupiao = cc.find("btn_bupiao", this.node)
		btn_piao.on("click", this.onButtonClick, this)
		btn_bupiao.on("click", this.onButtonClick, this)
	},

	gameInit(data) {
		this.init()
		if (data.gameStatus === ApiYbmj.gameStatus.PIAOFEN) {
			let piaoFen = data.piaoFen || {}
			let keys = Object.keys(piaoFen)
			if (!keys.includes(YBMJModel.getMyUID())) {
				this.show()
			}
		} else {
			this.hide()
		}
	},

	show() {
		this.node.active = true
		let btn_bupiao = cc.find("btn_bupiao", this.node)
		btn_bupiao.active = YBMJModel.getGameRuleByKey("piaoType") == 1
	},

	hide() {
		this.node.active = false
	},

	onButtonClick(event) {
		let isPiao = false
		switch (event.node.name) {
			case "btn_piao":
				isPiao = true
				break;
			case "btn_bupiao":
				isPiao = false
				break;
		}
		ApiRoom.gameMessageNotify(ApiYbmj.gamePiaoFenNotify(isPiao));
		this.node.active = false
	},
});