const gameProto = require('./ApiEnsmj');

const CARDID = {
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
	CARDID_ZHONG: 35,
};

class GameLogic {

	init(gameRule) {
		this.cards = []; //麻将列表
		this.tingCards = []; //可以听牌的列表
		this.gameRule = gameRule;
		this.initCards();
	}

	//初始化卡牌
	initCards() {

		this.cards = [];
		for (let i = 0; i < 4; i++) {
			//添加万字 去万没有万字
			if (!this.gameRule.quwan) {
				for (let k = CARDID.CARDID_WAN1; k <= CARDID.CARDID_WAN9; k++) {
					this.cards.push(k);
					if (!this.tingCards.includes(k)) {
						this.tingCards.push(k);
					}
				}
			}
			//添加条子
			for (let k = CARDID.CARDID_TIAO1; k <= CARDID.CARDID_TIAO9; k++) {
				this.cards.push(k);
				if (!this.tingCards.includes(k)) {
					this.tingCards.push(k);
				}
			}
			//添加筒子
			for (let k = CARDID.CARDID_TONG1; k <= CARDID.CARDID_TONG9; k++) {
				this.cards.push(k);
				if (!this.tingCards.includes(k)) {
					this.tingCards.push(k);
				}
			}
		}

		for (let i = 0; i < 300; ++i) {
			let index = i % this.cards.length;
			let random1 = Math.floor(Math.random() * this.cards.length);
			let tmp = this.cards[index];
			this.cards[index] = this.cards[random1];
			this.cards[random1] = tmp;
		}
	}
	getAllCardList() {
		let cards = [];
		for (let i = 0; i < 4; i++) {
			//添加万字 去万没有万字
			for (let k = CARDID.CARDID_WAN1; !this.gameRule.quwan && k <= CARDID.CARDID_WAN9; k++) {
				cards.push(k);
			}
			//添加条子
			for (let k = CARDID.CARDID_TIAO1; k <= CARDID.CARDID_TIAO9; k++) {
				cards.push(k);
			}
			//添加筒子
			for (let k = CARDID.CARDID_TONG1; k <= CARDID.CARDID_TONG9; k++) {
				cards.push(k);
			}
		}
		return cards;
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
	getCards(cardCount, isBuHua = false) {
		let array = [];
		if (isBuHua) {
			for (let i = 0; i < this.cards.length; i++) {
				array.push(this.cards[i])
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


	getAllCards() {
		return this.cards;
	}

	//获取剩余卡牌数量
	getRestCardsCount() {
		return this.cards.length;
	}

	/*-----------------------------------胡牌算法-----------------------------------------*/


	//是否可以胡基础牌型
	getCanHu(cards, laiziCount = 0) {

		// 若牌张数不是2、5、8、11、14,17则不能胡  
		if ((cards.length + laiziCount + 1) % 3 != 0) return false;
		//特殊牌型
		if (this.isQiDui(cards, laiziCount).isQiDui) {
			return true;
		}
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

	//是否顺子和坎
	isShunKan(cards, laiziCount = 0) {

		cards.sort((a, b) => a - b);
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
				if (this.isShunKan(curCards, curLaizi)) {
					return true;
				}
			}
		}

		//判断坎
		let keziCard = cards[0];
		let keziCount = (cards.filter(item => item == keziCard)).length;

		if (keziCount === 3 || keziCount + laiziCount >= 3) {

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
			if (this.isShunKan(curCards, curLaizi)) {
				return true;
			}
		}
		return false;
	}

	//获取听牌列表
	getTingList(cards, laiziCount = 0, operateRecords = []) {

		let tingList = [];
		this.tingCards.map(item => {

			let curCards = cards.slice();
			curCards.push(item);
			if (this.getCanHu(curCards, laiziCount)) {

				let curRateList = this.getCardRate(curCards, operateRecords);
				let rate = 0;
				let typeList = [];
				for (let i = 0; i < curRateList.length; i++) {
					rate += curRateList[i].score;
					typeList.push(curRateList[i].type)
				}
				tingList.push({
					cardID: item,
					rate: rate,
					type: Math.max(...typeList)
				});
			}
		});
		return tingList;
	}

	//获取牌型
	getCardRate(userCards, curOperateList, laiZiCount = 0, card = null) {

		let curUserCards = userCards.slice();
		//牌型分数
		let cardType = [];

		let {
			isQiDui,
			isHaveFour
		} = this.isQiDui(curUserCards, laiZiCount);
		if (isQiDui) {
			if (isHaveFour >= 3) {
				//三豪华七对
				let curCardType = {
					type: gameProto.cardType.SANHAOHUANGQIDUI,
					score: 40
				};
				cardType.push(curCardType);
				return cardType;
			} else if (isHaveFour == 2) {
				//双豪华七对
				let curCardType = {
					type: gameProto.cardType.SHUANGHAOHUANGQIDUI,
					score: 20
				};
				cardType.push(curCardType);
				return cardType;
			} else if (isHaveFour == 1) {
				//豪华七对
				let curCardType = {
					type: gameProto.cardType.HAOHUANGQIDUI,
					score: 10
				};
				cardType.push(curCardType);
				return cardType;
			}
		}
		//全求人判断
		if (card != null && userCards.length <= 2) {
			let curCardType = {
				type: gameProto.cardType.QUANQIUR,
				score: 10
			};
			cardType.push(curCardType);
			return cardType;
		}
		//将对判断相关
		if (this.isBaseJiangDui(curUserCards, curOperateList)) {
			//将一色
			let curCardType = {
				type: gameProto.cardType.JIANGYISE,
				score: 5
			};
			cardType.push(curCardType);
			return cardType;
		}

		//清一色判断
		if (this.isQingYiSe(curOperateList, curUserCards)) {
			let curCardType = {
				type: gameProto.cardType.QINGYISE,
				score: 5
			};
			cardType.push(curCardType);
			return cardType;
		}

		let qiDuiList = [gameProto.cardType.SANHAOHUANGQIDUI, gameProto.cardType.SHUANGHAOHUANGQIDUI, gameProto.cardType.HAOHUANGQIDUI];
		qiDuiList = qiDuiList.concat([gameProto.cardType.QINGYISE, gameProto.cardType.JIANGYISE]);
		let isHaveQiDui = cardType.find(item => qiDuiList.includes(item.type));
		//七对算分
		if (isQiDui && !isHaveQiDui) {
			//7对
			let curCardType = {
				type: gameProto.cardType.QIDUI,
				score: 5
			};
			cardType.push(curCardType);
			return cardType;
		}
		//没有将对和清对 单独算对对胡
		let isHaveDui = cardType.find(item => item.type == gameProto.cardType.QINGYISE || item.type == gameProto.cardType.QIDUI || item.type == gameProto.cardType.JIANGYISE);
		if (!isHaveDui && this.isDuiDuiHu(curUserCards)) {
			let curCardType = {
				type: gameProto.cardType.PENGPENGHU,
				score: 5
			};
			cardType.push(curCardType);
			return cardType;
		}
		//大血 门清 手牌有癞子
		if (this.isMenQing(curOperateList)) {
			let curCardType = {};
			if (laiZiCount != 0) {
				curCardType = {
					type: gameProto.cardType.DAXUE,
					score: 5
				};
			} else {
				curCardType = {
					type: gameProto.cardType.DAXUE,
					score: 10
				};
			}
			cardType.push(curCardType);
			return cardType;
		}
		//小血 在吃牌、碰牌后，自摸胡牌且手里有癞子
		let curOperate = [gameProto.operateType.PENG, gameProto.operateType.GANG_BU, gameProto.operateType.GANG_CHI, gameProto.operateType.BU_PILAI];
		if (curOperateList.some(item => curOperate.includes(item.operate)) && card == null) {
			let curCardType = {};
			if (laiZiCount != 0) {
				curCardType = {
					type: gameProto.cardType.XIAOXUE,
					score: 3
				};
			} else {
				curCardType = {
					type: gameProto.cardType.XIAOXUE,
					score: 6
				};
			}
			cardType.push(curCardType);
			return cardType;
		}
		//屁胡
		if (cardType.length == 0) {
			let curCardType = {};
			if (laiZiCount != 0) {
				curCardType = {
					type: gameProto.cardType.PIHU,
					score: 1
				};
			} else {
				curCardType = {
					type: gameProto.cardType.PIHU,
					score: 2
				};
			}
			cardType.push(curCardType);
		}
		return cardType;
	}


	//判断缺的数量
	isQue(operateRecords, cards) {

		operateRecords = operateRecords.slice();
		let curCards = cards.slice();
		let count = 0;
		let allCards = this.getAllHandCards(operateRecords);
		curCards = curCards.concat(allCards);
		//是否缺万
		let isQueWan = curCards.every(item => item > 9);
		if (isQueWan) {
			count += 1;
		}
		//是否缺同
		let isQueTong = curCards.every(item => item < 10 || item > 19);
		if (isQueTong) {
			count += 1;
		}
		//是否缺万
		let isQueTiao = curCards.every(item => item < 20 || item > 29);
		if (isQueTiao) {
			count += 1;
		}
		return count;
	}

	//是否门清
	isMenQing(operateRecords) {

		let curOperate = [gameProto.operateType.PENG, gameProto.operateType.GANG_BU, gameProto.operateType.GANG_CHI, gameProto.operateType.BU_PILAI];
		return !operateRecords.some(item => curOperate.includes(item.operate));
	}

	//是否对对胡
	isDuiDuiHu(cards) {

		let curCards = cards.slice();
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
			if (cardCount[card] == 2) {
				duiList.push(card);
			} else if (cardCount[card] == 3) {
				kanList.push(card);
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

	//是否清一色
	isQingYiSe(operateRecords, cards) {

		operateRecords = operateRecords.slice();
		let curCards = cards.slice();
		let cardTypeList = [];
		curCards.forEach((item) => {
			let cardType = this.getCardType(item);
			if (!cardTypeList.includes(cardType)) {
				cardTypeList.push(cardType)
			}
		});
		if (cardTypeList.length > 1) {
			return false;
		}

		let curOperate = [gameProto.operateType.PENG, gameProto.operateType.GANG_CHI, gameProto.operateType.GANG_ZHI];
		//判断是否包含有其他花色的碰杠
		let haveOtherType = operateRecords.some(item => {
			return curOperate.includes(item.operate) && !cardTypeList.includes(this.getCardType(item.card))
		});
		return !haveOtherType;
	}

	//是否七对
	isQiDui(cards, laiziCount = 0) {

		let isQiDui = true;
		let isHaveFour = 0;
		if (cards.length + laiziCount != 14) {
			return {
				isQiDui: false,
				isHaveFour
			};
		}
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
				if (laiziCount > 0) {
					laiziCount--;
					if ((cardTypeList[cardType] + 1) == 4) {
						isHaveFour += 1;
					}
				} else {
					isQiDui = false;
					break;
				}
			} else if (cardTypeList[cardType] == 4) {
				//有几个4
				isHaveFour += 1;
			}
		}
		if (laiziCount >= 2) {
			isHaveFour += 1;
		}
		return {
			isQiDui,
			isHaveFour
		};
	}


	//是否基础将对牌型里面只包含2 5 8
	isBaseJiangDui(cards, operateRecords = []) {

		let curCards = cards.slice();
		let allCards = this.getAllHandCards(operateRecords);
		curCards = curCards.concat(allCards);
		let curList = [2, 5, 8];
		return curCards.every(item => curList.includes(this.getCardNumber(item)));
	}

	/*-----------------------------------基础工具函数-----------------------------------------*/

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
		let pengList = operateRecords.filter(item => {
			return item.operate == gameProto.operateType.PENG && !cardList.some(curItem => {
				return curItem.card == item.card
			})
		});
		for (let i = 0; i < pengList.length; i++) {
			let curList = pengList[i].plusInfo.cardList;
			curCards = curCards.concat(curList);
		}
		return curCards;

	}

	//获取牌值
	getCardNumber(card) {
		return card % 10;
	}

	//获取牌型
	getCardType(card) {

		return Math.floor(card / 10);
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
}


module.exports = new GameLogic();