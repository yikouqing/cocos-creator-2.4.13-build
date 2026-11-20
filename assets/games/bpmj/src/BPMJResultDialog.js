const ApiRoom = require('../../../src/api/ApiRoom');
const ApiBpmj = require('./ApiBpmj');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const BPMJModel = require('./BPMJModel');
const MAX_USER_NUM = 4;
const Utils = require('../../../src/utils/Utils');

cc.Class({
	extends: cc.Component,
	properties: {
		userLayOut: cc.Node,
		userItemNode: cc.Node,
		cardNode: cc.Node,
		clockLabel: cc.Label,
		bureauLabel: cc.Label,

		text_roomInfo: cc.Label,

		showdice1: cc.Node,
		showdice2: cc.Node,
		_myChairId: null, //自己的座位号
	},

	start() {
		this.showDiceVal(false);
		if (!!this.node.nodeParams.result) {
			this.resultData = JSON.parse(JSON.stringify(this.node.nodeParams.result));
		}
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
		let resBtnNode = cc.find('resBtnNode', this.node);
		this.userItemNode.active = false;
		reviewBtnNode.active = false;
		resBtnNode.active = false;
		this.tick = 30;
		if (this.node.nodeParams.isResult) { //正常结算页面
			// cc.find("Clock", resBtnNode).active = !this.node.nodeParams.isBureauFull;
			// console.log('正常结算', this.node.nodeParams)
			resBtnNode.active = true;
			this.node.active = true;
			this.setAllHandCards();
		} else if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			// console.log('视频回放', this.node.nodeParams)
			this.setAllHandCards();
		} else { //战绩回放页面显示左右翻页按钮
			reviewBtnNode.active = true;
			// console.log('战绩回放', this.node.nodeParams)
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			if (lastItem && !lastItem.result) { // 最后一局未完成，删除
				this.reviewRecord.pop();
			}
			this.bureau = 0;
			this.showResult();
		}
	},

	showResult() {
		this.bureauLabel.string = this.bureau + 1;
		let CurObj = this.reviewRecord[this.bureau];
		// console.log("CurObj", CurObj)
		this.resultData = JSON.parse(JSON.stringify(CurObj.result));
		if (CurObj) {
			if (!!CurObj.baseRoomRecords) {
				this.showDiceVal(true, CurObj.baseRoomRecords.dice1, CurObj.baseRoomRecords.dice2);
				this.showRoomInfo(CurObj.baseRoomRecords.gameRule, CurObj.baseRoomRecords.roomID);
			} else if (!!CurObj.plusInfo) {
				let diceInfo = CurObj.plusInfo.diceInfo;
				this.showRoomInfo(CurObj.plusInfo.gameRule);
				diceInfo & this.showDiceVal(true, diceInfo.dice1, diceInfo.dice2);
			}
		}
		this.findMyChairId()
		this.showUserInfo();
	},

	setAllHandCards() {
		this.findMyChairId();
		this.showUserInfo();
		let diceInfo = BPMJModel.getDiceInif();
		this.showRoomInfo(BPMJModel.getGameRule());
		diceInfo && this.showDiceVal(true, diceInfo.dice1, diceInfo.dice2);
	},


	showDiceVal(isShow, d1, d2, ) {
		let dice1 = this.showdice1;
		let dice2 = this.showdice2;
		if (dice1 && dice2) {
			dice1.active = isShow;
			dice2.active = isShow;
			if (!isShow) return false;
			d1 && AssetsManager.loadSpriteFrame({
				bundle: Enums.bundleType.BPMJ,
				sprite: dice1.getComponent(cc.Sprite),
				path: "res/dices/mj_dice-sezi_value" + d1,
			})
			d2 && AssetsManager.loadSpriteFrame({
				bundle: Enums.bundleType.BPMJ,
				sprite: dice2.getComponent(cc.Sprite),
				path: "res/dices/mj_dice-sezi_value" + d2,
			})
		}
	},
	showRoomInfo(gameRule, roomID) {
		gameRule = gameRule || BPMJModel.getGameRule();
		roomID = roomID || BPMJModel.getRoomID();
		if (!gameRule) return false;
		let str = roomID ? "房间号:" + roomID : "";
		str += ` 封顶:${gameRule.maxScore}分`;
		str += ` 玩法:${gameRule.qiHuType == 0 ? "一片起胡(有花不用爆头也可胡）" : "两片起胡(有花需要爆头才能胡）"}`;
		this.text_roomInfo.string = str;
	},

	/**找出自己的座位号 */
	findMyChairId() {
		if (!this.resultData) return;
		this._myChairId = 0;
		for (let i = 0; i < this.resultData.length; i++) {
			const user = this.resultData[i];
			if (UserModel.getData("uid") === user.uid) {
				this._myChairId = i;
			}
		}
	},

	/**选中头像后展示信息 */
	showUserInfo() {
		this.userLayOut.removeAllChildren();
		if (!this.resultData) return;
		let users = this.resultData;
		// console.log('小结算', users);
		for (const user of users) {
			if (!user) continue;
			let userID = user.uid;
			let userItem = cc.instantiate(this.userItemNode);
			userItem.parent = this.userLayOut;
			userItem.active = true;
			cc.find('txt_nick', userItem).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 4, '..');
			cc.find('txt_uid', userItem).getComponent(cc.Label).string = userID == UserModel.getData("uid") ? userID : Utils.stringSecurity(userID);
			AssetsManager.loadSpriteFrame({
				path: user.avatar,
				sprite: cc.find('head', userItem).getComponent(cc.Sprite)
			});
			let score = !!user.winScores ? parseFloat(user.winScores) : 0,
				isWin = score >= 0;
			let win = cc.find('win', userItem).getComponent(cc.Label);
			let lose = cc.find('lose', userItem).getComponent(cc.Label);
			win.string = '+' + Utils.formatNumberWithDecimal(score);
			lose.string = Utils.formatNumberWithDecimal(score);
			let cardsLayout = cc.find('cardsLayout', userItem);
			if (cardsLayout) cardsLayout.removeAllChildren();
			lose.node.active = !isWin;
			win.node.active = isWin;

			let handCards = !user.userCards || !user.userCards[userID] ? [] : user.userCards[userID];
			let posx = 0,
				cardWidth = 44.28,
				nullWidth = 15;
			posx += cardWidth / 2;
			let pengGangArray = user.operateArray || [];
			for (let i = 0; i < pengGangArray.length; ++i) {
				let obj = pengGangArray[i];
				let count = (ApiBpmj.operateType.PENG == obj.operate || ApiBpmj.operateType.CHI == obj.operate) ? 3 : 4;
				let cardList = [obj.card, obj.card, obj.card];
				if (ApiBpmj.operateType.PENG !== obj.operate) {
					cardList = obj.plusInfo.cardList;
				}
				for (let j = 0; j < count; ++j) {
					let card = cardList[j];
					let node = this.getPengGangCardNode(user.laiZiCards, card, j, obj.operate == ApiBpmj.operateType.GANG_ZHI, obj.operate == ApiBpmj.operateType.GANG_BU);
					node.parent = cardsLayout;
					if (count == 4 && j == 3) {
						node.y = 8;
						node.x = posx - 2 * cardWidth;
					} else {
						node.x = posx;
						posx += cardWidth;
					}
				}
				posx += nullWidth;
			}

			if (isWin) {
				// let huTypeSrpite = cc.find('huIndex', userItem).getComponent(cc.Sprite);
				// let huType = user.huType || 0;
				// huTypeSrpite.spriteFrame = null;
				// AssetsManager.loadSpriteFrame({
				// 	path: `res/sprite/hu/hu${huType}`,
				// 	sprite: huTypeSrpite,
				// 	bundle: Enums.bundleType.BPMJ
				// })

				let huCards = user.huCards || 0;
				/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
				if (user.huType === ApiBpmj.operateType.HU_ZHI ||
					user.huType === ApiBpmj.operateType.YOU_JIN ||
					user.huType === ApiBpmj.operateType.SAN_JIN ||
					user.huType === ApiBpmj.operateType.SI_BAI_BAN) {
					let huCardIndex = handCards.indexOf(huCards);
					if (huCardIndex >= 0) {
						handCards.splice(huCardIndex, 1);
					}
				}
				this.sortHandCards(handCards)
				for (let i = 0; i < handCards.length; ++i) {
					let node = this.getCardNode(handCards[i], user.laiZiCards);
					node.parent = cardsLayout;
					node.x = posx;
					posx += cardWidth;
				}
				if (huCards && huCards > 0) {
					posx += nullWidth;
					let huCardNode = this.getCardNode(huCards, user.laiZiCards);
					huCardNode.parent = cardsLayout;
					huCardNode.x = posx;
				}
			} else {
				this.sortHandCards(handCards)
				for (let i = 0; i < handCards.length; ++i) {
					let node = this.getCardNode(handCards[i], user.laiZiCards);
					node.parent = cardsLayout;
					node.x = posx;
					posx += cardWidth;
				}
			}

			let userPlusType = user.userPlusType || {};
			let plusTypeList = userPlusType[userID] || [];
			let cardTypeItem = cc.find('cardTypeItem', userItem);
			let cardTypeLayout = cc.find('cardTypeLayout', userItem);
			let showPlusStr = (str) => {
				let textItem = cc.instantiate(cardTypeItem);
				if (!textItem || !cardTypeLayout) return false;
				let textLabel = textItem.getComponent(cc.Label);
				textItem.parent = cardTypeLayout;
				textItem.setPosition(0, 0);
				textLabel.string = str;
			}
			plusTypeList.forEach((CurObj) => {
				let str = ApiBpmj.plusRateTypeStr[CurObj.type] || "";
				if (CurObj.scoreType == 0) {
					showPlusStr(str);
				} else if (CurObj.scoreType == 1) {
					let fuhao = CurObj.score > 0 ? "+" : "";
					showPlusStr(str + fuhao + CurObj.score);
				} else if (CurObj.scoreType == 2) {
					showPlusStr(str + "x" + CurObj.score);
				}
			})
		}
	},

	/**头像点击响应 */
	userTogClick(event) {},


	/**给手牌重新排序 */
	sortHandCards(handCards) {
		handCards.sort((a, b) => a - b)
		let ghostList = BPMJModel.getGhostCard();
		let myGhost = []
		for (let i = 0; i < handCards.length; i++) {
			const card = handCards[i];
			if (ghostList == card) {
				myGhost.push(card)
				handCards.splice(i, 1)
				i--;
			}
		}
		for (let i = 0; i < myGhost.length; i++) {
			handCards.unshift(myGhost[i])
		}
	},

	update(dt) {
		if (this.node.nodeParams.isResult) {
			this.tick -= dt;
			let tick = Math.floor(this.tick);
			if (tick > 0) {
				this.clockLabel.string = tick;
			} else {
				this.clockLabel.string = '0';
			}
		}
	},

	onBtnClick(event, parameters) {

		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				this.node.destroy();
			} else {
				if (this.node.nodeParams.mainComp &&
					this.node.nodeParams.mainComp.showMJAllResultFunc) {
					this.node.nodeParams.mainComp.showMJAllResultFunc();
					this.node.destroy();
				}
			}
		} else if (parameters === 'exit') {
			this.node.destroy();
		}
	},

	getCardNode(card, ghost) {
		let node = cc.instantiate(this.cardNode);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('BPMJSingleTile')
		com.init()
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(ghost == card);
		return node;
	},

	getPengGangCardNode(ghost, card, i, isAnGang, isBuGang) {
		let node = cc.instantiate(this.cardNode);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('BPMJSingleTile')
		com.init()
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(card == ghost);
		if (!!isAnGang && i < 3 || !!isBuGang && i == 3) {
			com.setCover(true)
		}
		return node;
	},

	/**座位号转换 */
	getUserChairIndex(chairID) {
		return (chairID - this._myChairId + MAX_USER_NUM) % MAX_USER_NUM;
	},

	/**回放使用的左右按钮 */
	nextResult() {

		if (this.bureau + 1 >= this.reviewRecord.length) return;
		++this.bureau;
		this.showResult();
	},

	preResult() {

		if (this.bureau - 1 < 0) return;
		--this.bureau;
		this.showResult();
	},
});