let gameProto = require('./ApiPzhmj');

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
		if (this.gameRule.queYiMen != 1) {
			for (let k = CARDID.CARDID_WAN1; k <= CARDID.CARDID_WAN9; k++) {
				cards.push(k, k, k, k);
			}
		}

		if (this.gameRule.queYiMen != 2) {
			//添加筒子
			for (let k = CARDID.CARDID_TONG1; k <= CARDID.CARDID_TONG9; k++) {
				cards.push(k, k, k, k);
			}
		}

		if (this.gameRule.queYiMen != 3) {
			for (let k = CARDID.CARDID_TIAO1; k <= CARDID.CARDID_TIAO9; k++) {
				cards.push(k, k, k, k);
			}
		}

		//添加中发白
		// for (let k = CARDID.CARDID_ZHONG; k <= CARDID.CARDID_BAI; k++) {
		// 	cards.push(k, k, k, k);
		// }

		// //填加字牌
		// for (let k = CARDID.CARDID_DONG; k <= CARDID.CARDID_BEI; k++) {
		// 	cards.push(k, k, k, k);
		// }

		//初始化听牌列表
		this.tingCards = Array.from(new Set(cards.slice()));
		//听牌不包含花牌
		//this.tingCards = this.tingCards.filter(item => item < CARDID.CARDID_CHUN);
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

	//获取卡牌颜色
	getCardColor(card) {

		return parseInt(card / 10);
	}

	//获取卡牌值
	getCardPoint(card) {

		return parseInt(card % 10);
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


	//获取花色
	getColorCount(cards, operateList) {

		let curCards = cards.concat(this.getAllHandCards(operateList));
		let list = [];
		for (let i = 0; i < curCards.length; i++) {
			let colorCard = curCards[i];
			let curColor = this.getCardColor(colorCard);
			if (!list.includes(curColor)) {
				list.push(curColor);
			}
		}
		return list.length;
	}


	/*-----------------------------------胡牌算法-----------------------------------------*/

	//是否可以胡基础牌型
	getCanHu(cards, laiziCount = 0, operateList = []) {


		if (this.gameRule.queType == 1) {
			let colorCount = this.getColorCount(cards, operateList);
			if (colorCount >= 3) {
				return false;
			}
		}

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


	//判断摆牌后的胡牌
	getBaiPaiHuCards(cardList, baiPai) {


		let curCardList = cardList.slice();


		let baiPaiList = baiPai.slice();
		baiPaiList.sort((a, b) => { return a - b });
		let isInList = true;
		for (let i = 0; i < baiPaiList.length; i++) {

			let baiPaiCard = baiPaiList[i];
			let curIndex = curCardList.findIndex(item => item == baiPaiCard);
			if (curIndex >= 0) {
				curCardList.splice(curIndex, 1);
			} else {
				isInList = false;
				break;
			}
		}
		//如果摆牌手牌错误
		if (!isInList) {
			return [];
		}

		//开始判断胡牌 一张为单调或者七对
		if (baiPaiList.length == 1) {
			//剩下的牌时顺坎 则为单调胡牌
			if (this.isShunKan(curCardList)) {
				//单调胡摆牌
				return baiPaiList.slice();
			}
			//判断七对
			let qiDuiList = cardList.slice();
			qiDuiList = qiDuiList.concat(baiPaiList);
			let isQiDui = this.isQiDui(qiDuiList);
			if (isQiDui) {
				return baiPaiList.slice();
			}
		}

		//两张为对对胡或者端胡或者卡卡胡
		if (baiPaiList.length == 2) {
			//剩下的牌为可胡牌类型
			let card1 = baiPaiList[0];
			let card2 = baiPaiList[1];
			if (this.getCanHu(curCardList)) {
				//如果是对对胡
				if (card1 == card2) {
					let huCards = [card1];
					return huCards;
				} else {
					//必须相同花色 
					if (this.getCardType(card1) == this.getCardType(card2)) {
						//挨着的端胡
						if (card2 - card1 == 1) {
							let qianCard = card1 - 1;
							let houCard2 = card2 + 1;
							let huCards = [];
							if (this.getCardNumber(qianCard) >= 1 && this.getCardNumber(qianCard) <= 9) {
								huCards.push(qianCard);
							}
							if (this.getCardNumber(houCard2) >= 1 && this.getCardNumber(houCard2) <= 9) {
								huCards.push(houCard2);
							}
							return huCards;

						} else if (card2 - card1 == 2) {
							//卡卡胡
							let huCards = [card1 + 1];
							return huCards;
						}
					}
				}
			}
		}

		//特殊牌型 七对和普通牌型兼容
		if ((baiPaiList.length + 1) % 3 == 0) {

			let huCards = [];
			let tingList = this.getTingList(cardList.slice());
			let isCanBai = false;
			for (let i = 0; i < tingList.length; i++) {
				let curCard = tingList[i].cardID;
				huCards.push(curCard);
				let myBaiPaiList = baiPaiList.concat([curCard]);
				if (this.getCanHu(curCardList) && this.isShunKan(myBaiPaiList)) {
					isCanBai = true;
				}
			}
			if (isCanBai) {
				return huCards;
			} else {
				return [];
			}
		}



		//不能摆牌的数据
		let canNotBai = [3, 6, 9, 11, 12];
		if (canNotBai.includes(baiPaiList.length)) {
			return [];
		}

		//4张为 对对胡和端胡
		let huBai = [4, 7, 10, 13];
		if (huBai.includes(baiPaiList.length)) {

			//剩下的为顺坎
			if (this.isShunKan(curCardList)) {
				let tingList = this.getTingList(baiPaiList);
				let huCards = [];
				for (let i = 0; i < tingList.length; i++) {
					huCards.push(tingList[i].cardID);
				}
				//处理[12,12,16,16,18,18,18]的情况
				if (this.isDuiDui(curCardList)) {
					for (let i = 0; i < baiPaiList.length; i++) {
						let curLeft = baiPaiList.concat([baiPaiList[i]]);
						if (this.isDuiDui(curLeft) && !huCards.includes(baiPaiList[i])) {
							huCards.push(baiPaiList[i])
						}
					}
				}
				return huCards;
			} else {
				return [];
			}
		} else {
			return [];
		}

	}


	//判断是否全对
	isDuiDui(cards) {

		let isDuiDui = true;
		let curCards = cards.slice();
		let cardTypeList = {};
		curCards.forEach((item) => {
			if (!cardTypeList[item]) {
				cardTypeList[item] = 0;
			}
			cardTypeList[item] += 1;
		});

		for (let cardType in cardTypeList) {
			if (cardTypeList[cardType] % 2 != 0) {
				break;
			}
		}
		return isDuiDui;

	}

	//获取听牌列表
	getTingList(cards, laiziCount, operateList) {

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

		//if (!this.gameRule.qiDui) return false;
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
		if (curFourCount >= 2) {
			//龙凤对
			return gameProto.cardType.LONGFENGDUI;
		} else if (curFourCount == 1) {
			//龙七对
			return gameProto.cardType.LONGQIDUI;
		} else {
			//七对
			return gameProto.cardType.QIDUI
		}
	}

	//是否清一色
	isQingYiSe(cardList, operateList = []) {

		//if (!this.gameRule.qingYiSe) return false;
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
			curList.splice(huIndex, 1);
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
			diaoList.splice(otherIndex, 1);
			diaoList.sort((a, b) => a - b);
			if (this.isShunKan(diaoList, 0)) {
				return true;
			} else {
				return false;
			}
		}
	}

	//判断是否压档(卡5)
	isKaWu(cards, huCard) {

		if (this.getCardNumber(huCard) != 5) {
			return false;
		}

		let curCards = cards.slice();

		//移除胡牌
		let huIndex = curCards.findIndex(item => item == huCard);
		curCards.splice(huIndex, 1);

		//夹胡
		let beforeCard1 = huCard - 1;
		let nextCard1 = huCard + 1;

		//包含夹胡
		let jiaList = curCards.slice();
		if (jiaList.includes(beforeCard1) && jiaList.includes(nextCard1)) {
			// let huIndex = jiaList.findIndex(item => item == huCard);
			// jiaList.splice(huIndex, 1);
			let beforeIndex = jiaList.findIndex(item => item == beforeCard1);
			jiaList.splice(beforeIndex, 1);
			let nextIndex = jiaList.findIndex(item => item == nextCard1);
			jiaList.splice(nextIndex, 1);
			if (this.getCanHu(jiaList)) {
				return true;
			}
		} else {
			return false;
		}


		let tingList = this.getTingList(curCards);
		//胡牌只有一个
		if (tingList.length == 1) {
			if (curCards.includes(huCard)) {
				//单调胡牌不算压档
				let curIndex = curCards.findIndex(item => item == huCard);
				curCards.splice(curIndex, 1);
				//如果剩下的是顺坎则不是压档
				if (this.isShunKan(curCards)) {
					return false;
				} else {
					return true;
				}
			} else {
				//不包含则不是单调 则是压档
				return true;
			}
		} else {
			return false;
		}
	}


	//判断一条龙
	isYiTiaoLong(cards) {

		if (cards.length < 11) {
			return false;
		}

		let curCards = cards.slice();
		//判断是否有万字一条龙
		let wanList = [1, 2, 3, 4, 5, 6, 7, 8, 9];
		if (utils.isInList(wanList, curCards)) {
			//去除指定牌看还能胡不
			return this.isHuExceptCards(cards, wanList);
		}
		//筒一条龙
		let tongList = [11, 12, 13, 14, 15, 16, 17, 18, 19];
		if (utils.isInList(tongList, curCards)) {
			return this.isHuExceptCards(cards, tongList);
		}
		//条一条龙
		let tiaoList = [21, 22, 23, 24, 25, 26, 27, 28, 29];
		if (utils.isInList(tiaoList, curCards)) {
			return this.isHuExceptCards(cards, tiaoList);
		}
		return false;

	}

	//是否是将大对
	isJiangDaDui(cardList, laiCount, operateList = []) {


		//将大队必须是对对胡
		if (this.isDuiDuiHu(cardList, laiCount, operateList)) {
			let curList = cardList.slice();
			for (let i = 0; i < operateList.length; i++) {
				curList = curList.concat(operateList[i].plusInfo.cardList);
			}
			curList = curList.filter(item => item <= CARDID.CARDID_TIAO9);
			return curList.every(item => [2, 5, 8].includes(this.getCardNumber(item)));
		} else {
			return false
		}
	}


	//判断是否幺九
	isYaoJiu(cards, operateList = []) {

		let curCards = cards.slice();
		let allCards = this.getAllHandCards(operateList);
		//如果包含456
		if (curCards.some(item => [4, 5, 6].includes(this.getCardNumber(item)))) {
			return false;
		}
		//如果包含其他牌
		if (allCards.some(item => ![1, 9].includes(this.getCardNumber(item)))) {
			return false;
		}
		//判断将或者没看牌都是幺九
		return this.isBaseYaoJiu(cards);
	}

	getAllHandCards(operateList = []) {

		let curCards = [];
		let curOperate = [gameProto.operateType.GANG_BU, gameProto.operateType.GANG_CHI, gameProto.operateType.GANG_ZHI];
		//杠的卡牌
		let cardList = operateList.filter(item => curOperate.includes(item.operate));
		for (let i = 0; i < cardList.length; i++) {
			let curList = cardList[i].plusInfo.cardList;
			curCards = curCards.concat(curList);
		}
		//碰的卡牌
		let pengList = operateList.filter(item => { return item.operate == gameProto.operateType.PENG && !cardList.some(curItem => { return curItem.card == item.card }) });
		for (let i = 0; i < pengList.length; i++) {
			let curList = pengList[i].plusInfo.cardList;
			curCards = curCards.concat(curList);
		}
		return curCards;
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
			} else if (cardCount[card] == 2 && laiCount == 0) {
				duiList.push(card);
			}
			else if (cardCount[card] == 1 && laiCount > 0) {
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


	//是否基础的幺九
	isBaseYaoJiu(cards, laiziCount = 0) {

		if ((cards.length + laiziCount + 1) % 3 != 0) return false;
		cards.sort((a, b) => { return a - b; })
		for (let i = 0; i < cards.length; i++) {

			if (i > 0 && cards[i] == cards[i - 1]) continue;
			if (![1, 9].includes(this.getCardNumber(cards[i]))) continue;

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
				if (this.isShunKan(curCards, curLaizi)) {
					return true;
				}
			}
		}
		if (laiziCount >= 2 && this.isShunKan(cards, laiziCount - 2)) {
			// 两个癞子做将牌特殊判定处理  
			return true;
		}
		return false;

	}

	isYaoJiuShunKan(cards, laiziCount = 0) {

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
				let curList = [];
				for (let i = 0; i < 3; i++) {

					let deletePos = curCards.indexOf(first + i);
					if (deletePos >= 0) {
						let delCard = curCards.splice(deletePos, 1); //原卡牌踢出顺子数据
						curList.push(delCard);
					} else {
						curLaizi -= 1; //没有的时候使用癞子替换
					}
				}
				if (!curList.some(item => [1, 9].includes(item))) {
					return false;
				}
				//判断剩下的牌是否成顺坎
				if (this.isYaoJiuShunKan(curCards, curLaizi, isKan)) {
					return true;
				}
			}
		}

		//判断坎
		let keziCard = cards[0];
		let keziCount = (cards.filter(item => item == keziCard)).length;

		if ((keziCount === 3 || keziCount + laiziCount >= 3)) {

			if (![1, 9].includes(this.getCardNumber(keziCard))) {
				return false;
			}
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
			if (this.isYaoJiuShunKan(curCards, curLaizi, isKan)) {
				return true;
			}
		}
		return false;

	}



	/*-----------------------------------------aiLogic--------------------------------------------------*/

	//获取要打的牌
	getAiOutCards(handCards, laiZiCards, isSmart = false, huCards = [], colorList) {

		handCards = handCards.slice();
		if (!isSmart) {
			let cards = handCards[handCards.length - 1];
			return cards;
		}

		let laiZiCount = (handCards.filter(item => laiZiCards.includes(item))).length;
		handCards = handCards.filter(item => !laiZiCards.includes(item));
		//不要打胡牌
		handCards = handCards.filter(item => item < 30 && !huCards.includes(item));
		//如果手上全是炮牌只能打了
		if (handCards.length == 0) {
			return handCards[handCards.length - 1];
		}

		//如果是必缺 机器人就要打少的一边
		if (this.gameRule.queType == 1) {

			let countList = [];
			if (!colorList.includes(0)) {
				let curWan = handCards.filter(item => this.getCardColor(item) == 0);
				if (curWan.length > 0) {
					countList.push({ type: 0, count: curWan.length });
				}

			}
			if (!colorList.includes(1)) {
				let curTong = handCards.filter(item => this.getCardColor(item) == 1);
				if (curTong.length > 0) {
					countList.push({ type: 1, count: curTong.length });
				}
			}
			if (!colorList.includes(2)) {
				let curTiao = handCards.filter(item => this.getCardColor(item) == 2);
				if (curTiao.length > 0) {
					countList.push({ type: 2, count: curTiao.length });
				}
			}
			//判断机器人定缺功能
			countList.sort((a, b) => { return a.count - b.count });
			if (colorList.length + countList.length >= 3) {
				for (let i = 0; i < countList.length; i++) {
					let curType = countList[i].type;
					let curTypeCards = handCards.filter(item => this.getCardColor(item) == curType);
					if (curTypeCards.length > 0 && !curTypeCards.some(item => huCards.includes(item))) {
						return curTypeCards[i];
					}
				}
			}
		}



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
	getAiUserOperate(operateArray, handCards, laiZiCards, isSmart = false, huCards = [], colorList = []) {


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

		// operate = operateArray.find(item => item.type == gameProto.operateType.BAOTING);
		// if (operate) {
		// 	//有报听就报听吧
		// 	let curOperate = { operate: operate.type };
		// 	return curOperate;
		// }

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
			let card = this.getAiOutCards(handCards, laiZiCards, isSmart, huCards, colorList);
			//打牌操作
			let curOperate = { operate: gameProto.operateType.QI, card: card };
			return curOperate;
		}

	}




	/*-----------------------摆牌算法-----------------------------------*/
	//获取牌型
	getCardType(card) {

		return Math.floor(card / 10);
	}

	//或者最小值
	getMaxMinCard(card) {

		if (card < 10) {
			return { max: 9, min: 1 };
		} else if (card > 10 && card < 20) {
			return { max: 19, min: 11 };
		} else if (card > 20 && card < 30) {
			return { max: 29, min: 21 };
		}
	}

	//获取牌值
	getCardNumber(card) {
		return card % 10;
	}

	//移除指定卡牌是否能胡
	isHuExceptCards(cards, exceptCards) {

		let curData = exceptCards.slice();
		let allData = cards.slice();
		//移除指定卡牌
		for (let i = 0; i < curData.length; i++) {
			let curIndex = allData.findIndex(item => item == curData[i]);
			if (curIndex >= 0) {
				allData.splice(curIndex, 1);
			}
		}
		return this.getCanHu(allData);
	}

	delCardFromList(cards, card, times) {

		let curCards = cards.slice();
		for (let i = curCards.length - 1; i >= 0 && times > 0; --i) {
			if (curCards[i] == card) {
				curCards.splice(i, 1);
				--times;
			}
		}
		return curCards;
	};

	//获取明牌
	getMinPaiList(cardList) {

		//单调一张牌
		if (cardList.length == 1) {
			console.log(`dandiao hu cardList = ${cardList} `);
			return cardList.slice();
		}

		//获取胡牌对象
		let huPaiCards = this.getTingList(cardList);
		let huPaiList = [];
		for (let i = 0; i < huPaiCards.length; i++) {

			let curCards = huPaiCards[i].cardID;
			if (!huPaiList.includes(curCards)) {
				huPaiList.push(huPaiCards[i].cardID);
			}
		}

		// 1,1,1,2,3,4,5,6,7,8,9,11,11 等情况 
		if (huPaiList.length == 4) {

			let mingPaiList = cardList.slice();

			let hu1Count = mingPaiList.filter(item => item == huPaiList[0]);
			let hu2Count = mingPaiList.filter(item => item == huPaiList[1]);
			let hu3Count = mingPaiList.filter(item => item == huPaiList[2]);
			let hu4Count = mingPaiList.filter(item => item == huPaiList[3]);

			let hu2Card = hu1Count.length == 2 ? huPaiList[0] : null;
			hu2Card = hu2Count.length == 2 ? huPaiList[1] : hu2Card;
			hu2Card = hu3Count.length == 2 ? huPaiList[2] : hu2Card;
			hu2Card = hu4Count.length == 2 ? huPaiList[3] : hu2Card;

			if (hu2Card) {
				let curHuPaiList = huPaiList.filter(item => item != hu2Card);
				let curCardList = mingPaiList.filter(item => item != hu2Card);

				if (curHuPaiList.length == 3 && curHuPaiList[0] + 3 == curHuPaiList[1] && curHuPaiList[1] + 3 == curHuPaiList[2]) {
					let curCard1 = curHuPaiList[0] + 1;
					let curCard2 = curHuPaiList[0] + 2;
					let curCard3 = curHuPaiList[0] + 3;
					let curCard4 = curHuPaiList[0] + 4;
					let curCard5 = curHuPaiList[0] + 5;

					if (curCardList.includes(curCard1) && curCardList.includes(curCard2) && curCardList.includes(curCard3) && curCardList.includes(curCard4) && curCardList.includes(curCard5)) {

						let curList = curCardList.slice();
						let baiList = [curCard1, curCard2, curCard3, curCard4, curCard5];
						for (let i = 0; i < baiList.length; i++) {
							let index1 = curList.findIndex(item => item == baiList[i]);
							if (index1 != -1) {
								curList.splice(index1, 1);
							}
						}
						if (this.getCanHu(curList) || this.isShunKan(curList)) {

							baiList.push(hu2Card, hu2Card);
							return baiList;
						}
					}
				}
			}
		}

		//胡一张牌的单调将对
		let curCardsList = cardList.slice();
		if (huPaiList.length == 1) {
			let huIndex = curCardsList.findIndex(item => item == huPaiList[0]);
			if (huIndex >= 0) {
				curCardsList.splice(huIndex, 1);
				//去除将对全部为顺坎 则为单调将对
				if (this.isShunKan(curCardsList, 0)) {

					let curList = huPaiList.slice();
					//判断是否是2334这种情况
					let qianCard1 = huPaiList[0] - 1;
					let houCard1 = huPaiList[0] + 1;
					if (curCardsList.includes(qianCard1) && curCardsList.includes(houCard1) && curCardsList.includes(huPaiList[0])) {

						curList = [qianCard1, houCard1];
						console.log(`baoduzi jiangdui cardList = ${cardList} huPaiList = ${curList}`);
					}

					return curList;
				}
			}
		}

		//判断7对胡牌
		if (cardList.length == 13 && huPaiList.length == 1) {

			let curCards = cardList.concat(huPaiList);
			let isQiDui = this.isQiDui(curCards);
			if (isQiDui) {
				console.log(`qidui hu cardList = ${cardList} huPaiList = ${huPaiList}`);
				return huPaiList;
			}
		}

		//计算牌值
		let countMap = {};
		let isMingMap = {};
		let mingPaiList = [];
		for (let i = 0; i < cardList.length; i++) {
			if (!countMap[cardList[i]]) {
				countMap[cardList[i]] = 0;
			}
			countMap[cardList[i]] += 1;
		}

		for (let i = 0; i < huPaiList.length; i++) {

			let huCards = huPaiList[i];
			let { max, min } = this.getMaxMinCard(huCards);
			//判断是否有胡牌当前值
			let curCount = countMap[huCards] || 0;
			if (curCount > 0 && !isMingMap[huCards]) {

				let curList = new Array(curCount).fill(huCards);
				mingPaiList = mingPaiList.concat(curList);
				isMingMap[huCards] = true;
			}

			//卡中间的情况
			let qianCard1 = huCards - 1;
			let houCard1 = huCards + 1;
			if (countMap[qianCard1] && qianCard1 >= min && countMap[houCard1] && houCard1 <= max) {
				//保存前面的
				for (let k = qianCard1; k >= min; k--) {

					let curCount = countMap[k] || 0;
					if (curCount == 0) break;
					if (curCount > 0 && !isMingMap[k]) {
						let curList = new Array(curCount).fill(k);
						mingPaiList = mingPaiList.concat(curList);
						isMingMap[k] = true;
					}
				}
				//保存后面的
				for (let k = houCard1; k <= max; k++) {

					let curCount = countMap[k] || 0;
					if (curCount == 0) break;
					if (curCount > 0 && !isMingMap[k]) {
						let curList = new Array(curCount).fill(k);
						mingPaiList = mingPaiList.concat(curList);
						isMingMap[k] = true;
					}
				}
			}
			//判断前面的情况
			let qianCard2 = huCards - 2;
			if (countMap[qianCard1] && qianCard1 >= min && countMap[qianCard2] && qianCard2 >= min) {
				//保存前面的
				for (let k = qianCard1; k >= min; k--) {

					let curCount = countMap[k] || 0;
					if (curCount == 0) break;
					if (curCount > 0 && !isMingMap[k]) {
						let curList = new Array(curCount).fill(k);
						mingPaiList = mingPaiList.concat(curList);
						isMingMap[k] = true;
					}
				}
			}
			//判断后的情况
			let houCard2 = huCards + 2;
			if (countMap[houCard1] && houCard1 <= max && countMap[houCard2] && houCard2 <= max) {
				//保存后面的
				for (let k = houCard1; k <= max; k++) {

					let curCount = countMap[k] || 0;
					if (curCount == 0) break;
					if (curCount > 0 && !isMingMap[k]) {
						let curList = new Array(curCount).fill(k);
						mingPaiList = mingPaiList.concat(curList);
						isMingMap[k] = true;
					}
				}
			}
		}
		mingPaiList.sort((a, b) => { return a - b });
		console.log('mingPaiList:  ' + mingPaiList);

		//卡卡胡以及边胡
		if (huPaiList.length == 1) {

			let huCards = huPaiList[0];
			//3和7 可能是边胡
			if (this.getCardNumber(huCards) == 3) {

				let qianCard1 = huCards - 1;
				let qianCard2 = huCards - 2;
				if (mingPaiList.includes(qianCard1) && mingPaiList.includes(qianCard2)) {
					let curCards = cardList.slice();
					if (this.isHuExceptCards(curCards, [qianCard1, qianCard2])) {
						console.log(`bianbianbu mingPaiList = ${mingPaiList} huPaiList = ${huPaiList}`);
						return [qianCard1, qianCard2];
					}
				}
			}
			if (this.getCardNumber(huCards) == 7) {
				let houCard1 = huCards + 1;
				let houCard2 = huCards + 2;
				if (mingPaiList.includes(houCard1) && mingPaiList.includes(houCard2)) {
					let curCards = cardList.slice();
					if (this.isHuExceptCards(curCards, [houCard1, houCard2])) {
						console.log(`bianbianbu mingPaiList = ${mingPaiList} huPaiList = ${huPaiList}`);
						return [houCard1, houCard2];
					}
				}
			}

			//普通的卡卡胡
			{
				let qianCard1 = huCards - 1;
				let houCard1 = huCards + 1;
				if (mingPaiList.includes(qianCard1) && mingPaiList.includes(houCard1)) {

					let curCards = cardList.slice();
					if (this.isHuExceptCards(curCards, [qianCard1, houCard1])) {
						console.log(`kakahu mingPaiList = ${mingPaiList} huPaiList = ${huPaiList}`);
						return [qianCard1, houCard1];
					}
				}
			}
		}

		//端胡25 36等
		huPaiList.sort((a, b) => { return a - b });
		if (huPaiList.length == 2 && huPaiList[1] - huPaiList[0] == 3) {

			let huCards1 = huPaiList[0];
			let huCards2 = huPaiList[1];

			let huCount1 = (mingPaiList.filter(item => item == huCards1)).length;
			let huCount2 = (mingPaiList.filter(item => item == huCards2)).length;

			let curDiffList = Array.from(new Set(mingPaiList));

			//处理123 56等情况
			if (mingPaiList.length == 5) {

				let huDuiCard1 = huCards1 + 1;
				let huDuiCard2 = huCards1 + 2;
				if (mingPaiList.includes(huDuiCard1) && mingPaiList.includes(huDuiCard2)) {
					let curList = mingPaiList.slice();
					let curIndex = curList.findIndex(item => item == huDuiCard1);
					if (curIndex != -1) {
						curList.splice(curIndex, 1);
					}
					curIndex = curList.findIndex(item => item == huDuiCard2);
					if (curIndex != -1) {
						curList.splice(curIndex, 1);
					}
					if (this.isShunKan(curList)) {
						return [huDuiCard1, huDuiCard2];
					}
				}
			}

			//处理1123 5567的情况
			if (mingPaiList.length == 4) {

				let hu1Count = mingPaiList.filter(item => item == huCards1);
				if (hu1Count.length == 2) {
					return mingPaiList.filter(item => item != huCards1);
				}
				let hu2Count = mingPaiList.filter(item => item == huCards2);
				if (hu2Count.length == 2) {
					return mingPaiList.filter(item => item != huCards2);
				}
			}


			if (curDiffList.length == mingPaiList.length) {

				//1234的情况
				if (mingPaiList.length == 4 && huPaiList.length == 2) {

					let huCards1 = mingPaiList[0];
					let huCards2 = mingPaiList[1];
					let huCards3 = mingPaiList[2];
					let huCards4 = mingPaiList[3];
					if (huCards1 + 1 == huCards2 && huCards2 + 1 == huCards3 && huCards3 + 1 == huCards4) {
						if (huPaiList[0] == huCards1 && huPaiList[1] == huCards4) {
							return [huCards2, huCards3];
						}
					}
				}
				return mingPaiList;
			}
			else if ((!mingPaiList.includes(huCards1) && !mingPaiList.includes(huCards2)) || ((mingPaiList.includes(huCards1) && huCount1 <= 1) || (mingPaiList.includes(huCards2) && huCount2 <= 1))) {
				let qianCard1 = huCards1 + 1;
				let qianCard2 = huCards1 + 2;
				if (mingPaiList.includes(qianCard1) && mingPaiList.includes(qianCard2) && (huCards2 - 1 == qianCard2 && huCards2 - 2 == qianCard1)) {
					console.log(`duanhu mingPaiList = ${mingPaiList} huPaiList = ${huPaiList}`);
					let curList = [qianCard1, qianCard2];
					curList.sort((a, b) => a - b);
					return curList;
				}
			}
		}

		//对对胡的特殊判断 胡两个牌 花色不一致 或者花色一直相差4以上 为对对胡
		if (huPaiList.length == 2) {

			let huCards1 = huPaiList[0];
			let huCards2 = huPaiList[1];
			if (this.getCardType(huCards2) != this.getCardType(huCards1) || (this.getCardType(huCards2) == this.getCardType(huCards1))) {
				let huCardsList1 = mingPaiList.filter(item => item == huCards1);
				let huCardsList2 = mingPaiList.filter(item => item == huCards2);
				if (huCardsList1.length >= 2 && huCardsList2.length >= 2) {
					console.log(`duiduihu mingPaiList = ${mingPaiList} huPaiList = ${huPaiList}`);
					return [huCards1, huCards1, huCards2, huCards2];
				}
			}
		}

		//判断胡147 258 369等情况
		if (huPaiList.length == 3 && huPaiList[0] + 3 == huPaiList[1] && huPaiList[1] + 3 == huPaiList[2]) {
			let curCard1 = huPaiList[0] + 1;
			let curCard2 = huPaiList[0] + 2;
			let curCard3 = huPaiList[0] + 3;
			let curCard4 = huPaiList[0] + 4;
			let curCard5 = huPaiList[0] + 5;

			if (cardList.includes(curCard1) && cardList.includes(curCard2) && cardList.includes(curCard3) && cardList.includes(curCard4) && cardList.includes(curCard5)) {

				let curList = cardList.slice();
				let baiList = [curCard1, curCard2, curCard3, curCard4, curCard5];
				for (let i = 0; i < baiList.length; i++) {
					let index1 = curList.findIndex(item => item == baiList[i]);
					if (index1 != -1) {
						curList.splice(index1, 1);
					}
				}
				return baiList;
				// if (this.getCanHu(curList)) {
				// 	return baiList;
				// }
			}
		}

		//剔除顺子
		for (let i = 0; i < mingPaiList.length; i++) {
			//左右的顺子
			let curCard = parseInt(mingPaiList[i]); //当前牌
			let zuoCard1 = parseInt(mingPaiList[i - 1]); //左1
			let zuoCard2 = parseInt(mingPaiList[i - 2]); //左2
			let youCard1 = parseInt(mingPaiList[i + 1]); //右1
			let youCard2 = parseInt(mingPaiList[i + 2]); //右1

			if (youCard1 - curCard == 1 && curCard - zuoCard1 == 1) {
				//排完序后我的左端是4,5,6且我不胡3,4。那么就可以认为这4,5,6必定要组成一组且跟胡牌没有关系 右端同理
				if (i == 1 && !huPaiList.includes(curCard - 2) && !huPaiList.includes(curCard - 1)) {
					mingPaiList.splice(i - 1, 3);
				}
				else if (i == mingPaiList.length - 2 && !huPaiList.includes(curCard + 2) && !huPaiList.includes(curCard + 1)) {
					mingPaiList.splice(i - 1, 3);
				}
				else if (this.getCardType(zuoCard2) == this.getCardType(curCard) && zuoCard2 <= curCard - 2 && !huPaiList.includes(curCard + 2) && !mingPaiList.includes(curCard + 2) && !huPaiList.includes(curCard - 2)) {
					mingPaiList.splice(i - 2, 3);
				}
				else if (this.getCardType(youCard2) == this.getCardType(curCard) && youCard2 >= curCard + 2 && !huPaiList.includes(curCard - 2) && !mingPaiList.includes(curCard - 2) && !huPaiList.includes(curCard + 2)) {
					mingPaiList.splice(i, 3);
				}
			}
		}

		//处理11123 99 等情况
		if (huPaiList.length == 3) {

			let huCards1 = huPaiList[0];
			let huCards2 = huPaiList[1];
			let huCards3 = huPaiList[2];

			let hu1Count = mingPaiList.filter(item => item == huCards1);
			let hu2Count = mingPaiList.filter(item => item == huCards2);
			let hu3Count = mingPaiList.filter(item => item == huCards3);

			let hu3Card = hu1Count.length == 3 ? huCards1 : null;
			hu3Card = hu2Count.length == 3 ? huCards2 : hu3Card;
			hu3Card = hu3Count.length == 3 ? huCards3 : hu3Card;

			let hu2Card = hu1Count.length == 2 ? huCards1 : null;
			hu2Card = hu2Count.length == 2 ? huCards2 : hu2Card;
			hu2Card = hu3Count.length == 2 ? huCards3 : hu2Card;

			if (hu3Card && hu2Card) {

				let curList = mingPaiList.filter(item => item != hu3Card);
				return curList;
			}
		}






		//剔除坎的牌 重新计算卡牌
		let curCountMap = {};
		for (let i = 0; i < mingPaiList.length; i++) {
			if (!curCountMap[mingPaiList[i]]) {
				curCountMap[mingPaiList[i]] = 0;
			}
			curCountMap[mingPaiList[i]] += 1;
		}
		let removeKey = {};
		for (let curCard in curCountMap) {
			if (curCountMap[curCard] >= 3) {
				//查询胡牌和当前坎有没有关系
				let sameColorList = huPaiList.filter(item => this.getCardType(curCard) == this.getCardType(item));
				for (let i = 0; i < sameColorList.length; i++) {
					//判断胡牌和当前坎有没有关系
					let curHuCard = sameColorList[0];
					if (Math.abs(curCard - curHuCard) > 2) {
						let curMin = curCard;
						let curMax = curHuCard;
						if (curHuCard < curCard) {
							curMin = curHuCard;
							curMax = curCard;
						}
						for (let k = curMax; k >= curMin; k--) {
							if (!removeKey[curCard] && !mingPaiList.includes(parseInt(k)) && !huPaiList.includes(parseInt(curCard))) {
								//移除当前坎
								console.log(`remove kan mingPaiList = ${mingPaiList} curCard = ${curCard}`);
								mingPaiList = this.delCardFromList(mingPaiList, curCard, 3);
								removeKey[curCard] = true;
								break;
							}
						}
					}
				}
			}
		}


		let isCP = {}; //cp牌
		let cpCount = 0;
		let delMinghold = [];   //剔除的明牌序列
		//尝试寻找不能组成顺子的两张牌
		for (let i = 0; i < mingPaiList.length; ++i) {
			for (let j = i + 1; j < mingPaiList.length; ++j) {
				for (let k = j + 1; k < mingPaiList.length; ++k) {
					if ((mingPaiList[j] - mingPaiList[i] == 1 && mingPaiList[k] - mingPaiList[j] == 1)) {
						isCP[i] = false;
						isCP[j] = false;
						isCP[k] = false;
					}
				}
			}
			if (isCP[i]) {
				delMinghold.push(mingPaiList[i]);
				cpCount++;
			}
		}

		//坎牌剔除
		var t = 0;
		var ti = -1;
		if (cpCount > 3) {
			for (var i = 0; i < delMinghold.length - 2; ++i) {
				if (delMinghold[i] == delMinghold[i + 1] && delMinghold[i] == delMinghold[i + 2]
					&& delMinghold.length % 3 == 2) {
					t++;
					ti = i;
				}
			}

			if (t == 1 && huPaiList.indexOf(delMinghold[ti]) < 0) {
				cpCount -= 3;
				delMinghold.splice(ti, 3);
			}
		}


		//对子剔除
		var p = 0;
		var pi = -1;
		if (cpCount > 2) {
			for (var i = 0; i < delMinghold.length - 1; ++i) {
				if (delMinghold[i] == delMinghold[i + 1]) {
					p++;
					pi = i;
				}
			}

			if (p == 1 && huPaiList.indexOf(delMinghold[pi]) < 0) {
				cpCount -= 2;
				delMinghold.splice(pi, 2);
			}
		}

		//最后筛选
		if (cpCount == 2) {
			if (huPaiList.length == 1) {
				return delMinghold;
			}
			else if (delMinghold[0] != delMinghold[1]) {
				return delMinghold;
			}
			else if (huPaiList.length == 2 && (delMinghold[0] == huPaiList[0] || delMinghold[0] == huPaiList[1])) {
				return [huPaiList[0], huPaiList[0], huPaiList[1], huPaiList[1]];
			}
			else {
				return mingPaiList;
			}
		}
		else if (cpCount == 1) {
			if (huPaiList.length == 1) {
				if (huPaiList[0] - delMinghold[0] == 1) {
					delMinghold.push(huPaiList[0] + 1);
					return delMinghold;
				}
				else if (huPaiList[0] - delMinghold[0] == -1) {
					delMinghold.push(huPaiList[0] - 1);
					return delMinghold;
				}
				else {
					return mingPaiList;
				}
			}
			else {
				return mingPaiList;

			}
		} else {
			return mingPaiList;
		}

	}

}

module.exports = new GameLogic();