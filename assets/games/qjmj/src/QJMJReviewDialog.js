const ApiQjmj = require('./ApiQjmj');
const QJMJLogic = require('./QJMJLogic');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');
const QJMJModel = require('./QJMJModel');

cc.Class({
	extends: cc.Component,
	properties: {
		txt_roomId: cc.Label,
		txt_round: cc.Label,
		txt_last: cc.Label,
		mjResultNode: cc.Node,
		pointer: cc.Node,
		operActPfb: cc.Prefab,
		com_clock: require("QJMJClock"),

		/**用户脚本列表 下标为本地座位号*/
		_userList: [],
		/**手牌脚本列表 */
		_handTileMgrList: [],
		/**操作牌脚本列表 */
		_optTileMgrList: [],
		/**打出牌脚本列表 */
		_disTileMgrList: [],
		_menTilesMgrList: [],
		/**动画节点 */
		_operActNodeList: [],
	},

	start() {
		this.reviewRecord = Utils.deepCopy(this.node.nodeParams.reviewRecord);
		if (!this.reviewRecord) {
			this.node.destroy();
			return;
		}
		this.tm = 0;
		this.speed = 1;
		this.bureau = 0;
		this.showCurRound(-1, true);
	},

	showCurRound(bureau, type) {
		type ? bureau += 1 : bureau -= 1;
		MessageCallback.emitMessage("reviewClear");
		AssetsManager.clearDialog(['QJMJResultDialog']);
		this.baseData = Utils.deepCopy(this.reviewRecord[bureau]);
		// console.log("bureau", bureau, "this.baseData", this.baseData);
		if (!this.baseData) {
			AssetsManager.tipDialog(`暂无第${bureau}局的回放数据`);
			return
		};
		this.index = 0;
		this.pause = false;
		this.bureau = bureau;
		let roomData = this.baseData.baseRoomRecords;
		this.txt_round.string = `${this.bureau + 1}/${roomData.maxBureau}`;
		this.restCardsCount = roomData.leftCount;
		this.userArray = roomData.userArray;
		this.initOnceRoom();
		this.resetTable();
		this.initHeads();
		this.setPlay();
	},

	setPlay() {
		if (!!this._handTileMgrList) {
			for (let i = 0; i < this._handTileMgrList.length; i++) {
				this._handTileMgrList[i].setHuTile(null);
			}
		}
		if (!this.baseData) return false;
		let baseData = Utils.deepCopy(this.baseData);
		let operateRecords = baseData.operateRecords;
		let curOpt = operateRecords[this.index];
		let roomData = baseData.baseRoomRecords;
		let handCards = roomData.handCards;
		let pengGangs = {}; /* 碰杠的牌 */
		let outOpts = {}; /* 出的牌 */
		let huCards = {}; /**胡的牌 */
		for (const uid in handCards) {
			pengGangs[uid] = [];
			outOpts[uid] = [];
			huCards[uid] = -1;
		}
		//找当前ACTION发生之前的操作
		for (let i = 0; i < operateRecords.length; i++) {
			if (i > this.index) break;
			let item = operateRecords[i];
			if (item.operate == ApiQjmj.operateType.GET) {
				handCards[item.uid].push(item.card);
			} else if (item.operate == ApiQjmj.operateType.QI) {
				handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
				outOpts[item.uid].push(item);
			} else if (item.operate == ApiQjmj.operateType.GANG_ZHI) {
				let abvOpt = operateRecords[i - 1];
				if (i == 0 || (!!abvOpt && abvOpt.operate == ApiQjmj.operateType.GET && abvOpt.uid == item.uid)) {//起手暗杠容错
					let gangList = item.plusInfo.cardList;
					if (!!gangList) {
						for (let idx = 0; idx < gangList.length; idx++) {
							const card = gangList[idx];
							handCards[item.uid].splice(handCards[item.uid].indexOf(card), 1);
						}
						pengGangs[item.uid].push(item);
					}
				}
			} else if (item.operate == ApiQjmj.operateType.GANG_BU) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiQjmj.operateType.GET && abvOpt.uid == item.uid) {
					for (let j = pengGangs[item.uid].length - 1; j >= 0; j--) {
						if (pengGangs[item.uid][j].operate == ApiQjmj.operateType.PENG &&
							pengGangs[item.uid][j].card == item.card) {
							pengGangs[item.uid].splice(j, 1);
							break;
						}
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiQjmj.operateType.GANG_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiQjmj.operateType.QI) {
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
			} else if (item.operate == ApiQjmj.operateType.PENG) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiQjmj.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiQjmj.operateType.CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiQjmj.operateType.QI) {
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
			} else if (item.operate == ApiQjmj.operateType.HU_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiQjmj.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
				}
				huCards[item.uid] = item.card
			} else if (item.operate == ApiQjmj.operateType.HU_ZHI) {
				let h = handCards[item.uid]
				let huidx = h.indexOf(item.card)
				if (huidx != -1) {
					h.splice(huidx, 1)
				}
				huCards[item.uid] = item.card
			}
		}
		// console.log("当前数据》局数：" + (this.bureau + 1), "总条》" + operateRecords.length, "当前》" + index,);
		// curOpt && console.log('当前操作》玩家：', curOpt.uid, "操作牌》", curOpt.card, '操作类型》', curOpt.operate, curOpt);
		// console.log('当前牌值》\n出牌》', outOpts, '\n手牌》', handCards, '\n碰杠》', pengGangs);

		if (curOpt) {
			this.com_clock.setTick(0);
			let optUid = curOpt.uid;
			let optIndex = this.getUserIndexByID(optUid);
			this.com_clock.setDir(optIndex);
			this.txt_last.string = `${this.restCardsCount}`;

			if (curOpt.operate == ApiQjmj.operateType.GET) {
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: Enums.bundleType.QJMJ
				});
				if (handCards[optUid].indexOf(curOpt.card) >= 0) {
					handCards[optUid].splice(handCards[optUid].indexOf(curOpt.card), 1)
				}
				this._handTileMgrList[optIndex].setHuTile(curOpt.card);
				this.restCardsCount--;
			} else if (curOpt.operate == ApiQjmj.operateType.QI) {
				AssetsManager.playEffect({
					bundle: Enums.bundleType.QJMJ,
					path: 'res/audio/nv/' + curOpt.card,
				});
				AssetsManager.playEffect({
					path: 'res/audio/main/push',
					bundle: Enums.bundleType.QJMJ
				});
			} else if (ApiQjmj.operateType.HU_CHI == curOpt.operate) {
				this.showAni(3, curOpt);
			} else if (ApiQjmj.operateType.HU_ZHI == curOpt.operate) {
				this.showAni(4, curOpt);
			} else if (ApiQjmj.operateType.PENG == curOpt.operate) {
				this.showAni(1, curOpt);
			} else if (ApiQjmj.operateType.CHI == curOpt.operate) {
				this.showAni(0, curOpt);
			} else if (ApiQjmj.operateType.GANG_BU == curOpt.operate ||
				ApiQjmj.operateType.GANG_ZHI == curOpt.operate ||
				ApiQjmj.operateType.GANG_CHI == curOpt.operate) {
				this.showAni(2, curOpt);
			}

			for (const uid in handCards) {
				let idx = this.getUserIndexByID(uid);
				let uHandCards = handCards[uid].slice();
				this._disTileMgrList[idx].reset();
				uHandCards = QJMJModel.sortTiles(null, uHandCards);
				this._optTileMgrList[idx].updateOptTiles(pengGangs[uid]);
				let last = this._disTileMgrList[idx].showOutTiles(outOpts[uid]);
				this._handTileMgrList[idx].updateLieTiles(uHandCards, curOpt.card);
				if (huCards[uid] != -1) this._handTileMgrList[idx].setHuTile(huCards[uid]);
				if (uid == curOpt.uid && curOpt.operate == ApiQjmj.operateType.QI) {
					this.updatePointer(last.node)
				} else {
					this.updatePointer()
				}
			}
		}

		if (this.index == operateRecords.length - 1) {
			let result = baseData.result;
			let maPaiInfo = null;
			for (const user of result) {
				if (!maPaiInfo && !!user.maPaiInfo) {
					maPaiInfo = user.maPaiInfo;
				};
			}
			let createResultDialog = () => {
				let msg = {
					isReview: true,
					parent: this.mjResultNode,
					bundle: Enums.bundleType.QJMJ,
					path: "res/prefab/QJMJResultDialog",
				}
				AssetsManager.createDialog(Object.assign(msg, baseData))
			}
			this.scheduleOnce(() => {
				let maCards = !!maPaiInfo ? maPaiInfo.maCards || [] : [];
				if (!!maPaiInfo && !!maCards.length) {
					AssetsManager.createDialog({
						result: result,
						isReview: true,
						maPaiInfo: maPaiInfo,
						gameRule: this.gameRule,
						bundle: Enums.bundleType.QJMJ,
						callback: createResultDialog,
						path: "res/prefab/QJMJFanPai",
					});
				} else {
					createResultDialog();
				}
			}, 2);
		} else {
			AssetsManager.clearDialog(['QJMJFanPai', 'QJMJResultDialog']);
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

	showOperAct(uid, funs, showNode) {
		if (!showNode) {
			let idx = this.getUserIndexByID(uid);
			showNode = this._operActNodeList[idx];
		}
		if (showNode) {
			let optNode = cc.instantiate(this.operActPfb);
			let CtrlAct = optNode.getComponent('QJMJOperAct');
			optNode.parent = showNode;
			if (funs) funs(CtrlAct);
		}
	},

	/**展示动画和声音 */
	showAni(type, data) {
		let typeNameList = ["chi", "peng", "gang", "hu", "zimo"]
		/**声音 */
		let audioType = type;
		if (audioType < typeNameList.length) {
			AssetsManager.playEffect({
				path: `res/audio/nv/${typeNameList[audioType]}`,
				bundle: Enums.bundleType.QJMJ
			});
		}
		let idx = this.getUserIndexByID(data.uid)
		/**展示动画 */
		let optNode = cc.instantiate(this.operActPfb);
		optNode.parent = this._operActNodeList[idx]
		let com = optNode.getComponent('QJMJOperAct')
		if (audioType >= 3) {
			com.showHuIndex(data.operate, data.plusInfo.index, data.uid, true);
			return
		}
		com.showOpt(type);
		/**展示刮风和下雨 */
		if (type == 2) {
			let t = 5;
			if (data.operate === ApiQjmj.operateType.GANG_ZHI) {
				t = 7; //下雨
			}
			let fengNode = cc.instantiate(this.operActPfb);
			fengNode.parent = this.node;
			let fcom = fengNode.getComponent("QJMJOperAct");
			fcom.showOpt(t);
		} else {
			optNode.scale = 0.8;
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

	preBureau(event) {
		if (event) this.showButtons();
		if ((this.bureau - 1) < 0) {
			AssetsManager.tipDialog('当前已是第一局！');
			return;
		}
		this.showCurRound(this.bureau, false);
	},

	nextBureau(event) {
		if (event) this.showButtons();
		if ((this.bureau + 1) >= this.reviewRecord.length) {
			AssetsManager.tipDialog('当前已是最后一局！');
			return;
		}
		this.showCurRound(this.bureau, true);
	},

	preAct(event) {
		if (event) this.showButtons();
		this.index--;
		if (this.index < 0) {
			this.index = 0;
			if (event) {
				AssetsManager.tipDialog('当前已第一手！');
			}
		}
		this.resetTable();
		this.setPlay();
	},

	nextAct(event) {
		if (event) this.showButtons();
		if (!this.baseData) return;
		let optList = this.baseData.operateRecords || [];
		if (this.index >= optList.length - 1) {
			if (event) {
				AssetsManager.tipDialog('当前已是最后一手！');
			}
			this.pause = true;
			return;
		}
		this.index++;
		this.setPlay();
	},

	onPause(event) {
		if (event) this.showButtons();
		this.pause = !this.pause;
	},

	speedUp(event) {
		if (event) this.showButtons();
		this.speed *= 2;
		if (this.speed > 8) {
			this.speed = 8;
		}
	},

	speedDown(event) {
		if (event) this.showButtons();
		this.speed /= 2;
		if (this.speed < 1 / 8) {
			this.speed = 1 / 8;
		}
	},

	speedNormal(event) {
		if (event) this.showButtons();
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

	initOnceRoom() {
		if (!!this.myUid || !this.baseData) return;
		this.gameRule = QJMJModel.gameRule = this.baseData.gameRule;
		this.myUid = QJMJModel.myUid = UserModel.getData('uid');
		this.chairCount = this.gameRule.maxPlayerCount || 2;
		let roomData = this.baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		this.checkHeadPos();
		this.myChairId = 0;
		for (const user of userArray) {
			if (!user.userInfo) {
				user.userInfo = {
					uid: user.uid,
					chairID: user.chairID
				};
			}
			QJMJModel.otherUserJoinRoom(user);
			if (user.uid == this.myUid) {
				this.myChairId = user.chairID;
			}
		}
		this.txt_roomId.string = '游戏:綦江麻将\n房号:' + roomData.roomID;
		this.com_clock.gameInit(this.chairCount, this.myChairId);
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
		let headPos = [0, 1, 2, 3];
		if (chairCount == 2) {
			headPos = [0, 2];
		} else if (chairCount == 3) {
			headPos = [0, 1, 3];
		}
		this._userList.length = 0;
		this._handTileMgrList.length = 0;
		this._optTileMgrList.length = 0;
		this._disTileMgrList.length = 0;
		this._operActNodeList.length = 0;
		this._menTilesMgrList.length = 0;
		for (let i = 0; i < 4; i++) {
			let h = cc.find("head" + i, this.node);
			h.active = false;
		}
		for (let i = 0; i < headPos.length; i++) {
			let CurIndex = headPos[i];
			let h = cc.find("head" + CurIndex, this.node);
			this._userList.push(h.getComponent("QJMJHead"));
			this._userList[i].initRes();

			let handTile = cc.find("RootTiles/handTiles" + CurIndex, this.node);
			let optTile = cc.find("RootTiles/optTiles" + CurIndex, this.node);
			if (!optTile) {
				optTile = cc.find("optTiles" + CurIndex, handTile);
			}
			let disTile = cc.find("RootTiles/outTiles" + CurIndex, this.node);
			this._disTileMgrList.push(disTile.getComponent("QJMJOutTileMgr"));
			this._disTileMgrList[i].init(CurIndex);

			this._handTileMgrList.push(handTile.getComponent("QJMJHandTileMgr"));
			this._handTileMgrList[i].init(CurIndex);

			this._optTileMgrList.push(optTile.getComponent("QJMJOptTileMgr"));
			this._optTileMgrList[i].init(CurIndex);

			let opNode = cc.find("operAct" + CurIndex, this.node);
			this._operActNodeList.push(opNode);

			let huaTile = cc.find("RootTiles/huaTiles" + CurIndex, this.node);

			this._menTilesMgrList.push(huaTile.getComponent("QJMJMenTileMgr"));
			this._menTilesMgrList[i].init(CurIndex);
		}
	},

	initHeads() {
		if (!this.baseData) return;
		let result = this.baseData.result || [];
		for (let i = 0; i < result.length; i++) {
			const user = result[i];
			let idx = this.getUserIndexByID(user.uid);
			let com = this._userList[idx];
			com.reset();
			com.initReview(user);
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
		this._menTilesMgrList.forEach(c => {
			c.reset()
		});
		this._userList.forEach(c => {
			c.reset();
		});
		this._operActNodeList.forEach(n => {
			n.removeAllChildren()
		})
		this.com_clock.setDir(-1)
		this.com_clock.setTick(0)
		this.updatePointer();
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

	onClose() {
		this.node.destroy()
	},
});