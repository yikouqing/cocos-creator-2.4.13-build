const ApiRoom = require('../../../src/api/ApiRoom');
const ApiYjbpx = require('./ApiYjbpx');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const YJBPXModel = require('./YJBPXModel');
const MAX_USER_NUM = 4;
const huIndexUrl = "res/sprite/rank/";
const Utils = require('../../../src/utils/Utils');
const SubManager = require("../../../src/utils/SubManager")
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		userLayOut: cc.Node,
		userItemNode: cc.Node,
		cardTypeItemNode: cc.Node,
		huScoreItemNode: cc.Node,
		cardPfb: cc.Prefab,
		clockLabel: cc.Label,
		bureauLabel: cc.Label,
		txt_roomInfo: cc.Label,
		txt_guize: cc.Label,
		txt_bao: cc.Node,

		_myChairId: null, //自己的座位号
		_roomId: 0, //房间号
		_plusInfo: null, //额外信息
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		this.tick = 0;
		if (!!this.node.nodeParams.result) {
			this.resultData = Utils.deepCopy(this.node.nodeParams.result);
			YJBPXModel.gameRule = this.node.nodeParams.plusInfo.gameRule;
			this._roomId = this.node.nodeParams.plusInfo.roomID;
			this._laiZiCards = Utils.deepCopy(this.node.nodeParams.plusInfo.laiZiCards);
			this._plusInfo = Utils.deepCopy(this.node.nodeParams.plusInfo);
		}
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
			this.tick = YJBPXModel.getTick() + 5
		} else { //战绩回放页面显示左右翻页按钮
			resBtnNode.active = false;
			reviewBtnNode.active = true;
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			if (lastItem && !lastItem.result) {
				/* 最后一局未完成，删除 */
				this.reviewRecord.pop();
			}
			this.bureau = 0;
		}
		if (this.reviewRecord && this.reviewRecord[this.bureau]) {
			YJBPXModel.gameRule = this.reviewRecord[this.bureau].plusInfo.gameRule
			this._roomId = this.reviewRecord[this.bureau].plusInfo.roomID
			this._plusInfo = this.reviewRecord[this.bureau].plusInfo
		}
		this.setRoomInfo()
		if (this.node.nodeParams.isResult) {
			this.setAllHandCards();
			this.showEnterAni()
		} else if (this.node.nodeParams.isReview) {
			this.setAllHandCards();
			this.showEnterAni()
		} else {
			this.showResult()
		}
	},

	showEnterAni() {
		this.node.active = true;
		this.node.opacity = 0
		cc.tween(this.node).delay(1).to(0.3, {
			opacity: 255
		}).start()
	},

	setRoomInfo() {
		let str = ""
		if (this._roomId) {
			str += `房号:${this._roomId}`
		}

		str += `  底分:${YJBPXModel.getGameRuleByKey("baseScore")}  `

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
	},

	/**选中头像后展示信息 */
	showUserInfo() {
		this.userLayOut.removeAllChildren();
		if (!this.resultData) return;
		let users = this.resultData;
		// console.log("users", users)
		if (!users) return;

		let userResultList = this._plusInfo.userResultList || []
		let chaJiaoCard = this._plusInfo.TouCard //最后一张牌，用于查叫显示

		/**另加番用的 */
		let setTxtNode = (node, str) => {
			let txtNode = cc.instantiate(this.cardTypeItemNode)
			txtNode.parent = node
			txtNode.active = true
			txtNode.y = 0;
			txtNode.getComponent(cc.Label).string = str
		}

		/**搬码和查叫用的 */
		let setNode = (layout, tileId) => {
			let node = this.getCardNode(tileId);
			node.parent = layout;
			layout.active = true;
		}
		let setTxt = (node, str, uNode) => {
			node.getComponent(cc.Layout).updateLayout()
			cc.find("cardsLayout2", uNode).getComponent(cc.Layout).updateLayout()
			let pos = CCUtil.postionConvert(node, uNode)
			let txtNode = cc.instantiate(this.cardTypeItemNode)
			txtNode.parent = uNode
			txtNode.setPosition(pos.x, pos.y + 70)
			let lable = txtNode.getComponent(cc.Label)
			lable.string = str
			lable.fontSize = 30
		}

		for (const user of users) {
			if (!user) continue;
			let uNode = cc.instantiate(this.userItemNode);
			uNode.parent = this.userLayOut;
			uNode.active = true;
			cc.find('txt_nick', uNode).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 6, '..');
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
			if (user.uid == UserModel.getData('uid')) {
				cc.find('title_win', this.node).active = score > 0;
				cc.find('title_lose', this.node).active = !(cc.find('title_win', this.node).active);
			}
			if (score > 0) {
				win.node.active = true;
				lose.node.active = false
				win.string = '+' + Utils.formatNumberWithDecimal(score);
			} else {
				lose.node.active = true;
				win.node.active = false
				lose.string = Utils.formatNumberWithDecimal(score);
			}
			let cardsLayout = cc.find('cardsLayout', uNode);
			if (cardsLayout) cardsLayout.removeAllChildren()
			let posx = 0,
				cardWidth = 82,
				nullWidth = 15;
			posx += cardWidth / 2;
			let handCards = !user.userCards || !user.userCards[user.uid] ? [] : user.userCards[user.uid].slice();
			let pengGangArray = user.operateArray || [];
			if (pengGangArray.length > 0) {
				for (let i = 0; i < pengGangArray.length; ++i) {
					let obj = pengGangArray[i];
					let count = (ApiYjbpx.operateType.PENG == obj.operate || ApiYjbpx.operateType.CHI == obj.operate) ? 3 : 4;
					let cardList = [obj.card, obj.card, obj.card];
					if (ApiYjbpx.operateType.PENG !== obj.operate) {
						cardList = obj.plusInfo.cardList;
					}
					for (let j = 0; j < count; ++j) {
						let card = cardList[j];
						if (!card) {
							break;
						}
						let node = this.getPengGangCardNode(user.laiZiCards, card, j, (obj.operate == ApiYjbpx.operateType.GANG_ZHI && obj.card != -1));
						node.parent = cardsLayout;
						if (count == 4 && j == 3) {
							node.y = 14;
							node.x = posx - 2 * cardWidth;
						} else {
							node.x = posx;
							posx += cardWidth;
						}
					}
					posx += nullWidth;
				}
			}

			let shaiPai = user.shaiPaiUser ? Utils.deepCopy(user.shaiPaiUser) : null
			let myBaiPai = shaiPai ? shaiPai.cardList.slice() : []
			let isb = myBaiPai.length > 0
			let huInfo = user.huResultInfo ? Utils.deepCopy(user.huResultInfo) : null
			let huType = huInfo ? huInfo.operateType : -1
			let huCards = huInfo ? huInfo.card : -1
			if (huInfo && huInfo.uid == user.uid) {
				let huIndex = cc.find('huIndex', uNode).getComponent(cc.Sprite);
				huIndex.node.active = true
				AssetsManager.loadSpriteFrame({
					path: `res/sprite/rank/${huInfo.huIndex}${huType === ApiYjbpx.operateType.HU_ZHI ? "zimo" : "hu"}`,
					sprite: huIndex,
					bundle: Enums.bundleType.YJBPX
				})
			}

			if (huType != -1) {
				/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
				let huFilter = [ApiYjbpx.operateType.HU_ZHI];
				if (huFilter.indexOf(huType) != -1) {
					let huCardIndex = handCards.indexOf(huCards);
					if (huCardIndex >= 0) {
						handCards.splice(huCardIndex, 1);
					}
				}
			}
			this.sortHandCards(handCards, myBaiPai.slice())
			for (let i = 0; i < handCards.length; ++i) {
				let node = this.getCardNode(handCards[i], user.laiZiCards);
				node.parent = cardsLayout;
				node.x = posx;
				posx += cardWidth;
				let com = node.getComponent("YJBPXSingleTile");
				let idx = myBaiPai.indexOf(com.flower)
				if (idx != -1) {
					com.setBaiPai(true)
					myBaiPai.splice(idx, 1)
				}
				if (isb && myBaiPai.length == 0) {
					isb = false
					posx += nullWidth
				}
			}
			if (huCards && huCards > 0) {
				posx += nullWidth;
				let huCardNode = this.getCardNode(huCards, this._laiZiCards);
				huCardNode.parent = cardsLayout;
				huCardNode.x = posx;
			}

			let cardTypeLayout = cc.find("cardTypeLayout", uNode)
			// if (user.huCardType && user.huCardType != ApiYjbpx.cardType.PINGHU) {
			// 	setTxtNode(cardTypeLayout, ApiYjbpx.cardTypeStr[user.huCardType] + "x" + user.huCardScore)
			// }

			userResultList.forEach(huResultInfo => {
				let opt = huResultInfo.operateType
				let winScoreList = huResultInfo.winScoreList
				let huIndex = huResultInfo.huIndex
				let huStr = "自摸"
				if (opt == ApiYjbpx.operateType.HU_CHI) huStr = "接炮"
				if (opt == ApiYjbpx.operateType.HU_QIANG) huStr = "抢杠"

				if (huResultInfo.uid == user.uid) {
					let sumWin = winScoreList.reduce((total, item) => {
						return total + (item.score || 0);
					}, 0);
					setTxtNode(cardTypeLayout, `${huStr}+${sumWin}`)
				}
				let loseInfo = winScoreList.filter(info => info.uid == user.uid)
				if (loseInfo && loseInfo.length > 0) {
					let loseScore = loseInfo.reduce((total, item) => {
						return total + (item.score || 0);
					}, 0);
					setTxtNode(cardTypeLayout, `被${huIndex}${huStr}${-1 * loseScore}`)
				}
			});

			// userPlusType
			let userPlusType = user.userPlusType
			if (Array.isArray(userPlusType) && userPlusType.length > 0) {
				userPlusType.forEach(info => {
					let score = info.score
					let symbol = "x"
					if (info.scoreType == 1) {
						symbol = score > 0 ? "+" : ""
					}
					let s = ApiYjbpx.plusRateTypeStr[info.type]
					// if (score != 0) {
					// 	s += symbol + score
					// }
					setTxtNode(cardTypeLayout, s)
				});
			}

			let huScoreLayout = cc.find("huScoreLayout", uNode)
			if (huScoreLayout) {
				let setHuScore = (wenzi, score) => {
					let hnode = cc.instantiate(this.huScoreItemNode)
					hnode.parent = cardTypeLayout
					hnode.x = 0
					let txt_huScore = hnode.getComponent(cc.Label)
					let str = "" + score
					if (score > 0) str = "+" + score
					txt_huScore.string = wenzi + str
				}
				// if (user.huScore) {
				// 	setHuScore("胡分", user.huScore)
				// }
				if (user.gangScore) {
					setHuScore("杠分", user.gangScore)
				}
			}

			let banMaList = user.banMaList
			if (banMaList && banMaList.length > 0) {
				let gangLay = cc.find("cardsLayout2/gangLay", uNode)
				let huLay = cc.find("cardsLayout2/huLay", uNode)

				for (let i = 0; i < banMaList.length; i++) {
					const info = banMaList[i];
					let opt = info.type;
					let showId = info.TouCard;
					if (YJBPXModel.optCheck(opt) == 1) {
						setNode(gangLay, showId)
					} else if (YJBPXModel.optCheck(opt) == 2) {
						setNode(huLay, showId)
					}
				}
				if (gangLay.active) {
					setTxt(gangLay, "杠搬码", uNode)
				}
				if (huLay.active) {
					setTxt(huLay, "胡搬码", uNode)
				}
			}

			/**查叫分数显示，必须放最下面 */
			let TingScore = user.TingScore || 0
			if (TingScore != 0) {
				if (TingScore > 0) {
					let jiaoLay = cc.find("cardsLayout2/jiaoLay", uNode)
					setNode(jiaoLay, chaJiaoCard)
					setTxt(jiaoLay, "查叫", uNode)
				}
				let symbol = TingScore > 0 ? "+" : ""
				setTxtNode(cardTypeLayout, "查叫" + symbol + TingScore)
			}
		}
		this.txt_guize.string = YJBPXModel.getTerseRule("、");
	},

	showResult() {
		this.bureauLabel.string = this.bureau + 1;
		let CurRecord = Utils.deepCopy(this.reviewRecord[this.bureau]);
		this._laiZiCards = CurRecord.plusInfo.laiZiCards;
		this._plusInfo = CurRecord.plusInfo;
		this.resultData = CurRecord.result;
		this.setAllHandCards()
	},

	/**给手牌重新排序 */
	sortHandCards(handCards, shaiPai = []) {
		/**摆的牌排前面 */
		handCards.sort((a, b) => a - b)
		if (!shaiPai || shaiPai.length == 0) {
			return
		}
		let myBaiPai = shaiPai.slice()
		myBaiPai.sort((a, b) => b - a)

		let tmp = myBaiPai.slice()
		for (let i = 0; i < handCards.length; i++) {
			const card = handCards[i];
			if (tmp.length == 0) {
				break
			}
			let idx = tmp.indexOf(card)
			if (idx != -1) {
				tmp.splice(idx, 1)
				handCards.splice(i, 1)
				i--;
			}
		}
		for (let i = 0; i < myBaiPai.length; i++) {
			handCards.unshift(myBaiPai[i])
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

	getCardNode(card, ghost = []) {
		let node = cc.instantiate(this.cardPfb);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('YJBPXSingleTile')
		com.init()
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(ghost.includes(card));
		return node;
	},

	getPengGangCardNode(ghost, card, i, isAnGang, isBuGang) {
		let node = cc.instantiate(this.cardPfb);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('YJBPXSingleTile')
		com.init()
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(ghost.includes(card));
		if (!!isAnGang && i == 3) {
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