const Enums = require('./Enums');

module.exports = {
    appName: "百游",
    development: false,
    bundleEnable: true, //发包前检查此项
    localVersionConfigKey: "localVersionConfigKey",
    localClientVer: "localClientVer",
    gamesAdded: 'gamesAdded', //添加的模块
    clientResVersion: '1.0.0',
    reqVersionImmediately: true,
    sysFrameCount: 10,
    gifts: [{
        id: 1,
        name: '便便',
        asset: 'prefab/gift/GiftBianBian',
        price: 0,
        appear: 'chuxian',
        move: 'weiyi',
        end: 'shit',
        audio: 'audio/gift/bianbian'
    },
    {
        id: 2,
        name: '鞭炮',
        asset: 'prefab/gift/GiftBianPao',
        price: 0,
        appear: '',
        move: '',
        end: 'bianpao',
        audio: 'audio/gift/bianpao'
    },
    {
        id: 3,
        name: '放狗',
        asset: 'prefab/gift/GiftChaiQuan',
        price: 0,
        appear: '',
        move: '',
        end: 'chaiquan',
        audio: 'audio/gift/chaiquan'
    },
    {
        id: 4,
        name: '倒茶',
        asset: 'prefab/gift/GiftDaoCha',
        price: 0,
        appear: '',
        move: '',
        end: 'daocha',
        audio: 'audio/gift/chabei'
    },
    {
        id: 5,
        name: '西红柿',
        asset: 'prefab/gift/GiftFanQie',
        price: 0,
        appear: '',
        move: '',
        end: 'xihongshi',
        audio: 'audio/gift/xihongshi'
    },
    {
        id: 6,
        name: '狗粮',
        asset: 'prefab/gift/GiftGouLiang',
        price: 0,
        appear: '',
        move: '',
        end: 'sagouliang',
        audio: 'audio/gift/gouliang'
    },
    {
        id: 7,
        name: '扔鸡蛋',
        asset: 'prefab/gift/GiftJiDan',
        price: 0,
        appear: 'chuxian',
        move: 'weiyi',
        end: 'rengjidan01',
        audio: 'audio/gift/rengjidan'
    },
    {
        id: 8,
        name: '平底锅',
        asset: 'prefab/gift/GiftPingDiGuo',
        price: 0,
        appear: '',
        move: '',
        end: 'pingdiguo',
        audio: 'audio/gift/pingdiguo'
    },
    {
        id: 9,
        name: '泼水',
        asset: 'prefab/gift/GiftShuiTong',
        price: 0,
        appear: '',
        move: '',
        end: 'shuitong',
        audio: 'audio/gift/shuitong'
    },
    {
        id: 10,
        name: '扔拖鞋',
        asset: 'prefab/gift/GiftTuoXie',
        price: 0,
        appear: 'chuxian',
        move: 'weiyi',
        end: 'rengtuoxie',
        audio: 'audio/gift/rengtuoxie'
    },
    {
        id: 11,
        name: '花',
        asset: 'prefab/gift/GiftXianHua',
        price: 0,
        appear: '',
        move: '',
        end: 'xianhua',
        audio: 'audio/gift/hua'
    },
    {
        id: 12,
        name: '扔雪球',
        asset: 'prefab/gift/GiftXueQiu',
        price: 0,
        appear: 'chuxian',
        move: 'weiyi',
        end: 'rengxueqiu',
        audio: 'audio/gift/xueqiu'
    },
    {
        id: 13,
        name: '抓鸡',
        asset: 'prefab/gift/GiftZhuaJi',
        price: 0,
        appear: '',
        move: '',
        end: 'gongji',
        audio: 'audio/gift/zhuaji'
    },
    {
        id: 14,
        name: '扔砖头',
        asset: 'prefab/gift/GiftZhuanTou',
        price: 0,
        appear: 'chuxian',
        move: 'weiyi',
        end: 'rengzhuantou',
        audio: 'audio/gift/rengzhuantou'
    },
    {
        id: 15,
        name: '招财猫',
        asset: 'prefab/gift/GiftCat',
        price: 0,
        appear: '',
        move: '',
        end: 'animation',
        audio: 'audio/gift/gongxifacai'

    },
    {
        id: 16,
        name: '大吉大利',
        asset: 'prefab/gift/GiftDjidali',
        price: 0,
        appear: '',
        move: '',
        end: 'dajidali',
        audio: 'audio/gift/dajidali01'

    },
    {
        id: 17,
        name: '新鞭炮',
        asset: 'prefab/gift/GiftNewBianpao',
        price: 0,
        appear: '',
        move: '',
        end: 'star',
        audio: 'audio/gift/bianpao'


    },
    {
        id: 18,
        name: '新炸弹',
        asset: 'prefab/gift/GiftNewBoom',
        price: 0,
        appear: 'dj_boom_appear',
        move: 'dj_boom_fly',
        end: 'dj_boom_arrive',
        audio: 'audio/gift/bomb_stop'

    },
    {
        id: 19,
        name: '新拖鞋',
        asset: 'prefab/gift/GiftNewtuoxie',
        price: 0,
        appear: 'shoes_appear',
        move: 'shoes_fly',
        end: 'shoes_arrive',
        audio: 'audio/gift/shoes_stop'

    },
    {
        id: 20,
        name: '握手',
        asset: 'prefab/gift/GiftWoshou',
        price: 0,
        appear: '',
        move: '',
        end: 'newAnimation',
        audio: 'audio/gift/woshou01'
    }
    ],

    bundles: [{
        type: Enums.bundleType.SZ,
        name: '炸金花',
        bundle: 'sz',
        hs: 'sz',
        vs: '',
        create: 'SZCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.SZ,
                path: 'res/prefab/SZReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.NN,
        name: '牛牛',
        bundle: 'nn',
        hs: 'nn',
        vs: '',
        create: 'NNCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.NN,
                path: 'res/prefab/NNReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.PDK,
        name: '跑得快',
        bundle: 'pdk',
        hs: 'pdk',
        vs: '',
        create: 'PDKCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.PDK,
                path: 'res/prefab/PDKReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.PDK,
                path: 'res/prefab/PDKResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.ERPDK,
        name: '二人跑得快',
        bundle: 'erpdk',
        hs: 'erpdk',
        vs: '',
        create: 'ERPDKCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.ERPDK,
                path: 'res/prefab/ERPDKReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.ERPDK,
                path: 'res/prefab/ERPDKResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    },
    {
        type: Enums.bundleType.XGPDK,
        name: '小关跑得快',
        bundle: 'xgpdk',
        hs: 'xgpdk',
        vs: '',
        create: 'XGPDKCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.XGPDK,
                path: 'res/prefab/XGPDKReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.XGPDK,
                path: 'res/prefab/XGPDKResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.SG,
        name: '三公',
        bundle: 'sg',
        hs: 'sg',
        vs: '',
        create: 'SGCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.SG,
                path: 'res/prefab/SGReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.GD,
        name: '掼蛋',
        bundle: 'gd',
        hs: 'gd',
        vs: '',
        create: 'GDCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.GD,
                path: 'res/prefab/GDReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.GD,
                path: 'res/prefab/GDReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.HZ,
        name: '扎鸟麻将',
        bundle: 'hz',
        hs: 'hz',
        vs: '',
        create: 'HZCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.HZ,
                path: 'res/prefab/HZReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.HZ,
                path: 'res/prefab/HZResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.HZMJ,
        name: '红中麻将',
        bundle: 'hzmj',
        hs: 'hzmj',
        vs: '',
        create: 'HZMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.HZMJ,
                path: 'res/prefab/HZMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.HZMJ,
                path: 'res/prefab/HZMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.DGN,
        name: '斗公牛',
        bundle: 'dgn',
        hs: 'dgn',
        vs: '',
        create: 'DGNCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.DGN,
                path: 'res/prefab/DGNReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.SSS,
        name: '十三水',
        bundle: 'tw',
        hs: 'tw',
        vs: '',
        create: 'SSSCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.SSS,
                path: 'res/prefab/TWResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.XZMJ,
        name: '血战麻将',
        bundle: 'xz',
        hs: 'xz',
        vs: '',
        create: 'XZMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.XZMJ,
                path: 'res/prefab/XZReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.XZMJ,
                path: 'res/prefab/XZResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.GCT,
        name: '关春天',
        bundle: 'gct',
        hs: 'gct',
        vs: '',
        create: 'GCTCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.GCT,
                path: 'res/prefab/GCTReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.GCT,
                path: 'res/prefab/GCTReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.LYC,
        name: '捞腌菜',
        bundle: 'lyc',
        hs: 'lyc',
        vs: '',
        create: 'LYCCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.LYC,
                path: 'res/prefab/LYCReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.FXJ,
        name: '飞小鸡',
        bundle: 'fxj',
        hs: 'fxj',
        vs: '',
        create: 'FXJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.FXJ,
                path: 'res/prefab/FXJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.FXJ,
                path: 'res/prefab/FXJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.SGBJH,
        name: '三公比金花',
        bundle: 'sgbjh',
        hs: 'sgbjh',
        vs: '',
        create: 'SGBJHCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.SGBJH,
                path: 'res/prefab/SGBJHReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.SDB,
        name: '十点半',
        bundle: 'sdb',
        hs: 'sdb',
        vs: '',
        create: 'SDBCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.SDB,
                path: 'res/prefab/SDBReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.CX,
        name: '扯旋',
        bundle: 'cx',
        hs: 'cx',
        vs: 'cx',
        create: 'CXCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.CX,
                path: 'res/prefab/CXReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.DZPK,
        name: '德州扑克',
        bundle: 'dzpk',
        hs: 'dzpk',
        vs: 'dzpk',
        create: 'DZPKCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.DZPK,
                path: 'res/prefab/DZPKReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.TDK,
        name: '填大坑',
        bundle: 'tdk',
        hs: 'tdk',
        vs: '',
        create: 'TDKCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.TDK,
                path: 'res/prefab/TDKResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.WL,
        name: '卧龙',
        bundle: 'wl',
        hs: 'wl',
        vs: '',
        create: 'WLCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.WL,
                path: 'res/prefab/WLReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.PTJ,
        name: '拼天九',
        bundle: 'ptj',
        hs: 'ptj',
        vs: '',
        create: 'PTJCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.PTJ,
                path: 'res/prefab/PTJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.ZIPAI,
    }, {
        type: Enums.bundleType.MNPDK,
        name: '冕宁跑得快',
        bundle: 'mnpdk',
        hs: 'mnpdk',
        vs: '',
        create: 'MNPDKCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.MNPDK,
                path: 'res/prefab/MNPDKReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.MNPDK,
                path: 'res/prefab/MNPDKReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.MNMJ,
        name: '冕宁麻将',
        bundle: 'mnpdk',
        hs: 'mnpdk',
        vs: '',
        create: 'MNMJCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.MNMJ,
                path: 'res/prefab/MNMJReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.WK,
        name: '挖坑',
        bundle: 'wk',
        hs: 'wk',
        vs: '',
        create: 'WKCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.WK,
                path: 'res/prefab/WKReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.ZLM,
        name: '捉老麻子',
        bundle: 'zlm',
        hs: 'zlm',
        vs: '',
        create: 'ZLMCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.ZLM,
                path: 'res/prefab/ZLMReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.ZLM,
                path: 'res/prefab/ZLMResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.DDZ,
        name: '斗地主',
        bundle: 'ddz',
        hs: 'ddz',
        vs: '',
        create: 'DDZCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.DDZ,
                path: 'res/prefab/DDZReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.DDZ,
                path: 'res/prefab/DDZReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.JGTTZ,
        name: '加锅推筒子',
        bundle: 'jgttz',
        hs: 'jgttz',
        vs: '',
        create: 'JGTTZCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.JGTTZ,
                path: 'res/prefab/JGTTZResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.TTZ, //Type 和 gameType一致
        name: '二八杠',
        bundle: 'ttz',
        hs: 'ttz',
        vs: '',
        create: 'TTZCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.TTZ, //配置为 gameType 读子包 其他情况读主包
                path: 'res/prefab/TTZResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.FJSSS,
        name: '福建十三水',
        bundle: 'fjsss',
        hs: 'fjsss',
        vs: '',
        create: 'FJSSSCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.FJSSS,
                path: 'res/prefab/FJSSSResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.QZMJ,
        name: '泉州麻将',
        bundle: 'qzmj',
        hs: 'qzmj',
        vs: '',
        create: 'QZMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.QZMJ,
                path: 'res/prefab/QZMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.QZMJ,
                path: 'res/prefab/QZMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.QZMJTS,
        name: '泉州麻将特殊版',
        bundle: 'qzmjts',
        hs: 'qzmjts',
        vs: '',
        create: 'QZMJTSCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.QZMJTS,
                path: 'res/prefab/QZMJTSReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.QZMJTS,
                path: 'res/prefab/QZMJTSResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.QZSSS,
        name: '泉州十三水',
        bundle: 'qzsss',
        hs: 'qzsss',
        vs: '',
        create: 'QZSSSCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.QZSSS,
                path: 'res/prefab/QZSSSResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.WWMJ,
        name: '无为麻将',
        bundle: 'wwmj',
        hs: 'wwmj',
        vs: '',
        create: 'WWMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.WWMJ,
                path: 'res/prefab/WWMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.WWMJ,
                path: 'res/prefab/WWMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.TSMJ,
        name: '泰顺麻将',
        bundle: 'tsmj',
        hs: 'tsmj',
        vs: '',
        create: 'TSMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.TSMJ,
                path: 'res/prefab/TSMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.TSMJ,
                path: 'res/prefab/TSMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.XCMJ,
        name: '西昌麻将',
        bundle: 'xcmj',
        hs: 'xcmj',
        vs: '',
        create: 'XCMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.XCMJ,
                path: 'res/prefab/XCMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.XCMJ,
                path: 'res/prefab/XCMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.HLMJ,
        name: '会理麻将',
        bundle: 'hlmj',
        hs: 'hlmj',
        vs: '',
        create: 'HLMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.HLMJ,
                path: 'res/prefab/HLMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.HLMJ,
                path: 'res/prefab/HLMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.GYZJ,
        name: '贵阳捉鸡',
        bundle: 'mhxl',
        hs: 'mhxl',
        vs: '',
        create: 'GYZJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.MHXL,
                path: 'res/prefab/MHXLReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.MHXL,
                path: 'res/prefab/MHXLResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.GYLDG,
        name: '贵阳二丁拐',
        bundle: 'mhxl',
        hs: 'mhxl',
        vs: '',
        create: 'GYLDGCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.MHXL,
                path: 'res/prefab/MHXLReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.MHXL,
                path: 'res/prefab/MHXLResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.GYLDGLF,
        name: '贵阳二丁两房',
        bundle: 'mhxl',
        hs: 'mhxl',
        vs: '',
        create: 'GYLDGLFCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.MHXL,
                path: 'res/prefab/MHXLReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.MHXL,
                path: 'res/prefab/MHXLResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.GYSDG,
        name: '贵阳三丁拐',
        bundle: 'mhxl',
        hs: 'mhxl',
        vs: '',
        create: 'GYSDGCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.MHXL,
                path: 'res/prefab/MHXLReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.MHXL,
                path: 'res/prefab/MHXLResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.GYSDGLF,
        name: '贵阳三丁两房',
        bundle: 'mhxl',
        hs: 'mhxl',
        vs: '',
        create: 'GYSDGLFCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.MHXL,
                path: 'res/prefab/MHXLReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.MHXL,
                path: 'res/prefab/MHXLResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.MHXL,
        name: '焖胡血流',
        bundle: 'mhxl',
        hs: 'mhxl',
        vs: '',
        create: 'MHXLCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.MHXL,
                path: 'res/prefab/MHXLReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.MHXL,
                path: 'res/prefab/MHXLResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.BJ,
        name: '拖拉机',
        bundle: 'bj',
        hs: 'bj',
        vs: '',
        create: 'BJCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.BJ,
                path: 'res/prefab/BJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.YDR,
        name: '幺地人',
        bundle: 'ydr',
        hs: 'ydr',
        vs: '',
        create: 'YDRCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.YDR,
                path: 'res/prefab/YDRReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.YDR,
                path: 'res/prefab/YDRResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.ZIPAI,
    }, {
        type: Enums.bundleType.LSEQS,
        name: '乐山二七十',
        bundle: 'lseqs',
        hs: 'lseqs',
        vs: '',
        create: 'LSEQSCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.LSEQS,
                path: 'res/prefab/LSEQSReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.LSEQS,
                path: 'res/prefab/LSEQSResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.ZIPAI,
    }, {
        type: Enums.bundleType.MJNN,
        name: '麻将牛牛',
        bundle: 'mjnn',
        hs: 'mjnn',
        vs: '',
        create: 'MJNNCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.MJNN,
                path: 'res/prefab/MJNNResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.BJJ,
        name: '比鸡',
        bundle: 'bjj',
        hs: 'bjj',
        vs: '',
        create: 'BJJCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.BJJ,
                path: 'res/prefab/BJJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.CD,
        name: '插道',
        bundle: 'cd',
        hs: 'cd',
        vs: '',
        create: 'CDCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.CD,
                path: 'res/prefab/CDResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.ENSMJ,
        name: '恩施麻将',
        bundle: 'ensmj',
        hs: 'ensmj',
        vs: '',
        create: 'ENSMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.ENSMJ,
                path: 'res/prefab/ENSMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.ENSMJ,
                path: 'res/prefab/ENSMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.GDTDH,
        name: '广东推倒胡',
        bundle: 'gdtdh',
        hs: 'gdtdh',
        vs: '',
        create: 'GDTDHCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.GDTDH,
                path: 'res/prefab/GDTDHReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.GDTDH,
                path: 'res/prefab/GDTDHResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.GDYBZ,
        name: '广东100张',
        bundle: 'gdybz',
        hs: 'gdybz',
        vs: '',
        create: 'GDYBZCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.GDYBZ,
                path: 'res/prefab/GDYBZReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.GDYBZ,
                path: 'res/prefab/GDYBZResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    },
    {
        type: Enums.bundleType.JGPTJ,
        name: '加锅牌九',
        bundle: 'jgptj',
        hs: 'jgptj',
        vs: '',
        create: 'JGPTJCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.JGPTJ,
                path: 'res/prefab/JGPTJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.ZIPAI,
    }, {
        type: Enums.bundleType.CJSJY,
        name: '三加一',
        bundle: 'cjsjy',
        hs: 'cjsjy',
        vs: '',
        create: 'CJSJYCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.CJSJY,
                path: 'res/prefab/CJSJYReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.CNJJ,
        name: '川南九九',
        bundle: 'cnjj',
        hs: 'cnjj',
        vs: '',
        create: 'CNJJCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.CNJJ,
                path: 'res/prefab/CNJJReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.WJYNN,
        name: '五加一',
        bundle: 'nnwjy',
        hs: 'nnwjy',
        vs: '',
        create: 'NNWjyCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.WJYNN,
                path: 'res/prefab/NNWjyReview'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    },
    {
        type: Enums.bundleType.BPMJ, //Type 和 gameType一致
        name: '白皮麻将',
        bundle: 'bpmj',
        hs: 'bpmj',
        vs: '',
        create: 'BPMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.BPMJ,
                path: 'res/prefab/BPMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.BPMJ, //配置为 gameType 读子包 其他情况读主包
                path: 'res/prefab/BPMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    },
    {
        type: Enums.bundleType.AJMJ,
        name: '安吉麻将',
        bundle: 'ajmj',
        hs: 'ajmj',
        vs: '',
        create: 'AJMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.AJMJ,
                path: 'res/prefab/AJMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.AJMJ,
                path: 'res/prefab/AJMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    },
    {
        type: Enums.bundleType.LAMJ,
        name: '六安麻将',
        bundle: 'lamj',
        hs: 'lamj',
        vs: '',
        create: 'LAMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.LAMJ,
                path: 'res/prefab/LAMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.LAMJ,
                path: 'res/prefab/LAMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    },

    {
        type: Enums.bundleType.QJMJ,
        name: '綦江麻将',
        bundle: 'qjmj',
        hs: 'qjmj',
        vs: '',
        create: 'QJMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.QJMJ,
                path: 'res/prefab/QJMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.QJMJ,
                path: 'res/prefab/QJMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    },
    {
        type: Enums.bundleType.FCMJ,
        name: '凤城麻将',
        bundle: 'fcmj',
        hs: 'fcmj',
        vs: '',
        create: 'FCMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.FCMJ,
                path: 'res/prefab/FCMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.FCMJ,
                path: 'res/prefab/FCMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    },
    {
        type: Enums.bundleType.ZGZ,
        name: '扎股子',
        bundle: 'zgz',
        hs: 'zgz',
        vs: '',
        create: 'ZGZCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.ZGZ,
                path: 'res/prefab/ZGZReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.ZGZ,
                path: 'res/prefab/ZGZResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    },
    {
        type: Enums.bundleType.RCSSGMJ,
        name: '荣昌手上归',
        bundle: 'rcssg',
        hs: 'rcssg',
        vs: '',
        create: 'RCSSGCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.RCSSGMJ,
                path: 'res/prefab/RCSSGReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.RCSSGMJ,
                path: 'res/prefab/RCSSGResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    },
    {
        type: Enums.bundleType.MASMJ,
        name: '马鞍山麻将',
        bundle: 'masmj',
        hs: 'masmj',
        vs: '',
        create: 'MASMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.MASMJ,
                path: 'res/prefab/MASMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.MASMJ,
                path: 'res/prefab/MASMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    },
    {
        type: Enums.bundleType.YBMJ,
        name: '宜宾麻将',
        bundle: 'ybmj',
        hs: 'ybmj',
        vs: '',
        create: 'YBMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.YBMJ,
                path: 'res/prefab/YBMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.YBMJ,
                path: 'res/prefab/YBMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    },
    {
        type: Enums.bundleType.PZHMJ,
        name: '攀枝花麻将',
        bundle: 'pzhmj',
        hs: 'pzhmj',
        vs: '',
        create: 'PZHMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.PZHMJ,
                path: 'res/prefab/PZHMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.PZHMJ,
                path: 'res/prefab/PZHMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.LSMJ,
        name: '幺鸡麻将',
        bundle: 'lsmj',
        hs: 'lsmj',
        vs: '',
        create: 'LSMJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.LSMJ,
                path: 'res/prefab/LSMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.LSMJ,
                path: 'res/prefab/LSMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.LSSEJ,
        name: '乐山十二鸡',
        bundle: 'lsmj',
        hs: 'lsmj',
        vs: '',
        create: 'LSSEJCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.LSSEJ,
                path: 'res/prefab/LSMJReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.LSSEJ,
                path: 'res/prefab/LSMJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    },
    {
        type: Enums.bundleType.LSPDK,
        name: '乐山跑得快',
        bundle: 'lspdk',
        hs: 'lspdk',
        vs: '',
        create: 'LSPDKCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.LSPDK,
                path: 'res/prefab/LSPDKReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.LSPDK,
                path: 'res/prefab/LSPDKResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    }, {
        type: Enums.bundleType.YJBPX,
        name: '幺鸡搬螃蟹',
        bundle: 'yjbpx',
        hs: 'yjbpx',
        vs: '',
        create: 'YJBPXCreate',
        desc: '',
        review: {
            video: {
                bundle: Enums.bundleType.YJBPX,
                path: 'res/prefab/YJBPXReviewDialog'
            },
            view: {
                bundle: Enums.bundleType.YJBPX,
                path: 'res/prefab/YJBPXResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.MAJIANG,
    }, {
        type: Enums.bundleType.EZGDT,
        name: '二张广东拖',
        bundle: 'ezgdt',
        hs: 'ezgdt',
        vs: '',
        create: 'EZGDTCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.EZGDT,
                path: 'res/prefab/EZGDTResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.PUKE,
    },
    //#region 百人游戏
    {
        type: Enums.bundleType.BRNN,
        name: '百人牛牛',
        bundle: 'brnn',
        hs: 'brnn',
        vs: '',
        create: 'BRNNCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.BRNN,
                path: 'res/prefab/BJJResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.BAIREN,
    }, {
        type: Enums.bundleType.BRLHD,
        name: '百人龙虎斗',
        bundle: 'brlhd',
        hs: 'brlhd',
        vs: '',
        create: 'BRLHDCreate',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: Enums.bundleType.BRLHD,
                path: 'res/prefab/BRLHDResultDialog'
            }
        },
        sort: 0,
        classify: Enums.bundleClass.BAIREN,
    },
    //#region 皮肤
    {
        type: Enums.bundleType.HALL_DF,
        name: '大厅',
        bundle: 'mnby',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    }, {
        type: Enums.bundleType.HALL_GREEN,
        name: '大厅',
        bundle: 'mngreen',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    }, {
        type: Enums.bundleType.HALL_PANDA,
        name: '大厅',
        bundle: 'mnpanda',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    }, {
        type: Enums.bundleType.HALL_SEA,
        name: '大厅',
        bundle: 'mnsea',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    }, {
        type: Enums.bundleType.HALL_BUNNY,
        name: '大厅',
        bundle: 'mnbunnybirl',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.HALL_CHUN,
        name: '大厅',
        bundle: 'mnchun',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.HALL_BACK,
        name: '大厅',
        bundle: 'mnback',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.HALL_RED,
        name: '大厅',
        bundle: 'mnred',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.HALL_WHITE,
        name: '大厅',
        bundle: 'mnwhite',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.HALL_MOYIN,
        name: '大厅',
        bundle: 'mnmoyin',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    }, {
        type: Enums.bundleType.HALL_WINERED,
        name: '大厅',
        bundle: 'mnwinered',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    }, {
        type: Enums.bundleType.HALL_WOODS,
        name: '大厅',
        bundle: 'mnwoods',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.HALL_QINGXIN,
        name: '大厅',
        bundle: 'mnqingxin',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    }, {
        type: Enums.bundleType.HALL_LANSE,
        name: '大厅',
        bundle: 'mnlanse',
        hs: 'hall',
        vs: 'hall',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.UNION_DF,
        name: '联盟',
        bundle: 'unby',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.UNION_SEA,
        name: '联盟',
        bundle: 'unsea',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.UNION_GREEN,
        name: '联盟',
        bundle: 'ungreen',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.UNION_PANDA,
        name: '联盟',
        bundle: 'unpanda',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.UNION_BUNNY,
        name: '联盟',
        bundle: 'unbunny',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.UNION_CHUN,
        name: '联盟',
        bundle: 'unchun',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.UNION_BACK,
        name: '联盟',
        bundle: 'unback',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.UNION_RED,
        name: '联盟',
        bundle: 'unred',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.UNION_WHITE,
        name: '联盟',
        bundle: 'unwhite',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.UNION_MOYIN,
        name: '联盟',
        bundle: 'unmoyin',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    }, {
        type: Enums.bundleType.UNION_WINERED,
        name: '联盟',
        bundle: 'unwinered',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    }, {
        type: Enums.bundleType.UNION_WOODS,
        name: '联盟',
        bundle: 'unwoods',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    }, {
        type: Enums.bundleType.UNION_QINGXIN,
        name: '联盟',
        bundle: 'unqingxin',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    }, {
        type: Enums.bundleType.UNION_LANSE,
        name: '联盟',
        bundle: 'unlanse',
        hs: 'union',
        vs: 'union',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_DF,
        name: '弹窗',
        bundle: 'dlby',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_SEA,
        name: '弹窗',
        bundle: 'dlsea',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_GREEN,
        name: '弹窗',
        bundle: 'dlgreen',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_PANDA,
        name: '弹窗',
        bundle: 'dlpanda',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_BUNNY,
        name: '弹窗',
        bundle: 'dlbunny',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_CHUN,
        name: '弹窗',
        bundle: 'dlchun',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_BACK,
        name: '弹窗',
        bundle: 'dlback',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_RED,
        name: '弹窗',
        bundle: 'dlred',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_WHITE,
        name: '弹窗',
        bundle: 'dlwhite',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_MOYIN,
        name: '弹窗',
        bundle: 'dlmoyin',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_WINERED,
        name: '弹窗',
        bundle: 'dlwinered',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_WOODS,
        name: '弹窗',
        bundle: 'dlwoods',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_QINGXIN,
        name: '弹窗',
        bundle: 'dlqingxin',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    },
    {
        type: Enums.bundleType.POP_LANSE,
        name: '弹窗',
        bundle: 'dllanse',
        hs: '',
        vs: '',
        create: '',
        desc: '',
        review: {
            video: {
                bundle: null,
                path: ''
            },
            view: {
                bundle: null,
                path: ''
            }
        },
        sort: 0,
        classify: Enums.bundleClass.SKIN,
    }
    ],

    chatText: [
        '快点啊，等到花儿都谢了！',
        '不要吵了，不要吵了。专心玩游戏吧！',
        '怎么又断线了，网络怎么这么差啊！',
        '不要走，决战到天亮！',
        '底牌亮出来绝对吓死你！',
        '风水轮流转，底裤都输光！',
        '看我通杀全场，这些钱都是我的！',
        '不好意思啊，我要离开一会！',
        '大牛吃小牛，不要伤心哦！',
        '一点小钱，那都不是事儿！',
    ]
};