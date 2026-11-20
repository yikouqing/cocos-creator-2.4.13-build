const TWModel = require('./TWModel');
const ApiTw = require('./ApiTw');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');

cc.Class({
	extends: cc.Component,
	properties: {
		label: cc.Label,
		qiepaiIcon: cc.Node,
	},

	onLoad() {
		this.node.active = false;
		this.qiepaiIcon.active = false
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
	},

	gameInit() {
		if (TWModel.getGameStatus() == ApiTw.gameStatus.BAI_PAI) {
			this.node.active = (TWModel.getTick() > 0);
		} else {
			this.node.active = false
		}
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			}
		}
		if (route === 'GameMessagePush') {
			if (msg.type === ApiTw.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiTw.gameStatus.BAI_PAI || msg.data.gameStatus == ApiTw.gameStatus.WASH_CARD) {
					this.node.active = (TWModel.getTick() > 0);
					this.qiepaiIcon.active = msg.data.gameStatus == ApiTw.gameStatus.WASH_CARD
				} else {
					this.node.active = false
					this.qiepaiIcon.active = false
				}
			}
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},

	update(dt) {
		if (TWModel.isDismissing()) {
			return;
		}
		let tick = Math.floor(TWModel.getTick());
		if (tick > 0) {
			this.node.active = true;
			this.label.string = ((tick <= 9) ? '0' + tick : tick);
			TWModel.subTick(dt);
			let curTick = Math.floor(TWModel.getTick());
			if (curTick <= 3 && tick != curTick) {
				AssetsManager.playEffect({
					path: 'audio/common/daojishi1'
				});
			}
		} else {
			this.node.active = false;
			/* this.unschedule(this.clock); */
		}
	},
});