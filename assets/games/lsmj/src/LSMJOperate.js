const LSMJModel = require('./LSMJModel');
const ApiLsmj = require('./ApiLsmj');
const ApiRoom = require('../../../src/api/ApiRoom');
const Utils = require('../../../src/utils/Utils');
const CCUtil = require('../../../src/utils/CCUtil');
const LSMJLogic = require('./LSMJLogic');

cc.Class({
	extends: cc.Component,
	properties: {
		btn_guo: cc.Node,
		btn_peng: cc.Node,
		btn_gang: cc.Node,
		btn_hu: cc.Node,
		btn_chi: cc.Node,
		btn_ti: cc.Node,
		choseCard: cc.Node,
		shoseItem: cc.Node,
		cardLay: cc.Node,
		cardContent: cc.Node,
		huNode: cc.Node,
		guoSpine: sp.Skeleton,
		pengSpine: sp.Skeleton,
		gangSpine: sp.Skeleton,
		huSpine: sp.Skeleton,
		chiSpine: sp.Skeleton,
		tileItemPfb: cc.Prefab,
		tiSpine: sp.Skeleton,

		_huTileCom: null, //胡牌按钮上的牌
		_chiList: null,
		_pengList: null,
		_gangList: null,
		_tiList: null,
		_selectOptType: null,
		_operateArray: [],
	},

	start() {

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
		// ti
		this.tiSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'ti1') {
				this.showOpt(this.tiSpine, 'ti2', true)
			}
		});
	},

	gameInit(data) {
		if (!data.operateArray) return;
		this.node.active = false;
		this.choseCard.active = false
		let operateArray = data.operateArray;
		if (LSMJModel.getGameStatus() != ApiLsmj.gameStatus.PLAYING ||
			!operateArray ||
			operateArray.length == 0 ||
			(operateArray.length == 1 &&
				operateArray[0].type == ApiLsmj.operateType.QI)
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
		this.btn_guo.active = true
		this.btn_peng.active = operateArray.some(opt => opt.type == ApiLsmj.operateType.PENG);
		if (this.btn_peng.active) this.showOpt(this.pengSpine, 'peng1', false)
		this.btn_chi.active = operateArray.some(opt => opt.type == ApiLsmj.operateType.CHI);
		if (this.btn_chi.active) this.showOpt(this.chiSpine, 'chi1', false)
		this.btn_gang.active = operateArray.some(opt => opt.type == ApiLsmj.operateType.GANG_CHI ||
			opt.type == ApiLsmj.operateType.GANG_BU || opt.type == ApiLsmj.operateType.GANG_ZHI);
		if (this.btn_gang.active) this.showOpt(this.gangSpine, 'gang1', false)
		this.btn_hu.active = operateArray.some(opt => opt.type == ApiLsmj.operateType.HU_CHI ||
			opt.type == ApiLsmj.operateType.HU_ZHI || opt.type == ApiLsmj.operateType.HU_QIANG ||
			opt.type == ApiLsmj.operateType.HU_TI)
		if (this.btn_hu.active) this.showOpt(this.huSpine, 'hu1', false)
		this.btn_ti.active = operateArray.some(opt => opt.type == ApiLsmj.operateType.TI);
		if (this.btn_ti.active) this.showOpt(this.tiSpine, 'ti1', false)
		if (this.btn_hu.active) {
			/**如果只有两张牌了并且全是赖子，把过去掉 */
			if (operateArray.some(opt => opt.type == ApiLsmj.operateType.HU_ZHI)) {
				let laiZiCards = LSMJModel.getGhostCard()
				if (laiZiCards && laiZiCards.length > 0) {
					let handCard = LSMJModel.getHandCards(LSMJModel.getMyUID());
					if (handCard.length == 2) {
						if (handCard.every(card => laiZiCards.includes(card))) {
							this.btn_guo.active = false;
						}
					}
				}
			}

			let huzhi = operateArray.find(opt => opt.type == ApiLsmj.operateType.HU_ZHI);
			let huchi = operateArray.find(opt => opt.type == ApiLsmj.operateType.HU_CHI);
			let huqiang = operateArray.find(opt => opt.type == ApiLsmj.operateType.HU_QIANG);
			let huti = operateArray.find(opt => opt.type == ApiLsmj.operateType.HU_TI);
			let card = null;
			if (huzhi) card = huzhi.card
			if (huchi) card = huchi.card
			if (huqiang) card = huqiang.card
			if (huti) card = huti.card
			if (!card) {
				this.huNode.active = false
			} else {
				if (!this._huTileCom) {
					let tile = cc.find("tile", this.huNode);
					tile.removeAllChildren()
					let huTile = cc.instantiate(this.tileItemPfb)
					huTile.parent = tile
					let com = huTile.addComponent('LSMJSingleTile');
					com.init();
					com.setNodeShow(true);
					this._huTileCom = com
				}
				this._huTileCom.flower = card;
				this.huNode.active = true;
			}
		} else {
			this.huNode.active = false;
		}
		if (this.btn_guo.active) this.showOpt(this.guoSpine, 'guo1', false)
	},

	onGameTurn(data) {
		// console.log("onGameTurn", data.operateArray)
		this._gangList = []
		this._chiList = []
		this._pengList = []
		this._tiList = []
		for (let i = 0; i < data.operateArray.length; i++) {
			const info = data.operateArray[i];
			if (info.cardList && (info.type == ApiLsmj.operateType.GANG_BU ||
				info.type == ApiLsmj.operateType.GANG_CHI
				|| info.type == ApiLsmj.operateType.GANG_ZHI)) {
				this._gangList.push(info.cardList)
			} else if (info.type == ApiLsmj.operateType.CHI && info.cardList) {
				this._chiList.push(info.cardList)
			} else if (info.type == ApiLsmj.operateType.PENG && info.cardList) {
				this._pengList.push(info.cardList)
			} else if (info.type == ApiLsmj.operateType.TI && info.cardList) {
				this._tiList.push(info.cardList)
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
		this._pengList = null
		this._tiList = null;
	},

	onButtonClick(event) {
		let node = event.node || event.target
		let operateArray = this._operateArray;
		// console.log("点击了按钮", node.name)
		switch (node.name) {
			case "btn_guo":
				ApiRoom.gameMessageNotify(ApiLsmj.gameOperateNotify(null, ApiLsmj.operateType.GUO));
				this.node.active = false
				break;
			case "btn_peng":
				if (this._pengList && this._pengList.length > 1) {
					this.showSelectCardView(ApiLsmj.operateType.PENG)
					return;
				}
				let peng = operateArray.find(opt => opt.type == ApiLsmj.operateType.PENG)
				ApiRoom.gameMessageNotify(ApiLsmj.gameOperateNotify(peng.card, ApiLsmj.operateType.PENG, this._pengList[0]));
				this.node.active = false
				break;
			case "btn_gang":
				if (this._gangList && this._gangList.length > 1) {
					this.showSelectCardView();
					return;
				}
				let gangFilter = [ApiLsmj.operateType.GANG_BU, ApiLsmj.operateType.GANG_CHI, ApiLsmj.operateType.GANG_ZHI]
				let gangOperate = operateArray.find(opt => gangFilter.includes(opt.type));
				ApiRoom.gameMessageNotify(ApiLsmj.gameOperateNotify(gangOperate.card, gangOperate.type, gangOperate.cardList, null, gangOperate.ID));
				this.node.active = false;
				break;
			case "btn_hu":
				let huFilter = [ApiLsmj.operateType.HU_ZHI, ApiLsmj.operateType.HU_CHI, ApiLsmj.operateType.HU_QIANG, ApiLsmj.operateType.HU_TI]
				let hu = operateArray.find(opt => huFilter.includes(opt.type));
				if (hu.type == ApiLsmj.operateType.HU_ZHI && !hu.card) { //提胡特殊处理
					let lastOpt = LSMJModel.getLastOperate()
					if (lastOpt && lastOpt.operate == ApiLsmj.operateType.TI) {
						let changed = LSMJModel.findChangedElements(lastOpt.plusInfo.cardList, lastOpt.plusInfo.ticardList);
						if (changed.reduced.length != 1) return;
						hu.card = changed.reduced.pop();
					}
				}
				ApiRoom.gameMessageNotify(ApiLsmj.gameOperateNotify(hu.card, hu.type, null, null, hu.ID));
				this.node.active = false;
				break;
			case "btn_chi":
				if (this._chiList && this._chiList.length > 1) {
					this.showSelectCardView(ApiLsmj.operateType.CHI);
					return
				}
				let chi = operateArray.find(opt => opt.type == ApiLsmj.operateType.CHI)
				ApiRoom.gameMessageNotify(ApiLsmj.gameOperateNotify(chi.card, ApiLsmj.operateType.CHI, this._chiList[0]));
				this.node.active = false;
				break;
			case "btn_closeChoose":
				this.choseCard.active = false;
				break;
			case "btn_ti":
				if (this._tiList && this._tiList.length > 1) {
					this.showSelectCardView(ApiLsmj.operateType.TI);
					return
				}
				let ti = operateArray.find(opt => opt.type == ApiLsmj.operateType.TI)
				ApiRoom.gameMessageNotify(ApiLsmj.gameOperateNotify(ti.card, ApiLsmj.operateType.TI, ti.ticardList, ti.cardList, ti.ID, ti.Ticard));
				this.node.active = false;
				break;
			default:
				break;
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = [];
		if (optType === ApiLsmj.operateType.CHI) {
			list = this._chiList;
		} else if (optType === ApiLsmj.operateType.PENG) {
			list = this._pengList;
		} else if (optType === ApiLsmj.operateType.TI) {
			list = this._tiList;
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
				let tile = cc.instantiate(this.tileItemPfb);
				if (this.cardLay) tile.scaleY = this.cardLay.scaleY;
				tile.parent = cardNode;
				let com = tile.addComponent('LSMJSingleTile');
				com.init();
				com.flower = cardNum;
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
		if (this._selectOptType === ApiLsmj.operateType.CHI) {
			list = this._chiList[idx];
			let chi = this._operateArray.find(opt => opt.type == ApiLsmj.operateType.CHI && JSON.stringify(list) == JSON.stringify(opt.cardList))
			ApiRoom.gameMessageNotify(ApiLsmj.gameOperateNotify(chi.card, chi.type, list));
		} else if (this._selectOptType === ApiLsmj.operateType.PENG) {
			list = this._pengList[idx];
			let peng = this._operateArray.find(opt => opt.type == ApiLsmj.operateType.PENG && JSON.stringify(list) == JSON.stringify(opt.cardList))
			ApiRoom.gameMessageNotify(ApiLsmj.gameOperateNotify(peng.card, peng.type, list));
		} else if (this._selectOptType === ApiLsmj.operateType.TI) {
			list = this._tiList[idx];
			let ti = this._operateArray.find(opt => opt.type == ApiLsmj.operateType.TI && JSON.stringify(list) == JSON.stringify(opt.cardList));
			// console.log("showSelectCardView-ti", ti)
			ApiRoom.gameMessageNotify(ApiLsmj.gameOperateNotify(ti.card, ApiLsmj.operateType.TI, ti.ticardList, ti.cardList, ti.ID, ti.Ticard));
		} else {
			list = this._gangList[idx];
			let operateArray = this._operateArray;
			let gangOperate = this._selectOptType;
			let gangId = null;//碰牌癞子补杠需要传ID
			for (let i = 0; i < operateArray.length; i++) {
				const info = operateArray[i];
				if (info.type == ApiLsmj.operateType.GANG_BU ||
					info.type == ApiLsmj.operateType.GANG_CHI ||
					info.type == ApiLsmj.operateType.GANG_ZHI) {
					if (JSON.stringify(list) == JSON.stringify(info.cardList)) {
						gangOperate = info.type;
						card = info.card;
						gangId = info.ID;
						break;
					}
				}
			}
			ApiRoom.gameMessageNotify(ApiLsmj.gameOperateNotify(card, gangOperate, list, null, gangId));
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