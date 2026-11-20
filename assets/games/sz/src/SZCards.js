const SZModel = require('./SZModel');
const ApiSz = require('./ApiSz');
const SZLogic = require('./SZLogic');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
	extends: cc.Component,
	properties: {},

	onLoad() {
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		MessageCallback.addListener('UpdateGameCardBg', this);
		this.cardsNode = cc.find('cards', this.node);
		this.cardTypeNode = cc.find('typebg', this.node);
		this.cardTypeNode.active = false;
		if (this.cardTypeNode.getChildByName('type')) this.cardTypeSprite = this.cardTypeNode.getChildByName('type').getComponent(cc.Sprite);
		if (this.cardTypeSprite) this.cardTypeSprite.spriteFrame = null;
		this.stateNode = cc.find('state', this.node);
		this.cardsNode.active = false;
		this.stateNode.active = false;
		this.cardsNodeArray = [];
		this.cardsNodePosArray = [];
		for (let i = 1; i <= 5; i += 2) {
			let node = this.cardsNode.getChildByName('card' + i);
			this.cardsNodeArray.push(node);
			this.cardsNodePosArray.push(node.getPosition());
		}
		this.cardTypeNodePos = this.cardTypeNode.getPosition();
		this.node.active = false;
	},

	bind(index) {
		this.index = index;
	},

	getChairID() {
		if (SZModel.getMyChairID() >= SZModel.getChairCount()) {
			return this.index;
		} else {
			return (SZModel.getMyChairID() + this.index) % SZModel.getChairCount();
		}
	},

	gameInit() {
		// console.log("SZCards gameInit");
		if (typeof (this.index) != 'number') {
			return;
		}
		if (cc.find('anycall', this.node)) cc.find('anycall', this.node).active = false;
		let cards = SZModel.getHandCardsByChairID(this.getChairID());
		this.cardsNode.active = false;
		this.cardTypeNode.active = false;
		if (cards) {
			for (let i = 0; i < this.cardsNodeArray.length; ++i) {
				this.cardsNodeArray[i].setPosition(this.cardsNodePosArray[i]);
				this.cardsNodeArray[i].setScale(1);
			}
			this.node.active = true;
			this.sendCards();
			let canShowType = true;
			for (let i = 0; i < cards.length; ++i) {
				if (cards[i] == 0) {
					canShowType = false;
				}
			}
			if (canShowType) {
				this.showType();
			} else {
				if (this.getChairID() == SZModel.getMyChairID()) {
					let isAnyCallOp = SZModel.getAnyCallByChairID(SZModel.getMyChairID());
					if (cc.find('anycall', this.node)) cc.find('anycall', this.node).active = !!isAnyCallOp;
				}
			}
		}
		this.updateStateSprite();
	},

	updateStateSprite() {
		let userStatus = SZModel.getUserStatusByChairID(this.getChairID());
		if (userStatus == 0 || SZModel.getGameStatus() == ApiSz.gameStatus.RESULT) {
			this.stateNode.active = false;
			return;
		}
		this.stateNode.active = true;
		let url = 'res/sprite/';
		if (userStatus == ApiSz.userStatus.LOSE) {
			this.cardTypeNode.active = false;
			if (this.cardTypeSprite) this.cardTypeSprite.spriteFrame = null;
			url += 'bipaishibai';
		} else if (userStatus == ApiSz.userStatus.TIMEOUTABANDON ||
			userStatus == ApiSz.userStatus.ABANDON) {
			this.cardTypeNode.active = false;
			if (this.cardTypeSprite) this.cardTypeSprite.spriteFrame = null;
			url += 'yiqipai';
			this.showCardsColor(cc.Color.GRAY);
		} else if (userStatus == ApiSz.userStatus.LOOK) {
			url += 'yikanpai';
			if (this.getChairID() == SZModel.getMyChairID()) {
				this.stateNode.active = false;
			}
		}
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: this.stateNode.getComponent(cc.Sprite),
			bundle: Enums.bundleType.SZ
		});
	},

	showCardsColor(colorVal) {
		for (let i = 0; i < this.cardsNodeArray.length; ++i) {
			let curCards = this.cardsNodeArray[i];
			curCards.color = colorVal;
		}
	},

	messageCallbackHandler(route, msg) {
		if (!SZModel.isGameInited(route, msg)) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				/* if(msg.data.chairID == this.getChairID()) {
					this.node.active = false;
				} */
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID == this.getChairID()) {
					this.gameInit();
				}
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (this.getChairID() == SZModel.getMyChairID()) {
					if (cc.find('anycall', this.node)) cc.find('anycall', this.node).active = false;
				}
				if (msg.data.roomUserInfo.chairID == this.getChairID()) {
					this.node.active = false;
				}
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) return;
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				if (msg.data.chairID == SZModel.getMyChairID()) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
					if (cc.find('anycall', this.node)) cc.find('anycall', this.node).active = false;
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiSz.GAME_LOOK_PUSH) {
				let tmp = UserModel.getData("isTest")
				if (this.getChairID() == msg.data.chairID) {
					if (this.getChairID() == SZModel.getMyChairID()) {
						if (cc.find('anycall', this.node)) cc.find('anycall', this.node).active = false;
					}
					if (!msg.data.cuopai) {
						if (!tmp || this.node.name == "Cards1") {
							this.sendCards();
						}
						this.showType(true);
						this.updateStateSprite();
					}
					//  else {
					// 	this.showTwoCards();
					// }
				}
			} else if (msg.type === ApiSz.GAME_SEND_CARDS_PUSH) {
				if (this.getChairID() == SZModel.getMyChairID()) {
					if (cc.find('anycall', this.node)) cc.find('anycall', this.node).active = false;
				}
				this.sendCards(true);
			} else if (msg.type === ApiSz.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiSz.gameStatus.SEND_CARDS) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
				}
			} else if (msg.type === ApiSz.GAME_ABANDON_PUSH) {
				if (this.getChairID() == SZModel.getMyChairID() && msg.data.chairID == SZModel.getMyChairID()) {
					if (cc.find('anycall', this.node)) cc.find('anycall', this.node).active = false;
				}
				if (msg.data.chairID == this.getChairID()) {
					this.updateStateSprite();
				}
			} else if (msg.type === ApiSz.GAME_COMPARE_PUSH) {
				if (this.getChairID() == SZModel.getMyChairID()) {
					if (cc.find('anycall', this.node)) cc.find('anycall', this.node).active = false;
				}
				if (msg.data.loseChairID == this.getChairID()) {
					this.updateStateSprite();
				}
			} else if (msg.type === ApiSz.GAME_RESULT_PUSH) {
				if (this.getChairID() == SZModel.getMyChairID()) {
					if (cc.find('anycall', this.node)) cc.find('anycall', this.node).active = false;
				}
				this.sendCards();
				this.showType(true);
			} else if (msg.type === ApiSz.GAME_FOLLOW_THROUGH_PUSH) {
				if (this.getChairID() == SZModel.getMyChairID() &&
					msg.data.chairID == SZModel.getMyChairID()) {
					let isAnyCallOp = msg.data.followArr[msg.data.chairID];
					if (cc.find('anycall', this.node)) cc.find('anycall', this.node).active = !!isAnyCallOp;
				}
			} else if (msg.type === ApiSz.GAME_LOOK_CARDS_PUSH) {
				if (!msg.data.userArray || !Array.isArray(msg.data.userArray)) {
					// console.log("没有数据！")
					return
				}
				if (SZModel.getIsPlayingByChairID(this.getChairID())) {
					this.scheduleOnce(() => {
						this.showResCards({
							cards: msg.data.userArray[this.getChairID()]
						})
					}, 1)
				}
			}
		} else if (route === 'UpdateGameCardBg') {
			this.sendCards();
		}
	},

	/**显示结算牌 */
	showResCards(data) {
		if (!data.cards || !Array.isArray(data.cards)) {
			return
		}
		let cards = data.cards.slice()
		for (let i = 0; i < this.cardsNodeArray.length; ++i) {
			let url = 'sprite/cards/' + cards[i];
			if (cards[i] == 0) {
				url = ConfigModel.getCardUrl();
			}
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
			});
			this.cardsNodeArray[i].stopAllActions();
			this.cardsNodeArray[i].setPosition(this.cardsNodePosArray[i]);
		}
	},

	sendCards(animal) {
		let cards = SZModel.getHandCardsByChairID(this.getChairID());
		if (cards == null) return;
		for (let i = 0; i < this.cardsNodeArray.length; ++i) {
			let url = 'sprite/cards/' + cards[i];
			if (cards[i] == 0) {
				// console.trace("这是牌背==", i, this.node.name)
				url = ConfigModel.getCardUrl();
			}
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
			});
			this.cardsNodeArray[i].stopAllActions();
			this.cardsNodeArray[i].setPosition(this.cardsNodePosArray[i]);
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
		this.showCardsColor(cc.Color.WHITE);
	},

	showTwoCards() {
		let cards = SZModel.getHandCardsByChairID(this.getChairID());
		if (cards == null) {
			return;
		}
		for (let i = 0; i < this.cardsNodeArray.length - 1; ++i) {
			let url = 'sprite/cards/' + cards[i];
			if (parseInt(cards[i]) == 0) {
				url = ConfigModel.getCardUrl();
			}
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
			});
		}
	},

	showType(animal) {
		this.stateNode.active = false;
		let userStatus = SZModel.getUserStatusByChairID(this.getChairID());
		if (userStatus == ApiSz.userStatus.ABANDON ||
			userStatus == ApiSz.userStatus.LOSE ||
			userStatus == ApiSz.userStatus.TIMEOUTABANDON) return;
		let cards = SZModel.getHandCardsByChairID(this.getChairID());
		if (!cards || cards[0] + cards[1] + cards[2] == 0) return;
		this.cardTypeNode.active = true;
		let type = SZLogic.getCardsType(cards);
		let url = 'res/sprite/';
		let array = ['', 'danzhang', 'duizi', 'shunzi', 'jinhua', 'shunjin', 'baozi'];
		url += array[type];
		let audio = 'res/audio/woman/';
		let user = SZModel.getUserByChairID(this.getChairID());
		if (user && user.userInfo.sex == 0) {
			audio = audio.replace(/woman/, "man");
		}
		let audios = ['', '', 'paiType1', 'paiType2', 'paiType3', 'paiType4', 'paiType5'];
		if (this.cardTypeSprite) {
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.cardTypeSprite,
				bundle: Enums.bundleType.SZ
			});
		}
		this.cardTypeNode.stopAllActions();
		this.cardTypeNode.setPosition(this.cardTypeNodePos);
		if (animal) {
			let x = this.cardTypeNodePos.x;
			let y = this.cardTypeNodePos.y;
			let offx = (this.index == 0) ? 125 : 50;
			this.cardTypeNode.x = x + offx;
			this.cardTypeNode.stopAllActions();
			this.cardTypeNode.runAction(cc.moveTo(0.2, cc.v2(x, y)).easing(cc.easeIn(3.0)));
			if (audios[type].length > 0) {
				audio += audios[type];
				this.scheduleOnce(() => {
					AssetsManager.playEffect({
						path: audio,
						bundle: Enums.bundleType.SZ
					});
				}, 0.5);
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