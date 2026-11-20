const TWLogic = require('TWLogic');
const TWModel = require('TWModel');
const ApiTw = require('./ApiTw');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');

cc.Class({
	extends: cc.Component,

	properties: {
		richLabel: cc.RichText,
		typeSprite: cc.Sprite
	},

	onLoad() { },

	onDestroy() { },

	setLabel(type) {
		this.richLabel.string = '恭喜获得特殊牌型,是否选择免摆';
		this.setNodeSpriteFrame(type);
	},
	setNodeSpriteFrame(type) {
		let url = 'res/sprite/cardtype/' + type;
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: this.typeSprite,
			bundle: Enums.bundleType.SSS
		});
	},

	onButtonClick(event, param) {
		if (param === 'confirm') {
			ApiRoom.gameMessageNotify(ApiTw.getGameNosortRequestData(true), Date.now());
			this.node.destroy();
		} else if (param === 'cancel') {
			ApiRoom.gameMessageNotify(ApiTw.getGameNosortRequestData(false), Date.now());
			this.node.destroy();
		}
	}
});