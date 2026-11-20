const ApiFxj = require('./ApiFxj');
const FXJLogic = require('./FXJLogic');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');

cc.Class({
	extends: cc.Component,
	properties: {
		txt_roomId: cc.Label,
		txt_round: cc.Label,
		txt_last: cc.Label,
		mjResultNode: cc.Node,
		pointer: cc.Node,
		operActPfb: cc.Prefab,
		com_clock: require("FXJClock"),
		com_bugang: require("FXJBugang"),

		/**用户脚本列表 下标为本地座位号*/
		_userList: [],
		/**手牌脚本列表 */
		_handTileMgrList: [],
		/**操作牌脚本列表 */
		_optTileMgrList: [],
		/**打出牌脚本列表 */
		_disTileMgrList: [],
		/**动画节点 */
		_operActNodeList: [],
	},

	onLoad() {
		if (this.node.nodeParams.reviewRecord) {
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			// console.log("回放数据==", this.reviewRecord)
		}

		this._ghostList = FXJLogic.getGhostList(this.reviewRecord[0].playType)
		// console.log("回放时候的癞子牌", this._ghostList)
		let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
		if (lastItem && !lastItem.result) {
			this.reviewRecord.pop();
		}
		this.tm = 0;
		this.bureau = 0;
		this.speed = 1;
		this.index = 0;
		this.pause = false;
		this.myUid = UserModel.getData('uid');
		this.restCardsCount = this.reviewRecord[this.bureau].leftCount

		let userArr = this.reviewRecord[this.bureau].userArray
		this.chairCount = userArr.length
		this.myChairId = 0
		for (let i = 0; i < userArr.length; i++) {
			const u = userArr[i];
			if (u.uid == this.myUid) {
				this.myChairId = i
				break;
			}
		}
		this.com_clock.gameInit(this.chairCount, this.myChairId)
		this.com_bugang.initRes()
		this.com_bugang.node.active = false
		this.checkHeadPos()
		this.updatePointer()
		this.initHeads();
		this.setIndex(this.index);
		let node = cc.find('Buttons', this.node);
		node.opacity = 125;
		node.runAction(cc.repeatForever(cc.sequence([
			cc.fadeTo(2, 0),
			cc.fadeTo(2, 125)
		])));
	},

	/**判断人数，初始化头像位置 */
	checkHeadPos() {
		let chairCount = this.chairCount
		let headPos = [0, 1, 2, 3]
		if (chairCount == 2) {
			headPos = [0, 2]
		} else if (chairCount == 3) {
			headPos = [0, 1, 3]
		}
		this._userList.length = 0
		this._handTileMgrList.length = 0
		this._optTileMgrList.length = 0
		this._disTileMgrList.length = 0
		this._operActNodeList.length = 0
		for (let i = 0; i < 4; i++) {
			let h = cc.find("head" + i, this.node)
			h.active = false
		}
		for (let i = 0; i < headPos.length; i++) {
			let h = cc.find("head" + headPos[i], this.node)
			this._userList.push(h.getComponent("FXJHead"))

			let handTile = cc.find("tiles/handTiles" + headPos[i], this.node)
			let optTile = cc.find("tiles/optTiles" + headPos[i], this.node)
			if (!optTile) {
				optTile = cc.find("optTiles" + headPos[i], handTile)
			}
			let disTile = cc.find("tiles/outTiles" + headPos[i], this.node)
			this._handTileMgrList.push(handTile.getComponent("FXJHandTileMgr"))
			this._handTileMgrList[i].init(headPos[i], this._ghostList)
			this._optTileMgrList.push(optTile.getComponent("FXJOptTileMgr"))
			this._optTileMgrList[i].init(headPos[i], this._ghostList)
			this._disTileMgrList.push(disTile.getComponent("FXJOutTileMgr"))
			this._disTileMgrList[i].init(headPos[i], this._ghostList)

			let opNode = cc.find("operAct" + headPos[i], this.node)
			this._operActNodeList.push(opNode)
		}
	},


	showButtons() {
		this.unscheduleAllCallbacks();
		let node = cc.find('Buttons', this.node);
		node.stopAllActions();
		node.opacity = 255;
		this.scheduleOnce(() => {
			node.runAction(cc.repeatForever(cc.sequence([
				cc.fadeTo(2, 0),
				cc.fadeTo(2, 125)
			])));
		}, 2);
	},

	preAct(event) {
		if (event) {

			this.showButtons();
		}
		let curIndex = this.index;
		--this.index;
		if (this.index < 0) {
			this.index = 0;
		}
		if (curIndex != this.index) {
			this.setIndex(this.index);
		}
	},

	nextAct(event) {
		if (event) {

			this.showButtons();
		}
		let curIndex = this.index;
		++this.index;
		let data = this.reviewRecord[this.bureau];
		if (this.index > data.operateRecord.length + 1) {
			this.index = data.operateRecord.length + 1;
		}
		if (curIndex != this.index) {
			this.setIndex(this.index);
		}
	},

	preBureau(event) {
		if (event) {

			this.showButtons();
		}
		let curBureau = this.bureau;
		--this.bureau;
		if (this.bureau < 0) {
			this.bureau = 0;
		}
		if (this.bureau == curBureau) {
			return;
		}
		this.resetTable()
		AssetsManager.clearDialog(['FXJResultDialog']);
		MessageCallback.emitMessage("reviewClear")
		this.index = 0;
		this.restCardsCount = this.reviewRecord[this.bureau].leftCount
		this.setIndex(this.index);
		this.initHeads();
	},

	nextBureau(event) {
		if (event) {

			this.showButtons();
		}
		++this.bureau;
		let reviewRecord = this.reviewRecord;
		if (!reviewRecord[this.bureau]) {
			AssetsManager.tipDialog(`暂时没有第${this.bureau + 1}的数据`);
			--this.bureau;
			return;
		} else {
			this.resetTable()
			AssetsManager.clearDialog(['FXJResultDialog']);
			MessageCallback.emitMessage("reviewClear")
			this.index = 0;
			this.restCardsCount = this.reviewRecord[this.bureau].leftCount
			this.setIndex(this.index);
		}
		this.initHeads();
	},

	onPause(event) {
		if (event) {

			this.showButtons();
		}
		this.pause = !this.pause;
		if (this.pause) {
			/* this.pauseLabel.string = '继续'; */
		} else {
			/* this.pauseLabel.string = '暂停'; */
		}
	},

	speedUp(event) {
		if (event) {

			this.showButtons();
		}
		this.speed *= 2;
		if (this.speed > 8) {
			this.speed = 8;
		}
	},

	speedDown(event) {
		if (event) {

			this.showButtons();
		}
		this.speed /= 2;
		if (this.speed < 1 / 8) {
			this.speed = 1 / 8;
		}
	},

	speedNormal(event) {
		if (event) {

			this.showButtons();
		}
		this.speed = 1;
	},

	update(dt) {
		this.tm += dt * this.speed;
		if (this.tm >= 1) {
			this.tm %= 1;
			if (!this.pause) {
				this.nextAct();
			}
		}
	},

	setIndex(index) {
		let data = this.reviewRecord[this.bureau];
		this.txt_round.string = '局数:' + (this.bureau + 1) + '/' + data.maxBureau;
		this.txt_roomId.string = '房号:' + data.roomID;
		let pengGangArrays = []; /* 碰杠的牌 */
		let outArrays = []; /* 出的牌 */
		let handArrays = []; /* 手牌 */
		for (let i = 0; i < data.handCards.length; ++i) {
			handArrays.push(data.handCards[i].slice());
			pengGangArrays.push([]);
			outArrays.push([]);
		}

		let bugangInfo = null;
		for (let i = 0; i < data.operateRecord.length && i <= index; ++i) {
			let item = data.operateRecord[i];
			if (item.operate == ApiFxj.operateType.GET) {
				handArrays[item.chairID].push(item.card);
			} else if (item.operate == ApiFxj.operateType.QI) {
				// console.log(`位置${item.chairID}出牌${item.card}`)
				handArrays[item.chairID].splice(handArrays[item.chairID].indexOf(item.card), 1);
				outArrays[item.chairID].push(item.card);
			} else if (item.operate == ApiFxj.operateType.GANG_ZHI) {
				let gangList = item.plusInfo.cardList
				for (let idx = 0; idx < gangList.length; idx++) {
					const card = gangList[idx];
					handArrays[item.chairID].splice(handArrays[item.chairID].indexOf(card), 1);
				}
				pengGangArrays[item.chairID].push(item);
			} else if (item.operate == ApiFxj.operateType.GANG_BU) {
				for (let j = 0; j < pengGangArrays[item.chairID].length; ++j) {
					if (pengGangArrays[item.chairID][j].operate == ApiFxj.operateType.PENG && pengGangArrays[item.chairID][j].card == item.card) {
						pengGangArrays[item.chairID].splice(j, 1);
						break;
					}
				}
				handArrays[item.chairID].splice(handArrays[item.chairID].indexOf(item.card), 1);
				pengGangArrays[item.chairID].push(item);
			} else if (item.operate == ApiFxj.operateType.GANG_CHI) {
				for (let j = 0; j < outArrays.length; ++j) {
					if (outArrays[j].length > 0 && outArrays[j][outArrays[j].length - 1] == item.card) {
						outArrays[j].pop();
						break;
					}
				}
				let gangList = item.plusInfo.cardList.slice()
				gangList.splice(gangList.indexOf(item.card), 1)
				for (let idx = 0; idx < gangList.length; idx++) {
					const card = gangList[idx];
					handArrays[item.chairID].splice(handArrays[item.chairID].indexOf(card), 1);
				}

				pengGangArrays[item.chairID].push(item);
			} else if (item.operate == ApiFxj.operateType.PENG) {
				for (let j = 0; j < outArrays.length; ++j) {
					if (outArrays[j].length > 0 && outArrays[j][outArrays[j].length - 1] == item.card) {
						outArrays[j].pop();
						break;
					}
				}
				handArrays[item.chairID].splice(handArrays[item.chairID].indexOf(item.card), 1);
				handArrays[item.chairID].splice(handArrays[item.chairID].indexOf(item.card), 1);
				pengGangArrays[item.chairID].push(item);
			} else if (item.operate == ApiFxj.operateType.CHI) {
				let handCards = handArrays[item.chairID]
				for (let j = 0; j < outArrays.length; ++j) {
					if (outArrays[j].length > 0 && outArrays[j][outArrays[j].length - 1] == item.card) {
						outArrays[j].pop();
						break;
					}
				}
				let list = item.plusInfo.cardList.slice()
				list.splice(list.indexOf(item.card), 1)
				for (let i = 0; i < list.length; i++) {
					let idx = handCards.indexOf(list[i])
					handCards.splice(idx, 1)
				}
				pengGangArrays[item.chairID].push(item)
			} else if (item.operate == ApiFxj.operateType.GANG_CHOOSE) {
				bugangInfo = item;
			}
		}

		/**刷新补杠牌 */
		if (bugangInfo) {
			let cardList = bugangInfo.plusInfo.buGangCards
			this.com_bugang.node.active = true
			this.com_bugang.showBugangCard(cardList, this._ghostList)
		}

		let lastOutChairID = null;
		let newCardChairID = null;
		let item = data.operateRecord[index];
		if (item && item.operate == ApiFxj.operateType.GET) {
			newCardChairID = item.chairID;
			let pre = data.operateRecord[index - 1];
			if (pre && pre.operate == ApiFxj.operateType.QI) {
				lastOutChairID = pre.chairID;
			}
			this.restCardsCount--
		} else if (item && item.operate == ApiFxj.operateType.QI) {
			lastOutChairID = item.chairID;
		}

		for (let i = 0; i < data.handCards.length; ++i) {
			if (item && item.chairID !== i && index !== 0) {
				continue;
			}
			let idx = this.getUserChairIndex(i)
			let handArr = handArrays[i]
			if (newCardChairID == i) {
				let card = handArr.pop();
				// console.log(`位置${i}摸牌==`, card, handArr)
				this.sortTiles(handArr)
				this._handTileMgrList[idx].updateLieTiles(handArr, card)
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: Enums.bundleType.FXJ
				});
			} else {
				this.sortTiles(handArr)
				// console.log(`位置${i}刷新牌==`, handArr)
				if (item && (item.operate == ApiFxj.operateType.HU_CHI || item.operate == ApiFxj.operateType.HU_QIANG || item.operate == ApiFxj.operateType.HU_ZHI)) {
					if (item.operate == ApiFxj.operateType.HU_ZHI) {
						let huIdx = handArr.indexOf(item.card)
						if (huIdx != -1) {
							handArr.splice(huIdx, 1)
						}
					}
					this._handTileMgrList[idx].updateLieTiles(handArr, item.card)
				} else
					this._handTileMgrList[idx].updateLieTiles(handArr)
			}
			let discom = this._disTileMgrList[idx]
			discom.reset()
			let lastCom = discom.showOutTiles(outArrays[i])
			for (let j = 0; j < outArrays[i].length; ++j) {
				if (i == lastOutChairID && j == (outArrays[i].length - 1) && item && item.card == outArrays[i][j]) {
					if (lastCom) {
						this.updatePointer(lastCom.node)
					}
					AssetsManager.playEffect({
						path: 'res/audio/nv/' + outArrays[i][j],
						bundle: Enums.bundleType.FXJ
					});
					AssetsManager.playEffect({
						path: 'res/audio/main/push',
						bundle: Enums.bundleType.FXJ
					});
				}
			}

			let arr = pengGangArrays[i]
			this._optTileMgrList[idx].updateOptTiles(arr)

			for (let j = 0; j < pengGangArrays[i].length; ++j) {
				let opeItem = pengGangArrays[i][j];
				if (opeItem.operate == ApiFxj.operateType.PENG) {
					if (opeItem == data.operateRecord[index]) {
						this.showAni(1, opeItem)
					}
				} else if (opeItem.operate == ApiFxj.operateType.CHI) {
					if (opeItem == data.operateRecord[index]) {
						this.showAni(0, opeItem)
					}
				} else {
					if (opeItem == data.operateRecord[index]) {
						this.showAni(2, opeItem)
					}
				}
			}
		}
		if (item) {
			let idx = this.getUserChairIndex(item.chairID)
			this.com_clock.setDir(idx)
			this.txt_last.string = `剩:${this.restCardsCount}张`
			if (ApiFxj.operateType.HU_ZHI == item.operate) {
				this.showAni(4, item)
			} else if (ApiFxj.operateType.HU_CHI == item.operate || ApiFxj.operateType.HU_QIANG == item.operate) {
				this.showAni(3, item)
			}
		}

		if (index == data.operateRecord.length + 1) {
			/* 显示结算界面 */
			// console.log("显示结算界面")
			let msg = {
				path: "res/prefab/FXJResultDialog",
				bundle: Enums.bundleType.FXJ,
				result: data.result,
				parent: this.mjResultNode,
				ghostList: this._ghostList,
				isReview: true,
			}
			AssetsManager.createDialog(msg)
		} else {
			AssetsManager.clearDialog(['FXJResultDialog']);
		}
	},

	/**手牌排序 */
	sortTiles(tileIdList) {
		if (tileIdList && tileIdList.length > 0) {
			tileIdList.sort((a, b) => a - b)
			/**找出癞子和定缺的牌*/
			let laizi = []
			let glist = this._ghostList
			for (let i = 0; i < tileIdList.length; i++) {
				const t = tileIdList[i];
				let isDel = false
				if (glist.includes(t)) {
					laizi.push(t)
					isDel = true
				}
				if (isDel) {
					tileIdList.splice(i, 1)
					i--
				}
			}

			/**癞子放前面 */
			if (laizi.length > 0) {
				laizi.forEach(t => {
					tileIdList.unshift(t)
				});
			}
		}
	},

	/**清除桌面上所有牌 */
	resetTable() {
		this._handTileMgrList.forEach(c => {
			c.reset()
		});
		this._disTileMgrList.forEach(c => {
			c.reset()
		});
		this._optTileMgrList.forEach(c => {
			c.reset()
		});
		this._userList.forEach(c => {
			c.setBanker(false)
			c.setLight(false)
		});
		this._operActNodeList.forEach(n => {
			n.removeAllChildren()
		})

		this.com_clock.setDir(-1)
		this.com_clock.setTick(0)
		this.updatePointer()
	},

	/**更新指示器位置*/
	updatePointer(lastTile) {
		if (!cc.isValid(lastTile)) {
			this.pointer.active = false
			return
		}
		this.scheduleOnce(() => {
			const pos = CCUtil.postionConvert(lastTile, this.node)
			this.pointer.setPosition(pos)
			this.pointer.active = true
		})
	},

	/**展示动画和声音 */
	showAni(type, data) {
		let typeNameList = ["chi", "peng", "gang", "hu", "zimo"]
		/**声音 */
		if (type < typeNameList.length) {
			AssetsManager.playEffect({
				path: `res/audio/nv/${typeNameList[type]}`,
				bundle: Enums.bundleType.FXJ
			});
		}
		let idx = this.getUserChairIndex(data.chairID)
		/**展示动画 */
		let optNode = cc.instantiate(this.operActPfb);
		optNode.parent = this._operActNodeList[idx]
		let com = optNode.getComponent('FXJOperAct')
		com.showOpt(type)
		optNode.scale = 0.8
	},


	initHeads() {
		let data = this.reviewRecord[this.bureau];
		let userArr = data.userArray
		for (let i = 0; i < userArr.length; i++) {
			const user = userArr[i];
			let idx = this.getUserChairIndex(i)
			let com = this._userList[idx]
			com.initReview(user)
		}
	},

	onClose() {
		this.node.destroy()
	},

	/**座位号转换 */
	getUserChairIndex(chairID) {
		return (chairID - this.myChairId + this.chairCount) % this.chairCount;
	}
});