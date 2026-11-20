
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const AudioUtil = require('../../../src/utils/AudioUtil');
const NativeUtil = require('../../../src/utils/NativeUtil');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const Codes = require('../../../src/const/Codes');
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiBrlhd = require('./ApiBrlhd');
const Enums = require('../../../src/const/Enums');
const BRLHDModel = require("./BRLHDModel");
const NodePoolManager = require('../../../src/utils/NodePoolManager');

cc.Class({
    extends: cc.Component,

    properties: {
        ctrl_Banker: require("BRLHDBanker"),
        ctrl_Table: require("BRLHDTable"),
        ctrl_Anim: require("BRLHDAnim"),
        chipItem: cc.Prefab,
        text_roomID: cc.Label,
        tog_Music: cc.Toggle,
        tog_Sound: cc.Toggle,
        node_menu: cc.Node,
    },

    onLoad() {
        NodePoolManager.init('brlhdChipPool', this.chipItem, 30);
        this.node_menu.active = false;
        AssetsManager.init(this.node.parent);
        BRLHDModel.init({ chipItem: this.chipItem });
        MessageCallback.addListener('RoomMessagePush', this);
        MessageCallback.addListener('GameMessagePush', this);
        cc.game.on(cc.game.EVENT_SHOW, this.getRoomSceneInfo, this);
        this.getRoomSceneInfo();
    },

    onDestroy() {
        NodePoolManager.clear('brlhdChipPool');
        MessageCallback.removeListener('RoomMessagePush', this);
        MessageCallback.removeListener('GameMessagePush', this);
        cc.game.off(cc.game.EVENT_SHOW, this.getRoomSceneInfo, this);
    },

    onClickEvent(event, clickType) {
        if (CCUtil.clickInterval(event.target, 1)) {
            return;
        }
        this.node_menu.active = false;
        if (clickType == "btn_rule") {
            AssetsManager.createDialog({
                path: 'res/prefab/BRLHDRule',
                bundle: Enums.bundleType.BRLHD,
                done: (node) => {
                    if (!node) return false;
                    let btn_close = cc.find('ShowNode/btn_close', node);
                    btn_close && btn_close.on("click", () => { node.destroy(); });
                }
            },);
        } else if (clickType == "btn_otherUesr") {
            AssetsManager.createDialog({
                path: 'res/prefab/BRLHDPlayer',
                bundle: Enums.bundleType.BRLHD,
            });
        } else if (clickType == "tog_Music") {
            AudioUtil.setMusicMute(event.isChecked);
        } else if (clickType == "tog_Sound") {
            AudioUtil.setEffectMute(event.isChecked);
        } else if (clickType == "btn_menu") {
            this.node_menu.active = true;
            this.tog_Music.isChecked = AudioUtil.isMusicMute()
            this.tog_Sound.isChecked = AudioUtil.isEffectMute()
        } else if (clickType == "btn_exit") {
            if (!UserModel.isInRoom()) {
                this.enterHall();
                return;
            }
            ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
        } else if (clickType == "btn_head") {
            if (!!UserModel.getData("isTest")) {
                AssetsManager.createDialog({
                    bundle: Enums.bundleType.BRLHD,
                    path: 'res/prefab/BRLHDTestSelect',
                })
            }
        }
    },

    /**获取房间信息 */
    getRoomSceneInfo() {
        if (UserModel.isInRoom()) {
            ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
        } else {
            this.enterHall();
        }
    },

    /**返回大厅 */
    enterHall() {
        let isUnionCreate = BRLHDModel.isUnionCreate();
        let unionID = !!isUnionCreate ? BRLHDModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**用户离开房间 */
    userLeaveRoom(data) {
        if (data.uid != BRLHDModel.getMyUid()) {
            BRLHDModel.delUser(data.uid);
        }
        if (data.uid == BRLHDModel.getMyUid()) {
            if (!BRLHDModel.getRoomID() || BRLHDModel.getRoomID() == data.roomID) {
                this.enterHall()
            }
        }
    },

    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                BRLHDModel.roomInit(msg.data);
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
                let userData = msg.data.changeInfo;
                BRLHDModel.setUserData(userData);
                if (userData && userData.uid == BRLHDModel.getMyUid()) {
                    // if (BRLHDModel.getGameStatus() != ApiBrlhd.gameStatus.RESULT) {
                    this.ctrl_Table.showMyUser();
                    // }
                }
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                BRLHDModel.addUser(msg.data.roomUserInfo);
                this.ctrl_Table.showOtherNum();
            } else if (msg.type == ApiBrlhd.GAME_WIN_LOSE_PUSH) {
                BRLHDModel.setPoolHistory(msg.data.plusInfo);
                this.ctrl_Banker.showTrend();
            } else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
                this.userLeaveRoom(msg.data.roomUserInfo);
            } else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
                let isSuccess = msg.data.isSuccess || false;
                if (!isSuccess && msg.data.uid == BRLHDModel.getMyUid()) {
                    AssetsManager.tipDialog(msg.data.message)
                }
            }
        } else if (route === 'GameMessagePush') {
            if (msg.type === ApiBrlhd.GAME_STATUS_PUSH) { //游戏状态
                BRLHDModel.setGameStatus(msg.data.gameStatus);
                this.onGameStatusUpdate(msg.data)
            } else if (msg.type == ApiBrlhd.GAME_USER_POUR_SCORE_PUSH) {
                this.ctrl_Table.siftFlyChip(msg.data);
            } else if (msg.type === ApiBrlhd.GAME_RESULT_PUSH) {
                this.onGameResult(msg.data)
            } else if (msg.type === ApiBrlhd.GAME_USER_APPLY_BANKER_PUSH) {
                if (msg.data.uid == BRLHDModel.getMyUid()) {
                    AssetsManager.tipDialog(msg.data.message);
                }
            } else if (msg.type === ApiBrlhd.GAME_BANKER_PUSH) {
                BRLHDModel.setBankerUid(msg.data.bankerUid);
                this.ctrl_Banker.showCurUesr();
                this.ctrl_Banker.showInfo();
            } else if (msg.type === ApiBrlhd.BANKER_CHANGR_PUSH) {
                BRLHDModel.setbankerList(msg.data.bankerList);
                this.ctrl_Banker.showInfo();
            }
        }
    },

    resetTable() {
        this.ctrl_Anim.reset();
        this.ctrl_Table.reset();
        this.ctrl_Banker.reset();
    },

    gameInit(data) {
        // console.log("初始化data", data)
        this.resetTable();
        this.unscheduleAllCallbacks();
        this.ctrl_Table.initSelectChip();
        this.ctrl_Table.showTableCards([]);
        this.text_roomID.string = data.roomID;
        this.ctrl_Table.showClock(data.gameData.tick);
        this.ctrl_Table.showArea(data.gameData.scoreList);
        this.showGameResult(data.gameData.gameResult, false);
    },

    /**游戏状态图更新 */
    onGameStatusUpdate(data) {
        this._gameStatus = data.gameStatus;
        this.ctrl_Table.showClock(data.tick);
        // console.log("游戏状态==", this._gameStatus, data)
        switch (this._gameStatus) {
            case ApiBrlhd.gameStatus.NONE://等待操作
                // this.ctrl_Anim.showSpine(BRLHDModel.AinmType.Wait);
                // this.resetTable();
                break;
            case ApiBrlhd.gameStatus.POUR_SCORE://玩家下分
                this.resetTable();
                this.ctrl_Table.showArea();
                this.ctrl_Table.showClock(data.tick);
                this.ctrl_Table.showTableCards([], true);
                this.ctrl_Anim.showSpine(BRLHDModel.AinmType.KSXZ);
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.BRLHD,
                    path: 'res/audio/xiazhu_kaishi',
                });
                break;
            case ApiBrlhd.gameStatus.SEND_CARDS://发牌
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.BRLHD,
                    path: 'res/audio/kaishifapai',
                });
                break;
            case ApiBrlhd.gameStatus.RESULT://结果
                break;
            default:
                break;
        }
    },

    onGameResult(data) {
        // console.log("游戏结果==", data)
        AssetsManager.playEffect({
            bundle: Enums.bundleType.BRLHD,
            path: 'res/audio/xiazhu_tingzhi',
        });
        BRLHDModel.setBankerUid(data.bankerUid);
        this.ctrl_Anim.showSpine(BRLHDModel.AinmType.TZXZ, () => {
            this.ctrl_Anim.showSpine(BRLHDModel.AinmType.Vs, () => {
                this.showGameResult(data.result, true);
            });
        });
    },

    showGameResult(result, isAinm) {
        if (!result || BRLHDModel.getGameStatus() != ApiBrlhd.gameStatus.RESULT) return
        let cardsList = [], winPool = result.winPool, winScore = result.winScore || {};
        cardsList[0] = { id: result.huCards[0], isWin: winPool == BRLHDModel.AreaType.Hu };
        cardsList[1] = { id: result.longCards[0], isWin: winPool == BRLHDModel.AreaType.Long, };
        this.ctrl_Table.showTableCards(cardsList, isAinm);
        this.ctrl_Table.showAreaResult(winPool, winScore);
    },
});
