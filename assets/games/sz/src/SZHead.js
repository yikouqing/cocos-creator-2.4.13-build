const SZModel = require('./SZModel');
const ApiSz = require('./ApiSz');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Enums = require('../../../src/const/Enums');
const ConfigModel = require('../../../src/model/ConfigModel');
const Utils = require('../../../src/utils/Utils');
const NativeUtil = require('../../../src/utils/NativeUtil');

cc.Class({
	extends: cc.Component,
	properties: {
		_endTime: 0, //总时长
		_totalTime: 10, //总操作时间
		_comp: null
	},

	onLoad() {
		this._comp = null;
		this.seatNames = ['空位', '空位', '空位', '空位', '空位', '空位', '空位', '空位', '空位', '空位'];
		this.opType = cc.find('op', this.node);
		this.headSprite = cc.find('head', this.node).getComponent(cc.Sprite);
		this.nameLabel = cc.find('name', this.node).getComponent(cc.Label);
		this.idLabel = cc.find('id', this.node).getComponent(cc.Label);
		this.scoreNode = cc.find('scorebg', this.node);
		this.scoreNodePos = this.scoreNode.getPosition();
		this.scoreLabel = cc.find('gold', this.scoreNode).getComponent(cc.Label);
		this.goldNode = cc.find('icon', this.scoreNode);
		this.bankerNode = cc.find('banker', this.node);
		this.readyNode = cc.find('ready', this.node);
		this.readyNodePos = this.readyNode.getPosition();
		this.fangzhuNode = cc.find('fangzhu', this.node);
		this.light = this.node.getChildByName('light');
		this.playVoiceNode = cc.find("playVioce", this.node);
		this.playVoiceNode.active = false;
		this.node.active = false;
		this.countDown = 0;
		this.winScoreNode = this.node.getChildByName('winscore');
		this.loseScoreNode = this.node.getChildByName('losescore');
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

	setVoice(state) {
		this.playVoiceNode.active = state;
	},

	hideSeat() {
		if (this.seatNode) {
			this.seatNode.active = false;
		}
		let names = ['head', 'name', 'id', 'robstate', 'scorebg', 'banker', 'winscore', 'losescore', 'ready'];
		for (let name of names) {
			let node = this.node.getChildByName(name);
			if (node) {
				node.active = true;
			}
		}
	},

	onSeatClick() {
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(SZModel.getMyChairID(), this.getChairID()));
	},

	bind(data) {
		this.index = data.index;
		this._comp = data.comp;
	},

	getChairID(chairID) {
		if (SZModel.getMyChairID() >= SZModel.getChairCount()) {
			return this.index;
		} else {
			return (SZModel.getMyChairID() + this.index) % SZModel.getChairCount();
		}
	},

	gameInit() {
		if (typeof (this.index) != 'number') return;
		this.node.active = true;
		let user = SZModel.getUserByChairID(this.getChairID());
		if (!user) {
			this.hideSeat();
			this.node.active = false;
			return;
		} else {
			this.hideSeat();
		}
		this._opOpSync();
		this.nameLabel.string = user.userInfo.nickname;
		AssetsManager.loadSpriteFrame({
			path: user.userInfo.avatar,
			sprite: this.headSprite
		});

		this.setUserScore(SZModel.getCurScoreByChairID(this.getChairID()))
		let is_creator = SZModel.getRoomCreatorChairID() == this.getChairID();
		let gameStatus = SZModel.getGameStatus();
		this.fangzhuNode.active = is_creator;
		this.readyNode.active = gameStatus == ApiSz.gameStatus.NONE && user.userStatus == ApiRoom.userStatusEnum.READY;
		// if (!!this.readyNode.active && !!this._comp && this.index == 0) {
		// 	let pos = CCUtil.postionConvert(this._comp.node, this.readyNode.parent);
		// 	this.readyNode.setPosition(cc.v2(pos.x, this.readyNode.y));
		// }
		this.bankerNode.active = (this.getChairID() == SZModel.getBankerChairID());
		let score = SZModel.getPourScoreByChairID(this.getChairID());
		this.setPourScore(score);
		this.showResultScore();
		cc.find('offline', this.node).active = user.userStatus == ApiRoom.userStatusEnum.OFFLINE;
		if (SZModel.getGameStatus() == ApiSz.gameStatus.POUR_SCORE && this.getChairID() == SZModel.getCurChairID()) {
			this.showTimerLight(true)
		} else {
			this.showTimerLight(false)
		}
	},

	setUserScore(s) {
		if (SZModel.scoreState() == 1) return;
		if (this.idLabel) this.idLabel.string = Utils.formatNumberWithDecimal(s, 2);
	},


	/**设置总输赢分数 */
	setTotalScore(userWinTotalScore) {
		if (cc.isValid(this.totalScore) && SZModel.scoreState()) {
			if (userWinTotalScore) {
				let s = userWinTotalScore[this.getChairID()];
				let num = Utils.formatNumberWithDecimal(s, 1);
				if (SZModel.scoreState() == 1) {
					this.totalScore.active = false;
					this.idLabel.string = num;
					this.idLabel.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
					return
				}
				if (typeof (s) == "number") {
					if (s >= 0) {
						this.txt_totalScore.node.color = new cc.Color().fromHEX("#00F105")
					} else {
						this.txt_totalScore.node.color = new cc.Color().fromHEX("#FF0000")
					}
					this.totalScore.active = true
					this.txt_totalScore.string = num
				} else {
					this.txt_totalScore.string = '0';
				}
			} else {
				this.txt_totalScore.string = '0';
			}
		}
	},

	/*
	 * 设置下分
	 */
	setPourScore(score) {
		if (score == 0 || score == null) {
			this.scoreNode.active = false;
		} else {
			this.scoreLabel.string = Math.floor(score);
			this.scoreNode.active = true;
		}
	},

	messageCallbackHandler(route, msg) {
		if (!SZModel.isGameInited(route, msg)) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.setTotalScore(msg.data.gameData.userWinTotalScore)
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				if (msg.data.chairID == SZModel.getMyChairID() && SZModel.getCurBureau() == 0) {
					this.gameInit();
				}
				if (this.node.active && msg.data.chairID == this.getChairID()) {
					this.readyNode.active = true;
					this.scoreNode.active = false;
					// if (!!this.readyNode.active && !!this._comp && this.index == 0) {
					// 	let pos = CCUtil.postionConvert(this._comp.node, this.readyNode.parent);
					// 	this.readyNode.setPosition(cc.v2(pos.x, this.readyNode.y));
					// }
				}
				if (this.node.active && msg.data.chairID == SZModel.getMyChairID()) {
					let user = SZModel.getUserByChairID(this.getChairID());
					if (user) {
						this.scoreNode.active = false;
						this.readyNode.active = user.userStatus == ApiRoom.userStatusEnum.READY;
						this.bankerNode.active = (SZModel.getBankerChairID() == this.getChairID());
						this.winScoreNode.active = false;
						this.loseScoreNode.active = false;
						// if (!!this.readyNode.active && !!this._comp && this.index == 0) {
						// 	let pos = CCUtil.postionConvert(this._comp.node, this.readyNode.parent);
						// 	this.readyNode.setPosition(cc.v2(pos.x, this.readyNode.y));
						// }
					}
				}
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
				if (SZModel.getCurBureau() == 0) {
					this.gameInit();
				} else {
					if (SZModel.getMyUid() != msg.data.uid) {
						if (this.getChairID() == msg.data.fromChairID || this.getChairID() == msg.data.toChairID) {
							this.gameInit();
						}
					} else {
						this.gameInit();
					}
				}
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) {
				let user = SZModel.getUserByChairID(this.getChairID());
				if (this.node.active && user) {
					this.setUserScore(SZModel.getCurScoreByChairID(this.getChairID()))
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
				this.gameChat(msg.data);
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiSz.GAME_BANKER_PUSH) {
				this.setBanker();
			} else if (msg.type === ApiSz.GAME_POUR_SCORE_PUSH) {
				if (msg.data.chairID == this.getChairID()) {
					this.setPourScore(msg.data.chairScore);
					this.setUserScore(SZModel.getCurScoreByChairID(this.getChairID()))
					this._opOpSync();
				}
			} else if (msg.type === ApiSz.GAME_COMPARE_PUSH) {
				if (msg.data.fromChairID == this.getChairID()) {
					this._opOpSync();
				}
			} else if (msg.type === ApiSz.GAME_LOOK_PUSH) {
				if (msg.data.chairID == this.getChairID()) {
					this._opOpSync();
				}
			} else if (msg.type === ApiSz.GAME_ABANDON_PUSH) {
				if (msg.data.chairID == this.getChairID()) {
					this._opOpSync();
				}
			} else if (msg.type === ApiSz.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus != ApiSz.gameStatus.NONE) {
					this.readyNode.active = false;
				} else {
					this._opOpSync();
					this.setUserScore(SZModel.getCurScoreByChairID(this.getChairID()))
				}
				if (msg.data.gameStatus == ApiSz.gameStatus.SEND_CARDS) {
					let user = SZModel.getUserByChairID(this.getChairID());
					if (user) {
						this.scoreNode.active = false;
						this.readyNode.active = false;
						this.bankerNode.active = SZModel.getBankerChairID() == this.getChairID();
						this.winScoreNode.active = false;
						this.loseScoreNode.active = false;
					}
				}
				if (SZModel.getGameStatus() == ApiSz.gameStatus.POUR_SCORE && this.getChairID() == SZModel.getCurChairID()) {
					this.showTimerLight(true)
				} else {
					this.showTimerLight(false)
				}
			} else if (msg.type === ApiSz.GAME_RESULT_PUSH) {
				if (SZModel.getUserByChairID(this.getChairID())) {
					this.showResultScore(true);
					this.setUserScore(SZModel.getCurScoreByChairID(this.getChairID()))
				}
			} else if (msg.type === ApiSz.GAME_TURN_PUSH) {
				if (SZModel.getGameStatus() == ApiSz.gameStatus.POUR_SCORE && this.getChairID() == SZModel.getCurChairID()) {
					this.showTimerLight(true)
				} else {
					this.showTimerLight(false)
				}
			}
		}
	},

	_opOpSync() {
		let chairID = this.getChairID();
		let opType = SZModel.getUserOperateTypeByChairID(chairID);
		if (!!this.opType && !!this.opType.getComponent(cc.Sprite)) {
			this.opType.getComponent(cc.Sprite).spriteFrame = null;
			AssetsManager.loadSpriteFrame({
				path: `res/sprite/op/op${opType}`,
				bundle: Enums.bundleType.SZ,
				sprite: this.opType.getComponent(cc.Sprite)
			})
		}
	},

	setBanker() {
		let is_banker = (SZModel.getBankerChairID() == this.getChairID());
		this.bankerNode.active = is_banker;
	},

	showResultScore(animal) {
		this.winScoreNode.active = false;
		this.loseScoreNode.active = false;
		let result = SZModel.getResult();
		if (result) {
			let score = Math.floor(result.winScores[this.getChairID()]);
			if (score > 0) {
				this.winScoreNode.stopAllActions();
				this.winScoreNode.active = true;
				this.winScoreNode.setPosition(cc.v2(0, 2));
				this.winScoreNode.getComponent(cc.Label).string = '+' + Math.floor(score);
				if (animal) {
					let headSize = this.node.getContentSize();
					cc.tween(this.winScoreNode)
						.to(0.2, {
							position: cc.v3(0, headSize.height * 1 / 3)
						}, {
							easing: 'backOut'
						})
						.call(() => {
							if (result.awardInfo &&
								result.awardInfo.awardTotalScore > 0 &&
								this.getChairID() == result.awardInfo.winChairID) {
								let cardTypeName = result.awardInfo.awardType == ApiSz.cardsType.BAOZI ? '豹子' : result.awardInfo.awardType == ApiSz.cardsType.SHUNJIN ? '顺金' : '';
								if (cardTypeName.length != 0) {
									AssetsManager.loadAsset({
										path: 'res/prefab/SZXiQianLbl',
										aType: cc.Prefab,
										bundle: Enums.bundleType.SZ
									}, (item) => {
										if (!item || !cc.isValid(this.node)) return;
										let xiQianNode = cc.instantiate(item);
										this.node.addChild(xiQianNode);
										let xiQianLabel = xiQianNode.getComponent(cc.Label);
										xiQianLabel.string = `${cardTypeName}喜分+${result.awardInfo.awardTotalScore}`;
										xiQianNode.setPosition(cc.v2(0, 0));
										cc.tween(xiQianNode)
											.to(0.3, {
												position: cc.v3(0, headSize.height * 1 / 2)
											}, {
												easing: 'backOut'
											})
											.delay(1.5)
											.removeSelf()
											.start();
									});
								}
							}
						})
						.start();
				}
			} else if (score < 0) {
				this.loseScoreNode.active = true;
				this.loseScoreNode.getComponent(cc.Label).string = '' + Math.floor(score);
				if (animal) {
					this.loseScoreNode.x = -50;
					this.loseScoreNode.runAction(cc.moveTo(0.2, cc.v2(0, 22)).easing(cc.easeIn(3.0)));
				}
			} else if (result.winners.indexOf(this.getChairID()) != -1) {
				this.winScoreNode.active = true;
				this.winScoreNode.getComponent(cc.Label).string = '+' + Math.floor(score);
				if (animal) {
					this.winScoreNode.runAction(cc.moveTo(0.2, cc.v2(0, 22)).easing(cc.easeIn(3.0)));
				}
			}
		}
	},

	/*
	 * 游戏聊天
	 */
	gameChat(data) {
		let node = cc.find('text', this.node);
		let label = cc.find('Label', node);
		if (data.chairID == this.getChairID()) {
			data.user = SZModel.getUserByChairID(this.getChairID());
			CCUtil.gameChat(data, label, this.headSprite.node, this.node)
		}
	},

	/**展示时间转圈 */
	showTimerLight(isShow) {
		this.light.active = isShow;
		if (isShow) {
			this.countDown = SZModel.getTick();
			this.light.getComponent(cc.ProgressBar).progress = 1;
			this.light.color = cc.color("#00FF0F");
			this._endTime = (this.countDown || 0) * 1000 + Date.now();
			this._totalTime = SZModel.getGameStatus() == ApiSz.gameStatus.POUR_SCORE ? SZModel.getGameRuleByKey('pourTick') : 10;
			if (!this._totalTime || isNaN(this._totalTime)) {
				this._totalTime = 10;
			}
			this._totalTime *= 1000;
		} else {
			this.countDown = -1;
		}
	},

	update(dt) {
		if (!!this.light && this.light.active) {
			let leftTick = this._endTime - Date.now();
			if (leftTick <= 0) {
				this.showTimerLight(false);
			} else {
				let pcom = this.light.getComponent(cc.ProgressBar);
				if (!pcom) return;
				pcom.progress = leftTick / this._totalTime; //设置总时长为10s 用于中途回复计时状态
				if (leftTick <= 5000) {
					this.light.color = cc.color("#FF0000");
				}
			}
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});