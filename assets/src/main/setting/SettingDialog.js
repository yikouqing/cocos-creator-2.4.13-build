const MessageCallback = require('../../utils/MessageCallback');
const AssetsManager = require('../../utils/AssetsManager');
const AudioUtil = require('../../utils/AudioUtil');
const ConfigModel = require('../../model/ConfigModel');
const CacheManager = require('../../utils/CacheManager');
const ABManager = require('../../utils/ABManager');
const Enums = require('../../const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        progressMusic: cc.ProgressBar,
        sliderMusic: cc.Slider,
        progressSound: cc.ProgressBar,
        sliderSound: cc.Slider,
        hallMusicNode: cc.Node,
        hallBgNode: cc.Node,
        unionBgNode: cc.Node,
        gameMusicNode: cc.Node,
        cardBgNode: cc.Node,
        mjBgNode: cc.Node,
        mjClickNode: cc.Node,
        mahjongBgNode: cc.Node,
        pokerSquareBgNode: cc.Node,
        pokerRoundBgNode: cc.Node,
        resVerLabel: cc.Label,
        btnExit: cc.Node,
        musicTog: cc.Toggle,
        soundTog: cc.Toggle,
    },

    start() {
        if (this.hallBgNode) this.hallBgNode.active = false;
        let resVer = ConfigModel.getData('resVer') || '1.0.0';
        if (!!this.node.nodeParams && this.node.nodeParams.gameType && !cc.sys.isBrowser) {
            resVer = ABManager.getBundleVersion(this.node.nodeParams.gameType);
        }
        if (this.resVerLabel) this.resVerLabel.string = `Res.${resVer}`;
        if (this.musicTog && this.soundTog) {
            this.musicTog.isChecked = !AudioUtil.isMusicMute()
            this.soundTog.isChecked = !AudioUtil.isEffectMute()
        }
        this.volumeSync();
        this.selectMask = true;
        let type = "hall";
        if (!!this.node.nodeParams) {
            type = this.node.nodeParams.type || "hall";
        }
        if (type === 'union') {
            if (this.unionBgNode) this.unionBgNode.active = false;
            let unionBg = ConfigModel.getSceneId(Enums.bundleType.UNION);
            let unionBgNode = this.unionBgNode.getChildByName("ToggleContainer");
            let unionBgToggleNode = unionBgNode.getChildByName(`toggle${unionBg}`);
            if (!!unionBgToggleNode) {
                unionBgToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
            if (this.hallMusicNode) this.hallMusicNode.active = true;
            let hallMusic = ConfigModel.getMusicId(Enums.bundleType.HALL);
            let hallMusicNode = this.hallMusicNode.getChildByName("ToggleContainer");
            let hallMusicToggleNode = hallMusicNode.getChildByName(`toggle${hallMusic}`);
            if (!!hallMusicToggleNode) {
                hallMusicToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
        } else if (type === 'round') { //扑克对局
            if (this.gameMusicNode) this.gameMusicNode.active = true;
            if (this.hallMusicNode) this.hallMusicNode.active = false;
            let gameMusic = ConfigModel.getMusicId(Enums.bundleType.POKER);
            let gameMusicNode = this.gameMusicNode.getChildByName("ToggleContainer");
            let gameMusicToggleNode = gameMusicNode.getChildByName(`toggle${gameMusic}`);
            if (!!gameMusicToggleNode) {
                gameMusicToggleNode.getComponent(cc.Toggle).isChecked = true;
            }

            if (this.cardBgNode) this.cardBgNode.active = true;
            let cardBg = ConfigModel.getCardBackId(Enums.cardStyleType.POKER);
            let cardBgNode = this.cardBgNode.getChildByName("ToggleContainer");
            let cardBgToggleNode = cardBgNode.getChildByName(`toggle${cardBg}`);
            if (!!cardBgToggleNode) {
                cardBgToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
            if (this.pokerSquareBgNode) this.pokerSquareBgNode.active = true;
            if (this.pokerRoundBgNode) this.pokerRoundBgNode.active = false;
            if (this.mahjongBgNode) this.mahjongBgNode.active = false;
            let gameBg = ConfigModel.getSceneId(Enums.bundleType.POKER);
            let gameBgNode = this.pokerSquareBgNode.getChildByName("ToggleContainer");
            let gameBgToggleNode = gameBgNode.getChildByName(`toggle${gameBg}`);
            if (!!gameBgToggleNode) {
                gameBgToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
        } else if (type === 'duoren') { //扑克多人
            if (this.gameMusicNode) this.gameMusicNode.active = true;
            if (this.hallMusicNode) this.hallMusicNode.active = false;
            let gameMusic = ConfigModel.getMusicId(Enums.bundleType.CIRCLE);
            let gameMusicNode = this.gameMusicNode.getChildByName("ToggleContainer");
            let gameMusicToggleNode = gameMusicNode.getChildByName(`toggle${gameMusic}`);
            if (!!gameMusicToggleNode) {
                gameMusicToggleNode.getComponent(cc.Toggle).isChecked = true;
            }

            if (this.cardBgNode) this.cardBgNode.active = true;
            let cardBg = ConfigModel.getCardBackId(Enums.cardStyleType.POKER);
            let cardBgNode = this.cardBgNode.getChildByName("ToggleContainer");
            let cardBgToggleNode = cardBgNode.getChildByName(`toggle${cardBg}`);
            if (!!cardBgToggleNode) {
                cardBgToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
            if (this.pokerRoundBgNode) this.pokerRoundBgNode.active = true;
            if (this.pokerSquareBgNode) this.pokerSquareBgNode.active = false;
            if (this.mahjongBgNode) this.mahjongBgNode.active = false;
            let gameBg = ConfigModel.getSceneId(Enums.bundleType.CIRCLE);
            let gameBgNode = this.pokerRoundBgNode.getChildByName("ToggleContainer");
            let gameBgToggleNode = gameBgNode.getChildByName(`toggle${gameBg}`);
            if (!!gameBgToggleNode) {
                gameBgToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
            if (this.node.nodeParams.gameType == Enums.bundleType.JGPTJ) {
                if (this.cardBgNode) this.cardBgNode.active = false;
            }
        } else if (type === 'mahjong') { //麻将牌背
            if (this.hallMusicNode) this.hallMusicNode.active = false;
            if (this.gameMusicNode) this.gameMusicNode.active = true;
            let gameMusic = ConfigModel.getMusicId(Enums.bundleType.MAHJONG);
            let gameMusicNode = this.gameMusicNode.getChildByName("ToggleContainer");
            let gameMusicToggleNode = gameMusicNode.getChildByName(`toggle${gameMusic}`);
            if (!!gameMusicToggleNode) {
                gameMusicToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
            if (this.mjBgNode) this.mjBgNode.active = true;
            let mjBg = ConfigModel.getCardBackId(Enums.cardStyleType.MAHJONG);
            let mjBgNode = this.mjBgNode.getChildByName("ToggleContainer");
            let mjBgToggleNode = mjBgNode.getChildByName(`toggle${mjBg}`);
            if (!!mjBgToggleNode) {
                mjBgToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
            if (this.mahjongBgNode) this.mahjongBgNode.active = true;
            if (this.pokerRoundBgNode) this.pokerRoundBgNode.active = false;
            if (this.pokerSquareBgNode) this.pokerSquareBgNode.active = false;
            let gameBg = ConfigModel.getSceneId(Enums.bundleType.MAHJONG);
            let gameBgNode = this.mahjongBgNode.getChildByName("ToggleContainer");
            let gameBgToggleNode = gameBgNode.getChildByName(`toggle${gameBg}`);
            if (!!gameBgToggleNode) {
                gameBgToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
            if (this.mjClickNode) {
                this.mjClickNode.active = true;
                let mjClickNode = this.mjClickNode.getChildByName("ToggleContainer");
                let mjOutClickType = parseInt(CacheManager.getItem("mjOutClickType"));
                mjOutClickType = isNaN(mjOutClickType) ? 0 : mjOutClickType;
                let mjClickToggleNode = mjClickNode.getChildByName(`toggle${mjOutClickType}`);
                if (!!mjClickToggleNode) {
                    mjClickToggleNode.getComponent(cc.Toggle).isChecked = true;
                }
            }
        } else if (type === 'hall') {
            if (this.hallMusicNode) this.hallMusicNode.active = true;
            if (this.hallBgNode) this.hallBgNode.active = true;
            let hallMusic = ConfigModel.getMusicId(Enums.bundleType.HALL);
            let hallMusicNode = this.hallMusicNode.getChildByName("ToggleContainer");
            let hallMusicToggleNode = hallMusicNode.getChildByName(`toggle${hallMusic}`);
            if (!!hallMusicToggleNode) {
                hallMusicToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
            let hallBg = ConfigModel.getSceneId(Enums.bundleType.HALL);
            let hallBgNode = this.hallBgNode.getChildByName("ToggleContainer");
            let hallBgToggleNode = hallBgNode.getChildByName(`toggle${hallBg}`);
            if (!!hallBgToggleNode) {
                hallBgToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
        } else if (type === 'ttz') { //推筒子特殊处理
            if (this.hallMusicNode) this.hallMusicNode.active = false;
            if (this.gameMusicNode) this.gameMusicNode.active = true;
            let gameMusic = ConfigModel.getMusicId(Enums.bundleType.MAHJONG);
            let gameMusicNode = this.gameMusicNode.getChildByName("ToggleContainer");
            let gameMusicToggleNode = gameMusicNode.getChildByName(`toggle${gameMusic}`);
            if (!!gameMusicToggleNode) {
                gameMusicToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
            if (this.mjBgNode) this.mjBgNode.active = true;
            let mjBg = ConfigModel.getCardBackId(Enums.cardStyleType.MAHJONG);
            let mjBgNode = this.mjBgNode.getChildByName("ToggleContainer");
            let mjBgToggleNode = mjBgNode.getChildByName(`toggle${mjBg}`);
            if (!!mjBgToggleNode) {
                mjBgToggleNode.getComponent(cc.Toggle).isChecked = true;
            }

            if (this.pokerRoundBgNode) this.pokerRoundBgNode.active = true;
            if (this.pokerSquareBgNode) this.pokerSquareBgNode.active = false;
            if (this.mahjongBgNode) this.mahjongBgNode.active = false;
            let gameBg = ConfigModel.getSceneId(Enums.bundleType.CIRCLE);
            let gameBgNode = this.pokerRoundBgNode.getChildByName("ToggleContainer");
            let gameBgToggleNode = gameBgNode.getChildByName(`toggle${gameBg}`);
            if (!!gameBgToggleNode) {
                gameBgToggleNode.getComponent(cc.Toggle).isChecked = true;
            }
        }
        this.selectMask = false;
        if (this.btnExit) this.btnExit.active = false;
        this.onShowPageBg();
    },

    onShowPageBg() {
        let hallBgsList = this.hallBgNode.getChildByName("ToggleContainer");
        if (!hallBgsList) return;
        let hallBgs = hallBgsList.children;
        hallBgs.forEach((item, i) => {
            let background = item.getChildByName('Background')
            let path = `res/sprite/hallbg/hall${i + 1}`
            AssetsManager.loadSpriteFrame({
                bundle: ConfigModel.getSkin(Enums.bundleType.HALL),
                path: path,
                sprite: background.getComponent(cc.Sprite)
            })
        });
    },

    volumeSync() {
        let musicVolume = AudioUtil.getMusicVolume();
        let soundVolume = AudioUtil.getEffectVolume();
        if (this.progressMusic) this.progressMusic.progress = musicVolume;
        if (this.sliderMusic) this.sliderMusic.progress = musicVolume;
        if (this.progressSound) this.progressSound.progress = soundVolume;
        if (this.sliderSound) this.sliderSound.progress = soundVolume;
    },

    onBtnClk(event, param) {
        if (this.selectMask) return;
        switch (param) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'music_slider':
                this.progressMusic.progress = event.progress;
                AudioUtil.setMusicVolume(this.progressMusic.progress);
                this.callback && this.callback();
                break;
            case 'sound_slider':
                this.progressSound.progress = event.progress;
                AudioUtil.setEffectVolume(this.progressSound.progress);
                this.callback && this.callback();
                break;
            case 'musicTog':
                AudioUtil.setMusicMute(!event.isChecked);
                this.volumeSync();
                break;
            case 'soundTog':
                AudioUtil.setEffectMute(!event.isChecked);
                this.volumeSync();
                break;
            case 'hallMusic1':
            case 'hallMusic2':
                ConfigModel.setMusicId(Enums.bundleType.HALL, parseInt(param.slice(9)));
                break;
            case 'mjClick0':
            case 'mjClick1':
                CacheManager.setItem("mjOutClickType", param.slice(7));
                break;
            case 'gameMusic1':
            case 'gameMusic2':
                ConfigModel.setMusicId(this.node.nodeParams.musicType, parseInt(param.slice(9)));
                break;
            case 'unionBg1':
            case 'unionBg2':
            case 'unionBg3':
                ConfigModel.setSceneId(Enums.bundleType.UNION, parseInt(param.slice(7)));
                break;
            case 'hallBg1':
            case 'hallBg2':
            case 'hallBg3':
            case 'hallBg4':
                ConfigModel.setSceneId(Enums.bundleType.HALL, parseInt(param.slice(6)));
                break;
            case 'mahjongBg1':
            case 'mahjongBg2':
            case 'mahjongBg3':
            case 'mahjongBg4':
                ConfigModel.setSceneId(Enums.bundleType.MAHJONG, parseInt(param.slice(9)))
                break;
            case 'pokerRoundBg1':
            case 'pokerRoundBg2':
            case 'pokerRoundBg3':
            case 'pokerRoundBg4':
                ConfigModel.setSceneId(Enums.bundleType.CIRCLE, parseInt(param.slice(12)))
                break;
            case 'pokerSquareBg1':
            case 'pokerSquareBg2':
            case 'pokerSquareBg3':
            case 'pokerSquareBg4':
                ConfigModel.setSceneId(Enums.bundleType.POKER, parseInt(param.slice(13)))
                break;
            case 'cardBg1':
            case 'cardBg2':
            case 'cardBg3':
            case 'cardBg4':
                ConfigModel.setCardBackId(Enums.cardStyleType.POKER, parseInt(param.slice(6)))
                break;
            case 'mjBg1':
            case 'mjBg2':
                ConfigModel.setCardBackId(Enums.cardStyleType.MAHJONG, parseInt(param.slice(4)))
                break;
            case 'exit':
                AssetsManager.popDialog({
                    content: "是否退出游戏?",
                    ok: () => {
                        cc.game.end();
                    },
                    no: () => { }
                });
                break;
        }
    }
});