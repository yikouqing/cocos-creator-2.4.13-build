const LAMJModel = require('./LAMJModel');
const ApiLamj = require('./ApiLamj');
const ApiRoom = require('../../../src/api/ApiRoom');
const Utils = require('../../../src/utils/Utils');
const CCUtil = require('../../../src/utils/CCUtil');
const LAMJLogic = require('./LAMJLogic');

cc.Class({
	extends: cc.Component,
	properties: {
		btn_guo: cc.Node,
		btn_peng: cc.Node,
		btn_gang: cc.Node,
		btn_hu: cc.Node,
		btn_chi: cc.Node,
		btn_guo1: cc.Node,
		btn_yiFengLan: cc.Node,
		btn_baoTing: cc.Node,
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
		baoTingNode: cc.Node,
		btLayout: cc.Node,

		_huTileCom: null, //胡牌按钮上的牌

		_chiList: null,
		_gangList: null,
		_selectOptType: null,
		_operateArray: [],
		_tingList: [],
		_baoTingComList: [],
		_selectTingCard: null,
	},

	start() {
		this.baoTingNode.active = false
		for (let i = 0; i < 14; i++) {
			let tile = cc.instantiate(this.tileItemPfb)
			tile.parent = this.btLayout
			tile.name = "" + i
			tile.addComponent(cc.Button)
			let com = tile.addComponent('LAMJSingleTile');
			com.init();
			com.setNodeShow(false);
			this._baoTingComList.push(com)
		}

		CCUtil.nodeRecursive(this.node, (node) => {
			if (node.getComponent(cc.Button)) {
				node.on("click", this.onButtonClick, this)
			}
		})

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

	gameInit(data) {
		if (!data.operateArray) return;
		this.node.active = false;
		this.choseCard.active = false
		this.baoTingNode.active = false
		let operateArray = data.operateArray;
		if (LAMJModel.getGameStatus() != ApiLamj.gameStatus.PLAYING ||
			!operateArray ||
			operateArray.length == 0 ||
			(operateArray.length == 1 &&
				operateArray[0].type == ApiLamj.operateType.QI)
		) {
			this.node.active = false;
		} else {
			this.onGameTurn(data)
		}
	},

	/**更新按钮 */
	updateBtn(operateArray) {
		operateArray = operateArray || [];
		this.node.active = true;
		this._operateArray = operateArray;
		this._selectTingCard = null

		this.btn_baoTing.active = operateArray.some(opt => opt.type == ApiLamj.operateType.BAOTING)
		this.btn_yiFengLan.active = operateArray.some(opt => opt.type == ApiLamj.operateType.YIFENGLAN)
		this.btn_guo1.active = operateArray.some(opt => opt.type == ApiLamj.operateType.BAOTING || opt.type == ApiLamj.operateType.YIFENGLAN)
		this.btn_guo.active = !this.btn_guo1.active
		if (this.btn_guo.active) this.showOpt(this.guoSpine, 'guo1', false)
		this.btn_peng.active = operateArray.some(opt => opt.type == ApiLamj.operateType.PENG);
		if (this.btn_peng.active) this.showOpt(this.pengSpine, 'peng1', false)
		this.btn_chi.active = operateArray.some(opt => opt.type == ApiLamj.operateType.CHI);
		if (this.btn_chi.active) this.showOpt(this.chiSpine, 'chi1', false)
		this.btn_gang.active = operateArray.some(opt => opt.type == ApiLamj.operateType.GANG_CHI ||
			opt.type == ApiLamj.operateType.GANG_BU || opt.type == ApiLamj.operateType.GANG_ZHI);
		if (this.btn_gang.active) this.showOpt(this.gangSpine, 'gang1', false)
		this.btn_hu.active = operateArray.some(opt => opt.type == ApiLamj.operateType.HU_CHI ||
			opt.type == ApiLamj.operateType.HU_ZHI || opt.type == ApiLamj.operateType.HU_QIANG)
		if (this.btn_hu.active) this.showOpt(this.huSpine, 'hu1', false)

		if (this.btn_hu.active) {
			let huzhi = operateArray.find(opt => opt.type == ApiLamj.operateType.HU_ZHI);
			let huchi = operateArray.find(opt => opt.type == ApiLamj.operateType.HU_CHI);
			let huqiang = operateArray.find(opt => opt.type == ApiLamj.operateType.HU_QIANG);
			let card = null;
			if (huzhi) card = huzhi.card
			if (huchi) card = huchi.card
			if (huqiang) card = huqiang.card

			if (!this._huTileCom) {
				let tile = cc.find("tile", this.huNode);
				tile.removeAllChildren()
				let huTile = cc.instantiate(this.tileItemPfb)
				huTile.parent = tile
				let com = huTile.addComponent('LAMJSingleTile');
				com.init();
				com.setNodeShow(true);
				this._huTileCom = com
			}
			this._huTileCom.flower = card;
			this.huNode.active = true;
		} else {
			this.huNode.active = false;
		}

		this.baoTingNode.active = false
		this._tingList = [];
		if (this.btn_baoTing.active) {
			let tingHandChecks = LAMJModel.getHandCards(LAMJModel.getMyUID())
			if (tingHandChecks.length == 14) {
				let tingCards = [];
				let ghostCard = LAMJModel.getGhostCard()
				//判断是否需要删除手牌
				let repeatFilter = Array.from(new Set(tingHandChecks));
				for (const cardId of repeatFilter) {
					let copyTingHandCards = tingHandChecks.slice();
					let tingFilter = LAMJModel.tingFilter(cardId, copyTingHandCards);
					let canTingList = LAMJLogic.getTingList(tingFilter.cards, ghostCard);
					if (!canTingList || canTingList.length == 0) continue;
					tingCards.push(cardId);
				}
				this._tingList = Array.from(new Set(tingCards));
				this._selectTingCard = this._tingList[0];
				if (this._tingList.length > 1) {
					for (let i = 0; i < this._baoTingComList.length; i++) {
						const com = this._baoTingComList[i];
						const cid = this._tingList[i];
						if (cid) {
							com.flower = cid;
							com.setNodeShow(true);
							com.setGray(i == 0)
						} else {
							com.setNodeShow(false);
						}
					}
					this.baoTingNode.active = true
				}
			}
		}
	},

	onGameTurn(data) {
		this._gangList = []
		this._chiList = []
		for (let i = 0; i < data.operateArray.length; i++) {
			const info = data.operateArray[i];
			if (info.cardList && (info.type == ApiLamj.operateType.GANG_BU ||
				info.type == ApiLamj.operateType.GANG_CHI || info.type == ApiLamj.operateType.GANG_ZHI)) {
				this._gangList.push(info.cardList)
			} else if (info.type == ApiLamj.operateType.CHI && info.cardList) {
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

	onButtonClick(event) {
		let node = event.node || event.target
		let operateArray = this._operateArray;
		// console.log("点击了按钮", node.name)
		switch (node.name) {
			case "btn_guo":
			case "btn_guo1":
				ApiRoom.gameMessageNotify(ApiLamj.gameOperateNotify(null, ApiLamj.operateType.GUO));
				this.node.active = false
				break;
			case "btn_peng":
				let peng = operateArray.find(opt => opt.type == ApiLamj.operateType.PENG)
				ApiRoom.gameMessageNotify(ApiLamj.gameOperateNotify(peng.card, ApiLamj.operateType.PENG, peng.cardList));
				this.node.active = false
				break;
			case "btn_gang":
				if (this._gangList && this._gangList.length > 1) {
					this.showSelectCardView()
					return;
				}
				let gangFilter = [ApiLamj.operateType.GANG_BU, ApiLamj.operateType.GANG_CHI, ApiLamj.operateType.GANG_ZHI]
				let gangOperate = operateArray.find(opt => gangFilter.includes(opt.type));
				ApiRoom.gameMessageNotify(ApiLamj.gameOperateNotify(gangOperate.card, gangOperate.type, gangOperate.cardList));
				this.node.active = false;
				break;
			case "btn_hu":
				let huFilter = [ApiLamj.operateType.HU_ZHI, ApiLamj.operateType.HU_CHI, ApiLamj.operateType.HU_QIANG]
				let hu = operateArray.find(opt => huFilter.includes(opt.type));
				ApiRoom.gameMessageNotify(ApiLamj.gameOperateNotify(hu.card, hu.type));
				this.node.active = false;
				break;
			case "btn_chi":
				if (this._chiList && this._chiList.length > 1) {
					this.showSelectCardView(ApiLamj.operateType.CHI);
					return
				}
				let chi = operateArray.find(opt => opt.type == ApiLamj.operateType.CHI)
				ApiRoom.gameMessageNotify(ApiLamj.gameOperateNotify(chi.card, ApiLamj.operateType.CHI, this._chiList[0]));
				this.node.active = false;
				break;
			case "btn_closeChoose":
				this.choseCard.active = false;
				break;
			case "btn_baoTing":
				if (this._tingList.length > 0) {
					ApiRoom.gameMessageNotify(ApiLamj.gameOperateNotify(this._selectTingCard, ApiLamj.operateType.BAOTING));
				} else
					ApiRoom.gameMessageNotify(ApiLamj.gameOperateNotify(null, ApiLamj.operateType.BAOTING));
				this.node.active = false
				break;
			case "btn_yiFengLan":
				ApiRoom.gameMessageNotify(ApiLamj.gameOperateNotify(null, ApiLamj.operateType.YIFENGLAN));
				this.node.active = false
				break;
			default:
				let idx = parseInt(node.name)
				let selectCom = node.getComponent("LAMJSingleTile")
				if (idx >= 0 && selectCom) {
					selectCom.setGray(true)
					for (let i = 0; i < this._baoTingComList.length; i++) {
						if (i != idx) {
							const com = this._baoTingComList[i];
							com.setGray(false)
						}
					}
					this._selectTingCard = this._tingList[idx]
				}
				break;
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = [];
		if (optType === ApiLamj.operateType.CHI) {
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
				let com = tile.addComponent('LAMJSingleTile');
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
		if (this._selectOptType === ApiLamj.operateType.CHI) {
			list = this._chiList[idx];
			let chi = this.operateArray.find(opt => opt.type == ApiLamj.operateType.CHI && JSON.stringify(list) == JSON.stringify(opt.cardList))
			ApiRoom.gameMessageNotify(ApiLamj.gameOperateNotify(chi.card, chi.type, list));
		} else {
			list = this._gangList[idx];
			let operateArray = this._operateArray;
			let gangOperate = this._selectOptType
			for (let i = 0; i < operateArray.length; i++) {
				const info = operateArray[i];
				if (info.type == ApiLamj.operateType.GANG_BU ||
					info.type == ApiLamj.operateType.GANG_CHI || info.type == ApiLamj.operateType.GANG_ZHI) {
					if (JSON.stringify(list) == JSON.stringify(info.cardList)) {
						gangOperate = info.type
						card = info.card
						break;
					}
				}
			}
			ApiRoom.gameMessageNotify(ApiLamj.gameOperateNotify(card, gangOperate, list));
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