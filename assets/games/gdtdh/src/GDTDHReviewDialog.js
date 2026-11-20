const ApiGdtdh = require('./ApiGdtdh');
const GDTDHLogic = require('./GDTDHLogic');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');
const GDTDHModel = require('./GDTDHModel');

cc.Class({
	extends: cc.Component,
	properties: {
		txt_roomId: cc.Label,
		txt_round: cc.Label,
		txt_last: cc.Label,
		mjResultNode: cc.Node,
		pointer: cc.Node,
		operActPfb: cc.Prefab,
		tuoguanNode: cc.Node,
		com_clock: require("GDTDHClock"),
		com_fanGui: require("GDTDHFanGui"),
		com_ma: require("GDTDHMaPai"),

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
		/**托管动画 */
		_tuoguanList: [],
	},

	start() {
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
		GDTDHModel.myUid = this.myUid
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
		this.com_fanGui.init() //初始化翻鬼界面
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau]);
		GDTDHModel.gameRule = baseData.plusInfo.gameRule
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		this.userArray = userArray;
		this.restCardsCount = roomData.leftCount;
		this.chairCount = userArray.length;
		this.myChairId = 0;
		for (const user of userArray) {
			GDTDHModel.otherUserJoinRoom(user)
			if (user.uid == this.myUid) {
				this.myChairId = user.chairID;
			}
		}
		this.com_clock.gameInit(this.chairCount, this.myChairId)
		this.checkHeadPos();
		this.updatePointer();
		this.initHeads();
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
			this._userList.push(headNode.getComponent("GDTDHHead"));
			this._userList[i].initRes();
			let handTile = cc.find("tiles/handTiles" + idx, this.node);
			let optTile = cc.find("tiles/optTiles" + idx, this.node);
			if (!optTile) {
				optTile = cc.find("optTiles" + idx, handTile);
			}
			let disTile = cc.find("tiles/outTiles" + idx, this.node);
			this._handTileMgrList.push(handTile.getComponent("GDTDHHandTileMgr"));
			this._handTileMgrList[i].init(idx);
			this._optTileMgrList.push(optTile.getComponent("GDTDHOptTileMgr"));
			this._optTileMgrList[i].init(i);
			this._disTileMgrList.push(disTile.getComponent("GDTDHOutTileMgr"));
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
		if (event) {
			this.showButtons();
		}
		this.index--;
		if (this.index < 0) {
			this.index = 0;
		}
		this.setPlay(this.index);
	},

	nextAct(event) {
		if (event) {
			this.showButtons();
		}
		if (!this.reviewRecord[this.bureau]) {
			AssetsManager.tipDialog('当前已是最后一手！');
			this.pause = true;
			return;
		}
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau])
		let operateRecords = baseData.operateRecords;
		if (!operateRecords) return;
		let operateRecordsCounts = operateRecords.length;
		if (this.index > operateRecordsCounts) {
			this.pause = true;
			return;
		}
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		this.userArray = userArray;
		this.index++;
		if (this.index > operateRecords.length - 1) return;
		this.setPlay(this.index);
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
		AssetsManager.clearDialog(['GDTDHResultDialog']);
		MessageCallback.emitMessage("reviewClear")
		this.index = 0;
		this.pause = false;
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau])
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		this.userArray = userArray;
		this.restCardsCount = roomData.leftCount;
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
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau])
		if (!baseData) {
			AssetsManager.tipDialog(`暂时没有第${this.bureau + 1}局的数据`);
			--this.bureau;
			return;
		} else {
			this.resetTable()
			AssetsManager.clearDialog(['GDTDHResultDialog']);
			let roomData = baseData.baseRoomRecords;
			MessageCallback.emitMessage("reviewClear")
			this.index = 0;
			let userArray = roomData.userArray;
			this.userArray = userArray;
			this.restCardsCount = roomData.leftCount;
			this.pause = false;
			this.setPlay(this.index);
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
		// return;
		this.tm += dt * this.speed;
		if (this.tm >= 1) {
			this.tm %= 1;
			if (!this.pause) {
				this.nextAct();
			}
		}
	},

	setPlay(index) {
		if (!!this._handTileMgrList) {
			for (let i = 0; i < this._handTileMgrList.length; i++) {
				this._handTileMgrList[i].setHuTile(null);
			}
		}
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau])
		let operateRecords = Utils.deepCopy(baseData.operateRecords)
		let roomData = baseData.baseRoomRecords;
		let gameRule = roomData.gameRule
		let userArray = roomData.userArray;
		this.userArray = userArray;
		this.txt_round.string = '局数:' + (this.bureau + 1) + '/' + roomData.maxBureau;
		this.txt_roomId.string = '房号:' + roomData.roomID;
		let pengGangs = {}; /* 碰杠的牌 */
		let outOpts = {}; /* 出的牌 */
		let huaCards = roomData.huaCards || {};
		let handCards = Utils.deepCopy(roomData.handCards); /* 手牌 */
		for (const uid in handCards) {
			pengGangs[uid] = [];
			outOpts[uid] = [];
		}
		if (gameRule.laiZiType == ApiGdtdh.laiZiType.SHUANG || gameRule.laiZiType == ApiGdtdh.laiZiType.FAN) {
			outOpts[baseData.bankerUid].push({
				card: roomData.fanCard,
				uid: baseData.bankerUid,
				operate: ApiGdtdh.operateType.QI,
			}) //加入翻牌
		}
		/**赖子 */
		this.com_fanGui.showLaiZi(roomData.laiZiCards)
		GDTDHModel.setGhostCard(roomData.laiZiCards);

		let curOpt = operateRecords[index];
		let passOpt = operateRecords[index - 1];
		//找当前ACTION发生之前的操作
		for (let i = 0; i < operateRecords.length; i++) {
			if (i > index) break;
			let item = operateRecords[i];
			if (item.operate == ApiGdtdh.operateType.GET) {
				handCards[item.uid].push(item.card);
			} else if (item.operate == ApiGdtdh.operateType.BU_HUA) {
				huaCards[item.uid] = huaCards[item.uid] || [];
				huaCards[item.uid].push(item.card);
			} else if (item.operate == ApiGdtdh.operateType.QI) {
				handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
				outOpts[item.uid].push(item);
			} else if (item.operate == ApiGdtdh.operateType.GANG_ZHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiGdtdh.operateType.GET && abvOpt.uid == item.uid) {
					let gangList = item.plusInfo.cardList;
					if (!!gangList) {
						for (let idx = 0; idx < gangList.length; idx++) {
							const card = gangList[idx];
							handCards[item.uid].splice(handCards[item.uid].indexOf(card), 1);
						}
						pengGangs[item.uid].push(item);
					}
				}
			} else if (item.operate == ApiGdtdh.operateType.GANG_BU) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiGdtdh.operateType.GET && abvOpt.uid == item.uid) {
					for (let j = pengGangs[item.uid].length - 1; j >= 0; j--) {
						if (pengGangs[item.uid][j].operate == ApiGdtdh.operateType.PENG &&
							pengGangs[item.uid][j].card == item.card) {
							pengGangs[item.uid].splice(j, 1);
							break;
						}
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiGdtdh.operateType.GANG_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiGdtdh.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
					let gangList = item.plusInfo.cardList.slice()
					gangList.splice(gangList.indexOf(item.card), 1)
					for (let idx = 0; idx < gangList.length; idx++) {
						const card = gangList[idx];
						handCards[item.uid].splice(handCards[item.uid].indexOf(card), 1);
					}
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiGdtdh.operateType.PENG) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiGdtdh.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiGdtdh.operateType.CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiGdtdh.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
					let cardList = item.plusInfo.cardList.slice()
					cardList.splice(cardList.indexOf(item.card), 1)
					for (let i = 0; i < cardList.length; i++) {
						let idx = handCards[item.uid].indexOf(cardList[i])
						handCards[item.uid].splice(idx, 1);
					}
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiGdtdh.operateType.HU_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiGdtdh.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
				}
			}
		}

		if (curOpt) {
			if (curOpt.operate == ApiGdtdh.operateType.GET) {
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: Enums.bundleType.GDTDH
				});
				if (handCards[curOpt.uid].indexOf(curOpt.card) >= 0) {
					handCards[curOpt.uid].splice(handCards[curOpt.uid].indexOf(curOpt.card), 1)
				}
				let curIdx = this.getUserIndexByID(curOpt.uid);
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
				this.restCardsCount--;
			} else if (curOpt.operate == ApiGdtdh.operateType.QI) {
				AssetsManager.playEffect({
					path: 'res/audio/nv/' + curOpt.card,
					bundle: Enums.bundleType.GDTDH
				});
				AssetsManager.playEffect({
					path: 'res/audio/main/push',
					bundle: Enums.bundleType.GDTDH
				});
			} else if (ApiGdtdh.operateType.HU_ZHI == curOpt.operate) {
				if (handCards[curOpt.uid].indexOf(curOpt.card) >= 0) {
					handCards[curOpt.uid].splice(handCards[curOpt.uid].indexOf(curOpt.card), 1)
				}
				let curIdx = this.getUserIndexByID(curOpt.uid);
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
				this.showAni(4, curOpt);
			} else if (ApiGdtdh.operateType.HU_CHI == curOpt.operate ||
				ApiGdtdh.operateType.HU_QIANG == curOpt.operate) {
				if (passOpt && passOpt.operate == ApiGdtdh.operateType.QI) {
					let curIdx = this.getUserIndexByID(curOpt.uid);
					this._handTileMgrList[curIdx].setHuTile(passOpt.card);
				}
				this.showAni(3, curOpt);
			} else if (ApiGdtdh.operateType.PENG == curOpt.operate) {
				this.showAni(1, curOpt);
			} else if (ApiGdtdh.operateType.CHI == curOpt.operate) {
				this.showAni(0, curOpt);
			} else if (ApiGdtdh.operateType.GANG_BU == curOpt.operate ||
				ApiGdtdh.operateType.GANG_ZHI == curOpt.operate ||
				ApiGdtdh.operateType.GANG_CHI == curOpt.operate) {
				this.showAni(2, curOpt);
			}
			let idx = this.getUserIndexByID(curOpt.uid);
			let tg = this._tuoguanList[idx]
			if (tg && typeof (curOpt.isAuto) == "boolean") {
				tg.active = curOpt.isAuto
			}
			this.com_clock.setDir(idx);
			this.txt_last.string = this.restCardsCount + ""
			for (const uid in handCards) {
				let idx = this.getUserIndexByID(uid);
				let uHandCards = handCards[uid].slice();
				GDTDHModel.sortTiles(uHandCards);
				this._handTileMgrList[idx].updateLieTiles(uHandCards, curOpt.card)
				this._disTileMgrList[idx].reset();
				let last = this._disTileMgrList[idx].showOutTiles(outOpts[uid]);
				if (uid == curOpt.uid && curOpt.operate == ApiGdtdh.operateType.QI) {
					this.updatePointer(last.node)
				} else {
					this.updatePointer()
				}
				this._optTileMgrList[idx].updateOptTiles(pengGangs[uid]);
			}
		}

		if (index == operateRecords.length - 1) {
			/* 显示结算界面 */
			let resData = Utils.deepCopy(baseData)
			resData.path = "res/prefab/GDTDHResultDialog"
			resData.bundle = Enums.bundleType.GDTDH
			resData.parent = this.mjResultNode
			resData.isReview = true
			let dt = 1
			if (resData.plusInfo.maPaiInfo) {
				dt += this.com_ma.showMaPai(resData.plusInfo.maPaiInfo)
			}
			this.scheduleOnce(() => {
				AssetsManager.createDialog(resData);
			}, dt)
		} else {
			AssetsManager.clearDialog(['GDTDHResultDialog']);
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
		this.com_fanGui.reset()
		this.com_ma.reset()
		this.updatePointer();
		if (!!this._ghostCard) {
			this._ghostCard.setNodeShow(false);
		}
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
		let audioType = type;
		if (audioType < typeNameList.length) {
			AssetsManager.playEffect({
				path: `res/audio/nv/${typeNameList[audioType]}`,
				bundle: Enums.bundleType.GDTDH
			});
		}
		let idx = this.getUserIndexByID(data.uid)
		/**展示动画 */
		let optNode = cc.instantiate(this.operActPfb);
		optNode.parent = this._operActNodeList[idx]
		let com = optNode.getComponent('GDTDHOperAct')
		com.showOpt(type, () => {
			/**展示牌型 */
			if (type >= 3) {
				let optNode = cc.instantiate(this.operActPfb);
				optNode.parent = this._operActNodeList[idx]
				let com = optNode.getComponent('GDTDHOperAct')
				com.showHuType(data.plusInfo.huPaiType)
			}
		});
	},

	initHeads() {
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau]);
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		this.userArray = userArray;
		for (let i = 0; i < userArray.length; i++) {
			const user = userArray[i];
			let idx = this.getUserIndex(user.chairID);
			let com = this._userList[idx];
			com.initReview(user);
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
				if (array[i] == item) {
					++count;
				}
			}
		}
		return count;
	},

	getUserIndex(chairID) {
		return (chairID - this.myChairId + this.chairCount) % this.chairCount;
	},

	getUserIndexByID(uid) {
		if (!this.userArray) return 0;
		let user = this.userArray.find((item) => {
			return item.uid == uid;
		});
		if (!user) return 0;
		return this.getUserIndex(user.chairID);
	},

	getUserByChairID(chairID) {
		if (!this.userArray) return null;
		let user = this.userArray.find((item) => {
			return item.chairID == chairID;
		});
		if (!user) return null;
		return user;
	},

	getUserByID(uid) {
		if (!this.userArray) return null;
		let user = this.userArray.find((item) => {
			return item.uid == uid;
		});
		if (!user) return null;
		return user;
	},

});