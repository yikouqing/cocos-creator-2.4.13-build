const CJSJYModel = require('./CJSJYModel');
const ApiCjsjy = require('./ApiCjsjy');
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const NativeUtil = require('../../../src/utils/NativeUtil');

cc.Class({
	extends: cc.Component,
	properties: {
		headSprite: cc.Sprite,
		txt_name: cc.Label,
		txt_score: cc.Label,
		robSprite: cc.Sprite,
		txt_betScore: cc.Label,
		bankerNode: cc.Node,
		bankerNode1: cc.Node,
		readyNode: cc.Node,
		fangzhuNode: cc.Node,
		lightNode: cc.Node,
		playVoiceNode: cc.Node,
		totalScoreNode: cc.Node,
		txt_totalScore: cc.Label,
		txt_win: cc.Label,
		txt_lose: cc.Label,
		goldNode: cc.Node,
		betNode: cc.Node,
		offlineNode: cc.Node,
		txt_talk: cc.Node,

		_data: null,
		_inited: false,
	},

	onLoad() {
		this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
		this.txt_talk.parent.active = false
		this.setReady(false)
		this.setLight(false)
		this.setOffline(false)
		this.setBanker(false)
		this.setBetScore()
		this.setTotalScore(0)
		this.node.active = false
		this._winy = this.txt_win.node.y
		this._losey = this.txt_lose.node.y
	},

	init(user) {
		if (!user || this._inited) {
			return
		}
		this._data = user
		// console.log("初始化用户", this._data)
		this.setUserScore(user.userInfo.score)
		this.setTotalScore(CJSJYModel.getUserWinTotalScore())
		this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 6, '..');
		this.fangzhuNode.active = false
		AssetsManager.loadSpriteFrame({
			path: user.userInfo.avatar,
			sprite: this.headSprite
		});

		this.setReady(user.userStatus == ApiRoom.userStatusEnum.READY && !CJSJYModel.getGameStarted())
		this.setBanker(user.chairID === CJSJYModel.getBankerChairID() && CJSJYModel.getCurBureau() != 0)
		this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE)
		this.node.active = true
	},

	/**用户离开 */
	leave() {
		this._data = null
		this.node.active = false
	},

	/**设置离线 */
	setOffline(isShow) {
		if (cc.isValid(this.offlineNode))
			this.offlineNode.active = isShow
	},

	/**设置准备 */
	setReady(isShow) {
		if (cc.isValid(this.readyNode))
			this.readyNode.active = isShow
	},

	/**设置庄家 */
	setBanker(isShow) {
		if (cc.isValid(this.bankerNode))
			this.bankerNode.active = isShow
		if (cc.isValid(this.bankerNode1))
			this.bankerNode1.active = isShow
	},

	/**设置光 */
	setLight(isShow) {
		if (cc.isValid(this.lightNode)) {
			this.lightNode.active = isShow
		}
	},

	/**获取庄家图标 */
	getBanker() {
		return this.bankerNode
	},

	/**获取光图标 */
	getLight() {
		return this.lightNode
	},

	/**获取金币图标 */
	getGoldIcon() {
		return this.goldNode
	},
	setVoice(state) {
		this.playVoiceNode.active = state;
	},

	/**点击响应 */
	onHeadClick(event) {
		// console.log("点击了头像")
		if (!this._data) {
			return
		}
		if (CJSJYModel.getMyChairID() >= CJSJYModel.getChairCount()) {
			AssetsManager.tipDialog('观战玩家无法查看详细信息');
			return;
		}
		if (CCUtil.clickInterval(event.target, 0.5)) return;
		let user = this._data;
		let showHeadDetail = () => {
			try {
				let params = {
					fromChairID: CJSJYModel.getMyChairID(),
					toChairID: user.chairID,
					canSendGift: CJSJYModel.getMyChairID() < CJSJYModel.getChairCount(),
					avatar: user.userInfo.avatar,
					id: user.userInfo.uid,
					ip: user.userInfo.lastLoginIP,
					location: user.userInfo.location,
					gold: user.userInfo.score,
					name: user.userInfo.nickname,
				};
				AssetsManager.headDialog(params);
			} catch (e) { }
		}
		if (!!CJSJYModel.getUserTest() && !!user && !CJSJYModel.isInWatch()) {
			AssetsManager.createDialog({
				user: user,
				callback: showHeadDetail,
				bundle: Enums.bundleType.CJSJY,
				path: "res/prefab/CJSJYTestSelect",
			})
		} else {
			showHeadDetail();
		}
	},

	/**用户信息改变 */
	userInfoChange(data) {
		if (!this._data) {
			return
		}
		if (this._data.userInfo.uid == data.changeInfo.uid) {
			// console.log("用户信息变化==", data.changeInfo)
			for (let key in data.changeInfo) {
				this._data.userInfo[key] = data.changeInfo[key];
			}
			this.setUserScore(this._data.userInfo.score)
		}
	},

	setUserScore(s) {
		if (CJSJYModel.scoreState() == 1) return;
		if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
	},

	/**设置总输赢分数 */
	setTotalScore(userWinTotalScore) {
		let ss = CJSJYModel.scoreState()
		if (ss == 0) {
			this.totalScoreNode.active = false
			return
		}
		if (cc.isValid(this.totalScoreNode) && ss) {
			if (userWinTotalScore && this._data) {
				let s = userWinTotalScore[this._data.chairID];
				let num = Utils.formatNumberWithDecimal(s, 1);
				if (ss == 1) {
					this.totalScoreNode.active = false;
					this.txt_score.string = num;
					this.txt_score.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
					return
				}
				if (typeof (s) == "number") {
					if (s >= 0) {
						this.txt_totalScore.node.color = new cc.Color().fromHEX("#00F105")
					} else {
						this.txt_totalScore.node.color = new cc.Color().fromHEX("#FF0000")
					}
					this.totalScoreNode.active = true
					this.txt_totalScore.string = Utils.formatNumberWithDecimal(s, 1) + ""
				} else {
					this.txt_totalScore.string = '0';
				}
			} else {
				this.txt_totalScore.string = '0';
			}
		}
	},

	/*
	 * 设置抢庄倍数
	 */
	setRobScale(isShow = false) {
		this.robSprite.node.active = false;
		if (!this._data || !isShow) {
			return
		}
		let scale = CJSJYModel.getRobScaleByChairID(this._data.chairID);
		if (scale == null) {
			return;
		}
		if (CJSJYModel.getGameStatus() == ApiCjsjy.gameStatus.ROB_BANK && CJSJYModel.getBankerChairID() == null) {
			let url = 'res/sprite/robbank/' + scale;
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: this.robSprite,
				bundle: Enums.bundleType.CJSJY
			});
			this.robSprite.node.active = true;
		}
	},

	/**设置下注分数 */
	setBetScore(score, isAni = false) {
		if (score) {
			this.betNode.active = true
			this.txt_betScore.string = Utils.formatNumberWithDecimal(score)
			if (isAni) {
				let start_pos = this.headSprite.node.getPosition()
				let end_pos = CCUtil.postionConvert(this.goldNode, this.node)
				AssetsManager.playEffect({
					path: 'res/audio/main/fly_gold',
					bundle: Enums.bundleType.CJSJY
				});
				for (let i = 0; i < 10; ++i) {
					let node = cc.instantiate(this.goldNode);
					node.setPosition(start_pos);
					node.parent = this.node;
					cc.tween(node).delay(0.08 * i).to(0.3, {
						position: end_pos
					}).removeSelf().start()
				}
			}
		} else {
			this.betNode.active = false
		}
	},

	/**动画后展示分数 */
	setUserScoreAfterAni(totalScore) {
		if (!this._data) {
			return
		}
		// this.setUserScore(this._data.userInfo.score)
		this.txt_win.string = ""
		this.txt_lose.string = ""
		if (totalScore || totalScore == 0) {
			let winScore = totalScore
			let aniNode = null
			let endY = 0
			if (winScore > 0) {
				this.txt_win.string = "+" + Utils.formatNumberWithDecimal(winScore, 1)
				aniNode = this.txt_win.node
				endY = this._winy
			} else {
				this.txt_lose.string = "" + Utils.formatNumberWithDecimal(winScore, 1)
				aniNode = this.txt_lose.node
				endY = this._losey
			}
			aniNode.stopAllActions()
			aniNode.y = -100
			aniNode.scale = 0
			cc.tween(aniNode).to(0.2, {
				y: endY,
				scale: 1
			}, {
				easing: "backOut"
			}).start()
		}
	},

	/*
	 * 游戏聊天
	 */
	gameChat(data) {
		data.user = this._data
		CCUtil.gameChat(data, this.txt_talk, this.headSprite.node, this.node)
	},

	/**设置输赢分数 */
	setResScore(s = null) {
		if (s == null) {
			this.txt_win.string = ""
			this.txt_lose.string = ""
			return
		}
		let score = Math.floor(s)
		if (score >= 0) {
			this.txt_win.node.active = true
			this.txt_win.string = "+" + Utils.formatNumberWithDecimal(score, 1)
			this.txt_lose.string = ""
		} else {
			this.txt_win.string = ""
			this.txt_lose.string = "" + Utils.formatNumberWithDecimal(score, 1)
			this.txt_lose.node.active = true
		}
	},

	reset() {
		this.setRobScale()
		this.setLight(false)
		this.setBetScore()
		this.setResScore()
		this.setReady(false)
		this.setBanker(false)
	},
});