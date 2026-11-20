const ApiPzhmj = require('./ApiPzhmj');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const PZHMJModel = require('./PZHMJModel');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
	extends: cc.Component,
	properties: {
		com_clock: require("PZHMJClock"),
		txt_name: cc.Label,
		txt_baseScore: cc.Label,
		txt_roomId: cc.Label,
		txt_round: cc.Label,
		txt_last: cc.Label,
		mjResultNode: cc.Node,
		pointer: cc.Node,
		operActPfb: cc.Prefab,
		tuoguanNode: cc.Node,
		headPfbLeft: cc.Prefab,
		headPfbRight: cc.Prefab,
		tilePfb: cc.Prefab,

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
		_baseData: null,
	},

	start() {
		if (!this.node.nodeParams.reviewRecord) {
			this.node.destroy();
			return;
		}

		this.reviewRecord = Utils.deepCopy(this.node.nodeParams.reviewRecord)
		console.log("视频回放数据==", this.reviewRecord)
		this.tm = 0;
		this.bureau = 0;
		this.speed = 1; //测试用
		this.index = 0;
		this.pause = false;
		this.myUid = UserModel.getData('uid');
		PZHMJModel.myUid = this.myUid
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
		this.com_clock.gameInit(PZHMJModel.getChairCount(), PZHMJModel.getMyChairID())
		this.checkHeadPos();
		this.updatePointer();
		this.initHeads();
		this.setRoundShow();
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
		PZHMJModel.resetAll()
	},

	/**更新数据 */
	updateData(isFirst = false) {
		this._baseData = Utils.deepCopy(this.reviewRecord[this.bureau]);
		let baseData = this._baseData;
		PZHMJModel.setGhostCard(baseData.plusInfo.laiZiCards);
		let roomData = baseData.baseRoomRecords;
		this.restCardsCount = roomData.leftCount;
		PZHMJModel.setUserHuDonList(baseData.plusInfo.userResultList)
		if (isFirst) {
			PZHMJModel.gameRule = baseData.plusInfo.gameRule
			let userArray = roomData.userArray;
			for (const user of userArray) {
				PZHMJModel.otherUserJoinRoom(user)
			}
		}
	},

	/**判断人数，初始化头像位置 */
	checkHeadPos() {
		let chairCount = PZHMJModel.getChairCount()
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
			this._userList.push(headNode.getComponent("PZHMJHead"));
			this._userList[i].initRes();
			let handTile = cc.find("tiles/handTiles" + idx, this.node);
			let optTile = cc.find("tiles/optTiles" + idx, this.node);
			if (!optTile) {
				optTile = cc.find("optTiles" + idx, handTile);
			}
			let disTile = cc.find("tiles/outTiles" + idx, this.node);
			this._handTileMgrList.push(handTile.getComponent("PZHMJHandTileMgr"));
			this._handTileMgrList[i].init(idx);
			this._optTileMgrList.push(optTile.getComponent("PZHMJOptTileMgr"));
			this._optTileMgrList[i].init(i);
			this._disTileMgrList.push(disTile.getComponent("PZHMJOutTileMgr"));
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
		let baseData = this._baseData
		let operateRecords = baseData.operateRecords;
		if (!operateRecords) return;

		this.index++;
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
		AssetsManager.clearDialog(['PZHMJResultDialog']);
		this.updateData()
		this.index = 0;
		this.pause = false;
		this.setRoundShow()
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
			AssetsManager.clearDialog(['PZHMJResultDialog']);
			this.updateData()
			this.index = 0;
			this.pause = false;
			this.setRoundShow()
			this.initHeads();
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
		let baseData = this._baseData
		let operateRecords = Utils.deepCopy(baseData.operateRecords)
		let roomData = baseData.baseRoomRecords;


		let pengGangs = {}; /* 碰杠的牌 */
		let outOpts = {}; /* 出的牌 */
		let baiCards = {}
		let handCards = Utils.deepCopy(roomData.handCards); /* 手牌 */
		for (const uid in handCards) {
			pengGangs[uid] = [];
			outOpts[uid] = [];
			baiCards[uid] = [];
		}

		let curOpt = operateRecords[index];
		let passOpt = operateRecords[index - 1];
		//找当前ACTION发生之前的操作
		for (let i = 0; i < operateRecords.length; i++) {
			if (i > index) break;
			let item = operateRecords[i];
			if (item.operate == ApiPzhmj.operateType.GET) {
				handCards[item.uid].push(item.card);
			} else if (item.operate == ApiPzhmj.operateType.QI) {
				handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
				outOpts[item.uid].push(item);
			} else if (item.operate == ApiPzhmj.operateType.GANG_ZHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiPzhmj.operateType.GET && abvOpt.uid == item.uid) {
					let gangList = item.plusInfo.cardList;
					if (!!gangList) {
						for (let idx = 0; idx < gangList.length; idx++) {
							const card = gangList[idx];
							handCards[item.uid].splice(handCards[item.uid].indexOf(card), 1);
						}
						pengGangs[item.uid].push(item);
					}
				}
			} else if (item.operate == ApiPzhmj.operateType.GANG_BU) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiPzhmj.operateType.GET && abvOpt.uid == item.uid) {
					for (let j = pengGangs[item.uid].length - 1; j >= 0; j--) {
						if (pengGangs[item.uid][j].operate == ApiPzhmj.operateType.PENG &&
							pengGangs[item.uid][j].card == item.card) {
							pengGangs[item.uid].splice(j, 1);
							break;
						}
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiPzhmj.operateType.GANG_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiPzhmj.operateType.QI) {
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
			} else if (item.operate == ApiPzhmj.operateType.PENG) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiPzhmj.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
					let cardList = item.plusInfo.cardList.slice()
					cardList.splice(cardList.indexOf(item.card), 1)
					for (let i = 0; i < cardList.length; i++) {
						const card = cardList[i];
						let delIdx = handCards[item.uid].indexOf(card)
						if (delIdx >= 0) {
							handCards[item.uid].splice(delIdx, 1);
						}
					}
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiPzhmj.operateType.CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiPzhmj.operateType.QI) {
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
			} else if (item.operate == ApiPzhmj.operateType.HU_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiPzhmj.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
				}
			} else if (item.operate == ApiPzhmj.operateType.TIAOWU) {
				let baiList = item.cardList.slice()
				for (let i = 0; i < baiList.length; i++) {
					const card = baiList[i];
					let idx = handCards[item.uid].indexOf(card)
					handCards[item.uid].splice(idx, 1);
					baiCards[item.uid].push(card);
				}
			}
		}

		if (curOpt) {
			let curIdx = PZHMJModel.getUserIndexByUID(curOpt.uid);
			let ucom = this._userList[curIdx]
			if (curOpt.operate == ApiPzhmj.operateType.GET) {
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: Enums.bundleType.PZHMJ
				});
				if (handCards[curOpt.uid].indexOf(curOpt.card) >= 0) {
					handCards[curOpt.uid].splice(handCards[curOpt.uid].indexOf(curOpt.card), 1)
				}
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
				this.restCardsCount--;
			} else if (curOpt.operate == ApiPzhmj.operateType.QI) {
				AssetsManager.playEffect({
					path: 'res/audio/nv/' + curOpt.card,
					bundle: Enums.bundleType.PZHMJ
				});
				AssetsManager.playEffect({
					path: 'res/audio/main/push',
					bundle: Enums.bundleType.PZHMJ
				});
			} else if (ApiPzhmj.operateType.HU_ZHI == curOpt.operate) {
				if (handCards[curOpt.uid].indexOf(curOpt.card) >= 0) {
					handCards[curOpt.uid].splice(handCards[curOpt.uid].indexOf(curOpt.card), 1)
				}
				this._handTileMgrList[curIdx].setHuTile(curOpt.card);
				this.showAni(4, curOpt);
			} else if (ApiPzhmj.operateType.HU_CHI == curOpt.operate ||
				ApiPzhmj.operateType.HU_QIANG == curOpt.operate) {
				if (passOpt && passOpt.operate == ApiPzhmj.operateType.QI) {
					this._handTileMgrList[curIdx].setHuTile(passOpt.card);
				}
				this.showAni(3, curOpt);
			} else if (ApiPzhmj.operateType.PENG == curOpt.operate) {
				this.showAni(1, curOpt);
			} else if (ApiPzhmj.operateType.CHI == curOpt.operate) {
				this.showAni(0, curOpt);
			} else if (ApiPzhmj.operateType.GANG_BU == curOpt.operate ||
				ApiPzhmj.operateType.GANG_ZHI == curOpt.operate ||
				ApiPzhmj.operateType.GANG_CHI == curOpt.operate) {
				this.showAni(2, curOpt);
			} else if (ApiPzhmj.operateType.BAOTING == curOpt.operate) {
				this.showAni(10, curOpt);
				if (ucom) ucom.setJiao(true)
			} else if (ApiPzhmj.operateType.CHANGGE == curOpt.operate) {
				this.showAni(8, curOpt);
				if (ucom) ucom.setSing(true)
			} else if (ApiPzhmj.operateType.TIAOWU == curOpt.operate) {
				this.showAni(9, curOpt);
				let list = baiCards[curOpt.uid]
				let hcom = this._handTileMgrList[curIdx]
				hcom && hcom.onBaiPaiEnd(list)
				if (ucom) ucom.setDance(true)
			}

			let tg = this._tuoguanList[curIdx]
			if (tg && typeof (curOpt.isAuto) == "boolean") {
				tg.active = curOpt.isAuto
			}
			this.com_clock.setDir(curIdx);
			this.txt_last.string = this.restCardsCount + ""
			PZHMJModel.setHandCards(handCards)
			for (const uid in handCards) {
				let idx = PZHMJModel.getUserIndexByUID(uid);
				let uHandCards = PZHMJModel.getHandCards(uid)
				this._handTileMgrList[idx].updateLieTiles(uHandCards)
				this._disTileMgrList[idx].reset();
				let last = this._disTileMgrList[idx].showOutTiles(outOpts[uid]);
				if (uid == curOpt.uid && curOpt.operate == ApiPzhmj.operateType.QI) {
					this.updatePointer(last.node)
				} else {
					this.updatePointer()
				}
				this._optTileMgrList[idx].updateOptTiles(pengGangs[uid]);
			}
		}

		if (index >= operateRecords.length - 1) {
			/* 显示结算界面 */
			let resData = Utils.deepCopy(baseData)
			resData.path = "res/prefab/PZHMJResultDialog"
			resData.bundle = Enums.bundleType.PZHMJ
			resData.parent = this.mjResultNode
			resData.isReview = true
			let dt = 1
			this.scheduleOnce(() => {
				AssetsManager.createDialog(resData);
			}, dt)
			this.pause = true
		} else {
			AssetsManager.clearDialog(['PZHMJResultDialog']);
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
		let typeNameList = ["chi", "peng", "gang", "hu", "zimo", "", "", "", "chang", "tiao", "bao"]
		/**声音 */
		let audioType = type;
		if (audioType < typeNameList.length) {
			AssetsManager.playEffect({
				path: `res/audio/nv/${typeNameList[audioType]}`,
				bundle: Enums.bundleType.PZHMJ
			});
		}
		/**展示动画 */
		let com = this.genOperActNode(data.uid)
		com.showOpt(type, () => {

		});
		/**展示刮风和下雨 */
		if (type == 2) {
			let t = 5
			if (data.operate === ApiPzhmj.operateType.GANG_ZHI) {
				t = 7 //下雨
			}
			AssetsManager.playEffect({
				path: `res/audio/main/${t == 5 ? "guafeng" : ""}`,
				bundle: Enums.bundleType.PZHMJ
			});
			let fcom = this.genOperActNode(null, this.node)
			fcom.showOpt(t)
		}
		if (type == 3 || type == 4) {
			this.showHuIdx(data.uid, true); //胡牌序列
		}
	},

	initHeads() {
		let baseData = this._baseData;
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		for (let i = 0; i < userArray.length; i++) {
			const user = userArray[i];
			let idx = PZHMJModel.getUserIndexByUID(user.uid);
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

	/**设置房间信息 */
	setRoundShow() {
		let baseData = this._baseData;
		this.txt_round.string = `${baseData.baseRoomRecords.curBureau}/${PZHMJModel.getGameRuleByKey("bureau")}局`;
		this.txt_roomId.string = '房号:' + baseData.baseRoomRecords.roomID;
		this.txt_baseScore.string = `底:${PZHMJModel.getGameRuleByKey("baseScore")} `
		let fd = PZHMJModel.getGameRuleByKey("fengDing")
		this.txt_baseScore.string += (fd == 0 ? "不封顶" : `顶:${fd}`)
		this.txt_name.string = `${ConfigModel.getGameName(PZHMJModel.getGameRuleByKey("gameType"))}`;
	},

	/**展示胡牌序列 */
	showHuIdx(uid, isAnim = false) {
		let huList = PZHMJModel.getUserHuDonList()
		if (isAnim && uid) {
			let index = huList.findIndex((info) => {
				return info.uid == uid
			})
			if (index !== -1) {
				let huInfo = huList[index]
				let com = this.genOperActNode(uid)
				com.showHuIndex(huInfo.operateType, huInfo.huIndex, uid, isAnim);
			}
		} else {
			for (let i = 0; i < huList.length; i++) {
				const huInfo = huList[i];
				let com = this.genOperActNode(huInfo.uid)
				com.showHuIndex(huInfo.operateType, huInfo.huIndex, huInfo.uid, isAnim);
			}
		}
	},

	/**生成一个新的操作动画 */
	genOperActNode(uid, showNode, nodeName = "operAni") {
		if (!showNode) {
			let idx = PZHMJModel.getUserIndexByUID(uid);
			showNode = this._operActNodeList[idx];
		}
		let optNode = cc.instantiate(this.operActPfb);
		optNode.name = nodeName
		let com = optNode.getComponent('PZHMJOperAct');
		optNode.parent = showNode;
		return com
	},
});