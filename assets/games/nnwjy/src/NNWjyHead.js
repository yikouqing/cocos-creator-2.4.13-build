const NNWjyModel = require('./NNWjyModel');
const ApiNnWjy = require('./ApiNnWjy');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const { Def_Nn } = require('../../../src/const/Defines');

cc.Class({
	extends: cc.Component,
	properties: {},

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
		this.node.active = false;
		this.readyNodePos = this.readyNode.getPosition();
		this.scoreNodePos = this.scoreNode.getPosition();
		this.playVoiceNode = cc.find("playVioce", this.node);
		this.playVoiceNode.active = false;

		/**总输赢 */
		this.totalScore = cc.find("totalScore", this.node)
		if (cc.isValid(this.totalScore)) {
			this.txt_totalScore = cc.find("txt_totalScore", this.totalScore).getComponent(cc.Label)
			this.totalScore.active = false
		}

		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		this.node.active = false;
	},

	setIndex(index) {
		this.index = index;
		// if (this.index == 0 && cc.visibleRect.width / cc.visibleRect.height > 1.8) {
		// 	this.readyNode.x = cc.visibleRect.width / 2 - 1334 / 2 + this.readyNodePos.x;
		// 	this.scoreNode.x = cc.visibleRect.width / 2 - 1334 / 2 + this.scoreNodePos.x;
		// }
	},
	setVoice(state) {
		this.playVoiceNode.active = state;
	},

	hideSeat() {
		if (this.seatNode) {
			this.seatNode.active = false;
		}
		let names = ['head', 'headedg', 'name', 'id', 'robstate', 'scorebg', 'banker', 'winscore', 'losescore', 'ready'];
		for (let name of names) {
			let node = this.node.getChildByName(name);
			if (node) {
				node.active = true;
			}
		}
	},

	onSeatClick() {
		if (NNWjyModel.isUnionCreate()) {
			let user = NNWjyModel.getUserByChairID(NNWjyModel.getMyChairID());
			// if (user.userInfo.score < NNModel.getGameRule().scoreLowLimit) {
			// 	AssetsManager.tipDialog('金币不足，不能入座');
			// 	return;
			// }
		}
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(NNWjyModel.getMyChairID(), this.getChairID()));
	},

	getChairID(chairID) {
		if (NNWjyModel.getMyChairID() >= NNWjyModel.getChairCount()) {
			return this.index;
		} else {
			return (NNWjyModel.getMyChairID() + this.index) % NNWjyModel.getChairCount();
		}
	},

	gameInit() {
		if (typeof (this.index) != 'number') {
			return;
		} /* 未使用，等待销毁 */
		this.node.active = true;
		let user = NNWjyModel.getUserByChairID(this.getChairID());
		if (!user) {
			this.hideSeat();
			this.node.active = false;
			return;
		} else {
			this.hideSeat();
		}

		this.nameLabel.string = CCUtil.stringClamp(user.userInfo.nickname, 5, '..');

		this.setUserScore(NNWjyModel.getCurScore(this.getChairID()))
		let is_creator = (NNWjyModel.getRoomCreatorChairID() == this.getChairID());
		this.fangzhuNode.active = is_creator;
		AssetsManager.loadSpriteFrame({
			path: user.userInfo.avatar,
			sprite: this.headSprite
		});
		if (NNWjyModel.getGameStatus() == ApiNnWjy.gameStatus.NONE) {
			this.robSprite.node.active = false;
			this.scoreNode.active = false;
			this.bankerNode.active = false;
			this.readyNode.active = user.userStatus == ApiRoom.userStatusEnum.READY;
		} else if (NNWjyModel.getGameStatus() == ApiNnWjy.gameStatus.ROB_BANK) {
			this.scoreNode.active = false;
			this.bankerNode.active = false;
			this.readyNode.active = false;
		} else if (NNWjyModel.getGameStatus() >= ApiNnWjy.gameStatus.POUR_SCORE) {
			this.setPourScore(NNWjyModel.getPourScoreByChairID(this.getChairID()));
			this.bankerNode.active = (this.getChairID() == NNWjyModel.getBankerChairID());
			this.readyNode.active = false;
		}
		this.setRobScale();
		this.showResultScore();
		cc.find('offline', this.node).active = user.userStatus == ApiRoom.userStatusEnum.OFFLINE;
	},


	setUserScore(s) {
		if (NNWjyModel.scoreState() == 1) return;
		if (this.idLabel) this.idLabel.string = Utils.formatNumberWithDecimal(s, 1);
	},
	/**设置总输赢分数 */
	setTotalScore(userWinTotalScore) {
		if (cc.isValid(this.totalScore) && !!NNWjyModel.scoreState()) {
			if (userWinTotalScore) {
				let s = userWinTotalScore[this.getChairID()];
				let num = Utils.formatNumberWithDecimal(s, 1);
				if (NNWjyModel.scoreState() == 1) {
					this.totalScore.active = false;
					if (this.idLabel) {
						this.idLabel.string = num;
						this.idLabel.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
					}
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
		}
	},

	/*
	 * 设置抢庄倍数
	 */
	setRobScale() {
		this.robSprite.node.active = false;
		let scale = NNWjyModel.getRobScaleByChairID(this.getChairID());
		if (scale == null) {
			return;
		}

		if (NNWjyModel.getGameStatus() == ApiNnWjy.gameStatus.ROB_BANK && NNWjyModel.getBankerChairID() == null) {
			let url = 'res/sprite/' + ['buqiang', 'qiang1', 'qiang2', 'qiang3', 'qiang4'][scale];
			if (scale == 1 && NNWjyModel.getGameType() == Def_Nn.gameType.ZHIYOUQZ) {
				url = 'res/sprite/qiangzhuang';
			}
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.robSprite,
				bundle: Enums.bundleType.WJYNN
			});
			this.robSprite.node.active = true;
		} else {
			if ((NNWjyModel.getGameType() == Def_Nn.gameType.ZHIYOUQZ || NNWjyModel.getGameType() == Def_Nn.gameType.MINGPAIQZ) && NNWjyModel.getBankerChairID() == this.getChairID()) {
				let url = 'res/sprite/' + ['', '1bei', '2bei', '3bei', '4bei'][scale];
				AssetsManager.loadSpriteFrame({
					path: url,
					sprite: this.robSprite,
					bundle: Enums.bundleType.WJYNN
				});
				this.robSprite.node.active = true;
			}
		}
	},

	/*
	 * 设置下分
	 */
	setPourScore(score, animal) {
		// console.log('下注分数', score);
		if (score == 0 || score == null) {
			this.scoreNode.active = false;
		} else {
			//倍率转换
			this.scoreLabel.string = Utils.formatNumberWithDecimal(score / 10, 2);
			this.scoreNode.active = true;
			if (animal) {
				let icon = cc.find('scorebg/icon', this.node);
				let icon_pos = icon.getPosition();
				let scorebg_pos = cc.find('scorebg', this.node).getPosition();
				let end_pos = cc.v2(scorebg_pos.x + icon_pos.x, scorebg_pos.y + icon_pos.y);
				AssetsManager.playEffect({
					path: 'res/audio/main/fly_gold',
					bundle: Enums.bundleType.WJYNN
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

	messageCallbackHandler(route, msg) {
		// console.log('我自己坐下---消息', this.index);
		if (!NNWjyModel.getGameInited()) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.setTotalScore(msg.data.gameData.userWinTotalScore)
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				if (msg.data.chairID == NNWjyModel.getMyChairID() && NNWjyModel.getCurBureau() == 0) {
					this.gameInit();
				}
				if (this.node.active && msg.data.chairID == this.getChairID()) {
					this.readyNode.active = true;
					this.robSprite.node.active = false;
					this.scoreNode.active = false;
				}
				if (this.node.active && (msg.data.chairID == NNWjyModel.getMyChairID())) {
					let user = NNWjyModel.getUserByChairID(this.getChairID());
					if (user) {
						this.robSprite.node.active = false;
						this.scoreNode.active = false;
						this.readyNode.active = user.userStatus == ApiRoom.userStatusEnum.READY;
						this.bankerNode.active = (NNWjyModel.getBankerChairID() == this.getChairID());
						this.winScoreNode.active = false;
						this.loseScoreNode.active = false;
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
				if (NNWjyModel.getCurBureau() == 0) {
					this.gameInit();
				} else {
					if (NNWjyModel.getMyUid() != msg.data.uid) {
						if (this.getChairID() == msg.data.fromChairID ||
							this.getChairID() == msg.data.toChairID) {
							this.gameInit();
						}
					} else {
						this.gameInit();
					}
				}
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) {
				let user = NNWjyModel.getUserByChairID(this.getChairID());
				if (this.node.active && user) {
					this.setUserScore(NNWjyModel.getCurScore(this.getChairID()))
				}
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				if (msg.data.chairID == this.getChairID()) {
					// console.log('玩家离线了1', msg.data.chairID);
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
			if (msg.type === ApiNnWjy.GAME_ROB_BANK_PUSH) {
				this.setRobScale(msg.data.robScale);
			} else if (msg.type === ApiNnWjy.GAME_BANKER_PUSH) {
				this.robSprite.node.active = false;
				this.setBanker(msg.data.robChairIDs, true);
			} else if (msg.type === ApiNnWjy.GAME_POUR_SCORE_PUSH) {
				if (msg.data.chairID == this.getChairID()) {
					// console.log("下注推送==", msg)
					this.setPourScore(msg.data.score, true);
					this.setUserScore(NNWjyModel.getCurScore(this.getChairID()))
				}
			} else if (msg.type === ApiNnWjy.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiNnWjy.gameStatus.SEND_CARDS) {
					let user = NNWjyModel.getUserByChairID(this.getChairID());
					if (user) {
						this.robSprite.node.active = false;
						this.scoreNode.active = false;
						this.readyNode.active = user.userStatus == ApiRoom.userStatusEnum.READY;
						// this.bankerNode.active = (NNModel.getBankerChairID() == this.getChairID());
						this.bankerNode.active = false;
						this.winScoreNode.active = false;
						this.loseScoreNode.active = false;
					}
				}
				if (msg.data.gameStatus != ApiNnWjy.gameStatus.NONE) {
					this.readyNode.active = false;
				} else {
					this.setUserScore(NNWjyModel.getCurScore(this.getChairID()))
				}
			} else if (msg.type === ApiNnWjy.GAME_RESULT_PUSH) {
				if (NNWjyModel.getUserByChairID(this.getChairID())) {
					this.showResultScore(true);
					this.setUserScore(NNWjyModel.getCurScore(this.getChairID()))
				}
			}
		}
	},

	setBanker(robChairIDs, animal) {
		let is_banker = (NNWjyModel.getBankerChairID() == this.getChairID());
		if (is_banker && animal && NNWjyModel.getGameType() != Def_Nn.gameType.LUNZHUANG) {
			AssetsManager.playEffect({
				path: 'res/audio/main/rob_zhuang_ani',
				bundle: Enums.bundleType.WJYNN
			});
		}
		if (!is_banker) {
			this.robSprite.node.active = false;
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

	showResultScore(animal) {
		this.winScoreNode.active = false;
		this.loseScoreNode.active = false;
		let result = NNWjyModel.getResult();
		if (result) {
			let score = result[this.getChairID()];
			// console.log("赢分结算", score);
			if (score >= 0) {
				this.winScoreNode.active = true;
				this.winScoreNode.getComponent(cc.Label).string = '+' + score;
				if (animal) {
					this.winScoreNode.x = -50;
					this.winScoreNode.runAction(cc.moveTo(0.2, cc.v2(0, 22)).easing(cc.easeIn(3.0)));
				}
			} else if (score < 0) {
				this.loseScoreNode.active = true;
				this.loseScoreNode.getComponent(cc.Label).string = '' + score;
				if (animal) {
					this.loseScoreNode.x = -50;
					this.loseScoreNode.runAction(cc.moveTo(0.2, cc.v2(0, 22)).easing(cc.easeIn(3.0)));
				}
			}
		}
		if (animal) {
			let bankerID = NNWjyModel.getBankerChairID();
			if (bankerID == null) {
				bankerID = 0;
				for (let i = 1; i < result.length; ++i) {
					if (result[i] > result[bankerID]) {
						bankerID = i;
					}
				}
			}
			if (this.getChairID() != bankerID) {
				return;
			}

			let winScore = [];
			for (let i = 0; i < NNWjyModel.getChairCount(); ++i) {
				winScore[i] = 0;
			}
			let mypour = NNWjyModel.getRobScaleByChairID(bankerID);
			if (mypour == null) {
				mypour = NNWjyModel.getPourScoreByChairID(bankerID);
			}
			let myCards = NNWjyModel.getHandCardsByChairID(this.getChairID());
			for (let i = 0; i < NNWjyModel.getChairCount(); ++i) {
				let cards = NNWjyModel.getHandCardsByChairID(i);
				if (!cards || i == this.getChairID()) {
					continue;
				}
				let scale = 0;
				if (NNWjyModel.getNNLogic().compareCards(myCards, cards) > 0) {
					scale = NNWjyModel.getNNLogic().getScaleByCards(myCards);
					winScore[i] = scale * NNWjyModel.getPourScoreByChairID(i) * mypour;
				} else {
					scale = NNWjyModel.getNNLogic().getScaleByCards(cards);
					winScore[i] = -scale * NNWjyModel.getPourScoreByChairID(i) * mypour;
				}
			}

			let has_lose = false;
			for (let i = 0; i < winScore.length; ++i) {
				if (winScore[i] < 0) {
					has_lose = true;
					this.goldMove(this.getChairID(), i);
				}
			}
			/* this.scheduleOnce(() => { */
			for (let i = 0; i < winScore.length; ++i) {
				if (winScore[i] > 0) {
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
		let mainLogic = this.node.parent.getComponent('NNWjyMainDialog');
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
				path: 'res/audio/main/xiazhu',
				bundle: Enums.bundleType.WJYNN
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
	 * 游戏聊天
	 */
	gameChat(data) {
		let node = cc.find('text', this.node);
		let label = cc.find('Label', node);
		if (data.chairID == this.getChairID()) {
			data.user = NNWjyModel.getUserByChairID(this.getChairID());
			CCUtil.gameChat(data, label, this.headSprite.node, this.node)
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});