const ApiEnsmj = require('./ApiEnsmj');
const ENSMJLogic = require('./ENSMJLogic');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');
const ENSMJModel = require('./ENSMJModel');

cc.Class({
	extends: cc.Component,
	properties: {
		txt_roomId: cc.Label,
		txt_round: cc.Label,
		txt_last: cc.Label,
		mjResultNode: cc.Node,
		operActPfb: cc.Prefab,
		com_clock: require("ENSMJClock"),

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
		if (!this.node.nodeParams.reviewRecord) {
			this.node.destroy();
			return;
		}
		this.reviewRecord = Utils.deepCopy(this.node.nodeParams.reviewRecord)
		this.tm = 0;
		this.bureau = 0;
		this.speed = 1; //测试用
		this.index = 0;
		this.pause = false;
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

		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau]);
		this.myUid = UserModel.getData('uid');
		let roomData = baseData.baseRoomRecords;
		this.restCardsCount = roomData.leftCount;
		let userArray = roomData.userArray;
		let gameRule = roomData.gameRule;
		this.userArray = userArray;
		this.myChairId = 0;
		for (const user of userArray) {
			if (user.uid == this.myUid) {
				this.myChairId = user.chairID;
				break;
			}
		}
		this.chairCount = gameRule.maxPlayerCount || 2;
		this.com_clock.gameInit(this.chairCount, this.myChairId);
		this.checkHeadPos();
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

	setPlay(index) {
		// return
		if (!!this._handTileMgrList) {
			for (let i = 0; i < this._handTileMgrList.length; i++) {
				this._handTileMgrList[i].setHuTile(null);
			}
		}
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau]);
		let operateRecords = Utils.deepCopy(baseData.operateRecords);
		// index == 0 && console.log("当局==》baseData", baseData);
		let roomData = baseData.baseRoomRecords;
		let passOpt = operateRecords[index - 1];
		let userArray = roomData.userArray || [];
		let curOpt = operateRecords[index];
		let gameRule = roomData.gameRule;
		let result = baseData.result;
		this.userArray = userArray;

		if (index == 0) {
			this.txt_round.string = '局数:' + (this.bureau + 1) + '/' + roomData.maxBureau;
			ENSMJModel.setPilaiCardBegin(roomData.pilaiCardBegin);
			this.txt_roomId.string = '房号:' + roomData.roomID;
			ENSMJModel.setAllOperateRecords(operateRecords);
			ENSMJModel.setGhostCard(roomData.laiZiCards);
			// this.com_clock.showPiLai(true);
		}
		/* 手牌 */
		let handCards = Utils.deepCopy(roomData.handCards);
		/**碰杠的牌 */
		let pengGangs = {};
		/**出的牌 */
		let outOpts = {};
		/**摆的牌 */
		let baiCards = {};
		/**胡的牌 */
		let huCards = {};
		for (const uid in handCards) {
			pengGangs[uid] = [];
			baiCards[uid] = [];
			outOpts[uid] = [];
			huCards[uid] = -1;
		}

		//找当前ACTION发生之前的操作
		for (let i = 0; i < operateRecords.length; i++) {
			if (i > index || index == 0) break;
			let upOpt = operateRecords[i - 1];
			let curObj = operateRecords[i];
			if (curObj.operate == ApiEnsmj.operateType.GET) {
				handCards[curObj.uid].push(curObj.card);
			} else if (curObj.operate == ApiEnsmj.operateType.QI) {
				handCards[curObj.uid].splice(handCards[curObj.uid].indexOf(curObj.card), 1);
				outOpts[curObj.uid].push(curObj);
			} else if (curObj.operate == ApiEnsmj.operateType.GANG_ZHI) {
				if (!!upOpt && upOpt.operate == ApiEnsmj.operateType.GET && upOpt.uid == curObj.uid) {
					let gangList = curObj.plusInfo.cardList;
					if (!!gangList) {
						for (let idx = 0; idx < gangList.length; idx++) {
							const card = gangList[idx];
							handCards[curObj.uid].splice(handCards[curObj.uid].indexOf(card), 1);
						}
						pengGangs[curObj.uid].push(curObj);
					}
				}
			} else if (curObj.operate == ApiEnsmj.operateType.GANG_BU) {
				if (!!upOpt && upOpt.operate == ApiEnsmj.operateType.GET && upOpt.uid == curObj.uid) {
					for (let j = pengGangs[curObj.uid].length - 1; j >= 0; j--) {
						if (pengGangs[curObj.uid][j].operate == ApiEnsmj.operateType.PENG &&
							pengGangs[curObj.uid][j].card == curObj.card) {
							pengGangs[curObj.uid].splice(j, 1);
							break;
						}
					}
					handCards[curObj.uid].splice(handCards[curObj.uid].indexOf(curObj.card), 1);
					pengGangs[curObj.uid].push(curObj);
				}
			} else if (curObj.operate == ApiEnsmj.operateType.GANG_CHI) {
				if (!!upOpt && upOpt.operate == ApiEnsmj.operateType.QI) {
					if (!!outOpts[upOpt.uid] &&
						!!outOpts[upOpt.uid][outOpts[upOpt.uid].length - 1] &&
						outOpts[upOpt.uid][outOpts[upOpt.uid].length - 1].card == curObj.card) {
						outOpts[upOpt.uid].pop();
					}
					let gangList = curObj.plusInfo.cardList.slice()
					gangList.splice(gangList.indexOf(curObj.card), 1)
					for (let idx = 0; idx < gangList.length; idx++) {
						const card = gangList[idx];
						handCards[curObj.uid].splice(handCards[curObj.uid].indexOf(card), 1);
					}
					pengGangs[curObj.uid].push(curObj);
				}
			} else if (curObj.operate == ApiEnsmj.operateType.PENG) {
				if (!!upOpt && upOpt.operate == ApiEnsmj.operateType.QI) {
					if (!!outOpts[upOpt.uid] &&
						!!outOpts[upOpt.uid][outOpts[upOpt.uid].length - 1] &&
						outOpts[upOpt.uid][outOpts[upOpt.uid].length - 1].card == curObj.card) {
						outOpts[upOpt.uid].pop();
					}
					handCards[curObj.uid].splice(handCards[curObj.uid].indexOf(curObj.card), 1);
					handCards[curObj.uid].splice(handCards[curObj.uid].indexOf(curObj.card), 1);
					pengGangs[curObj.uid].push(curObj);
				}
			} else if (curObj.operate == ApiEnsmj.operateType.CHI) {
				if (!!upOpt && upOpt.operate == ApiEnsmj.operateType.QI) {
					if (!!outOpts[upOpt.uid] &&
						!!outOpts[upOpt.uid][outOpts[upOpt.uid].length - 1] &&
						outOpts[upOpt.uid][outOpts[upOpt.uid].length - 1].card == curObj.card) {
						outOpts[upOpt.uid].pop();
					}
					let cardList = curObj.plusInfo.cardList.slice()
					cardList.splice(cardList.indexOf(curObj.card), 1)
					for (let i = 0; i < cardList.length; i++) {
						let idx = handCards[curObj.uid].indexOf(cardList[i])
						handCards[curObj.uid].splice(idx, 1);
					}
					pengGangs[curObj.uid].push(curObj);
				}
			} else if (curObj.operate == ApiEnsmj.operateType.HU_CHI) {
				if (!!upOpt && upOpt.operate == ApiEnsmj.operateType.QI) {
					if (!!outOpts[upOpt.uid] &&
						!!outOpts[upOpt.uid][outOpts[upOpt.uid].length - 1] &&
						outOpts[upOpt.uid][outOpts[upOpt.uid].length - 1].card == curObj.card) {
						outOpts[upOpt.uid].pop();
					}
				}
				huCards[curObj.uid] = curObj.card
			} else if (curObj.operate == ApiEnsmj.operateType.HU_ZHI) {
				let h = handCards[curObj.uid]
				let huidx = h.indexOf(curObj.card)
				if (huidx != -1) {
					h.splice(huidx, 1)
				}
				huCards[curObj.uid] = curObj.card
			} else if (curObj.operate == ApiEnsmj.operateType.BU_PILAI) {
				if (!!curObj.uid && !!curObj.card) {
					let huidx = handCards[curObj.uid].indexOf(curObj.card);
					if (huidx != -1) handCards[curObj.uid].splice(huidx, 1);
					baiCards[curObj.uid].push(curObj.card);
					outOpts[upOpt.uid].pop();
				}
			}
		}

		// console.log("当前数据》局数：" + (this.bureau + 1), "总条》" + operateRecords.length, "当前》" + index,);
		// curOpt && console.log('当前操作》玩家：', curOpt.uid, "操作牌》", curOpt.card, '操作类型》', curOpt.operate, curOpt);
		// console.log('当前牌值》\n出牌》', outOpts, '\n手牌》', handCards, '\n碰杠》', pengGangs);

		if (curOpt) {
			let CurOptUid = curOpt.uid;
			let plusInfo = curOpt.plusInfo || {};
			let CurOptIndex = this.getUserIndexByID(CurOptUid);
			this.txt_last.string = `${this.restCardsCount}`;
			this.com_clock.setDir(CurOptIndex);
			if (curOpt.operate == ApiEnsmj.operateType.GET) {
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: Enums.bundleType.ENSMJ
				});
				if (handCards[CurOptUid].indexOf(curOpt.card) >= 0) {
					handCards[CurOptUid].splice(handCards[CurOptUid].indexOf(curOpt.card), 1)
				}
				this._handTileMgrList[CurOptIndex].setHuTile(curOpt.card);
				this.restCardsCount--;
			} else if (curOpt.operate == ApiEnsmj.operateType.QI) {
				AssetsManager.playEffect({
					bundle: Enums.bundleType.ENSMJ,
					path: 'res/audio/nv/' + curOpt.card,
				});
				AssetsManager.playEffect({
					path: 'res/audio/main/push',
					bundle: Enums.bundleType.ENSMJ
				});
			} else if (ApiEnsmj.operateType.HU_CHI == curOpt.operate ||
				ApiEnsmj.operateType.HU_QIANG == curOpt.operate) {
				this.showAni(3, curOpt);
			} else if (ApiEnsmj.operateType.HU_ZHI == curOpt.operate) {
				this.showAni(4, curOpt);
			} else if (ApiEnsmj.operateType.PENG == curOpt.operate) {
				this.showAni(1, curOpt);
			} else if (ApiEnsmj.operateType.CHI == curOpt.operate) {
				this.showAni(0, curOpt);
			} else if (ApiEnsmj.operateType.GANG_BU == curOpt.operate ||
				ApiEnsmj.operateType.GANG_ZHI == curOpt.operate ||
				ApiEnsmj.operateType.GANG_CHI == curOpt.operate) {
				this.showAni(2, curOpt);
			} else if (ApiEnsmj.operateType.BU_PILAI == curOpt.operate) {
				if (curOpt.uid && curOpt.card) {
					this._handTileMgrList[CurOptIndex].showPiLai(baiCards[CurOptUid]);
					this.showAni(2, curOpt);
				} else {//播放动画
					this.pause = true;
					AssetsManager.createDialog({
						path: "res/prefab/ENSMJFanPai",
						bundle: Enums.bundleType.ENSMJ,
						parent: this.mjResultNode,
						callback: () => {
							this.com_clock.showPiLai(true);
							this.pause = false;
						},
					});
				}
			}

			for (const uid in handCards) {
				let huId = huCards[uid]
				let idx = this.getUserIndexByID(uid);
				this._disTileMgrList[idx].reset();
				this._disTileMgrList[idx].showOutTiles(outOpts[uid]);
				this._optTileMgrList[idx].updateOptTiles(pengGangs[uid]);
				if (huId != -1) this._handTileMgrList[idx].setHuTile(huId);
				let curHandCards = ENSMJModel.sortTiles(uid, handCards[uid].slice());
				this._handTileMgrList[idx].updateLieTiles(curHandCards, curOpt.card);
			}
		}

		if (index == operateRecords.length - 1) {
			let createResultDialog = () => {
				let msg = {
					isReview: true,
					parent: this.mjResultNode,
					bundle: Enums.bundleType.ENSMJ,
					path: "res/prefab/ENSMJResultDialog",
				}
				AssetsManager.createDialog(Object.assign(msg, baseData))
			}
			this.scheduleOnce(createResultDialog, 1);
		} else {
			AssetsManager.clearDialog(['ENSMJFanPai', 'ENSMJResultDialog']);
		}
	},


	showOperAct(uid, funs, showNode) {
		if (!showNode) {
			let idx = this.getUserIndexByID(uid);
			showNode = this._operActNodeList[idx];
		}
		if (showNode) {
			let optNode = cc.instantiate(this.operActPfb);
			let CtrlAct = optNode.getComponent('ENSMJOperAct');
			optNode.parent = showNode;
			if (funs) funs(CtrlAct);
		}
	},

	/**
	 * 同步用户
	 * @param {*} uid 
	 * @param {*} funs 
	 */
	_syncUser(uid, funs) {
		let idx = this.getUserIndexByID(uid);
		let Ctrl = this._userList[idx];
		if (Ctrl && funs) funs(Ctrl);
	},

	/**展示动画和声音 */
	showAni(type, data) {
		let typeNameList = ["chi", "peng", "gang", "hu", "zimo"]
		/**声音 */
		let audioType = type;
		if (audioType < typeNameList.length) {
			AssetsManager.playEffect({
				path: `res/audio/nv/${typeNameList[audioType]}`,
				bundle: Enums.bundleType.ENSMJ
			});
		}
		if (this._JiPaiAinm) {
			this._JiPaiAinm = false;
			return
		}
		let idx = this.getUserIndexByID(data.uid)
		/**展示动画 */
		let optNode = cc.instantiate(this.operActPfb);
		optNode.parent = this._operActNodeList[idx]
		let com = optNode.getComponent('ENSMJOperAct')
		com.showOpt(type);
		/**展示刮风和下雨 */
		if (type == 2) {
			let t = 5;
			if (data.operate === ApiEnsmj.operateType.GANG_ZHI) {
				t = 7; //下雨
			}
			let fengNode = cc.instantiate(this.operActPfb);
			fengNode.parent = this.node;
			let fcom = fengNode.getComponent("ENSMJOperAct");
			fcom.showOpt(t);
		} else {
			optNode.scale = 0.8;
		}
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
			this._userList.push(h.getComponent("ENSMJHead"));
			this._userList[i].initRes();

			let handTile = cc.find("RootTiles/handTiles" + CurIndex, this.node);
			let optTile = cc.find("RootTiles/optTiles" + CurIndex, this.node);
			if (!optTile) {
				optTile = cc.find("optTiles" + CurIndex, handTile);
			}
			let disTile = cc.find("RootTiles/outTiles" + CurIndex, this.node);
			this._disTileMgrList.push(disTile.getComponent("ENSMJOutTileMgr"));
			this._disTileMgrList[i].init(CurIndex);

			this._handTileMgrList.push(handTile.getComponent("ENSMJHandTileMgr"));
			this._handTileMgrList[i].init(CurIndex);

			this._optTileMgrList.push(optTile.getComponent("ENSMJOptTileMgr"));
			this._optTileMgrList[i].init(CurIndex);

			let opNode = cc.find("operAct" + CurIndex, this.node);
			this._operActNodeList.push(opNode);
		}
	},
	initHeads() {
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau])
		let roomData = baseData.baseRoomRecords;
		this.userArray = roomData.userArray;
		let result = baseData.result;
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
		this._operActNodeList.forEach(n => {
			n.removeAllChildren()
		});
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
		this.initHeads();
		this.index = 0;
		this.pause = false;
		AssetsManager.clearDialog(['ENSMJResultDialog', "ENSMJFanPai"]);
		MessageCallback.emitMessage("reviewClear");
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau])
		let roomData = baseData.baseRoomRecords;
		this.restCardsCount = roomData.leftCount;
		let userArray = roomData.userArray;
		this.userArray = userArray;
		this.setPlay(this.index);
	},

	nextBureau(event) {
		if (event) {

			this.showButtons();
		}
		this.bureau++;
		if (!this.reviewRecord[this.bureau]) {
			this.bureau = this.reviewRecord.length - 1;
			AssetsManager.tipDialog('当前已是最后一局！');
			return;
		}
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau])
		if (!baseData) {
			AssetsManager.tipDialog(`暂时没有第${this.bureau + 1}局的数据`);
			--this.bureau;
			return;
		} else {
			this.resetTable()
			AssetsManager.clearDialog(['ENSMJResultDialog', "ENSMJFanPai"]);
			MessageCallback.emitMessage("reviewClear");
			let roomData = baseData.baseRoomRecords;
			this.index = 0;
			this.pause = false;
			this.userArray = roomData.userArray;
			this.restCardsCount = roomData.leftCount;

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

	onClose() {
		AssetsManager.clearDialog(['ENSMJResultDialog', "ENSMJFanPai"]);
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