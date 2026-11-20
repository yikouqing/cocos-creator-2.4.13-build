const ApiLsmj = require('./ApiLsmj');
const LSMJLogic = require('./LSMJLogic');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');
const LSMJModel = require('./LSMJModel');

cc.Class({
	extends: cc.Component,
	properties: {
		com_clock: require("LSMJClock"),
		txt_roomId: cc.Label,
		txt_round: cc.Label,
		txt_last: cc.Label,
		mjResultNode: cc.Node,
		pointer: cc.Node,
		operActPfb: cc.Prefab,
		tuoguanNode: cc.Node,
		headPfbLeft: cc.Prefab,
		headPfbRight: cc.Prefab,
		huanPaiPfb: cc.Prefab,
		huanPaiNode: cc.Node,

		_huDoneList: [],
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
		/**托管动画 */
		_tuoguanList: [],
		_timeOutArr: [],
		_baseData: null,
		_com_huanPai: null,
		/**是否正在换三张 */
		_isShowHuanSanZhang: false
	},

	start() {
		LSMJModel.setReview(true);
		if (!this.node.nodeParams.reviewRecord) {
			this.node.destroy();
			return;
		}
		this.reviewRecord = Utils.deepCopy(this.node.nodeParams.reviewRecord)
		// console.log("视频回放数据==", this.reviewRecord)
		this.tm = 0;
		this.bureau = 0;
		this.speed = 1; //测试用
		this.index = 0;
		this.pause = false;
		this.myUid = UserModel.getData('uid');
		LSMJModel.myUid = this.myUid
		if (!this.reviewRecord[this.bureau]) {
			let params = {
				content: '视频数据异常，请稍候再试！',
				ok: () => {
					this.node.destroy();
				}
			}
			AssetsManager.popDialog(params);
			return;
		}
		this.updateData(true);
		let huanPai = cc.instantiate(this.huanPaiPfb)
		huanPai.parent = this.huanPaiNode
		this._com_huanPai = huanPai.getComponent("LSMJHuanPai")
		this._com_huanPai.init()
		this.com_clock.gameInit(LSMJModel.getChairCount(), LSMJModel.getMyChairID())
		this.checkHeadPos();
		this.updatePointer();
		this.initHeads();
		this.setRoundShow();
		this.showHuanSanZhang()
		this.setPlay(this.index);
		let node = cc.find('Buttons', this.node);
		node.opacity = 125;
		node.runAction(
			cc.repeatForever(
				cc.sequence([
					cc.fadeTo(5, 0),
					cc.fadeTo(5, 125)
				])));
	},

	onDestroy() {
		this._timeOutArr.forEach(tid => {
			clearTimeout(tid)
		});
		LSMJModel.resetAll()
	},

	/**更新数据 */
	updateData(isFirst = false) {
		this._baseData = Utils.deepCopy(this.reviewRecord[this.bureau]);
		let baseData = this._baseData;
		LSMJModel.setDingQueTypeAll(baseData.plusInfo.queType)
		LSMJModel.setLaiZiCards(baseData.plusInfo.laiZiCards);
		let roomData = baseData.baseRoomRecords;
		this.restCardsCount = roomData.leftCount;
		let res = baseData.result;
		if (res && res[0]) LSMJModel.setUserHuDonList(res[0].userHuDonList)
		if (isFirst) {
			LSMJModel.gameRule = baseData.plusInfo.gameRule
			let userArray = roomData.userArray;
			for (const user of userArray) {
				LSMJModel.otherUserJoinRoom(user)
			}
		}
	},

	/**判断人数，初始化头像位置 */
	checkHeadPos() {
		let chairCount = LSMJModel.getChairCount()
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
		this._tuoguanList.length = 0
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
			this._userList.push(headNode.getComponent("LSMJHead"));
			this._userList[i].initRes();
			let handTile = cc.find("tiles/handTiles" + idx, this.node);
			let optTile = cc.find("tiles/optTiles" + idx, this.node);
			if (!optTile) optTile = cc.find("optTiles" + idx, handTile);
			let disTile = cc.find("tiles/outTiles" + idx, this.node);
			this._handTileMgrList.push(handTile.getComponent("LSMJHandTileMgr"));
			this._handTileMgrList[i].init(idx);
			this._optTileMgrList.push(optTile.getComponent("LSMJOptTileMgr"));
			this._optTileMgrList[i].init(i);
			this._disTileMgrList.push(disTile.getComponent("LSMJOutTileMgr"));
			this._disTileMgrList[i].init(idx);
			let opNode = cc.find("operAct" + idx, this.node);
			this._operActNodeList.push(opNode);
			this._tuoguanList.push(this.tuoguanNode.getChildByName("" + idx))
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
		if (event) this.showButtons();
		if (this._isShowHuanSanZhang) return
		this.index--;
		if (this.index < 0) this.index = 0;
		this.setPlay(this.index);
	},

	nextAct(event) {
		if (event) this.showButtons();
		if (this._isShowHuanSanZhang) return
		if (!this.reviewRecord[this.bureau]) {
			AssetsManager.tipDialog('当前已是最后一手！');
			this.pause = true;
			return;
		}
		let baseData = this._baseData
		let operateRecords = baseData.operateRecords;
		if (!operateRecords) return;
		this.setPlay(this.index);
		this.index++;
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
		if (this.bureau == curBureau) return;
		this.resetTable();
		AssetsManager.clearDialog(['LSMJResultDialog']);
		this.updateData()
		this.index = 0;
		this.pause = false;
		this.setRoundShow()
		this.showHuanSanZhang()
		this.setPlay(this.index);
		this.initHeads();
	},

	nextBureau(event) {
		if (event) {
			this.showButtons();
		}
		if (!this.reviewRecord[this.bureau + 1]) {
			AssetsManager.tipDialog('当前已是最后一局！');
			return;
		}
		this.bureau++;
		if (!this.reviewRecord[this.bureau]) {
			AssetsManager.tipDialog(`暂时没有第${this.bureau + 1}局的数据`);
			--this.bureau;
			return;
		} else {
			this.resetTable()
			AssetsManager.clearDialog(['LSMJResultDialog']);
			this.updateData()
			this.index = 0;
			this.pause = false;
			this._isShowHuanSanZhang = false
			this.setRoundShow()
			this.initHeads();
			this.showHuanSanZhang()
			this.setPlay(this.index);
		}
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
		if (this._isShowHuanSanZhang) return
		this.tm += dt * this.speed;
		if (this.tm >= 1) {
			this.tm %= 1;
			if (!this.pause) {
				this.nextAct();
			}
		}
	},

	setPlay(index) {
		if (this._isShowHuanSanZhang) return;
		if (index == 0) this._huDoneList = [];
		if (!!this._handTileMgrList) {
			for (let i = 0; i < this._handTileMgrList.length; i++) {
				if (!this._huDoneList[i]) this._handTileMgrList[i].setHuTile(null);
			}
		}
		let baseData = this._baseData
		let operateRecords = Utils.deepCopy(baseData.operateRecords)
		let roomData = baseData.baseRoomRecords;
		let huaCards = roomData.huaCards || {};
		let huanPaiType = baseData.huanPaiRecords ? baseData.huanPaiRecords.huanPaiType : null;
		let handCards = Utils.deepCopy(roomData.handCards); /* 手牌 */
		if (huanPaiType || huanPaiType == 0) handCards = Utils.deepCopy(baseData.huanPaiRecords.handCards);
		LSMJModel.setHandCards(handCards);
		let actionRecords = [];
		//找当前ACTION发生之前的操作
		for (let i = 0; i < operateRecords.length; i++) {
			if (i > index) break;
			if (i < index) actionRecords.push(operateRecords[i]);
		}
		let curOpt = operateRecords[index];
		let abvOpt = operateRecords[index - 1];
		if (curOpt) {
			LSMJModel.setOperateRecords(actionRecords.slice());
			LSMJModel.handCardsSync();
			if (curOpt.operate == ApiLsmj.operateType.GET) {
				curOpt.operateArray = [];
				curOpt.type = curOpt.operate;
				curOpt.operateArray.push(curOpt);
				LSMJModel.onGameTurn(curOpt);
			} else {
				LSMJModel.onUserOpt(curOpt);
			}
			// console.log('当前>>>>', index, curOpt, operateRecords)
			let idx = LSMJModel.getUserIndexByUID(curOpt.uid);
			if (curOpt.operate == ApiLsmj.operateType.GET) {
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: LSMJModel.getGameType()
				});
				let curIdx = LSMJModel.getUserIndexByUID(curOpt.uid);
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
				this.restCardsCount--;
			} else if (curOpt.operate == ApiLsmj.operateType.QI) {
				AssetsManager.playEffect({
					path: 'res/audio/nv/' + curOpt.card,
					bundle: LSMJModel.getGameType()
				});
				AssetsManager.playEffect({
					path: 'res/audio/main/push',
					bundle: LSMJModel.getGameType()
				});
			} else if (ApiLsmj.operateType.HU_ZHI == curOpt.operate) {
				let curIdx = LSMJModel.getUserIndexByUID(curOpt.uid);
				this._huDoneList[curIdx] = 1;
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
				this.showAni(4, curOpt);
			} else if (ApiLsmj.operateType.HU_CHI == curOpt.operate ||
				ApiLsmj.operateType.HU_QIANG == curOpt.operate ||
				ApiLsmj.operateType.HU_TI == curOpt.operate) {
				let curIdx = LSMJModel.getUserIndexByUID(curOpt.uid);
				this._huDoneList[curIdx] = 1;
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
				this.showAni(3, curOpt);
			} else if (ApiLsmj.operateType.PENG == curOpt.operate) {
				this.showAni(1, curOpt);
			} else if (ApiLsmj.operateType.CHI == curOpt.operate) {
				this.showAni(0, curOpt);
			} else if (ApiLsmj.operateType.GANG_BU == curOpt.operate ||
				ApiLsmj.operateType.GANG_ZHI == curOpt.operate ||
				ApiLsmj.operateType.GANG_CHI == curOpt.operate) {
				this.showAni(2, curOpt);
			} else if (ApiLsmj.operateType.TI == curOpt.operate) {
				this.showAni(9, curOpt);
			}
			let tg = this._tuoguanList[idx]
			if (tg && typeof (curOpt.isAuto) == "boolean") {
				tg.active = curOpt.isAuto
			}
			this.com_clock.setDir(idx);
			this.txt_last.string = this.restCardsCount + ""
			for (const uid in handCards) {
				let idx = LSMJModel.getUserIndexByUID(uid);
				let uHandCards = LSMJModel.getHandCards(uid);
				if (curOpt.operate == ApiLsmj.operateType.GET && curOpt.uid == uid) {
					let mCardIdx = uHandCards.indexOf(curOpt.card);
					mCardIdx >= 0 && uHandCards.splice(mCardIdx, 1);
				}
				if (!!abvOpt
					&& curOpt.operate == ApiLsmj.operateType.HU_TI
					&& abvOpt.operate == ApiLsmj.operateType.TI
					&& uid == abvOpt.uid) {
					let changed = LSMJModel.findChangedElements(abvOpt.plusInfo.cardList.slice(), abvOpt.plusInfo.ticardList.slice());
					let laiZiCard = null;
					if (changed.reduced.length == 1) laiZiCard = changed.reduced.pop();
					if (!!laiZiCard) {
						let idx = uHandCards.indexOf(laiZiCard)
						if (idx !== -1) uHandCards.splice(idx, 1);
					}
				}
				uHandCards = LSMJModel.sortTiles(uid, uHandCards);
				this._handTileMgrList[idx].updateLieTiles(uHandCards, curOpt.card)
				this._disTileMgrList[idx].reset();
				let outOpts = LSMJModel.getOutTilesByUID(uid);
				let last = this._disTileMgrList[idx].showOutTiles(outOpts);
				if (uid == curOpt.uid && curOpt.operate == ApiLsmj.operateType.QI) {
					this.updatePointer(last.node)
				} else {
					this.updatePointer()
				}
				let pengGangs = LSMJModel.getPengGangArrayByUID(uid);
				this._optTileMgrList[idx].updateOptTiles(pengGangs);
			}
		}

		if (index >= operateRecords.length - 1) {
			/* 显示结算界面 */
			let resData = Utils.deepCopy(baseData)
			resData.path = "res/prefab/LSMJResultDialog"
			resData.bundle = LSMJModel.getGameType()
			resData.parent = this.mjResultNode
			resData.isReview = true
			let dt = 1
			this.scheduleOnce(() => {
				AssetsManager.createDialog(resData);
			}, dt)
			this.pause = true
		} else {
			AssetsManager.clearDialog(['LSMJResultDialog']);
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
			c.reset()
		});
		this._operActNodeList.forEach(n => {
			n.removeAllChildren()
		})

		this.com_clock.setDir(-1)
		this.com_clock.setTick(0)
		this.updatePointer();
		this._isShowHuanSanZhang = false
		if (!!this._ghostCard) this._ghostCard.setNodeShow(false);
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
		let typeNameList = ["chi", "peng", "gang", "hu", "zimo", "", "", "", "fei", "ti"]
		/**声音 */
		let audioType = type;
		if (audioType < typeNameList.length) {
			AssetsManager.playEffect({
				path: `res/audio/nv/${typeNameList[audioType]}`,
				bundle: LSMJModel.getGameType()
			});
		}
		let idx = LSMJModel.getUserIndexByUID(data.uid)
		/**展示动画 */
		let optNode = cc.instantiate(this.operActPfb);
		optNode.parent = this._operActNodeList[idx]
		let com = optNode.getComponent('LSMJOperAct')
		com.showOpt(type, () => {

		});

		if (type == 3 || type == 4) {
			this.showHuIdx(data.uid, true); //胡牌序列
		}
	},

	showHuanSanZhang() {
		if (this._isShowHuanSanZhang) return
		let baseData = Utils.deepCopy(this._baseData)
		// console.log('showHuanSanZhang', baseData)
		if (!baseData || !baseData.baseRoomRecords || !baseData.huanPaiRecords) return
		let starthandCards = baseData.baseRoomRecords.handCards
		let starthuanPaiList = baseData.huanPaiRecords.starthuanPaiList
		let endhuanPaiList = baseData.huanPaiRecords.endhuanPaiList
		let huanPaiType = baseData.huanPaiRecords.huanPaiType
		let handCards = baseData.huanPaiRecords.handCards
		if ((huanPaiType || huanPaiType == 0)) {
			this._timeOutArr.forEach(tid => {
				clearTimeout(tid)
			});
			this._com_huanPai.reset()
			this._isShowHuanSanZhang = true
			/**设置初始手牌 */
			for (const uid in starthandCards) {
				if (Object.hasOwnProperty.call(starthandCards, uid)) {
					let idx = LSMJModel.getUserIndexByUID(uid)
					const arr = starthandCards[uid];
					LSMJModel.sortTiles(uid, arr)
					this._handTileMgrList[idx].updateLieTiles(arr)
				}
			}

			/**设置换牌 和删除过后的手牌*/
			this._timeOutArr[0] = setTimeout(() => {
				let startList = Utils.deepCopy(starthuanPaiList)
				for (const uid in starthandCards) {
					if (Object.hasOwnProperty.call(starthandCards, uid)) {
						let idx = LSMJModel.getUserIndexByUID(uid)
						let handArr = starthandCards[uid].slice();
						let startArr = startList.find((v, i) => LSMJModel.getUserIndexByChairID(i) == idx)
						for (let j = 0; j < startArr.length; j++) {
							const hcard = startArr[j];
							let hidx = handArr.indexOf(hcard)
							if (hidx != -1) {
								handArr.splice(hidx, 1)
							}
						}
						LSMJModel.sortTiles(uid, handArr)
						this._handTileMgrList[idx].updateLieTiles(handArr)
						this._com_huanPai.setReviewHuanPaiChoose(idx, startArr)
					}
				}
			}, 0.8 * 1000)
			/**播放换牌动画 */
			this._timeOutArr[1] = setTimeout(() => {
				this._com_huanPai.showAni(huanPaiType)
			}, 1.5 * 1000)
			let dt = 1.5
			if (huanPaiType !== ApiLsmj.huanPaiType.DUI) {
				dt = 2.7
			}
			this._timeOutArr[2] = setTimeout(() => {
				let endList = Utils.deepCopy(endhuanPaiList)
				for (let i = 0; i < endList.length; ++i) {
					let idx = LSMJModel.getUserIndexByChairID(i)
					this._com_huanPai.setReviewHuanPaiChoose(idx, endList[i])
				}
			}, dt * 1000)
			/**刷新到换牌后的牌 */
			this._timeOutArr[3] = setTimeout(() => {
				let hand = Utils.deepCopy(handCards)
				for (const uid in handCards) {
					if (Object.hasOwnProperty.call(handCards, uid)) {
						let idx = LSMJModel.getUserIndexByUID(uid)
						const handArr = handCards[uid];
						LSMJModel.sortTiles(uid, handArr)
						this._handTileMgrList[idx].updateLieTiles(handArr)
					}
				}
			}, (dt + 1.5) * 1000)
			this._timeOutArr[4] = setTimeout(() => {
				this._isShowHuanSanZhang = false
				this._com_huanPai.reset()
			}, (dt + 2.5) * 1000)
		}
	},

	initHeads() {
		let baseData = this._baseData;
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		let piaoFen = baseData.plusInfo.piaoFen;
		for (let i = 0; i < userArray.length; i++) {
			const user = userArray[i];
			let idx = LSMJModel.getUserIndexByUID(user.uid);
			let com = this._userList[idx];
			com.initReview(user);
			let qType = LSMJModel.getDingQueType(user.uid)
			com.setDingque(qType)
			let isPiao = false
			if (piaoFen && piaoFen.hasOwnProperty(user.uid)) {
				isPiao = piaoFen[user.uid]
			}
			com.setPiao(isPiao)
		}
		this._tuoguanList.forEach(node => node.active = false)
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
				if (array[i] == item) ++count;
			}
		}
		return count;
	},

	/**设置局数和倒数显示 */
	setRoundShow() {
		let baseData = this._baseData;
		let plusInfo = baseData.plusInfo;
		this.txt_round.string = `${plusInfo.curBureau}/${LSMJModel.getGameRuleByKey("bureau")}局`;
		this.txt_roomId.string = '房号:' + baseData.baseRoomRecords.roomID;
	},

	/**展示胡牌序列 */
	showHuIdx(uid, isAnim = false) {
		let huList = LSMJModel.getUserHuDonList()
		if (isAnim && uid) {
			let index = huList.findIndex((info) => {
				return info.uid == uid
			})
			if (index !== -1) {
				let huInfo = huList[index]
				index++
				let com = this.genOperActNode(uid)
				com.showHuIndex(huInfo.operateType, index, uid, isAnim);
			}
		} else {
			for (let i = 0; i < huList.length; i++) {
				const huInfo = huList[i];
				const index = i + 1
				let com = this.genOperActNode(huInfo.uid)
				com.showHuIndex(huInfo.operateType, index, huInfo.uid, isAnim);
			}
		}
	},

	/**生成一个新的操作动画 */
	genOperActNode(uid, showNode, nodeName = "operAni") {
		if (!showNode) {
			let idx = LSMJModel.getUserIndexByUID(uid);
			showNode = this._operActNodeList[idx];
		}
		let optNode = cc.instantiate(this.operActPfb);
		optNode.name = nodeName
		let com = optNode.getComponent('LSMJOperAct');
		optNode.parent = showNode;
		return com
	},
});