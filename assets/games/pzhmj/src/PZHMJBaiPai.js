const PZHMJModel = require('./PZHMJModel');
const PZHMJLogic = require('./PZHMJLogic');
const ApiPzhmj = require('./ApiPzhmj');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');

const defWidth = 1152;

cc.Class({
	extends: cc.Component,
	properties: {
		tingLayout: cc.Node,
		baiLayout: cc.Node,
		item: cc.Node,
		tilePfb: cc.Prefab,
		tingNode: cc.Node,
		baiBg: cc.Node,
		_outTile: null,
		_tingFilter: null,
	},

	start() {
		cc.systemEvent.on("enterBaiPai", this.onEnterBaiPai, this)
	},

	onDestroy() {
		cc.systemEvent.off("enterBaiPai", this.onEnterBaiPai, this)
	},

	onEnterBaiPai(card) {
		this.updateBaiPai(card)
		this.onBaiPai()
	},

	/**更新摆牌信息，传入选择打出的牌 */
	updateBaiPai(card = null) {
		this._outTile = card
		this.node.active = true
		let handCards = PZHMJModel.getHandCards(PZHMJModel.getMyUID());
		this._tingFilter = PZHMJModel.tingFilter(card, handCards);
		let tingList = this.getTingList()
		this.showTingList(tingList)//刷新听牌列表
		let baiPaiList = PZHMJLogic.getMinPaiList(this._tingFilter.cards)
		baiPaiList.sort()
		this.showBaiList(baiPaiList)
		if (PZHMJModel.getGameStatus() == ApiPzhmj.gameStatus.BAOTING) {
			this.onBaiPai()
		}
	},



	/**获取听牌列表 */
	getTingList() {
		if (!this._tingFilter) {
			return []
		}
		let tingFilter = this._tingFilter
		let pgList = PZHMJModel.getPengGangArrayByUID(PZHMJModel.getMyUID())
		let canWinList = PZHMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount, pgList)
		let tingList = canWinList.map(item => item.cardID)
		return tingList
	},

	showTingList(cards) {
		this.tingNode.active = false
		return
		if (cards.length == 0) {
			this.tingNode.active = false
			return
		}
		this.tingNode.active = true;
		this.tingLayout.removeAllChildren();

		for (let i = 0; i < cards.length; i++) {
			const id = cards[i];
			let lie = cc.instantiate(this.tilePfb);
			lie.parent = this.tingLayout;
			let com = lie.addComponent('PZHMJSingleTile');
			com.init();
			com.flower = id
		}
	},

	showBaiList(cards) {
		this.baiLayout.removeAllChildren();

		for (let i = 0; i < cards.length; i++) {
			const id = cards[i];
			let node = cc.instantiate(this.item);
			node.active = true;
			node.parent = this.baiLayout;
			node.y = 0;
			node.name = id + "";
			node.on("click", this.onBtnClicked, this)
			let lie = cc.instantiate(this.tilePfb);
			let com = lie.addComponent('PZHMJSingleTile');
			com.init();
			com.flower = id;
			lie.parent = cc.find("tile", node);
		}
		this.baiLayout.getComponent(cc.Layout).updateLayout()
		let bw = this.baiLayout.width * this.baiLayout.scaleX + 60
		if (bw > defWidth) {
			this.baiBg.width = bw;
		} else {
			this.baiBg.width = defWidth
		}
	},

	getBaiSelectList() {
		return this.baiLayout.children
			.filter(node => {
				let tog = node.getComponent(cc.Toggle);
				return tog && tog.isChecked;
			})
			.map(node => parseInt(node.name));
	},



	onBtnClicked(event) {
		let node = event.node || event.target
		switch (node.name) {
			case "btn_enter":
				this.onBaiPai()
				break;
			case "btn_cancel":
				this.hideNode()
				cc.systemEvent.emit("showOptNodeAgain");
				break;
			default:
				/**根据选择的摆牌，更新听牌 */
				let selectBp = this.getBaiSelectList()
				if (selectBp.length == 0) {
					return
				}
				let canWinList = PZHMJLogic.getTingList(this._tingFilter.cards, 0);
				let huList = PZHMJLogic.getBaiPaiHuCards(this._tingFilter.cards, selectBp)
				let tingList = canWinList.filter(item => {
					return huList.includes(item.cardID)
				}).map(item => item.cardID);
				this.showTingList(tingList)
				break;
		}
	},

	hideNode() {
		this.node.active = false
		PZHMJModel.setIsBaiPai(false)
	},

	/**确定摆牌 */
	onBaiPai() {
		let blist = this.getBaiSelectList()
		// /**检测是否可以提交 */
		// let baiHuList = PZHMJLogic.getBaiPaiHuCards(this._tingFilter.cards, blist)
		// if (!baiHuList || baiHuList.length == 0) {
		// 	AssetsManager.tipDialog("请选择正确的摆牌！")
		// 	return
		// }
		/**发送消息 */
		if (this._outTile) {
			ApiRoom.gameMessageNotify(ApiPzhmj.gameOperateNotify(this._outTile, ApiPzhmj.operateType.TIAOWU, blist));
		} else if (PZHMJModel.getGameStatus() == ApiPzhmj.gameStatus.BAOTING) {
			ApiRoom.gameMessageNotify(ApiPzhmj.gameBaoTingOperateNotify(ApiPzhmj.operateType.TIAOWU, blist));
		}
		PZHMJModel.setIsBaiPai(false)
	},
});