const QZMJTSModel = require('./QZMJTSModel');
const ApiQzmjTS = require('./ApiQzmjTS');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		_isInit: false
	},

	init() {
		if (this._isInit) return;
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
		this.init();
		if (data.gameStatus === ApiQzmjTS.gameStatus.DINGQUE) {
			if (!QZMJTSModel.getDingQueType(QZMJTSModel.getMyUID())) {
				this.showBtn();
			}
		} else {
			this.node.active = false;
		}
	},

	/**定缺状态 */
	onDingQueStatus(data) {
		if (data.gameStatus === ApiQzmjTS.gameStatus.DINGQUE) {
			this.showBtn()
		} else this.node.active = false
	},

	/**定缺完成 */
	onUserDingQue(data) {
		if (data.chairID === QZMJTSModel.getMyChairID())
			this.node.active = false
	},

	showBtn() {
		let list = this.node.children
		// list.forEach(btn => {
		// 	cc.find("light", btn).active = false
		// });
		let s = QZMJTSModel.getDingQueSuggest()
		if (s !== -1) {
			let name = "btn_wan"
			switch (s) {
				case ApiQzmjTS.queType.TONG:
					name = "btn_tong"
					break;
				case ApiQzmjTS.queType.TIAO:
					name = "btn_tiao"
					break;
			}
			// cc.find(name + "/light", this.node).active = true
		}
		this.node.active = true
	},

	onButtonClick(event) {
		let type = 0
		switch (event.node.name) {
			case "btn_wan":
				type = ApiQzmjTS.queType.WAN;
				break;
			case "btn_tong":
				type = ApiQzmjTS.queType.TONG;
				break;
			case "btn_tiao":
				type = ApiQzmjTS.queType.TIAO;
				break;
		}
		ApiRoom.gameMessageNotify(ApiQzmjTS.gameDingQueNotify(type));
		this.node.active = false
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});