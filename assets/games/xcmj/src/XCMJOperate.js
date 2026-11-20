const XCMJModel = require('./XCMJModel');
const ApiXcmj = require('./ApiXcmj');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const singleTile = require("./mj/XCMJSingleTile");
const Utils = require('../../../src/utils/Utils');
const XCMJLogic = require('./XCMJLogic');

cc.Class({
	extends: cc.Component,
	properties: {
		guoButton: cc.Node,
		pengButton: cc.Node,
		gangButton: cc.Node,
		huButton: cc.Node,
		chiButton: cc.Node,
		moButton: cc.Node,
		baiButton: cc.Node,
		choseCard: cc.Node,
		shoseItem: cc.Node,
		cardContent: cc.Node,
		huNode: cc.Node,
		baipaiNode: cc.Node,
		buttonLayout: cc.Node,
		guoSpine: sp.Skeleton,
		pengSpine: sp.Skeleton,
		gangSpine: sp.Skeleton,
		huSpine: sp.Skeleton,
		chiSpine: sp.Skeleton,
		_chiList: null,
		_gangList: null,
		_selectOptType: null,
		_optCard: null, //操作的牌
		_operateArray: [],
		_optData: null,
		_baiPaiList: [],
	},

	gameInit(data) {
		if (!data.operateArray) return;
		this.node.active = false;
		this.choseCard.active = false
		this.baiButton.active = false
		this.moButton.active = false
		this.baipaiNode.active = false
		let operateArray = data.operateArray;
		if (XCMJModel.getGameStatus() != ApiXcmj.gameStatus.PLAYING ||
			!operateArray ||
			operateArray.length == 0 ||
			(operateArray.length == 1 &&
				operateArray[0] == ApiXcmj.operateType.QI)
		) {
			this.node.active = false;
		} else {
			this._optData = data
			this._optCard = data.operateCard;
			data.plusInfo = data.plusInfo || {};
			this._gangList = data.plusInfo.gangList || [];
			this._chiList = data.plusInfo.chiList || [];
			this.node.active = true;
			this.baiButton.active = false
			this.baipaiNode.active = false
			this.updateBtn(operateArray);
		}
		this._ghostCard = XCMJModel.getGhostCard();
	},

	reset() {
		this.node.active = false;
		this.choseCard.active = false
		this.baiButton.active = false
		this.moButton.active = false
		this.baipaiNode.active = false
	},
	start() {

		// 过
		this.guoSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'guo1') {
				this.showOpt(this.guoSpine, 'guo2', true)
			}

		});
		// 碰
		this.pengSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'peng1') {
				this.showOpt(this.pengSpine, 'peng2', true)
			}
		});
		// 吃
		this.chiSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'chi1') {
				this.showOpt(this.chiSpine, 'chi2', true)
			}
		});
		// 杠
		this.gangSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'gang1') {
				this.showOpt(this.gangSpine, 'gang2', true)
			}
		});
		// 胡
		this.huSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'hu1') {
				this.showOpt(this.huSpine, 'hu2', true)
			}
		});
	},


	/**更新按钮 */
	updateBtn(operateArray) {
		operateArray = operateArray || [];
		this.node.active = true;
		this._operateArray = operateArray;
		let myUid = XCMJModel.getMyUID();
		let lastOpt = XCMJModel.getLastOperate();
		let handCards = XCMJModel.getHandCards(myUid);
		let ghostCard = XCMJModel.getGhostCard();
		this.guoButton.active = operateArray.indexOf(ApiXcmj.operateType.GUO) != -1
		if (this.guoButton.active) this.showOpt(this.guoSpine, 'guo1', false)

		this.pengButton.active = operateArray.indexOf(ApiXcmj.operateType.PENG) != -1;
		if (this.pengButton.active) this.showOpt(this.pengSpine, 'peng1', false)

		this.chiButton.active = operateArray.indexOf(ApiXcmj.operateType.CHI) != -1;
		if (this.chiButton.active) this.showOpt(this.chiSpine, 'chi1', false)

		this.gangButton.active = operateArray.indexOf(ApiXcmj.operateType.GANG_CHI) != -1 || operateArray.indexOf(ApiXcmj.operateType.GANG_BU) != -1 || operateArray.indexOf(ApiXcmj.operateType.GANG_ZHI) != -1;
		if (this.gangButton.active) this.showOpt(this.gangSpine, 'gang1', false)

		this.huButton.active = operateArray.indexOf(ApiXcmj.operateType.HU_CHI) != -1 || operateArray.indexOf(ApiXcmj.operateType.HU_ZHI) != -1 || operateArray.indexOf(ApiXcmj.operateType.HU_QIANG) != -1;
		if (this.huButton.active) this.showOpt(this.huSpine, 'hu1', false)

		this.moButton.active = operateArray.indexOf(ApiXcmj.operateType.MOPAI) != -1
		this.buttonLayout.active = true
		if (this.moButton.active) {
			this.baipaiNode.active = false
		}
		if (operateArray.indexOf(ApiXcmj.operateType.GANG_BU) != -1 ||
			operateArray.indexOf(ApiXcmj.operateType.GANG_ZHI) != -1 ||
			operateArray.indexOf(ApiXcmj.operateType.HU_ZHI) != -1) {
			this.guoButton.active = true
		}
		/**如果自己已经摆牌 不显示过*/
		let isb = XCMJModel.getBaiPaiInfo(XCMJModel.getMyUID())
		if (isb && isb.length > 0 && this.huButton.active) {
			this.guoButton.active = false
		}


		if (this.huButton.active) {
			let isZiMo = operateArray.indexOf(ApiXcmj.operateType.HU_ZHI) != -1;
			let card = null;
			if (!!isZiMo) {
				if (!!lastOpt && lastOpt.uid == myUid && lastOpt.operate == ApiXcmj.operateType.GET) {
					let tileIndex = handCards.indexOf(lastOpt.card);
					if (tileIndex >= 0) {
						card = lastOpt.card;
						handCards.splice(tileIndex, 1);
					}
				}
			} else {
				card = !!lastOpt && lastOpt.card;
			}
			this._optCard = card;
			let tile = cc.find("tile", this.huNode);
			let com = tile.getComponent(singleTile);
			if (!com) {
				com = tile.addComponent(singleTile);
				com.init();
				com.setNodeShow(true);
			}
			com.flower = this._optCard;
			let txt_fan = cc.find("txt_fan", this.huNode).getComponent(cc.Label);
			while (handCards.indexOf(ghostCard) >= 0) {
				let ghostIndex = handCards.indexOf(ghostCard);
				handCards.splice(ghostIndex, 1);
			}
			let ghostCardsCount = XCMJModel.getHandGhostCardsCount(myUid);
			let tingCards = XCMJLogic.getTingList(handCards, ghostCardsCount);
			let matched = tingCards.find((item) => {
				return item.cardID == this._optCard;
			});
			// console.log('判断-胡牌', card, lastOpt, matched);
			// if (tingCards.length > 0 && !!matched) {
			// 	txt_fan.string = matched.rate + "番";
			// } else {
			txt_fan.string = "";
			// }
			this.huNode.active = false;
		} else {
			this.huNode.active = false;
		}
		if (this.guoButton.active) this.showOpt(this.guoSpine, 'guo1', false)
	},

	onGameTurn(data) {
		this._optData = data
		if (data.plusInfo) {
			this._gangList = data.plusInfo.gangList || [];
			this._chiList = data.plusInfo.chiList || [];
		}
		this._optCard = data.card;
		this.updateBtn(data.operateArray);
	},

	onClearTurn() {
		this.node.active = false;
		this.moButton.active = false
		this.baiButton.active = false
		this.choseCard.active = false
		this._selectOptType = null
		this._chiList = null
		this._gangList = null
		this._optCard = null
		this._operateArray = null
	},

	getGangChiCard(list) {
		list = list || [];
		let ghostCard = XCMJModel.getGhostCard();
		let gangChiCard = 0;
		for (const card of list) {
			if (card == ghostCard) continue;
			gangChiCard = card;
			break;
		}
		return gangChiCard;
	},

	onButtonClick(event, param) {
		let operateArray = this._operateArray;
		let myUid = XCMJModel.getMyUID();
		let lastOpt = XCMJModel.getLastOperate();
		if (param == 'guo') {
			ApiRoom.gameMessageNotify(ApiXcmj.gameOperateNotify(null, ApiXcmj.operateType.GUO));
			this.node.active = false
		} else if (param == 'peng') {
			ApiRoom.gameMessageNotify(ApiXcmj.gameOperateNotify(this._optCard, ApiXcmj.operateType.PENG));
			this.node.active = false
			this.pengButton.active = false
		} else if (param == 'gang') {
			let gangOperate = null;
			let isMyTurn = XCMJModel.isTurn(myUid); //可以胡如果是自己的轮次则是自摸胡 不需要传card
			gangOperate = (operateArray.indexOf(ApiXcmj.operateType.GANG_CHI) != -1) ? ApiXcmj.operateType.GANG_CHI : gangOperate;
			gangOperate = (operateArray.indexOf(ApiXcmj.operateType.GANG_BU) != -1) ? ApiXcmj.operateType.GANG_BU : gangOperate;
			gangOperate = (operateArray.indexOf(ApiXcmj.operateType.GANG_ZHI) != -1) ? ApiXcmj.operateType.GANG_ZHI : gangOperate;
			if (gangOperate != null && this._gangList && this._gangList.length > 0) {
				if (this._gangList.length > 1) {
					this.showSelectCardView(gangOperate)
					return;
				}
				let card = null;
				let list = this._gangList[0];
				if (!!isMyTurn) {
					if (operateArray.indexOf(ApiXcmj.operateType.GANG_BU) != -1) {
						gangOperate = ApiXcmj.operateType.GANG_BU;
						card = this.getGangChiCard(list);
					} else if (operateArray.indexOf(ApiXcmj.operateType.GANG_ZHI) != -1) {
						gangOperate = ApiXcmj.operateType.GANG_ZHI;
						card = this.getGangChiCard(list);
					}
				} else {
					card = this._optCard;
				}
				ApiRoom.gameMessageNotify(ApiXcmj.gameOperateNotify(card, gangOperate, list));
				this.node.active = false;
				this.gangButton.active = false
			}
		} else if (param == 'hu') {
			let huOperate = null;
			let isMyTurn = XCMJModel.isTurn(myUid); //可以胡如果是自己的轮次则是自摸胡 不需要传card
			huOperate = (operateArray.indexOf(ApiXcmj.operateType.HU_CHI) != -1) ? ApiXcmj.operateType.HU_CHI : huOperate;
			huOperate = (operateArray.indexOf(ApiXcmj.operateType.HU_ZHI) != -1) ? ApiXcmj.operateType.HU_ZHI : huOperate;
			huOperate = (operateArray.indexOf(ApiXcmj.operateType.HU_QIANG) != -1) ? ApiXcmj.operateType.HU_QIANG : huOperate;
			huOperate = (operateArray.indexOf(ApiXcmj.operateType.YOU_JIN) != -1) ? ApiXcmj.operateType.YOU_JIN : huOperate;
			if (huOperate != null) {
				let optCard = isMyTurn && !!lastOpt && lastOpt.operate == ApiXcmj.operateType.GET && lastOpt.uid == myUid ? lastOpt.card : this._optCard;
				if (huOperate == ApiXcmj.operateType.HU_QIANG) {
					optCard = this._optData.card
				}
				ApiRoom.gameMessageNotify(ApiXcmj.gameOperateNotify(optCard, huOperate));
			}
			this.node.active = false;
			this.huButton.active = false
		} else if (param === "chi") {
			if (this._chiList && this._chiList.length > 1) {
				this.showSelectCardView(ApiXcmj.operateType.CHI);
				return
			}
			ApiRoom.gameMessageNotify(ApiXcmj.gameOperateNotify(this._optCard, ApiXcmj.operateType.CHI, this._chiList[0]));
			this.node.active = false;
			this.chiButton.active = false
		} else if (param === "closeChose") {
			this.choseCard.active = false;
		} else if (param === "mo") {
			ApiRoom.gameMessageNotify(ApiXcmj.gameOperateNotify(null, ApiXcmj.operateType.MOPAI, null));
			this.node.active = false
			this.moButton.active = false
		} else if (param === "bai") {
			this.baipaiNode.active = true
			this.buttonLayout.active = false
			/**提示摆的牌 */
			cc.systemEvent.emit("tipBaiPai", this._baiPaiList);
		} else if (param === "qdbaipai") {
			cc.systemEvent.emit("qdbaipai")
		} else if (param === "qxbaipai") {
			this.baipaiNode.active = false
			this.buttonLayout.active = true
			this.showBtnBai()
			cc.systemEvent.emit("tipBaiPai", []);
		}
	},

	/**摆牌完成 */
	onBaiPaiEnd() {
		this.buttonLayout.active = true
		this.baiButton.active = false
		this.baipaiNode.active = false
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = [];
		if (optType === ApiXcmj.operateType.CHI) {
			list = this._chiList;
		} else {
			list = this._gangList;
		}
		if (this._selectOptType === optType) {
			this.choseCard.active = true;
			return;
		}
		this._selectOptType = optType;
		let ghostCard = this._ghostCard;
		this.cardContent.removeAllChildren()
		for (let index = 0; index < list.length; index++) {
			const cardList = list[index];
			let cardNode = cc.instantiate(this.shoseItem)
			for (let i = 0; i < cardList.length; i++) {
				let cardNum = cardList[i];
				let card = cc.find("card" + i, cardNode);
				let com = card.getComponent(singleTile);
				if (!com) {
					com = card.addComponent(singleTile);
					com.init();
					com.setNodeShow(true);
				}
				com.flower = cardNum
				card.active = true
				// console.log("pai=", cardNum)
				if (ghostCard == cardNum) { //显示鬼牌标志
					com.setGhostIcon(true);
				}
			}
			cardNode.name = index + ""
			cardNode.on("click", this.onItemClick, this)
			cardNode.active = true;
			cardNode.parent = this.cardContent;
		}
		this.choseCard.active = true;
	},

	/**选中响应 */
	onItemClick(btn) {
		/**发送消息 */
		let myUid = XCMJModel.getMyUID();
		let idx = parseInt(btn.node.name);
		let list = [];
		let card = null
		if (this._selectOptType === ApiXcmj.operateType.CHI) {
			list = this._chiList[idx];
			card = this._optCard;
			ApiRoom.gameMessageNotify(ApiXcmj.gameOperateNotify(card, this._selectOptType, list));
		} else {
			list = this._gangList[idx];
			let operateArray = this._operateArray;
			let isMyTurn = XCMJModel.isTurn(myUid);
			let gangOperate = this._selectOptType
			if (!!isMyTurn) {
				card = list[0]
				let myHandCard = XCMJModel.getHandCards(myUid)
				let cards = myHandCard.filter(item => item == card);
				if (cards && Array.isArray(cards)) {
					if (operateArray.includes(ApiXcmj.operateType.GANG_ZHI) && cards.length == 4) {
						gangOperate = ApiXcmj.operateType.GANG_ZHI;
					} else if (operateArray.includes(ApiXcmj.operateType.GANG_CHI) && cards.length == 3) {
						gangOperate = ApiXcmj.operateType.GANG_CHI
					} else {
						gangOperate = ApiXcmj.operateType.GANG_BU
					}
				}
			} else {
				card = this._optCard;
			}
			ApiRoom.gameMessageNotify(ApiXcmj.gameOperateNotify(card, gangOperate, list));
		}
	},

	/**显示摆牌按钮 */
	showBtnBai() {
		/**如果已经胡牌了 */
		let ishu = XCMJModel.getIsHuPai(XCMJModel.getMyUID())
		if (ishu) {
			this.baiButton.active = false
			this.baipaiNode.active = false
			// console.log("胡牌隐藏了摆牌按钮")
			return
		}

		let bList = XCMJModel.getBaiPaiInfo(XCMJModel.getMyUID())
		if (bList && Array.isArray(bList) && bList.length > 0) {
			/**已经摆过牌了 */
			this.baiButton.active = false
			this.baipaiNode.active = false
			// console.log("已经摆锅了隐藏了摆牌按钮", bList)
			return
		}

		if (this._operateArray && this._operateArray.length > 0 &&
			!this._operateArray.includes(ApiXcmj.operateType.MOPAI) &&
			!this._operateArray.includes(ApiXcmj.operateType.QI)) {
			/**如果有显示其他按钮 直接隐藏*/
			this.baiButton.active = false
			this.baipaiNode.active = false
			// console.log("有其他操作按钮胡牌隐藏了摆牌按钮", this._operateArray)
			return
		}

		if (XCMJModel.isTurn(XCMJModel.getMyUID()) && this._operateArray && this._operateArray.includes(ApiXcmj.operateType.QI)) {
			this.baiButton.active = false
			this.baipaiNode.active = false
			this.moButton.active = false
			// console.log("自己出牌的时候不显示")
			return
		}

		if (this.baipaiNode.active && !this.moButton.active) {
			/**已经显示了 */
			this.node.active = true
			this.buttonLayout.active = true
			// console.log("已经显示了摆牌按钮")
			return
		}

		this.baiButton.active = this._baiPaiList.length > 0
		if (this.baiButton.active) {
			this.baipaiNode.active = false
			this.node.active = true
			this.buttonLayout.active = true
			this.guoButton.active = false
			this.huButton.active = false
			this.pengButton.active = false
			this.gangButton.active = false
		}
		// console.trace("显示摆牌按钮===", this.baiButton.active, this.node.active, this._baiPaiList)
	},
	/**展示操作动画 */
	showOpt(optSpine, aniName, loop = false) {
		let track = Utils.getRandomNum(0, 10)
		// console.log("按钮动画123321-----", optSpine, aniName)
		optSpine.node.active = true
		optSpine.setSkin('default');
		optSpine.timeScale = 1
		optSpine.setAnimation(track, aniName, loop)
	},

	/**检测是否可以摆牌 */
	checkBaiPai() {
		let bList = XCMJModel.getBaiPaiInfo(XCMJModel.getMyUID())
		if (bList && Array.isArray(bList) && bList.length > 0) {
			/**已经摆过牌了 */
			this._baiPaiList = []
			return
		}
		let handCards = XCMJModel.getHandCards(XCMJModel.getMyUID())
		let bpList = XCMJLogic.getMinPaiList(handCards)
		this._baiPaiList = bpList
		// console.log("bai list====", bpList)
	},
});