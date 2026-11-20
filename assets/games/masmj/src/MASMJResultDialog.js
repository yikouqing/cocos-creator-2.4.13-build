const ApiRoom = require('../../../src/api/ApiRoom');
const ApiMasmj = require('./ApiMasmj');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const MASMJModel = require('./MASMJModel');
const MAX_USER_NUM = 4;
const Utils = require('../../../src/utils/Utils');
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
		txt_round: cc.Label,
		txt_gameRule: cc.Label,
		bgwin: cc.Node,
		bglose: cc.Node,
		btn_qiePai: cc.Node,
		laiziLay: cc.Node,
		_myChairId: null, //自己的座位号
		_gameRule: null, //游戏规则
		_roomId: 0, //房间号
		_plusInfo: null
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		this.tick = 0;
		console.log("resultData==", this.node.nodeParams)
		if (!!this.node.nodeParams.result) {
			this.resultData = Utils.deepCopy(this.node.nodeParams.result);
			this._plusInfo = Utils.deepCopy(this.node.nodeParams.plusInfo);
			this._gameRule = this._plusInfo.gameRule;
			this._roomId = this._plusInfo.roomID;
			this._laiZiCards = Utils.deepCopy(this._plusInfo.laiZiCards);
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
			// console.log("结算时间==", MASMJModel.getTick())
			clockNode.active = !this.node.nodeParams.isBureauFull && MASMJModel.getTick() > 0;
			this.tick = MASMJModel.getTick() + 2
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
			this._plusInfo = this.reviewRecord[this.bureau].plusInfo;
			this._gameRule = this._plusInfo.gameRule
			this._roomId = this._plusInfo.roomID
		}
		this.setRoomInfo()
		if (this.node.nodeParams.isResult) {
			this.setAllHandCards();
			this.showQiePai()
			this.node.active = true;
		} else if (this.node.nodeParams.isReview) {
			this.setAllHandCards();
		} else {
			this.showResult()
		}
	},

	showQiePai() {
		if (this._gameRule.qiePaiType == 0) {
			this.btn_qiePai.active = false
		} else if (this._gameRule.qiePaiType == 1) {
			this.btn_qiePai.active = true
		} else if (this._gameRule.qiePaiType == 2) {
			let myUid = UserModel.getData("uid")
			this.btn_qiePai.active = this.resultData && this.resultData.some(user => user.uid == myUid && user.winScores < 0)
		}
	},

	setRoomInfo() {
		let str = ""
		if (this._roomId) {
			str += `房号:${this._roomId}`
		}
		if (this._gameRule) {
			str += `  底分:${this._gameRule.baseScore}`
			let ruleStr = "玩法:" + this._gameRule.daoShu + "倒"
			let cnt = 0
			if (this._gameRule.isQidui) {
				cnt++
				ruleStr += " 七对"
			}
			if (this._gameRule.isQueYiMen) {
				cnt++
				ruleStr += " 缺一门"
			}
			if (this._gameRule.isQueMenXian) {
				cnt++
				ruleStr += " 缺门必先打"
			}
			if (this._gameRule.isHaveFeng) {
				cnt++
				ruleStr += " 含风牌"
			}
			if (this._gameRule.isShiDianHu) {
				cnt++
				ruleStr += " 十点起胡"
			}
			if (cnt > 2) {
				ruleStr += "\n"
			}
			if (this._gameRule.isPaoQYS) {
				ruleStr += " 点炮只能胡清一色"
			}
			if (this._gameRule.isPaoJZ) {
				ruleStr += " 点炮只能胡绝张"
			}
			this.txt_gameRule.string = ruleStr
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
	},

	/**选中头像后展示信息 */
	showUserInfo() {
		this.userLayOut.removeAllChildren();
		if (!this.resultData) return;
		let users = this.resultData;
		if (!users) return;
		let loseCount = 0
		for (const user of users) {
			if (!user) continue;
			let uNode = cc.instantiate(this.userItemNode);
			uNode.parent = this.userLayOut;
			uNode.active = true;
			cc.find('txt_nick', uNode).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 6, '..');
			// cc.find('txt_uid', uNode).getComponent(cc.Label).string = user.uid != UserModel.getData("uid") ? Utils.stringSecurity(user.uid) : user.uid;
			cc.find('txt_uid', uNode).getComponent(cc.Label).string = 'ID:' + user.uid;
			cc.find("banker", uNode).active = user.bankerUid == user.uid
			AssetsManager.loadSpriteFrame({
				path: user.avatar,
				sprite: cc.find('head', uNode).getComponent(cc.Sprite)
			});
			let score = user.winScores || 0;
			score = Utils.formatNumberWithDecimal(score);
			let win = cc.find('win', uNode).getComponent(cc.Label);
			let lose = cc.find('lose', uNode).getComponent(cc.Label);
			if (user.uid == UserModel.getData('uid')) {
				this.bgwin.active = score >= 0;
				this.bglose.active = !(this.bgwin.active);
			}
			win.node.active = true;
			lose.node.active = true
			if (score > 0) {
				lose.string = ""
				win.string = '+' + score
			} else {
				win.string = ""
				lose.string = score + ""
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
					let count = (ApiMasmj.operateType.PENG == obj.operate || ApiMasmj.operateType.CHI == obj.operate) ? 3 : 4;
					let cardList = [obj.card, obj.card, obj.card];
					if (ApiMasmj.operateType.PENG !== obj.operate) {
						cardList = obj.plusInfo.cardList;
					}
					for (let j = 0; j < count; ++j) {
						let card = cardList[j];
						let node = this.getPengGangCardNode(user.laiZiCards, card, j, obj.operate == ApiMasmj.operateType.GANG_ZHI, obj.operate == ApiMasmj.operateType.GANG_BU);
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

			let huTypeSrpite = cc.find('huIndex', uNode).getComponent(cc.Sprite);
			let huType = user.huType || 0;
			if (huType) {
				huTypeSrpite.node.active = true
				huTypeSrpite.spriteFrame = null;
				AssetsManager.loadSpriteFrame({
					path: `res/sprite/hu/hu${huType}`,
					sprite: huTypeSrpite,
					bundle: Enums.bundleType.MASMJ
				})

				let huCards = user.huCards || 0;
				/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
				if (huType === ApiMasmj.operateType.HU_ZHI || huType === ApiMasmj.operateType.HU_QIANG || huType === ApiMasmj.operateType.HU_CHI) {
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
				loseCount++
				this.sortHandCards(handCards)
				for (let i = 0; i < handCards.length; ++i) {
					let node = this.getCardNode(handCards[i], user.laiZiCards);
					node.parent = cardsLayout;
					node.x = posx;
					posx += cardWidth;
				}

				if (user.loseUid == user.uid) {
					huTypeSrpite.node.active = true
					huTypeSrpite.spriteFrame = null;
					AssetsManager.loadSpriteFrame({
						path: `res/sprite/hu/hu100`,
						sprite: huTypeSrpite,
						bundle: Enums.bundleType.MASMJ
					})
				}
			}

			// userPlusType
			let userPlusType = user.userPlusType
			if (Array.isArray(userPlusType) && userPlusType.length > 0) {
				let cardTypeLayout = cc.find("cardTypeLayout", uNode)
				userPlusType.forEach(info => {
					let scoreStr = ""
					if (info.scoreType == 0 && info.score > 0) scoreStr = "+" + info.score
					else if (info.scoreType == 1) scoreStr = "x" + info.score
					else scoreStr = "" + info.score

					let txtNode = cc.instantiate(this.cardTypeItemNode)
					txtNode.parent = cardTypeLayout
					txtNode.y = 0
					txtNode.getComponent(cc.Label).string = ApiMasmj.plusRateTypeStr[info.type] + scoreStr
				});
			}

			//huscore
			let huScoreLayout = cc.find("huScoreLayout", uNode)
			if (huScoreLayout) {
				let setHuScore = (wenzi, score) => {
					let hnode = cc.instantiate(this.huScoreItemNode)
					hnode.parent = huScoreLayout
					hnode.x = 0
					let txt_huScore = hnode.getComponent(cc.Label)
					let str = "" + score
					if (score > 0) str = "+" + score
					txt_huScore.string = wenzi + str
				}
				if (user.huScore) {
					setHuScore("胡分", user.huScore)
				}
				if (this._plusInfo && this._plusInfo.CurRentTiWaiXunHuanScore) {
					let CurRentTiWaiXunHuanScore = this._plusInfo.CurRentTiWaiXunHuanScore
					if (Object.hasOwnProperty.call(CurRentTiWaiXunHuanScore, user.uid)) {
						setHuScore("体外", CurRentTiWaiXunHuanScore[user.uid])
					}
				}
			}
		}

		/**流局 */
		if (users.length == loseCount) {
			this.bglose.active = true
			this.bgwin.active = false
			cc.find("title_liu", this.bglose).active = true
		}

		/**赖子牌 */
		this.laiziLay.removeAllChildren()
		if (this._laiZiCards && this._laiZiCards.length > 0) {
			for (let i = 0; i < this._laiZiCards.length; ++i) {
				let node = this.getCardNode(this._laiZiCards[i], this._laiZiCards);
				node.parent = this.laiziLay;
				node.y = 0;
			}
		}

		/**倒数和局数 */
		if (this._gameRule && this._plusInfo) {
			if (this._gameRule.bureauDao > 0) {
				this.txt_round.string = `${this._plusInfo.curBureau}/${this._gameRule.bureau}倒(第${this._plusInfo.CurRentbureauDao}局)`;
			} else {
				this.txt_round.string = `${this._plusInfo.curBureau}/${this._gameRule.bureau}局`;
			}
		}
	},

	showResult() {
		this.bureauLabel.string = this.bureau + 1;
		this._plusInfo = Utils.deepCopy(this.reviewRecord[this.bureau].plusInfo)
		this.resultData = Utils.deepCopy(this.reviewRecord[this.bureau].result)
		this._laiZiCards = Utils.deepCopy(this._plusInfo.laiZiCards)
		this.setAllHandCards()
	},

	/**给手牌重新排序 */
	sortHandCards(handCards) {
		handCards.sort((a, b) => a - b)
		let ghostList = this._laiZiCards || []
		let myGhost = []

		for (let i = 0; i < handCards.length; i++) {
			const card = handCards[i];
			let isDel = false;
			if (ghostList.includes(card)) {
				myGhost.push(card);
				isDel = true;
			}
			if (isDel) {
				handCards.splice(i, 1);
				i--;
			}
		}
		for (let i = myGhost.length - 1; i >= 0; i--) {
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
			// if (!this.node.nodeParams.isBureauFull) {
			// 	ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
			// 	this.node.destroy();
			// } else {
			// 	if (this.node.nodeParams.mainComp &&
			// 		this.node.nodeParams.mainComp.showMJAllResultFunc) {
			// 		this.node.nodeParams.mainComp.showMJAllResultFunc();
			// 		this.node.destroy();
			// 	}
			// }
			if (this.node.nodeParams.mainComp &&
				this.node.nodeParams.mainComp.showMJAllResultFunc) {
				this.node.nodeParams.mainComp.showMJAllResultFunc();
			} else {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
			}
			this.node.destroy();
		} else if (parameters === 'exit') {
			this.node.destroy();
		} else if (parameters == "qie") { //切牌
			ApiRoom.gameMessageNotify(ApiMasmj.gameQiePaiNotify());
			this.node.destroy()
		}
	},

	getCardNode(card, ghost = []) {
		let node = cc.instantiate(this.cardPfb);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('MASMJSingleTile')
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
		let com = node.addComponent('MASMJSingleTile')
		com.init()
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(ghost.includes(card));
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