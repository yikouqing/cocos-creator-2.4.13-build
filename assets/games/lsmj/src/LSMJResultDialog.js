const ApiRoom = require('../../../src/api/ApiRoom');
const ApiLsmj = require('./ApiLsmj');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const LSMJModel = require('./LSMJModel');
const MAX_USER_NUM = 4;
const Utils = require('../../../src/utils/Utils');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		userLayOut: cc.Node,
		userItemNode: cc.Node,
		cardTypeItemNode: cc.Node,
		huScoreItemNode: cc.Node,
		clockLabel: cc.Label,
		bureauLabel: cc.Label,
		txt_roomInfo: cc.Label,
		txt_round: cc.Label,
		txt_gameRule: cc.Label,
		bgwin: cc.Node,
		bglose: cc.Node,
		btn_qiePai: cc.Node,
		laiziLay: cc.Node,

		_myChairId: null, //自己的座位号
		_gameRule: null, //游戏规则
		_roomId: 0, //房间号
		_plusInfo: null
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		this.tick = 0;
		// console.log("resultData==", this.node.nodeParams)
		if (!!this.node.nodeParams.result) {
			this.resultData = Utils.deepCopy(this.node.nodeParams.result);
			this._plusInfo = Utils.deepCopy(this.node.nodeParams.plusInfo);
			this._gameRule = this._plusInfo.gameRule;
			this._roomId = this._plusInfo.roomID;
			this._laiZiCards = Utils.deepCopy(this._plusInfo.laiZiCards);
		}
		let resBtnNode = cc.find('resBtnNode', this.node);
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
		let clockNode = cc.find("Clock", resBtnNode);
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			reviewBtnNode.active = false;
			resBtnNode.active = false;
		} else if (this.node.nodeParams.isResult) { //正常结算页面
			reviewBtnNode.active = false;
			resBtnNode.active = true;
			// console.log("结算时间==", LSMJModel.getTick())
			clockNode.active = !this.node.nodeParams.isBureauFull && LSMJModel.getTick() > 0;
			this.tick = LSMJModel.getTick() + 2
		} else { //战绩回放页面显示左右翻页按钮
			resBtnNode.active = false;
			reviewBtnNode.active = true;
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			if (lastItem && !lastItem.result) {
				/* 最后一局未完成，删除 */
				this.reviewRecord.pop();
			}
			this.bureau = 0;
		}
		if (this.reviewRecord && this.reviewRecord[this.bureau]) {
			this._plusInfo = this.reviewRecord[this.bureau].plusInfo;
			this._gameRule = this._plusInfo.gameRule
			this._roomId = this._plusInfo.roomID
		}
		this.setRoomInfo()
		if (this.node.nodeParams.isResult) {
			this.setAllHandCards();
			this.showQiePai()
			this.node.active = true;
		} else if (this.node.nodeParams.isReview) {
			this.setAllHandCards();
		} else {
			this.showResult()
		}
	},

	showQiePai() {
		if (this._gameRule.qiePaiType == 0) {
			this.btn_qiePai.active = false
		} else if (this._gameRule.qiePaiType == 1) {
			this.btn_qiePai.active = true
		} else if (this._gameRule.qiePaiType == 2) {
			this.btn_qiePai.active = false
		}
	},

	setRoomInfo() {
		let str = ""
		if (this._roomId) {
			str += `房号:${this._roomId}`
		}
		if (this._gameRule) {
			let ruleStr = "玩法:";
			ruleStr += `${this._gameRule.roomType}房 `;
			ruleStr += `${this._gameRule.laiZiCount}癞子 `;
			ruleStr += "\n";
			let cnt = 0;
			if (this._gameRule.qiHuRate > 0) {
				ruleStr += `${this._gameRule.qiHuRate}番起胡 `;
				cnt++
			}
			ruleStr += `${this._gameRule.maxRate}番封顶 `;
			cnt++
			if (this._gameRule.huanZhangCount > 0) {
				ruleStr += `换${this._gameRule.huanZhangCount}张 `;
				cnt++
				let huanHuaSe = ['同花色换', '任意换', '任意混换'];
				ruleStr += `${huanHuaSe[this._gameRule.huanZhangHuaSeType]} `;
				cnt++
			};
			if (cnt > 1) ruleStr += "\n"
			if (this._gameRule.siJiFaCai) {
				ruleStr += "三鸡发财 ";
				cnt++
			};
			if (this._gameRule.sanJiFaCai) {
				ruleStr += "四鸡发财 ";
				cnt++
			};
			if (this._gameRule.pengHouKeHuan) {
				ruleStr += "碰后可换 ";
			}
			if (this._gameRule.gangHouKeHuan) {
				ruleStr += "杠后可换 ";
			}
			str += `  底分:${this._gameRule.baseScore}`
			this.txt_gameRule.string = ruleStr
		}

		if (str != "") {
			this.txt_roomInfo.string = str
		}
	},

	/**找出自己的座位号 */
	findMyChairId() {
		if (!this.resultData) return;
		this._myChairId = 0;
		for (let i = 0; i < this.resultData.length; i++) {
			const user = this.resultData[i];
			if (UserModel.getData("uid") === user.uid) {
				this._myChairId = i;
			}
		}
	},

	setAllHandCards() {
		this.findMyChairId();
		this.showUserInfo();
	},

	/**选中头像后展示信息 */
	showUserInfo() {
		this.userLayOut.removeAllChildren();
		if (!this.resultData) return;
		let users = this.resultData;
		if (!users) return;
		let loseCount = 0
		for (const user of users) {
			if (!user) continue;
			LSMJModel.setLaiZiCards(user.laiZiCards);
			let uNode = cc.instantiate(this.userItemNode);
			uNode.parent = this.userLayOut;
			uNode.active = true;
			cc.find('txt_nick', uNode).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 6, '..');
			// cc.find('txt_uid', uNode).getComponent(cc.Label).string = user.uid != UserModel.getData("uid") ? Utils.stringSecurity(user.uid) : user.uid;
			cc.find('txt_uid', uNode).getComponent(cc.Label).string = 'ID:' + user.uid;
			cc.find("banker", uNode).active = user.bankerUid == user.uid
			AssetsManager.loadSpriteFrame({
				path: user.avatar,
				sprite: cc.find('head', uNode).getComponent(cc.Sprite)
			});
			let score = user.winScores || 0;
			score = Utils.formatNumberWithDecimal(score, 1);
			let win = cc.find('win', uNode).getComponent(cc.Label);
			let lose = cc.find('lose', uNode).getComponent(cc.Label);
			if (user.uid == UserModel.getData('uid')) {
				this.bgwin.active = score >= 0;
				this.bglose.active = !(this.bgwin.active);
			}
			win.node.active = true;
			lose.node.active = true
			if (score > 0) {
				lose.string = ""
				win.string = '+' + score
			} else {
				win.string = ""
				lose.string = score + ""
			}
			let handTiles = cc.find('handTiles', uNode);
			let handTileMgr = handTiles.getComponent('LSMJHandTileMgr');
			!!handTileMgr && handTileMgr.init();
			let optTiles = cc.find('optTiles', handTiles);
			let optTileMgr = optTiles.getComponent('LSMJOptTileMgr');
			!!optTileMgr && optTileMgr.init();
			let handCards = !user.userCards || !user.userCards[user.uid] ? [] : user.userCards[user.uid].slice();
			let pengGangArray = LSMJModel.getPengGangArrayByUID(user.uid, user.operateArray, user.laiZiCards);
			!!optTileMgr && optTileMgr.updateOptTiles(pengGangArray, false);
			let huTypeSrpite = cc.find('huIndex', uNode).getComponent(cc.Sprite);
			let huType = user.huType || 0;
			if (huType) {
				huTypeSrpite.node.active = true
				huTypeSrpite.spriteFrame = null;
				AssetsManager.loadSpriteFrame({
					path: `res/sprite/hu/hu${huType}`,
					sprite: huTypeSrpite,
					bundle: LSMJModel.getGameType()
				})

				let huCards = user.huCards || 0;
				/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
				if (huType === ApiLsmj.operateType.HU_ZHI || huType === ApiLsmj.operateType.HU_QIANG || huType === ApiLsmj.operateType.HU_CHI || huType === ApiLsmj.operateType.HU_TI) {
					let huCardIndex = handCards.indexOf(huCards);
					if (huCardIndex >= 0) {
						handCards.splice(huCardIndex, 1);
					}
				}
				this.sortHandCards(handCards)
				!!handTileMgr && handTileMgr.updateLieTiles(handCards)
				if (huCards && huCards > 0) {
					!!handTileMgr && handTileMgr.setHuTile(huCards)
				}
			} else {
				loseCount++
				this.sortHandCards(handCards)
				!!handTileMgr && handTileMgr.updateLieTiles(handCards)
				if (user.loseUid == user.uid) {
					huTypeSrpite.node.active = false
					huTypeSrpite.spriteFrame = null;
					AssetsManager.loadSpriteFrame({
						path: `res/sprite/hu/hu100`,
						sprite: huTypeSrpite,
						bundle: LSMJModel.getGameType()
					})
				}
			}

			// userPlusType
			let userPlusType = user.userPlusType || [],
				typeStat = {};
			userPlusType.forEach((obj) => {
				let tobj = typeStat[obj.type]
				if (!tobj) {
					tobj = {
						score: 0,
						scoreType: 0
					}
					typeStat[obj.type] = tobj
				}
				tobj.score += obj.score;
				if (obj.scoreType) tobj.scoreType = obj.scoreType
			})

			//指定类型排个序
			let typeRank = [ApiLsmj.cardType.GANG, ApiLsmj.cardType.SANYAOJI, ApiLsmj.cardType.SIYAOJI];
			let tempTypStat = {};
			for (const key in typeStat) {
				if (typeRank.includes(parseInt(key))) {
					tempTypStat[key] = typeStat[key];
					delete typeStat[key];
				}
			}
			let cardTypeLayout = cc.find("cardTypeLayout", uNode)
			cardTypeLayout.removeAllChildren();
			for (const key in typeStat) {
				let item = typeStat[key];
				if (item.score == 0) continue;
				let score = item.score;
				let scoreStr = score > 0 ? "+" + score : score;
				if (item.scoreType == 1) {
					scoreStr = "x" + Math.abs(score)
				}
				let txtNode = cc.instantiate(this.cardTypeItemNode);
				txtNode.parent = cardTypeLayout
				txtNode.y = 0
				txtNode.getComponent(cc.Label).string = ApiLsmj.plusRateTypeStr[key] + scoreStr;
			}

			for (const key in tempTypStat) {
				let item = tempTypStat[key];
				if (item.score == 0) continue;
				let score = item.score;
				let scoreStr = score > 0 ? "+" + score : score;
				if (item.scoreType == 1) {
					scoreStr = "x" + Math.abs(score)
				}
				let txtNode = cc.instantiate(this.cardTypeItemNode);
				txtNode.parent = cardTypeLayout
				txtNode.y = 0
				txtNode.getComponent(cc.Label).string = ApiLsmj.plusRateTypeStr[key] + scoreStr;
			}
			//飘分
			if (this._plusInfo && this._plusInfo.piaoFen) {
				let piaoFen = this._plusInfo.piaoFen
				const isPiao = piaoFen[user.uid] || false;
				cc.find("piao", uNode).active = isPiao
			}

			let userHuDonList = user.userHuDonList || [];
			let huRank = userHuDonList.findIndex(item => item.uid == user.uid);
			let huRankSrpite = cc.find('huRank', uNode).getComponent(cc.Sprite);
			let huObj = userHuDonList[huRank];
			huRankSrpite.spriteFrame = null;
			if (huRank != -1 && huObj) {
				let huName = "hu";
				if (huObj.operateType === ApiLsmj.operateType.HU_ZHI) {
					huName = "zimo";
				}
				AssetsManager.loadSpriteFrame({
					path: `res/sprite/rank/${(huRank + 1) + huName}`,
					bundle: LSMJModel.getGameType(),
					sprite: huRankSrpite,
				})
			}

			//huscore
			// let huScoreLayout = cc.find("huScoreLayout", uNode)
			// if (huScoreLayout) {
			// 	let setHuScore = (wenzi, score) => {
			// 		let hnode = cc.instantiate(this.huScoreItemNode)
			// 		hnode.parent = huScoreLayout
			// 		hnode.x = 0
			// 		let txt_huScore = hnode.getComponent(cc.Label)
			// 		let str = "" + score
			// 		if (score > 0) str = "+" + score
			// 		txt_huScore.string = wenzi + str
			// 	}
			// 	if (user.huScore) {
			// 		setHuScore("胡分", user.huScore)
			// 	}
			// 	if (this._plusInfo && this._plusInfo.TiWaiXunHuanScore) {
			// 		let TiWaiXunHuanScore = this._plusInfo.TiWaiXunHuanScore
			// 		if (Object.hasOwnProperty.call(TiWaiXunHuanScore, user.uid)) {
			// 			setHuScore("体外", TiWaiXunHuanScore[user.uid])
			// 		}
			// 	}
			// }
		}

		/**流局 */
		if (users.length == loseCount) {
			this.bglose.active = true
			this.bgwin.active = false
			cc.find("title_liu", this.bglose).active = true
		}

		/**局数 */
		if (this._gameRule && this._plusInfo) {
			this.txt_round.string = `${this._plusInfo.curBureau}/${this._gameRule.bureau}局`;
		}
	},

	showResult() {
		this.bureauLabel.string = this.bureau + 1;
		this._plusInfo = Utils.deepCopy(this.reviewRecord[this.bureau].plusInfo)
		this.resultData = Utils.deepCopy(this.reviewRecord[this.bureau].result)
		this._laiZiCards = Utils.deepCopy(this._plusInfo.laiZiCards)
		this.setAllHandCards()
	},

	/**给手牌重新排序 */
	sortHandCards(handCards) {
		handCards.sort((a, b) => a - b)
		let ghostList = this._laiZiCards || []
		let myGhost = []
		for (let i = 0; i < handCards.length; i++) {
			const card = handCards[i];
			let isDel = false;
			if (ghostList.includes(card)) {
				myGhost.push(card);
				isDel = true;
			}
			if (isDel) {
				handCards.splice(i, 1);
				i--;
			}
		}
		for (let i = myGhost.length - 1; i >= 0; i--) {
			handCards.unshift(myGhost[i])
		}
	},

	update(dt) {
		if (this.node.nodeParams.isResult) {
			this.tick -= dt;
			let tick = Math.floor(this.tick);
			if (tick > 0) {
				this.clockLabel.string = tick;
			} else {
				this.clockLabel.string = '0';
			}
		}
	},

	onBtnClick(event, parameters) {
		if (parameters === 'ready') {
			// if (!this.node.nodeParams.isBureauFull) {
			// 	ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
			// 	this.node.destroy();
			// } else {
			// 	if (this.node.nodeParams.mainComp &&
			// 		this.node.nodeParams.mainComp.showMJAllResultFunc) {
			// 		this.node.nodeParams.mainComp.showMJAllResultFunc();
			// 		this.node.destroy();
			// 	}
			// }
			if (this.node.nodeParams.mainComp &&
				this.node.nodeParams.mainComp.showMJAllResultFunc) {
				this.node.nodeParams.mainComp.showMJAllResultFunc();
			} else {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
			}
			this.node.destroy();
		} else if (parameters === 'exit') {
			this.node.destroy();
		}
	},

	/**座位号转换 */
	getUserChairIndex(chairID) {
		return (chairID - this._myChairId + MAX_USER_NUM) % MAX_USER_NUM;
	},

	/**回放使用的左右按钮 */
	nextResult() {
		if (this.bureau + 1 >= this.reviewRecord.length) return;
		++this.bureau;
		this.showResult();
	},

	preResult() {
		if (this.bureau - 1 < 0) return;
		--this.bureau;
		this.showResult();
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RemoveGameResult') {
			this.node.destroy();
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RemoveGameResult', this);
	},
});