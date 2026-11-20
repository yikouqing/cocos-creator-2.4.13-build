const ApiLseqs = require('./ApiLseqs');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const LSEQSModel = require('./LSEQSModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const DEF_SPEED = 0.8
cc.Class({
	extends: cc.Component,
	properties: {
		txt_roomId: cc.Label,
		txt_round: cc.Label,
		txt_last: cc.Label,
		txt_gameName: cc.Label,
		resNode: cc.Node,
		operActPfb: cc.Prefab,

		headPfb: [cc.Prefab],

		/**用户脚本列表 下标为本地座位号*/
		_userList: [],
		/**手牌脚本列表 */
		_handCardMgrList: [],
		/**操作牌脚本列表 */
		_optCardMgrList: [],
		/**打出牌脚本列表 */
		_disCardMgrList: [],
		/**动画节点 */
		_operActNodeList: [],
		_curLastCardNum: 0,
	},

	start() {
		if (!this.node.nodeParams.reviewRecord) {
			this.node.destroy();
			return;
		}
		LSEQSModel.reset()
		LSEQSModel.myUid = UserModel.getData('uid');
		this.reviewRecord = Utils.deepCopy(this.node.nodeParams.reviewRecord)
		console.log("回放数据", this.reviewRecord)
		this.tm = 0;
		this.bureau = 0;
		this.speed = DEF_SPEED; //测试用
		this.index = 0;
		this.pause = true;
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
		this.updateData(true)
		this.checkHeadPos();
		this.initHeads();
		this.pause = false;
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
		if (this._userList.length > 0) {
			return
		}
		let headPos = [0, 1, 2, 3];
		let count = LSEQSModel.getChairCount()
		if (count == 2) headPos = [0, 2]
		else if (count == 3) headPos = [0, 1, 3]
		this._userList.length = 0;
		this._handCardMgrList.length = 0
		this._optCardMgrList.length = 0
		this._disCardMgrList.length = 0
		this._operActNodeList.length = 0;

		let cards = this.node.getChildByName("cards")
		for (let i = 0; i < headPos.length; i++) {
			let idx = headPos[i]
			let pfbIdx = 0 //左边的头像
			if (idx == 1 || idx == 2) { //右边的头像
				pfbIdx = 1
			}
			let head = cc.instantiate(this.headPfb[pfbIdx])
			let hParent = this.node.getChildByName("head" + idx);
			head.parent = hParent
			this._userList.push(head.getComponent("LSEQSHead"));
			this._userList[i].initRes();

			let hand = cards.getChildByName("hand" + idx)
			let hcom = hand.getComponent("LSEQSHandMgr")
			this._handCardMgrList.push(hcom)
			hcom.init(idx)

			let opt = cards.getChildByName("opt" + idx)
			let ocom = opt.getComponent("LSEQSOptMgr")
			this._optCardMgrList.push(ocom)
			ocom.init(idx)

			let dis = cards.getChildByName("out" + idx)
			let dcom = dis.getComponent("LSEQSOutMgr")
			this._disCardMgrList.push(dcom)
			dcom.init(idx)

			let opNode = cc.find("operAct" + idx, this.node);
			this._operActNodeList.push(opNode);
		}
	},

	/**更新数据 */
	updateData(isFirst = false) {
		this._baseData = Utils.deepCopy(this.reviewRecord[this.bureau]);
		let baseData = this._baseData;
		let roomData = baseData.baseRoomRecords;
		this.restCardsCount = roomData.leftCount;
		let userArray = roomData.userArray;
		for (const user of userArray) {
			if (!user.userInfo) {
				user.userInfo = { uid: user.uid }
			}
			LSEQSModel.otherUserJoinRoom(user)
		}
		if (isFirst) {
			LSEQSModel.gameRule = baseData.plusInfo.gameRule
			let bundle = ConfigModel.getBundleConfig(LSEQSModel.getGameRuleByKey("gameType"))
			this.txt_gameName.string = bundle.name
		}
		let plusInfo = baseData.plusInfo;
		let fanti = ["", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖", "拾"];
		let str = `${fanti[plusInfo.curBureau]}/${fanti[plusInfo.maxBureau]}圈  第${plusInfo.curGameBureau}局`;
		this.txt_round.string = str
		this.txt_roomId.string = '房号:' + roomData.roomID;
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
		this._handCardMgrList.forEach(c => {
			c.delMoCard()
		})
		this._disCardMgrList.forEach(c => {
			c.delDisCard()
		});
		this.setPlay(this.index);
	},

	nextAct(event) {
		if (event) {
			this.showButtons();
		}
		if (!this.reviewRecord[this.bureau]) {
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
		AssetsManager.clearDialog(['LSEQSResultDialog']);
		this.updateData()
		this.index = 0;
		this.pause = false;
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
			AssetsManager.clearDialog(['LSEQSResultDialog']);
			this.updateData()
			this.index = 0;
			this.pause = false;
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
		this.speed = DEF_SPEED;
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
		LSEQSModel.setHandCards(handCards);

		let curOpt = operateRecords[index];
		LSEQSModel.resetOperateRecords();
		this._curLastCardNum = this.restCardsCount
		//找当前ACTION发生之前的操作
		for (let i = 0; i < operateRecords.length; i++) {
			if (i > index || index == 0) break;
			let item = operateRecords[i];
			if (item.operate == ApiLseqs.operateType.GET || item.operate == ApiLseqs.operateType.FAN) { //摸牌放到手牌
				this._curLastCardNum--;
			}
			LSEQSModel.onUserOpt(item)
		}


		for (const uid in handCards) {
			let idx = LSEQSModel.getUserIndexByUID(uid)
			let cards = LSEQSModel.getHandCards(uid)
			/**刷新手牌 */
			let hcom = this._handCardMgrList[idx]
			hcom.updateHandCards(cards)
			/**刷新丢在桌子上的牌 */
			let disList = LSEQSModel.getTableCardByUid(uid)
			let dcom = this._disCardMgrList[idx]
			dcom && dcom.updateOutCard(disList, true)
			/**刷新吃碰杠的牌 */
			let optList = LSEQSModel.getOptCardByUid(uid)
			let ocom = this._optCardMgrList[idx]
			ocom && ocom.updateOptCards(optList)
			/**刷新手牌数量 */
			let ucom = this._userList[idx]
			ucom && ucom.setLastNum(LSEQSModel.getHandCount(uid))
			/**刷新胡数 */
			let huCount = LSEQSModel.getBaiHuCount(uid)
			ucom && ucom.setHuNum(huCount)
		}

		if (curOpt) {
			let data = curOpt
			let uid = curOpt.uid
			let idx = LSEQSModel.getUserIndexByUID(uid)
			let hcom = this._handCardMgrList[idx]
			let dcom = this._disCardMgrList[idx]
			let ocom = this._optCardMgrList[idx]

			/**展示动画 */
			let showAni = () => {
				let aniCom = this.genOperActNode(data.uid)
				aniCom && aniCom.showOpt(data.operate)
				if (data.plusInfo && data.plusInfo.baKuai) {
					let aniCom1 = this.genOperActNode(data.uid)
					aniCom1 && aniCom1.showBaKuai(data.plusInfo.baKuai)
				}
			}
			/**删除所有的出的牌和摸的牌 */
			let delCards = () => {
				for (let i = 0; i < this._handCardMgrList.length; i++) {
					this._handCardMgrList[i].delMoCard()
					this._disCardMgrList[i].delDisCard()
				}
			}

			let sex = 'nv';
			// if (user) {
			// 	sex = (user.userInfo.sex == 0) ? 'nan' : 'nv';
			// }

			let cardPath = `res/audio/${sex}/puke/${data.card}`
			let optPath = `res/audio/${sex}/opt${data.operate}`
			let commPath = "res/audio/common/"

			let playSound = (path) => {
				// console.log("播放了声音", path)
				AssetsManager.playEffect({
					path: path,
					bundle: LSEQSModel.getGameType()
				});
			}

			switch (data.operate) {
				case ApiLseqs.operateType.QI: //出牌
					dcom && dcom.showDisCard(data.card)
					playSound(cardPath)
					break;
				case ApiLseqs.operateType.FAN: //翻牌
					hcom && hcom.showMoPaiAni(data.card)
					playSound(cardPath)
					break;
				case ApiLseqs.operateType.GET: //摸牌
					hcom && hcom.showMoPaiAni(data.card)
					hcom && hcom.showFlyToPaiDui(data.card)
					playSound(cardPath)
					break;
				case ApiLseqs.operateType.DIU: //丢牌堆
					dcom && dcom.showDiuAni(data.card)
					playSound(commPath + "mopai")
					break;
				case ApiLseqs.operateType.CHI:
				case ApiLseqs.operateType.DUI:
				case ApiLseqs.operateType.KAI:
					/**摆牌展示多个动画 */
					if (data.plusInfo && data.plusInfo.baiList && data.plusInfo.baiList.length > 0) {
						ocom && ocom.showMultiOptAnis(data.plusInfo.baiList.length + 1)
					} else {
						ocom && ocom.showOptAni()
					}
					showAni()
					delCards()
					playSound(optPath)
					break;
				case ApiLseqs.operateType.BAYU:
					showAni()
					break;
				case ApiLseqs.operateType.HU:
					/**展示胡的牌 */
					showAni()
					hcom && hcom.showHuPai(data.card)
					playSound(optPath)
					break;
				default:
					break;
			}

			this.txt_last.string = this._curLastCardNum + "";
		}

		/**恢复巴雨 */
		let bayuList = LSEQSModel.getAllBaYuOpt()
		if (bayuList && bayuList.length > 0) {
			bayuList.forEach(opt => {
				let idx = LSEQSModel.getUserIndexByUID(opt.uid)
				let ocom = this._optCardMgrList[idx]
				ocom && ocom.showBaYu(opt)
			});
		}

		if (index == operateRecords.length - 1) {
			/* 显示结算界面 */
			let msg = {
				path: "res/prefab/LSEQSResultDialog",
				bundle: LSEQSModel.getGameType(),
				parent: this.resNode,
				isReview: true,
			}
			msg = Object.assign(msg, baseData)
			AssetsManager.createDialog(msg)
		} else {
			AssetsManager.clearDialog(['LSEQSResultDialog']);
		}
	},

	/**清除桌面上所有牌 */
	resetTable() {
		this._handCardMgrList.forEach(c => {
			c.reset()
		});
		this._disCardMgrList.forEach(c => {
			c.reset()
		});
		this._optCardMgrList.forEach(c => {
			c.reset()
		});
		this._userList.forEach(c => {
			c.reset()
		});
		this._operActNodeList.forEach(n => {
			n.removeAllChildren()
		})
	},

	initHeads() {
		let baseData = this._baseData;
		let roomData = baseData.baseRoomRecords;
		let userArray = roomData.userArray;
		for (let i = 0; i < userArray.length; i++) {
			const user = userArray[i];
			let idx = LSEQSModel.getUserIndexByUID(user.uid);
			let com = this._userList[idx];
			com.initReview(user);
		}
	},

	onClose() {
		this.node.destroy()
	},

	/**生成一个新的操作动画 */
	genOperActNode(uid, showNode, nodeName = "operAni") {
		if (!showNode) {
			let idx = LSEQSModel.getUserIndexByUID(uid);
			showNode = this._operActNodeList[idx];
		}
		let optNode = cc.instantiate(this.operActPfb);
		optNode.name = nodeName
		let com = optNode.getComponent('LSEQSOperAct');
		optNode.parent = showNode;
		return com
	},
});