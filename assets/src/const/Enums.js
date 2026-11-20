var exp = module.exports;

exp.bundleType = cc.Enum({
    NONE: 0, //未定义
    SZ: 1, // 炸金花
    NN: 2, // 牛牛
    PDK: 3, // 跑得快
    SG: 4, // 三公
    HZ: 5, // 扎鸟麻将
    DGN: 8, // 斗公牛
    SSS: 9, //十三水
    XZMJ: 10, //血战麻将
    GCT: 11, //关春天
    LYC: 12, //捞腌菜
    FXJ: 13, //飞小鸡
    SGBJH: 14, //三公比金花
    SDB: 15, //十点半
    CX: 16, //扯旋-横版
    DZPK: 17, //德州扑克
    TDK: 18, //填大坑
    WL: 19, //卧龙
    YDR: 20, //幺地人
    PTJ: 21, //拼天九
    MNPDK: 22, //冕宁跑得快
    MNMJ: 23, //冕宁麻将
    DBL: 24, //大菠萝十三水
    ZLM: 25, //捉老麻
    WK: 26, //挖坑
    DDZ: 27, //斗地主
    JGTTZ: 28, //带锅推筒子
    MMTTZ: 29, //买马推筒子
    FJSSS: 30, //福建十三水
    QZMJ: 31, //泉州麻将
    QZSSS: 32, //泉州十三水
    WWMJ: 33, //无为麻将
    GD: 34, //掼蛋
    BJ: 35, //比机
    TSMJ: 36, //泰顺麻将
    XCMJ: 37, //西昌麻将
    HZMJ: 38, //红中麻将
    GYZJ: 39, //贵阳捉鸡
    MHXL: 40, //闷胡血流
    GYLDG: 41, //两丁拐
    GYSDG: 42, //三丁拐
    GYLDGLF: 43, //两丁拐两房
    GYSDGLF: 44, //三丁拐两房
    MJNN: 45, //麻将牛牛
    BJJ: 46, //新比鸡鸡
    TTZ: 47, //二八杠
    CD: 48, //插道
    GDYBZ: 49, //广东100张
    GDTDH: 50, //广东推倒胡
    ENSMJ: 51, //恩施麻将
    WUHMJ: 52, //武汉麻将
    HLMJ: 54, //会理麻将
    JGPTJ: 55, //加锅拼天九
    CJSJY: 56, //三加一
    CNJJ: 57, //川南九九
    WJYNN: 58, //五加一
    LAMJ: 59, //六安麻将
    AJMJ: 60, //安吉麻将
    BPMJ: 61, //白皮麻将
    QJMJ: 62, //綦江麻将
    FCMJ: 63, //凤城麻将
    ZGZ: 64, //扎股子
    RCSSGMJ: 65, //荣昌手上归麻将
    YBMJ: 66,//宜宾麻将
    MASMJ: 67, //马鞍山麻将
    ERPDK: 68, //二人跑得快
    PZHMJ: 69, //攀枝花麻将
    LSMJ: 70,//乐山幺鸡麻将
    LSEQS: 71,//乐山二七十
    LSSEJ: 72,//乐山十二鸡
    LSPDK: 73,//乐山跑得快
    YJBPX: 74,//幺鸡搬螃蟹
    XGPDK: 75,//小关跑得快
    EZGDT: 76,//二张广东拖
    QZMJTS: 77, //泉州麻将特殊版
    BRNN: 201, //百人牛牛
    BRLHD: 202, //百人龙虎斗

    // 推荐
    HALL: 1000, //大厅
    UNION: 2000, //联盟
    POP: 3000, //弹窗
    GAME: 4000, //游戏
    MAHJONG: 5000, //麻将
    POKER: 6000, //多人扑克 如：跑得快、斗地主等
    CIRCLE: 7000, //百人场 如：牛牛、金花等
    TEXAS: 8000, //带入场 如：德州、扯旋等
    PAGE: 9000, //

    HALL_DF: 10001, //大厅-默认  
    HALL_SEA: 10002, //大厅-海洋之心
    HALL_GREEN: 10003, //大厅-绿叶丛林
    HALL_PANDA: 10004, //大厅-熊猫
    HALL_BUNNY: 10005, //大厅-兔女郎
    HALL_CHUN: 10006, //大厅-春
    HALL_BACK: 10007, //大厅-黑金
    HALL_RED: 10008, //大厅-红
    HALL_WHITE: 10009, //大厅-白
    HALL_MOYIN: 100010, //大厅-魔胤
    HALL_WINERED: 100011, //大厅-酒红
    HALL_WOODS: 100012, //大厅-模糊绿色
    HALL_QINGXIN: 100013, //大厅-清新
    HALL_LANSE: 100014, //大厅-蓝色

    UNION_DF: 20001, //联盟-默认
    UNION_SEA: 20002, //联盟-默认
    UNION_GREEN: 20003, //联盟-绿叶丛林
    UNION_PANDA: 20004, //联盟-熊猫
    UNION_BUNNY: 20005, //联盟-兔女郎
    UNION_CHUN: 20006, //联盟-春
    UNION_BACK: 20007, //联盟-黑金
    UNION_RED: 20008, //联盟-红
    UNION_WHITE: 20009, //联盟-白
    UNION_MOYIN: 200010, //联盟-魔胤
    UNION_WINERED: 200011, //联盟-酒红
    UNION_WOODS: 200012, //联盟-模糊绿色
    UNION_QINGXIN: 200013, //联盟-清新
    UNION_LANSE: 200014, //联盟-蓝色

    POP_DF: 30001, //弹窗-默认
    POP_SEA: 30002, //弹窗-海洋之心
    POP_GREEN: 30003, //弹窗-绿叶丛林
    POP_PANDA: 30004, //弹窗-熊猫
    POP_BUNNY: 30005, //弹窗-兔女郎
    POP_CHUN: 30006, //弹窗-春
    POP_BACK: 30007, //弹窗-黑金
    POP_RED: 30008, //弹窗-红
    POP_WHITE: 30009, //弹窗-白
    POP_MOYIN: 300010, //弹窗-魔胤
    POP_WINERED: 300011, //弹窗-酒红
    POP_WOODS: 300012, //弹窗-模糊绿色
    POP_QINGXIN: 300013, //弹窗-清新
    POP_LANSE: 300014, //弹窗-蓝色

    PAGE_DF: 90001,
    PAGE_SEA: 90002,
    PAGE_GREEN: 90003,
    PAGE_PANDA: 90004,
    PAGE_BUNNY: 90005,
    PAGE_CHUN: 90006,
    PAGE_BACK: 90007,
    PAGE_RED: 90008,
    PAGE_WHITE: 90009,
    PAGE_MOYIN: 900010,
    PAGE_WINERED: 900011,
    PAGE_WOODS: 900012,
    PAGE_QINGXIN: 900013,
    PAGE_LANSE: 900014,

});

exp.dialogAction = cc.Enum({
    DEFAULT: 0, //默认为缩放弹窗
    LEFT_TO_RIGHT: 1, //从左往右
    RIGHT_TO_LEFT: 2, //从右往左
    TOP_TO_DOWN: 3, //从上往下
    DOWN_TO_TOP: 4, //从下往上
    DOWN_OPACITY: 5, //向下渐隐渐显
});

exp.bundleClass = {
    SKIN: -1, //皮肤
    NONE: 0, //全部
    PUKE: 1, //扑克
    MAJIANG: 2, //麻将
    ZIPAI: 3, //字牌
    BAIREN: 4, //百人游戏
}

exp.viewScaleType = {
    NONE: 0, //无缩放
    HOR: 1, //横向缩放
    VER: 2, //纵向缩放
}

exp.gameClass = ["全部游戏", "扑克玩法", "麻将玩法", "字牌玩法", "百人争霸"];

exp.gameEnterType = {
    NONE: 0, //无类型
    JOIN: 1, //进入游戏
    WATCH: 2, //进入旁观
}

// 登录平台
exp.loginPlatform = {
    NONE: 0,
    ACCOUNT: 1,
    WEI_XIN: 2,
    MOBILE_PHONE: 3,
    APPLE: 4
};

// 操作类型
exp.updateDataType = {
    NONE: 0,
    ADD: 1,
    REMOVE: 2,
    UPDATE: 3
};

// 邮件状态
exp.emailStatus = {
    NONE: 0,
    NOT_RECEIVE: 1,
    RECEIVED: 2
};

// 第三方支付平台中的选择支付方式
exp.payType = {
    NONE: 0,
    ALI_PAY: 1, //支付宝
    WE_CHAT: 2, //微信
    UNION: 3 //银行卡
};

// 广播类型
exp.broadcastType = {
    NONE: 0,
    LOOP: 1, // 循环广播
    SYSTEM: 2, // 系统广播
    BIG_WIN: 3 // 赢大奖广播
};

// 支付平台
exp.rechargePlatform = {
    NONE: 0
};

// ---------------------------------------房间相关----------------------------------------------
// 房间支付模式
exp.roomRentPayType = {
    BIG_WIN: 1, // 大赢家模式
    AA: 2 // 平均模式
};

// 房间类型
exp.roomType = {
    NONE: 0,
    NORMAL: 1, // 匹配类型
    CONTINUE: 2, // 持续房间(类似捕鱼)
    HUNDRED: 3 // 百人房间
};

// 游戏开始类型
exp.gameRoomStartType = {
    NONE: 0,
    ALL_READY: 1,
    AUTO_START: 2
};

// 房间解散原因
exp.gameRoomDismissReason = {
    NONE: 0, // 未知原因
    BUREAU_FINISHED: 1, // 完成所有局数
    USER_DISMISS: 2, // 用户解散
    UNION_OWNER_DISMISS: 3, // 盟主解散
};

// 房间创建
exp.roomCreatorType = {
    NONE: 0,
    USER_CREATE: 1, // 玩家创建
    UNION_CREATE: 2 // 联盟创建
};

// 房间费用支付方式
exp.roomPayType = {
    AAZHIFU: 1,
    YINGJIAZHIFU: 2,
    WOZHIFU: 3,
};

exp.editInput = {
    INT: 0, //整型
    FLOAT: 1, //浮点型
    CHAR: 2, //字符型
}

// 积分变化类型
exp.scoreChangeType = {
    NONE: 0,
    GIVE: 1, // 被赠送积分
    MODIFY_LOW: 2, // 修改下级分数
    MODIFY_UP: 3, // 被上级修改分数
    GAME_WIN: 4, // 游戏赢分
    GAME_START_UNION_CHOU: 5, // 游戏开始联盟抽分
    GAME_WIN_CHOU: 6, // 游戏赢家抽分
    SAFE_BOX: 7, // 保险柜操作
};

// ---------------------------------------管理工具----------------------------------------------
// 权限类型
exp.userPermissionType = {
    NONE: 0,
    LOGIN_CLIENT: 0x0001, // 登录客户端
    LOGIN_MT: 0x0002, // 登录管理工具
    USER_MANAGER: 0x0004, // 用户管理
    USER_SYSTEM_MANAGER: 0x0008, // 系统管理
    EXCHANGE_MANAGER: 0x0010, // 兑换管理
    SPREAD_MANAGER: 0x0020, // 推广管理
    GAME_MANAGER: 0x0040, // 游戏管理
    DATA_MANAGER: 0x0080, // 数据统计
    GAME_CONTROL: 0x0100, // 游戏控制
    UNION_MANAGER: 0X0200 // 联盟控制
};

// 记录类型
exp.recordType = {
    NONE: 0,
    RECHARGE: 1, // 充值记录
    WITHDRAWALS: 2, // 提现记录
    GAME: 3, // 游戏记录
    LOGIN: 4, // 登录记录
    EXTRACT_COMMISSION: 5, // 提取佣金记录
    GAME_PROFIT: 6, // 游戏抽水记录
    EXTRACT_INVENTORY: 7, // 库存抽取记录
    ADMIN_GRANT: 8, // 管理员赠送记录
    SAFE_BOX: 9, // 保险柜操作
};

// 网络状况
exp.networkState = {
    BEST: 100,
    GOOD: 200,
    NORMAL: 500,
    BAD: 1000,
};

exp.netType = {
    MOBILE: 1,
    WIFI: 2,
}

// 搓牌方向
exp.peekCardDir = {
    H: 1,
    V: 2
};

exp.Router = {
    ROOM: 'game.gameHandler.roomMessageNotify',
    GAME: 'game.gameHandler.gameMessageNotify'
}

exp.Push_Router = {
    ROOM: 'RoomMessagePush',
    GAME: 'GameMessagePush'
}

exp.bundleDownloadStatus = {
    none: 0, //无状态
    hold: 1, //等待
    download: 2, //下载中
    done: 3, //下载完成
    failed: 4, //下载失败
}

exp.deviceOrientation = {
    H: 'h',
    V: 'v'
}

exp.PickImageMethod = {
    Album: 1,
    Camera: 2
}

exp.serviceType = {
    QQ: 'QQ号',
    weChat: '微信号',
    tuDou: '土豆号',
    bianFu: '蝙蝠号',
    feiJi: '飞机/电报'
}

exp.chatType = {
    EMOJI: 1,
    SYSTEM: 2,
    TEXT: 3,
    VOICE: 4
}

exp.cardStyleType = {
    POKER: 1,
    MAHJONG: 2,
    ZIPAI: 3
}

// exp.musicType = {
//     HALL: 10000, //大厅
//     GAME: 20000, //游戏
//     MAHJONG: 3, //麻将
//     POKER: 4, //多人扑克 如：跑得快、斗地主等
//     CIRCLE: 5, //百人场 如：牛牛、金花等
//     TEXAS: 6, //带入场 如：德州、扯旋等
// }

exp.UnionType = {
    MATCH: 0,
    NORMAL: 1
}

exp.skinStatus = {
    EXPIRED: 0, //过期
    STAY: 1, //敬请期待
    ENABLED: 2, //启用中,
    HOT: 3, //热门
}