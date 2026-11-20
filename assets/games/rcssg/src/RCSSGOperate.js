const RCSSGModel = require('./RCSSGModel');
const ApiRcssg = require('./ApiRcssg');
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const singleTile = require("./mj/RCSSGSingleTile");
const Utils = require('../../../src/utils/Utils');
const RCSSGLogic = require('./RCSSGLogic');

cc.Class({
	extends: cc.Component,
	properties: {
		guoButton: cc.Node,
		pengButton: cc.Node,
		gangButton: cc.Node,
		tingButton: cc.Node,
		huButton: cc.Node,
		chiButton: cc.Node,
		choseCard: cc.Node,
		shoseItem: cc.Node,
		cardContent: cc.Node,
		huNode: cc.Node,
		buttonLayout: cc.Node,

		tingSpine: sp.Skeleton,
		guoSpine: sp.Skeleton,
		pengSpine: sp.Skeleton,
		gangSpine: sp.Skeleton,
		huSpine: sp.Skeleton,
		chiSpine: sp.Skeleton,

		tileItemPfb: cc.Prefab,

		_huTileCom: null, //胡牌按钮上的牌

		_chiList: null,
		_gangList: null,
		_selectOptType: null,
		_optCard: null, //操作的牌
		_operateArray: [],
		_optData: null,
	},

	onLoad() {
		this.reset();
	},

	reset() {
		this.node.active = false;
		this.choseCard.active = false;
		this.buttonLayout.active = false;
		this.buttonLayout.children.forEach(sonNode => {
			sonNode.active = false;
		});
	},

	gameInit(data) {
		this.reset();
		if (!data.operateArray) return;
		let operateArray = data.operateArray;
		if (RCSSGModel.getGameStatus() != ApiRcssg.gameStatus.PLAYING ||
			!operateArray ||
			operateArray.length == 0 ||
			(operateArray.length == 1 &&
				operateArray[0] == ApiRcssg.operateType.QI)
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
		this._ghostCard = RCSSGModel.getGhostCard();
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


	start() {
		// 听
		this.tingSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'ting1') {
				this.showOpt(this.tingSpine, 'ting2', true)
			}
		});
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

	/**展示报听按钮 */
	showBaoting(isShow) {
		this.tingButton.active = isShow
		if (this.tingButton.active) this.showOpt(this.tingSpine, 'ting1', false)
		RCSSGModel.setCanBaoTing(isShow || false)
		if (isShow) {
			this.updateBtn()
			this.guoButton.active = true
		}
	},

	/**更新按钮 */
	updateBtn(operateArray) {
		this.node.active = true;
		this.buttonLayout.active = true;
		operateArray = operateArray || [];
		this._operateArray = operateArray;
		let myUid = RCSSGModel.getMyUID();
		let lastOpt = RCSSGModel.getLastOperate();
		let ghostCard = RCSSGModel.getGhostCard();
		let handCards = RCSSGModel.getHandCards(myUid);
		console.log("更新按钮==>operateArray", operateArray, "this._optData", this._optData)

		this.chiButton.active = operateArray.indexOf(ApiRcssg.operateType.CHI) != -1;
		if (this.chiButton.active) this.showOpt(this.chiSpine, 'chi1', false)
		this.pengButton.active = operateArray.indexOf(ApiRcssg.operateType.PENG) != -1;
		if (this.pengButton.active) this.showOpt(this.pengSpine, 'peng1', false)
		this.gangButton.active = operateArray.indexOf(ApiRcssg.operateType.GANG_CHI) != -1 || operateArray.indexOf(ApiRcssg.operateType.GANG_BU) != -1 || operateArray.indexOf(ApiRcssg.operateType.GANG_ZHI) != -1;
		if (this.gangButton.active) this.showOpt(this.gangSpine, 'gang1', false)
		this.huButton.active = operateArray.indexOf(ApiRcssg.operateType.HU_CHI) != -1 || operateArray.indexOf(ApiRcssg.operateType.HU_ZHI) != -1 || operateArray.indexOf(ApiRcssg.operateType.HU_QIANG) != -1;
		if (this.huButton.active) this.showOpt(this.huSpine, 'hu1', false)


		this.guoButton.active = operateArray.indexOf(ApiRcssg.operateType.GUO) != -1;
		if (operateArray.indexOf(ApiRcssg.operateType.GANG_BU) != -1 ||
			operateArray.indexOf(ApiRcssg.operateType.GANG_ZHI) != -1 ||
			operateArray.indexOf(ApiRcssg.operateType.HU_ZHI) != -1) {
			this.guoButton.active = true
		}
		if (RCSSGModel.getRestCardsCount() <= 4) { //最后4张必须操作不能过
			this.guoButton.active = false
		}
		if (this.guoButton.active) this.showOpt(this.guoSpine, 'guo1', false)

		if (this.huButton.active) {

			let isZiMo = operateArray.indexOf(ApiRcssg.operateType.HU_ZHI) != -1;
			let card = null;
			if (!!isZiMo) {
				if (!!lastOpt && lastOpt.uid == myUid && lastOpt.operate == ApiRcssg.operateType.GET) {
					let tileIndex = handCards.indexOf(lastOpt.card);
					if (tileIndex >= 0) {
						card = lastOpt.card;
						handCards.splice(tileIndex, 1);
					}
				}
			} else if (operateArray.indexOf(ApiRcssg.operateType.HU_QIANG) != -1) {
				card = this._optData.card
			} else {
				card = !!lastOpt && lastOpt.card;
			}
			this._optCard = card;
			if (!card) {
				this.huNode.active = false;
				return
			}

			if (!this._huTileCom) {
				let tile = cc.find("tile", this.huNode);
				tile.removeAllChildren()
				let huTile = cc.instantiate(this.tileItemPfb)
				huTile.parent = tile
				let com = huTile.addComponent('RCSSGSingleTile');
				com.init();
				com.setNodeShow(true);
				this._huTileCom = com
			}
			this._huTileCom.flower = card;
			this.huNode.active = true;
		} else {
			this.huNode.active = false;
		}
		if (!!RCSSGModel.getGameRuleByKey("zuihousizhangbihu")) {
			if (RCSSGModel.getRestCardsCount() <= 4) {
				if (operateArray.indexOf(ApiRcssg.operateType.HU_CHI) != -1 ||
					operateArray.indexOf(ApiRcssg.operateType.HU_ZHI) != -1) {
					this.guoButton.active = false;
				}
			}
		}
		if (this.guoButton.active) this.showOpt(this.guoSpine, 'guo1', false)
	},


	onClearTurn() {
		this.node.active = false;
		this.choseCard.active = false
		this._selectOptType = null
		this._chiList = null
		this._gangList = null
		this._optCard = null
		this._operateArray = null
		this.showBaoting(false)
	},

	getGangChiCard(list) {
		list = list || [];
		let ghostCard = RCSSGModel.getGhostCard();
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
		let myUid = RCSSGModel.getMyUID();
		let lastOpt = RCSSGModel.getLastOperate();
		if (param == 'guo') {
			this.node.active = false
			if (RCSSGModel.getCanBaoTing()) {
				RCSSGModel.setCanBaoTing(false);
				ApiRoom.gameMessageNotify(ApiRcssg.gameBaoNotify(ApiRcssg.operateType.GUO));
			} else {
				ApiRoom.gameMessageNotify(ApiRcssg.gameOperateNotify(null, ApiRcssg.operateType.GUO));
			}
		} else if (param == 'peng') {
			ApiRoom.gameMessageNotify(ApiRcssg.gameOperateNotify(this._optCard, ApiRcssg.operateType.PENG));
			this.node.active = false
			this.pengButton.active = false
		} else if (param == 'gang') {
			let gangOperate = null;
			let isMyTurn = RCSSGModel.isTurn(myUid);
			gangOperate = (operateArray.indexOf(ApiRcssg.operateType.GANG_CHI) != -1) ? ApiRcssg.operateType.GANG_CHI : gangOperate;
			gangOperate = (operateArray.indexOf(ApiRcssg.operateType.GANG_BU) != -1) ? ApiRcssg.operateType.GANG_BU : gangOperate;
			gangOperate = (operateArray.indexOf(ApiRcssg.operateType.GANG_ZHI) != -1) ? ApiRcssg.operateType.GANG_ZHI : gangOperate;
			if (gangOperate != null && this._gangList && this._gangList.length > 0) {
				if (this._gangList.length > 1) {
					this.showSelectCardView(gangOperate)
					return;
				}
				let card = null;
				let list = this._gangList[0];
				if (!!isMyTurn) {
					if (operateArray.indexOf(ApiRcssg.operateType.GANG_BU) != -1) {
						gangOperate = ApiRcssg.operateType.GANG_BU;
						card = this.getGangChiCard(list);
					} else if (operateArray.indexOf(ApiRcssg.operateType.GANG_ZHI) != -1) {
						gangOperate = ApiRcssg.operateType.GANG_ZHI;
						card = this.getGangChiCard(list);
					}
				} else {
					card = this._optCard;
				}
				ApiRoom.gameMessageNotify(ApiRcssg.gameOperateNotify(card, gangOperate, list));
				this.node.active = false;
				this.gangButton.active = false
			}
		} else if (param == 'hu') {
			let huOperate = null;
			let isMyTurn = RCSSGModel.isTurn(myUid); //可以胡如果是自己的轮次则是自摸胡 不需要传card
			huOperate = (operateArray.indexOf(ApiRcssg.operateType.HU_CHI) != -1) ? ApiRcssg.operateType.HU_CHI : huOperate;
			huOperate = (operateArray.indexOf(ApiRcssg.operateType.HU_ZHI) != -1) ? ApiRcssg.operateType.HU_ZHI : huOperate;
			huOperate = (operateArray.indexOf(ApiRcssg.operateType.HU_QIANG) != -1) ? ApiRcssg.operateType.HU_QIANG : huOperate;
			if (huOperate != null) {
				let optCard = isMyTurn && !!lastOpt && lastOpt.operate == ApiRcssg.operateType.GET && lastOpt.uid == myUid ? lastOpt.card : this._optCard;
				if (huOperate == ApiRcssg.operateType.HU_CHI || huOperate == ApiRcssg.operateType.HU_ZHI || huOperate == ApiRcssg.operateType.HU_QIANG) {
					optCard = this._optData.card;
				}
				if (huOperate == ApiRcssg.operateType.HU_ZHI && !RCSSGModel.getIsHaveGet()) { //天胡特殊处理
					let handCards = RCSSGModel.getHandCards(myUid);
					optCard = handCards[handCards.length - 1]
				}
				let data = ApiRcssg.gameOperateNotify(optCard, huOperate, null, huOperate)
				ApiRoom.gameMessageNotify(data);
				// console.log("胡牌消息", data)
			}
			this.node.active = false;
			this.huButton.active = false;
		} else if (param == "ting") {
			this.node.active = false;
			this.tingButton.active = false;
			ApiRoom.gameMessageNotify(ApiRcssg.gameBaoNotify(ApiRcssg.operateType.BAOTING));
		} else if (param === "chi") {
			if (this._chiList && this._chiList.length > 1) {
				this.showSelectCardView(ApiRcssg.operateType.CHI);
				return
			}
			ApiRoom.gameMessageNotify(ApiRcssg.gameOperateNotify(this._optCard, ApiRcssg.operateType.CHI, this._chiList[0]));
			this.node.active = false;
			this.chiButton.active = false;
		} else if (param === "closeChose") {
			this.choseCard.active = false;
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = [];
		if (optType === ApiRcssg.operateType.CHI) {
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
		let myUid = RCSSGModel.getMyUID();
		let idx = parseInt(btn.node.name);
		let list = [];
		let card = null
		if (this._selectOptType === ApiRcssg.operateType.CHI) {
			list = this._chiList[idx];
			card = this._optCard;
			ApiRoom.gameMessageNotify(ApiRcssg.gameOperateNotify(card, this._selectOptType, list));
		} else {
			list = this._gangList[idx];
			let operateArray = this._operateArray;
			let isMyTurn = RCSSGModel.isTurn(myUid);
			let gangOperate = this._selectOptType
			if (!!isMyTurn) {
				card = list[0]
				let myHandCard = RCSSGModel.getHandCards(myUid)
				let cards = myHandCard.filter(item => item == card);
				if (cards && Array.isArray(cards)) {
					if (operateArray.includes(ApiRcssg.operateType.GANG_ZHI) && cards.length == 4) {
						gangOperate = ApiRcssg.operateType.GANG_ZHI;
					} else if (operateArray.includes(ApiRcssg.operateType.GANG_CHI) && cards.length == 3) {
						gangOperate = ApiRcssg.operateType.GANG_CHI
					} else {
						gangOperate = ApiRcssg.operateType.GANG_BU
					}
				}
			} else {
				card = this._optCard;
			}
			ApiRoom.gameMessageNotify(ApiRcssg.gameOperateNotify(card, gangOperate, list));
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