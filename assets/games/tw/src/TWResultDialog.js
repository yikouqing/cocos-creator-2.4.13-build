const TWModel = require('./TWModel');
const TWLogic = require('./TWLogic');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const GameUtil = require('./TWUtil');
const ApiTw = require('./ApiTw');

cc.Class({
	extends: cc.Component,
	properties: {
		itemNode: cc.Node,
		layout: cc.Node,
		bureau: cc.Label,
		resbtn: cc.Node,
		revbtn: cc.Node,
		t_win: cc.Node,
		t_lose: cc.Node,
		tog_qiepai: cc.Toggle,
	},

	onLoad() {
		this.curIndex = 0;
		this.list = this.node.nodeParams.list;
		// this.refrushLayout();
		// console.log(this.node.nodeParams)
		MessageCallback.addListener('RemoveGameResult', this);
		this.itemNode.active = false
		this.t_win.active = false
		this.t_lose.active = false
		if (this.list) {
			this.revbtn.active = true
			this.refrushLayout();
		} else {
			this.resbtn.active = true
			this.showResult()
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RemoveGameResult', this);
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RemoveGameResult') {
			this.node.destroy();
		}
	},

	showResult() {
		this.layout.removeAllChildren();
		let resData = this.node.nodeParams.result;
		// console.log("resData", resData)
		this.mapai = resData.mapai;
		// console.log("mapi,", this.mapai);
		let myUid = UserModel.getData("uid")
		let loser = {
			score: 0,
			uid: 0
		}
		for (let i = 0; i < resData.userList.length; i++) {
			if (!resData.userList[i]) {
				continue;
			}
			let node = cc.instantiate(this.itemNode);
			node.active = true;
			const score = resData.totalScore[i]; //总积分
			/**手牌 */
			let idx = 0
			const cardArr = resData.cardsArr[i]
			for (let j = 0; j < 3; ++j) {
				let cardNode = cc.find('tou', node).children[idx];
				this.setMaPaiColor(cardNode, cardArr[j]);
				AssetsManager.loadSpriteFrame({
					path: 'res/sprite/cards/' + cardArr[j],
					sprite: cardNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
				idx++
			}
			idx = 0
			for (let k = 3; k < 8; ++k) {
				let cardNode = cc.find('zhong', node).children[idx];
				this.setMaPaiColor(cardNode, cardArr[k]);
				AssetsManager.loadSpriteFrame({
					path: 'res/sprite/cards/' + cardArr[k],
					sprite: cardNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
				idx++
			}
			idx = 0
			for (let l = 8; l < 13; ++l) {
				let cardNode = cc.find('wei', node).children[idx];
				this.setMaPaiColor(cardNode, cardArr[l]);
				AssetsManager.loadSpriteFrame({
					path: 'res/sprite/cards/' + cardArr[l],
					sprite: cardNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
				idx++
			}

			/**牌型 */
			let tsNode = cc.find('cardtype', node)
			let ttNode = cc.find('toucardtype', node);
			let ztNode = cc.find('zhongcardtype', node);
			let wtNode = cc.find('weicardtype', node);
			tsNode.active = false
			ttNode.active = false
			ztNode.active = false
			wtNode.active = false
			//chairId, score, teShuType
			let teshu = resData.teShuSort.find(t => {
				return t.chairId == i
			})
			if (teshu) {
				tsNode.active = true
				let url = 'res/sprite/cardtype/' + teshu.teShuType;
				AssetsManager.loadSpriteFrame({
					path: url,
					sprite: tsNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
			} else {
				ttNode.active = true
				ztNode.active = true
				wtNode.active = true
				let t1 = resData.touSort.find(t => {
					return t.chairId == i
				})
				AssetsManager.loadSpriteFrame({
					path: 'res/sprite/cardtype/sss_w_' + t1.type,
					sprite: ttNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
				let t2 = resData.zhongSort.find(t => {
					return t.chairId == i
				})
				AssetsManager.loadSpriteFrame({
					path: 'res/sprite/cardtype/sss_w_' + t2.type,
					sprite: ztNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
				let t3 = resData.weiSort.find(t => {
					return t.chairId == i
				})
				AssetsManager.loadSpriteFrame({
					path: 'res/sprite/cardtype/sss_w_' + t3.type,
					sprite: wtNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
			}

			let data = resData.userList[i]
			/**用户信息 */
			if (parseInt(myUid) === parseInt(data.uid)) {
				this.setTitle(score > 0)
				/**播放音乐 */
				let url = "res/audio/win"
				if (score <= 0) {
					url = "res/audio/lose"
				}
				AssetsManager.playEffect({
					path: url,
					bundle: Enums.bundleType.SSS
				});
			}
			/**头像 */
			AssetsManager.loadSpriteFrame({
				path: data.avatar,
				sprite: cc.find('avatar', node).getComponent(cc.Sprite)
			});
			/**名字 */
			cc.find('name', node).getComponent(cc.Label).string = data.nickname;
			cc.find('id', node).getComponent(cc.Label).string = data.uid;

			/**分数 */
			let winNode = cc.find('win', node);
			let loseNode = cc.find('lose', node);
			if (score > 0) {
				winNode.active = true;
				loseNode.active = false
				winNode.getComponent(cc.Label).string = '+' + Utils.formatNumberWithDecimal(score, 1);
			} else {
				if (score <= loser.score) { //记录最低分
					loser.score = score
					loser.uid = data.uid
				}
				loseNode.active = true;
				winNode.active = false
				loseNode.getComponent(cc.Label).string = Utils.formatNumberWithDecimal(score, 1);
			}

			node.parent = this.layout;
		}

		if (loser.uid == myUid && TWModel.getCurBureau() != TWModel.getMaxBureau()) { //输的最多的人显示切牌选择
			this.tog_qiepai.node.active = true
		} else this.tog_qiepai.node.active = false
	},

	refrushLayout() {
		this.bureau.string = this.curIndex + 1;
		let dataArray = this.list[this.curIndex];
		for (let node of this.layout.children) {
			node.destroy();
		}
		let myUid = UserModel.getData("uid")
		for (let i = 0; i < dataArray.length; ++i) {
			let data = dataArray[i];
			let node = cc.instantiate(this.itemNode);
			node.active = true;
			// cc.find('bg1', node).active = (i % 2 == 0);
			// cc.find('bg2', node).active = (i % 2 == 1);
			let touArr = TWLogic.getTouArr(data.cards);
			let zhongArr = TWLogic.getZhongArr(data.cards);
			let weiArr = TWLogic.getWeiArr(data.cards);
			this.mapai = data.mapai;
			for (let j = 0; j < touArr.length; ++j) {
				let cardNode = cc.find('tou', node).children[j];
				this.setMaPaiColor(cardNode, touArr[j]);
				AssetsManager.loadSpriteFrame({
					path: 'res/sprite/cards/' + touArr[j],
					sprite: cardNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
			}
			for (let k = 0; k < zhongArr.length; ++k) {
				let cardNode = cc.find('zhong', node).children[k];
				this.setMaPaiColor(cardNode, zhongArr[k]);
				AssetsManager.loadSpriteFrame({
					path: 'res/sprite/cards/' + zhongArr[k],
					sprite: cardNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
			}
			for (let l = 0; l < weiArr.length; ++l) {
				let cardNode = cc.find('wei', node).children[l];
				this.setMaPaiColor(cardNode, weiArr[l]);
				AssetsManager.loadSpriteFrame({
					path: 'res/sprite/cards/' + weiArr[l],
					sprite: cardNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
			}

			if (data.isNosort) {
				let type = TWLogic.getTeShuPaiCardType(data.cards);
				let url = 'res/sprite/cardtype/' + type;
				AssetsManager.loadSpriteFrame({
					path: url,
					sprite: cc.find('cardtype', node).getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
				cc.find("toucardtype", node).active = false;
				cc.find("zhongcardtype", node).active = false;
				cc.find("weicardtype", node).active = false;
			} else {
				cc.find('cardtype', node).active = false;
				let toucardtype = cc.find('toucardtype', node);
				let zhongcardtype = cc.find('zhongcardtype', node);
				let weicardtype = cc.find('weicardtype', node);
				AssetsManager.loadSpriteFrame({
					path: this.getTypeUrl(touArr),
					sprite: toucardtype.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
				AssetsManager.loadSpriteFrame({
					path: this.getTypeUrl(zhongArr),
					sprite: zhongcardtype.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
				AssetsManager.loadSpriteFrame({
					path: this.getTypeUrl(weiArr),
					sprite: weicardtype.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SSS
				});
			}

			// let stateNode = cc.find('state', node);
			// let stateUrl = 'res/sprite/cardtype/' + ['buqiang', 'qiang1', 'qiang2', 'qiang3', 'qiang4'][data.rob || 0];
			// AssetsManager.loadSpriteFrame({
			// 	path: stateUrl,
			// 	sprite: stateNode.getComponent(cc.Sprite),
			// 	bundle: Enums.bundleType.SSS
			// });
			// cc.find('pour', node).getComponent(cc.Label).string = 0;
			let winNode = cc.find('win', node);
			let loseNode = cc.find('lose', node);
			if (data.winScore > 0) {
				winNode.active = true;
				loseNode.active = false
				winNode.getComponent(cc.Label).string = '+' + Utils.formatNumberWithDecimal(data.winScore, 1);
			} else {
				loseNode.active = true;
				winNode.active = false
				loseNode.getComponent(cc.Label).string = Utils.formatNumberWithDecimal(data.winScore, 1);
			}
			if (parseInt(myUid) === parseInt(data.uid)) {
				this.setTitle(data.winScore > 0)
			}
			AssetsManager.loadSpriteFrame({
				path: data.avatar,
				sprite: cc.find('avatar', node).getComponent(cc.Sprite)
			});
			cc.find('name', node).getComponent(cc.Label).string = data.nickname;
			// cc.find('banker', node).active = data.isBanker;
			node.parent = this.layout;
		}
	},

	setTitle(isWin) {
		this.t_win.active = isWin
		this.t_lose.active = !isWin
	},

	setMaPaiColor(node, cards) {
		// if (this.mapai == cards) {
		// 	node.color = new cc.Color(241, 209, 234);
		// } else {
		// 	node.color = new cc.Color(255, 255, 255);
		// }
		if (this.mapai === false) {
			cc.find("ma", node).active = false
		} else
			cc.find("ma", node).active = this.mapai == cards
	},
	onLeftClick() {

		--this.curIndex;
		if (this.curIndex < 0) {
			this.curIndex = this.list.length - 1;
		}
		this.refrushLayout();
	},

	onRightClick() {

		++this.curIndex;
		if (this.curIndex >= this.list.length) {
			this.curIndex = 0;
		}
		this.refrushLayout();
	},

	onReady() {
		// console.log("当前局数==", TWModel.getCurBureau())
		// console.log("最大局数==", TWModel.getMaxBureau())
		if (TWModel.getCurBureau() === TWModel.getMaxBureau()) {
			this.node.destroy();
			return;
		}
		if (!!TWModel.getAllResultInfo()) {
			this.node.destroy();
		} else {
			if (this.tog_qiepai.node.active && this.tog_qiepai.isChecked) {
				ApiRoom.gameMessageNotify(ApiTw.gameUserChooseWashNotify());
			}
			ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
			this.node.destroy()
		}
	},

	onClose() {

		this.node.destroy();
	},

	getTypeUrl(cards) {
		let typeArr = GameUtil.getAllHoldTypeWithNormal(cards);
		let url = 'res/sprite/cardtype/sss_w_wulong';
		for (let name in typeArr) {
			if (typeArr[name]) {
				url = 'res/sprite/cardtype/sss_w_' + name;
				break;
			}
		}
		return url;
	},
});