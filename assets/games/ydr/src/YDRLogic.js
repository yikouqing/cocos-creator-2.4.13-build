const gameProto = require('./ApiYdr');

const CARDID = {
	DIPAI: 2,
	DINGDING: 3,
	HEPAI: 4,
	CHANGER: 14,
	YAOSI: 5,
	GUAIZI: 15,
	MAOMAO: 6,
	CHANGSAN: 16,
	ERHONG: 26,
	SANSI: 7,
	ERWU: 17,
	QIAOJIAO: 27,
	RENPAI: 8,
	SANWU: 18,
	PINGBA: 28,
	HONGHJIU: 9,
	HEIJIU: 19,
	MEIZI: 10,
	SILIU: 20,
	FUTOU: 31,
	TIANPAI: 42
};

const CAISHEN = 100;


class GameLogic {

	init(gameRule) {
		this.cards = []; //列表列表
		this.tingCards = []; //可以听牌的列表
		this.gameRule = gameRule;
	}

	//初始化卡牌
	initCards(chairCount) {

		this.cards = [];
		for (let i = 0; i < 5; i++) {
			//添加字牌
			for (let key in CARDID) {
				let cardNum = CARDID[key];
				this.cards.push(cardNum);
			}
		}

		if (this.gameRule.caiShenCount) {
			for (let i = 0; i < this.gameRule.caiShenCount; i++) {
				this.cards.push(CAISHEN);
			}
		}

		//洗牌
		for (let i = 0; i < 200; ++i) {
			let index = i % this.cards.length;
			let random1 = Math.floor(Math.random() * this.cards.length);
			let tmp = this.cards[index];
			this.cards[index] = this.cards[random1];
			this.cards[random1] = tmp;
		}

		//如果只有两个玩家 牌会少20张
		if (chairCount == 2) {
			//this.cards.splice(-20);
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
		return this.cards.length;
	}

	//获取牌值
	getCardNumber(card) {

		if (card < 30) {
			return (card % 10) || 10;
		} else if (card == CARDID.FUTOU) {
			return 11;
		} else if (card == CARDID.TIANPAI) {
			return 12;
		}
	}

	//获取卡牌点数 是否有陀
	getCardPoint(card) {

		let point = 0;
		if (card != CARDID.PINGBA) {
			let shang = parseInt(card / 10);
			if (shang % 2 == 0) {
				point = 1
			}
		}
		return point;
	}

	//获取牌陀数
	getCardTuo(list) {

		let tuo = 0;
		if (list.every(item => {
			return item == list[0]
		})) {
			//黑牌 4,6,8陀  红牌 8,12,16陀
			let point = this.getCardPoint(list[0]);
			if (list.length == 3) {
				tuo = point ? 8 : 4;
			} else if (list.length == 4) {
				tuo = point ? 12 : 6;
			} else if (list.length == 5) {
				tuo = point ? 16 : 8;
			}
		} else {
			//吃牌获取陀数
			for (let i = 0; i < list.length; i++) {
				tuo += this.getCardPoint(list[i]);
			}
		}
		return tuo;
	}


	//检查是否卯
	checkMaoAndTuo(list) {
		let tuo = 0;
		let mao = -1;
		if (list.length != 3) {
			return {
				tuo,
				mao
			};
		}
		let curCards = list.slice();
		curCards.sort((a, b) => {
			return a - b
		});
		if (curCards.every(item => this.getCardNumber(item) == 7)) {
			mao = 1;
			tuo = this.getCardTuo(curCards);
			return {
				tuo,
				mao
			};
		} else if (curCards.every(item => item == curCards[0])) {
			mao = 1;
			tuo = this.getCardTuo(curCards);
			return {
				tuo,
				mao
			};
		} else {
			//如果不是7 则是一对和卯牌组合 
			let isQianMao = (curCards[0] == curCards[1]) && (this.getCardNumber(curCards[0]) + this.getCardNumber(curCards[2]) == 14);
			let isHouMao = (curCards[2] == curCards[1]) && (this.getCardNumber(curCards[0]) + this.getCardNumber(curCards[2]) == 14);
			if (isQianMao || isHouMao) {
				tuo = this.getCardTuo(curCards);
				mao = 1;
			}
			return {
				tuo,
				mao
			};
		}
	}

	//获取玩家最大的卯和点数
	getMaxMaoAndTuo(userID, userCards, operateCardList, operateRecords) {

		//已经打过的牌
		let maxMao = 0;
		let maxTuo = 0;
		let curCardList = operateRecords.filter(item => item.operate == gameProto.operateType.DIU);
		//所有玩家吃碰杠的牌
		let operateTypeList = [gameProto.operateType.CHI, gameProto.operateType.PENG, gameProto.operateType.SHA, gameProto.operateType.TUHUO];
		for (let uid in operateCardList) {
			let operateList = this.operateCardList[uid].filter(item => operateTypeList.includes(item.operate));
			for (let i = 0; i < operateList.length; i++) {
				let curList = operateList[i].cardList;
				curCardList = curCardList.concat(curList);
				if (uid == userID) {
					maxMao += 1;
					maxTuo += this.getCardTuo(curList);
				}
			}
		}

		let curCards = userCards.slice();
		let baseList = [];
		for (let i = 0; i < curCards.length; i++) {
			let curCard = curCards[i];
			if (!baseList.some(item => item.card == curCard)) {
				let cardList = curCards.filter(item => item == curCard);
				let point = this.getCardNumber(curCard);
				let tuo = this.getCardPoint(curCard);
				baseList.push({
					cardList: cardList,
					card: curCard,
					count: cardList.length,
					point: point,
					tuo: tuo
				});
			}
		}

		//先查找杠以上  
		let tuoPlus3List = baseList.filter(item => item.count >= 3);
		for (let i = 0; i < tuoPlus3List.length; i++) {
			let curList = tuoPlus3List[i].cardList;
			maxMao += 1;
			maxTuo += this.getCardTuo(curList);
		}

		//优先找对的卯和陀
		let curDuiMaxMao = 0;
		let curDuiMaxTuo = 0;
		let tuoPlus2List = baseList.filter(item => item.count == 2);
		for (let i = 0; i < tuoPlus2List.length; i++) {
			let curList = tuoPlus2List[i].cardList;
			let curCard = tuoPlus2List[i].card;
			let outCards = curCardList.filter(item => item == curCard);
			if (outCards.length + curList.length < 5) {
				curDuiMaxMao += 1
				curList.push(curCard);
				curDuiMaxTuo += this.getCardTuo(curList);
			}
		}

		//判断可能存在的卯
		let dan1List = baseList.filter(item => item.count == 1 && item.point <= 7);
		let maoCardList = [];
		let maoCardObj = {};
		for (let i = 0; i < dan1List.length; i++) {

			let point = dan1List[i].point;
			let cardList = [];
			let maoPoint = 14 - point;
			if (!maoCardObj[point]) {
				maoCardObj[point] = true;
				let maoList = baseList.filter(item => item.count == 1 && [point, maoPoint].includes(item.point));
				for (let k = 0; k < maoList.length; k++) {
					cardList = cardList.concat(maoList[k].cardList);
				}
				if (cardList.length >= 2) {
					curDuiMaxMao += 1;
				}
				let curTuo = this.getCardTuo(cardList);
				let plusTuo = curTuo > 0 ? parseInt(cardList.length / 2) : 0;
				totalTuo += curTuo + plusTuo;
				maoCardList.push(cardList);
			}
		}




	}

	//获取牌型分类
	getCardTypeList(userCards, operateList = []) {

		let curCards = userCards.slice();
		let baseList = [];
		for (let i = 0; i < curCards.length; i++) {
			let curCard = curCards[i];
			if (!baseList.some(item => item.card == curCard)) {
				let cardList = curCards.filter(item => item == curCard);
				let point = this.getCardNumber(curCard);
				let tuo = this.getCardPoint(curCard);
				let outCards = operateList.filter(item => item == curCard);
				let maxTuo = this.getCardTuo(cardList);
				let leftCount = 5 - outCards.length - cardList.length;
				let leftCard = [];
				if (leftCount > 0) {
					leftCard = (new Array(leftCount)).fill(curCard);
				}
				if (cardList.length >= 2 && leftCount > 0) {
					let curList = cardList.slice();
					curList.push(curCard);
					maxTuo = this.getCardTuo(curList);
				}
				baseList.push({
					leftCard,
					cardList,
					point,
					tuo,
					maxTuo,
					leftCount,
					card: curCard,
					count: cardList.length
				});
			}
		}
		return baseList;
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

	//获取剩余的卡牌
	getCurAndLeftCardList(baseList) {

		let leftCard = [];
		let curCardList = [];

		for (let i = 0; i < baseList.length; i++) {
			if (baseList[i].leftCard && baseList[i].leftCard.length > 0) {
				leftCard = leftCard.concat(baseList[i].leftCard);
			}
			curCardList = curCardList.concat(baseList[i].cardList);
		}
		return {
			leftCard: leftCard.slice(),
			curCardList: curCardList.slice()
		};
	}

	//获取玩家的卯数和最大点数
	getMaoAndTuoTotal(cardList, operateList = []) {

		let totalMao = 0;
		let totalTuo = 0;

		let userCards = cardList.slice();
		let baseList = this.getCardTypeList(userCards, operateList);

		//计算3个以上的陀和卯
		let tuoPlusList = baseList.filter(item => item.count >= 3);
		for (let i = 0; i < tuoPlusList.length; i++) {
			let curDetail = tuoPlusList[i];
			let curList = (curDetail.cardList).slice();
			let curCard = curDetail.card;
			//totalMao += isStart ? 2 : 1;
			totalMao += 2;
			if (curList.length < 5 && curDetail.leftCount > 0) {
				curList.push(curCard);
			}
			totalTuo += this.getCardTuo(curList);
		}

		//除去3个以上的对和单牌
		baseList = baseList.filter(item => item.count < 3);

		//计算7的陀和卯
		let cur7List = baseList.filter(item => item.point == 7);
		let cur7MaoTuo = this.get7MaoAndTuo(cur7List);
		totalMao += cur7MaoTuo.totalMao;
		totalTuo += cur7MaoTuo.totalTuo;

		//重新组合的卯和陀列表
		let reCountList = [];
		//计算其余卯
		for (let i = 2; i <= 6; i++) {

			let curList = baseList.filter(item => item.point == i || item.point == (14 - i));
			let curMaoTuo = [];
			if ([2, 3].includes(i)) {
				//2和3的卯
				curMaoTuo = this.getSingleMaoAndTuo(curList, i);
			} else if ([4, 5, 6].includes(i)) {
				//4和6的卯
				curMaoTuo = this.getDoubleMaoAndTuo(curList, i);
			}
			if (curMaoTuo.length == 1) {
				totalMao += curMaoTuo[0].totalMao;
				totalTuo += curMaoTuo[0].totalTuo;
			} else if (curMaoTuo.length >= 1) {
				reCountList = reCountList.concat(curMaoTuo);
			}
		}

		return {
			totalMao,
			totalTuo,
			reCountList
		};
	}

	//获取7的牌
	get7MaoAndTuo(baseList) {

		let totalMao = 0;
		let totalTuo = 0;

		let {
			leftCard,
			curCardList
		} = this.getCurAndLeftCardList(baseList);
		//计算2个的卯
		let top2List = baseList.filter(item => item.count == 2 && item.leftCount > 0);
		for (let i = 0; i < top2List.length; i++) {
			let curList = top2List[i].cardList.slice();
			let curCard = top2List[i].card;
			curList.push(curCard);
			leftCard = this.removeCard(leftCard, curCard);
			totalTuo += this.getCardTuo(curList);
			totalMao += 1;
			curCardList = curCardList.filter(item => item != curCard);
		}

		//计算单卯
		if (curCardList.length >= 2 && leftCard.length > 0) {

			curCardList.sort((a, b) => {
				return this.getCardPoint(b) - this.getCardPoint(a)
			});
			leftCard.sort((a, b) => {
				return this.getCardPoint(b) - this.getCardPoint(a)
			});
			if (curCardList.length % 2 != 0) {
				curCardList.splice(curCardList.length - 1, 1);
			}
			let maxMao = curCardList.length / 2;
			maxMao = leftCard.length >= maxMao ? maxMao : leftCard.length;
			totalMao += maxMao;
			let maxTuoList = curCardList.splice(0, maxMao * 2)
			maxTuoList = maxTuoList.concat(leftCard.slice(0, maxMao))
			totalTuo += this.getCardTuo(maxTuoList);
		}

		return {
			totalMao,
			totalTuo
		};
	}

	//获取单卯的组合2/12 3/11
	getSingleMaoAndTuo(baseList, point) {

		let totalGroupMao = 0;
		let totalGroupTuo = 0;
		let {
			leftCard,
			curCardList
		} = this.getCurAndLeftCardList(baseList);
		//计算2个的卯
		let top2List = baseList.filter(item => item.count == 2 && item.leftCount > 0);
		for (let i = 0; i < top2List.length; i++) {
			let curList = top2List[i].cardList.slice();
			let curCard = top2List[i].card;
			curList.push(curCard);
			totalGroupTuo += this.getCardTuo(curList);
			totalGroupMao += 1;
		}

		let totalDanMao = 0;
		let totalDanTuo = 0;
		if (baseList.length == 2) {
			//如果没达到卯数 则需要拆卯计算
			baseList.sort((a, b) => {
				return a.count - b.count
			});
			leftCard.sort((a, b) => {
				return this.getCardPoint(b) - this.getCardPoint(a)
			});
			let smallList = baseList[0].cardList;
			if (smallList.length > leftCard.length) {
				smallList = smallList.splice(0, leftCard.length);
			}
			let bigList = baseList[1].cardList.splice(0, smallList.length);
			let leftList = leftCard.splice(0, smallList.length);
			let allCardList = smallList.concat(bigList).concat(leftList);
			totalDanMao += (allCardList.length / 3);
			totalDanTuo += this.getCardTuo(allCardList);
		}

		let tuoMaoList = [];
		if (totalGroupMao && totalGroupMao >= totalDanMao && totalGroupTuo >= totalDanTuo) {
			let detail = {
				totalTuo: totalGroupTuo,
				totalMao: totalGroupMao,
				point
			};
			tuoMaoList.push(detail)
		} else if (totalDanMao && totalDanMao >= totalGroupMao && totalDanTuo >= totalGroupTuo) {
			let detail = {
				totalTuo: totalDanTuo,
				totalMao: totalDanMao,
				point
			};
			tuoMaoList.push(detail)
		} else if (totalGroupMao && totalDanMao) {
			let detail = {
				totalTuo: totalGroupTuo,
				totalMao: totalGroupMao,
				point
			};
			tuoMaoList.push(detail);
			let detail2 = {
				totalTuo: totalDanTuo,
				totalMao: totalDanMao,
				point
			};
			tuoMaoList.push(detail2)
		}
		return tuoMaoList;

	}

	//获取双卯的组合4/10 5/9 6和8
	getDoubleMaoAndTuo(baseList, point) {

		//优先组合对子
		let groupResult = this.getMaoAndTuoGroup(baseList, point);
		let totalGroupMao = groupResult.totalMao;
		let totalGroupTuo = groupResult.totalTuo;

		//全部拆分卯
		let danResult = this.getMaoAndTuoSingle(baseList, point);
		let totalDanMao = danResult.totalMao;
		let totalDanTuo = danResult.totalTuo;

		let tuoMaoList = [];
		if (totalGroupMao && totalGroupMao >= totalDanMao && totalGroupTuo >= totalDanTuo) {
			let detail = {
				totalTuo: totalGroupTuo,
				totalMao: totalGroupMao,
				point
			};
			tuoMaoList.push(detail)
		} else if (totalDanMao && totalDanMao >= totalGroupMao && totalDanTuo >= totalGroupTuo) {
			let detail = {
				totalTuo: totalGroupTuo,
				totalMao: totalDanMao,
				point
			};
			tuoMaoList.push(detail)
		} else if (totalGroupMao && totalDanMao) {
			let detail = {
				totalTuo: totalGroupTuo,
				totalMao: totalGroupMao,
				point
			};
			tuoMaoList.push(detail);
			let detail2 = {
				totalTuo: totalDanTuo,
				totalMao: totalGroupMao,
				point
			};
			tuoMaoList.push(detail2)
		}
		return tuoMaoList;

	}


	//按照陀优先的算法
	getMaoAndTuoGroup(baseList, point) {

		let totalMao = 0;
		let totalTuo = 0;
		//组合碰的
		let tuoPlusList = baseList.filter(item => item.count == 2 && item.leftCount > 0);
		for (let i = 0; i < tuoPlusList.length; i++) {
			let curDetail = tuoPlusList[i];
			let curList = (curDetail.cardList).slice();
			let curCard = curDetail.card;
			curList.push(curCard);
			totalMao += 1;
			totalTuo += this.getCardTuo(curList);
		}

		//没有碰的或者只有单的
		let danMaoList = baseList.filter(item => item.count <= 1 || (item.count == 2 && item.leftCount == 0));
		if (danMaoList.length > 1) {
			let singleMaoTuo = this.getMaoAndTuoSingle(danMaoList, point);
			totalMao += singleMaoTuo.totalMao;
			totalTuo += singleMaoTuo.totalTuo;
		}
		return {
			totalMao,
			totalTuo
		};
	}

	// 获取单个组合
	getMaoAndTuoSingle(baseList, point) {


		let totalMao = 0;
		let totalTuo = 0;
		let maoCardList = [];
		let maoDuiCardList = [];

		let maoList = baseList.filter(item => item.point == point);
		let maoLeftCard = this.getCurAndLeftCardList(maoList).leftCard;
		for (let k = 0; k < maoList.length; k++) {
			let curDetail = JSON.parse(JSON.stringify(maoList[k]));
			let curList = maoList[k].cardList;
			delete curDetail['cardList'];
			for (let m = 0; m < curList.length; m++) {
				maoCardList.push(curDetail);
			}
		}
		let maoPoint = 14 - point;
		let maoDuiList = baseList.filter(item => item.point == maoPoint);
		let maoDuiLeftCard = this.getCurAndLeftCardList(maoDuiList).leftCard;
		for (let k = 0; k < maoDuiList.length; k++) {
			let curDetail = JSON.parse(JSON.stringify(maoDuiList[k]));
			let curList = maoDuiList[k].cardList;
			delete curDetail['cardList'];
			for (let m = 0; m < curList.length; m++) {
				maoDuiCardList.push(curDetail);
			}
		}

		let smallList = maoCardList;
		let bigList = maoDuiCardList;
		if (maoDuiCardList.length < maoCardList.length) {
			smallList = maoDuiCardList;
			bigList = maoCardList;
		}

		//以数量小为基准
		smallList.sort((a, b) => {
			return a.leftCount - b.leftCount
		});
		bigList.sort((a, b) => {
			return b.tuo - a.tuo
		});
		bigList.sort((a, b) => {
			return b.leftCount - a.leftCount
		});

		let allLeftCard = maoLeftCard.concat(maoDuiLeftCard);
		//组合卯和陀数
		for (let k = 0; k < smallList.length; k++) {

			let smallDetail = smallList[k];
			let bigDetail = bigList[k];
			let smallCard = smallDetail.card;
			let bigCard = bigDetail.card;
			let curGroupList = [smallCard, bigCard];
			if (smallDetail.leftCount + bigDetail.leftCount >= 1) {
				if ((smallDetail.tuo == 1 && bigDetail.tuo == 0)) {
					if (allLeftCard.includes(smallCard)) {
						curGroupList.push(smallCard);
						allLeftCard = this.removeCard(allLeftCard, smallCard);
					} else if (allLeftCard.includes(bigCard)) {
						curGroupList.push(bigCard);
						allLeftCard = this.removeCard(allLeftCard, bigCard);
					}
				} else if (smallDetail.tuo == 0 && bigDetail.tuo == 1) {
					if (allLeftCard.includes(bigCard)) {
						curGroupList.push(bigCard);
						allLeftCard = this.removeCard(allLeftCard, bigCard);
					} else if (allLeftCard.includes(smallCard)) {
						curGroupList.push(smallCard);
						allLeftCard = this.removeCard(allLeftCard, smallCard);
					}
				} else if (smallDetail.tuo == bigDetail.tuo) {
					let smallLeft = allLeftCard.filter(item => item == smallCard);
					let bigLeft = allLeftCard.filter(item => item == bigCard);
					if (smallLeft.length > bigLeft.length && allLeftCard.includes(smallCard)) {
						curGroupList.push(smallCard);
						allLeftCard = this.removeCard(allLeftCard, smallCard);
					} else if (allLeftCard.includes(bigCard)) {
						curGroupList.push(bigCard);
						allLeftCard = this.removeCard(allLeftCard, bigCard);
					}
				}
				if (curGroupList.length == 3) {
					totalMao += 1;
					totalTuo += this.getCardTuo(curGroupList);
				}
			}
		}

		return {
			totalMao,
			totalTuo
		};



	}

	//获取摆牌列表
	getBaiPaiList(list) {

		let curCards = list.filter(item => item != CAISHEN);
		let caiShenList = list.filter(item => item == CAISHEN);

		let baseList = [];
		let cardList = [];
		let cardCount = {};

		for (let i = 0; i < curCards.length; i++) {

			let curCard = curCards[i];
			if (!cardCount[curCard]) {
				cardCount[curCard] = 0;
				let cardList = curCards.filter(item => item == curCard);
				let point = this.getCardNumber(curCard);
				baseList.push({
					cardList: cardList,
					card: curCard,
					count: cardList.length,
					point: point
				});
			}
			cardCount[curCard] += 1;
		}

		//先对杠 杀 和吐火排序
		let gangList = baseList.filter(item => item.count >= 3);
		for (let i = 0; i < gangList.length; i++) {
			let card = gangList[i].card;
			let curList = curCards.filter(item => item == card);
			let tuo = this.getCardTuo(curList);
			let mao = 2;
			cardList.push({
				isShaUp: true,
				card: card,
				tuo: tuo,
				count: curList.length,
				cardList: curList,
				mao: mao
			});
			this.deleteCard(curCards, curList);
			delete cardCount[card];
		}

		cardCount = {};
		for (let i = 0; i < curCards.length; i++) {

			let curCard = this.getCardNumber(curCards[i]);
			if (!cardCount[curCard]) {
				cardCount[curCard] = 0;
			}
			cardCount[curCard] += 1;
		}

		//开始组合卯
		for (let key in cardCount) {
			key = parseInt(key);
			let cpKey = 14 - key;
			let curCount = cardCount[key];
			let cpCount = cpKey == 7 ? 0 : cardCount[cpKey];
			if (curCount + cpCount > 4) {

				//先组合当前牌值
				let curDanList = baseList.filter(item => item.point == key && item.count == 1);
				let curShuangList = baseList.filter(item => item.point == key && item.count == 2);
				let curMasterList = curShuangList.concat(curDanList);
				let curCardList = [];
				for (let i = 0; i < curMasterList.length; i++) {
					curCardList = curCardList.concat(curMasterList[i].cardList);
					if (curCardList.length == 4) {
						//4个为一组合
						curCardList.sort((a, b) => {
							return a - b
						});
						curCardList.sort((a, b) => {
							return this.getCardNumber(a) - this.getCardNumber(b)
						});
						cardList.push({
							isShaUp: false,
							card: key,
							count: curCardList.length,
							cardList: curCardList
						});
						//重置队列
						curCardList = [];
					}
				}
				if (cpKey == 7) {
					//7没有组合
					if (curCardList.length > 0) {
						curCardList.sort((a, b) => {
							return a - b
						});
						curCardList.sort((a, b) => {
							return this.getCardNumber(a) - this.getCardNumber(b)
						});
						cardList.push({
							isShaUp: false,
							card: key,
							count: curCardList.length,
							cardList: curCardList
						});
					}

				} else {
					//查找cp列表
					curDanList = baseList.filter(item => item.point == cpKey && item.count == 1);
					curShuangList = baseList.filter(item => item.point == cpKey && item.count == 2);

					if (curCardList.length <= 2 && curShuangList.length == 3) {
						//特殊情况判断[6, 28, 18, 8, 18, 8, 28];
						let shuangList = curShuangList.splice(0, 1);
						let curList = curCardList.concat(shuangList[0].cardList);
						curList.sort((a, b) => {
							return a - b
						});
						curList.sort((a, b) => {
							return this.getCardNumber(a) - this.getCardNumber(b)
						});
						cardList.push({
							isShaUp: false,
							card: key,
							count: curList.length,
							cardList: curList
						});
						//组合剩下的
						let groupList = [];
						for (let i = 0; i < curShuangList.length; i++) {
							groupList = groupList.concat(curShuangList[i].cardList);
						}
						groupList.sort((a, b) => {
							return a - b
						});
						groupList.sort((a, b) => {
							return this.getCardNumber(a) - this.getCardNumber(b)
						});
						cardList.push({
							isShaUp: false,
							card: cpKey,
							count: groupList.length,
							cardList: groupList
						});

					} else {

						let cpCount = 4 - curCardList.length;
						if (curDanList.length < cpCount) {
							cpCount = curDanList.length;
						}
						//如果需要搭配
						let cpList = [];
						if (cpCount) {
							cpList = curDanList.splice(0, cpCount);
						}

						//组合当前卡牌 
						let curList = curCardList.slice();
						if (curList.length > 0 || cpList.length > 0) {
							for (let i = 0; i < cpList.length; i++) {
								curList = curList.concat(cpList[i].cardList);
							}
							curList.sort((a, b) => {
								return a - b
							});
							curList.sort((a, b) => {
								return this.getCardNumber(a) - this.getCardNumber(b)
							});
							cardList.push({
								isShaUp: false,
								card: key,
								count: curList.length,
								cardList: curList
							});
						}
						if (curShuangList.length >= 2) {
							let groupCards = curShuangList.splice(0, 2);
							let groupList = [];
							for (let i = 0; i < groupCards.length; i++) {
								groupList = groupList.concat(groupCards[i].cardList);
							}

							groupList.sort((a, b) => {
								return a - b
							});
							groupList.sort((a, b) => {
								return this.getCardNumber(a) - this.getCardNumber(b)
							});
							cardList.push({
								isShaUp: false,
								card: cpKey,
								count: groupList.length,
								cardList: groupList
							});
						}
						let leftCard = curShuangList.concat(curDanList);
						let leftList = [];
						for (let i = 0; i < leftCard.length; i++) {
							leftList = leftList.concat(leftCard[i].cardList);
						}
						if (leftList.length > 0) {
							leftList.sort((a, b) => {
								return a - b
							});
							leftList.sort((a, b) => {
								return this.getCardNumber(a) - this.getCardNumber(b)
							});
							cardList.push({
								isShaUp: false,
								card: cpKey,
								count: leftList.length,
								cardList: leftList
							});
						}
					}
					delete cardCount[cpKey];
				}

			} else {
				//如果组合没有超过4个 直接组合
				let curList = curCards.filter(item => [key, cpKey].includes(this.getCardNumber(item)));
				curList.sort((a, b) => {
					return a - b
				});
				curList.sort((a, b) => {
					return this.getCardNumber(a) - this.getCardNumber(b)
				});
				cardList.push({
					isShaUp: false,
					card: key,
					cardList: curList
				});
				//this.deleteCard(curCards, curList);
				delete cardCount[cpKey];
			}
		}
		//最后加入财神
		if (caiShenList.length > 0) {
			cardList.push({
				isShaUp: false,
				card: CAISHEN,
				count: caiShenList.length,
				cardList: caiShenList
			});
		}
		return cardList;

	}

	deleteCard(cards, cardList) {
		for (let i = 0; i < cardList.length; i++) {
			let curIndex = cards.findIndex(item => item == cardList[i]);
			if (curIndex >= 0) {
				cards.splice(curIndex, 1);
			}
		}
	};

	/*-----------------------------------胡牌算法-----------------------------------------*/


	//是否可以胡基础牌型
	getCanHu(cards, laiziCount = 0) {

		// 若牌张数不是2、5、8、11、14,17则不能胡  
		if ((cards.length + laiziCount + 1) % 3 != 0) return false;

		//四红中胡牌
		if (this.gameRule.isHongZhongHu && laiziCount == 4) {
			return true;
		}

		//七对胡牌
		if (this.gameRule.isHasQiDui) {
			let curCards = cards.slice();
			for (let i = 0; i < laiziCount; i++) {
				curCards.push(35);
			}
			let isQiDui = this.isQiDui(curCards);
			if (isQiDui) {
				return true;
			}
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
		return isDuiDuiHu;
	}

	//是否全红/全黑
	isSameColor(operateList, userCards) {

		let isSameColor = 0;
		let cardsList = userCards.slice();
		for (let i = 0; i < operateList.length; i++) {
			cardsList = cardsList.concat(operateList[i].cardList);
		}
		if (cardsList.every(item => this.getCardPoint(item) >= 1)) {
			isSameColor = 1;
		} else if (cardsList.every(item => this.getCardPoint(item) == 0)) {
			isSameColor = 2;
		}
		return isSameColor;

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
		let laiCount = (allData.filter(item => item == 35)).length;
		let cardsCount = allData.filter(item => item != 35);
		return this.getCanHu(cardsCount, laiCount);
	}



}


module.exports = new GameLogic();