const XZModel = require('./XZModel');
const ApiXz = require('./ApiXz');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const singleTile = require("./mj/XZSingleTile");
const XZLogic = require('./XZLogic');
const Utils = require('../../../src/utils/Utils');

cc.Class({
	extends: cc.Component,
	properties: {
		guoButton: cc.Node,
		pengButton: cc.Node,
		gangButton: cc.Node,
		huButton: cc.Node,
		chiButton: cc.Node,
		choseCard: cc.Node,
		item: cc.Node,
		cardContent: cc.Node,
		huNode: cc.Node,
		guoSpine: sp.Skeleton,
		pengSpine: sp.Skeleton,
		gangSpine: sp.Skeleton,
		huSpine: sp.Skeleton,
		chiSpine: sp.Skeleton,
		tilePfb: cc.Prefab,
		_chiList: null,
		_gangList: null,
		_selectOptType: null,
		_optCard: null, //操作的牌
		_operateArray: [],
		_huCom: null,
	},

	gameInit(data) {
		this.node.active = false;
		this.choseCard.active = false
		let myCid = XZModel.getMyChairID()
		let operateArray = data.operateArrays[myCid];
		if (operateArray == null || XZModel.getGameStatus() != ApiXz.gameStatus.PLAYING) {
			this.node.active = false;
		} else {
			if (operateArray.length == 0 || (operateArray.length == 1 && operateArray[0] == ApiXz.operateType.QI)) {
				this.node.active = false;
			} else {
				this._optCard = data.caozuoCard && data.caozuoCard[myCid]
				this._gangList = data.gangList && data.gangList[myCid]
				this._chiList = data.chiList && data.chiList[myCid]
				this.node.active = true;
				this.updateBtn(operateArray)
			}
		}
		this._ghostList = XZLogic.getGhostList()
	},
	start() {
		// 吃
		this.chiSpine.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == 'chi1') {
				this.showOpt(this.chiSpine, 'chi2', true)
			}
		});
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
		this.node.active = true;
		this._operateArray = operateArray
		let myCid = XZModel.getMyChairID()
		this.guoButton.active = operateArray[0] !== ApiXz.operateType.GANG_CHOOSE //选择补杠牌的时候不显示过
		if (this.guoButton.active) this.showOpt(this.guoSpine, 'guo1', false)

		this.pengButton.active = (operateArray.indexOf(ApiXz.operateType.PENG) != -1);
		if (this.pengButton.active) this.showOpt(this.pengSpine, 'peng1', false)

		this.chiButton.active = (operateArray.indexOf(ApiXz.operateType.CHI) != -1);
		if (this.chiButton.active) this.showOpt(this.chiSpine, 'chi1', false)

		this.gangButton.active = (operateArray.indexOf(ApiXz.operateType.GANG_CHI) != -1) || (operateArray.indexOf(ApiXz.operateType.GANG_BU) != -1) || (operateArray.indexOf(ApiXz.operateType.GANG_ZHI) != -1);
		if (this.gangButton.active) this.showOpt(this.gangSpine, 'gang1', false)

		this.huButton.active = (operateArray.indexOf(ApiXz.operateType.HU_CHI) != -1) || (operateArray.indexOf(ApiXz.operateType.HU_ZHI) != -1) || (operateArray.indexOf(ApiXz.operateType.HU_QIANG) != -1);
		if (this.huButton.active) this.showOpt(this.huSpine, 'hu1', false)

		if (this.huButton.active && this._optCard != null) {
			/**显示胡的哪张牌 */
			this.huNode.active = true

			if (!this._huCom) {
				let tile = cc.find("tile", this.huNode)
				let node = cc.instantiate(this.tilePfb)
				node.parent = tile
				let com = node.addComponent(singleTile)
				com.init()
				com.setNodeShow(true)
				this._huCom = com
			}
			this._huCom.flower = this._optCard
			console.log("设置了胡的牌==", this._huCom.flower)
			let txt_fan = cc.find("txt_fan", this.huNode).getComponent(cc.Label)
			let handCards = XZModel.getHandCards(myCid)
			/**如果是自摸 删掉一张 */
			let iszimo = false
			if (operateArray.indexOf(ApiXz.operateType.HU_ZHI) != -1) {
				let idx = handCards.indexOf(this._optCard)
				if (idx != -1) {
					handCards.splice(idx, 1)
				}
				iszimo = true
			}
			// console.log("删除之后的手牌", handCards, this._optCard)
			/**算番数 */
			let huInfo = XZLogic.getCanHu(myCid, handCards, this._optCard, XZModel.getOptRecord(myCid), XZModel.getBankerChairID())
			if (huInfo.getPlusRateType && Array.isArray(huInfo.getPlusRateType)) {
				huInfo.rate = huInfo.rate || 0
				huInfo.getPlusRateType.forEach(info => {
					huInfo.rate += info.rate
				});
			}
			// console.log(huInfo)
			let maxRate = XZModel.getGameRuleByKey("maxRate")
			if (maxRate && maxRate < huInfo.rate) {
				huInfo.rate = maxRate
			}
			if (huInfo) {
				txt_fan.string = huInfo.rate + "番"
			} else {
				txt_fan.string = ""
			}
		} else this.huNode.active = false
	},

	// card 7
	// chairID 0
	// operateArray(3)[3, 4, 7]
	// plusInfo {
	// 		gangList: Array(1)
	// 	}
	onGameTurn(data) {
		// console.log("11111111111", data)
		if (data.plusInfo) {
			this._gangList = data.plusInfo.gangList
			this._chiList = data.plusInfo.chiList
		}
		this._optCard = data.card
		this.updateBtn(data.operateArray)
	},

	onClearTurn() {
		this.node.active = false;
		this.choseCard.active = false
		this._selectOptType = null
		this._chiList = null
		this._gangList = null
		this._optCard = null
		this._operateArray = null
	},

	onButtonClick(event, param) {
		let operateArray = this._operateArray
		if (param == 'guo') {
			ApiRoom.gameMessageNotify(ApiXz.gameOperateNotify(null, ApiXz.operateType.GUO));
			this.node.active = false
		} else if (param == 'peng') {
			ApiRoom.gameMessageNotify(ApiXz.gameOperateNotify(null, ApiXz.operateType.PENG));
			this.node.active = false
		} else if (param == 'gang') {
			let gangOperate = null;
			gangOperate = (operateArray.indexOf(ApiXz.operateType.GANG_CHI) != -1) ? ApiXz.operateType.GANG_CHI : gangOperate;
			gangOperate = (operateArray.indexOf(ApiXz.operateType.GANG_BU) != -1) ? ApiXz.operateType.GANG_BU : gangOperate;
			gangOperate = (operateArray.indexOf(ApiXz.operateType.GANG_ZHI) != -1) ? ApiXz.operateType.GANG_ZHI : gangOperate;
			if (gangOperate != null) {
				if (this._gangList && this._gangList.length > 1) {
					this.showSelectCardView(gangOperate)
					return
				}
				let card = null
				let list = this._gangList[0]
				if (operateArray.indexOf(ApiXz.operateType.GANG_BU) != -1) {
					let array = XZModel.getPengGangArrayByChairID(XZModel.getMyChairID())
					for (let i = array.length - 1; i >= 0; --i) {
						if (array[i].operate == ApiXz.operateType.PENG && list.includes(array[i].card)) {
							gangOperate = ApiXz.operateType.GANG_BU
							card = array[i].card
							break
						}
					}
				}
				ApiRoom.gameMessageNotify(ApiXz.gameOperateNotify(card, gangOperate, this._gangList[0]));
				this.node.active = false
			}
		} else if (param == 'hu') {
			let huOperate = null;
			huOperate = (operateArray.indexOf(ApiXz.operateType.HU_CHI) != -1) ? ApiXz.operateType.HU_CHI : huOperate;
			huOperate = (operateArray.indexOf(ApiXz.operateType.HU_ZHI) != -1) ? ApiXz.operateType.HU_ZHI : huOperate;
			huOperate = (operateArray.indexOf(ApiXz.operateType.HU_QIANG) != -1) ? ApiXz.operateType.HU_QIANG : huOperate;
			if (huOperate != null) {
				if (huOperate != ApiXz.operateType.HU_QIANG) { //只有抢杠胡才传牌数据
					this._optCard = null
				}
				ApiRoom.gameMessageNotify(ApiXz.gameOperateNotify(this._optCard, huOperate));
			}
			this.node.active = false
		} else if (param === "chi") {
			if (this._chiList && this._chiList.length > 1) {
				this.showSelectCardView(ApiXz.operateType.CHI)
				return
			}
			ApiRoom.gameMessageNotify(ApiXz.gameOperateNotify(null, ApiXz.operateType.CHI, this._chiList[0]));
			this.node.active = false;
		} else if (param === "closeChose") {
			this.choseCard.active = false
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = []
		if (optType === ApiXz.operateType.CHI) {
			list = this._chiList
		} else list = this._gangList
		if (this._selectOptType === optType) {
			this.choseCard.active = true
			return
		}
		this._selectOptType = optType
		this.cardContent.removeAllChildren()

		/**显示所有可以选择的牌 */
		for (let index = 0; index < list.length; index++) {
			const cardList = list[index];
			// console.log("显示的牌=", cardList)
			let cardNode = cc.instantiate(this.item)
			for (let i = 0; i < cardList.length; i++) {
				let cardNum = cardList[i];
				let card = cc.instantiate(this.tilePfb)
				card.parent = cardNode
				let com = card.addComponent(singleTile)
				com.init()
				com.setNodeShow(true)
				com.flower = cardNum
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
		if (this._selectOptType === ApiXz.operateType.CHI) {
			list = this._chiList[idx]
		} else {
			list = this._gangList[idx]
			/**判断是不是补杠 如果是需要改变type*/
			let operateArray = this._operateArray
			if (operateArray.indexOf(ApiXz.operateType.GANG_BU) != -1) {
				let array = XZModel.getPengGangArrayByChairID(XZModel.getMyChairID())
				// console.log("-=-=-", array, list)
				for (let i = array.length - 1; i >= 0; --i) {
					if (array[i].operate == ApiXz.operateType.PENG && list.includes(array[i].card)) {
						this._selectOptType = ApiXz.operateType.GANG_BU
						card = array[i].card
						break
					}
				}
			}
		}
		ApiRoom.gameMessageNotify(ApiXz.gameOperateNotify(card, this._selectOptType, list));
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