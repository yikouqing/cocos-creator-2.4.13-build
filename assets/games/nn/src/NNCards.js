const NNModel = require('./NNModel');
const ApiNn = require('./ApiNn');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const { Def_Nn } = require('../../../src/const/Defines');

cc.Class({
	extends: cc.Component,
	properties: {
		_ruffianRecord: null,
		_cardUpY: 20,
	},

	start() {
		if (this.node.name !== "Cards1") {
			this._cardUpY = 10
		}
		this.cardsNode = cc.find('cards', this.node);
		this.cardTypeNode = cc.find('typebg', this.node);
		this.cardsNodeArray = [];
		this.cardsNodePosArray = [];
		/**手牌中是否有癞子 */
		this.hasLaizi = false
		for (let i = 1; i <= 5; ++i) {
			let node = this.cardsNode.getChildByName('card' + i);
			this.cardsNodeArray.push(node);
			this.cardsNodePosArray.push(node.getPosition());
			cc.find(`cards/card${i}/mask${i}`, this.node).active = false;
			cc.find(`cards/card${i}/index`, this.node).active = false;
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
		if (NNModel.getMyChairID() >= NNModel.getChairCount()) {
			return this.index;
		} else {
			return (NNModel.getMyChairID() + this.index) % NNModel.getChairCount();
		}
	},

	gameInit() {
		if (typeof (this.index) != 'number') return;
		let cards = NNModel.getHandCardsByChairID(this.getChairID());
		this.cardsNode.active = false;
		this.cardTypeNode.active = false;
		if (!cards) return
		for (let i = 0; i < this.cardsNodeArray.length; ++i) {
			this.cardsNodeArray[i].setPosition(this.cardsNodePosArray[i]);
			this.cardsNodeArray[i].setScale(1);
		}
		this.node.active = true;
		this.sendCards();
		let gameStatus = NNModel.getGameStatus();
		let canShowType = cards.indexOf(0) != -1; //如果手牌中有0元素则不显示牌型
		if (canShowType &&
			NNModel.getShowCards(this.getChairID()) &&
			(NNModel.isInSeat() ||
				gameStatus == ApiNn.gameStatus.SHOW_CARDS ||
				gameStatus == ApiNn.gameStatus.RESULT)) {
			this.showType();
		}
		this.showMask();
	},

	messageCallbackHandler(route, msg) {
		if (!NNModel.getGameInited()) {
			return;
		}
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this._ruffianRecord = msg.data.gameData.ruffianRecord
				this.gameInit();
				let chairID = this.getChairID()
				this.hasLaizi = msg.data.gameData.Traderuffian[chairID]
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
				if (msg.data.chairID == NNModel.getMyChairID()) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
					for (let i = 1; i <= 5; ++i) {
						cc.find(`cards/card${i}/mask${i}`, this.node).active = false;
						cc.find(`cards/card${i}/index`, this.node).active = false;
					}
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiNn.GAME_SHOW_CARDS_PUSH) {
				// if (this.hasLaizi) return;
				if (this.getChairID() == msg.data.chairID) {
					// console.log("没有癞子正常结算=", msg)
					if (!msg.data.cuopai) {
						this.resRecord(-1);
						this.showType(true);
					} else {
						this.showFourCards();
					}
				}
			} else if (msg.type === ApiNn.GAME_SEND_CARDS_PUSH) {
				this._ruffianRecord = msg.data.ruffianRecord;
				let cards = NNModel.getHandCardsByChairID(NNModel.getMyChairID());
				this.sendCards(true);
			} else if (msg.type === ApiNn.GAME_TRADERUFFIAN_PUSH) {
				let chairID = this.getChairID()
				this.hasLaizi = msg.data.cards[chairID]
				// console.log("座位", chairID, "有没有癞子", this.hasLaizi, msg.data)
			} else if (msg.type === ApiNn.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiNn.gameStatus.SEND_CARDS) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
					for (let i = 1; i <= 5; ++i) {
						cc.find(`cards/card${i}/mask${i}`, this.node).active = false;
						cc.find(`cards/card${i}/index`, this.node).active = false;
					}
				}
			} else if (msg.type === ApiNn.GAME_RUFFIAN_RECORD_PUSH) {
				// chairID: chairID, 有癞子的结算
				// 	cards: cards,
				// 	record: record,
				if (this.getChairID() == msg.data.chairID) {
					{
						let ghost = msg.data.record
						// console.log("结算的癞子牌1=", ghost, msg.data)
						let logic = NNModel.getNNLogic()

						let tmpstr = ""
						let cardList = msg.data.cards
						for (let j = 0; j < cardList.length; j++) {
							const card = cardList[j];
							let num = logic.getCardNumber(card)
							tmpstr += `${num}(${card}),`
						}
						// console.log("位置", msg.data.chairID, "的结算手牌:", tmpstr, "，癞子：", `${logic.getCardNumber(ghost)}(${ghost})`)
					}
					if (!msg.data.cuopai) {
						this.resRecord(msg.data.record);
						this.showType(true);
					} else {
						this.showFourCards();
					}
				}
				this.hasLaizi = false;
			} else if (msg.type === ApiNn.GAME_END_POUR_SCORE_PUSH) { //下注结束显示第4和5张牌的牌背
				this.showHideCard()
			} else if (msg.type === ApiNn.GAME_LOOK_CARDS_PUSH) {

				this.scheduleOnce(() => {
					this.resRecord(this._ruffianRecord)
				}, 1)

			}
		} else if (route === 'UpdateGameCardBg') { //更新牌背
			this.updateGameCardBg()
		}
	},

	showHideCard() {
		let idx = 10
		for (let i = 0; i < this.cardsNodeArray.length; i++) {
			const card = this.cardsNodeArray[i];
			if (!card.active) {
				AssetsManager.loadSpriteFrame({
					path: ConfigModel.getCardUrl(),
					sprite: card.getComponent(cc.Sprite)
				});
				card.active = true;
				card.opacity = 0;
				cc.tween(card).delay(0.1 * idx).to(0.2, {
					position: this.cardsNodePosArray[i],
					scale: 1,
					opacity: 255
				}).call(() => {
					AssetsManager.playEffect({
						path: 'audio/common/foldpai'
					});
				}).start()
				idx++
			}
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

	showFourCards() {
		let cards = NNModel.getHandCardsByChairID(this.getChairID());
		let logic = NNModel.getNNLogic()
		if (!cards) return;
		for (let i = 0; i < this.cardsNodeArray.length - 1; ++i) {
			AssetsManager.loadSpriteFrame({
				path: 'sprite/cards/' + cards[i],
				sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
			});
			if (78 === cards[i] || 79 === cards[i] ||
				logic.getCardNumber(cards[i]) === logic.getCardNumber(this._ruffianRecord)) {
				this.showGhostIcon(this.cardsNodeArray[i])
			}
		}
	},

	/**隐藏癞子标志 */
	hideGhostIcon() {
		for (let i = 0; i < this.cardsNodeArray.length; i++) {
			let laiziNode = this.cardsNodeArray[i].getChildByName("laizi")
			if (cc.isValid(laiziNode)) {
				laiziNode.active = false
			}
		}
	},

	/**展示癞子标志 */
	showGhostIcon(cardNode) {
		let gameRule = NNModel.getGameRule();
		if (gameRule.ruffianType === ApiNn.ruffianType.WU) {
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
			path: "res/sprite/laizi",
			sprite: sp,
			bundle: Enums.bundleType.NN
		});
		laizi.x = -40
		laizi.y = 4
		if (this.node.name != "Cards1") {
			laizi.scale = 0.4
			laizi.x = -15
		}
		laizi.parent = cardNode
	},

	/**结算的时候更新手牌 */
	resRecord(ghost) {
		this.hideGhostIcon()
		let cards = NNModel.getHandCardsByChairID(this.getChairID());
		let ends = NNModel.getEndCardsByChairID(this.getChairID()).slice();
		let endCards = NNModel.getEndCardsByChairID(this.getChairID()).slice();
		// console.log("--结算", NNModel.getCurBureau(), "局--", ends, cards, this.node.name)
		if (!cards) return;
		this.cardsNode.active = true;
		this.node.active = true;
		for (let i = 0; i < this.cardsNodeArray.length; ++i) {
			const card = this.cardsNodeArray[i]
			let url = ConfigModel.getCardUrl(cards[i]);
			let pos = this.cardsNodePosArray[i]
			let eidx = ends.indexOf(cards[i])
			if (cards[i] != 0 && eidx != -1) {
				pos = cc.v2(this.cardsNodePosArray[i].x, this.cardsNodePosArray[i].y + this._cardUpY);
				ends.splice(eidx, 1);
			}
			if (!!endCards && endCards[1] == cards[i] && cards[i] != 0) {
				cc.find('index', card).active = true;
				cc.find('index/indexnum', card).getComponent(cc.Label).string = '5 F';
			} else {
				cc.find('index', card).active = false;
			}
			card.stopAllActions();
			card.setPosition(pos);
			card.opacity = 255;
			card.setScale(1);
			card.active = true;
			// console.log("结算时候更新了手牌==", this.getChairID(), ",i=", i,
			// 	card.active, card.x, card.y, card.scale, card.width, card.height)
			let sp = card.getComponent(cc.Sprite)
			let name = ""
			if (sp && sp.spriteFrame && sp.spriteFrame.name) {
				name = sp.spriteFrame.name
			}
			let arrName = name.split("_")
			if (this.node.name === "Cards1" && cards[i] !== 0 && arrName[0] === "card" && arrName[1] === "back") {
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
			} else {
				AssetsManager.loadSpriteFrame({
					path: url,
					sprite: card.getComponent(cc.Sprite)
				});
			}
			// console.log("结算时候更新了手牌==1", this.getChairID(), ",i=", i,
			// 	node.active, node.x, node.y, node.scale, node.width, node.height)
			if (cards[i] !== 0) {
				if (typeof (ghost) == "number" && cards[i] === ghost) {
					this.showGhostIcon(card)
				} else if (Array.isArray(ghost)) {
					for (let j = 0; j < ghost.length; j++) {
						const g = ghost[j];
						if (g == cards[i]) {
							this.showGhostIcon(card)
							break
						}
					}
				}
			}
		}
	},

	sendCards(animal) {
		this.hideGhostIcon()
		let gameStatus = NNModel.getGameStatus();
		let cards = NNModel.getHandCardsByChairID(this.getChairID());
		// console.log("手牌-手牌", cards);
		let ends = NNModel.getEndCardsByChairID(this.getChairID()).slice();
		let endCards = NNModel.getEndCardsByChairID(this.getChairID()).slice();
		// console.log("手牌-突出牌", ends);
		if (!cards) return;
		this.cardsNode.active = true;
		this.node.active = true;
		let dealCount = NNModel.getGameRuleByKey('sendCardType') == Def_Nn.sendCardType.MING4AN1 ?
			4 : NNModel.getGameRuleByKey('sendCardType') == Def_Nn.sendCardType.MING3AN2 ? 3 : 5;
		let canShowType = cards.indexOf(0) != -1; //如果手牌中有0元素则不显示牌型
		if (canShowType &&
			NNModel.getShowCards(this.getChairID()) &&
			(NNModel.isInSeat() ||
				gameStatus == ApiNn.gameStatus.SHOW_CARDS ||
				gameStatus == ApiNn.gameStatus.RESULT)) {
			dealCount = 5;
		}
		let logic = NNModel.getNNLogic()
		if (!animal) {
			//不执行动画
			if (this.node.name == "Cards1") {
				// console.trace(`第${NNModel.getCurBureau()}局`, "发牌不执行动画==", dealCount, this.node.name, NNModel.getGameRuleByKey('sendCardType'))
			}
			for (let i = 0; i < this.cardsNodeArray.length; ++i) {
				let url = ConfigModel.getCardUrl(cards[i]);
				AssetsManager.loadSpriteFrame({
					path: url,
					sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
				});

				let pos = this.cardsNodePosArray[i]
				let eidx = ends.indexOf(cards[i])
				if (cards[i] != 0 && eidx != -1) {
					pos = cc.v2(this.cardsNodePosArray[i].x, this.cardsNodePosArray[i].y + this._cardUpY)
					ends.splice(eidx, 1)
				}
				this.cardsNodeArray[i].stopAllActions();
				this.cardsNodeArray[i].opacity = 255;
				this.cardsNodeArray[i].setPosition(pos);
				this.cardsNodeArray[i].setScale(1);
				if (i < dealCount) {
					this.cardsNodeArray[i].active = true;
				} else {
					let tmp = [ApiNn.gameStatus.POUR_SCORE, ApiNn.gameStatus.ROB_BANK, ApiNn.gameStatus.SEND_CARDS]
					if (tmp.includes(gameStatus)) {
						this.cardsNodeArray[i].active = false;
					} else {
						this.cardsNodeArray[i].active = true;
					}
				}
				if (!!endCards && endCards[1] == cards[i] && cards[i] != 0) {
					cc.find('index', this.cardsNodeArray[i]).active = true;
					cc.find('index/indexnum', this.cardsNodeArray[i]).getComponent(cc.Label).string = '5 F';
				} else {
					cc.find('index', this.cardsNodeArray[i]).active = false;
				}
				if (cards[i] !== 0 && (78 === cards[i] || 79 === cards[i] ||
					logic.getCardNumber(cards[i]) === logic.getCardNumber(this._ruffianRecord))) {
					this.showGhostIcon(this.cardsNodeArray[i])
				}
			}
			return;
		}
		let node_pos = this.node.getPosition();
		// let startNode = this.node.parent.parent.getChildByName("dealStartPos")
		// console.log("----", startNode)

		for (let i = 0; i < this.cardsNodeArray.length; ++i) {
			let url = ConfigModel.getCardUrl(cards[i]);
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
			});
			this.cardsNodeArray[i].stopAllActions();
			this.cardsNodeArray[i].opacity = 255;
			this.cardsNodeArray[i].setPosition(cc.v2(
				this.cardsNodePosArray[i].x - node_pos.x,
				this.cardsNodePosArray[i].y - node_pos.y
			));
			if (i < dealCount) {
				this.cardsNodeArray[i].active = true;
				this.cardsNodeArray[i].setScale(0);
				this.cardsNodeArray[i].runAction(cc.sequence(
					cc.delayTime(0.1 * i),
					cc.spawn(cc.scaleTo(0.2, 1), cc.moveTo(0.2, this.cardsNodePosArray[i])),
					cc.callFunc(() => {
						AssetsManager.playEffect({
							path: 'audio/common/foldpai'
						});
					})
				));
			} else {
				this.cardsNodeArray[i].active = false;
			}
			if (cards[i] !== 0 && (78 === cards[i] || 79 === cards[i] ||
				logic.getCardNumber(cards[i]) === logic.getCardNumber(this._ruffianRecord))) {
				this.showGhostIcon(this.cardsNodeArray[i])
			}
		}
	},

	//ScaleByType
	showType(animal) {
		let cards = NNModel.getHandCardsByChairID(this.getChairID());
		if (!cards) return;
		this.showMask();
		let endCardType = NNModel.getEndCardTypeByChairID(this.getChairID());
		if (!!endCardType) {
			let type = endCardType.CardsType;
			let num = endCardType.NiuNumber;
			this.cardTypeNode.active = true;
			let url = 'res/sprite/';
			let audio = 'res/audio/woman/';
			if (type == Def_Nn.cardsType.MEINIU) {
				url += 'wuniu';
				audio += 'f0_nn0';
			} else if (type == Def_Nn.cardsType.YOUNIU) {
				url += ['wuniu', 'niu1', 'niu2', 'niu3', 'niu4', 'niu5', 'niu6', 'niu7', 'niu8', 'niu9', 'niuniu'][num];
				audio += ['f0_nn0', 'f0_nn1', 'f0_nn2', 'f0_nn3', 'f0_nn4', 'f0_nn5', 'f0_nn6', 'f0_nn7', 'f0_nn8', 'f0_nn9', 'f0_nn10'][num];
			} else if (type == Def_Nn.cardsType.NIUNIU) {
				url += 'niuniu';
				audio += 'f0_nn10';
			} else if (type == Def_Nn.cardsType.SHUNZINIU) {
				url += 'shunziniu';
				audio += 'f0_nn12';
			} else if (type == Def_Nn.cardsType.YINNIU) {
				url += 'yinniu';
			} else if (type == Def_Nn.cardsType.TONGHUANIU) {
				url += 'tonghuaniu';
				audio += 'f0_nn14';
			} else if (type == Def_Nn.cardsType.WUHUANIU) {
				url += 'wuhuaniu';
				audio += 'f0_nn13';
			} else if (type == Def_Nn.cardsType.HULUNIU) {
				url += 'huluniu';
				audio += 'f0_nn15';
			} else if (type == Def_Nn.cardsType.WUXIAONIU) {
				url += 'wuxiaoniu';
				audio += 'f0_nn17';
			} else if (type == Def_Nn.cardsType.ZHADANNIU) {
				url += 'zhadanniu';
				audio += 'f0_nn16';
			} else if (type == Def_Nn.cardsType.YITIAOLONG) {
				url += 'yitiaolong';
			} else if (type == Def_Nn.cardsType.TONGHUASHUN) {
				url += 'tonghuashun';
			}
			let typeNode = this.cardTypeNode.getChildByName('type');
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: typeNode.getComponent(cc.Sprite),
				bundle: Enums.bundleType.NN
			});
			this.cardTypeNode.stopAllActions();
			this.cardTypeNode.setPosition(this.cardTypeNodePos);
			/**添加倍数数字 */
			let layout = this.cardTypeNode.getComponent(cc.Layout)
			if (!layout) {
				layout = this.cardTypeNode.addComponent(cc.Layout)
				layout.type = cc.Layout.Type.HORIZONTAL
				layout.resizeMode = cc.Layout.ResizeMode.CONTAINER
				layout.affectedByScale = true
			}
			let beishuNode = this.cardTypeNode.getChildByName("beishu")
			if (!beishuNode) {
				beishuNode = new cc.Node("beishu")
				let l = beishuNode.addComponent(cc.Label)
				beishuNode.parent = this.cardTypeNode
				beishuNode.y = typeNode.y
				AssetsManager.loadAsset({
					path: 'res/fnt/nnTypeNumber',
					aType: cc.BitmapFont,
					bundle: Enums.bundleType.NN
				}, (f) => {
					if (!f || !cc.isValid(this.node)) return;
					l.font = f
					l.spacingX = -5
				})
				if (this.node.name == "Cards1") {
					l.fontSize = 60
					beishuNode.y += 10
				}
			}
			let ScaleByType = endCardType.ScaleByType
			let label = beishuNode.getComponent(cc.Label)
			if (type !== Def_Nn.cardsType.MEINIU) {
				beishuNode.active = true
				label.string = "x" + ScaleByType
			} else {
				beishuNode.active = false
			}
			/**播放牌型動畫 */
			if (animal) {
				let offx = (this.index == 0) ? 125 : 50;
				this.cardTypeNode.x = this.cardTypeNode.x + offx;
				this.cardTypeNode.stopAllActions();
				this.cardTypeNode.runAction(cc.moveTo(0.2, this.cardTypeNodePos).easing(cc.easeIn(3.0)));
				let user = NNModel.getUserByChairID(this.getChairID());
				if (user && user.userInfo.sex == 0) {
					audio = audio.replace(/woman/, "man");
					audio = audio.replace(/f0_nn/, "f1_nn");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.NN
				});
			}
		}
	},

	showMask() {
		let cards = NNModel.getHandCardsByChairID(this.getChairID());
		let hasMask = true;
		if (!cards) {
			hasMask = false;
		}
		for (let i = 0; i < cards.length; ++i) {
			if (cards[i] == 0) {
				hasMask = false;
			}
		}
		let type = NNModel.getNNLogic().getCardsType(cards);
		if (type != Def_Nn.cardsType.YOUNIU && type != Def_Nn.cardsType.NIUNIU) {
			hasMask = false;
		}
		if (hasMask) {
			for (let i = 0; i < cards.length; ++i) {
				for (let j = i + 1; j < cards.length; ++j) {
					for (let k = j + 1; k < cards.length; ++k) {
						if ((NNModel.getNNLogic().getCardValue(cards[i]) + NNModel.getNNLogic().getCardValue(cards[j]) + NNModel.getNNLogic().getCardValue(cards[k])) % 10 == 0) {
							cc.find(`cards/card${i + 1}/mask${i + 1}`, this.node).active = true;
							cc.find(`cards/card${j + 1}/mask${j + 1}`, this.node).active = true;
							cc.find(`cards/card${k + 1}/mask${k + 1}`, this.node).active = true;
							return;
						}
					}
				}
			}
		} else {
			for (let i = 1; i <= 5; ++i) {
				cc.find(`cards/card${i}/mask${i}`, this.node).active = false;
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