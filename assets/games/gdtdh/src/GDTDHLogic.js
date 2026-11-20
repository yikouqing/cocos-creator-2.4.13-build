let gameProto = require('./ApiGdtdh');

let CARDID = {
	CARDID_WAN1: 1, CARDID_WAN2: 2, CARDID_WAN3: 3, CARDID_WAN4: 4, CARDID_WAN5: 5, CARDID_WAN6: 6, CARDID_WAN7: 7, CARDID_WAN8: 8, CARDID_WAN9: 9,
	CARDID_TONG1: 11, CARDID_TONG2: 12, CARDID_TONG3: 13, CARDID_TONG4: 14, CARDID_TONG5: 15, CARDID_TONG6: 16, CARDID_TONG7: 17, CARDID_TONG8: 18, CARDID_TONG9: 19,
	CARDID_TIAO1: 21, CARDID_TIAO2: 22, CARDID_TIAO3: 23, CARDID_TIAO4: 24, CARDID_TIAO5: 25, CARDID_TIAO6: 26, CARDID_TIAO7: 27, CARDID_TIAO8: 28, CARDID_TIAO9: 29,
	CARDID_DONG: 31, CARDID_NAN: 32, CARDID_XI: 33, CARDID_BEI: 34, CARDID_ZHONG: 35, CARDID_FA: 36, CARDID_BAI: 37,
	CARDID_CHUN: 41, CARDID_XIA: 42, CARDID_QIU: 43, CARDID_DON: 44, CARDID_MEI: 45, CARDID_LAN: 46, CARDID_ZHU: 47, CARDID_JU: 48,
};


class GameLogic {

	constructor() {
		this.cards = []; //麻将列表
		this.tingCards = []; //可以听牌的列表
		this.gameRule = {};
		this.initBaseCards();
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

		//填加字牌
		if (!this.gameRule.isWithoutZi) {
			for (let k = CARDID.CARDID_DONG; k <= CARDID.CARDID_BEI; k++) {
				cards.push(k, k, k, k);
			}
		}

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
		return curCards
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
				}
				else {
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
				}
				else {
					let laiCard = card + 1;
					laiZiCards.push(laiCard);
					laiCard = card + 2;
					laiZiCards.push(laiCard);
				}
			}
		}
		return { fanCard, laiZiCards }
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


		//四鬼胡
		if ((this.gameRule.siGuiHuScore || this.gameRule.siGuiHuRate) && laiziCount >= 4) {
			return true;
		}

		//十三幺
		if (this.isShiSanYao(cards, laiziCount)) {
			return true;
		}

		//十三幺
		if (this.isShiSanYao(cards, laiziCount)) {
			return true;
		}

		//七对
		if (this.isQiDui(cards, laiziCount)) {
			return true;
		}

		// 若牌张数不是2、5、8、11、14,17则不能胡  
		if ((cards.length + laiziCount + 1) % 3 != 0) return false;

		//牌升序排序 
		cards.sort((a, b) => { return a - b; })

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
	getTingList(cards, laiziCount) {

		let tingList = [];
		this.tingCards.map(item => {
			let curCards = cards.slice();
			curCards.push(item);
			if (this.getCanHu(curCards, laiziCount)) {
				tingList.push({ cardID: item, rate: 1 });
			}
		});
		return tingList;
	}

	/*-------------------------------------牌型判断-------------------------------------------------*/

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
	isQiDui(cardList, laiZiCount = 0) {

		if (this.gameRule.playType == gameProto.playType.TDH && !this.gameRule.qiDuiRate) return false;
		if (this.gameRule.playType == gameProto.playType.ZPTDH && !this.gameRule.qiDuiScore) return false;
		if (cardList.length + laiZiCount != 14) return false;
		let curCards = cardList.slice();
		let cardTypeList = {};
		curCards.forEach((item) => {
			if (!cardTypeList[item]) {
				cardTypeList[item] = 0;
			}
			cardTypeList[item] += 1;
		});

		let curFourCount = 0;
		for (let cardType in cardTypeList) {

			let curCount = cardTypeList[cardType];
			if (curCount == 2) continue;
			if (curCount == 4) {
				curFourCount += 1;
				continue;
			}
			if (curCount == 3) {
				if (laiZiCount >= 1) {
					curFourCount += 1;
					laiZiCount -= 1;
					continue;
				} else {
					return false;
				}
			}
			if (curCount == 1) {
				if (laiZiCount >= 1) {
					laiZiCount -= 1;
					continue;
				} else {
					return false;
				}
			}
		}
		curFourCount += (laiZiCount / 2);
		if (this.gameRule.longQiDuiScore && curFourCount == 1) {
			return gameProto.cardType.LONGQIDUI;
		} else if (this.gameRule.shuangLongQiDuiScore && curFourCount == 2) {
			return gameProto.cardType.SHUANGLONGQIDUI;
		} else if (this.gameRule.sanLongQiDuiScore && curFourCount == 3) {
			return gameProto.cardType.SANLONGQIDUI;
		} else {
			return gameProto.cardType.QIDUI
		}
	}

	//是否清一色
	isQingYiSe(cardList, operateList = []) {

		if (!this.gameRule.qingYiSeScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = cardList.concat(operateList[i].cardList);
		}
		return curList.every(item => this.getCardColor(item) == this.getCardColor(curList[0] && this.getCardColor(item) <= 2));
	}

	//是否混一色
	isHunYiSe(cardList, operateList = []) {

		if (!this.gameRule.hunYiSeScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = cardList.concat(operateList[i].cardList);
		}
		curList = curList.filter(item => item < CARDID.CARDID_DONG);
		return curList.every(item => this.getCardColor(item) == this.getCardColor(curList[0] && this.getCardColor(item) <= 2));
	}

	//是否字一色
	isZiYiSe(cardList, operateList = []) {


		if (!this.gameRule.ziYiSeScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = cardList.concat(operateList[i].cardList);
		}
		return curList.every(item => item >= CARDID.CARDID_DONG);
	}

	//是否大四喜
	isDaSiXi(cardList, operateList = []) {

		if (!this.gameRule.daSiXiScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = cardList.concat(operateList[i].cardList);
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
			curList = cardList.concat(operateList[i].cardList);
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
			curList = cardList.concat(operateList[i].cardList);
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
			curList = cardList.concat(operateList[i].cardList);
		}
		let fengCards = curList.filter(item => [CARDID.CARDID_ZHONG, CARDID.CARDID_FA, CARDID.CARDID_BAI].includes(item));
		if (fengCards.length >= 8) {
			return true;
		}
		return false;
	}

	//清幺九
	isQingYaoJiu(cardList, operateList = []) {

		if (!this.gameRule.qingYaoJiuScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = cardList.concat(operateList[i].cardList);
		}
		return curList.every(item => [1, 9].includes(this.getCardPoint(item)));
	}

	//混幺九
	isHunYaoJiu(cardList, operateList = []) {

		if (!this.gameRule.hunYaoJiuScore) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = cardList.concat(operateList[i].cardList);
		}
		return curList.every(item => item >= CARDID.CARDID_DONG || [1, 9].includes(this.getCardPoint(item)));
	}

	//是否是对对胡
	isDuiDuiHu(cardList, laiCount, operateList = []) {

		if (!this.gameRule.diHuScore) return false;
		if (operateList.filter(item => item.operate == gameProto.operateType.CHI)) {
			return false;
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
			if (cardCount[card] == 3) {
				kanList.push(card);
			}
			else if (cardCount[card] == 2 && laiCount > 0) {
				kanList.push(card);
				laiCount -= 1;
			} else if (cardCount[card] == 1 && laiCount > 0) {
				duiList.push(card);
				laiCount -= 1;
			} else {
				return false;
			}
		}
		if (duiList.length == 1 && (duiList.length * 2 + kanList.length * 3) == curCards.length) {
			return true;
		} else {
			return false;
		}
	}


	//判断是鸡胡还是胡
	getJiPingHu(cardList, laiZiCount) {

		let curCards = cardList.slice();
		if (curCards.length != 14) return gameProto.cardType.JIHU;
		let isCanHuNoKan = this.getCanHu(curCards, laiZiCount, true);
		if (isCanHuNoKan) {
			return gameProto.cardType.PINGHU;
		} else {
			return gameProto.cardType.JIHU;
		}
	}


	getUserHuScore(huType) {

		if (huType == gameProto.cardType.JIHU) {
			//鸡胡一分
			return 1;
		} else if (huType == gameProto.cardType.PINGHU) {
			//平胡两分
			return 2;
		} else if (huType == gameProto.cardType.QIDUI) {
			//七对胡分数
			let socre = this.gameRule.qiDuiRate;
			if (this.gameRule.playType == gameProto.playType.ZPTDH) {
				socre = this.gameRule.qiDuiScore;
			}
			return socre;
		} else if (huType == gameProto.cardType.QINGYISE) {
			//清一色分数
			let socre = this.gameRule.qingYiSeRate;
			if (this.gameRule.playType == gameProto.playType.ZPTDH) {
				socre = this.gameRule.qingYiSeScore;
			}
			return socre;
		} else if (huType == gameProto.cardType.SIGUIHU) {
			//四鬼胡分数
			let socre = this.gameRule.siGuiHuRate;
			if (this.gameRule.playType == gameProto.playType.ZPTDH) {
				socre = this.gameRule.siGuiHuScore;
			}
			return socre;
		} else if (huType == gameProto.cardType.SHISANYAO) {
			//十三妖
			return this.gameRule.shiSanYaoScore;
		} else if (huType == gameProto.cardType.PENGPENGHU) {
			//碰碰胡
			return this.gameRule.pengPengHuScore;
		} else if (huType == gameProto.cardType.HUNYISE) {
			//混一色
			return this.gameRule.hunYiSeScore;
		} else if (huType == gameProto.cardType.HUNPENG) {
			//混碰
			return this.gameRule.hunPengScore;
		} else if (huType == gameProto.cardType.LONGQIDUI) {
			//龙七对
			return this.gameRule.longQiDuiScore;
		} else if (huType == gameProto.cardType.XIAOSANYUAN) {
			//小三元
			return this.gameRule.xiaoSanYuanScore;
		} else if (huType == gameProto.cardType.XIAOSIXI) {
			//小四喜
			return this.gameRule.xiaoSiXiScore;
		} else if (huType == gameProto.cardType.QINGPENG) {
			//清碰
			return this.gameRule.qingPengScore;
		} else if (huType == gameProto.cardType.HUNYAOJIU) {
			//混幺九
			return this.gameRule.hunYaoJiuScore;
		} else if (huType == gameProto.cardType.DASANYAUN) {
			//大三元
			return this.gameRule.daSanYuanScore;
		} else if (huType == gameProto.cardType.DAXISI) {
			//大四喜
			return this.gameRule.daSiXiScore;
		} else if (huType == gameProto.cardType.ZIYISE) {
			//字一色
			return this.gameRule.ziYiSeScore;
		} else if (huType == gameProto.cardType.QINGYAOJIU) {
			//清幺九
			return this.gameRule.qingYaoJiuScore;
		} else if (huType == gameProto.cardType.QINGQIDUI) {
			//清七对
			return this.gameRule.qingQiDuiScore;
		} else if (huType == gameProto.cardType.TIANHU) {
			//天胡
			return this.gameRule.tianHuScore;
		} else if (huType == gameProto.cardType.DIHU) {
			//地胡
			return this.gameRule.diHuScore;
		} else if (huType == gameProto.cardType.SHUANGLONGQIDUI) {
			//双龙七对
			return this.gameRule.shuangLongQiDuiScore;
		} else if (huType == gameProto.cardType.SANLONGQIDUI) {
			//三龙七对
			return this.gameRule.sanLongQiDuiScore;
		} else if (huType == gameProto.cardType.SHIBALUOHAN) {
			//18罗汉
			return this.gameRule.shiBaLuoHanScore;
		} else {
			return 1;
		}

	}

	//获取玩家胡牌类型
	getUserHuType(uid, cardList, operateList, laiZiCount, operateRecords) {

		let huType = gameProto.cardType.NONE; //不能胡牌
		if (this.getCanHu(cardList, laiZiCount)) {

			//推倒胡规则判断
			if (this.gameRule.playType == gameProto.playType.TDH) {
				if (this.isShiSanYao(cardList, laiZiCount)) {
					//十三幺
					huType = gameProto.cardType.SHISANYAO;
					return huType;
				} else if (this.isQiDui(cardList, laiZiCount)) {
					//七对
					huType = gameProto.cardType.QIDUI;
					return huType;

				} else if (this.isQingYiSe(cardList, operateList)) {
					//清一色
					huType = gameProto.cardType.QINGYISE;
					return huType;
				} else if (laiZiCount >= 4) {
					huType = gameProto.cardType.SIGUIHU;
					return huType;
				}
				else {
					//判断鸡胡或者平胡
					huType = this.getJiPingHu(cardList, laiZiCount);
					return huType;
				}
			} else if (this.gameRule.playType == gameProto.playType.ZPTDH) {
				//做牌推倒胡规则

				//十八罗汉
				if (this.isShiBaLuoHan(cardList, operateList)) {
					huType = gameProto.cardType.SHIBALUOHAN;
					return huType;
				}

				//天胡
				if (uid == this.bankerUid && !operateRecords.some(item => item.operate == gameProto.operateType.QI)) {
					huType = gameProto.cardType.TIANHU;
					return huType;
				}
				//地胡
				if (uid != this.bankerUid && !operateRecords.some(item => item.uid == uid && item.operate == gameProto.operateType.QI)) {
					huType = gameProto.cardType.DIHU;
					return huType;
				}

				//十三幺
				if (this.isShiSanYao(cardList, laiZiCount)) {

					huType = gameProto.cardType.SHISANYAO;
					return huType;
				}
				//七对相关
				let quDuiType = this.isQiDui(cardList, laiZiCount);
				if (quDuiType) {

					if (this.gameRule.qingQiDuiScore && quDuiType == gameProto.cardType.QIDUI && this.isQingYiSe(cardList, operateList)) {
						huType = gameProto.cardType.QINGQIDUI;
						return huType;
					} else {
						huType = quDuiType;
						return huType;
					}
				}
				//清幺九
				if (this.isQingYaoJiu(cardList, operateList)) {
					huType = gameProto.cardType.QINGYAOJIU;
					return huType;
				}
				//字一色
				if (this.isZiYiSe(cardList, operateList)) {
					huType = gameProto.cardType.ZIYISE;
					return huType;
				}
				//大四喜
				if (this.isDaSiXi(cardList, operateList)) {
					huType = gameProto.cardType.DAXISI;
					return huType;
				}
				//大三元
				if (this.isDaSanYuan(cardList, operateList)) {
					huType = gameProto.cardType.DASANYAUN;
					return huType;
				}
				//混幺九
				if (this.isHunYaoJiu(cardList, operateList)) {
					huType = gameProto.cardType.HUNYAOJIU;
					return huType;
				}
				//清碰
				if (this.gameRule.qingPengScore && this.isQingYiSe(cardList, operateList) && this.isDuiDuiHu) {
					huType = gameProto.cardType.QINGPENG;
					return huType;
				}
				//小四喜
				if (this.isXiaoSiXi(cardList, operateList)) {
					huType = gameProto.cardType.XIAOSIXI;
					return huType;
				}
				//小三元
				if (this.isXiaoSanYuan(cardList, operateList)) {
					huType = gameProto.cardType.XIAOSANYUAN;
					return huType;
				}
				//混碰
				if (this.gameRule.hunPengScore && this.isHunYiSe(cardList, operateList) && this.isDuiDuiHu) {
					huType = gameProto.cardType.HUNPENG;
					return huType;
				}
				//清一色
				if (this.isQingYiSe(cardList, operateList)) {
					huType = gameProto.cardType.QINGYISE;
					return huType;
				}
				//混一色
				if (this.isHunYiSe(cardList, operateList)) {
					huType = gameProto.cardType.HUNYISE;
					return huType;
				}
				//碰碰胡
				if (this.isDuiDuiHu(cardList, operateList)) {
					huType = gameProto.cardType.PENGPENGHU;
					return huType;
				}
				//碰碰胡
				if (this.isDuiDuiHu(cardList, operateList)) {
					huType = gameProto.cardType.PENGPENGHU;
					return huType;
				}
				//四鬼胡
				if (laiZiCount >= 4) {
					huType = gameProto.cardType.SIGUIHU;
					return huType;
				}

				huType = this.getJiPingHu(cardList, laiZiCount);
				return huType;

			}
		}
		return huType;
	}






	/*-----------------------------------------aiLogic--------------------------------------------------*/

	//获取要打的牌
	getAiOutCards(handCards, laiZiCards, isSmart = false) {

		handCards = handCards.slice();
		if (!isSmart) {
			let cards = handCards[handCards.length - 1];
			return cards;
		}

		let laiZiCount = (handCards.filter(item => laiZiCards.includes(item))).length;
		handCards = handCards.filter(item => !laiZiCards.includes(item));
		//首先判断是否有打牌可以胡的
		let huList = [];
		for (let i = 0; i < handCards.length; i++) {

			let card = handCards[i];
			if (card == this.laiZiCards) continue;
			let curUserCards = handCards.slice();
			curUserCards.splice(i, 1);
			let tingList = this.getTingList(curUserCards, laiZiCount);
			if (tingList.length > 0) {
				huList.push({ card, count: tingList.length });
			}
		}

		if (huList.length > 0) {
			//胡一个张数最多的
			huList.sort((a, b) => { return b.count - a.count });
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

		//找出靠的牌
		let cardShunlist = [];
		let curCards = handCards.filter(item => item < 30 && item != laiZiCards);
		for (let i = 0; i < curCards.length; i++) {

			let card = curCards[i];
			let cardCount = (curCards.filter(item => item == card)).length;
			if (cardCount == 1) {
				//判断前后是否有牌
				let curCount = 0;
				let nextCard1 = card + 1;
				let baseWeight = 0;
				if (nextCard1 % 10 != 0) {

					let count = (curCards.filter(item => item == nextCard1)).length;
					if (count && nextCard1 != this.laiZiCards) {
						curCount += count + 1;
						baseWeight += 1;
					}
					let nextCard2 = card + 2;
					if (nextCard2 % 10 != 0) {
						count = (curCards.filter(item => item == nextCard2)).length;
						if (count && nextCard2 != this.laiZiCards) {
							curCount += count;
							if (baseWeight) {
								baseWeight += 1;
							}
						}
					}
					curCount += baseWeight;
				}
				baseWeight = 0;
				let beforeCard1 = card - 1;
				if (beforeCard1 % 10 != 0) {
					let count = (curCards.filter(item => item == beforeCard1)).length;
					if (count && beforeCard1 != this.laiZiCards) {
						curCount += count;
						baseWeight += 1;
					}
					let beforeCard2 = card - 2;
					if (beforeCard2 % 10 != 0) {
						count = (curCards.filter(item => item == beforeCard2)).length;
						if (count && beforeCard2 != this.laiZiCards) {
							curCount += count;
							if (baseWeight) {
								baseWeight += 1;
							}
						}
					}
					curCount += baseWeight;
				}
				cardShunlist.push({ card, count: curCount });
			} else {
				cardShunlist.push({ card, count: cardCount * 10 });
			}
		}
		cardShunlist.sort((a, b) => (b.card % 10) - (a.count % 10));
		cardShunlist.sort((a, b) => a.count - b.count);
		return cardShunlist[0].card;
	}


	//判断用户的基础操作 吃 碰 杠 胡等
	getAiUserOperate(operateArray, handCards, laiZiCards, isSmart = false) {


		if (!isSmart) {
			//有过就过
			let operate = operateArray.find(item => item.type == gameProto.operateType.GUO);
			if (operate) {
				//过操作
				let curOperate = { operate: gameProto.operateType.GUO };
				return curOperate;
			}
			//弃牌
			operate = operateArray.find(item => item.type == gameProto.operateType.QI);
			if (operate) {
				let card = this.getAiOutCards(handCards, laiZiCards, isSmart);
				//打牌操作
				let curOperate = { operate: gameProto.operateType.QI, card: card };
				return curOperate;
			}
		}

		//判断是否有胡
		let huList = [gameProto.operateType.HU_CHI, gameProto.operateType.HU_QIANG, gameProto.operateType.HU_ZHI];
		let operate = operateArray.find(item => huList.includes(item.type));
		if (operate) {
			//有胡就胡拉
			let curOperate = { operate: operate.type, card: operate.card };
			return curOperate;
		}
		//判断有杠没有
		let gangOperate = [gameProto.operateType.GANG_ZHI, gameProto.operateType.GANG_CHI, gameProto.operateType.GANG_BU];
		operate = operateArray.find(item => gangOperate.includes(item.type));
		if (operate) {
			//有杠就杠拉
			let curOperate = { operate: operate.type, card: operate.card, cardList: operate.cardList };
			return curOperate;
		}
		//碰
		operate = operateArray.find(item => item.type == gameProto.operateType.PENG);
		if (operate) {
			//有碰就碰拉
			let curOperate = { cardList: operate.cardList, operate: operate.type, card: operate.card };
			return curOperate;
		}
		operate = operateArray.find(item => item.type == gameProto.operateType.CHI);
		if (operate && !handCards.includes(operate.card)) {
			//有吃就吃拉
			let curOperate = { operate: operate.type, card: operate.card, cardList: operate.cardList };
			return curOperate;
		}
		//其他就过啦
		operate = operateArray.find(item => item.type == gameProto.operateType.GUO);
		if (operate) {
			//过操作
			let curOperate = { operate: gameProto.operateType.GUO };
			return curOperate;
		}
		//弃牌
		operate = operateArray.find(item => item.type == gameProto.operateType.QI);
		if (operate) {
			let card = this.getAiOutCards(handCards, laiZiCards, isSmart);
			//打牌操作
			let curOperate = { operate: gameProto.operateType.QI, card: card };
			return curOperate;
		}

	}
}


module.exports = new GameLogic();