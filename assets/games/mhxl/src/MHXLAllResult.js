const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiHall = require('../../../src/api/ApiHall');
const ConfigModel = require('../../../src/model/ConfigModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const MHXLModel = require('./MHXLModel');
const Utils = require('../../../src/utils/Utils');
const UserModel = require('../../../src/model/UserModel');
const ApiMhxl = require('./ApiMhxl');
cc.Class({
	extends: cc.Component,
	properties: {
		content: cc.Node,
		userItemScoreType: cc.Node,
		btnContinue: cc.Node,
		btnResultShare: cc.Node,
	},

	onLoad() {
		MessageCallback.addListener('RoomMessagePush', this);
		let data = this.node.nodeParams;
		let myChairID = MHXLModel.getMyChairID()
		this.init(data);
		if (!!this.node.nodeParams.isUnionCreate) {
			this.btnContinue.active = !!ConfigModel.getData('canCreateUnionRoomAgain');
		} else {
			this.btnContinue.active = !!ConfigModel.getData('canCreateHallRoomAgain');
		}
		this.btnResultShare.active = !!ConfigModel.getData('gameResultWechatShare');
		MHXLModel.resetAll();
	},

	init(data) {
		// console.log(data,'大结算的数据111111111111');
		let userItem = cc.find('Item', this.node)
		let userArray = data.result || [];
		userItem.active = false;
		for (let i = 0; i < userArray.length; ++i) {
			let user = userArray[i];
			let item = cc.instantiate(userItem);
			item.x = 0
			item.parent = this.content
			item.active = true;
			cc.find('name', item).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 6, '..');
			// cc.find('uid', item).getComponent(cc.Label).string = "ID:" + (user.uid != UserModel.getData("uid") ? Utils.stringSecurity(user.uid) : user.uid);
			cc.find('uid', item).getComponent(cc.Label).string = "ID:" + user.uid;
			let head = cc.find('head', item);
			let winList = user.winList || [];
			let winScore = 0;
			winList.map((score) => {
				winScore += score;
			});
			cc.find('win', item).active = winScore > 0;
			cc.find('lose', item).active = winScore <= 0;
			if (winScore > 0) {
				cc.find('win', item).getComponent(cc.Label).string = '+' + Utils.formatNumberWithDecimal(winScore, 2);
			} else {
				cc.find('lose', item).getComponent(cc.Label).string = Utils.formatNumberWithDecimal(winScore, 2);
			}
			cc.find('winmost', item).active = data.winMost == user.uid;
			cc.find('losemost', item).active = data.loseMost == user.uid;
			AssetsManager.loadSpriteFrame({
				path: user.avatar,
				sprite: head.getComponent(cc.Sprite)
			});


			/**每一局的分数 */
			let cardsLayout = cc.find('cardType/view/content', item);
			if (cardsLayout) cardsLayout.removeAllChildren()
			let showCurStr = (type, score) => {
				// 每一局的分数，和类型
				let itemScore = cc.instantiate(this.userItemScoreType);
				let optType = cc.find('title', itemScore).getComponent(cc.Label)
				let optScore = cc.find('score', itemScore).getComponent(cc.Label)
				optType.string = type;
				optScore.string = score;
				itemScore.parent = cardsLayout;
			}

			//操作类型和分数
			let array = data.plusInfo.userPlusTypeSum[user.uid]
			let userPlusType = [];
			let newObj = {};
			for (let index = 0; index < array.length; index++) {
				let optType = array[index];
				if (!newObj[optType.type]) {
					newObj[optType.type] = [];
				}
				newObj[optType.type].push(optType.score);
			}

			for (const key in newObj) {
				let sonList = newObj[key] || [];
				let allscore = sonList.reduce((a, b) => a + b);
				userPlusType.push({
					type: parseInt(key),
					score: allscore
				});
			}

			let allscore = 0;
			if (Array.isArray(userPlusType) && userPlusType.length > 0) {
				userPlusType.forEach(info => {
					if (info.score != 0) {
						let score = Utils.formatNumberWithDecimal(info.score, 1);
						let name = ApiMhxl.plusRateTypeStr[info.type];
						let str = score > 0 ? "+" + score : score;
						allscore += score;
						showCurStr(name, str);
					}
				});
			}
			// cc.find('txt_zimo', item).getComponent(cc.Label).string = `自摸${user.zhiMoCount || 0}次`;
			// cc.find('txt_jiepao', item).getComponent(cc.Label).string = `接炮${user.jiePaoCount || 0}次`;
			// cc.find('txt_dianpao', item).getComponent(cc.Label).string = `点炮${user.dianPaoCount || 0}次`;
			// cc.find('txt_minggang', item).getComponent(cc.Label).string = `明杠${user.mingGangCount || 0}次`;
			// cc.find('txt_angang', item).getComponent(cc.Label).string = `暗杠${user.anGangCount || 0}次`;
			// cc.find('txt_men', item).getComponent(cc.Label).string = `闷牌${user.menPaiCount || 0}次`;
		}
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
				// ApiHall.quickJoinRequest({
				// 	gameRuleID: MHXLModel.getGameRuleByKey('_id'),
				// 	unionID: MHXLModel.getRoomCreatorByKey('unionID'),
				// });
				ApiHall.createUnionRoomAgainRequest({
					unionID: MHXLModel.getRoomCreatorByKey('unionID'),
					roomID: MHXLModel.getRoomID(),
					gameRule: MHXLModel.getGameRule(),
					gameRuleID: MHXLModel.getGameRuleByKey('_id')
				});
			} else {
				ApiHall.createRoomRequest({
					gameRule: null,
					gameRuleID: MHXLModel.getGameRuleByKey('_id'),
					unionID: MHXLModel.getRoomCreatorByKey('unionID'),
					roomID: MHXLModel.getRoomID()
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