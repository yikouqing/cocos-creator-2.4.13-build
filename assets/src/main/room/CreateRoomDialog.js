const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const MessageCallback = require('../../utils/MessageCallback');
const ApiHall = require('../../api/ApiHall');
const Utils = require('../../utils/Utils');
const Events = require('../../const/Events');
const ABManager = require('../../utils/ABManager');
const SubManager = require('../../utils/SubManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');

cc.Class({
	extends: cc.Component,

	properties: {
		classTogs: [cc.Toggle],
		classTogLay: cc.Node,
		mainRuleLay: cc.Node,//通用规则
		gameTogList: cc.Node, //游戏类型列表
		gameRuleList: cc.Node, //游戏创建规则
		btnOk: cc.Node, //按钮-设置游戏
		btnCreate: cc.Node, //按钮-创建游戏
		titleCreate: cc.Node, //标题-创建游戏
		titleAdd: cc.Node, //标题-设置游戏
		btnAdd: cc.Node, //添加玩法
		btnLoad: cc.Node, //加载游戏
		unLoadGameTip: cc.Label, //游戏未加载提示
		loadProgressLay: cc.Node,
		loadProgress: cc.ProgressBar,
		loadProgressLbl: cc.Label,
		btnUnionSet: cc.Node, //联盟设置
		yuYinTog: cc.Toggle,
		gpsTog: cc.Toggle,
		zuoBiTog: cc.Toggle,
		tongJiTog: cc.Toggle,
		readyKickTog: cc.Toggle,
		chatInputTog: cc.Toggle,
		unDismissTog: cc.Toggle,
		zuoBiEdit: cc.EditBox,

		_gameRule: null, //规则
		_isUnion: false, //是否是联盟设置
		_unionInfo: null,
		_gameRuleNodes: [], //创建页面的规则表单
		_gameSelectedType: -1,
		_selectedGameRule: null,
		_unionRule: null,
		_baseRule: null,
		_hallsSync: null,
		_classSelected: 0
	},

	onLoad() {
		cc.systemEvent.on(Events.clientEvents.onBundleDownloadProgress, this._onDownloadProgress, this); //下载中
		cc.systemEvent.on(Events.clientEvents.onBundleDownloadFinished, this._onUnpackageSuccess, this); //下载成功
		MessageCallback.emitMessage("BroadcastVisibleSync", false);
	},

	start() {
		this._init();
	},

	_init() {
		this._unionInfo = !!this.node.nodeParams && !!this.node.nodeParams.unionInfo ? this.node.nodeParams.unionInfo : null;
		this._classSelected = this.node.nodeParams.gameClass || Enums.bundleClass.NONE;
		this._hasDesignTarget = !!this.node.nodeParams.gameRule || !!this.node.nodeParams.gameType || !!this.node.nodeParams.gameClass;
		let showGameList = this.node.nodeParams.showGameList;
		ConfigModel.setData('showGameList', showGameList || null);
		this.btnUnionSet.active = false;
		this._unionRule = {
			scoreDismissLimit: 100,
			scoreLowLimit: 1000,
			fixScore: 0,
			baseScale: 1,
			tableStyleType: 1,
			roomPayRule: {
				bigWinCount: -1,
				pumpWaterPattern: true,
				percentScore: 0,
				isAvg: false,
				rebateType: 'all',
				bigWinCount: 1
			}
		}
		//联盟的普通模式不需要准入分和解散分
		if (this._unionInfo && this._unionInfo.unionType == Enums.UnionType.NORMAL) {
			this._unionRule.scoreDismissLimit = 0;
			this._unionRule.scoreLowLimit = 0;
		}
		this._baseRule = {
			yuyin: false,
			wenzi: false,
			fangzuobi: false,
			distanceLimit: 100,
			showGps: false,
			tongji: false,
			canNotDissmiss: false,
			unReadyKick: 0
		}
		this._gameRuleNodes = [];
		let bundles = ConfigModel.getBundles();
		bundles.forEach(bundle => {
			let config = ConfigModel.getBundleConfig(bundle);
			if (!!config) {
				let game = {
					type: bundle,
					node: null
				};
				this._gameRuleNodes.push(game);
			}
		});
		this._isUnion = !!this.node.nodeParams && !!this.node.nodeParams.isUnion;
		this._hallsSync = !!this.node.nodeParams && !!this.node.nodeParams.hallsSync ? this.node.nodeParams.hallsSync : null;
		if (!!this._isUnion) {
			this._unionCallback = this.node.nodeParams.cb;
			this.titleAdd.active = true;
			this.titleCreate.active = false;
			this._gameRule = this.node.nodeParams.gameRule;
			if (!!this._gameRule) {
				this._gameSelectedType = this._gameRule.gameType;
				let selectedGame = ConfigModel.getBundleConfig(this._gameSelectedType);
				if (!!selectedGame) {
					this._classSelected = selectedGame.classify;
				} else {
					this._gameSelectedType = SubManager.getClassDefault(this._classSelected);
				}
			} else {
				this._gameSelectedType = SubManager.getClassDefault(this._classSelected);
			}
		} else {
			if (!!this.node.nodeParams && !!this.node.nodeParams.gameType) {
				this._gameSelectedType = this.node.nodeParams.gameType;
				let selectedGame = ConfigModel.getBundleConfig(this._gameSelectedType);
				if (!!selectedGame) {
					this._classSelected = selectedGame.classify;
				} else {
					this._gameSelectedType = SubManager.getClassDefault(this._classSelected);
				}
			} else {
				this._gameSelectedType = SubManager.getClassDefault(this._classSelected);
			}
			this.titleAdd.active = false;
			this.titleCreate.active = true;
		}
		if (!!SubManager.checkBundle(this._gameSelectedType)) {
			if (!ConfigModel.canCreate(this._gameSelectedType)) {
				this._gameSelectedType = SubManager.getClassDefault(this._classSelected);
			}
			if (!SubManager.checkBundle(this._gameSelectedType)) {
				SubManager.addBundle(this._gameSelectedType);
			}
		} else {
			this._gameSelectedType = SubManager.getClassDefault(this._classSelected);
			SubManager.addBundle(this._gameSelectedType);
		}
		this.btnAdd.active = !this._gameRule && !!ConfigModel.getData("canAddGames");
		this.classTogLay.active = !this._hasDesignTarget;
		let gameClass = ConfigModel.getGameClasses();
		this._classSelected = this._classSelected || Enums.bundleClass.NONE; //初始默认为全部
		this.classTogs.forEach((tog, index, togs) => {
			if (!!tog && !!tog.node) tog.node.active = gameClass.includes(index);
		})
		if (this.classTogs[this._classSelected]) this.classTogs[this._classSelected].isChecked = true;
		this._updateTogs();
	},

	_onDownloadProgress(data) {
		let bundle = ConfigModel.getBundleConfig(data.bundle);
		if (!bundle) return;
		let deps = ConfigModel.getBundleDeps(data.bundle);
		if (bundle.type != this._gameSelectedType && !deps.includes(this._gameSelectedType)) return;
		let isLoaded = SubManager.checkLoad(this._gameSelectedType);
		if (isLoaded) return;
		this.btnLoad.active = false;
		this.loadProgressLay.active = true;
		this.loadProgress.progress = data.finish / data.total;
		this.loadProgressLbl.string = `${Utils.formatNumberWithDecimal((data.finish / data.total) * 100, 0)}%`;
		this.unLoadGameTip.string = '';
	},

	_onUnpackageSuccess(data) {
		let bundle = ConfigModel.getBundleConfig(data.bundle);
		if (!bundle) return;
		let deps = ConfigModel.getBundleDeps(data.bundle);
		if (bundle.type != this._gameSelectedType && !deps.includes(this._gameSelectedType)) return;
		this.loadProgressLay.active = false;
		this._baseRuleSync();
		this.loadProgress.progress = 0;
		this.loadProgressLbl.string = '';
		this.unLoadGameTip.string = '';
		this.addGameRuleNode();
	},

	//加载时调用
	setGameRule(type, node) {
		this._gameRuleNodes.forEach((rule, index, rules) => {
			if (rule.type == type) {
				this._gameRuleNodes[index].node = node;
			}
		});
	},

	updateGameRule(type) {
		this._gameRuleNodes.forEach((rule, index, rules) => {
			if (!!rule.node && !!cc.isValid(rule.node)) {
				rule.node.active = rule.type == type;
			}
		});
	},

	//加载时调用
	getGameRuleNode(type) {
		let node = null;
		for (const game of this._gameRuleNodes) {
			if (game.type == type) {
				node = game.node;
				break;
			}
		}
		return node;
	},

	//检测是否加载过游戏创建面板
	checkGameRuleNode(type) {
		let isValid = false;
		for (const game of this._gameRuleNodes) {
			if (game.type == type) {
				isValid = !!game.node && cc.isValid(game.node);
				break;
			}
		}
		return isValid;
	},

	_baseRuleSync() {
		let isLoaded = SubManager.checkLoad(this._gameSelectedType);
		let bundle = ConfigModel.getBundleConfig(this._gameSelectedType);
		let show = this.loadProgressLay.active;
		this.mainRuleLay.active = !show && !!isLoaded && (!!bundle && bundle.classify != Enums.bundleClass.BAIREN);
		if (!!show) return;
		// 只有盟主或者管理员能设置机器人数量
		const locationEnable = ConfigModel.getData('locationEnable');
		this.zuoBiTog.node.active = !!locationEnable;
		this.gpsTog.node.active = !!locationEnable;
		const voiceSpeaker = ConfigModel.getData('voiceSpeaker');
		this.yuYinTog.node.active = !!voiceSpeaker;
		if (!!this._gameRule && this._gameRule.gameType == this._gameSelectedType) {
			this._baseRule.yuyin = this._gameRule.yuyin;
			if (!voiceSpeaker) this._baseRule.yuyin = false;
			this.yuYinTog.isChecked = !!this._baseRule.yuyin;
			this._baseRule.wenzi = this._gameRule.wenzi;
			this.chatInputTog.isChecked = !this._baseRule.wenzi;
			if (!locationEnable) this._gameRule.fangzuobi = false;
			this._baseRule.fangzuobi = !!this._gameRule.fangzuobi;
			this.zuoBiTog.isChecked = !!this._baseRule.fangzuobi;
			if (!locationEnable) this._gameRule.showGps = false;
			this._baseRule.showGps = !!this._gameRule.showGps;
			this.gpsTog.isChecked = !!this._baseRule.showGps;
			this._baseRule.tongji = !!this._gameRule.tongji;
			this.tongJiTog.isChecked = !!this._baseRule.tongji;
			this._baseRule.unReadyKick = this._gameRule.unReadyKick;
			this.readyKickTog.isChecked = this._baseRule.unReadyKick == 10;
			this.zuoBiEdit.node.active = !!this._baseRule.fangzuobi;
			this._baseRule.distanceLimit = this._gameRule.distanceLimit || 100;
			this._baseRule.canNotDissmiss = this._gameRule.canNotDissmiss;
			this.unDismissTog.isChecked = this._gameRule.canNotDissmiss;
			this.zuoBiEdit.string = `${this._baseRule.distanceLimit}`;
		} else {
			let cacheRule = ConfigModel.getRoomCreateCache(this._gameSelectedType);
			this._baseRule.yuyin = cacheRule ? cacheRule.yuyin : false;
			if (!voiceSpeaker) this._baseRule.yuyin = false;
			this.yuYinTog.isChecked = !!this._baseRule.yuyin;
			this._baseRule.wenzi = cacheRule ? cacheRule.wenzi : false;
			this.chatInputTog.isChecked = !this._baseRule.wenzi;
			this._baseRule.fangzuobi = cacheRule ? cacheRule.fangzuobi : false;
			if (!locationEnable) this._baseRule.fangzuobi = false;
			this.zuoBiTog.isChecked = !!this._baseRule.fangzuobi;
			this._baseRule.showGps = cacheRule ? cacheRule.showGps : false;
			if (!locationEnable) this._baseRule.showGps = false;
			this.gpsTog.isChecked = !!this._baseRule.showGps;
			this._baseRule.tongji = cacheRule ? cacheRule.tongji : false;
			this._baseRule.canNotDissmiss = cacheRule ? cacheRule.canNotDissmiss : false
			this.unDismissTog.isChecked = this._baseRule.canNotDissmiss;
			this.tongJiTog.isChecked = !!this._baseRule.tongji;
			this._baseRule.unReadyKick = cacheRule ? cacheRule.unReadyKick : false;
			this.readyKickTog.isChecked = this._baseRule.unReadyKick == 10;
			this.zuoBiEdit.node.active = !!this._baseRule.fangzuobi;
			this._baseRule.distanceLimit = cacheRule ? cacheRule.distanceLimit || 100 : 100;
			this.zuoBiEdit.string = `${this._baseRule.distanceLimit}`;
		}
	},

	_updateTogs() {
		let games = [];
		if (!!this._hasDesignTarget) {
			games.push(this._gameSelectedType);
		} else {
			games = SubManager.getBundles(this._classSelected);
		}
		if (games.length == 0) {
			this.btnOk.active = false;
			this.btnCreate.active = false;
			this.btnUnionSet.active = false;
			this.gameTogList.destroyAllChildren();
			this._gameSelectedType = -1;
			this.loadProgressLay.active = false;
			this.unLoadGameTip.string = '您还没添加游戏';
			this.updateGameRule(-1);
			return;
		}
		if (!this._gameRule) {
			if (!SubManager.checkBundle(this._gameSelectedType)) {
				//如果模块被玩家删除了就指定一个新的选定类型模块
				this._gameSelectedType = SubManager.getClassDefault(this._classSelected);
			} else {
				let gameSelected = ConfigModel.getBundleConfig(this._gameSelectedType);
				if (!!gameSelected && gameSelected.classify != this._classSelected) {
					this._gameSelectedType = SubManager.getClassDefault(this._classSelected);
				}
			}
		}
		AssetsManager.loadAsset({
			path: 'res/prefab/main/room/GameTypeTog',
			aType: cc.Prefab,
			bundle: ConfigModel.getSkin()
		}, (item) => {
			if (!item || !cc.isValid(this.node)) return;
			this.gameTogList.destroyAllChildren();
			games = this.sortCheck(games);
			for (const game of games) {
				if (!ConfigModel.canCreate(game)) continue;
				let node = cc.instantiate(item);
				node.attr({
					nodeParams: {
						selectedType: this._gameSelectedType,
						type: game,
						click: this.gameClick.bind(this)
					}
				}); //设置初始化参数
				this.gameTogList.addChild(node);
				node.getComponent("GameTypeTog").create();
			}
		});
		this.addGameRuleNode();
	},

	sortCheck(games) {
		let enable = false;
		for (let index = 0; index < games.length; index++) {
			if (parseInt(games[index]) == parseInt(this._gameSelectedType)) {
				games.splice(index, 1);
				enable = true;
				break;
			}
		}
		if (!enable) return games;
		games.unshift(parseInt(this._gameSelectedType));
		return games;
	},

	gameClick(type) {
		if (this._gameSelectedType == type) return;
		this._gameSelectedType = type;
		this.addGameRuleNode();
	},

	addGameRuleNode() {
		// console.log("刷新---", this._gameSelectedType)
		let gameValid = this.checkGameRuleNode(this._gameSelectedType);
		let config = ConfigModel.getBundleConfig(this._gameSelectedType);
		let gameRuleNode = this.getGameRuleNode(this._gameSelectedType);
		this.updateGameRule(this._gameSelectedType);
		//检测游戏是否加载过
		let isLoaded = SubManager.checkLoad(this._gameSelectedType);
		let gameName = ConfigModel.getGameName(this._gameSelectedType);
		this.loadProgressLay.active = false;
		this.loadProgress.progress = 0;
		this.loadProgressLbl.string = '';
		if (!isLoaded) {
			this.mainRuleLay.active = false;
			this.btnOk.active = false;
			this.btnCreate.active = false;
			this.btnUnionSet.active = false;
			this.btnLoad.active = true;
			this.unLoadGameTip.string = `加载 ${gameName} 资源`;
			return;
		}
		this._baseRuleSync();
		this.btnOk.active = !!this._isUnion;
		this.btnCreate.active = !this.btnOk.active;
		this.btnUnionSet.active = this.btnOk.active && this.node.nodeParams.from == 'union' && !!this._unionInfo && this._unionInfo.unionType != Enums.UnionType.NORMAL;
		this.unLoadGameTip.string = '';
		this.btnLoad.active = false;
		if (!!gameValid &&
			!!config &&
			!!gameRuleNode &&
			!!this._gameRule &&
			this._gameRule.gameType == this._gameSelectedType) {
			gameRuleNode.getComponent(config.create).init(this._gameRule);
		} else {
			if (!gameValid && !!config) {
				let url = `res/prefab/main/room/${config.create}`;
				let loadType = this._gameSelectedType;
				AssetsManager.loadAsset({
					path: url,
					aType: cc.Prefab,
					bundle: ConfigModel.getSkin()
				}, (item) => {
					if (!item || !cc.isValid(this.node) || this.checkGameRuleNode(loadType)) return;
					let cacheRule = ConfigModel.getRoomCreateCache(loadType);
					let node = cc.instantiate(item);
					node.attr({
						nodeParams: {
							unionInfo: this._unionInfo,
							gameRule: !!this._gameRule && this._gameRule.gameType == this._gameSelectedType ? this._gameRule : cacheRule,
							isUnion: this._isUnion
						}
					});
					this.setGameRule(loadType, node);
					this.gameRuleList.addChild(node);
					this.updateGameRule(this._gameSelectedType);
				});
			}
		}
	},

	onRuleClick(event, param) {
		this._baseRule.yuyin = !!this.yuYinTog.isChecked;
		this._baseRule.wenzi = !this.chatInputTog.isChecked;
		this._baseRule.fangzuobi = !!this.zuoBiTog.isChecked;
		this._baseRule.showGps = !!this.gpsTog.isChecked;
		this._baseRule.tongji = !!this.tongJiTog.isChecked;
		this._baseRule.canNotDissmiss = !!this.unDismissTog.isChecked;
		this._baseRule.unReadyKick = !!this.readyKickTog.isChecked ? 10 : 0;
		this.zuoBiEdit.node.active = !!this._baseRule.fangzuobi;
		if (param === "distance") {
			let disEdit = this.zuoBiEdit.string;
			let disLimit = parseInt(disEdit);
			if (isNaN(disLimit) || disLimit < 100) {
				disLimit = 100;
			}
			this.zuoBiEdit.string = `${disLimit}`;
			this._baseRule.distanceLimit = disLimit;
		}
	},

	onBtnClk(event, param) {
		switch (param) {
			case 'close':
				if (this.node.getComponent('DialogWidgetCtrl')) {
					this.node.getComponent('DialogWidgetCtrl').out();
				} else {
					this.node.destroy();
				}
				break;
			case 'addGame':
				AssetsManager.createDialog({
					path: 'res/prefab/main/room/GameListDialog',
					bundle: ConfigModel.getSkin(),
					isUnion: this._isUnion,
					update: this._updateTogs.bind(this),
					hallsSync: this._hallsSync,
					selected: this._gameSelectedType
				});
				break;
			case 'loadGame':
				let game = ConfigModel.getBundleConfig(this._gameSelectedType);
				if (!game) {
					AssetsManager.tipDialog("读取资源配置错误！");
					return;
				}
				ABManager.addBundle(game.bundle);
				break;
			case 'createRoom':
				let gameRule = this._getGameRule(true);
				if (!gameRule) return;

				if (!!this._unionRule) {
					gameRule = Object.assign({}, gameRule, this._unionRule);
				}
				gameRule = Object.assign({}, gameRule, this._baseRule);
				ConfigModel.setRoomCreateCache(gameRule);
				let scoreLimit = ConfigModel.scoreLimit(gameRule.gameType);
				let bundle = ConfigModel.getBundleConfig(gameRule.gameType);
				if (!!this._isUnion) {
					if (!!this._unionInfo && this._unionInfo.unionType == Enums.UnionType.NORMAL && !!scoreLimit) {
						AssetsManager.tipDialog(`${bundle.name} 暂不支持无带入分模式~`);;
						return;
					}
					this._unionCallback && this._unionCallback(this.node, gameRule);
				} else {
					if (!gameRule.payType) gameRule.payType = Enums.roomPayType.AAZHIFU;
					if (!!ConfigModel.isLocked(gameRule.gameType)) {
						AssetsManager.tipDialog("游戏开发中，敬请期待！");
						return;
					}
					if (!!scoreLimit) {
						AssetsManager.tipDialog(`${bundle.name} 暂不支持无带入分模式~`);;
						return;
					}
					ApiHall.createRoomRequest({
						gameType: gameRule.gameType,
						gameRule: gameRule,
						gameRuleID: null,
						unionID: 1,
						roomID: null,
						createAndWatch: gameRule.createAndWatch
					});
				}
				break;
			case 'unionset':
				if (!this._isUnion) return;
				let unionGameRule = this._getGameRule(false);
				AssetsManager.createDialog({
					bundle: ConfigModel.getSkin(),
					path: "res/prefab/union/manager/UnionAddRuleDialog",
					gameRule: unionGameRule,
					unionInfo: this._unionInfo,
					cb: this.unionRule.bind(this),
					from: 'create'
				});
				break;
			case 'class0':
			case 'class1':
			case 'class2':
			case 'class3':
			case 'class4':
				let gameClass = parseInt(param.slice(5));
				if (this._classSelected == gameClass) return;
				this._classSelected = gameClass;
				this._updateTogs();
				break;
		}
	},

	_getGameRule(isCreate) {
		if (this._gameSelectedType == -1) {
			AssetsManager.tipDialog("您还没有选择游戏类型！");
			return;
		}
		let config = ConfigModel.getBundleConfig(this._gameSelectedType);
		let gameValid = this.checkGameRuleNode(this._gameSelectedType);
		let gameRuleNode = this.getGameRuleNode(this._gameSelectedType);
		if (!config || !gameValid || !gameRuleNode) {
			AssetsManager.tipDialog("无效的游戏配置！");
			return;
		}
		let comp = gameRuleNode.getComponent(config.create);
		if (!comp || !comp.getRule) {
			AssetsManager.tipDialog('获取游戏模块组件失败！');
			return;
		}
		let gameRule = comp.getRule();
		if (!gameRule) {
			AssetsManager.tipDialog('无效的游戏参数！');
			return;
		}
		if (!!isCreate) {
			if (gameRule.gameType == Enums.bundleType.DGN) {
				if (isNaN(gameRule.xiazhuangfen) || gameRule.xiazhuangfen <= 0) {
					AssetsManager.tipDialog("您还没有设置下庄分！");
					return null;
				}
			} else if (gameRule.gameType == Enums.bundleType.SSS) {
				let colors = 0
				for (let i = 0; i < 4; i++) {
					if (gameRule.colors[i]) colors++
				}
				if (gameRule.maxPlayerCount === 6 && colors != 2) {
					AssetsManager.tipDialog("6人必须加2色");
					return null;
				}
				if (gameRule.maxPlayerCount === 8 && colors != 4) {
					AssetsManager.tipDialog("8人必须加4色");
					return null;
				}
			} else if (gameRule.gameType == Enums.bundleType.DDZ) {
				if (!!gameRule.isLai && !gameRule.laiZiList.length) {
					AssetsManager.tipDialog(`癞子点数输入错误!请输入${1}-${13}的点数`);
					return null;
				}
			}
		}
		return gameRule;
	},

	unionRule(gameType, gameName, gameRule) {
		// console.log('规则-创建0', gameRule);
		gameRule.ruleName = gameName;
		this._unionRule = gameRule;
	},

	onDestroy() {
		MessageCallback.emitMessage("BroadcastVisibleSync", true);
		cc.systemEvent.off(Events.clientEvents.onBundleDownloadProgress, this._onDownloadProgress, this); //下载中
		cc.systemEvent.off(Events.clientEvents.onBundleDownloadFinished, this._onUnpackageSuccess, this); //下载成功
	}

});