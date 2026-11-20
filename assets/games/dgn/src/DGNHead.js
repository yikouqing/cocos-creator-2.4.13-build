const DGNModel = require('./DGNModel');
const ApiDgn = require('./ApiDgn');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const CCUtil = require('../../../src/utils/CCUtil');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ConfigModel = require('../../../src/model/ConfigModel');
const Utils = require('../../../src/utils/Utils');
const NativeUtil = require('../../../src/utils/NativeUtil');

cc.Class({
	extends: cc.Component,
	properties: {
		_mainComp: null
	},

	onLoad() {
		this.seatNames = ['空位', '空位', '空位', '空位', '空位', '空位', '空位', '空位', '空位', '空位'];
		this.headSprite = cc.find('head', this.node).getComponent(cc.Sprite);
		this.nameLabel = cc.find('name', this.node).getComponent(cc.Label);
		this.playerScoreLbl = cc.find('score', this.node).getComponent(cc.Label);
		this.robSprite = cc.find('robstate', this.node).getComponent(cc.Sprite);
		this.scoreNode = cc.find('scorebg', this.node);
		this.scoreNode2 = cc.find('BankerScorePool', this.node);
		this.scoreLabel = cc.find('scorebg/gold', this.node).getComponent(cc.Label);
		this.goldNode = cc.find('scorebg/icon', this.node);
		this.bankerNode = cc.find('banker', this.node);
		this.light = this.node.getChildByName('light');
		this.readyNode = this.node.getChildByName('ready');
		this.fangzhuNode = this.node.getChildByName('fangzhu');
		this.node.active = false;
		this.readyNodePos = this.readyNode.getPosition();
		this.scoreNodePos = this.scoreNode.getPosition();
		this.rangCircle = 30;
		this.playVoiceNode = cc.find("playVioce", this.node);
		this.playVoiceNode.active = false;
		this.totalScore = cc.find("totalScore", this.node)
		this.bankWinScore = cc.find("BankerScorePool/winscore", this.node)
		this.bankLoseScore = cc.find("BankerScorePool/losescore", this.node)
		this.bankWinInitY = this.bankWinScore.y
		this.bankLoseInitY = this.bankLoseScore.y
		this.winScore = cc.find("winscore", this.node)
		this.loseScore = cc.find("losescore", this.node)

		if (cc.isValid(this.totalScore)) {
			this.txt_totalScore = cc.find("txt_totalScore", this.totalScore).getComponent(cc.Label)
			this.totalScore.active = false
		}
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		this.node.active = false;
	},

	init(comp) {
		// console.log("inithead==", this.node.name)
		this._mainComp = comp;
	},

	setIndex(index) {
		this.index = index;
	},

	setVoice(state) {
		this.playVoiceNode.active = state;
	},

	hideSeat() {
		if (this.seatNode) {
			this.seatNode.active = false;
		}
		let names = ['head', 'name', 'id'];
		for (let name of names) {
			let node = this.node.getChildByName(name);
			if (node) {
				node.active = true;
			}
		}
	},

	onSeatClick() {
		if (DGNModel.isUnionCreate()) {
			let user = DGNModel.getUserByChairID(DGNModel.getMyChairID());
			// if (user.userInfo.score < DGNModel.getGameRule().scoreLowLimit) {
			// 	AssetsManager.tipDialog('金币不足，不能入座');
			// 	return;
			// }
		}
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(DGNModel.getMyChairID(), this.getChairID()));
	},

	getChairID(chairID) {
		if (DGNModel.getMyChairID() >= DGNModel.getChairCount()) {
			return this.index;
		} else {
			return (DGNModel.getMyChairID() + this.index) % DGNModel.getChairCount();
		}
	},

	gameInit() {
		if (typeof (this.index) != 'number') return;
		this.node.active = true;
		let user = DGNModel.getUserByChairID(this.getChairID());
		if (!user) {
			this.node.active = false;
			return;
		} else {
			this.hideSeat();
		}

		this.nameLabel.string = CCUtil.stringClamp(user.userInfo.nickname, 7, '..');
		this.setUserScore(DGNModel.getCurScore(this.getChairID()))
		this.fangzhuNode.active = false;
		AssetsManager.loadSpriteFrame({
			path: user.userInfo.avatar,
			sprite: this.headSprite
		});
		this.robSprite.node.active = false;
		if (DGNModel.getGameStatus() == ApiDgn.gameStatus.NONE) {
			this.readyNode.active = user.userStatus == ApiRoom.userStatusEnum.READY;
		} else if (DGNModel.getGameStatus() == ApiDgn.gameStatus.CHOOSE_BANK) {
			this.readyNode.active = false;
		} else if (DGNModel.getGameStatus() >= ApiDgn.gameStatus.SEND_CARDS) {
			this.readyNode.active = false;
		}
		this.setPourScore(DGNModel.getPourScoreByChairID(this.getChairID()));
		this.setBanker(DGNModel.getBankerChairID());
		/* this.showResultScore(); */
		cc.find('offline', this.node).active = user.userStatus == ApiRoom.userStatusEnum.OFFLINE;
		if (this._mainComp) {
			let panNodePos = CCUtil.postionConvert(this._mainComp.panNode, this.scoreNode2.parent);
			this.scoreNode2.setPosition(panNodePos);
			// console.log('锅底坐标', panNodePos);
		}
	},

	/*
	 * 设置下分
	 */
	setPourScore(score, animal) {
		this.scoreNode.active = false;
		this.scoreNode2.active = false;
		if (score != null && score > 0) {
			if (this.getChairID() != DGNModel.getBankerChairID()) {
				this.scoreLabel.string = score;
				this.scoreNode.active = true;
				if (animal) {
					let icon = cc.find('scorebg/icon', this.node);
					let end_pos = CCUtil.postionConvert(icon, this.node);
					AssetsManager.playEffect({
						path: 'res/audio/main/fly_gold',
						bundle: Enums.bundleType.DGN
					});
					for (let i = 0; i < 5; ++i) {
						let node = cc.instantiate(icon);
						node.parent = this.node;
						node.setPosition(cc.v2(0, 0));
						node.opacity = 0;
						node.runAction(cc.sequence(
							cc.fadeIn(0.08 * i),
							cc.moveTo(0.3, end_pos),
							cc.removeSelf()
						));
					}
				}
			} else {
				this.scoreNode2.active = true;
				cc.find("Label", this.scoreNode2).getComponent(cc.Label).string = "" + Math.floor(score);
				if (animal) {
					if (!!this._mainComp) {
						let panNodePos = CCUtil.postionConvert(this._mainComp.panNode, this.node);
						let icon = cc.find('scorebg/icon', this.node);
						let end_pos = CCUtil.postionConvert(icon, this.node);
						AssetsManager.playEffect({
							path: 'res/audio/main/fly_gold',
							bundle: Enums.bundleType.DGN
						});
						for (let i = 0; i < 10; ++i) {
							let node = cc.instantiate(icon);
							node.setPosition(cc.v2(0, 0));
							node.parent = this.node;
							node.opacity = 0;
							node.runAction(cc.sequence(
								cc.fadeIn(0.08 * i),
								cc.moveTo(0.3, end_pos),
								cc.removeSelf()
							));
						}
					}
				}
			}
		}
		if (DGNModel.getCurBureau() >= 1) {
			// console.log("测试-斗公牛", DGNModel.getBankerChairID());
			if (DGNModel.getBankerChairID() == this.getChairID()) {
				this.scoreNode2.active = true;
				cc.find("Label", this.scoreNode2).getComponent(cc.Label).string = "" + Math.floor(score);
			} else {
				this.scoreNode2.active = false;
				cc.find("Label", this.scoreNode2).getComponent(cc.Label).string = "";
			}
		}
	},


	setUserScore(s) {
		if (DGNModel.scoreState() == 1) return;
		if (this.playerScoreLbl) this.playerScoreLbl.string = Utils.formatNumberWithDecimal(s, 2);
	},

	/**设置总输赢分数 */
	setTotalScore(userWinTotalScore) {
		if (userWinTotalScore && !!DGNModel.scoreState()) {
			let s = userWinTotalScore[this.getChairID()];
			let num = Utils.formatNumberWithDecimal(s, 1);
			if (DGNModel.scoreState() == 1) {
				this.totalScore.active = false;
				this.playerScoreLbl.string = num;
				this.playerScoreLbl.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
				return
			}
			if (typeof (s) == "number") {
				if (s >= 0) {
					this.txt_totalScore.node.color = new cc.Color().fromHEX("#00F105")
				} else {
					this.txt_totalScore.node.color = new cc.Color().fromHEX("#FF0000")
				}
				this.totalScore.active = true
				this.txt_totalScore.string = Utils.formatNumberWithDecimal(s, 1) + ""
			} else {
				this.txt_totalScore.string = '0';
			}
		} else {
			this.txt_totalScore.string = '0';
		}
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.setTotalScore(msg.data.gameData.userWinTotalScore)
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				if (msg.data.chairID == DGNModel.getMyChairID() && DGNModel.getCurBureau() == 0) {
					this.gameInit();
				}
				if (this.node.active && msg.data.chairID == this.getChairID()) {
					this.readyNode.active = true;
					this.scoreNode.active = false;
				}
				if (this.node.active && (msg.data.chairID == DGNModel.getMyChairID())) {
					let user = DGNModel.getUserByChairID(this.getChairID());
					if (user) {
						this.scoreNode.active = false;
						this.readyNode.active = user.userStatus == ApiRoom.userStatusEnum.READY;
						this.setBanker(DGNModel.getBankerChairID());
						this.winScore.active = false;
						this.loseScore.active = false;
						this.bankLoseScore.active = false;
						this.bankWinScore.active = false;
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
				if (DGNModel.getCurBureau() == 0) {
					this.gameInit();
				} else {
					if (DGNModel.getMyUid() != msg.data.uid) {
						if (this.getChairID() == msg.data.fromChairID || this.getChairID() == msg.data.toChairID) {
							this.gameInit();
						}
					} else {
						this.gameInit();
					}
				}
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) {
				let user = DGNModel.getUserByChairID(this.getChairID());
				if (this.node.active && user) {
					this.setUserScore(DGNModel.getCurScore(this.getChairID()))
				}
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				if (msg.data.chairID == this.getChairID()) {
					cc.find('offline', this.node).active = true;
				}
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				/**玩家总输赢分数 */
				// console.log("玩家总输赢==", msg.data)
				this.setTotalScore(msg.data.userWinTotalScore)
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				// console.log('玩家发送消息', msg.data);
				this.gameChat(msg.data);
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiDgn.BANKER_PUSH) {
				this.setBanker(msg.data.bankerChairID);
				if (msg.data.bankerChairID == this.getChairID()) {
					this.bankerPour();
				}
			} else if (msg.type === ApiDgn.GAME_ROB_BANK_PUSH) {
				this.setRobScale(msg.data.robScale);
			} else if (msg.type === ApiDgn.GAME_BANKER_PUSH) {
				this.robSprite.node.active = false;
				this.setRobBanker(msg.data.robChairIDs, true);
			} else if (msg.type === ApiDgn.CLEAR_POOL_PUSH) {
				if (msg.data.bankerChairID == this.getChairID()) {
					this.bankerClearGold();
					this.setPourScore(0);
				}
			} else if (msg.type === ApiDgn.POUR_SCORE_PUSH) {
				if (msg.data.chairID == this.getChairID()) {
					this.setPourScore(msg.data.score, true);
					this.setUserScore(DGNModel.getCurScore(this.getChairID()))
				}
			} else if (msg.type === ApiDgn.GAME_STATUS_PUSH) {
				this.gameInit();
			} else if (msg.type === ApiDgn.GAME_RESULT_PUSH) {
				if (DGNModel.getUserByChairID(this.getChairID())) {
					this.showResultScore(msg.data.result.winScores, true);
					this.setUserScore(DGNModel.getCurScore(this.getChairID()))
				}
			}
		}
	},

	setBanker(bankerChairID) {
		this.bankerNode.active = (bankerChairID == this.getChairID());
	},

	setRobBanker(robChairIDs, animal) {
		let is_banker = (DGNModel.getBankerChairID() == this.getChairID());
		if (is_banker && animal) {
			AssetsManager.playEffect({
				path: 'res/audio/main/rob_zhuang_ani',
				bundle: Enums.bundleType.DGN
			});
		}
		if (!is_banker) {
			this.robSprite.node.active = false;
		}
		this.unscheduleAllCallbacks();
		// console.trace("设置庄标识-2", is_banker)
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

	setRobScale: function () {
		this.robSprite.node.active = false;
		let scale = DGNModel.getRobScaleByChairID(this.getChairID());
		if (scale == null) return;
		if (DGNModel.getGameStatus() == ApiDgn.gameStatus.ROB_BANKER && DGNModel.getBankerChairID() == null) {
			let url = 'res/sprite/' + ['buqiang', 'qiang'][scale];
			if (scale == 1) {
				url = 'res/sprite/qiangzhuang';
			}
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.robSprite,
				bundle: Enums.bundleType.DGN
			});
			this.robSprite.node.active = true;
		} else {
			if (DGNModel.getBankerChairID() == this.getChairID()) {
				this.robSprite.node.active = false;
			}
		}
	},

	showResultScore(winScores, animal) {
		this.winScore.active = false;
		this.loseScore.active = false;
		this.bankLoseScore.active = false;
		this.bankWinScore.active = false;
		let score = Math.floor(winScores[this.getChairID()]);
		var bankerChairID = DGNModel.getBankerChairID();
		if (bankerChairID != this.getChairID()) {
			if (score >= 0) {
				this.winScore.active = true;
				this.winScore.getComponent(cc.Label).string = '+' + Math.floor(score);
				if (animal) {
					this.winScore.x = -50;
					this.winScore.runAction(cc.moveTo(0.2, cc.v2(0, 22)).easing(cc.easeIn(3.0)));
				}
			} else if (score < 0) {
				this.loseScore.active = true;
				this.loseScore.getComponent(cc.Label).string = '' + Math.floor(score);
				if (animal) {
					this.loseScore.x = -50;
					this.loseScore.runAction(cc.moveTo(0.2, cc.v2(0, 22)).easing(cc.easeIn(3.0)));
				}
			}
		} else {
			if (score >= 0) {
				this.bankWinScore.active = true;
				this.bankWinScore.getComponent(cc.Label).string = '+' + Math.floor(score);
				if (animal) {
					this.bankWinScore.y -= 105;
					this.bankWinScore.runAction(cc.moveTo(0.2, cc.v2(0, this.bankWinInitY)).easing(cc.easeIn(3.0)));
				}
			} else if (score < 0) {
				this.bankLoseScore.active = true;
				this.bankLoseScore.getComponent(cc.Label).string = '' + Math.floor(score);
				if (animal) {
					this.bankLoseScore.y -= 105;
					this.bankLoseScore.runAction(cc.moveTo(0.2, cc.v2(0, this.bankLoseInitY)).easing(cc.easeIn(3.0)));
				}
			}
		}
		if (bankerChairID != this.getChairID()) {
			if (score > 0) {
				this.scheduleOnce(() => {
					/* 庄家赔付 */
					this.goldMove(bankerChairID, this.getChairID());
				}, 1);
			} else {
				this.scheduleOnce(() => {
					/* 赔付庄家 */
					this.goldMove(this.getChairID(), bankerChairID);
				}, 0.5);
			}
		}
	},

	/*
	 * 获取其他头像相对于自己头像的位置
	 * @param Number chairID 其他头像的chairID
	 */
	getHeadNodePosByChairID(chairID) {
		if (!!this._mainComp) {
			let headNode = this._mainComp.getHeadNodeByChairID(chairID);
			return CCUtil.postionConvert(headNode, this.node)
		}
		return cc.v2(0, 0)
	},

	getUserPos(chairID) {
		let userPos = this.getPanNodePos();
		if (!!this._mainComp) {
			let user = this._mainComp.getUserCompByChairID(chairID);
			if (!!user) {
				userPos = CCUtil.postionConvert(user, this.node);
			}
		}
		return userPos;
	},


	getPanNodePos() {
		let panNodePos = this.scoreNode2.getPosition();
		if (!!this._mainComp) {
			panNodePos = CCUtil.postionConvert(this._mainComp.panNode, this.node);
		}
		return panNodePos;
	},

	/*
	 * 结算时金币移动
	 * @param Number startChairID 开始的头像chairID
	 * @param Number endChairID 结束的头像chairID
	 */
	goldMove(startChairID, endChairID) {
		let startPos = this.getHeadNodePosByChairID(startChairID);
		let endPos = this.getHeadNodePosByChairID(endChairID);
		let callFunc = cc.callFunc(() => {
			AssetsManager.playEffect({
				path: 'res/audio/main/xiazhu',
				bundle: Enums.bundleType.DGN
			});
		});
		for (let i = 0; i < 10; ++i) {
			let icon = cc.find('scorebg/icon', this.node);
			let gold = cc.instantiate(icon);
			gold.parent = this.node;
			/* gold.setPosition(startPos); */
			gold.x = startPos.x
			gold.y = startPos.y;
			gold.opacity = 0;
			gold.runAction(cc.sequence(
				cc.fadeIn(0.08 * i),
				cc.moveTo(0.35, endPos),
				callFunc,
				cc.removeSelf()
			));
		}
	},

	bankerPour() {
		let startPos = this.node.getPosition();
		let endPos = this.getPanNodePos();
		let callFunc = cc.callFunc(() => {
			AssetsManager.playEffect({
				path: 'res/audio/main/xiazhu',
				bundle: Enums.bundleType.DGN
			});
		});
		for (let i = 0; i < 10; ++i) {
			let icon = cc.find('scorebg/icon', this.node);
			let gold = cc.instantiate(icon);
			gold.parent = this.node;
			gold.x = startPos.x;
			gold.y = startPos.y;
			gold.opacity = 0;
			gold.runAction(cc.sequence(
				cc.fadeIn(0.08 * i),
				cc.moveTo(0.35, endPos),
				callFunc,
				cc.removeSelf()
			));
		}
	},

	bankerClearGold() {
		let endPos = this.node.getPosition();
		let startPos = this.getPanNodePos();
		let callFunc = cc.callFunc(() => {
			AssetsManager.playEffect({
				path: 'res/audio/main/xiazhu',
				bundle: Enums.bundleType.DGN
			});
		});
		for (let i = 0; i < 10; ++i) {
			let icon = cc.find('scorebg/icon', this.node);
			let gold = cc.instantiate(icon);
			gold.parent = this.node;
			/* gold.setPosition(startPos); */
			gold.x = startPos.x;
			gold.y = startPos.y;
			gold.opacity = 0;
			gold.runAction(cc.sequence(
				cc.fadeIn(0.08 * i),
				cc.moveTo(0.35, endPos),
				callFunc,
				cc.removeSelf()
			));
		}
	},

	/*
	 * 游戏聊天
	 */
	gameChat(data) {
		let node = cc.find('text', this.node);
		let label = cc.find('Label', node);
		if (data.chairID == this.getChairID()) {
			data.user = DGNModel.getUserByChairID(this.getChairID());
			CCUtil.gameChat(data, label, this.headSprite.node, this.node)
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});