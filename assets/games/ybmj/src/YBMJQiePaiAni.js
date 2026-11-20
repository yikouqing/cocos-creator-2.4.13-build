const ApiRoom = require('../../../src/api/ApiRoom');
const ApiYbmj = require('./ApiYbmj');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const YBMJModel = require('./YBMJModel');
const Utils = require('../../../src/utils/Utils');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad() {
        CCUtil.nodeRecursive(this.node, (node) => {
            if (node.name.startsWith("mj")) {
                let com = node.addComponent("YBMJSingleTile")
                com.init()
            }
        })
    },

    start() {
        this.showAin02("0", 150, 300)
        this.showAin02("2", -150, -300)
        this.showAin13("1", -70, 200)
        this.showAin13("3", 70, -200)
        this.showAniPoints(0.8)
        this.showAniArrow(0.8)
        cc.tween(this.node).delay(4).removeSelf().start()
    },

    showAin02(name, firstMoveDist, secondMoveDist) {
        let layout = this.node.getChildByName(name)
        let children = layout.children
        for (let i = 0; i < children.length / 2; i++) {
            const node = layout.getChildByName(i + "")
            let initX = node.x
            cc.tween(node).by(0.5, {
                y: firstMoveDist
            }, {
                easing: "quadIn"
            }).delay(0.2).to(0.5, {
                x: initX + secondMoveDist,
                opacity: 0
            }, {
                easing: "quadIn"
            }).delay(1).to(0.5, {
                x: initX,
                opacity: 255
            }, {
                easing: "quadIn"
            }).delay(0.2).by(0.5, {
                y: -firstMoveDist
            }, {
                easing: "quadIn"
            }).start()
        }
    },
    showAin13(name, firstMoveDist, secondMoveDist) {
        let layout = this.node.getChildByName(name)
        let children = layout.children
        for (let i = 0; i < children.length / 2; i++) {
            const node = layout.getChildByName(i + "")
            let initY = node.y
            cc.tween(node).by(0.5, {
                x: firstMoveDist
            }, {
                easing: "quadIn"
            }).delay(0.2).to(0.5, {
                y: initY + secondMoveDist,
                opacity: 0
            }, {
                easing: "quadIn"
            }).delay(1).to(0.5, {
                y: initY,
                opacity: 255
            }, {
                easing: "quadIn"
            }).delay(0.2).by(0.5, {
                x: -firstMoveDist
            }, {
                easing: "quadIn"
            }).start()
        }
    },
    showAniPoints(dt) {
        let dian = this.node.getChildByName("dian")
        let children = dian.children
        let qiepai = this.node.getChildByName("qiepai")
        qiepai.opacity = 0
        cc.tween(qiepai).delay(dt).to(0.1, {
            opacity: 255
        }).start()

        for (let i = 0; i < children.length; i++) {
            const node = dian.getChildByName(i + "")
            node.opacity = 0
            dt += i * 0.3
            cc.tween(node).delay(dt).to(0.1, {
                opacity: 255
            }).start()
        }

        dt += 0.6
        cc.tween(dian).delay(dt).to(0.2, {
            opacity: 0
        }).start()
    },
    showAniArrow(dt) {
        let arrow = this.node.getChildByName("arrow")
        arrow.opacity = 0
        cc.tween(arrow).delay(dt).to(0.1, {
            opacity: 255
        }).to(2, {
            angle: 360
        }, {
            easing: "quadInOut"
        }).start()
    }
});