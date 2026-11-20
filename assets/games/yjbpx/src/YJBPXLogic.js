let gameProto = require('./ApiYjbpx');

let CARDID = {
	CARDID_WAN1: 1, CARDID_WAN2: 2, CARDID_WAN3: 3, CARDID_WAN4: 4, CARDID_WAN5: 5, CARDID_WAN6: 6, CARDID_WAN7: 7, CARDID_WAN8: 8, CARDID_WAN9: 9,
	CARDID_TONG1: 11, CARDID_TONG2: 12, CARDID_TONG3: 13, CARDID_TONG4: 14, CARDID_TONG5: 15, CARDID_TONG6: 16, CARDID_TONG7: 17, CARDID_TONG8: 18, CARDID_TONG9: 19,
	CARDID_TIAO1: 21, CARDID_TIAO2: 22, CARDID_TIAO3: 23, CARDID_TIAO4: 24, CARDID_TIAO5: 25, CARDID_TIAO6: 26, CARDID_TIAO7: 27, CARDID_TIAO8: 28, CARDID_TIAO9: 29,
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
		if (laiziCount >= 2 && this.isShunKan(cards, laiziCount - 2)) {
			// 两个癞子做将牌特殊判定处理  
			return true;
		}
		return false;
	}

	//是否顺子和坎
	isShunKan(cards, laiziCount, isKan = true) {

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
}


module.exports = new GameLogic();