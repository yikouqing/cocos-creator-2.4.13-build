const Enums = require('../../../src/const/Enums');
const BRNNModel = require("./BRNNModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiBrnn = require('./ApiBrnn');
const CCUtil = require("../../../src/utils/CCUtil")
const Utils = require("../../../src/utils/Utils")
const NodePoolManager = require("../../../src/utils/NodePoolManager")

cc.Class({
    extends: cc.Component,

    properties: {
        btnPoolPfb: cc.Prefab,
        btnChipPfb: cc.Prefab,
        aniPfb: cc.Prefab,
        txt_allBet: cc.Label,
        _poolList: [],
        _nodePoolName: "brnnchip",
    },

    onDestroy() {
        NodePoolManager.clear(this._nodePoolName)
    },

    init(data) {
        NodePoolManager.init(this._nodePoolName, this.btnChipPfb, 50);
        this._poolList.length = 0
        for (let i = 0; i < 4; i++) {
            let parent = cc.find("pool" + i, this.node)
            parent.removeAllChildren()
            let poolNode = cc.instantiate(this.btnPoolPfb)
            poolNode.parent = parent
            poolNode.name = i + ""
            poolNode.on("click", this.btnClickCallFunc, this)
            this._poolList.push({
                chips: cc.find("chips", poolNode),
                txt_self: cc.find("txt_self", poolNode).getComponent(cc.Label),
                txt_all: cc.find("txt_all", poolNode).getComponent(cc.Label)
            })
        }

        let list = Utils.deepCopy(BRNNModel.getGameRuleByKey("pourRate"))
        let baseScore = BRNNModel.getGameRuleByKey("baseScore")
        this._chipList = list.map(num => num *= baseScore)
        // console.log("init", this._chipList)

        /**恢复池子里面的筹码 */
        if (BRNNModel.getGameStatus() == ApiBrnn.gameStatus.POUR_SCORE) {
            let scoreList = data.scoreList
            if (!scoreList) {
                return
            }
            let pourTotal = [] //userScore: 260, pourIndex: 0, totalScore: 260
            for (let i = 0; i < scoreList.length; i++) {
                const list = scoreList[i];
                if (!list) continue;
                pourTotal.push({
                    userScore: 0,
                    pourIndex: i,
                    totalScore: 0
                })
                for (let j = 0; j < list.length; j++) {
                    const info = list[j];
                    if (!info) continue;
                    if (info.uid == BRNNModel.myUid) {
                        pourTotal[i].userScore += info.score
                    }
                    pourTotal[i].totalScore += info.score
                    if (i == scoreList.length - 1 && j == list.length - 1) {
                        this.onPourScore({
                            uid: info.uid,
                            pourList: [info],
                            pourTotal,
                        })
                    } else {
                        this.onPourScore({
                            uid: info.uid,
                            pourList: [info],
                            pourTotal: [],
                        })
                    }
                }
            }
        }
    },

    /**展示赢的动画 */
    showWinAni(winPool) {
        if (!winPool || this._poolList.length != winPool.length) {
            return
        }
        for (let i = 0; i < winPool.length; i++) {
            const isWin = winPool[i];
            if (isWin == -1) {
                // console.log("win ani==", i)
                let pool = this._poolList[i].chips
                let ani = cc.instantiate(this.aniPfb)
                ani.parent = pool.parent
                ani.getComponent("BRNNAni").showSpineAni(1)
            }
        }
    },

    /**生成新筹码 */
    getNewChip(idx, score) {
        let chipNode = NodePoolManager.get(this._nodePoolName)
        if (!chipNode) {
            chipNode = cc.instantiate(this.btnChipPfb)
        }
        // console.log("节点池的容量=", NodePoolManager.size(this._nodePoolName))
        cc.find("selectAni", chipNode).active = false
        if (chipNode.getComponent(cc.Button)) chipNode.removeComponent(cc.Button);
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/chips/" + idx,
            sprite: chipNode.getComponent(cc.Sprite),
            bundle: Enums.bundleType.BRNN,
        });
        let txt = cc.find("txt_chipNum", chipNode).getComponent(cc.Label)
        txt.string = score + ""
        chipNode.scale = 0.5
        return chipNode
    },

    /**用户下注成功 */
    onPourScore(data, flyStartNode) {
        // console.log("用户下注===", data)
        if (!data || !data.pourList) {
            return
        }

        /**池子里面显示筹码 */
        let chipList = []
        let pourList = Utils.deepCopy(data.pourList)
        if (Array.isArray(pourList) && pourList.length > 0) {
            for (let i = pourList.length - 1; i >= 0; i--) {
                const pInfo = pourList[i];
                let pool = this._poolList[pInfo.pourIndex]
                let index = this._chipList.indexOf(pInfo.score)
                for (let j = pInfo.count - 1; j >= 0; j--) {
                    if (pool.chips.children.length >= 100) break;
                    let chipNode = this.getNewChip(index, pInfo.score)
                    chipNode.parent = pool.chips
                    chipNode.name = data.uid
                    let pos = CCUtil.getRandomPos(pool.chips.width - 40, pool.chips.height - 40)
                    chipNode.setPosition(pos)
                    chipList.push(chipNode)
                }
            }
        }

        /**飞筹码动画 */
        if (flyStartNode && chipList.length > 0) {
            for (let i = 0; i < chipList.length; i++) {
                const chipNode = chipList[i];
                let startPos = CCUtil.postionConvert(flyStartNode, chipNode.parent)
                let endPos = chipNode.getPosition()
                let flyNode = cc.instantiate(chipNode)
                chipNode.opacity = 0
                flyNode.parent = chipNode.parent
                flyNode.setPosition(startPos)
                flyNode.scale = 0
                cc.tween(flyNode).to(0.3, {
                    position: endPos,
                    scale: chipNode.scale
                }, {
                    easing: "quadOut"
                }).call(() => {
                    chipNode.opacity = 255
                }).removeSelf().start()
                AssetsManager.playEffect({
                    path: "res/audio/sound-jetton",
                    bundle: Enums.bundleType.BRNN
                });
            }
        }

        this._poolList.forEach(pool => {
            while (pool.chips.children.length > 100) {
                // console.log("删除了一个筹码")
                NodePoolManager.put(this._nodePoolName, pool.chips.children[0])
            }
        });

        /**更新每个池子的下注金额 */
        let sum = 0
        let pourTotal = Utils.deepCopy(data.pourTotal)
        if (Array.isArray(pourTotal) && pourTotal.length == this._poolList.length) {
            pourTotal.forEach(pInfo => {
                let pool = this._poolList[pInfo.pourIndex]
                if (data.uid == BRNNModel.myUid) {
                    pool.txt_self.string = pInfo.userScore + ""
                }
                pool.txt_all.string = pInfo.totalScore + ""
                sum += pInfo.totalScore
            });
        }
        this.txt_allBet.string = "总下注" + sum
    },

    /**飞筹码到庄家或者玩家 */
    flyChipsToSB(winPool, self, other, banker) {
        if (!winPool || this._poolList.length != winPool.length) {
            return
        }
        for (let i = 0; i < winPool.length; i++) {
            const isWin = winPool[i];
            let pool = this._poolList[i].chips
            let bankerPos = CCUtil.postionConvert(banker, pool)
            let selfPos = CCUtil.postionConvert(self, pool)
            let otherPos = CCUtil.postionConvert(other, pool)
            if (isWin == 1) { //飞到庄家
                // console.log("fly to banker")
                for (let i = 0; i < pool.children.length; i++) {
                    const chip = pool.children[i];
                    cc.tween(chip).delay(0.01 * (i % 20)).to(0.5, {
                        position: bankerPos,
                    }, {
                        easing: "quadIn"
                    }).call(() => {
                        NodePoolManager.put(this._nodePoolName, chip)
                    }).start()
                }
                AssetsManager.playEffect({
                    path: "res/audio/fly_gold",
                    bundle: Enums.bundleType.BRNN
                });
            } else if (isWin == -1) { //从庄家飞到池子，再分给玩家
                this.scheduleOnce(() => {
                    // console.log("fly to chips")
                    let len = pool.children.length
                    for (let i = 0; i < len; i++) {
                        const chip = pool.children[i];
                        let score = parseInt(cc.find("txt_chipNum", chip).getComponent(cc.Label).string)
                        let index = this._chipList.indexOf(score)
                        let flyChip = this.getNewChip(index, score)
                        flyChip.name = chip.name
                        flyChip.parent = pool
                        flyChip.setPosition(bankerPos)
                        let pos = CCUtil.getRandomPos(pool.width - 40, pool.height - 40)
                        cc.tween(flyChip).to(0.5, {
                            position: pos,
                        }, {
                            easing: "quadIn"
                        }).start()
                    }
                    AssetsManager.playEffect({
                        path: "res/audio/fly_gold",
                        bundle: Enums.bundleType.BRNN
                    });
                }, 1)
                this.scheduleOnce(() => {
                    // console.log("fly to sb")
                    for (let i = 0; i < pool.children.length; i++) {
                        const chip = pool.children[i];
                        let endPos = selfPos
                        if (chip.name != BRNNModel.myUid) {
                            endPos = otherPos
                        }
                        cc.tween(chip).delay(0.01 * (i % 20)).to(0.5, {
                            position: endPos,
                        }, {
                            easing: "quadIn"
                        }).call(() => {
                            NodePoolManager.put(this._nodePoolName, chip)
                        }).start()
                    }
                    AssetsManager.playEffect({
                        path: "res/audio/fly_gold",
                        bundle: Enums.bundleType.BRNN
                    });
                }, 2)
            }
        }
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        let node = event.node || event.target
        let selectChipNum = BRNNModel.getSelectChip()
        // console.log("下注了===", node.name, selectChipNum)
        ApiRoom.gameMessageNotify(ApiBrnn.gameUserPourScoreNotify(selectChipNum, parseInt(node.name)));
    },

    reset() {
        this._poolList.forEach(pool => {
            let children = pool.chips.children
            for (let i = children.length - 1; i >= 0; i--) {
                let node = children[i];
                NodePoolManager.put(this._nodePoolName, node)
            }
            pool.txt_self.string = "0"
            pool.txt_all.string = "0"
        });
        this.txt_allBet.string = "总下注0"
    },
});