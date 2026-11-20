const AJMJModel = require('./AJMJModel');
const ApiAjmj = require('./ApiAjmj');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const AJMJLogic = require('./AJMJLogic');

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

		tileItemPfb: cc.Prefab,

		_huTileCom: null, //胡牌按钮上的牌

		_chiList: null,
		_gangList: null,
		_selectOptType: null,
		_operateArray: [],
	},

	gameInit(data) {
		if (!data.operateArray) return;
		this.node.active = false;
		this.choseCard.active = false
		let operateArray = data.operateArray;
		if (AJMJModel.getGameStatus() != ApiAjmj.gameStatus.PLAYING ||
			!operateArray ||
			operateArray.length == 0 ||
			(operateArray.length == 1 &&
				operateArray[0].type == ApiAjmj.operateType.QI)
		) {
			this.node.active = false;
		} else {
			this.onGameTurn(data)
		}
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
		let myUid = AJMJModel.getMyUID();
		let lastOpt = AJMJModel.getLastOperate();
		let handCards = AJMJModel.getHandCards(myUid);
		let ghostCard = AJMJModel.getGhostCard();

		this.guoButton.active = true
		if (this.guoButton.active) this.showOpt(this.guoSpine, 'guo1', false)
		this.pengButton.active = operateArray.some(opt => opt.type == ApiAjmj.operateType.PENG);
		if (this.pengButton.active) this.showOpt(this.pengSpine, 'peng1', false)
		this.chiButton.active = operateArray.some(opt => opt.type == ApiAjmj.operateType.CHI);
		if (this.chiButton.active) this.showOpt(this.chiSpine, 'chi1', false)
		this.gangButton.active = operateArray.some(opt => opt.type == ApiAjmj.operateType.GANG_CHI ||
			opt.type == ApiAjmj.operateType.GANG_BU || opt.type == ApiAjmj.operateType.GANG_ZHI);
		if (this.gangButton.active) this.showOpt(this.gangSpine, 'gang1', false)
		this.huButton.active = operateArray.some(opt => opt.type == ApiAjmj.operateType.HU_CHI ||
			opt.type == ApiAjmj.operateType.HU_ZHI || opt.type == ApiAjmj.operateType.HU_QIANG)
		if (this.huButton.active) this.showOpt(this.huSpine, 'hu1', false)

		if (this.huButton.active) {
			let huzhi = operateArray.find(opt => opt.type == ApiAjmj.operateType.HU_ZHI);
			let huchi = operateArray.find(opt => opt.type == ApiAjmj.operateType.HU_CHI);
			let huqiang = operateArray.find(opt => opt.type == ApiAjmj.operateType.HU_QIANG);
			let card = null;
			if (huzhi) card = huzhi.card
			if (huchi) card = huchi.card
			if (huqiang) card = huqiang.card

			if (!this._huTileCom) {
				let tile = cc.find("tile", this.huNode);
				tile.removeAllChildren()
				let huTile = cc.instantiate(this.tileItemPfb)
				huTile.parent = tile
				let com = huTile.addComponent('AJMJSingleTile');
				com.init();
				com.setNodeShow(true);
				this._huTileCom = com
			}
			this._huTileCom.flower = card;
			this.huNode.active = true;
		} else {
			this.huNode.active = false;
		}
	},

	onGameTurn(data) {
		this._gangList = []
		this._chiList = []
		for (let i = 0; i < data.operateArray.length; i++) {
			const info = data.operateArray[i];
			if (info.cardList && (info.type == ApiAjmj.operateType.GANG_BU || info.type == ApiAjmj.operateType.GANG_CHI || info.type == ApiAjmj.operateType.GANG_ZHI)) {
				this._gangList.push(info.cardList)
			} else if (info.type == ApiAjmj.operateType.CHI && info.cardList) {
				this._chiList.push(info.cardList)
			}
		}
		this.updateBtn(data.operateArray);
	},

	onClearTurn() {
		this.node.active = false;
		this.choseCard.active = false
		this._selectOptType = null
		this._chiList = null
		this._gangList = null
	},

	onButtonClick(event, param) {
		let operateArray = this._operateArray;
		if (param == 'guo') {
			ApiRoom.gameMessageNotify(ApiAjmj.gameOperateNotify(null, ApiAjmj.operateType.GUO));
			this.node.active = false
		} else if (param == 'peng') {
			let peng = operateArray.find(opt => opt.type == ApiAjmj.operateType.PENG)
			ApiRoom.gameMessageNotify(ApiAjmj.gameOperateNotify(peng.card, ApiAjmj.operateType.PENG, peng.cardList));
			this.node.active = false
		} else if (param == 'gang') {
			if (this._gangList && this._gangList.length > 1) {
				this.showSelectCardView()
				return;
			}
			let gangFilter = [ApiAjmj.operateType.GANG_BU, ApiAjmj.operateType.GANG_CHI, ApiAjmj.operateType.GANG_ZHI]
			let gangOperate = operateArray.find(opt => gangFilter.includes(opt.type));
			ApiRoom.gameMessageNotify(ApiAjmj.gameOperateNotify(gangOperate.card, gangOperate.type, gangOperate.cardList));
			this.node.active = false;
		} else if (param == 'hu') {
			let huFilter = [ApiAjmj.operateType.HU_ZHI, ApiAjmj.operateType.HU_CHI, ApiAjmj.operateType.HU_QIANG]
			let hu = operateArray.find(opt => huFilter.includes(opt.type));
			ApiRoom.gameMessageNotify(ApiAjmj.gameOperateNotify(hu.card, hu.type));
			this.node.active = false;
		} else if (param === "chi") {
			if (this._chiList && this._chiList.length > 1) {
				this.showSelectCardView(ApiAjmj.operateType.CHI);
				return
			}
			let chi = operateArray.find(opt => opt.type == ApiAjmj.operateType.CHI)
			ApiRoom.gameMessageNotify(ApiAjmj.gameOperateNotify(chi.card, ApiAjmj.operateType.CHI, this._chiList[0]));
			this.node.active = false;
		} else if (param === "closeChose") {
			this.choseCard.active = false;
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = [];
		if (optType === ApiAjmj.operateType.CHI) {
			list = this._chiList;
		} else {
			list = this._gangList;
		}
		if (this._selectOptType === optType) {
			this.choseCard.active = true;
			return;
		}
		this._selectOptType = optType;
		this.cardContent.removeAllChildren()
		for (let index = 0; index < list.length; index++) {
			const cardList = list[index];
			let cardNode = cc.instantiate(this.shoseItem)
			for (let i = 0; i < cardList.length; i++) {
				let cardNum = cardList[i];
				let tile = cc.instantiate(this.tileItemPfb)
				tile.parent = cardNode
				let com = tile.addComponent('AJMJSingleTile');
				com.init();
				com.flower = cardNum
				com.setNodeShow(true);
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
		let idx = parseInt(btn.node.name);
		let list = [];
		let card = null
		if (this._selectOptType === ApiAjmj.operateType.CHI) {
			list = this._chiList[idx];
			let chi = this._operateArray.find(opt => opt.type == ApiAjmj.operateType.CHI && JSON.stringify(list) == JSON.stringify(opt.cardList))
			ApiRoom.gameMessageNotify(ApiAjmj.gameOperateNotify(chi.card, chi.type, list));
		} else {
			list = this._gangList[idx];
			let operateArray = this._operateArray;
			let gangOperate = this._selectOptType
			for (let i = 0; i < operateArray.length; i++) {
				const info = operateArray[i];
				if (info.type == ApiAjmj.operateType.GANG_BU ||
					info.type == ApiAjmj.operateType.GANG_CHI || info.type == ApiAjmj.operateType.GANG_ZHI) {
					if (JSON.stringify(list) == JSON.stringify(info.cardList)) {
						gangOperate = info.type
						card = info.card
						break;
					}
				}
			}
			ApiRoom.gameMessageNotify(ApiAjmj.gameOperateNotify(card, gangOperate, list));
		}
	},

	/**展示操作动画 */
	showOpt(optSpine, aniName, loop = false) {
		let track = Utils.getRandomNum(0, 10)
		optSpine.node.active = true
		optSpine.setSkin('default');
		optSpine.timeScale = 1
		optSpine.setAnimation(track, aniName, loop)
	},
});