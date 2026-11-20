const YDRModel = require('./YDRModel');
const ApiYdr = require('./ApiYdr');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const cardCom = require("./card/YDRCard");
const CCUtil = require('../../../src/utils/CCUtil');

let LAY_COUNT = {
	[3]: 0,
	[4]: -43.3,
	[5]: -65,
}

cc.Class({
	extends: cc.Component,
	properties: {

		choseCard: cc.Node,
		choseItem: cc.Prefab,
		choseGroup: cc.Node,
		cardContent: cc.Node,
		chooseNode: cc.Node,
		buttonLayout: cc.Node,

		btn_kou: cc.Node,
		btn_qiPai: cc.Node,
		btn_hu: cc.Node,
		btn_chi: cc.Node,
		btn_peng: cc.Node,
		btn_sha: cc.Node,
		btn_tu: cc.Node,
		btn_guo: cc.Node,
		btn_out_kou: cc.Node,

		dianLayout: cc.Node,
		txt_tuo: cc.Label,
		txt_mao: cc.Label,

		_selectOptType: null,
		_optCard: null, //操作的牌
		_optData: null,
		_isInit: false,
		_operateList: null
	},

	init() {
		this.buttonLayout.children.forEach(btn => {
			btn.on("click", this.onButtonClick, this)
		});
		this.choseCard.getChildByName("btn_close").on("click", this.onButtonClick, this)
		this.btn_out_kou.on("click", this.onButtonClick, this)
	},

	gameInit(data) {
		this.reset()
		this.onGameTurn(data)
	},

	onGameTurn(data) {
		this._optData = data
		this._operateList = data.operateList || []
		this._optCard = data.card;
		// console.log("设置按钮", data, this._operateList)
		this.updateBtn(data.operateArray);
		if (data.plusInfo && data.plusInfo.totalTuo && data.plusInfo.totalMao) {
			this.setTuoAndMao(data.plusInfo)
		}
	},

	/**设置陀和卯 */
	setTuoAndMao(data) {
		if (!data) {
			this.dianLayout.active = false
			return
		}
		this.dianLayout.active = true
		this.txt_tuo.string = `最大陀数：${data.totalTuo}`
		this.txt_mao.string = `最大卯数：${data.totalMao}`
	},

	/**更新按钮 */
	updateBtn(operateArray) {
		if (!operateArray || operateArray.length == 0) {
			this.buttonLayout.active = false
			return
		}
		this.buttonLayout.active = true
		this.btn_chi.active = operateArray.includes(ApiYdr.operateType.CHI)
		this.btn_guo.active = operateArray.includes(ApiYdr.operateType.GUO)
		this.btn_hu.active = operateArray.includes(ApiYdr.operateType.HU)
		this.btn_kou.active = operateArray.includes(ApiYdr.operateType.KOU)
		this.btn_peng.active = operateArray.includes(ApiYdr.operateType.PENG)
		this.btn_qiPai.active = operateArray.includes(ApiYdr.operateType.QIPAI)
		this.btn_sha.active = operateArray.includes(ApiYdr.operateType.SHA)
		this.btn_tu.active = operateArray.includes(ApiYdr.operateType.TUHUO)
	},

	reset() {
		this.buttonLayout.active = false
		this.choseCard.active = false
		this.btn_out_kou.active = YDRModel.getGameStatus() >= ApiYdr.gameStatus.PLAYING
		this._optData = null
		this._operateList = null
		this._optCard = null
		this._selectOptType = null
		this.dianLayout.active = false
	},

	onButtonClick(btn) {
		// console.log("按钮响应===", btn.node.name)
		switch (btn.node.name) {
			case "btn_chi":
				this.showSelectCardView(ApiYdr.operateType.CHI, btn.node)
				break;
			case "btn_peng":
				this.showSelectCardView(ApiYdr.operateType.PENG, btn.node)
				break;
			case "btn_sha":
				this.showSelectCardView(ApiYdr.operateType.SHA, btn.node)
				break;
			case "btn_tu":
				this.showSelectCardView(ApiYdr.operateType.TUHUO, btn.node)
				break;
			case "btn_kou":
			case "btn_out_kou":
				AssetsManager.popDialog({
					content: '是否确定扣牌？',
					ok: () => {
						ApiRoom.gameMessageNotify(ApiYdr.gameOperateNotify(ApiYdr.operateType.KOU));
					},
					no: () => { }
				});
				break;
			case "btn_qiPai":
				// console.log("点击了起牌")
				ApiRoom.gameMessageNotify(ApiYdr.gameOperateNotify(ApiYdr.operateType.QIPAI));
				break;
			case "btn_hu":
				// console.log("点击了胡")
				ApiRoom.gameMessageNotify(ApiYdr.gameOperateNotify(ApiYdr.operateType.HU, this._optCard));
				break;
			case "btn_guo":
				// console.log("点击了过")
				ApiRoom.gameMessageNotify(ApiYdr.gameOperateNotify(ApiYdr.operateType.GUO));
				break;
			case "btn_close":
				this.choseCard.active = false
				break;
			default:
				break;
		}
	},



	/**展示选择界面 */
	showSelectCardView(optType, clickNode) {
		let infoList = this._operateList.filter(p => p.operate == optType)
		if (!infoList || infoList.length == 0) {
			// console.log("没有plus信息", optType)
			return
		}
		let chooseAni = () => {
			this.chooseNode.scale = 0
			this.chooseNode.stopAllActions()
			cc.tween(this.chooseNode).delay(0.05).to(0.1, {
				scale: 1
			}).start()
		}
		if (this._selectOptType === optType) {
			this.choseCard.active = true;
			chooseAni()
			return;
		}
		// console.log("展示的选择界面==", infoList)
		let pos = CCUtil.postionConvert(clickNode, this.choseCard)
		pos.y += 100
		this.chooseNode.setPosition(pos)
		this._selectOptType = optType;
		this.cardContent.removeAllChildren()
		for (let j = 0; j < infoList.length; j++) {
			const info = infoList[j];
			let cardList = info.cardList
			let group = cc.instantiate(this.choseGroup)
			group.getComponent(cc.Layout).spacingY = LAY_COUNT[cardList.length]
			group.parent = this.cardContent
			for (let i = 0; i < cardList.length; i++) {
				const cardId = cardList[i];
				let card = cc.instantiate(this.choseItem)
				let com = card.addComponent(cardCom)
				com.init()
				com.flower = cardId
				// console.log("牌==", cardId)
				card.parent = group
			}
			group.name = j + ""
			group.on("click", this.onItemClick, this)
		}

		this.choseCard.active = true;
		chooseAni()
	},

	/**选中响应 */
	onItemClick(btn) {
		/**发送消息 */
		let idx = parseInt(btn.node.name);
		let infoList = this._operateList.filter(p => p.operate == this._selectOptType)
		let list = infoList[idx].cardList;
		let card = this._optCard
		ApiRoom.gameMessageNotify(ApiYdr.gameOperateNotify(this._selectOptType, card, list));
		this.reset()
	},
});