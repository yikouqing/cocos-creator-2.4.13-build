const YBMJModel = require('./YBMJModel');
const ApiYbmj = require('./ApiYbmj');
const ApiRoom = require('../../../src/api/ApiRoom');
const Utils = require('../../../src/utils/Utils');
const CCUtil = require('../../../src/utils/CCUtil');
const YBMJLogic = require('./YBMJLogic');

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

		btn_ti: cc.Node,
		btn_fei: cc.Node,
		tiSpine: sp.Skeleton,
		feiSpine: sp.Skeleton,

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
		// ti
		this.tiSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'ti1') {
				this.showOpt(this.tiSpine, 'ti2', true)
			}
		});
		// fei
		this.feiSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'fei1') {
				this.showOpt(this.feiSpine, 'fei2', true)
			}
		});
	},

	gameInit(data) {
		if (!data.operateArray) return;
		this.node.active = false;
		this.choseCard.active = false
		let operateArray = data.operateArray;
		if (YBMJModel.getGameStatus() != ApiYbmj.gameStatus.PLAYING ||
			!operateArray ||
			operateArray.length == 0 ||
			(operateArray.length == 1 &&
				operateArray[0].type == ApiYbmj.operateType.QI)
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

		this.btn_peng.active = operateArray.some(opt => opt.type == ApiYbmj.operateType.PENG);
		if (this.btn_peng.active) this.showOpt(this.pengSpine, 'peng1', false)
		this.btn_chi.active = operateArray.some(opt => opt.type == ApiYbmj.operateType.CHI);
		if (this.btn_chi.active) this.showOpt(this.chiSpine, 'chi1', false)
		this.btn_gang.active = operateArray.some(opt => opt.type == ApiYbmj.operateType.GANG_CHI ||
			opt.type == ApiYbmj.operateType.GANG_BU || opt.type == ApiYbmj.operateType.GANG_ZHI);
		if (this.btn_gang.active) this.showOpt(this.gangSpine, 'gang1', false)
		this.btn_hu.active = operateArray.some(opt => opt.type == ApiYbmj.operateType.HU_CHI ||
			opt.type == ApiYbmj.operateType.HU_ZHI || opt.type == ApiYbmj.operateType.HU_QIANG)
		if (this.btn_hu.active) this.showOpt(this.huSpine, 'hu1', false)
		this.btn_ti.active = operateArray.some(opt => opt.type == ApiYbmj.operateType.TI);
		if (this.btn_ti.active) this.showOpt(this.tiSpine, 'ti1', false)
		this.btn_fei.active = operateArray.some(opt => opt.type == ApiYbmj.operateType.FEI);
		if (this.btn_fei.active) this.showOpt(this.feiSpine, 'fei1', false)


		if (this.btn_hu.active) {
			/**如果只有两张牌了并且全是赖子，把过去掉 */
			if (operateArray.some(opt => opt.type == ApiYbmj.operateType.HU_ZHI)) {
				let ghostCard = YBMJModel.getGhostCard()
				if (ghostCard && ghostCard.length > 0) {
					let handCard = YBMJModel.getHandCards(YBMJModel.getMyUID());
					if (handCard.length == 2) {
						if (handCard.every(card => ghostCard.includes(card))) {
							this.btn_guo.active = false;
						}
					}
				}
			}

			let huzhi = operateArray.find(opt => opt.type == ApiYbmj.operateType.HU_ZHI);
			let huchi = operateArray.find(opt => opt.type == ApiYbmj.operateType.HU_CHI);
			let huqiang = operateArray.find(opt => opt.type == ApiYbmj.operateType.HU_QIANG);
			let card = null;
			if (huzhi) card = huzhi.card
			if (huchi) card = huchi.card
			if (huqiang) card = huqiang.card

			if (!card) {
				this.huNode.active = false
			} else {
				if (!this._huTileCom) {
					let tile = cc.find("tile", this.huNode);
					tile.removeAllChildren()
					let huTile = cc.instantiate(this.tileItemPfb)
					huTile.parent = tile
					let com = huTile.addComponent('YBMJSingleTile');
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
		this._gangList = []
		this._chiList = []
		for (let i = 0; i < data.operateArray.length; i++) {
			const info = data.operateArray[i];
			if (info.cardList && (info.type == ApiYbmj.operateType.GANG_BU ||
				info.type == ApiYbmj.operateType.GANG_CHI || info.type == ApiYbmj.operateType.GANG_ZHI)) {
				this._gangList.push(info.cardList)
			} else if (info.type == ApiYbmj.operateType.CHI && info.cardList) {
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
				ApiRoom.gameMessageNotify(ApiYbmj.gameOperateNotify(null, ApiYbmj.operateType.GUO));
				this.node.active = false
				break;
			case "btn_peng":
				let peng = operateArray.find(opt => opt.type == ApiYbmj.operateType.PENG)
				ApiRoom.gameMessageNotify(ApiYbmj.gameOperateNotify(peng.card, ApiYbmj.operateType.PENG, peng.cardList));
				this.node.active = false
				break;
			case "btn_gang":
				if (this._gangList && this._gangList.length > 1) {
					this.showSelectCardView()
					return;
				}
				let gangFilter = [ApiYbmj.operateType.GANG_BU, ApiYbmj.operateType.GANG_CHI, ApiYbmj.operateType.GANG_ZHI]
				let gangOperate = operateArray.find(opt => gangFilter.includes(opt.type));
				ApiRoom.gameMessageNotify(ApiYbmj.gameOperateNotify(gangOperate.card, gangOperate.type, gangOperate.cardList));
				this.node.active = false;
				break;
			case "btn_hu":
				let huFilter = [ApiYbmj.operateType.HU_ZHI, ApiYbmj.operateType.HU_CHI, ApiYbmj.operateType.HU_QIANG]
				let hu = operateArray.find(opt => huFilter.includes(opt.type));
				if (hu.type == ApiYbmj.operateType.HU_ZHI && !hu.card) { //提胡特殊处理
					let lastOpt = YBMJModel.getLastOperate()
					if (lastOpt && lastOpt.operate == ApiYbmj.operateType.TI) {
						let ghostCard = YBMJModel.getGhostCard()
						let tiCard = lastOpt.cardList.find(card => ghostCard.includes(card))
						hu.card = tiCard
					}
					console.log("提胡", hu)
				}
				ApiRoom.gameMessageNotify(ApiYbmj.gameOperateNotify(hu.card, hu.type));
				this.node.active = false;
				break;
			case "btn_chi":
				if (this._chiList && this._chiList.length > 1) {
					this.showSelectCardView(ApiYbmj.operateType.CHI);
					return
				}
				let chi = operateArray.find(opt => opt.type == ApiYbmj.operateType.CHI)
				ApiRoom.gameMessageNotify(ApiYbmj.gameOperateNotify(chi.card, ApiYbmj.operateType.CHI, this._chiList[0]));
				this.node.active = false;
				break;
			case "btn_closeChoose":
				this.choseCard.active = false;
				break;
			case "btn_ti":
				let ti = operateArray.find(opt => opt.type == ApiYbmj.operateType.TI)
				ApiRoom.gameMessageNotify(ApiYbmj.gameOperateNotify(ti.card, ApiYbmj.operateType.TI, ti.ticardList, ti.cardList));
				this.node.active = false;
				break;
			case "btn_fei":
				let fei = operateArray.find(opt => opt.type == ApiYbmj.operateType.FEI)
				ApiRoom.gameMessageNotify(ApiYbmj.gameOperateNotify(fei.card, ApiYbmj.operateType.FEI, fei.cardList));
				this.node.active = false;
				break;
			default:
				break;
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = [];
		if (optType === ApiYbmj.operateType.CHI) {
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
				let com = tile.addComponent('YBMJSingleTile');
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
		if (this._selectOptType === ApiYbmj.operateType.CHI) {
			list = this._chiList[idx];
			let chi = this.operateArray.find(opt => opt.type == ApiYbmj.operateType.CHI && JSON.stringify(list) == JSON.stringify(opt.cardList))
			ApiRoom.gameMessageNotify(ApiYbmj.gameOperateNotify(chi.card, chi.type, list));
		} else {
			list = this._gangList[idx];
			let operateArray = this._operateArray;
			let gangOperate = this._selectOptType
			for (let i = 0; i < operateArray.length; i++) {
				const info = operateArray[i];
				if (info.type == ApiYbmj.operateType.GANG_BU ||
					info.type == ApiYbmj.operateType.GANG_CHI || info.type == ApiYbmj.operateType.GANG_ZHI) {
					if (JSON.stringify(list) == JSON.stringify(info.cardList)) {
						gangOperate = info.type
						card = info.card
						break;
					}
				}
			}
			ApiRoom.gameMessageNotify(ApiYbmj.gameOperateNotify(card, gangOperate, list));
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