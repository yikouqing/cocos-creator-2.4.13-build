const SGBJHModel = require('./SGBJHModel');
const ApiSgbjh = require('./ApiSgbjh');
const ConfigModel = require('../../../src/model/ConfigModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
	extends: cc.Component,
	properties: {
		ctPfb: cc.Prefab,
	},

	onLoad() {
		this.cardsNode = cc.find('cards', this.node);
		// this.cardTypeNode = cc.find('typebg', this.node);
		this.cardsNodeArray = [];
		this.cardsNodePosArray = [];
		for (let i = 1; i <= 5; i += 2) {
			let node = this.cardsNode.getChildByName('card' + i);
			this.cardsNodeArray.push(node);
			this.cardsNodePosArray.push(node.getPosition());
		}
		this.cardsNode.active = false;
		// this.cardTypeNode.active = false;
		// this.cardTypeNodePos = this.cardTypeNode.getPosition();

		this.cardTypeCom = null //展示牌型和分数的脚本
		let n = cc.instantiate(this.ctPfb)
		n.parent = cc.find("cardType", this.node)
		n.scale = this.node.name === "Cards1" ? 0.7 : 0.3
		this.cardTypeCom = n.getComponent('SGBJHCardType')
		this.cardTypeCom.init()
		this.ghostCards = [78, 79]
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
		if (SGBJHModel.getMyChairID() >= SGBJHModel.getChairCount()) {
			return this.index;
		} else {
			return (SGBJHModel.getMyChairID() + this.index) % SGBJHModel.getChairCount();
		}
	},

	gameInit() {
		if (typeof (this.index) != 'number') return;
		let cards = SGBJHModel.getHandCardsByChairID(this.getChairID());
		this.cardsNode.active = false;
		this.cardTypeCom && this.cardTypeCom.hideSelf();
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
			if (canShowType && SGBJHModel.getShowCards(this.getChairID())) {
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
				if (this.node.active && msg.data.chairID == SGBJHModel.getMyChairID()) {
					this.cardsNode.active = false;
					this.cardTypeCom && this.cardTypeCom.hideSelf();
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiSgbjh.GAME_SHOW_CARDS_PUSH) {
				if (this.getChairID() == msg.data.chairID) {
					if (msg.data.cuopai) {
						this.showTwoCards();
					} else {
						if (msg.data.plusInfo) {
							// console.log("展示牌型")
							let p = msg.data.plusInfo;
							let types = [p.sanGongType, p.jinHuaType]
							this.cardTypeCom.showCardType(types, p.sanGongPoint, this.getChairID(), true)
						}
						this.showResCards(msg.data)
					}
				}
			} else if (msg.type === ApiSgbjh.GAME_SEND_CARDS_PUSH) {
				this.sendCards(true);
			} else if (msg.type === ApiSgbjh.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiSgbjh.gameStatus.SEND_CARDS) {
					this.cardsNode.active = false;
					this.cardTypeCom && this.cardTypeCom.hideSelf();
				}
			} else if (msg.type === ApiSgbjh.GAME_RESULT_PUSH) {
				let chairId = this.getChairID()
				if (SGBJHModel.getIsPlayingByChairID(chairId)) {
					// console.log("展示牌型分数")
					let scores = [msg.data.result.sgWinScores[chairId], msg.data.result.jhWinScores[chairId]]
					this.cardTypeCom.showScore(scores, true)
				}
			} else if (msg.type === ApiSgbjh.GAME_LOOK_CARDS_PUSH) {
				if (SGBJHModel.getIsPlayingByChairID(this.getChairID())) {
					this.scheduleOnce(() => {
						this.showResCards({
							cards: msg.data.userArray[this.getChairID()]
						})
					}, 1)
				}
			}
		} else if (route === 'UpdateGameCardBg') {
			this.updateGameCardBg();
		}
	},

	/**显示结算牌 */
	showResCards(data) {
		// let plusInfo = {
		// 	sanGongType,
		// 	sanGongPoint,
		// 	jinHuaType,
		// 	joker,
		// 	replaceCard
		// }
		let plusInfo = data.plusInfo
		let cards = data.cards.slice()
		this.hideGhostIcon()
		for (let i = 0; i < this.cardsNodeArray.length; ++i) {
			let url = 'sprite/cards/' + cards[i];
			if (cards[i] == 0) {
				url = ConfigModel.getCardUrl();
			}
			if (plusInfo && cards[i] === plusInfo.joker &&
				plusInfo.replaceCard !== null) {
				url = 'sprite/cards/' + plusInfo.replaceCard
				this.showGhostIcon(this.cardsNodeArray[i])
			}
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
			});
			this.cardsNodeArray[i].stopAllActions();
			this.cardsNodeArray[i].setPosition(this.cardsNodePosArray[i]);
		}
	},

	/**更新牌背 */
	updateGameCardBg() {
		for (let i = 0; i < this.cardsNodeArray.length; i++) {
			const card = this.cardsNodeArray[i];
			if (!card.getComponent(cc.Sprite).spriteFrame) continue;
			let name = card.getComponent(cc.Sprite).spriteFrame.name
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
		let cards = SGBJHModel.getHandCardsByChairID(this.getChairID());
		if (!cards) {
			return;
		}
		this.hideGhostIcon()
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
			if (this.ghostCards.includes(cards[i])) {
				this.showGhostIcon(this.cardsNodeArray[i])
			}
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
		let cards = SGBJHModel.getHandCardsByChairID(this.getChairID());
		if (!cards) {
			return;
		}
		this.hideGhostIcon()
		for (let i = 0; i < this.cardsNodeArray.length - 1; ++i) {
			AssetsManager.loadSpriteFrame({
				path: 'sprite/cards/' + cards[i],
				sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
			});
			if (this.ghostCards.includes(cards[i])) {
				this.showGhostIcon(this.cardsNodeArray[i])
			}
		}
	},

	showType(animal) { },

	/**展示癞子标志 */
	showGhostIcon(cardNode) {
		// console.trace("展示癞子标志")
		let gameRule = SGBJHModel.getGameRule();
		if (gameRule.haveJoker === false) {
			return
		}
		let node = cardNode.getChildByName("laizi")
		if (cc.isValid(node)) {
			node.active = true
			return
		}
		/**在牌上显示癞子标志 */
		let laizi = new cc.Node("laizi")
		laizi.name = "laizi"
		laizi.width = 59
		laizi.height = 59
		laizi.zIndex = 100
		let sp = laizi.addComponent(cc.Sprite)
		AssetsManager.loadSpriteFrame({
			path: "res/sprite/main/laizi",
			sprite: sp,
			bundle: Enums.bundleType.SGBJH
		});
		laizi.x = -40
		laizi.y = 4
		if (this.node.name != "Cards1") {
			laizi.scale = 0.4
			laizi.x = -15
		}
		laizi.parent = cardNode
		// console.log("展示癞子牌====", laizi, this.node.name)
	},

	/**隐藏癞子标志 */
	hideGhostIcon() {
		// console.trace("隐藏癞子")
		for (let i = 0; i < this.cardsNodeArray.length; i++) {
			let laiziNode = this.cardsNodeArray[i].getChildByName("laizi")
			if (cc.isValid(laiziNode)) {
				laiziNode.active = false
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