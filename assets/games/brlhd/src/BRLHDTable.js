const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiBrlhd = require('./ApiBrlhd');
const CCUtil = require("../../../src/utils/CCUtil");
const Utils = require("../../../src/utils/Utils")
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const BRLHDModel = require("./BRLHDModel");
const NodePoolManager = require('../../../src/utils/NodePoolManager');

cc.Class({
    extends: cc.Component,

    properties: {
        ctrl_Banker: require("BRLHDBanker"),

        node_Chip: cc.Node,
        node_Clock: cc.Node,
        node_Cards: cc.Node,
        node_Other: cc.Node,
        node_User: cc.Node,
        node_GuanZhan: cc.Node,

        Item_User: cc.Prefab,
        list_FuHao: cc.Node,
        list_XingYun: cc.Node,

        list_Area: [cc.Node],
        list_Cards: [cc.Node],
        res_Chip: [cc.SpriteFrame],

        _tick: -1,
        _checkTime: 0,
        _listChip: [],
        _allFlyNode: [],
        _moreNum: 5,
    },

    onLoad() {
        this.reset();
    },

    reset() {
        this.putAllFly();
        this.showMyUser();
        this.showOtherNum();
        this.showListArea();
        this.showClock(null);
        this.initTableCards();
        this.showGuanZhan(false);
        this.showTableCards([], false);
        this.showAllAreaScore([], true);
        // this.matchSelectChip(-1, BRLHDModel.getSelectChip());
        this.showLoseWinScore(this.ctrl_Banker.CurUesrNode());
        //测试部分
        this.showSiftUser({ list: [0, 0, 0] }, BRLHDModel.UserType.Rich);
        this.showSiftUser({ list: [0, 0, 0] }, BRLHDModel.UserType.Lucky);
    },

    putAllFly() {
        this._allFlyNode.forEach((sonList) => {
            for (let index = sonList.length - 1; index >= 0; index--) {
                let node = sonList[index];
                if (node) {
                    node.setScale(1);
                    node.off("click");
                    NodePoolManager.put('brlhdChipPool', node);
                    sonList.splice(index, 1);
                }
            }
        })
        this._allFlyNode = [];
    },

    initSelectChip() {
        this._listChip = [];
        if (!this.node_Chip) return;
        let List_Chip = this.node_Chip.getChildByName("List_Chip");
        let btn_xutou = this.node_Chip.getChildByName("btn_xutou");
        let pourRate = BRLHDModel.getGameRuleByKey("pourRate") || [];
        let baseScore = BRLHDModel.getGameRuleByKey("baseScore") || 1;
        List_Chip.removeAllChildren();
        pourRate.forEach((rete) => {
            let val = rete * baseScore;
            this._listChip.push(val)
        });
        this._listChip.forEach((chipNum, index) => {
            let resIndex = index >= 5 ? 5 : index;
            let CurNode = NodePoolManager.get('brlhdChipPool');
            CurNode.getComponent(cc.Sprite).spriteFrame = this.res_Chip[resIndex];
            CurNode.getChildByName("show_Select").active = false;
            let text_num = CurNode.getChildByName("text_num");
            CurNode.getComponent(cc.Button).enabled = true;
            let valStr = Utils.formatNumberWithSymbol(chipNum);
            this.setLabel(text_num, valStr);
            CurNode.on("click", () => {
                if (this.isTouZhu()) return;
                this.showSelectChip(index);
            }, this);
            CurNode.parent = List_Chip;
            CurNode.setPosition(0, 0);
            CurNode.active = true;
            CurNode.setScale(1);
        })
        btn_xutou.off("click");
        btn_xutou.on("click", () => {
            if (this.isTouZhu()) return;
            ApiRoom.gameMessageNotify(ApiBrlhd.gameUserFollowPourNotify());
        }, this);

        let selectChip = BRLHDModel.getSelectChip();
        if (!selectChip) {
            this.matchSelectChip(-1);
        } else {
            this.showSelectChip(this._listChip.indexOf(selectChip));
        }
    },

    initTableCards() {
        this.node_Cards.active = false;
        this.list_Cards.forEach((node) => {
            node.children.forEach(sonNode => {
                sonNode.active = false;
            })
            node.active = false;
        })
        this._listCardsPos = [cc.v2(180, 0), cc.v2(-180, 0)];
        this.node_Cards.getChildByName("ainmLoseWin").active = false;
    },

    showTableCards(cardsList, isAinm = false) {
        let status = BRLHDModel.getGameStatus();
        this.node_Cards.active = !!status;
        if (!status) return false;
        this.list_Cards.forEach((node, index) => {
            let node_Cards = node.getChildByName("node_Cards");
            node.getChildByName("node_Fire").active = false;
            node.getChildByName("node_Lizi").active = false;
            let pos = this._listCardsPos[index];
            let obj = cardsList[index];
            let id = obj ? obj.id : 0;
            node_Cards.active = true;
            node.setPosition(pos);
            node.active = true;
            let showCards = (flower) => {
                AssetsManager.loadSpriteFrame({
                    path: `sprite/cards/${flower}`,
                    sprite: node_Cards.getComponent(cc.Sprite),
                })
            }
            let showEffect = () => {
                node.getChildByName("node_Lizi").active = status == ApiBrlhd.gameStatus.RESULT;
                node.getChildByName("node_Fire").active = status == ApiBrlhd.gameStatus.SEND_CARDS || status == ApiBrlhd.gameStatus.POUR_SCORE;
            }
            showCards(0);
            if (isAinm) {
                if (status == ApiBrlhd.gameStatus.POUR_SCORE) {
                    cc.tween(node)
                        .set({ position: cc.v2(0, 0) })
                        .to(0.5, { position: pos })
                        .call(showEffect)
                        .start();
                } else if (status == ApiBrlhd.gameStatus.RESULT) {
                    cc.tween(node)
                        .set({ scaleX: -1 })
                        .to(0.2, { scaleX: 0 })
                        .call(() => { showCards(id); })
                        .to(0.2, { scaleX: 1 })
                        .call(() => {
                            showEffect();
                        })
                        .start();
                }
            } else {
                showCards(id);
                showEffect();
            }
        })
    },

    showListArea() {
        this.list_Area.forEach((CurNode, index) => {
            if (CurNode) {
                this._allFlyNode[index] = [];
                CurNode.getChildByName("showRate").active = false;
                CurNode.getChildByName("showChip").active = false;
                CurNode.getChildByName("showType").active = false;
                CurNode.getChildByName("showScore").active = false;
                CurNode.getChildByName("showResult").active = false;
                CurNode.getChildByName("showChip").removeAllChildren();
            }
        })
    },

    showArea(scoreList = []) {
        let pourTotal = [];
        let RateList = BRLHDModel.getRateList();
        this.list_Area.forEach((CurNode, areaIndex) => {
            if (CurNode) {
                let totalNum = 0, userNum = 0;
                let rateObj = RateList[areaIndex];
                let CurScoreList = scoreList[areaIndex] || [];
                let showChip = CurNode.getChildByName("showChip");
                let showRate = CurNode.getChildByName("showRate");
                CurScoreList.forEach((obj) => {
                    let uid = obj.uid;
                    let count = obj.count || 1;
                    let chipType = obj.score || 1;
                    let chipNum = count * chipType;
                    let showNum = count > this._moreNum ? 1 : count;
                    let chipVal = count > this._moreNum ? chipNum : chipType;
                    for (let index = 0; index < showNum; index++) {
                        let itemChip = this.createChip(uid, this.node, areaIndex, chipType, chipVal);
                        if (itemChip) {
                            let firstEnd = BRLHDModel.getNodeRandomAreaPos(showChip, this.node);
                            itemChip.setPosition(firstEnd);
                            itemChip.setScale(0.55);
                        }
                    }
                    if (uid == BRLHDModel.getMyUid()) {
                        userNum += chipNum;
                    }
                    totalNum += chipNum;
                })
                showChip.off("click");
                showChip.active = true;
                showRate.active = true;
                showChip.on("click", () => {
                    if (this.isTouZhu()) return;
                    let chipNum = BRLHDModel.getSelectChip();
                    this.matchSelectChip(areaIndex, chipNum);
                });
                showChip.getComponent(cc.Sprite).enabled = false;
                showRate.getComponent(cc.Label).string = `${rateObj.tou} : ${rateObj.pei}`;
                pourTotal.push({ totalScore: totalNum, userScore: userNum, pourIndex: areaIndex });
            }
        })
        this.showAllAreaScore(pourTotal, true);
    },

    showAreaResult(winIndex, winScore) {
        let myUid = BRLHDModel.getMyUid();
        let otherCount = 0, otherList = [];
        let bankerUesr = BRLHDModel.getCurBankerInfo();
        let bankerNode = this.ctrl_Banker.CurUesrNode();
        let bankerUid = bankerUesr ? bankerUesr.uid : "";
        let scoreBanker = 0, scoreOther = 0, scoreMy = 0;
        for (const uid in winScore) {
            let scoreNum = winScore[uid];
            if (bankerUesr && bankerUesr.uid == uid) {
                scoreBanker = scoreNum;
            } else if (uid == myUid) {
                scoreMy = scoreNum;
            } else {
                if (scoreNum > 0) {
                    scoreOther += scoreNum;
                    otherList.push({ uid, scoreNum });
                }
            }
        }
        this.list_Area.forEach((CurNode, areaIndex) => {
            if (CurNode) {
                if (bankerUesr && bankerNode) {
                    let sonFlyList = this._allFlyNode[areaIndex];
                    sonFlyList.forEach((chipNode) => {
                        if (areaIndex != winIndex) {
                            this.toFlyChip(chipNode, bankerNode);
                        } else {
                            let showChip = CurNode.getChildByName("showChip");
                            let chipNum = chipNode.chipNum, chipType = chipNode.chipType;
                            this.flyChip(bankerNode, showChip, bankerUesr.uid, areaIndex, chipType, chipNum);
                        }
                    })
                }
            }
        })

        if (!this.list_Area[winIndex]) return;
        let showAinmLoseWin = (index) => {
            let AudioLoseWin = ["result_hu", "result_he", "result_long"];
            let AinmLoseWin = ["huying", "heju", "longying"];
            let vsNema = null;
            if (index == BRLHDModel.AreaType.Hu) {
                vsNema = "vs_hu"
            } else if (index == BRLHDModel.AreaType.Long) {
                vsNema = "vs_long"
            }
            AssetsManager.playEffect({
                bundle: Enums.bundleType.BRLHD,
                path: `res/audio/${AudioLoseWin[index]}`,
                finish: () => {
                    vsNema && AssetsManager.playEffect({
                        bundle: Enums.bundleType.BRLHD,
                        path: 'res/audio/' + vsNema,
                    });
                }
            });
            let ainmNode = this.node_Cards.getChildByName("ainmLoseWin")
            let ainmSp = ainmNode.getComponent(sp.Skeleton);
            ainmNode.active = true;
            ainmSp.setSkin('default');
            let animName = AinmLoseWin[index];
            ainmSp.setAnimation(0, animName, false);
            ainmSp.setCompleteListener(() => {
                ainmNode.active = false;
            });
        }
        let showUidScore = (uid, curScore, targetNode, funs) => {
            if (!curScore || curScore <= 0) { funs && funs(); return };
            let len = 0, winFlyList = this._allFlyNode[winIndex];
            winFlyList.forEach(n => { if (n.uid == uid) { len += 1 } });
            for (let index = 0; index < winFlyList.length; index++) {
                const node = winFlyList[index];
                if (node && uid == node.name) {
                    this.toFlyChip(node, targetNode, () => {
                        if (len == index) {
                            funs && funs();
                        }
                    });
                }
            }
        }
        let CurNode = this.list_Area[winIndex];
        let showResult = CurNode.getChildByName("showResult");
        showResult.stopAllActions();
        cc.tween(showResult)
            .delay(0.2)
            .call(() => {
                showResult.active = true;
                showAinmLoseWin(winIndex);
            })
            .repeat(2, cc.tween().delay(0.2).hide().delay(0.2).show())
            .call(() => {
                scoreMy && showUidScore(myUid, scoreMy, this.node_User, () => {
                    this.showMyUser(scoreMy);
                });
                if (scoreBanker && this.ctrl_Banker) {
                    this.showLoseWinScore(bankerNode, scoreBanker, () => {
                        this.ctrl_Banker.showCurUesr(false, scoreBanker);
                    })
                }
                otherList.forEach((obj) => {
                    showUidScore(obj.uid, obj.scoreNum, this.node_Other, () => {
                        otherCount += 1;
                        if (otherCount >= otherList.length) {
                            this.showLoseWinScore(this.node_Other, scoreOther)
                        }
                    });
                })
            })
            .delay(1)
            .hide()
            .start()
    },

    showAllAreaScore(pourTotal = [], isShow = true) {
        this.list_Area.forEach((CurNode, index) => {
            if (CurNode) {
                let curPourObj = pourTotal[index];
                let showScore = CurNode.getChildByName("showScore");
                let text_cur = showScore.getChildByName("text_cur");
                let text_all = showScore.getChildByName("text_all");
                this.setLabel(text_all, curPourObj ? curPourObj.totalScore : 0);
                isShow && this.setLabel(text_cur, curPourObj ? curPourObj.userScore : 0);
                showScore.active = true;
            }
        })
    },



    showSelectChip(cur) {
        this._chipIndex = cur;
        let chipNum = this._listChip[cur];
        BRLHDModel.setSelectChip(chipNum);
        if (!this.node_Chip) return false;
        let List_Chip = this.node_Chip.getChildByName("List_Chip");
        List_Chip.children.forEach((CurNode, index) => {
            CurNode.getChildByName("show_Select").active = cur == index;
        })
    },

    matchSelectChip(areaType, chipNum) {
        let isMatc = !!chipNum, arr = this._listChip.slice();
        let myScore = BRLHDModel.getMyScore();
        if (!isMatc || myScore < chipNum) {
            for (let i = arr.length - 1; i >= 0; i--) {
                const CurChip = this._listChip[i];
                if (myScore >= CurChip) {
                    this.showSelectChip(i);
                    chipNum = CurChip;
                    isMatc = true;
                    break;
                }
            }
        }
        if (!isMatc) {
            this.showSelectChip(-1);
        } else {
            if (areaType == -1) return
            let myUid = BRLHDModel.getMyUid();
            ApiRoom.gameMessageNotify(ApiBrlhd.gameUserPourScoreNotify(myUid, areaType, chipNum));
        }
    },

    siftFlyChip(data) {
        if (!data) return;
        let uid = data.uid;
        if (!data.isSuccess) {
            if (uid == BRLHDModel.getMyUid()) {
                AssetsManager.tipDialog(data.message);
            }
            return
        }
        AssetsManager.playEffect({
            path: 'res/audio/chip_fly',
            bundle: Enums.bundleType.BRLHD,
        });
        let pourList = data.pourList, limitNum = 50;
        this._allFlyNode.forEach((sonList, areaIndex) => {
            if (sonList.length > limitNum) {
                let pushNum = sonList.length - limitNum;
                for (let index = 0; index < pushNum; index++) {
                    let node = sonList[index];
                    if (node) {
                        node.setScale(1);
                        node.off("click");
                        node.active = false;
                        NodePoolManager.put('brlhdChipPool', node);
                        this._allFlyNode[areaIndex].splice(index, 1);
                    }
                }
            }
        })
        pourList.forEach((obj) => {
            let count = obj.count || 1;
            let chipType = obj.score || 1;
            let areaIndex = obj.pourIndex;
            let chipNum = chipType * count;
            let curArea = this.list_Area[areaIndex];
            let showNum = count > this._moreNum ? 1 : count;
            let showChip = curArea.getChildByName("showChip");
            let chipVal = count > this._moreNum ? chipNum : chipType;
            for (let index = 0; index < showNum; index++) {
                if (uid == BRLHDModel.getMyUid()) {
                    this.flyChip(this.node_User, showChip, uid, areaIndex, chipType, chipVal);
                } else {
                    this.flyChip(this.node_Other, showChip, uid, areaIndex, chipType, chipVal);
                }
            }
        })
        this.showAllAreaScore(data.pourTotal, uid == BRLHDModel.getMyUid());
    },

    /**筹码飞动 */
    flyChip(startNode, targetNode, uid, areaIndex, chipType, chipNum, randomPos = true, funs = null) {
        if (!startNode || !targetNode || !chipType) return false;
        let flyItem = this.createChip(uid, this.node, areaIndex, chipType, chipNum);
        if (!flyItem) return false;
        let posStart = CCUtil.postionConvert(startNode, this.node);
        let posTarget = CCUtil.postionConvert(targetNode, this.node);
        if (randomPos) {
            posTarget = BRLHDModel.getNodeRandomAreaPos(targetNode, this.node);
        }
        flyItem.setPosition(posStart);
        flyItem.setScale(0.8);
        cc.tween(flyItem)
            .to(0.35, {
                scale: 0.55,
                position: posTarget,
            }).call(() => {
                funs && funs(flyItem);
            }).start();
    },

    createChip(uid, rootNode, areaIndex, chipType, chipNum) {
        if (!NodePoolManager.get('brlhdChipPool')) return;
        let chipPab = NodePoolManager.get('brlhdChipPool');
        let chipItem = cc.instantiate(chipPab);
        let chipSpr = chipItem.getComponent(cc.Sprite);
        let text_num = chipItem.getChildByName("text_num");
        chipItem.getChildByName("show_Select").active = false;
        chipItem.getComponent(cc.Button).enabled = false;
        let resIndex = this._listChip.indexOf(chipType);
        let valStr = Utils.formatNumberWithSymbol(chipNum);
        chipSpr.spriteFrame = this.res_Chip[resIndex];
        this._allFlyNode[areaIndex].push(chipItem);
        this.setLabel(text_num, valStr);
        chipItem.chipType = chipType;
        chipItem.chipNum = chipNum;
        chipItem.parent = rootNode;
        chipItem.setPosition(0, 0);
        chipItem.active = true;
        chipItem.name = uid;
        return chipItem;
    },

    toFlyChip(flyItem, targetNode, funs = null) {
        if (!flyItem || !targetNode) return false;
        let posTarget = CCUtil.postionConvert(targetNode, this.node);
        cc.tween(flyItem)
            .to(0.35, {
                position: posTarget,
            }).call(() => {
                flyItem.active = false;
                funs && funs(flyItem);
            }).start();
    },

    showGuanZhan(isShow) {
        this.node_GuanZhan.active = isShow
    },

    showOtherNum() {
        if (!this.node_Other) return;
        this.showLoseWinScore(this.node_Other);
        let otherList = BRLHDModel.getOtherUesrList();
        let text_num = this.node_Other.getChildByName("text_num");
        text_num.getComponent(cc.Label).string = otherList.length ? otherList.length : "";
    },

    showMyUser(curScore) {
        if (!this.node_User) return;
        let userObj = BRLHDModel.getUserByUID();
        let userInfo = userObj ? userObj.userInfo : null;
        if (userObj && userInfo) {
            let text_gold = this.node_User.getChildByName("text_gold");
            let btn_head = this.node_User.getChildByName("btn_head");
            let text_id = this.node_User.getChildByName("text_id");
            this.showLoseWinScore(this.node_User, curScore, () => {
                this.setLabel(text_gold, userInfo.score);
            })
            AssetsManager.loadSpriteFrame({
                sprite: btn_head.getComponent(cc.Sprite),
                path: userInfo.avatar,
            });
            BRLHDModel.setMyScore(userInfo.score);
            this.setLabel(text_id, userInfo.uid);
            this.node_User.active = true;
            return;//防止节点闪烁
        }
        this.node_User.active = false;
    },

    isTouZhu() {
        if (BRLHDModel.getGameStatus() != ApiBrlhd.gameStatus.POUR_SCORE) {
            AssetsManager.tipDialog("未到下注阶段!");
            return true;
        };
        if (BRLHDModel.getMyBankerUid()) {
            AssetsManager.tipDialog("已上庄不能下注!");
            return true
        }
        if (!BRLHDModel.getMyScore()) {
            AssetsManager.tipDialog("筹码不足!");
            return true;
        }
        AssetsManager.playEffect({
            bundle: Enums.bundleType.BRLHD,
            path: 'res/audio/chip_click',
        });
        return false;
    },


    showClock(tickTime) {
        if (!this.node_Clock) return;
        this.node_Clock.active = false;
        if (tickTime == null) return false;
        let status = BRLHDModel.getGameStatus();
        let statusStr = ["准备中..", "下注中..", "发牌中..", "开牌中.."];
        let txt_status = this.node_Clock.getChildByName("txt_status");
        let txt_time = this.node_Clock.getChildByName("txt_time");
        this._tick = tickTime <= 0 ? 0 : Math.floor(tickTime);
        this.txt_status = txt_status.getComponent(cc.Label);
        this.txt_time = txt_time.getComponent(cc.Label);
        this.txt_status.string = statusStr[status];
        this.txt_time.string = this._tick;
        this.node_Clock.active = true;
    },

    update(dt) {
        if (this._tick >= 0) {
            this._checkTime += dt
            if (this._checkTime >= 1) {
                this._checkTime = 0
                if (this._tick - 1 >= 0) {
                    this._tick--
                }
                let status = BRLHDModel.getGameStatus();
                if (status == ApiBrlhd.gameStatus.POUR_SCORE) {
                    let name = this._tick <= 3 ? "timeOver" : "timeDown";
                    AssetsManager.playEffect({
                        bundle: Enums.bundleType.BRLHD,
                        path: 'res/audio/' + name,
                    });
                }
                this.txt_time.string = this._tick + ""
            }
        }
    },

    setLabel(curNode, str) {
        if (!!curNode && !!curNode.getComponent(cc.Label)) {
            curNode.getComponent(cc.Label).string = str;
        }
    },

    showLoseWinScore(rootNode, scoreNum, funs) {
        if (!rootNode) return funs && funs();
        let text_win = rootNode.getChildByName("text_win");
        let text_lose = rootNode.getChildByName("text_lose");
        if (!text_lose || !text_lose) return funs && funs();
        text_lose.active = false;
        text_win.active = false;
        if (scoreNum) {
            let scoreStr = `${scoreNum > 0 ? "+" : ""}` + scoreNum;
            let scoreNode = scoreNum > 0 ? text_win : text_lose;
            if (scoreNode) {
                scoreNode.setScale(0);
                scoreNode.active = true;
                scoreNode.stopAllActions();
                this.setLabel(scoreNode, scoreStr);
                cc.tween(scoreNode)
                    .repeat(2, cc.tween().to(0.1, { scale: 2 }).delay(0.3).to(0.1, { scale: 1 }))
                    .call(() => {
                        funs && funs();
                        scoreNode.active = false;
                    })
                    .start()
            }
        } else {
            funs && funs();
        }
    },

    showSiftUser(data, type = 0) {
        let list = data.list || [];
        let addUserShow = (addNode, list, type) => {
            let addList = [];
            addNode.removeAllChildren();
            list.forEach((userObj) => {
                let userNode = cc.instantiate(this.Item_User);
                let crtlUser = userNode.getComponent("BRLHDUser");
                crtlUser && crtlUser.init(userObj, type);
                userNode.setPosition(0, 0);
                userNode.parent = addNode;
                userNode.active = true;
                addList.push(userNode);
            })
            return addList;
        }
        if (type == BRLHDModel.UserType.Rich) {
            this._listFuHao = addUserShow(this.list_FuHao, list, type);
        } else if (type == BRLHDModel.UserType.Lucky) {
            this._listXingYun = addUserShow(this.list_XingYun, list, type);
        }
    },

});
