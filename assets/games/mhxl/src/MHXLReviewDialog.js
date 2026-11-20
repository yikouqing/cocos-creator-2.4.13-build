const ApiMhxl = require('./ApiMhxl');
const MHXLLogic = require('./MHXLLogic');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');
const MHXLModel = require('./MHXLModel');

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
		com_clock: require("MHXLClock"),

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
		// this._ghostCard = this.ghostCard.addComponent('MHXLSingleTile);
		// this._ghostCardCPos = this.ghostCard.getPosition();
		// if (!!this._ghostCard) {
		// 	this._ghostCard.init();
		// 	this._ghostCard.setNodeShow(false);
		// }
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
		this.updatePointer();
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
		let curOpt = operateRecords[index];
		let userArray = roomData.userArray;
		let gameRule = roomData.gameRule;
		let result = baseData.result;
		this.userArray = userArray;
		result.forEach((obj) => {
			if (obj.laiZiCards) {
				roomData.laiZiCards = obj.laiZiCards;
			}
		})
		MHXLModel.setGhostCard(roomData.laiZiCards || 0);
		this.txt_roomId.string = '房号:' + roomData.roomID;
		this.txt_round.string = '局数:' + (this.bureau + 1) + '/' + roomData.maxBureau;
		let handCards = Utils.deepCopy(roomData.handCards); /* 手牌 */
		let pengGangs = {}; /* 碰杠的牌 */
		let outOpts = {}; /* 出的牌 */
		let huCards = {}; /**胡的牌 */

		for (const uid in handCards) {
			pengGangs[uid] = [];
			outOpts[uid] = [];
			huCards[uid] = -1;
		}

		// if (!!this._ghostCard && roomData.laiZiCards) {
		// 	this._ghostCard.setNodeShow(true);
		// 	this._ghostCard.flower = roomData.laiZiCards;
		// 	this._ghostCard.setGhostIcon(true);
		// } else {
		// 	this._ghostCard.setNodeShow(false);
		// }

		//找当前ACTION发生之前的操作
		for (let i = 0; i < operateRecords.length; i++) {
			if (i > index || index == 0) break;
			let item = operateRecords[i];
			if (item.operate == ApiMhxl.operateType.GET) {
				handCards[item.uid].push(item.card);
			} else if (item.operate == ApiMhxl.operateType.QI) {
				handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
				outOpts[item.uid].push(item);
			} else if (item.operate == ApiMhxl.operateType.GANG_ZHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiMhxl.operateType.GET && abvOpt.uid == item.uid) {
					let gangList = item.plusInfo.cardList;
					if (!!gangList) {
						for (let idx = 0; idx < gangList.length; idx++) {
							const card = gangList[idx];
							handCards[item.uid].splice(handCards[item.uid].indexOf(card), 1);
						}
						pengGangs[item.uid].push(item);
					}
				}
			} else if (item.operate == ApiMhxl.operateType.GANG_BU) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiMhxl.operateType.GET && abvOpt.uid == item.uid) {
					for (let j = pengGangs[item.uid].length - 1; j >= 0; j--) {
						if (pengGangs[item.uid][j].operate == ApiMhxl.operateType.PENG &&
							pengGangs[item.uid][j].card == item.card) {
							pengGangs[item.uid].splice(j, 1);
							break;
						}
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiMhxl.operateType.GANG_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiMhxl.operateType.QI) {
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
			} else if (item.operate == ApiMhxl.operateType.PENG) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiMhxl.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiMhxl.operateType.CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiMhxl.operateType.QI) {
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
			} else if (item.operate == ApiMhxl.operateType.HU_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiMhxl.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
				}
				huCards[item.uid] = item.card
			} else if (item.operate == ApiMhxl.operateType.HU_ZHI) {
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

			let CurOptUid = curOpt.uid;
			let CurOptIndex = this.getUserIndexByID(CurOptUid);
			this.com_clock.setDir(CurOptIndex);
			let plusInfo = curOpt.plusInfo || {};
			let jipailist = plusInfo.jipailist || null;
			this.txt_last.string = `剩:${this.restCardsCount}张`;

			if (!!jipailist) {
				// console.log("jipailist", jipailist)
				this.showJiPai(jipailist.uid, jipailist.JiPaiType, true)
			} else if (curOpt.operate == ApiMhxl.operateType.GET) {
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: Enums.bundleType.MHXL
				});
				if (handCards[CurOptUid].indexOf(curOpt.card) >= 0) {
					handCards[CurOptUid].splice(handCards[CurOptUid].indexOf(curOpt.card), 1)
				}

				this._handTileMgrList[CurOptIndex].setHuTile(curOpt.card);
				this.restCardsCount--;
			} else if (curOpt.operate == ApiMhxl.operateType.QI) {
				AssetsManager.playEffect({
					bundle: Enums.bundleType.MHXL,
					path: 'res/audio/nv/' + curOpt.card,
				});
				AssetsManager.playEffect({
					path: 'res/audio/main/push',
					bundle: Enums.bundleType.MHXL
				});
			} else if (ApiMhxl.operateType.HU_CHI == curOpt.operate ||
				ApiMhxl.operateType.HU_QIANG == curOpt.operate) {
				this.showAni(3, curOpt);
			} else if (ApiMhxl.operateType.HU_ZHI == curOpt.operate) {
				this.showAni(4, curOpt);
			} else if (ApiMhxl.operateType.PENG == curOpt.operate) {
				this.showAni(1, curOpt);
			} else if (ApiMhxl.operateType.CHI == curOpt.operate) {
				this.showAni(0, curOpt);
			} else if (ApiMhxl.operateType.GANG_BU == curOpt.operate ||
				ApiMhxl.operateType.GANG_ZHI == curOpt.operate ||
				ApiMhxl.operateType.GANG_CHI == curOpt.operate) {
				this.showAni(2, curOpt);
			} else if (curOpt.operate == ApiMhxl.operateType.MENPAI) {
				let hcom = this._menTilesMgrList[CurOptIndex];
				this.showAni(ApiMhxl.operateType.MENPAI, curOpt);
				if (hcom && plusInfo) hcom.menCardsSync(curOpt.card, plusInfo.operateType);
			} else if (curOpt.operate == ApiMhxl.operateType.TIANTING) {
				this.showAni(ApiMhxl.operateType.DAITIANTING, curOpt);
				this._syncUser(CurOptUid, (CtrlUser) => {
					CtrlUser.showTing(true);
				});
			}


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
		}

		if (index == operateRecords.length - 1) {
			let maPaiInfo = null;
			for (const user of result) {
				let huUser = user.huInfo || null;
				let JiaoZhui = user.JiaoZhui || {};
				this.showOperAct(user.uid, (ctrl) => {
					if (!!huUser && !!huUser.addCardType.length) {
						let addCardType = huUser.addCardType || [];
						let CurData = addCardType[addCardType.length - 1];
						ctrl.showHuType(CurData.type);
					} else {
						ctrl.showJiaoZui(!!JiaoZhui[user.uid]);
					}
				})
				if (!maPaiInfo && !!user.maPaiInfo) {
					maPaiInfo = user.maPaiInfo;
				};
			}
			let createResultDialog = () => {
				let msg = {
					isReview: true,
					parent: this.mjResultNode,
					bundle: Enums.bundleType.MHXL,
					path: "res/prefab/MHXLResultDialog",
				}
				AssetsManager.createDialog(Object.assign(msg, baseData))
			}
			this.scheduleOnce(() => {
				let maCards = !!maPaiInfo ? maPaiInfo.maCards || [] : [];
				if (!!maPaiInfo && !!maCards.length) {
					AssetsManager.createDialog({
						result: result,
						isReview: true,
						gameRule: gameRule,
						maPaiInfo: maPaiInfo,
						bundle: Enums.bundleType.MHXL,
						callback: createResultDialog,
						path: "res/prefab/MHXLFanPai",
					});
				} else {
					createResultDialog();
				}
			}, 2);
		} else {
			AssetsManager.clearDialog(['MHXLFanPai', 'MHXLResultDialog']);
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


	showJiPai(uid, JiPaiType, isAni = false) {
		this._JiPaiAinm = isAni;
		this._syncUser(uid, (ctrl) => {
			ctrl.shwoTypeTips(JiPaiType);
		});
		isAni && this.showOperAct(uid, (CtrlAct) => {
			CtrlAct.showJiPai(JiPaiType, () => {
				this._JiPaiAinm = false;
			});
		})
	},

	showOperAct(uid, funs, showNode) {
		if (!showNode) {
			let idx = this.getUserIndexByID(uid);
			showNode = this._operActNodeList[idx];
		}
		if (showNode) {
			let optNode = cc.instantiate(this.operActPfb);
			let CtrlAct = optNode.getComponent('MHXLOperAct');
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
				bundle: Enums.bundleType.MHXL
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
		let com = optNode.getComponent('MHXLOperAct')
		com.showOpt(type);
		/**展示刮风和下雨 */
		if (type == 2) {
			let t = 5;
			if (data.operate === ApiMhxl.operateType.GANG_ZHI) {
				t = 7; //下雨
			}
			let fengNode = cc.instantiate(this.operActPfb);
			fengNode.parent = this.node;
			let fcom = fengNode.getComponent("MHXLOperAct");
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
			this._userList.push(h.getComponent("MHXLHead"));
			this._userList[i].initRes();

			let handTile = cc.find("RootTiles/handTiles" + CurIndex, this.node);
			let optTile = cc.find("RootTiles/optTiles" + CurIndex, this.node);
			if (!optTile) {
				optTile = cc.find("optTiles" + CurIndex, handTile);
			}
			let disTile = cc.find("RootTiles/outTiles" + CurIndex, this.node);
			this._disTileMgrList.push(disTile.getComponent("MHXLOutTileMgr"));
			this._disTileMgrList[i].init(CurIndex);

			this._handTileMgrList.push(handTile.getComponent("MHXLHandTileMgr"));
			this._handTileMgrList[i].init(CurIndex);

			this._optTileMgrList.push(optTile.getComponent("MHXLOptTileMgr"));
			this._optTileMgrList[i].init(CurIndex);

			let opNode = cc.find("operAct" + CurIndex, this.node);
			this._operActNodeList.push(opNode);

			let huaTile = cc.find("RootTiles/huaTiles" + CurIndex, this.node);

			this._menTilesMgrList.push(huaTile.getComponent("MHXLMenTileMgr"));
			this._menTilesMgrList[i].init(CurIndex);
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
		this.updatePointer();
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
		if (!this.reviewRecord[this.bureau]) {
			AssetsManager.tipDialog('当前已是最后一手！');
			this.pause = true;
			return;
		}
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau])
		let operateRecords = baseData.operateRecords;
		if (!operateRecords) return;
		let operateRecordsCounts = operateRecords.length;
		if (this.index >= operateRecordsCounts) {
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
		AssetsManager.clearDialog(['MHXLResultDialog']);
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
			AssetsManager.clearDialog(['MHXLResultDialog']);
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