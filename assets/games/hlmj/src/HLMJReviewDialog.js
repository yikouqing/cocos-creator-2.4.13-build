const ApiHlmj = require('./ApiHlmj');
const HLMJLogic = require('./HLMJLogic');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');
const HLMJModel = require('./HLMJModel');

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
		com_clock: require("HLMJClock"),

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
		this.reviewRecord = Utils.deepCopy(this.node.nodeParams.reviewRecord)
		this._ghostCard = this.ghostCard.addComponent('HLMJSingleTile');
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
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau])
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
			this._userList.push(h.getComponent("HLMJHead"))
			let handTile = cc.find("tiles/handTiles" + headPos[i], this.node)
			let optTile = cc.find("tiles/optTiles" + headPos[i], this.node)
			if (!optTile) {
				optTile = cc.find("optTiles" + headPos[i], handTile)
			}
			let disTile = cc.find("tiles/outTiles" + headPos[i], this.node);
			this._handTileMgrList.push(handTile.getComponent("HLMJHandTileMgr"))
			this._handTileMgrList[i].init(headPos[i])
			this._optTileMgrList.push(optTile.getComponent("HLMJOptTileMgr"))
			this._optTileMgrList[i].init(headPos[i])
			this._disTileMgrList.push(disTile.getComponent("HLMJOutTileMgr"))
			this._disTileMgrList[i].init(headPos[i])
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
		AssetsManager.clearDialog(['HLMJResultDialog']);
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
			AssetsManager.clearDialog(['HLMJResultDialog']);
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
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau]);
		let operateRecords = Utils.deepCopy(baseData.operateRecords);
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		this.userArray = userArray;
		this.txt_round.string = '局数:' + (this.bureau + 1) + '/' + roomData.maxBureau;
		this.txt_roomId.string = '房号:' + roomData.roomID;
		let pengGangs = {}; /* 碰杠的牌 */
		let outOpts = {}; /* 出的牌 */
		let baiCards = {}; /**摆的牌 */
		let huCards = {}; /**胡的牌 */
		let handCards = Utils.deepCopy(roomData.handCards); /* 手牌 */
		for (const uid in handCards) {
			pengGangs[uid] = [];
			outOpts[uid] = [];
			baiCards[uid] = [];
			huCards[uid] = -1;
		}
		HLMJModel.setGhostCard(roomData.laiZiCards || 0);
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
			if (item.operate == ApiHlmj.operateType.GET) {
				handCards[item.uid].push(item.card);
			} else if (item.operate == ApiHlmj.operateType.QI) {
				handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
				outOpts[item.uid].push(item);
			} else if (item.operate == ApiHlmj.operateType.GANG_ZHI) {
				let abvOpt = operateRecords[i - 1];
				if (i == 0 || (!!abvOpt && abvOpt.operate == ApiHlmj.operateType.GET && abvOpt.uid == item.uid)) {//起手暗杠容错
					let gangList = item.plusInfo.cardList;
					if (!!gangList) {
						for (let idx = 0; idx < gangList.length; idx++) {
							const card = gangList[idx];
							handCards[item.uid].splice(handCards[item.uid].indexOf(card), 1);
						}
						pengGangs[item.uid].push(item);
					}
				}
			} else if (item.operate == ApiHlmj.operateType.GANG_BU) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiHlmj.operateType.GET && abvOpt.uid == item.uid) {
					for (let j = pengGangs[item.uid].length - 1; j >= 0; j--) {
						if (pengGangs[item.uid][j].operate == ApiHlmj.operateType.PENG &&
							pengGangs[item.uid][j].card == item.card) {
							pengGangs[item.uid].splice(j, 1);
							break;
						}
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiHlmj.operateType.GANG_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiHlmj.operateType.QI) {
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
			} else if (item.operate == ApiHlmj.operateType.PENG) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiHlmj.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiHlmj.operateType.CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiHlmj.operateType.QI) {
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
			} else if (item.operate == ApiHlmj.operateType.HU_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiHlmj.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
				}
				huCards[item.uid] = item.card
			} else if (item.operate == ApiHlmj.operateType.HU_ZHI) {
				let h = handCards[item.uid]
				let huidx = h.indexOf(item.card)
				if (huidx != -1) {
					h.splice(huidx, 1)
				}
				huCards[item.uid] = item.card
			} else if (item.operate == ApiHlmj.operateType.BAIPAI) {
				let cardList = item.cardList.slice()
				baiCards[item.uid] = []
				for (let i = 0; i < cardList.length; i++) {
					let idx = handCards[item.uid].indexOf(cardList[i])
					handCards[item.uid].splice(idx, 1);
					baiCards[item.uid].push(cardList[i])
				}
			}
		}
		// console.log('当前播放数据-局数', this.bureau);
		// console.log('当前播放数据-当前OPT', index, curOpt.uid, curOpt.operate, curOpt.card);
		// console.log('当前播放数据-玩家出牌', outOpts);
		// console.log('当前播放数据-玩家手牌', handCards);
		// console.log('当前播放数据-玩家碰杠', pengGangs);
		// console.log('当前播放数据-摆牌', baiCards);
		if (curOpt) {
			if (curOpt.operate == ApiHlmj.operateType.GET) {
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: Enums.bundleType.HLMJ
				});
				if (handCards[curOpt.uid].indexOf(curOpt.card) >= 0) {
					handCards[curOpt.uid].splice(handCards[curOpt.uid].indexOf(curOpt.card), 1)
				}
				let curIdx = this.getUserIndexByID(curOpt.uid);
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
				this.restCardsCount--;
			} else if (curOpt.operate == ApiHlmj.operateType.QI) {
				AssetsManager.playEffect({
					path: 'res/audio/nv/' + curOpt.card,
					bundle: Enums.bundleType.HLMJ
				});
				AssetsManager.playEffect({
					path: 'res/audio/main/push',
					bundle: Enums.bundleType.HLMJ
				});
			} else if (ApiHlmj.operateType.HU_CHI == curOpt.operate ||
				ApiHlmj.operateType.HU_QIANG == curOpt.operate) {
				this.showAni(3, curOpt);
			} else if (ApiHlmj.operateType.HU_ZHI == curOpt.operate) {
				this.showAni(4, curOpt);
			} else if (ApiHlmj.operateType.PENG == curOpt.operate) {
				this.showAni(1, curOpt);
			} else if (ApiHlmj.operateType.CHI == curOpt.operate) {
				this.showAni(0, curOpt);
			} else if (ApiHlmj.operateType.BAIPAI == curOpt.operate) {
				let curIdx = this.getUserIndexByID(curOpt.uid);
				this._handTileMgrList[curIdx].onBaiPaiEnd(curOpt.cardList);
				let sex = 'nv';
				AssetsManager.playEffect({
					path: `res/audio/${sex}/baipai`,
					bundle: Enums.bundleType.HLMJ
				});
			} else if (ApiHlmj.operateType.GANG_BU == curOpt.operate ||
				ApiHlmj.operateType.GANG_ZHI == curOpt.operate ||
				ApiHlmj.operateType.GANG_CHI == curOpt.operate) {
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
				let huId = huCards[uid]
				if (huId != -1) {
					this._handTileMgrList[idx].setHuTile(huId);
				}
			}
			for (const uid in baiCards) {
				if (Object.hasOwnProperty.call(baiCards, uid)) {
					let idx2 = this.getUserIndexByID(uid);
					this._handTileMgrList[idx2].onBaiPaiEnd(baiCards[uid]);
				}
			}
		}

		if (index == operateRecords.length - 1) {
			/* 显示结算界面 */
			let msg = {
				path: "res/prefab/HLMJResultDialog",
				bundle: Enums.bundleType.HLMJ,
				parent: this.mjResultNode,
				isReview: true,
			}
			msg = Object.assign(msg, baseData)
			AssetsManager.createDialog(msg)
		} else {
			AssetsManager.clearDialog(['HLMJResultDialog']);
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
		if (type == ApiHlmj.operateType.YOU_JIN ||
			type == ApiHlmj.operateType.SAN_JIN) {
			audioType = 4; //强制转换音效为自摸音效
		}
		if (audioType < typeNameList.length) {
			AssetsManager.playEffect({
				path: `res/audio/nv/${typeNameList[audioType]}`,
				bundle: Enums.bundleType.HLMJ
			});
		}
		let idx = this.getUserIndexByID(data.uid)
		/**展示动画 */
		let optNode = cc.instantiate(this.operActPfb);
		optNode.parent = this._operActNodeList[idx]
		let com = optNode.getComponent('HLMJOperAct')
		com.showOpt(type);
		/**展示刮风和下雨 */
		if (type == 2) {
			let t = 5;
			if (data.operate === ApiHlmj.operateType.GANG_ZHI) {
				t = 7; //下雨
			}
			let fengNode = cc.instantiate(this.operActPfb);
			fengNode.parent = this.node;
			let fcom = fengNode.getComponent("HLMJOperAct");
			fcom.showOpt(t);
		} else {
			optNode.scale = 0.8;
		}
		if (type >= 3) {
			this.showHuIdx(data);
		}
	},

	/**展示胡牌序列 */
	showHuIdx(data) {
		let idx = this.getUserIndexByID(data.uid);
		if (typeof (idx) == "number") {
			let optNode = cc.instantiate(this.operActPfb);
			optNode.parent = this._operActNodeList[idx];
			let comp = optNode.getComponent('HLMJOperAct');
			comp.showHuIndex(data.operate, data.plusInfo.index, data.uid, true);
		}
	},


	initHeads() {
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau])
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		this.userArray = userArray;
		for (let i = 0; i < userArray.length; i++) {
			const user = userArray[i];
			let idx = this.getUserIndexByID(user.uid);
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