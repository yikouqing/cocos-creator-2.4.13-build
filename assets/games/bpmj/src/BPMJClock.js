const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const BPMJModel = require('./BPMJModel');
const ApiBpmj = require('./ApiBpmj');

cc.Class({
    extends: cc.Component,
    properties: {
        txt_time: cc.Label,
        dirsNode: cc.Node,
        dice1: cc.Sprite,
        dice2: cc.Sprite,
        diceAni: cc.Animation,
        _tick: -1,
        _lightNodeList: [],
        _chairCount: 4,
        _myChairId: 0,
    },

    gameInit(userCount, myChairID) {
        this._chairCount = userCount;
        this._myChairId = myChairID;
        /**根据人数确定位置 */
        let chairList = [0, 1, 2, 3]
        if (userCount == 2) {
            chairList = [0, 2]
        } else if (userCount == 3) {
            chairList = [0, 1, 3]
        }
        this._lightNodeList.length = 0
        for (let i = 0; i < chairList.length; i++) {
            let light = cc.find(`${chairList[i]}`, this.dirsNode)
            light.stopAllActions()
            cc.tween(light).delay(0.5).to(0.5, {
                opacity: 0
            }).to(0.5, {
                opacity: 255
            }).union().repeatForever().start()
            this._lightNodeList.push(light)
        }
        this.reset()
        /**根据自己的座位号更换每个位置的字 */
        let dirList = this.getDiriconUrl()
        for (let i = 0; i < dirList.length; i++) {
            const name = dirList[i];
            let bgurl = `res/sprite/clock/mj-turntable-dir_${name}_grey`
            let ziurl = `res/sprite/clock/mj-turntable-dir_${name}_${i}`
            let bg = cc.find("bg" + i, this.dirsNode).getComponent(cc.Sprite)
            let zi = cc.find(`${i}/zi`, this.dirsNode).getComponent(cc.Sprite)
            AssetsManager.loadSpriteFrame({
                path: bgurl,
                sprite: bg,
                bundle: Enums.bundleType.BPMJ,
            })
            AssetsManager.loadSpriteFrame({
                path: ziurl,
                sprite: zi,
                bundle: Enums.bundleType.BPMJ,
            })
        }
        this.showDiceVal(false);
    },

    /**根据自己的座位变化字 */
    getDiriconUrl() {
        let myChairID = this._myChairId
        let dirList = ["east", "north", "west", "south"]
        let userCount = this._chairCount
        if (userCount == 2) {
            if (myChairID == 1) {
                for (let i = 0; i < 2; i++) {
                    dirList.push(dirList.shift());
                }
            }
        } else if (userCount == 3) {
            dirList = ["east", "north", "south", "west"]
            if (myChairID == 1)
                dirList = ["north", "west", "south", "east"]
            if (myChairID == 2)
                dirList = ["west", "east", "south", "north"]
        } else {
            if (myChairID >= 1) {
                for (let i = 0; i < myChairID; i++) {
                    dirList.push(dirList.shift());
                }
            }
        }
        return dirList
    },

    setTick(tick) {
        this._tick = tick
        this.node.active = true;
    },

    setDir(chairID) {
        for (let i = 0; i < this._lightNodeList.length; i++) {
            const light = this._lightNodeList[i];
            light.active = i == chairID;
        }
    },

    reset() {
        for (let i = 0; i < 4; i++) {
            cc.find(`${i}`, this.dirsNode).active = false
        }
        this.setTick(0)
        this.hideDice()
        if (cc.isValid(this.diceAni)) {
            this.diceAni.node.active = false
        }
    },

    /**
     * 展示骰子动画
     * @param {number} d1 骰子点数1
     * @param {number} d2 骰子点数2
     */
    showDiceAni(d1, d2, anim = true) {
        let showDraw = () => {
            if (this.diceAni) {
                this.diceAni.node.active = false;
            }
            if (this.dice1 && this.dice2) {
                this.dice1.node.active = true
                this.dice2.node.active = true
                AssetsManager.loadSpriteFrame({
                    path: "res/dices/mj_dice-sezi_value" + d1,
                    sprite: this.dice1,
                    bundle: Enums.bundleType.BPMJ,
                })
                AssetsManager.loadSpriteFrame({
                    path: "res/dices/mj_dice-sezi_value" + d2,
                    sprite: this.dice2,
                    bundle: Enums.bundleType.BPMJ,
                })
            }

        }
        if (anim) {
            this.showDiceVal(false);
            if (this.diceAni) {
                this.diceAni.once('finished', showDraw);
                this.diceAni.node.active = true
                this.diceAni.play();
            }
            this.scheduleOnce(() => {
                this.showDiceVal(true, d1, d2);
            }, 3);
            AssetsManager.playEffect({
                path: 'res/audio/main/shaizi',
                bundle: Enums.bundleType.BPMJ
            });
        } else {
            showDraw();
        }
    },

    showDiceVal(isShow, d1, d2,) {
        let dice1 = cc.find('showdice1', this.node);
        let dice2 = cc.find('showdice2', this.node);
        if (dice1 && dice2) {
            dice1.active = isShow;
            dice2.active = isShow;
            if (!isShow) return false;
            d1 && AssetsManager.loadSpriteFrame({
                bundle: Enums.bundleType.BPMJ,
                sprite: dice1.getComponent(cc.Sprite),
                path: "res/dices/mj_dice-sezi_value" + d1,
            })
            d2 && AssetsManager.loadSpriteFrame({
                bundle: Enums.bundleType.BPMJ,
                sprite: dice2.getComponent(cc.Sprite),
                path: "res/dices/mj_dice-sezi_value" + d2,
            })
        }
    },

    /**隐藏骰子 */
    hideDice() {
        if (cc.isValid(this.dice1) && cc.isValid(this.dice2)) {
            this.dice1.node.active = false;
            this.dice2.node.active = false;
        }
    },

    update(dt) {
        if (this._tick < 0) {
            return
        }
        this._tick -= dt;
        let tick = Math.floor(this._tick);
        tick = (tick < 0) ? 0 : tick;
        tick = (tick < 10) ? '0' + tick : tick;
        this.txt_time.string = tick;
    },
});