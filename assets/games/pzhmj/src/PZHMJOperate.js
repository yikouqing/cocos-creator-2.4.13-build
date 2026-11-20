const PZHMJModel = require('./PZHMJModel');
const ApiPzhmj = require('./ApiPzhmj');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const PZHMJLogic = require('./PZHMJLogic');
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

		btn_bai: cc.Node,
		btn_ting: cc.Node,
		btn_jiao: cc.Node,
		baiSpine: sp.Skeleton,
		tingSpine: sp.Skeleton,
		jiaoSpine: sp.Skeleton,

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


		this.baiSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'tiaowu1') {
				this.showOpt(this.baiSpine, 'tiaowu2', true)
			}
		});
		this.tingSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'changge1') {
				this.showOpt(this.tingSpine, 'changge2', true)
			}
		});
		this.jiaoSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'baojiao1') {
				this.showOpt(this.jiaoSpine, 'baojiao2', true)
			}
		});
		cc.systemEvent.on("showOptNodeAgain", this.showNode, this)
	},

	onDestroy() {
		cc.systemEvent.off("showOptNodeAgain", this.showNode, this)
	},

	showNode() {
		this.node.active = true;
	},

	gameInit(data) {
		if (!data.operateArray) return;
		this.node.active = false;
		this.choseCard.active = false
		let operateArray = data.operateArray;
		if (PZHMJModel.getGameStatus() != ApiPzhmj.gameStatus.PLAYING ||
			!operateArray ||
			operateArray.length == 0 ||
			(operateArray.length == 1 &&
				operateArray[0].type == ApiPzhmj.operateType.QI)
		) {
			this.node.active = false;
		} else {
			this.onGameTurn(data)
		}
	},


	/**更新按钮 */
	updateBtn(operateArray) {
		if (!PZHMJModel.getSelfCanOut()) {
			this.node.active = false
			return
		}
		operateArray = operateArray || [];
		this.node.active = true;
		this._operateArray = operateArray;
		this.btn_guo.active = true
		if (this.btn_guo.active) this.showOpt(this.guoSpine, 'guo1', false)
		this.btn_peng.active = operateArray.some(opt => opt.type == ApiPzhmj.operateType.PENG);
		if (this.btn_peng.active) this.showOpt(this.pengSpine, 'peng1', false)
		this.btn_chi.active = operateArray.some(opt => opt.type == ApiPzhmj.operateType.CHI);
		if (this.btn_chi.active) this.showOpt(this.chiSpine, 'chi1', false)
		this.btn_gang.active = operateArray.some(opt => opt.type == ApiPzhmj.operateType.GANG_CHI ||
			opt.type == ApiPzhmj.operateType.GANG_BU || opt.type == ApiPzhmj.operateType.GANG_ZHI);
		if (this.btn_gang.active) this.showOpt(this.gangSpine, 'gang1', false)
		this.btn_hu.active = operateArray.some(opt => opt.type == ApiPzhmj.operateType.HU_CHI ||
			opt.type == ApiPzhmj.operateType.HU_ZHI || opt.type == ApiPzhmj.operateType.HU_QIANG)
		if (this.btn_hu.active) this.showOpt(this.huSpine, 'hu1', false)

		//报听 跳舞 唱歌按钮
		this.btn_jiao.active = operateArray.some(opt => opt.type == ApiPzhmj.operateType.BAOTING);
		if (this.btn_jiao.active) this.showOpt(this.jiaoSpine, 'baojiao1', false)
		this.btn_bai.active = operateArray.some(opt => opt.type == ApiPzhmj.operateType.TIAOWU);
		if (this.btn_bai.active) this.showOpt(this.baiSpine, 'tiaowu1', false)
		this.btn_ting.active = operateArray.some(opt => opt.type == ApiPzhmj.operateType.CHANGGE);
		if (this.btn_ting.active) this.showOpt(this.tingSpine, 'changge1', false)

		if (this.btn_hu.active) {
			let huzhi = operateArray.find(opt => opt.type == ApiPzhmj.operateType.HU_ZHI);
			let huchi = operateArray.find(opt => opt.type == ApiPzhmj.operateType.HU_CHI);
			let huqiang = operateArray.find(opt => opt.type == ApiPzhmj.operateType.HU_QIANG);
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
					let com = huTile.addComponent('PZHMJSingleTile');
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
			if (info.cardList && (info.type == ApiPzhmj.operateType.GANG_BU || info.type == ApiPzhmj.operateType.GANG_CHI || info.type == ApiPzhmj.operateType.GANG_ZHI)) {
				this._gangList.push(info.cardList)
			} else if (info.type == ApiPzhmj.operateType.CHI && info.cardList) {
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
		if (!PZHMJModel.isGameInited()) return //如果没有完成初始化，不能操作
		let node = event.node || event.target
		let operateArray = this._operateArray;
		// console.log("点击了按钮", node.name)
		switch (node.name) {
			case "btn_guo":
				if (PZHMJModel.getGameStatus() == ApiPzhmj.gameStatus.BAOTING) {
					ApiRoom.gameMessageNotify(ApiPzhmj.gameBaoTingOperateNotify(ApiPzhmj.operateType.GUO));
				} else
					ApiRoom.gameMessageNotify(ApiPzhmj.gameOperateNotify(null, ApiPzhmj.operateType.GUO));
				this.node.active = false
				break;
			case "btn_peng":
				let peng = operateArray.find(opt => opt.type == ApiPzhmj.operateType.PENG)
				ApiRoom.gameMessageNotify(ApiPzhmj.gameOperateNotify(peng.card, ApiPzhmj.operateType.PENG, peng.cardList));
				this.node.active = false
				break;
			case "btn_gang":
				if (this._gangList && this._gangList.length > 1) {
					this.showSelectCardView()
					return;
				}
				let gangFilter = [ApiPzhmj.operateType.GANG_BU, ApiPzhmj.operateType.GANG_CHI, ApiPzhmj.operateType.GANG_ZHI]
				let gangOperate = operateArray.find(opt => gangFilter.includes(opt.type));
				ApiRoom.gameMessageNotify(ApiPzhmj.gameOperateNotify(gangOperate.card, gangOperate.type, gangOperate.cardList));
				this.node.active = false;
				break;
			case "btn_hu":
				let huFilter = [ApiPzhmj.operateType.HU_ZHI, ApiPzhmj.operateType.HU_CHI, ApiPzhmj.operateType.HU_QIANG]
				let hu = operateArray.find(opt => huFilter.includes(opt.type));
				ApiRoom.gameMessageNotify(ApiPzhmj.gameOperateNotify(hu.card, hu.type));
				this.node.active = false;
				break;
			case "btn_chi":
				if (this._chiList && this._chiList.length > 1) {
					this.showSelectCardView(ApiPzhmj.operateType.CHI);
					return
				}
				let chi = operateArray.find(opt => opt.type == ApiPzhmj.operateType.CHI)
				ApiRoom.gameMessageNotify(ApiPzhmj.gameOperateNotify(chi.card, ApiPzhmj.operateType.CHI, this._chiList[0]));
				this.node.active = false;
				break;
			case "btn_closeChoose":
				this.choseCard.active = false;
				break;
			case "btn_bai":
				cc.systemEvent.emit("changTiaoStart", 2)
				this.node.active = false;
				break;
			case "btn_ting":
				cc.systemEvent.emit("changTiaoStart", 1)
				this.node.active = false;
				break;
			case "btn_jiao":
				if (PZHMJModel.getGameStatus() == ApiPzhmj.gameStatus.BAOTING) {
					ApiRoom.gameMessageNotify(ApiPzhmj.gameBaoTingOperateNotify(ApiPzhmj.operateType.BAOTING));
				} else
					ApiRoom.gameMessageNotify(ApiPzhmj.gameOperateNotify(null, ApiPzhmj.operateType.BAOTING));
				this.node.active = false;
				break;
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = [];
		if (optType === ApiPzhmj.operateType.CHI) {
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
				let com = tile.addComponent('PZHMJSingleTile');
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
		if (this._selectOptType === ApiPzhmj.operateType.CHI) {
			list = this._chiList[idx];
			let chi = this._operateArray.find(opt => opt.type == ApiPzhmj.operateType.CHI && JSON.stringify(list) == JSON.stringify(opt.cardList))
			ApiRoom.gameMessageNotify(ApiPzhmj.gameOperateNotify(chi.card, chi.type, list));
		} else {
			list = this._gangList[idx];
			let operateArray = this._operateArray;
			let gangOperate = this._selectOptType
			for (let i = 0; i < operateArray.length; i++) {
				const info = operateArray[i];
				if (info.type == ApiPzhmj.operateType.GANG_BU ||
					info.type == ApiPzhmj.operateType.GANG_CHI || info.type == ApiPzhmj.operateType.GANG_ZHI) {
					if (JSON.stringify(list) == JSON.stringify(info.cardList)) {
						gangOperate = info.type
						card = info.card
						break;
					}
				}
			}
			ApiRoom.gameMessageNotify(ApiPzhmj.gameOperateNotify(card, gangOperate, list));
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