const AssetsManager = require('../../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        setItenms: [require('UnionAddBaseRebateControllerItem')],
        _comp: null
    },

    init(comp) {
        this._comp = comp;
    },

    reset() {
        for (const item of this.setItenms) {
            if (!item) continue;
            item.init();
        }
    },

    sync(data) {
        for (let index = 0; index < this.setItenms.length; index++) {
            if (!this.setItenms[index]) continue;
            this.setItenms[index].sync(data[index]);
        }
    },

    onClick() {
        let configs = [];
        let unRule = false;
        for (let index = 0; index < this.setItenms.length; index++) {
            let curItem = this.setItenms[index];
            let curConfig = curItem.getConfig();
            if (curConfig.minScore == 0 || curConfig.maxScore == 0) continue;
            if (index == 0) {
                if (curConfig.maxScore > curConfig.minScore) {
                    configs.push(curConfig);
                } else {
                    unRule = true;
                }
            } else {
                let abvConfig = configs.pop();
                if (!!abvConfig) {
                    configs.push(abvConfig);
                    if (curConfig.maxScore > curConfig.minScore
                        && curConfig.minScore >= abvConfig.maxScore) {
                        configs.push(curConfig);
                    } else {
                        unRule = true;
                    }
                } else {
                    if (curConfig.maxScore > curConfig.minScore) {
                        configs.push(curConfig);
                    } else {
                        unRule = true;
                    }
                }
            }
        }
        // console.log('测试---', configs)
        if (!!unRule) {
            AssetsManager.popDialog({
                content: `检测到不符合条件的分数设定，点击确定系统已为您自动过滤，是否继续？`,
                ok: () => {
                    this._comp.setLadderScore(configs);
                    this.sync(configs);
                    this.node.active = false;
                },
                no: () => { }
            });
            return;
        }
        this._comp.setLadderScore(configs);
        this.sync(configs);
        this.node.active = false;
    },

});