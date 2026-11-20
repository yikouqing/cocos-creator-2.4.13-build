const ApiRoom = require('../../../src/api/ApiRoom');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiHall = require('../../../src/api/ApiHall');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');
const JGPTJModel = require('./JGPTJModel');

cc.Class({
	extends: cc.Component,
	properties: {
		itemArray: cc.Node,
		btnContinue: cc.Node,
		btnResultShare: cc.Node,
		scoreItem: cc.Node,
		text_roomID: cc.Label,
		text_endTime: cc.Label,
		text_gameRule: cc.Label,
		_data: null
	},

	onLoad() {
		this.scoreItem.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		if (!this.node.nodeParams) return;
		let data = this.node.nodeParams;
		// console.log("总结算数据包==", data);
		this._data = data;
		if (data) {
			this.roomID = data.roomID || null;
			this.unionID = data.unionID || null;
			this.gameRule = data.gameRule || {};
		}
		this.init(data.result, data.creator, data.plusInfo);
		if (!!data.isUnionCreate) {
			this.btnContinue.active = !!ConfigModel.getData('canCreateUnionRoomAgain');
		} else {
			this.btnContinue.active = ConfigModel.getData('canCreateHallRoomAgain');
		}
		this.btnResultShare.active = !!ConfigModel.getData('gameResultWechatShare');
	},

	init(result, creator) {
		let plusInfo = this._data.plusInfo || null;
		let myUid = UserModel.getData("uid");
		let allTotal = {}, timeObj = null;
		if (plusInfo) {
			allTotal = plusInfo.totalSettlementlist || {};
			timeObj = Utils.getDateFormat(plusInfo.endTime);
		}

		this.itemArray.children.forEach((CurNode, index) => {
			let CurData = result[index];
			CurNode.stopAllActions();
			CurNode.active = false;
			if (!CurData) return;
			let isWin = CurData.score > 0;
			let CurTota = allTotal[CurData.uid];
			cc.find('text_win', CurNode).active = isWin;
			cc.find('text_lose', CurNode).active = !isWin;
			cc.find('img_win', CurNode).active = CurData.score > 0;
			cc.find('img_lose', CurNode).active = CurData.score < 0;
			cc.find('bg_my', CurNode).active = CurData.uid == myUid;
			cc.find('winmost', CurNode).active = CurData.uid == this._data.winMost;
			cc.find('losemost', CurNode).active = CurData.uid == this._data.loseMost;
			cc.find('text_lose', CurNode).getComponent(cc.Label).string = CurData.score;
			cc.find('fangzhu', CurNode).active = !!creator && CurData.uid == creator.uid;
			cc.find('text_uid', CurNode).getComponent(cc.Label).string = "ID:" + CurData.uid;
			cc.find('text_win', CurNode).getComponent(cc.Label).string = '+' + CurData.score;
			cc.find('text_shengli', CurNode).getComponent(cc.Label).string = CurTota ? CurTota.Win || 0 : 0;
			cc.find('text_bajiu', CurNode).getComponent(cc.Label).string = CurTota ? CurTota.BaJiuDian || 0 : 0;
			cc.find('text_tongsha', CurNode).getComponent(cc.Label).string = CurTota ? CurTota.TongSha || 0 : 0;
			cc.find('text_tongpei', CurNode).getComponent(cc.Label).string = CurTota ? CurTota.TongPei || 0 : 0;
			cc.find('text_name', CurNode).getComponent(cc.Label).string = CCUtil.stringClamp(CurData.nickname, 7, '..');
			AssetsManager.loadSpriteFrame({ path: CurData.avatar, sprite: cc.find('head', CurNode).getComponent(cc.Sprite) });
			let content = cc.find("winList/view/content", CurNode);
			let winList = CurData.winList || [];//每一局的分数
			content.removeAllChildren();
			winList.forEach((score) => {
				let scoreNode = cc.instantiate(this.scoreItem);
				cc.find('title', scoreNode).getComponent(cc.Label).string = "第" + (i + 1) + "局";
				cc.find('score', scoreNode).getComponent(cc.Label).string = score > 0 ? '+' + score : score;
				scoreNode.parent = content
				scoreNode.active = true;
			})
			CurNode.active = true;
			CurNode.opacity = 0;
			cc.tween(CurNode)
				.delay(index * 0.3)
				.to(0.3, {
					opacity: 255
				})
				.start();
		})

		this.text_gameRule.string = this.gameRule ? ConfigModel.getRoomRuleShare(this.gameRule).content : "";
		this.text_roomID.string = plusInfo ? "房间号：" + plusInfo.roomID : "";
		this.text_endTime.string = timeObj ? timeObj.yyyymmddhhmmss : "";
	},

	onButtonClick(event, param) {

		if (param == 'back') {
			this._data.enterHall()
		} else if (param == 'share') {
			let imgPath = CCUtil.capScreen(this.node);
			NativeUtil.wxShareImg(0, imgPath);
		} else if (param == 'continue') {
			if (CCUtil.clickInterval(event.target, 1.5, true)) return;
			event.target.active = false;
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