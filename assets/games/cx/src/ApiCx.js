/*分
 * 捞腌菜协议
 */
let proto = module.exports;

proto.gameStatus = {
	NONE: 0,
	/* 等待操作 */
	POUR_SCORE: 1,
	/* 下底分 */
	WASH_CARD: 2,
	/* 洗牌 */
	CHANGE_CARD: 3,
	/* 切牌 */
	SEND_CARDS: 4,
	/* 发牌 */
	USER_OPERATE: 5,
	/* 用户操作 */
	SHOW_CARDS: 6,
	/* 定牌 */
	RESULT: 7,
	/* 显示结果 */
};

//游戏操作
proto.operateType = {
	NONE: 0,
	FOLD: 1, //丢
	QIAO: 2, //敲
	DA: 3, //大
	XIU: 4, //休
	GEN: 5, //跟
	FEN: 6, //分牌
}

proto.baseMangType = {
	QUAN: 1, //圈芒
	ZOU: 2, //揍芒
	XIU: 3, //休芒
}

//游戏操作
proto.operateTypeName = {
	[1]: '丢', //丢
	[2]: '敲', //敲
	[3]: '大', //大
	[4]: '休', //休
	[5]: '跟', //跟
	[6]: '分牌', //分牌
}

//游戏玩法
proto.cardType = {
	SHANHUA: 1, //三花特殊牌
	DINGERHUANG: 10, //丁二皇
	TIANPAI: 20, //天牌
	DIPAI: 30, //地牌
	REPAI: 40, //人牌
	HEPAI: 50, //和牌
	MEISHI: 60, //梅十
	BANDENG: 70, //板凳
	CHANGSAN: 80, //长三
	FUTOU: 90, //斧头
	SHAOSHI: 100, //苕十
	MAOMAO: 110, //猫猫
	GAOYAO: 120, //膏 药
	HEIJIU: 130, //黑9
	HEIBA: 140, //黑8
	HEIQI: 150, //黑7
	XIAOWU: 160, //小5
	ZERO: 1110, //0点
	ONE: 1061,
	TWO: 971,
	THREE: 881,
	FOUR: 781,
	FIVE: 691,
	SIX: 581,
	SEVEN: 491,
	EIGHT: 391,
	NINE: 311,
	TIANJIUWANG: 170, //天九王
	TIANHONGGANG: 180, //天红杠
	TIANHEIGANG: 190, //天黑杠
	DIHONGGANG: 200, //地红杠
	DIHEIGANG: 210, //地黑杠
	//9点叫法
	TIANGUANJIU: 220, //天官九
	DIGUANJIU: 230, //地官九
	REGUANJIU: 240, //人官九
	HEGUANJIU: 250, //和官九
	MEISHIJIU: 260, //梅十九
	BANWUJIU: 270, //板五九
	DINGCHANGJIU: 280, //丁长九
	WULONGJIU: 290, //乌龙九
	SHAOSHIJIU: 300, //苕十九
	DINGMAOJIU: 310, //丁猫九
	//8点叫法
	TIANGUANBA: 320, //天官八
	DIGUANBA: 330, //地官八
	RESHIBA: 340, //人十八
	HEGUANBA: 350, //和官八
	MEISHIBA: 360, //梅十八
	FUQIBA: 370, //斧七八
	SHAOSHIBA: 380, //苕十八
	DINGWUBA: 390, //丁五八
	//7点叫法
	TIANGUANQI: 400, //天官七
	DIGUANQI: 410, //地官七
	SHUZHOUQI: 420, //苏州七
	DINGHEQI: 430, //丁和七
	MEISHIQI: 440, //梅十七
	DINGBANQI: 450, //丁板七
	FUCHANGQI: 460, //斧长七
	FUMAOQI: 470, //斧猫七
	SHAOSHIQI: 480, //苕十七
	FUTOUQI: 481, //斧头7
	FEIZHOUQI: 490, //非洲七
	//6点叫法
	TIANGUANLIU: 500, //天官六
	DIGUANLIU: 510, //地官六
	YUANBAOLIU: 520, //元宝六
	ZHONGSANLIU: 521, //中山六
	MEISHILIU: 530, //梅十六
	CHANGSANLIU: 540, //长三六
	FUWULIU: 550, //斧五六
	SHAOSHILIU: 560, //苕十六
	GAOYAOLIU: 570, //膏药六
	QIJIULIU: 580, //七九六
	//5点叫法
	TIANDINGWU: 590, //天丁五
	DIDINGWU: 600, //地丁五
	RESHIWU: 610, //人十五
	HEFUWU: 620, //和斧五
	MEISHIWU: 630, //梅十五
	BANFUWU: 640, //板斧五
	CHANGSANWU: 650, //长三五
	BANDENGWU: 652, //板凳五
	SHAOSHIWU: 660, //苕十五
	MAOJIUWU: 670, //猫九五
	GAOYAOWU: 680, //膏药五
	LIUJIUWU: 681, //六九五
	QIBAWU: 690, //七八五
	//4点叫法
	TIANDIGONGZI: 700, //天地公子
	RESHISI: 710, //人十四
	HESHISI: 720, //和十四
	MEISHISI: 730, //梅十四
	CHANGSHISI: 740, //长十四
	DINGFUSI: 750, //丁斧四
	LIUBASI: 760, //六八四
	SHUANGHUAQI: 770, //双花七
	WUJIUSI: 780, //五九四
	//3点叫法
	TIANFUSAN: 790, //天斧三
	DIFUSAN: 800, //地斧三
	RESHISAN: 810, //人十三
	HESHISAN: 820, //和十三
	MEISHISAN: 830, //梅十三
	SIJIUSAN: 840, //四九三
	CHANGSHISAN: 850, //长十三
	GAOYAOSAN: 851, //膏药三
	SHAOSHISAN: 860, //苕十三
	LIUQISAN: 870, //六七三
	WUBASAN: 880, //五八三
	//2点叫法
	TIANSHIER: 890, //天十二
	DISHIER: 900, //地十二
	RESHIER: 910, //人十二
	HESHIER: 920, //和十二
	SIBAER: 930, //四八二
	CHANGSANER: 931, //长三二
	ERLIUER: 940, //二六二
	MAOMAOER: 941, //猫猫二
	GAOYAOER: 950, //膏药二
	DINGJIUER: 960, //丁九二
	WUQIER: 970, //五七二
	//1点叫法
	DIJIUWANG: 980, //地九王
	RESHIYI: 990, //人十一
	HESHIYI: 1000, //和十一
	MEISHIYI: 1010, //梅十一
	SIQIYI: 1020, //四七一
	CHANGSANYI: 1030, //长三一
	FUSHIYI: 1040, //斧十一
	WULIUYI: 1050, //五六一
	DINGBAYI: 1060, //丁八一
	//0点不分大小
	SILIUZHOU: 1070, //四六皱
	SHUANGHUASHI: 1080, //双花十
	FUJIUZHOU: 1090, //斧九皱
	DINGQIZHOU: 1100, //丁七皱
}

proto.cardTypeName = {
	[1]: '三花',
	[1110]: '0点',
	[1061]: '1点',
	[971]: '2点',
	[881]: '3点',
	[781]: '4点',
	[691]: '5点',
	[581]: '6点',
	[491]: '7点',
	[391]: '8点',
	[311]: '9点',
	[10]: '丁二皇',
	[20]: '天牌',
	[30]: '地牌',
	[40]: '人牌',
	[50]: '和牌',
	[60]: '梅十',
	[70]: '板凳',
	[80]: '长三',
	[90]: '斧头',
	[100]: '苕十',
	[110]: '猫猫',
	[120]: '膏药',
	[130]: '黑九',
	[140]: '黑八',
	[150]: '黑七',
	[160]: '小五',
	[170]: '天九王',
	[180]: '天红杠',
	[190]: '天黑杠',
	[200]: '地红杠',
	[210]: '地黑杠',
	[220]: '天官九',
	[230]: '地官九',
	[240]: '人官九',
	[250]: '和官九',
	[260]: '梅十九',
	[270]: '板五九',
	[280]: '丁长九',
	[290]: '乌龙九',
	[300]: '苕十九',
	[310]: '丁猫九',
	[320]: '天官八',
	[330]: '地官八',
	[340]: '人十八',
	[350]: '和官八',
	[360]: '梅十八',
	[370]: '斧七八',
	[380]: '苕十八',
	[390]: '丁五八',
	[400]: '天官七',
	[410]: '地官七',
	[420]: '苏州七',
	[430]: '丁和七',
	[440]: '梅十七',
	[450]: '丁板七',
	[460]: '斧长七',
	[470]: '斧猫七',
	[480]: '苕十七',
	[481]: '斧头7',
	[490]: '非洲七',
	[500]: '天官六',
	[510]: '地官六',
	[520]: '元宝六',
	[521]: '中山六',
	[530]: '梅十六',
	[540]: '长三六',
	[550]: '斧五六',
	[560]: '苕十六',
	[570]: '膏药六',
	[580]: '七九六',
	[590]: '天丁五',
	[600]: '地丁五',
	[610]: '人十五',
	[620]: '和斧五',
	[630]: '梅十五',
	[640]: '板斧五',
	[650]: '长三五',
	[652]: '板凳五',
	[660]: '苕十五',
	[670]: '猫九五',
	[680]: '膏药五',
	[681]: '六九五',
	[690]: '七八五',
	[700]: '天地公子',
	[710]: '人十四',
	[720]: '和十四',
	[730]: '梅十四',
	[740]: '长十四',
	[750]: '丁斧四',
	[760]: '六八四',
	[770]: '双花七',
	[780]: '五九四',
	[790]: '天斧三',
	[800]: '地斧三',
	[810]: '人十三',
	[820]: '和十三',
	[830]: '梅十三',
	[840]: '四九三',
	[850]: '长十三',
	[851]: '膏药三',
	[860]: '苕十三',
	[870]: '六七三',
	[880]: '五八三',
	[890]: '天十二',
	[900]: '地十二',
	[910]: '人十二',
	[920]: '和十二',
	[930]: '四八二',
	[931]: '长三二',
	[940]: '二六二',
	[941]: '猫猫二',
	[950]: '膏药二',
	[960]: '丁九二',
	[970]: '五七二',
	[980]: '地九王',
	[990]: '人十一',
	[1000]: '和十一',
	[1010]: '梅十一',
	[1020]: '四七一',
	[1030]: '长三一',
	[1040]: '斧十一',
	[1050]: '五六一',
	[1060]: '丁八一',
	[1070]: '四六皱',
	[1080]: '双花十',
	[1090]: '斧九皱',
	[1100]: '丁七皱',
}

proto.GAME_STATUS_PUSH = 470; //游戏状态推送
//庄家推送
proto.GAME_BANKER_PUSH = 601;
//玩家底分和芒果分推送
proto.GAME_BASE_SCORE_PUSH = 602;
//发玩家手牌
proto.GAME_SEND_CARDS_PUSH = 603;
//开始操作推送
proto.GAME_USER_OPERATE_START_PUSH = 604;
//玩家摆牌推送
proto.GAME_SHOW_CARDS_NOTIFY = 505;
proto.getShowCardsNotify = function (oneCards, twoCards) {
	return {
		type: this.GAME_SHOW_CARDS_NOTIFY,
		data: {
			oneCards: oneCards,
			twoCards: twoCards
		},
	}
};
proto.GAME_SHOW_CARDS_PUSH = 605;
//游戏结果推送
proto.GAME_RESULT_PUSH = 606;
//牌面回房
proto.GAME_REVIEW_NOTIFY = 507;
proto.getReviewNotify = function () {
	return {
		type: this.GAME_REVIEW_NOTIFY,
		data: {},
	}
};
proto.GAME_REVIEW_PUSH = 607;
//局数推送
proto.GAME_BUREAU_PUSH = 608;
proto.GAME_END_PUSH = 609;
//推送操作
proto.GAME_USER_OPERATE_NOTIFY = 510;
proto.getOperateNotify = function (operateType, score) {
	return {
		type: this.GAME_USER_OPERATE_NOTIFY,
		data: {
			operateType: operateType,
			score: score
		},
	}
};
proto.GAME_USER_OPERATE_PUSH = 610;

proto.GAME_USER_SCORE_CHANGE_PUSH = 612;
proto.gameUserScoreChangePush = function (userPourScore, userTotalScore) {
	return {
		type: this.GAME_USER_SCORE_CHANGE_PUSH,
		data: {
			userPourScore,
			userTotalScore
		},
	};
};

//玩家买分
proto.GAME_USER_BUY_SCORE_NOTIFY = 511;
proto.GAME_USER_BUY_SCORE_PUSH = 611;
proto.getBuyScoreNotify = function (uid, score) {
	return {
		type: this.GAME_USER_BUY_SCORE_NOTIFY,
		data: {
			uid: uid,
			score: score
		}
	}
};

//看牌
proto.GAME_LOOK_CARDS_NOTIFY = 550;
proto.GAME_LOOK_CARDS_PUSH = 650;

//换牌
proto.GAME_SET_TEST_CARDS_NOTIFY = 551;
proto.setTestCardsNotify = function (cardData) {
	return {
		type: this.GAME_SET_TEST_CARDS_NOTIFY,
		data: {
			cardData: cardData
		}
	}
};
proto.GAME_SET_TEST_CARDS_PUSH = 651;

//查询牌库
proto.GAME_GET_TEST_CARDS_NOTIFY = 552;
proto.getGetTestCardsNotify = function () {
	return {
		type: this.GAME_GET_TEST_CARDS_NOTIFY,
		data: {}
	}
};
proto.GAME_GET_TEST_CARDS_PUSH = 652;