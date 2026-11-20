const ApiZgz = require('./ApiZgz');
const ZGZModel = require("./ZGZModel")
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
cc.Class({
    extends: cc.Component,

    properties: {
        outCardNode: cc.Node,
        btn_tip: cc.Button,
        btn_pass: cc.Button,
        btn_out: cc.Button,
        clock: [cc.Node],
        tip_optTher: cc.Node,
        showThree: cc.Node,
        lay_Tog: cc.Node,
    },

    reset() {
        this.showOptNode(false);
        this.showOptThree(false);
        this.showOptTherTip(false);
    },

    showOptNode(isShow, onlyPass = false) {
        this.outCardNode.active = isShow
        if (isShow) {
            this.btn_out.node.active = !onlyPass
            this.btn_tip.node.active = !onlyPass
            this.btn_pass.node.active = !ZGZModel.getGameRuleByKey("bichu")
        }
    },

    /**显示闹钟 */
    setClock(clockNode = null, type = 0) {
        if (!this.clock[type]) return;
        this.clock[type].removeAllChildren();
        clockNode && this.clock[type].addChild(clockNode);
    },

    showOptTherTip(isShow) {
        this.tip_optTher.active = isShow;
    },

    showOptThree(isShow, takingObj) {
        isShow = isShow && takingObj && !takingObj.endOperate;
        this.showThree.active = isShow;
        this._threeList = [];
        if (isShow) {
            // endOperate: 0
            // operateList: (2) [1, 2]
            // plusInfo:
            // list: [51]
            this.showOptTherTip(false);
            if (takingObj.plusInfo) {
                this._threeList = takingObj.plusInfo.list || [];
            }
            let operateList = takingObj.operateList || [];
            this.lay_Tog.children.forEach((sonNode, index) => {
                let cardID = ZGZModel.threeAll[index];
                let isSelect = this._threeList.includes(cardID);
                let bgCard = sonNode.getChildByName("Background");
                sonNode.getChildByName("mask").active = !isSelect;
                sonNode.getComponent(cc.Toggle).isChecked = isSelect;
                sonNode.getComponent(cc.Toggle).interactable = isSelect;
                AssetsManager.loadSpriteFrame({
                    sprite: bgCard.getComponent(cc.Sprite),
                    path: `sprite/cards/${cardID}`,
                })
            })
            this.lay_Tog.active = this._threeList.length > 0;
            let lay_Btn = this.showThree.getChildByName("lay_Btn");
            lay_Btn.getChildByName("btn_zhaguzi").active = operateList.includes(ApiZgz.talkType.ZHA);
            lay_Btn.getChildByName("btn_noShow").active = operateList.includes(ApiZgz.talkType.PASS);
            lay_Btn.getChildByName("btn_okShow").active = operateList.includes(ApiZgz.talkType.LIANG);
            lay_Btn.getChildByName("btn_renShu").active = operateList.includes(ApiZgz.talkType.RENSHU);
        }
    },

    getSelectThree(isCheck = true) {
        let selectList = [];
        this.lay_Tog.children.forEach((sonNode, index) => {
            if (sonNode.getComponent(cc.Toggle).isChecked) {
                selectList.push(ZGZModel.threeAll[index]);
            }
        })
        if (!isCheck) return selectList;
        if (!selectList.length) {
            AssetsManager.tipDialog('未选择要亮的三!');
            return
        }
        let threeRed = [3, 35], threeDark = [19, 51];
        let haveRed = 0, selectRed = 0, selectDark = 0;
        threeRed.forEach(cardID => {
            if (this._threeList.includes(cardID)) {
                haveRed += 1;
            }
        })
        selectList.forEach(cardID => {
            if (threeRed.includes(cardID)) {
                selectRed += 1;
            } else if (threeDark.includes(cardID)) {
                selectDark += 1;
            }
        })
        if (this._threeList.includes(3) && selectList.includes(3) && selectDark > 0) {
            return selectList;
        }
        if (this._threeList.includes(3) && !selectList.includes(3)
            && ZGZModel.getGameRuleByKey("isShowThree")) {
            AssetsManager.tipDialog('方片三必亮!');
            return
        }
        if (selectDark > 0 && selectRed != haveRed) {
            AssetsManager.tipDialog('选择亮黑三时必须亮所有红三!');
            return
        }
        if (selectList.length == 1 && haveRed == 2 && !selectList.includes(3)) {
            AssetsManager.tipDialog('选择亮一个三必须亮方片三!');
            return
        }
        if (selectList.length == 2 && haveRed == 2 && selectRed != haveRed) {
            AssetsManager.tipDialog('选择亮两个三必须亮所有红三!');
            return
        }
        return selectList;
    },

    sendTalk(operate, selectList = []) {
        let operateInfo = {
            list: selectList,
            operate: operate,
            uid: ZGZModel.getMyUid(),
        }
        ApiRoom.gameMessageNotify(ApiZgz.gameUserTalkNotify(operateInfo));
        this.showOptThree(false);
    },

    clickOptThree(event, clickType) {
        if (clickType == "btn_noShow") {
            this.sendTalk(ApiZgz.talkType.PASS);
        } else if (clickType == "btn_renShu") {
            this.sendTalk(ApiZgz.talkType.RENSHU);
        } else if (clickType == "btn_okShow") {
            let selectList = this.getSelectThree();
            selectList && this.sendTalk(ApiZgz.talkType.LIANG, selectList);
        } else if (clickType == "btn_zhaguzi") {
            this.sendTalk(ApiZgz.talkType.ZHA, this.getSelectThree(false));
        }
    },
});