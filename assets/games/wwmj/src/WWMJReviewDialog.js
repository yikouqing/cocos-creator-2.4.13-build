const ApiWwmj = require('./ApiWwmj');
const WWMJLogic = require('./WWMJLogic');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');
const WWMJModel = require('./WWMJModel');

cc.Class({
	extends: cc.Component,
	properties: {
		txt_roomId: cc.Label,
		txt_round: cc.Label,
		txt_last: cc.Label,
		mjResultNode: cc.Node,
		pointer: cc.Node,
		operActPfb: cc.Prefab,
		ghostCard: cc.Node,
		com_clock: require("WWMJClock"),

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
		//花牌脚本列表
		_huaTilesMgrList: [],
	},

	start() {
		if (!this.node.nodeParams.reviewRecord) {
			this.node.destroy();
			return;
		}
		this.reviewRecord = JSON.parse(JSON.stringify(this.node.nodeParams.reviewRecord));
		this._ghostCard = this.ghostCard.addComponent('WWMJSingleTile');
		this._ghostCardCPos = this.ghostCard.getPosition();
		if (!!this._ghostCard) {
			this._ghostCard.init();
			this._ghostCard.setNodeShow(false);
		}
		this.tm = 0;
		this.bureau = 0;
		this.speed = 1; //测试用
		this.index = 0;
		this.pause = false;
		this.myUid = UserModel.getData('uid');
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
		let baseData = JSON.parse(JSON.stringify(this.reviewRecord[this.bureau]));
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		this.userArray = userArray;
		this.restCardsCount = roomData.leftCount;
		this.chairCount = userArray.length;
		this.myChairId = 0;
		for (const user of userArray) {
			if (user.uid == this.myUid) {
				this.myChairId = user.chairID;
				break;
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
		for (let i = 0; i < 4; i++) {
			let h = cc.find("head" + i, this.node)
			h.active = false
		}
		for (let i = 0; i < headPos.length; i++) {
			let h = cc.find("head" + headPos[i], this.node)
			this._userList.push(h.getComponent("WWMJHead"))
			let handTile = cc.find("tiles/handTiles" + headPos[i], this.node)
			let optTile = cc.find("tiles/optTiles" + headPos[i], this.node)
			if (!optTile) {
				optTile = cc.find("optTiles" + headPos[i], handTile)
			}
			let disTile = cc.find("tiles/outTiles" + headPos[i], this.node);
			let huaTile = cc.find("tiles/huaTiles" + headPos[i], this.node);
			this._handTileMgrList.push(handTile.getComponent("WWMJHandTileMgr"))
			this._handTileMgrList[i].init(headPos[i])
			this._optTileMgrList.push(optTile.getComponent("WWMJOptTileMgr"))
			this._optTileMgrList[i].init(headPos[i])
			this._disTileMgrList.push(disTile.getComponent("WWMJOutTileMgr"))
			this._disTileMgrList[i].init(headPos[i])
			this._huaTilesMgrList.push(huaTile.getComponent("WWMJHuaTileMgr"));
			this._huaTilesMgrList[i].init(headPos[i]);
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
		let baseData = JSON.parse(JSON.stringify(this.reviewRecord[this.bureau]));
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
		AssetsManager.clearDialog(['WWMJResultDialog']);
		MessageCallback.emitMessage("reviewClear")
		this.index = 0;
		this.pause = false;
		let baseData = JSON.parse(JSON.stringify(this.reviewRecord[this.bureau]));
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
		let baseData = JSON.parse(JSON.stringify(this.reviewRecord[this.bureau]));
		if (!baseData) {
			AssetsManager.tipDialog(`暂时没有第${this.bureau + 1}局的数据`);
			--this.bureau;
			return;
		} else {
			this.resetTable()
			AssetsManager.clearDialog(['WWMJResultDialog']);
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
		let baseData = JSON.parse(JSON.stringify(this.reviewRecord[this.bureau]));
		let operateRecords = JSON.parse(JSON.stringify(baseData.operateRecords));
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		this.userArray = userArray;
		this.txt_round.string = '局数:' + (this.bureau + 1) + '/' + roomData.maxBureau;
		this.txt_roomId.string = '房号:' + roomData.roomID;
		let pengGangs = {}; /* 碰杠的牌 */
		let outOpts = {}; /* 出的牌 */
		let huaCards = roomData.huaCards || {};
		let handCards = JSON.parse(JSON.stringify(roomData.handCards)); /* 手牌 */
		for (const uid in handCards) {
			pengGangs[uid] = [];
			outOpts[uid] = [];
		}
		WWMJModel.setGhostCard(roomData.laiZiCards || 0);
		if (!!this._ghostCard && roomData.laiZiCards) {
			this._ghostCard.setNodeShow(true);
			this._ghostCard.flower = roomData.laiZiCards;
			this._ghostCard.setGhostIcon(true);
		} else {
			this._ghostCard.setNodeShow(false);
		}
		let curOpt = operateRecords[index];
		let passOpt = operateRecords[index - 1];
		//找当前ACTION发生之前的操作
		for (let i = 0; i < operateRecords.length; i++) {
			if (i > index) break;
			let item = operateRecords[i];
			if (item.operate == ApiWwmj.operateType.GET) {
				handCards[item.uid].push(item.card);
			} else if (item.operate == ApiWwmj.operateType.BU_HUA) {
				huaCards[item.uid] = huaCards[item.uid] || [];
				huaCards[item.uid].push(item.card);
			} else if (item.operate == ApiWwmj.operateType.QI) {
				handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
				outOpts[item.uid].push(item);
			} else if (item.operate == ApiWwmj.operateType.GANG_ZHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiWwmj.operateType.GET && abvOpt.uid == item.uid) {
					let gangList = item.plusInfo.cardList;
					if (!!gangList) {
						for (let idx = 0; idx < gangList.length; idx++) {
							const card = gangList[idx];
							handCards[item.uid].splice(handCards[item.uid].indexOf(card), 1);
						}
						pengGangs[item.uid].push(item);
					}
				}
			} else if (item.operate == ApiWwmj.operateType.GANG_BU) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiWwmj.operateType.GET && abvOpt.uid == item.uid) {
					for (let j = pengGangs[item.uid].length - 1; j >= 0; j--) {
						if (pengGangs[item.uid][j].operate == ApiWwmj.operateType.PENG &&
							pengGangs[item.uid][j].card == item.card) {
							pengGangs[item.uid].splice(j, 1);
							break;
						}
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiWwmj.operateType.GANG_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiWwmj.operateType.QI) {
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
			} else if (item.operate == ApiWwmj.operateType.PENG) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiWwmj.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiWwmj.operateType.CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiWwmj.operateType.QI) {
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
			} else if (item.operate == ApiWwmj.operateType.HU_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiWwmj.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
				}
			}
		}
		// console.log('当前播放数据-局数', this.bureau);
		// console.log('当前播放数据-当前OPT', index, curOpt.uid, curOpt.operate, curOpt.card);
		// console.log('当前播放数据-玩家出牌', outOpts);
		// console.log('当前播放数据-玩家手牌', handCards);
		// console.log('当前播放数据-玩家碰杠', pengGangs);
		// console.log('当前播放数据-花牌', huaCards);
		if (curOpt) {
			if (curOpt.operate == ApiWwmj.operateType.GET) {
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: Enums.bundleType.WWMJ
				});
				if (handCards[curOpt.uid].indexOf(curOpt.card) >= 0) {
					handCards[curOpt.uid].splice(handCards[curOpt.uid].indexOf(curOpt.card), 1)
				}
				let curIdx = this.getUserIndexByID(curOpt.uid);
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
				this.restCardsCount--;
			} else if (curOpt.operate == ApiWwmj.operateType.QI) {
				AssetsManager.playEffect({
					path: 'res/audio/nv/' + curOpt.card,
					bundle: Enums.bundleType.WWMJ
				});
				AssetsManager.playEffect({
					path: 'res/audio/main/push',
					bundle: Enums.bundleType.WWMJ
				});
			} else if (curOpt.operate == ApiWwmj.operateType.BU_HUA) {
				AssetsManager.playEffect({
					path: `res/audio/nv/buhua`,
					bundle: Enums.bundleType.WWMJ
				});
				this.showAni(ApiWwmj.operateType.BU_HUA, curOpt);
			} else if (ApiWwmj.operateType.HU_ZHI == curOpt.operate) {
				if (handCards[curOpt.uid].indexOf(curOpt.card) >= 0) {
					handCards[curOpt.uid].splice(handCards[curOpt.uid].indexOf(curOpt.card), 1)
				}
				let curIdx = this.getUserIndexByID(curOpt.uid);
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
				this.showAni(4, curOpt);
			} else if (ApiWwmj.operateType.HU_CHI == curOpt.operate ||
				ApiWwmj.operateType.HU_QIANG == curOpt.operate) {
				if (passOpt && passOpt.operate == ApiWwmj.operateType.QI) {
					let curIdx = this.getUserIndexByID(curOpt.uid);
					this._handTileMgrList[curIdx].setHuTile(passOpt.card);
				}
				this.showAni(3, curOpt);
			} else if (ApiWwmj.operateType.PENG == curOpt.operate) {
				this.showAni(1, curOpt);
			} else if (ApiWwmj.operateType.CHI == curOpt.operate) {
				this.showAni(0, curOpt);
			} else if (ApiWwmj.operateType.GANG_BU == curOpt.operate ||
				ApiWwmj.operateType.GANG_ZHI == curOpt.operate ||
				ApiWwmj.operateType.GANG_CHI == curOpt.operate) {
				this.showAni(2, curOpt);
			}
			let idx = this.getUserIndexByID(curOpt.uid);
			this.com_clock.setDir(idx);
			this.txt_last.string = `剩:${this.restCardsCount}张`;
			for (const uid in handCards) {
				let idx = this.getUserIndexByID(uid);
				let uHandCards = handCards[uid].slice();
				this.sortTiles(uHandCards, roomData.laiZiCards);
				this._handTileMgrList[idx].updateLieTiles(uHandCards, curOpt.card)
				this._disTileMgrList[idx].reset();
				this._disTileMgrList[idx].showOutTiles(outOpts[uid]);
				this._optTileMgrList[idx].updateOptTiles(pengGangs[uid]);
				this._huaTilesMgrList[idx].huaCardsSync(huaCards[uid]);
			}
		}

		if (index == operateRecords.length - 1) {
			/* 显示结算界面 */
			let msg = {
				path: "res/prefab/WWMJResultDialog",
				bundle: Enums.bundleType.WWMJ,
				result: baseData.result,
				parent: this.mjResultNode,
				isReview: true,
			}
			AssetsManager.createDialog(msg)
		} else {
			AssetsManager.clearDialog(['WWMJResultDialog']);
		}
	},

	/**手牌排序 */
	sortTiles(tileIdList, ghostCard) {
		if (tileIdList && tileIdList.length > 0) {
			tileIdList.sort((a, b) => a - b)
			/**找出癞子和定缺的牌*/
			let laizi = [];
			let dingque = [];
			for (let i = 0; i < tileIdList.length; i++) {
				const t = tileIdList[i];
				let isDel = false
				if (ghostCard == t) {
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

		this.com_clock.setDir(-1)
		this.com_clock.setTick(0)
		this.updatePointer();
		this._huaTilesMgrList.forEach(c => {
			c.reset();
		});
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
		if (type == ApiWwmj.operateType.YOU_JIN ||
			type == ApiWwmj.operateType.SAN_JIN) {
			audioType = 4; //强制转换音效为自摸音效
		}
		if (audioType < typeNameList.length) {
			AssetsManager.playEffect({
				path: `res/audio/nv/${typeNameList[audioType]}`,
				bundle: Enums.bundleType.WWMJ
			});
		}
		let idx = this.getUserIndexByID(data.uid)
		/**展示动画 */
		let optNode = cc.instantiate(this.operActPfb);
		optNode.parent = this._operActNodeList[idx]
		let com = optNode.getComponent('WWMJOperAct')
		com.showOpt(type);
		/**展示刮风和下雨 */
		// if (type == 2) {
		// 	let t = 5;
		// 	if (data.operate === ApiWwmj.operateType.GANG_ZHI) {
		// 		t = 7; //下雨
		// 	}
		// 	let fengNode = cc.instantiate(this.operActPfb);
		// 	fengNode.parent = this.node;
		// 	let fcom = fengNode.getComponent("WWMJOperAct");
		// 	fcom.showOpt(t);
		// } else {
		// 	optNode.scale = 0.8;
		// }
	},

	/**展示胡牌序列 */
	showHuIdx(data) {

	},


	initHeads() {
		let baseData = JSON.parse(JSON.stringify(this.reviewRecord[this.bureau]));
		let operateRecords = baseData.operateRecords;
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		this.userArray = userArray;
		for (let i = 0; i < userArray.length; i++) {
			const user = userArray[i];
			let idx = this.getUserIndex(user.chairID);
			let com = this._userList[idx];
			com.initReview(user);
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