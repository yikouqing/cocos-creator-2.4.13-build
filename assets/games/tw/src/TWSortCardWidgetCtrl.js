const TWLogic = require('./TWLogic');
const TWModel = require('./TWModel');
const GameUtil = require('./TWUtil');
const Enums = require('../../../src/const/Enums');
const ApiTw = require('./ApiTw');
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Configs = require('../../../src/const/Configs');
const SORT_CARD_MAX_TIME = 180;

cc.Class({
	extends: cc.Component,

	properties: {
		touCancelButton: cc.Button,
		zhongCancelButton: cc.Button,
		weiCancelButton: cc.Button,
		touButton: cc.Button,
		zhongButton: cc.Button,
		weiButton: cc.Button,
		duiziButton: cc.Button,
		liangduiButton: cc.Button,
		santiaoButton: cc.Button,
		shunziButton: cc.Button,
		tonghuaButton: cc.Button,
		huluButton: cc.Button,
		sitiaoButton: cc.Button,
		tonghuashunButton: cc.Button,
		wutongButton: cc.Button,
		confirmButton: cc.Button,
		guaiPaiTipWidgetPrefab: cc.Prefab,
		cardsNode: cc.Node,
		buttonsNode: cc.Node,
		touTypeSprite: cc.Sprite,
		zhongTypeSprite: cc.Sprite,
		weiTypeSprite: cc.Sprite,
		autoSortNode: cc.Node,
		tuipaiItem: cc.Prefab,
		clockTimeLabel: cc.Label,
		btnLayout: cc.Node,
		__isBaiPaiing: false,
		_selectCardIdx: -1,
	},

	onLoad() { },

	onDestroy() { },

	initWidget() {
		this.cardNodeArr = [];
		this.zhongCardArr = [];
		this.touCardArr = [];
		this.weiCardArr = [];
		this.upY = 20;
		var cardsNode = this.node.getChildByName('CardsNode');
		var i;
		for (i = 0; i < 13; ++i) {
			this.cardNodeArr.push(cardsNode.getChildByName('Sprite' + i));
		}
		// this.confirmButton.node.interactable = false;
		this.btnLayout.active = false
		this.touCancelButton.node.active = false;
		this.zhongCancelButton.node.active = false;
		this.weiCancelButton.node.active = false;
		this.touTypeSprite.node.active = false;
		this.zhongTypeSprite.node.active = false;
		this.weiTypeSprite.node.active = false;
	},



	setCardArr(cardArr) {
		this.initWidget();
		this._isBaiPaiing = true;
		this.cardArr = cardArr //.sort(GameUtil.sortIDByPointAndColor);
		this.cardUpArr = [];
		var i;
		for (i = 0; i < this.cardArr.length; ++i) {
			this.setNodeSpriteFrame(this.cardArr[i], 'res/sprite/cards/' + this.cardArr[i], this.cardNodeArr[i]);
			this.cardUpArr[i] = false;
			this.addMoveAndEndEvent(this.cardNodeArr[i], i);
		}
		this.setTypeButton();

		// 开启定时器
		this.unscheduleAllCallbacks();
		this.clockTimeLabel.string = Math.floor(TWModel.getTick());
		this.schedule(this.clockScheduler.bind(this), 1);
		let tesupaiName = TWLogic.getTeShuPaiCardType(cardArr);
		if (tesupaiName) {
			cc.find('btn_tesupai', this.node).active = true;
			this.tesupaiName = tesupaiName;
		} else {
			cc.find('btn_tesupai', this.node).active = false;
		}
	},

	setNodeSpriteFrame(cardId, url, node) {
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: node.getComponent(cc.Sprite),
			bundle: Enums.bundleType.SSS
		}, () => {
			if (!node || !cc.isValid(node)) return;
			if (TWModel.getMapai(cardId)) {
				let maNode = new cc.Node();
				let maSprite = maNode.addComponent(cc.Sprite);
				maNode.parent = node;
				maNode.scale = 0.5;
				maNode.setPosition(cc.v2(-42, -20));
				AssetsManager.loadSpriteFrame({
					path: 'res/sprite/main/mapai',
					sprite: maSprite,
					bundle: Enums.bundleType.SSS
				});
			}
		});
	},

	clockScheduler() {
		if (Math.floor(TWModel.getTick()) <= 0) {
			ApiRoom.gameMessageNotify(ApiTw.getGameCardsSortRequestData(TWLogic.autoSortCards(this.cardArr), Date.now()))
			this.unscheduleAllCallbacks();
			this.node.active = false;
		} else {
			if (TWModel.getGameStatus() !== ApiTw.gameStatus.BAI_PAI) {
				this.unscheduleAllCallbacks();
				this.node.active = false;
			}
			this.clockTimeLabel.string = Math.floor(TWModel.getTick());
		}
	},

	addMoveAndEndEvent(node, i) {
		// console.log("addMoveAndEndEvent", node.name + "  " + i)
		node.on(cc.Node.EventType.TOUCH_END, function (event) {
			this.onTouchCardEnd(event, i);
		}.bind(this));
		node.on(cc.Node.EventType.TOUCH_START, function (event) {
			this.onTouchCardStart(event, i);
		}.bind(this));
		node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
			this.onTouchMove(event, i);
		}.bind(this));
		node.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
			this.onTouchCardEnd(event, i);
		}.bind(this));
	},

	onTouchCard(event, param) {
		var i = parseInt(param);
		if (param < 0 || param >= 13 || param == null) {
			return;
		}
		if (this.cardUpArr[i]) {
			this.cardNodeArr[i].y -= this.upY;
		} else {
			this.cardNodeArr[i].y += this.upY;
		}
		this.cardUpArr[i] = !this.cardUpArr[i];
		if (this.cardUpArr[i] && this._selectCardIdx !== -1) {
			let jhbtn = this.touButton
			let jharr = this.touCardArr
			let jhname = "t"
			if (this.zhongCardArr.includes(this._selectCardIdx)) {
				jhbtn = this.zhongButton
				jharr = this.zhongCardArr
				jhname = "z"
			} else if (this.weiCardArr.includes(this._selectCardIdx)) {
				jhbtn = this.weiButton
				jharr = this.weiCardArr
				jhname = "w"
			}
			this.jiaoHuanUpDownCard(jhbtn.node, jharr, jhname, this._selectCardIdx)
		}
	},

	onTouchCardStart(event, param) {
		this.startX = event.currentTouch._point.x;
		this.startY = event.currentTouch._point.y;
		// console.log("onTouchCardStart==", param)
	},

	onTouchMove(event, param) {
		var x = event.currentTouch._point.x;
		var y = event.currentTouch._point.y;
		/*
		if(Math.abs(x-this.startX) < 10 || Math.abs(y-this.startY) > 30) {
			this.onTouchCard(null, param);
			return;
		}
		*/
		var restCardArr = this.getRestCardArr(true);
		if (restCardArr.length <= 1) {
			return
		}
		x = this.node.getChildByName('CardsNode').convertToNodeSpace(cc.v2(x, y)).x;
		var width = this.cardsNode.width;
		var cardWid = this.cardNodeArr[0].width;
		var firstNode = this.cardNodeArr[restCardArr[0]];
		var secondNode = this.cardNodeArr[restCardArr[1]];
		var offx = secondNode.x - firstNode.x;
		var bx = width / 2 + firstNode.x - cardWid / 2;
		var index = Math.floor((x - bx) / offx);
		var i = restCardArr.indexOf(param);
		var nodeIndex;
		if (index >= i) {
			while (i <= index) {
				nodeIndex = restCardArr[i];
				if (nodeIndex >= 0 && nodeIndex < 13) {
					this.cardNodeArr[nodeIndex].color = new cc.Color(200, 200, 200);
				}
				++i;
			}
		} else {
			while (i >= index) {
				nodeIndex = restCardArr[i];
				if (nodeIndex >= 0 && nodeIndex < 13) {
					this.cardNodeArr[nodeIndex].color = new cc.Color(200, 200, 200);
				}
				--i;
			}
		}
	},

	onTouchCardEnd(event, param) {
		var x = event.currentTouch._point.x;
		var y = event.currentTouch._point.y;
		/*
		if(Math.abs(x-this.startX) < 10 || Math.abs(y-this.startY) > 30) {
			this.onTouchCard(null, param);
			return;
		}
		*/
		x = this.node.getChildByName('CardsNode').convertToNodeSpace(cc.v2(x, y)).x;
		var restCardArr = this.getRestCardArr(true);
		if (restCardArr.length <= 1) {
			this.onTouchCard(null, restCardArr[0]);
			return
		}
		var width = this.cardsNode.width;
		var cardWid = this.cardNodeArr[0].width;
		var firstNode = this.cardNodeArr[restCardArr[0]];
		var secondNode = this.cardNodeArr[restCardArr[1]];
		var offx = secondNode.x - firstNode.x;
		var bx = width / 2 + firstNode.x - cardWid / 2;
		var index = Math.floor((x - bx) / offx);
		var i = restCardArr.indexOf(param);
		if (index >= i) {
			while (i <= index) {
				this.onTouchCard(null, restCardArr[i]);
				++i;
			}
		} else {
			while (i >= index) {
				this.onTouchCard(null, restCardArr[i]);
				--i;
			}
		}
		for (i = 0; i < this.cardNodeArr.length; ++i) {
			this.cardNodeArr[i].color = new cc.Color(255, 255, 255);
		}
	},

	sortRestCard() {
		var restCardArr = this.getRestCardArr(true);
		var width = this.cardsNode.width;
		var cardWid = this.cardNodeArr[0].width;
		var offx = 80;
		var i, node;
		width = cardWid + (restCardArr.length - 1) * offx;
		for (i = 0; i < restCardArr.length; ++i) {
			node = this.cardNodeArr[restCardArr[i]];
			node.x = cardWid / 2 + i * offx - width / 2;
		}
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i]) {
				this.cardUpArr[i] = false;
				this.cardNodeArr[i].y -= this.upY;
			}
		}
		this.checkIsCanShowCard()
		this.resetUpCard()
	},

	setTypeButton() {
		let t = Date.now()
		var chooseArr = this.getRestCardArr();
		if (chooseArr.length <= 0) {
			return;
		}
		let arr = GameUtil.getAllHoldTypeWithNormal(chooseArr);

		this.duiziButton.interactable = arr['duizi'];
		this.liangduiButton.interactable = arr['liangdui'];
		this.santiaoButton.interactable = arr['santiao'];
		this.shunziButton.interactable = arr['shunzi'];
		this.tonghuaButton.interactable = arr['tonghua'];
		this.huluButton.interactable = arr['hulu'];
		this.sitiaoButton.interactable = arr['tiezhi'];
		this.tonghuashunButton.interactable = arr['tonghuashun'];
		this.wutongButton.interactable = arr['wutong'];
	},
	onButtonClick(event, param) {
		if (param === 'confirm') {
			this.sendSortCard();
		} else if (param === 'toudao') {
			this.onClickToudao();
		} else if (param === 'toudao_cancel') {
			this.onClickToudaoCancel();
		} else if (param === 'zhongdao') {
			this.onClickZhongdao();
		} else if (param === 'zhongdao_cancel') {
			this.onClickZhongdaoCancel();
		} else if (param === 'weidao') {
			this.onClickWeidao();
		} else if (param === 'weidao_cancel') {
			this.onClickWeidaoCancel();
		} else if (param === 'autosort') {
			this.showAotuSort();
		} else if (param === 'tesupai') {
			if (this.tesupaiName) {
				let guaiPaiNode = cc.instantiate(this.guaiPaiTipWidgetPrefab);
				guaiPaiNode.parent = this.node;
				guaiPaiNode.getComponent('TWGuaipaiTipWidgetCtrl').setLabel(this.tesupaiName);
			}

		} else {
			this.onTouchType(param);
		}
	},

	onClickToudao() {
		var count = 0,
			i, cardWid = 87;
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i] && this.zhongCardArr.indexOf(i) === -1 && this.weiCardArr.indexOf(i) === -1) {
				++count;
			}
		}
		if (count + this.touCardArr.length > 3) {
			AssetsManager.tipDialog("头道最多3张牌")
			return
		}
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i] && this.zhongCardArr.indexOf(i) === -1 && this.weiCardArr.indexOf(i) === -1) {
				this.touCardArr.push(i);
			}
		}
		this.updateUpCard(this.touButton.node, this.touCardArr, "t")
		this.sortRestCard();
		this.setTypeButton();
		if (this.touCardArr.length === 3) {
			this.restCardAutoFill();
			this.setTypeNameByCards(this.touCardArr, this.touTypeSprite);
		}
		this.touCancelButton.node.active = this.touCardArr.length > 0;
	},
	showAotuSort() {
		var action = null;
		let oldx = this.autoSortNode.x;
		let oldy = this.autoSortNode.y;
		let content = this.autoSortNode.getChildByName("cards").getChildByName("view").getChildByName("content");
		this.autoSortNode.stopAllActions();
		content.removeAllChildren();
		if (this.aotuSortisShow) {
			this.aotuSortisShow = false;
			action = cc.moveTo(0.2, cc.v2(oldx + 666, oldy))
		} else {
			this.aotuSortisShow = true;
			// console.log(this.cardArr)
			action = cc.moveTo(0.2, cc.v2(oldx - 666, oldy))
			let cardArr = GameUtil.getGroupAllPokerType(this.cardArr);
			// console.log(cardArr)
			for (let x = 0; x < cardArr.length; x++) {
				let node = cc.instantiate(this.tuipaiItem);
				node.getComponent("TWtuipaiItem").setCardArr(x + 1, cardArr[x], this.autoSortCards.bind(this));
				node.getComponent("TWtuipaiItem").setSelecteBg(false);
				node.on(cc.Node.EventType.TOUCH_END, function (event) {
					this.ontuipaiClick(event);
				}.bind(this));
				content.addChild(node);
			}

		}

		this.autoSortNode.runAction(action);
	},

	ontuipaiClick(event) {
		let content = this.autoSortNode.getChildByName("cards").getChildByName("view").getChildByName("content");
		for (let x in content.children) {
			content.children[x].getComponent("TWtuipaiItem").setSelecteBg(false);
		}

		event.target.getComponent("TWtuipaiItem").onClick();
	},
	autoSortCards(cardArr) {
		let arr1 = this.getCardIndex(cardArr[0], this.cardArr);
		let arr2 = this.getCardIndex(cardArr[1], this.cardArr, arr1);
		//console.log(arr1)
		//console.log(arr2)
		if (!this.lastClickTime) {
			this.lastClickTime = new Date();
		} else {
			if (new Date() - this.lastClickTime <= 1000) {
				AssetsManager.tipDialog("点击过快");
				return;
			} else {
				this.lastClickTime = new Date();
			}
		}
		this.onclickAllCancel();
		this.node.runAction(cc.sequence(
			cc.delayTime(0.3),
			cc.callFunc(function () {
				this.setCardUp(arr1);
				this.onClickWeidao();
			}.bind(this)),
			cc.delayTime(0.2),
			cc.callFunc(function () {
				this.setCardUp(arr2);
				this.onClickZhongdao();
			}.bind(this))
		))
	},

	getCardIndex(cardArr, chooseArr, arr = []) {
		let indexArr = [];
		for (let x = 0; x < cardArr.length; x++) {
			for (let y = 0; y < chooseArr.length; y++) {
				if (chooseArr[y] === cardArr[x] && arr.indexOf(y) == -1 && indexArr.indexOf(y) == -1) {
					indexArr.push(y);
					break;
				}
			}
		}
		return indexArr;
	},

	onclickAllCancel() {
		this.onClickToudaoCancel();
		this.onClickZhongdaoCancel();
		this.onClickWeidaoCancel();
	},
	onClickToudaoCancel() {
		var i;
		this.touButton.interactable = true;
		this.touCancelButton.node.active = false;
		this.touButton.node.removeAllChildren();
		for (i = 0; i < this.touCardArr.length; ++i) {
			this.cardNodeArr[this.touCardArr[i]].active = true;
		}
		this.touCardArr = [];
		this.sortRestCard();
		this.setTypeButton();
		this.touTypeSprite.node.active = false;
	},

	onClickZhongdao() {
		var count = 0,
			i, cardWid = 87;
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i] && this.touCardArr.indexOf(i) === -1 && this.weiCardArr.indexOf(i) === -1) {
				++count;
			}
		}
		if (count + this.zhongCardArr.length > 5) {
			AssetsManager.tipDialog("中道最多5张牌")
			return
		}
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i] && this.touCardArr.indexOf(i) === -1 && this.weiCardArr.indexOf(i) === -1) {
				this.zhongCardArr.push(i);
			}
		}
		this.updateUpCard(this.zhongButton.node, this.zhongCardArr, "z")
		this.sortRestCard();
		this.setTypeButton();
		if (this.zhongCardArr.length === 5) {
			this.restCardAutoFill();
			this.setTypeNameByCards(this.zhongCardArr, this.zhongTypeSprite);
		}
		this.zhongCancelButton.node.active = this.zhongCardArr.length > 0;
	},


	onClickZhongdaoCancel() {
		var i;
		this.zhongButton.interactable = true;
		this.zhongCancelButton.node.active = false;
		this.zhongButton.node.removeAllChildren();
		for (i = 0; i < this.zhongCardArr.length; ++i) {
			this.cardNodeArr[this.zhongCardArr[i]].active = true;
		}
		this.zhongCardArr = [];
		this.sortRestCard();
		this.setTypeButton();
		this.zhongTypeSprite.node.active = false;
	},

	onClickWeidao() {
		var count = 0,
			i;
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i] && this.touCardArr.indexOf(i) === -1 && this.zhongCardArr.indexOf(i) === -1) {
				++count;
			}
		}
		if (count + this.weiCardArr.length > 5) {
			AssetsManager.tipDialog("尾道最多5张牌")
			return
		}
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i] && this.touCardArr.indexOf(i) === -1 && this.zhongCardArr.indexOf(i) === -1) {
				this.weiCardArr.push(i);
			}
		}
		this.updateUpCard(this.weiButton.node, this.weiCardArr, "w")
		this.sortRestCard();
		this.setTypeButton();
		if (this.weiCardArr.length === 5) {
			this.restCardAutoFill();
			this.setTypeNameByCards(this.weiCardArr, this.weiTypeSprite);
		}
		this.weiCancelButton.node.active = this.weiCardArr.length > 0;
	},

	onClickWeidaoCancel() {
		var i;
		this.weiButton.interactable = true;
		this.weiCancelButton.node.active = false;
		this.weiButton.node.removeAllChildren();
		for (i = 0; i < this.weiCardArr.length; ++i) {
			this.cardNodeArr[this.weiCardArr[i]].active = true;
		}
		this.weiCardArr = [];
		this.sortRestCard();
		this.setTypeButton();
		this.weiTypeSprite.node.active = false;
	},

	verifySortCard() {
		var touCardIdArr = [],
			zhongCardIdArr = [],
			weiCardIdArr = [];
		var i;
		for (i = 0; i < this.touCardArr.length; ++i) {
			touCardIdArr.push(this.cardArr[this.touCardArr[i]]);
		}
		for (i = 0; i < this.zhongCardArr.length; ++i) {
			zhongCardIdArr.push(this.cardArr[this.zhongCardArr[i]]);
		}
		for (i = 0; i < this.weiCardArr.length; ++i) {
			weiCardIdArr.push(this.cardArr[this.weiCardArr[i]]);
		}
		if (touCardIdArr.length !== 0 && zhongCardIdArr.length !== 0) {
			if (TWLogic.compareCards(touCardIdArr, zhongCardIdArr, TWLogic.getTouZhongWeiCardType(touCardIdArr),
				TWLogic.getTouZhongWeiCardType(zhongCardIdArr))) {
				AssetsManager.tipDialog('中道必须大于头道');
				return false;
			}
		}
		if (weiCardIdArr.length !== 0 && zhongCardIdArr.length !== 0) {
			if (TWLogic.compareCards(zhongCardIdArr, weiCardIdArr, TWLogic.getTouZhongWeiCardType(zhongCardIdArr),
				TWLogic.getTouZhongWeiCardType(weiCardIdArr))) {
				AssetsManager.tipDialog('尾道必须大于中道');
				return false;
			}
		}
		if (weiCardIdArr.length !== 0 && touCardIdArr.length !== 0) {
			if (TWLogic.compareCards(touCardIdArr, weiCardIdArr, TWLogic.getTouZhongWeiCardType(touCardIdArr),
				TWLogic.getTouZhongWeiCardType(weiCardIdArr))) {
				AssetsManager.tipDialog('尾道必须大于头道');
				return false;
			}
		}
		return true;
	},

	/**剩余牌自动填充 */
	restCardAutoFill() {
		var canFill = false,
			restCardArr, i, func;
		if (this.touCardArr.length === 3 && this.zhongCardArr.length === 5) {
			canFill = true;
			func = this.onClickWeidao.bind(this);
		}
		if (this.touCardArr.length === 3 && this.weiCardArr.length === 5) {
			canFill = true;
			func = this.onClickZhongdao.bind(this);
		}
		if (this.zhongCardArr.length === 5 && this.weiCardArr.length === 5) {
			canFill = true;
			func = this.onClickToudao.bind(this);
		}
		if (this.touCardArr.length + this.zhongCardArr.length + this.weiCardArr.length === 13) {
			canFill = false;
		}
		if (canFill) {
			restCardArr = this.getRestCardArr();
			for (i = 0; i < this.cardArr.length; ++i) {
				if (restCardArr.indexOf(this.cardArr[i]) !== -1) {
					this.cardNodeArr[i].y += this.upY;
					this.cardUpArr[i] = true;
				}
			}
			func();
		}
	},

	onTouchType(name) {
		var restArr = this.getRestCardArr();
		var resout, i, j, chooseArr;

		resout = GameUtil.getElectionByName(restArr, name, this._lastResout);
		// console.log(resout, this._lastResout)
		if (this.preName && name !== this.preName) {
			this._lastResout = null //用于轮流推荐所有牌型
		}

		var arr = [];
		for (let y = 0; y < resout.length; y++) {
			for (let x = 0; x < this.cardArr.length; x++) {
				if (resout[y] == this.cardArr[x] && arr.indexOf(x) == -1 && this.cardNodeArr[x].active) {
					arr.push(x);
					break;
				}
			}
		}
		// console.log("resout===", resout)

		this.setCardUp(arr)
		this.preName = name;
		this._lastResout = resout
	},

	setCardUp(chooseArr) {
		var i;
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i] && chooseArr.indexOf(i) === -1) {
				this.cardUpArr[i] = false;
				this.cardNodeArr[i].y -= this.upY;
			}
		}
		for (i = 0; i < chooseArr.length; ++i) {
			if (!this.cardUpArr[chooseArr[i]]) {
				this.cardUpArr[chooseArr[i]] = true;
				this.cardNodeArr[chooseArr[i]].y += this.upY;
			}
		}
	},
	/* 获取剩余的牌 */
	getRestCardArr(isindex = false) {
		var chooseArr = [];
		var i, canInsert;
		if (!this.cardArr) {
			// console.error("没有手牌==", this.cardArr)
			return
		}
		for (i = 0; i < this.cardArr.length; ++i) {
			canInsert = true;
			if (this.touCardArr.length > 0 && this.touCardArr.indexOf(i) !== -1) {
				canInsert = false;
			}
			if (this.zhongCardArr.length > 0 && this.zhongCardArr.indexOf(i) !== -1) {
				canInsert = false;
			}
			if (this.weiCardArr.length > 0 && this.weiCardArr.indexOf(i) !== -1) {
				canInsert = false;
			}
			if (canInsert) {
				if (isindex) {
					chooseArr.push(i);
				} else {
					chooseArr.push(this.cardArr[i]);
				}

			}
		}
		return chooseArr;
	},

	getCardNode(cardId) {
		var node = new cc.Node();
		var sprite = node.addComponent(cc.Sprite);
		AssetsManager.loadSpriteFrame({
			path: 'res/sprite/cards/' + cardId,
			sprite: sprite,
			bundle: Enums.bundleType.SSS
		}, () => {
			if (!node || !cc.isValid(node)) return;
			if (TWModel.getMapai(cardId)) {
				let maNode = new cc.Node();
				let maSprite = maNode.addComponent(cc.Sprite);
				maNode.parent = node;
				maNode.scaleX = 0.5;
				maNode.scaleY = 0.5;
				maNode.setPosition(cc.v2(-52, -29));
				AssetsManager.loadSpriteFrame({
					path: 'res/sprite/main/mapai',
					sprite: maSprite,
					bundle: Enums.bundleType.SSS
				});
			}
		});
		node.scaleX = 0.5;
		node.scaleY = 0.5;
		return node;
	},

	sendSortCard() {
		if (!this.verifySortCard()) {
			return
		}
		var cardArr = [],
			i;
		for (i = 0; i < this.touCardArr.length; ++i) {
			cardArr.push(this.cardArr[this.touCardArr[i]]);
		}
		for (i = 0; i < this.zhongCardArr.length; ++i) {
			cardArr.push(this.cardArr[this.zhongCardArr[i]]);
		}
		for (i = 0; i < this.weiCardArr.length; ++i) {
			cardArr.push(this.cardArr[this.weiCardArr[i]]);
		}
		ApiRoom.gameMessageNotify(ApiTw.getGameCardsSortRequestData(cardArr, Date.now()));
		this._isBaiPaiing = false;
		this.unscheduleAllCallbacks();

		this.node.active = false;
	},

	// 根据牌设置牌型
	setTypeNameByCards(cardArr, sprite) {
		var array = [];
		for (var i = 0; i < cardArr.length; ++i) {
			array.push(this.cardArr[cardArr[i]]);
		}
		var url = this.getTypeUrlByCardArr(array);
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: sprite,
			bundle: Enums.bundleType.SSS
		});
		sprite.node.active = true;
		// console.log("设置了牌型", url)
	},

	getTypeUrlByCardArr(array) {
		let typeArr = GameUtil.getAllHoldTypeWithNormal(array);
		let url = 'res/sprite/cardtype/sss_w_wulong';
		for (let name in typeArr) {
			if (typeArr[name]) {
				url = 'res/sprite/cardtype/sss_w_' + name;
				break;
			}
		}
		return url;
	},

	/**上面牌的选中响应 */
	onClickUpCard(event, param) {
		let n = event.node.name.split("_")
		let idx = parseInt(n[1])
		let btn = this.touButton
		let arr = this.touCardArr
		if (n[0] === "z") {
			btn = this.zhongButton
			arr = this.zhongCardArr
		} else if (n[0] === "w") {
			btn = this.weiButton
			arr = this.weiCardArr
		}
		/**找出点击的那张牌 */
		let children = btn.node.children
		let cardNode = children.find(c => {
			let list = c.name.split("_")
			let i = parseInt(list[1])
			return i == idx
		})
		if (idx !== this._selectCardIdx && this._selectCardIdx !== -1) {
			/**交换牌 */
			// console.log("j1")
			/**找出需要交换的那张牌 */
			/**同一道无法交换 */
			if (arr.includes(this._selectCardIdx)) {
				// console.log("同道无法交换")
				return
			}
			let jhbtn = this.touButton
			let jharr = this.touCardArr
			let jhname = "t"
			if (this.zhongCardArr.includes(this._selectCardIdx)) {
				jhbtn = this.zhongButton
				jharr = this.zhongCardArr
				jhname = "z"
			} else if (this.weiCardArr.includes(this._selectCardIdx)) {
				jhbtn = this.weiButton
				jharr = this.weiCardArr
				jhname = "w"
			}
			let del = arr.indexOf(idx)
			arr.splice(del, 1, this._selectCardIdx)
			del = jharr.indexOf(this._selectCardIdx)
			jharr.splice(del, 1, idx)
			this._selectCardIdx = -1
			/**刷新两道的牌 */
			this.updateUpCard(btn.node, arr, n[0])
			this.updateUpCard(jhbtn.node, jharr, jhname)
		} else if (idx === this._selectCardIdx) {
			/**取消选中 */
			// console.log("j2")
			this._selectCardIdx = -1
			cardNode.color = new cc.Color(255, 255, 255);
		} else if (this._selectCardIdx === -1) {
			// console.log("j3")
			/**如果有下方选中的牌，交换两个牌的位置 */
			if (this.jiaoHuanUpDownCard(btn.node, arr, n[0], idx)) {
				return
			}
			// console.log("j4")
			/**选中牌置灰 */
			// console.log("选中置灰牌", cardNode)
			this._selectCardIdx = idx
			cardNode.color = new cc.Color(200, 200, 200);
		}
	},

	/**
	 * 刷新某一道的牌
	 * @param {cc.Node} btnNode 父节点
	 * @param {Array<number>} cardArr 牌的idx数组
	 * @param {string} name 节点名字
	 */
	updateUpCard(btnNode, cardArr, name) {
		let cardWid = 87
		let buttonWidth = btnNode.width;
		btnNode.removeAllChildren()
		let cardCount = cardArr.length;
		let tmp = 4
		if (name === "t") {
			tmp = 2
		}
		let node, offx = (buttonWidth - cardWid) / tmp;
		for (i = 0; i < cardCount; ++i) {
			this.cardNodeArr[cardArr[i]].active = false;
			node = this.getCardNode(this.cardArr[cardArr[i]]);
			node.name = name + "_" + cardArr[i]
			node.parent = btnNode;
			node.x = cardWid / 2 + i * offx - buttonWidth / 2;
			/**添加牌的点击事件 */
			node.addComponent(cc.Button)
			node.on("click", this.onClickUpCard, this)
		}

		let typeSprite = this.touTypeSprite
		if (name === "z") {
			typeSprite = this.zhongTypeSprite
		} else if (name === "w") {
			typeSprite = this.weiTypeSprite
		}
		if (cardArr.length === tmp + 1) {
			this.setTypeNameByCards(cardArr, typeSprite);
		}
	},

	/**
	 * 交换上下的牌
	 * @param {cc.Node} btnNode 父节点
	 * @param {Array<number>} cardArr 牌的idx数组
	 * @param {string} name 节点名字
	 * @param {number} upCardIdx 选中的上面的牌
	 * @returns 
	 */
	jiaoHuanUpDownCard(btnNode, cardArr, name, upCardIdx) {
		var count = 0,
			cardIdx;
		for (let i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i]) {
				++count;
				cardIdx = i
			}
		}
		if (count === 1) {
			let idx = cardArr.indexOf(upCardIdx)
			cardArr.splice(idx, 1, cardIdx)
			this.updateUpCard(btnNode, cardArr, name)
			this.cardNodeArr[upCardIdx].active = true;
			this.sortRestCard()
			this.setTypeButton();

			let typeSprite = this.touTypeSprite
			let tmp = 3
			if (name === "z") {
				typeSprite = this.zhongTypeSprite
				tmp = 5
			} else if (name === "w") {
				typeSprite = this.weiTypeSprite
				tmp = 5
			}
			if (cardArr.length === tmp) {
				this.setTypeNameByCards(cardArr, typeSprite);
			}

			this._selectCardIdx = -1
			return true
		}
		return false
	},

	/**检查牌型是否可以提交 */
	checkIsCanShowCard() {
		if (this.touCardArr.length + this.zhongCardArr.length + this.weiCardArr.length === 13) {
			this.btnLayout.active = true
		} else {
			this.btnLayout.active = false
		}
	},

	/**重置上面牌的颜色 */
	resetUpCard() {
		let c1 = this.touButton.node.children
		let c2 = this.zhongButton.node.children
		let c3 = this.weiButton.node.children
		c1.forEach(node => {
			node.color = new cc.Color(255, 255, 255)
		});
		c2.forEach(node => {
			node.color = new cc.Color(255, 255, 255)
		});
		c3.forEach(node => {
			node.color = new cc.Color(255, 255, 255)
		});
		this._selectCardIdx = -1
	}
});