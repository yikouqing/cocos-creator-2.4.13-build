const SZModel = require('./SZModel');
const ApiSz = require('./ApiSz');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');

cc.Class({
	extends: cc.Component,
	properties: {
		label: cc.Label,
		areaNode: cc.Node,
	},

	onLoad() {
		this.pourNodeArray = [];
		this.node.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
	},

	gameInit() {
		this.pourNodeArray = this.pourNodeArray || [];
		if (this.pourNodeArray.length > 0) {
			let pourNodeArray = this.pourNodeArray;
			for (let node of pourNodeArray) {
				node.destroy();
			}
			this.pourNodeArray = [];
		}
		if (SZModel.getGameStatus() == ApiSz.gameStatus.POUR_SCORE ||
			SZModel.getGameStatus() == ApiSz.gameStatus.RESULT) {
			this.node.active = true;
			let num = 0;
			for (let scores of SZModel.getPourScores()) {
				if (scores) {
					for (let score of scores) {
						if (!SZModel.getResult()) {
							this.pourScores(null, score);
						}
						num += score;
					}
				}
			}
			this.label.string = Math.floor(num);
		} else {
			this.node.active = false;
		}
	},

	messageCallbackHandler(route, msg) {
		if (!SZModel.isGameInited(route, msg)) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiSz.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiSz.gameStatus.NONE) {
					this.label.string = '0';
				} else {
					this.node.active = true;
				}
			} else if (msg.type === ApiSz.GAME_POUR_SCORE_PUSH) {
				this.pourScores(msg.data.chairID, msg.data.score);
				this.label.string = Math.floor(msg.data.scores);
			} else if (msg.type === ApiSz.GAME_RESULT_PUSH) {
				this.winScores(msg.data.result.winners);
			}
		}
	},

	pourScores(chairID, score) {
		let array = [1, 2, 3, 4, 5, 10, 20];
		while (array.length > 0) {
			let item = array.pop();
			while (score >= item) {
				score -= item;
				this.pourScore(chairID, item);
			}
		}
	},

	pourScore(chairID, score) {
		let url = 'res/sprite/' + score;
		let node = new cc.Node();
		let sprite = node.addComponent(cc.Sprite);
		let audioUrl = score >= 10 ? 'downzhuan' : 'down_coin';
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: sprite,
			bundle: Enums.bundleType.SZ
		});
		node.parent = this.areaNode;
		this.pourNodeArray = this.pourNodeArray || [];
		this.pourNodeArray.push(node);
		node.angle = Utils.getRandomNum(-30, 30)
		if (chairID == null) {
			node.setScale(0.25);
			node.setPosition(this.getRandomPos());
		} else {
			let headNode = this.node.parent.getComponent('SZMainDialog').getHeadNodeByChairID(chairID);
			if (!!cc.isValid(headNode)) {
				node.setPosition(headNode.getPosition());
			} else {
				node.setPosition(cc.v2(0, 0));
			}
			let pos = this.getRandomPos();
			node.stopAllActions();
			node.setScale(0.35);
			cc.tween(node)
				.delay(0.2)
				.to(0.25, {
					position: pos,
					scale: 0.25
				})
				.call(() => {
					AssetsManager.playEffect({
						path: `audio/common/${audioUrl}`
					});
				})
				.start();
		}
	},

	winScores(chairIDs) {
		let posList = [];
		for (let chairID of chairIDs) {
			let headNode = this.node.parent.getComponent('SZMainDialog').getHeadNodeByChairID(chairID);
			let pos = headNode.getPosition();
			posList.push(pos);
		}
		let i = 0;
		for (let node of this.pourNodeArray) {
			let pos = posList[i % posList.length];
			++i;
			cc.tween(node)
				.to(0.25, {
					position: cc.v3(pos)
				})
				.removeSelf()
				.start();
		}
		this.scheduleOnce(() => {
			AssetsManager.playEffect({
				path: 'audio/common/shoujin'
			});
		}, 0.25);
		this.pourNodeArray = [];
	},

	getRandomPos() {
		let areaSize = this.areaNode.getContentSize();
		let xRandom = (Math.random() * (areaSize.width / 2)) * Math.pow(-1, Math.floor(Math.random() * 3));
		let yRandom = (Math.random() * (areaSize.height / 2)) * Math.pow(-1, Math.floor(Math.random() * 3));
		return cc.v2(xRandom, yRandom);
	},

	onDestroy() {
		// console.log('测试-移除监听')
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});