const NNModel = require('./NNModel');
const ApiNn = require('./ApiNn');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');

cc.Class({
	extends: cc.Component,
	properties: {
		label: cc.Label,
	},

	onLoad() {
		this.node.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
	},

	gameInit() {
		this.node.active = (NNModel.getTick() > 0);
	},

	messageCallbackHandler(route, msg) {
		if (!NNModel.getGameInited()) {
			return;
		}
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			}
		}
		if (route === 'GameMessagePush') {
			if (msg.type === ApiNn.GAME_STATUS_PUSH) {
				this.node.active = (NNModel.getTick() > 0);
			}
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},

	update(dt) {
		if (NNModel.isDismissing()) {
			return;
		}
		let tick = Math.floor(NNModel.getTick());
		if (tick > 0) {
			this.node.active = true;
			this.label.string = ((tick <= 9) ? '0' + tick : tick);
			NNModel.subTick(dt);
			let curTick = Math.floor(NNModel.getTick());
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