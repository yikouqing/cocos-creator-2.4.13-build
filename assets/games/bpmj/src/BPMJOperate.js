const BPMJModel = require('./BPMJModel');
const ApiBpmj = require('./ApiBpmj');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NetworkManager = require('../../../src/utils/NetworkManager');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const BPMJLogic = require('./BPMJLogic');

cc.Class({
	extends: cc.Component,
	properties: {
		youButton: cc.Node,
		guoButton: cc.Node,
		pengButton: cc.Node,
		gangButton: cc.Node,
		huButton: cc.Node,
		sibaibanButton: cc.Node,
		chiButton: cc.Node,
		choseCard: cc.Node,
		shoseItem: cc.Node,
		cardContent: cc.Node,
		huNode: cc.Node,

		_chiList: null,
		_gangList: null,
		_selectOptType: null,
		_optCard: null, //操作的牌
		_operateArray: [],
		_optData: null,
	},

	gameInit(data) {
		this.node.active = false;
		this.choseCard.active = false
		if (!data.operateArray) return;
		let operateArray = data.operateArray;
		BPMJModel.setOnlyBaiBan(!!data.plusInfo && !!data.plusInfo.onlyBaiBan);
		if (BPMJModel.getGameStatus() != ApiBpmj.gameStatus.PLAYING ||
			!operateArray ||
			operateArray.length == 0 ||
			(operateArray.length == 1 &&
				operateArray[0] == ApiBpmj.operateType.QI)
		) {
			this.node.active = false;
		} else {
			this._optData = data
			this._optCard = data.operateCard;
			data.plusInfo = data.plusInfo || {};
			this._gangList = data.plusInfo.gangList || [];
			this._chiList = data.plusInfo.chiList || [];
			this.node.active = true;
			this.updateBtn(operateArray);
		}
		this._ghostCard = BPMJModel.getGhostCard();
	},

	/**更新按钮 */
	updateBtn(operateArray) {
		operateArray = operateArray || [];
		this.node.active = true;
		this._operateArray = operateArray;
		let myUid = BPMJModel.getMyUID();
		let lastOpt = BPMJModel.getLastOperate();
		let ghostCard = BPMJModel.getGhostCard();
		let handCards = BPMJModel.getHandCards(myUid);
		// console.log("更新按钮===operateArray", operateArray)
		let isHu = operateArray.length == 1 && operateArray.indexOf(ApiBpmj.operateType.HU_ZHI) != -1;
		let isSiBaiBan = operateArray.length == 1 && operateArray.indexOf(ApiBpmj.operateType.SI_BAI_BAN) != -1;
		BPMJModel.setYingHu(BPMJModel.getCurOptUID() == BPMJModel.getMyUID() && (isHu || isSiBaiBan));
		this.guoButton.active = operateArray.indexOf(ApiBpmj.operateType.GUO) != -1; //选择补杠牌的时候不显示过
		this.pengButton.active = operateArray.indexOf(ApiBpmj.operateType.PENG) != -1;
		this.chiButton.active = operateArray.indexOf(ApiBpmj.operateType.CHI) != -1;
		this.sibaibanButton.active = operateArray.indexOf(ApiBpmj.operateType.SI_BAI_BAN) != -1;
		this.gangButton.active = operateArray.indexOf(ApiBpmj.operateType.GANG_CHI) != -1 || operateArray.indexOf(ApiBpmj.operateType.GANG_BU) != -1 || operateArray.indexOf(ApiBpmj.operateType.GANG_ZHI) != -1;
		this.huButton.active = operateArray.indexOf(ApiBpmj.operateType.HU_CHI) != -1 || operateArray.indexOf(ApiBpmj.operateType.HU_ZHI) != -1 || operateArray.indexOf(ApiBpmj.operateType.HU_QIANG) != -1;
		this.youButton.active = operateArray.indexOf(ApiBpmj.operateType.YOU_JIN) != -1 && !this.huButton.active;

		if (this.sibaibanButton.active) {
			this.guoButton.active = false;
		}
		if (this.huButton.active) {
			let isZiMo = operateArray.indexOf(ApiBpmj.operateType.HU_ZHI) != -1;
			let card = null;
			if (!!isZiMo) {
				if (!!lastOpt && lastOpt.uid == myUid && lastOpt.operate == ApiBpmj.operateType.GET) {
					let tileIndex = handCards.indexOf(lastOpt.card);
					if (tileIndex >= 0) {
						card = lastOpt.card;
						handCards.splice(tileIndex, 1);
					}
				}
			} else {
				card = !!lastOpt && lastOpt.card;
			}
			if (card) {
				this._optCard = card;
			}

			let tile = cc.find("tile", this.huNode);
			let com = tile.getComponent('BPMJSingleTile');
			if (!com) {
				com = tile.addComponent('BPMJSingleTile');
				com.init();
				com.setNodeShow(true);
			}
			com.flower = card;
			let txt_fan = cc.find("txt_fan", this.huNode).getComponent(cc.Label);
			while (handCards.indexOf(ghostCard) >= 0) {
				let ghostIndex = handCards.indexOf(ghostCard);
				handCards.splice(ghostIndex, 1);
			}
			let ghostCardsCount = BPMJModel.getHandGhostCardsCount(myUid);
			let tingCards = BPMJLogic.getTingList(handCards, ghostCardsCount);
			let matched = tingCards.find((item) => {
				return item.cardID == card;
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
		this.choseCard.active = false
		this._selectOptType = null
		this._chiList = null
		this._gangList = null
		this._optCard = null
	},

	getGangChiCard(list) {
		list = list || [];
		let ghostCard = BPMJModel.getGhostCard();
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
		let myUid = BPMJModel.getMyUID();
		let lastOpt = BPMJModel.getLastOperate();
		if (param == 'guo') {
			ApiRoom.gameMessageNotify(ApiBpmj.gameOperateNotify(null, ApiBpmj.operateType.GUO));
			this.node.active = false
		} else if (param == 'peng') {
			ApiRoom.gameMessageNotify(ApiBpmj.gameOperateNotify(this._optCard, ApiBpmj.operateType.PENG));
			this.node.active = false
		} else if (param == 'gang') {
			let gangOperate = null;
			let isMyTurn = BPMJModel.isTurn(myUid); //可以胡如果是自己的轮次则是自摸胡 不需要传card
			gangOperate = (operateArray.indexOf(ApiBpmj.operateType.GANG_CHI) != -1) ? ApiBpmj.operateType.GANG_CHI : gangOperate;
			gangOperate = (operateArray.indexOf(ApiBpmj.operateType.GANG_BU) != -1) ? ApiBpmj.operateType.GANG_BU : gangOperate;
			gangOperate = (operateArray.indexOf(ApiBpmj.operateType.GANG_ZHI) != -1) ? ApiBpmj.operateType.GANG_ZHI : gangOperate;
			if (gangOperate != null && this._gangList && this._gangList.length > 0) {
				if (this._gangList.length > 1) {
					this.showSelectCardView(gangOperate)
					return;
				}
				let card = null;
				let list = this._gangList[0];
				if (!!isMyTurn) {
					if (operateArray.indexOf(ApiBpmj.operateType.GANG_BU) != -1) {
						gangOperate = ApiBpmj.operateType.GANG_BU;
						card = this.getGangChiCard(list);
					} else if (operateArray.indexOf(ApiBpmj.operateType.GANG_ZHI) != -1) {
						gangOperate = ApiBpmj.operateType.GANG_ZHI;
						card = this.getGangChiCard(list);
					}
				} else {
					card = this._optCard;
					if (!card && !!this._optData) {
						card = this._optData.card;
					}
				}
				card && ApiRoom.gameMessageNotify(ApiBpmj.gameOperateNotify(card, gangOperate, list));
				this.node.active = false;
			}
		} else if (param == 'hu' || param == 'you') {
			let huOperate = null;
			let isMyTurn = BPMJModel.isTurn(myUid); //可以胡如果是自己的轮次则是自摸胡 不需要传card
			huOperate = (operateArray.indexOf(ApiBpmj.operateType.HU_CHI) != -1) ? ApiBpmj.operateType.HU_CHI : huOperate;
			huOperate = (operateArray.indexOf(ApiBpmj.operateType.HU_ZHI) != -1) ? ApiBpmj.operateType.HU_ZHI : huOperate;
			huOperate = (operateArray.indexOf(ApiBpmj.operateType.HU_QIANG) != -1) ? ApiBpmj.operateType.HU_QIANG : huOperate;
			huOperate = (operateArray.indexOf(ApiBpmj.operateType.YOU_JIN) != -1) ? ApiBpmj.operateType.YOU_JIN : huOperate;
			if (huOperate != null) {
				let optCard = isMyTurn && !!lastOpt && lastOpt.operate == ApiBpmj.operateType.GET && lastOpt.uid == myUid ? lastOpt.card : this._optCard;
				if (huOperate == ApiBpmj.operateType.HU_QIANG) {
					optCard = this._optData.card
				}
				ApiRoom.gameMessageNotify(ApiBpmj.gameOperateNotify(optCard, huOperate));
			}
			this.node.active = false;
		} else if (param === "sibaiban") {
			ApiRoom.gameMessageNotify(ApiBpmj.gameOperateNotify(this._optData.card, ApiBpmj.operateType.SI_BAI_BAN));
			this.node.active = false;
		} else if (param === "chi") {
			// console.log("this._optCard", this._optCard)
			if (this._chiList && this._chiList.length > 1) {
				this.showSelectCardView(ApiBpmj.operateType.CHI);
				return
			}
			ApiRoom.gameMessageNotify(ApiBpmj.gameOperateNotify(this._optCard, ApiBpmj.operateType.CHI, this._chiList[0]));
			this.node.active = false;
		} else if (param === "closeChose") {
			this.choseCard.active = false;
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = [];
		if (optType === ApiBpmj.operateType.CHI) {
			list = this._chiList;
		} else {
			list = this._gangList;
		}
		// console.log("展示选择界面optType", optType, "this._optCard", this._optCard, "list", list)
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
				let com = card.getComponent('BPMJSingleTile');
				if (!com) {
					com = card.addComponent('BPMJSingleTile');
					com.init();
					com.setNodeShow(true);

				}
				com.flower = cardNum
				card.active = true
				if (optType === ApiBpmj.operateType.CHI) {
					com.setMaskShow(cardNum == this._optCard);
				}
				// console.log("pai=", cardNum)
				if (ghostCard == cardNum) { //显示鬼牌标志
					com.setGhostIcon(true);
				}
			}
			cardNode.active = true;
			cardNode.name = index + ""
			cardNode.parent = this.cardContent;
			cardNode.on("click", this.onItemClick, this);
		}
		this.choseCard.active = true;
	},

	/**选中响应 */
	onItemClick(btn) {
		/**发送消息 */
		let myUid = BPMJModel.getMyUID();
		let idx = parseInt(btn.node.name);
		let list = [];
		let card = null
		if (this._selectOptType === ApiBpmj.operateType.CHI) {
			list = this._chiList[idx];
			card = this._optCard;
			ApiRoom.gameMessageNotify(ApiBpmj.gameOperateNotify(card, this._selectOptType, list));
		} else {
			list = this._gangList[idx];
			let operateArray = this._operateArray;
			let isMyTurn = BPMJModel.isTurn(myUid);
			let gangOperate = this._selectOptType
			if (!!isMyTurn) {
				card = list[0];
				let myHandCard = BPMJModel.getHandCards(myUid)
				let cards = myHandCard.filter(item => item == card);
				if (cards && Array.isArray(cards)) {
					if (operateArray.includes(ApiBpmj.operateType.GANG_ZHI) && cards.length == 4) {
						gangOperate = ApiBpmj.operateType.GANG_ZHI;
					} else if (operateArray.includes(ApiBpmj.operateType.GANG_CHI) && cards.length == 3) {
						gangOperate = ApiBpmj.operateType.GANG_CHI
					} else {
						gangOperate = ApiBpmj.operateType.GANG_BU
					}
				}
			} else {
				card = this._optCard;
			}
			ApiRoom.gameMessageNotify(ApiBpmj.gameOperateNotify(card, gangOperate, list));
		}
	},
});