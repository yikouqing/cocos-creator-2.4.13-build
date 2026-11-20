const TWModel = require('./TWModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiTw = require('./ApiTw');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Enums = require('../../../src/const/Enums');
const ConfigModel = require('../../../src/model/ConfigModel');
const Utils = require('../../../src/utils/Utils');
const NativeUtil = require('../../../src/utils/NativeUtil');
const { Def_Tw } = require('../../../src/const/Defines');

cc.Class({
	extends: cc.Component,
	properties: {

	},

	onLoad() {
		this.seatNames = ['空位', '空位', '空位', '空位', '空位', '空位', '空位', '空位', '空位', '空位'];
		this.headSprite = cc.find('head', this.node).getComponent(cc.Sprite);
		this.nameLabel = cc.find('name', this.node).getComponent(cc.Label);
		this.idLabel = cc.find('id', this.node).getComponent(cc.Label);
		this.robSprite = cc.find('robstate', this.node).getComponent(cc.Sprite);
		this.scoreNode = cc.find('scorebg', this.node);
		this.scoreLabel = cc.find('scorebg/gold', this.node).getComponent(cc.Label);
		this.goldNode = cc.find('scorebg/icon', this.node);
		this.bankerNode = cc.find('banker', this.node);
		this.winScoreNode = this.node.getChildByName('winscore');
		this.loseScoreNode = this.node.getChildByName('losescore');
		this.light = this.node.getChildByName('light');
		this.readyNode = this.node.getChildByName('ready');
		this.fangzhuNode = this.node.getChildByName('fangzhu');
		this.qiepaiIcon = this.node.getChildByName('qiepaiIcon');
		this.qiepaiIcon.active = false
		this.node.active = false;
		this.readyNodePos = this.readyNode.getPosition();
		this.scoreNodePos = this.scoreNode.getPosition();
		this.playVoiceNode = cc.find("playVioce", this.node);
		this.playVoiceNode.active = false;

		this.scoreNode.active = false;
		this.bankerNode.active = false;
		this.readyNode.active = false;

		/**总输赢 */
		this.totalScore = cc.find("totalScore", this.node)
		if (cc.isValid(this.totalScore)) {
			this.txt_totalScore = cc.find("txt_totalScore", this.totalScore).getComponent(cc.Label)
			this.totalScore.active = false
		}

		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
	},

	setIndex(index) {
		this.index = index;
	},

	hideSeat() {
		if (this.seatNode) {
			this.seatNode.active = false;
		}
		let names = ['msgbg', 'head', 'headedg', 'name', 'id', 'robstate', 'scorebg', 'banker', 'winscore', 'losescore', 'ready'];
		for (let name of names) {
			let node = this.node.getChildByName(name);
			if (node) {
				node.active = true;
			}
		}
	},


	setVoice(state) {
		this.playVoiceNode.active = state;
	},
	onSeatClick() {
		if (TWModel.isUnionCreate()) {
			let user = TWModel.getUserByChairID(TWModel.getMyChairID());
			// if (user.userInfo.score < TWModel.getGameRule().scoreLowLimit) {
			// 	AssetsManager.tipDialog('金币不足，不能入座');
			// 	return;
			// }
		}
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(TWModel.getMyChairID(), this.getChairID()));
	},

	getChairID(chairID) {
		if (TWModel.getMyChairID() >= TWModel.getChairCount()) {
			return this.index;
		} else {
			return (TWModel.getMyChairID() + this.index) % TWModel.getChairCount();
		}
	},
	gameInit() {
		if (typeof (this.index) != 'number') {
			return;
		} /* 未使用，等待销毁 */
		this.node.active = true;
		let user = TWModel.getUserByChairID(this.getChairID());
		if (!user) {
			this.hideSeat();
			this.node.active = false;
			return;
		} else {
			this.hideSeat();
		}
		this.nameLabel.string = CCUtil.stringClamp(user.userInfo.nickname, 4, "..");
		this.setUserScore(TWModel.getCurScore(this.getChairID()))
		let is_creator = (TWModel.getRoomCreatorChairID() == this.getChairID());
		this.fangzhuNode.active = is_creator;
		AssetsManager.loadSpriteFrame({
			path: user.userInfo.avatar,
			sprite: this.headSprite
		});

		if (TWModel.getGameStatus() == ApiTw.gameStatus.NONE) {
			this.robSprite.node.active = false;
			this.scoreNode.active = false;
			this.bankerNode.active = false;
			this.readyNode.active = user.userStatus == ApiRoom.userStatusEnum.READY;
		} else if (TWModel.getGameStatus() == ApiTw.gameStatus.ROB_BANK) {
			this.scoreNode.active = false;
			this.bankerNode.active = false;
			this.readyNode.active = false;
		} else if (TWModel.getGameStatus() >= ApiTw.gameStatus.WASH_CARD) {
			this.scoreNode.active = false;
			// this.setPourScore(TWModel.getPourScoreByChairID(this.getChairID()));
			this.bankerNode.active = false //(this.getChairID() == TWModel.getBankerChairID());
			this.readyNode.active = false;
			this.robSprite.node.active = false;
		}
		// this.setRobScale();
		this.showResultScore();

		cc.find('offline', this.node).active = user.userStatus == ApiRoom.userStatusEnum.OFFLINE;
	},

	setUserScore(s) {
		if (TWModel.scoreState() == 1) return;
		if (this.idLabel) this.idLabel.string = Utils.formatNumberWithDecimal(s, 2);
	},

	/**设置总输赢分数 */
	setTotalScore(userWinTotalScore) {
		if (cc.isValid(this.totalScore) && TWModel.scoreState()) {
			if (userWinTotalScore) {
				let s = userWinTotalScore[this.getChairID()];
				let num = Utils.formatNumberWithDecimal(s, 1);
				if (TWModel.scoreState() == 1) {
					this.totalScore.active = false;
					this.idLabel.string = num;
					this.idLabel.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
					return
				}
				if (typeof (s) == "number") {
					this.totalScore.active = true
					this.txt_totalScore.string = num;
					this.txt_totalScore.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
				} else {
					this.txt_totalScore.string = '0';
				}
			} else {
				this.txt_totalScore.string = '0';
			}
		}
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.setTotalScore(msg.data.gameData.userWinTotalScore)
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				if (msg.data.chairID == TWModel.getMyChairID() && TWModel.getCurBureau() == 0) {
					this.gameInit();
				}
				if (this.node.active && msg.data.chairID == this.getChairID()) {
					this.readyNode.active = true;
					this.robSprite.node.active = false;
					this.scoreNode.active = false;
				}
				if (this.node.active && (msg.data.chairID == TWModel.getMyChairID())) {
					let user = TWModel.getUserByChairID(this.getChairID());
					if (user) {
						this.robSprite.node.active = false;
						this.scoreNode.active = false;
						this.readyNode.active = user.userStatus == ApiRoom.userStatusEnum.READY;
						this.bankerNode.active = TWModel.getBankerChairID() == this.getChairID();
						this.winScoreNode.active = false;
						this.loseScoreNode.active = false;
						this.setUserScore(TWModel.getCurScore(this.getChairID()))
					}
				}
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				/* if(msg.data.chairID == this.getChairID()) {
					this.node.active = false;
				} */
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID == this.getChairID()) {
					this.gameInit();
				}
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID == this.getChairID()) {
					this.node.active = false;
				}
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) return;
				if (TWModel.getCurBureau() == 0) {
					this.gameInit();
				} else {
					if (TWModel.getMyUid() != msg.data.uid) {
						if (this.getChairID() == msg.data.fromChairID || this.getChairID() == msg.data.toChairID) {
							this.gameInit();
						}
					} else {
						this.gameInit();
					}
				}
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) {
				// let user = TWModel.getUserByChairID(this.getChairID());
				// if (this.node.active && user) {
				// 	/* this.idLabel.string = Math.floor(user.userInfo.score); */
				// 	this.idLabel.string = TWModel.getCurScore(this.getChairID());
				// }
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				if (msg.data.chairID == this.getChairID()) {
					cc.find('offline', this.node).active = true;
				}
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				/**玩家总输赢分数 */
				// console.log("玩家总输赢==", msg.data)
				this.setTotalScore(msg.data.userWinTotalScore)
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				this.gameChat(msg.data);
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiTw.GAME_ROB_BANK_PUSH) {
				// console.log("开始强庄", msg.data)
				this.setRobScale(msg.data);
			} else if (msg.type === ApiTw.GAME_BANKER_PUSH) {
				this.robSprite.node.active = false;

				this.setBanker(msg.data.robChairIDs, true);
			} else if (msg.type === ApiTw.GAME_POUR_SCORE_PUSH) {
				// if (msg.data.chairID == this.getChairID()) {
				// 	this.setPourScore(msg.data.score, true);
				// 	this.idLabel.string = TWModel.getCurScore(this.getChairID());
				// }
			} else if (msg.type === ApiTw.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiTw.gameStatus.SEND_CARDS) {
					let user = TWModel.getUserByChairID(this.getChairID());
					if (user) {
						this.robSprite.node.active = false;
						this.scoreNode.active = false;

						this.bankerNode.active = TWModel.getBankerChairID() == this.getChairID();
						this.winScoreNode.active = false;
						this.loseScoreNode.active = false;
					}
				}
				if (msg.data.gameStatus == ApiTw.gameStatus.NONE) {
					this.readyNode.active = false;
				}
				if (msg.data.gameStatus != ApiTw.gameStatus.NONE) {
					this.readyNode.active = false;
				} else {
					// this.idLabel.string = TWModel.getCurScore(this.getChairID());
				}
				if (msg.data.gameStatus != ApiTw.gameStatus.WASH_CARD) {
					this.qiepaiIcon.active = false
				}
			} else if (msg.type === ApiTw.GAME_SHOWRESULT_PUSH) {
				// if (TWModel.getUserByChairID(this.getChairID())) {
				// 	// this.showResultScore(msg.data.result, false);
				// 	this.idLabel.string = TWModel.getCurScore(this.getChairID());
				// }
			} else if (msg.type === ApiTw.GAME_USER_WASH_CARD_PUSH) {
				if (msg.data.chairIDList.includes(this.getChairID())) {
					this.qiepaiIcon.active = true
				}
			}
		}
	},

	setBanker(robChairIDs, animal) {
		let is_banker = (TWModel.getBankerChairID() == this.getChairID());
		if (is_banker && animal && TWModel.getGameType() == Def_Tw.wanfa.ZHUANG) {
			AssetsManager.playEffect({
				path: 'res/audio/rob_zhuang_ani'
			});
		}
		if (!is_banker) {
			this.robSprite.node.active = false;
			this.bankerNode.active = false;
		}
		if (robChairIDs && animal) {
			if (robChairIDs.indexOf(this.getChairID()) != -1) {
				this.light.active = true;
				this.light.runAction(cc.repeat(cc.sequence(cc.fadeOut(0.1), cc.fadeIn(0.1)), 5));
				if (is_banker) {
					let bank_node = cc.find('BankerNode', this.node.parent);
					bank_node.setScale(1);
					bank_node.setPosition(cc.v2(0, 0));
					let node_pos = this.node.getPosition();
					let banker_pos = this.bankerNode.getPosition();
					let end_pos = cc.v2(node_pos.x + banker_pos.x, node_pos.y + banker_pos.y);
					this.scheduleOnce(() => {
						bank_node.active = true;
						bank_node.runAction(cc.sequence(
							cc.moveTo(0.5, end_pos),
							cc.callFunc(() => {
								bank_node.active = false;
								this.light.active = false;
								this.setRobScale();
								this.bankerNode.active = is_banker;
							})
						));
						bank_node.runAction(cc.scaleTo(0.5, 0.16));
					}, 2);
				} else {
					this.scheduleOnce(() => {
						this.light.active = false;
					}, 2);
				}
			}
		} else {
			this.bankerNode.active = is_banker;
		}
	},
	/*
	 * 设置抢庄倍数
	 */
	setRobScale(data) {
		this.robSprite.node.active = false;
		let scale = null;
		if (data && data.chairID == this.getChairID()) {
			scale = data.robScale;
		} else {
			scale = TWModel.getRobScaleByChairID(this.getChairID());
		}
		if (scale == null) return;
		if (TWModel.getGameStatus() == ApiTw.gameStatus.ROB_BANK && TWModel.getBankerChairID() == null) {
			let url = 'res/sprite/cardtype/' + ['buqiang', 'qiang1', 'qiang2', 'qiang3', 'qiang4'][scale];
			if (scale == 1 && TWModel.getGameType() == Def_Tw.wanfa.ZHUANG) {
				url = 'res/sprite/cardtype/qiangzhuang';
			}
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.robSprite,
				bundle: Enums.bundleType.SSS
			});
			this.robSprite.node.active = true;
		} else {
			if ((TWModel.getGameType() == Def_Tw.wanfa.ZHUANG) && TWModel.getBankerChairID() == this.getChairID()) {
				let url = 'res/sprite/cardtype/' + ['', '1bei', '2bei', '3bei', '4bei'][scale];
				AssetsManager.loadSpriteFrame({
					path: url,
					sprite: this.robSprite,
					bundle: Enums.bundleType.SSS
				});
				this.robSprite.node.active = true;
			}
		}
	},


	showResultScore(result = null, animal = false) {
		this.winScoreNode.active = false;
		this.loseScoreNode.active = false;
		if (!result) {
			return;
		}
		let winScore = result.winScores;
		let score = Math.floor(winScore[this.getChairID()]);
		if (score >= 0) {
			this.winScoreNode.active = true;
			this.winScoreNode.getComponent(cc.Label).string = '+' + Math.floor(score);
			if (animal) {
				this.winScoreNode.x = -50;
				this.winScoreNode.runAction(cc.moveTo(0.2, cc.v2(0, 22)).easing(cc.easeIn(3.0)));
			}
		} else if (score < 0) {
			this.loseScoreNode.active = true;
			this.loseScoreNode.getComponent(cc.Label).string = '' + Math.floor(score);
			if (animal) {
				this.loseScoreNode.x = -50;
				this.loseScoreNode.runAction(cc.moveTo(0.2, cc.v2(0, 22)).easing(cc.easeIn(3.0)));
			}
		}

		if (animal) {
			// console.log("有动画")
			let bankerID = TWModel.getBankerChairID();
			// console.log("bankerID " + bankerID)
			if (bankerID == null) {
				bankerID = 0;
				for (let i = 1; i < winScore.length; ++i) {
					if (winScore[i] > winScore[bankerID]) {
						bankerID = i;
					}
				}
			}
			if (this.getChairID() != bankerID) {
				return;
			}

			let has_lose = false;
			for (let i in winScore) {
				if (winScore[i] > 0) {
					this.goldMove(this.getChairID(), i);
				}
			}
			/* this.scheduleOnce(() => { */
			for (let i in winScore) {
				if (winScore[i] < 0) {
					this.goldMove(i, this.getChairID());
				}
			}
			/* }, (has_lose)? 1:0); */
		}
	},

	/*
	 * 获取其他头像相对于自己头像的位置
	 * @param Number chairID 其他头像的chairID
	 */
	getHeadNodePosByChairID(chairID) {
		let mainLogic = this.node.parent.getComponent('TWMainDialog');
		let headNode = mainLogic.getHeadNodeByChairID(chairID);
		let myPos = this.node.getPosition();
		let otherPos = headNode.getPosition();
		return cc.v2(otherPos.x - myPos.x, otherPos.y - myPos.y);
	},

	/*
	 * 结算时金币移动
	 * @param Number startChairID 开始的头像chairID
	 * @param Number endChairID 结束的头像chairID
	 */
	goldMove(startChairID, endChairID) {
		let speed = 1600;
		let startPos = this.getHeadNodePosByChairID(startChairID);
		let endPos = this.getHeadNodePosByChairID(endChairID);
		let distance = Math.sqrt(Math.pow(startPos.x - endPos.x, 2) + Math.pow(startPos.y - endPos.y, 2));
		let dt = distance / speed;

		let callFunc = cc.callFunc(() => {
			AssetsManager.playEffect({
				path: 'res/audio/xiazhu'
			});
		});
		for (let i = 0; i < 10; ++i) {
			let icon = cc.find('scorebg/icon', this.node);
			let gold = cc.instantiate(icon);
			gold.parent = this.node;
			gold.setPosition(startPos);
			gold.runAction(cc.sequence(
				cc.delayTime(0.08 * i),
				cc.moveTo(dt, endPos),
				callFunc,
				cc.removeSelf()
			));
		}
	},
	/*
	 * 设置下分
	 */
	setPourScore(score, animal) {
		if (score == 0 || score == null) {
			this.scoreNode.active = false;
		} else {
			this.scoreLabel.string = score;
			this.scoreNode.active = true;
			if (animal) {
				let icon = cc.find('scorebg/icon', this.node);
				let icon_pos = icon.getPosition();
				let scorebg_pos = cc.find('scorebg', this.node).getPosition();
				let end_pos = cc.v2(scorebg_pos.x + icon_pos.x, scorebg_pos.y + icon_pos.y);
				AssetsManager.playEffect({
					path: 'res/audio/fly_gold'
				});
				for (let i = 0; i < 10; ++i) {
					let node = cc.instantiate(icon);
					node.setPosition(0, 0);
					node.parent = this.node;
					node.runAction(cc.sequence(
						cc.delayTime(0.08 * i),
						cc.moveTo(0.3, end_pos),
						cc.removeSelf()
					));
				}
			}
		}
	},

	getDaqiangCount(resout) {
		var memberCount = resout.cardsArr.length;
		var daqiangArr = [];
		for (var i = 0; i < resout.daqiangArr.length; ++i) {
			daqiangArr[i] = [];
			for (var j = 0; j < resout.daqiangArr[i].length; ++j) {
				daqiangArr[i][j] = resout.daqiangArr[i][j];
			}
		}
		// 怪牌打枪数据添加
		for (var k = 0; k < daqiangArr.length; ++k) {
			if (TWModel.getMianbai(k)) {
				for (var m = 0; m < daqiangArr.length; ++m) {
					if (m !== k && !TWModel.getMianbai(m)) {
						daqiangArr[k][m] = 2;
					}
				}
			}
		}
		var count = 0;
		for (i = 0; i < daqiangArr.length; ++i) {
			for (j = 0; j < daqiangArr[i].length; ++j) {
				if (daqiangArr[i][j] > 1) {
					++count;
				}
			}
		}
		return count;
	},

	/*
	 * 游戏聊天
	 */
	gameChat(data) {
		let node = cc.find('text', this.node);
		let label = cc.find('Label', node);
		if (data.chairID == this.getChairID()) {
			data.user = TWModel.getUserByChairID(this.getChairID());
			CCUtil.gameChat(data, label, this.headSprite.node, this.node)
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
		MessageCallback.removeListener('UpdateGameCardBg', this);
	},
});