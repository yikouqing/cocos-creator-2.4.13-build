const FXJModel = require('./FXJModel');
const ApiFxj = require('./ApiFxj');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const singleTile = require("./mj/FXJSingleTile");
const Utils = require('../../../src/utils/Utils');
const FXJLogic = require('./FXJLogic');

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
		this.aniName = 'animation';
		this.node.active = false;
		this.choseCard.active = false
		let myCid = FXJModel.getMyChairID()
		let operateArray = data.operateArrays[myCid];
		if (operateArray == null || FXJModel.getGameStatus() != ApiFxj.gameStatus.PLAYING) {
			this.node.active = false;
		} else {
			if (operateArray.length == 0 || (operateArray.length == 1 && operateArray[0] == ApiFxj.operateType.QI)) {
				this.node.active = false;
			} else {
				this._optCard = data.caozuoCard && data.caozuoCard[myCid]
				this._gangList = data.gangList && data.gangList[myCid]
				this._chiList = data.chiList && data.chiList[myCid]
				this.node.active = true;
				this.updateBtn(operateArray)
			}
		}
		this._ghostList = FXJLogic.getGhostList()
	},

	start() {
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

	/**更新按钮 */
	updateBtn(operateArray) {
		this.node.active = true;
		this._operateArray = operateArray
		let myCid = FXJModel.getMyChairID()
		this.guoButton.active = operateArray[0] !== ApiFxj.operateType.GANG_CHOOSE //选择补杠牌的时候不显示过
		if (this.guoButton.active) this.showOpt(this.guoSpine, 'guo1', false)
		this.pengButton.active = (operateArray.indexOf(ApiFxj.operateType.PENG) != -1);
		if (this.pengButton.active) this.showOpt(this.pengSpine, 'peng1', false)
		this.chiButton.active = (operateArray.indexOf(ApiFxj.operateType.CHI) != -1);
		if (this.chiButton.active) this.showOpt(this.chiSpine, 'chi1', false)
		this.gangButton.active = (operateArray.indexOf(ApiFxj.operateType.GANG_CHI) != -1) || (operateArray.indexOf(ApiFxj.operateType.GANG_BU) != -1) || (operateArray.indexOf(ApiFxj.operateType.GANG_ZHI) != -1);
		if (this.gangButton.active) this.showOpt(this.gangSpine, 'gang1', false)
		this.huButton.active = (operateArray.indexOf(ApiFxj.operateType.HU_CHI) != -1) || (operateArray.indexOf(ApiFxj.operateType.HU_ZHI) != -1) || (operateArray.indexOf(ApiFxj.operateType.HU_QIANG) != -1);
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

			let txt_fan = cc.find("txt_fan", this.huNode).getComponent(cc.Label)
			let handCards = FXJModel.getHandCards(myCid)
			// console.log("手牌==", handCards, this._optCard)
			/**如果是自摸 删掉一张 */
			let iszimo = false
			if (operateArray.indexOf(ApiFxj.operateType.HU_ZHI) != -1) {
				let idx = handCards.indexOf(this._optCard)
				if (idx != -1) {
					handCards.splice(idx, 1)
				}
				iszimo = true
			}
			// console.log("删除之后的手牌", handCards, this._optCard
			let rule = FXJModel.getGameRule()
			/**算番数 */
			let fan = FXJLogic.getCanHu(myCid, handCards, this._optCard, FXJModel.getOptRecord(myCid), rule.playType)
			// console.log(fan)
			if (fan) {
				txt_fan.string = fan.rate + "番"
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
		if (data.plusInfo) {
			this._gangList = data.plusInfo.gangList
			this._chiList = data.plusInfo.chiList
		}
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
			ApiRoom.gameMessageNotify(ApiFxj.gameOperateNotify(null, ApiFxj.operateType.GUO));
			this.node.active = false
		} else if (param == 'peng') {
			ApiRoom.gameMessageNotify(ApiFxj.gameOperateNotify(null, ApiFxj.operateType.PENG));
			this.node.active = false
		} else if (param == 'gang') {
			let gangOperate = null;
			gangOperate = (operateArray.indexOf(ApiFxj.operateType.GANG_CHI) != -1) ? ApiFxj.operateType.GANG_CHI : gangOperate;
			gangOperate = (operateArray.indexOf(ApiFxj.operateType.GANG_BU) != -1) ? ApiFxj.operateType.GANG_BU : gangOperate;
			gangOperate = (operateArray.indexOf(ApiFxj.operateType.GANG_ZHI) != -1) ? ApiFxj.operateType.GANG_ZHI : gangOperate;
			if (gangOperate != null) {
				if (this._gangList && this._gangList.length > 1) {
					this.showSelectCardView(gangOperate)
					return
				}
				let card = null
				let list = this._gangList[0]
				if (operateArray.indexOf(ApiFxj.operateType.GANG_BU) != -1) {
					let array = FXJModel.getPengGangArrayByChairID(FXJModel.getMyChairID())
					for (let i = array.length - 1; i >= 0; --i) {
						if (array[i].operate == ApiFxj.operateType.PENG && list.includes(array[i].card)) {
							gangOperate = ApiFxj.operateType.GANG_BU
							card = array[i].card
							break
						}
					}
				}
				ApiRoom.gameMessageNotify(ApiFxj.gameOperateNotify(card, gangOperate, this._gangList[0]));
				this.node.active = false
			}
		} else if (param == 'hu') {
			let huOperate = null;
			huOperate = (operateArray.indexOf(ApiFxj.operateType.HU_CHI) != -1) ? ApiFxj.operateType.HU_CHI : huOperate;
			huOperate = (operateArray.indexOf(ApiFxj.operateType.HU_ZHI) != -1) ? ApiFxj.operateType.HU_ZHI : huOperate;
			huOperate = (operateArray.indexOf(ApiFxj.operateType.HU_QIANG) != -1) ? ApiFxj.operateType.HU_QIANG : huOperate;
			if (huOperate != null) {
				if (huOperate != ApiFxj.operateType.HU_QIANG) { //只有抢杠胡才传牌数据
					this._optCard = null
				}
				ApiRoom.gameMessageNotify(ApiFxj.gameOperateNotify(this._optCard, huOperate));
			}
			this.node.active = false
		} else if (param === "chi") {
			if (this._chiList && this._chiList.length > 1) {
				this.showSelectCardView(ApiFxj.operateType.CHI)
				return
			}
			ApiRoom.gameMessageNotify(ApiFxj.gameOperateNotify(null, ApiFxj.operateType.CHI, this._chiList[0]));
			this.node.active = false
		} else if (param === "closeChose") {
			this.choseCard.active = false
		}
	},

	/**展示选择界面 */
	showSelectCardView(optType) {
		let list = []
		if (optType === ApiFxj.operateType.CHI) {
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
		if (this._selectOptType === ApiFxj.operateType.CHI) {
			list = this._chiList[idx]
		} else {
			list = this._gangList[idx]
			/**判断是不是补杠 如果是需要改变type*/
			let operateArray = this._operateArray
			if (operateArray.indexOf(ApiFxj.operateType.GANG_BU) != -1) {
				let array = FXJModel.getPengGangArrayByChairID(FXJModel.getMyChairID())
				// console.log("-=-=-", array, list)
				for (let i = array.length - 1; i >= 0; --i) {
					if (array[i].operate == ApiFxj.operateType.PENG && list.includes(array[i].card)) {
						this._selectOptType = ApiFxj.operateType.GANG_BU
						card = array[i].card
						break
					}
				}
			}
		}
		ApiRoom.gameMessageNotify(ApiFxj.gameOperateNotify(card, this._selectOptType, list));
		this.choseCard.active = false
		this.node.active = false
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