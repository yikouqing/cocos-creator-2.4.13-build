const HZModel = require('./HZModel');
const ApiHz = require('./ApiHz');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const singleTile = require("./mj/HZSingleTile");
const Utils = require('../../../src/utils/Utils');
const HZLogic = require('./HZLogic');

cc.Class({
	extends: cc.Component,
	properties: {
		guoButton: cc.Node,
		guoSpine: sp.Skeleton,
		pengButton: cc.Node,
		pengSpine: sp.Skeleton,
		gangButton: cc.Node,
		gangSpine: sp.Skeleton,
		huButton: cc.Node,
		huSpine: sp.Skeleton,
		chiButton: cc.Node,
		chiSpine: sp.Skeleton,
		choseCard: cc.Node,
		item: cc.Node,
		cardContent: cc.Node,
		huNode: cc.Node,
		_chiList: null,
		_gangList: null,
		_selectOptType: null,
		_optCard: null, //操作的牌
		_operateArray: [],
	},

	gameInit(data) {
		this.node.active = false;
		this.choseCard.active = false
		let myCid = HZModel.getMyChairID()
		let operateArray = data.operateArrays[myCid];
		if (operateArray == null || HZModel.getGameStatus() != ApiHz.gameStatus.PLAYING) {
			this.node.active = false;
		} else {
			if (operateArray.length == 0 || (operateArray.length == 1 && operateArray[0] == ApiHz.operateType.QI)) {
				this.node.active = false;
			} else {
				this._optCard = data.caozuoCard && data.caozuoCard[myCid]
				this._gangList = data.gangList && data.gangList[myCid]
				this._chiList = data.chiList && data.chiList[myCid]
				this.node.active = true;
				this.updateBtn(operateArray)
			}
		}
		this._ghostList = HZLogic.getGhostList()
	},
	start() {
		this.guoSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'guo1') {
				this.showOpt(this.guoSpine, 'guo2', true)
			}

		});
		this.pengSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'peng1') {
				this.showOpt(this.pengSpine, 'peng2', true)
			}
		});
		this.chiSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'chi1') {
				this.showOpt(this.chiSpine, 'chi2', true)
			}
		});
		this.gangSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'gang1') {
				this.showOpt(this.gangSpine, 'gang2', true)
			}
		});
		this.huSpine.setCompleteListener((trackEntry, loopCount) => {

			if (trackEntry.animation.name == 'hu1') {
				this.showOpt(this.huSpine, 'hu2', true)
			}
		});
	},


	/**更新按钮 */
	updateBtn(operateArray) {
		this.node.active = true;
		this._operateArray = operateArray
		let myCid = HZModel.getMyChairID()
		this.guoButton.active = operateArray[0] !== ApiHz.operateType.GANG_CHOOSE //选择补杠牌的时候不显示过
		if (this.guoButton.active) this.showOpt(this.guoSpine, 'guo1', false)
		this.pengButton.active = (operateArray.indexOf(ApiHz.operateType.PENG) != -1);
		if (this.pengButton.active) this.showOpt(this.pengSpine, 'peng1', false)

		// this.chiButton.active = (operateArray.indexOf(ApiHz.operateType.CHI) != -1);
		// if (this.chiButton.active) this.showOpt(this.chiSpine, 'chi1', false)

		this.gangButton.active = (operateArray.indexOf(ApiHz.operateType.GANG_CHI) != -1) || (operateArray.indexOf(ApiHz.operateType.GANG_BU) != -1) || (operateArray.indexOf(ApiHz.operateType.GANG_ZHI) != -1);
		if (this.gangButton.active) this.showOpt(this.gangSpine, 'gang1', false)

		this.huButton.active = (operateArray.indexOf(ApiHz.operateType.HU_CHI) != -1) || (operateArray.indexOf(ApiHz.operateType.HU_ZHI) != -1) || (operateArray.indexOf(ApiHz.operateType.HU_QIANG) != -1);
		if (this.huButton.active) this.showOpt(this.huSpine, 'hu1', false)

		if (this.huButton.active && this._optCard != null) {
			/**显示胡的哪张牌 */
			this.huNode.active = true

			let tile = cc.find("tile", this.huNode)
			let com = tile.getComponent(singleTile)
			if (!com) {
				com = tile.addComponent(singleTile)
				com.init()
				com.setNodeShow(true)
			}
			com.flower = this._optCard
		} else this.huNode.active = false
	},

	// card 7
	// chairID 0
	// operateArray(3)[3, 4, 7]
	onGameTurn(data) {
		this._optCard = data.card
		this.updateBtn(data.operateArray)
	},

	onUserOpt(data) {
		this.node.active = false;
		this.choseCard.active = false
		this._selectOptType = null
		this._chiList = null
		this._gangList = null
		this._optCard = null
	},

	onButtonClick(event, param) {
		let operateArray = this._operateArray
		if (param == 'guo') {
			ApiRoom.gameMessageNotify(ApiHz.gameOperateNotify(null, ApiHz.operateType.GUO));
			this.node.active = false
		} else if (param == 'peng') {
			ApiRoom.gameMessageNotify(ApiHz.gameOperateNotify(null, ApiHz.operateType.PENG));
			this.node.active = false
		} else if (param == 'gang') {
			let gangOperate = null;
			gangOperate = (operateArray.indexOf(ApiHz.operateType.GANG_CHI) != -1) ? ApiHz.operateType.GANG_CHI : gangOperate;
			gangOperate = (operateArray.indexOf(ApiHz.operateType.GANG_BU) != -1) ? ApiHz.operateType.GANG_BU : gangOperate;
			gangOperate = (operateArray.indexOf(ApiHz.operateType.GANG_ZHI) != -1) ? ApiHz.operateType.GANG_ZHI : gangOperate;
			if (gangOperate != null) {
				ApiRoom.gameMessageNotify(ApiHz.gameOperateNotify(null, gangOperate));
				this.node.active = false
			}
		} else if (param == 'hu') {
			let huOperate = null;
			huOperate = (operateArray.indexOf(ApiHz.operateType.HU_CHI) != -1) ? ApiHz.operateType.HU_CHI : huOperate;
			huOperate = (operateArray.indexOf(ApiHz.operateType.HU_ZHI) != -1) ? ApiHz.operateType.HU_ZHI : huOperate;
			huOperate = (operateArray.indexOf(ApiHz.operateType.HU_QIANG) != -1) ? ApiHz.operateType.HU_QIANG : huOperate;
			if (huOperate != null) {
				ApiRoom.gameMessageNotify(ApiHz.gameOperateNotify(null, huOperate));
			}
			this.node.active = false
		} else if (param === "chi") {
			// if (this._chiList && this._chiList.length > 1) {
			// 	this.showSelectCardView(ApiHz.operateType.CHI)
			// 	return
			// }
			// ApiRoom.gameMessageNotify( ApiHz.gameOperateNotify(null, ApiHz.operateType.CHI, this._chiList[0]));
			// this.node.active = false
		} else if (param === "closeChose") {
			this.choseCard.active = false
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = []
		if (optType === ApiHz.operateType.CHI) {
			list = this._chiList
		} else list = this._gangList
		if (this._selectOptType === optType) {
			this.choseCard.active = true
			return
		}
		this._selectOptType = optType
		let ghostList = this._ghostList
		// console.log("鬼牌列表=", ghostList)
		this.cardContent.removeAllChildren()

		/**显示所有可以选择的牌 */
		for (let index = 0; index < list.length; index++) {
			const cardList = list[index];
			// console.log("显示的牌=", cardList)
			let cardNode = cc.instantiate(this.item)
			for (let i = 0; i < cardList.length; i++) {
				let cardNum = cardList[i];
				let card = cc.find("card" + i, cardNode)
				let com = card.getComponent(singleTile)
				if (!com) {
					com = card.addComponent(singleTile)
					com.init()
					com.setNodeShow(true)
				}
				com.flower = cardNum
				card.active = true
				// console.log("pai=", cardNum)
				if (ghostList.indexOf(cardNum) !== -1) { //显示鬼牌标志
					com.setGhostIcon(true)
				}
			}
			cardNode.name = index + ""
			cardNode.on("click", this.onItemClick, this)
			cardNode.active = true
			cardNode.parent = this.cardContent
		}
		this.choseCard.active = true;
	},

	/**选中响应 */
	onItemClick(btn) {
		/**发送消息 */
		let idx = parseInt(btn.node.name)
		let list = []
		let card = null //只有补杠的情况才传值
		if (this._selectOptType === ApiHz.operateType.CHI) {
			list = this._chiList[idx]
		} else {
			list = this._gangList[idx]
			/**判断是不是补杠 如果是需要改变type*/
			let operateArray = this._operateArray
			if (operateArray.indexOf(ApiHz.operateType.GANG_BU) != -1) {
				let array = HZModel.getPengGangArrayByChairID(HZModel.getMyChairID())
				// console.log("-=-=-", array, list)
				for (let i = array.length - 1; i >= 0; --i) {
					if (array[i].operate == ApiHz.operateType.PENG && list.includes(array[i].card)) {
						this._selectOptType = ApiHz.operateType.GANG_BU
						card = array[i].card
						break
					}
				}
			}
		}
		ApiRoom.gameMessageNotify(ApiHz.gameOperateNotify(card, this._selectOptType, list));
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
});