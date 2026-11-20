const ApiBpmj = require('./ApiBpmj');
const BPMJLogic = require('./BPMJLogic');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');
const BPMJModel = require('./BPMJModel');

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

		headLeft: cc.Prefab,
		headRight: cc.Prefab,
		com_clock: require("BPMJClock"),

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

	start() {
		if (!this.node.nodeParams.reviewRecord) {
			this.node.destroy();
			return;
		}
		this.tm = 0;
		this.bureau = 0;
		this.myUid = UserModel.getData('uid');
		this.reviewRecord = JSON.parse(JSON.stringify(this.node.nodeParams.reviewRecord));
		this._ghostCard = this.ghostCard.addComponent('BPMJSingleTile');
		this._ghostCardCPos = this.ghostCard.getPosition();
		if (!!this._ghostCard) {
			this._ghostCard.init();
			this._ghostCard.setNodeShow(false);
		}
		this.showCurBureau(true);
	},
	/**
	 * 显示当前局
	 * @param {*} isInitSet 初始进入处理
	 * @returns 
	 */
	showCurBureau(isInitSet = false) {
		let baseData = JSON.parse(JSON.stringify(this.reviewRecord[this.bureau]));
		if (!baseData) {
			AssetsManager.popDialog({
				content: isInitSet ? '视频数据异常，请稍候再试！' : `暂时没有第${this.bureau + 1}的数据`,
				ok: () => { isInitSet && this.node.destroy(); },
			});
			return;
		} else {
			this.index = 0;//第几手
			this.speed = 1;//初始速度
			this.pause = false;//暂停/继续
			AssetsManager.destroyDialog({
				bundle: Enums.bundleType.BPMJ,
				path: 'res/prefab/BPMJResultDialog',
			});
			MessageCallback.emitMessage("reviewClear");
			let roomData = baseData.baseRoomRecords;
			this.operateRecords = baseData.operateRecords || [];
			this.userArray = roomData.userArray || [];
			this.restCardsCount = roomData.leftCount;
			this.chairCount = this.userArray.length;
			if (isInitSet) {
				this.myChairId = 0;
				for (const user of this.userArray) {
					if (user.uid == this.myUid) {
						this.myChairId = user.chairID;
						break;
					}
				}

				this.com_clock.gameInit(this.chairCount, this.myChairId);
				this.txt_roomId.string = '房号:' + roomData.roomID;
				BPMJModel.setGhostCard(roomData.laiZiCards || 0);
				BPMJModel.setGameRule(roomData.gameRule);
				BPMJModel.setRoomID(roomData.roomID);
				this.checkHeadPos();
				this.showButtons();
				this.resetTable();
			}
			this.initHeads();
			this.setPlay(this.index);
		}
	},

	initHeads() {
		for (let i = 0; i < this.userArray.length; i++) {
			const user = this.userArray[i];
			let idx = this.getUserIndex(user.chairID);
			let com = this._userList[idx];
			com && com.initReview(user);
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
		let roomData = JSON.parse(JSON.stringify(baseData.baseRoomRecords));
		let handCards = JSON.parse(JSON.stringify(roomData.handCards)); /* 手牌 */
		if (index == 0) {//第一手
			if (!!this._ghostCard && roomData.laiZiCards) {
				this._ghostCard.setNodeShow(true);
				this._ghostCard.flower = roomData.laiZiCards;
				this._ghostCard.setGhostIcon(true);
			} else {
				this._ghostCard.setNodeShow(false);
			}
			this.com_clock.showDiceVal(true, roomData.dice1, roomData.dice2);
			BPMJModel.setDiceInif({ dice1: roomData.dice1, dice2: roomData.dice2 });
			this.txt_round.string = '局数:' + (this.bureau + 1) + '/' + roomData.maxBureau;
		}

		let pengGangs = {}; /* 碰杠的牌 */
		let outOpts = {}; /* 出的牌 */
		let huaCards = roomData.huaCards || {};
		for (const uid in handCards) {
			pengGangs[uid] = [];
			outOpts[uid] = [];
		}

		//找当前ACTION发生之前的操作
		for (let i = 0; i < operateRecords.length; i++) {
			if (i > index) break;
			let item = operateRecords[i];
			if (item.operate == ApiBpmj.operateType.GET) {
				handCards[item.uid].push(item.card);
			} else if (item.operate == ApiBpmj.operateType.BU_HUA) {
				huaCards[item.uid] = huaCards[item.uid] || [];
				huaCards[item.uid].push(item.card);
			} else if (item.operate == ApiBpmj.operateType.QI) {
				handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
				outOpts[item.uid].push(item);
			} else if (item.operate == ApiBpmj.operateType.GANG_ZHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiBpmj.operateType.GET && abvOpt.uid == item.uid) {
					let gangList = item.plusInfo.cardList;
					if (!!gangList) {
						for (let idx = 0; idx < gangList.length; idx++) {
							const card = gangList[idx];
							handCards[item.uid].splice(handCards[item.uid].indexOf(card), 1);
						}
						pengGangs[item.uid].push(item);
					}
				}
			} else if (item.operate == ApiBpmj.operateType.GANG_BU) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiBpmj.operateType.GET && abvOpt.uid == item.uid) {
					for (let j = pengGangs[item.uid].length - 1; j >= 0; j--) {
						if (pengGangs[item.uid][j].operate == ApiBpmj.operateType.PENG &&
							pengGangs[item.uid][j].card == item.card) {
							pengGangs[item.uid].splice(j, 1);
							break;
						}
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiBpmj.operateType.GANG_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiBpmj.operateType.QI) {
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
			} else if (item.operate == ApiBpmj.operateType.PENG) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiBpmj.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiBpmj.operateType.CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiBpmj.operateType.QI) {
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
			} else if (item.operate == ApiBpmj.operateType.HU_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiBpmj.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
				}
			}
		}

		let curOpt = operateRecords[index];
		let passOpt = operateRecords[index - 1];
		// console.log('当前播放数据-局数', this.bureau, "roomData", roomData, "curOpt", curOpt);
		// console.log('当前播放数据-当前OPT', index, curOpt.uid, curOpt.operate, curOpt.card);
		// console.log('当前播放数据-玩家手牌', handCards);
		// console.log('当前播放数据-玩家碰杠', pengGangs);
		// console.log('当前播放数据-玩家出牌', outOpts);
		// console.log('当前播放数据-花牌', huaCards);

		if (curOpt) {
			if (curOpt.operate == ApiBpmj.operateType.GET) {
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: Enums.bundleType.BPMJ
				});
				if (handCards[curOpt.uid].indexOf(curOpt.card) >= 0) {
					handCards[curOpt.uid].splice(handCards[curOpt.uid].indexOf(curOpt.card), 1)
				}
				this.restCardsCount--;
				let curIdx = this.getUserIndexByID(curOpt.uid);
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
			} else if (curOpt.operate == ApiBpmj.operateType.QI) {
				AssetsManager.playEffect({
					path: 'res/audio/nv/' + curOpt.card,
					bundle: Enums.bundleType.BPMJ
				});
				AssetsManager.playEffect({
					path: 'res/audio/main/push',
					bundle: Enums.bundleType.BPMJ
				});
			} else if (curOpt.operate == ApiBpmj.operateType.BU_HUA) {
				AssetsManager.playEffect({
					path: `res/audio/nv/buhua`,
					bundle: Enums.bundleType.BPMJ
				});
				this.showAni(ApiBpmj.operateType.BU_HUA, curOpt);
			} else if (ApiBpmj.operateType.HU_ZHI == curOpt.operate) {
				if (handCards[curOpt.uid].indexOf(curOpt.card) >= 0) {
					handCards[curOpt.uid].splice(handCards[curOpt.uid].indexOf(curOpt.card), 1)
				}
				let curIdx = this.getUserIndexByID(curOpt.uid);
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
				this.showAni(4, curOpt);
			} else if (ApiBpmj.operateType.HU_CHI == curOpt.operate ||
				ApiBpmj.operateType.HU_QIANG == curOpt.operate) {
				if (passOpt && passOpt.operate == ApiBpmj.operateType.QI) {
					let curIdx = this.getUserIndexByID(curOpt.uid);
					this._handTileMgrList[curIdx].setHuTile(passOpt.card);
				}
				this.showAni(3, curOpt);
			} else if (ApiBpmj.operateType.PENG == curOpt.operate) {
				this.showAni(1, curOpt);
			} else if (ApiBpmj.operateType.CHI == curOpt.operate) {
				this.showAni(0, curOpt);
			} else if (ApiBpmj.operateType.GANG_BU == curOpt.operate ||
				ApiBpmj.operateType.GANG_ZHI == curOpt.operate ||
				ApiBpmj.operateType.GANG_CHI == curOpt.operate) {
				this.showAni(2, curOpt);
			}

			this.txt_last.string = `x${this.restCardsCount}`;
			let idx = this.getUserIndexByID(curOpt.uid);
			this.com_clock.setDir(idx);

			for (const uid in handCards) {
				let idx = this.getUserIndexByID(uid);
				let uHandCards = handCards[uid].slice();
				uHandCards = BPMJModel.sortTiles(uHandCards);
				this._disTileMgrList[idx].reset();
				this._disTileMgrList[idx].showOutTiles(outOpts[uid]);
				this._optTileMgrList[idx].updateOptTiles(pengGangs[uid]);
				this._handTileMgrList[idx].updateLieTiles(uHandCards, curOpt.card);
			}
		}

		if (index == operateRecords.length - 1) {
			/* 显示结算界面 */
			let msg = {
				path: "res/prefab/BPMJResultDialog",
				bundle: Enums.bundleType.BPMJ,
				result: baseData.result,
				parent: this.mjResultNode,
				isReview: true,
			}
			AssetsManager.createDialog(msg)
		} else {
			AssetsManager.destroyDialog({
				path: 'res/prefab/BPMJResultDialog',
				bundle: Enums.bundleType.BPMJ
			});
		}
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
			let h = cc.find("head" + i, this.node);
			h.removeAllChildren();
			h.active = false
		}
		for (let i = 0; i < headPos.length; i++) {
			let CurIndex = headPos[i], CurHeadNode = null;
			let headAddNode = cc.find("head" + CurIndex, this.node)
			if (CurIndex == 0 || CurIndex == 3) {
				CurHeadNode = cc.instantiate(this.headLeft)
			} else {
				CurHeadNode = cc.instantiate(this.headRight)
			}

			if (!!CurHeadNode) {
				this._userList.push(CurHeadNode.getComponent("BPMJHead"));
				CurHeadNode.parent = headAddNode;
				this._userList[i].initRes();
			}
			let handTile = cc.find("tiles/handTiles" + CurIndex, this.node)
			let optTile = cc.find("tiles/optTiles" + CurIndex, this.node)
			if (!optTile) {
				optTile = cc.find("optTiles" + CurIndex, handTile)
			}
			let disTile = cc.find("tiles/outTiles" + CurIndex, this.node);
			let huaTile = cc.find("tiles/huaTiles" + CurIndex, this.node);
			this._handTileMgrList.push(handTile.getComponent("BPMJHandTileMgr"))
			this._handTileMgrList[i].init(CurIndex)
			this._optTileMgrList.push(optTile.getComponent("BPMJOptTileMgr"))
			this._optTileMgrList[i].init(CurIndex)
			this._disTileMgrList.push(disTile.getComponent("BPMJOutTileMgr"))
			this._disTileMgrList[i].init(CurIndex)
			let opNode = cc.find("operAct" + CurIndex, this.node)
			this._operActNodeList.push(opNode)
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
		this.updatePointer();
		if (!!this._ghostCard) {
			this._ghostCard.setNodeShow(false);
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

	/**上一手 */
	preAct(event) {
		if (event) {
			this.showButtons();
		}
		if ((this.index - 1) < 0) {
			AssetsManager.tipDialog('当前已是最前一手！');
			return;
		}
		this.index--;
		this.setPlay(this.index);
	},
	/**下一手 */
	nextAct(event) {
		if (event) {
			this.showButtons();
		}
		if ((this.index + 1) >= this.operateRecords.length) {
			AssetsManager.tipDialog('当前已是最后一手！');
			this.pause = true;//暂停
			return;
		}
		this.index++;
		this.setPlay(this.index);
	},
	/**上一局 */
	preBureau(event) {
		if (event) {
			this.showButtons();
		}
		if ((this.bureau - 1) < 0) {
			AssetsManager.tipDialog('当前已是最前一局！');
			return;
		}
		this.bureau -= 1;
		this.showCurBureau();
	},
	/**下一局 */
	nextBureau(event) {
		if (event) {
			this.showButtons();
		}
		if ((this.bureau + 1) >= this.reviewRecord.length) {
			AssetsManager.tipDialog('当前已是最后一局！');
			return;
		}
		this.bureau += 1;
		this.showCurBureau();
	},


	/**暂停/继续 */
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
	/**速度加 */
	speedUp(event) {
		if (event) {
			this.showButtons();
		}
		this.speed *= 2;
		if (this.speed > 8) {
			this.speed = 8;
		}
	},
	/**速度减 */
	speedDown(event) {
		if (event) {
			this.showButtons();
		}
		this.speed /= 2;
		if (this.speed < 1 / 8) {
			this.speed = 1 / 8;
		}
	},

	/**恢复默认速度 */
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
		if (type == ApiBpmj.operateType.YOU_JIN ||
			type == ApiBpmj.operateType.SAN_JIN) {
			audioType = 4; //强制转换音效为自摸音效
		}
		if (audioType < typeNameList.length) {
			AssetsManager.playEffect({
				bundle: Enums.bundleType.BPMJ,
				path: `res/audio/nv/${typeNameList[audioType]}`,
			});
		}
		let idx = this.getUserIndexByID(data.uid)
		let optNode = cc.instantiate(this.operActPfb);
		optNode.parent = this._operActNodeList[idx]
		let com = optNode.getComponent('BPMJOperAct')
		com && com.showOpt(type);
		/**展示刮风和下雨 */
		// if (type == 2) {
		// 	let t = 5;
		// 	if (data.operate === ApiBpmj.operateType.GANG_ZHI) {
		// 		t = 7; //下雨
		// 	}
		// 	let fengNode = cc.instantiate(this.operActPfb);
		// 	fengNode.parent = this.node;
		// 	let fcom = fengNode.getComponent("BPMJOperAct");
		// 	fcom.showOpt(t);
		// } else {
		// 	optNode.scale = 0.8;
		// }
	},

	/**展示胡牌序列 */
	showHuIdx(data) {

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