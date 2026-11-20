const MessageCallback = require('../../utils/MessageCallback');
const AssetsManager = require('../../utils/AssetsManager');
const Enums = require('../../const/Enums');
const ConfigModel = require('../../model/ConfigModel');
const UserModel = require('../../model/UserModel');
const AudioUtil = require('../../../src/utils/AudioUtil');
const tips = `默认HALL\nHALL>大厅\nUNION>联盟\nGAME>游戏\nMAHJONG>麻将\nPOKER>多人扑克 如：跑得快、斗地主等\nCIRCLE>百人场 如：牛牛、金花等\nTEXAS>带入场 如：德州、扯旋等`;

cc.Class({
    extends: cc.Component,

    properties: {
        bgNode: {
            type: cc.Node,
            default: null,
            tooltip: "场景背景",
            displayName: "背景节点"
        },
        sceneType: {
            tooltip: `场景类型:${tips}`,
            default: Enums.bundleType.NONE,
            type: Enums.bundleType,
            displayName: "背景图片"
        },
        musicType: {
            tooltip: `音乐类型:${tips}`,
            default: Enums.bundleType.NONE,
            type: Enums.bundleType,
            displayName: "背景音乐"
        },
        autoPlay: {
            default: true,
            tooltip: "音乐播放》默认开启",
            displayName: "自动播放"
        },
    },

    onLoad() {
        this._canvasFit();
    },

    start() {
        MessageCallback.addListener('UpdateSceneBgm', this);
        MessageCallback.addListener('UpdateSceneBg', this);
        this._bgsFit();
        this._bgmSync();
        this._bgsSync();
    },

    messageCallbackHandler(route, msg) {
        if (route == 'UpdateSceneBgm') {
            this._bgmSync();
        } else if (route == 'UpdateSceneBg') {
            this._bgsSync();
        }
    },

    setPlay(isPlay) {
        this.autoPlay = isPlay;
    },

    getPlay() {
        return !!this.autoPlay;
    },

    _bgmSync() {
        if (this.musicType == Enums.bundleType.NONE) return;
        if (!this.autoPlay) return;
        AudioUtil.stopAll();
        let sceneUrl = null;
        let sceneBgm = ConfigModel.getMusicId(this.musicType);
        if (this.musicType == Enums.bundleType.HALL) {
            sceneUrl = `audio/common/hall_bg_music${sceneBgm}`;
        } else if (this.musicType == Enums.bundleType.MAHJONG) {
            sceneUrl = `audio/common/mahjong_game_bgm${sceneBgm}`;
        } else if (this.musicType == Enums.bundleType.POKER) {
            // 三人场
            sceneUrl = `audio/common/pdk_game_bgm${sceneBgm}`;
        } else if (this.musicType == Enums.bundleType.CIRCLE) {
            // 多人场
            sceneUrl = `audio/common/nn_game_bgm${sceneBgm}`;
        } else if (this.musicType == Enums.bundleType.TEXAS) {
            // 扯旋等
            sceneUrl = `audio/common/nn_game_bgm${sceneBgm}`;
        } else {
            if (!this.musicType) return;
            sceneUrl = `audio/common/game_bgm${this.musicType}`;
        }
        if (!!sceneUrl) {
            AssetsManager.playMusic({
                path: sceneUrl
            });
        }
    },

    _bgsSync() {
        if (!this.bgNode || !this.bgNode.getComponent(cc.Sprite)) return;
        if (this.sceneType == Enums.bundleType.NONE) return;
        let sceneUrl = '';
        let sceneBg = ConfigModel.getSceneId(this.sceneType);
        if (this.sceneType == Enums.bundleType.POKER) {
            sceneUrl = `sprite/scenes/poker_square_bg${sceneBg}`;
        } else if (this.sceneType == Enums.bundleType.MAHJONG) {
            sceneUrl = `sprite/scenes/mahjong_bg${sceneBg}`;
        } else if (this.sceneType == Enums.bundleType.CIRCLE) {
            sceneUrl = `sprite/scenes/poker_circle_bg${sceneBg}`;
        } else if (this.sceneType == Enums.bundleType.HALL) {
            sceneUrl = `res/sprite/hallbg/hall${sceneBg}`;
        } else if (this.sceneType == Enums.bundleType.UNION) {
            sceneUrl = `res/sprite/unionbg/union${sceneBg}`;
        }
        let bundle = null;
        if (this.sceneType == Enums.bundleType.HALL) {
            bundle = ConfigModel.getSkin(Enums.bundleType.HALL);
        } else if (this.sceneType == Enums.bundleType.UNION) {
            bundle = ConfigModel.getSkin(Enums.bundleType.UNION);
        }
        AssetsManager.loadSpriteFrame({
            path: sceneUrl,
            bundle: bundle,
            sprite: this.bgNode.getComponent(cc.Sprite)
        });
    },

    /**
     * 场景Canvas适配
     * @returns 
     */
    _canvasFit() {
        let canvas = this.node.getComponent(cc.Canvas);
        if (!canvas) return;
        let designFrameSize = cc.view.getDesignResolutionSize();
        let designFrameRate = designFrameSize.width / designFrameSize.height;
        let deviceFrameSize = cc.sys.isBrowser ? cc.view.getCanvasSize() : cc.view.getFrameSize();
        let deviceFrameRate = deviceFrameSize.width / deviceFrameSize.height;
        canvas.fitHeight = deviceFrameRate >= designFrameRate;
        canvas.fitWidth = deviceFrameRate < designFrameRate;
    },

    /**
     * 背景图适配
     */
    _bgsFit() {
        if (!this.bgNode) return;
        //须确保初始设计图大于或等于设计尺寸
        if (this.bgNode.getComponent(cc.Widget)) this.bgNode.removeComponent(cc.Widget);
        let designSize = cc.view.getDesignResolutionSize();
        let designRate = designSize.width / designSize.height;
        let nodeSize = this.bgNode.getContentSize();
        let deviceSize = cc.sys.isBrowser ? cc.view.getCanvasSize() : cc.view.getFrameSize();
        let deviceRate = deviceSize.width / deviceSize.height;
        let fitHeight = deviceRate >= designRate;
        let fitRate = 1;
        if (!!fitHeight) {
            fitRate = deviceSize.width / (nodeSize.width * (deviceSize.height / designSize.height));
        } else {
            fitRate = deviceSize.height / (nodeSize.height * (deviceSize.width / designSize.width));
        }
        this.bgNode.scale = fitRate < 1 ? 1 : fitRate;
    },

    onDestroy() {
        AudioUtil.stopAll();
        MessageCallback.removeListener('UpdateSceneBgm', this);
        MessageCallback.removeListener('UpdateSceneBg', this);
    },


});