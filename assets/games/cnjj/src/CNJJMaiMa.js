const ApiCnjj = require('./ApiCnjj');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CNJJModel = require("./CNJJModel")
const CCUtil = require("../../../src/utils/CCUtil")

cc.Class({
    extends: cc.Component,

    properties: {
        headItem: cc.Node,
        headLayout: cc.Node,

        txt_min: cc.Label,
        txt_max: cc.Label,
        txt_bet: cc.Label,
        progress_bet: cc.ProgressBar,
        slider_bet: cc.Slider,

        btn_bet: cc.Node,
        btn_25: cc.Node,
        btn_50: cc.Node,
        btn_100: cc.Node,
        btn_close: cc.Node,

        txt_yiMen: cc.Label,
        btnBarNode: cc.Node,

        _selectUid: null,
        _lastSelect: null,
        _bet25Score: 0,
        _bet50Score: 0,
        _bet100Score: 0,
    },

    onLoad() {
        this.headItem.active = false

        this.btn_bet.on("click", this.btnClickCallFunc, this)
        this.btn_25.on("click", this.btnClickCallFunc, this)
        this.btn_50.on("click", this.btnClickCallFunc, this)
        this.btn_100.on("click", this.btnClickCallFunc, this)
        this.btn_close.on("click", this.btnClickCallFunc, this)

        let allUser = CNJJModel.getAllUsers()
        for (let i = 0; i < allUser.length; i++) {
            const user = allUser[i];
            if (CNJJModel.getIsPlayingByChairID(user.chairID) && user.uid != CNJJModel.getBankerUid()) {
                let togNode = cc.instantiate(this.headItem)
                togNode.active = true
                togNode.parent = this.headLayout
                togNode.y = 0
                togNode.on("toggle", this.btnClickCallFunc, this)
                togNode.name = user.uid

                let head = cc.find("headMask/head", togNode).getComponent(cc.Sprite)
                AssetsManager.loadSpriteFrame({
                    path: user.userInfo.avatar,
                    sprite: head
                });

                let txt_name = cc.find("txt_name", togNode).getComponent(cc.Label)
                txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 4, '..');

                let txt_men = cc.find("txt_men", togNode).getComponent(cc.Label)
                txt_men.string = (CNJJModel.getMen(user.uid) + 1) + "门"

                if (this._selectUid == null) {
                    this._selectUid = user.uid //默认选第一个
                }
            }
        }

        this.setBetBarNode(true)

        MessageCallback.addListener('GameMessagePush', this);
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            if (msg.type === ApiCnjj.GAME_USER_OPERATE_PUSH) { //玩家下注返回
                this.setBetBarNode()
            }
        }
    },

    onSlider() {
        // console.log("滑动响应==", event)
        this.progress_bet.progress = this.slider_bet.progress;
        let min = parseInt(this.txt_min.string)
        let max = parseInt(this.txt_max.string)
        if (min == max) {
            this.txt_bet.string = "" + min;
            return
        }
        var score = Math.floor((max - min) * this.slider_bet.progress + min);
        let rate = 100
        if (score % rate != 0) {
            score = Math.floor(score / rate) * rate
        }
        if (score < min) {
            score = min
        }
        this.txt_bet.string = "" + score;
    },

    setBetBarNode(isTog = false) {
        this.btnBarNode.active = false
        this.txt_yiMen.string = ""
        let min = CNJJModel.getGameRuleByKey("minPourScore")
        let max = Math.floor(CNJJModel.getMyScore())
        //检测第一门是否下注和下注后金额是否可以买马
        if (CNJJModel.getMen(this._selectUid) == 0) {
            let pourScore = CNJJModel.getPourScoreByUid(this._selectUid)
            let maiMaScore = CNJJModel.getMaiMaScoreByUid(this._selectUid)
            let guodi = CNJJModel.getGuoDi()
            if (pourScore == 0) {
                this.txt_yiMen.string = "第一门未下注，不可买第一门"
            } else if (guodi - pourScore - maiMaScore < min) { //剩的钱不够下注
                this.txt_yiMen.string = `可下注金额不足${min}，不可买第一门`
            } else {
                let xia = guodi - pourScore - maiMaScore //1门只能下满锅底
                if (xia <= max) { //不可大于手里的最大分数
                    max = xia
                }
                this.btnBarNode.active = true
            }
        } else {
            this.btnBarNode.active = true
        }

        if (this.btnBarNode.active) {
            this.txt_min.string = min + ""
            this.txt_max.string = max + ""

            /**设置百分之25和50的按钮数字 */
            let guodi = CNJJModel.getGuoDi()
            this._bet25Score = Math.floor(guodi / 4)
            this._bet50Score = Math.floor(guodi / 2)
            this._bet100Score = Math.floor(guodi)
            this.btn_25.active = this._bet25Score <= max
            this.btn_50.active = this._bet50Score <= max
            this.btn_100.active = this._bet100Score <= max
            this.btn_25.getChildByName("txt").getComponent(cc.Label).string = this._bet25Score + ""
            this.btn_50.getChildByName("txt").getComponent(cc.Label).string = this._bet50Score + ""
            this.btn_100.getChildByName("txt").getComponent(cc.Label).string = this._bet100Score + ""
        }
        if (isTog && (!this._lastSelect || CNJJModel.getMen(this._selectUid) == 0 || CNJJModel.getMen(this._lastSelect) == 0)) {
            this.txt_bet.string = min + ""
            this.progress_bet.progress = this.slider_bet.progress = 0;
        }
    },

    btnClickCallFunc(event) {
        let node = event.node || event.target
        switch (node.name) {
            case "btn_bet":
                let score = parseInt(this.txt_bet.string)
                ApiRoom.gameMessageNotify(ApiCnjj.gameUserOperateNotify(score, true, this._selectUid))
                break;
            case "btn_close":
                this.node.destroy()
                break;
            case "btn_25":
                ApiRoom.gameMessageNotify(ApiCnjj.gameUserOperateNotify(this._bet25Score, true, this._selectUid))
                break;
            case "btn_50":
                ApiRoom.gameMessageNotify(ApiCnjj.gameUserOperateNotify(this._bet50Score, true, this._selectUid))
                break;
            case "btn_100":
                ApiRoom.gameMessageNotify(ApiCnjj.gameUserOperateNotify(this._bet100Score, true, this._selectUid))
                break;
            default:
                if (node.getComponent(cc.Toggle)) {
                    this._lastSelect = this._selectUid
                    this._selectUid = node.name
                    this.setBetBarNode(true)
                }
                break;
        }
    },
});