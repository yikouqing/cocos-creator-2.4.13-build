const gameUtil = require("./TWUtil");

var proto = module.exports;
proto.cardType = {
	danpai: {
		type: 0,
		name: 'danpai',
		rate: 0
	},
	duizi: {
		type: 1,
		name: 'duizi',
		rate: 0
	},
	liangdui: {
		type: 2,
		name: 'liangdui',
		rate: 0
	},
	santiao: {
		type: 4,
		name: 'santiao',
		rate: 0
	},
	shunzi: {
		type: 8,
		name: 'shunzi',
		rate: 0
	},
	tonghua: {
		type: 16,
		name: 'tonghua',
		rate: 0
	},
	hulu: {
		type: 32,
		name: 'hulu',
		rate: 0
	},
	sitiao: {
		type: 64,
		name: 'sitiao',
		rate: 0
	},
	tonghuashun: {
		type: 128,
		name: 'tonghuashun',
		rate: 0
	},
	wutong: {
		type: 256,
		name: 'wutong',
		rate: 0
	},
	guaipai: {
		type: 512,
		name: 'guaipai',
		rate: 0
	},
	//特殊牌
	qinglong: {
		type: 512,
		name: '青龙',
		rate: 108
	},
	yitiaolong: {
		type: 512,
		name: '一条龙',
		rate: 36
	},
	shierhuangzu: {
		type: 512,
		name: '十二皇族',
		rate: 24
	},
	santonghuashun: {
		type: 512,
		name: '三同花顺',
		rate: 22
	},
	sanfentianxia: {
		type: 512,
		name: '三分天下',
		rate: 20
	},
	sitaosantiao: {
		type: 512,
		name: '四套三条',
		rate: 6
	},
	wuduisantiao: {
		type: 512,
		name: '五对三条',
		rate: 5
	},
	liuduiban: {
		type: 512,
		name: '六对半',
		rate: 4
	},
	santonghua: {
		type: 512,
		name: '三同花',
		rate: 3
	},
	sanshunzi: {
		type: 512,
		name: '三顺子',
		rate: 3
	},
	quanda: {
		type: 512,
		name: '全大',
		rate: 15
	},
	quanxiao: {
		type: 512,
		name: '全小',
		rate: 15
	},
	couyise: {
		type: 512,
		name: '凑一色',
		rate: 10
	},
	quanheiyidianhong: {
		type: 512,
		name: '全黑一点红',
		rate: 6
	},
	quanhongyidianhei: {
		type: 512,
		name: '全红一点黑',
		rate: 6
	},
	banda: {
		type: 512,
		name: '半大',
		rate: 0
	},
	banxiao: {
		type: 512,
		name: '半小',
		rate: 0
	},
};
/* [0,1,2,3,4,5,6,7,8,9,10,11,12] 方块 
   [13,14,15,16,17,18,19,20,21,22,23,24,25] 梅花
   [26,27,28,29,30,31,32,33,34,35,36,37,38] 红桃
   [39,40,41,42,43,44,45,46,47,48,49,50,51] 黑桃
*/
/*特殊牌开关 */
proto.tesupaiCard = {
	qinglong: false, //青龙
	yitiaolong: false, //一条龙
	shierhuangzu: false, //十二皇族
	santonghuashun: false, //三同花顺
	sanfentianxia: false, //三分天下
	sitaosantiao: false, //四套三条
	wuduisantiao: false, //五对三条
	liuduiban: false, //六对半
	santonghua: false, //三同花
	sanshunzi: false, //三顺子
	quanda: false, //全大
	quanxiao: false, //全小
	couyise: false, //凑一色
	quanheiyidianhong: false, //全黑一点红
	quanhongyidianhei: false, //全红一点黑
	banda: false, //半大
	banxiao: false, //半小
};


proto.tesupaiscore = {
	"qinglong": 108, //青龙
	"yitiaolong": 36, //一条龙
	"shierhuangzu": 24, //十二皇族
	"santonghuashun": 22, //三同花顺
	"sanfentianxia": 20, //三分天下
	"quanda": 15, //全大
	"quanxiao": 15, //全小
	"couyise": 10, //凑一色
	"quanheiyidianhong": 6, //全黑一点红
	"quanhongyidianhei": 6, //全红一点黑
	"sitaosantiao": 6, //四套三条
	"wuduisantiao": 5, //五对三条
	"liuduiban": 4, //六对半
	"santonghua": 3, //三同花
	"sanshunzi": 3, //三顺子
};

/* 获取牌 */
proto.getCardsArr = function (chairCount) {
	var cardsArr = [];

	for (let x = 0; x < chairCount; x++) {
		cardsArr[x] = [];
	}
	var cards = this.cards;
	var i, ran1, ran2, tmp;
	for (i = 0; i < 100; ++i) {
		/* 洗牌 */
		ran1 = Math.floor(Math.random() * cards.length);
		ran2 = Math.floor(Math.random() * cards.length);
		tmp = cards[ran1];
		cards[ran1] = cards[ran2];
		cards[ran2] = tmp;
	}
	for (i = 0; i < chairCount * 13; ++i) {
		cardsArr[Math.floor(i / 13)].push(cards[i]);
	}
	return cardsArr;
};

proto.setCardsType = function (gameRule) {
	this.cards = [];
	this.gameRule = gameRule;
	let ren = gameRule.maxPlayerCount;
	let mapai = gameRule.mapai;
	let wangpai = gameRule.wangpai;
	let colors = [];
	for (let x in gameRule.colors) {
		if (gameRule.colors[x]) {
			colors.push(x);
		}
	}
	this.mapai = mapai;
	switch (mapai) {
		case 0:
			this.mapai = false;
			break;
		case 1:
			this.mapai = 39;
			break;
		case 2:
			this.mapai = 43;
			break;
		case 3:
			this.mapai = 48;
			break;
		default:
			break;
	}
	this.tesupai = gameRule.tesupai;
	for (var x in this.tesupaiCard) {
		this.tesupaiCard[x] = gameRule.tesupaitype[x] == null ? false : gameRule.tesupaitype[x];
	}
	var fColor = []; //副花色
	var zColor = []; //主花色 只有一个主花色
	var poker = [];
	colors = colors.slice();
	if (colors.length !== 4) {
		zColor = colors.splice(0, 1);
	}
	// [3]
	if (colors.length == 0) {
		for (var j = 0; j < ren; j++) { // 4~9
			var color = zColor[0]; // 3
			for (var i = 0; i < 13; i++) {
				poker.push(color * 13 + i); // 39~51 * 4
				//color++;
			}
		}
	} else {
		if (colors.length === 4) ren++;

		for (var i = 0; i < ren - 1; i++) {
			var index = i % colors.length;
			fColor.push(colors[index]);
		}
		//console.log(fColor);
		//console.log(zColor);
		for (var j = 0; j < fColor.length; j++) {
			var color = fColor[j];
			for (var i = 0; i < 13; i++) {
				poker.push(color * 13 + i);
				//color++;
			}
		}
		for (var j = 0; j < zColor.length; j++) {
			var color = zColor[j];
			for (var i = 0; i < 13; i++) {
				poker.push(color * 13 + i);
				//color++;
			}

		}
	}
	var guiC = [52, 53];
	for (var i = 0; i < wangpai; i++) {
		var index = i % guiC.length;
		poker.push(guiC[index]);
	}
	this.cards = poker;
	//console.log(this.tesupaiCard)
};
/* 根据牌的结果算分 */
proto.getResout = function (cardsArr, guaiArr, baseScore) {
	var i, j;
	let gameRule = this.gameRule;
	if (!guaiArr && !this.tesupai) { // 默认无怪牌
		guaiArr = [];
		for (i = 0; i < cardsArr.length; ++i) {
			guaiArr[i] = false;
		}
	}
	var scoresArr = [];
	for (i = 0; i < cardsArr.length; ++i) {
		scoresArr[i] = [];
		for (j = 0; j < cardsArr.length; ++j) {
			scoresArr[i][j] = [0, 0, 0];
		}
	}
	var daqiangArr = []; // 打枪倍率
	var rateArr = []; // 黑桃a翻倍倍率 
	var guaipaiScoreArr = []; // 怪牌分数
	for (i = 0; i < cardsArr.length; ++i) {
		rateArr[i] = 1;
		guaipaiScoreArr[i] = 0;
		daqiangArr[i] = [];
		for (j = 0; j < cardsArr.length; ++j) {
			daqiangArr[i][j] = (i === j) ? 0 : 1;
		}
	}
	for (i = 0; i < guaiArr.length; ++i) { // 怪牌分 
		if (guaiArr[i]) {
			let tesupaiType = this.getTeShuPaiCardType(cardsArr[i]);
			if (tesupaiType != null) {
				guaipaiScoreArr[i] = this.tesupaiscore[tesupaiType.name];
			}
			// = this.hasYitiaolong(cardsArr[i]) ? 26 : 3;
		}
	}
	if (this.mapai) { // 黑桃A翻倍 
		for (i = 0; i < cardsArr.length; ++i) {
			if (cardsArr[i].indexOf(this.mapai) !== -1) {
				rateArr[i] = 2;
			}
		}
	}
	for (i = 0; i < cardsArr.length; ++i) { // 牌分
		if (!guaiArr[i]) {
			for (j = 0; j < cardsArr.length; ++j) {
				if (j !== i && !guaiArr[j]) {
					var score = 0;
					//比头道
					var touA = this.getTouArr(cardsArr[i]);
					var touB = this.getTouArr(cardsArr[j]);
					var aTouScore = gameUtil.getElectionScore(touA);
					var bTouScore = gameUtil.getElectionScore(touB);
					//var touExtra = gameUtil.getClassicType(aTouScore,bTouScore,"tou");
					var touScore = aTouScore > bTouScore ? baseScore : (aTouScore === bTouScore ? 0 : -baseScore);
					var Tabs = touScore > 0 ? 1 : (touScore == 0 ? 0 : -1);
					//touExtra *= (beiLv*bankerBeilv*horseDouble)*Tabs;
					scoresArr[i][j][0] = touScore * Tabs;

					//比中道
					var zhongA = this.getZhongArr(cardsArr[i]);
					var zhongB = this.getZhongArr(cardsArr[j]);
					var aZhongScore = gameUtil.getElectionScore(zhongA);
					var bZhongScore = gameUtil.getElectionScore(zhongB);
					var zhongScore = aZhongScore > bZhongScore ? baseScore : (aZhongScore === bZhongScore ? 0 : -baseScore);
					var Zabs = zhongScore > 0 ? 1 : (zhongScore == 0 ? 0 : -1);
					scoresArr[i][j][1] = score * Zabs;

					//比尾道
					var weiA = this.getWeiArr(cardsArr[i]);
					var weiB = this.getWeiArr(cardsArr[j]);
					var aWeiScore = gameUtil.getElectionScore(weiA);
					var bWeiScore = gameUtil.getElectionScore(weiB);
					var weiScore = aWeiScore > bWeiScore ? baseScore : (aWeiScore === bWeiScore ? 0 : -baseScore);
					var Wabs = weiScore > 0 ? 1 : weiScore == 0 ? 0 : -1;
					scoresArr[i][j][2] = weiScore * Wabs;
				}
			}
		} else {

		}
	}
	for (i = 0; i < scoresArr.length; ++i) { // 打枪倍率
		for (j = 0; j < scoresArr[i].length; ++j) {
			if (scoresArr[i][j][0] > 0 && scoresArr[i][j][1] > 0 && scoresArr[i][j][2] > 0) {
				if (gameRule.jifen == 0) {
					daqiangArr[i][j] = 2;
				} else {
					daqiangArr[i][j] = 1;
				}

			}
			if (scoresArr[i][j][0] < 0 && scoresArr[i][j][1] < 0 && scoresArr[i][j][2] < 0) {
				if (gameRule.jifen == 0) {
					daqiangArr[i][j] = -2;
				} else {
					daqiangArr[i][j] = -1;
				}

			}
		}
	}
	var hasSanchuan = function (i) { //是否三穿
		if (!gameRule.youSanChuan) {
			return false;
		}
		var j, count = 0;
		for (j = 0; j < daqiangArr[i].length; ++j) {
			if (daqiangArr[i][j] >= 1) {
				++count;
			}
		}
		return (count === cardsArr.length - 1 && count >= 3);
	};
	for (i = 0; i < gameRule.maxPlayerCount; ++i) { //三穿倍率
		for (j = 0; j < gameRule.maxPlayerCount; ++j) {
			if (i !== j) {
				if (hasSanchuan(i)) {
					if (gameRule.jifen == 0) {
						daqiangArr[i][j] = 4;
					} else {
						daqiangArr[i][j] = 2;
					}
				} else if (hasSanchuan(j)) {
					//daqiangArr[i][j] = -4;
					if (gameRule.jifen == 0) {
						daqiangArr[i][j] = -4;
					} else {
						daqiangArr[i][j] = -2;
					}
				}
			}
		}
	}
	for (let i = 0; i < scoresArr.length; ++i) {
		let score1 = scoresArr[i];
		for (let j = 0; j < score1.length; ++j) {
			let score2 = score1[j];
			for (let k = 0; k < score2.length; ++k) {
				score2[k] *= baseScore;
			}
		}
	}
	for (let i = 0; i < guaipaiScoreArr.length; ++i) {
		guaipaiScoreArr[i] *= baseScore;
	}
	return {
		cardsArr: cardsArr,
		scoresArr: scoresArr,
		guaipaiScoreArr: guaipaiScoreArr,
		daqiangArr: daqiangArr,
		rateArr: rateArr
	};
};

/*获取是否特殊牌 */
proto.getTeShuPaiCardType = function (arr) {
	if (!this.tesupai) {
		return false;
	}
	var typeArr = gameUtil.getAllHoldTypeWithSpecial(arr, this.tesupaiCard);
	for (let name in typeArr) {
		if (typeArr[name]) {
			return name;
		}
	}
	return false;
};

/* 获取玩家最后分 */
proto.getUserScore = function (chairId, resout) {
	var scoreArr = resout.scoresArr[chairId];
	var i, j, sum = 0;
	for (i = 0; i < scoreArr.length; ++i) {
		if (i !== chairId) {
			for (j = 0; j < scoreArr[i].length; ++j) {
				sum += scoreArr[i][j];
			}
		}
	}
	sum += resout.guaipaiScoreArr[chairId];
	return sum;
};

/* 获取牌的花色 */
proto.getCardColor = function (id) {
	var colorArr = ['fangkuai', 'meihua', 'hongtao', 'heitao'];
	if (id == 52) {
		return 'meihua';
	}
	if (id == 53) {
		return 'fangkuai';
	}
	return colorArr[Math.floor(id / 13)];
};

/* 获取牌的类型,摆放错误时类型为null */
proto.getCardsType = function (arr) {
	if (arr.length !== 13) {
		//console.log('error: getCardsType');
		return null;
	}
	var touArr = this.getTouArr(arr);
	var zhongArr = this.getZhongArr(arr);
	var weiArr = this.getWeiArr(arr);
	var type1 = 0,
		type2 = 0,
		type3 = 0;
	let cardType = this.getTeShuPaiCardType(arr);
	if (cardType) {
		/* 特殊牌 */
		type1 = cardType.type;
		type2 = cardType.type;
		type3 = cardType.type;
		return {
			type1: type1,
			type2: type2,
			type3: type3
		};

	} else {
		type1 = this.getTouZhongWeiCardType(touArr);
		type2 = this.getTouZhongWeiCardType(zhongArr);
		type3 = this.getTouZhongWeiCardType(weiArr);
		if (this.compareCards(weiArr, zhongArr, type3, type2) && this.compareCards(zhongArr, touArr, type2, type1)) {
			return {
				type1: type1,
				type2: type2,
				type3: type3
			};
		} else {
			return null;
		}
	}
};

/* 自动码牌 */
proto.autoSortCards = function (arr) {
	// console.log("自动码牌", arr)
	let result = gameUtil.getGroupAllPokerType(arr);

	let a = result[0];
	var cardArr = [];
	cardArr = a[2].ids.concat(a[1].ids, a[0].ids)
	return cardArr;
};

/* 比较牌, arr1 > arr2 时为true */
proto.compareCards = function (arr1, arr2, type1, type2) {
	return gameUtil.getElectionScore(arr1) - gameUtil.getElectionScore(arr2) > 0;
};

/* arr1>arr2: <0	arr1<arr2: >0	arr1=arr2: =0*/
proto.compareDanpai = function (arr1, arr2) {
	arr1 = this.sortCardByCountThenColor(arr1);
	arr2 = this.sortCardByCountThenColor(arr2);
	var i, j;
	for (i = 0; i < arr1.length && i < arr2.length; ++i) {
		j = this.cardSortFunc(arr1[i], arr2[i]);
		if (j !== 0) {
			return j;
		}
	}
	return 0;
};
/* arr1>arr2: <0	arr1<arr2: >0	arr1=arr2: =0*/
proto.compareShunzi = function (arr1, arr2) {
	let max1 = this.getShuziMaxNumber(arr1);
	let max2 = this.getShuziMaxNumber(arr2);
	if (max2 - max1 === 0) {
		return this.compareDanpai(arr1, arr2);
	} else {
		return max2 - max1;
	}

}

proto.getShuziMaxNumber = function (arr) {
	var max1 = 0;
	var wangpaiCount = this.getWangpaiCount(arr);
	if (wangpaiCount > 0) {
		//删除王牌
		var newcard = arr.filter(function (value) {
			return value != 53;
		})
		var cards = this.sortCardByCountThenColor(newcard);
		for (j = 1; j < cards.length; ++j) {
			if ((13 + cards[j - 1] - 1) % 13 !== cards[j] % 13 || cards[j - 1] % 13 - 1 !== cards[j] % 13) {
				cards.splice(j, 0, cards[j] % 13 - 1)
			} else if (cards[j] % 13 < cards[j - 1] % 13) {
				break;
			}
		}
		// console.log(newcard)
	}
};

proto.compareHuase = function (arr1, arr2) {
	arr1 = this.sortCardByCountThenColor(arr1);
	arr2 = this.sortCardByCountThenColor(arr2);
	return arr2[0] - arr1[0];
};

/* 有对子 */
proto.hasDuizi = function (arr) {
	var i, j;
	var cards = this.removeCardColor(arr);
	var wangpaiCount = this.getWangpaiCount(arr);
	for (i = 0; i < cards.length; ++i) {
		var count = 0;
		for (j = 0; j < cards.length; ++j) {
			if (cards[i] === cards[j]) {
				++count;
			}
		}
		if (count >= 2 - wangpaiCount) {
			return true;
		}
	}
	return false;
};

/* 有两对 */
proto.hasLiangdui = function (arr) {
	if (arr.length < 4) {
		return false;
	}
	var wangpaiCount = this.getWangpaiCount(arr);
	var i, j;
	var cards = this.removeCardColor(arr);
	var duiArr = [];
	for (i = 0; i < cards.length; ++i) {
		if (duiArr.indexOf(cards[i]) === -1) {
			var count = 0;
			for (j = 0; j < cards.length; ++j) {
				if (cards[i] === cards[j]) {
					++count;
				}
			}
			if (count >= 2 - wangpaiCount) {
				duiArr.push(cards[i]);
				if (duiArr.length > 1) {
					return true;
				}
			}
		}
	}
	return false;
};

/* 有三条 */
proto.hasSantiao = function (arr) {
	var cards = this.removeCardColor(arr);
	var wangpaiCount = this.getWangpaiCount(arr);
	for (var i = 0; i < cards.length; ++i) {
		var k = 0;
		for (var j = 0; j < cards.length; ++j) {
			if (cards[i] === cards[j]) {
				++k;
			}
		}
		if (k >= 3 - wangpaiCount) {
			return true;
		}
	}
	return false;
};

/* 有顺子 */
proto.hasShunzi = function (arr) {
	if (arr.length < 5) {
		return false;
	}
	var wangpaiCount = this.getWangpaiCount(arr);
	arr = arr.sort(this.cardSortFunc); /* 大到小 */
	var cards = [];
	for (var i = 0; i < arr.length; ++i) { //复制arr,以免操作影响arr
		cards[i] = arr[i];
	}
	if (cards[0] % 13 === 0) { // A的特殊处理
		cards.push(cards[0]);
	}
	var count = 0;
	for (i = 1; i < cards.length; ++i) {
		if ((cards[i - 1] + 13 - 1) % 13 === cards[i] % 13 || (cards[i - 1] - 1) % 13 === cards[i] % 13) {
			++count;
		} else if (cards[i] % 13 !== cards[i - 1] % 13) {
			count = 0;
		}
		if (count >= 4 - wangpaiCount) {
			return true;
		}
	}

	var resout = this.getShunZiForWangPai(arr);

	return resout.length < 1 ? false : true;
};

/* ok  无王牌 */
proto.isShunZi = function (arr) {
	if (arr.length < 3) return;
	arr = arr.sort(this.cardSortFunc); /* 大到小 */
	var cards = [];
	for (var i = 0; i < arr.length; ++i) { //复制arr,以免操作影响arr
		cards[i] = arr[i];
	}
	if (cards[0] % 13 === 0) { // A的特殊处理
		cards.push(cards[0]);
	}
	var count = 0;
	for (i = 1; i < cards.length; ++i) {
		if ((cards[i - 1] + 13 - 1) % 13 === cards[i] % 13 || (cards[i - 1] - 1) % 13 === cards[i] % 13) {
			++count;
		} else if (cards[i] % 13 !== cards[i - 1] % 13) {
			count = 0;
		}
		if (count === 2) {
			return true;
		}
	}
	return false;
};

/* 有同花 */
proto.hasTonghua = function (arr) {
	if (arr.length < 5) {
		return false;
	}
	var wangpaiCount = this.getWangpaiCount(arr);
	for (var i = 0; i < 4; ++i) {
		var count = 0;
		for (var j = 0; j < arr.length; ++j) {
			if (Math.floor(arr[j] / 13) === i && !this.iswangpai(arr[j])) {
				++count;
			}
		}
		if (count >= 5 - wangpaiCount) {
			return true;
		}
	}
	return false;
};

/* 有葫芦 */
proto.hasHulu = function (arr) {
	if (arr.length < 5) {
		return false;
	}
	var cards = this.removeCardColor(arr);
	var santiaoArr = [],
		duiArr = [];
	for (var i = 0; i < cards.length; ++i) {
		if (duiArr.indexOf(cards[i]) === -1 && santiaoArr.indexOf(cards[i]) === -1) {
			var k = 0;
			for (var j = 0; j < cards.length; ++j) {
				if (cards[j] === cards[i]) {
					++k;
				}
			}
			if (k === 2 && duiArr.indexOf(cards[i]) === -1) {
				duiArr.push(cards[i]);
			}
			if (k >= 3 && santiaoArr.indexOf(cards[i]) === -1) {
				santiaoArr.push(cards[i]);
			}
		}
	}
	if (santiaoArr.length >= 2) {
		return true;
	} else if (santiaoArr.length >= 1 && duiArr.length >= 1) {
		return true;
	} else {
		return false;
	}
	//return (santiaoArr.length >=1 && duiArr.length >= 1);
};

/* 有四条 */
proto.hasSitiao = function (arr) {
	if (arr.length < 5) {
		return false;
	}
	var cards = this.removeCardColor(arr);
	for (var i = 0; i < cards.length; ++i) {
		var count = 0;
		for (var j = 0; j < cards.length; ++j) {
			if (cards[j] === cards[i]) {
				++count;
			}
		}
		if (count === 4) {
			return true;
		}
	}
	return false;
};

/* 有同花顺 */
proto.hasTonghuashun = function (arr) {
	if (arr.length < 5) {
		return false;
	}
	for (var i = 0; i < 4; ++i) {
		var cards = [];
		for (var j = 0; j < arr.length; ++j) {
			if (Math.floor(arr[j] / 13) === i) {
				cards.push(arr[j]);
			}
		}
		if (this.hasShunzi(cards)) {
			return true;
		}
	}
	return false;
};

/* 有五同 */
proto.hasWuTong = function (arr) {
	if (arr.length < 5) {
		return false;
	}
	let result = arr.reduce(function (point, card) {
		if (point % 13 == card % 13) {
			return point;
		}
		return -1;
	}, arr[0]);

	if (result != -1) {
		return true;
	} else {
		var resout = this.findGuiPai(arr, 5);
		return resout.length > 0;
	}

};



/* ----------特殊牌判断--------- */
//青龙
proto.hasQingLong = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}
	var colorS = []; //黑桃
	var colorH = []; //红心
	var colorC = []; //梅花
	var colorD = []; //方块
	for (var i = 0; i < cards.length; i++) {
		if (cards[i].color == 'heitao') {
			colorS.push(cards[i]);
		} else if (cards[i].color == 'hongtao') {
			colorH.push(cards[i]);
		} else if (cards[i].color == 'meihua') {
			colorC.push(cards[i]);
		} else if (cards[i].color == 'fangkuai') {
			colorD.push(cards[i]);
		}
	}
	var ls = colorS.length; //黑桃个数
	var lh = colorH.length; //红桃个数
	var lc = colorC.length; //梅花个数
	var ld = colorD.length; //方块个数
	if (ls == 13 || lh == 13 || lc == 13 || ld == 13) {
		return this.hasYitiaolong(arr);
	}

	return false;

};

/* 三同花 */
proto.hasSanTongHua = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}
	var colorS = []; //黑桃
	var colorH = []; //红心
	var colorC = []; //梅花
	var colorD = []; //方块
	for (var i = 0; i < cards.length; i++) {
		if (cards[i].color == 'heitao') {
			colorS.push(cards[i]);
		} else if (cards[i].color == 'hongtao') {
			colorH.push(cards[i]);
		} else if (cards[i].color == 'meihua') {
			colorC.push(cards[i]);
		} else if (cards[i].color == 'fangkuai') {
			colorD.push(cards[i]);
		}
	}
	var ls = colorS.length; //黑桃个数
	var lh = colorH.length; //红桃个数
	var lc = colorC.length; //梅花个数
	var ld = colorD.length; //方块个数
	var color = [ls, lh, lc, ld];
	var colorSum = []; //总共有几种花色 [5,3,0....]
	for (var i = 0; i < color.length; i++) {
		if (color[i] != 0) {
			colorSum.push(color[i]);
		}
	}
	//如果牌中包含四种花色就不可能是三同花
	if (colorSum.length == 4) {
		return false;
	}

	//三种花色
	if (colorSum.length == 3) {
		for (var i = 0; i < colorSum.length; i++) {
			if (colorSum[i] != 5 && colorSum[i] != 3) {
				return false;
			}
		}
		return true;
	}
	//两种花色
	else if (colorSum.length == 2) {
		for (var i = 0; i < colorSum.length; i++) {
			if ((colorSum[i] != 10 && colorSum[i] != 3) && (colorSum[i] != 8 && colorSum[i] != 5)) {
				return false;
			}
		}

		return true;
	}
	//一种花色
	else if (colorSum.length == 1) {
		if (colorSum[0] == 13) {
			return true;
		}
	}
};

/* 凑一色 */
proto.hasCouYiSe = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}
	var colorS = []; //黑桃
	var colorH = []; //红心
	for (var i = 0; i < cards.length; i++) {
		if (cards[i].color == 'heitao' || cards[i].color == 'meihua') {
			colorS.push(cards[i]); //全黑
		} else if (cards[i].color == 'hongtao' || cards[i].color == 'fangkuai') {
			colorH.push(cards[i]); //全红
		}
	}

	if (colorS.length == 13 || colorH.length == 13) {
		return true;
	}
	return false;

};

/* 五对三条*/
proto.hasWuDuiSanTiao = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}
	let duiZiLength = 2;
	let sanTiaoLength = 3;
	//计算一个牌数组内的相同点数的牌的张数
	let cardNumbers = this.GetCardPointsSameCount(cards);
	let numberOfDuiZi = 0;
	let numberOfSanTiao = 0;
	for (let prop in cardNumbers) {
		let value = cardNumbers[prop];
		if (value == duiZiLength) {
			numberOfDuiZi = numberOfDuiZi + 1;
		} else if (value == sanTiaoLength) {
			numberOfSanTiao = numberOfSanTiao + 1;
		} else if (value >= 4) {
			numberOfDuiZi = numberOfDuiZi + 2;
		}
	}
	return numberOfDuiZi == 5 && numberOfSanTiao == 1;

};

/* 全大 */
proto.hasQuanDa = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}
	var num = 0;
	for (let x = 0; x < cards.length; x++) {
		if (cards[x].point >= 5 && cards[x].point <= 12) {
			num += 1;
		}
	}
	return num == 13;
};

/* 全小 */
proto.hasQuanXiao = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}
	var num = 0;
	for (let x = 0; x < cards.length; x++) {
		if (cards[x].point >= 1 && cards[x].point <= 9) {
			num += 1;
		}
	}
	return num == 13;
};

/* 半大 */
proto.hasBanDa = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}
	var num = 0;
	var num1 = 0;
	for (let x = 0; x < cards.length; x++) {
		if (cards[x].point >= 5) {
			num += 1;
		}
		if (cards[x].point == 0) {
			num1 += 1;
		}
	}

	return num <= 12 && num1 >= 1 && (num + num1 == 13);
};

/*半小 */
proto.hasBanXiao = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}
	var num = 0;
	var num1 = 0;
	for (let x = 0; x < cards.length; x++) {
		if (cards[x].point <= 9 && cards[x].point > 0) {
			num += 1;
		}
		if (cards[x].point == 0) {
			num1 += 1;
		}
	}
	//console.log(num,num1)
	return num <= 12 && num1 >= 1 && (num + num1 == 13);
};

/* 有三花 */
proto.hasSanhua = function (arr) {
	if (arr.length !== 13) {
		return false;
	}
	var i, j, count, sum = 0;
	for (i = 0; i < 4; ++i) {
		count = 0;
		for (j = 0; j < arr.length; ++j) {
			if (Math.floor(arr[j] / 13) === i) {
				++count;
			}
		}
		if (count === 0 || count === 3 || count === 5 || count === 8 || count === 10 || count === 13) {
			sum += count;
		} else {
			return false;
		}
	}
	return (sum === 13);
};

/* 有一条龙 */
proto.hasYitiaolong = function (arr) {
	if (arr.length !== 13) {
		return false;
	}
	var cards = this.removeCardColor(arr);
	cards.sort(function (a, b) {
		return a - b;
	}); /* 小到大 */
	var i;
	for (i = 1; i < cards.length; ++i) {
		if (cards[i] === cards[i - 1]) {
			return false;
		}
	}
	return true;
};

/* 有六对半 */
proto.hasLiuduiban = function (arr) {
	if (arr.length !== 13) {
		return false;
	}
	var cards = this.removeCardColor(arr);
	var i = 0,
		j;
	while (i < cards.length) {
		j = cards.indexOf(cards[i], i + 1);
		if (j !== -1) {
			cards.splice(j, 1);
			cards.splice(i, 1);
		} else {
			++i;
		}
	}
	return (cards.length === 1);
};


/*无用 */
proto.hasGuaipai = function (arr) {
	return this.hasLiuduiban(arr) || this.hasYitiaolong(arr) || this.hasSanhua(arr) || this.hasSanshun(arr);
};

/*
 * 有三顺子
 */
proto.hasSanshun = function (cardArr) {
	var tou, zhong, wei;
	var touArr, zhongArr, zhongweiArr, weiArr, restArr;
	var array = [];
	var i;
	for (i = 0; i < cardArr.length; ++i) {
		array[i] = cardArr[i] % 13;
	}
	for (tou = 1; tou <= 12; ++tou) {
		touArr = [tou - 1, tou, (tou + 1) % 13];
		if (this.isContainArray(array, touArr)) {
			zhongweiArr = this.getNotContainArray(array, touArr);
			for (zhong = 2; zhong <= 11; ++zhong) {
				zhongArr = [zhong - 2, zhong - 1, zhong, zhong + 1, (zhong + 2) % 13];
				if (this.isContainArray(zhongweiArr, zhongArr)) {
					restArr = this.getNotContainArray(zhongweiArr, zhongArr);
					for (wei = 2; wei <= 11; ++wei) {
						weiArr = [wei - 2, wei - 1, wei, wei + 1, (wei + 2) % 13];
						if (this.isContainArray(restArr, weiArr)) {
							return true;
						}
					}
				}

			}
		}
	}
	return false;
};

/* 三同花顺 */
proto.hasSanTongHuaShun = function (arr) {
	let cards = this.getCardColorByArr(arr);
	if (cards.length != 13) {
		return false;
	}
	let colorCardsObject = this._colorClassCards(cards);
	var subCards = [];
	for (let prop in colorCardsObject) {
		let cards = colorCardsObject[prop];
		subCards.push(cards);
	}

	if (subCards.length != 3) {
		return false;
	}

	subCards = subCards.sort(function (s1, s2) {
		return s1.length > s2.length;
	});

	let touCards = subCards[0];
	let zhongCards = subCards[1];
	let weiCards = subCards[2];

	if ((touCards.length != 3) || (zhongCards.length != 5) || (weiCards.length != 5)) {
		return false;
	}
	let tou = touCards.map(function (card) {
		return card.point;
	});
	let zhong = zhongCards.map(function (card) {
		return card.point;
	});
	let wei = weiCards.map(function (card) {
		return card.point;
	});

	return this.isShunZi(tou) && this.hasTonghuashun(zhong) && this.hasTonghuashun(wei);
};


/* 全黑一点红 */
proto.hasQuanHeiYianHong = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}
	var heNum = 0;
	var hongNum = 0
	for (let x = 0; x < cards.length; x++) {
		if (cards[x].color != 'heitao' && cards[x].color != 'meihua') {
			heNum += 1;
		} else {
			hongNum += 1;
		}
	}

	return heNum == 12 && hongNum == 1;
};

/* 全红一点黑 */
proto.hasQuanhongYiDianHei = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}
	var heNum = 0;
	var hongNum = 0
	for (let x = 0; x < cards.length; x++) {
		if (cards[x].color != 'hongtao' && cards[x].color != 'fangkuai') {
			hongNum += 1;
		} else {
			heNum += 1;
		}
	}
	return hongNum == 12 && heNum == 1;
};

/* 四套三条 */
proto.hasSiTaoSanTiao = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}
	let sanTiaoLength = 3;
	//计算一个牌数组内的相同点数的牌的张数
	let cardNumbers = this.GetCardPointsSameCount(cards);
	let numberOfSanTiao = 0;
	for (let prop in cardNumbers) {
		let value = cardNumbers[prop];
		if (value == sanTiaoLength) {
			numberOfSanTiao = numberOfSanTiao + 1;
		}
	}
	return numberOfSanTiao == 4;

};

/* 三分天下 */
proto.hasSanFenTianXia = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}
	let tieZhiLength = 4;
	let cardNumbers = this.GetCardPointsSameCount(cards);
	let numberOfTieZhi = 0;
	for (let prop in cardNumbers) {
		let value = cardNumbers[prop];
		if (value == tieZhiLength) {
			numberOfTieZhi = numberOfTieZhi + 1;
		}
	}
	return numberOfTieZhi === 3;
};

/* 十二皇族 */
proto.hasShiErHuanZu = function (arr) {
	let cards = this.getCardColorAndPoint(arr);
	if (cards.length != 13) {
		return false;
	}

	let count = 0;
	for (let x = 0; x < cards.length; x++) {
		if (cards[x].point >= 10 || cards[x].point == 0) {
			count++;
		}
	}
	return count == 13;

};


/* ---------特殊牌判断完毕--------- */



/* 获取对子 */
proto.getDuizi = function (arr, isFive = true) {
	//console.log('getDuizi start');
	var resout = [];
	arr = this.sortCardByCountThenColor(arr);
	if (arr.length === 3) {
		return [
			[arr[0], arr[1], arr[2]]
		];
	}
	if (arr.length === 5) {
		return [
			[arr[0], arr[1], arr[2], arr[3], arr[4]]
		];
	}
	resout = this.findDuiZi(arr);
	var danArr = this.getDanpaiIndex(arr);
	if (danArr.length < 1) {
		for (let x = 0; x < arr.length; x++) {
			if (!this.iswangpai(arr[x])) {
				danArr.push(x);
			}
		}
	}
	if (!isFive) {
		return resout;
	}
	var result = [];
	for (let j = 0; j < danArr.length; ++j) {
		for (let k = j + 1; k < danArr.length; ++k) {
			for (let m = k + 1; m < danArr.length; ++m) {
				for (let i = 0; i < resout.length; ++i) {
					if (resout[i].indexOf(arr[danArr[j]]) == -1 && resout[i].indexOf(arr[danArr[k]]) == -1 && resout[i].indexOf(arr[danArr[m]]) == -1) {
						let temp = [];
						temp = temp.concat(resout[i]);
						temp.push(arr[danArr[j]]);
						temp.push(arr[danArr[k]]);
						temp.push(arr[danArr[m]]);
						result.push(temp)
					}
				}
			}
		}
	}
	//console.log("resout",resout)
	//console.log('getDuizi end');
	return result;
};


/*返回鬼牌索引 */
proto.findGuiPai = function (arr, numBer = 1) {
	var card20 = [];
	for (let x = 0; x < arr.length; x++) {
		if (arr[x] == 53) {
			card20.push(x);
		}
	}
	var result = [];
	for (var j = 1; j <= card20.length; ++j) {
		var num = numBer - j; //除鬼牌外 我应该找多少张牌匹配
		var indexs = proto._findPointLength(arr, num) || [];
		for (var t = 0; t < indexs.length; t++) {
			if (numBer == 2) { //是对子的时候把鬼牌和单张匹配都循环一遍
				for (var o = 0; o < card20.length; ++o) {
					var s = indexs[t].concat(card20[o]);
					if (s.length == numBer) {
						result.push(s);
					}
				}
			} else {
				var s = indexs[t].concat(card20.slice(0, j)); //依次相加鬼牌第一次加一张 递增
				if (s.length == numBer) {
					result.push(s);
				}
			}
		}
	}
	if (result.length > 10) {
		result = result.slice(0, 10);
	}
	result = proto.repeat(result); //去重
	return result.length > 0 ? result : [];
};

/*返回同点索引 */
proto._findPointLength = function (cardModes, length) {
	if (cardModes.length < length) {
		return [];
	}
	let cards = this.removeCardColor(cardModes);
	let obj = cards.reduce(function (obj, card, index) {
		let pointIndexs = obj[card] || [];
		obj[card] = pointIndexs;
		pointIndexs.push(index);
		return obj;
	}, {});
	//console.log("obj",obj)
	let result = [];
	for (var prop in obj) {
		if (prop == '53') {
			break;
		}
		let pointIndexs = obj[prop];
		if (pointIndexs.length == length) {
			pointIndexs.sort(function (n1, n2) {
				return n1 - n2;
			});
			result.push(pointIndexs);
		}
	}

	result.sort(function (arr1, arr2) {
		let n1 = arr1[0];
		let n2 = arr2[0];
		return n2 - n1;
	});
	return result.length > 0 ? result : [];
};

/*true 返回索引 */
proto.findDuiZi = function (arr, isIndex = false) {
	//let sDuiZiIndexs = proto.findSanTiao(arr) || [];
	let result = proto._findPointLength(arr, 2) || [];

	if (result.length < 2) {
		var tresult = proto.findGuiPai(arr, 2);
		for (var i = 0; i < tresult.length; i++) {
			result.push(tresult[i]);
		}
	}
	result = proto.repeat(result);
	if (isIndex) {
		return result.length > 0 ? result : [];
	}

	let resout = []
	for (let x = 0; x < result.length; x++) {
		let temp = [];
		for (let y = 0; y < result[x].length; y++) {
			temp.push(arr[result[x][y]]);
		}
		resout.push(temp)
	}
	return resout.length > 0 ? resout : [];
};

proto.getDanpaiIndex = function (arr) {
	var cards = this.removeCardColor(arr);
	var danArr = [];
	for (let i = 0; i < cards.length; ++i) {
		if (this.iswangpai(cards[i])) {
			break;
		}
		var count = 0;
		for (let j = 0; j < cards.length; ++j) {
			if (cards[i] === cards[j] && !this.iswangpai(cards[j])) {
				++count;
			}
		}

		if (count === 1) {
			danArr.unshift(i);
		}
	}
	return danArr;
};

/* 获取两对  王牌ok*/
proto.getLiangdui = function (arr, isFive = true) {
	//console.log('getLiangdui start');
	var resout = [];
	let duiZiIndexs = proto.findDuiZi(arr, true) || [];

	if (duiZiIndexs.length < 1) {
		let duiZiIndex = proto.findGuiPai(arr, 2) || [];
		if (duiZiIndex.length > 0) {
			duiZiIndex.forEach(function (indexs) {
				duiZiIndexs.unshift(indexs);
			});
		}

	}
	if (duiZiIndexs.length < 2) {
		return [];
	}

	let result = [];
	for (let i = 0; i < duiZiIndexs.length; ++i) {
		for (let j = i + 1; j < duiZiIndexs.length; ++j) {
			if (result.length < 10) {
				let pre = duiZiIndexs[i];
				let next = duiZiIndexs[j];
				var s = pre.concat(next);
				var newS = [];
				for (var q = 0; q < s.length; q++) {
					if (newS.indexOf(s[q]) == -1) {
						newS.push(s[q]);
					} else {
						break;
					}
				}
				if (newS.length == 4) {
					newS.sort(function (n1, n2) {
						return n1 - n2;
					});
					result.unshift(newS);
				}
			} else {
				break;
			}


		}
	}


	result = proto.repeat(result);
	if (result.length > 6) {
		result = result.slice(0, 6);
	}

	var danArr = this.getDanpaiIndex(arr);
	if (danArr.length < 1 && isFive) {
		for (let h = 0; h < arr.length; h++) {
			if (!this.iswangpai(arr[h])) {
				danArr.push(h);
			}

		}
	}
	for (let x = 0; x < result.length; x++) {
		let temp = [];
		if (isFive) {
			for (let k = 0; k < danArr.length; k++) {
				temp = []
				if (result[x].indexOf(danArr[k]) != -1) {
					break;
				}
				for (let y = 0; y < result[x].length; y++) {
					temp.push(arr[result[x][y]]);
					//console.log("danArr[k]", arr[danArr[k]])
				}

				temp.push(arr[danArr[k]]);
			}
		} else {
			for (let y = 0; y < result[x].length; y++) {
				temp.push(arr[result[x][y]]);
			}
		}
		if (temp.length > 0) resout.push(temp);

	}

	return resout;
};

/* 获取三条 王牌暂时这样*/
proto.getSantiao = function (arr, wang = false) {
	//console.log('getSantiao start');
	var resout = [];
	if (arr.length === 3) {
		return [
			[arr[0], arr[1], arr[2]]
		];
	}
	if (arr.length === 5) {
		return [
			[arr[0], arr[1], arr[2], arr[3], arr[4]]
		];
	}
	if (arr.length < 5) {
		return resout;
	}
	arr = this.sortCardByCountThenColor(arr);
	var cards = this.removeCardColor(arr);
	var i, j, k, count, pos;
	var wangCount = this.getWangpaiCount(arr);
	var santiaoArr = [];
	var danArr = [],
		wangpaiIndex = [];
	var tmpArr;
	for (i = 0; i < cards.length; ++i) {
		if (this.iswangpai(cards[i])) {
			wangpaiIndex.push(i);
			break;
		}
		if (santiaoArr.indexOf(cards[i]) === -1) {
			count = 0;

			for (j = 0; j < cards.length; ++j) {
				if (cards[i] === cards[j] && !this.iswangpai(cards[j])) {
					++count;
				}
			}
			if (count >= 3 || (count >= 3 - wangCount && wang)) {
				santiaoArr.push(cards[i]);
			}
			if (count === 1) {
				danArr.push(arr[i]);
			}
		}
	}
	if (danArr.length < 2) {
		danArr = arr;
	}
	for (i = 0; i < santiaoArr.length; ++i) {
		for (j = danArr.length - 1; j >= 0; --j) {
			if (danArr[j] % 13 !== santiaoArr[i] && !this.iswangpai(danArr[j])) {
				for (k = j - 1; k >= 0; --k) {
					if (danArr[k] % 13 !== santiaoArr[i] && !this.iswangpai(danArr[k])) {
						tmpArr = [];
						let index = 0;
						pos = cards.indexOf(santiaoArr[i]);
						if (!arr[pos] && wang) {
							tmpArr.push(arr[wangpaiIndex[index]]);
							index++;
						} else {
							tmpArr.push(arr[pos]);
						}

						pos = cards.indexOf(santiaoArr[i], pos + 1);
						if (!arr[pos] && wang) {
							tmpArr.push(arr[wangpaiIndex[index]]);
							index++;
						} else {
							tmpArr.push(arr[pos]);
						}
						pos = cards.indexOf(santiaoArr[i], pos + 1);
						if (!arr[pos] && wang) {
							tmpArr.push(arr[wangpaiIndex[index]]);
							index++;
						} else {
							tmpArr.push(arr[pos]);
						}
						tmpArr.push(danArr[j]);
						tmpArr.push(danArr[k]);
						resout.push(tmpArr);
					}
				}
			}
		}
	}
	//console.log('getSantiao end');
	if (resout.length <= 0 && !wang) {
		return this.getSantiao(arr, true);
	} else {
		return resout;
	}

};

/* 获取顺子 ok*/
proto.getShunzi = function (arr) {
	var resout = [];
	if (arr.length < 5) {
		return resout;
	}
	//if (arr.length === 5) { return [[arr[0], arr[1], arr[2], arr[3], arr[4]]]; }
	var cards = this.sortCardByCountThenColor(arr); /* 大到小 余0是A*/
	var i;
	var length = cards.length;
	for (i = 0; i < length && cards[i] % 13 === 0; ++i) {
		cards.push(cards[i]); //先把A放进去
	}
	var j, count;
	var shunziArr = [],
		tmpArr;
	for (i = 1; i < cards.length; ++i) {
		count = 1;
		for (j = i; j < cards.length; ++j) {
			if ((13 + cards[j - 1] - 1) % 13 === cards[j] % 13 || cards[j - 1] % 13 - 1 === cards[j] % 13) {
				//console.log("xxx ", (13 + cards[j - 1] - 1) % 13, cards[j] % 13, "  " + cards[j - 1] % 13 - 1, cards[j] % 13);
				++count;
				if (count == 5) {
					if (shunziArr.indexOf(i - 1) === -1) {
						shunziArr.push(i - 1);
					}
					break;
				}
			} else if (cards[j] % 13 < cards[j - 1] % 13) {
				break;
			}
		}
	}
	//console.log("shunziArr", shunziArr)
	for (i = 0; i < shunziArr.length; ++i) {
		tmpArr = [];
		j = shunziArr[i];
		while (tmpArr.length < 5) {
			if (tmpArr.length === 0) {
				tmpArr.push(cards[j]);
			} else if (tmpArr.length > 0 && cards[j] % 13 !== cards[j - 1] % 13) {
				tmpArr.push(cards[j]);
			}
			++j;
		}
		resout.push(tmpArr);
	}
	return resout.length > 0 ? this.sortResoutArr(resout) : this.getShunZiForWangPai(arr);
};

/*获取带王牌的顺子 已测试 */
proto.getShunZiForWangPai = function (arr, length = 5) {
	var resout = [];

	if (arr.length < length) {
		return resout;
	}
	//if (arr.length === length) { return [[arr[0], arr[1], arr[2], arr[3], arr[4]]]; }

	//删除王牌
	var cards = arr.filter(function (value) {
		return value != 53;
	})
	var card20 = arr.filter(function (value) {
		return value == 53;
	})
	var cardsArr = this.removeCardColor(cards, true);
	let wangpaiIndex = [];
	var result = [];
	let temp = function () {
		var newArr = [];
		for (var i = 0; i < cardsArr.length; i++) {
			if (newArr.indexOf(cardsArr[i]) == -1) {
				newArr.push(cardsArr[i]);
			}
		}

		newArr.sort(function (n1, n2) {
			return n1 - n2;
		});
		for (var j = 1; j <= card20.length; ++j) {
			var num = length - j;
			for (var start = 0;
				(start + num) <= newArr.length; ++start) {
				var subCards = newArr.slice(start, start + num);
				var bool = parseInt(subCards[num - 1]) - parseInt(subCards[0]) < length;
				// console.log(subCards)
				if (bool) {
					let indexs = [];
					var newCard20 = card20.slice(0, j);
					subCards = subCards.concat(newCard20);
					subCards.forEach(function (card) {
						for (var q = 0; q < arr.length; q++) {
							var r = arr[q];
							if ((r % 13 === card || (r % 13 === 0 ? 13 : r % 13) === card) && !proto.iswangpai(r)) {
								indexs.push(q);
								break;
							} else if (proto.iswangpai(r)) {
								wangpaiIndex.push(q);
							}
						}

					});
					indexs.sort(function (n1, n2) {
						return n1 - n2;
					});
					result.unshift(indexs);
				}
			}
		}
	};
	temp();
	for (let x = 0; x < result.length; x++) {
		let temp = [];
		for (let j = 0; j < result[x].length; j++) {
			temp.push(arr[result[x][j]]);
		}
		temp.sort(function (n1, n2) {
			return n2 % 13 - n1 % 13;
		})
		for (let j = 0; j < wangpaiIndex.length && temp.length < 5; j++) {
			temp.unshift(arr[wangpaiIndex[j]])
		}
		resout.push(temp)
	}
	if (resout.length < 1 && card20.length >= 1) {
		cardsArr = [];
		cardsArr = this.removeCardColor(cards, false);
		temp();
	}
	return resout;

}

/* 获取同花 王牌初步测试*/
proto.getTonghua = function (arr) {
	var resout = [];
	if (arr.length < 5) {
		return resout;
	}
	if (arr.length === 5) {
		return [
			[arr[0], arr[1], arr[2], arr[3], arr[4]]
		];
	}
	for (var i = 0; i < 4; ++i) {
		var tonghuaArr = [];
		for (var j = 0; j < arr.length; ++j) {
			if (Math.floor(arr[j] / 13) === i || this.iswangpai(arr[j])) {
				tonghuaArr.push(j);
			}
		}
		if (tonghuaArr.length >= 5) {
			for (var k = 0; k < tonghuaArr.length; ++k) {
				for (var l = k + 1; l < tonghuaArr.length; ++l) {
					for (var m = l + 1; m < tonghuaArr.length; ++m) {
						for (var n = m + 1; n < tonghuaArr.length; ++n) {
							for (var o = n + 1; o < tonghuaArr.length; ++o) {
								resout.push([
									arr[tonghuaArr[k]],
									arr[tonghuaArr[l]],
									arr[tonghuaArr[m]],
									arr[tonghuaArr[n]],
									arr[tonghuaArr[o]]
								]);
							}
						}
					}
				}
			}
		}
	}
	return resout;
};

/* 获取葫芦  王牌初步测试ok 未优化*/
proto.getHulu = function (arr) {
	//console.log('getHulu start');
	var resout = [];

	if (arr.length === 5) {
		return [
			[arr[0], arr[1], arr[2], arr[3], arr[4]]
		];
	}
	if (arr.length < 5) {
		return resout;
	}
	arr = this.sortCardByCountThenColor(arr);
	var cards = this.removeCardColor(arr);
	var i, j, count, duiArr = [],
		santiaoArr = [];
	var wangpaiIndex = [],
		santiaoIndex = {},
		duiIndex = {};
	var wangCount = this.getWangpaiCount(cards);
	for (i = 0; i < cards.length; ++i) {
		count = 0;
		if (this.iswangpai(cards[i])) {
			wangpaiIndex.push(i);
		}
		for (j = 0; j < cards.length; ++j) {
			if (cards[j] === cards[i]) {
				++count;
			}
		}
		if (count >= 3 - wangCount && santiaoArr.indexOf(cards[i]) === -1 && !this.iswangpai(cards[i])) {
			santiaoArr.push(cards[i]);
		}
		if (santiaoArr.indexOf(cards[i]) != -1) {
			if (santiaoIndex[cards[i]]) {
				santiaoIndex[cards[i]].push(i);
			} else {
				santiaoIndex[cards[i]] = [];
				santiaoIndex[cards[i]].push(i);
			}
		}
		if (count >= 2 - wangCount && duiArr.indexOf(cards[i]) === -1 && !this.iswangpai(cards[i])) {
			duiArr.push(cards[i]);
		}
		if (duiArr.indexOf(cards[i]) != -1) {
			if (duiIndex[cards[i]]) {
				duiIndex[cards[i]].push(i);
			} else {
				duiIndex[cards[i]] = [];
				duiIndex[cards[i]].push(i);
			}
		}

	}
	if (duiArr.length === 0) {
		for (i = santiaoArr.length - 1; i >= 0; --i) {
			duiArr.push(santiaoArr[i]);
		}
	}

	// if (santiaoArr.length > 0) {
	// 	console.log("王牌数量", wangCount)
	// 	console.log("王牌索引", wangpaiIndex)
	// 	console.log("可组三条", santiaoArr);
	// 	console.log("三条索引", santiaoIndex);
	// 	console.log("可组对子", duiArr);
	// 	console.log("对子索引", duiIndex);
	// }
	for (i = 0; i < santiaoArr.length; ++i) {
		for (j = duiArr.length - 1; j >= 0; --j) {
			if (santiaoArr[i] !== duiArr[j]) {
				let zuheArr = [];
				let indexarr = santiaoIndex[santiaoArr[i]];
				for (let x = 0; x < indexarr.length; x++) {
					zuheArr.push(arr[indexarr[x]])
				}
				for (let x = 0; x < wangpaiIndex.length; x++) {
					zuheArr.push(arr[wangpaiIndex[x]])
				}
				let indexarr1 = duiIndex[duiArr[j]];
				for (let x = 0; x < indexarr1.length; x++) {
					zuheArr.push(arr[indexarr1[x]])
				}
				let tempArr = this.getAllCombinations(zuheArr, 5);
				//console.log(tempArr)
				for (let x = 0; x < tempArr.length; x++) {
					if (resout.indexOf(tempArr[x]) == -1) {
						resout.push(tempArr[x])
					}
				}

			}
		}
	}
	//console.log('getHulu end');
	//
	return resout;
};

/* 有没有王牌 */
proto.iswangpai = function (card) {
	if (this.wangpai != 0 && (card == 53 || card == 52)) {
		return true;
	}
	return false;
};

/*获取王牌数量 */
proto.getWangpaiCount = function (arr) {
	let wangpaiArr = arr.filter(function (value) {
		return value == 53 || value == 52;
	})
	return wangpaiArr.length;
};

/* 获取四条 王牌初步测试OK 未优化*/
proto.getSitiao = function (arr) {
	//let time = new Date();
	//console.log('getSitiao start');
	var resout = [];
	if (arr.length < 5) {
		return resout;
	} else if (arr.length === 5) {
		return [
			[arr[0], arr[1], arr[2], arr[3], arr[4]]
		];
	}
	var cards = this.removeCardColor(arr);
	var i, j, count, wangCount;
	var sitiaoArr = [];
	var danpaiArr = [];
	wangCount = this.getWangpaiCount(cards);
	var wangpaiIndex = [],
		sitiaoIndex = {};

	for (i = 0; i < cards.length; ++i) {
		count = 0;
		if (this.iswangpai(cards[i])) {
			wangpaiIndex.push(i);
		}
		if (sitiaoArr.indexOf(cards[i]) === -1) {
			for (j = 0; j < cards.length; ++j) {
				if (cards[j] === cards[i]) {
					++count;
				}
			}
			if ((count >= (4 - wangCount)) && !this.iswangpai(arr[i])) {
				sitiaoArr.push(cards[i]);

			}
			if (count === 1 && !this.iswangpai(arr[i])) {
				danpaiArr.push(arr[i]);
			}
		}

		if (sitiaoArr.indexOf(cards[i]) != -1) {
			if (sitiaoIndex[cards[i]]) {
				sitiaoIndex[cards[i]].push(i);
			} else {
				sitiaoIndex[cards[i]] = [];
				sitiaoIndex[cards[i]].push(i);
			}
		}

	}

	if (danpaiArr.length === 0) { //无单牌 随意组
		danpaiArr = arr;
	}

	for (i = 0; i < sitiaoArr.length; ++i) {
		for (j = danpaiArr.length - 1; j >= 0; --j) {
			let tempCard = danpaiArr[j] % 13;
			let zuheArr = [];
			let indexarr = sitiaoIndex[sitiaoArr[i]];
			for (let x = 0; x < indexarr.length; ++x) {
				zuheArr.push(arr[indexarr[x]])
			}
			for (let x = 0; x < wangpaiIndex.length; ++x) {
				zuheArr.push(arr[wangpaiIndex[x]])
			}
			let tempArr = this.getAllCombinations(zuheArr, 4);
			for (let x = 0; x < tempArr.length; x++) {
				if (tempCard !== sitiaoArr[i] && !this.iswangpai(tempCard)) {
					tempArr[x].push(danpaiArr[j]);
					resout.push(tempArr[x]);
				}
			}

		}
	}
	//console.log("运行时间",lasttime-time+"ms");
	return resout;
};

/* 获取五同 王牌*/
proto.getWuTong = function (arr) {
	if (arr.length < 5) return [];
	var result = this._findPointLength(arr, 5) || [];
	if (result.length < 1) {
		result = proto.findGuiPai(arr, 5);
	}
	var resout = [];
	for (let x = 0; x < result.length; x++) {
		let temp = [];
		for (let y = 0; y < result[x].length; y++) {
			temp.push(arr[result[x][y]]);
		}
		resout.push(temp);
	}

	return resout;

};

proto.getSameNum = function (val, xxxx) {
	//console.log("xxxx",xxxx)
	let processArr = xxxx.filter(function (value) {
		return value == val;
	})
	return processArr.length;
}

//获取所有组合
proto.getAllCombinations = function (source, count, isPermutation = false) {
	//如果只取一位，返回数组中的所有项，例如 [ [1], [2], [3] ]
	let currentList = source.map((item) => [item]);
	if (count === 1) {
		return currentList;
	}
	let result = [];
	//取出第一项后，再取出后面count - 1 项的排列组合，并把第一项的所有可能（currentList）和 后面count-1项所有可能交叉组合
	for (let i = 0; i < currentList.length; i++) {
		let current = currentList[i];
		//如果是排列的方式，在取count-1时，源数组中排除当前项
		let children = [];
		if (isPermutation) {
			children = proto.getAllCombinations(source.filter(item => item !== current[0]), count - 1, isPermutation);
		}
		//如果是组合的方法，在取count-1时，源数组只使用当前项之后的
		else {

			children = proto.getAllCombinations(source.slice(i + 1), count - 1, isPermutation);
		}
		for (let child of children) {
			result.push([...current, ...child]);
		}
	}
	const obj = {};
	for (const item of result) {
		obj['' + item] = item
	}
	result = Object.values(obj)
	return result;
}

//数组去重
proto.repeat = function (result) {
	const obj = {};
	for (const item of result) {
		obj['' + item] = item
	}
	result = Object.values(obj)
	return result;
};

/* 获取同花顺  ok*/
proto.getTonghuashun = function (arr) {
	var tonghuaArr = this.getTonghua(arr);
	var resout = [];
	for (var i = 0; i < tonghuaArr.length; ++i) {
		if (this.hasShunzi(tonghuaArr[i])) {
			resout.push(tonghuaArr[i]);
		}
	}
	if (resout.length === 0) {
		//console.log(tonghuaArr, 'tonghuaArr');
	}
	return resout;

};

/* 补全对子 无用*/
proto.fillDuizi = function (arr, num, count) {
	var i, j, k;
	var resout = [];
	var cards = [];
	for (i = 0; i < arr.length; ++i) {
		if (arr[i] % 13 !== num) {
			cards.push(arr[i]);
		}
	}
	cards.sort(function (a, b) {
		return a % 13 - b % 13;
	}); /* 小到大 */
	if (count === 3) {
		for (i = 0; i < cards.length; ++i) {
			resout.push([arr[i]]);
		}
	} else if (count === 5) {
		for (i = 0; i < cards.length; ++i) {
			for (j = i + 1; j < cards.length; ++j) {
				for (k = j + 1; k < cards.length; ++k) {
					resout.push([arr[i], arr[j], arr[k]]);
				}
			}
		}
	}
	return resout;
};

/* 获取点数与颜色 */
proto.getCardColorAndPoint = function (arr) {
	var cardArr = [];
	for (let x = 0; x < arr.length; x++) {
		let cards = {};
		let color = this.getCardColor(arr[x]);
		cards.color = color;
		if (arr[x] < 52) {
			cards.point = arr[x] % 13;
		} else {
			cards.point = 20;
		}

		cardArr.push(cards);
	}
	return cardArr;
};

/* 获取牌组颜色 */
proto.getCardColorByArr = function (arr) {
	var cardArr = [];
	for (let x = 0; x < arr.length; x++) {
		cardArr.push(this.getCardColor(arr[x]));
	}
	return cardArr;
};

proto.removeCardColor = function (arr, ATo13 = false) {
	var i, cards = [];
	for (i = 0; i < arr.length; ++i) {
		if (53 == arr[i]) { //王牌不用删颜色
			cards.push(arr[i]);
		} else if (ATo13 && arr[i] % 13 === 0) {
			cards.push(13);
		} else {
			cards.push(arr[i] % 13);
		}
	}
	return cards;
};

/* 获取牌在数组中的位置 */
proto.getCardInArr = function (arr, num, pos) {
	var i;
	for (i = pos || 0; i < arr.length; ++i) {
		if (arr[i] % 13 === num) {
			return i;
		}
	}
	if (i === arr.length) {
		return -1;
	}
};

/* 选取最大的牌型 */
proto.getMaxCardArr = function (arr) {
	if (arr.length === 5 || arr.length === 3) {
		return arr;
	}
	var resout, i, j, type, cards;
	if (this.hasWuTong(arr)) {
		resout = this.getTonghuashun(arr);
		type = this.cardType.wutong.type;
	} else if (this.hasTonghuashun(arr)) {
		resout = this.getTonghuashun(arr);
		type = this.cardType.tonghuashun.type;
	} else if (this.hasSitiao(arr)) {
		resout = this.getSitiao(arr);
		type = this.cardType.sitiao.type;
	} else if (this.hasHulu(arr)) {
		resout = this.getHulu(arr);
		type = this.cardType.hulu.type;
	} else if (this.hasTonghua(arr)) {
		resout = this.getTonghua(arr);
		type = this.cardType.tonghua.type;
	} else if (this.hasShunzi(arr)) {
		resout = this.getShunzi(arr);
		type = this.cardType.shunzi.type;
	} else if (this.hasSantiao(arr)) {
		resout = this.getSantiao(arr);
		type = this.cardType.santiao.type;
	} else if (this.hasLiangdui(arr)) {
		resout = this.getLiangdui(arr);
		type = this.cardType.liangdui.type;
	} else if (this.hasDuizi(arr)) {
		resout = this.getDuizi(arr);
		type = this.cardType.duizi.type;
	}
	if (resout && resout.length > 0) {
		for (i = 0, j = 0; i < resout.length - 1; ++i) {
			if (!this.compareCards(resout[j], resout[i + 1], type, type)) {
				j = i + 1;
			}
		}
		return resout[j];
	} else {
		cards = this.sortCardByCountThenColor(arr);
		var array = [];
		for (i = 0; i < 5; ++i) {
			array.push(cards[i]);
		}
		return array;
	}
};

proto.getTeSuPaiTypeNmae = function (type) {
	if (this.cardType[type]) {
		return {
			name: this.cardType[type].name,
			rate: this.cardType[type].rate
		}
	} else {
		return {
			name: '',
			rate: 0
		};
	}

};


proto.getTouArr = function (arr) {
	return [arr[0], arr[1], arr[2]];
};

proto.getZhongArr = function (arr) {
	return [arr[3], arr[4], arr[5], arr[6], arr[7]];
};

proto.getWeiArr = function (arr) {
	return [arr[8], arr[9], arr[10], arr[11], arr[12]];
};

/* type1 > type2 时为true*/
proto.compareCardType = function (type1, type2) {
	if (type1 === this.cardType.guaipai.type && type2 === this.cardType.guaipai.type) {
		return -1;
	} else if (type1 === this.cardType.guaipai.type) {
		return 1;
	} else if (type2 === this.cardType.guaipai.type) {
		return -1;
	}
	var i;
	for (i = 512; i > 0; i /= 2) {
		if ((type1 & i) > 0 && (type2 & i) === 0) {
			return 1;
		} else if ((type1 & i) === 0 && (type2 & i) > 0) {
			return -1;
		}
	}
	return 0;
};

proto.getTouZhongWeiCardType = function (arr) {
	var type = 0;
	if (this.hasDuizi(arr)) {
		type |= this.cardType.duizi.type;
	}
	if (this.hasLiangdui(arr)) {
		type |= this.cardType.liangdui.type;
	}
	if (this.hasSantiao(arr)) {
		type |= this.cardType.santiao.type;
	}
	if (this.hasShunzi(arr)) {
		type |= this.cardType.shunzi.type;
	}
	if (this.hasTonghua(arr)) {
		type |= this.cardType.tonghua.type;
	}
	if (this.hasHulu(arr)) {
		type |= this.cardType.hulu.type;
	}
	if (this.hasSitiao(arr)) {
		type |= this.cardType.sitiao.type;
	}
	if (this.hasTonghuashun(arr)) {
		type |= this.cardType.tonghuashun.type;
	}
	return type;
};

proto.sortCardByCountThenColor = function (arr) {
	if (!arr || arr.length <= 0) return [];
	return arr.sort(gameUtil.sortIDByPointAndColor);
};

// 排序获取牌型结果
proto.sortResoutArr = function (resout) {
	if (resout.length <= 1) {
		return resout;
	}
	var type = this.getTouZhongWeiCardType(resout[0]);
	for (var i = 0; i < resout.length; ++i) {
		var max = i;
		for (var j = i + 1; j < resout.length; ++j) {
			if (!this.compareCards(resout[max], resout[j], type, type)) {
				max = j;
			}
		}
		var tmp = resout[i];
		resout[i] = resout[max];
		resout[max] = tmp;
	}
	return resout;
};

proto.kickArrFromArr = function (arr, toKickArr) {
	var i;
	var array = [],
		index;
	for (i = 0; i < arr.length; ++i) {
		array[i] = arr[i];
	}
	for (i = 0; i < toKickArr.length; ++i) {
		index = array.indexOf(toKickArr[i]);
		while (index !== -1) {
			array.splice(index, 1);
			index = array.indexOf(toKickArr[i], index + 1);
		}
	}
	return array;
};

/* 获取最后分数数组 */
proto.getScoreArrByResout = function (resout, playingChairArr, bankerChairID, robBankScales) {
	var i, j, k;
	var memberCount = playingChairArr.length;
	var scoreArr = [];
	for (i = 0; i < memberCount; ++i) {
		scoreArr[playingChairArr[i]] = 0;
	}
	var daqiang, guaiScore, rate;
	if (bankerChairID != null) {
		for (i = 0; i < memberCount; i++) {
			guaiScore = 0;
			let indexJ = playingChairArr[i];
			if (indexJ != bankerChairID) {
				rate = resout.rateArr[bankerChairID] * resout.rateArr[indexJ] * robBankScales;
				// console.log("获取最后分数数组rateArr ", resout.rateArr)
				// console.log("获取最后分数数组robBankScales " + robBankScales)
				// console.log("获取最后分数数组rate ", rate)
				daqiang = Math.abs(resout.daqiangArr[bankerChairID][indexJ]);
				for (k = 0; k < 3; ++k) {
					if (this.gameRule.jifen == 0) {
						scoreArr[bankerChairID] += resout.scoresArr[bankerChairID][indexJ][k] * (daqiang == 0 ? 1 : daqiang) * rate;
						scoreArr[indexJ] += resout.scoresArr[indexJ][bankerChairID][k] * (daqiang == 0 ? 1 : daqiang) * rate;
					} else {
						scoreArr[bankerChairID] += (resout.scoresArr[bankerChairID][indexJ][k] + daqiang) * rate;
						scoreArr[indexJ] += (resout.scoresArr[indexJ][bankerChairID][k] + daqiang) * rate;
					}

				}
				if (resout.guaipaiScoreArr[bankerChairID] !== 0 && resout.guaipaiScoreArr[indexJ] === 0) {
					guaiScore = resout.guaipaiScoreArr[bankerChairID] * rate;
					scoreArr[bankerChairID] += guaiScore;
					scoreArr[indexJ] -= guaiScore;
				} else if (resout.guaipaiScoreArr[bankerChairID] === 0 && resout.guaipaiScoreArr[indexJ] !== 0) {
					guaiScore = resout.guaipaiScoreArr[indexJ] * rate;
					scoreArr[bankerChairID] -= guaiScore;
					scoreArr[indexJ] += guaiScore;
				} else if (resout.guaipaiScoreArr[bankerChairID] !== 0 && resout.guaipaiScoreArr[indexJ] !== 0) {
					if (resout.guaipaiScoreArr[bankerChairID] > resout.guaipaiScoreArr[indexJ]) {
						guaiScore = resout.guaipaiScoreArr[bankerChairID] * rate;
						scoreArr[bankerChairID] += guaiScore;
						scoreArr[indexJ] -= guaiScore;
					} else if (resout.guaipaiScoreArr[bankerChairID] < resout.guaipaiScoreArr[indexJ]) {
						guaiScore = resout.guaipaiScoreArr[indexJ] * rate;
						scoreArr[bankerChairID] -= guaiScore;
						scoreArr[indexJ] += guaiScore;
					}
				}


			}
		}
		return scoreArr;
	}
	for (i = 0; i < memberCount; ++i) {
		let indexI = playingChairArr[i];
		guaiScore = 0;
		for (j = 0; j < memberCount; ++j) {
			let indexJ = playingChairArr[j];
			//if(indexI!=indexJ) {
			rate = resout.rateArr[indexI] * resout.rateArr[indexJ];
			daqiang = Math.abs(resout.daqiangArr[indexI][indexJ]);
			for (k = 0; k < 3; ++k) {
				if (this.gameRule.jifen == 0) {
					scoreArr[indexI] += resout.scoresArr[indexI][indexJ][k] * (daqiang == 0 ? 1 : daqiang) * rate;
				} else {
					scoreArr[indexI] += (resout.scoresArr[indexI][indexJ][k] + daqiang) * rate;
				}

			}
			if (resout.guaipaiScoreArr[indexI] !== 0 && resout.guaipaiScoreArr[indexJ] === 0) {
				guaiScore += resout.guaipaiScoreArr[indexI] * rate;
			} else if (resout.guaipaiScoreArr[indexI] === 0 && resout.guaipaiScoreArr[indexJ] !== 0) {
				guaiScore -= resout.guaipaiScoreArr[indexJ] * rate;
			} else if (resout.guaipaiScoreArr[indexI] !== 0 && resout.guaipaiScoreArr[indexJ] !== 0) {
				if (resout.guaipaiScoreArr[indexI] > resout.guaipaiScoreArr[indexJ]) {
					guaiScore += resout.guaipaiScoreArr[indexI] * rate;
				} else if (resout.guaipaiScoreArr[indexI] < resout.guaipaiScoreArr[indexJ]) {
					guaiScore -= resout.guaipaiScoreArr[indexJ] * rate;
				}
			}
			//}

		}
		scoreArr[indexI] += guaiScore;
	}
	return scoreArr;
};

/* 获取所有玩家的头道分*/
proto.getTouScoreArrByResout = function (resout, playingChairArr) {
	var i, j, daqiang, rate;
	var memberCount = playingChairArr.length;
	var scoreArr = [];
	for (i = 0; i < memberCount; ++i) {
		scoreArr[playingChairArr[i]] = 0;
	}
	for (i = 0; i < memberCount; ++i) {
		let indexI = playingChairArr[i];
		for (j = 0; j < memberCount; ++j) {
			let indexJ = playingChairArr[j];
			daqiang = Math.abs(resout.daqiangArr[indexI][indexJ]);
			rate = resout.rateArr[indexI] * resout.rateArr[indexJ];
			if (this.gameRule.jifen === 0) {
				scoreArr[indexI] += resout.scoresArr[indexI][indexJ][0] * (daqiang == 0 ? 1 : daqiang) * rate;
			} else {
				scoreArr[indexI] += (resout.scoresArr[indexI][indexJ][0] + daqiang) * rate;
			}

		}
	}
	return scoreArr;
};

/* 获取所有玩家的中道分*/
proto.getZhongScoreArrByResout = function (resout, playingChairArr) {
	var i, j, daqiang, rate;
	var memberCount = playingChairArr.length;
	var scoreArr = [];
	for (i = 0; i < memberCount; ++i) {
		scoreArr[playingChairArr[i]] = 0;
	}
	for (i = 0; i < memberCount; ++i) {
		let indexI = playingChairArr[i];
		for (j = 0; j < memberCount; ++j) {
			let indexJ = playingChairArr[j];
			daqiang = Math.abs(resout.daqiangArr[indexI][indexJ]);
			rate = resout.rateArr[indexI] * resout.rateArr[indexJ];
			if (this.gameRule.jifen === 0) {
				scoreArr[indexI] += resout.scoresArr[indexI][indexJ][1] * (daqiang == 0 ? 1 : daqiang) * rate;
			} else {
				scoreArr[indexI] += (resout.scoresArr[indexI][indexJ][1] + daqiang) * rate;
			}

		}
	}
	return scoreArr;
};

/* 获取所有玩家的尾道分*/
proto.getWeiScoreArrByResout = function (resout, playingChairArr) {
	var i, j, daqiang, rate;
	var memberCount = playingChairArr.length;
	var scoreArr = [];
	for (i = 0; i < memberCount; ++i) {
		scoreArr[playingChairArr[i]] = 0;
	}
	for (i = 0; i < memberCount; ++i) {
		let indexI = playingChairArr[i];
		for (j = 0; j < memberCount; ++j) {
			let indexJ = playingChairArr[j];
			daqiang = Math.abs(resout.daqiangArr[indexI][indexJ]);
			rate = resout.rateArr[indexI] * resout.rateArr[indexJ];
			if (this.gameRule.jifen === 0) {
				scoreArr[indexI] += resout.scoresArr[indexI][indexJ][2] * (daqiang == 0 ? 1 : daqiang) * rate;
			} else {
				scoreArr[indexI] += (resout.scoresArr[indexI][indexJ][2] + daqiang) * rate;
			}

		}
	}
	return scoreArr;
};

/* 转化为存储数据 */
proto.changeToMongoData = function (record) {
	var i, j, k;
	var cardsArr = [];
	for (i = 0; i < record.cardsArr.length; ++i) {
		for (j = 0; j < record.cardsArr[i].length; ++j) {
			for (k = 0; k < record.cardsArr[i][j].length; ++k) {
				cardsArr.push(record.cardsArr[i][j][k]);
			}
		}
	}
	record.cardsArr = cardsArr;

	var guaiArr = [];
	for (i = 0; i < record.guaiArr.length; ++i) {
		for (j = 0; j < record.guaiArr[i].length; ++j) {
			guaiArr.push(record.guaiArr[i][j]);
		}
	}
	record.guaiArr = guaiArr;

	var scoresArr = [];
	for (i = 0; i < record.scoresArr.length; ++i) {
		for (j = 0; j < record.scoresArr[i].length; ++j) {
			scoresArr.push(record.scoresArr[i][j]);
		}
	}
	record.scoresArr = scoresArr;
	record.gameRule = JSON.stringify(record.gameRule);
	return record;
};

/* 转化为服务器数据 */
proto.changeToServerData = function (mongoData) {
	mongoData.gameRule = JSON.parse(mongoData.gameRule);
	var memberCount = mongoData.gameRule.maxPlayerCount;
	var i, j, k;

	var tmp;
	var cardsArr = [];
	for (i = 0; i < mongoData.cardsArr.length; i += memberCount * 13) {
		tmp = [];
		for (j = 0; j < memberCount; ++j) {
			tmp[j] = [];
			for (k = 0; k < 13; ++k) {
				tmp[j][k] = mongoData.cardsArr[i + j * 13 + k];
			}
		}
		cardsArr.push(tmp);
	}
	mongoData.cardsArr = cardsArr;

	var guaiArr = [];
	for (i = 0; i < mongoData.guaiArr.length; i += memberCount) {
		tmp = [];
		for (j = 0; j < memberCount; ++j) {
			tmp[j] = mongoData.guaiArr[i + j];
		}
		guaiArr.push(tmp);
	}
	mongoData.guaiArr = guaiArr;

	var scoresArr = [];
	for (i = 0; i < mongoData.scoresArr.length; i += memberCount) {
		tmp = [];
		for (j = 0; j < memberCount; ++j) {
			tmp[j] = mongoData.scoresArr[i + j];
		}
		scoresArr.push(tmp);
	}
	mongoData.scoresArr = scoresArr;
	return mongoData;
};


/* 牌从大到小排序 */
proto.cardSortFunc = function (a, b) {
	if (a >= 13 && !proto.iswangpai(a)) a %= 13;
	if (b >= 13 && !proto.iswangpai(b)) b %= 13;

	var countArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0];
	return countArr.indexOf(b) - countArr.indexOf(a);
};

// 怪牌排序
proto.sortSpecialCard = function (arr) {
	let type = this.getTeShuPaiCardType(arr).name;
	var cardArr = gameUtil.dealSpecialCard(arr, type);
	var resout = [];
	resout = cardArr[2].ids.concat(cardArr[1].ids, cardArr[0].ids)
	return resout;
};

proto.sortLiuduibanCard = function (arr) {
	var sortArr = [];
	for (var j = 0; j < arr.length; ++j) {
		if (sortArr.indexOf(arr[j]) === -1) {
			for (var k = j + 1; k < arr.length; ++k) {
				if (arr[j] % 13 === arr[k] % 13) {
					sortArr.push(arr[j]);
					sortArr.push(arr[k]);
					break;
				}
			}
			if (k === arr.length) {
				var danpai = arr[j];
			}
		}
	}
	sortArr.push(danpai);
	return sortArr;
};

proto.sortSanhuaCard = function (arr) {
	var array = [];
	for (var i = 0; i < arr.length; ++i) {
		array[i] = arr[i];
	}
	array = this.sortCardByCountThenColor(array);
	var array1 = this.getTonghua(array)[0];
	for (i = 0; i < array1.length; ++i) {
		array.splice(array.indexOf(array1[i]), 1);
	}
	var array2 = this.getTonghua(array)[0];
	for (i = 0; i < array2.length; ++i) {
		array.splice(array.indexOf(array2[i]), 1);
	}
	var sortArr = [];
	for (i = 0; i < array.length; ++i) {
		sortArr.push(array[i]);
	}
	for (i = 0; i < array2.length; ++i) {
		sortArr.push(array2[i]);
	}
	for (i = 0; i < array1.length; ++i) {
		sortArr.push(array1[i]);
	}
	return sortArr;
};



/*
 * 自动排序三顺牌型
 */
proto.sortSanshunCard = function (cardArr) {
	var tou, zhong, wei;
	var touArr, zhongArr, zhongweiArr, restArr, weiArr;
	var array = [];
	var i, j;
	var canStop = false;
	for (i = 0; i < cardArr.length; ++i) {
		array[i] = cardArr[i] % 13;
	}
	for (tou = 1;
		(tou <= 12) && (!canStop); ++tou) {
		touArr = [tou - 1, tou, (tou + 1) % 13];
		if (this.isContainArray(array, touArr)) {
			zhongweiArr = this.getNotContainArray(array, touArr);
			for (zhong = 2;
				(zhong <= 11) && (!canStop); ++zhong) {
				zhongArr = [zhong - 2, zhong - 1, zhong, zhong + 1, (zhong + 2) % 13];
				if (this.isContainArray(zhongweiArr, zhongArr)) {
					restArr = this.getNotContainArray(zhongweiArr, zhongArr);
					for (wei = 2;
						(wei <= 11) && (!canStop); ++wei) {
						weiArr = [wei - 2, wei - 1, wei, wei + 1, (wei + 2) % 13];
						if (this.isContainArray(restArr, weiArr)) {
							canStop = true;
							break;
						}
					}
				}

			}
		}
	}
	for (i = 0; i < cardArr.length; ++i) {
		array[i] = cardArr[i];
	}
	var sortArray = [];
	touArr = this.sortCardByCountThenColor(touArr);
	zhongArr = this.sortCardByCountThenColor(zhongArr);
	weiArr = this.sortCardByCountThenColor(weiArr);
	for (i = 0; i < touArr.length; ++i) {
		for (j = 0; j < array.length; ++j) {
			if (array[j] % 13 === touArr[i]) {
				sortArray.push(array[j]);
				array.splice(j, 1);
				break;
			}
		}
	}
	for (i = 0; i < zhongArr.length; ++i) {
		for (j = 0; j < array.length; ++j) {
			if (array[j] % 13 === zhongArr[i]) {
				sortArray.push(array[j]);
				array.splice(j, 1);
				break;
			}
		}
	}
	for (i = 0; i < weiArr.length; ++i) {
		for (j = 0; j < array.length; ++j) {
			if (array[j] % 13 === weiArr[i]) {
				sortArray.push(array[j]);
				array.splice(j, 1);
				break;
			}
		}
	}
	return sortArray;
};

/*
 * array1是否包含array2
 */

proto.isContainArray = function (array1, array2) {
	var i;
	for (i = 0; i < array2.length; ++i) {
		if (array1.indexOf(array2[i]) < 0) {
			break;
		}
	}
	return (i === array2.length);
};

/*
 * 获取不包含的元素数组
 */
proto.getNotContainArray = function (array1, array2) {
	var notContainArray = [];
	var i;
	for (i = 0; i < array1.length; ++i) {
		notContainArray.push(array1[i]);
	}
	for (i = 0; i < array2.length; ++i) {
		notContainArray.splice(notContainArray.indexOf(array2[i]), 1);
	}
	return notContainArray;
};

proto.GetCardPointsSameCount = function (cards) {
	var cardNumbers = {};
	for (var i in cards) {
		var s = cards[i].point
		if (cardNumbers[s]) {
			cardNumbers[s]++;
		} else {
			cardNumbers[s] = 1;
		}
	}
	return cardNumbers;
};

// 将牌根据 color 进行分类
proto._colorClassCards = function (cards) {
	let colorCardsObject = {};
	cards.forEach(function (card) {
		let color = card.color;
		var subCards = colorCardsObject[color];
		if (!subCards) {
			subCards = [];
			colorCardsObject[color] = subCards;
		}
		subCards.push(card);
	});

	return colorCardsObject;
};