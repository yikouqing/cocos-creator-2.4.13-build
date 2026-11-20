const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiHall = require('../../../src/api/ApiHall');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ZGZModel = require("./ZGZModel")
cc.Class({
	extends: cc.Component,
	properties: {
		scoreItem: cc.Node,
		item: cc.Node,
		btnContinue: cc.Node,
		btnResultShare: cc.Node,
		content: cc.Node,
		gameName: cc.Label,
		roomIdLbl: cc.Label,
		_data: null
	},

	onLoad() {
		this.item.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		let data = this.node.nodeParams;
		// console.log("总结算数据包==", data);
		this._data = data
		this.unionID = !!data ? data.unionID || null : null;
		this.gameRule = !!data ? data.gameRule || {} : {};
		this.roomID = !!data ? data.roomID || null : null;
		this.gameName.string = this.gameRule.ruleName || "扎股子";
		this.roomIdLbl.string = `房间号:${this.roomID}`;
		this.init(data.result, data.creator);
		if (!!data.isUnionCreate) {
			this.btnContinue.active = !!ConfigModel.getData('canCreateUnionRoomAgain');
		} else {
			this.btnContinue.active = !!ConfigModel.getData('canCreateHallRoomAgain');
		}
		this.btnResultShare.active = !!ConfigModel.getData('gameResultWechatShare');
	},

	init(userArray, creator) {
		for (let i = 0; i < userArray.length; ++i) {
			let data = userArray[i];
			if (!data) continue;
			let item = cc.instantiate(this.item);
			item.parent = this.content;
			item.active = true;
			item.y = 0
			item.stopAllActions();
			item.opacity = 0;
			let userName = cc.find('name', item)
			userName.color = data.score >= 0 ? new cc.Color().fromHEX('#D48733') : new cc.Color().fromHEX('#46506F');
			userName.getComponent(cc.Label).string = CCUtil.stringClamp(data.nickname, 7, '..');
			cc.find('fangzhu', item).active = !!creator && data.uid == creator.uid;
			let head = cc.find('head', item);
			cc.find('losemost', item).active = data.uid == this._data.loseMost;
			cc.find('winmost', item).active = data.uid == this._data.winMost;
			cc.find('item_big_win', item).active = data.score >= 0;
			cc.find('item_big_lose', item).active = data.score < 0;
			if (data.score >= 0) {
				cc.find('win', item).getComponent(cc.Label).string = '+' + data.score;
				cc.find('lose', item).active = false;
			} else {
				cc.find('lose', item).getComponent(cc.Label).string = data.score;
				cc.find('win', item).active = false;
			}
			AssetsManager.loadSpriteFrame({
				path: data.avatar,
				sprite: head.getComponent(cc.Sprite)
			});
			/**每一局的分数 */
			let winList = data.winList
			let winListNode = cc.find("winList", item)
			winListNode.getComponent(cc.ScrollView).enabled = winList.length > 6;
			let content = cc.find("winList/view/content", item)
			for (let i = 0; i < winList.length; i++) {
				const score = winList[i];
				let scoreNode = cc.instantiate(this.scoreItem)
				let titleNode = cc.find('title', scoreNode)
				titleNode.color = data.score >= 0 ? new cc.Color().fromHEX('#D48733') : new cc.Color().fromHEX('#46506F');
				titleNode.getComponent(cc.Label).string = "第" + (i + 1) + "局";
				let scoreLabel = cc.find('score', scoreNode)
				scoreLabel.color = data.score >= 0 ? new cc.Color().fromHEX('#D48733') : new cc.Color().fromHEX('#46506F');
				scoreLabel.getComponent(cc.Label).string = score > 0 ? '+' + score : score;
				scoreNode.parent = content
				scoreNode.active = true;
			}
			item.active = true;
			cc.tween(item)
				.delay(i * 0.3)
				.to(0.3, {
					opacity: 255
				})
				.start();
		}
	},

	onButtonClick(event, param) {

		if (param == 'back') {
			this._data.enterHall()
		} else if (param == 'share') {
			let imgPath = CCUtil.capScreen(this.node);
			NativeUtil.wxShareImg(0, imgPath);
		} else if (param == 'continue') {
			if (CCUtil.clickInterval(event.target, 1.5, true)) return;
			if (!!this._data.isUnionCreate) {
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