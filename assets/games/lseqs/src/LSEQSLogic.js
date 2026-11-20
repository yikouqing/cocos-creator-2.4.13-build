const gameProto = require('./ApiLseqs');

const CARDID = {
	CARDID_HEI1: 1, CARDID_HEI2: 2, CARDID_HEI3: 3, CARDID_HEI4: 4, CARDID_HEI5: 5, CARDID_HEI6: 6, CARDID_HEI7: 7, CARDID_HEI8: 8, CARDID_HEI9: 9, CARDID_HEI10: 10,
	CARDID_HONG1: 17, CARDID_HONG2: 18, CARDID_HONG3: 19, CARDID_HONG4: 20, CARDID_HONG5: 21, CARDID_HONG6: 22, CARDID_HONG7: 23, CARDID_HONG8: 24, CARDID_HONG9: 25, CARDID_HONG10: 26,
};



class GameLogic {

	init(gameRule) {
		this.cards = []; //列表列表
		this.tingCards = []; //可以听牌的列表
		this.gameRule = gameRule;
		this.initTingList()
	}


	getBaseID() {
		return CARDID;
	}

	//获取基础卡牌
	getBaseCards() {

		let curCards = [];
		for (let i = 0; i < 4; i++) {
			//添加字牌
			for (let key in CARDID) {
				let cardNum = CARDID[key];
				curCards.push(cardNum);
			}
		}
		return curCards.slice();
	}

	initTingList() {

		for (let key in CARDID) {
			let cardNum = CARDID[key];
			this.tingCards.push(cardNum);
		}
	}



	//获取指定外所以卡牌
	getNextAllCards(allTestCards) {

		let allCards = this.getBaseCards();
		let testCards = [];
		for (let key in allTestCards) {
			testCards = testCards.concat(allTestCards[key]);
		}
		for (let i = 0; i < testCards.length; i++) {
			let cards = testCards[i];
			let cardIndex = allCards.findIndex(item => item == cards);
			allCards.splice(cardIndex, 1);
		}
		return allCards.slice();
	}


	//初始化卡牌
	initCards(userNextTestCards) {


		this.initTingList();
		this.cards = this.getNextAllCards(userNextTestCards);
		//洗牌
		for (let i = 0; i < 200; ++i) {
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
		}
		else {
			this.cards.splice(index, 1);
			return card;
		}
	}

	//复制数组
	cloneList(list) {
		return JSON.parse(JSON.stringify(list));
	}


	//获取指定数量的卡牌
	getCards(cardCount, isBuHua = false) {
		let array = [];
		if (isBuHua) {
			for (let i = 0; i < this.cards.length; i++) {
				if (this.cards[i] < CAISHEN) {
					array.push(this.cards[i])
				}
				if (array.length >= cardCount) {
					//在数组里面移除当前麻将
					for (let k = 0; k < array.length; k++) {
						this.getSetCard(array[k]);
					}
					break;
				}
			}
		} else {
			if (this.cards.length >= cardCount) {
				array = this.cards.splice(0, cardCount);
			}
		}
		return array;
	}

	//获取当前所有卡牌
	getAllCards() {
		return this.cards;
	}

	//获取剩余卡牌数量
	getRestCardsCount() {
		let subCount = 0;
		// if (this.gameRule.chairCount == 2) {
		// 	subCount = 20;
		// }
		return (this.cards.length - subCount);
	}

	//获取牌值
	getCardNumber(card) {

		return parseInt(card % 16);
	}

	//获取牌颜色
	getCardColor(card) {

		return parseInt(card / 16);
	}


	//判断牌是否在当前的牌库中
	isInCardList(curData, allData) {

		curData = curData.slice();
		allData = allData.slice();
		let indexList = [];
		for (let i = 0; i < curData.length; i++) {
			let curIndex = allData.findIndex(item => item == curData[i]);
			if (curIndex >= 0) {
				indexList.push(curIndex);
				allData.splice(curIndex, 1);
			}
		}
		let isSuccess = false;
		if (indexList.length == curData.length) {
			isSuccess = true;
		}
		return isSuccess;
	}

	removeAllCard(list, allList) {

		for (let i = 0; i < list.length; i++) {
			let curCard = list[i];
			let curIndex = allList.findIndex(item => item == curCard);
			if (curIndex >= 0) {
				allList.splice(curIndex, 1);
			}
		}
		return allList;

	}

	//移除卡牌
	removeCard(list, card) {

		let curIndex = list.findIndex(item => item == card);
		let curList = list.slice();
		if (curIndex >= 0) {
			curList.splice(curIndex, 1);
		}
		return curList.slice();
	}



	isHaveDuiZi(list) {


		let cardCount = {}
		for (let i = 0; i < list.length; i++) {
			let card = list[i];
			cardCount[card] = (cardCount[card] || 0) + 1;
		}
		let duiCount = 0;
		for (let key in cardCount) {
			if (cardCount[key] >= 2) {
				duiCount += 1;
			}
		}
		return duiCount;

	}

	/*-----------------------------------胡牌算法-----------------------------------------*/

	//获取胡的数量
	getHuCount(cards, isHand = false) {

		if (cards && cards.length >= 3) {
			cards = cards.slice();
			cards.sort((a, b) => { return a - b });
			if (cards.length == 3 && this.isInCardList([2, 7, 10], cards)) {
				//黑2710
				return 3;
			}
			if (cards.length == 3 && this.isInCardList([18, 23, 26], cards)) {
				//红2710
				return 6;
			}
			if (cards.every(item => item == cards[0])) {
				let curColor = this.getCardColor(cards[0]);
				if (cards.length == 3) {
					if (isHand) {
						//手里面的对子 红6 黑3
						return curColor > 0 ? 6 : 3;
					} else {
						//外面的对子 红3 黑1
						return curColor > 0 ? 3 : 1;
					}
				} else if (cards.length == 4) {
					if (isHand) {
						//手里面的滚 红12 黑9
						return curColor > 0 ? 12 : 9;
					} else {
						//外面的开 红9 黑6
						return curColor > 0 ? 9 : 6;
					}
				}
			}
			return 0;
		}

		return 0;
	}

	//获取所有手牌的数量
	getCardList(cards) {


		let cardCount = {};
		let baseList = [];
		let curCards = cards.slice();
		for (let i = 0; i < curCards.length; i++) {

			let curCard = curCards[i];
			if (!cardCount[curCard]) {
				cardCount[curCard] = 0;
				let cardList = curCards.filter(item => item == curCard);
				let point = this.getCardNumber(curCard);
				baseList.push({ cardList, card: curCard, count: cardList.length, point: point });
			}
			cardCount[curCard] += 1;
		}
		return baseList;
	}

	//获取听牌列表
	getTingList(cards) {

		let tingList = [];
		this.tingCards.map(item => {
			let curCards = cards.slice();
			curCards.push(item);
			if (this.getCanHu(curCards, item)) {
				tingList.push({ cardID: item, rate: 1 });
			}
		});
		return tingList;
	}


	//是否可以胡基础牌型
	getCanHu(cards, huCard) {

		let curCards = cards.slice();
		let baseList = this.getBaseList(curCards);
		//去除大于等于3
		let curFourList = baseList.filter(item => item.count >= 4);
		if (curFourList.length > 0) {
			curCards = curCards.filter(item => curFourList.find(item1 => item1.card != item));
		}
		//特殊情况处理
		let huChai = baseList.find(item => item.count == 3 && item.card == huCard);
		if (huChai) {

			//优先拆开算一下
			if (curCards.length % 3 == 0) {
				let curDanCards = curCards.slice();
				let curIndex = curDanCards.findIndex(item => item != huCard && this.getCardNumber(item) == this.getCardNumber(huCard));
				if (curIndex != -1) {
					curDanCards.splice(curIndex, 1);
					curDanCards = curDanCards.filter(item => item != huCard);
					curDanCards.push(huCard);
					if (curDanCards.length % 3 == 0) {
						let result = this.isShunKan(curDanCards);
						if (result) {
							return true;
						}
					} else if (curDanCards.length % 3 == 2) {

						let twoList = baseList.filter(item => item.count == 2);
						for (let i = 0; i < twoList.length; i++) {
							let duiCard = twoList[i].card;
							let endCards = curDanCards.filter(item => item != duiCard);
							let result = this.isShunKan(endCards);
							if (result) {
								return true;
							}
						}
					}
				}

			} else if (curCards.length % 3 == 2) {

				let isCanDanHu = false;
				let endCards = curCards.slice();
				let duiList = [huCard, huCard];
				for (let i = 0; i < duiList.length; i++) {
					let curIndex = endCards.findIndex(item => item == duiList[i]);
					if (curIndex != -1) {
						endCards.splice(curIndex, 1);
					}
				}
				let result = this.isShunKan(endCards);
				if (result) {
					isCanDanHu = true;
				}
				if (isCanDanHu) {
					return true;
				}
			}
		}

		//正常情况处理
		curCards = cards.slice();
		baseList = this.getBaseList(curCards);
		baseList = baseList.filter(item => item.count < 3);
		//去除大于等于3
		curCards = curCards.filter(item => baseList.find(item1 => item1.card == item));
		//两种胡牌清情况
		if (curCards.length % 3 == 0) {
			return this.isShunKan(curCards);

		} else if (curCards.length % 3 == 2) {

			let twoList = baseList.filter(item => item.count == 2);
			for (let i = 0; i < twoList.length; i++) {
				let duiCard = twoList[i].card;
				let endCards = curCards.filter(item => item != duiCard);
				if (this.isShunKan(endCards)) {
					return true;
				}
			}
			return false;

		} else {
			return false;
		}
	}


	//是否顺子和坎
	isShunKan(cards) {

		if (cards.length === 0) return true;
		cards.sort((a, b) => { return a - b });


		//判断是否有二七十
		if (cards.includes(2) && cards.includes(7) && cards.includes(10)) {
			let curCards = cards.slice();
			let index2 = curCards.findIndex(item => item == 2);
			curCards.splice(index2, 1);
			let index7 = curCards.findIndex(item => item == 7);
			curCards.splice(index7, 1);
			let index10 = curCards.findIndex(item => item == 10);
			curCards.splice(index10, 1);
			if (this.isShunKan(curCards)) {
				return true;
			}
		}

		if (cards.includes(18) && cards.includes(23) && cards.includes(26)) {
			let curCards = cards.slice();
			let index2 = curCards.findIndex(item => item == 18);
			curCards.splice(index2, 1);
			let index7 = curCards.findIndex(item => item == 23);
			curCards.splice(index7, 1);
			let index10 = curCards.findIndex(item => item == 26);
			curCards.splice(index10, 1);
			if (this.isShunKan(curCards)) {
				return true;
			}
		}

		//判断顺子
		for (let first = cards[0] - 2; first <= cards[0]; first++) {

			if (first < cards[0]) continue; //连牌必须是第一张开始
			let shunCount = 0;
			for (let i = 0; i < 3; i++) {
				if (cards.indexOf(first + i) >= 0) {
					shunCount += 1;
				}
			}

			//找到一个顺子
			if (shunCount === 3) {
				let curCards = cards.slice();
				for (let i = 0; i < 3; i++) {
					let deletePos = curCards.indexOf(first + i);
					if (deletePos >= 0) {
						curCards.splice(deletePos, 1); //原卡牌踢出顺子数据
					}
				}
				//判断剩下的牌是否成顺坎
				if (this.isShunKan(curCards)) {
					return true;
				}
			}

		}

		//判断坎
		let keziCard = cards[0];
		let keziCount = cards.filter(item => this.getCardNumber(item) == this.getCardNumber(keziCard));

		if (keziCount.length >= 3) {
			let curCards = cards.slice();
			for (let i = 0; i < keziCount.length && i < 3; i++) {
				let deletePos = curCards.indexOf(keziCount[i]);
				if (deletePos >= 0) {
					curCards.splice(deletePos, 1); //原卡牌踢出坎数据
				}
			}
			if (this.isShunKan(curCards)) {
				return true;
			}
		}
		return false;
	}

	//是否对对胡
	isDuiDuiHu(operateList, userCards) {

		let isDuiDuiHu = true;
		//有吃就不算
		if (operateList.find(item => item.operate == gameProto.operateType.CHI)) {
			isDuiDuiHu = false;
			return isDuiDuiHu;
		}

		let curBaseList = this.getCardTypeList(userCards);
		if (curBaseList.find(item => item.count == 1)) {
			isDuiDuiHu = false;
			return isDuiDuiHu;
		}

		let duiList = curBaseList.filter(item => item.count == 2);
		if (duiList.length > 1) {
			isDuiDuiHu = false;
			return isDuiDuiHu;
		}

		return isDuiDuiHu;
	}

	//是否全红/全黑
	isSameColor(operateList, userCards) {

		let isSameColor = 0;
		let cardsList = userCards.slice();
		for (let i = 0; i < operateList.length; i++) {
			cardsList = cardsList.concat(operateList[i].cardList);
		}
		if (cardsList.every(item => this.getCardColor(item) >= 1)) {
			isSameColor = 1;
		} else if (cardsList.every(item => this.getCardColor(item) == 0)) {
			isSameColor = 2;
		}
		return isSameColor;

	}




	getAllGroup(cards) {

		let curCards = cards.slice();
		let baseList = this.getBaseList(curCards);
		baseList = baseList.filter(item => item.count < 3);
		//去除大于等于3
		curCards = curCards.filter(item => baseList.find(item1 => item1.card == item));
		let reGroupList = [];
		if (curCards.length % 3 == 0) {
			this.isShunKan(curCards, reGroupList);
		}
	}



	//最新摆牌
	getHuBaiList(cards, huCard) {


		let curCards = cards.slice();
		curCards.sort((a, b) => { return a - b });
		let baseList = this.getBaseList(curCards);

		let more3List = baseList.filter(item => item.count >= 3 && item.card != huCard);
		let myMoreList = [];
		let moreDanList = [];
		for (let i = 0; i < more3List.length; i++) {
			myMoreList.push(more3List[i].cardList);
			moreDanList.push(more3List[i].card);
		}

		if (moreDanList.length > 0) {
			curCards = curCards.filter(item => !moreDanList.includes(item));
		}

		let curList = this.getCanHuList(curCards, huCard);
		if (curList) {
			curList = myMoreList.concat(curList);
		}
		return curList;


	}




	//是否可以胡基础牌型
	getCanHuList(cards, huCard) {


		let curCards = cards.slice();
		curCards.sort((a, b) => { return a - b });
		let baseList = this.getBaseList(curCards);

		//特殊情况处理
		let huChai = baseList.find(item => item.count == 3 && item.card == huCard);
		if (huChai) {

			//两种胡牌清情况
			if (curCards.length % 3 == 0) {

				let more3List = baseList.filter(item => item.count >= 3 && item.card != huCard);
				let myList = [];
				for (let i = 0; i < more3List.length; i++) {
					myList.push(more3List[i].cardList);
				}
				let curIndex = curCards.findIndex(item => item != huCard && this.getCardNumber(item) == this.getCardNumber(huCard));
				if (curIndex != -1) {
					let duiCard = curCards.splice(curIndex, 1)[0];
					curCards = curCards.filter(item => item != huCard);
					curCards.push(huCard);

					myList.push([huCard, huCard, duiCard]);

					if (curCards.length % 3 == 0) {
						let result = this.isShunKanByList(curCards, myList);
						if (result) {
							return result;
						}
					} else if (curCards.length % 3 == 2) {
						let curBackUpList = myList.slice();
						let twoList = baseList.filter(item => item.count == 2);
						for (let i = 0; i < twoList.length; i++) {
							let duiCard = twoList[i].card;
							myList = curBackUpList.slice();
							myList.push([duiCard, duiCard]);
							let endCards = curCards.filter(item => item != duiCard);
							let result = this.isShunKanByList(curCards, myList);
							if (result) {
								return result;
							}
						}
					}
				}
			} else if (curCards.length % 3 == 2) {

				let endCards = curCards.slice();
				let duiList = [huCard, huCard];
				for (let i = 0; i < duiList.length; i++) {
					let curIndex = endCards.findIndex(item => item == duiList[i]);
					if (curIndex != -1) {
						endCards.splice(curIndex, 1);
					}
				}
				let curList = this.getCanHuList(endCards, huCard);
				if (curList) {
					curList.push(duiList);
					return curList;
				}
			}
		}

		curCards = cards.slice();
		curCards.sort((a, b) => { return a - b });
		baseList = this.getBaseList(curCards);
		let myList = [];

		let more3List = baseList.filter(item => item.count >= 3);
		for (let i = 0; i < more3List.length; i++) {
			myList.push(more3List[i].cardList);
		}

		baseList = baseList.filter(item => item.count < 3);
		//去除大于等于3
		curCards = curCards.filter(item => baseList.find(item1 => item1.card == item));
		//两种胡牌清情况
		if (curCards.length % 3 == 0) {
			return this.isShunKanByList(curCards, myList);

		} else if (curCards.length % 3 == 2) {

			let curBackUpList = myList.slice();
			let twoList = baseList.filter(item => item.count == 2);
			for (let i = 0; i < twoList.length; i++) {
				let duiCard = twoList[i].card;
				myList = curBackUpList.slice();
				myList.push([duiCard, duiCard]);
				let endCards = curCards.filter(item => item != duiCard);
				if (this.isShunKanByList(endCards, myList)) {
					return myList.slice();
				}
				// else {
				// 	myList = [];
				// }
			}
			return false;
		} else {
			return false;
		}
	}

	//是否顺子和坎
	isShunKanByList(cards, list) {


		cards = cards.slice();
		if (cards.length === 0) return list;


		if (cards.includes(18) && cards.includes(23) && cards.includes(26)) {
			let curCards = cards.slice();
			let index2 = curCards.findIndex(item => item == 18);
			curCards.splice(index2, 1);
			let index7 = curCards.findIndex(item => item == 23);
			curCards.splice(index7, 1);
			let index10 = curCards.findIndex(item => item == 26);
			curCards.splice(index10, 1);

			if (this.isShunKan(curCards)) {
				list.push([18, 23, 26]);
			}
			if (this.isShunKanByList(curCards, list)) {
				return list.slice();
			}
		}

		//判断是否有二七十
		if (cards.includes(2) && cards.includes(7) && cards.includes(10)) {
			let curCards = cards.slice();
			let index2 = curCards.findIndex(item => item == 2);
			curCards.splice(index2, 1);
			let index7 = curCards.findIndex(item => item == 7);
			curCards.splice(index7, 1);
			let index10 = curCards.findIndex(item => item == 10);
			curCards.splice(index10, 1);

			if (this.isShunKan(curCards)) {
				list.push([2, 7, 10]);
			}
			if (this.isShunKanByList(curCards, list)) {
				return list.slice();
			}
		}



		//判断顺子
		for (let first = cards[0] - 2; first <= cards[0]; first++) {

			if (first < cards[0]) continue; //连牌必须是第一张开始
			let shunCount = 0;
			for (let i = 0; i < 3; i++) {
				if (cards.indexOf(first + i) >= 0) {
					shunCount += 1;
				}
			}

			//找到一个顺子
			let shunList = []
			if (shunCount === 3) {
				let curCards = cards.slice();
				for (let i = 0; i < 3; i++) {

					shunList.push(first + i);
					let deletePos = curCards.indexOf(first + i);
					if (deletePos >= 0) {
						curCards.splice(deletePos, 1); //原卡牌踢出顺子数据
					}
				}
				if (this.isShunKan(curCards)) {
					list.push(shunList);
				}

				//判断剩下的牌是否成顺坎
				if (this.isShunKanByList(curCards, list)) {
					return list.slice();
				}
				// else {
				// 	list = [];
				// }
			}
		}

		//判断坎
		let keziCard = cards[0];
		let keziCount = cards.filter(item => this.getCardNumber(item) == this.getCardNumber(keziCard));

		let kanList = [];
		if (keziCount.length >= 3) {
			let curCards = cards.slice();
			for (let i = 0; i < keziCount.length && i < 3; i++) {
				kanList.push(keziCount[i]);
				let deletePos = curCards.indexOf(keziCount[i]);
				if (deletePos >= 0) {
					curCards.splice(deletePos, 1); //原卡牌踢出坎数据
				}
			}
			if (this.isShunKan(curCards)) {
				list.push(kanList);
			}
			if (this.isShunKanByList(curCards, list)) {
				return list.slice();
			}
			//  else {
			// 	list = []
			// }
		}
		return false;
	}


	/*-----------------------------------基础工具函数-----------------------------------------*/


	getBaseList(list) {

		let curCards = list.slice();
		let baseList = [];
		let cardCount = {};

		for (let i = 0; i < curCards.length; i++) {
			let curCard = curCards[i];
			if (!cardCount[curCard]) {
				cardCount[curCard] = 0;
				let cardList = curCards.filter(item => item == curCard);
				let point = this.getCardNumber(curCard);
				baseList.push({ cardList: cardList, card: curCard, count: cardList.length, point: point });
			}
			cardCount[curCard] += 1;
		}
		return baseList;
	}

	//获取摆牌列表
	getBaiPaiList(list) {

		let curCards = list.slice();

		let baseList = [];
		for (let i = 1; i <= 10; i++) {

			let point = i;
			let cardList = curCards.filter(item => this.getCardNumber(item) == point);
			if (cardList.length > 0) {
				if (cardList.length >= 4) {
					//拆分成两个
					let oneList = curCards.filter(item => item == point);
					if (oneList.length > 0) {
						let huCount = this.getHuCount(oneList, true);
						baseList.push({ cardList: oneList, point, huCount, count: oneList.length });
					}
					let leftList = cardList.filter(item => !oneList.includes(item));
					if (leftList.length > 0) {
						let huCount = this.getHuCount(leftList, true);
						baseList.push({ cardList: leftList, point, huCount, count: leftList.length });
					}
				} else {
					let huCount = this.getHuCount(cardList, true);
					baseList.push({ cardList, point, huCount, count: cardList.length });
				}
			}
		}
		baseList.sort((a, b) => { return a.point - b.point });
		// let moreCount = baseList.length - 10;
		// if (moreCount > 0) {
		// 	//如果有多的列
		// 	let danList = baseList.filter()

		// }

		return baseList;
	}


	reGroupList(arr, n = 2) {
		if (n === 2) {
			return arr.reduce((result, value, index) => {
				return result.concat(arr.slice(index + 1).map(item => [value, item]));
			}, []);
		} else {
			return arr.reduce((result, value, index) => {
				const subCombinations = this.reGroupList(arr.slice(index + 1), n - 1);
				return result.concat(subCombinations.map(combination => [value].concat(combination)));
			}, []);
		}
	}


	getAllHandCards(operateRecords) {

		let curCards = [];
		let curOperate = [gameProto.operateType.GANG_BU, gameProto.operateType.GANG_CHI, gameProto.operateType.GANG_ZHI];
		//杠的卡牌
		let cardList = operateRecords.filter(item => curOperate.includes(item.operate));
		for (let i = 0; i < cardList.length; i++) {
			let curList = cardList[i].plusInfo.cardList;
			curCards = curCards.concat(curList);
		}
		//碰的卡牌
		let pengList = operateRecords.filter(item => { return item.operate == gameProto.operateType.PENG && !cardList.some(curItem => { return curItem.card == item.card }) });
		for (let i = 0; i < pengList.length; i++) {
			let curList = pengList[i].plusInfo.cardList;
			curCards = curCards.concat(curList);
		}
		return curCards;

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
		let laiCount = (allData.filter(item => item == 35)).length;
		let cardsCount = allData.filter(item => item != 35);
		return this.getCanHu(cardsCount, laiCount);
	}




	//******************************下面是前端新增算法，同步的时候不要覆盖了 **************************/

	/*delIds要删除的 toDelIds被删除的*/
	delIds(delIds, toDelIds) {
		for (var i = 0; i < delIds.length; i++) {
			var s = delIds[i];
			var indexs = toDelIds.indexOf(s);
			if (indexs >= 0) toDelIds.splice(indexs, 1);
		}
	}
	//判断是否有吃的
	checkChiAllList(card, userCards) {

		let chiList = [];
		//连子吃 同花色的顺子
		let nextCard1 = card + 1;
		let nextCard2 = card + 2;
		let beforeCard1 = card - 1;
		let beforeCard2 = card - 2;

		if (userCards.includes(nextCard1) && userCards.includes(nextCard2)) {
			let cardList = [card, nextCard1, nextCard2];
			chiList.push(cardList);
		}

		if (userCards.includes(nextCard1) && userCards.includes(beforeCard1)) {
			let cardList = [beforeCard1, card, nextCard1];
			chiList.push(cardList);
		}

		if (userCards.includes(beforeCard1) && userCards.includes(beforeCard2)) {
			let cardList = [beforeCard2, beforeCard1, card];
			chiList.push(cardList);
		}

		//2710的吃
		let hongList = [18, 23, 26];
		let heiList = [2, 7, 10];
		if (hongList.includes(card)) {

			let curList = hongList.slice();
			let myIndex = curList.findIndex(item => item == card);
			curList.splice(myIndex, 1);
			if (this.isInCardList(curList, userCards)) {
				chiList.push(hongList);
			}
		}
		if (heiList.includes(card)) {
			let curList = heiList.slice();
			let myIndex = curList.findIndex(item => item == card);
			curList.splice(myIndex, 1);
			if (this.isInCardList(curList, userCards)) {
				chiList.push(heiList);
			}
		}

		//半边字的吃
		let curPoint = this.getCardNumber(card);
		let sameCard = userCards.filter(item => item == card);
		let duiCard = userCards.filter(item => item != card && this.getCardNumber(item) == curPoint);
		if (duiCard.length == 2) {
			let curChiList = duiCard.concat([card]);
			chiList.push(curChiList);
		}
		if (sameCard.length == 2 && duiCard.length == 1) {
			let curChiList = [card, card, duiCard[0]];
			chiList.push(curChiList);
		}
		return chiList;

	}
}


module.exports = new GameLogic();