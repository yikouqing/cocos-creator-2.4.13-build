const ApiHall = require('../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        suggestedItems: [require('UnionSuggestedItem')]
    },

    onLoad() {
        ApiHall.getUnionListSuggestedRequest((res) => {
            this.suggestInit(res.msg.result)
        });
    },

    suggestInit(data) {
        if (!data) return;
        for (let index = 0; index < this.suggestedItems.length; index++) {
            if (!this.suggestedItems[index]) continue;
            this.suggestedItems[index].bind(index, data[index]);
        }
    },

});