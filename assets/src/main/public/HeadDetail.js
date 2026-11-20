const ApiRoom = require('../../api/ApiRoom');
const ConfigModel = require('../../model/ConfigModel');
const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
const UserModel = require('../../model/UserModel');
const Enums = require('../../const/Enums');
const Utils = require('../../utils/Utils');
const MessageCallback = require('../../utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		gpsShowNode: cc.Node,
		headSprite: cc.Sprite,
		nickLbl: cc.Label,
		uidLbl: cc.Label,
		ipLbl: cc.Label,
		goldLbl: cc.Label,
		addressLbl: cc.Label,
		_fromChairID: null,
		_toChairID: null
	},

	start() {
		this.timer = 0
		this._clickNumber = 0
		this._fromChairID = this.node.nodeParams.fromChairID;
		this._toChairID = this.node.nodeParams.toChairID;
		this._canSendGift = this.node.nodeParams.canSendGift;
		AssetsManager.loadSpriteFrame({
			path: this.node.nodeParams.avatar,
			sprite: this.headSprite
		});
		this.nickLbl.string = this.node.nodeParams.name;
		this.uidLbl.string = this.node.nodeParams.id;
		this.node.nodeParams.ip = this.node.nodeParams.ip || '';
		this.ipLbl.string = !!ConfigModel.getData('ipVisible') ? this.node.nodeParams.ip : Utils.stringSecurity(this.node.nodeParams.ip);
		this.addressLbl.string = this.node.nodeParams.location || '未知';
		this.goldLbl.string = Math.floor(this.node.nodeParams.gold);
		let locationEnable = ConfigModel.getData('locationEnable');
		let showLocation = ConfigModel.getData('showLocation');
		if (this.gpsShowNode) this.gpsShowNode.active = !!locationEnable && !!showLocation;
	},

	onBtnClick(event, param) {
		if (UserModel.getRoomCreator("propsLimit")) {
			AssetsManager.tipDialog('该联盟房间禁用道具！');
			return;
		}
		if (!this._canSendGift) {
			AssetsManager.tipDialog('您不在座位上，请坐下后再试！');
			return;
		}
		let gift = ConfigModel.getGiftConfig(parseInt(param));
		if (!gift) return;
		if (this.node.nodeParams.id == UserModel.getData('uid')) {
			this._toChairID = this._fromChairID;
		}
		window.chatTimer = Date.now();
		ApiRoom.roomMessageNotify(ApiRoom.userGiftNotify(this._toChairID, parseInt(param)));
		this.onClose();
	},

	onTestClick() {
		this._clickNumber++
		// console.log(this._clickNumber, this.timer, '0.0');
		if (this._clickNumber < 2 || this._clickNumber >= 3) {
			return
		}
		this._clickNumber = 0
		this.timer = 0
		let isTest = UserModel.getData("isTest")
		if (!isTest) {
			return
		}
		if (this.node.nodeParams.id != UserModel.getData('uid')) {
			return
		}
		// console.log(this._clickNumber, this.timer, '1');
		MessageCallback.emitMessage('TestClickReq')
		this.node.destroy();
	},

	onClose() {
		if (this.node.getComponent('DialogWidgetCtrl')) {
			this.node.getComponent('DialogWidgetCtrl').out();
		} else {
			this.node.destroy();
		}
	},

	update(dt) {
		if (this._clickNumber > 0 && this._clickNumber != 2) {
			this.timer += dt
			if (this.timer >= 1) {
				this.timer = 0
				this._clickNumber = 0
			}
		}
	}
});