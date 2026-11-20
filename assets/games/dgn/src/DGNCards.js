const DGNModel = require('./DGNModel');
const ApiDgn = require('./ApiDgn');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ConfigModel = require('../../../src/model/ConfigModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const { Def_Dgn } = require('../../../src/const/Defines');

cc.Class({
	extends: cc.Component,
	properties: {},

	start() {
		this.cardsNode = cc.find('cards', this.node);
		this.cardTypeNode = cc.find('typebg', this.node);
		this.cardsNodeArray = [];
		this.cardsNodePosArray = [];
		for (let i = 1; i <= 5; ++i) {
			let node = this.cardsNode.getChildByName('card' + i);
			this.cardsNodeArray.push(node);
			this.cardsNodePosArray.push(node.getPosition());
		}
		this.cardTypeNodePos = this.cardTypeNode.getPosition();
		this.cardsNode.active = false;
		this.cardTypeNode.active = false;
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
		if (DGNModel.getMyChairID() >= DGNModel.getChairCount()) {
			return this.index;
		} else {
			return (DGNModel.getMyChairID() + this.index) % DGNModel.getChairCount();
		}
	},

	/**设置成灰色 */
	setNodeGray(node, isGray) {
		if (!cc.isValid(node)) return
		const c = isGray ? cc.color(190, 190, 190, 255) : cc.color(255, 255, 255, 255)
		if (c !== node.color) {
			node.color = c
		}
	},

	gameInit() {
		if (typeof (this.index) != 'number') return;
		let cards = DGNModel.getHandCardsByChairID(this.getChairID());
		this.cardsNode.active = false;
		this.cardTypeNode.active = false;
		if (cards) {
			this.node.active = true;
			for (let i = 0; i < this.cardsNodeArray.length; ++i) {
				this.cardsNodeArray[i].setPosition(this.cardsNodePosArray[i]);
				this.cardsNodeArray[i].setScale(1);
			}
			this.sendCards();
			if (DGNModel.getShowCards(this.getChairID())) {
				this.showType();
				this.showMask();
			}
		}
	},

	messageCallbackHandler(route, msg) {
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
				if (msg.data.roomUserInfo.chairID == this.getChairID()) {
					this.node.active = false;
				}
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) return;
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				if (msg.data.chairID == DGNModel.getMyChairID()) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
					for (let i = 1; i <= 5; ++i) {
						this.setNodeGray(this.cardsNodeArray[i], false)
					}
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiDgn.SHOW_CARDS_PUSH) {
				// console.log('亮牌-推送1', this.getChairID(), msg.data.chairID, this.node.active)
				if (this.getChairID() == msg.data.chairID) {
					// console.log('亮牌-推送', this.getChairID(), msg.data.chairID, this.node.active)
					this.sendCards();
					this.showType(true);
				}
			} else if (msg.type === ApiDgn.CARDS_PUSH) {
				if (msg.data.animal != null) {
					this.sendCards(msg.data.animal);
				} else {
					this.sendCards(true);
				}
			} else if (msg.type === ApiDgn.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiDgn.gameStatus.SEND_CARDS) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
					for (let i = 1; i <= 5; ++i) {
						this.setNodeGray(this.cardsNodeArray[i], false)
					}
				}
			} else if (msg.type === ApiDgn.GAME_LOOK_CARDS_PUSH) {
				if (!msg.data.userArray || !Array.isArray(msg.data.userArray)) {
					// console.log("没有数据！")
					return
				}
				if (DGNModel.getIsPlayingByChairID(this.getChairID())) {
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

	showFourCards() {
		let cards = DGNModel.getHandCardsByChairID(this.getChairID());
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

	showPreCards() {
		let cards = DGNModel.getHandCardsByChairID(this.getChairID());
		if (!cards) {
			return;
		}
		cards[cards.length - 1] = 0;
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
	},

	sendCards(animal) {
		let cards = DGNModel.getHandCardsByChairID(this.getChairID());
		if (!cards) {
			return;
		}
		if (!DGNModel.getShowCards(this.getChairID())) {
			if (this.getChairID() == DGNModel.getMyChairID()) {
				cards[4] = 0;
			} else {
				cards = [0, 0, 0, 0, 0];
			}
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
			this.cardsNodeArray[i].setScale(1);
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

	showType(animal) {
		let cards = DGNModel.getHandCardsByChairID(this.getChairID());
		if (!cards) {
			return;
		}
		if (this.getChairID() != DGNModel.getMyChairID()) {
			this.sendCards();
		}
		this.showMask();
		this.cardTypeNode.active = true;
		let type = DGNModel.getDGNLogic().getCardsType(cards);
		let url = 'res/sprite/cardtype/';
		let audio = 'res/audio/woman/';
		if (type == Def_Dgn.cardsType.MEINIU) {
			url += 'wuniu';
			audio += 'f0_nn0';
		} else if (type == Def_Dgn.cardsType.YOUNIU) {
			let num = DGNModel.getDGNLogic().getNiuNumber(cards);
			url += ['wuniu', 'niu1', 'niu2', 'niu3', 'niu4', 'niu5', 'niu6', 'niu7', 'niu8', 'niu9', 'niuniu'][num];
			audio += ['f0_nn0', 'f0_nn1', 'f0_nn2', 'f0_nn3', 'f0_nn4', 'f0_nn5', 'f0_nn6', 'f0_nn7', 'f0_nn8', 'f0_nn9', 'f0_nn10'][num];
		} else if (type == Def_Dgn.cardsType.NIUNIU) {
			url += 'niuniu';
			audio += 'f0_nn10';
		} else if (type == Def_Dgn.cardsType.SHUNZINIU) {
			url += 'shunziniu';
			audio += 'f0_nn12';
		} else if (type == Def_Dgn.cardsType.YIDGNIU) {
			url += 'yinniu';
		} else if (type == Def_Dgn.cardsType.TONGHUANIU) {
			url += 'tonghuaniu';
			audio += 'f0_nn14';
		} else if (type == Def_Dgn.cardsType.WUHUANIU) {
			url += 'wuhuaniu';
			audio += 'f0_nn13';
		} else if (type == Def_Dgn.cardsType.HULUNIU) {
			url += 'huluniu';
			audio += 'f0_nn15';
		} else if (type == Def_Dgn.cardsType.WUXIAONIU) {
			url += 'wuxiaoniu';
			audio += 'f0_nn17';
		} else if (type == Def_Dgn.cardsType.ZHADANNIU) {
			url += 'zhadanniu';
			audio += 'f0_nn16';
		} else if (type == Def_Dgn.cardsType.YITIAOLONG) {
			url += 'yitiaolong';
		} else if (type == Def_Dgn.cardsType.TONGHUASHUN) {
			url += 'tonghuashun';
		}
		let typeNode = this.cardTypeNode.getChildByName('type');
		AssetsManager.loadSpriteFrame({
			path: url,
			bundle: Enums.bundleType.DGN,
			sprite: typeNode.getComponent(cc.Sprite)
		});
		this.cardTypeNode.stopAllActions();
		this.cardTypeNode.setPosition(this.cardTypeNodePos);
		if (animal) {
			let offx = (this.index == 0) ? 125 : 50;
			this.cardTypeNode.x = this.cardTypeNode.x + offx;
			this.cardTypeNode.stopAllActions();
			this.cardTypeNode.runAction(cc.moveTo(0.2, this.cardTypeNodePos).easing(cc.easeIn(3.0)));
			let user = DGNModel.getUserByChairID(this.getChairID());
			if (user && user.userInfo.sex == 0) {
				audio = audio.replace(/woman/, "man");
				audio = audio.replace(/f0_nn/, "f1_nn");
			}
			AssetsManager.playEffect({
				path: audio,
				bundle: Enums.bundleType.DGN
			});
		}
	},

	showMask() {
		let cards = DGNModel.getHandCardsByChairID(this.getChairID());
		let hasMask = true;
		if (!cards) {
			hasMask = false;
		}
		for (let i = 0; i < cards.length; ++i) {
			if (cards[i] == 0) {
				hasMask = false;
			}
		}
		let type = DGNModel.getDGNLogic().getCardsType(cards);
		if (type != Def_Dgn.cardsType.YOUNIU && type != Def_Dgn.cardsType.NIUNIU) {
			hasMask = false;
		}
		if (hasMask) {
			for (let i = 0; i < cards.length; ++i) {
				for (let j = i + 1; j < cards.length; ++j) {
					for (let k = j + 1; k < cards.length; ++k) {
						if ((DGNModel.getDGNLogic().getCardValue(cards[i]) + DGNModel.getDGNLogic().getCardValue(cards[j]) + DGNModel.getDGNLogic().getCardValue(cards[k])) % 10 == 0) {
							this.setNodeGray(this.cardsNodeArray[i + 1], true)
							this.setNodeGray(this.cardsNodeArray[j + 1], true)
							this.setNodeGray(this.cardsNodeArray[k + 1], true)
							return;
						}
					}
				}
			}
		} else {
			for (let i = 1; i <= 5; ++i) {
				this.setNodeGray(this.cardsNodeArray[i], false)
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