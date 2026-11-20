const TWModel = require('./TWModel');
const TWLogic = require('./TWLogic');
const ApiTw = require('./ApiTw');
const GameUtil = require('./TWUtil');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
	extends: cc.Component,

	properties: {
		guaiLabel: cc.Label,
		toudaoLabel: cc.Label,
		zhongdaoLabel: cc.Label,
		weidaoLabel: cc.Label,
		zongfenLabel: cc.Label,
		typeSprite: cc.Sprite, //头道牌型
		typeSprite2: cc.Sprite, //中道牌型
		typeSprite3: cc.Sprite, //尾道牌型
		typeSprite4: cc.Sprite, //特殊牌型

		gameTypeSprite: cc.Sprite,
		teShuPaiSprite: cc.Node,
		gunSpriteArr: cc.Node,
		holesNode: cc.Node,
		cardsNode: cc.Node,
		itemId: cc.Integer,
	},

	onLoad() {
		this.cardNodeArr = [];

		this.gunSecond = 1.5;
		this.showTypeSecond = 0.5;
		this.turnSecond = 1.0;
		this.itemId = parseInt(this.itemId);
		for (let i = 0; i < 13; ++i) {
			let node = new cc.Node();
			node.parent = this.cardsNode;
			node.addComponent(cc.Sprite);
			let sprite = node.getComponent(cc.Sprite);
			sprite.type = cc.Sprite.Type.SIMPLE;
			sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
			node.width = 179;
			node.height = 245;
			node.zIndex = i + 1;
			this.cardNodeArr.push(node);
		}
		for (let i = 0; i < 5; ++i) {
			this.holesNode.getChildByName('HoleSprite' + (i + 1)).active = false;
		}
		this.onHide();

		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		MessageCallback.addListener('UpdateGameCardBg', this);
		this.node.active = false;
	},

	restGunArrNode() {
		for (let x = 0; x < this.gunSpriteArr.childrenCount; x++) {
			this.gunSpriteArr.children[x].active = false;
		}
	},
	onTouchCard() { },

	gameInit() {


	},

	offLineAndClient() {
		if (typeof (this.index) != 'number') {
			return;
		}
		this.unscheduleAllCallbacks();
		this.node.active = false;
		this.holesNode.active = false;
		let gameStatus = TWModel.getGameStatus();
		let myCardArr = TWModel.getHandCardsByChairID(TWModel.getMyChairID())
		if (!myCardArr || myCardArr.length != 13) {
			// console.log("没有手牌证明不在游戏中不做显示")
			this.node.active = false;
			return
		}
		if (gameStatus === ApiTw.gameStatus.BAI_PAI || gameStatus === ApiTw.gameStatus.SEND_CARDS) {
			if (TWModel.getIsPlayingByChairID(this.getChairID())) {
				this.node.active = true;
				// console.log(TWModel.getShowCards(this.getChairID()))
				if (TWModel.getShowCards(this.getChairID())) {
					// this.setCardType1();
					this.setCardType2();
				} else {
					this.setCardType1();
				}
			} else {
				this.node.active = false;
			}

		} else if (gameStatus === ApiTw.gameStatus.BAI_PAIOK) {
			// if (TWModel.getIsPlayingByChairID(this.getChairID())) {
			// 	if (!myCardArr || myCardArr.length != 13) {
			// 		console.log("没有手牌不做显示")
			// 		this.node.active = false;
			// 		return
			// 	}
			// 	let resout = TWModel.getResult();
			// 	this.node.active = true;
			// 	// this.setCardType1();
			// 	this.setCardType2();
			// 	//this.showCard(TWModel.getResult(), TWModel.getGameSettleTm());
			// 	this.showTouDao(resout, false);
			// 	this.showZhongDao(resout, false);
			// 	this.showWeiDao(resout, false);
			// 	// this.scheduleOnce(function () {
			// 	// 	// this.setCardType6(resout);
			// 	// }.bind(this), 0.1);
			// } else {
			// 	this.node.active = false;
			// }
		} else if (gameStatus === ApiTw.gameStatus.NONE) {
			// if (this.getChairID() === TWModel.getMyChairID()) {
			// 	this.node.active = false;
			// }
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
		MessageCallback.removeListener('UpdateGameCardBg', this);
	},


	getChairID() {
		if (TWModel.getMyChairID() >= TWModel.getChairCount()) {
			return this.index;
		} else {
			return (TWModel.getMyChairID() + this.index) % TWModel.getChairCount();
		}
	},
	setIndex(index) {
		this.index = index;
		//this.getChairID() = this.getChairID();
		// console.log("index "+index)
		// console.log("chairId "+this.getChairID())
		// console.log(TWModel.playingChairArr.indexOf(this.getChairID()))
		// if (TWModel.playingChairArr.indexOf(this.getChairID()) === -1) {
		// 	this.node.active = false;
		// 	return;
		// }
		//this.offLineAndClient();
	},


	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				if (this.index == TWModel.getMyChairID()) {
					this.offLineAndClient();
				}
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				/* if(msg.data.chairID == this.getChairID()) {
					this.node.active = false;
				} */
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID == this.getChairID()) {
					let gameStatus = TWModel.getGameStatus();
					let myCardArr = TWModel.getHandCardsByChairID(this.getChairID())
					if (!myCardArr || myCardArr.length != 13) {
						// console.log("没有手牌证明不在游戏中不做显示")
						this.node.active = false;
						return
					}
					if (gameStatus === ApiTw.gameStatus.BAI_PAI || gameStatus === ApiTw.gameStatus.SEND_CARDS) {
						this.unscheduleAllCallbacks();
						if (TWModel.getIsPlayingByChairID(this.getChairID())) {
							this.node.active = true;
							// console.log(TWModel.getShowCards(this.getChairID()))
							if (TWModel.getShowCards(this.getChairID())) {
								// console.log("用户中途加入2,理牌已经完成")
								this.setCardType2();
							} else {
								// console.log("用户中途加入1,正在理牌中")
								this.setCardType1();
							}
						} else {
							this.holesNode.active = false;
							this.node.active = false;
						}
					}
				}
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID == this.getChairID()) {
					this.node.active = false;
				}
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) return;
				if (msg.data.toChairID == TWModel.getMyChairID()) {
					this.offLineAndClient();
				}
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				if (msg.data.chairID == TWModel.getMyChairID()) {
					this.cardsNode.active = false;
					this.node.active = false;
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiTw.GAME_SHOW_CARDS_PUSH) {

			} else if (msg.type === ApiTw.GAME_SEND_CARDS_PUSH) {
				this.onSendCardPush();
			} else if (msg.type === ApiTw.GAME_RESULT_PUSH) {
				this.hideMaPaiIcon()
			}
		} else if (route === 'UpdateGameCardBg') {
			this.updateGameCardBg()
		}
	},

	updateGameCardBg() {
		for (let i = 0; i < this.cardNodeArr.length; i++) {
			const card = this.cardNodeArr[i];
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

	onSendCardPush() {
		if (TWModel.playingChairArr.indexOf(this.getChairID()) === -1) {
			this.node.active = false;
			return;
		}
		this.node.active = true;

		this.unscheduleAllCallbacks();
		this.holesNode.active = false;
		this.setCardType1(true);
	},

	onShowGuaiPai(type) {
		this.teShuPaiSprite.active = type;
	},

	onSortCardsPush() {
		if (this.sendCardCallback) {
			this.unschedule(this.sendCardCallback);
			this.sendCardCallback = null;
			// this.setCardType1();
		}
		this.setCardType2();
	},

	showCard(resout, showResultFinishedCallback) {
		let myChairId = TWModel.getMyChairID();
		let myIndex = TWModel.playingChairArr.indexOf(myChairId);
		let curIndex = TWModel.playingChairArr.indexOf(this.getChairID());

		this.isOnAniaml = true;
		this.showResultFinishedCallback = showResultFinishedCallback;
		var memberCount = TWModel.playingChairArr.length; //resout.cardsArr.length;
		var offSecond = (curIndex + memberCount - myIndex) % memberCount + 1;
		this.canFanpai = false;
		this.gameTypeSprite.node.active = false;
		var mianbaiCount = 0,
			preMianbai = 0;
		for (var i = 0; i < memberCount; ++i) {
			if (TWModel.getMianbai(TWModel.playingChairArr[i])) {
				++mianbaiCount;
				if (i <= curIndex) {
					++preMianbai;
				}
			}
		}
		this.scheduleOnce(function () {
			this.setCardType3(resout, true);
		}.bind(this), (offSecond - preMianbai) * this.turnSecond);
		this.scheduleOnce(function () {
			this.setCardType4(resout, true);
		}.bind(this),
			((memberCount - mianbaiCount) * 1 + offSecond - preMianbai) * this.turnSecond + this.showTypeSecond);
		this.scheduleOnce(function () {
			this.setCardType5(resout, true);
		}.bind(this),
			((memberCount - mianbaiCount) * 2 + offSecond - preMianbai) * this.turnSecond + 2 * this.showTypeSecond);

		this.scheduleOnce(function () {
			this.daqiangAnimal(resout);
		}.bind(this), (1 + (memberCount - mianbaiCount) * 3) * this.turnSecond + 3 * this.showTypeSecond);
	},

	getqiangNode(chairId) {
		let chairCount = TWModel.getGameRule().maxPlayerCount;
		let choosedArray = [0, 1, 2, 3, 4, 5, 6, 7];
		if (chairCount == 6) {
			choosedArray = [0, 1, 2, 4, 6, 7];
		}
		if (chairCount == 4) {
			choosedArray = [0, 2, 4, 6];
		}
		let index = (chairId % chairCount + chairCount - TWModel.getMyChairID()) % chairCount;
		return choosedArray[index];
	},

	onHide() {
		this.guaiLabel.node.active = false;
		this.toudaoLabel.node.active = false;
		this.zhongdaoLabel.node.active = false;
		this.weidaoLabel.node.active = false;
		this.zongfenLabel.node.active = false;
		this.typeSprite.node.active = false;
		this.typeSprite2.node.active = false;
		this.typeSprite3.node.active = false;
		this.typeSprite4.node.active = false;
		this.teShuPaiSprite.active = false;
		this.cardsNode.active = false;
	},

	/* 未理牌状态 */
	setCardType1(hasAnimal) {
		this.hideMaPaiIcon()
		//console.log("未理牌状态")
		this.node.active = true
		this.cardsNode.active = true;
		this.cardType = 1;
		var splitX = 30;
		var posArr = [{
			x: -126,
			y: 0
		}, {
			x: -100,
			y: 0
		}, {
			x: -100,
			y: 20
		}, {
			x: 0,
			y: 0
		}, {
			x: -150,
			y: 20
		}, {
			x: -120,
			y: 0
		}, {
			x: -100,
			y: 0
		}, {
			x: -100,
			y: 0
		}];
		this.cardsNode.setPosition(0, 0);
		this.cardsNode.setScale(1, 1);
		for (var i = 0; i < this.cardNodeArr.length; ++i) {
			//console.log("未理牌状态",i)
			if (hasAnimal) {
				//console.log(posArr[this.itemId])
				this.cardNodeArr[i].x = posArr[this.itemId].x + splitX * 18;
				this.cardNodeArr[i].active = false;
			} else {
				this.cardNodeArr[i].x = posArr[this.itemId].x + splitX * i;
			}
			this.cardNodeArr[i].y = posArr[this.itemId].y;
			this.cardNodeArr[i].angle = 0;
			// this.setNodeSpriteFrame('res/sprite/cards/card_back', this.cardNodeArr[i]);
			AssetsManager.loadSpriteFrame({
				path: ConfigModel.getCardUrl(),
				sprite: this.cardNodeArr[i].getComponent(cc.Sprite)
			});
			this.cardNodeArr[i].setScale(1, 1);
		}
		if (hasAnimal) {
			AssetsManager.playEffect({
				path: 'res/audio/fapai',
				bundle: Enums.bundleType.SSS
			});
			var index = 0;
			this.sendCardCallback = () => {
				if (index === 13) {
					this.unschedule(this.sendCardCallback);
					this.sendCardCallback = null;
					this.setNodeSpriteFrame('res/sprite/cardtype/TW_lipaizhong', this.gameTypeSprite.node);
					this.gameTypeSprite.node.active = true;
					return;
				}
				this.cardNodeArr[index].active = true;
				this.cardNodeArr[index].runAction(cc.moveTo(0.1, cc.v2(posArr[this.itemId].x + splitX * index, posArr[this.itemId].y)));
				++index;
			};
			this.schedule(this.sendCardCallback, 0.05);
		} else {
			this.setNodeSpriteFrame('res/sprite/cardtype/TW_lipaizhong', this.gameTypeSprite.node);
			this.gameTypeSprite.node.active = true;
		}
		this.guaiLabel.node.active = false;
		this.toudaoLabel.node.active = false;
		this.zhongdaoLabel.node.active = false;
		this.weidaoLabel.node.active = false;
		this.zongfenLabel.node.active = false;
		this.typeSprite.node.active = false;
		this.typeSprite2.node.active = false;
		this.typeSprite3.node.active = false;
		this.typeSprite4.node.active = false;
	},

	/* 理牌状态 */
	setCardType2() {
		this.hideMaPaiIcon()
		this.canFanpai = true;
		this.cardType = 2;
		this.gameTypeSprite.node.active = false;
		var posArr = [{
			x: -70,
			y: 150
		}, {
			x: 0,
			y: 150
		}, {
			x: 70,
			y: 150
		}, {
			x: -140,
			y: 40
		}, {
			x: -70,
			y: 40
		}, {
			x: 0,
			y: 40
		}, {
			x: 70,
			y: 40
		},
		{
			x: 140,
			y: 40
		}, {
			x: -140,
			y: -65
		}, {
			x: -70,
			y: -65
		}, {
			x: 0,
			y: -65
		}, {
			x: 70,
			y: -65
		}, {
			x: 140,
			y: -65
		},
		];
		var rotate = [-23, -8, 10, -40, -22, -7, 12, 28, -40, -22, -5, 13, 28];
		var cardsNodePosArr = [{
			x: 20,
			y: -72
		}, {
			x: 20,
			y: -72
		}, {
			x: 20,
			y: -70
		}, {
			x: 81,
			y: -72
		}, {
			x: 20,
			y: -72
		}, {
			x: 20,
			y: -72
		}, {
			x: 43,
			y: -72
		}, {
			x: 64,
			y: -72
		}];
		this.cardsNode.setPosition(cardsNodePosArr[this.itemId].x, cardsNodePosArr[this.itemId].y);

		this.cardsNode.setScale(0.7, 0.7);


		for (var i = 0; i < this.cardNodeArr.length; ++i) {
			this.cardNodeArr[i].active = false;
			this.cardNodeArr[i].setPosition(posArr[i].x, posArr[i].y);
			//this.cardNodeArr[i].rotation = rotate[i];
			// this.cardNodeArr[i].setScale(1.2, 1.2);
		}

		// if (TWModel.getMianbai(this.getChairID())) {
		// 	this.onShowGuaiPai(true);
		// } else {
		// 	this.onShowGuaiPai(false);
		// }
	},

	/* 明头牌状态 */
	setCardType3(resout, showType) {
		this.node.active = true
		this.cardsNode.active = true
		this.cardType = 3;
		let myChairId = TWModel.getMyChairID();
		if (myChairId >= TWModel.getChairCount()) {
			myChairId = TWModel.playingChairArr[0];
		}
		let myIndex = TWModel.playingChairArr.indexOf(myChairId);
		let curIndex = TWModel.playingChairArr.indexOf(this.getChairID());
		let curChairID = this.getChairID();
		// console.log("明头牌状态" + this.getChairID() + " " + TWModel.getMyChairID())
		let memberCount = TWModel.playingChairArr.length;
		let offSecond = (curIndex + memberCount - myIndex) % memberCount; //(this.getChairID()+memberCount-myChairId)%memberCount;
		let cardIdArr = resout.cardsArr[curChairID];
		let aftMianbai = 0;
		for (let i = 0; i < memberCount; ++i) {
			if (TWModel.getMianbai(TWModel.playingChairArr[i]) && TWModel.playingChairArr[i] > this.getChairID()) {
				++aftMianbai;
			}
		}
		let delayTime = (memberCount - offSecond - aftMianbai) * this.turnSecond;
		if (!showType) {
			delayTime = 0;
		}

		if (!TWModel.getMianbai(curChairID)) {
			for (let i = 0; i < 3; ++i) {
				this.setNodeSpriteFrame('res/sprite/cards/' + cardIdArr[i], this.cardNodeArr[i]);
				this.showMaPaiIcon(this.cardNodeArr[i], cardIdArr[i])
			}
		}
		if (myIndex < 0) {
			myChairId = curChairID
		}
		//if (myIndex >= 0) {
		let url = '',
			str = '';
		// if (curChairID !== myChairId) {
		// let score = resout.scoresArr[myChairId][curChairID][0];
		let score = resout.endScore[this.getChairID()][0]
		if (score >= 0) {
			str = '+' + Utils.formatNumberWithDecimal(score, 2);
			url = 'res/font/fnt_game4';
		} else {
			str = '' + Utils.formatNumberWithDecimal(score, 2);
			url = 'res/font/fnt_game3';
		}
		// } else {
		// 	let score = 0,
		// 		zongStr = '';
		// 	for (let i = 0; i < memberCount; ++i) {
		// 		let index = TWModel.playingChairArr[i];
		// 		score += resout.scoresArr[myChairId][index][0];
		// 	}
		// 	console.log(TWModel.playingChairArr);
		// 	if (score >= 0) {
		// 		str = '+' + Utils.formatNumberWithDecimal(score, 2);
		// 		zongStr = '总分+' + Utils.formatNumberWithDecimal(score, 2);
		// 		url = 'res/font/fnt_game4';
		// 	} else {
		// 		str = '' + Utils.formatNumberWithDecimal(score, 2);
		// 		zongStr = '总分' + Utils.formatNumberWithDecimal(score, 2);
		// 		url = 'res/font/fnt_game3';
		// 	}
		// 	this.scheduleOnce(() => {
		// 		AssetsManager.loadAsset({
		// 			path: url,
		// 			aType: cc.Font,
		// 			bundle: Enums.bundleType.SSS
		// 		}, (font) => {
		// 			if (!!font || !cc.isValid(this.node)) {
		// 				this.zongfenLabel.font = font;
		// 				this.zongfenLabel.string = zongStr;
		// 				this.zongfenLabel.fontSize = 40;
		// 				this.zongfenLabel.node.active = true;
		// 			}
		// 		});
		// 	}, 0);
		// }

		// this.scheduleOnce(() => {
		AssetsManager.loadAsset({
			path: url,
			aType: cc.Font,
			bundle: Enums.bundleType.SSS
		}, (font) => {
			if (!!font || !cc.isValid(this.node)) {
				this.toudaoLabel.font = font;
				this.toudaoLabel.string = str;
				this.toudaoLabel.node.active = true;
			}
		});
		// }, 0);
		//}
		if (showType) {
			let touArr = TWLogic.getTouArr(resout.cardsArr[curChairID].slice());
			if (!TWModel.getMianbai(curChairID)) {
				let typeArr = GameUtil.getAllHoldTypeWithNormal(touArr);
				AssetsManager.playEffect({
					path: this.getSoundUrlByCardArr(typeArr, 'tou'),
					bundle: Enums.bundleType.SSS
				});
				this.setNodeSpriteFrame(this.getTypeUrlByCardArr(typeArr, 'tou'), this.typeSprite.node);
				this.typeSprite.node.active = true;
			}
		}

		this.gameTypeSprite.node.active = false;
	},

	/* 明中牌状态 */
	setCardType4(resout, showType) {
		this.cardType = 4;
		var myChairId = TWModel.getMyChairID();
		if (myChairId >= TWModel.getChairCount()) {
			myChairId = TWModel.playingChairArr[0];
		}
		let myIndex = TWModel.playingChairArr.indexOf(myChairId);
		let curChairID = this.getChairID();
		let curIndex = TWModel.playingChairArr.indexOf(curChairID);

		var memberCount = TWModel.playingChairArr.length;
		var offSecond = (curIndex + memberCount - myIndex) % memberCount; //(this.getChairID()+memberCount-myChairId)%memberCount;
		var aftMianbai = 0;
		for (let i = 0; i < memberCount; ++i) {
			if (TWModel.getMianbai(TWModel.playingChairArr[i]) && TWModel.playingChairArr[i] > curChairID) {
				++aftMianbai;
			}
		}
		var cardIdArr = resout.cardsArr[curChairID];
		var delayTime = (memberCount - offSecond - aftMianbai) * this.turnSecond;
		if (!showType) {
			delayTime = 0;
		}
		if (!TWModel.getMianbai(curChairID)) {
			for (let i = 3; i < 8; ++i) {
				this.setNodeSpriteFrame('res/sprite/cards/' + cardIdArr[i], this.cardNodeArr[i]);
				this.showMaPaiIcon(this.cardNodeArr[i], cardIdArr[i])
			}
		}

		if (myIndex < 0) {
			myChairId = curChairID
		}

		//if (myIndex >= 0) {
		var url = '';
		var str = '';
		// if (curChairID !== myChairId) {
		// let score = resout.scoresArr[myChairId][curChairID][1];
		let score = resout.endScore[this.getChairID()][1]
		if (score >= 0) {
			str = '+' + Utils.formatNumberWithDecimal(score, 2);
			url = 'res/font/fnt_game4';
		} else {
			str = '' + score;
			url = 'res/font/fnt_game3';
		}
		// } else {
		// 	let score = 0,
		// 		zongStr, zongScore = 0,
		// 		zongUrl;
		// 	for (let i = 0; i < memberCount; ++i) {
		// 		score += resout.scoresArr[myChairId][TWModel.playingChairArr[i]][1];
		// 		zongScore += resout.scoresArr[myChairId][TWModel.playingChairArr[i]][0] + resout.scoresArr[myChairId][TWModel.playingChairArr[i]][1];
		// 	}
		// 	if (score >= 0) {
		// 		str = '+' + Utils.formatNumberWithDecimal(score, 2);
		// 		url = 'res/font/fnt_game4';
		// 	} else {
		// 		str = '' + Utils.formatNumberWithDecimal(score, 2);
		// 		url = 'res/font/fnt_game3';
		// 	}
		// 	if (zongScore >= 0) {
		// 		zongStr = '总分+' + Utils.formatNumberWithDecimal(zongScore, 2);
		// 		zongUrl = 'res/font/fnt_game4';
		// 	} else {
		// 		zongStr = '总分' + Utils.formatNumberWithDecimal(zongScore, 2);
		// 		zongUrl = 'res/font/fnt_game3';
		// 	}
		// 	this.scheduleOnce(() => {
		// 		AssetsManager.loadAsset({
		// 			path: zongUrl,
		// 			aType: cc.Font,
		// 			bundle: Enums.bundleType.SSS
		// 		}, (font) => {
		// 			if (!!font || !cc.isValid(this.node)) {
		// 				this.zongfenLabel.font = font;
		// 				this.zongfenLabel.string = zongStr;
		// 				this.zongfenLabel.fontSize = 40;
		// 				this.zongfenLabel.node.active = true;
		// 			}
		// 		});
		// 	}, 0);
		// }

		// this.scheduleOnce(() => {
		AssetsManager.loadAsset({
			path: url,
			aType: cc.Font,
			bundle: Enums.bundleType.SSS
		}, (font) => {
			if (!!font || !cc.isValid(this.node)) {
				this.zhongdaoLabel.font = font;
				this.zhongdaoLabel.string = str;
				this.zhongdaoLabel.node.active = true;
			}
		});
		// }, 0);
		//}
		if (showType) {
			var zhongArr = TWLogic.getZhongArr(resout.cardsArr[curChairID].slice());
			if (!TWModel.getMianbai(curChairID)) {
				let typeArr = GameUtil.getAllHoldTypeWithNormal(zhongArr);
				this.setNodeSpriteFrame(this.getTypeUrlByCardArr(typeArr, 'zhong'), this.typeSprite2.node);
				AssetsManager.playEffect({
					path: this.getSoundUrlByCardArr(typeArr, 'zhong'),
					bundle: Enums.bundleType.SSS
				});
				this.typeSprite2.node.active = true;
			}
		}
	},

	/*明尾牌状态 */
	setCardType5(resout, showType) {
		var myChairId = TWModel.getMyChairID();
		if (myChairId >= TWModel.getChairCount()) {
			myChairId = TWModel.playingChairArr[0];
		}
		let myIndex = TWModel.playingChairArr.indexOf(myChairId);
		let curIndex = TWModel.playingChairArr.indexOf(this.getChairID());
		let curChairID = this.getChairID();

		var memberCount = TWModel.playingChairArr.length;
		var offSecond = (curIndex + memberCount - myIndex) % memberCount; //(this.getChairID()+memberCount-myChairId)%memberCount;
		var aftMianbai = 0;
		for (let i = 0; i < memberCount; ++i) {
			if (TWModel.getMianbai(TWModel.playingChairArr[i]) && TWModel.playingChairArr[i] > this.getChairID()) {
				++aftMianbai;
			}
		}
		var cardIdArr = resout.cardsArr[curChairID];
		var delayTime = (memberCount - offSecond - aftMianbai) * this.turnSecond;
		if (!showType) {
			delayTime = 0;
		}
		if (!TWModel.getMianbai(curChairID)) {
			for (let i = 8; i < 13; ++i) {
				this.setNodeSpriteFrame('res/sprite/cards/' + cardIdArr[i], this.cardNodeArr[i]);
				this.showMaPaiIcon(this.cardNodeArr[i], cardIdArr[i])
			}
		}
		if (myIndex < 0) {
			myChairId = curChairID
		}
		//if (myIndex >= 0) {
		var str = '';
		var url = '';
		// if (curChairID !== myChairId) {
		// let score = resout.scoresArr[myChairId][curChairID][2];
		let score = resout.endScore[this.getChairID()][2]
		if (score >= 0) {
			str = '+' + Utils.formatNumberWithDecimal(score, 2);
			url = 'res/font/fnt_game4';
		} else {
			str = '' + Utils.formatNumberWithDecimal(score, 2);
			url = 'res/font/fnt_game3';
		}
		// } else {
		// 	let score = 0,
		// 		zongScore = 0,
		// 		zongUrl, zongStr;
		// 	for (let i = 0; i < memberCount; ++i) {
		// 		score += resout.scoresArr[myChairId][TWModel.playingChairArr[i]][2];
		// 		zongScore += resout.scoresArr[myChairId][TWModel.playingChairArr[i]][0] + resout.scoresArr[myChairId][TWModel.playingChairArr[i]][1] + resout.scoresArr[myChairId][TWModel.playingChairArr[i]][2];
		// 	}
		// 	if (score >= 0) {
		// 		str = '+' + Utils.formatNumberWithDecimal(score, 2);
		// 		url = 'res/font/fnt_game4';
		// 	} else {
		// 		str = '' + Utils.formatNumberWithDecimal(score, 2);
		// 		url = 'res/font/fnt_game3';
		// 	}
		// 	if (zongScore >= 0) {
		// 		zongStr = '总分+' + Utils.formatNumberWithDecimal(zongScore, 2);
		// 		zongUrl = 'res/font/fnt_game4';
		// 	} else {
		// 		zongStr = '总分' + Utils.formatNumberWithDecimal(zongScore, 2);
		// 		zongUrl = 'res/font/fnt_game3';
		// 	}
		// 	this.scheduleOnce(() => {
		// 		AssetsManager.loadAsset({
		// 			path: zongUrl,
		// 			aType: cc.Font,
		// 			bundle: Enums.bundleType.SSS
		// 		}, (font) => {
		// 			if (!!font || !cc.isValid(this.node)) {
		// 				this.zongfenLabel.font = font;
		// 				this.zongfenLabel.string = zongStr;
		// 				this.zongfenLabel.fontSize = 40;
		// 				this.zongfenLabel.node.active = true;
		// 			}
		// 		});
		// 	}, 0);
		// }
		// this.scheduleOnce(() => {
		AssetsManager.loadAsset({
			path: url,
			aType: cc.Font,
			bundle: Enums.bundleType.SSS
		}, (font) => {
			if (!!font || !cc.isValid(this.node)) {
				this.weidaoLabel.font = font;
				this.weidaoLabel.string = str;
				this.weidaoLabel.node.active = true;
			}
		});
		// this.showMianbai(resout);
		// }, 0);
		//}

		if (showType) {
			var weiArr = TWLogic.getWeiArr(resout.cardsArr[curChairID].slice());
			if (!TWModel.getMianbai(curChairID)) {
				let typeArr = GameUtil.getAllHoldTypeWithNormal(weiArr);
				AssetsManager.playEffect({
					path: this.getSoundUrlByCardArr(typeArr),
					bundle: Enums.bundleType.SSS
				});
				this.setNodeSpriteFrame(this.getTypeUrlByCardArr(typeArr), this.typeSprite3.node);
				this.typeSprite3.node.active = true;
			}
		}
	},

	setScoreLabel(label, score) {
		var str = '';
		var url = '';
		if (score >= 0) {
			str = '+' + Utils.formatNumberWithDecimal(score, 2);
			url = 'res/font/fnt_game4';
		} else {
			str = '' + Utils.formatNumberWithDecimal(score, 2);
			url = 'res/font/fnt_game3';
		}
		AssetsManager.loadAsset({
			path: url,
			aType: cc.Font,
			bundle: Enums.bundleType.SSS
		}, (font) => {
			if (!!font || !cc.isValid(this.node)) {
				label.font = font;
				label.string = str;
				label.node.active = true;
			}
		});
	},

	showTouDao(res, isAudio) {
		this.node.active = true
		this.cardsNode.active = true
		let curIndex = this.getChairID();
		let sortInfo = res.touSort
		let info = sortInfo.find(t => {
			return t.chairId == curIndex
		})
		if (!info || !info.type) {
			this.node.active = false
			this.cardsNode.active = false
			return
		}
		let type = info.type

		if (isAudio) { //声音
			let aud = info.type
			if (aud == "santiao") {
				aud = "cs"
			}
			AssetsManager.playEffect({
				path: "res/audio/" + aud,
				bundle: Enums.bundleType.SSS
			});
		}
		//牌型
		this.setNodeSpriteFrame("res/sprite/cardtype/sss_w_" + type, this.typeSprite.node);
		this.typeSprite.node.active = true;
		/**分数 */
		let score = res.endScore[this.getChairID()][0]
		this.setScoreLabel(this.toudaoLabel, score)
		/**手牌 */
		let cardIdArr = res.cardsArr[curIndex];
		for (let i = 0; i < 3; ++i) {
			this.setNodeSpriteFrame('res/sprite/cards/' + cardIdArr[i], this.cardNodeArr[i]);
			this.showMaPaiIcon(this.cardNodeArr[i], cardIdArr[i])
		}
	},
	showZhongDao(res, isAudio) {
		this.node.active = true
		this.cardsNode.active = true
		let curIndex = this.getChairID();
		let sortInfo = res.zhongSort
		let info = sortInfo.find(t => {
			return t.chairId == curIndex
		})
		if (!info || !info.type) {
			this.node.active = false
			this.cardsNode.active = false
			return
		}
		let type = info.type

		if (isAudio) { //声音
			let aud = info.type
			if (aud == "hulu") {
				aud = "zdhl"
			}
			AssetsManager.playEffect({
				path: "res/audio/" + aud,
				bundle: Enums.bundleType.SSS
			});
		}
		//牌型
		this.setNodeSpriteFrame("res/sprite/cardtype/sss_w_" + type, this.typeSprite2.node);
		this.typeSprite2.node.active = true;
		/**分数 */
		let score = res.endScore[this.getChairID()][1]
		this.setScoreLabel(this.zhongdaoLabel, score)
		/**手牌 */
		let cardIdArr = res.cardsArr[curIndex];
		for (let i = 3; i < 8; ++i) {
			this.setNodeSpriteFrame('res/sprite/cards/' + cardIdArr[i], this.cardNodeArr[i]);
			this.showMaPaiIcon(this.cardNodeArr[i], cardIdArr[i])
		}
	},
	showWeiDao(res, isAudio) {
		this.node.active = true
		this.cardsNode.active = true
		let curIndex = this.getChairID();
		let sortInfo = res.weiSort
		let info = sortInfo.find(t => {
			return t.chairId == curIndex
		})
		if (!info || !info.type) {
			this.node.active = false
			this.cardsNode.active = false
			return
		}
		let type = info.type

		if (isAudio) { //声音
			AssetsManager.playEffect({
				path: "res/audio/" + type,
				bundle: Enums.bundleType.SSS
			});
		}
		//牌型
		this.setNodeSpriteFrame("res/sprite/cardtype/sss_w_" + type, this.typeSprite3.node);
		this.typeSprite3.node.active = true;
		/**分数 */
		let score = res.endScore[this.getChairID()][2]
		this.setScoreLabel(this.weidaoLabel, score)
		/**手牌 */
		let cardIdArr = res.cardsArr[curIndex];
		for (let i = 8; i < 13; ++i) {
			this.setNodeSpriteFrame('res/sprite/cards/' + cardIdArr[i], this.cardNodeArr[i]);
			this.showMaPaiIcon(this.cardNodeArr[i], cardIdArr[i])
		}
	},

	showMianbai(res) {
		let curIndex = this.getChairID();
		let cardIdArr = res.cardsArr[curIndex];
		let teShuSort = res.teShuSort
		let info = teShuSort.find(t => {
			return t.chairId == curIndex
		})
		if (!info || !info.teShuType) {
			this.node.active = false
			this.cardsNode.active = false
			return
		}
		let type = info.teShuType

		this.typeSprite4.node.active = true
		this.setNodeSpriteFrame(this.getTypeUrlByCardArr(type, 'tesupai'), this.typeSprite4.node);
		AssetsManager.playEffect({
			path: 'res/audio/' + type,
			bundle: Enums.bundleType.SSS
		});
		for (let i = 0; i < 13; ++i) {
			this.setNodeSpriteFrame('res/sprite/cards/' + cardIdArr[i], this.cardNodeArr[i]);
			this.showMaPaiIcon(this.cardNodeArr[i], cardIdArr[i])
		}
		// }
	},

	/* 显示总分&倍率 */
	setCardType6(resout, playAudio) {
		// console.log("显示总分", resout);
		var myChairId = TWModel.getMyChairID();
		if (myChairId >= TWModel.getChairCount()) {
			myChairId = TWModel.playingChairArr[0];
		}
		let myIndex = TWModel.playingChairArr.indexOf(myChairId);
		let curChairID = this.getChairID();
		if (myIndex < 0) {
			myChairId = curChairID
		}
		let curIndex = TWModel.playingChairArr.indexOf(curChairID);

		if (TWModel.getMianbai(curChairID)) { // 免摆牌型
			if (!!playAudio) {
				this.typeSprite4.node.active = true;
				let type = TWLogic.getTeShuPaiCardType(resout.cardsArr[curChairID]);
				this.setNodeSpriteFrame(this.getTypeUrlByCardArr(type, 'tesupai'), this.typeSprite4.node);
				AssetsManager.playEffect({
					path: this.getSoundUrlByCardArr(resout.cardsArr[curChairID]),
					bundle: Enums.bundleType.SSS
				});
			}
			var cardIdArr = resout.cardsArr[curChairID];
			for (i = 0; i < 13; ++i) {
				this.setNodeSpriteFrame('res/sprite/cards/' + cardIdArr[i], this.cardNodeArr[i]);
			}
		}
		var url = '',
			str = '';
		if (this.getChairID() === myChairId) {
			let banker = TWModel.getBankerChairID();
			if (banker >= 0) {
				var score = TWLogic.getScoreArrByResout(resout, TWModel.playingChairArr, banker, TWModel.getRobScaleByChairID(banker))[curChairID];
			} else {
				var score = TWLogic.getScoreArrByResout(resout, TWModel.playingChairArr)[curChairID];
			}

			if (score >= 0) {
				str = '总分:+' + Utils.formatNumberWithDecimal(score, 2);
				url = 'res/font/fnt_game4';
			} else {
				str = '总分:' + Utils.formatNumberWithDecimal(score, 2);
				url = 'res/font/fnt_game3';
			}
			var touScore = TWLogic.getTouScoreArrByResout(resout, TWModel.playingChairArr)[myChairId];
			var touUrl, touStr;
			if (touScore >= 0) {
				touStr = '+' + Utils.formatNumberWithDecimal(touScore, 2);
				touUrl = 'res/font/fnt_game4';
			} else {
				touStr = '' + Utils.formatNumberWithDecimal(touScore, 2);
				touUrl = 'res/font/fnt_game3';
			}
			AssetsManager.loadAsset({
				path: touUrl,
				aType: cc.Font,
				bundle: Enums.bundleType.SSS
			}, (font) => {
				if (!!font || !cc.isValid(this.node)) {
					this.toudaoLabel.font = font;
					this.toudaoLabel.string = touStr;
					this.toudaoLabel.node.active = true;
				}
			});
			var zhongScore = TWLogic.getZhongScoreArrByResout(resout, TWModel.playingChairArr)[myChairId];
			var zhongUrl, zhongStr;
			if (zhongScore >= 0) {
				zhongStr = '+' + Utils.formatNumberWithDecimal(zhongScore, 2);
				zhongUrl = 'res/font/fnt_game4';
			} else {
				zhongStr = '' + Utils.formatNumberWithDecimal(zhongScore, 2);
				zhongUrl = 'res/font/fnt_game3';
			}
			AssetsManager.loadAsset({
				path: zhongUrl,
				aType: cc.Font,
				bundle: Enums.bundleType.SSS
			}, (font) => {
				if (!!font || !cc.isValid(this.node)) {
					this.zhongdaoLabel.font = font;
					this.zhongdaoLabel.string = zhongStr;
					this.zhongdaoLabel.node.active = true;
				}
			});
			var weiScore = TWLogic.getWeiScoreArrByResout(resout, TWModel.playingChairArr)[myChairId];
			var weiUrl, weiStr;
			if (weiScore >= 0) {
				weiStr = '+' + Utils.formatNumberWithDecimal(weiScore, 2);
				weiUrl = 'res/font/fnt_game4';
			} else {
				weiStr = '' + Utils.formatNumberWithDecimal(weiScore, 2);
				weiUrl = 'res/font/fnt_game3';
			}
			AssetsManager.loadAsset({
				path: weiUrl,
				aType: cc.Font,
				bundle: Enums.bundleType.SSS
			}, (font) => {
				if (!!font || !cc.isValid(this.node)) {
					this.weidaoLabel.font = font;
					this.weidaoLabel.string = weiStr;
					this.weidaoLabel.node.active = true;
				}
			});
		} else {
			// console.log(resout.daqiangArr[myChairId])
			var daqiang = Math.abs(resout.daqiangArr[myChairId][curChairID]);
			var score = 0;
			if (daqiang > 0) { //打枪
				score = resout.scoresArr[myChairId][curChairID][0];
				let fuhao = 'x'
				if (TWModel.getGameRule().jifen) {
					fuhao = '+';
				}
				if (score > 0) {
					this.toudaoLabel.string = '+' + Utils.formatNumberWithDecimal(score, 2) + fuhao + daqiang;
				} else {
					this.toudaoLabel.string = '' + Utils.formatNumberWithDecimal(score, 2) + fuhao + daqiang;
				}
				score = resout.scoresArr[myChairId][curChairID][1];
				if (score > 0) {
					this.zhongdaoLabel.string = '+' + Utils.formatNumberWithDecimal(score, 2) + fuhao + daqiang;
				} else {
					this.zhongdaoLabel.string = '' + Utils.formatNumberWithDecimal(score, 2) + fuhao + daqiang;
				}
				score = resout.scoresArr[myChairId][curChairID][2];
				if (score > 0) {
					this.weidaoLabel.string = '+' + Utils.formatNumberWithDecimal(score, 2) + fuhao + daqiang;
				} else {
					this.weidaoLabel.string = '' + Utils.formatNumberWithDecimal(score, 2) + fuhao + daqiang;
				}
			}
			var rate = resout.rateArr[curChairID] * resout.rateArr[myChairId];
			str = "" //'翻倍';
			if (rate === 1) {
				str = "" //'不翻倍';
			}
			for (var i = 0; i < 3; ++i) {
				score += resout.scoresArr[myChairId][curChairID][i];
			}
			if (score >= 0) {
				url = 'res/font/fnt_game2';
			} else {
				url = 'res/font/fnt_game1';
			}
			// 显示怪牌分
			if (resout.guaipaiScoreArr[myChairId] + resout.guaipaiScoreArr[curChairID] > 0) {
				var guaiScore = resout.guaipaiScoreArr[myChairId] - resout.guaipaiScoreArr[curChairID];
				var guaiStr = '+' + Utils.formatNumberWithDecimal(guaiScore, 2);
				if (guaiScore < 0) {
					guaiStr = '' + Utils.formatNumberWithDecimal(guaiScore, 2);
				}
				this.guaiLabel.string = guaiStr;
			}
		}
		AssetsManager.loadAsset({
			path: url,
			aType: cc.Font,
			bundle: Enums.bundleType.SSS
		}, (font) => {
			if (!!font || !cc.isValid(this.node)) {
				this.zongfenLabel.font = font;
				this.zongfenLabel.string = str;
				this.zongfenLabel.node.active = true;
			}
		});
	},

	daqiangAnimal(resout, begPos) {
		return
		var memberCount = TWModel.playingChairArr.length;
		var daqiangArr = resout.daqiangArr;
		var index = 0;
		if (begPos) {
			index = begPos;
		}
		var hasSanChuan = this.hasSanChuan(daqiangArr);
		if (!TWModel.getGameRule().youSanChuan) {
			hasSanChuan = false;
		}
		var chairIdArr = [];
		var A;
		var B;
		for (let x = 0 + index; x < memberCount; x++) {
			A = TWModel.playingChairArr[x];
			for (let y = 0 + index; y < memberCount; y++) {
				B = TWModel.playingChairArr[y];
				if (chairIdArr.indexOf(A + '|' + B) == -1) {
					if (daqiangArr[A][B] >= 1) {
						chairIdArr.push(A + '|' + B)
					}
				}
			}
		}
		var func = () => {
			var chairIDA, chairIDB;
			var mgr = this.node.parent.getComponent('TWMainDialog');
			for (let x = 0 + index; x < chairIdArr.length; x++) {
				let arr = chairIdArr[x].split("|");
				chairIDA = arr[0];
				chairIDB = arr[1];
				break;
			}

			// if (index >= chairIdArr.length) {
			// 	console.log("index " + index)
			// 	console.log("chairIdArr.length " + chairIdArr.length)
			// 	if (hasSanChuan) {
			// 		mgr.glassAnimal(() => {
			// 			this.createSettleDialog();
			// 		});
			// 		this.unschedule(func);
			// 	} else {
			// 		this.createSettleDialog();
			// 		this.unschedule(func);
			// 	}
			// 	return;
			// }
			// let i = Math.floor(index / memberCount);
			// let j = index % memberCount;
			if (this.getChairID() == chairIDA) {
				let index = this.getqiangNode(chairIDB);
				let node = this.gunSpriteArr.getChildByName("GunSprite" + index);
				// console.log("打枪的是 " + chairIDA)
				// console.log("被打枪的是 " + chairIDB)
				// console.log("索引 " + node.name)
				node.active = true;
				node.opacity = 255;
				this.threeGunAnimal(node, chairIDB, memberCount);
			} else if (this.getChairID() == chairIDB) {
				this.holesNode.active = true;
				this.holesNode.opacity = 255;
				this.threeHoleAnimal(this.holesNode);
			} else {
				//console.log("啥玩意不是 " + this.getChairID())
				this.restGunArrNode();
			}
			++index;
		};
		func();
		// console.log("chairIdArr", chairIdArr)
		if (index <= chairIdArr.length) {
			this.schedule(func, this.gunSecond);
		}
	},

	/**
	 * 展示打枪动画
	 * @param {*} chairId 被打的位置
	 */
	showDqAni(chairId) {
		this.restGunArrNode()
		let index = this.getqiangNode(chairId);
		let node = this.gunSpriteArr.getChildByName("GunSprite" + index);
		if (node) {
			node.active = true;
			node.opacity = 255;
			node.stopAllActions()
			this.threeGunAnimal(node);
		}
	},

	/**展示被打枪动画 */
	showBDqAni() {
		this.holesNode.active = true;
		this.holesNode.opacity = 255;
		this.threeHoleAnimal(this.holesNode);
	},

	createSettleDialog() {
		let resout = TWModel.getResult();
		let curIndex = TWModel.playingChairArr.indexOf(this.getChairID());
		// this.scheduleOnce(() => {
		// 	// this.setCardType6(resout, true);
		// }, this.turnSecond / 2);
		this.scheduleOnce(() => {
			this.restGunArrNode();
			this.holesNode.active = false;
			if (curIndex === 0) {
				if (!!this.showResultFinishedCallback) {
					this.showResultFinishedCallback();
				}
			}
			for (let i = 0; i < 5; ++i) {
				this.holesNode.getChildByName('HoleSprite' + (i + 1)).active = false;
			}
			this.isOnAniaml = false;
		}, this.turnSecond * 1.5);
	},

	//是否是三穿
	hasSanChuan(arr) {
		var playingChairArr = TWModel.playingChairArr;
		var i, j, count;
		for (i = 0; i < playingChairArr.length; ++i) {
			let indexI = playingChairArr[i];
			count = 0;
			for (j = 0; j < playingChairArr.length; ++j) {
				let indexJ = playingChairArr[j];
				if (arr[indexI][indexJ] > 1) {
					++count;
				}
			}
			if (count === playingChairArr.length && count >= 3) {
				return true;
			}
		}
		return false;
	},

	threeGunAnimal(node, chairID, memberCount) {
		var offX = 14,
			offR = 16;
		offX = -offX;
		offR = -offR;
		node.runAction(cc.sequence(
			cc.callFunc(() => {
				AssetsManager.playEffect({
					path: 'res/audio/dq',
					bundle: Enums.bundleType.SSS
				});
			}),
			cc.delayTime(0.1),
			cc.callFunc(() => {
				AssetsManager.playEffect({
					path: 'res/audio/sanqiang',
					bundle: Enums.bundleType.SSS
				});
			}),
			cc.spawn(cc.moveBy(0.1, cc.v2(offX, 0)), cc.rotateBy(0.1, offR)),
			cc.spawn(cc.moveBy(0.1, cc.v2(-offX, 0)), cc.rotateBy(0.1, -offR)),
			cc.delayTime(0.1),
			cc.spawn(cc.moveBy(0.1, cc.v2(offX, 0)), cc.rotateBy(0.1, offR)),
			cc.spawn(cc.moveBy(0.1, cc.v2(-offX, 0)), cc.rotateBy(0.1, -offR)),
			cc.delayTime(0.1),
			cc.spawn(cc.moveBy(0.1, cc.v2(offX, 0)), cc.rotateBy(0.1, offR)),
			cc.spawn(cc.moveBy(0.1, cc.v2(-offX, 0)), cc.rotateBy(0.1, -offR)),
			cc.callFunc(function () {
				node.opacity = 0;
			})
		));
	},

	oneGunAnimal(node) {
		AssetsManager.playEffect({
			path: 'res/audio/gun',
			bundle: Enums.bundleType.SSS
		});
		//if (!node) { node = this.gunSprite.node; }
		node.runAction(cc.sequence(
			cc.moveBy(0.2, cc.v2(8, 8)),
			cc.moveBy(0.2, cc.v2(-8, -8))
		));
		node.runAction(cc.sequence(
			cc.rotateBy(0.2, +3),
			cc.rotateBy(0.2, -3)
		));
	},

	threeHoleAnimal(node) {
		if (!node) {
			node = this.holesNode;
		}
		var holeNameArr = ['HoleSprite1', 'HoleSprite2', 'HoleSprite3', 'HoleSprite4', 'HoleSprite5'];
		node.stopAllActions()
		for (let i = 0; i < holeNameArr.length; i++) {
			const name = holeNameArr[i];
			node.getChildByName(name).active = false
			// console.log("设置节点隐藏，", name, )
		}
		if (node.getChildByName(holeNameArr[1]).active === true) {
			node.runAction(cc.sequence(
				cc.delayTime(0.2),
				cc.callFunc(function () {
					node.getChildByName(holeNameArr[0]).active = true;
				}),
				cc.delayTime(0.3),
				cc.callFunc(function () {
					node.getChildByName(holeNameArr[3]).active = true;
				})
			));
		} else {
			node.runAction(cc.sequence(
				cc.delayTime(0.2),
				cc.callFunc(function () {
					node.getChildByName(holeNameArr[1]).active = true;
				}),
				cc.delayTime(0.3),
				cc.callFunc(function () {
					node.getChildByName(holeNameArr[2]).active = true;
				}),
				cc.delayTime(0.3),
				cc.callFunc(function () {
					node.getChildByName(holeNameArr[4]).active = true;
				})
			));
		}
	},

	oneHoleAnimal(node) {
		if (!node) {
			node = this.holesNode;
		}
		//node.active = true;
		var holeNameArr = ['HoleSprite1', 'HoleSprite2', 'HoleSprite3', 'HoleSprite4', 'HoleSprite5'];
		var i;
		var random = Math.floor(Math.random() * 5);
		for (i = 0; i < holeNameArr.length; ++i) {
			node.getChildByName(holeNameArr[i]).active = false;
		}
		node.runAction(cc.sequence(
			cc.delayTime(0.2),
			cc.callFunc(function () {
				node.getChildByName(holeNameArr[random]).active = true;
			})
		));
	},

	setNodeSpriteFrame(url, node) {
		node.active = true
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: node.getComponent(cc.Sprite),
			bundle: Enums.bundleType.SSS
		}, () => {
			// let card = parseInt(url.substring(26));
			// if (typeof (card) == 'number' && TWModel.getMapai(card)) {
			// 	console.log("card", card)
			// 	node.color = new cc.Color(241, 209, 234)
			// } else {
			// 	node.color = new cc.Color(255, 255, 255)
			// }
		});
	},


	getTypeUrlByCardArr(typeArr, type) {
		var url = 'res/sprite/cardtype/sss_w_wulong';
		if (type == "tesupai") {
			url = 'res/sprite/cardtype/' + typeArr;
			// console.log("getTypeUrlByCardArr", url)
		} else {
			for (let name in typeArr) {
				if (typeArr[name]) {
					url = 'res/sprite/cardtype/sss_w_' + name;
					break;
				}
			}
		}
		return url;
	},

	getSoundUrlByCardArr(typeArr, type) {
		var url = 'res/audio/wulong';
		for (let name in typeArr) {
			if (typeArr[name]) {
				if (type == 'tou' && name == 'st') {
					url = 'res/audio/cs';
				} else if (type == 'zhong' && name == 'hulu') {
					url = 'res/audio/zdhl';
				} else {
					url = 'res/audio/' + name;
				}
				break;
			}
		}
		return url;
	},

	showMainContinueButton() {
		var pnode = this.node.parent;
		if (TWModel.getGameEndData() !== null) {
			pnode.getChildByName('ExitButton').active = true;
		} else {
			pnode.getChildByName('ContinueButton').active = true;
		}
	},

	getIsOnAnimal() {
		return this.isOnAniaml;
	},

	/**添加马牌标记 */
	showMaPaiIcon(pNode, cardId) {
		let rule = TWModel.getGameRule()
		if (rule.mapai && TWLogic.mapai === cardId) {
			let ma = pNode.getChildByName("mapai")
			if (cc.isValid(ma)) {
				ma.active = true
				// console.log("马牌显示成功", ma)
			} else {
				ma = new cc.Node()
				ma.name = "mapai"
				ma.scale = 0.7
				ma.x = -51
				ma.y = 24
				let sp = ma.addComponent(cc.Sprite)
				AssetsManager.loadSpriteFrame({
					path: "ext/img/icon/icon_mapai",
					sprite: sp,
					bundle: Enums.bundleType.SSS
				});
				ma.parent = pNode
				// console.log("添加马牌标记成功", ma)
			}
		}
	},

	/**隐藏所有马牌标记 */
	hideMaPaiIcon() {
		this.cardNodeArr.forEach(c => {
			let ma = c.getChildByName("mapai")
			if (cc.isValid(ma)) {
				ma.active = false
			}
		});
	},
});