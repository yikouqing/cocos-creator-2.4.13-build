const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        kaishi: sp.Skeleton,
        quanleida: sp.Skeleton,
        kaishibipai: sp.Skeleton,
        showCard: cc.Node,
        lipaizhong: cc.Node,
        teshupai: cc.Node,
    },

    start() { },

    /**展示动画 1开始游戏  2全垒打 3开始比牌 */
    showSpineAni(type, cb = null) {
        let aniName = "animation"
        let aniNode = this.kaishi
        if (type == 1) {
            AssetsManager.playEffect({
                path: "res/audio/startGame",
                bundle: Enums.bundleType.QZSSS
            });
        } else if (type == 2) {
            aniName = "quanleida"
            aniNode = this.quanleida
            AssetsManager.playEffect({
                path: "res/audio/qld",
                bundle: Enums.bundleType.QZSSS
            });
            this.scheduleOnce(() => {
                AssetsManager.playEffect({
                    path: "res/audio/suiboli",
                    bundle: Enums.bundleType.QZSSS
                });
            }, 1.5)
        } else if (type == 3) {
            aniName = "animation"
            aniNode = this.kaishibipai
            AssetsManager.playEffect({
                path: "res/audio/start_compare",
                bundle: Enums.bundleType.QZSSS
            });
        }

        aniNode.node.active = true
        aniNode.setAnimation(0, aniName, false)
        aniNode.setCompleteListener(() => {
            cb && cb()
            this.node.destroy()
        });
    },

    /**展示理牌完成动画1510  type 1理牌中 2理牌完成 */
    showLiPaiFinish(type, isteshu = false) {
        this.showCard.active = true
        let initPos = []
        let nodes = this.showCard.children
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            let com = n.getComponent('QZSSSCard')
            if (!com) {
                com = n.addComponent('QZSSSCard')
                com.init()
            }
            initPos.push({
                pos: n.getPosition(),
                angle: n.angle
            })
        }
        if (type == 2) {
            this.teshupai.active = false //isteshu
            return
        }
        this.lipaizhong.active = true
        let ani = () => {
            let everyDt = 0.15
            let dt = 0
            let endPos = initPos[1].pos
            let endAngle = 0
            for (let i = 0; i < 3; i++) {
                const n = nodes[i];
                cc.tween(n).delay(dt).to(everyDt, {
                    position: endPos,
                    angle: endAngle
                }, {
                    easing: "circIn"
                }).start()
            }
            dt += everyDt
            endPos = initPos[5].pos
            for (let i = 0; i < 3; i++) {
                const n = nodes[i];
                cc.tween(n).delay(dt).to(everyDt, {
                    position: endPos
                }).start()
            }
            dt += everyDt
            for (let i = 3; i < 8; i++) {
                const n = nodes[i];
                cc.tween(n).delay(dt).to(everyDt, {
                    position: endPos,
                    angle: endAngle
                }, {
                    easing: "circIn"
                }).start()
            }
            dt += everyDt
            endPos = initPos[10].pos
            for (let i = 0; i < 8; i++) {
                const n = nodes[i];
                cc.tween(n).delay(dt).to(everyDt, {
                    position: endPos
                }).start()
            }
            dt += everyDt
            for (let i = 8; i < 13; i++) {
                const n = nodes[i];
                cc.tween(n).delay(dt).to(everyDt, {
                    position: endPos,
                    angle: endAngle
                }, {
                    easing: "circIn"
                }).start()
            }
            dt += everyDt + 0.08
            for (let i = 8; i < 13; i++) {
                const n = nodes[i];
                cc.tween(n).delay(dt).to(everyDt, {
                    position: initPos[i].pos,
                    angle: initPos[i].angle
                }, {
                    easing: "circOut"
                }).start()
            }
            dt += everyDt
            endPos = initPos[5].pos
            for (let i = 0; i < 8; i++) {
                const n = nodes[i];
                cc.tween(n).delay(dt).to(everyDt, {
                    position: endPos
                }).start()
            }
            dt += everyDt
            for (let i = 3; i < 8; i++) {
                const n = nodes[i];
                cc.tween(n).delay(dt).to(everyDt, {
                    position: initPos[i].pos,
                    angle: initPos[i].angle
                }, {
                    easing: "circOut"
                }).start()
            }
            dt += everyDt
            endPos = initPos[1].pos
            for (let i = 0; i < 3; i++) {
                const n = nodes[i];
                cc.tween(n).delay(dt).to(everyDt, {
                    position: endPos
                }).start()
            }
            dt += everyDt
            for (let i = 0; i < 3; i++) {
                const n = nodes[i];
                cc.tween(n).delay(dt).to(everyDt, {
                    position: initPos[i].pos,
                    angle: initPos[i].angle
                }, {
                    easing: "circOut"
                }).start()
            }
        }
        ani()
        this.schedule(ani, 1.8)
    },
});