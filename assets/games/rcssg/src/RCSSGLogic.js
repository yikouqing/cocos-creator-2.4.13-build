const gameProto = require('./ApiRcssg');

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
			// //添加万字 缺一门没有万字
			// for (let k = CARDID.CARDID_WAN1; k <= CARDID.CARDID_WAN9; k++) {
			// 	this.cards.push(k);
			// 	if (!this.tingCards.includes(k)) {
			// 		this.tingCards.push(k);
			// 	}
			// }
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

		//洗牌
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
			// //添加万字 缺一门没有万字
			// for (let k = CARDID.CARDID_WAN1; k <= CARDID.CARDID_WAN9; k++) {
			// 	cards.push(k);
			// }
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
	getCards(cardCount) {
		let array = [];
		if (this.cards.length >= cardCount) {
			array = this.cards.splice(0, cardCount);
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
		if (this.isQiDui(cards)) {
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
	getTingList(cards, laiziCount = 0, tianTing = false) {
		let tingList = [];
		if (tianTing) {
			for (let index = 0; index < cards.length; index++) {
				let lincards = cards.slice();
				let lincar = lincards[index];
				lincards.splice(index, 1);
				this.tingCards.map(item => {
					let curCards = lincards.slice();
					curCards.push(item);
					if (this.getCanHu(curCards, laiziCount)) {
						let curRateList = this.getCardRate(curCards);
						let rate = 0;
						for (let i = 0; i < curRateList.length; i++) {
							rate += curRateList[i].score;
						}
						tingList.push({
							cardID: item,
							hu: lincar,
							rate: rate,
						});
					}
				});
			}
		} else {
			this.tingCards.map(item => {
				let curCards = cards.slice();
				curCards.push(item);
				if (this.getCanHu(curCards, laiziCount)) {
					let curRateList = this.getCardRate(curCards);
					let rate = 0;
					for (let i = 0; i < curRateList.length; i++) {
						rate += curRateList[i].score;
					}
					tingList.push({
						cardID: item,
						rate: rate
					});
				}
			});
		}

		return tingList;
	}


	//判断玩家的顺坎
	checkShunKan(cards, laiZiCount = 0) {

		if ((cards.length + laiZiCount + 1) % 3 != 0) return false; //手牌数量限制
		cards.sort((a, b) => {
			return a - b;
		});
	}

	//获取牌型
	getCardRate(userCards) {

		let curUserCards = userCards.slice();
		//牌型分数
		let cardType = [];

		if (this.isQiDui(curUserCards)) {
			let curCardType = {};
			let isHaveFour = 0;
			let curCards = userCards.slice();
			let cardTypeList = {};
			curCards.forEach((item) => {
				if (!cardTypeList[item]) {
					cardTypeList[item] = 0;
				}
				cardTypeList[item] += 1;
			});
			for (let cardType in cardTypeList) {
				if (cardTypeList[cardType] == 4) {
					//有几个4
					isHaveFour += 1;
				}
			}
			// if (isHaveFour >= 3) {
			// 	if (this.getColorCount(userCards) == 1) {
			// 		//青三龙七对
			// 		curCardType = {
			// 			type: gameProto.plusRateType.SANQINGLONGQIDUI,
			// 			score: 36
			// 		};
			// 	} else {
			// 		//三龙七对
			// 		curCardType = {
			// 			type: gameProto.plusRateType.SANLONGQIDUI,
			// 			score: 30
			// 		};
			// 	}
			// } else if (isHaveFour >= 2) {
			// 	if (this.getColorCount(userCards) == 1) {
			// 		//青双龙七对
			// 		curCardType = {
			// 			type: gameProto.plusRateType.SHUANGQINGLONGQIDUI,
			// 			score: 26
			// 		};
			// 	} else {
			// 		//双龙七对
			// 		curCardType = {
			// 			type: gameProto.plusRateType.SHUANGLONGQIDUI,
			// 			score: 20
			// 		};
			// 	}
			// } else 
			if (isHaveFour >= 1) {
				if (this.getColorCount(userCards) == 1) {
					//青龙七对
					curCardType = {
						type: gameProto.plusRateType.QINGLONGQIDUI,
						score: 16
					};
				} else {
					//龙七对
					curCardType = {
						type: gameProto.plusRateType.LONGQIDUI,
						score: 10
					};
				}
			} else {
				if (this.getColorCount(userCards) == 1) {
					//清七对
					curCardType = {
						type: gameProto.plusRateType.QINGYISEQIDUI,
						score: 12
					};
				} else {
					//七对
					curCardType = {
						type: gameProto.plusRateType.QIDUI,
						score: 6
					};
				}
			}
			cardType.push(curCardType);
		} else if (this.isDuiDuiHu(curUserCards)) {
			let curCardType = {}
			if (this.getColorCount(userCards) == 1) {
				//清一色对对胡
				curCardType = {
					type: gameProto.plusRateType.QINGYISEDUIDUIHU,
					score: 10
				};
			} else {
				//对对胡
				curCardType = {
					type: gameProto.plusRateType.DADUIZI,
					score: 4
				};
			}
			cardType.push(curCardType);
		} else if (this.getCanHu(curUserCards)) {
			let curCardType = {}
			if (this.getColorCount(userCards) == 1) {
				//清一色平胡
				curCardType = {
					type: gameProto.plusRateType.QINGYISE,
					score: 6
				};
			} else {
				//平胡
				curCardType = {
					type: gameProto.plusRateType.PINGHU,
					score: 1
				};
			}
			cardType.push(curCardType);
		}
		return cardType;
	}
	isQiDui(cards) {
		if (cards.length != 14) {
			return false
		} else {
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
					return false
				}
			}
		}
		return true
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

	/*-----------------------------------基础工具函数-----------------------------------------*/


	//查询麻将总花色
	getColorCount(cards) {
		let curCards = cards.filter(item => item < 30);
		let colorCards = curCards.map(item => {
			return Math.floor(item / 10)
		});
		colorCards = new Set(colorCards);
		return colorCards.size;
	}

	//换三张推荐算法
	getHuanSanZhuang(cards, isSum = 3) {

		let handCard = cards.slice().sort((a, b) => {
			return a - b
		});
		let wanCard = handCard.filter(item => item < 10);
		let tongCard = handCard.filter(item => item > 10 && item < 20);
		let tiaoCard = handCard.filter(item => item > 20 && item < 30);
		let cardList = [{
			count: wanCard.length,
			list: wanCard
		},
		{
			count: tongCard.length,
			list: tongCard
		},
		{
			count: tiaoCard.length,
			list: tiaoCard
		},
		]
		cardList.sort((a, b) => {
			return a.count - b.count
		});
		cardList = cardList.find(item => item.count >= isSum);
		return cardList && cardList.list && cardList.list.slice(0, isSum);
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
	/*-------------------------------摆牌优化-------------------------------------*/

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

	getMaxMinCard(card) {

		if (card < 10) {
			return {
				max: 9,
				min: 1
			};
		} else if (card > 10 && card < 20) {
			return {
				max: 19,
				min: 11
			};
		} else if (card > 20 && card < 30) {
			return {
				max: 29,
				min: 21
			};
		}
	}
}
module.exports = new GameLogic();