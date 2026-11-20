let gameProto = require('./ApiYbmj');

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
	CARDID_ZHONG: 35,
};


class GameLogic {

	constructor() {
		this.tingCards = [];
		this.gameRule = {};
		this.allCards = [];
		this.cards = []; //卡牌列表
	}

	initRule(gameRule) {
		this.gameRule = gameRule;
		//初始化所有卡牌
		this.allCards = this.initBaseCards();
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
		//添加红中 
		if (this.gameRule.hongZhong != gameProto.HongZhong.NONE) {
			for (let index = 0; index < this.gameRule.hongZhong; index++) {
				cards.push(CARDID.CARDID_ZHONG);
			}
		}
		//初始化听牌列表
		this.tingCards = Array.from(new Set(cards.slice()));
		//返回卡牌
		return cards;
	}
	//换三张推荐算法
	getQueType(cards) {
		if (!cards || cards.length == 0) {
			return 0;
		}
		let handCard = cards.slice().sort((a, b) => {
			return a - b
		});
		let wanCard = handCard.filter(item => item < 10);
		let tongCard = handCard.filter(item => item > 10 && item < 20);
		let tiaoCard = handCard.filter(item => item > 20 && item < 30);
		let cardList = [{
			count: wanCard.length,
			list: wanCard,
			type: 0
		},
		{
			count: tongCard.length,
			list: tongCard,
			type: 1
		},
		{
			count: tiaoCard.length,
			list: tiaoCard,
			type: 2
		},
		]
		cardList.sort((a, b) => {
			return a.count - b.count
		});
		let queType = cardList[0].type;
		return queType;
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

	//获取癞子
	getLaiZiCards() {

		let laiZiCards = [];
		let fanCard = null;
		//听牌随机抽牌玩法
		if (this.gameRule.tingYong != gameProto.TingPai.NONE) {
			let card = this.getCards(1)[0];
			fanCard = card;
			if (this.gameRule.tingYong == gameProto.TingPai.SITING) {
				//4听 为翻牌上张 翻5 用4
				if (card % 10 == 1) {
					let laiCard = card + 8;
					laiZiCards = [laiCard];
				} else {
					let laiCard = card - 1;
					laiZiCards = [laiCard];
				}
			} else if (this.gameRule.tingYong == gameProto.TingPai.BATING) {
				//8听 为翻牌上下张 翻5 用4 6 
				if (card % 10 == 9) {
					let laiCard = card - 8;
					laiZiCards.push(laiCard);
					laiCard = card - 1;
					laiZiCards.push(laiCard);
				} else if (card % 10 == 8) {
					let laiCard = card + 1;
					laiZiCards.push(laiCard);
					laiCard = card - 1;
					laiZiCards.push(laiCard);
				} else if (card % 10 == 1) {
					let laiCard = card + 1;
					laiZiCards.push(laiCard);
					laiCard = card + 8;
					laiZiCards.push(laiCard);
				} else {
					let laiCard = card + 1;
					laiZiCards.push(laiCard);
					laiCard = card - 1;
					laiZiCards.push(laiCard);
				}
			} else if (this.gameRule.tingYong == gameProto.TingPai.SHIYITING) {
				//11听 为翻牌+上下张 翻5 用4 5 6 
				if (card % 10 == 9) {
					let laiCard = card - 8;
					laiZiCards.push(laiCard);
					laiCard = card - 1;
					laiZiCards.push(laiCard);
				} else if (card % 10 == 8) {
					let laiCard = card + 1;
					laiZiCards.push(laiCard);
					laiCard = card - 1;
					laiZiCards.push(laiCard);
				} else if (card % 10 == 1) {
					let laiCard = card + 1;
					laiZiCards.push(laiCard);
					laiCard = card + 8;
					laiZiCards.push(laiCard);
				} else {
					let laiCard = card + 1;
					laiZiCards.push(laiCard);
					laiCard = card - 1;
					laiZiCards.push(laiCard);
				}
				laiZiCards.push(card);
			}
		}
		//听牌红中玩法
		else if (this.gameRule.hongZhong != gameProto.HongZhong.NONE) {
			laiZiCards = [CARDID.CARDID_ZHONG];
			fanCard = CARDID.CARDID_ZHONG;
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
	getTingList(cards, laiZiCards) {

		let tingList = [];
		this.tingCards.map(item => {
			let curCards = cards.slice();
			curCards.push(item);
			let TingLList = curCards.filter(item => !laiZiCards.includes(item));
			let laiZiList = curCards.filter(item => laiZiCards.includes(item)).length;
			if (this.getCanHu(TingLList, laiZiList)) {
				tingList.push({
					cardID: item,
					rate: 1
				});
			}
		});
		return tingList;
	}

	/*-------------------------------------牌型判断-------------------------------------------------*/
	//是否是对对胡
	isDuiDuiHu(cardList, laiCount) {
		if (cardList.length == 2) {
			return true;
		}
		let curCardsCount = cardList.length + laiCount;
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
			if (cardCount[card] >= 3) {
				kanList.push(card);
			} else if (cardCount[card] == 2 && laiCount > 0) {
				kanList.push(card);
				laiCount -= 1;
			} else if (duiList.length == 0 && cardCount[card] == 2 && laiCount == 0) {
				duiList.push(card);
			} else if (duiList.length == 0 && cardCount[card] == 1 && laiCount > 0) {
				duiList.push(card);
				laiCount -= 1;
			} else if (cardCount[card] == 1 && laiCount >= 2) {
				kanList.push(card);
				laiCount -= 2;
			} else if (cardCount[card] == 1 && laiCount == 0) {
				return false;
			}
		}
		let handCardCount = ((duiList.length * 2) + (kanList.length * 3)) + laiCount;
		if ((duiList.length == 1 || (duiList.length == 0 && laiCount >= 2)) && handCardCount == curCardsCount) {
			return true;
		} else {
			return false;
		}
	}
	//判断是鸡胡还是胡
	getJiPingHu(cardList, laiZiCount) {
		let curCards = cardList.slice();
		let isCanHuNoKan = this.getCanHu(curCards, laiZiCount);
		if (isCanHuNoKan) {
			return gameProto.cardType.PINGHU;
		}
	}
	//是否七对
	isQiDui(cardList, laiZiCount = 0, ISJiaoSe = true) {

		if (ISJiaoSe && cardList.length + laiZiCount != 14) return 0;
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
					return 0;
				}
			}
		}
		curFourCount += (laiZiCount / 2);
		let qingyise = this.isQingYiSe(cardList.slice());
		if (curFourCount > 0 && qingyise) {
			return gameProto.cardType.QINGLONGQIDUI
		} else if (qingyise) {
			return gameProto.cardType.QINGQIDUI
		} else if (curFourCount > 0) {
			return gameProto.cardType.LONGQIDUI
		} else {
			return gameProto.cardType.QIDUI
		}
	}
	//是否清一色
	isQingYiSe(cardList, operateList = [], laiZiCards = []) {
		let curList = cardList.slice();
		for (let i = 0; i < operateList.length; i++) {
			curList = curList.concat(operateList[i].plusInfo.cardList);
		}
		curList = curList.filter(item => !laiZiCards.includes(item));
		return curList.every(item => this.getCardColor(item) == this.getCardColor(curList[0]) && this.getCardColor(item) <= 2);
	}
	//是否枯支压
	isKuZhiYa(uid, handCards, huCards, KuZhiYaData) {
		let linKuZhiYa = handCards[uid].slice().sort((a, b) => {
			return a - b
		});
		let IShu = true;
		//查询别的玩家手上有无绝张牌
		for (let key in handCards) {
			if (uid == key) {
				continue;
			}
			if (handCards[key].includes(huCards)) {
				IShu = false;
				break;
			}
		}
		//查询库 有无绝张牌
		if (KuZhiYaData.includes(huCards)) {
			IShu = false;
		}
		if (IShu && this.isYaDang(linKuZhiYa, huCards)) {
			return true;
		}
		return false;
	}
	//是否不动手 
	isBuDongShou(operateRecords) {
		let curOperate = [gameProto.operateType.PENG, gameProto.operateType.GANG_BU, gameProto.operateType.GANG_CHI];
		return !operateRecords.some(item => curOperate.includes(item.operate));
	}
	//是否压档
	isYaDang(cardList, huCards) {
		let YaDang = cardList.slice().sort((a, b) => {
			return a - b
		});
		let linYaDang = Array.from(new Set(YaDang));
		let linkey_on = linYaDang.indexOf(huCards - 1);
		let linkey_tow = linYaDang.indexOf(huCards + 1);
		let linkey_Sui = linYaDang.indexOf(huCards);
		if (linkey_on != -1 && linkey_tow != -1) {
			YaDang.splice(YaDang.indexOf(linYaDang[linkey_on]), 1);
			YaDang.splice(YaDang.indexOf(linYaDang[linkey_Sui]), 1);
			YaDang.splice(YaDang.indexOf(linYaDang[linkey_tow]), 1);
			if (this.getCanHu(YaDang)) {
				return true;
			}
		}
		return false;
	}
	//是否双扑
	isShuangPu(cardList) {
		let ShuangPu = cardList.slice().sort((a, b) => {
			return a - b
		});
		let cardCount = {};
		for (let i = 0; i < ShuangPu.length; i++) {
			let curCard = ShuangPu[i];
			if (!cardCount[curCard]) {
				cardCount[curCard] = 0;
			}
			cardCount[curCard] += 1;
		}
		let linShuangPu = Array.from(new Set(ShuangPu));
		for (let index = 0; index < linShuangPu.length; index++) {
			let linkey_on = linShuangPu.indexOf(linShuangPu[index] - 1);
			let linkey_tow = linShuangPu.indexOf(linShuangPu[index] + 1);
			let linkey_Sui = linShuangPu.indexOf(linShuangPu[index]);
			if (linkey_on != -1 && linkey_Sui != -1 && linkey_tow != -1 && cardCount[linShuangPu[linkey_on]] >= 2
				&& cardCount[linShuangPu[linkey_tow]] >= 2 && cardCount[linShuangPu[linkey_Sui]] >= 2) {
				let lingetCanHu = ShuangPu.slice();
				lingetCanHu.splice(lingetCanHu.indexOf(linShuangPu[linkey_on]), 2);
				lingetCanHu.splice(lingetCanHu.indexOf(linShuangPu[linkey_Sui]), 2);
				lingetCanHu.splice(lingetCanHu.indexOf(linShuangPu[linkey_tow]), 2);
				if (this.getCanHu(lingetCanHu)) {
					return true;
				}
			}
		}
		return false;
	}
	//十老
	isShiLao(cardList) {
		let ShiLao = cardList.slice().sort((a, b) => {
			return a - b
		});
		let cardCount = 0;
		for (let i = 0; i < ShiLao.length; i++) {
			if (ShiLao[i] >= 30) {
				continue;
			}
			if ((ShiLao[i] % 10) >= 5) {
				cardCount++;
			}
		}
		if (cardCount >= 10) {
			return true;
		}
		return false;
	}
	//十小
	isShiXiao(cardList) {
		let ShiXiao = cardList.slice().sort((a, b) => {
			return a - b
		});
		let cardCount = 0;
		for (let i = 0; i < ShiXiao.length; i++) {
			if (ShiXiao[i] >= 30) {
				continue;
			}
			if ((ShiXiao[i] % 10) <= 5) {
				cardCount++;
			}
		}
		if (cardCount >= 10) {
			return true;
		}
		return false;
	}
	//全老
	isQuanLao(cardList) {
		let QuanLao = cardList.slice().sort((a, b) => {
			return a - b
		});
		let cardCount = 0;
		for (let i = 0; i < QuanLao.length; i++) {
			if (QuanLao[i] >= 30) {
				return false;
			}
			if ((QuanLao[i] % 10) >= 5) {
				cardCount++;
			}
		}
		if (cardCount >= cardList.length) {
			return true;
		}
		return false;
	}
	//全小
	isQuanXiao(cardList) {
		let QuanXiao = cardList.slice().sort((a, b) => {
			return a - b
		});
		let cardCount = 0;
		for (let i = 0; i < QuanXiao.length; i++) {
			if (QuanXiao[i] >= 30) {
				return false;
			}
			if ((QuanXiao[i] % 10) <= 5) {
				cardCount++;
			}
		}
		if (cardCount >= cardList.length) {
			return true;
		}
		return false;
	}
	//是否绝张
	isJueZhang(uid, handCard, huCards, cards) {
		let JueZhang = true;
		//查询别的玩家手上有无绝张牌
		for (let key in handCard) {
			if (uid == key) {
				continue;
			}
			if (handCard[key].includes(huCards)) {
				JueZhang = false;
				break;
			}
		}
		//查询库 有无绝张牌
		if (cards.includes(huCards)) {
			JueZhang = false;
		}
		if (JueZhang == true) {
			return true;
		}
		return false;
	}
	getUserHuScore(huType) {
		//牌型
		if (huType == gameProto.cardType.QINGLONGQIDUI) {
			//清龙七对
			return 7;
		} else if (huType == gameProto.cardType.QINGQIDUI) {
			//清七对
			return 6;
		} else if (huType == gameProto.cardType.QINGDUI) {
			//清对
			return 6;
		} else if (huType == gameProto.cardType.LONGQIDUI) {
			//龙七对
			return 3;
		} else if (huType == gameProto.cardType.QIDUI) {
			//七对
			return 3;
		} else if (huType == gameProto.cardType.QINGYISE) {
			//清一色
			return 3;
		} else if (huType == gameProto.cardType.DUIDUIHU) {
			//对对胡
			return 3;
		} else if (huType == gameProto.cardType.PINGHU) {
			//平胡
			return 1;
		} else {
			return 0;
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
	getAiUserOperate(operateArray, handCards, laiZiCards, isSmart = false, queType) {
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
				let card = null;
				if (this.gameRule.isQueYiMen) {
					let CardColor = handCards.filter(item => this.getCardColor(item) == queType);
					if (CardColor.length > 0) {
						card = CardColor[0];
					}
				}
				if (!card) {
					card = this.getAiOutCards(handCards, laiZiCards, isSmart);
				}
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
			let card = null;
			if (this.gameRule.isQueYiMen) {
				let CardColor = handCards.filter(item => this.getCardColor(item) == queType);
				if (CardColor.length > 0) {
					card = CardColor[0];
				}
			}
			if (!card) {
				card = this.getAiOutCards(handCards, laiZiCards, isSmart);
			}
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