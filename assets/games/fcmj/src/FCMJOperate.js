const FCMJModel = require('./FCMJModel');
const ApiFcmj = require('./ApiFcmj');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const FCMJLogic = require('./FCMJLogic');
const CCUtil = require('../../../src/utils/CCUtil');

cc.Class({
	extends: cc.Component,
	properties: {
		btn_guo: cc.Node,
		btn_peng: cc.Node,
		btn_gang: cc.Node,
		btn_hu: cc.Node,
		btn_chi: cc.Node,
		btn_yaoBao: cc.Node,
		btn_genBao: cc.Node,
		choseCard: cc.Node,
		shoseItem: cc.Node,
		cardContent: cc.Node,
		huNode: cc.Node,
		guoSpine: sp.Skeleton,
		pengSpine: sp.Skeleton,
		gangSpine: sp.Skeleton,
		huSpine: sp.Skeleton,
		chiSpine: sp.Skeleton,
		yaoBaoSpine: sp.Skeleton,
		genBaoSpine: sp.Skeleton,

		tileItemPfb: cc.Prefab,

		_huTileCom: null, //胡牌按钮上的牌

		_chiList: null,
		_gangList: null,
		_selectOptType: null,
		_operateArray: [],
		_yaoBaoType: null,
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
		this.yaoBaoSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'yaobao1') {
				this.showOpt(this.yaoBaoSpine, 'yaobao2', true)
			}
		});
		this.genBaoSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'genbao1') {
				this.showOpt(this.genBaoSpine, 'genbao2', true)
			}
		});
	},

	gameInit(data) {
		if (!data.operateArray) return;
		this.node.active = false;
		this.choseCard.active = false
		let operateArray = data.operateArray;
		if (FCMJModel.getGameStatus() != ApiFcmj.gameStatus.PLAYING ||
			!operateArray ||
			operateArray.length == 0 ||
			(operateArray.length == 1 &&
				operateArray[0].type == ApiFcmj.operateType.QI)
		) {
			this.node.active = false;
		} else {
			this.onGameTurn(data)
		}
	},

	/**展示瑶宝和跟宝按钮 */
	showYaoBao(type = null) {
		if (!type) {
			this.node.active = false
			this.btn_yaoBao.active = false
			this.btn_genBao.active = false
			this._yaoBaoType = null
			return
		}

		this._yaoBaoType = type

		//摇宝
		this.btn_yaoBao.active = type == ApiFcmj.yaoBaoType.YAO
		if (this.btn_yaoBao.active) this.showOpt(this.yaoBaoSpine, 'yaobao1', false)
		//跟宝
		this.btn_genBao.active = type == ApiFcmj.yaoBaoType.GEN
		if (this.btn_genBao.active) this.showOpt(this.genBaoSpine, 'genbao1', false)
		if (this.btn_yaoBao.active || this.btn_genBao.active) {
			this.node.active = true
			this.btn_guo.active = true
			this.btn_chi.active = false
			this.btn_gang.active = false
			this.btn_hu.active = false
			this.btn_peng.active = false
			if (this.btn_guo.active) this.showOpt(this.guoSpine, 'guo1', false)
		} else {
			this.node.active = false
			this.btn_yaoBao.active = false
			this.btn_genBao.active = false
			this._yaoBaoType = null
		}
		//console.log("showYaoBao==", type, this.btn_yaoBao.active, this.btn_genBao.active)
	},


	/**更新按钮 */
	updateBtn(operateArray) {
		operateArray = operateArray || [];
		if (operateArray.some(opt => opt.type == ApiFcmj.operateType.MOBAOHU)) { //摸宝会直接胡牌
			this.node.active = false
			return
		}
		this.node.active = true;
		this._operateArray = operateArray;

		this.btn_yaoBao.active = false
		this.btn_genBao.active = false
		this.btn_guo.active = true
		if (this.btn_guo.active) this.showOpt(this.guoSpine, 'guo1', false)
		this.btn_peng.active = operateArray.some(opt => opt.type == ApiFcmj.operateType.PENG);
		if (this.btn_peng.active) this.showOpt(this.pengSpine, 'peng1', false)
		this.btn_chi.active = operateArray.some(opt => opt.type == ApiFcmj.operateType.CHI);
		if (this.btn_chi.active) this.showOpt(this.chiSpine, 'chi1', false)
		this.btn_gang.active = operateArray.some(opt => opt.type == ApiFcmj.operateType.GANG_CHI ||
			opt.type == ApiFcmj.operateType.GANG_BU || opt.type == ApiFcmj.operateType.GANG_ZHI);
		if (this.btn_gang.active) this.showOpt(this.gangSpine, 'gang1', false)
		this.btn_hu.active = operateArray.some(opt => opt.type == ApiFcmj.operateType.HU_CHI ||
			opt.type == ApiFcmj.operateType.HU_ZHI || opt.type == ApiFcmj.operateType.HU_QIANG)
		if (this.btn_hu.active) this.showOpt(this.huSpine, 'hu1', false)

		if (this.btn_hu.active) {
			let huzhi = operateArray.find(opt => opt.type == ApiFcmj.operateType.HU_ZHI);
			let huchi = operateArray.find(opt => opt.type == ApiFcmj.operateType.HU_CHI);
			let huqiang = operateArray.find(opt => opt.type == ApiFcmj.operateType.HU_QIANG);
			let card = null;
			if (huzhi) card = huzhi.card
			if (huchi) card = huchi.card
			if (huqiang) card = huqiang.card

			if (!this._huTileCom) {
				let tile = cc.find("tile", this.huNode);
				tile.removeAllChildren()
				let huTile = cc.instantiate(this.tileItemPfb)
				huTile.parent = tile
				let com = huTile.addComponent('FCMJSingleTile');
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
			if (info.cardList && (info.type == ApiFcmj.operateType.GANG_BU || info.type == ApiFcmj.operateType.GANG_CHI || info.type == ApiFcmj.operateType.GANG_ZHI)) {
				this._gangList.push(info.cardList)
			} else if (info.type == ApiFcmj.operateType.CHI && info.cardList) {
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
		this._yaoBaoType = null
		this.showYaoBao()
	},

	onButtonClick(event, param) {
		if (!FCMJModel.isGameInited()) return //如果没有完成初始化，不能操作
		let node = event.node || event.target
		let operateArray = this._operateArray;
		// console.log("点击了按钮", node.name)
		switch (node.name) {
			case "btn_guo":
				if (this._yaoBaoType == ApiFcmj.yaoBaoType.YAO) {
					ApiRoom.gameMessageNotify(ApiFcmj.userYaoBaoOptNotify(false));
				} else if (this._yaoBaoType == ApiFcmj.yaoBaoType.GEN) {
					ApiRoom.gameMessageNotify(ApiFcmj.userGenBaoOptNotify(false));
				} else {
					ApiRoom.gameMessageNotify(ApiFcmj.gameOperateNotify(null, ApiFcmj.operateType.GUO));
				}
				this._yaoBaoType = null
				this.node.active = false
				break;
			case "btn_peng":
				let peng = operateArray.find(opt => opt.type == ApiFcmj.operateType.PENG)
				ApiRoom.gameMessageNotify(ApiFcmj.gameOperateNotify(peng.card, ApiFcmj.operateType.PENG, peng.cardList));
				this.node.active = false
				break;
			case "btn_gang":
				if (this._gangList && this._gangList.length > 1) {
					this.showSelectCardView()
					return;
				}
				let gangFilter = [ApiFcmj.operateType.GANG_BU, ApiFcmj.operateType.GANG_CHI, ApiFcmj.operateType.GANG_ZHI]
				let gangOperate = operateArray.find(opt => gangFilter.includes(opt.type));
				ApiRoom.gameMessageNotify(ApiFcmj.gameOperateNotify(gangOperate.card, gangOperate.type, gangOperate.cardList));
				this.node.active = false;
				break;
			case "btn_hu":
				let huFilter = [ApiFcmj.operateType.HU_ZHI, ApiFcmj.operateType.HU_CHI, ApiFcmj.operateType.HU_QIANG]
				let hu = operateArray.find(opt => huFilter.includes(opt.type));
				ApiRoom.gameMessageNotify(ApiFcmj.gameOperateNotify(hu.card, hu.type));
				this.node.active = false;
				break;
			case "btn_chi":
				if (this._chiList && this._chiList.length > 1) {
					this.showSelectCardView(ApiFcmj.operateType.CHI);
					return
				}
				let chi = operateArray.find(opt => opt.type == ApiFcmj.operateType.CHI)
				ApiRoom.gameMessageNotify(ApiFcmj.gameOperateNotify(chi.card, ApiFcmj.operateType.CHI, this._chiList[0]));
				this.node.active = false;
				break;
			case "btn_closeChoose":
				this.choseCard.active = false;
				break;
			case "btn_yaoBao":
				ApiRoom.gameMessageNotify(ApiFcmj.userYaoBaoOptNotify(true));
				this._yaoBaoType = null
				this.node.active = false
				break;
			case "btn_genBao":
				ApiRoom.gameMessageNotify(ApiFcmj.userGenBaoOptNotify(true));
				this._yaoBaoType = null
				this.node.active = false
				break;
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = [];
		if (optType === ApiFcmj.operateType.CHI) {
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
				let com = tile.addComponent('FCMJSingleTile');
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
		if (this._selectOptType === ApiFcmj.operateType.CHI) {
			list = this._chiList[idx];
			let chi = this._operateArray.find(opt => opt.type == ApiFcmj.operateType.CHI && JSON.stringify(list) == JSON.stringify(opt.cardList))
			ApiRoom.gameMessageNotify(ApiFcmj.gameOperateNotify(chi.card, chi.type, list));
		} else {
			list = this._gangList[idx];
			let operateArray = this._operateArray;
			let gangOperate = this._selectOptType
			for (let i = 0; i < operateArray.length; i++) {
				const info = operateArray[i];
				if (info.type == ApiFcmj.operateType.GANG_BU ||
					info.type == ApiFcmj.operateType.GANG_CHI || info.type == ApiFcmj.operateType.GANG_ZHI) {
					if (JSON.stringify(list) == JSON.stringify(info.cardList)) {
						gangOperate = info.type
						card = info.card
						break;
					}
				}
			}
			ApiRoom.gameMessageNotify(ApiFcmj.gameOperateNotify(card, gangOperate, list));
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