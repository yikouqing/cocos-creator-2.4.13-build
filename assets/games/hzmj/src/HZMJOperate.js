const HZMJModel = require('./HZMJModel');
const ApiHzmj = require('./ApiHzmj');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const HZMJLogic = require('./HZMJLogic');

cc.Class({
	extends: cc.Component,
	properties: {
		guoButton: cc.Node,
		pengButton: cc.Node,
		gangButton: cc.Node,
		huButton: cc.Node,
		chiButton: cc.Node,
		choseCard: cc.Node,
		shoseItem: cc.Node,
		cardContent: cc.Node,
		huNode: cc.Node,
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
	},

	gameInit(data) {
		if (!data.operateArray) return;
		this.node.active = false;
		this.choseCard.active = false
		let operateArray = data.operateArray;
		if (HZMJModel.getGameStatus() != ApiHzmj.gameStatus.PLAYING ||
			!operateArray ||
			operateArray.length == 0 ||
			(operateArray.length == 1 &&
				operateArray[0] == ApiHzmj.operateType.QI)
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
		this._ghostCard = HZMJModel.getGhostCard();
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
		let myUid = HZMJModel.getMyUID();
		let lastOpt = HZMJModel.getLastOperate();
		let handCards = HZMJModel.getHandCards(myUid);
		let ghostCard = HZMJModel.getGhostCard();
		this.guoButton.active = operateArray[0] !== ApiHzmj.operateType.GANG_CHOOSE; //选择补杠牌的时候不显示过
		if (this.guoButton.active) this.showOpt(this.guoSpine, 'guo1', false)
		this.pengButton.active = operateArray.indexOf(ApiHzmj.operateType.PENG) != -1;
		if (this.pengButton.active) this.showOpt(this.pengSpine, 'peng1', false)
		this.chiButton.active = operateArray.indexOf(ApiHzmj.operateType.CHI) != -1;
		if (this.chiButton.active) this.showOpt(this.chiSpine, 'chi1', false)
		this.gangButton.active = operateArray.indexOf(ApiHzmj.operateType.GANG_CHI) != -1 || operateArray.indexOf(ApiHzmj.operateType.GANG_BU) != -1 || operateArray.indexOf(ApiHzmj.operateType.GANG_ZHI) != -1;
		if (this.gangButton.active) this.showOpt(this.gangSpine, 'gang1', false)
		this.huButton.active = operateArray.indexOf(ApiHzmj.operateType.HU_CHI) != -1 || operateArray.indexOf(ApiHzmj.operateType.HU_ZHI) != -1 || operateArray.indexOf(ApiHzmj.operateType.HU_QIANG) != -1;
		if (this.huButton.active) this.showOpt(this.huSpine, 'hu1', false)

		if (this.huButton.active) {
			let isZiMo = operateArray.indexOf(ApiHzmj.operateType.HU_ZHI) != -1;
			let card = null;
			if (!!isZiMo) {
				if (!!lastOpt && lastOpt.uid == myUid && lastOpt.operate == ApiHzmj.operateType.GET) {
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
			let com = tile.getComponent('HZMJSingleTile');
			if (!com) {
				com = tile.addComponent('HZMJSingleTile');
				com.init();
				com.setNodeShow(true);
			}
			com.flower = this._optCard;
			let txt_fan = cc.find("txt_fan", this.huNode).getComponent(cc.Label);
			while (handCards.indexOf(ghostCard) >= 0) {
				let ghostIndex = handCards.indexOf(ghostCard);
				handCards.splice(ghostIndex, 1);
			}
			let ghostCardsCount = HZMJModel.getHandGhostCardsCount(myUid);
			let tingCards = HZMJLogic.getTingList(handCards, ghostCardsCount);
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
		// let ghostCard = HZMJModel.getGhostCard();
		let gangChiCard = 0;
		for (const card of list) {
			// if (card == ghostCard) continue;
			gangChiCard = card;
			break;
		}
		return gangChiCard;
	},

	onButtonClick(event, param) {
		let operateArray = this._operateArray;
		let myUid = HZMJModel.getMyUID();
		let lastOpt = HZMJModel.getLastOperate();
		if (param == 'guo') {
			ApiRoom.gameMessageNotify(ApiHzmj.gameOperateNotify(null, ApiHzmj.operateType.GUO));
			this.node.active = false
		} else if (param == 'peng') {
			ApiRoom.gameMessageNotify(ApiHzmj.gameOperateNotify(this._optCard, ApiHzmj.operateType.PENG));
			this.node.active = false
		} else if (param == 'gang') {
			let gangOperate = null;
			let isMyTurn = HZMJModel.isTurn(myUid); //可以胡如果是自己的轮次则是自摸胡 不需要传card
			gangOperate = (operateArray.indexOf(ApiHzmj.operateType.GANG_CHI) != -1) ? ApiHzmj.operateType.GANG_CHI : gangOperate;
			gangOperate = (operateArray.indexOf(ApiHzmj.operateType.GANG_BU) != -1) ? ApiHzmj.operateType.GANG_BU : gangOperate;
			gangOperate = (operateArray.indexOf(ApiHzmj.operateType.GANG_ZHI) != -1) ? ApiHzmj.operateType.GANG_ZHI : gangOperate;
			if (gangOperate != null && this._gangList && this._gangList.length > 0) {
				if (this._gangList.length > 1) {
					this.showSelectCardView(gangOperate)
					return;
				}
				let card = this._optCard;
				let list = this._gangList[0];
				if (!!isMyTurn) {
					if (operateArray.indexOf(ApiHzmj.operateType.GANG_BU) != -1) {
						gangOperate = ApiHzmj.operateType.GANG_BU;
						card = this.getGangChiCard(list);
					} else if (operateArray.indexOf(ApiHzmj.operateType.GANG_ZHI) != -1) {
						gangOperate = ApiHzmj.operateType.GANG_ZHI;
						card = this.getGangChiCard(list);
					}
				} else {
					card = this._optCard;
				}
				ApiRoom.gameMessageNotify(ApiHzmj.gameOperateNotify(card, gangOperate, list));
				this.node.active = false;
			}
		} else if (param == 'hu' || param == 'you') {
			let huOperate = null;
			let isMyTurn = HZMJModel.isTurn(myUid); //可以胡如果是自己的轮次则是自摸胡 不需要传card
			huOperate = (operateArray.indexOf(ApiHzmj.operateType.HU_CHI) != -1) ? ApiHzmj.operateType.HU_CHI : huOperate;
			huOperate = (operateArray.indexOf(ApiHzmj.operateType.HU_ZHI) != -1) ? ApiHzmj.operateType.HU_ZHI : huOperate;
			huOperate = (operateArray.indexOf(ApiHzmj.operateType.HU_QIANG) != -1) ? ApiHzmj.operateType.HU_QIANG : huOperate;
			huOperate = (operateArray.indexOf(ApiHzmj.operateType.YOU_JIN) != -1) ? ApiHzmj.operateType.YOU_JIN : huOperate;
			if (huOperate != null) {
				let optCard = isMyTurn && !!lastOpt && lastOpt.operate == ApiHzmj.operateType.GET && lastOpt.uid == myUid ? lastOpt.card : this._optCard;
				if (huOperate == ApiHzmj.operateType.HU_QIANG) {
					optCard = this._optData.card
				}
				ApiRoom.gameMessageNotify(ApiHzmj.gameOperateNotify(optCard, huOperate));
			}
			this.node.active = false;
		} else if (param === "chi") {
			if (this._chiList && this._chiList.length > 1) {
				this.showSelectCardView(ApiHzmj.operateType.CHI);
				return
			}
			ApiRoom.gameMessageNotify(ApiHzmj.gameOperateNotify(this._optCard, ApiHzmj.operateType.CHI, this._chiList[0]));
			this.node.active = false;
		} else if (param === "closeChose") {
			this.choseCard.active = false;
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = [];
		if (optType === ApiHzmj.operateType.CHI) {
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
				let com = card.getComponent('HZMJSingleTile');
				if (!com) {
					com = card.addComponent('HZMJSingleTile');
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
		let myUid = HZMJModel.getMyUID();
		let idx = parseInt(btn.node.name);
		let list = [];
		let card = null
		if (this._selectOptType === ApiHzmj.operateType.CHI) {
			list = this._chiList[idx];
			card = this._optCard;
			ApiRoom.gameMessageNotify(ApiHzmj.gameOperateNotify(card, this._selectOptType, list));
		} else {
			list = this._gangList[idx];
			let operateArray = this._operateArray;
			let isMyTurn = HZMJModel.isTurn(myUid);
			let gangOperate = this._selectOptType
			if (!!isMyTurn) {
				card = list[0]
				let myHandCard = HZMJModel.getHandCards(myUid)
				let cards = myHandCard.filter(item => item == card);
				if (cards && Array.isArray(cards)) {
					if (operateArray.includes(ApiHzmj.operateType.GANG_ZHI) && cards.length == 4) {
						gangOperate = ApiHzmj.operateType.GANG_ZHI;
					} else if (operateArray.includes(ApiHzmj.operateType.GANG_CHI) && cards.length == 3) {
						gangOperate = ApiHzmj.operateType.GANG_CHI
					} else {
						gangOperate = ApiHzmj.operateType.GANG_BU
					}
				}
				// console.log("gang===---===", card, gangOperate, list)
			} else {
				card = this._optCard;
			}
			ApiRoom.gameMessageNotify(ApiHzmj.gameOperateNotify(card, gangOperate, list));
		}
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
});