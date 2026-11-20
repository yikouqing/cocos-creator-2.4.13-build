const ApiYdr = require('./ApiYdr');
const UserModel = require('../../../src/model/UserModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const YDRLogic = require("./YDRLogic")
const Utils = require('../../../src/utils/Utils');

cc.Class({
	extends: cc.Component,
	properties: {
		txt_roomId: cc.Label,
		txt_round: cc.Label,
		txt_last: cc.Label,
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

	/**判断人数，初始化头像位置 */
	checkHeadPos() {
		if (this._userList.length > 0) {
			return
		}
		let headPos = [0, 1, 2];
		if (this.userArray.length == 2) {
			headPos = [0, 1]
		}
		this._userList.length = 0;
		this._handCardMgrList.length = 0
		this._optCardMgrList.length = 0
		this._disCardMgrList.length = 0
		this._operActNodeList.length = 0;

		let cards = this.node.getChildByName("cards")
		for (let i = 0; i < headPos.length; i++) {
			let hPos = headPos[i]
			let pfbIdx = 0 //左边的头像
			if (hPos == 1) { //右边的头像
				pfbIdx = 1
			}
			let head = cc.instantiate(this.headPfb[pfbIdx])
			let hParent = this.node.getChildByName("head" + hPos);
			head.parent = hParent
			this._userList.push(head.getComponent("YDRHead"));
			this._userList[i].initRes();

			let hand = cards.getChildByName("hand" + hPos)
			let hcom = hand.getComponent("YDRHandMgr")
			this._handCardMgrList.push(hcom)
			hcom.init(hPos)

			let opt = cards.getChildByName("opt" + hPos)
			let ocom = opt.getComponent("YDROptMgr")
			this._optCardMgrList.push(ocom)
			ocom.init(hPos)

			let dis = cards.getChildByName("out" + hPos)
			let dcom = dis.getComponent("YDROutMgr")
			this._disCardMgrList.push(dcom)
			dcom.init(hPos)

			let opNode = cc.find("operAct" + hPos, this.node);
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
		AssetsManager.clearDialog(['YDRResultDialog']);
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
			return;
		} else {
			this.resetTable()
			AssetsManager.clearDialog(['YDRResultDialog']);
			let roomData = baseData.baseRoomRecords;
			MessageCallback.emitMessage("reviewClear")
			this.index = 0;
			let userArray = roomData.userArray;
			if (!userArray || userArray.length < 2) {
				AssetsManager.tipDialog(`暂时没有第${this.bureau + 1}局的数据`);
				return
			}
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
		let baseData = Utils.deepCopy(this.reviewRecord[this.bureau]);
		let roomData = baseData.baseRoomRecords;
		this.restCardsCount = roomData.leftCount;
		let handCards = Utils.deepCopy(roomData.handCards); /* 手牌 */
		if (index == 0) {
			for (const uid in handCards) {
				if (Object.hasOwnProperty.call(handCards, uid)) {
					let copyHandCards = Utils.deepCopy(handCards[uid]);
					let baiPaiList = YDRLogic.getBaiPaiList(copyHandCards)
					let idx = this.getUserIndexByID(uid)
					let hcom = this._handCardMgrList[idx]
					hcom && hcom.updateHandCards(baiPaiList)
				}
			}
		}
		let operateRecords = Utils.deepCopy(baseData.operateRecords);
		this.txt_round.string = '局数:' + (this.bureau + 1) + '/' + roomData.maxBureau;
		this.txt_roomId.string = '房号:' + roomData.roomID;
		let pengGangs = {}; /* 碰杠的牌 */
		let outOpts = {}; /* 出的牌 */
		for (const uid in handCards) {
			pengGangs[uid] = [];
			outOpts[uid] = [];
		}

		let curOpt = operateRecords[index];
		//找当前ACTION发生之前的操作
		for (let i = 0; i < operateRecords.length; i++) {
			if (i > index || index == 0) break;
			let item = operateRecords[i];
			if (item.operate == ApiYdr.operateType.GET) { //摸牌放到手牌
				handCards[item.uid].push(item.card);
				this.restCardsCount--;
			} else if (item.operate == ApiYdr.operateType.FAN) { //翻牌
				this.restCardsCount--;
			} else if (item.operate == ApiYdr.operateType.QI) { //出牌
				handCards[item.uid].splice(handCards[item.uid].indexOf(item.card), 1);
			} else if (item.operate == ApiYdr.operateType.DIU) { //丢牌堆
				outOpts[item.uid].push(item.card);
			} else if (item.operate == ApiYdr.operateType.PENG || item.operate == ApiYdr.operateType.CHI ||
				item.operate == ApiYdr.operateType.SHA || item.operate == ApiYdr.operateType.TUHUO) { //操作的牌
				if (item.plusInfo && item.plusInfo.cardList && item.plusInfo.cardList.length > 0) {
					pengGangs[item.uid].push(item.plusInfo.cardList.slice())
					let delList = item.plusInfo.cardList.slice()
					delList.splice(delList.indexOf(item.card), 1) //删掉手牌之外的那张操作牌
					while (delList.length > 0) { //从手牌把操作了的牌删掉
						let c = delList.pop()
						handCards[item.uid].splice(handCards[item.uid].indexOf(c), 1);
					}
				}
			} else if (item.operate == ApiYdr.operateType.TOU) { //偷牌
				let touCards = item.plusInfo.touCards
				if (touCards && touCards.length > 0) {
					this.restCardsCount -= touCards.length
					touCards.forEach(cardId => {
						handCards[item.uid].push(cardId)
					});
				}
			}
		}

		if (curOpt) {
			let data = curOpt
			let uid = curOpt.uid
			let idx = this.getUserIndexByID(uid)
			let ucom = this._userList[idx]
			let hcom = this._handCardMgrList[idx]
			let dcom = this._disCardMgrList[idx]
			let ocom = this._optCardMgrList[idx]

			let num = 0
			let opts = pengGangs[uid]
			if (opts && opts.length > 0) {
				opts.forEach(list => {
					num += YDRLogic.getCardTuo(list)
				});
				// console.log("获取陀数==", opts, num, uid)
			}

			/**更新陀数 */
			ucom && ucom.setTuoShu(num)

			/**刷新手牌 */
			let updateHand = () => {
				let copyHandCards = Utils.deepCopy(handCards[uid]);
				let baiPaiList = YDRLogic.getBaiPaiList(copyHandCards)
				// console.log("刷新了手牌===", baiPaiList)
				hcom && hcom.updateHandCards(baiPaiList)
			}
			/**展示动画 */
			let showAni = () => {
				let showNode = this._operActNodeList[idx]
				if (cc.isValid(showNode)) {
					showNode.removeAllChildren()
					let aniNode = cc.instantiate(this.operActPfb)
					aniNode.parent = showNode
					let aniCom = aniNode.getComponent("YDROperAct")
					aniCom.showOpt(data.operate)
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
					bundle: Enums.bundleType.YDR
				});
			}

			switch (data.operate) {
				case ApiYdr.operateType.QIPAI: //起
					ucom && ucom.setQi(true)
					// playSound(optPath)
					break;
				case ApiYdr.operateType.KOU: //扣
					ucom && ucom.setXiaKe(true)
					hcom && hcom.setKouPai()
					if (this.index > 0) {
						playSound(optPath)
					}
					break;
				case ApiYdr.operateType.BAOZI: //包子
					ucom && ucom.setBaoZi(true)
					hcom && hcom.setKouPai()
					if (this.index > 0) {
						playSound(optPath)
					}
					break;
				case ApiYdr.operateType.TOU: //偷
					ucom && ucom.showTouAni(1)
					if (data.uid == this.myUid) {
						updateHand()
						let touCards = data.plusInfo.touCards
						if (touCards && touCards.length > 0) {
							touCards.forEach(cardId => {
								hcom && hcom.showMoPaiAni(cardId)
								hcom && hcom.showFlyToPaiDui(cardId)
							});
						}
					}
					break;
				case ApiYdr.operateType.BUTOU: //不偷
					ucom && ucom.showTouAni(2)
					break;
				case ApiYdr.operateType.QI: //出牌
					dcom && dcom.showDisCard(data.card)
					updateHand()
					playSound(cardPath)
					break;
				case ApiYdr.operateType.FAN: //翻牌
					hcom && hcom.showMoPaiAni(data.card)
					playSound(cardPath)
					break;
				case ApiYdr.operateType.GET: //摸牌
					updateHand()
					hcom && hcom.showMoPaiAni(data.card)
					hcom && hcom.showFlyToPaiDui(data.card)
					playSound(cardPath)
					break;
				case ApiYdr.operateType.DIU: //丢牌堆
					/**刷新丢在桌子上的牌 */
					let disList = outOpts[uid]
					dcom && dcom.updateOutCard(disList, true)
					dcom && dcom.showDiuAni(data.card)
					playSound(commPath + "mopai")
					break;
				case ApiYdr.operateType.CHI:
				case ApiYdr.operateType.PENG:
				case ApiYdr.operateType.SHA:
				case ApiYdr.operateType.TUHUO:
					/**刷新吃碰杠的牌 */
					let optList = pengGangs[uid]
					ocom && ocom.updateOptCards(optList)
					ocom && ocom.showOptAni()
					showAni()
					updateHand()
					delCards()
					playSound(optPath)
					if (data.operate == ApiYdr.operateType.SHA || data.operate == ApiYdr.operateType.TUHUO) playSound(commPath + "opt" + data.operate)
					break;
				case ApiYdr.operateType.HU:
					/**展示胡的牌 */
					showAni()
					hcom && hcom.showHuPai(data.card)
					playSound(optPath)
					break;
				default:
					break;
			}

			this.txt_last.string = this.restCardsCount;
		}

		if (index == operateRecords.length - 1) {
			/* 显示结算界面 */
			let msg = {
				path: "res/prefab/YDRResultDialog",
				bundle: Enums.bundleType.YDR,
				parent: this.resNode,
				isReview: true,
			}
			msg = Object.assign(msg, baseData)
			AssetsManager.createDialog(msg)
		} else {
			AssetsManager.clearDialog(['YDRResultDialog']);
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