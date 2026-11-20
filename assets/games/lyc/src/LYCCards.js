const LYCModel = require('./LYCModel');
const ApiLyc = require('./ApiLyc');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
cc.Class({
	extends: cc.Component,
	properties: {
		_mainComp: null,
		_laoAnim: null
	},

	onLoad() {
		this.cardsNode = cc.find('cards', this.node);
		this.cardTypeNode = cc.find('typebg', this.node);
		this.bipaiSprite = cc.find("bipai", this.node).getComponent(cc.Sprite)
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


	setIndex(index, mainComp) {
		this.index = index;
		this._mainComp = mainComp
	},


	getChairID() {
		if (LYCModel.getMyChairID() >= LYCModel.getChairCount()) {
			return this.index;
		} else {
			return (LYCModel.getMyChairID() + this.index) % LYCModel.getChairCount();
		}
	},

	gameInit() {
		// console.log("调用了初始化====", this.node.name)
		if (cc.isValid(this._laoAnim)) {
			this._laoAnim.destroy()
		}
		if (typeof (this.index) != 'number') {
			return;
		}
		this.bipaiSprite.node.active = false
		let cards = LYCModel.getHandCardsByChairID(this.getChairID());
		this.cardsNode.active = false;
		this.cardTypeNode.active = false;

		let isSetCard = false
		let tohandCards = this._tohandCards
		let compareOperateArray = this._compareOperateArray
		if (tohandCards && compareOperateArray && tohandCards.length > 0 && compareOperateArray.length > 0) {
			let banker = LYCModel.getBankerChairID()
			for (let i = 0; i < compareOperateArray.length; i++) {
				const h = tohandCards[i];
				const c = compareOperateArray[i]

				if (c != 1 && h && h.length > 0 && i != banker) {
					let data = {
						fromChairID: banker,
						toChairID: i,
						winChairID: (c == 3 || c == 4) ? i : banker,
						toHandCards: h
					}
					let tmp = this.onCompareCard(data)
					if (!isSetCard) {
						isSetCard = tmp
					}
				}
			}
		}

		if (cards && !isSetCard) {
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
			if (canShowType && LYCModel.getShowCards(this.getChairID())) {
				this.showType();
			}
		}
	},

	messageCallbackHandler(route, msg) {
		if (!LYCModel.getGameInited()) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this._tohandCards = msg.data.gameData.tohandCards
				this._compareOperateArray = msg.data.gameData.compareOperateArray
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairID == this.getChairID()) {
					this.node.active = false;
				}
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				// if (msg.data.roomUserInfo.chairID == this.getChairID()) {
				// 	this.gameInit();
				// }
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID == this.getChairID()) {
					this.node.active = false;
				}
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) return;
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				if (this.node.active && msg.data.chairID == LYCModel.getMyChairID()) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiLyc.GAME_SEND_CARDS_PUSH) {
				this.bipaiSprite.node.active = false
				this.sendCards(true);
			} else if (msg.type === ApiLyc.GAME_STATUS_PUSH) {
				this.bipaiSprite.node.active = false
				if (msg.data.gameStatus <= ApiLyc.gameStatus.SEND_CARDS) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
				}
			} else if (msg.type === ApiLyc.GAME_USER_OPERATE_PUSH) {
				this.showOperateCard(msg.data)
			} else if (msg.type === ApiLyc.GAME_RESULT_PUSH) {
				this.showType(msg.data.result, true)
				this.sendCards()
			} else if (msg.type === ApiLyc.GAME_LOOK_CARDS_PUSH) {
				this.scheduleOnce(() => {
					this.sendCards()
				}, 1)
			} else if (msg.type === ApiLyc.GAME_COMPARE_PUSH) {
				this.onCompareCard(msg.data)
			}
		} else if (route === 'UpdateGameCardBg') {
			this.updateGameCardBg();
		}
	},

	onCompareCard(data) {
		let selfChairId = this.getChairID()
		let banker = LYCModel.getBankerChairID()
		let isSetCard = false
		if (!LYCModel.getIsPlayingByChairID(selfChairId)) {
			return isSetCard
		}
		/**庄家的牌其他人看不到 */
		// if (selfChairId == LYCModel.getMyChairID() || LYCModel.getMyChairID() == banker) {
		// 	if (selfChairId != banker && selfChairId == data.toChairID) {
		// 		console.log("显示输赢===", selfChairId, banker)
		// 		let url = ""
		// 		if (selfChairId == data.winChairID) {
		// 			url = "res/sprite/compare/win"
		// 		} else if (selfChairId == data.toChairID) {
		// 			url = "res/sprite/compare/lose"
		// 		}
		// 		if (data.compareOperateArray && data.compareOperateArray[data.winChairID] == 4) {
		// 			url = "res/sprite/compare/ping"
		// 		}
		// 		if (url != "") {
		// 			AssetsManager.loadSpriteFrame({
		// 				path: url,
		// 				sprite: this.bipaiSprite,
		// 				bundle: Enums.bundleType.LYC
		// 			});
		// 			this.bipaiSprite.node.active = true
		// 		}
		// 	}
		// }
		if (selfChairId == data.toChairID) { //显示牌
			if (selfChairId != banker) {
				// console.log("显示输赢===", selfChairId, banker)
				let url = ""
				if (selfChairId == data.winChairID) {
					url = "res/sprite/compare/win"
				} else if (selfChairId == data.toChairID) {
					url = "res/sprite/compare/lose"
				}
				if (data.compareOperateArray && data.compareOperateArray[data.winChairID] == 4) {
					url = "res/sprite/compare/ping"
				}
				if (url != "") {
					AssetsManager.loadSpriteFrame({
						path: url,
						sprite: this.bipaiSprite,
						bundle: Enums.bundleType.LYC
					});
					this.bipaiSprite.node.active = true
				}
			}
			let cards = data.toHandCards
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
				this.cardsNodeArray[i].stopAllActions();
				this.cardsNodeArray[i].setPosition(this.cardsNodePosArray[i]);
			}
			this.cardsNode.active = true;
			this.node.active = true;
			isSetCard = true
		}
		return isSetCard
	},

	/**
	 * 展示捞牌和炸开牌
	 * @param {*} data 
	 */
	showOperateCard(data) {
		if (!LYCModel.getIsPlayingByChairID(this.getChairID()) || data.chairID !== this.getChairID()) {
			return
		}
		if (data.operateInfo.operateType === ApiLyc.operateType.PULL) {
			if (cc.isValid(this._laoAnim)) this._laoAnim.destroy();
			let cards = cc.find('cards', this.node)
			let aniNode = cc.instantiate(this._mainComp.animPre)
			let aniCom = aniNode.getComponent("LYClao")
			let cardId = ConfigModel.getCardBackId(Enums.cardStyleType.POKER)
			aniNode.y = -30;
			this._mainComp.node.addChild(aniNode);
			aniCom.showAnimation(cardId)
			if (aniCom) {
				aniCom.show((node) => {
					let showPos = CCUtil.postionConvert(node, cards)
					card.stopAllActions()
					card.setPosition(showPos)
					// card.setPosition(this.cardsNodePosArray[2]);
					let url = 'sprite/cards/' + data.operateInfo.pullCard;
					this.cardFlipAni(card, url, this.cardsNodePosArray[2])
				})
				let card = this.cardsNodeArray[2]
				AssetsManager.loadSpriteFrame({
					path: ConfigModel.getCardUrl(),
					sprite: card.getComponent(cc.Sprite)
				});
				card.stopAllActions();
				card.setScale(1);
			}

			this._laoAnim = aniNode;
		} else if (data.operateInfo.operateType === ApiLyc.operateType.BOOM) {
			/**展示炸开的牌 */
			if (this.node.name === "Cards1") {
				return
			}
			let list = data.operateInfo.boomCards
			for (let i = 0; i < list.length; i++) {
				const value = list[i];
				let card = this.cardsNodeArray[i]
				card.setPosition(this.cardsNodePosArray[i]);
				if (value == 0) continue;
				let url = 'sprite/cards/' + value
				this.cardFlipAni(card, url)
			}
		}
	},

	/**
	 * 翻牌动画
	 * @param {cc.Node} card 
	 * @param {string} url 
	 */
	cardFlipAni(card, url, pos) {
		AssetsManager.loadSpriteFrame({
			path: ConfigModel.getCardUrl(),
			sprite: card.getComponent(cc.Sprite)
		});
		card.stopAllActions();
		card.setScale(1);
		card.active = true;
		if (pos) {
			// console.log('捞腌菜--牌面-老牌', url)
			cc.tween(card).to(0.1, {
				scaleX: 0
			}).call(() => {
				AssetsManager.loadSpriteFrame({
					path: url,
					sprite: card.getComponent(cc.Sprite)
				});
			}).to(0.1, {
				scaleX: 1
			}).to(0.1, {
				position: pos
			}).start()
		} else {
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
		}
	},

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
		let cards = LYCModel.getHandCardsByChairID(this.getChairID());
		if (!cards || !LYCModel.getIsPlayingByChairID(this.getChairID())) {
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
			this.cardsNodeArray[i].stopAllActions();
			this.cardsNodeArray[i].setPosition(this.cardsNodePosArray[i]);
		}
		this.cardsNode.active = true;
		this.node.active = true;
		if (animal) {
			let node_pos = this.node.getPosition();
			let audio_func = cc.callFunc(() => {
				AssetsManager.playEffect({
					path: 'res/audio/main/foldpai',
					bundle: Enums.bundleType.LYC
				});
			});
			for (let i = 0; i < this.cardsNodeArray.length; ++i) {
				if (!this.cardsNodeArray[i].active) continue;
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

	showType(data, animal = false) {
		// userCards,
		// userRate,
		// userCardType,
		let idx = this.getChairID()
		let user = LYCModel.getUserByChairID(idx);
		if (!user) {
			return
		}
		const type = data.userCardType[idx];
		const rate = data.userRate[idx]
		if (type === -1) {
			return
		}
		let sex = (user.userInfo.sex == 0) ? "nan/" : "nv/";
		let typeNode = this.cardTypeNode.getChildByName('type');
		this.cardTypeNode.getChildByName("txt_rate").getComponent(cc.Label).string = "x" + rate
		let url = 'res/sprite/cardtype/' + type;
		let audio = `res/audio/${sex}px_` + type;
		AssetsManager.loadSpriteFrame({
			bundle: Enums.bundleType.LYC,
			path: url,
			sprite: typeNode.getComponent(cc.Sprite)
		}, () => {
			this.cardTypeNode.width = typeNode.width * typeNode.scaleX + (this.getChairID() == LYCModel.getMyChairID() ? 50 : 25);
			this.cardTypeNode.height = typeNode.height * typeNode.scaleY;
		});
		this.cardTypeNode.active = true;
		this.cardTypeNode.setPosition(this.cardTypeNodePos);
		// console.log('捞腌菜-报牌', audio, animal);
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
					bundle: Enums.bundleType.LYC
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