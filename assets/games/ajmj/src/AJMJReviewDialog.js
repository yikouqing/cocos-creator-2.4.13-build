const ApiAjmj = require('./ApiAjmj');
const AJMJLogic = require('./AJMJLogic');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');
const AJMJModel = require('./AJMJModel');

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
		com_clock: require("AJMJClock"),
		com_caiShen: require("AJMJCaiShen"),
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
		_huaTileMgrList: [],
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
		AJMJModel.myUid = this.myUid
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
		AJMJModel.gameRule = baseData.plusInfo.gameRule
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		this.userArray = userArray;
		this.restCardsCount = roomData.leftCount;
		this.chairCount = userArray.length;
		this.myChairId = 0;
		for (const user of userArray) {
			AJMJModel.otherUserJoinRoom(user)
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
		this._huaTileMgrList.length = 0;
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
			this._userList.push(headNode.getComponent("AJMJHead"));
			this._userList[i].initRes();
			let handTile = cc.find("tableInfo/handTiles" + idx, this.node);
			let optTile = cc.find("tableInfo/optTiles" + idx, this.node);
			if (!optTile) {
				optTile = cc.find("optTiles" + idx, handTile);
			}
			let disTile = cc.find("tableInfo/outTiles" + idx, this.node);
			let huaTiles = cc.find("tableInfo/huaTiles" + idx, this.node);
			this._handTileMgrList.push(handTile.getComponent("AJMJHandTileMgr"));
			this._handTileMgrList[i].init(idx);
			this._optTileMgrList.push(optTile.getComponent("AJMJOptTileMgr"));
			this._optTileMgrList[i].init(i);
			this._disTileMgrList.push(disTile.getComponent("AJMJOutTileMgr"));
			this._disTileMgrList[i].init(idx);
			this._huaTileMgrList.push(huaTiles.getComponent("AJMJHuaTileMgr"));
			this._huaTileMgrList[i].init(i);
			let opNode = cc.find("operAct" + idx, this.node);
			this._operActNodeList.push(opNode);
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
		AssetsManager.clearDialog(['AJMJResultDialog']);
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
			AssetsManager.clearDialog(['AJMJResultDialog']);
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
		this.userArray = roomData.userArray;
		let gameRule = roomData.gameRule;

		if (index == 0) {
			// console.log('局数:' + (this.bureau + 1), "baseData", baseData)
			this.txt_round.string = '局数:' + (this.bureau + 1) + '/' + roomData.maxBureau;
			this.txt_roomId.string = '房号:' + roomData.roomID;
			AJMJModel.setGhostCard(roomData.laiZiCards);
			AJMJModel.setFanCard(roomData.fanCard);
			this.com_caiShen.showCaiShen(true);
		}

		let outOpts = {}; /* 出的牌 */
		let pengGangs = {}; /* 碰杠的牌 */
		let huaCards = {};
		let handCards = Utils.deepCopy(roomData.handCards); /* 手牌 */
		for (const uid in handCards) {
			pengGangs[uid] = [];
			outOpts[uid] = [];
			huaCards[uid] = [];
		}
		let curOpt = operateRecords[index];
		let passOpt = operateRecords[index - 1];
		// console.log(index, "curOpt", curOpt)
		//找当前ACTION发生之前的操作
		for (let i = 0; i < operateRecords.length; i++) {
			if (i > index) break;
			let item = operateRecords[i];
			if (item.operate == ApiAjmj.operateType.GET) {
				handCards[item.uid].push(item.card);
			} else if (item.operate == ApiAjmj.operateType.BUHUA) {
				if (item.plusInfo && item.plusInfo.curHua) {
					huaCards[item.uid].push(item.plusInfo.curHua);
					if (handCards[item.uid].indexOf(item.plusInfo.curHua) >= 0) {
						handCards[item.uid].splice(handCards[item.uid].indexOf(item.plusInfo.curHua), 1);
					}
				}
			} else if (item.operate == ApiAjmj.operateType.QI) {
				handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
				outOpts[item.uid].push(item);
			} else if (item.operate == ApiAjmj.operateType.GANG_ZHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiAjmj.operateType.GET && abvOpt.uid == item.uid) {
					let gangList = item.plusInfo.cardList;
					if (!!gangList) {
						for (let idx = 0; idx < gangList.length; idx++) {
							const card = gangList[idx];
							handCards[item.uid].splice(handCards[item.uid].indexOf(card), 1);
						}
						pengGangs[item.uid].push(item);
					}
				}
			} else if (item.operate == ApiAjmj.operateType.GANG_BU) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiAjmj.operateType.GET && abvOpt.uid == item.uid) {
					for (let j = pengGangs[item.uid].length - 1; j >= 0; j--) {
						if (pengGangs[item.uid][j].operate == ApiAjmj.operateType.PENG &&
							pengGangs[item.uid][j].card == item.card) {
							pengGangs[item.uid].splice(j, 1);
							break;
						}
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiAjmj.operateType.GANG_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiAjmj.operateType.QI) {
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
			} else if (item.operate == ApiAjmj.operateType.PENG) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiAjmj.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiAjmj.operateType.CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiAjmj.operateType.QI) {
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
			} else if (item.operate == ApiAjmj.operateType.HU_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiAjmj.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
				}
			}
		}
		// console.log(index, curOpt.uid, "显示手牌111", handCards[curOpt.uid]);
		if (curOpt) {
			let curIndex = this.getUserIndexByID(curOpt.uid);
			if (curOpt.operate == ApiAjmj.operateType.GET) {
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: Enums.bundleType.AJMJ
				});
				if (curOpt.plusInfo && curOpt.plusInfo.userCards) {
					let userCards = curOpt.plusInfo.userCards || [];
					if (userCards.length) handCards[curOpt.uid] = userCards.slice();
				}
				if (handCards[curOpt.uid].indexOf(curOpt.card) >= 0) {
					handCards[curOpt.uid].splice(handCards[curOpt.uid].indexOf(curOpt.card), 1);
				}
				this.restCardsCount--;
				this._handTileMgrList[curIndex].setHuTile(curOpt.card);
			} else if (curOpt.operate == ApiAjmj.operateType.QI) {
				let ghostCard = AJMJModel.getGhostCard();
				if (ghostCard.includes(curOpt.card)) {
					this.syncViewAudio(curIndex, 'piao');
					this.showOptAinm(curIndex, (ctrl) => {
						ctrl.showOpt(0, null, true);
					});
				} else {
					AssetsManager.playEffect({
						path: 'res/audio/nv/' + curOpt.card,
						bundle: Enums.bundleType.AJMJ
					});
				}
				AssetsManager.playEffect({
					path: 'res/audio/main/push',
					bundle: Enums.bundleType.AJMJ
				});
			} else if (ApiAjmj.operateType.HU_ZHI == curOpt.operate) {
				if (handCards[curOpt.uid].indexOf(curOpt.card) >= 0) {
					handCards[curOpt.uid].splice(handCards[curOpt.uid].indexOf(curOpt.card), 1)
				}
				let curIdx = this.getUserIndexByID(curOpt.uid);
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
				this.showAni(4, curOpt);
			} else if (ApiAjmj.operateType.HU_CHI == curOpt.operate ||
				ApiAjmj.operateType.HU_QIANG == curOpt.operate) {
				if (passOpt && passOpt.operate == ApiAjmj.operateType.QI) {
					let curIdx = this.getUserIndexByID(curOpt.uid);
					this._handTileMgrList[curIdx].setHuTile(passOpt.card);
				}
				this.showAni(3, curOpt);
			} else if (ApiAjmj.operateType.PENG == curOpt.operate) {
				this.showAni(1, curOpt);
			} else if (ApiAjmj.operateType.CHI == curOpt.operate) {
				this.showAni(0, curOpt);
			} else if (ApiAjmj.operateType.GANG_BU == curOpt.operate ||
				ApiAjmj.operateType.GANG_ZHI == curOpt.operate ||
				ApiAjmj.operateType.GANG_CHI == curOpt.operate) {
				this.showAni(2, curOpt);
			} else if (curOpt.operate == ApiAjmj.operateType.BUHUA) {
				this.syncViewAudio(curIndex, 'gang');
				this.showOptAinm(curIndex, (ctrl) => {
					ctrl.showOpt(8);
				});
			}
			// console.log(index, curOpt.uid, "显示手牌222", handCards[curOpt.uid]);
			this.com_clock.setDir(curIndex);
			this.txt_last.string = this.restCardsCount + ""
			let tg = this._tuoguanList[curIndex]
			if (tg && typeof (curOpt.isAuto) == "boolean") {
				tg.active = curOpt.isAuto
			}
			for (const uid in handCards) {
				let idx = this.getUserIndexByID(uid);
				this._disTileMgrList[idx].reset();
				this._huaTileMgrList[idx].huaCardsSync(huaCards[uid]);
				this._optTileMgrList[idx].updateOptTiles(pengGangs[uid]);
				let curHandCards = AJMJModel.sortTiles(handCards[uid].slice());
				let last = this._disTileMgrList[idx].showOutTiles(outOpts[uid]);
				this._handTileMgrList[idx].updateLieTiles(curHandCards, curOpt.card);
				if (uid == curOpt.uid && curOpt.operate == ApiAjmj.operateType.QI) {
					this.updatePointer(last.node)
				} else {
					this.updatePointer()
				}
			}
		}

		if (index == operateRecords.length - 1) {
			/* 显示结算界面 */
			let resData = Utils.deepCopy(baseData)
			resData.path = "res/prefab/AJMJResultDialog"
			resData.bundle = Enums.bundleType.AJMJ
			resData.parent = this.mjResultNode
			resData.isReview = true
			AssetsManager.createDialog(resData);
		} else {
			AssetsManager.clearDialog(['AJMJResultDialog']);
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
		this._huaTileMgrList.forEach(c => {
			c.reset()
		})
		this._userList.forEach(c => {
			c.setBanker(false)
			c.setLight(false)
		});
		this._operActNodeList.forEach(n => {
			n.removeAllChildren()
		})

		this.com_clock.setDir(-1)
		this.com_clock.setTick(0)
		this.com_caiShen.reset()
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
				bundle: Enums.bundleType.AJMJ
			});
		}
		let idx = this.getUserIndexByID(data.uid)
		/**展示动画 */
		let optNode = cc.instantiate(this.operActPfb);
		optNode.parent = this._operActNodeList[idx]
		let com = optNode.getComponent('AJMJOperAct')
		com.showOpt(type, () => {
			/**展示牌型 */
			if (type >= 3) {
				let optNode = cc.instantiate(this.operActPfb);
				optNode.parent = this._operActNodeList[idx]
				let com = optNode.getComponent('AJMJOperAct')
				com.showHuType(data.plusInfo.huPaiType)
			}
		});
	},

	syncViewAudio(viewID, audioName) {
		let user = null;
		if (this._userList[viewID]) {
			user = this._userList[viewID].getUserData();
		}
		let sex = user && user.userInfo.sex == 0 ? 'nan' : 'nv';
		AssetsManager.playEffect({
			bundle: Enums.bundleType.AJMJ,
			path: `res/audio/${sex}/${audioName}`,
		});
	},

	showOptAinm(index, funs) {
		if (!this._operActNodeList[index]) return;
		let optNode = cc.instantiate(this.operActPfb);
		optNode.parent = this._operActNodeList[index];
		let optCtrl = optNode.getComponent('AJMJOperAct');
		if (funs && optCtrl) funs(optCtrl);
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