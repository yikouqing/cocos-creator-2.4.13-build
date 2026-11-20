const YJBPXModel = require('./YJBPXModel');
const ApiYjbpx = require('./ApiYjbpx');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const YJBPXLogic = require('./YJBPXLogic');
const CCUtil = require('../../../src/utils/CCUtil');

cc.Class({
	extends: cc.Component,
	properties: {
		btn_guo: cc.Node,
		btn_peng: cc.Node,
		btn_gang: cc.Node,
		btn_hu: cc.Node,
		btn_chi: cc.Node,

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
	},

	showNode() {
		this.node.active = true;
	},

	gameInit(data) {
		if (!data.operateArray) return;
		this.node.active = false;
		this.choseCard.active = false
		let operateArray = data.operateArray;
		if (YJBPXModel.getGameStatus() != ApiYjbpx.gameStatus.PLAYING ||
			!operateArray ||
			operateArray.length == 0 ||
			(operateArray.length == 1 &&
				operateArray[0].type == ApiYjbpx.operateType.QI)
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
		if (this.btn_guo.active) this.showOpt(this.guoSpine, 'guo1', false)
		this.btn_peng.active = operateArray.some(opt => opt.type == ApiYjbpx.operateType.PENG);
		if (this.btn_peng.active) this.showOpt(this.pengSpine, 'peng1', false)
		this.btn_chi.active = operateArray.some(opt => opt.type == ApiYjbpx.operateType.CHI);
		if (this.btn_chi.active) this.showOpt(this.chiSpine, 'chi1', false)
		this.btn_gang.active = operateArray.some(opt => opt.type == ApiYjbpx.operateType.GANG_CHI ||
			opt.type == ApiYjbpx.operateType.GANG_BU || opt.type == ApiYjbpx.operateType.GANG_ZHI);
		if (this.btn_gang.active) this.showOpt(this.gangSpine, 'gang1', false)
		this.btn_hu.active = operateArray.some(opt => opt.type == ApiYjbpx.operateType.HU_CHI ||
			opt.type == ApiYjbpx.operateType.HU_ZHI || opt.type == ApiYjbpx.operateType.HU_QIANG)
		if (this.btn_hu.active) this.showOpt(this.huSpine, 'hu1', false)

		if (this.btn_hu.active) {
			if (YJBPXModel.getGameRuleByKey("isBiHu")) {
				this.btn_guo.active = false //如果是必胡，隐藏过
				YJBPXModel.setIsBiHuing(true)
			}
			let huzhi = operateArray.find(opt => opt.type == ApiYjbpx.operateType.HU_ZHI);
			let huchi = operateArray.find(opt => opt.type == ApiYjbpx.operateType.HU_CHI);
			let huqiang = operateArray.find(opt => opt.type == ApiYjbpx.operateType.HU_QIANG);
			let card = null;
			if (huzhi) card = huzhi.card
			if (huchi) card = huchi.card
			if (huqiang) card = huqiang.card
			if (card) {
				if (!this._huTileCom) {
					let tile = cc.find("tile", this.huNode);
					tile.removeAllChildren()
					let huTile = cc.instantiate(this.tileItemPfb)
					huTile.parent = tile
					let com = huTile.addComponent('YJBPXSingleTile');
					com.init();
					com.setNodeShow(true);
					this._huTileCom = com
				}
				this._huTileCom.flower = card;
				this.huNode.active = true;
			} else {
				this.huNode.active = false;
			}
		} else {
			this.huNode.active = false;
		}
	},

	onGameTurn(data) {
		this._gangList = []
		this._chiList = []
		for (let i = 0; i < data.operateArray.length; i++) {
			const info = data.operateArray[i];
			if (info.cardList && (info.type == ApiYjbpx.operateType.GANG_BU || info.type == ApiYjbpx.operateType.GANG_CHI || info.type == ApiYjbpx.operateType.GANG_ZHI)) {
				this._gangList.push(info.cardList)
			} else if (info.type == ApiYjbpx.operateType.CHI && info.cardList) {
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
		if (!YJBPXModel.isGameInited()) return //如果没有完成初始化，不能操作
		let node = event.node || event.target
		let operateArray = this._operateArray;
		// console.log("点击了按钮", node.name)
		switch (node.name) {
			case "btn_guo":
				if (YJBPXModel.getGameStatus() == ApiYjbpx.gameStatus.BAOTING) {
					ApiRoom.gameMessageNotify(ApiYjbpx.gameBaoTingOperateNotify(ApiYjbpx.operateType.GUO));
				} else
					ApiRoom.gameMessageNotify(ApiYjbpx.gameOperateNotify(null, ApiYjbpx.operateType.GUO));
				this.node.active = false
				break;
			case "btn_peng":
				let peng = operateArray.find(opt => opt.type == ApiYjbpx.operateType.PENG)
				ApiRoom.gameMessageNotify(ApiYjbpx.gameOperateNotify(peng.card, ApiYjbpx.operateType.PENG, peng.cardList));
				this.node.active = false
				break;
			case "btn_gang":
				if (this._gangList && this._gangList.length > 1) {
					this.showSelectCardView()
					return;
				}
				let gangFilter = [ApiYjbpx.operateType.GANG_BU, ApiYjbpx.operateType.GANG_CHI, ApiYjbpx.operateType.GANG_ZHI]
				let gangOperate = operateArray.find(opt => gangFilter.includes(opt.type));
				ApiRoom.gameMessageNotify(ApiYjbpx.gameOperateNotify(gangOperate.card, gangOperate.type, gangOperate.cardList));
				this.node.active = false;
				break;
			case "btn_hu":
				let huFilter = [ApiYjbpx.operateType.HU_ZHI, ApiYjbpx.operateType.HU_CHI, ApiYjbpx.operateType.HU_QIANG]
				let hu = operateArray.find(opt => huFilter.includes(opt.type));
				ApiRoom.gameMessageNotify(ApiYjbpx.gameOperateNotify(hu.card, hu.type));
				this.node.active = false;
				break;
			case "btn_chi":
				if (this._chiList && this._chiList.length > 1) {
					this.showSelectCardView(ApiYjbpx.operateType.CHI);
					return
				}
				let chi = operateArray.find(opt => opt.type == ApiYjbpx.operateType.CHI)
				ApiRoom.gameMessageNotify(ApiYjbpx.gameOperateNotify(chi.card, ApiYjbpx.operateType.CHI, this._chiList[0]));
				this.node.active = false;
				break;
			case "btn_closeChoose":
				this.choseCard.active = false;
				break;
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = [];
		if (optType === ApiYjbpx.operateType.CHI) {
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
				let com = tile.addComponent('YJBPXSingleTile');
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
		if (this._selectOptType === ApiYjbpx.operateType.CHI) {
			list = this._chiList[idx];
			let chi = this._operateArray.find(opt => opt.type == ApiYjbpx.operateType.CHI && JSON.stringify(list) == JSON.stringify(opt.cardList))
			ApiRoom.gameMessageNotify(ApiYjbpx.gameOperateNotify(chi.card, chi.type, list));
		} else {
			list = this._gangList[idx];
			let operateArray = this._operateArray;
			let gangOperate = this._selectOptType
			for (let i = 0; i < operateArray.length; i++) {
				const info = operateArray[i];
				if (info.type == ApiYjbpx.operateType.GANG_BU ||
					info.type == ApiYjbpx.operateType.GANG_CHI || info.type == ApiYjbpx.operateType.GANG_ZHI) {
					if (JSON.stringify(list) == JSON.stringify(info.cardList)) {
						gangOperate = info.type
						card = info.card
						break;
					}
				}
			}
			ApiRoom.gameMessageNotify(ApiYjbpx.gameOperateNotify(card, gangOperate, list));
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