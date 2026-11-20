const ENSMJModel = require('./ENSMJModel');
const ApiEnsmj = require('./ApiEnsmj');
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const ENSMJLogic = require('./ENSMJLogic');

cc.Class({
	extends: cc.Component,
	properties: {
		guoButton: cc.Node,
		pengButton: cc.Node,
		gangButton: cc.Node,
		tingButton: cc.Node,
		yuanbaoButton: cc.Node,
		menButton: cc.Node,
		huButton: cc.Node,
		chiButton: cc.Node,
		moButton: cc.Node,
		baiButton: cc.Node,
		choseCard: cc.Node,
		shoseItem: cc.Node,
		cardContent: cc.Node,
		huNode: cc.Node,
		buttonLayout: cc.Node,

		tingSpine: sp.Skeleton,
		yuanbaoSpine: sp.Skeleton,
		menSpine: sp.Skeleton,
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

	onLoad() {
		this.reset();
	},

	reset() {
		this.node.active = false;
		this.choseCard.active = false;
		this.baiButton.active = false;
		this.moButton.active = false;
		this.menButton.active = false;
		this.tingButton.active = false;
		this.buttonLayout.active = false;
		this.yuanbaoButton.active = false;
	},

	gameInit(data) {
		this.reset();

		if (!data.operateArray) return;
		let operateArray = data.operateArray;
		if (ENSMJModel.getGameStatus() != ApiEnsmj.gameStatus.PLAYING ||
			!operateArray ||
			operateArray.length == 0 ||
			(operateArray.length == 1 &&
				operateArray[0] == ApiEnsmj.operateType.QI)
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
			this.updateBtn(operateArray);
		}
		this._ghostCard = ENSMJModel.getGhostCard();
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
		// 原报
		this.yuanbaoSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'ting1') {
				this.showOpt(this.yuanbaoSpine, 'ting2', true)
			}

		});
		// 闷
		this.menSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'men1') {
				this.showOpt(this.menSpine, 'men2', true)
			}

		});
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

	/**更新按钮 */
	updateBtn(operateArray) {
		this.node.active = true;
		this.buttonLayout.active = true;
		operateArray = operateArray || [];
		this._operateArray = operateArray;
		let myUid = ENSMJModel.getMyUID();
		let lastOpt = ENSMJModel.getLastOperate();
		let ghostCard = ENSMJModel.getGhostCard();
		let handCards = ENSMJModel.getHandCards(myUid);
		// console.log("更新按钮==>operateArray", operateArray, "gangList", this._gangList, "this._optData", this._optData);
		ENSMJModel.setallHuCards(!!this._optData.plusInfo ? this._optData.plusInfo.allHuCards : []);
		this.guoButton.active = operateArray.indexOf(ApiEnsmj.operateType.GUO) != -1;
		if (this.guoButton.active) this.showOpt(this.guoSpine, 'guo1', false)
		this.chiButton.active = operateArray.indexOf(ApiEnsmj.operateType.CHI) != -1;
		if (this.chiButton.active) this.showOpt(this.chiSpine, 'chi1', false)
		this.moButton.active = operateArray.indexOf(ApiEnsmj.operateType.MOPAI) != -1;
		this.pengButton.active = operateArray.indexOf(ApiEnsmj.operateType.PENG) != -1;
		if (this.pengButton.active) this.showOpt(this.pengSpine, 'peng1', false)
		this.menButton.active = operateArray.indexOf(ApiEnsmj.operateType.MENPAI) != -1;
		if (this.menButton.active) this.showOpt(this.menSpine, 'men1', false)
		this.gangButton.active = operateArray.indexOf(ApiEnsmj.operateType.GANG_CHI) != -1 || operateArray.indexOf(ApiEnsmj.operateType.GANG_BU) != -1 || operateArray.indexOf(ApiEnsmj.operateType.GANG_ZHI) != -1;
		if (this.gangButton.active) this.showOpt(this.gangSpine, 'gang1', false)
		this.huButton.active = operateArray.indexOf(ApiEnsmj.operateType.HU_CHI) != -1 || operateArray.indexOf(ApiEnsmj.operateType.HU_ZHI) != -1 || operateArray.indexOf(ApiEnsmj.operateType.HU_QIANG) != -1;
		if (this.huButton.active) this.showOpt(this.huSpine, 'hu1', false)

		if (operateArray.indexOf(ApiEnsmj.operateType.GANG_BU) != -1 ||
			operateArray.indexOf(ApiEnsmj.operateType.GANG_ZHI) != -1 ||
			operateArray.indexOf(ApiEnsmj.operateType.HU_ZHI) != -1) {
			this.guoButton.active = true
		}
		if (ENSMJModel.getGameRuleByKey("jinzhiyangpi") && operateArray.includes(ApiEnsmj.operateType.BU_PILAI)) { //禁止养痞
			this.guoButton.active = false
		}

		if (this.huButton.active) {
			let isZiMo = operateArray.indexOf(ApiEnsmj.operateType.HU_ZHI) != -1;
			let card = null;
			if (!!isZiMo) {
				if (!!lastOpt && lastOpt.uid == myUid && lastOpt.operate == ApiEnsmj.operateType.GET) {
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
			let com = tile.getComponent('ENSMJSingleTile');
			if (!com) {
				com = tile.addComponent('ENSMJSingleTile');
				com.init();
				com.setNodeShow(true);
			}
			com.flower = this._optCard;
			while (handCards.indexOf(ghostCard) >= 0) {
				let ghostIndex = handCards.indexOf(ghostCard);
				handCards.splice(ghostIndex, 1);
			}
			let txt_fan = cc.find("txt_fan", tile).getComponent(cc.Label);
			let ghostCardsCount = ENSMJModel.getHandGhostCardsCount(myUid);
			let tingCards = ENSMJLogic.getTingList(handCards, ghostCardsCount);
			let matched = tingCards.find((item) => {
				return item.cardID == this._optCard;
			});
			// console.log('判断-胡牌', card, lastOpt, matched);
			if (tingCards.length > 0 && !!matched) {
				txt_fan.string = matched.rate + "番";
			} else {
				txt_fan.string = "";
			}
			this.huNode.active = false;
		} else {
			this.huNode.active = false;
		}
		if (this.guoButton.active) this.showOpt(this.guoSpine, 'guo1', false)
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
		let ghostCard = ENSMJModel.getGhostCard();
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
		let myUid = ENSMJModel.getMyUID();
		let lastOpt = ENSMJModel.getLastOperate();
		if (param == 'guo') {
			this.node.active = false
			ApiRoom.gameMessageNotify(ApiEnsmj.gameOperateNotify(null, ApiEnsmj.operateType.GUO));
		} else if (param == 'peng') {
			ApiRoom.gameMessageNotify(ApiEnsmj.gameOperateNotify(this._optCard, ApiEnsmj.operateType.PENG));
			this.node.active = false
			this.pengButton.active = false
		} else if (param == 'gang') {
			let gangOperate = null;
			let isMyTurn = ENSMJModel.isTurn(myUid); //可以胡如果是自己的轮次则是自摸胡 不需要传card
			gangOperate = (operateArray.indexOf(ApiEnsmj.operateType.GANG_CHI) != -1) ? ApiEnsmj.operateType.GANG_CHI : gangOperate;
			gangOperate = (operateArray.indexOf(ApiEnsmj.operateType.GANG_BU) != -1) ? ApiEnsmj.operateType.GANG_BU : gangOperate;
			gangOperate = (operateArray.indexOf(ApiEnsmj.operateType.GANG_ZHI) != -1) ? ApiEnsmj.operateType.GANG_ZHI : gangOperate;
			gangOperate = (operateArray.indexOf(ApiEnsmj.operateType.BU_PILAI) != -1) ? ApiEnsmj.operateType.GANG_ZHI : gangOperate;
			if (gangOperate != null && this._gangList && this._gangList.length > 0) {
				if (this._gangList.length > 1) {
					this.showSelectCardView(gangOperate)
					return;
				}
				let card = null;
				let list = this._gangList[0];
				if (!!isMyTurn) {
					if (operateArray.indexOf(ApiEnsmj.operateType.GANG_BU) != -1) {
						gangOperate = ApiEnsmj.operateType.GANG_BU;
						card = this.getGangChiCard(list);
					} else if (operateArray.indexOf(ApiEnsmj.operateType.GANG_ZHI) != -1) {
						gangOperate = ApiEnsmj.operateType.GANG_ZHI;
						card = this.getGangChiCard(list);
					}
				} else {
					card = this._optCard;
				}
				this.node.active = false;
				this.gangButton.active = false
				if (list.length == 1 && this.isPiLaiGang(list[0])) {
					gangOperate = ApiEnsmj.operateType.BU_PILAI;
					card = list[0];
				}
				ApiRoom.gameMessageNotify(ApiEnsmj.gameOperateNotify(card, gangOperate, list));
			}
		} else if (param == 'hu' || param == "men") {
			let huOperate = null;
			let isMyTurn = ENSMJModel.isTurn(myUid); //可以胡如果是自己的轮次则是自摸胡 不需要传card
			huOperate = (operateArray.indexOf(ApiEnsmj.operateType.HU_CHI) != -1) ? ApiEnsmj.operateType.HU_CHI : huOperate;
			huOperate = (operateArray.indexOf(ApiEnsmj.operateType.HU_ZHI) != -1) ? ApiEnsmj.operateType.HU_ZHI : huOperate;
			huOperate = (operateArray.indexOf(ApiEnsmj.operateType.HU_QIANG) != -1) ? ApiEnsmj.operateType.HU_QIANG : huOperate;
			if (huOperate != null) {
				let optCard = isMyTurn && !!lastOpt && lastOpt.operate == ApiEnsmj.operateType.GET && lastOpt.uid == myUid ? lastOpt.card : this._optCard;
				if (huOperate == ApiEnsmj.operateType.HU_QIANG) {
					optCard = this._optData.card;
				}
				let type = param == "men" ? ApiEnsmj.operateType.MENPAI : huOperate;
				ApiRoom.gameMessageNotify(ApiEnsmj.gameOperateNotify(optCard, type, null, huOperate));
			}
			this.node.active = false;
			this.huButton.active = false;
			this.menButton.active = false;
		} else if (param == "ting") {
			this.node.active = false;
			this.tingButton.active = false;
			let tingList = this._optData.plusInfo.getTingList || [];
			if (tingList.length) cc.systemEvent.emit("tianting", {
				tingList: tingList,
				isTing: true
			});
			ApiRoom.gameMessageNotify(ApiEnsmj.gameOperateNotify(null, ApiEnsmj.operateType.TIANTING));
		} else if (param === "chi") {
			if (this._chiList && this._chiList.length > 1) {
				this.showSelectCardView(ApiEnsmj.operateType.CHI);
				return
			}
			ApiRoom.gameMessageNotify(ApiEnsmj.gameOperateNotify(this._optCard, ApiEnsmj.operateType.CHI, this._chiList[0]));
			this.node.active = false;
			this.chiButton.active = false;
		} else if (param === "closeChose") {
			this.choseCard.active = false;
		} else if (param === "mo") {
			ApiRoom.gameMessageNotify(ApiEnsmj.gameOperateNotify(null, ApiEnsmj.operateType.MOPAI, null));
			this.node.active = false;
			this.moButton.active = false;
		}
	},

	/**摆牌完成 */
	onBaiPaiEnd() {
		this.baiButton.active = false;
		this.buttonLayout.active = true;
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = [];
		if (optType === ApiEnsmj.operateType.CHI) {
			list = this._chiList;
		} else {
			list = this._gangList;
		}
		this.choseCard.active = !!list.length;
		if (this._selectOptType === optType) {
			return;
		}
		this._selectOptType = optType;
		this.cardContent.removeAllChildren();
		list.forEach((cardList, index) => {
			let cardNode = cc.instantiate(this.shoseItem);
			cardNode.on("click", this.onItemClick, this);
			cardNode.parent = this.cardContent;
			cardNode.name = index + "";
			cardNode.active = true;
			cardNode.children.forEach((cardNode, index) => {
				let cardCtrl = cardNode.getComponent('ENSMJSingleTile');
				if (!cardCtrl) {
					cardCtrl = cardNode.addComponent('ENSMJSingleTile');
					cardCtrl.init();
					cardCtrl.setNodeShow(true);
				}
				let cardID = cardList[index];
				cardNode.active = !!cardID;
				cardCtrl.flower = cardID;
			})
		})
	},

	/**选中响应 */
	onItemClick(btn) {
		/**发送消息 */
		let myUid = ENSMJModel.getMyUID();
		let idx = parseInt(btn.node.name);
		let list = [];
		let card = null
		if (this._selectOptType === ApiEnsmj.operateType.CHI) {
			list = this._chiList[idx];
			card = this._optCard;
			ApiRoom.gameMessageNotify(ApiEnsmj.gameOperateNotify(card, this._selectOptType, list));
		} else {
			list = this._gangList[idx];

			let operateArray = this._operateArray;
			let isMyTurn = ENSMJModel.isTurn(myUid);
			let gangOperate = this._selectOptType
			if (!!isMyTurn) {
				card = list[0];
				let myHandCard = ENSMJModel.getHandCards(myUid)
				let cards = myHandCard.filter(item => item == card);
				if (cards && Array.isArray(cards)) {
					if (operateArray.includes(ApiEnsmj.operateType.GANG_ZHI) && cards.length == 4) {
						gangOperate = ApiEnsmj.operateType.GANG_ZHI;
					} else if (operateArray.includes(ApiEnsmj.operateType.GANG_CHI) && cards.length == 3) {
						gangOperate = ApiEnsmj.operateType.GANG_CHI
					} else {
						gangOperate = ApiEnsmj.operateType.GANG_BU
					}
				}

			} else {
				card = this._optCard;
			}

			if (list.length == 1 && this.isPiLaiGang(list[0])) {
				gangOperate = ApiEnsmj.operateType.BU_PILAI;
				card = list[0];
			}
			ApiRoom.gameMessageNotify(ApiEnsmj.gameOperateNotify(card, gangOperate, list));
		}
	},



	isPiLaiGang(card) {
		let piList = ENSMJModel.getPiList();
		let ghostCard = ENSMJModel.getGhostCard();
		return (card == ghostCard) || (piList.indexOf(card) != -1)//痞赖杠
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
		return
		let bList = ENSMJModel.getBaiPaiInfo(ENSMJModel.getMyUID())
		if (bList && Array.isArray(bList) && bList.length > 0) {
			/**已经摆过牌了 */
			this._baiPaiList = []
			return
		}
		let handCards = ENSMJModel.getHandCards(ENSMJModel.getMyUID())
		let bpList = ENSMJLogic.getMinPaiList(handCards)
		// console.log("检测是否可以摆牌==>", bpList)
		this._baiPaiList = bpList
	},
});