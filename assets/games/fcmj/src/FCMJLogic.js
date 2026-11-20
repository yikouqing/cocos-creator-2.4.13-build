let gameProto = require('./ApiFcmj');

let CARDID = {
	CARDID_WAN1: 1, CARDID_WAN2: 2, CARDID_WAN3: 3, CARDID_WAN4: 4, CARDID_WAN5: 5, CARDID_WAN6: 6, CARDID_WAN7: 7, CARDID_WAN8: 8, CARDID_WAN9: 9,
	CARDID_TONG1: 11, CARDID_TONG2: 12, CARDID_TONG3: 13, CARDID_TONG4: 14, CARDID_TONG5: 15, CARDID_TONG6: 16, CARDID_TONG7: 17, CARDID_TONG8: 18, CARDID_TONG9: 19,
	CARDID_TIAO1: 21, CARDID_TIAO2: 22, CARDID_TIAO3: 23, CARDID_TIAO4: 24, CARDID_TIAO5: 25, CARDID_TIAO6: 26, CARDID_TIAO7: 27, CARDID_TIAO8: 28, CARDID_TIAO9: 29,
	CARDID_DONG: 31, CARDID_NAN: 32, CARDID_XI: 33, CARDID_BEI: 34, CARDID_ZHONG: 35, CARDID_FA: 36, CARDID_BAI: 37,
	CARDID_CHUN: 41, CARDID_XIA: 42, CARDID_QIU: 43, CARDID_DON: 44, CARDID_MEI: 45, CARDID_LAN: 46, CARDID_ZHU: 47, CARDID_JU: 48,
};
class GameLogic {

	initRule(gameRule) {
		this.tingCards = [];
		this.gameRule = gameRule;
		this.allCards = this.initBaseCards(); //所有的卡牌
		this.cards = []; //卡牌列表
		// this.aiLogic = new AiLogic(gameRule);
	}

	//初始化所有卡牌
	initBaseCards() {

		let cards = [];

		//添加万字
		for (let k = CARDID.CARDID_WAN1; k <= CARDID.CARDID_WAN9; k++) {
			cards.push(k, k, k, k);
		}

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
		for (let k = CARDID.CARDID_DONG; k <= CARDID.CARDID_BEI; k++) {
			cards.push(k, k, k, k);
		}

		//初始化听牌列表
		this.tingCards = Array.from(new Set(cards.slice()));
		//听牌不包含花牌
		this.tingCards = this.tingCards.filter(item => item < CARDID.CARDID_CHUN);
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
			if (cardIndex != -1) {
				curCards.splice(cardIndex, 1);
			}
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

	//东南西北 中发白
	getTeShuGang(cardCount) {

		let teShuList = [];

		//添加中发白
		let curZhongList = [];
		for (let k = CARDID.CARDID_ZHONG; k <= CARDID.CARDID_BAI; k++) {
			if (cardCount[k] > 0) {
				curZhongList.push(k);
			}
		}
		if (curZhongList.length == 3) {
			teShuList.push(curZhongList);
		}
		//填加东南西北
		let curDongList = [];
		for (let k = CARDID.CARDID_DONG; k <= CARDID.CARDID_BEI; k++) {
			if (cardCount[k] > 0) {
				curDongList.push(k);
			}
		}
		if (curDongList.length == 4) {
			teShuList.push(curDongList);
		}
		return teShuList;
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
		let gameHuaCards = [];
		//添加花牌
		for (let k = CARDID.CARDID_CHUN; k <= CARDID.CARDID_JU; k++) {
			gameHuaCards.push(k);
		}

		if (this.gameRule.huaCount == 15) {
			//加白板
			gameHuaCards.push(CARDID.CARDID_BAI);
		}
		if (this.gameRule.huaCount == 23) {
			//加中发白
			gameHuaCards.push(CARDID.CARDID_ZHONG, CARDID.CARDID_FA, CARDID.CARDID_BAI);
		}

		//let exceptList = [35, 36, 37, 41, 42, 43, 44, 45, 46, 47, 48];
		let card = this.getCards(1)[0];
		let fanCard = card;
		//万条同
		if (card < 30) {
			if (card % 10 == 9) {
				let laiCard = card - 8;
				laiZiCards = [laiCard];
			} else {
				let laiCard = card + 1;
				laiZiCards = [laiCard];
			}
			//翻牌为花牌
			gameHuaCards.push(fanCard);

		} else if (gameHuaCards.includes(fanCard)) {
			//如果翻到本身就是花牌
			laiZiCards = [CARDID.CARDID_DONG];
			gameHuaCards.push(CARDID.CARDID_BEI);
		}
		else if (card == CARDID.CARDID_ZHONG) {
			//中发
			laiZiCards = [CARDID.CARDID_FA];
			gameHuaCards.push(CARDID.CARDID_ZHONG);
		}
		else if (card == CARDID.CARDID_FA) {
			//发百
			laiZiCards = [CARDID.CARDID_BAI];
			gameHuaCards.push(CARDID.CARDID_FA);
		} else if (card == CARDID.CARDID_BAI) {
			//百中
			laiZiCards = [CARDID.CARDID_ZHONG];
			gameHuaCards.push(CARDID.CARDID_BAI);
		}
		else if (card >= CARDID.CARDID_DONG && card <= CARDID.CARDID_BEI) {
			//东南西北
			if (card == CARDID.CARDID_BEI) {
				laiZiCards = [CARDID.CARDID_DONG];
			} else {
				let laiCard = card + 1;
				laiZiCards = [laiCard];
			}
			//翻牌为花牌
			gameHuaCards.push(fanCard);
		}



		return { fanCard, laiZiCards, gameHuaCards };
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
			if (cardIndex != -1) {
				allCards.splice(cardIndex, 1);
			}
		}
		return allCards.slice();
	}


	/*-----------------------------------胡牌算法-----------------------------------------*/



	//新增胡牌的基础判断
	checkCardCanHu(cards, laiziCount = 0, operateList = []) {


		let huCard = cards[cards.length - 1];


		let teShuList = cards.slice().sort((a, b) => a - b);

		teShuList = teShuList.map(item => { return this.getCardPoint(item) });
		if (teShuList.join("") == '11122233377789' && this.getCardPoint(huCard) == 3) {
			return false;
		}

		//清一色不受胡牌限制
		let isQingYiSe = this.isQingYiSe(cards, operateList);
		// if (isQingYiSe) {
		// 	return true;
		// }

		//七对不受胡牌限制
		if (this.isQiDui(cards, laiziCount)) {
			return true;
		}

		/* --------------其余牌型会受胡牌限制-------------- */

		//不能缺门，必须要条筒万三门齐全
		let curList = cards.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}

		//万条同不能缺
		let huaCards = curList.filter(item => item <= CARDID.CARDID_TIAO9);
		let huaList = [];
		for (let i = 0; i < huaCards.length; i++) {
			let curHua = this.getCardColor(huaCards[i]);
			if (!huaList.includes(curHua)) {
				huaList.push(curHua);
			}
		}
		if (!isQingYiSe && huaList.length < 3) {
			return false;
		}

		//必须有刻子
		let keOperate = [gameProto.operateType.GANG_BU, gameProto.operateType.GANG_CHI, gameProto.operateType.GANG_ZHI, gameProto.operateType.PENG];
		let haveKe = operateList.find(item => keOperate.includes(item.operate));
		//没有吃碰杠 看手牌有没有
		if (!haveKe) {

			let cardCount = {};
			let curCards = cards.slice();
			for (let i = 0; i < curCards.length; i++) {
				let curCard = curCards[i];
				if (!cardCount[curCard]) {
					cardCount[curCard] = 0;
				}
				cardCount[curCard] += 1;
			}
			let isHaveKe = false;

			for (let key in cardCount) {

				key = parseInt(key);
				if (cardCount[key] >= 3) {
					let huList = curCards.filter(item => item != key);
					if (cardCount[key] == 4) {
						//4个的时候放一个进去
						huList.push(key);
					}
					if (this.checkCanHu(huList, 0)) {
						isHaveKe = true;
					}
				}
				else if ([CARDID.CARDID_ZHONG, CARDID.CARDID_BAI, CARDID.CARDID_FA].includes(key)) {
					if (cardCount[key] >= 2) {
						isHaveKe = true;
					} else if (cardCount[key] == 1) {
						//只有一个单调也可以
						let huCards = cards.slice();
						huCards.push(key);
						if (this.checkCanHu(huCards, 0)) {
							isHaveKe = true;
						}
					}
				}
			}
			//如果都没有刻 则不能胡
			if (!isHaveKe) {
				return false;
			}
		}

		//判断是否有幺九
		let yaoJiuList = curList.slice();
		let youJiuIndex = yaoJiuList.findIndex(item => item == huCard);
		if (youJiuIndex != -1) {
			yaoJiuList.splice(youJiuIndex, 1)
		}
		let have19 = yaoJiuList.filter(item => item > CARDID.CARDID_TIAO9 || [1, 9].includes(this.getCardPoint(item)))

		if (have19.length == 0) {
			if (![1, 9].includes(this.getCardPoint(huCard))) {
				return false;
			} else {
				//19死胡算夹胡
				return true;
			}
		}

		//对对胡限制
		let isPiaoHu = this.isDuiDuiHu(cards, laiziCount, operateList);
		if (isPiaoHu) {
			return true;
		}

		//边胡
		let bianCard1 = 0;
		let bianCard2 = 0;
		if (this.getCardPoint(huCard) == 3) {
			bianCard1 = huCard - 1;
			bianCard2 = huCard - 2;
		}
		if (this.getCardPoint(huCard) == 7) {
			bianCard1 = huCard + 1;
			bianCard2 = huCard + 2;
		}

		//包含边胡
		let bianList = cards.slice();
		if (bianList.includes(bianCard1) && bianList.includes(bianCard2)) {
			let huIndex = bianList.findIndex(item => item == huCard);
			if (huIndex != -1) {
				bianList.splice(huIndex, 1);
			}
			let beforeIndex = bianList.findIndex(item => item == bianCard1);
			if (beforeIndex != -1) {
				bianList.splice(beforeIndex, 1);
			}
			let nextIndex = bianList.findIndex(item => item == bianCard2);
			if (nextIndex != -1) {
				bianList.splice(nextIndex, 1);
			}
			if (this.checkCanHu(bianList, 0)) {
				return true;
			}
		}

		//夹胡
		let beforeCard1 = huCard - 1;
		let nextCard1 = huCard + 1;
		//包含夹胡
		let jiaList = cards.slice();
		if (jiaList.includes(beforeCard1) && jiaList.includes(nextCard1)) {
			let huIndex = jiaList.findIndex(item => item == huCard);
			if (huIndex != -1) {
				jiaList.splice(huIndex, 1);
			}
			let beforeIndex = jiaList.findIndex(item => item == beforeCard1);
			if (beforeIndex != -1) {
				jiaList.splice(beforeIndex, 1);
			}
			let nextIndex = jiaList.findIndex(item => item == nextCard1);
			if (nextIndex != -1) {
				jiaList.splice(nextIndex, 1);
			}
			if (this.checkCanHu(jiaList, 0)) {
				return true;
			}
		}


		//测试单吊
		let diaoList = cards.slice();
		let huIndex = diaoList.findIndex(item => item == huCard);
		if (huIndex != -1) {
			diaoList.splice(huIndex, 1);
		}
		let otherIndex = diaoList.findIndex(item => item == huCard);
		if (otherIndex != -1) {
			diaoList.splice(otherIndex, 1);
			diaoList.sort((a, b) => a - b);
			if (this.isShunKan(diaoList, 0)) {
				return true;
			}
		}

		return false;


	}

	checkCanHu(cards, laiziCount = 0, isKan = false) {

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



	//是否可以胡基础牌型
	getCanHu(cards, laiziCount = 0, operateList) {

		if (!this.checkCardCanHu(cards, laiziCount, operateList)) return false;

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
				if (this.isShunKan(curCards, curLaizi, false)) {
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
	getTingList(cards, laiziCount, operateList) {

		cards = cards.slice();
		let tingList = [];
		this.tingCards.map(item => {
			let curCards = cards.slice();
			curCards.sort((a, b) => { return a - b })
			curCards.push(item);
			if (this.getCanHu(curCards, laiziCount, operateList)) {
				tingList.push({ cardID: item, rate: 1 });
			}
		});
		return tingList;
	}

	/*-------------------------------------牌型判断-------------------------------------------------*/


	//是否七对
	isQiDui(cardList, laiZiCount = 0) {


		if (!this.gameRule.qiDui) return false;
		if (cardList.length + laiZiCount != 14) return false;
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

		if (!this.gameRule.qingYiSe) return false;
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		curList = curList.filter(item => item <= CARDID.CARDID_TIAO9);
		let isQiYiSes = curList.every(item => this.getCardColor(item) == this.getCardColor(curList[0]) && this.getCardColor(item) <= 2);
		return isQiYiSes;
	}

	//是否独门吊
	isDuMenDiao(cardList, operateList, huCard) {

		let curList = cardList.slice();
		if (huCard) {
			let huIndex = curList.findIndex(item => item == huCard);
			if (huIndex != -1) {
				curList.splice(huIndex, 1);
			}
		}
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}

		let huaCards = curList.filter(item => item <= CARDID.CARDID_TIAO9);
		let huaList = {};
		for (let i = 0; i < huaCards.length; i++) {
			let curHua = this.getCardColor(huaCards[i]);
			huaList[curHua] = (huaList[curHua] || 0) + 1;
		}
		let haveOne = false;
		for (let key in huaList) {
			if (huaList[key] == 1) {
				haveOne = true;
			}
		}
		return haveOne;
	}

	//是否边胡
	isBianHu(cardList, huCard, operateList, laiziCount = 0) {

		let curList = cardList.slice();

		//死胡19算边胡
		if (laiziCount == 1 || huCard && [1, 9].includes(this.getCardPoint(huCard))) {
			let myList = cardList.slice();

			if (laiziCount == 0) {
				let youJiuIndex = myList.findIndex(item => item == huCard);
				if (youJiuIndex != -1) {
					myList.splice(youJiuIndex, 1)
				}
			}
			for (let i = 0; i < operateList.length; i++) {
				myList = myList.concat(operateList[i].plusInfo.cardList);
			}
			let have19 = myList.filter(item => item > CARDID.CARDID_TIAO9 || [1, 9].includes(this.getCardPoint(item)));
			if (have19.length == 0) {
				return true;
			}
		}

		if (huCard && laiziCount == 0) {
			let huIndex = curList.findIndex(item => item == huCard);
			if (huIndex != -1) {
				curList.splice(huIndex, 1);
			}
		}
		let tingList = this.getTingList(curList, 0, operateList);
		let bianCard = tingList.find(item => item.cardID <= CARDID.CARDID_TIAO9 && [3, 7].includes(this.getCardPoint(item.cardID)));
		if (bianCard) {

			//如果是3 则是123 如果是7 则是789
			let curCard = bianCard.cardID;
			if (laiziCount == 0 && huCard && huCard != curCard) {
				//多个胡牌 没有胡边上的那个
				return false;
			}

			let nextCard1 = 0;
			let nextCard2 = 0;

			if (this.getCardPoint(curCard) == 3) {
				nextCard1 = curCard - 1;
				nextCard2 = curCard - 2;
			} else if (this.getCardPoint(curCard) == 7) {
				nextCard1 = curCard + 1;
				nextCard2 = curCard + 2;
			}
			if (curList.find(item => item == nextCard1) && curList.find(item => item == nextCard2)) {
				let beforeIndex = curList.findIndex(item => item == nextCard1);
				if (beforeIndex != -1) {
					curList.splice(beforeIndex, 1);
				}
				let nextIndex = curList.findIndex(item => item == nextCard2);
				if (nextIndex != -1) {
					curList.splice(nextIndex, 1);
				}
				return this.checkCanHu(curList);
			} else {
				return false;
			}

		} else if (tingList.length == 1 && tingList.every(item => item.cardID >= CARDID.CARDID_ZHONG)) {
			//单调中发白
			let curCard = tingList[0].cardID;
			//有吃碰杠灯不算
			let haveKan = [gameProto.operateType.PENG, gameProto.operateType.GANG_CHI, gameProto.operateType.GANG_CHI, gameProto.operateType.GANG_BU];
			if (operateList.find(item => haveKan.includes(item.operate))) {
				return false;
			}
			//手里有三个的不算
			let cardCount = {};
			for (let i = 0; i < curList.length; i++) {
				let curCard = curList[i];
				if (!cardCount[curCard]) {
					cardCount[curCard] = 0;
				}
				cardCount[curCard] += 1;
			}
			let isHaveKan = false;
			for (let key in cardCount) {
				if (cardCount[key] >= 3) {
					isHaveKan = true;
				}
			}
			if (isHaveKan) {
				return false;
			}
			return this.isDanDiao(curList, curCard, 0);

		} else {
			return false;
		}
	}




	//是否单调
	isDanDiao(cardList, huCard, laiCount) {

		let diaoList = cardList.slice();
		let huIndex = diaoList.findIndex(item => item == huCard);
		if (huIndex != -1) {
			diaoList.splice(huIndex, 1);
		}
		if (laiCount >= 1) {
			//有癞子 判断胡的牌 有没有单吊的
			let curDanDiao = false;
			for (let i = 0; i < diaoList.length; i++) {
				let curList = diaoList.slice();
				curList.splice(i, 1);
				curList.sort((a, b) => a - b);
				if (this.isShunKan(curList, 0)) {
					curDanDiao = true;
					break;
				}
			}
			return curDanDiao;
		}
		else {

			let otherIndex = diaoList.findIndex(item => item == huCard);
			if (otherIndex != -1) {
				diaoList.splice(otherIndex, 1);
			}
			diaoList.sort((a, b) => a - b);
			if (this.isShunKan(diaoList, 0)) {
				return true;
			} else {
				return false;
			}
		}

	}





	//是否是对对胡
	isDuiDuiHu(cardList, laiCount, operateList = []) {

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
			}
			else if (cardCount[card] == 2 && laiCount > 0) {
				kanList.push(card);
				laiCount -= 1;
			} else if (cardCount[card] == 2 && laiCount <= 0) {
				duiList.push(card);
			}
			else if (cardCount[card] == 1 && laiCount > 0) {
				duiList.push(card);
				laiCount -= 1;
			} else if (cardCount[card] == 1 && laiCount <= 0) {
				return false;
			}
		}
		if (duiList.length == 1 || (duiList.length == 0 && laiCount >= 2)) {
			return true;
		} else {
			return false;
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