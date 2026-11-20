const gameProto = require('./ApiBj');

const BIGJOKER = 79; //大王
const SMALLJOKER = 78; //小王

class GameLogic {

	init(gameRule) {
		this.gameRule = gameRule;
		this.cards = null;
	}

	//获取方块
	getFangKuai() {
		return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
	};

	//获取梅花
	getMeiHua() {
		return [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
	};

	//获取红桃
	getHongTao() {
		return [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
	};

	//获取黑桃
	getHeiTao() {
		return [49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61];
	};

	//初始化卡牌
	initAllCards(testCards = []) {

		let allCards = this.getAllCards(testCards);
		allCards = this.washCards(allCards);
		this.cards = allCards.slice();
	};


	//获取所有卡牌
	getAllCards(testCards) {

		let fangkuai = this.getFangKuai();
		let meihua = this.getMeiHua();
		let hongtao = this.getHongTao();
		let heitao = this.getHeiTao();

		//标准
		let cards = fangkuai.concat(meihua).concat(hongtao).concat(heitao);
		//判断是否加王牌 
		if (this.gameRule.jokerType) {
			let bigJoker = this.getBigJoker();
			let smallJoker = this.getSmallJoker();
			cards.push(bigJoker, smallJoker);
		}
		let allCards = this.getExceptCards(cards, testCards);
		return allCards.slice();
	}

	//获取指定数量卡牌
	getCards(count) {

		let cards = this.cards.splice(0, count);
		return cards;
	}

	//获取卡牌类型和牌型值
	getCardType(cards) {


		if (cards.length != 3) return;

		let curCards = this.getCardsWithoutJoker(cards);
		let jokerList = this.getCardsJoker(cards);
		let pointMap = this.getPointCountMap(curCards);
		let colorMap = this.getColorCountMap(curCards);

		//是否三条
		let curSanTiao = this.isSanTiao(pointMap, jokerList);
		if (curSanTiao) {
			let result = {
				type: gameProto.cardType.SANTIAO,
				point: curSanTiao
			};
			return result;
		}

		//是否顺清
		let curShunQing = this.isShunQing(curCards, colorMap, pointMap, jokerList);
		if (curShunQing) {
			let result = {
				type: gameProto.cardType.SHUNQING,
				point: curShunQing
			};
			return result;
		}

		//是否清一色
		let cursQingYiSe = this.isQingYiSe(colorMap, pointMap, jokerList);
		if (cursQingYiSe) {
			let result = {
				type: gameProto.cardType.QINGYISE,
				point: cursQingYiSe
			};
			return result;
		}

		//是否顺子
		let curShunZi = this.isShunZi(curCards, jokerList);
		if (curShunZi) {
			let result = {
				type: gameProto.cardType.SHUNZI,
				point: curShunZi
			};
			return result;
		}

		//是否对子
		let curDuiZi = this.isDuiZi(pointMap, curCards, jokerList);
		if (curDuiZi) {
			let result = {
				type: gameProto.cardType.DUI,
				point: curDuiZi
			};
			return result;
		}

		let curPoint = this.getSortCardsPoint(curCards);
		let result = {
			type: gameProto.cardType.WULONG,
			point: curPoint
		};
		return result;

	}

	//比较牌大小
	compareCards(cards1, cards2) {

		let getCardType1 = this.getCardType(cards1);
		let getCardType2 = this.getCardType(cards2);
		if (getCardType1.type > getCardType2.type) {
			//赢
			return 1;
		} else if (getCardType1.type < getCardType2.type) {
			//输
			return -1;
		} else {
			//牌型一样 比较大小
			if (getCardType1.point > getCardType2.point) {
				return 1;
			} else if (getCardType1.point < getCardType2.point) {
				return -1;
			} else {
				return 0;
			}
		}
	}

	//是否全黑
	isQuanHei(cards) {

		//全黑包含小王
		let isHaveOther = cards.some(item => item == BIGJOKER || this.getCardColor(item) == 0 || this.getCardColor(item) == 2);
		return !isHaveOther;
	}

	//是否全红
	isQuanHong(cards) {

		//全红包含大王
		let isHaveOther = cards.some(item => item == SMALLJOKER || this.getCardColor(item) == 1 || this.getCardColor(item) == 3);
		return !isHaveOther;
	}

	//是否有4张
	isSiZhang(cards) {

		let pointMap = this.getPointCountMap(cards);
		let fourList = [];
		for (var key in pointMap) {
			if (pointMap[key] == 4) {
				fourList.push(key);
			}
		}
		return fourList;
	}

	//是否连顺
	isLianShun(cards) {

		let curCards = this.getCardsWithoutJoker(cards);
		let jokerList = this.getCardsJoker(cards);
		return this.isShunZi(curCards, jokerList);
	}

	//是否连顺
	isQingLong(cards) {

		let curCards = this.getCardsWithoutJoker(cards);
		let colorMap = this.getColorCountMap(curCards);
		let colorCount = 0;
		for (let key in colorMap) {
			colorCount += 1;
		}
		return this.isLianShun(cards) && colorCount == 1;
	}



	//三条
	isSanTiao(pointMap, jokerList = []) {
		for (var key in pointMap) {
			let curCount = pointMap[key];
			if (curCount >= 3 - jokerList.length) {
				let point = '';
				for (let i = 0; i < curCount; i++) {
					point += parseInt(key) >= 10 ? key.toString() : '0' + key;
				}
				if (jokerList.includes(BIGJOKER)) {
					point += '01';
				}
				if (jokerList.includes(SMALLJOKER)) {
					point += '00';
				}
				return parseInt(point);
			}
		}
		return 0;
	}

	//是否清一色
	isQingYiSe(colorMap, pointMap, jokerList = []) {
		for (var key in colorMap) {
			if (colorMap[key] >= 3 - jokerList.length) {
				let pointList = [];
				for (let card in pointMap) {
					let curCard = parseInt(card) < 10 ? '0' + card : card.toString();
					pointList.push(curCard);
				}
				if (jokerList.length >= 1) {
					//判断是否已经有A
					if (pointMap[14]) {
						//有A就当做K
						pointList.push('13');
					} else {
						//没有A就当做A
						pointList.push('14');
					}
				}
				pointList.sort((a, b) => parseInt(b) - parseInt(a));
				let curPoint = '';
				for (let i = 0; i < pointList.length; i++) {
					curPoint += pointList[i] + '';
				}
				curPoint += key + '';
				return parseInt(curPoint);
			}
		}
		return 0;
	}

	//是否顺子
	isShunZi(cards, jokerList = []) {

		let curCards = cards.map(item => {
			return this.getCardPoint(item)
		});
		//如果里面有2或3 14自动换成1匹配
		if ((curCards.includes(2) || curCards.includes(3)) && curCards.includes(14)) {
			let aindex = curCards.findIndex(item => item == 14);
			curCards[aindex] = 1;
		}


		let curSet = new Set(curCards);
		let curList = Array.from(curSet);
		let maxCard = Math.max(...curCards);
		let minCard = Math.min(...curCards);
		if (curList.length == curCards.length && maxCard - minCard <= curCards.length - 1 + jokerList.length) {

			//查找最大牌的花色
			let maxHuaCard = cards.find(item => this.getCardPoint(item) == maxCard);
			//maxHuaCard = parseInt(maxHuaCard) >= 10 ? maxHuaCard.toString() : '0' + maxHuaCard;
			maxHuaCard = (this.getCardColor(maxHuaCard) + 1) + '';
			//带鬼的顺子
			if (jokerList.length > 0) {
				if (maxCard - minCard == 1 && maxCard <= 13) {
					maxCard = maxCard + 1;
					if (jokerList.includes(BIGJOKER)) {
						maxHuaCard = '1';
					}
					if (jokerList.includes(SMALLJOKER)) {
						maxHuaCard = '0';
					}
				}
			}
			let pointList = [];
			for (let i = maxCard; i >= minCard; i--) {
				let curPoint = i >= 10 ? i.toString() : '0' + i;
				pointList.push(curPoint);
			}
			let curPoint = '';
			for (let i = 0; i < pointList.length; i++) {
				curPoint += pointList[i] + '';
			}
			curPoint += maxHuaCard + '';
			return parseInt(curPoint);
		} else {
			return 0;
		}
	}

	//是否顺清
	isShunQing(cards, colorMap, pointMap, jokerList = []) {

		let isQingYiSe = this.isQingYiSe(colorMap, pointMap, jokerList);
		let isShunZi = this.isShunZi(cards, jokerList);
		if (isQingYiSe && isShunZi) {
			return isShunZi;
		} else {
			return 0;
		}
	}

	//是否对子
	isDuiZi(pointMap, cards, jokerList = []) {

		//有鬼必有对
		let duiCard = null;
		let danCard = null;
		if (jokerList.length >= 1) {
			let pointList = [];
			for (var key in pointMap) {
				pointList.push(key);
			}
			pointList.sort((a, b) => parseInt(b) - parseInt(a));
			duiCard = pointList[0];
			danCard = pointList[1];
		} else {
			for (var key in pointMap) {
				if (pointMap[key] >= 2) {
					//包含了鬼牌的对子
					duiCard = key;
				} else if (pointMap[key] == 1) {
					danCard = key;
				}
			}
		}
		if (duiCard && danCard) {
			let curPoint = '';
			duiCard = parseInt(duiCard) < 10 ? '0' + duiCard : duiCard.toString();
			danCard = parseInt(danCard) < 10 ? '0' + danCard : danCard.toString();
			//对子大小和单牌大小
			curPoint += duiCard + '' + duiCard + '' + danCard;
			//如果都一样大 比较对子中花色大小
			let duiList = cards.filter(item => this.getCardPoint(item) == duiCard);
			if (duiList.length == 1) {
				duiList.push(0);
			}
			duiList.sort((a, b) => parseInt(b) - parseInt(a));
			let colorCard1 = parseInt(duiList[0]) < 10 ? '0' + duiList[0] : duiList[0].toString();
			let colorCard2 = parseInt(duiList[1]) < 10 ? '0' + duiList[1] : duiList[1].toString();
			curPoint += colorCard1 + '' + colorCard2;
			return parseInt(curPoint);
		} else {
			return 0;
		}
	}

	//获取卡牌组合点数
	getSortCardsPoint(cards) {

		cards.sort((a, b) => this.getCardPoint(b) - this.getCardPoint(a));
		let curPoint = '';
		let colorPoint = '';
		//基础牌型大小
		for (let i = 0; i < cards.length; i++) {
			let point = this.getCardPoint(cards[i]);
			point = parseInt(point) < 10 ? '0' + point : point.toString();
			let curCard = this.getCardColor(cards[i]);
			curPoint += point + '';
			colorPoint += curCard + '';
		}
		//花色大小排序
		curPoint += colorPoint;
		return parseInt(curPoint);
	}


	//获取自动出牌
	getAutoCards(cards) {

		let curCards = cards.slice();
		let autoCardsList = [];
		let curList = [];
		while (cards.length == 9 && curList.length < 3) {
			let cardsList = this.getSuggestCards(curCards);
			let cardType = this.getCardType(cardsList);
			cardType.card = cardsList;
			curList.push(cardType);
			//autoCardsList.unshift(cardsList);
			curCards = this.exceptCards(curCards, cardsList);
		}
		curList.sort((a, b) => {
			return a.point - b.point
		});
		curList.sort((a, b) => {
			return a.type - b.type
		});
		for (let i = 0; i < curList.length; i++) {
			autoCardsList[i] = curList[i].card.slice();
		}
		return autoCardsList;
	}


	//获取推荐配牌
	getSuggestCards(cards) {


		let curCards = cards.slice();
		if (curCards.length == 3) {
			return curCards;
		}
		let cardTyList = this.getCardTypeList(curCards);
		let sanList = cardTyList[gameProto.cardType.SANTIAO];
		//如果有三条
		if (sanList) {
			let curList = [];
			for (let i = 0; i < sanList.length; i++) {
				let cardType = this.getCardType(sanList[i]);
				if (!cardType) {
					let a = 0;
				}
				cardType.card = sanList[i];
				curList.push(cardType);
			}
			curList.sort((a, b) => {
				return b.point - a.point
			});
			return curList[0].card;
		}
		let shunJinList = cardTyList[gameProto.cardType.SHUNQING];
		//如果有顺金
		if (shunJinList) {
			let curList = [];
			for (let i = 0; i < shunJinList.length; i++) {
				let cardType = this.getCardType(shunJinList[i]);
				cardType.card = shunJinList[i];
				curList.push(cardType);
			}
			curList.sort((a, b) => {
				return b.point - a.point
			});
			return curList[0].card;
		}
		let jinHuaList = cardTyList[gameProto.cardType.QINGYISE];
		//如果有金花
		if (jinHuaList) {
			let curList = [];
			for (let i = 0; i < jinHuaList.length; i++) {
				let cardType = this.getCardType(jinHuaList[i]);
				cardType.card = jinHuaList[i];
				curList.push(cardType);
			}
			curList.sort((a, b) => {
				return b.point - a.point
			});
			return curList[0].card;
		}
		let shunList = cardTyList[gameProto.cardType.SHUNZI];
		//如果有顺子
		if (shunList) {
			let curList = [];
			for (let i = 0; i < shunList.length; i++) {
				let cardType = this.getCardType(shunList[i]);
				cardType.card = shunList[i];
				curList.push(cardType);
			}
			curList.sort((a, b) => {
				return b.point - a.point
			});
			return curList[0].card;
		}

		let duiList = cardTyList[gameProto.cardType.DUI];
		//如果有对子
		if (duiList) {
			let curList = [];
			for (let i = 0; i < duiList.length; i++) {
				let duiCards = duiList[i];
				let myOthCards = curCards.filter(item => !duiCards.includes(item));
				duiCards.push(myOthCards[0]);
				let cardType = this.getCardType(duiCards);
				cardType.card = duiList[i];
				curList.push(cardType);
			}
			curList.sort((a, b) => {
				return b.point - a.point
			});
			return curList[0].card;
		}

		//如果都没有 
		curCards.sort((a, b) => {
			return this.getCardPoint(b.point) - this.getCardPoint(a.point)
		});
		return curCards.splice(0, 3);
	}


	//获取推荐配牌
	getCardTypeList(cards) {

		//当前卡牌
		let curCards = this.getCardsWithoutJoker(cards);
		//手中的鬼牌
		let jokerList = this.getCardsJoker(cards);
		//判断是否有三条
		let pointMap = this.getPointCountMap(curCards);
		let result = {};
		//查找三条
		let sanList = [];
		for (var key in pointMap) {
			let curCount = pointMap[key];
			if (curCount == 4) {
				let myCards = curCards.filter(item => this.getCardPoint(item) == parseInt(key));
				myCards.sort((a, b) => b - a);
				let sanCards = myCards.slice(0, 3);
				sanList.push(sanCards);
			} else if (pointMap[key] >= 3 - jokerList.length) {
				let jokerCount = 3 - curCount;
				let myCards = curCards.filter(item => this.getCardPoint(item) == parseInt(key));
				if (jokerCount > 0) {
					let curJoker = jokerList.slice(0, jokerCount);
					myCards = myCards.concat(curJoker);
				}
				sanList.push(myCards);
			}
		}
		if (sanList.length > 0) {
			result[gameProto.cardType.SANTIAO] = sanList;
		}

		//查找顺金
		let shunCards = curCards.slice().sort((a, b) => b - a);
		let shunQingCardList = [];
		for (let i = 0; i < shunCards.length; i++) {

			let curCard = shunCards[i];
			let curshunList = [curCard];
			let nextCard = curCard - 1;
			let findNextCard = shunCards.find(item => item == nextCard);
			let nextNextCard = curCard - 2;
			let findNextNextCard = shunCards.find(item => item == nextNextCard);
			if (findNextCard) {
				curshunList.push(nextCard);
			}

			if (!findNextCard && findNextNextCard && jokerList.length > 0) {
				curshunList.push(jokerList[0]);
				curshunList.push(nextNextCard);
			}

			if (findNextCard && findNextNextCard) {
				curshunList.push(nextNextCard);
			}

			if (curshunList.length >= 2 && curshunList.length + jokerList.length >= 3) {
				let jokerCount = 3 - curshunList.length;
				if (jokerCount == 1) {
					curshunList.push(jokerList[0]);
				} else if (jokerCount == 2) {
					curshunList.push(jokerList[0]);
					curshunList.push(jokerList[1]);
				}
				shunQingCardList.push(curshunList);
			}
		}
		if (shunQingCardList.length > 0) {
			result[gameProto.cardType.SHUNQING] = shunQingCardList;
		}

		//查找同花
		let tongCards = curCards.slice().sort((a, b) => b - a);
		let tongCardList = [];
		for (let i = 0; i < tongCards.length; i++) {

			let curCard = tongCards[i];
			let baseColor = this.getCardColor(curCard);
			let curTongList = [curCard];
			if (i + 1 < tongCards.length) {
				let nextCard = tongCards[i + 1];
				let findNextCard = this.getCardColor(nextCard);
				if (findNextCard == baseColor) {
					curTongList.push(nextCard);
				}
			}
			if (i + 2 < tongCards.length) {
				let nextNextCard = tongCards[i + 2];
				let findNextNextCard = this.getCardColor(nextNextCard)

				if (findNextNextCard == baseColor) {
					curTongList.push(nextNextCard);
				}
			}
			if (curTongList.length >= 2 && curTongList.length + jokerList.length >= 3) {
				let jokerCount = 3 - curTongList.length;
				if (jokerCount == 1) {
					curTongList.push(jokerList[0]);
				} else if (jokerCount == 2) {
					curTongList.push(jokerList[0]);
					curTongList.push(jokerList[1]);
				}
				tongCardList.push(curTongList);
			}
		}
		if (tongCardList.length > 0) {
			result[gameProto.cardType.QINGYISE] = tongCardList;
		}

		//查找顺子
		shunCards = curCards.slice().sort((a, b) => this.getCardPoint(b) - this.getCardPoint(a));
		let shunCardList = [];
		for (let i = 0; i < shunCards.length; i++) {

			let curCard = shunCards[i];
			let curshunList = [curCard];
			let curPoint = this.getCardPoint(curCard)
			let nextCard = curPoint - 1;
			let findNextCard = shunCards.find(item => this.getCardPoint(item) == nextCard);
			let nextNextCard = curPoint - 2;
			let findNextNextCard = shunCards.find(item => this.getCardPoint(item) == nextNextCard);
			if (findNextCard) {
				curshunList.push(findNextCard);
			}

			if (!findNextCard && findNextNextCard && jokerList.length > 0) {
				curshunList.push(jokerList[0]);
				curshunList.push(findNextNextCard);
			}

			if (findNextCard && findNextNextCard) {
				curshunList.push(findNextNextCard);
			}

			if (curshunList.length >= 2 && curshunList.length + jokerList.length >= 3) {
				let jokerCount = 3 - curshunList.length;
				if (jokerCount == 1) {
					curshunList.push(jokerList[0]);
				} else if (jokerCount == 2) {
					curshunList.push(jokerList[0]);
					curshunList.push(jokerList[1]);
				}
				shunCardList.push(curshunList);
			}

		}
		if (shunCardList.length > 0) {
			result[gameProto.cardType.SHUNZI] = shunCardList;
		}

		//查找对子
		let duiList = [];
		for (var key in pointMap) {
			if (pointMap[key] >= 2 - jokerList.length) {
				let curDuiList = cards.filter(item => this.getCardPoint(item) == key);
				curDuiList.sort((a, b) => b - a);
				if (curDuiList.length > 2) {
					curDuiList = curDuiList.slice(0, 2);
				}
				if (curDuiList.length == 1) {
					curDuiList.push(jokerList[0]);
				}
				duiList.push(curDuiList);
			}
		}
		if (duiList.length > 0) {
			result[gameProto.cardType.DUI] = duiList;
		}

		return result;
	}


	/*--------------------------工具-----------------------------------------*/
	//获取bigJoker 
	getBigJoker() {
		return BIGJOKER;
	};

	//获取smallJoker 
	getSmallJoker() {
		return SMALLJOKER;
	};

	//获取卡牌点数
	getCardPoint(card) {
		let cardPoint = card % 16;
		if (cardPoint == 1) {
			cardPoint = 14;
		}
		return cardPoint;
	}

	//获取卡牌花色
	getCardColor(card) {
		return parseInt(card / 16);
	}

	//洗牌功能
	washCards(cards, count = 100) {

		let myCards = cards.slice();
		let i, ran1, ran2, tmp;
		for (i = 0; i < count; ++i) {
			ran1 = Math.floor(Math.random() * myCards.length);
			ran2 = Math.floor(Math.random() * myCards.length);
			tmp = myCards[ran1];
			myCards[ran1] = myCards[ran2];
			myCards[ran2] = tmp;
		}
		return myCards;
	}

	//从牌列表中移除指定牌
	getExceptCards(allCards, exceptCards) {

		let curCards = allCards.slice();
		let testCards = [];
		for (let key in exceptCards) {
			testCards = testCards.concat(exceptCards[key]);
		}
		for (let i = 0; i < testCards.length; i++) {
			let cards = testCards[i];
			let cardIndex = curCards.findIndex(item => item == cards);
			curCards.splice(cardIndex, 1);
		}
		return curCards.slice();
	}

	//获取不带王的卡牌数组
	getCardsWithoutJoker(cards) {

		let curCards = cards.filter(item => item != SMALLJOKER && item != BIGJOKER);
		return curCards;
	}

	//获取牌型中的王
	getCardsJoker(cards) {

		let curCards = cards.filter(item => item == SMALLJOKER || item == BIGJOKER);
		return curCards;
	}

	//获取卡牌的鬼牌数量
	getJokerCount(cards) {

		let jokerList = cards.filter(item => item == SMALLJOKER || item == BIGJOKER);
		return jokerList.length;
	}

	//获取牌值及数量
	getPointCountMap(cards) {

		let map = {};
		cards.forEach((id) => {
			let point = this.getCardPoint(id);
			let count = map[point];
			count = count ? count + 1 : 1;
			map[point] = count;
		});
		return map;
	}

	//获取花色及数量
	getColorCountMap(cards) {

		let map = {};
		cards.forEach((id) => {
			let point = this.getCardColor(id);
			let count = map[point];
			count = count ? count + 1 : 1;
			map[point] = count;
		});
		return map;
	}

	//移除指定卡牌
	exceptCards(allCards, cards) {

		let curData = cards.slice();
		let allData = allCards.slice();
		//移除指定卡牌
		for (let i = 0; i < curData.length; i++) {
			let curIndex = allData.findIndex(item => item == curData[i]);
			if (curIndex >= 0) {
				allData.splice(curIndex, 1);
			}
		}
		return allData;
	}

	/**根据点数分组 */
	getGroupByPoint(ids) {
		var group = {};
		ids.forEach((id) => {
			if (id !== BIGJOKER && id !== SMALLJOKER) {
				var point = this.getCardPoint(id);
				var arr = group[point];
				if (arr && Array.isArray(arr)) {
					arr.push(id);
				} else {
					group[point] = [];
					group[point].push(id);
				}
			}
		});
		return group;
	};

	/**根据花色分组 */
	getGroupByColor(ids) {
		var group = {};
		ids.forEach((id) => {
			if (id !== BIGJOKER && id !== SMALLJOKER) {
				var color = this.getCardColor(id);
				var arr = group[color];
				if (arr && Array.isArray(arr)) {
					arr.push(id);
				} else {
					group[color] = [];
					group[color].push(id);
				}
			}
		});
		return group;
	};

	/*排序从多到少 大到小*/
	typeCardsSortByScores(ids, guiMin, byColor) {

		var cardsGui = this.getCardsJoker(ids)
		var newCards = this.getCardsWithoutJoker(ids)

		var scoresHelper = this.getPointCountMap(newCards);
		newCards.sort((id1, id2) => {
			var a1 = this.getCardPoint(id1);
			var a2 = this.getCardPoint(id2);

			var c1 = this.getCardColor(id1);
			var c2 = this.getCardColor(id2);

			var numberOfCard1 = scoresHelper[a1];
			var numberOfCard2 = scoresHelper[a2];
			if (byColor) {
				if (c2 != c1) return c2 - c1;
			} else {
				if (numberOfCard2 != numberOfCard1) return numberOfCard2 - numberOfCard1;
			}

			if (a1 == 1) a1 = 14;
			if (a2 == 1) a2 = 14;
			var scores1 = a1 + c1 / 10;
			var scores2 = a2 + c2 / 10;
			if (byColor) {
				scores2 = parseInt((a2 >= 10 ? a2 : "0" + a2));
				scores1 = parseInt((a1 >= 10 ? a1 : "0" + a1));
			}
			return scores2 - scores1;
		});

		cardsGui.sort((id1, id2) => {
			return id2 - id1;
		});
		if (cardsGui.length > 0 && guiMin) {
			newCards = newCards.concat(cardsGui);
		} else {
			newCards = cardsGui.concat(newCards);
		}
		return newCards;
	}
}






module.exports = new GameLogic();