const NNWjyModel = require('./NNWjyModel');
const ApiNnWjy = require('./ApiNnWjy');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const { Def_Nnwjy } = require('../../../src/const/Defines');

cc.Class({
	extends: cc.Component,
	properties: {
		_ruffianRecord: null,
		_cardUpY: 20,
		_qiCard: null
	},

	start() {
		this._qiCard = null;
		if (this.node.name !== "Cards1") this._cardUpY = 10;
		this.cardsNode = cc.find('cards', this.node);
		this.cardTypeNode = cc.find('typebg', this.node);
		this.zuPaiResultMark = cc.find('zupai', this.node);
		if (this.zuPaiResultMark) this.zuPaiResultMark.active = false;
		this.cardsNodeArray = [];
		this.cardsNodePosArray = [];
		/**手牌中是否有癞子 */
		this.hasLaizi = false;
		for (let i = 1; i <= 6; ++i) {
			let node = this.cardsNode.getChildByName('card' + i);
			this.cardsNodeArray.push(node);
			this.cardsNodePosArray.push(node.getPosition());
			cc.find(`cards/card${i}/mask${i}`, this.node).active = false;
			cc.find(`cards/card${i}/qi`, this.node).active = false;
			cc.find(`cards/card${i}/index`, this.node).active = false;
		}
		this.cardTypeNodePos = this.cardTypeNode.getPosition();
		this.cardsNode.active = false;
		this.cardTypeNode.active = false;
		MessageCallback.addListener('OnRollCardFinish', this);
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
		if (NNWjyModel.getMyChairID() >= NNWjyModel.getChairCount()) {
			return this.index;
		} else {
			return (NNWjyModel.getMyChairID() + this.index) % NNWjyModel.getChairCount();
		}
	},

	gameInit() {
		this._qiCard = null;
		if (typeof (this.index) != 'number') return;
		let cards = NNWjyModel.getHandCardsByChairID(this.getChairID());
		this.cardsNode.active = false;
		this.cardTypeNode.active = false;
		if (!cards) return
		for (let i = 0; i < this.cardsNodeArray.length; ++i) {
			this.cardsNodeArray[i].setPosition(this.cardsNodePosArray[i]);
			this.cardsNodeArray[i].setScale(1);
		}
		this.node.active = true;
		this.sendCards();
		let endCardType = NNWjyModel.getEndCardTypeByChairID(this.getChairID());
		this.showType(endCardType);
		this.zuPaiSync();
		this.showZuPaiResult();
	},

	zuPaiSync() {
		let curChairID = this.getChairID();
		let myChairID = NNWjyModel.getMyChairID();
		if (curChairID != myChairID) return;
		let isInPlaying = NNWjyModel.isInPlaying();
		if (!isInPlaying) return;
		let gameStatus = NNWjyModel.getGameStatus();
		let hasChoose = NNWjyModel.checkOperateCard(myChairID);
		let cuopai = NNWjyModel.getGameRuleByKey('cuopai');
		let hasCuo = NNWjyModel.getShowCards(myChairID);
		if (gameStatus != ApiNnWjy.gameStatus.OPERATE_CARDS) return;
		if (!!hasChoose) return;//已摆牌
		let showCuo = !cuopai || !!hasCuo;
		this._onChooseSuggest(showCuo);
	},

	messageCallbackHandler(route, msg) {
		if (!NNWjyModel.getGameInited()) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.unscheduleAllCallbacks();
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
				if (msg.data.chairID == NNWjyModel.getMyChairID()) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
					for (let i = 1; i <= 6; ++i) {
						cc.find(`cards/card${i}/mask${i}`, this.node).active = false;
						cc.find(`cards/card${i}/qi`, this.node).active = false;
						cc.find(`cards/card${i}/index`, this.node).active = false;
					}
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiNnWjy.GAME_SHOW_CARDS_PUSH) {
				this.showZuPaiResult();
				if (this.getChairID() == msg.data.chairID) {
					let showCount = !!msg.data.cuopai ? 6 : 5;
					this.showCards(showCount);
				}
				if (msg.data.chairID == NNWjyModel.getMyChairID()
					&& NNWjyModel.getMyChairID() == this.getChairID()
					&& !!msg.data.cuopai) {
					this._onChooseSuggest(true);
				}
			} else if (msg.type === ApiNnWjy.GAME_OPERATE_CARDS_PUSH) {
				this.showZuPaiResult();
				if (this.getChairID() == msg.data.chairID) {
					if (!msg.data.cuopai) {
						this.resRecord(-1);
					} else {
						this.showCards(6);
					}
				}
			} else if (msg.type === ApiNnWjy.GAME_SEND_CARDS_PUSH) {
				this.showZuPaiResult();
				this._qiCard = null;
				this._ruffianRecord = msg.data.ruffianRecord;
				this.sendCards(true);
			} else if (msg.type === ApiNnWjy.GAME_TRADERUFFIAN_PUSH) {
				let chairID = this.getChairID()
				this.hasLaizi = msg.data.cards[chairID]
			} else if (msg.type === ApiNnWjy.GAME_STATUS_PUSH) {
				this.showZuPaiResult();
				this._qiCard = null;
				if (msg.data.gameStatus == ApiNnWjy.gameStatus.SEND_CARDS) {
					this.cardsNode.active = false;
					this.cardTypeNode.active = false;
					for (let i = 1; i <= 6; ++i) {
						cc.find(`cards/card${i}/mask${i}`, this.node).active = false;
						cc.find(`cards/card${i}/qi`, this.node).active = false;
						cc.find(`cards/card${i}/index`, this.node).active = false;
					}
				} else if (msg.data.gameStatus == ApiNnWjy.gameStatus.OPERATE_CARDS) {
					if (!!NNWjyModel.getGameRuleByKey('cuopai')) return;
					this._onChooseSuggest();
				}
			} else if (msg.type === ApiNnWjy.GAME_RUFFIAN_RECORD_PUSH) {
				if (this.getChairID() == msg.data.chairID) {
					this._qiCard = null;
					let ghost = msg.data.record
					let logic = NNWjyModel.getNNLogic()
					let tmpstr = ""
					let cardList = msg.data.cards
					for (let j = 0; j < cardList.length; j++) {
						const card = cardList[j];
						let num = logic.getCardNumber(card)
						tmpstr += `${num}(${card}),`
					}
					if (!msg.data.cuopai) {
						this.resRecord(msg.data.record);
					} else {
						this.showCards(6);
					}
				}
				this.hasLaizi = false;
			} else if (msg.type === ApiNnWjy.GAME_END_POUR_SCORE_PUSH) { //下注结束显示第4和5张牌的牌背
				this.showHideCard()
			} else if (msg.type === ApiNnWjy.GAME_LOOK_CARDS_PUSH) {
				this.scheduleOnce(() => {
					this.resRecord(this._ruffianRecord)
				}, 1)
			} else if (msg.type === ApiNnWjy.GAME_RESULT_PUSH) {
				let endCardType = NNWjyModel.getEndCardTypeByChairID(this.getChairID());
				this.showType(endCardType, true);
			}
		} else if (route === 'UpdateGameCardBg') { //更新牌背
			this.updateGameCardBg()
		} else if (route === 'OnRollCardFinish') { //更新牌背

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

	showCards(count) {
		this.cardTypeNode.active = false;
		let operateCard = NNWjyModel.checkOperateCard(this.getChairID());
		let endCardType = NNWjyModel.getEndCardTypeByChairID(this.getChairID());
		let gameStatus = NNWjyModel.getGameStatus();
		let cards = !!endCardType && !!operateCard ? endCardType.handCards : NNWjyModel.getHandCardsByChairID(this.getChairID());
		let logic = NNWjyModel.getNNLogic();
		if (!cards) return;
		for (let i = 0; i < count; ++i) {
			AssetsManager.loadSpriteFrame({
				path: ConfigModel.getCardUrl(cards[i]),
				sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
			});
			this.cardsNodeArray[i].handCardId = cards[i];
			if (78 === cards[i] || 79 === cards[i] ||
				logic.getCardNumber(cards[i]) === logic.getCardNumber(this._ruffianRecord)) {
				this.showGhostIcon(this.cardsNodeArray[i]);
			}
			cc.find(`mask${i + 1}`, this.cardsNodeArray[i]).active = !!operateCard && (!!endCardType && endCardType.qiCards == cards[i]) && gameStatus == ApiNnWjy.gameStatus.OPERATE_CARDS;
			cc.find(`qi`, this.cardsNodeArray[i]).active = !!operateCard && (!!endCardType && endCardType.qiCards == cards[i]) && gameStatus == ApiNnWjy.gameStatus.OPERATE_CARDS;
		}
		this.showZuPaiResult();
	},

	showZuPaiResult() {
		let gameStatus = NNWjyModel.getGameStatus();
		let chairID = this.getChairID();
		let hasChoose = NNWjyModel.checkOperateCard(chairID);
		if (this.zuPaiResultMark) this.zuPaiResultMark.active = gameStatus == ApiNnWjy.gameStatus.OPERATE_CARDS && !!hasChoose;
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
		let gameRule = NNWjyModel.getGameRule();
		if (gameRule.ruffianType === ApiNnWjy.ruffianType.WU) {
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
			bundle: Enums.bundleType.WJYNN
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
		this.cardTypeNode.active = false;
		this.hideGhostIcon();
		let operateCard = NNWjyModel.checkOperateCard(this.getChairID())
		let endCardType = NNWjyModel.getEndCardTypeByChairID(this.getChairID());
		let gameStatus = NNWjyModel.getGameStatus();
		let cards = !!endCardType && !!operateCard ? endCardType.handCards : NNWjyModel.getHandCardsByChairID(this.getChairID());
		if (!cards) return;
		this.cardsNode.active = true;
		this.node.active = true;
		for (let i = 0; i < this.cardsNodeArray.length; ++i) {
			const card = this.cardsNodeArray[i]
			let url = ConfigModel.getCardUrl(cards[i]);
			let pos = this.cardsNodePosArray[i]
			cc.find(`mask${i + 1}`, this.cardsNodeArray[i]).active = !!operateCard && (!!endCardType && endCardType.qiCards == cards[i]) && gameStatus == ApiNnWjy.gameStatus.OPERATE_CARDS;
			cc.find(`qi`, this.cardsNodeArray[i]).active = !!operateCard && (!!endCardType && endCardType.qiCards == cards[i]) && gameStatus == ApiNnWjy.gameStatus.OPERATE_CARDS;
			card.stopAllActions();
			card.setPosition(pos);
			card.opacity = 255;
			card.setScale(1);
			card.active = true;
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
		this.showZuPaiResult();
	},

	sendCards(animal) {
		this.hideGhostIcon()
		let gameStatus = NNWjyModel.getGameStatus();
		let cards = NNWjyModel.getHandCardsByChairID(this.getChairID());
		// console.log("手牌-手牌", cards);
		let ends = NNWjyModel.getEndCardsByChairID(this.getChairID()).slice();
		let endCards = NNWjyModel.getEndCardsByChairID(this.getChairID()).slice();
		// console.log("手牌-突出牌", ends);
		if (!cards) return;
		this.cardsNode.active = true;
		this.node.active = true;
		let dealCount = NNWjyModel.getGameRuleByKey('sendCardType') == Def_Nnwjy.sendCardType.MING4AN1 ?
			5 : NNWjyModel.getGameRuleByKey('sendCardType') == Def_Nnwjy.sendCardType.MING3AN2 ? 4 : 6;
		let canShowType = cards.indexOf(0) != -1; //如果手牌中有0元素则不显示牌型
		if (!!canShowType && (NNWjyModel.isInSeat() || gameStatus == ApiNnWjy.gameStatus.OPERATE_CARDS || gameStatus == ApiNnWjy.gameStatus.RESULT)) {
			dealCount = 6;
		}
		let logic = NNWjyModel.getNNLogic()
		if (!animal) {
			//不执行动画
			for (let i = 0; i < this.cardsNodeArray.length; ++i) {
				let url = ConfigModel.getCardUrl(cards[i]);
				AssetsManager.loadSpriteFrame({
					path: url,
					sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
				});
				this.cardsNodeArray[i].handCardId = cards[i];
				let pos = this.cardsNodePosArray[i]
				let eidx = ends.indexOf(cards[i]);
				this.cardsNodeArray[i].stopAllActions();
				this.cardsNodeArray[i].opacity = 255;
				this.cardsNodeArray[i].setPosition(pos);
				this.cardsNodeArray[i].setScale(1);
				if (i < dealCount) {
					this.cardsNodeArray[i].active = true;
				} else {
					let tmp = [ApiNnWjy.gameStatus.POUR_SCORE, ApiNnWjy.gameStatus.ROB_BANK, ApiNnWjy.gameStatus.SEND_CARDS]
					if (tmp.includes(gameStatus)) {
						this.cardsNodeArray[i].active = false;
					} else {
						this.cardsNodeArray[i].active = true;
					}
				}
				if (cards[i] !== 0 && (78 === cards[i] || 79 === cards[i] ||
					logic.getCardNumber(cards[i]) === logic.getCardNumber(this._ruffianRecord))) {
					this.showGhostIcon(this.cardsNodeArray[i])
				}
			}
			return;
		}
		let node_pos = this.node.getPosition();
		for (let i = 0; i < this.cardsNodeArray.length; ++i) {
			let url = ConfigModel.getCardUrl(cards[i]);
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
			});
			this.cardsNodeArray[i].handCardId = cards[i];
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

	_onChooseSuggest(roll) {
		if (roll) this.showCards(6);
		let myChairID = NNWjyModel.getMyChairID();
		if (myChairID != this.getChairID()) return;
		let suggest = NNWjyModel.getMaxCardType();
		if (!suggest) return;
		let event = {};
		event.target = {};
		event.target.handCardId = suggest.qiCards;
		this.chooseCard(event);
	},

	chooseCard(event, param) {
		let gameStatus = NNWjyModel.getGameStatus();
		let myChairID = NNWjyModel.getMyChairID();
		let hasChoose = NNWjyModel.checkOperateCard(myChairID);
		let inPlaying = NNWjyModel.isInPlaying();
		if (!inPlaying || gameStatus != ApiNnWjy.gameStatus.OPERATE_CARDS) return;
		if (!!hasChoose) return;
		if (!event.target || !event.target.handCardId) return;
		//获取数据
		let handCardId = event.target.handCardId;
		let endCardType = NNWjyModel.getUserOperateCards(handCardId);
		this._qiCard = handCardId;
		this.showType(endCardType, false);
		this.cardsNodeArray.forEach((card, index) => {
			card.stopAllActions();
			let targetPos = this.cardsNodePosArray[index];
			cc.find('qi', card).active = card.handCardId == handCardId;
			cc.find(`mask${index + 1}`, card).active = card.handCardId == handCardId;
			if (card.handCardId != handCardId) {
				card.setPosition(targetPos);
			} else {
				let movePos = cc.v2(targetPos.x, 20);
				if (card.y != 0) {
					card.setPosition(movePos);
				} else {
					card.setPosition(targetPos);
					cc.tween(card)
						.to(0.3, { position: cc.v3(movePos) })
						.start();
				}
			}
		});
	},

	onZuPaiClick() {
		if (!this._qiCard) {
			AssetsManager.tipDialog('请选择不要的牌~');
			return;
		}
		ApiRoom.gameMessageNotify(ApiNnWjy.gameOperateCardsNotify(this._qiCard));
	},

	_getNiuTypeRes(endCardType) {
		let res = {
			url: '',
			audio: ''
		};
		if (!endCardType) return res;
		let type = endCardType.CardsType;
		let num = endCardType.NiuNumber;
		let url = 'res/sprite/';
		let audio = 'res/audio/woman/';
		if (type == Def_Nnwjy.cardsType.MEINIU) {
			url += 'wuniu';
			audio += 'f0_nn0';
		} else if (type == Def_Nnwjy.cardsType.YOUNIU) {
			url += ['wuniu', 'niu1', 'niu2', 'niu3', 'niu4', 'niu5', 'niu6', 'niu7', 'niu8', 'niu9', 'niuniu'][num];
			audio += ['f0_nn0', 'f0_nn1', 'f0_nn2', 'f0_nn3', 'f0_nn4', 'f0_nn5', 'f0_nn6', 'f0_nn7', 'f0_nn8', 'f0_nn9', 'f0_nn10'][num];
		} else if (type == Def_Nnwjy.cardsType.NIUNIU) {
			url += 'niuniu';
			audio += 'f0_nn10';
		} else if (type == Def_Nnwjy.cardsType.SHUNZINIU) {
			url += 'shunziniu';
			audio += 'f0_nn12';
		} else if (type == Def_Nnwjy.cardsType.YINNIU) {
			url += 'yinniu';
		} else if (type == Def_Nnwjy.cardsType.TONGHUANIU) {
			url += 'tonghuaniu';
			audio += 'f0_nn14';
		} else if (type == Def_Nnwjy.cardsType.WUHUANIU) {
			url += 'wuhuaniu';
			audio += 'f0_nn13';
		} else if (type == Def_Nnwjy.cardsType.HULUNIU) {
			url += 'huluniu';
			audio += 'f0_nn15';
		} else if (type == Def_Nnwjy.cardsType.WUXIAONIU) {
			url += 'wuxiaoniu';
			audio += 'f0_nn17';
		} else if (type == Def_Nnwjy.cardsType.ZHADANNIU) {
			url += 'zhadanniu';
			audio += 'f0_nn16';
		} else if (type == Def_Nnwjy.cardsType.YITIAOLONG) {
			url += 'yitiaolong';
		} else if (type == Def_Nnwjy.cardsType.TONGHUASHUN) {
			url += 'tonghuashun';
		}
		res.url = url;
		res.audio = audio;
		return res;
	},

	//ScaleByType
	showType(endCardType, animal) {
		this.cardTypeNode.active = false;
		let isInPlaying = NNWjyModel.isInPlaying(this.getChairID());
		if (!isInPlaying) return;
		if (!endCardType) return;
		let handCards = endCardType.handCards || [];
		let logic = NNWjyModel.getNNLogic();
		let qiCards = endCardType.qiCards;
		let operateCard = NNWjyModel.checkOperateCard(this.getChairID());
		for (let i = 0; i < this.cardsNodeArray.length; i++) {
			this.cardsNodeArray[i].stopAllActions();
			this.cardsNodeArray[i].setPosition(this.cardsNodePosArray[i]);
			this.cardsNodeArray[i].active = !isNaN(handCards[i]) && handCards[i] >= 0;
			AssetsManager.loadSpriteFrame({
				path: ConfigModel.getCardUrl(handCards[i]),
				sprite: this.cardsNodeArray[i].getComponent(cc.Sprite)
			});
			this.cardsNodeArray[i].handCardId = handCards[i];
			if (78 === handCards[i] || 79 === handCards[i] ||
				logic.getCardNumber(handCards[i]) === logic.getCardNumber(this._ruffianRecord)) {
				this.showGhostIcon(this.cardsNodeArray[i])
			}
			cc.find(`mask${i + 1}`, this.cardsNodeArray[i]).active = handCards[i] == qiCards && !!operateCard;
			cc.find(`qi`, this.cardsNodeArray[i]).active = handCards[i] == qiCards && !!operateCard;
		}
		let type = endCardType.CardsType;
		this.cardTypeNode.active = true;
		let res = this._getNiuTypeRes(endCardType);
		let typeNode = this.cardTypeNode.getChildByName('type');
		AssetsManager.loadSpriteFrame({
			path: res.url,
			sprite: typeNode.getComponent(cc.Sprite),
			bundle: Enums.bundleType.WJYNN
		});
		this.cardTypeNode.stopAllActions();
		this.cardTypeNode.setPosition(this.cardTypeNodePos);
		/**添加倍数数字 */
		let layout = this.cardTypeNode.getComponent(cc.Layout)
		if (!layout) {
			layout = this.cardTypeNode.addComponent(cc.Layout)
			layout.type = cc.Layout.Type.HORIZONTAL
			layout.resizeMode = cc.Layout.ResizeMode.CONTAINER
			layout.affectedByScale = true;
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
				bundle: Enums.bundleType.WJYNN
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
		if (type !== Def_Nnwjy.cardsType.MEINIU) {
			beishuNode.active = true
			label.string = "x" + ScaleByType
		} else {
			beishuNode.active = false
		}
		/**播放牌型動畫 */
		if (!animal) return;
		let offx = (this.index == 0) ? 125 : 50;
		this.cardTypeNode.x = this.cardTypeNode.x + offx;
		this.cardTypeNode.stopAllActions();
		this.cardTypeNode.runAction(cc.moveTo(0.2, this.cardTypeNodePos).easing(cc.easeIn(3.0)));
		let user = NNWjyModel.getUserByChairID(this.getChairID());
		if (user && user.userInfo.sex == 0) {
			res.audio = res.audio.replace(/woman/, "man");
			res.audio = res.audio.replace(/f0_nn/, "f1_nn");
		}
		if (this.getChairID() != NNWjyModel.getMyChairID()) return;
		AssetsManager.playEffect({
			path: res.audio,
			bundle: Enums.bundleType.WJYNN
		});
	},

	onDestroy() {
		MessageCallback.removeListener('OnRollCardFinish', this);
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
		MessageCallback.removeListener('UpdateGameCardBg', this);
	},
});