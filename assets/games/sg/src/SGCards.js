const SGModel = require('./SGModel');
const ApiSg = require('./ApiSg');
const SGLogic = require('./SGLogic');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');

cc.Class({
	extends: cc.Component,
	properties: {},

	onLoad() {
		this.cardsNode = cc.find('cards', this.node);
		this.cardTypeNode = cc.find('typebg', this.node);
		this.cardsNodeArray = [];
		this.cardsNodePosArray = [];
		for (let i = 1; i <= 5; i += 2) {
			let node = this.cardsNode.getChildByName('card' + i);
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
		if (SGModel.getMyChairID() >= SGModel.getChairCount()) {
			return this.index;
		} else {
			return (SGModel.getMyChairID() + this.index) % SGModel.getChairCount();
		}
	},

	gameInit() {
		if (typeof (this.index) != 'number') {
			return;
		}
		let cards = SGModel.getHandCardsByChairID(this.getChairID());
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
			if (canShowType && SGModel.getShowCards(this.getChairID())) {
				this.showType();
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
				if (this.node.active && msg.data.chairID == SGModel.getMyChairID()) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiSg.GAME_SHOW_CARDS_PUSH) {
				if (this.getChairID() == msg.data.chairID) {
					if (msg.data.cuopai) {
						this.showTwoCards();
					} else {
						this.showType(true);
						this.sendCards();
					}
				}
			} else if (msg.type === ApiSg.GAME_SEND_CARDS_PUSH) {
				this.sendCards(true);
			} else if (msg.type === ApiSg.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiSg.gameStatus.SEND_CARDS) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
				}
			} else if (msg.type === ApiSg.GAME_LOOK_CARDS_PUSH) {
				if (!msg.data.userArray || !Array.isArray(msg.data.userArray)) {
					// console.log("没有数据！")
					return
				}
				if (SGModel.getIsPlayingByChairID(this.getChairID())) {
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
		let cards = SGModel.getHandCardsByChairID(this.getChairID());
		if (!cards) {
			return;
		}
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
	},

	showTwoCards() {
		let cards = SGModel.getHandCardsByChairID(this.getChairID());
		if (!cards) {
			return;
		}
		for (let i = 0; i < this.cardsNodeArray.length - 1; ++i) {
			AssetsManager.loadSpriteFrame({
				path: 'sprite/cards/' + cards[i],
				sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
			});
		}
	},

	showType(animal) {
		let cards = SGModel.getHandCardsByChairID(this.getChairID());
		let user = SGModel.getUserByChairID(this.getChairID());
		let sex = user && user.userInfo && user.userInfo.sex == 0 ? "nan" : "nv";
		if (!cards) {
			return;
		}
		if (this.getChairID() != SGModel.getMyChairID()) {
			this.sendCards();
		}
		this.cardTypeNode.active = true;
		let type = SGLogic.getCardsType(cards);
		let url = 'res/sprite/';
		let audio = '';
		if (type == ApiSg.cardsType.BAOZI) {
			url += 'baozi';
			audio = `res/audio/${sex}px_baoZi`;
		} else if (type == ApiSg.cardsType.SANGONG) {
			url += 'sangong';
			audio = `res/audio/${sex}px_sanGong`;
		} else {
			let gong = SGLogic.getGongCount(cards);
			let num = 0;
			for (let card of cards) {
				num = (num + SGLogic.getCardValue(card)) % 10;
			}
			url += ['', 'dangong', 'shuanggong'][gong];
			url += ['lingdian', 'yidian', 'erdian', 'sandian', 'sidian', 'wudian', 'liudian', 'qidian', 'badian', 'jiudian'][num];
			audio = `res/audio/${sex}/px_` + num;
		}
		let typeNode = this.cardTypeNode.getChildByName('type');
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: typeNode.getComponent(cc.Sprite),
			bundle: Enums.bundleType.SG
		}, () => {
			this.cardTypeNode.width = typeNode.width * typeNode.scaleX + (this.getChairID() == SGModel.getMyChairID() ? 50 : 25);
			this.cardTypeNode.height = typeNode.height * typeNode.scaleY;
		});
		/* this.scheduleOnce(() => {
			this.cardTypeNode.width = typeNode.width*typeNode.scaleX+(this.getChairID()==SGModel.getMyChairID()? 50:25);
		}, 0); */
		this.cardTypeNode.stopAllActions();
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
					bundle: Enums.bundleType.SG
				});
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