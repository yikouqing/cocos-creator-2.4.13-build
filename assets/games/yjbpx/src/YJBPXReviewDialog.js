const ApiYjbpx = require('./ApiYjbpx');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const YJBPXModel = require('./YJBPXModel');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
	extends: cc.Component,
	properties: {
		com_clock: require("YJBPXClock"),
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
		_curLastCardNum: 0,

		/**搬马脚本列表 */
		_banTileMgrList: [],
		/**搬码数据 */
		_banMaList: [],
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
		YJBPXModel.myUid = this.myUid
		YJBPXModel.isReview = true
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
		this.com_clock.gameInit(YJBPXModel.getChairCount(), YJBPXModel.getMyChairID())
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
		YJBPXModel.resetAll()
	},

	/**更新数据 */
	updateData(isFirst = false) {
		this._baseData = Utils.deepCopy(this.reviewRecord[this.bureau]);
		let baseData = this._baseData;
		YJBPXModel.setGhostCard(baseData.plusInfo.laiZiCards);
		let roomData = baseData.baseRoomRecords;
		this.restCardsCount = roomData.leftCount;
		this._banMaList = Utils.deepCopy(baseData.plusInfo.banMaList) || {}
		if (isFirst) {
			YJBPXModel.gameRule = baseData.plusInfo.gameRule
			let userArray = roomData.userArray;
			for (const user of userArray) {
				YJBPXModel.otherUserJoinRoom(user)
			}
		}
	},

	/**判断人数，初始化头像位置 */
	checkHeadPos() {
		let chairCount = YJBPXModel.getChairCount()
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
			this._userList.push(headNode.getComponent("YJBPXHead"));
			this._userList[i].initRes();
			let handTile = cc.find("tiles/handTiles" + idx, this.node);
			let optTile = cc.find("tiles/optTiles" + idx, this.node);
			if (!optTile) {
				optTile = cc.find("optTiles" + idx, handTile);
			}
			let disTile = cc.find("tiles/outTiles" + idx, this.node);
			this._handTileMgrList.push(handTile.getComponent("YJBPXHandTileMgr"));
			this._handTileMgrList[i].init(idx);
			this._optTileMgrList.push(optTile.getComponent("YJBPXOptTileMgr"));
			this._optTileMgrList[i].init(i);
			this._disTileMgrList.push(disTile.getComponent("YJBPXOutTileMgr"));
			this._disTileMgrList[i].init(idx);
			let opNode = cc.find("operAct" + idx, this.node);
			this._operActNodeList.push(opNode);
			this._tuoguanList.push(this.tuoguanNode.getChildByName("" + idx))

			let banNode = cc.find("tiles/banMa" + idx, this.node);
			this._banTileMgrList.push(banNode.getComponent("YJBPXBanTileMgr"));
			this._banTileMgrList[i].init(idx);
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
		AssetsManager.clearDialog(['YJBPXResultDialog']);
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
			AssetsManager.clearDialog(['YJBPXResultDialog']);
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
		let baseData = this._baseData
		let operateRecords = Utils.deepCopy(baseData.operateRecords)
		let roomData = baseData.baseRoomRecords;
		let handCards = Utils.deepCopy(roomData.handCards); /* 手牌 */
		YJBPXModel.setHandCards(handCards)

		let curOpt = operateRecords[index];
		YJBPXModel.resetOperateRecords()
		this._curLastCardNum = this.restCardsCount
		//找当前ACTION发生之前的操作
		for (let i = 0; i < operateRecords.length; i++) {
			if (i >= index || index == 0) break;
			let item = operateRecords[i];
			if (item.operate == ApiYjbpx.operateType.GET) { //摸牌放到手牌
				this._curLastCardNum--;
			}
			YJBPXModel.onUserOpt(item)
		}

		let hulist = YJBPXModel.getUserHuDonList()

		for (const uid in handCards) {
			if (!hulist.some((info) => info.uid == uid)) {
				let idx = YJBPXModel.getUserIndexByUID(uid);
				let cards = YJBPXModel.getHandCards(uid)
				/**刷新手牌 */
				this._handTileMgrList[idx].setHuTile(null);
				this._handTileMgrList[idx].updateLieTiles(cards)
				/**刷新打出来的牌 */
				this._disTileMgrList[idx].reset()
				let outCards = YJBPXModel.getOutTilesByUID(uid)
				this._disTileMgrList[idx].showOutTiles(outCards);
				/**刷新操作牌 */
				this._optTileMgrList[idx].reset()
				let optCards = YJBPXModel.getPengGangArrayByUID(uid)
				this._optTileMgrList[idx].updateOptTiles(optCards);
				/**刷新搬码 */
				let banMaList = this._banMaList[uid]
				if (banMaList && banMaList.length > 0) {
					let lastOpt = null
					for (let i = index; i >= 0; i--) {
						let opt = operateRecords[i]
						if (opt && opt.uid == uid && YJBPXModel.optCheck(opt.operate)) {
							lastOpt = opt
							break
						}
					}
					if (lastOpt) {
						let bidx = banMaList.findIndex((info) => {
							return info.card == lastOpt.card && info.type == lastOpt.operate
						})
						this._banTileMgrList[idx].reset()
						if (bidx != -1) {
							let nowBanMaList = banMaList.slice(0, bidx + 1)
							this._banTileMgrList[idx].setBanMaShowAll(nowBanMaList)
						}
					}
				}
			} else {
				console.log("胡过牌的人===", uid)
			}
		}

		if (curOpt) {
			this.onUserOpt(curOpt)
			this.txt_last.string = `${this._curLastCardNum}`
		}

		if (index >= operateRecords.length - 1) {
			/* 显示结算界面 */
			let resData = Utils.deepCopy(baseData)
			resData.path = "res/prefab/YJBPXResultDialog"
			resData.bundle = Enums.bundleType.YJBPX
			resData.parent = this.mjResultNode
			resData.isReview = true
			let dt = 1
			this.scheduleOnce(() => {
				AssetsManager.createDialog(resData);
			}, dt)
			this.pause = true
		} else {
			AssetsManager.clearDialog(['YJBPXResultDialog']);
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

		this._banTileMgrList.forEach(c => {
			c.reset()
		})
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

	/**用户操作广播 */
	onUserOpt(data) {
		YJBPXModel.onUserOpt(data)
		let idx = YJBPXModel.getUserIndexByUID(data.uid);
		let sex = 'nv';

		let tg = this._tuoguanList[idx]
		if (tg && typeof (data.isAuto) == "boolean") {
			tg.active = data.isAuto
		}

		this.com_clock.setDir(idx);
		let optPengGang = () => {
			let pengGangArray = YJBPXModel.getPengGangArrayByUID(data.uid);
			let optCom = this._optTileMgrList[idx];
			if (optCom) optCom.updateOptTiles(pengGangArray);
			let lastOut = YJBPXModel.getLastOutCardRecord();
			if (!!lastOut.isDel) {
				let localIndex = YJBPXModel.getUserIndexByUID(lastOut.opt.uid);
				this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
				this.updatePointer();
			}
		}

		let optHu = () => {
			/** 亮出胡的牌 */
			let hcom = this._handTileMgrList[idx];
			if (hcom) {
				let huNode = hcom.setHuTile(data.card)
				let optNode = this._operActNodeList[idx]
				this.scheduleOnce(() => {
					let pos = CCUtil.postionConvert(huNode, optNode)
					let aniCom = this.genAniNode(optNode, null, pos)
					aniCom.node.scale = hcom.node.scale
					aniCom.showHuLight()
				}, 0.2)
			}

			/**删除桌子上的牌 */
			let lastOut = YJBPXModel.getLastOutCardRecord();
			if (!!lastOut.isDel) {
				let localIndex = YJBPXModel.getUserIndexByUID(lastOut.opt.uid);
				this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
				this.updatePointer();
			}
		}

		let showAni = (type) => {
			let typeNameList = ["chi", "peng", "gang", "hu", "zimo"];
			/**声音 */
			let aName = ""
			if (type < typeNameList.length) {
				aName = typeNameList[type]
			}
			if (aName != "") {
				AssetsManager.playEffect({
					bundle: Enums.bundleType.YJBPX,
					path: `res/audio/${sex}/${aName}`,
				});
			}

			/**动画 */
			let com = this.genAniNode(this._operActNodeList[idx])
			com && com.showOpt(type)

			/**血战模式展示刮风和下雨 */
			if (type == 2) {
				let t = 5
				if (data.operate === ApiYjbpx.operateType.GANG_ZHI) {
					t = 7 //下雨
				}
				AssetsManager.playEffect({
					path: `res/audio/main/${t == 5 ? "guafeng" : ""}`,
					bundle: Enums.bundleType.YJBPX
				});
				let fcom = this.genAniNode(this.node)
				fcom.showOpt(t)
			}
			if (type == 3 || type == 4) {
				this.showHuIdx(data.uid, true); //胡牌序列
			}
		}

		switch (data.operate) {
			case ApiYjbpx.operateType.GET: //摸牌
				this._handTileMgrList[idx].setHuTile(data.card)
				this._curLastCardNum--;
				break;
			case ApiYjbpx.operateType.QI: //出牌
				/**更新桌子上的牌 */
				let out = YJBPXModel.getOutTilesByUID(data.uid)
				let last = null,
					disCom = this._disTileMgrList[idx]
				if (disCom) last = disCom.showOutTiles(out)
				if (last && last.flower == data.card) {
					this.updatePointer(last.node)
				}
				AssetsManager.playEffect({
					path: `res/audio/${sex}/` + data.card,
					bundle: Enums.bundleType.YJBPX
				});
				this.scheduleOnce(() => {
					AssetsManager.playEffect({
						path: 'res/audio/main/dapai',
						bundle: Enums.bundleType.YJBPX
					});
				}, 0.1)
				break;
			case ApiYjbpx.operateType.CHI: //吃牌
				showAni(0)
				optPengGang()
				break;
			case ApiYjbpx.operateType.PENG: //碰牌
				showAni(1)
				optPengGang()
				break;
			case ApiYjbpx.operateType.GANG_BU: //补杠
				showAni(2)
				optPengGang()
				break;
			case ApiYjbpx.operateType.GANG_CHI: //吃杠
				showAni(2)
				optPengGang()
				break;
			case ApiYjbpx.operateType.GANG_ZHI: //暗杠
				showAni(2)
				optPengGang();
				break;
			case ApiYjbpx.operateType.HU_CHI: //接炮
				showAni(3);
				optHu();
				break;
			case ApiYjbpx.operateType.HU_ZHI: //自摸
				showAni(4)
				optHu();
				break;
			case ApiYjbpx.operateType.HU_QIANG: //抢杠
				showAni(3)
				optHu();
				break;
			default:
				break;
		}
		let hulist = YJBPXModel.getUserHuDonList()
		if (data.operate != ApiYjbpx.operateType.GET && !hulist.some((info) => info.uid == data.uid)) {
			let h = YJBPXModel.getHandCards(data.uid)
			this._handTileMgrList[idx].updateLieTiles(h)
		}
	},

	initHeads() {
		let baseData = this._baseData;
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		for (let i = 0; i < userArray.length; i++) {
			const user = userArray[i];
			let idx = YJBPXModel.getUserIndexByUID(user.uid);
			let com = this._userList[idx];
			com.initReview(user);
		}
		this._tuoguanList.forEach(node => node.active = false)
	},

	onClose() {
		this.node.destroy()
	},

	/**设置房间信息 */
	setRoundShow() {
		let baseData = this._baseData;
		this.txt_round.string = `${baseData.baseRoomRecords.curBureau}/${YJBPXModel.getGameRuleByKey("bureau")}局`;
		this.txt_roomId.string = '房号:' + baseData.baseRoomRecords.roomID;
		this.txt_baseScore.string = `底:${YJBPXModel.getGameRuleByKey("baseScore")}   `
		let huMode = YJBPXModel.getGameRuleByKey("huMode")
		if (huMode == 1) { this.txt_baseScore.string += "血战" }
		else if (huMode == 2) { this.txt_baseScore.string += "推倒胡" }
		this.txt_name.string = `${ConfigModel.getGameName(YJBPXModel.getGameRuleByKey("gameType"))}`;
	},

	/**展示胡牌序列 */
	showHuIdx(uid, isAnim = false) {
		let huList = YJBPXModel.getUserHuDonList()
		if (isAnim && uid) {
			let index = huList.findIndex((info) => {
				return info.uid == uid
			})
			if (index !== -1) {
				let huInfo = huList[index]
				index++
				let idx = YJBPXModel.getUserIndexByUID(uid)
				let com = this.genAniNode(this._operActNodeList[idx])
				com.showHuIndex(huInfo.operateType, index, uid, isAnim);
			}
		} else {
			for (let i = 0; i < huList.length; i++) {
				const huInfo = huList[i];
				const index = i + 1
				let idx = YJBPXModel.getUserIndexByUID(huInfo.uid)
				let com = this.genAniNode(this._operActNodeList[idx])
				com.showHuIndex(huInfo.operateType, index, huInfo.uid, isAnim);
			}
		}
	},

	/**生成一个新的操作动画 */
	genAniNode(pNode, nodeName, pos) {
		if (cc.isValid(pNode)) {
			if (nodeName) {
				let aNode = pNode.getChildByName(nodeName)
				if (cc.isValid(aNode)) {
					aNode.destroy()
				}
			}
			let aniNode = cc.instantiate(this.operActPfb)
			aniNode.name = nodeName || "aniNode"
			aniNode.parent = pNode
			if (pos) {
				aniNode.setPosition(pos)
			}
			let acom = aniNode.getComponent("YJBPXOperAct")
			return acom
		}
		return null
	},
});