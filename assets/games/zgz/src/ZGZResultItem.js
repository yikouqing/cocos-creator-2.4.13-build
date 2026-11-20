const ZGZModel = require("./ZGZModel")
cc.Class({
    extends: cc.Component,
    properties: {
        text_show: cc.Label,
        text_lose: cc.Label,
        text_win: cc.Label,

    },

    init(obj) {
        // avatar: "/undefined"
        // beginCards: (10)[4, 34, 18, 17, 33, 60, 43, 27, 42, 37]
        // chairID: 1
        // nickname: "机器人-90"
        // uid: "839990"
        // userCards: (5)[18, 33, 43, 27, 42]
        // userScore: 1967
        // winScores: -5
        console.log("ZGZResultItem init=============", obj);
        let score = obj.winScores || 0;
        let isWin = score > 0;
        this.text_win.node.active = isWin;
        this.text_lose.node.active = !isWin;
        if (isWin) {
            this.text_win.string = "+" + score;
        } else {
            this.text_lose.string = score;
        }
        this.text_show.string = ZGZModel.getTakingUID(obj.uid);
    },

    // update (dt) {},
});
