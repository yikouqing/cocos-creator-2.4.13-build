const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiHall = require('../../../src/api/ApiHall');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const SubManager = require('../../../src/utils/SubManager');
const GDModel = require('./GDModel');

cc.Class({
	extends: cc.Component,
	properties: {
		userList: cc.Node,
		gameName: cc.Label,
		roomIdLbl: cc.Label,
		btnOnceAgain: cc.Node,
		btnContinue: cc.Node,
		btnResultShare: cc.Node,

		_gameEndData: null,
	},

	start() {
		this.btnContinue.active = false;
		this._gameEndData = this.node.nodeParams;
		MessageCallback.addListener('RoomMessagePush', this);
		this.unionID = GDModel.getRoomCreatorByKey("unionID");
		let union = UserModel.getUnionInfo(this.unionID) || {};
		this.roomCreatorInfo = !!this.node.nodeParams ? this.node.nodeParams.roomCreatorInfo || {} : {};
		this.gameRule = !!this.node.nodeParams ? this.node.nodeParams.gameRule || {} : {};
		this.roomID = !!this.node.nodeParams ? this.node.nodeParams.roomID || null : null;
		this.gameName.string = this.gameRule.ruleName || ConfigModel.getGameName(this.gameRule.gameType);
		this.roomIdLbl.string = `房间号:${this.roomID}`;
		this.btnResultShare.active = !!ConfigModel.getData('gameResultWechatShare');
		this.init(this._gameEndData.result, this._gameEndData.creator);
		if (!!this.node.nodeParams.isUnionCreate) {
			this.btnContinue.active = !!ConfigModel.getData('canCreateUnionRoomAgain');
		} else {
			this.btnContinue.active = !!ConfigModel.getData('canCreateHallRoomAgain');
		}
	},

	init(result, creator) {
		AssetsManager.loadAsset({
			path: 'res/prefab/GDAllResultItem',
			aType: cc.Prefab,
			bundle: Enums.bundleType.GD
		}, (item) => {
			this.userList.destroyAllChildren();
			if (!item || !cc.isValid(this.userList)) return;
			for (let index = 0; index < result.length; index++) {
				const user = cc.instantiate(item);
				user.opacity = 0;
				this.userList.addChild(user);
				result[index].creatorUid = creator ? creator.uid : null;
				result[index].winMost = this._gameEndData.winMost;
				result[index].loseMost = this._gameEndData.loseMost;
				user.getComponent('GDAllResultItem') && user.getComponent('GDAllResultItem').bind(result[index]);
				user.stopAllActions();
				cc.tween(user)
					.delay(index * 0.2)
					.to(0.2, {
						opacity: 255
					})
					.start();
			}
		});
	},

	onButtonClick(event, param) {
		if (param == 'back') {
			this.node.nodeParams.enterHall();
		} else if (param == 'share') {
			let imgPath = CCUtil.capScreen(this.node);
			NativeUtil.wxShareImg(0, imgPath);
		} else if (param == 'continue') {
			if (CCUtil.clickInterval(event.target, 1.5, true)) return;
			if (!!this.node.nodeParams.isUnionCreate) {
				ApiHall.createUnionRoomAgainRequest({
					unionID: this.unionID,
					roomID: this.roomID,
					gameRule: this.gameRule,
					gameRuleID: this.gameRule['_id']
				});
			} else {
				ApiHall.createRoomRequest({
					gameRule: null,
					gameRuleID: this.gameRule['_id'],
					unionID: this.unionID,
					roomID: this.roomID
				});
			}
			MessageCallback.emitMessage('OnGameOnceAgain');
			this.btnContinue.active = false;
		}
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.node.destroy();
			}
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
	},
});