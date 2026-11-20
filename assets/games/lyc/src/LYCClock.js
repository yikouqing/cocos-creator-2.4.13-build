const LYCModel = require('./LYCModel');
const ApiLyc = require('./ApiLyc');
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
		this.node.active = (LYCModel.getTick() > 0);
	},

	messageCallbackHandler(route, msg) {
		if (!LYCModel.getGameInited()) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			}
		}
		if (route === 'GameMessagePush') {
			if (msg.type === ApiLyc.GAME_STATUS_PUSH && msg.data.gameStatus !== ApiLyc.gameStatus.CHOOSE_OPERATE) {
				this.node.active = (LYCModel.getTick() > 0);
			} else if (msg.type === ApiLyc.GAME_USER_OPERATE_START_PUSH) {
				this.node.active = (LYCModel.getTick() > 0);
			}
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},

	update(dt) {
		if (LYCModel.isDismissing()) {
			return;
		}
		let tick = Math.floor(LYCModel.getTick());
		if (tick > 0) {
			this.node.active = true;
			this.label.string = ((tick <= 9) ? '0' + tick : tick);
			LYCModel.subTick(dt);
			let curTick = Math.floor(LYCModel.getTick());
			if (curTick <= 3 && tick != curTick) {
				AssetsManager.playEffect({
					path: 'audio/common/daojishi1'
				});
			}
		} else {
			this.node.active = false;
			this.unschedule(this.clock);
		}
	},
});