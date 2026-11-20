const SDBModel = require('./SDBModel');
const ApiSdb = require('./ApiSdb');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
	extends: cc.Component,
	properties: {},

	onLoad() {
		this.cardsNode = cc.find('cards', this.node);
		this.cardTypeNode = cc.find('typebg', this.node);
		this.cardsNodeArray = [];
		this.cardsNodePosArray = [];
		for (let i = 1; i <= 5; i++) {
			let node = this.cardsNode.getChildByName('card' + i);
			node.active = false
			this.cardsNodeArray.push(node);
			this.cardsNodePosArray.push(node.getPosition());
		}
		this.cardsNode.active = false;
		this.cardTypeNode.active = false;
		this.cardTypeNodePos = this.cardTypeNode.getPosition();
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		MessageCallback.addListener('UpdateGameCardBg', this);
		this.node.active = false;
	},

	setIndex(index) {
		this.index = index;
	},

	getChairID() {
		if (SDBModel.getMyChairID() >= SDBModel.getChairCount()) {
			return this.index;
		} else {
			return (SDBModel.getMyChairID() + this.index) % SDBModel.getChairCount();
		}
	},

	gameInit() {
		if (typeof (this.index) != 'number') return;
		let state = SDBModel.getGameStatus();
		this.node.active = false;
		this.cardsNodeArray.forEach(card => {
			card.active = false
		})
		if (state === ApiSdb.gameStatus.ROB_BANK || state === ApiSdb.gameStatus.POUR_SCORE) {
			this.showOneCardBack()
		} else if (state > ApiSdb.gameStatus.POUR_SCORE) {
			let cards = SDBModel.getHandCardsByChairID(this.getChairID());
			this.cardsNode.active = false;
			this.cardTypeNode.active = false;
			if (cards) {
				for (let i = 0; i < this.cardsNodeArray.length; ++i) {
					this.cardsNodeArray[i].setPosition(this.cardsNodePosArray[i]);
					this.cardsNodeArray[i].setScale(1);
				}
				this.node.active = true;
				this.sendCards();
			}
		}
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairID == this.getChairID()) {
					this.node.active = false;
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
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				if (this.node.active && msg.data.chairID == SDBModel.getMyChairID()) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
					this.cardsNodeArray.forEach(card => {
						card.active = false
					});
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiSdb.GAME_SEND_CARDS_PUSH) {
				this.sendCards();
			} else if (msg.type === ApiSdb.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiSdb.gameStatus.SEND_CARDS) {
					this.cardsNode.active = true;
					this.cardTypeNode.active = false;
				} else if (msg.data.gameStatus === ApiSdb.gameStatus.ROB_BANK || msg.data.gameStatus === ApiSdb.gameStatus.POUR_SCORE) {
					this.showOneCardBack()
				} else if (msg.data.gameStatus == ApiSdb.gameStatus.NONE) {
					this.unscheduleAllCallbacks();
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
					this.cardsNodeArray.forEach(card => {
						card.active = false
					})
				}
			} else if (msg.type === ApiSdb.GAME_USER_OPERATE_PUSH) {
				this.showOperateCard(msg.data)
			} else if (msg.type === ApiSdb.GAME_RESULT_PUSH) {
				const type = msg.data.result.userCardType[this.getChairID()];
				this.showType(type, true)
				this.sendCards()
			} else if (msg.type === ApiSdb.GAME_LOOK_CARDS_PUSH) {
				this.scheduleOnce(() => {
					this.sendCards()
				}, 1)
			}
		} else if (route === 'UpdateGameCardBg') {
			this.updateGameCardBg();
		}
	},

	showOneCardBack() {
		let card_node = this.cardsNodeArray[0];
		if (card_node.active || !SDBModel.getIsPlayingByChairID(this.getChairID())) { //已经发过了或者座位上没人
			return
		}
		this.node.active = true
		this.cardsNode.active = true;
		card_node.active = true;
		let node_pos = this.node.getPosition();
		AssetsManager.loadSpriteFrame({
			path: ConfigModel.getCardUrl(),
			sprite: card_node.getComponent(cc.Sprite)
		});
		let card_node_pos = card_node.getPosition();
		card_node.setPosition(cc.v2(
			card_node_pos.x - node_pos.x,
			card_node_pos.y - node_pos.y
		));
		cc.tween(card_node).to(0.2, {
			position: this.cardsNodePosArray[0],
			scale: 1
		}).call(() => {
			AssetsManager.playEffect({
				path: 'audio/common/foldpai'
			});
		}).start()
	},

	/**
	 * 展示要的牌
	 * @param {*} data 
	 */
	showOperateCard(data) {
		if (!SDBModel.getIsPlayingByChairID(this.getChairID()) || data.chairID !== this.getChairID()) {
			return
		}
		let user = SDBModel.getUserByChairID(this.getChairID())
		let sex = "nv"
		if (user && user.userInfo.sex == 0) {
			sex = "nan"
		}
		if (data.operateInfo.operateType === ApiSdb.operateType.PULL) {
			for (let i = 1; i < this.cardsNodeArray.length; i++) {
				const card = this.cardsNodeArray[i];
				if (!card.active) {
					card.setPosition(this.cardsNodePosArray[i])
					let url = 'sprite/cards/' + data.operateInfo.pullCard;
					this.cardFlipAni(card, url)
					break
				}
			}

			AssetsManager.playEffect({
				path: `res/audio/${sex}/yao`,
				bundle: Enums.bundleType.SDB
			})
		} else if (data.operateInfo.operateType === ApiSdb.operateType.CANCEL) {
			AssetsManager.playEffect({
				path: `res/audio/${sex}/buyao`,
				bundle: Enums.bundleType.SDB
			})

		}

		/**爆牌了 */
		if (data.operateInfo.isBoom && this.getChairID() === SDBModel.getMyChairID()) {
			this.showType(ApiSdb.cardType.BAOPAI, true)
		}
	},

	/**
	 * 翻牌动画
	 * @param {cc.Node} card 
	 * @param {string} url 
	 */
	cardFlipAni(card, url) {
		AssetsManager.loadSpriteFrame({
			path: ConfigModel.getCardUrl(),
			sprite: card.getComponent(cc.Sprite)
		});
		card.stopAllActions();
		card.setScale(1);
		card.active = true;
		cc.tween(card).to(0.1, {
			scaleX: 0
		}).call(() => {
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: card.getComponent(cc.Sprite)
			});
		}).to(0.1, {
			scaleX: 1
		}).start()
	},

	updateGameCardBg() {
		for (let i = 0; i < this.cardsNodeArray.length; i++) {
			const card = this.cardsNodeArray[i];
			if (!card.getComponent(cc.Sprite).spriteFrame) continue;
			let name = card.getComponent(cc.Sprite).spriteFrame.name;
			let arr = name.split("_")
			if (arr[0] === "card" && arr[1] === "back") {
				AssetsManager.loadSpriteFrame({
					path: ConfigModel.getCardUrl(),
					sprite: card.getComponent(cc.Sprite)
				});
			}
		}
	},

	sendCards(animal) {
		let cards = SDBModel.getHandCardsByChairID(this.getChairID());
		if (!cards || !SDBModel.getIsPlayingByChairID(this.getChairID())) {
			return;
		}
		for (let i = 0; i < this.cardsNodeArray.length; ++i) {
			if (i >= cards.length) {
				this.cardsNodeArray[i].active = false
				continue
			}
			let url = 'sprite/cards/' + cards[i];
			if (cards[i] === 0) {
				url = ConfigModel.getCardUrl();
			}
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
			});
			this.cardsNodeArray[i].active = true
			this.cardsNodeArray[i].stopAllActions();
			this.cardsNodeArray[i].setPosition(this.cardsNodePosArray[i]);
			this.cardsNodeArray[i].scale = 1
		}
		this.cardsNode.active = true;
		this.node.active = true;
		if (animal) {
			let node_pos = this.node.getPosition();
			let audio_func = cc.callFunc(() => {
				AssetsManager.playEffect({
					path: 'audio/common/foldpai'
				});
			});
			for (let i = 0; i < this.cardsNodeArray.length; ++i) {
				if (!this.cardsNodeArray[i].active) {
					continue
				}
				let card_node = this.cardsNodeArray[i];
				let card_node_pos = card_node.getPosition();
				card_node.setPosition(cc.v2(
					card_node_pos.x - node_pos.x,
					card_node_pos.y - node_pos.y
				));
				card_node.setScale(0);
				card_node.runAction(cc.sequence(
					cc.delayTime(0.1 * i),
					cc.moveTo(0.2, this.cardsNodePosArray[i]),
					audio_func
				));
				card_node.runAction(cc.sequence(
					cc.delayTime(0.1 * i),
					cc.scaleTo(0.2, 1)
				));
			}
		}
	},

	showType(type, animal = false) {
		if (type <= 0) return;
		let idx = this.getChairID();
		let user = SDBModel.getUserByChairID(idx);
		if (!user) return;
		let sex = (user.userInfo.sex == 0) ? "nan/" : "nv/";
		let typeNode = this.cardTypeNode.getChildByName('type');
		let url = 'res/sprite/cardtype/' + type;
		let audio = `res/audio/${sex}type` + type;
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: typeNode.getComponent(cc.Sprite),
			bundle: Enums.bundleType.SDB
		});
		this.cardTypeNode.active = true;
		this.cardTypeNode.setPosition(this.cardTypeNodePos);
		if (animal) {
			let x = this.cardTypeNodePos.x;
			let y = this.cardTypeNodePos.y;
			let offx = (this.index == 0) ? 125 : 50;
			this.cardTypeNode.x = x + offx;
			this.cardTypeNode.stopAllActions();
			this.cardTypeNode.runAction(cc.moveTo(0.2, cc.v2(x, y)).easing(cc.easeIn(3.0)));
			if (audio.length > 0) {
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.SDB
				})
			}
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
		MessageCallback.removeListener('UpdateGameCardBg', this);
	},
});