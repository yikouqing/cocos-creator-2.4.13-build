const AssetsManager = require('../../../src/utils/AssetsManager');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        head: cc.Sprite,
        nick: cc.Label,
        uid: cc.Label,
        totalWin: cc.Label,
        totalLose: cc.Label,
        winMost: cc.Node,
        loseMost: cc.Node,
        hostMark: cc.Node,
        scoreList: cc.Node,
    },

    bind(data) {
        AssetsManager.loadSpriteFrame({
            path: data.avatar,
            sprite: this.head
        });
        this.nick.string = data.nickname;
        if (data.score >= 0) {
            this.totalWin.string = `+${Utils.formatNumberWithDecimal(data.score, 1)}`;
        } else if (data.score < 0) {
            this.totalWin.string = `${Utils.formatNumberWithDecimal(data.score, 1)}`;
        }
        this.winMost.active = data.winMost == data.uid;
        this.loseMost.active = data.loseMost == data.uid;
        this.hostMark.active = data.creatorUid == data.uid;
        this.uid.string = `ID:${data.uid}`;
        if (!data.winList) return;
        AssetsManager.loadAsset({
            path: 'res/prefab/GDAllResultScoreItem',
            bundle: Enums.bundleType.GD,
            aType: cc.Prefab
        }, (item) => {
            if (!item || !cc.isValid(this.scoreList)) return;
            this.scoreList.destroyAllChildren();
            for (let index = 0; index < data.winList.length; index++) {
                const score = cc.instantiate(item);
                this.scoreList.addChild(score);
                score.getComponent('GDAllResultScoreItem') && score.getComponent('GDAllResultScoreItem').bind(index + 1, data.winList[index]);
            }
        })
    },

    // update (dt) {},
});