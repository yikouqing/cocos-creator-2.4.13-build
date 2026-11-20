let gameProto = require('./ApiLamj');

let CARDID = {
	CARDID_WAN1: 1,
	CARDID_WAN2: 2,
	CARDID_WAN3: 3,
	CARDID_WAN4: 4,
	CARDID_WAN5: 5,
	CARDID_WAN6: 6,
	CARDID_WAN7: 7,
	CARDID_WAN8: 8,
	CARDID_WAN9: 9,
	CARDID_TONG1: 11,
	CARDID_TONG2: 12,
	CARDID_TONG3: 13,
	CARDID_TONG4: 14,
	CARDID_TONG5: 15,
	CARDID_TONG6: 16,
	CARDID_TONG7: 17,
	CARDID_TONG8: 18,
	CARDID_TONG9: 19,
	CARDID_TIAO1: 21,
	CARDID_TIAO2: 22,
	CARDID_TIAO3: 23,
	CARDID_TIAO4: 24,
	CARDID_TIAO5: 25,
	CARDID_TIAO6: 26,
	CARDID_TIAO7: 27,
	CARDID_TIAO8: 28,
	CARDID_TIAO9: 29,
	CARDID_DONG: 31,
	CARDID_NAN: 32,
	CARDID_XI: 33,
	CARDID_BEI: 34,
	CARDID_ZHONG: 35,
	CARDID_FA: 36,
	CARDID_BAI: 37,
	CARDID_CHUN: 41,
	CARDID_XIA: 42,
	CARDID_QIU: 43,
	CARDID_DON: 44,
	CARDID_MEI: 45,
	CARDID_LAN: 46,
	CARDID_ZHU: 47,
	CARDID_JU: 48,
};


class GameLogic {

	constructor() {
		this.tingCards = [];
		this.gameRule = {};
		this.allCards = this.initBaseCards(); //所有的卡牌
		this.cards = []; //卡牌列表
	}

	initRule(gameRule) {
		this.gameRule = gameRule;
	}

	//初始化所有卡牌
	initBaseCards() {

		let cards = [];
		//添加万字
		for (let k = CARDID.CARDID_WAN1; k <= CARDID.CARDID_WAN9; k++) {
			cards.push(k, k, k, k);
		}
		//添加条子
		for (let k = CARDID.CARDID_TIAO1; k <= CARDID.CARDID_TIAO9; k++) {
			cards.push(k, k, k, k);
		}
		//添加筒子
		for (let k = CARDID.CARDID_TONG1; k <= CARDID.CARDID_TONG9; k++) {
			cards.push(k, k, k, k);
		}
		//添加中发白
		for (let k = CARDID.CARDID_ZHONG; k <= CARDID.CARDID_BAI; k++) {
			cards.push(k, k, k, k);
		}

		//添加字牌
		//if (!this.gameRule.isWithoutZi) {
		for (let k = CARDID.CARDID_DONG; k <= CARDID.CARDID_BEI; k++) {
			cards.push(k, k, k, k);
		}
		//}

		//初始化听牌列表
		this.tingCards = Array.from(new Set(cards.slice()));
		//返回卡牌
		return cards;
	}

	//获取所有卡牌
	getBaseCards(exceptCards = {}) {

		let curCards = this.allCards.slice();
		let testCards = [];
		for (let key in exceptCards) {
			testCards = testCards.concat(exceptCards[key]);
		}
		for (let i = 0; i < testCards.length; i++) {
			let cards = testCards[i];
			let cardIndex = curCards.findIndex(item => item == cards);
			curCards.splice(cardIndex, 1);
		}
		return curCards;
	}


	//初始化卡牌
	initCards(testCards, count = 300) {

		this.cards = this.getBaseCards(testCards);
		for (let i = 0; i < count; ++i) {
			let index = i % this.cards.length;
			let random1 = Math.floor(Math.random() * this.cards.length);
			let tmp = this.cards[index];
			this.cards[index] = this.cards[random1];
			this.cards[random1] = tmp;
		}
	}

	//获取指定的卡牌
	getSetCard(card) {

		let index = this.cards.indexOf(card);
		if (index == -1) {
			return null;
		} else {
			this.cards.splice(index, 1);
			return card;
		}
	}


	//新的一副牌抓马
	getNewMaCards(count) {

		let curCards = this.getBaseCards();
		for (let i = 0; i < 300; ++i) {
			let index = i % curCards.length;
			let random1 = Math.floor(Math.random() * curCards.length);
			let tmp = curCards[index];
			curCards[index] = curCards[random1];
			curCards[random1] = tmp;
		}
		let curList = curCards.splice(0, count);
		return curList;
	}

	//获取指定数量的卡牌
	getCards(cardCount, exceptList = []) {

		let curList = [];
		if (exceptList.length > 0) {

			for (let i = 0; i < this.cards.length; i++) {
				let curCards = this.cards[i];
				if (!exceptList.includes(curCards)) {
					curList.push(this.cards[i])
				}
				if (curList.length >= cardCount) {
					//在数组里面移除当前卡牌
					for (let k = 0; k < curList.length; k++) {
						this.getSetCard(curList[k]);
					}
					break;
				}
			}
		} else {
			//获取卡牌
			if (this.cards.length >= cardCount) {
				curList = this.cards.splice(0, cardCount);
			}
		}
		return curList;
	}

	//获取当前所有卡牌
	getAllCards() {
		return this.cards;
	}

	//获取剩余卡牌数量
	getRestCardsCount() {
		return this.cards.length;
	}

	//获取癞子
	getLaiZiCards() {

		let laiZiCards = [];
		let fanCard = null;
		if (this.gameRule.laiZiType == gameProto.laiZiType.BAI) {
			laiZiCards = [CARDID.CARDID_BAI];
		} else if (this.gameRule.laiZiType == gameProto.laiZiType.ZHONG) {
			laiZiCards = [CARDID.CARDID_ZHONG];
		} else if (this.gameRule.laiZiType == gameProto.laiZiType.FAN) {
			let card = this.getCards(1)[0];
			fanCard = card;
			//万条同
			if (card < 30) {
				if (card % 10 == 9) {
					let laiCard = card - 8;
					laiZiCards = [laiCard];
				} else {
					let laiCard = card + 1;
					laiZiCards = [laiCard];
				}
			} else if (card >= CARDID.CARDID_ZHONG && card <= CARDID.CARDID_BAI) {
				//中发白
				if (card == CARDID.CARDID_BAI) {
					laiZiCards = [CARDID.CARDID_ZHONG];
				} else {
					let laiCard = card + 1;
					laiZiCards = [laiCard];
				}
			} else if (card >= CARDID.CARDID_DONG && card <= CARDID.CARDID_BEI) {
				//东南西北
				if (card == CARDID.CARDID_BEI) {
					laiZiCards = [CARDID.CARDID_DONG];
				} else {
					let laiCard = card + 1;
					laiZiCards = [laiCard];
				}
			}

		} else if (this.gameRule.laiZiType == gameProto.laiZiType.SHUANG) {
			let card = this.getCards(1)[0];
			fanCard = card;
			//万条同
			if (card < 30) {
				if (card % 10 == 9) {
					let laiCard = card - 8;
					laiZiCards.push(laiCard);
					laiCard = laiCard + 1;
					laiZiCards.push(laiCard);
				} else if (card % 10 == 8) {
					let laiCard = card + 1;
					laiZiCards.push(laiCard);
					laiCard = card - 7;
					laiZiCards.push(laiCard);
				} else {
					let laiCard = card + 1;
					laiZiCards.push(laiCard);
					laiCard = card + 2;
					laiZiCards.push(laiCard);
				}
			} else if (card >= CARDID.CARDID_ZHONG && card <= CARDID.CARDID_BAI) {
				//中发白
				for (let i = CARDID.CARDID_ZHONG; i <= CARDID.CARDID_BAI; i++) {
					if (i != card) {
						laiZiCards.push(i);
					}
				}
			} else if (card >= CARDID.CARDID_DONG && card <= CARDID.CARDID_BEI) {
				//东南西北
				if (card == CARDID.CARDID_BEI) {
					laiZiCards = [CARDID.CARDID_DONG, CARDID.CARDID_NAN];
				} else if (card == CARDID.CARDID_XI) {
					laiZiCards = [CARDID.CARDID_DONG, CARDID.CARDID_BEI];
				} else {
					let laiCard = card + 1;
					laiZiCards.push(laiCard);
					laiCard = card + 2;
					laiZiCards.push(laiCard);
				}
			}
		}
		return {
			fanCard,
			laiZiCards
		}
	}

	//获取卡牌颜色
	getCardColor(card) {

		return parseInt(card / 10);
	}

	//获取卡牌值
	getCardPoint(card) {

		return parseInt(card % 10);
	}

	//获取马牌倍数
	getMaRate(card) {
		if (card >= CARDID.CARDID_DONG) {
			return 5;
		} else {
			return this.getCardPoint(card);
		}
	}

	//获取所以字牌
	getAllZiCards() {
		let list = [];
		for (let i = CARDID.CARDID_DONG; i <= CARDID.CARDID_BAI; i++) {
			list.push(i);
		}
		return list;
	}

	//获取指定卡牌
	getExceptCards(allTestCards, callCards) {

		let allCards = callCards.slice();
		let testCards = [];
		for (let key in allTestCards) {
			if (allTestCards[key] && allTestCards[key].length > 0) {
				testCards = testCards.concat(allTestCards[key]);
			}
		}
		for (let i = 0; i < testCards.length; i++) {
			let cards = testCards[i];
			let cardIndex = allCards.findIndex(item => item == cards);
			allCards.splice(cardIndex, 1);
		}
		return allCards.slice();
	}


	/*-----------------------------------胡牌算法-----------------------------------------*/

	//是否可以胡基础牌型
	getCanHu(cards, laiziCount = 0, isKan = false) {

		//七对
		if (this.isQiDui(cards, laiziCount)) {
			return true;
		}
		//十三烂 
		if (this.isShiSanLan(cards, laiziCount)) {
			return true;
		}
		// 若牌张数不是2、5、8、11、14,17则不能胡  
		if ((cards.length + laiziCount + 1) % 3 != 0) return false;

		//牌升序排序 
		cards.sort((a, b) => {
			return a - b;
		})

		// 依次删除一对牌做将，其余牌全部成扑则可胡  
		for (let i = 0; i < cards.length; i++) {

			//和上一次是同样的对牌，避免重复计算
			if (i > 0 && cards[i] == cards[i - 1]) continue;

			// 找到对子或是用一张癞子拼出的对子 
			if ((i + 1 < cards.length && cards[i] == cards[i + 1]) || laiziCount > 0) {

				let curCards = cards.slice();
				let curLaizi = laiziCount;
				curCards.splice(i, 1);
				//如果队列里面还有一个对子
				if (curCards[i] == cards[i]) {
					curCards.splice(i, 1);
				} else {
					curLaizi--; //没有一对时使用癞子代替
				}

				// 删去对子判断剩下的牌是否成顺子和坎
				if (this.isShunKan(curCards, curLaizi, isKan)) {
					return true;
				}
			}
		}
		if (laiziCount >= 2 && this.isShunKan(cards, laiziCount - 2, isKan)) {
			// 两个癞子做将牌特殊判定处理  
			return true;
		}
		return false;
	}

	//是否顺子和坎
	isShunKan(cards, laiziCount, isKan) {

		if (cards.length === 0) return true;
		//判断顺子
		for (let first = cards[0] - 2; first <= cards[0]; first++) {

			if (first >= 30) continue; //字牌花牌不能连
			if (first % 10 > 7) continue; // 89不能连牌
			if (laiziCount === 0 && first < cards[0]) continue; //没有癞子的情况 连牌必须是第一张开始

			let shunCount = 0;
			for (let i = 0; i < 3; i++) {
				if (cards.indexOf(first + i) >= 0) {
					shunCount += 1;
				}
			}

			//找到一个顺子
			if (shunCount === 3 || shunCount + laiziCount >= 3) {

				let curCards = cards.slice();
				let curLaizi = laiziCount;
				for (let i = 0; i < 3; i++) {

					let deletePos = curCards.indexOf(first + i);
					if (deletePos >= 0) {
						curCards.splice(deletePos, 1); //原卡牌踢出顺子数据
					} else {
						curLaizi -= 1; //没有的时候使用癞子替换
					}
				}
				//判断剩下的牌是否成顺坎
				if (this.isShunKan(curCards, curLaizi, isKan)) {
					return true;
				}
			}
		}

		//判断坎
		let keziCard = cards[0];
		let keziCount = (cards.filter(item => item == keziCard)).length;

		if (!isKan && (keziCount === 3 || keziCount + laiziCount >= 3)) {

			let curCards = cards.slice();
			let curLaizi = laiziCount;
			for (let i = 0; i < 3; i++) {
				let deletePos = curCards.indexOf(keziCard);
				if (deletePos >= 0) {
					curCards.splice(deletePos, 1); //原卡牌踢出坎数据
				} else {
					curLaizi -= 1; //没有的时候使用癞子替换
				}
			}
			if (this.isShunKan(curCards, curLaizi, isKan)) {
				return true;
			}
		}
		return false;
	}

	//获取听牌列表
	getTingList(cards, laiZiCards, isTing = true, isyu = true, TingList = [], laiZi = 0) {

		let tingList = [];
		this.tingCards.map(item => {
			let curCards = cards.slice();
			let TingLList = TingList.slice();
			let laiZiList = laiZi;
			if (TingLList.length == 0) {
				if (!isyu) {
					curCards.push(item);
					TingLList = curCards.filter(item => !laiZiCards.includes(item));
					laiZiList = curCards.filter(item => laiZiCards.includes(item)).length;
				}

				if (isyu) {
					TingLList = curCards.filter(item => !laiZiCards.includes(item));
					laiZiList = curCards.filter(item => laiZiCards.includes(item)).length;
					TingLList.push(item);
				}
			} else {
				TingLList.push(item);
			}
			//将红中替换为癞子牌
			if (isTing && !this.getCanHu(TingLList, laiZiList) && laiZiCards[0] < 31 && TingLList.includes(35)) {
				let ZhonglaiZiList = TingLList.filter(item => [35].includes(item));
				let linZhonglaiZiList = TingLList.slice();
				for (let index = 0; index < ZhonglaiZiList.length; index++) {
					linZhonglaiZiList[linZhonglaiZiList.indexOf(35)] = laiZiCards[0];
					if (this.isShiSanLan(linZhonglaiZiList, laiZiList)) {
						break;
					} else if (this.getCanHu(linZhonglaiZiList, laiZiList)) {
						tingList.push({
							cardID: item,
							rate: 1
						});
						break;
					}
				}
			}
			if (this.isShiSanLan(TingLList, laiZiList)) {
				tingList.push({
					cardID: item,
					rate: gameProto.cardType.SHISANLAN
				});
			}
			if (this.getCanHu(TingLList, laiZiList)) {
				tingList.push({
					cardID: item,
					rate: 1
				});
			}
			if (this.isQiDui(TingLList, laiZiList)) {
				tingList.push({
					cardID: item,
					rate: gameProto.cardType.QIDUIZI
				});
			}
		});

		/**去重 */
		if (tingList.length > 1) {
			tingList = tingList.filter((item, index, self) => {
				return index === self.findIndex((t) => {
					return t.cardID === item.cardID;
				});
			});
		}

		return tingList;
	}

	/*-------------------------------------牌型判断-------------------------------------------------*/
	//是否十三烂
	isShiSanLan(cardList, laiZiCount = 0, type = 0) {

		let curCards = cardList.slice();
		let curSet = new Set(curCards);
		let cardTypeList = Array.from(curSet);
		if (cardTypeList.length + laiZiCount != 14) return false;
		//排序
		cardTypeList.sort((a, b) => {
			return a - b;
		})
		let CardColorList = []; //记录万 条 筒 字
		for (let cardType in cardTypeList) {
			let CardColor = this.getCardColor(cardTypeList[cardType]);
			if (!CardColorList[CardColor]) {
				CardColorList[CardColor] = [];
			} else {
				if (CardColor != 3 && cardTypeList[cardType] <= CardColorList[CardColor][CardColorList[CardColor].length - 1] + 2) {
					return false;
				}
			}
			//分类记录
			CardColorList[this.getCardColor(cardTypeList[cardType])].push(cardTypeList[cardType]);
		}
		let fengCardColor = JSON.parse(JSON.stringify(CardColorList.slice()));
		//癞子替换 //优先替换 字牌
		if (CardColorList[3].length < 7 && laiZiCount > 0) {
			for (let k = CARDID.CARDID_DONG; k <= CARDID.CARDID_BAI; k++) {
				if (!CardColorList[3].includes(k) && laiZiCount > 0) {
					CardColorList[3].push(k);
					CardColorList[3].sort((a, b) => {
						return a - b;
					})
					laiZiCount--;
				}
			}
		}
		let linmen = 0;
		//癞子替换 //补充不到3位的数据
		if (laiZiCount > 0) {
			//替换万筒条
			for (let cardType in CardColorList) {
				if (cardType != 3 && CardColorList[cardType].length < 3) {
					let CardColor = CardColorList[cardType][CardColorList[cardType].length - 1];
					//替换只有一张牌的类别
					if (CardColorList[cardType].length == 1) {
						if (this.getCardColor(CardColor + 3) == cardType && (CardColor + 3) % 10 != 0) {
							CardColorList[cardType].push(CardColor + 3);
							laiZiCount--;
						}
						if (this.getCardColor(CardColor - 3) == cardType && (CardColor - 3) % 10 != 0) {
							CardColorList[cardType].push(CardColor - 3);
							laiZiCount--;
						}
						if (this.getCardColor(CardColor + 6) == cardType && (CardColor + 6) % 10 != 0) {
							CardColorList[cardType].push(CardColor + 6);
							laiZiCount--;
						}
						if (this.getCardColor(CardColor - 6) == cardType && (CardColor - 6) % 10 != 0) {
							CardColorList[cardType].push(CardColor - 6);
							laiZiCount--;
						}
						CardColorList[cardType].sort((a, b) => {
							return a - b;
						})
					} else if (CardColorList[cardType].length == 2) { //替换二张牌的类别
						let linlist = [];
						//放入 牌左右第3位的数据
						for (let index in CardColorList[cardType]) {
							if (this.getCardColor(CardColorList[cardType][index] + 3) == cardType && (CardColorList[cardType][index] + 3) % 10 != 0) {
								linlist.push(CardColorList[cardType][index] + 3);
							}
							if ((CardColorList[cardType][index] - 3) > 0 && this.getCardColor(CardColorList[cardType][index] - 3) == cardType && (CardColorList[cardType][index] - 3) % 10 != 0) {
								linlist.push(CardColorList[cardType][index] - 3);
							}
						}
						linlist.sort((a, b) => {
							return a - b;
						})
						//依次填入数据校验
						for (let index = 0; index < linlist.length; index++) {
							let lincardType = CardColorList[cardType].slice();
							lincardType.push(linlist[index]);
							lincardType.sort((a, b) => {
								return a - b;
							})
							let lin_on = true;
							for (let index_on = 0; index_on < lincardType.length - 1; index_on++) {
								if (lincardType[index_on] + 3 > lincardType[index_on + 1]) {
									lin_on = false;
									break;
								}
							}
							//增加放入数据
							if (lin_on) {
								laiZiCount--;
								CardColorList[cardType].push(linlist[index]);
								CardColorList[cardType].sort((a, b) => {
									return a - b;
								})
								break;
							}
						}

					}

				}
				if (laiZiCount == 0) {
					break;
				}
			}
			for (let index in CardColorList) {
				if (index != 3 && CardColorList[index].length > 0) {
					linmen++;
				}
			}
			if (type == 66 && linmen <= 2 && laiZiCount == 1 && fengCardColor[3].length == 7) { //风全门缺
				return gameProto.cardType.FENGQUANMENQUE;
			} else if (type == 65 && linmen <= 2 && laiZiCount == 1 && fengCardColor[3].length == 7) { //十三烂七
				return gameProto.cardType.SHISANLANQI;
			}
			if (laiZiCount > 0) {
				//补充到缺的类型中
				for (let index = 0; index < 3; index++) {
					if (!CardColorList[index]) {
						CardColorList[index] = [];
						CardColorList[index].push((index * 10) + 1);
						laiZiCount--;
					}
					if (CardColorList[index].length != 3 && laiZiCount > 0 &&
						this.getCardColor(CardColorList[index][CardColorList[index].length - 1] + 3) == this.getCardColor(CardColorList[index][CardColorList[index].length - 1]) &&
						(CardColorList[index][CardColorList[index].length - 1] + 3) % 10 != 0
					) {
						CardColorList[index].push(CardColorList[index][CardColorList[index].length - 1] + 3);
						laiZiCount--;
					}
					if (CardColorList[index].length != 3 && laiZiCount > 0 &&
						this.getCardColor(CardColorList[index][CardColorList[index].length - 1] + 3) == this.getCardColor(CardColorList[index][CardColorList[index].length - 1]) &&
						(CardColorList[index][CardColorList[index].length - 1] + 3) % 10 != 0
					) {
						CardColorList[index].push(CardColorList[index][CardColorList[index].length - 1] + 3);
						laiZiCount--;
					}
					CardColorList[index].sort((a, b) => {
						return a - b;
					})
					if (laiZiCount == 0) {
						break;
					}
				}
			}
		} else {
			for (let index in CardColorList) {
				if (index != 3 && CardColorList[index].length > 0) {
					linmen++;
				}
			}
		}

		//到最后 如果还要癞子未使用 踢出
		if (laiZiCount > 0) {
			return false;
		}
		if (type == 64) { //十三烂门缺
			if (linmen <= 2) {
				return gameProto.cardType.SHISANLANMENQUE;
			}
		} else if (type == 63 && fengCardColor[3].length == 7) { //七风全
			return gameProto.cardType.QIFENGQUAN;
		} else if (type == 0) { //十三烂
			return gameProto.cardType.SHISANLAN;
		}
		return false;

	}
	//是否十八罗汉
	isShiBaLuoHan(cardList, operateList = []) {

		if (!this.gameRule.shiBaLuoHanScore) return false;
		if (cardList.length > 2) {
			return false;
		}
		let gangOperate = [gameProto.operateType.GANG_BU, gameProto.operateType.GANG_CHI, gameProto.operateType.GANG_ZHI];
		let curList = operateList.filter(item => gangOperate.includes(item.operate));
		if (curList.length != 4) {
			return false;
		}
		return true;
	}

	//当前卡牌是否十三幺
	isShiSanYao(cardList, laiZiCount) {

		if (!this.gameRule.shiSanYaoScore) return false;
		if (cardList.length + laiZiCount != 14) return false;
		let baseCards = [CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO9, CARDID.CARDID_WAN1, CARDID.CARDID_WAN9, CARDID.CARDID_TONG1, CARDID.CARDID_TONG9];
		for (let i = CARDID.CARDID_DONG; i <= CARDID.CARDID_BAI; i++) {
			baseCards.push(i);
		}
		let curCards = cardList.slice();
		for (let i = 0; i < baseCards.length; i++) {
			let curIndex = curCards.findIndex(item => item == baseCards[i]);
			if (curIndex >= 0) {
				curCards.splice(curIndex, 1);
			}
		}
		if ((curCards.length == 0) || (curCards.length == 1 && baseCards.includes(curCards[0]))) {
			return true;
		} else {
			return false;
		}
	}

	//是否七对
	isQiDui(cardList, laiZiCount = 0, isyan = true) {

		//if (this.gameRule.playType == gameProto.playType.TDH && !this.gameRule.qiDuiRate) return false;
		//if (this.gameRule.playType == gameProto.playType.ZPTDH && !this.gameRule.qiDuiScore) return false;
		if (cardList.length + laiZiCount != 14 && isyan) return false;
		let curCards = cardList.slice();
		let cardTypeList = {};
		curCards.forEach((item) => {
			cardTypeList[item] = (cardTypeList[item] || 0) + 1;
		});

		let curFourCount = 0;
		for (let cardType in cardTypeList) {

			let curCount = cardTypeList[cardType];
			if (curCount % 2 == 0) {
				if (curCount == 4) {
					curFourCount += 1;
				}
				continue;
			} else {
				if (laiZiCount >= 1) {
					laiZiCount -= 1;
					if (curCount == 3) {
						curFourCount += 1;
					}
					continue;
				} else {
					return false;
				}
			}
		}
		curFourCount += (laiZiCount / 2);

		return gameProto.cardType.QIDUIZI
	}

	//是否清一色
	isQingYiSe(cardList, operateList = []) {

		//if (!this.gameRule.qingYiSeScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		return curList.every(item => this.getCardColor(item) == this.getCardColor(curList[0]) && this.getCardColor(item) <= 2);
	}

	//是否混一色
	isHunYiSe(cardList, operateList = []) {

		//if (!this.gameRule.hunYiSeScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		let lincurList = curList.filter(item => item >= CARDID.CARDID_DONG)
		if (lincurList.length == 0) {
			return false;
		}
		curList = curList.filter(item => item < CARDID.CARDID_DONG);
		return curList.every(item => this.getCardColor(item) == this.getCardColor(curList[0]) && this.getCardColor(item) <= 2);
	}

	//是否字一色
	isZiYiSe(cardList, operateList = []) {

		if (!this.gameRule.ziYiSeScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		return curList.every(item => item >= CARDID.CARDID_DONG);
	}

	//是否大四喜
	isDaSiXi(cardList, operateList = []) {

		if (!this.gameRule.daSiXiScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		let colorCards = curList.filter(item => item <= CARDID.CARDID_TIAO9);
		if (colorCards.length > 0) {
			return false;
		}
		let fengCards = curList.filter(item => [CARDID.CARDID_ZHONG, CARDID.CARDID_FA, CARDID.CARDID_BAI].includes(item));
		if (fengCards.length > 2) {
			return false;
		}
		return true;
	}

	//小四喜
	isXiaoSiXi(cardList, operateList = []) {

		if (!this.gameRule.xiaoSiXiScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		let sanCount = 0;
		let duiCount = 0;
		let dong = curList.filter(item => item == CARDID.CARDID_DONG);
		if (dong.length >= 3) {
			sanCount += 1;
		}
		if (dong.length == 2) {
			duiCount += 1;
		}
		let nan = curList.filter(item => item == CARDID.CARDID_NAN);
		if (nan.length >= 3) {
			sanCount += 1;
		}
		if (nan.length == 2) {
			duiCount += 1;
		}
		let xi = curList.filter(item => item == CARDID.CARDID_XI);
		if (xi.length >= 3) {
			sanCount += 1;
		}
		if (xi.length == 2) {
			duiCount += 1;
		}
		let bei = curList.filter(item => item == CARDID.CARDID_BEI);
		if (bei.length >= 3) {
			sanCount += 1;
		}
		if (bei.length == 2) {
			duiCount += 1;
		}

		if (sanCount >= 3 && duiCount == 1) {
			return true;
		} else {
			return false;
		}

	}

	//是否大三元
	isDaSanYuan(cardList, operateList = []) {

		if (!this.gameRule.daSanYuanScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		let fengCards = curList.filter(item => [CARDID.CARDID_ZHONG, CARDID.CARDID_FA, CARDID.CARDID_BAI].includes(item));
		if (fengCards.length >= 9) {
			return true;
		}
		return false;
	}

	//是否小三元
	isXiaoSanYuan(cardList, operateList = []) {

		if (!this.gameRule.xiaoSanYuanScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		let fengCards = curList.filter(item => [CARDID.CARDID_ZHONG, CARDID.CARDID_FA, CARDID.CARDID_BAI].includes(item));
		if (fengCards.length >= 8) {
			return true;
		}
		return false;
	}

	//清幺九
	isQingYaoJiu(cardList, operateList = []) {
		//if (!this.gameRule.qingYaoJiuScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		return curList.every(item => item < CARDID.CARDID_DONG && [1, 9].includes(this.getCardPoint(item)));
	}

	//混幺九
	isHunYaoJiu(cardList, operateList = []) {
		//if (!this.gameRule.hunYaoJiuScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		return curList.every(item => item >= CARDID.CARDID_DONG || [1, 9].includes(this.getCardPoint(item)));
	}

	//是否是对对胡
	isDuiDuiHu(cardList, laiCount, operateList = []) {

		if (!this.gameRule.pengPengHuScore) return false;
		if (operateList.find(item => item.operate == gameProto.operateType.CHI)) {
			return false;
		}

		if (cardList.length == 2) {
			return true;
		}

		let curCards = cardList.slice();
		let cardCount = {};
		let duiList = [];
		let kanList = [];
		for (let i = 0; i < curCards.length; i++) {
			let curCard = curCards[i];
			if (!cardCount[curCard]) {
				cardCount[curCard] = 0;
			}
			cardCount[curCard] += 1;
		}

		for (let card in cardCount) {
			if (cardCount[card] == 4) {
				laiCount -= 2;
			} else if (cardCount[card] == 2 && laiCount > 0) {
				kanList.push(card);
				laiCount -= 1;
			} else if (cardCount[card] == 2 && laiCount == 0) {
				duiList.push(card);
			} else if (cardCount[card] == 1 && laiCount > 0) {
				duiList.push(card);
				laiCount -= 1;
			} else if (cardCount[card] == 1 && laiCount == 0) {
				return false;
			}
		}
		if (duiList.length == 1 || (duiList.length == 0 && laiCount >= 2)) {
			return true;
		} else {
			return false;
		}
	}


	//判断是鸡胡还是胡
	getJiPingHu(cardList, laiZiCount) {

		let curCards = cardList.slice();
		//if (curCards.length != 14) return;
		let isCanHuNoKan = this.getCanHu(curCards, laiZiCount);
		if (isCanHuNoKan) {
			return gameProto.cardType.PINGHU;
		}
	}

	//通天
	istongtian(cardList, laiZiList, laiZiCards) {
		let curCards = cardList.slice();
		//红中宝牌 更替为 癞子本身的牌
		for (let key = 0; key < laiZiList; key++) {
			curCards.push(laiZiCards[0]);
		}
		//if (curCards.length != 14) return;
		//排序
		curCards.sort((a, b) => {
			return a - b;
		})
		let CardColorList = []; //记录万 条 筒 字
		for (let cardType in curCards) {
			let CardColor = this.getCardColor(curCards[cardType]);
			if (!CardColorList[CardColor]) {
				CardColorList[CardColor] = [];
			}
			//分类记录
			CardColorList[this.getCardColor(curCards[cardType])].push(curCards[cardType]);
		}
		for (let index in CardColorList) {
			if (index == 3) {
				continue;
			}
			CardColorList[index].sort((a, b) => {
				return a - b;
			})
			let curSet = new Set(CardColorList[index].slice());
			let cardTypeList = Array.from(curSet);
			if (cardTypeList.length == 9) {
				return true;
			}
		}
		return false;
	}
	//清风
	isqingfeng(cardList, operateList = []) {
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		return curList.every(item => item >= CARDID.CARDID_DONG);
	}
	//红中
	ishongzhong(cardList, operateList = []) {
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		let hongzhong = 0;
		for (let index = 0; index < curList.length; index++) {
			if (curList[index] == CARDID.CARDID_ZHONG) {
				hongzhong++;
			}
		}
		return hongzhong;
	}
	//四红中
	issihongzhong(cardList, operateList) {
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		let hongzhong = 0;
		for (let index = 0; index < curList.length; index++) {
			if (curList[index] == CARDID.CARDID_ZHONG) {
				hongzhong++;
			}
		}
		return hongzhong;
	}
	isDanDiaoBao(handCards, card, laiZiCards, operateRecords) {
		let TinghandCards = handCards.slice();
		TinghandCards.splice(TinghandCards.indexOf(card), 1);
		let laiZiList = TinghandCards.filter(item => laiZiCards.includes(item));
		if (laiZiList.length > 0) {
			let baoguiwei = 0;
			for (let index = laiZiList.length; index >= 0; index--) {
				//获取没有宝牌的所有牌
				let lincardList = TinghandCards.filter(item => !laiZiCards.includes(item));
				//牌升序排序 
				lincardList.sort((a, b) => {
					return a - b;
				})
				//宝牌数量
				let linbaoguiwei = laiZiList.slice();
				baoguiwei = 0;
				//还原宝牌
				for (let key = 0; key < index; key++) {
					lincardList.push(laiZiCards[0]);
					linbaoguiwei.pop();
					baoguiwei++;
				}
				//不加入宝牌 当前牌型可胡 
				let getCanHu = TinghandCards.filter(item => !laiZiCards.includes(item))
				getCanHu.sort((a, b) => {
					return a - b;
				})
				if (this.getCanHu(getCanHu, linbaoguiwei.length) || this.isShunKan(getCanHu, linbaoguiwei.length)) {
					return baoguiwei;
				}
				if (this.isQiDui(getCanHu, linbaoguiwei.length, false) && operateRecords.length == 0) {
					return baoguiwei;
				}
				//红中转宝牌
				let ZhonglaiZiList = getCanHu.filter(item => [35].includes(item));
				for (let index = 0; index < ZhonglaiZiList.length; index++) {
					getCanHu[getCanHu.indexOf(35)] = laiZiCards[0];
					if (this.getCanHu(getCanHu, linbaoguiwei.length) || this.isShunKan(getCanHu, linbaoguiwei.length)) {
						return baoguiwei;
					}
				}

			}
		}
		return 0;
	}
	getUserHuScore(huType) {
		//牌型
		if (huType == gameProto.cardType.PINGHU) {
			//平胡两分
			return 1;
		} else if (huType == gameProto.cardType.QIDUIZI) {
			//七对胡分数
			return 10;
		} else if (huType == gameProto.cardType.SHISANLAN) {
			//十三烂
			return 7;
		} else if (huType == gameProto.cardType.QIFENGQUAN) {
			//七风全
			return 17;
		} else if (huType == gameProto.cardType.SHISANLANMENQUE) {
			//十三烂门缺
			return 17;
		} else if (huType == gameProto.cardType.SHISANLANQI) {
			//十三烂七
			return 37;
		} else if (huType == gameProto.cardType.FENGQUANMENQUE) {
			///风全门缺
			return 37;
		} else {
			return 1;
		}

	}



	/*-----------------------------------------aiLogic--------------------------------------------------*/

	//获取要打的牌
	getAiOutCards(handCards, laiZiCards, isSmart = false) {

		handCards = handCards.slice();
		if (!isSmart) {
			let cards = handCards[handCards.length - 1];
			return cards;
		}

		//let laiZiCount = (handCards.filter(item => laiZiCards.includes(item))).length;
		handCards = handCards.filter(item => !laiZiCards.includes(item));

		//首先判断是否有打牌可以胡的
		let huList = [];
		for (let i = 0; i < handCards.length; i++) {
			let card = handCards[i];
			if (laiZiCards.includes(card)) continue;
			let curUserCards = handCards.slice();
			curUserCards.splice(i, 1);
			let tingList = this.getTingList(curUserCards, laiZiCards);
			if (tingList.length > 0) {
				huList.push({
					card,
					count: tingList.length
				});
			}
		}

		if (huList.length > 0) {
			//胡一个张数最多的
			huList.sort((a, b) => {
				return b.count - a.count
			});
			return huList[0].card;
		}

		//判断可以打的麻将
		let ziCards = handCards.filter(item => item >= 30);
		for (let i = 0; i < ziCards.length; i++) {
			let card = ziCards[i];
			let count = (ziCards.filter(item => item == card)).length;
			//打出字牌的单张
			if (count == 1) {
				return card;
			}
		}
		handCards = handCards.filter(item => item <= CARDID.CARDID_TIAO9);
		//最后的规则
		return this.aiLogic.getAutoCards(handCards);

	}


	//判断用户的基础操作 吃 碰 杠 胡等
	getAiUserOperate(operateArray, handCards, laiZiCards, isSmart = false) {


		if (!isSmart) {
			//有过就过
			let operate = operateArray.find(item => item.type == gameProto.operateType.GUO);
			if (operate) {
				//过操作
				let curOperate = {
					operate: gameProto.operateType.GUO
				};
				return curOperate;
			}
			//弃牌
			operate = operateArray.find(item => item.type == gameProto.operateType.QI);
			if (operate) {
				let card = this.getAiOutCards(handCards, laiZiCards, isSmart);
				//打牌操作
				let curOperate = {
					operate: gameProto.operateType.QI,
					card: card
				};
				return curOperate;
			}
		}

		//判断是否有胡
		let huList = [gameProto.operateType.HU_CHI, gameProto.operateType.HU_QIANG, gameProto.operateType.HU_ZHI];
		let operate = operateArray.find(item => huList.includes(item.type));
		if (operate) {
			//有胡就胡拉
			let curOperate = {
				operate: operate.type,
				card: operate.card
			};
			return curOperate;
		}
		//判断有杠没有
		let gangOperate = [gameProto.operateType.GANG_ZHI, gameProto.operateType.GANG_CHI, gameProto.operateType.GANG_BU];
		operate = operateArray.find(item => gangOperate.includes(item.type));
		if (operate) {
			//有杠就杠拉
			let curOperate = {
				operate: operate.type,
				card: operate.card,
				cardList: operate.cardList
			};
			return curOperate;
		}
		//碰
		operate = operateArray.find(item => item.type == gameProto.operateType.PENG);
		if (operate) {
			//有碰就碰拉
			let curOperate = {
				cardList: operate.cardList,
				operate: operate.type,
				card: operate.card
			};
			return curOperate;
		}
		operate = operateArray.find(item => item.type == gameProto.operateType.CHI);
		if (operate && !handCards.includes(operate.card)) {
			//有吃就吃拉
			let curOperate = {
				operate: operate.type,
				card: operate.card,
				cardList: operate.cardList
			};
			return curOperate;
		}
		//其他就过啦
		operate = operateArray.find(item => item.type == gameProto.operateType.GUO);
		if (operate) {
			//过操作
			let curOperate = {
				operate: gameProto.operateType.GUO
			};
			return curOperate;
		}
		//弃牌
		operate = operateArray.find(item => item.type == gameProto.operateType.QI);
		if (operate) {
			let card = this.getAiOutCards(handCards, laiZiCards, isSmart);
			//打牌操作
			let curOperate = {
				operate: gameProto.operateType.QI,
				card: card
			};
			return curOperate;
		}

	}









}


module.exports = new GameLogic();