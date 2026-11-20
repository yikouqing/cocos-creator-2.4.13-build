const ApiXz = require('./ApiXz');
const XZLogic = require('./XZLogic');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');
const XZModel = require('./XZModel');

cc.Class({
	extends: cc.Component,
	properties: {
		txt_roomId: cc.Label,
		txt_round: cc.Label,
		txt_last: cc.Label,
		mjResultNode: cc.Node,
		pointer: cc.Node,
		operActPfb: cc.Prefab,
		com_clock: require("XZClock"),
		huanPaiNode: cc.Node,

		headPfbLeft: cc.Prefab,
		headPfbRight: cc.Prefab,

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
		_timeOutArr: [],
	},

	onLoad() {
		if (this.node.nodeParams.reviewRecord) {
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			// console.log("回放数据==", this.reviewRecord)
		}
		if (!this.reviewRecord || this.reviewRecord.length == 0) {
			AssetsManager.tipDialog("数据错误")
			this.node.destroy()
			return
		}
		this._ghostList = XZLogic.getGhostList()
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
		this.isShowHuanSanZhang = false
		this.restCardsCount = this.reviewRecord[this.bureau].leftCount
		this.com_huanPai = this.huanPaiNode.getComponent("XZHuanPai")

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
		this.com_huanPai.init(this.chairCount)
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

	onDestroy() {
		this._timeOutArr.forEach(tid => {
			clearTimeout(tid)
		});
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

		for (let i = 0; i < headPos.length; i++) {
			let idx = headPos[i]

			let h = cc.find("head" + idx, this.node)
			let headNode = null
			if (idx == 0 || idx == 3) {
				headNode = cc.instantiate(this.headPfbLeft)
			} else {
				headNode = cc.instantiate(this.headPfbRight)
			}
			headNode.parent = h
			this._userList.push(headNode.getComponent("XZHead"))

			let handTile = cc.find("tiles/handTiles" + idx, this.node)
			let optTile = cc.find("tiles/optTiles" + idx, this.node)
			if (!optTile) {
				optTile = cc.find("optTiles" + idx, handTile)
			}
			let disTile = cc.find("tiles/outTiles" + idx, this.node)
			this._handTileMgrList.push(handTile.getComponent("XZHandTileMgr"))
			this._handTileMgrList[i].init(idx)
			this._optTileMgrList.push(optTile.getComponent("XZOptTileMgr"))
			this._optTileMgrList[i].init(idx)
			this._disTileMgrList.push(disTile.getComponent("XZOutTileMgr"))
			this._disTileMgrList[i].init(idx)

			let opNode = cc.find("operAct" + idx, this.node)
			this._operActNodeList.push(opNode)
		}
	},

	/**检测是否有换三张信息，有就展示换三张动画 */
	showHuanSanZhang() {
		if (this.isShowHuanSanZhang) {
			// console.log("正在播放动画")
			return
		}
		let curInfo = this.reviewRecord[this.bureau]
		if ((curInfo.huanPaiType || curInfo.huanPaiType == 0) &&
			Array.isArray(curInfo.starthuanPaiList) && curInfo.starthuanPaiList.length > 0 &&
			Array.isArray(curInfo.endhuanPaiList) && curInfo.endhuanPaiList.length > 0 &&
			Array.isArray(curInfo.starthandCards) && curInfo.starthandCards.length > 0) {
			this.isShowHuanSanZhang = true
			/**设置初始手牌 */
			let starthandCards = Utils.deepCopy(curInfo.starthandCards)
			for (let i = 0; i < starthandCards.length; ++i) {
				let idx = this.getUserChairIndex(i)
				let arr = starthandCards[i].slice()
				this.sortTiles(arr)
				this._handTileMgrList[idx].updateLieTiles(arr)
			}
			/**设置换牌 和删除过后的手牌*/
			this._timeOutArr[0] = setTimeout(() => {
				let startList = Utils.deepCopy(curInfo.starthuanPaiList)
				for (let i = 0; i < starthandCards.length; ++i) {
					let idx = this.getUserChairIndex(i)
					let handArr = starthandCards[i].slice()
					let startArr = startList[i]
					for (let j = 0; j < startArr.length; j++) {
						const hcard = startArr[j];
						let hidx = handArr.indexOf(hcard)
						if (hidx != -1) {
							handArr.splice(hidx, 1)
						}
					}
					this.sortTiles(handArr)
					this._handTileMgrList[idx].updateLieTiles(handArr)
					this.com_huanPai.setReviewHuanPaiChoose(idx, startArr)
				}
			}, 0.8 * 1000)
			/**播放换牌动画 */
			this._timeOutArr[1] = setTimeout(() => {
				this.com_huanPai.showAni(curInfo.huanPaiType)
			}, 1.5 * 1000)
			let dt = 1.5
			if (curInfo.huanPaiType !== ApiXz.huanPaiType.DUI) {
				dt = 2.7
			}
			this._timeOutArr[2] = setTimeout(() => {
				let endList = Utils.deepCopy(curInfo.endhuanPaiList)
				for (let i = 0; i < endList.length; ++i) {
					let idx = this.getUserChairIndex(i)
					this.com_huanPai.setReviewHuanPaiChoose(idx, endList[i])
				}
			}, dt * 1000)
			/**刷新到换牌后的牌 */
			this._timeOutArr[3] = setTimeout(() => {
				let hand = Utils.deepCopy(curInfo.handCards)
				for (let i = 0; i < hand.length; ++i) {
					let idx = this.getUserChairIndex(i)
					let handArr = hand[i]
					this.sortTiles(handArr)
					this._handTileMgrList[idx].updateLieTiles(handArr)
				}
			}, (dt + 1.5) * 1000)
			this._timeOutArr[4] = setTimeout(() => {
				this.isShowHuanSanZhang = false
			}, (dt + 2.5) * 1000)
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
		// if (this.isShowHuanSanZhang) {
		// 	return
		// }
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
		AssetsManager.clearDialog(['XZResultDialog']);
		MessageCallback.emitMessage("reviewClear")
		this.index = 0;
		this.restCardsCount = this.reviewRecord[this.bureau].leftCount
		this.isShowHuanSanZhang = false
		this.setIndex(this.index);
		this.initHeads();
	},

	nextBureau(event) {
		// if (this.isShowHuanSanZhang) {
		// 	return
		// }
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
			AssetsManager.clearDialog(['XZResultDialog']);
			MessageCallback.emitMessage("reviewClear")
			this.index = 0;
			this.restCardsCount = this.reviewRecord[this.bureau].leftCount
			this.isShowHuanSanZhang = false
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
		if (this.isShowHuanSanZhang) {
			return
		}
		this.tm += dt * this.speed;
		if (this.tm >= 1) {
			this.tm %= 1;
			if (!this.pause) {
				this.nextAct();
			}
		}
	},

	setIndex(index) {

		if (index == 0) {
			this.showHuanSanZhang()
		}
		let data = this.reviewRecord[this.bureau];
		this.txt_round.string = '局数:' + (this.bureau + 1) + '/' + data.maxBureau;
		this.txt_roomId.string = '房号:' + data.roomID;
		if (this.isShowHuanSanZhang) {
			// console.trace("正在播放换三张动画==", this.index)
			this.index = 0
			return
		}


		let pengGangArrays = []; /* 碰杠的牌 */
		let outArrays = []; /* 出的牌 */
		let handArrays = []; /* 手牌 */
		for (let i = 0; i < data.handCards.length; ++i) {
			handArrays.push(data.handCards[i].slice());
			pengGangArrays.push([]);
			outArrays.push([]);
		}

		let lastItem = null;
		let beiQiangChairId = -1;
		for (let i = 0; i < data.operateRecord.length && i <= index; ++i) {
			let item = data.operateRecord[i];
			if (item.operate == ApiXz.operateType.GET) {
				handArrays[item.chairID].push(item.card);
			} else if (item.operate == ApiXz.operateType.QI) {
				// console.log(`位置${item.chairID}出牌${item.card}`)
				handArrays[item.chairID].splice(handArrays[item.chairID].indexOf(item.card), 1);
				outArrays[item.chairID].push(item.card);
			} else if (item.operate == ApiXz.operateType.GANG_ZHI) {
				let gangList = item.plusInfo.cardList
				for (let idx = 0; idx < gangList.length; idx++) {
					const card = gangList[idx];
					handArrays[item.chairID].splice(handArrays[item.chairID].indexOf(card), 1);
				}
				pengGangArrays[item.chairID].push(item);
			} else if (item.operate == ApiXz.operateType.GANG_BU) {
				for (let j = 0; j < pengGangArrays[item.chairID].length; ++j) {
					if (pengGangArrays[item.chairID][j].operate == ApiXz.operateType.PENG && pengGangArrays[item.chairID][j].card == item.card) {
						pengGangArrays[item.chairID].splice(j, 1);
						break;
					}
				}
				handArrays[item.chairID].splice(handArrays[item.chairID].indexOf(item.card), 1);
				pengGangArrays[item.chairID].push(item);
			} else if (item.operate == ApiXz.operateType.GANG_CHI) {
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
			} else if (item.operate == ApiXz.operateType.PENG) {
				for (let j = 0; j < outArrays.length; ++j) {
					if (outArrays[j].length > 0 && outArrays[j][outArrays[j].length - 1] == item.card) {
						outArrays[j].pop();
						break;
					}
				}
				handArrays[item.chairID].splice(handArrays[item.chairID].indexOf(item.card), 1);
				handArrays[item.chairID].splice(handArrays[item.chairID].indexOf(item.card), 1);
				pengGangArrays[item.chairID].push(item);
			} else if (item.operate == ApiXz.operateType.CHI) {
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
			} else if (item.operate == ApiXz.operateType.HU_CHI) {
				let count = 0
				let j = item.chairID
				while (1) {
					j--;
					if (j == item.chairID) {
						break;
					}
					if (j <= 0) {
						j = data.handCards.length - 1
					}
					if (outArrays[j] && outArrays[j].length > 0 && outArrays[j][outArrays[j].length - 1] == item.card) {
						outArrays[j].pop();
						break;
					}
					count++;
					if (count >= 4) {
						break
					}
				}
			} else if (item.operate == ApiXz.operateType.HU_QIANG) {
				let pengOpt = data.operateRecord.find(opt => opt.operate == ApiXz.operateType.PENG && opt.card == item.card)
				if (pengOpt) {
					let delIdx = handArrays[pengOpt.chairID].indexOf(item.card)
					if (delIdx >= 0) {
						handArrays[pengOpt.chairID].splice(delIdx, 1)
						beiQiangChairId = pengOpt.chairID
					}
				}
			}
			lastItem = item;
		}

		let lastOutChairID = null;
		let newCardChairID = null;
		let item = data.operateRecord[index];
		if (item && item.operate == ApiXz.operateType.GET) {
			newCardChairID = item.chairID;
			let pre = data.operateRecord[index - 1];
			if (pre && pre.operate == ApiXz.operateType.QI) {
				lastOutChairID = pre.chairID;
			}
			this.restCardsCount--
		} else if (item && item.operate == ApiXz.operateType.QI) {
			lastOutChairID = item.chairID;
		}

		for (let i = 0; i < data.handCards.length; ++i) {
			if (!item || item && item.chairID !== i && index !== 0) {
				continue;
			}
			let idx = this.getUserChairIndex(i)
			let queType = data.queType[i]
			let handArr = handArrays[i]
			let card = item.card
			if (newCardChairID == i) {
				card = handArr.pop();
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: XZModel.getBundleType()
				});
			} else {
				if (item && (item.operate == ApiXz.operateType.HU_CHI || item.operate == ApiXz.operateType.HU_QIANG || item.operate == ApiXz.operateType.HU_ZHI)) {
					if (item.operate == ApiXz.operateType.HU_ZHI) {
						let huIdx = handArr.indexOf(item.card)
						if (huIdx != -1) {
							handArr.splice(huIdx, 1)
						}
					}
				} else card = null
			}
			this.sortTiles(handArr, queType)
			this._handTileMgrList[idx].updateLieTiles(handArr, card)

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
						bundle: XZModel.getBundleType()
					});
					AssetsManager.playEffect({
						path: 'res/audio/main/push',
						bundle: XZModel.getBundleType()
					});
				}
			}

			let arr = pengGangArrays[i]
			this._optTileMgrList[idx].updateOptTiles(arr)

			for (let j = 0; j < pengGangArrays[i].length; ++j) {
				let opeItem = pengGangArrays[i][j];
				if (opeItem.operate == ApiXz.operateType.PENG) {
					if (opeItem == data.operateRecord[index]) {
						this.showAni(1, opeItem)
					}
				} else if (opeItem.operate == ApiXz.operateType.CHI) {
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
			if (ApiXz.operateType.HU_ZHI == item.operate) {
				this.showAni(4, item)
			} else if (ApiXz.operateType.HU_CHI == item.operate || ApiXz.operateType.HU_QIANG == item.operate) {
				this.showAni(3, item)
			}
		}

		if (lastItem && lastItem.operate == ApiXz.operateType.HU_QIANG && beiQiangChairId != -1) {
			/**刷新被抢的人手牌 */
			let queType = data.queType[beiQiangChairId]
			let handArr = handArrays[beiQiangChairId]
			this.sortTiles(handArr, queType)
			let idx = this.getUserChairIndex(beiQiangChairId)
			this._handTileMgrList[idx].updateLieTiles(handArr, null)
		}

		if (index == data.operateRecord.length + 1) {
			/* 显示结算界面 */
			// console.log("显示结算界面")
			let msg = {
				path: "res/prefab/XZResultDialog",
				bundle: XZModel.getBundleType(),
				result: data.result,
				parent: this.mjResultNode,
				isReview: true,
			}
			AssetsManager.createDialog(msg)
		} else {
			AssetsManager.clearDialog(['XZResultDialog']);
		}
	},

	/**手牌排序 */
	sortTiles(tileIdList, dtype) {
		if (tileIdList && tileIdList.length > 0) {
			tileIdList.sort((a, b) => a - b)
			/**找出癞子和定缺的牌*/
			let laizi = []
			let dingque = []
			let glist = XZLogic.getGhostList()
			for (let i = 0; i < tileIdList.length; i++) {
				const t = tileIdList[i];
				let isDel = false
				if (glist.includes(t)) {
					laizi.push(t)
					isDel = true
				} else if (dtype !== -1) {
					if (dtype == XZLogic.getCardColor(t)) {
						dingque.push(t)
						isDel = true
					}
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
			/**定缺放后面 */
			if (dingque.length > 0) {
				dingque.forEach(t => {
					tileIdList.push(t)
				})
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
			c.setDingque()
		});
		this._operActNodeList.forEach(n => {
			n.removeAllChildren()
		})
		this._timeOutArr.forEach(tid => {
			clearTimeout(tid)
		});
		this._timeOutArr.length = 0
		this.com_huanPai.reset()
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
				bundle: XZModel.getBundleType()
			});
		}
		let idx = this.getUserChairIndex(data.chairID)
		/**展示动画 */
		let optNode = cc.instantiate(this.operActPfb);
		optNode.parent = this._operActNodeList[idx]
		let com = optNode.getComponent('XZOperAct')
		com.showOpt(type)
		/**展示刮风和下雨 */
		if (type == 2) {
			let t = 5
			if (data.operate === ApiXz.operateType.GANG_ZHI) {
				t = 7 //下雨
			}
			let fengNode = cc.instantiate(this.operActPfb)
			fengNode.parent = this.node
			let fcom = fengNode.getComponent("XZOperAct")
			// console.log("展示刮风下雨", t, data.operate)
			fcom.showOpt(t)
		} else {
			optNode.scale = 0.8
		}
		if (type >= 3) {
			this.showHuIdx(data)
		}
	},

	/**展示胡牌序列 */
	showHuIdx(data) {
		let idx = this.getUserChairIndex(data.chairID)
		if (typeof (idx) == "number") {
			let optNode = cc.instantiate(this.operActPfb)
			optNode.parent = this._operActNodeList[idx]
			let com = optNode.getComponent('XZOperAct')
			com.showHuIndex(data.operate, data.plusInfo.huSequence, data.chairID, true)
		}
	},


	initHeads() {
		let data = this.reviewRecord[this.bureau];
		let userArr = data.userArray

		for (let i = 0; i < userArr.length; i++) {
			const user = userArr[i];
			let idx = this.getUserChairIndex(i)
			let com = this._userList[idx]
			com.initReview(user)
			if (data.queType && data.queType.length > 0) {
				let q = data.queType[i]
				if (q != -1) {
					com.setDingque(q)
				}
			}
		}
	},

	onClose() {
		this.node.destroy()
	},

	getNullNode() {
		let node = new cc.Node();
		node.width = 20;
		return node;
	},

	getArrayItemCount(item, array) {
		let count = 0;
		if (array && array.length > 0) {
			for (let i = 0; i < array.length; ++i) {
				if (array[i] == item) {
					++count;
				}
			}
		}
		return count;
	},

	/**座位号转换 */
	getUserChairIndex(chairID) {
		return (chairID - this.myChairId + this.chairCount) % this.chairCount;
	}
});