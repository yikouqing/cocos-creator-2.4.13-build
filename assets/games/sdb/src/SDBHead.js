const SDBModel = require('./SDBModel');
const ApiSdb = require('./ApiSdb');
const ApiRoom = require('../../../src/api/ApiRoom');
const UserModel = require('../../../src/model/UserModel');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ConfigModel = require('../../../src/model/ConfigModel');
const Utils = require('../../../src/utils/Utils');
const NativeUtil = require('../../../src/utils/NativeUtil');
const { Def_Sdb } = require('../../../src/const/Defines');

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
		this.scoreNodePos = this.scoreNode.getPosition();
		this.scoreLabel = cc.find('gold', this.scoreNode).getComponent(cc.Label);
		this.goldNode = cc.find('icon', this.scoreNode);
		this.bankerNode = cc.find('banker', this.node);
		this.readyNode = cc.find('ready', this.node);
		this.readyNodePos = this.readyNode.getPosition();
		this.fangzhuNode = cc.find('fangzhu', this.node);
		this.light = this.node.getChildByName('light');
		this.playVoiceNode = cc.find("playVioce", this.node);
		this.optlight = cc.find("optlight", this.node)
		this.playVoiceNode.active = false;
		/**总输赢 */
		this.totalScore = cc.find("totalScore", this.node)
		if (cc.isValid(this.totalScore)) {
			this.txt_totalScore = cc.find("txt_totalScore", this.totalScore).getComponent(cc.Label)
			this.totalScore.active = false
		}

		this.winScoreNode = this.node.getChildByName('winscore');
		this.loseScoreNode = this.node.getChildByName('losescore');
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		this.node.active = false;
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
		let names = ['head', 'headedg', 'name', 'id', 'robstate', 'scorebg', 'banker', 'winscore', 'losescore', 'ready'];
		for (let name of names) {
			let node = this.node.getChildByName(name);
			if (node) {
				node.active = true;
			}
		}
	},

	onSeatClick() {
		if (SDBModel.isUnionCreate()) {
			// if (user.userInfo.score < SDBModel.getGameRule().scoreLowLimit) {
			// AssetsManager.tipDialog('金币不足，不能入座');
			// 	return;
			// }
		}
		// console.log("捞腌菜-发起坐下", ApiRoom.getUserChangeSeatNotify(SDBModel.getMyChairID(), this.getChairID()));
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(SDBModel.getMyChairID(), this.getChairID()));
	},

	getChairID() {
		if (SDBModel.getMyChairID() >= SDBModel.getChairCount()) {
			return this.index;
		} else {
			return (SDBModel.getMyChairID() + this.index) % SDBModel.getChairCount();
		}
	},

	gameInit() {
		if (typeof (this.index) != 'number') {
			return;
		} /* 未使用，等待销毁 */
		this.node.active = true;
		let user = SDBModel.getUserByChairID(this.getChairID());
		if (!user) {
			this.hideSeat();
			this.node.active = false;
			return;
		} else {
			this.hideSeat();
		}
		if (user.userInfo.uid == UserModel.getData('uid')) {
			// console.log('我自己坐下-玩家', user);
			// console.log('我自己坐下-分数', SDBModel.getCurScore(this.getChairID()));
		}
		this.nameLabel.string = user.userInfo.nickname;
		this.setUserScore(SDBModel.getCurScore(this.getChairID()))
		let is_creator = (SDBModel.getRoomCreatorChairID() == this.getChairID());
		this.fangzhuNode.active = is_creator;
		AssetsManager.loadSpriteFrame({
			path: user.userInfo.avatar,
			sprite: this.headSprite
		});

		if (SDBModel.getGameStatus() == ApiSdb.gameStatus.NONE) {
			this.scoreNode.active = false;
			this.bankerNode.active = false;
			this.optlight.active = false;
			this.readyNode.active = user.userStatus == ApiRoom.userStatusEnum.READY;
		} else if (SDBModel.getGameStatus() == ApiSdb.gameStatus.ROB_BANK) {
			this.scoreNode.active = false;
			this.bankerNode.active = false;
			this.readyNode.active = false;
		} else if (SDBModel.getGameStatus() >= ApiSdb.gameStatus.POUR_SCORE) {
			this.setPourScore(SDBModel.getPourScoreByChairID(this.getChairID()));
			this.bankerNode.active = (this.getChairID() == SDBModel.getBankerChairID());
			this.readyNode.active = false;
		}
		this.setRobScale();
		this.showResultScore();
		cc.find('offline', this.node).active = user.userStatus == ApiRoom.userStatusEnum.OFFLINE;
	},

	setUserScore(s) {
		if (SDBModel.scoreState() == 1) return;
		if (this.idLabel) this.idLabel.string = Utils.formatNumberWithDecimal(s, 1);
	},

	/**设置总输赢分数 */
	setTotalScore(userWinTotalScore) {
		if (cc.isValid(this.totalScore) && SDBModel.scoreState()) {
			if (userWinTotalScore) {
				let s = userWinTotalScore[this.getChairID()];
				let num = Utils.formatNumberWithDecimal(s, 1);
				if (SDBModel.scoreState() == 1) {
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
	 * 设置抢庄 图标
	 */
	setRobScale() {
		let scale = SDBModel.getRobScaleByChairID(this.getChairID());
		this.robSprite.node.active = false;
		if (scale == null) {
			return;
		}
		if (SDBModel.getGameStatus() == ApiSdb.gameStatus.ROB_BANK && SDBModel.getBankerChairID() == null) {
			let url = 'res/sprite/operatetype/qiang_' + scale;
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.robSprite,
				bundle: Enums.bundleType.SDB
			});
			this.robSprite.node.active = true;
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
				let icon = cc.find('icon', this.scoreNode);
				let icon_pos = CCUtil.postionConvert(icon, this.node);
				let end_pos = icon_pos //cc.v2(scorebg_pos.x + icon_pos.x, scorebg_pos.y + icon_pos.y);
				AssetsManager.playEffect({
					path: 'res/audio/main/fly_gold',
					bundle: Enums.bundleType.SDB
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
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.setTotalScore(msg.data.gameData.userWinTotalScore)
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				if (msg.data.chairID == SDBModel.getMyChairID() && SDBModel.getCurBureau() == 0) {
					this.gameInit();
				}
				if (this.node.active && msg.data.chairID == this.getChairID()) {
					this.readyNode.active = true;
					this.robSprite.node.active = false;
					this.scoreNode.active = false;
				}
				if (this.node.active && msg.data.chairID == SDBModel.getMyChairID()) {
					let user = SDBModel.getUserByChairID(this.getChairID());
					if (user) {
						this.robSprite.node.active = false;
						this.scoreNode.active = false;
						this.readyNode.active = user.userStatus == ApiRoom.userStatusEnum.READY;
						this.bankerNode.active = (SDBModel.getBankerChairID() == this.getChairID());
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
				if (SDBModel.getCurBureau() == 0) {
					this.gameInit();
				} else {
					if (SDBModel.getMyUid() != msg.data.uid) {
						if (this.getChairID() == msg.data.fromChairID ||
							this.getChairID() == msg.data.toChairID) {
							this.gameInit();
						}
					} else {
						this.gameInit();
					}
				}
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) {
				let user = SDBModel.getUserByChairID(this.getChairID());
				if (this.node.active && user) {
					this.setUserScore(SDBModel.getCurScore(this.getChairID()))
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
			if (msg.type === ApiSdb.GAME_ROB_BANK_PUSH) {
				if (msg.data.chairID == this.getChairID()) {
					this.setRobScale(msg.data.robScale);
				}
			} else if (msg.type === ApiSdb.GAME_BANKER_PUSH) {
				this.setBanker(msg.data.robChairIDs, true);
			} else if (msg.type === ApiSdb.GAME_POUR_SCORE_PUSH) {
				if (msg.data.chairID == this.getChairID()) {
					this.setPourScore(msg.data.score, true);
					this.setUserScore(SDBModel.getCurScore(this.getChairID()))
				}
			} else if (msg.type === ApiSdb.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiSdb.gameStatus.SEND_CARDS) {
					let user = SDBModel.getUserByChairID(this.getChairID());
					if (user) {
						this.robSprite.node.active = false;
						// this.scoreNode.active = false;
						this.readyNode.active = user.userStatus == ApiRoom.userStatusEnum.READY;
						this.bankerNode.active = (SDBModel.getBankerChairID() == this.getChairID());
						this.winScoreNode.active = false;
						this.loseScoreNode.active = false;
					}
				}
				if (msg.data.gameStatus != ApiSdb.gameStatus.NONE) {
					this.readyNode.active = false;
				} else {
					this.winScoreNode.active = false;
					this.loseScoreNode.active = false;
					this.setUserScore(SDBModel.getCurScore(this.getChairID()))
				}
			} else if (msg.type === ApiSdb.GAME_RESULT_PUSH) {
				this.optlight.stopAllActions()
				this.optlight.active = false
				if (SDBModel.getUserByChairID(this.getChairID())) {
					this.showResultScore(true);
					this.setUserScore(SDBModel.getCurScore(this.getChairID()))
				}
			} else if (msg.type === ApiSdb.GAME_USER_OPERATE_PUSH) { //玩家操作返回
				this.onUserOperate(msg.data)
			} else if (msg.type === ApiSdb.GAME_USER_OPERATE_START_PUSH) { //玩家操作通知
				this.onOptStartPush(msg.data)
			}
		}
	},

	/**
	 * 玩家操作通知
	 * @param {*} data 
	 */
	onOptStartPush(data) {
		if (data.chairID !== this.getChairID()) {
			this.optlight.active = false
			return
		}
		this.optlight.active = true
		this.optlight.opacity = 255
		this.optlight.stopAllActions()
		cc.tween(this.optlight).to(0.5, {
			opacity: 0
		}).to(0.5, {
			opacity: 255
		}).union().repeatForever().start()
	},

	/**
	 * 玩家操作返回
	 * @param {*} data 
	 */
	onUserOperate(data) {
		// operateInfo: {
		// 	chairID: 1,
		// 	operateType: 1,
		// 	pullCard: 10,
		// boomCards:array(2)
		// }
		// if (data.chairID !== this.getChairID()) {
		// 	return
		// }
		// let url = 'res/sprite/operatetype/opt_' + data.operateInfo.operateType
		// SDBLayerManager.loadSpriteFrame(url, this.robSprite, () => {
		// 	console.log("修改了操作提示图片", this.robSprite)
		// });
		// this.robSprite.node.active = true;
	},

	/**
	 * 设置庄家
	 * @param {*} robChairIDs 
	 * @param {*} animal 
	 */
	setBanker(robChairIDs, animal) {
		let is_banker = (SDBModel.getBankerChairID() == this.getChairID());
		if (is_banker && animal && SDBModel.getGameType() == Def_Sdb.gameFrameType.QIANGZHUANG) {
			AssetsManager.playEffect({
				path: 'res/audio/main/rob_zhuang_ani',
				bundle: Enums.bundleType.SDB
			});
		}
		this.robSprite.node.active = false;
		if (robChairIDs && animal) {
			if (robChairIDs.indexOf(this.getChairID()) != -1) {
				this.light.active = true;
				this.light.runAction(cc.repeat(cc.sequence(cc.fadeOut(0.1), cc.fadeIn(0.1)), 5));
				if (is_banker) {
					this.bankerNodeMoveAnimal(2);
				} else {
					this.scheduleOnce(() => {
						this.light.active = false;
						this.setRobScale();
					}, 2);
				}
			}
		}
	},

	/*
	 * 庄家图标移动动画
	 */
	bankerNodeMoveAnimal(delay) {
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
					this.bankerNode.active = true;
					this.setRobScale();
				})
			));
			bank_node.runAction(cc.scaleTo(0.5, 0.16));
		}, delay);
	},

	showResultScore(animal) {
		this.winScoreNode.active = false;
		this.loseScoreNode.active = false;
		let result = SDBModel.getResult();
		if (result) {
			let score = Math.floor(result[this.getChairID()]);
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
			let bankerID = SDBModel.getBankerChairID();
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
			for (let i = 0; i < result.length; ++i) {
				winScore[i] = 0;
			}

			for (let i = 0; i < result.length; ++i) {
				if (i == this.getChairID()) {
					continue;
				}
				winScore[i] = result[i]
			}

			let has_lose = false;
			for (let i = 0; i < winScore.length; ++i) {
				if (winScore[i] > 0) {
					has_lose = true;
					this.goldMove(this.getChairID(), i);
				}
			}
			this.scheduleOnce(() => {
				for (let i = 0; i < winScore.length; ++i) {
					if (winScore[i] < 0) {
						this.goldMove(i, this.getChairID());
					}
				}
			}, (has_lose) ? 1 : 0);
		}
	},

	/*
	 * 获取其他头像相对于自己头像的位置
	 * @param Number chairID 其他头像的chairID
	 */
	getHeadNodePosByChairID(chairID) {
		let mainLogic = this.node.parent.getComponent('SDBMainDialog');
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
		let speed = 1500;
		let startPos = this.getHeadNodePosByChairID(startChairID);
		let endPos = this.getHeadNodePosByChairID(endChairID);
		let distance = Math.sqrt(Math.pow(startPos.x - endPos.x, 2) + Math.pow(startPos.y - endPos.y, 2));
		let dt = distance / speed;

		let callFunc = cc.callFunc(() => {
			AssetsManager.playEffect({
				path: 'res/audio/main/xiazhu',
				bundle: Enums.bundleType.SDB
			});
		});
		for (let i = 0; i < 10; ++i) {
			let icon = cc.find('icon', this.scoreNode);
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
			data.user = SDBModel.getUserByChairID(this.getChairID());
			CCUtil.gameChat(data, label, this.headSprite.node, this.node)
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});