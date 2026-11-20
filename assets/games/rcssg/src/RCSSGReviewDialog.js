const ApiRcssg = require('./ApiRcssg');
const RCSSGLogic = require('./RCSSGLogic');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');
const RCSSGModel = require('./RCSSGModel');

cc.Class({
	extends: cc.Component,
	properties: {
		txt_roomId: cc.Label,
		txt_round: cc.Label,
		txt_last: cc.Label,
		mjResultNode: cc.Node,
		pointer: cc.Node,
		operActPfb: cc.Prefab,
		com_clock: require("RCSSGClock"),

		headPfbLeft: cc.Prefab,
		headPfbRight: cc.Prefab,
		huanPaiPfb: cc.Prefab,
		tuoguanNode: cc.Node,
		huanPaiNode: cc.Node,
		animationNode: cc.Node,

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
		/**托管动画 */
		_tuoguanList: [],
		_timeOutArr: [],

		_com_huanPai: null,
		/**是否正在换三张 */
		_isShowHuanSanZhang: false
	},

	start() {
		this.reviewRecord = Utils.deepCopy(this.node.nodeParams.reviewRecord);
		console.log("回放数据==", this.reviewRecord)
		if (!this.reviewRecord) {
			this.node.destroy();
			return;
		}
		this.initOnceRoom();

		this.tm = 0;
		this.speed = 1;
		this.bureau = 0;

		let huanPai = cc.instantiate(this.huanPaiPfb)
		huanPai.parent = this.huanPaiNode
		this._com_huanPai = huanPai.getComponent("RCSSGHuanPai")
		this._com_huanPai.init()

		this.showCurRound(-1, true);
	},

	onDestroy() {
		this._timeOutArr.forEach(tid => {
			clearTimeout(tid)
		});
		RCSSGModel.resetAll()
	},

	initOnceRoom() {
		let baseData = this.reviewRecord[0]
		RCSSGModel.gameRule = baseData.gameRule;
		RCSSGModel.myUid = UserModel.getData('uid');
		this.chairCount = RCSSGModel.getChairCount()
		let roomData = baseData.baseRoomRecords;
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
			RCSSGModel.otherUserJoinRoom(user);
			if (user.uid == RCSSGModel.getMyUID()) {
				this.myChairId = user.chairID;
			}
		}
		this.txt_roomId.string = '房号:' + roomData.roomID;
		this.com_clock.gameInit();
		this.showButtons(true)
	},

	/**判断人数，初始化头像位置 */
	checkHeadPos() {
		if (this._userList.length > 0) {
			return
		}
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
			this._userList.push(headNode.getComponent("RCSSGHead"));
			this._userList[i].initRes();
			let handTile = cc.find("tableInfo/handTiles" + idx, this.node);
			let optTile = cc.find("tableInfo/optTiles" + idx, this.node);
			if (!optTile) {
				optTile = cc.find("optTiles" + idx, handTile);
			}
			let disTile = cc.find("tableInfo/outTiles" + idx, this.node);
			this._handTileMgrList.push(handTile.getComponent("RCSSGHandTileMgr"));
			this._handTileMgrList[i].init(idx);
			this._optTileMgrList.push(optTile.getComponent("RCSSGOptTileMgr"));
			this._optTileMgrList[i].init(i);
			this._disTileMgrList.push(disTile.getComponent("RCSSGOutTileMgr"));
			this._disTileMgrList[i].init(idx);

			let opNode = cc.find("operAct" + idx, this.node);
			this._operActNodeList.push(opNode);
			this._tuoguanList.push(this.tuoguanNode.getChildByName("" + idx))
		}
	},

	showCurRound(bureau, type) {
		type ? bureau += 1 : bureau -= 1;
		AssetsManager.clearDialog(['RCSSGResultDialog']);
		this.baseData = Utils.deepCopy(this.reviewRecord[bureau]);
		// console.log("bureau", bureau, "this.baseData", this.baseData);
		if (!this.baseData) {
			AssetsManager.tipDialog(`暂无第${bureau}局的回放数据`);
			return
		};
		this.index = -1;
		this.pause = false;
		this.bureau = bureau;
		let roomData = this.baseData.baseRoomRecords;
		this.txt_round.string = `${this.bureau + 1}/${roomData.maxBureau}局`;
		this.restCardsCount = roomData.leftCount;
		this.userArray = roomData.userArray;
		this._isShowHuanSanZhang = false

		this.resetTable();
		this.initHeads();
		this.showHuanSanZhang()
		this.setPlay();
	},

	/**检测是否有换三张信息，有就展示换三张动画 */
	showHuanSanZhang() {
		if (this._isShowHuanSanZhang) {
			// console.log("正在播放动画")
			return
		}
		let baseData = Utils.deepCopy(this.baseData)
		if (!baseData || !baseData.baseRoomRecords || !baseData.huanPaiRecords) {
			return
		}
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
					let idx = RCSSGModel.getUserIndexByUID(uid)
					const arr = starthandCards[uid];
					RCSSGModel.sortTiles(null, arr)
					this._handTileMgrList[idx].updateLieTiles(arr)
				}
			}

			/**设置换牌 和删除过后的手牌*/
			this._timeOutArr[0] = setTimeout(() => {
				let startList = Utils.deepCopy(starthuanPaiList)
				for (const uid in starthandCards) {
					if (Object.hasOwnProperty.call(starthandCards, uid)) {
						let idx = RCSSGModel.getUserIndexByUID(uid)
						let handArr = starthandCards[uid].slice();
						let startArr = startList.find((v, i) => RCSSGModel.getUserIndexByChairID(i) == idx)
						for (let j = 0; j < startArr.length; j++) {
							const hcard = startArr[j];
							let hidx = handArr.indexOf(hcard)
							if (hidx != -1) {
								handArr.splice(hidx, 1)
							}
						}
						RCSSGModel.sortTiles(null, handArr)
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
			if (huanPaiType !== ApiRcssg.huanPaiType.DUI) {
				dt = 2.7
			}
			this._timeOutArr[2] = setTimeout(() => {
				let endList = Utils.deepCopy(endhuanPaiList)
				for (let i = 0; i < endList.length; ++i) {
					let idx = RCSSGModel.getUserIndexByChairID(i)
					this._com_huanPai.setReviewHuanPaiChoose(idx, endList[i])
				}
			}, dt * 1000)
			/**刷新到换牌后的牌 */
			this._timeOutArr[3] = setTimeout(() => {
				for (const uid in handCards) {
					if (Object.hasOwnProperty.call(handCards, uid)) {
						let idx = RCSSGModel.getUserIndexByUID(uid)
						const handArr = handCards[uid];
						RCSSGModel.sortTiles(null, handArr)
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

	setPlay() {
		if (this._isShowHuanSanZhang) return
		// console.log("idx==", this.index)
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
		let handCards = baseData.huanPaiRecords.handCards;
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
			if (item.operate == ApiRcssg.operateType.GET) {
				handCards[item.uid].push(item.card);
			} else if (item.operate == ApiRcssg.operateType.QI) {
				handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
				outOpts[item.uid].push(item);
			} else if (item.operate == ApiRcssg.operateType.GANG_ZHI) {
				let gangList = item.plusInfo.cardList;
				if (!!gangList) {
					for (let idx = 0; idx < gangList.length; idx++) {
						const card = gangList[idx];
						handCards[item.uid].splice(handCards[item.uid].indexOf(card), 1);
					}
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiRcssg.operateType.GANG_BU) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiRcssg.operateType.GET && abvOpt.uid == item.uid) {
					for (let j = pengGangs[item.uid].length - 1; j >= 0; j--) {
						if (pengGangs[item.uid][j].operate == ApiRcssg.operateType.PENG &&
							pengGangs[item.uid][j].card == item.card) {
							pengGangs[item.uid].splice(j, 1);
							break;
						}
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiRcssg.operateType.GANG_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiRcssg.operateType.QI) {
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
			} else if (item.operate == ApiRcssg.operateType.PENG) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiRcssg.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
					pengGangs[item.uid].push(item);
				}
			} else if (item.operate == ApiRcssg.operateType.CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiRcssg.operateType.QI) {
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
			} else if (item.operate == ApiRcssg.operateType.HU_CHI) {
				let abvOpt = operateRecords[i - 1];
				if (!!abvOpt && abvOpt.operate == ApiRcssg.operateType.QI) {
					if (!!outOpts[abvOpt.uid] &&
						!!outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1] &&
						outOpts[abvOpt.uid][outOpts[abvOpt.uid].length - 1].card == item.card) {
						outOpts[abvOpt.uid].pop();
					}
				}
				huCards[item.uid] = item.card
			} else if (item.operate == ApiRcssg.operateType.HU_ZHI) {
				let h = handCards[item.uid]
				let huidx = h.indexOf(item.card)
				if (huidx != -1) {
					h.splice(huidx, 1)
				}
				huCards[item.uid] = item.card
			} else if (item.operate == ApiRcssg.operateType.HU_QIANG) {
				/**删除被抢杠的手牌 */
				let gangUid = item.gangUid
				if (gangUid) {
					let gidx = handCards[gangUid].indexOf(item.card)
					if (gidx != -1) {
						handCards[gangUid].splice(gidx, 1);
					}
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
			let optIndex = RCSSGModel.getUserIndexByUID(optUid);
			this.com_clock.setDir(optIndex);
			this.txt_last.string = `${this.restCardsCount}`;

			if (curOpt.operate == ApiRcssg.operateType.GET) {
				AssetsManager.playEffect({
					path: 'res/audio/main/give',
					bundle: Enums.bundleType.RCSSGMJ
				});
				if (handCards[optUid].indexOf(curOpt.card) >= 0) {
					handCards[optUid].splice(handCards[optUid].indexOf(curOpt.card), 1)
				}
				this._handTileMgrList[optIndex].setHuTile(curOpt.card);
				this.restCardsCount--;
			} else if (curOpt.operate == ApiRcssg.operateType.QI) {
				AssetsManager.playEffect({
					bundle: Enums.bundleType.RCSSGMJ,
					path: 'res/audio/nv/' + curOpt.card,
				});
				AssetsManager.playEffect({
					path: 'res/audio/main/push',
					bundle: Enums.bundleType.RCSSGMJ
				});
			} else if (ApiRcssg.operateType.HU_CHI == curOpt.operate || ApiRcssg.operateType.HU_QIANG == curOpt.operate) {
				this.showAni(3, curOpt);
			} else if (ApiRcssg.operateType.HU_ZHI == curOpt.operate) {
				this.showAni(4, curOpt);
			} else if (ApiRcssg.operateType.PENG == curOpt.operate) {
				this.showAni(1, curOpt);
			} else if (ApiRcssg.operateType.CHI == curOpt.operate) {
				this.showAni(0, curOpt);
			} else if (ApiRcssg.operateType.GANG_BU == curOpt.operate ||
				ApiRcssg.operateType.GANG_ZHI == curOpt.operate ||
				ApiRcssg.operateType.GANG_CHI == curOpt.operate) {
				this.showAni(2, curOpt);
			} else if (ApiRcssg.operateType.BAOTING == curOpt.operate) { //报听
				let ucom = this._userList[optIndex]
				if (ucom) {
					ucom.setBaoTing(true)
					ucom.setBaoTingAni(true)
				}
			}
			let tg = this._tuoguanList[optIndex]
			if (tg && typeof (curOpt.isAuto) == "boolean") {
				tg.active = curOpt.isAuto
			}
			for (const uid in handCards) {
				let idx = RCSSGModel.getUserIndexByUID(uid);
				let uHandCards = handCards[uid].slice();
				this._disTileMgrList[idx].reset();
				uHandCards = RCSSGModel.sortTiles(null, uHandCards);
				this._optTileMgrList[idx].updateOptTiles(pengGangs[uid]);
				let last = this._disTileMgrList[idx].showOutTiles(outOpts[uid]);
				this._handTileMgrList[idx].updateLieTiles(uHandCards, curOpt.card);
				if (huCards[uid] != -1) this._handTileMgrList[idx].setHuTile(huCards[uid]);
				if (uid == curOpt.uid && curOpt.operate == ApiRcssg.operateType.QI) {
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
					bundle: Enums.bundleType.RCSSGMJ,
					path: "res/prefab/RCSSGResultDialog",
				}
				AssetsManager.createDialog(Object.assign(msg, baseData))
			}
			this.scheduleOnce(() => {
				createResultDialog();
			}, 2);
		} else {
			AssetsManager.clearDialog(['RCSSGResultDialog']);
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
			let idx = RCSSGModel.getUserIndexByUID(uid);
			showNode = this._operActNodeList[idx];
		}
		if (showNode) {
			let optNode = cc.instantiate(this.operActPfb);
			let CtrlAct = optNode.getComponent('RCSSGOperAct');
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
				bundle: Enums.bundleType.RCSSGMJ
			});
		}
		let idx = RCSSGModel.getUserIndexByUID(data.uid)
		/**展示动画 */
		let optNode = cc.instantiate(this.operActPfb);
		optNode.parent = this._operActNodeList[idx]
		let com = optNode.getComponent('RCSSGOperAct')
		com.showOpt(type);
		if (audioType >= 3) {
			let huIdxNode = cc.instantiate(this.operActPfb)
			huIdxNode.parent = this._operActNodeList[idx]
			let com1 = huIdxNode.getComponent('RCSSGOperAct')
			com1.showHuIndex(data.operate, data.plusInfo.index, data.uid, true);
			return
		}
		/**展示刮风和下雨 */
		if (type == 2) {
			let t = 5;
			if (data.operate === ApiRcssg.operateType.GANG_ZHI) {
				t = 7; //下雨
			}
			let fengNode = cc.instantiate(this.operActPfb);
			fengNode.parent = this.animationNode;
			let fcom = fengNode.getComponent("RCSSGOperAct");
			fcom.showOpt(t);
		}
	},

	showButtons(imm = false) {
		this.unscheduleAllCallbacks();
		let node = cc.find('Buttons', this.node);
		node.stopAllActions();
		node.opacity = 255;
		let dt = 2
		if (imm) dt = 0
		this.scheduleOnce(() => {
			cc.tween(node).to(2, {
				opacity: 0
			}).to(2, {
				opacity: 125
			}).union().repeatForever().start()
		}, dt);
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
		if (this._isShowHuanSanZhang) {
			return
		}
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
		if (this._isShowHuanSanZhang) {
			return
		}
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
		if (this._isShowHuanSanZhang) {
			return
		}
		this.tm += dt * this.speed;
		if (this.tm >= 1) {
			this.tm %= 1;
			if (!this.pause) {
				this.nextAct();
			}
		}
	},

	initHeads() {
		if (!this.baseData) return;
		let result = this.baseData.result || [];
		for (let i = 0; i < result.length; i++) {
			const user = result[i];
			let idx = RCSSGModel.getUserIndexByUID(user.uid);
			let com = this._userList[idx];
			com.reset();
			com.initReview(user);
		}
		this._tuoguanList.forEach(node => node.active = false)
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
		this._isShowHuanSanZhang = false
		this.animationNode.removeAllChildren()
	},

	onClose() {
		this.node.destroy()
	},
});