//游戏参数定义
let Def_Nn = {};

Def_Nn.gameType = {
    /* 牛牛上庄 */
    NIUNIU: 1,
    /* 自由抢庄 */
    ZHIYOUQZ: 2,
    /* 轮庄 */
    LUNZHUANG: 3,
    /* 通比 */
    TONGBI: 4,
    /* 房主坐庄 */
    FANGZHU: 5,
    /* 明牌抢庄 */
    MINGPAIQZ: 6,
};

Def_Nn.sendCardType = {
    /* 全暗 */
    QUANAN: 1,
    /* 明3暗2 */
    MING3AN2: 2,
    /* 明4暗1 */
    MING4AN1: 3,
};

Def_Nn.scaleType = {
    /* 翻倍规则 */
    BIG: 1,
    /* 牛牛(x4)牛九(x3)牛八(x2)牛七(x2) */
    LITTLE: 2,
    /* 牛牛(x3)牛九(x2)牛八(x2) */
    DIANZI: 3,
    /* 点子牛 */
};

Def_Nn.cardsType = {
    /* 没牛 */
    MEINIU: 1,
    /* 有牛 */
    YOUNIU: 2,
    /* 牛牛 */
    NIUNIU: 3,
    /* 顺子牛 */
    SHUNZINIU: 4,
    /* 银牛 */
    YINNIU: 5,
    /* 同花牛 */
    TONGHUANIU: 6,
    /* 五花牛 */
    WUHUANIU: 7,
    /* 葫芦牛 */
    HULUNIU: 8,
    /* 五小牛 */
    WUXIAONIU: 9,
    /* 炸弹牛 */
    ZHADANNIU: 10,
    /* 一条龙 */
    YITIAOLONG: 11,
    /* 同花顺 */
    TONGHUASHUN: 12,
};

//游戏参数定义
let Def_Nnwjy = {};

Def_Nnwjy.gameType = {
    /* 牛牛上庄 */
    NIUNIU: 1,
    /* 自由抢庄 */
    ZHIYOUQZ: 2,
    /* 轮庄 */
    LUNZHUANG: 3,
    /* 通比 */
    TONGBI: 4,
    /* 房主坐庄 */
    FANGZHU: 5,
    /* 明牌抢庄 */
    MINGPAIQZ: 6,
};

Def_Nnwjy.sendCardType = {
    /* 全暗 */
    QUANAN: 1,
    /* 明3暗2 */
    MING3AN2: 2,
    /* 明4暗1 */
    MING4AN1: 3,
};

Def_Nnwjy.scaleType = {
    /* 翻倍规则 */
    BIG: 1,
    /* 牛牛(x4)牛九(x3)牛八(x2)牛七(x2) */
    LITTLE: 2,
    /* 牛牛(x3)牛九(x2)牛八(x2) */
    DIANZI: 3,
    /* 点子牛 */
};

Def_Nnwjy.cardsType = {
    /* 没牛 */
    MEINIU: 1,
    /* 有牛 */
    YOUNIU: 2,
    /* 牛牛 */
    NIUNIU: 3,
    /* 顺子牛 */
    SHUNZINIU: 4,
    /* 银牛 */
    YINNIU: 5,
    /* 同花牛 */
    TONGHUANIU: 6,
    /* 五花牛 */
    WUHUANIU: 7,
    /* 葫芦牛 */
    HULUNIU: 8,
    /* 五小牛 */
    WUXIAONIU: 9,
    /* 炸弹牛 */
    ZHADANNIU: 10,
    /* 一条龙 */
    YITIAOLONG: 11,
    /* 同花顺 */
    TONGHUASHUN: 12,
};

let Def_Dgn = {};

Def_Dgn.scaleType = {
    /* 翻倍规则 */
    BIG: 1,
    /* 牛牛(x4)牛九(x3)牛八(x2)牛七(x2) */
    LITTLE: 2,
    /* 牛牛(x3)牛九(x2)牛八(x2) */
    DIANZI: 3,
    /* 点子牛 */
};

Def_Dgn.cardsType = {
    MEINIU: 1,
    /* 没牛 */
    YOUNIU: 2,
    /* 有牛 */
    NIUNIU: 3,
    /* 牛牛 */
    SHUNZINIU: 4,
    /* 顺子牛 */
    YINNIU: 5,
    /* 银牛 */
    TONGHUANIU: 6,
    /* 同花牛 */
    WUHUANIU: 7,
    /* 五花牛 */
    HULUNIU: 8,
    /* 葫芦牛 */
    WUXIAONIU: 9,
    /* 五小牛 */
    ZHADANNIU: 10,
    /* 炸弹牛 */
    YITIAOLONG: 11,
    /* 一条龙 */
    TONGHUASHUN: 12,
    /* 同花顺 */
};

Def_Dgn.lianzhuangType = {
    SHENGZHUANG: 1,
    LUNZHUANG: 2,
};

let Def_Dzpk = {};

Def_Dzpk.blindLevelConfig = ['1/2/200', '2/4/400', '3/6/600', '4/8/800', '5/10/1000', '6/12/1200'];

let Def_Lyc = {};

//庄家规则
Def_Lyc.gameFrameType = {
    /* 抢庄 */
    QIANGZHUANG: 1,
    /* 随机庄 */
    SUIJIZHUANG: 2,
    /* 霸王庄 */
    BAWANGZHUANG: 3,
};

//游戏玩法
Def_Lyc.rateType = {
    ZOUSHUI: 1, //走水
    MABAO: 2, //走水或码宝
}

//平局规则
Def_Lyc.drawType = {
    COLORWIN: 1, //同点比花色
    NONEWIN: 2, //同点不输赢
    BANKERWIN: 3, //同点庄家赢
}

/**几副牌 */
Def_Lyc.pokerCount = {
    /**一副牌 */
    ONEDECK: 1,
    /**两副牌 */
    TWODECKS: 2,
}

let Def_Mjnn = {};

//定庄方式
Def_Mjnn.gameFrameType = {
    NIUNIU: 1, //牛牛上庄
    ZHIYOUQZ: 2, //自由抢庄
    LUNZHUANG: 3, //轮流上庄
    TONGBI: 4, //通比牛牛
    FANGZHU: 5, //房主坐庄
    MINGPAIQZ: 6, //明牌抢庄
};

Def_Mjnn.pourScores = ['1/2/3/4', '2/4/6/8', '4/8/12/16', '5/10/15/20', '8/16/24/32', '10/20/30/40'];


let Def_Sdb = {};

//庄家规则
Def_Sdb.gameFrameType = {
    /* 抢庄 */
    QIANGZHUANG: 1,
    /* 随机庄 */
    SUIJIZHUANG: 2,
    /* 霸王庄 */
    BAWANGZHUANG: 3,
};

//游戏操作
Def_Sdb.rateType = {
    NONE: 1,
    TWO: 2, //两倍
    THREE: 3, //三倍
}

let Def_Sg = {};

Def_Sg.gameType = {
    QIANGZHUANG: 1,
    /* 抢庄 */
    DACHIXIAOZHUANG: 2,
    /* 大吃小 */
    BAWANGZHUANG: 3,
    /* 霸王庄 */
    LUNZHUANG: 4,
    /* 轮庄 */
    SANGONGZHUANG: 5,
    /* 三公坐庄 */
    PAIDAZHUANG: 6,
    /* 牌大坐庄 */
};

Def_Sg.sendCardType = {
    QUANAN: 1,
    /* 全暗 */
    MING1AN2: 2,
    /* 明1暗2 */
    MING2AN1: 3,
    /* 明2暗1 */
};

Def_Sg.scaleType = {
    /* 翻倍规则 */
    BIG: 1,
    /* 8点2倍9点3倍三公4倍豹子5倍 */
    LITTLE: 2,
    /* 平赔 */
};

Def_Sg.gameTypeMode = ['QIANGZHUANG', 'DACHIXIAOZHUANG', 'BAWANGZHUANG', 'LUNZHUANG', 'SANGONGZHUANG', 'PAIDAZHUANG'];


let Def_Sgbjh = {};

Def_Sgbjh.gameType = {
    /* 抢庄 */
    QIANGZHUANG: 1,
    /* 大吃小 */
    DACHIXIAOZHUANG: 2,
    /* 霸王庄 */
    BAWANGZHUANG: 3,
    /* 轮庄 */
    LUNZHUANG: 4,
    /* 三公坐庄 */
    SANGONGZHUANG: 5,
    /* 牌大坐庄 */
    PAIDAZHUANG: 6,
};

Def_Sgbjh.sendCardType = {
    QUANAN: 1,
    /* 全暗 */
    MING1AN2: 2,
    /* 明1暗2 */
    MING2AN1: 3,
    /* 明2暗1 */
};

/* 翻倍规则 */
Def_Sgbjh.scaleType = {
    BIG: 1,
    LITTLE: 2,
};

let Def_Tw = {};

Def_Tw.wanfa = {
    NONE: 0,
    /*经典*/
    ZHUANG: 1,
    /*抢庄*/
    FENGKUANG: 2 /*疯狂*/
};

Def_Tw.mapaiType = {
    NONE: 0,
    /* 无马牌 */
    MEN1: 1,
    /* 红桃1 */
    MEN2: 2,
    /* 红桃5 */
    MEN3: 3,
    /* 红桃10 */
};

Def_Tw.wangpaiType = {
    /* 无鬼牌 */
    NONE: 0,
    /* 1张龟牌 */
    MEN1: 1,
    /* 2张鬼牌 */
    MEN2: 2,
    /* 3张鬼牌 */
    MEN3: 3,
    /* 4张鬼牌 */
    MEN3: 4,
};

Def_Tw.jifen = {
    NONE: 0,
    /*打枪*2 */
    JIA1: 1 /*打枪+1 */
};

let Def_Hz = {};

Def_Hz.gameType = {
    HONGZHONG4: 1,
    /* 4个红中 */
    HONGZHONG8: 2,
    /* 8个红中 */
};

let Fee_AJMJ = {
    Host: {
        8: 16,
        12: 24,
        16: 32
    },
}

module.exports = {
    Def_Nn,
    Def_Nnwjy,
    Def_Dgn,
    Def_Dzpk,
    Def_Lyc,
    Def_Mjnn,
    Def_Sdb,
    Def_Sg,
    Def_Sgbjh,
    Def_Tw,
    Def_Hz,
    Fee_AJMJ
};