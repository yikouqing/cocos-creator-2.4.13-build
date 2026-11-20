const ApiRoom = require('../../../src/api/ApiRoom');
const ApiTsmj = require('./ApiTsmj');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const TSMJModel = require('./TSMJModel');
const MAX_USER_NUM = 4;
const Utils = require('../../../src/utils/Utils');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		userLayOut: cc.Node,
		userItemNode: cc.Node,
		cardTypeItemNode: cc.Node,
		cardNode: cc.Node,
		img_title: cc.Sprite,
		clockLabel: cc.Label,
		bureauLabel: cc.Label,
		txt_roomInfo: cc.Label,
		_myChairId: null, //自己的座位号
		_gameRule: null, //游戏规则
		_roomId: 0, //房间号
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);

		if (!!this.node.nodeParams.result) {
			this.resultData = JSON.parse(JSON.stringify(this.node.nodeParams.result));
			this._gameRule = this.node.nodeParams.gameRule
			this._roomId = this.node.nodeParams.roomID
			this._maPaiInfo = Utils.deepCopy(this.node.nodeParams.maPaiInfo)
			this._winUid = this.node.nodeParams.winUid
		}
		this.tick = 30;
		let resBtnNode = cc.find('resBtnNode', this.node);
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
		let clockNode = cc.find("Clock", resBtnNode);
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			reviewBtnNode.active = false;
			resBtnNode.active = false;
		} else if (this.node.nodeParams.isResult) { //正常结算页面
			reviewBtnNode.active = false;
			resBtnNode.active = true;
			clockNode.active = !this.node.nodeParams.isBureauFull;
		} else { //战绩回放页面显示左右翻页按钮
			resBtnNode.active = false;
			reviewBtnNode.active = true;
			// console.log('回放', this.node.nodeParams)
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			if (lastItem && !lastItem.result) {
				/* 最后一局未完成，删除 */
				this.reviewRecord.pop();
			}
			this.bureau = 0;
		}
		if (this.reviewRecord && this.reviewRecord[this.bureau]) {
			this._gameRule = this.reviewRecord[this.bureau].gameRule
			this._roomId = this.reviewRecord[this.bureau].roomID
		}
		this.setRoomInfo()
		if (this.node.nodeParams.isResult) {
			this.setAllHandCards();
			this.node.active = true;
		} else if (this.node.nodeParams.isReview) {
			this.setAllHandCards();
		} else {
			this.showResult()
		}
	},

	setRoomInfo() {
		let str = ""
		if (this._roomId) {
			str += `房号:${this._roomId}`
		}
		if (this._gameRule) {
			str += `  底分:${this._gameRule.baseScore}`
		}

		if (str != "") {
			this.txt_roomInfo.string = str
		}
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

	setAllHandCards() {
		this.findMyChairId();
		this.showUserInfo();

		/**马牌 */
		let maPaiInfo = this._maPaiInfo;
		if (maPaiInfo) {
			let maLabel = cc.find('mapai', this.node);
			maLabel.active = true;
			let maLayout = cc.find('layout', maLabel);
			maLayout.removeAllChildren()

			let maCards = maPaiInfo.maCards
			let myMa = maPaiInfo.zhongMaList
			if (maCards && maCards.length > 0) {
				for (let i = 0; i < maCards.length; ++i) {
					/*马牌*/
					let node = this.getCardNode(maCards[i]);
					cc.find('win', node).active = myMa.includes(maCards[i]);
					node.parent = maLayout;
				}
			}
		}
	},

	/**选中头像后展示信息 */
	showUserInfo() {
		this.userLayOut.removeAllChildren();

		if (!this.resultData) return;
		let users = this.resultData;
		if (!users) return;
		// console.log('小结算', users);
		let myScore = 0
		for (const user of users) {
			if (!user) continue;
			let uNode = cc.instantiate(this.userItemNode);
			uNode.parent = this.userLayOut;
			uNode.active = true;
			cc.find('txt_nick', uNode).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 4, '..');
			// cc.find('txt_uid', uNode).getComponent(cc.Label).string = user.uid != UserModel.getData("uid") ? Utils.stringSecurity(user.uid) : user.uid;
			cc.find('txt_uid', uNode).getComponent(cc.Label).string = 'ID:' + user.uid;
			cc.find("banker", uNode).active = user.bankerUid == user.uid
			AssetsManager.loadSpriteFrame({
				path: user.avatar,
				sprite: cc.find('head', uNode).getComponent(cc.Sprite)
			});
			let score = user.winScores || 0;
			score = parseFloat(score);
			let win = cc.find('win', uNode).getComponent(cc.Label);
			let lose = cc.find('lose', uNode).getComponent(cc.Label);

			if (score > 0) {
				win.node.active = true;
				lose.node.active = false
				win.string = '+' + Utils.formatNumberWithDecimal(score);
			} else {
				lose.node.active = true;
				win.node.active = false
				lose.string = Utils.formatNumberWithDecimal(score);
			}
			if (user.uid == UserModel.getData("uid")) {
				myScore = score
			}

			let cardsLayout = cc.find('cardsLayout', uNode);
			if (cardsLayout) cardsLayout.removeAllChildren()
			let posx = 0,
				cardWidth = 44.28,
				nullWidth = 15;
			posx += cardWidth / 2;
			let handCards = !user.userCards || !user.userCards[user.uid] ? [] : user.userCards[user.uid].slice();
			let pengGangArray = user.operateArray || [];
			if (pengGangArray.length > 0) {
				for (let i = 0; i < pengGangArray.length; ++i) {
					let obj = pengGangArray[i];
					let count = (ApiTsmj.operateType.PENG == obj.operate || ApiTsmj.operateType.CHI == obj.operate) ? 3 : 4;
					let cardList = [obj.card, obj.card, obj.card];
					if (ApiTsmj.operateType.PENG !== obj.operate) {
						cardList = obj.plusInfo.cardList;
					}
					for (let j = 0; j < count; ++j) {
						let card = cardList[j];
						let node = this.getPengGangCardNode(user.laiZiCards, card, j, obj.operate == ApiTsmj.operateType.GANG_ZHI, obj.operate == ApiTsmj.operateType.GANG_BU);
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
			}

			let huTypeSrpite = cc.find('huIndex', uNode).getComponent(cc.Sprite);
			if (user.loseUid == user.uid) {
				huTypeSrpite.node.active = true
				huTypeSrpite.spriteFrame = null;
				AssetsManager.loadSpriteFrame({
					path: `res/sprite/hu/hu100`,
					sprite: huTypeSrpite,
					bundle: Enums.bundleType.TSMJ
				})
			}

			let huType = user.huType || 0;
			if (huType != -1) {
				huTypeSrpite.node.active = true

				huTypeSrpite.spriteFrame = null;
				AssetsManager.loadSpriteFrame({
					path: `res/sprite/hu/hu${huType}`,
					sprite: huTypeSrpite,
					bundle: Enums.bundleType.TSMJ
				})

				let huCards = user.huCards || 0;
				/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
				if (user.huType === ApiTsmj.operateType.HU_ZHI) {
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

			// userPlusType
			let userPlusType = user.userPlusType[user.uid]
			if (Array.isArray(userPlusType) && userPlusType.length > 0) {
				let txt_plusType = cc.find("txt_plusType", uNode)
				let cardTypeLayout = cc.find("cardTypeLayout", uNode)
				userPlusType.forEach(info => {
					let fuhao = "x"
					if (info.type == ApiTsmj.plusRateType.GANG) {
						if (info.score >= 0) fuhao = "+"
						else fuhao = ""
					}
					let score = fuhao + info.score
					let txtNode = cc.instantiate(txt_plusType)
					txtNode.parent = cardTypeLayout
					txtNode.getComponent(cc.Label).string = ApiTsmj.plusRateTypeStr[info.type] + score
				});
			}
		}

		let url = "res/sprite/result/lose"
		if (!this._winUid || this._winUid.length == 0) {
			url = `res/sprite/result/liuju`
		} else if (myScore > 0) {
			url = "res/sprite/result/win"
		}
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: this.img_title,
			bundle: Enums.bundleType.TSMJ
		})
	},

	/**头像点击响应 */
	userTogClick() { },

	showResult() {
		this.bureauLabel.string = this.bureau + 1;
		this.resultData = Utils.deepCopy(this.reviewRecord[this.bureau].result)
		this._maPaiInfo = Utils.deepCopy(this.reviewRecord[this.bureau].maPaiInfo)
		this._winUid = this.reviewRecord[this.bureau].winUid
		this.setAllHandCards()
	},

	/**给手牌重新排序 */
	sortHandCards(handCards) {
		handCards.sort((a, b) => a - b)
		let ghostList = TSMJModel.getGhostCard();
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
		// console.log("点击了准备===", this.node.nodeParams.isBureauFull)
		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
			} else {
				if (this.node.nodeParams.mainComp &&
					this.node.nodeParams.mainComp.showMJAllResultFunc) {
					this.node.nodeParams.mainComp.showMJAllResultFunc();
				}
			}
		}
		this.node.destroy();
	},

	getCardNode(card, ghost) {
		let node = cc.instantiate(this.cardNode);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('TSMJSingleTile')
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
		let com = node.addComponent('TSMJSingleTile')
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

	messageCallbackHandler(route, msg) {
		if (route === 'RemoveGameResult') {
			this.node.destroy();
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RemoveGameResult', this);

	},
});