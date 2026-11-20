var gameProto = require('./ApiXcmj');
const CARDID = {
	CARDID_WAN1: 1, CARDID_WAN2: 2, CARDID_WAN3: 3, CARDID_WAN4: 4, CARDID_WAN5: 5, CARDID_WAN6: 6, CARDID_WAN7: 7, CARDID_WAN8: 8, CARDID_WAN9: 9,
	CARDID_TONG1: 11, CARDID_TONG2: 12, CARDID_TONG3: 13, CARDID_TONG4: 14, CARDID_TONG5: 15, CARDID_TONG6: 16, CARDID_TONG7: 17, CARDID_TONG8: 18, CARDID_TONG9: 19,
	CARDID_TIAO1: 21, CARDID_TIAO2: 22, CARDID_TIAO3: 23, CARDID_TIAO4: 24, CARDID_TIAO5: 25, CARDID_TIAO6: 26, CARDID_TIAO7: 27, CARDID_TIAO8: 28, CARDID_TIAO9: 29,
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
			//添加万字 缺一门没有万字
			for (let k = CARDID.CARDID_WAN1; !this.gameRule.queYiMen && k <= CARDID.CARDID_WAN9; k++) {
				this.cards.push(k);
				if (!this.tingCards.includes(k)) {
					this.tingCards.push(k);
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

		//洗牌
		for (let i = 0; i < 300; ++i) {
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
		//特殊牌型
		if (this.isQiDui(cards).isQiDui) {
			return true;
		}
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
				}
				else {
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
					}
					else {
						curLaizi -= 1;//没有的时候使用癞子替换
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
				}
				else {
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
				for (let i = 0; i < curRateList.length; i++) {
					rate += curRateList[i].score;
				}
				tingList.push({ cardID: item, rate: rate });
			}
		});
		return tingList;
	}

	//获取牌型
	getCardRate(userCards, curOperateList) {

		let curUserCards = userCards.slice();
		//牌型分数
		let cardType = [];

		let { isQiDui, isHaveFour } = this.isQiDui(curUserCards);
		//将对判断相关
		if (this.isBaseJiangDui(curUserCards, curOperateList)) {

			if (isQiDui) {
				if (isHaveFour >= 2) {
					//将双龙七对6蕃
					let curCardType = { type: gameProto.plusRateType.JIANGSHUANGLONGQIDUI, score: 6 };
					cardType.push(curCardType);
				} else if (isHaveFour == 1) {
					//将龙七对5蕃
					let curCardType = { type: gameProto.plusRateType.JIANGLONGQIDUI, score: 5 };
					cardType.push(curCardType);
				} else {
					//将七对4蕃
					let curCardType = { type: gameProto.plusRateType.JIANGLONGQIDUI, score: 4 };
					cardType.push(curCardType);
				}
			} else if (this.isDuiDuiHu(curUserCards)) {
				//将对3蕃
				let curCardType = { type: gameProto.plusRateType.JIANGDUI, score: 3 };
				cardType.push(curCardType);
			}
		}

		//清一色判断
		if (this.isQingYiSe(curOperateList, curUserCards)) {

			if (isQiDui) {
				if (isHaveFour >= 2) {
					//清双龙七对6蕃
					let curCardType = { type: gameProto.plusRateType.QINGSHUANGLONGQIDUI, score: 6 };
					cardType.push(curCardType);
				} else if (isHaveFour == 1) {
					//清龙七对5蕃
					let curCardType = { type: gameProto.plusRateType.QINGLONGQIDUI, score: 5 };
					cardType.push(curCardType);
				} else {
					//清七对4蕃
					let curCardType = { type: gameProto.plusRateType.QINGDIDUI, score: 4 };
					cardType.push(curCardType);
				}
			} else if (this.isDuiDuiHu(curUserCards)) {
				//清大对3蕃
				let curCardType = { type: gameProto.plusRateType.QINGDADUI, score: 3 };
				cardType.push(curCardType);
			} else {
				//清一色2蕃
				let curCardType = { type: gameProto.plusRateType.QINGYISE, score: 2 };
				cardType.push(curCardType);
			}
		}

		let qiDuiList = [gameProto.plusRateType.QINGDIDUI, gameProto.plusRateType.QINGLONGQIDUI, gameProto.plusRateType.QINGSHUANGLONGQIDUI];
		qiDuiList = qiDuiList.concat([gameProto.plusRateType.JIANGLONGQIDUI, gameProto.plusRateType.JIANGLONGQIDUI, gameProto.plusRateType.JIANGSHUANGLONGQIDUI]);
		let isHaveQiDui = cardType.find(item => qiDuiList.includes(item.type));
		//七对算分
		if (isQiDui && !isHaveQiDui) {
			if (isHaveFour) {
				//豪七对
				let curCardType = { type: gameProto.plusRateType.LONGQIDUI, score: 3 };
				cardType.push(curCardType);
			} else {
				//7对
				let curCardType = { type: gameProto.plusRateType.QIDUI, score: 2 };
				cardType.push(curCardType);
			}
		}

		//判断幺九大队
		if (this.isBaseYaoJiu(curUserCards, curOperateList) && this.isDuiDuiHu(curUserCards)) {
			let curCardType = { type: gameProto.plusRateType.YAOJIUDADUIZI, score: 3 };
			cardType.push(curCardType);
		} else if (this.isYaoJiu(curUserCards, curOperateList)) {
			//幺九
			let curCardType = { type: gameProto.plusRateType.YAOJIUDADUIZI, score: 2 };
			cardType.push(curCardType);
		}

		//卡心5
		if (this.isKaWu(curUserCards, this.huCards)) {
			let curCardType = { type: gameProto.plusRateType.KAWU, score: 1 };
			cardType.push(curCardType);
		}

		//没有将对和清对 单独算对对胡
		let isHaveDui = cardType.find(item => item.type == gameProto.plusRateType.QINGDADUI || item.type == gameProto.plusRateType.QIDUI || item.type == gameProto.plusRateType.JIANGDUI || item.type == gameProto.plusRateType.YAOJIUDADUIZI);
		if (!isHaveDui && this.isDuiDuiHu(curUserCards)) {
			let curCardType = { type: gameProto.plusRateType.DADUIZI, score: 1 };
			cardType.push(curCardType);
		}

		//是否缺一门
		if (this.gameRule.queMenJiaFan && this.isQue(curOperateList, curUserCards) == 1) {
			let curCardType = { type: gameProto.plusRateType.QUEYIMEN, score: 1 };
			cardType.push(curCardType);
		}

		//门清中张
		if (this.gameRule.menQingZhongZhang && this.isMenQing(curOperateList)) {
			let curCardType = { type: gameProto.plusRateType.MENQING, score: 1 };
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

		let curOperate = [gameProto.operateType.PENG, gameProto.operateType.GANG_BU, gameProto.operateType.GANG_CHI];
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
		let haveOtherType = operateRecords.some(item => { return curOperate.includes(item.operate) && !cardTypeList.includes(this.getCardType(item.card)) });
		return !haveOtherType;
	}

	//是否七对
	isQiDui(cards) {

		let isQiDui = true;
		let isHaveFour = 0;
		if (cards.length != 14) {
			isQiDui = false
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
					isQiDui = false;
					break;
				} else if (cardTypeList[cardType] == 4) {
					//有几个4
					isHaveFour += 1;
				}
			}
		}
		return { isQiDui, isHaveFour };
	}


	//是否基础将对牌型里面只包含2 5 8
	isBaseJiangDui(cards, operateRecords = []) {

		let curCards = cards.slice();
		let allCards = this.getAllHandCards(operateRecords);
		curCards = curCards.concat(allCards);
		let curList = [2, 5, 8];
		return curCards.every(item => curList.includes(this.getCardNumber(item)));
	}

	//判断是否幺九
	isBaseYaoJiu(cards, operateRecords = []) {

		let curCards = cards.slice();
		let allCards = this.getAllHandCards(operateRecords);
		curCards = curCards.concat(allCards);
		let curList = [1, 9];
		return curCards.every(item => curList.includes(this.getCardNumber(item)));
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

	//判断是否幺九
	isYaoJiu(cards, operateRecords = []) {

		let curCards = cards.slice();
		let allCards = this.getAllHandCards(operateRecords);
		//如果包含456
		if (curCards.some(item => [4, 5, 6].includes(this.getCardNumber(item)))) {
			return false;
		}
		//如果包含其他牌
		if (allCards.some(item => ![1, 9].includes(this.getCardNumber(item)))) {
			return false;
		}
		return true;
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
				isDuiDui = false;
				break;
			}
		}
		return isDuiDui;

	}

	/*-----------------------------------基础工具函数-----------------------------------------*/


	//查询麻将总花色
	getColorCount(cards) {
		let curCards = cards.filter(item => item < 30);
		let colorCards = curCards.map(item => { return Math.floor(item / 10) });
		colorCards = new Set(colorCards);
		return colorCards.size;
	}

	//换三张推荐算法
	getHuanSanZhuang(cards) {

		let handCard = cards.slice().sort((a, b) => { return a - b });
		let wanCard = handCard.filter(item => item < 10);
		let tongCard = handCard.filter(item => item > 10 && item < 20);
		let tiaoCard = handCard.filter(item => item > 20 && item < 30);
		let cardList = [
			{ count: wanCard.length, list: wanCard },
			{ count: tongCard.length, list: tongCard },
			{ count: tiaoCard.length, list: tiaoCard },
		]
		cardList.sort((a, b) => { return a.count - b.count });
		cardList = cardList.find(item => item.count >= 3);
		return cardList && cardList.list && cardList.list.slice(0, 3);
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
			let { isQiDui } = this.isQiDui(qiDuiList);
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


	//获取明牌
	getMinPaiList(cardList) {
		//单调一张牌
		if (cardList.length == 1) {
			// console.log(`dandiao hu cardList = ${cardList} `);
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

						curList.push(qianCard1, houCard1, huPaiList[0]);
						// console.log(`baoduzi jiangdui cardList = ${cardList} huPaiList = ${curList}`);
					}
					// console.log(`dandiao jiangdui cardList = ${cardList} huPaiList = ${curList}`);
					return curList;
				}
			}
		}

		//判断7对胡牌
		if (cardList.length == 13 && huPaiList.length == 1) {

			let curCards = cardList.concat(huPaiList);
			let { isQiDui } = this.isQiDui(curCards);
			if (isQiDui) {
				// console.log(`qidui hu cardList = ${cardList} huPaiList = ${huPaiList}`);
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
		// console.log('mingPaiList:  ' + mingPaiList);

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
						// console.log(`bianbianbu mingPaiList = ${mingPaiList} huPaiList = ${huPaiList}`);
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
						// console.log(`bianbianbu mingPaiList = ${mingPaiList} huPaiList = ${huPaiList}`);
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
						// console.log(`kakahu mingPaiList = ${mingPaiList} huPaiList = ${huPaiList}`);
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


			//判断3455667等情况
			let curMingList = mingPaiList.slice();
			let baiList = [];
			for (let i = huCards1; i <= huCards2; i++) {
				let curIndex = curMingList.findIndex(item => item == i);
				if (curIndex != -1) {
					baiList.push(i);
					curMingList.splice(curIndex, 1);
				}
			}

			let curDiffList = [... new Set(mingPaiList)];

			if (curDiffList.length == mingPaiList.length) {

				return mingPaiList;
			}
			else if (this.isShunKan(curMingList)) {
				// console.log(`duanhu baiList = ${baiList} curMingList = ${curMingList}`);
				return baiList;
			}
			else if ((!mingPaiList.includes(huCards1) && !mingPaiList.includes(huCards2)) || ((mingPaiList.includes(huCards1) && huCount1 <= 1) || (mingPaiList.includes(huCards2) && huCount2 <= 1))) {
				let qianCard1 = huCards1 + 1;
				let qianCard2 = huCards1 + 2;
				if (mingPaiList.includes(qianCard1) && mingPaiList.includes(qianCard2) && (huCards2 - 1 == qianCard2 && huCards2 - 2 == qianCard1)) {
					// console.log(`duanhu mingPaiList = ${mingPaiList} huPaiList = ${huPaiList}`);
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
					// console.log(`duiduihu mingPaiList = ${mingPaiList} huPaiList = ${huPaiList}`);
					return [huCards1, huCards1, huCards2, huCards2];
				}
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
								// console.log(`remove kan mingPaiList = ${mingPaiList} curCard = ${curCard}`);
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

	getMaxMinCard(card) {

		if (card < 10) {
			return { max: 9, min: 1 };
		} else if (card > 10 && card < 20) {
			return { max: 19, min: 11 };
		} else if (card > 20 && card < 30) {
			return { max: 29, min: 21 };
		}
	}


}
module.exports = new GameLogic();