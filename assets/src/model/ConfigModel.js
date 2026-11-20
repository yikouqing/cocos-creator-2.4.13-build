const Configs = require('../const/Configs');
const SubManager = require('../utils/SubManager');
const Utils = require('../utils/Utils');
const Enums = require('../const/Enums');
const Skin = require('../const/Skin');
const UserModel = require('../../src/model/UserModel');
const MessageCallback = require('../utils/MessageCallback');
const CryptoUtil = require('../utils/CryptoUtil');
const CacheManager = require('../utils/CacheManager');

const {
    Def_Dgn,
    Def_Nn,
    Def_Nnwjy
} = require('../const/Defines');

var exp = module.exports;

//初始化配置参数
exp.init = function () { };

exp.checkLicense = function (data) {
    let licenseAuth = this.getAuthKey('licenseAuth');
    let decrypt = data;
    if (!!licenseAuth) {
        let license = data.license || JSON.stringify({});
        decrypt = CryptoUtil.license(license);
    }
    this.setDatas(decrypt);
}

exp.getData = function (key) {
    return this[key];
};

exp.setDatas = function (data) {
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            this[key] = data[key];
        }
    }
    Utils.log(this.getData('logPrint'));
};

exp.setData = function (key, val) {
    this[key] = val;
};

//获取礼物配置
exp.getGiftConfig = function (id) {
    let gifts = Configs.gifts;
    if (!gifts) return;
    let gift = gifts.find((item) => {
        return !!item && item.id == id;
    });
    return gift;
}

//获取聊天配置
exp.getChatTextConfigById = function (index) {
    if (!Configs.chatText) return '';
    let texts = Configs.chatText;
    return texts[index] || '未知数据';
}

exp.getChatTextAudio = function (sex, id) {
    return 'audio/chat/text/' + ((sex == 0) ? 'man/' : 'woman/') + id;
}

//获取 bundle 配置
exp.getBundleConfig = function (type) {
    let bundles = Configs.bundles;
    let bundle = bundles.find((item) => {
        return item.type === type || item.bundle === type;
    });
    return bundle;
}

exp.getGameClass = function (type) {
    let gameClass = Enums.gameClass || [];
    return gameClass[type] || '未知';
}

//兼容多个游戏共用一套资源的问题
exp.getBundleDeps = function (bundle) {
    let configs = Configs.bundles,
        games = [];
    configs.forEach((config) => {
        if (config.bundle == bundle) {
            games.push(config.type);
        }
    });
    return games;
};

exp.isLocked = function (type) {
    let filter = this.getData('lockGames') || [];
    return !!filter.includes(type);
}

exp.canCreate = function (type) {
    if (cc.sys.isBrowser) return true;
    let filter = this.getBundles();
    return filter.includes(parseInt(type));
}

exp.getBundles = function () {
    let temps = [];
    let bundles = this.getBundleConfigs();
    bundles.forEach((item) => {
        if (item.classify != Enums.bundleClass.SKIN) {
            temps.push(item.type);
        }
    });
    let creates = this.getData('openGames') || temps;
    creates = creates || [];
    creates.sort((a, b) => {
        return a - b;
    });
    creates.sort((a, b) => {
        let ac = this.getBundleConfig(a);
        let bc = this.getBundleConfig(b);
        return !!ac && !!bc && bc.sort - ac.sort;
    });
    return creates;
}

//获取模块配置
exp.getBundleConfigs = function () {
    let bundles = Configs.bundles;
    return bundles;
}

/**
 * 获取自定义游戏的分类
 * @param {num} type 1 获取麻将分类  2 获取视频分类 
 * @returns 
 */
exp.getCustomGameTypes = function (type) {
    let types = [];
    let bundles = this.getBundles();
    bundles.forEach(game => {
        let bundle = this.getBundleConfig(game);
        if (type == 1 && bundle.classify === Enums.bundleClass.MAJIANG) {
            types.push(game)
        } else if (type == 2 && bundle.review.video.bundle != null) {
            types.push(game)
        }
    });
    return types
}

exp.getUnionSync = function () {
    let tick = this.getData("unionSyncTick") || 3;
    return tick;
}

/**
 * 获取分享时候的游戏名字
 * @param {*} bundle 
 */
exp.getRoomShare = function (bundle, roomId) {
    let share = `${Configs.appName}-${this.getGameName(bundle)} 房间号:${roomId}`
    return share;
}
/**
 * 获取游戏规则详情
 * @param {*} gameRule 游戏规则
 * @param {*} spacer 间隔符》默认" "
 * @param {*} isRichText 富文本模式》默认false
 * @returns 
 */
exp.getRoomRuleShare = function (roomRule, format = null) {
    let gameRule = Utils.deepCopy(roomRule);
    let spacer = format && format.spacer ? format.spacer : " ";
    let share = {
        title: '',
        content: '',
        url: '',
        baseTitle: '底分',
        baseScore: '0',
        roundTitle: '局',
        roundShowTitle: '局数'
    }
    if (!gameRule) return share;
    share.baseScore = gameRule.baseScore || 1;
    let bundleConfig = this.getBundleConfig(gameRule.gameType);
    let canPourScoresTemp = [];
    if (bundleConfig && bundleConfig.classify == Enums.bundleClass.BAIREN) {
        share.baseTitle = '下注';
        let canPourScores = gameRule.pourRate || [];
        if (!!canPourScores) {
            canPourScores.forEach(item => {
                canPourScoresTemp.push(Utils.formatNumberWithDecimal(item, 2));
            })
        }
        share.baseScore = `${canPourScoresTemp.join('/')}`;
    } else if (gameRule.gameType == Enums.bundleType.NN ||
        gameRule.gameType == Enums.bundleType.MJNN ||
        gameRule.gameType == Enums.bundleType.CJSJY ||
        gameRule.gameType == Enums.bundleType.WJYNN ||
        gameRule.gameType == Enums.bundleType.PTJ ||
        gameRule.gameType == Enums.bundleType.SGBJH ||
        gameRule.gameType == Enums.bundleType.SG) {
        share.baseTitle = '下注';
        let canPourScores = gameRule.canPourScores || [];
        if (!!canPourScores) {
            canPourScores.forEach(item => {
                canPourScoresTemp.push(Utils.formatNumberWithDecimal(item * gameRule.baseScore, 2));
            })
        }
        share.baseScore = `${canPourScoresTemp.join('/')}`;
    } else if (gameRule.gameType == Enums.bundleType.DGN) {
        share.baseTitle = '首庄';
        share.baseScore = gameRule.shouzhuang || 0;
    } else if (gameRule.gameType == Enums.bundleType.LAMJ) {
        share.baseTitle = "嘴子数";
    } else {
        share.baseScore = gameRule.baseScore || 1;
        share.baseTitle = '底分';
    }
    if (gameRule.gameType == Enums.bundleType.CNJJ || gameRule.gameType == Enums.bundleType.LSEQS) {
        share.roundTitle = '圈';
        share.roundShowTitle = '圈数';
    }
    if (gameRule.gameType == Enums.bundleType.MASMJ) {
        if (gameRule.bureauDao > 0)
            share.roundTitle = '倒';
    }
    share.url = `${this.getData('downloadUrl')}?roomId=${gameRule.roomId}`;
    share.title = `${Configs.appName}-${this.getGameName(gameRule.gameType)}`;
    let rules = {};
    let wanfa = [];
    let rule = '';
    let bundle = this.getBundleConfig(gameRule.gameType);
    if (!!bundle && bundle.classify != Enums.bundleClass.BAIREN) {
        rules.jushu = `${share.roundShowTitle}：${gameRule.bureau}${share.roundTitle} `;
    }
    let ticketScore = parseFloat(gameRule.ticketScore);
    if (!isNaN(ticketScore) && ticketScore > 0) {
        rules.fangfei = `门票：${Utils.formatNumberWithDecimal(gameRule.ticketScore, 1)}分`;
    }
    if (gameRule.gameType === Enums.bundleType.SZ) {
        rules.xztime = `下注时间：${gameRule.pourTick}秒`;
        if (gameRule.shunJinAward > 0 || gameRule.baoZiAward > 0) {
            let xifen = [];
            if (gameRule.shunJinAward > 0) {
                xifen.push(`顺金${gameRule.shunJinAward}`)
            }
            if (gameRule.baoZiAward > 0) {
                xifen.push(`豹子${gameRule.baoZiAward}`)
            }
            rules.xifen = `喜分：${xifen.join(' ')}`;
        }
        if (gameRule.gameFrameType > 0) {
            wanfa.push(`闷${gameRule.gameFrameType}轮`)
        } else {
            wanfa.push("不闷")
        }
        if (gameRule.isA23Big) {
            wanfa.push("A23>JQK")
        }
        if (gameRule.is235Big) {
            wanfa.push("235吃豹子")
        }
        if (gameRule.isCompareDouble) {
            wanfa.push("比牌双倍分")
        }
        if (gameRule.shunZiBig) {
            wanfa.push("顺子>同花")
        }
        rules.lunshu = `轮数：${gameRule.roundType}轮`
        if (gameRule.compareRound > 0) {
            rules.bipai = `比牌：${gameRule.compareRound}轮后可比牌`
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        rules.fengding = `封顶：${gameRule.maxScore}倍底分`
        rules.tongpai = `同牌：${gameRule.isLooKLose ? "先比为输" : "比花色"}`
    } else if (gameRule.gameType === Enums.bundleType.LYC) {
        if (gameRule.basePourType) {
            let yafen = ["", "0.5/1/2/3", "1/2/3/4", "2/4/6/8"]
            rules.yafen = `压分：${yafen[gameRule.basePourType]}`
        }
        rules.puke = `扑克：${gameRule.pokerCount}副牌`
        if (gameRule.robBankLimit) {
            rules.robBankLimit = `抢庄：大于${gameRule.robBankLimit}分可以抢庄`
        }
        if (gameRule.rateType == 1) {
            wanfa.push("走水")
        } else if (gameRule.rateType == 2) {
            wanfa.push("走水或码宝")
            wanfa.push(`码宝次数${gameRule.maBaoCount}`)
        }
        if (gameRule.manorMayPileTreasure) {
            wanfa.push("庄家码宝")
        }

        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        rules.teshu = `特殊：${gameRule.drawType == 1 ? '同点比花色' : gameRule.drawType == 2 ? '同点不输赢' : '同点庄家赢'} ${gameRule.gameFrameType == 3 ? '霸王庄' : gameRule.gameFrameType == 2 ? '随机庄' : '抢庄'}`;
    } else if (gameRule.gameType === Enums.bundleType.NN) {
        rules.moshi = `模式：${['无特殊模式', '牛牛上庄', '自由抢庄', '轮庄', '通比', '房主坐庄', '明牌抢庄'][gameRule.gameFrameType]} ${gameRule.ruffianType == 3 ? '随机癞子' : gameRule.ruffianType == 2 ? '王癞子' : '无癞子'}`;
        rules.wanfa1 = `玩法：${['', '全暗', '明3暗2', '明4暗1'][gameRule.sendCardType]} ${['', '牛牛(x4)牛九(x3)牛八(x2)牛七(x2)', '牛牛(x3)牛九(x2)牛八(x2)', '点子牛'][gameRule.scaleType]}`;
        rules.wanfa2 = `抢庄限制：${gameRule.robBankLimit == 0 ? '无' : gameRule.robBankLimit}分 `;
        rules.wanfa3 = `推注：${gameRule.tuizhu ? gameRule.tuiScale[0] + '倍' : '不推'} `;
        rules.wanfa4 = `中途进入：${gameRule.canEnter ? '中途进人(后3局不能进入)' : '中途不可进入'}`;
        let teshu = [];
        if (!!gameRule.cardsType.TONGHUASHUN) {
            teshu.push(gameRule.scaleType == Def_Nn.scaleType.DIANZI ? '同花顺(16倍)' : '同花顺(10倍)');
        }
        if (!!gameRule.cardsType.YITIAOLONG) {
            teshu.push(gameRule.scaleType == Def_Nn.scaleType.DIANZI ? '一条龙(15倍)' : '一条龙(9倍)');
        }
        if (!!gameRule.cardsType.ZHADANNIU) {
            teshu.push(gameRule.scaleType == Def_Nn.scaleType.DIANZI ? '炸弹牛(14倍)' : '炸弹牛(8倍)');
        }
        if (!!gameRule.cardsType.ZHADANNIU) {
            teshu.push(gameRule.scaleType == Def_Nn.scaleType.DIANZI ? '五小牛(13倍)' : '五小牛(7倍)');
        }
        if (!!gameRule.cardsType.HULUNIU) {
            teshu.push(gameRule.scaleType == Def_Nn.scaleType.DIANZI ? '葫芦牛(12倍)' : '葫芦牛(6倍)');
        }
        if (!!gameRule.cardsType.WUHUANIU) {
            teshu.push(gameRule.scaleType == Def_Nn.scaleType.DIANZI ? '五花牛(11倍)' : '五花牛(5倍)');
        }
        if (!!gameRule.cardsType.TONGHUANIU) {
            teshu.push(gameRule.scaleType == Def_Nn.scaleType.DIANZI ? '同花牛(11倍)' : '同花牛(5倍)');
        }
        if (!!gameRule.cardsType.SHUNZINIU) {
            teshu.push(gameRule.scaleType == Def_Nn.scaleType.DIANZI ? '顺子牛(11倍)' : '顺子牛(4倍)');
        }
        if (teshu.length != 0) {
            rules.teshu = `特殊设置：${teshu.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.WJYNN) {
        rules.moshi = `模式：${['无特殊模式', '牛牛上庄', '自由抢庄', '轮庄', '通比', '房主坐庄', '明牌抢庄'][gameRule.gameFrameType]} ${gameRule.ruffianType == 3 ? '随机癞子' : gameRule.ruffianType == 2 ? '王癞子' : '无癞子'}`;
        rules.wanfa1 = `玩法：${['', '全暗', '明4暗2', '明5暗1'][gameRule.sendCardType]} ${['', '牛牛(x4)牛九(x3)牛八(x2)牛七(x2)', '牛牛(x3)牛九(x2)牛八(x2)', '点子牛'][gameRule.scaleType]}`;
        rules.wanfa2 = `抢庄限制：${gameRule.robBankLimit == 0 ? '无' : gameRule.robBankLimit}分 `;
        rules.wanfa3 = `推注：${gameRule.tuizhu ? gameRule.tuiScale[0] + '倍' : '不推'} `;
        rules.wanfa4 = `中途进入：${gameRule.canEnter ? '中途进人(后3局不能进入)' : '中途不可进入'}`;
        let teshu = [];
        if (!!gameRule.cardsType.TONGHUASHUN) {
            teshu.push(gameRule.scaleType == Def_Nnwjy.scaleType.DIANZI ? '同花顺(16倍)' : '同花顺(10倍)');
        }
        if (!!gameRule.cardsType.YITIAOLONG) {
            teshu.push(gameRule.scaleType == Def_Nnwjy.scaleType.DIANZI ? '一条龙(15倍)' : '一条龙(9倍)');
        }
        if (!!gameRule.cardsType.ZHADANNIU) {
            teshu.push(gameRule.scaleType == Def_Nnwjy.scaleType.DIANZI ? '炸弹牛(14倍)' : '炸弹牛(8倍)');
        }
        if (!!gameRule.cardsType.ZHADANNIU) {
            teshu.push(gameRule.scaleType == Def_Nnwjy.scaleType.DIANZI ? '五小牛(13倍)' : '五小牛(7倍)');
        }
        if (!!gameRule.cardsType.HULUNIU) {
            teshu.push(gameRule.scaleType == Def_Nnwjy.scaleType.DIANZI ? '葫芦牛(12倍)' : '葫芦牛(6倍)');
        }
        if (!!gameRule.cardsType.WUHUANIU) {
            teshu.push(gameRule.scaleType == Def_Nnwjy.scaleType.DIANZI ? '五花牛(11倍)' : '五花牛(5倍)');
        }
        if (!!gameRule.cardsType.TONGHUANIU) {
            teshu.push(gameRule.scaleType == Def_Nnwjy.scaleType.DIANZI ? '同花牛(11倍)' : '同花牛(5倍)');
        }
        if (!!gameRule.cardsType.SHUNZINIU) {
            teshu.push(gameRule.scaleType == Def_Nnwjy.scaleType.DIANZI ? '顺子牛(11倍)' : '顺子牛(4倍)');
        }
        if (teshu.length != 0) {
            rules.teshu = `特殊设置：${teshu.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.SG) {
        rules.wanfa = `玩法：${['', '全暗', '明1暗2', '明2暗1'][gameRule.sendCardType]} ${['', '抢庄', '大吃小', '霸王庄', '轮庄', '三公坐庄', '牌大坐庄'][gameRule.gameFrameType]}`;
        rules.teshu = `特殊：${['无', '8点2倍9点3倍三公4倍豹子5倍', '平赔'][gameRule.scaleType]}`;
    } else if (gameRule.gameType === Enums.bundleType.PDK || gameRule.gameType === Enums.bundleType.XGPDK) {
        wanfa.push(`${gameRule.cardCount == 16 ? "经典玩法" : "15张玩法"}`);
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        let teshu = [];
        if (!!gameRule.bichu) {
            teshu.push('必须出牌')
        } else {
            teshu.push('可不出牌')
        }
        if (!!gameRule.heitao3) {
            teshu.push('首局黑桃3先出');
        }
        if (!!gameRule.hongtao10) {
            teshu.push('红桃10双倍');
        }
        if (!!gameRule.fourTakeThree) {
            teshu.push('允许4带3');
        }
        if (!!gameRule.fourTakeTwo) {
            teshu.push('允许4带2');
        }
        if (!!gameRule.a3Boom) {
            teshu.push('3A算炸弹');
        }
        if (!!gameRule.baiwei) {
            teshu.push('最后一手牌:3张关3张 3带1关3带1 3带2关3带2');
        }
        if (!!gameRule.chaizhadan) {
            teshu.push('炸弹可拆');
        } else {
            teshu.push('炸弹不可拆');
        }
        if (!!gameRule.showCardsCount) {
            teshu.push('显示牌数');
        }
        if (!!gameRule.boomScore) {
            teshu.push(`炸弹${gameRule.boomScore}分`);
        }
        if (gameRule.gameType === Enums.bundleType.XGPDK && !!gameRule.xiaoguan) {
            teshu.push(`小关`);
        }
        rules.teshu = `特殊：${teshu.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.ERPDK) {
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        let teshu = [];
        if (!!gameRule.bichu) {
            teshu.push('必须出牌')
        } else {
            teshu.push('可不出牌')
        }
        if (!!gameRule.heitao5) {
            teshu.push('首局黑桃5先出');
        }
        if (!!gameRule.hongtao10) {
            teshu.push('扎鸟');
        }
        if (!!gameRule.chaizhadan) {
            teshu.push('炸弹可拆');
        } else {
            teshu.push('炸弹不可拆');
        }
        if (!!gameRule.showCardsCount) {
            teshu.push('显示牌数');
        }
        if (!!gameRule.boomScore) {
            teshu.push(`炸弹${gameRule.boomScore}分`);
        }
        rules.teshu = `特殊：${teshu.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.GCT) {
        if (!!gameRule.shuaiWei) {
            wanfa.push('甩尾');
        }
        if (!!gameRule.yiTiaoLong) {
            wanfa.push('一条龙自然春');
        }
        if (!!gameRule.ziRanChun) {
            wanfa.push('自然春');
        }
        if (wanfa.length != 0) {
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
        }
        let teshu = [];
        if (!!gameRule.bichu) {
            teshu.push('必须出牌');
        } else {
            teshu.push('可不出牌');
        }
        if (!!gameRule.fourTakeTwo) {
            teshu.push('允许4带2');
        }
        rules.teshu = `玩法：${teshu.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.HZMJ) {
        if (gameRule.zhaNiao == 0) {
            wanfa.push("不扎码")
        } else if (gameRule.zhaNiao == 1) {
            wanfa.push("一码全中")
        } else if (gameRule.zhaNiao > 0) {
            wanfa.push(`扎${gameRule.zhaNiao}码`)
        }

        if (gameRule.gangHua2Bei) {
            wanfa.push("杠上花2倍")
        }
        if (gameRule.qingGang3Bei) {
            wanfa.push("抢杠胡3倍")
        }
        if (gameRule.isHasQingYiSe) {
            wanfa.push("清一色5倍")
        }
        if (gameRule.isHasTianHu) {
            wanfa.push("天胡10倍")
        }
        if (gameRule.unReadyKick) {
            wanfa.push("10秒未准备踢出")
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        let kehu = []

        if (gameRule.isHasQiDui) {
            kehu.push("七对可胡")
        }
        if (gameRule.isHongZhongHu) {
            kehu.push("四红中可胡")
        }
        if (kehu.length > 0) {
            rules.kehu = `胡牌：${kehu.join(' ')}`
        }
    } else if (gameRule.gameType === Enums.bundleType.DGN) {
        wanfa.push(`首庄${gameRule.shouzhuang}`);
        wanfa.push("下庄分" + gameRule.xiazhuangfen);
        wanfa.push("首局底注" + parseFloat(gameRule.firstBureauRate) * 100 + "%");
        wanfa.push("首局后底注" + parseFloat(gameRule.bureauRate) * 100 + "%");
        if (gameRule.scaleType == 1 || gameRule.scaleType == 2) {
            wanfa.push(['', '牛牛(x4)牛九(x3)牛八(x2)牛七(x2)', '牛牛(x3)牛九(x2)牛八(x2)', '点子牛'][gameRule.scaleType])
        }
        if (gameRule.lianzhuangType == 1 || gameRule.lianzhuangType == 2) {
            wanfa.push(['', '升庄', '轮庄'][gameRule.lianzhuangType]);
        }
        if (gameRule.lianzhuangCount == 1 || gameRule.lianzhuangCount == 2) {
            wanfa.push(['', '升庄次数1次', '升庄次数2次'][gameRule.lianzhuangCount]);
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        let teshu = [];
        if (!!gameRule.cardsType.TONGHUASHUN) {
            teshu.push(gameRule.scaleType == Def_Dgn.scaleType.DIANZI ? '同花顺(16倍)' : '同花顺(10倍)');
        }
        if (!!gameRule.cardsType.YITIAOLONG) {
            teshu.push(gameRule.scaleType == Def_Dgn.scaleType.DIANZI ? '一条龙(15倍)' : '一条龙(9倍)');
        }
        if (!!gameRule.cardsType.ZHADANNIU) {
            teshu.push(gameRule.scaleType == Def_Dgn.scaleType.DIANZI ? '炸弹牛(14倍)' : '炸弹牛(8倍)');
        }
        if (!!gameRule.cardsType.ZHADANNIU) {
            teshu.push(gameRule.scaleType == Def_Dgn.scaleType.DIANZI ? '五小牛(13倍)' : '五小牛(7倍)');
        }
        if (!!gameRule.cardsType.HULUNIU) {
            teshu.push(gameRule.scaleType == Def_Dgn.scaleType.DIANZI ? '葫芦牛(12倍)' : '葫芦牛(6倍)');
        }
        if (!!gameRule.cardsType.WUHUANIU) {
            teshu.push(gameRule.scaleType == Def_Dgn.scaleType.DIANZI ? '五花牛(11倍)' : '五花牛(5倍)');
        }
        if (!!gameRule.cardsType.TONGHUANIU) {
            teshu.push(gameRule.scaleType == Def_Dgn.scaleType.DIANZI ? '同花牛(11倍)' : '同花牛(5倍)');
        }
        if (!!gameRule.cardsType.SHUNZINIU) {
            teshu.push(gameRule.scaleType == Def_Dgn.scaleType.DIANZI ? '顺子牛(11倍)' : '顺子牛(4倍)');
        }
        if (teshu.length != 0) {
            rules.teshu = `特殊：${teshu.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.SSS) {
        let colorCount = 0;
        if (!!gameRule.colors) {
            let colors = gameRule.colors;
            for (const key in colors) {
                if (colors[key]) {
                    colorCount++;
                }
            }
        }
        rules.wanfa = `模式：${["经典模式", "抢庄模式", "疯狂模式"][gameRule.wanfa]}`;
        if (colorCount != 0) {
            wanfa.push(`加${colorCount}色`);
        } else {
            wanfa.push('不加色');
        }
        wanfa.push(["无马牌", "马牌:黑桃A", "马牌:黑桃5", "马牌:黑桃10"][gameRule.mapai]);
        wanfa.push(gameRule.wangpai == 0 ? "无王牌" : gameRule.wangpai + "张王牌");
        wanfa.push(["打枪*2 全垒打*4", "打枪+1 全垒打+2"][gameRule.jifen]);
        wanfa.push(["摆牌时间90秒", "摆牌时间120秒", "摆牌时间180秒"][gameRule.time]);
        wanfa.push(gameRule.tesupai ? "有特殊牌" : "无特殊牌");
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.XZMJ) {
        wanfa.push(`${gameRule.roomType}房${gameRule.cardCount}张`);
        wanfa.push(gameRule.maxRate == 0 ? '不封顶' : `${gameRule.maxRate}番封顶`);
        wanfa.push(gameRule.ziMoRateType == 1 ? '自摸加底' : gameRule.ziMoRateType == 2 ? '自摸加番' : '自摸不加');
        wanfa.push(`点杠花(${gameRule.dianGangHua == 1 ? '单人' : gameRule.dianGangHua == 2 ? '点炮' : '多人'})`);
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        let teshu = [];
        if (!!gameRule.huanSanZhang) {
            teshu.push('换三张');
        }
        if (!!gameRule.huJiaoZhuanYi) {
            teshu.push('呼叫转移');
        }
        if (!!gameRule.jiShiYu) {
            teshu.push('及时雨');
        }
        if (!!gameRule.menQingZhongZhang) {
            teshu.push('门清中张');
        }
        if (!!gameRule.yaoJiuJiangDui) {
            teshu.push('幺九将对');
        }
        if (!!gameRule.tianDiHu) {
            teshu.push('天地胡');
        }
        if (!!gameRule.lunZhuang) {
            teshu.push('轮庄');
        }
        if (!!gameRule.duiDuiDouble) {
            teshu.push('对对胡两番');
        }
        if (!!gameRule.erFenQiHu) {
            teshu.push('两分起胡');
        }
        if (!!gameRule.jiaXinWu) {
            teshu.push('夹心五');
        }
        if (!!gameRule.tianDiHu) {
            teshu.push('天地胡');
        }
        if (!!gameRule.showLiuShui) {
            teshu.push('显示流水');
        }
        if (!!gameRule.guoZhuangGuoHu) {
            teshu.push('过庄过胡');
        }
        if (!!gameRule.addLaiZi) {
            teshu.push('癞子玩法');
        }
        if (!!gameRule.laiZiDouble) {
            teshu.push('无癞子加番');
        }
        if (!!gameRule.chaHuaZhu) {
            teshu.push('查花猪');
        }
        if (!!gameRule.chaHuaZhuLimit) {
            teshu.push('查花猪限制');
        }
        if (!!gameRule.guoPengGuoQuan) {
            teshu.push('过碰过圈');
        }
        if (!!gameRule.yiTiaoLong) {
            teshu.push('一条龙');
        }
        if (!!gameRule.jueZhangDouble) {
            teshu.push('胡绝张加番');
        }
        if (!!gameRule.siJiaoPei) {
            teshu.push('死叫不算叫');
        }
        if (!!gameRule.guoShouJiaFanHu) {
            teshu.push('过手加番可胡');
        }
        if (!!gameRule.youHuBiHu) {
            teshu.push('后四张必胡');
        }
        if (!!gameRule.kaErTiao) {
            teshu.push('卡二条');
        }
        if (teshu.length != 0) {
            rules.teshu = `特殊：${teshu.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.FXJ) {
        wanfa.push(gameRule.maxRate == 0 ? '不封顶' : `封顶${gameRule.maxRate}番`);
        wanfa.push(['不养猪', '养1猪', '养2猪', '自由养猪'][gameRule.pigScoreType]);
        wanfa.push(['', '飞小鸡', '飞白板', '飞双鬼', '硬麻将'][gameRule.playType]);
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        let teshu = [];
        if (!!gameRule.isChi) {
            teshu.push('可吃牌');
        }
        if (!!gameRule.isLackCard) {
            teshu.push('缺一门');
        }
        if (!!gameRule.isDianJi) {
            teshu.push('点鸡');
        }
        if (!!gameRule.shuangGangShangHua) {
            teshu.push('双杠上花');
        }
        if (!!gameRule.sanGangShangHua) {
            teshu.push('三杠上花');
        }
        if (gameRule.shiSanYaoDianPao == 2) {
            teshu.push('手提十三幺点炮2分');
        } else if (gameRule.shiSanYaoDianPao == 4) {
            teshu.push('手提十三幺点炮4分');
        }
        if (teshu.length != 0) {
            rules.teshu = `特殊：${teshu.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.SGBJH) {
        if (gameRule.sendCardType != 0 && gameRule.sendCardType < 4) {
            wanfa.push(['', '全暗', '明1暗2', '明2暗1'][gameRule.sendCardType]);
        }
        wanfa.push('抢庄');
        if (!!gameRule.haveJoker) {
            wanfa.push('王癞子');
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        rules.fanbei = `翻倍：三公 7点-2倍,8点-3倍,9点-4倍,三公-5倍,999到AAA-6倍,KKK到101010-7倍,333-8倍;金花 豹子-6倍,顺金-5倍,金花-4倍,顺子-3倍,对子-2倍,散牌-1倍 `
    } else if (gameRule.gameType === Enums.bundleType.SDB) {
        if (gameRule.gameFrameType != 0 && gameRule.gameFrameType < 4) {
            wanfa.push(['', '抢庄', '随机庄', '霸王庄'][gameRule.gameFrameType]);
        }
        if (!!gameRule.tianWangRate) {
            wanfa.push('天王x5倍');
        }
        if (!!gameRule.huaWuXiaoRate) {
            wanfa.push('花五小x4倍');
        }
        if (!!gameRule.wuXiaoRate) {
            wanfa.push('五小x3倍');
        }
        if (wanfa.length != 0) {
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.CX) {
        rules.scene = `场景：${gameRule.sceneType == Enums.deviceOrientation.V ? '竖屏' : '横屏'}`;
        wanfa.push(`最低带入${gameRule.bringScore}`);
        wanfa.push(`芒果倍数${gameRule.mangoRate > 0 ? gameRule.mangoRate + '倍' : '无限'}`);
        if (!!gameRule.isDiJiuWang) {
            wanfa.push('地九王');
        }
        if (!!gameRule.isQuanMangZouMang) {
            wanfa.push('圈芒|揍芒');
        }
        if (!!gameRule.isBiFaKeXiu) {
            wanfa.push('必发招|可休');
        }
        if (!!gameRule.isChaKanDiPai) {
            wanfa.push('查看底牌');
        }
        if (wanfa.length != 0) {
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.MNPDK) {
        let shenbao = []
        if (gameRule.kaiqishenbao) {
            shenbao.push('开启申报');
            if (gameRule.shoujubushenbao) {
                shenbao.push('首局不可申报')
            }
            if (gameRule.shenbaofanbei) {
                shenbao.push('申报翻倍')
            }
        }
        if (shenbao.length > 0) {
            rules.shenbao = `申报：${shenbao.join(' ')}`;
        }
        if (gameRule.firstRoundOut > 0) {
            let flist = ["", "首位先出", "黑桃5先出"]
            wanfa.push(flist[gameRule.firstRoundOut])
        }
        if (gameRule.SaBuDai) {
            wanfa.push('可以三不带');
        }
        if (gameRule.SaBuDaiOne) {
            wanfa.push('可以三带一');
        }
        if (gameRule.SaBuDaiTwo) {
            wanfa.push('可以三带对');
        }
        if (gameRule.siDaiTwo) {
            wanfa.push('可以四带二');
        }
        if (gameRule.FiveFiveFiveFive) {
            wanfa.push("5555必赢")
        }
        if (wanfa.length != 0) {
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
        }
        let zhadan = [];
        if (gameRule.boomScore > 0) {
            let fen = [0, 2, 3, 5, 10]
            zhadan.push(`喜分(${fen[gameRule.boomScore]}分)`)
        } else {
            zhadan.push("翻倍")
        }
        rules.zhadan = `炸弹：${zhadan.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.WK) {
        rules.paishu = `牌数：${gameRule.cardCount}张`;
        wanfa.push(gameRule.waType == 1 ? '无3挖' : gameRule.waType == 2 ? '黑挖' : '普通');
        wanfa.push(gameRule.sanWaType == 1 ? '三个3直挖' : '三个3二挖');
        if (gameRule.isBomb) {
            wanfa.push('带炸弹');
        }
        if (gameRule.isDoubleRate) {
            wanfa.push('带加倍');
        }
        if (gameRule.isCardRecorder) {
            wanfa.push('记牌器');
        }
        if (wanfa.length != 0) {
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.DDZ) {
        if (gameRule.maxRate == 0) {
            rules.fengding = `封顶：不封顶`;
        } else {
            rules.fengding = `封顶：${gameRule.maxRate}分`;
        }
        if (gameRule.maxPlayerCount == 3) {
            if (!!gameRule.isWangErBiJiao) {
                wanfa.push('2王/4个2必叫');
            }
            if (!!gameRule.isSanSiWuFilter) {
                wanfa.push('去掉345');
            }
            if (!gameRule.isSiDaiEr) {
                wanfa.push('不能4带2');
            }
            if (!gameRule.isWashCard) {
                wanfa.push('不洗牌');
            }
            if (!!gameRule.isLianZha) {
                wanfa.push('连炸');
            }
            if (!!gameRule.isShowCardCount) {
                wanfa.push('剩余三张显示牌数');
            }
            if (gameRule.rateType == 0) {
                wanfa.push('不能加倍');
            } else if (gameRule.rateType == 1) {
                wanfa.push('自由加倍');
            } else if (gameRule.rateType == 2) {
                wanfa.push('农民优先');
                if (!!gameRule.isBuJiaoBuJiaBei) {
                    wanfa.push('不叫不能加倍');
                }
                if (!!gameRule.isBuJiaoManBuJiaBei) {
                    wanfa.push('不叫满不能加倍');
                }
            }
        } else {
            if (!!gameRule.isBuDaiJiaBei) {
                wanfa.push('不带加倍');
            }
            if (!!gameRule.isDiPaiFanBei) {
                wanfa.push('底牌翻倍');
            }
            if (!!gameRule.isNongMinRateFirst) {
                wanfa.push('农民优先加倍');
            }
            if (gameRule.rangPaiCount == 0) {
                wanfa.push('不带让牌');
            } else if (gameRule.rangPaiCount == 2) {
                wanfa.push('可让两张');
            } else if (gameRule.rangPaiCount == 3) {
                wanfa.push('可让三张');
            } else if (gameRule.rangPaiCount == 4) {
                wanfa.push('可让四张');
            }
        }
        if (!!gameRule.isCardRecorder) {
            wanfa.push('记牌器');
        }
        if (!!gameRule.isLai && gameRule.laiZiList) wanfa.push(`癞子${gameRule.laiZiList[0]}点`);
        if (wanfa.length != 0) {
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.ZLM) {
        let rules = ["boomOutReduce", "boomOutScore", "kDingA", "duiKDingA", "withA", "sanBuDai", "siDaiEr",
            "kDingADing2", "duiABoom", "baoShuangDui", "lianWithA", "baoDanWin"
        ]
        let rulesStr = ["空炸算分", "炸弹未出扣分", "K顶A", "对K顶对A", "带牌A", "可三不带", "可四带二", "K顶A可出2",
            "对A必出炸弹", "报双不出对", "连子带A", "报单不输分"
        ]
        if (gameRule.maxPlayerCount == 3) {
            for (let i = 0; i < rules.length; i++) {
                const r = rules[i];
                const s = rulesStr[i]
                if (gameRule[r]) {
                    wanfa.push(s)
                }
            }
        } else {
            for (let i = 0; i < rules.length; i++) {
                if (i < 4) {
                    const r = rules[i];
                    const s = rulesStr[i]
                    if (gameRule[r]) {
                        wanfa.push(s)
                    }
                }
            }
            wanfa.push(`炸弹${gameRule.boomScore}分`)
            wanfa.push(`天炸${gameRule.boomAAAScore}分`)
        }
        if (gameRule.isCardRecorder) {
            wanfa.push('记牌器');
        }
        if (gameRule.cardsCount) {
            wanfa.push("显示手牌数量")
        }
        if (wanfa.length != 0) {
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.JGTTZ) {
        rules.guodi = `锅底：${gameRule.maxPourScore}`
        rules.xiazhu = `下注：${gameRule.minPourScore}`
        rules.xztime = `下注时间：${gameRule.pourTick}`
        rules.fengding = "封顶：5倍强制切锅"

        wanfa = ["二八杠", "8点9点2倍 对子二八杠3倍 双天至尊4倍"];
        if (gameRule.bankerType) {
            wanfa.push(gameRule.bankerType == 1 ? "轮庄" : "抢庄")
        }

        if (wanfa.length != 0) {
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.TDK) {
        rules.quanYa = `全押：${gameRule.allInRate}倍`
        let wanfa = []
        wanfa.push(`全坑(${gameRule.cardBegin}-A)`)
        if (gameRule.withJoker) {
            wanfa.push(`带王`)
        }
        if (gameRule.withTwo) {
            wanfa.push(`带2(14分)`)
        }
        if (gameRule.baoZi) {
            wanfa.push(`龙虎豹`)
        }
        if (gameRule.endKick) {
            wanfa.push(`末踢`)
        }
        if (gameRule.endShowCards) {
            wanfa.push(`结束亮牌`)
        }
        if (gameRule.lanGuoDouble) {
            wanfa.push(`烂锅翻倍`)
        }
        if (gameRule.fixBaseScore) {
            wanfa.push(`固定注`)
        }
        if (wanfa.length != 0) {
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.FJSSS) {
        let colorCount = 0;
        if (!!gameRule.colors) {
            let colors = gameRule.colors;
            for (const key in colors) {
                if (colors[key]) {
                    colorCount++;
                }
            }
        }
        wanfa.push(["", "抢庄模式", "通比模式", "看牌下注"][gameRule.wanfa])
        wanfa.push(gameRule.tesupai ? "有特殊牌型" : "无特殊牌型")
        if (gameRule.tongHuaBiDui) {
            wanfa.push("同花有比对")
        }
        if (gameRule.shouDongBaiPai) {
            wanfa.push("只能手动摆牌")
        }
        if (colorCount != 0) {
            wanfa.push(`加${colorCount}色`);
        } else {
            wanfa.push('不加色');
        }
        wanfa.push(["", "打枪*2 全垒打*4", "打枪+1 全垒打+2"][gameRule.jifen]);
        if (gameRule.liPaiTime > 0) {
            wanfa.push(`摆牌时间${gameRule.liPaiTime}秒`);
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;

        let mapai = []
        let maRate = ["", "单马(多张马牌算一张)", "多马(每张马牌单独结算)"]
        if (gameRule.maPaiType == 0) {
            mapai.push("无马牌")
        } else if (gameRule.maPaiType == 1) {
            mapai.push("随机马牌")
            mapai.push(maRate[gameRule.maRateType])
        } else if (gameRule.maPaiType == 2) {
            let MA_PAI = {
                [39]: "黑桃A",
                [51]: "黑桃K",
                [48]: "黑桃10"
            }
            mapai.push(MA_PAI[gameRule.mapai])
            mapai.push(maRate[gameRule.maRateType])
        }
        rules.mapai = `马牌：${mapai.join(' ')}`;
        let wangpai = []
       
        if (gameRule.jokerCount > 0) {
            wangpai.push(`${gameRule.jokerCount}张鬼牌`)
        }else{
            wangpai.push('无鬼牌')
        }
        rules.wangpai = `鬼牌：${wangpai.join(' ')}`;
        rules.donghua = `动画：${["", "完整比牌", "每道比牌", "跳过比牌"][gameRule.biPaiType]}`;
    } else if (gameRule.gameType === Enums.bundleType.QZMJ||gameRule.gameType === Enums.bundleType.QZMJTS) {
        rules.difen = `底分：闲${gameRule.baseScore}庄${gameRule.bankerBaseScore}`;
        rules.beishu = `倍数：游金${gameRule.youJinRate}倍`;
        if (!!gameRule.shuangLaiBuPingHu) {
            wanfa.push('双金不平胡');
        }
        if (!!gameRule.danLaiBuPingHu) {
            wanfa.push('单金不平胡');
        }
        if (!!gameRule.youJinAward) {
            let youJinAward = [];
            if (gameRule.youJinAward[0] > 0) {
                youJinAward.push(`一游${parseInt(gameRule.youJinAward[0])}分`);
            }
            if (gameRule.youJinAward[1] > 0) {
                youJinAward.push(`二游${parseInt(gameRule.youJinAward[1])}分`);
            }
            if (gameRule.youJinAward[2] > 0) {
                youJinAward.push(`三游${parseInt(gameRule.youJinAward[2])}分`);
            }
            if (youJinAward.length != 0) {
                wanfa.push(youJinAward.join(' '));
            }
        }
        if (!!gameRule.liangZhuang5Rate) {
            wanfa.push('连庄+5番');
        }
        if (wanfa.length != 0) {
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
        }
        rules.jiesuan = `结算：${gameRule.huPaiPeiType == 1 ? '放胡三家赔' : '放胡三家赔'}`;
    } else if (gameRule.gameType === Enums.bundleType.QZSSS) {
        let colorCount = 0;
        if (!!gameRule.colors) {
            let colors = gameRule.colors;
            for (const key in colors) {
                if (colors[key]) {
                    colorCount++;
                }
            }
        }
        wanfa.push(["", "抢庄模式", "通比模式", "看牌下注"][gameRule.wanfa])
        wanfa.push(gameRule.tesupai ? "有特殊牌型" : "无特殊牌型")
        if (gameRule.tongHuaBiDui) {
            wanfa.push("同花有比对")
        }
        if (gameRule.shouDongBaiPai) {
            wanfa.push("只能手动摆牌")
        }
        if (colorCount != 0) {
            wanfa.push(`加${colorCount}色`);
        } else {
            wanfa.push('不加色');
        }
        wanfa.push(["", "打枪*2 全垒打*4", "打枪+1 全垒打+2"][gameRule.jifen]);
        if (gameRule.liPaiTime > 0) {
            wanfa.push(`摆牌时间${gameRule.liPaiTime}秒`);
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;

        let mapai = []
        let maRate = ["", "单马(多张马牌算一张)", "多马(每张马牌单独结算)"]
        if (gameRule.maPaiType == 0) {
            mapai.push("无马牌")
        } else if (gameRule.maPaiType == 1) {
            mapai.push("随机马牌")
            mapai.push(maRate[gameRule.maRateType])
        } else if (gameRule.maPaiType == 2) {
            let MA_PAI = {
                [39]: "黑桃A",
                [51]: "黑桃K",
                [48]: "黑桃10"
            }
            mapai.push(MA_PAI[gameRule.mapai])
            mapai.push(maRate[gameRule.maRateType])
        }
        rules.mapai = `马牌：${mapai.join(' ')}`;
        let wangpai = []
        wangpai.push(["无鬼", "硬鬼", "软鬼"][gameRule.jokerType])
        if (gameRule.jokerType > 0) {
            wangpai.push(`${gameRule.jokerCount}张鬼牌`)
        }
        rules.wangpai = `鬼牌：${wangpai.join(' ')}`;
        rules.donghua = `动画：${["", "完整比牌", "每道比牌", "跳过比牌"][gameRule.biPaiType]}`;
    } else if (gameRule.gameType === Enums.bundleType.WWMJ) {
        if (gameRule.duiZiType == 0) {
            wanfa.push("对子不算分")
        } else if (gameRule.duiZiType == 1) {
            wanfa.push("对子算分")
        }
        if (gameRule.dianPaoType == 0) {
            wanfa.push("点炮算自摸")
        } else if (gameRule.dianPaoType == 1) {
            wanfa.push("点炮包赔")
        } else if (gameRule.dianPaoType == 2) {
            wanfa.push("点炮单赔")
        }
        if (gameRule.unReadyKick) {
            wanfa.push("10秒未准备踢出")
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.GD) {
        if (gameRule.gameFrameType == 1) {
            wanfa.push('团团转')
        } else if (gameRule.gameFrameType == 2) {
            wanfa.push('2人掼蛋')
        } else {
            wanfa.push('经典玩法')
        }
        if (gameRule.gameFrameType != 0) {
            rules.jushu = `${share.roundShowTitle}：${gameRule.bureau}${share.roundTitle}`;
        } else {
            if (gameRule.bureau > 0) {
                rules.jushu = `${share.roundShowTitle}：${gameRule.bureau}${share.roundTitle}`;
            } else {
                let guo = gameRule.guo <= 10 ? gameRule.guo : 'A';
                rules.jushu = `${share.roundShowTitle}：${guo}`;
            }
        }
        if (gameRule.showCards == 10) {
            wanfa.push('牌张显示10张')
        } else if (gameRule.showCards == 7) {
            wanfa.push('牌张显示7张')
        } else {
            wanfa.push('牌张全部显示')
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;

        let beishu = []
        if (gameRule.beiShuType == 1) {
            beishu.push('1倍')
        }
        if (gameRule.beiShuType == 3) {
            beishu.push('3倍')
        }
        if (gameRule.beiShuType == 5) {
            beishu.push('5倍')
        }
        rules.beishu = `倍数：${beishu.join(' ')}`;
        let fendang = '10/20/30';
        if (gameRule.fenDangIndex == 0) {
            fendang = '10/20/30';
        }
        if (gameRule.fenDangIndex == 1) {
            fendang = '20/40/60';
        }
        rules.fendang = `分档：${fendang}`;

        let teshu = [];
        if (!!gameRule.isUnReadyKick) {
            teshu.push('10秒未准备踢出');
        }
        if (!!gameRule.isLiuZhaDouble) {
            teshu.push('6炸翻倍');
        }
        if (!!gameRule.isShuangXiaFour) {
            teshu.push('双下4分');
        }
        if (!!gameRule.isOnlyTwo) {
            teshu.push('只打2');
        }
        if (teshu.length != 0) {
            rules.teshu = `特殊：${teshu.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.BJ) {
        if (gameRule.jokerType == 0) {
            wanfa.push("不带王")
        }
        if (gameRule.jokerType == 1) {
            wanfa.push("带王")
        }
        if (gameRule.liPaiTime > 0) {
            wanfa.push(`摆牌时间${gameRule.liPaiTime}秒`);
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        rules.donghua = `动画：${["", "完整比牌", "每道比牌", "跳过比牌"][gameRule.biPaiType]}`;
    } else if (gameRule.gameType === Enums.bundleType.BJJ) {
        wanfa.push(gameRule.jokerCount == 0 ? "不带王" : `${gameRule.jokerCount}个王`)
        wanfa.push(gameRule.laiZiType == 1 ? "王当任意" : "王当红黑")
        wanfa.push(gameRule.allowCancel ? "可投降" : "不可投降")
        if (gameRule.pick9) {
            wanfa.push("十选九")
        }
        let teshu = []

        if (gameRule.sanQing) teshu.push("三同花")
        if (gameRule.quanHong) teshu.push("全红")
        if (gameRule.quanHei) teshu.push("全黑")
        if (gameRule.shuangShunQing) teshu.push("双顺清")
        if (gameRule.sanShunQing) teshu.push("三顺清")
        if (gameRule.shuangSanTiao) teshu.push("双三条")
        if (gameRule.quanSanTiao) teshu.push("全三条")
        if (gameRule.lianShun) teshu.push("一条龙")
        if (gameRule.qingLianShun) teshu.push("清龙")
        if (gameRule.sanGui) teshu.push("三鬼")
        if (gameRule.tongGuan) teshu.push("通关")
        if (gameRule.siZhang) teshu.push("四条")
        if (gameRule.shuangSiZhang) teshu.push("双四条")
        if (gameRule.touShunQing) teshu.push("头顺清")

        if (gameRule.liPaiTime > 0) {
            wanfa.push(`摆牌时间${gameRule.liPaiTime}秒`);
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        rules.donghua = `动画：${["", "完整比牌", "每道比牌", "跳过比牌"][gameRule.biPaiType]}`;
        if (teshu.length > 0) {
            rules.teshu = `喜牌：${teshu.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.XCMJ) {
        if (gameRule.queYiMen) {
            wanfa.push("两房")
        } else {
            wanfa.push("三房")
        }
        if (!!gameRule.fengDing && gameRule.fengDing > 0) {
            wanfa.push(`封顶${gameRule.fengDing}分`)
        } else {
            wanfa.push("不封顶")
        }
        if (!!gameRule.ziMoType && gameRule.ziMoType == 1) {
            wanfa.push(`自摸加底`)
        } else if (!!gameRule.ziMoType && gameRule.ziMoType == 2) {
            wanfa.push(`自摸加番`)
        }

        if (gameRule.menQingZhongZhang) {
            wanfa.push(`门清中张`)
        }
        if (gameRule.lianGang) {
            wanfa.push(`杠上杠`)
        }
        if (gameRule.xiaoFeiYang) {
            wanfa.push(`小肥羊`)
        }
        if (gameRule.dianPaoKePingHu) {
            wanfa.push(`点炮可平胡`)
        }
        if (gameRule.queMenJiaFan) {
            wanfa.push(`缺门加番`)
        }
        if (gameRule.huanSanZhang) {
            wanfa.push(`换三张`)
        }
        if (gameRule.moPaiBaiPai) {
            wanfa.push(`摸牌前摆牌`)
        }
        if (gameRule.haiDi) {
            wanfa.push(`海底`)
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.HLMJ) {
        if (gameRule.queYiMen) {
            wanfa.push("两房")
        } else {
            wanfa.push("三房")
        }
        if (!!gameRule.fengDing && gameRule.fengDing > 0) {
            wanfa.push(`封顶${gameRule.fengDing}分`)
        } else {
            wanfa.push("不封顶")
        }
        if (!!gameRule.ziMoType && gameRule.ziMoType == 1) {
            wanfa.push(`自摸加底`)
        } else if (!!gameRule.ziMoType && gameRule.ziMoType == 2) {
            wanfa.push(`自摸加番`)
        }

        if (gameRule.menQingZhongZhang) {
            wanfa.push(`门清中张`)
        }
        if (gameRule.lianGang) {
            wanfa.push(`杠上杠`)
        }
        if (gameRule.xiaoFeiYang) {
            wanfa.push(`小肥羊`)
        }
        if (gameRule.dianPaoKePingHu) {
            wanfa.push(`点炮可平胡`)
        }
        if (gameRule.queMenJiaFan) {
            wanfa.push(`缺门加番`)
        }
        if (gameRule.huanSanZhang) {
            wanfa.push(`换三张`)
        }
        if (gameRule.moPaiBaiPai) {
            wanfa.push(`摸牌前摆牌`)
        }
        if (gameRule.haiDi) {
            wanfa.push(`海底`)
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.MHXL) {
        if (gameRule.jipai == 0) {
            wanfa.push(`翻牌鸡`)
        } else if (gameRule.jipai == 1) {
            wanfa.push(`摇摆鸡`)
        }
        if (gameRule.wuguji) {
            wanfa.push(`乌骨鸡`)
        }
        if (gameRule.benji) {
            wanfa.push(`本鸡`)
        }
        if (gameRule.xingqiji) {
            wanfa.push(`星期鸡`)
        }
        if (gameRule.manTangji) {
            wanfa.push(`满堂鸡`)
        }
        if (gameRule.chuifengji) {
            wanfa.push(`吹风鸡`)
        }
        if (gameRule.dilong) {
            wanfa.push(`地龙`)
        }
        if (gameRule.baojiaokemen) {
            wanfa.push(`报叫可闷`)
        }
        if (gameRule.lianzhuangbulianju) {
            wanfa.push(`连庄不连局`)
        }
        if (gameRule.dayizhangkebaoting) {
            wanfa.push(`打一张可报听`)
        }
        if (gameRule.yuanbao) {
            wanfa.push(`原报`)
        }
        if (gameRule.queYiMen) {
            wanfa.push(`两房牌`)
        }
        if (gameRule.qianggangShaoJi) {
            wanfa.push("抢杠烧鸡");
        }
        if (gameRule.qianggangShaoDou) {
            wanfa.push("抢杠烧豆");
        }
        rules.fengDing = `封顶：${!!gameRule.fengDing ? gameRule.fengDing + "分" : "不封顶"}`;
        rules.lianzhuang = `连庄：${!!gameRule.yikouer ? "一扣二" : gameRule.lianzhuang ? "连庄" : ""}`;
        rules.gumai = `估卖：${!!gameRule.gumai ? !!gameRule.gumaifen ? gameRule.gumaifen + "分" : "自由分" : "不估卖"}`;
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.GYZJ) {
        let jipai = [];
        if (gameRule.jipai == 0) {
            jipai.push(`满堂鸡`)
        } else if (gameRule.jipai == 1) {
            jipai.push(`上下鸡`)
        }
        if (gameRule.wuguji) {
            jipai.push(`乌骨鸡`)
        }
        if (gameRule.addLaiZi == 1) {
            wanfa.push(`经典玩法`)
            if (gameRule.benji) {
                jipai.push(`本鸡`)
            }
            if (gameRule.jinji) {
                jipai.push(`金鸡`)
            }
            if (gameRule.yinji) {
                jipai.push(`银鸡`)
            }
            if (gameRule.xingqiji) {
                jipai.push(`星期鸡`)
            }
            if (gameRule.chuifengji) {
                jipai.push(`吹风鸡`)
            }
            let guize = [];
            if (gameRule.dilong) {
                guize.push("地龙")
                if (gameRule.qingdilong) {
                    guize.push("清地龙")
                }
            }
            if (gameRule.gumai) {
                guize.push("估卖")
            }
            if (gameRule.queYiMen) {
                wanfa.push(`两房牌`)
            }
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
            rules.lianzhuang = `连庄：${!!gameRule.yikouer ? "一扣二" : gameRule.lianzhuang ? "连庄" : gameRule.tongsan ? "通三" : ""}`;
            rules.jipai = `鸡牌：${jipai.join(' ')}`;
            rules.guize = `规则：${guize.join(' ')}`;
        } else if (gameRule.addLaiZi == 0) {
            wanfa.push(`癞子玩法`)
            if (gameRule.lianzhuang) {
                jipai.push(`连庄`)
            }
            if (gameRule.yuanbao) {
                jipai.push(`原报`)
            }
            if (gameRule.queYiMen) {
                wanfa.push(`两房牌`)
            }
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
            rules.yinghu = `硬胡：硬胡${!!gameRule.yinghu ? "+" + gameRule.yinghu : "不加"}`;
            rules.jipai = `鸡牌：${jipai.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.GYLDG || gameRule.gameType === Enums.bundleType.GYSDG) {
        let jipai = [];
        if (gameRule.manTangji) {
            jipai.push("满堂鸡");
        }
        if (gameRule.jipai == 1) {
            jipai.push("上下鸡");
        }
        if (gameRule.wuguji) {
            jipai.push("乌骨鸡");
        }
        if (gameRule.benji) {
            jipai.push("本鸡");
        }
        if (gameRule.yinji) {
            jipai.push("银鸡");
        }
        if (gameRule.xingqiji) {
            jipai.push("星期鸡");
        }
        if (gameRule.chuifengji) {
            jipai.push("吹风鸡");
        }
        let guize = [];
        if (gameRule.dilong) {
            guize.push("地龙");
            if (gameRule.qingdilong) {
                guize.push("清地龙");
            }
        }
        if (gameRule.queYiMen) {
            guize.push("两房牌");
        }
        if (gameRule.gumai) {
            guize.push("估卖");
        }
        if (gameRule.qingyiseJiaFen) {
            guize.push("清一色额外+5分");
        }
        let lianzhuang = [];
        if (gameRule.yikouer) {
            lianzhuang.push("一扣二");
        } else if (gameRule.lianzhuang) {
            lianzhuang.push("连庄");
        } else if (gameRule.tongsan) {
            lianzhuang.push("通三");
        }
        rules.jipai = `鸡牌：${jipai.join(' ')}`;
        rules.guize = `规则：${guize.join(' ')}`;
        rules.lianzhuang = `连庄：${lianzhuang.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.GYLDGLF || gameRule.gameType === Enums.bundleType.GYSDGLF) {
        rules.fengDing = `封顶：${!!gameRule.fengDing ? gameRule.fengDing + "分" : "不封顶"}`;
        rules.zimo = `自摸：${!!gameRule.zimoFanBei ? "自摸翻倍" : !!gameRule.zimoJiaFen ? "自摸加一分" : ""}`;
        rules.qianggang = `抢杠：${!!gameRule.qianggangPeiFen ? "抢杠赔分" : !!gameRule.qianggangZiMo ? "抢杠算自摸" : !!gameRule.qianggangBaoJia ? "抢杠包两家" : ""}`;
        if (gameRule.jipai == 0) {
            wanfa.push("翻牌鸡");
        }
        if (gameRule.jipai == 1) {
            wanfa.push("上下鸡");
        }
        if (gameRule.manTangji) {
            wanfa.push("满堂鸡");
        }
        if (gameRule.wuguji) {
            wanfa.push("乌骨鸡");
        }
        if (gameRule.xingqiji) {
            wanfa.push("星期鸡");
        }
        if (gameRule.yuanbao) {
            wanfa.push("原报");
        }
        if (gameRule.baoji) {
            wanfa.push("包鸡");
        }
        if (gameRule.qianggangShaoJi) {
            wanfa.push("抢杠烧鸡");
        }
        if (gameRule.qianggangShaoDou) {
            wanfa.push("抢杠烧豆");
        }
        if (gameRule.repaoPeiFen) {
            wanfa.push("热炮赔分");
        }
        if (gameRule.lianzhuang) {
            wanfa.push("连庄");
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.MJNN) {
        if (gameRule.gameMode == 1) {
            wanfa.push("经典王癞");
        } else if (gameRule.gameMode == 2) {
            wanfa.push("疯狂王癞");
        } else {
            wanfa.push("经典");
        }

        wanfa.push(`满${gameRule.minPlayerCount || 2}人开`);
        wanfa.push(`抢庄限${gameRule.robBankLimit || 1}倍`);
        if (!!gameRule.tuizhu && gameRule.tuiScale > 0) {
            wanfa.push(`${gameRule.tuiScale || 5}倍推注`);
        } else {
            wanfa.push(`无推注`);
        }
        if (!!gameRule.jiaSuMoShi) {
            wanfa.push("快速模式");
        }
        if (!!gameRule.isAnZhuangQiangZhuang) {
            wanfa.push("暗庄抢庄");
        }
        if (!!gameRule.isPourDouble) {
            wanfa.push("下注加倍");
        }
        if (!!gameRule.isPourLimit) {
            wanfa.push("下注限制");
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        rules.beilv = `倍率：牛7-牛8x2、牛9x3、牛牛、对子牛、板牛、顺子牛x6、葫芦牛x7、炸弹牛x8、五小牛x10`;
    } else if (gameRule.gameType === Enums.bundleType.PTJ || gameRule.gameType === Enums.bundleType.JGPTJ) {
        if (gameRule.gameMode) {
            wanfa.push("三道杠")
        } else {
            wanfa.push("两道杠")
        }
        if (gameRule.bankerMode == 0) {
            wanfa.push("霸王庄")
        } else if (gameRule.bankerMode == 1) {
            wanfa.push("自由抢庄")
        } else if (gameRule.bankerMode == 2) {
            wanfa.push("轮庄")
        }
        if (gameRule.isZhaDan) {
            wanfa.push("炸弹")
        }
        if (gameRule.isGuiZi) {
            wanfa.push("鬼子")
        }
        if (gameRule.isTianJiuWang) {
            wanfa.push("天九王")
        }
        if (gameRule.isDiJiuNiangNiang) {
            wanfa.push("地九娘娘")
        }
        rules.cardMode = `牌型：${gameRule.cardMode ? "小牌九" : "大牌九"}`
        if (gameRule.gameType === Enums.bundleType.PTJ) {
            rules.fenshu = `分数：${gameRule.bankerPourScores ? "固定" + gameRule.canPourScores + "分" : "每次选分"}`;
        } else {
            rules.xiazhu = `下注：${gameRule.minPourScore}`;
            rules.fenshu = `锅底：${gameRule.maxPourScore}`;
            if (gameRule.wuBeiQieGuo) {
                wanfa.push("五倍强制切锅")
            }
            if (gameRule.touBaBiMan) {
                wanfa.push("头把必满")
            }
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.YDR) {
        let qipai = [];
        let fanshu = [];
        let fd = [];
        if (gameRule.qiPaiType == 1) {
            qipai.push("先起再偷")
        } else if (gameRule.qiPaiType == 2) {
            qipai.push("先偷再起")
        }
        rules.qipai = `起牌：${qipai.join(' ')}`;
        if (gameRule.rateType == 1) {
            fanshu.push("提坎番")
        } else if (gameRule.rateType == 2) {
            fanshu.push("蕃乘蕃")
        }
        rules.fanshu = `算番：${fanshu.join(' ')}`;
        if (gameRule.gameMaxRate == 0) {
            fd.push("不封顶")
        } else if (gameRule.gameMaxRate > 0) {
            fd.push(`${gameRule.gameMaxRate}番封顶`)
        }
        rules.fd = `封顶：${fd.join(' ')}`;
        if (gameRule.baoZiPeiType == 0) {
            wanfa.push("包子不赔")
        } else if (gameRule.baoZiPeiType == 1) {
            wanfa.push("包子全赔")
        }
        if (gameRule.lianFanQi) {
            wanfa.push("两番可起")
        }
        if (gameRule.xinBaPi) {
            wanfa.push("兴8匹")
        }
        if (gameRule.xin16Hei) {
            wanfa.push("兴16张黑")
        }
        if (gameRule.lianFanTiao) {
            wanfa.push("两番可跳")
        }
        if (gameRule.biPeng) {
            wanfa.push("必碰")
        }
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.CD) {
        if (gameRule.liPaiTime > 0) {
            wanfa.push(`摆牌时间${gameRule.liPaiTime}秒`);
        }
        if (wanfa.length > 0) {
            rules.wanfa = `玩法：${wanfa.join(' ')}`;
        }
        rules.donghua = `动画：${["", "完整比牌", "每道比牌", "跳过比牌"][gameRule.biPaiType]}`;
    } else if (gameRule.gameType === Enums.bundleType.ENSMJ) {
        let guize = [];
        if (gameRule.taizhuang) guize.push("抬庄")
        if (gameRule.quwan) guize.push("去万")
        if (gameRule.gangshangpao) guize.push("杠上炮")
        if (gameRule.dapijinhu) guize.push("打痞禁胡")
        if (gameRule.dalaijinhu) guize.push("打赖禁胡")
        if (gameRule.jinzhiyangpi) guize.push("禁止养赖")
        if (gameRule.jianhuxuzimo) guize.push("见胡需自摸")
        if (gameRule.guolai) guize.push("过赖")
        if (gameRule.yilaidaodi) guize.push("一赖到底")
        if (gameRule.xiaoxuejinhu) guize.push("小血禁胡")
        if (gameRule.dachupilaisuanfen) guize.push("打出痞赖算分")
        rules.wanfa = `玩法：${gameRule.wanfa == 1 ? "八痞四赖" : "一痞二赖"}`;
        if (guize.length) {
            rules.guize = `规则：${guize.join(' ')}`;
        }
    } else if (gameRule.gameType === Enums.bundleType.GDTDH) {
        rules.hupai = `胡牌：${["", "推倒胡", "做牌推倒胡"][gameRule.playType]}`
        rules.lunZhuang = `坐庄：${["赢家坐庄", "下家坐庄"][gameRule.bankerType]}`
        rules.gui = `鬼牌：${["无鬼", "白板", "红中", "翻鬼", "翻双鬼"][gameRule.laiZiType]}`
        let mapai = []
        if (gameRule.maiMaCount == 0) {
            if (!gameRule.baoZaMaType) {
                mapai.push("不买马")
            } else mapai.push(`爆炸马${["", "加分", "翻倍"][gameRule.baoZaMaType]}`)
        } else {
            mapai.push(gameRule.maiMaCount + "马")
            mapai.push(["", "剩余牌开马", "另一副牌开马"][gameRule.kaiMaType])
            mapai.push(["", "马跟底", "1马2分", "1马1分"][gameRule.maScoreType])
            if (gameRule.isMaGenGang) {
                mapai.push("马跟杠")
            }
        }
        rules.mapai = `马牌：${mapai.join(' ')}`;
        if (gameRule.isWithoutZi) wanfa.push("不带风")
        if (gameRule.isCanChiHu) wanfa.push("可以吃胡")
        if (gameRule.isJiHuCanChi) wanfa.push("鸡胡不可吃胡")
        if (gameRule.isMingGangKeQiang) wanfa.push("明杠可抢")
        if (gameRule.isGenZhuang) wanfa.push("跟庄")
        if (gameRule.isHuangZhuangGang) wanfa.push("荒庄荒杠")
        if (gameRule.isQiangGangBao) wanfa.push("抢杠全包")
        if (gameRule.isGangBaoBao) wanfa.push("杠爆全包")
        if (gameRule.isLuoDiBao) wanfa.push("12张落地承包")
        if (gameRule.isNoLaiDouble) wanfa.push("无鬼加倍")
        if (gameRule.isJieJieGao) wanfa.push("节节高")
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        let paixinFen = []
        if (gameRule.qiangGangHuRate > 0) paixinFen.push(`抢杠胡${gameRule.qiangGangHuRate}倍`)
        if (gameRule.gangShangHuaRate > 0) paixinFen.push(`杠上花${gameRule.gangShangHuaRate}倍`)
        if (gameRule.shiSanYaoScore > 0) paixinFen.push(`十三幺${gameRule.shiSanYaoScore}分`)
        if (gameRule.siGuiHuRate > 0) paixinFen.push(`四鬼胡${gameRule.siGuiHuRate}倍`)
        if (gameRule.qiDuiRate > 0) paixinFen.push(`七对${gameRule.qiDuiRate}倍`)
        if (gameRule.qingYiSeRate > 0) paixinFen.push(`清一色${gameRule.qingYiSeRate}倍`)
        if (gameRule.jiHuScore > 0) paixinFen.push(`鸡胡${gameRule.jiHuScore}分`)
        if (gameRule.pingHuScore > 0) paixinFen.push(`平胡${gameRule.pingHuScore}分`)
        if (gameRule.siGuiHuScore > 0) paixinFen.push(`四鬼胡${gameRule.siGuiHuScore}分`)
        if (gameRule.pengPengHuScore > 0) paixinFen.push(`碰碰胡${gameRule.pengPengHuScore}分`)
        if (gameRule.hunYiSeScore > 0) paixinFen.push(`混一色${gameRule.hunYiSeScore}分`)
        if (gameRule.qiDuiScore > 0) paixinFen.push(`七对${gameRule.qiDuiScore}分`)
        if (gameRule.qingYiSeScore > 0) paixinFen.push(`清一色${gameRule.qingYiSeScore}分`)
        if (gameRule.hunPengScore > 0) paixinFen.push(`混碰${gameRule.hunPengScore}分`)
        if (gameRule.longQiDuiScore > 0) paixinFen.push(`龙七对${gameRule.longQiDuiScore}分`)
        if (gameRule.xiaoSanYuanScore > 0) paixinFen.push(`小三元${gameRule.xiaoSanYuanScore}分`)
        if (gameRule.xiaoSiXiScore > 0) paixinFen.push(`小四喜${gameRule.xiaoSiXiScore}分`)
        if (gameRule.qingPengScore > 0) paixinFen.push(`清碰${gameRule.qingPengScore}分`)
        if (gameRule.hunYaoJiuScore > 0) paixinFen.push(`混幺九${gameRule.hunYaoJiuScore}分`)
        if (gameRule.daSanYuanScore > 0) paixinFen.push(`大三元${gameRule.daSanYuanScore}分`)
        if (gameRule.daSiXiScore > 0) paixinFen.push(`大四喜${gameRule.daSiXiScore}分`)
        if (gameRule.ziYiSeScore > 0) paixinFen.push(`字一色${gameRule.ziYiSeScore}分`)
        if (gameRule.qingYaoJiuScore > 0) paixinFen.push(`清幺九${gameRule.qingYaoJiuScore}分`)
        if (gameRule.qingQiDuiScore > 0) paixinFen.push(`清七对${gameRule.qingQiDuiScore}分`)
        if (gameRule.tianHuScore > 0) paixinFen.push(`天胡${gameRule.tianHuScore}分`)
        if (gameRule.diHuScore > 0) paixinFen.push(`地胡${gameRule.diHuScore}分`)
        if (gameRule.shuangLongQiDuiScore > 0) paixinFen.push(`双龙七对${gameRule.shuangLongQiDuiScore}分`)
        if (gameRule.sanLongQiDuiScore > 0) paixinFen.push(`三龙七对${gameRule.sanLongQiDuiScore}分`)
        if (gameRule.shiBaLuoHanScore > 0) paixinFen.push(`十八罗汉${gameRule.shiBaLuoHanScore}分`)
        rules.paixin = `牌型：${paixinFen.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.GDYBZ) {
        rules.lunZhuang = `坐庄：${["赢家坐庄", "下家坐庄"][gameRule.bankerType]}`
        rules.gui = `鬼牌：${["无鬼", "白板当鬼", "红中当鬼", "翻鬼", "翻双鬼", "花牌当鬼"][gameRule.laiZiType]}`
        let mapai = []
        if (gameRule.maiMaCount == 0) {
            if (!gameRule.baoZaMaType) {
                mapai.push("不买马")
            } else mapai.push(`一马全中`)
        } else {
            mapai.push(gameRule.maiMaCount + "马")
            mapai.push(["", "马跟底", "1马2分", "1马1分"][gameRule.maScoreType])
            if (gameRule.isMaGenGang) {
                mapai.push("马跟杠")
            }
        }
        rules.mapai = `马牌：${mapai.join(' ')}`;
        if (gameRule.qiangGangHuRate > 0) wanfa.push(`可抢杠胡`)
        if (gameRule.isMingGangKeQiang) wanfa.push("明杠可抢")
        if (gameRule.isQiangGangBao) wanfa.push("抢杠全包")
        if (gameRule.isGangBaoBao) wanfa.push("杠爆全包")
        if (gameRule.isLuoDiBao) wanfa.push("12张落地承包")
        if (gameRule.isNoLaiDouble) wanfa.push("无鬼加倍")
        if (gameRule.isJieJieGao) wanfa.push("节节高")
        if (gameRule.isGenZhuang) wanfa.push("跟庄")
        if (gameRule.isYangMa) wanfa.push("养马")
        if (gameRule.siGuiHuScore > 0) wanfa.push(`四鬼胡${gameRule.siGuiHuScore}倍`)
        if (gameRule.shiSanYaoScore > 0) wanfa.push(`十三幺${gameRule.shiSanYaoScore}倍`)
        if (gameRule.pengPengHuScore > 0) wanfa.push(`碰碰胡${gameRule.pengPengHuScore}倍`)
        if (gameRule.hunYiSeScore > 0) wanfa.push(`混一色${gameRule.hunYiSeScore}倍`)
        if (gameRule.qingYiSeScore > 0) wanfa.push(`清一色${gameRule.qingYiSeScore}倍`)
        if (gameRule.qiDuiScore > 0) wanfa.push(`七对${gameRule.qiDuiScore}倍`)
        if (gameRule.ziYiSeScore > 0) wanfa.push(`字一色${gameRule.ziYiSeScore}倍`)
        if (gameRule.hunYaoJiuScore > 0) wanfa.push(`幺九${gameRule.hunYaoJiuScore}倍`)
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.CJSJY) {
        let laizi = [];
        gameRule.haveJoker != 0 && laizi.push(`${gameRule.haveJoker}张癞子`)
        laizi.length == 0 && laizi.push('不带癞子');
        rules.wanfa = `癞子：${laizi.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.CNJJ) {
        let str = gameRule.minGuoSocre + "-" + gameRule.maxGuoScore
        rules.wanfa = `底分庄：${str}`;
    } else if (gameRule.gameType === Enums.bundleType.AJMJ) {
        rules.hua = `花数：${gameRule.huaCount}张`
        rules.teshu = `天地胡四财神：${[gameRule.TDHSiCaiScore]}`
        !!gameRule.queYiMen && wanfa.push(`缺一门`)
        !!gameRule.caiShenZhuaTou && wanfa.push("有财神必抓头")
        !!gameRule.sanCaiShenZhuaTou && wanfa.push("三财神可抓头")
        !!gameRule.siCaiShenBaoDi && wanfa.push("四财神保底")
        !!gameRule.meiGangFen && wanfa.push("每杠都算分")
        !!gameRule.qingYiSe && wanfa.push("清一色")
        !!gameRule.buKeChi && wanfa.push("不可吃")
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.BPMJ) {
        rules.wanfa = `玩法：${gameRule.qiHuType ? "两片起胡(有花需要爆头才能胡）" : "一片起胡(有花不用爆头也可胡）"} `;
        rules.fengDing = `封顶：${gameRule.maxScore}分`;
    } else if (gameRule.gameType === Enums.bundleType.LAMJ) {
        rules.zuizi = `嘴子数：${gameRule.zuiZiCount}`
        rules.zhuangdifen = `庄底分：${gameRule.bankerScore}`
        rules.baopai = `包牌方式：${["", "后碰者付", "平分承包"][gameRule.baoPaiType]}`
        !!gameRule.isYiFengLan && wanfa.push("一风烂")
        !!gameRule.isZhuiZongBao && wanfa.push("追踪宝")
        !!gameRule.isBankerRandomFirst && wanfa.push("首局坐庄随机")
        gameRule.qiePaiType > 0 && wanfa.push(["不可切牌", "所有人可切牌", "输家切牌"][gameRule.qiePaiType])
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        if (gameRule.autoStartTm > 0) rules.xiayiju = `下一局：${gameRule.autoStartTm}秒后自动开下一局`
    } else if (gameRule.gameType === Enums.bundleType.LSMJ || gameRule.gameType === Enums.bundleType.LSSEJ) {
        rules.fangShu = `房数：${gameRule.roomType}房`;
        wanfa.push(`${gameRule.laiZiCount}癞子`);
        gameRule.qiHuRate = gameRule.qiHuRate || 0;
        gameRule.qiHuRate = parseInt(gameRule.qiHuRate);
        if (isNaN(gameRule.qiHuRate)) gameRule.qiHuRate = 0;
        gameRule.qiHuRate > 0 && wanfa.push(`${gameRule.qiHuRate}番起胡`);
        wanfa.push(`${gameRule.maxRate}番封顶`);
        wanfa.push(`天地胡${gameRule.tianDiHuRate}番`);
        wanfa.push(`${gameRule.dianGangHuaType == 0 ? `点杠花（点炮）` : `点杠花（自摸）`}`);
        if (gameRule.huanZhangCount > 0) {
            wanfa.push(`换${gameRule.huanZhangCount}张`);
            let huanHuaSe = ['同花色换', '任意换', '任意混换'];
            gameRule.huanZhangHuaSeType = gameRule.huanZhangHuaSeType || 0;
            wanfa.push(`${huanHuaSe[gameRule.huanZhangHuaSeType]}`);
        }
        !!gameRule.yaoJiuJiangDui && wanfa.push(`幺九将对`);
        !!gameRule.daDuiZiLiangFan && wanfa.push(`大对子两番`);
        !!gameRule.gangTiSuanGangHua && wanfa.push(`杠提算杠花`);
        !!gameRule.haiDi && wanfa.push(`海底`);
        !!gameRule.jinGouDiao && wanfa.push(`金钩钓`);
        !!gameRule.tianDiHu && wanfa.push(`天地胡`);
        !!gameRule.menQing && wanfa.push(`门清`);
        !!gameRule.zhongZhang && wanfa.push(`中张`);
        !!gameRule.siJiFaCai && wanfa.push(`四鸡发财（${gameRule.siJiFaCaiRate}番）`);
        !!gameRule.sanJiFaCai && wanfa.push(`三鸡发财（${gameRule.sanJiFaCaiRate}番）`);
        !!gameRule.pengHouKeHuan && wanfa.push(`碰后可换`);
        !!gameRule.gangHouKeHuan && wanfa.push(`杠后可换`);
        !!gameRule.huPaiShiShiJieSuan && wanfa.push(`胡牌实时结算`);
        !!gameRule.gangFenShiShiJieSuan && wanfa.push(`杠分实时结算`);
        !!gameRule.qiangTiBaoPei && wanfa.push(`抢提包赔`);
        !!gameRule.guoZhangBuKePengGang && wanfa.push(`过张不可碰杠`);
        !!gameRule.guoShouShengFanHu && wanfa.push(`过手升番胡`);
        !!gameRule.kongFeiDui && wanfa.push(`空飞对`);
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.QJMJ) {
        let teshu = [];
        !!gameRule.yaoji && teshu.push("幺鸡");
        !!gameRule.ertong && teshu.push("二同");
        !!gameRule.sanwan && teshu.push("三万");
        rules.teshu = `特殊玩法：${teshu.join(' ')}`;
        rules.chuangguan = `闯关玩法：${!!gameRule.chuangguan ? `闯关${!!gameRule.wuxianchuangguan ? "(无限闯关)" : ""})` : "不闯关"}`;
        rules.fanji = `番鸡：${gameRule.fanji == 1 ? "上下鸡" : gameRule.fanji == 2 ? "本鸡" : gameRule.fanji == 3 ? "全鸡 " : "无鸡"}${!!gameRule.fanji ? `(${gameRule.fanjifen}分)` : ""}`;
        let wanfa = [];
        !!gameRule.hupaitishi && wanfa.push("胡牌提示");
        !!gameRule.zuihousizhangbihu && wanfa.push("最后四张必胡");
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        rules.huanpai = `换牌：${!!gameRule.huanpai ? "任意换三张" : "不换牌"}`;
        rules.chadajiao = `查叫：${!!gameRule.chadajiao ? "查大叫" : "不查大叫"}`;
    } else if (gameRule.gameType === Enums.bundleType.FCMJ) {
        rules.baopai = "宝牌：" + (gameRule.baoCount == 0 ? "无宝牌" : `${gameRule.baoCount}张宝牌`)
        rules.fengding = "封顶：" + (gameRule.fengDing == 0 ? "不封顶" : gameRule.fengDing)
        rules.gangfen = "杠分：" + gameRule.gangScore.join("/")
        let wanfa = []
        !!gameRule.qingYiSe && wanfa.push("清一色")
        !!gameRule.qiDui && wanfa.push("七对")
        if (gameRule.gangType == 0) {
            wanfa.push("攒杠")
        } else if (gameRule.gangType == 1) {
            wanfa.push("起手杠")
        }
        !!gameRule.meiTingPaoPei && wanfa.push("未摇宝点炮包赔")
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.ZGZ) {
        let wanfa = []
        !!gameRule.isShowThree && wanfa.push("片3必亮")
        !!gameRule.isShowCardCount && wanfa.push("显示剩牌")
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.RCSSGMJ) {
        let wanfa = []
        if (gameRule.huanpai == 1) {
            wanfa.push("换三张")
        } else if (gameRule.huanpai == 2) {
            wanfa.push("换1-5张")
        }
        if (gameRule.ziMoRateType == 1) {
            wanfa.push("自摸加底")
        } else if (gameRule.ziMoRateType == 2) {
            wanfa.push("自摸×2")
        }
        !!gameRule.houSiBiHu && wanfa.push("后四张必胡")
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
        rules.wanfa100 = `计分：点杠2倍底分、脚归4分、报叫5分、手归/反查叫/海底 6分、地胡10分`
    } else if (gameRule.gameType === Enums.bundleType.MASMJ) {
        let wanfa = []
        gameRule.bureauDao > 0 && wanfa.push(`${gameRule.daoShu}倒`)
        !!gameRule.isQidui && wanfa.push("七对")
        !!gameRule.isQueYiMen && wanfa.push("缺一门")
        !!gameRule.isQueMenXian && wanfa.push("缺门必先打")
        !!gameRule.isHaveFeng && wanfa.push("含风牌")
        !!gameRule.isShiDianHu && wanfa.push("十点起胡")
        !!gameRule.isPaoQYS && wanfa.push("点炮只能胡清一色")
        !!gameRule.isPaoJZ && wanfa.push("点炮只能胡绝张")
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.YBMJ) {
        let guize = [];
        guize.push(`${gameRule.piaoType == 2 ? "定飘" : gameRule.piaoType == 1 ? "随飘" : "不飘"}`)
        if (gameRule.tingYong > 0) {
            guize.push(gameRule.tingYong + "听用")
        } else if (gameRule.hongZhong > 0) {
            guize.push(gameRule.hongZhong + "红中")
        }
        !!gameRule.is2FanHu && guize.push("2番起胡");
        !!gameRule.is3FanHu && guize.push("3番起胡");
        !!gameRule.isNoTY3Fan && guize.push("无听用加3番");
        !!gameRule.isQueYiMen && guize.push("缺一门");
        !!gameRule.isTianHuManGuan && guize.push("天胡满贯");
        !!gameRule.isDianPao && guize.push("点炮胡")
        !!gameRule.isFei2FanHu && guize.push("飞牌两番起胡")
        rules.maxRate = `封顶番数：${gameRule.maxRate}番`;
        rules.guize = `玩法：${guize.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.PZHMJ) {
        rules.fengding = "封顶：" + (gameRule.fengDing == 0 ? "不封顶" : gameRule.fengDing)
        let fangNum = gameRule.fangShu
        rules.fangShu = "房数：" + fangNum
        if (fangNum == 2) {
            let paiName = ["", "万", "筒", "条"]
            rules.quePai = (`缺牌：缺${paiName[gameRule.queYiMen]}`)
        } else if (fangNum == 3) {
            let queName = ["不缺", "必缺", "选缺"]
            rules.queFang = (`缺房：${queName[gameRule.queType]}`)
        }
        let wanfa = []
        if (!!gameRule.ziMoType && gameRule.ziMoType == 1) {
            wanfa.push(`自摸加底`)
        } else if (!!gameRule.ziMoType && gameRule.ziMoType == 2) {
            wanfa.push(`自摸加番`)
        }
        !!gameRule.yiTiaoLong && wanfa.push("一条龙")
        !!gameRule.kaXinWu && wanfa.push("卡心五")
        !!gameRule.bianKaDiao && wanfa.push("边卡吊")
        !!gameRule.gangBuSuanGen && wanfa.push("杠不算根")
        !!gameRule.huJiaoZhuanYi && wanfa.push("呼叫转移")
        !!gameRule.chaJiaoTuiShui && wanfa.push("查叫退税")
        !!gameRule.tingHouKeGang && wanfa.push("听后可杠")
        !!gameRule.xianShiLiuShui && wanfa.push("显示流水")
        !!gameRule.guoShuiGuoFanKeHu && wanfa.push("过水过番可胡")
        !!gameRule.guoPengGuoQuan && wanfa.push("过碰过圈")
        !!gameRule.guoHuGuoQuan && wanfa.push("过胡过圈")
        !!gameRule.buKeXianPengHouGang && wanfa.push("不可先碰后杠")
        rules.wanfa = `玩法：${wanfa.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.LSEQS) {
        let guize = [];
        !!(gameRule.isQuanHu) && guize.push("圈胡");
        !!(gameRule.isTianDiHu) && guize.push("天地胡");
        !!(gameRule.isKun) && guize.push("坤");
        !!(gameRule.isPiao) && guize.push("漂");
        !!(gameRule.isDaHu) && guize.push("大胡");
        !!(gameRule.isShangTai) && guize.push("上台");
        !!(gameRule.isQingYiSe) && guize.push("清一色");
        !!(gameRule.isShuangQuan) && guize.push("双圈");
        !!(gameRule.isBaYuJiaHu) && guize.push("巴雨加胡");

        if (gameRule.fengDing == 0) {
            guize.push("不封顶")
        } else {
            guize.push(gameRule.fengDing + "胡封顶")
        }

        rules.guize = `玩法：${guize.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.LSPDK) {
        let guize = [];
        guize.push(gameRule.hongtao10 ? "红桃10扎鸟" : "不扎鸟")
        guize.push(gameRule.ziMeiDui ? "姊妹对可出" : "姊妹对不可出")
        guize.push("炸弹分:3炸" + gameRule.boomScore + "分")
        guize.push("名堂分:" + gameRule.mingTangFen + "分")
        if (gameRule.quanHei) { guize.push("全黑") }
        if (gameRule.quanHong) { guize.push("全红") }
        if (gameRule.quanDa) { guize.push("全大") }
        if (gameRule.quanXiao) { guize.push("全小") }
        if (gameRule.quanDan) { guize.push("全单") }
        if (gameRule.quanShuang) { guize.push("全双") }
        rules.guize = `玩法：${guize.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.YJBPX) {
        let guize = [];
        if (gameRule.huMode == 1) {
            guize.push("血战模式")
        } else if (gameRule.huMode == 2) {
            guize.push("推倒胡模式")
        }
        if (gameRule.isBiHu) guize.push("必胡")
        if (gameRule.isGuoShouHu) guize.push("过手胡")
        if (gameRule.isDianGangHua) guize.push("点杠花")
        if (gameRule.isGangShangPao) guize.push("杠上炮")
        if (gameRule.isDianGangDouble) guize.push("点杠分翻倍")
        rules.guize = `玩法：${guize.join(' ')}`;
    } else if (gameRule.gameType === Enums.bundleType.EZGDT) {
        rules.xiazhu = `倍数：${gameRule.canPourScores.join("/")}`
        rules.xiazhuTime = `下注时间：${gameRule.pourTick}秒`
        rules.showTime = `亮牌时间：${gameRule.showCardTime}秒`
        let guize = [];
        if (gameRule.bankerType == 1) guize.push("轮庄")
        if (gameRule.bankerType == 2) guize.push("抢庄")
        if (gameRule.bankerType == 3) guize.push("霸王庄")
        if (gameRule.isSamePing == 1) guize.push("同点数庄家赢")
        if (gameRule.isSamePing == 2) guize.push("同点数平局")
        if (gameRule.isSamePing == 3) guize.push("同点数庄家输")
        if (gameRule.wangType == 1) guize.push("王当任意")
        if (gameRule.wangType == 2) guize.push("大王2点,小王1点")

        rules.guize = `玩法：${guize.join(' ')}`;
    }
    let roomPayRule = gameRule.roomPayRule;
    if (!!this.getData('pumpVisible') && !!roomPayRule) {
        if (roomPayRule.ladderScore && roomPayRule.ladderScore.length > 0) {
            let ladderScore = roomPayRule.ladderScore;
            let scores = '';
            for (let index = 0; index < ladderScore.length; index++) {
                if (!ladderScore[index]) continue;
                let ladderScoreItem = ladderScore[index];
                let tempScore = `[${ladderScoreItem.minScore},${ladderScoreItem.maxScore},${ladderScoreItem.rebateScore}]`;
                scores += ' ' + tempScore;
            }
            scores = '固定抽水' + scores;
            rules.choushui = `抽水模式：${scores}`;
        } else {
            let percentMinWinScore = '',
                percentScore = '';
            if (roomPayRule.percentScore && roomPayRule.percentScore > 0) {
                percentMinWinScore = '百分比抽水最低赢分' + roomPayRule.percentMinWinScore;
                percentScore = '百分比抽水' + roomPayRule.percentScore + '%';
            } else {
                percentScore = '不抽水';
            }
            rules.choushui = `抽水模式：${percentScore} ${percentMinWinScore}`;
        }
    }
    let gaoji = [];
    !!gameRule.canNotDissmiss && gaoji.push("禁止中途解散")
    !!gameRule.lastThreeJoin && gaoji.push("最后3局禁入");
    !!gameRule.cuopai && gaoji.push('搓牌');
    !!gameRule.canTrust && gaoji.push('允许托管');
    !!gameRule.tongji && gaoji.push("输赢统计")
    !!gameRule.fangzuobi && gaoji.push(`防作弊(${gameRule.distanceLimit || 100}米)`)
    !!gameRule.yuyin && gaoji.push('语音');
    !!gameRule.canWatch && gaoji.push('允许观战');
    !!gameRule.showGps && gaoji.push('显示GPS');
    !!gameRule.canEnter && gaoji.push('中途进人');

    rules.gaoji = `高级：${gaoji.length != 0 ? gaoji.join(' ') : '无'}`;
    let titleColor = !!format && !!format.titleColor ? format.titleColor : cc.Color.BLACK;
    let contentColor = !!format && !!format.contentColor ? format.contentColor : cc.Color.BLACK;
    let titleColorHex = `#${titleColor.toHEX('#rrggbb')}`;
    let contentColorHex = `#${contentColor.toHEX('#rrggbb')}`;
    for (const key in rules) {
        let kVal = rules[key];
        let tmp = kVal.split("：");
        if (!!format && !!format.isRichText) {
            rule += `${Utils.setRichTextColor(titleColorHex, `${tmp.shift()}：`, true)}${Utils.setRichTextColor(contentColorHex, tmp.pop())}${spacer}`;
        } else {
            rule += `${tmp.shift()}：${tmp.pop()}${spacer}`;
        }
    }
    share.content = rule;
    // console.log("游戏规则详情", share)
    return share;
}

exp.getCanPourScores = function (gameRule) {
    let canPourScoresTemp = [],
        canPourScores = gameRule.canPourScores,
        baseScore = gameRule.baseScore || 1;
    if (!!canPourScores) {
        canPourScores.forEach((item) => {
            canPourScoresTemp.push(Utils.formatNumberWithDecimal(item * baseScore, 1));
        });
    }
    return `${canPourScoresTemp.join('/')}`;
}

exp.getRoomCreateCache = function (gameType) {
    let roomCreateCache = CacheManager.getItem('roomCreateCache');
    if (!roomCreateCache) return null;
    let roomCreate = JSON.parse(roomCreateCache);
    return roomCreate[gameType];
}

exp.setRoomCreateCache = function (gameRule) {
    let roomCreateCache = CacheManager.getItem('roomCreateCache');
    let roomCreate = null;
    if (!roomCreateCache) {
        roomCreate = {};
        roomCreate[gameRule.gameType] = gameRule;
    } else {
        roomCreate = JSON.parse(roomCreateCache);
        roomCreate[gameRule.gameType] = gameRule;
    }
    CacheManager.setItem('roomCreateCache', JSON.stringify(roomCreate));
}

exp.getGameClasses = function () {
    let gameClass = [Enums.bundleClass.NONE];
    let games = this.getBundles();
    games.forEach((game) => {
        let bundle = this.getBundleConfig(game);
        if (!!bundle &&
            !gameClass.includes(bundle.classify) &&
            !!this.canCreate(game)) {
            gameClass.push(bundle.classify);
        }
    })
    return gameClass;
}

exp.scoreLimit = function (type) {
    let filter = this.getData('scoreLimits') || [];
    return !!filter.includes(type);
}

exp.hallMode = function () {
    let hallGame = this.getData('hallGame') || cc.sys.isBrowser;
    return hallGame;
}

exp.gameWechatInvitation = function (unionId) {
    let gameWechatInvite = this.getData('gameWechatInvite');
    let union = UserModel.getUserUnion(unionId);
    let isShow = (!unionId || (!!union && union.unionType == Enums.UnionType.NORMAL)) && !!gameWechatInvite;
    return isShow;
}

exp.getGameName = function (type) {
    let game = this.getBundleConfig(type);
    return !!game ? game.name : '未知';
}

exp.getSkin = function (type) {
    if (!type) type = Enums.bundleType.POP;
    let skinId = null;
    let demo = !!cc.sys.isBrowser || !!this.getData('demo');
    if (type == Enums.bundleType.HALL) {
        skinId = !!demo ? parseInt(CacheManager.getItem('hallSkinId')) : this.getData('hallSkinId');
    } else if (type == Enums.bundleType.UNION) {
        skinId = !!demo ? parseInt(CacheManager.getItem('unionSkinId')) : this.getData('unionSkinId');
    } else if (type == Enums.bundleType.POP) {
        skinId = !!demo ? parseInt(CacheManager.getItem('popSkinId')) : this.getData('popSkinId');
    }
    let skin = this.getSkinConfig(skinId);
    if (!skin) {
        if (type == Enums.bundleType.HALL) {
            skinId = Enums.bundleType.HALL_SEA;
        } else if (type == Enums.bundleType.UNION) {
            skinId = Enums.bundleType.UNION_SEA;
        } else if (type == Enums.bundleType.POP) {
            skinId = Enums.bundleType.POP_SEA;
        }
        this.setSkin(type, skinId);
    }
    return skinId;
}

exp.setSkin = function (type, skinId) {
    if (type == Enums.bundleType.HALL) {
        CacheManager.setItem('hallSkinId', skinId.toString());
    } else if (type == Enums.bundleType.POP) {
        CacheManager.setItem('popSkinId', skinId.toString());
    } else if (type == Enums.bundleType.UNION) {
        CacheManager.setItem('unionSkinId', skinId.toString());
    }
}

//搭建平台的时候注释其他皮肤只传返回需要的皮肤
//rectTablePlayerPos 方桌头像坐标 tablePlayerPos 圆桌头像坐标 5人以上需保证一致

exp.getUnionTableSkin = function (skinId) {
    let skin = {
        skinId: skinId,
        tableInfoPos: Skin.UnionTableInfoPosDefault,
        mulTableInfoPos: Skin.UnionMulTableInfoPosDefault,
        tablePlayerPos: Skin.UnionTablePlayerPosDefault,
        rectTablePlayerPos: Skin.UnionRectTablePlayerPosDefault,
        tableIndexInfoPos: Skin.UnionTableIndexPosDefault,
        tableBaiRenPlayerPos: Skin.UnionBaiRenTablePlayerPosDefault,
        isMultipleTable: true, //5人以上没有凳子用统一样式
        colorCount: 8, //5人以上没有凳子用统一样式
    }
    if (skinId == Enums.bundleType.UNION_GREEN) {
        skin.tableInfoPos = Skin.UnionTableInfoPosGreen;
        skin.tablePlayerPos = Skin.UnionTablePlayerPosGreen;
        skin.rectTablePlayerPos = Skin.UnionRectTablePlayerPosGreen;
        skin.isMultipleTable = true;
        skin.colorCount = 8;
    } else if (skinId == Enums.bundleType.UNION_PANDA) {
        skin.tableInfoPos = Skin.UnionTableInfoPosPanda;
        skin.tablePlayerPos = Skin.UnionTablePlayerPosPanda;
        skin.rectTablePlayerPos = Skin.UnionRectTablePlayerPosPanda;
        skin.isMultipleTable = false;
        skin.colorCount = 8;
    } else if (skinId == Enums.bundleType.UNION_SEA) {
        skin.tableInfoPos = Skin.UnionTableInfoPosSea;
        skin.tablePlayerPos = Skin.UnionTablePlayerPosSea;
        skin.rectTablePlayerPos = Skin.UnionRectTablePlayerPosSea;
        skin.isMultipleTable = false;
        skin.colorCount = 8;
    } else if (skinId == Enums.bundleType.UNION_BUNNY) {
        skin.tableInfoPos = Skin.UnionTableInfoPosBunny;
        skin.tablePlayerPos = Skin.UnionTablePlayerPosBunny;
        skin.rectTablePlayerPos = Skin.UnionRectTablePlayerPosBunny;
        skin.isMultipleTable = false;
        skin.colorCount = 8;
    } else if (skinId == Enums.bundleType.UNION_CHUN) {
        skin.tableInfoPos = Skin.UnionTableInfoPosChun;
        skin.tablePlayerPos = Skin.UnionTablePlayerPosChun;
        skin.rectTablePlayerPos = Skin.UnionRectTablePlayerPosChun;
        skin.isMultipleTable = false;
        skin.colorCount = 6;
    } else if (skinId == Enums.bundleType.UNION_BACK) {
        skin.tableInfoPos = Skin.UnionTableInfoPosBack;
        skin.tablePlayerPos = Skin.UnionTablePlayerPosBack;
        skin.rectTablePlayerPos = Skin.UnionRectTablePlayerPosBack;
        skin.isMultipleTable = false;
        skin.colorCount = 3;
    } else if (skinId == Enums.bundleType.UNION_RED) {
        skin.tableInfoPos = Skin.UnionTableInfoPosRed;
        skin.tablePlayerPos = Skin.UnionTablePlayerPosRed;
        skin.rectTablePlayerPos = Skin.UnionRectTablePlayerPosRed;
        skin.isMultipleTable = false;
        skin.colorCount = 6;
    } else if (skinId == Enums.bundleType.UNION_WHITE) {
        skin.tableInfoPos = Skin.UnionTableInfoPosWhite;
        skin.tablePlayerPos = Skin.UnionTablePlayerPosWhite;
        skin.rectTablePlayerPos = Skin.UnionRectTablePlayerPosWhite;
        skin.isMultipleTable = false;
        skin.colorCount = 6;
    } else if (skinId == Enums.bundleType.UNION_MOYIN) {
        skin.tableInfoPos = Skin.UnionTableInfoPosMoYin;
        skin.tablePlayerPos = Skin.UnionTablePlayerPosMoYin;
        skin.rectTablePlayerPos = Skin.UnionRectTablePlayerPosMoYin;
        skin.isMultipleTable = false;
        skin.colorCount = 8;
    } else if (skinId == Enums.bundleType.UNION_WOODS) {
        skin.tableInfoPos = Skin.UnionTableInfoPosWoods;
        skin.tablePlayerPos = Skin.UnionTablePlayerPosWoods;
        skin.rectTablePlayerPos = Skin.UnionRectTablePlayerPosWoods;
        skin.isMultipleTable = false;
        skin.colorCount = 8;
    } else if (skinId == Enums.bundleType.UNION_QINGXIN) {
        skin.tableInfoPos = Skin.UnionTableInfoPosQingXin;
        skin.tablePlayerPos = Skin.UnionTablePlayerPosQingXin;
        skin.rectTablePlayerPos = Skin.UnionRectTablePlayerPosQingXin;
        skin.isMultipleTable = false;
        skin.colorCount = 8;
    } else if (skinId == Enums.bundleType.UNION_LANSE) {
        skin.tableInfoPos = Skin.UnionTableInfoPosLanSe;
        skin.tablePlayerPos = Skin.UnionTablePlayerPosLanSe;
        skin.rectTablePlayerPos = Skin.UnionRectTablePlayerPosLanSe;
        skin.isMultipleTable = false;
        skin.colorCount = 8;
    }
    return skin;
}

exp.isRectTable = function (gameRule) {
    let gameType = gameRule.gameType || 1;
    let maxPlayerCount = gameRule.maxPlayerCount || 10;
    let isRectTable = maxPlayerCount < 5;
    return isRectTable;
}

exp.getOnClick = function (type) {
    let audio = 'button';
    if (type == 1) {

    }
    return audio;
}

//获取授权信息
exp.getAuthKey = function (key) {
    let authorize = this.getData('authorize') || {};
    return authorize[key];
}

exp.getChannel = function (channelId) {
    channelId = channelId >= 0 ? channelId : 0;
    let channels = this.getData('channels') || [];
    let channel = null;
    channel = !channels[channelId] ? channels[0] : channels[channelId];
    return channel || {};
}

//获取微信渠道配置
exp.getWechat = function () {
    let wechat = this.getData('wechat') || {};
    let platform = [];
    if (cc.sys.isBrowser) {
        platform = wechat.web || [];
    } else if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_ANDROID) {
        platform = wechat.android || [];
    } else if (!cc.sys.isBrowser && cc.sys.os == cc.sys.OS_IOS) {
        platform = wechat.ios || [];
    }
    let channelId = NativeUtil.getAppChannel();
    let channel = platform.find(config => {
        return config.channelId === channelId;
    });
    if (!channel) {
        channel = platform.shift(); //默认取第一个
    }
    channel = channel || {};
    return channel;
}

//获取请求地址
exp.getUrl = function (key) {
    let urls = this.getData('urls') || {};
    let url = urls[key] || {};
    return url;
}

exp.getCardUrl = function (id = 0) {
    return !!id && id > 0 ? `sprite/cards/${id}` : this.getCardBackUrl();
}

exp.getCardBackUrl = function () {
    let cardbg = this.getCardBackId(Enums.cardStyleType.POKER);
    let url = `sprite/cards/card_back_${cardbg - 1}`;
    return url;
}

exp.getMahJongBackUrl = function (root) {
    let cardbg = this.getCardBackId(Enums.cardStyleType.MAHJONG);
    let url = `sprite/mj/back/${root}${cardbg}`;
    return url;
}

exp.getMahJongFlowerUrl = function (root, cardId) {
    let url = `sprite/mj/flower/${root}${cardId}`;
    return url;
}

exp.getZiPaiBackUrl = function (root) {
    let cardbg = this.getCardBackId(Enums.cardStyleType.ZIPAI);
    let url = `sprite/zi/${root}${cardbg}`;
    return url;
}

exp.getZiPaiFlowerUrl = function (root, cardId) {
    let url = `sprite/zi/${root}${cardId}`;
    return url;
}

exp.getCardBackId = function (type) {
    let cardBgType = `cardBgType${type}`;
    let cardBg = parseInt(CacheManager.getItem(cardBgType)),
        min = 1,
        max = 4;
    if (type == Enums.cardStyleType.POKER) {
        min = 1;
        max = 4;
    } else if (type == Enums.cardStyleType.MAHJONG) {
        min = 1;
        max = 2;
    } else if (type == Enums.cardStyleType.ZIPAI) {
        min = 1;
        max = 4;
    }
    cardBg = isNaN(cardBg) || cardBg < min || cardBg > max ? min : cardBg;
    return cardBg;
}

exp.setCardBackId = function (type, value) {
    let cardBgType = `cardBgType${type}`;
    CacheManager.setItem(cardBgType, value.toString());
    MessageCallback.emitMessage("UpdateGameCardBg");
}

exp.getSceneId = function (type) {
    let sceneType = `sceneType${type}`;
    let sceneId = parseInt(CacheManager.getItem(sceneType)),
        min = 1,
        max = 4;
    if (type == Enums.bundleType.HALL) {
        min = 1;
        max = 4;
    } else if (type == Enums.bundleType.CIRCLE) {
        min = 1;
        max = 4;
    } else if (type == Enums.bundleType.MAHJONG) {
        min = 1;
        max = 4;
    } else if (type == Enums.bundleType.POKER) {
        min = 1;
        max = 4;
    } else if (type == Enums.bundleType.UNION) {
        min = 1;
        max = 3;
    }
    sceneId = isNaN(sceneId) || sceneId < min || sceneId > max ? min : sceneId;
    return sceneId;
}

exp.setSceneId = function (type, value) {
    let sceneType = `sceneType${type}`;
    CacheManager.setItem(sceneType, value.toString());
    MessageCallback.emitMessage("UpdateSceneBg");
}

exp.singleOut = function (canOut = true) {
    if (!canOut) return !!canOut;
    let mjOutClickType = parseInt(CacheManager.getItem('mjOutClickType'));
    let singleOut = !isNaN(mjOutClickType) && mjOutClickType == 1;
    return singleOut;
}

exp.getMusicId = function (type) {
    let musicType = `musicType${type}`;
    let musicId = parseInt(CacheManager.getItem(musicType)),
        min = 1,
        max = 2;
    if (type == Enums.bundleType.HALL) {
        min = 1;
        max = 2;
    } else if (type == Enums.bundleType.MAHJONG) {
        min = 1;
        max = 2;
    } else if (type == Enums.bundleType.CIRCLE) {
        min = 1;
        max = 2;
    } else if (type == Enums.bundleType.POKER) {
        min = 1;
        max = 2;
    } else if (type == Enums.bundleType.TEXAS) {
        min = 1;
        max = 2;
    } else if (type == Enums.bundleType.GAME) {
        min = 1;
        max = 2;
    }
    musicId = isNaN(musicId) || musicId < min || musicId > max ? min : musicId;
    return musicId;
}

exp.setMusicId = function (type, value) {
    let musicType = `musicType${type}`;
    CacheManager.setItem(musicType, value.toString());
    MessageCallback.emitMessage("UpdateSceneBgm");
}

exp.getSkins = function (type) {
    let sks = Skin.Skins;
    let skinFilter = this.getData('skinFilter') || [];
    let skins = sks.filter((item, index, items) => {
        return item.type === type && !skinFilter.includes(item.skinId);
    });
    return skins;
}

exp.getSkinConfig = function (skinId) {
    let skin = null;
    let sks = Skin.Skins;
    let skinFilter = this.getData('skinFilter') || [];
    skin = sks.find((item, index, items) => {
        return item.skinId == skinId && !skinFilter.includes(item.skinId);
    });
    return skin;
}

exp.getSuggestSkin = function (skinId) {
    let suggests = Skin.SkinSuggests;
    let skinFilter = this.getData('skinFilter') || [];
    let skin = suggests.find((item) => {
        return item.skinId === skinId && !skinFilter.includes(item.skinId);
    });
    return skin;
}

exp.getSkinSuggests = function () {
    let suggests = Skin.SkinSuggests;
    let skinFilter = this.getData('skinFilter') || [];
    let pages = suggests.filter(skin => !skinFilter.includes(skin.skinId));
    return pages;
}

exp.getHead = function () {
    return `sprite/head/morentouxiang${Math.floor(Utils.getRandomNum(1, Configs.sysFrameCount))}`;
}