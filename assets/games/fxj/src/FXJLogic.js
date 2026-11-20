/*
 * 麻将算法
 */
const FXJModel = require('./FXJModel');
const gameProto = require('./ApiFxj');

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
	CARDID_DONG: 31,
	CARDID_NAN: 32,
	CARDID_XI: 33,
	CARDID_BEI: 34,
	CARDID_ZHONG: 35,
	CARDID_FA: 36,
	CARDID_BAI: 37,
};

class GameLogic {
	constructor() { }

	getAllCardId() {
		return CARDID
	}

	/*
	 * 打出一张牌能否听牌
	 */
	getTingCards(cards) {
		let tingCards = [];
		let rule = FXJModel.getGameRule()
		let chairID = FXJModel.getMyChairID()
		let operateRecord = FXJModel.getOptRecord(chairID)
		let isLackCard = rule.isLackCard
		let playType = rule.playType
		for (let i = 0; i < cards.length; ++i) {
			let cloneCards = cards.slice();
			cloneCards.splice(i, 1);
			/**只要放一张癞子进去可以胡牌，就表示这张牌打出去可以听牌 */
			for (let key in CARDID) {
				if (isLackCard && key.includes("WAN")) {
					continue;
				}
				let item = CARDID[key];
				if (cards[i] != item) {
					if (this.getCanHu(chairID, cloneCards, item, operateRecord, playType)) {
						tingCards.push(cards[i]);
						break;
					}
				}
			}
		}
		// console.log("手牌=", cards, "可以打出去下叫的牌=", tingCards)
		return tingCards;
	}

	/*
	 * 获取能赢的牌
	 */
	getCanWinCards(cards) {
		let canWinCards = [];
		let chairID = FXJModel.getMyChairID();
		let operateRecord = FXJModel.getPengGangArrayByChairID(chairID);
		let rule = FXJModel.getGameRule()
		let playType = rule.playType;
		let isLackCard = rule.isLackCard
		for (let key in CARDID) {
			if (isLackCard && key.includes("WAN")) {
				continue;
			}
			let item = CARDID[key];
			let huInfo = this.getCanHu(chairID, cards, item, operateRecord, playType)
			if (huInfo) {
				huInfo.card = item
				canWinCards.push(huInfo);
			}
		}
		return canWinCards;
	}

	/*
	 * 获取牌的花色
	 */
	getCardColor(card) {
		return Math.floor(card / 10);
	}

	/**根据规则获取鬼牌列表 */
	getGhostList(playType = null) {
		if (playType == null) {
			let rule = FXJModel.getGameRule()
			if (rule) {
				playType = rule.playType
			}
		}
		if (playType == null) return []

		let ghostList = []
		switch (playType) {
			case gameProto.playType.FEIXIAOJI:
				ghostList = [CARDID.CARDID_TIAO1]
				break
			case gameProto.playType.FEIBAIBAN:
				ghostList = [CARDID.CARDID_BAI]
				break
			case gameProto.playType.FEISHUANGGUI:
				ghostList = [CARDID.CARDID_BAI, CARDID.CARDID_ZHONG]
				break;
		}
		return ghostList
	}

	/*
	 * 获取已经操作过的所有牌+手牌 
	 */
	getOperateRecordCard(chairID, cards, card, operateRecord, chi = 0) {
		let End = cards.slice();
		// if (card != null && card != undefined) {
		// 	End.push(card);
		// }
		//先提取出补杠数组 
		let RecordArr = [];
		for (let i = 0; i < operateRecord.length; ++i) {
			/* 补杠 */
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.GANG_BU) {
				RecordArr.push(operateRecord[i].card);
			}
		}
		//获取已经操作过的所有牌 
		for (let i = 0; i < operateRecord.length; ++i) {
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.PENG) {
				/* 碰 */
				let isTrue = false;
				for (let j = 0; j < RecordArr.length; j++) {
					if (RecordArr[j] == operateRecord[i].card) {
						isTrue = true;
						break;
					}
				}
				if (isTrue == true) continue;
				if (chi == 2) continue;
				//碰牌 放入三张
				End.push(operateRecord[i].card);
				End.push(operateRecord[i].card);
				End.push(operateRecord[i].card);
			} else if (operateRecord[i].chairID == chairID && (operateRecord[i].operate == gameProto.operateType.GANG_CHI /* 吃杠 */ ||
				operateRecord[i].operate == gameProto.operateType.GANG_BU /* 补杠 */ ||
				operateRecord[i].operate == gameProto.operateType.GANG_ZHI)) {
				/* 自摸杠 */
				if (chi == 2) continue;
				if (chi == 3) {
					for (let j = 0; j < operateRecord[i].plusInfo.cardList.length - 1; j++) {
						if (operateRecord[i].plusInfo.cardList[j] != operateRecord[i].plusInfo.cardList[j + 1]) {
							return false;
						}
					}
				}
				//杠牌 放入四张
				End.push(operateRecord[i].plusInfo.cardList[0]);
				End.push(operateRecord[i].plusInfo.cardList[1]);
				End.push(operateRecord[i].plusInfo.cardList[2]);
				End.push(operateRecord[i].plusInfo.cardList[3]);
			} else if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.CHI) {
				/* 吃牌 */
				if (chi == 1) {
					return false;
				}
				//吃牌 放入三张
				End.push(operateRecord[i].plusInfo.cardList[0]);
				End.push(operateRecord[i].plusInfo.cardList[1]);
				End.push(operateRecord[i].plusInfo.cardList[2]);
			}
		}
		//全部牌（碰+杠+手牌） 排序
		End.sort((a, b) => {
			return a - b;
		});
		return End;
	}

	getYiTiaoLong(cardList, ghostList, playeType) {


		if (cardList.length >= 9) {

			//获取癞子列表
			let laiCard = cardList.filter(item => ghostList.includes(item));
			//普通牌
			let userCards = cardList.filter(item => !ghostList.includes(item));
			// console.log(userCards);
			//判断是哪个的一条龙
			let wanCards = userCards.filter(item => item >= 1 && item <= 9);
			let tongCards = userCards.filter(item => item >= 11 && item <= 19);
			let tiaoCards = userCards.filter(item => item >= 21 && item <= 29);

			let otherCard = [];
			if (wanCards.length + laiCard.length >= 9) {

				let longCard = [];
				let allCards = userCards.slice();
				for (let i = 1; i <= 9; i++) {

					let cardIndex = allCards.findIndex(item => item == i);
					if (cardIndex != -1) {
						longCard.push(allCards.splice(cardIndex, 1));
					}
				}
				if (longCard.length + laiCard.length >= 9) {
					//获取差的癞子数量
					let getLaiCount = 9 - longCard.length;
					let curLaiCard = laiCard.slice();
					curLaiCard.splice(0, getLaiCount);
					otherCard = curLaiCard.concat(allCards);
					if (this.getCanHu(5, otherCard, null, [], playeType)) {
						return true;
					}
				}
			}

			if (tongCards.length + laiCard.length >= 9) {

				let longCard = [];
				let allCards = userCards.slice();
				for (let i = 11; i <= 19; i++) {

					let cardIndex = allCards.findIndex(item => item == i);
					if (cardIndex != -1) {
						longCard.push(allCards.splice(cardIndex, 1));
					}
				}
				if (longCard.length + laiCard.length >= 9) {
					//获取差的癞子数量
					let getLaiCount = 9 - longCard.length;
					let curLaiCard = laiCard.slice();
					curLaiCard.splice(0, getLaiCount);
					otherCard = curLaiCard.concat(allCards);
					if (this.getCanHu(5, otherCard, null, [], playeType)) {
						return true;
					}
				}
			}

			if (tiaoCards.length + laiCard.length >= 9) {

				let longCard = [];
				let allCards = userCards.slice();
				for (let i = 21; i <= 29; i++) {

					let cardIndex = allCards.findIndex(item => item == i);
					if (cardIndex != -1) {
						longCard.push(allCards.splice(cardIndex, 1)[0]);
					}
				}

				if (longCard.length + laiCard.length >= 9) {
					//获取差的癞子数量
					let getLaiCount = 9 - longCard.length;
					let curLaiCard = laiCard.slice();
					curLaiCard.splice(0, getLaiCount);
					otherCard = curLaiCard.concat(allCards);
					if (this.getCanHu(5, otherCard, null, [], playeType)) {
						return true;
					}
				}

			}

			//没办法组合成一条龙
			return false;

		} else {
			//小于9张不是一条龙
			return false;
		}

		// let yiTiaoLong = [[], [], [], []];
		// for (let i = 0; i < HuCombination.length; i++) {
		// 	//提出胡牌顺子 类型为1 胡牌长度为3
		// 	if (HuCombination[i].type == 1 && HuCombination[i].list.length == 3) {
		// 		//是顺子
		// 		if (HuCombination[i].list[0] < HuCombination[i].list[1] && HuCombination[i].list[1] < HuCombination[i].list[2]) {
		// 			let type = Math.floor(HuCombination[i].list[0] / 10);
		// 			//长度大于0说明已有数据 判断最后一位数据
		// 			if (yiTiaoLong[type].length > 0 && yiTiaoLong[type][yiTiaoLong[type].length - 1] + 1 == HuCombination[i].list[0]) {
		// 				yiTiaoLong[type].push(HuCombination[i].list[0]);
		// 				yiTiaoLong[type].push(HuCombination[i].list[1]);
		// 				yiTiaoLong[type].push(HuCombination[i].list[2]);
		// 			} else if (yiTiaoLong[type].length == 0) {
		// 				yiTiaoLong[type].push(HuCombination[i].list[0]);
		// 				yiTiaoLong[type].push(HuCombination[i].list[1]);
		// 				yiTiaoLong[type].push(HuCombination[i].list[2]);
		// 			}

		// 			if (yiTiaoLong[type].length >= 9) {
		// 				return true;
		// 			}
		// 		}
		// 	}
		// }

		// return false;
	}
	/*
	 * 校验花色是否都是一样
	 * Color 0 正常校验 1不校验字牌 2校验到字牌踢出
	 */
	getCardColorArr(handCard, ghostList, Color = 0) {
		// 鬼牌总数
		let ghostCount = 0;
		let cards = [];
		// 计数：统计各牌张数，鬼牌另计在ghostCount上
		for (let card of handCard) {
			if (ghostList.indexOf(card) >= 0) {
				// 是鬼牌
				ghostCount++;
			} else {
				cards.push(card);
			}
		}
		for (let i = 0; i < cards.length - 1; i++) {
			let to_1 = this.getCardColor(cards[i]);
			let to_2 = this.getCardColor(cards[i + 1]);
			if (Color == 2 && (to_1 == 3 || to_2 == 3)) {
				return false;
			}
			if (Color == 1 && (to_1 == 3 || to_2 == 3)) {
				continue;
			}
			if (to_1 != to_2) {
				return false;
			}
		}
		return true;
	}

	/*
	 * 获取牌花色种类
	 */
	getCardColorSum(handCard, ghostList, isZi = 0) {
		// 鬼牌总数
		let ghostCount = 0;
		let cards = [];
		let Sum = [false, false, false, false]
		// 计数：统计各牌张数，鬼牌另计在ghostCount上
		for (let card of handCard) {
			if (ghostList.indexOf(card) >= 0) {
				// 是鬼牌
				ghostCount++;
			} else {
				cards.push(card);
			}
		}
		for (let i = 0; i < cards.length; i++) {
			Sum[this.getCardColor(cards[i])] = true;
		}
		let shu = 0;
		for (let i = 0; i < 4; i++) {
			if (isZi == 1 && i == 3) continue;
			if (Sum[i] == true) shu++;
		}
		return shu;
	}

	/*
	 * 获取牌的数值
	 */
	getCardNumberArr(handCard, ghostList) {
		// 初始计数
		let cards = [
			[0, 0, 0, 0, 0, 0, 0, 0, 0], // 万
			[0, 0, 0, 0, 0, 0, 0, 0, 0], // 筒
			[0, 0, 0, 0, 0, 0, 0, 0, 0], // 条
			[0, 0, 0, 0, 0, 0, 0, 0, 0] // 字，后两位为0不变，为了保持数组长度一致
		];
		// 鬼牌总数
		let ghostCount = 0;
		// 计数：统计各牌张数，鬼牌另计在ghostCount上
		for (let card of handCard) {
			if (ghostList.indexOf(card) >= 0) {
				// 是鬼牌
				ghostCount++;
			} else {
				let rank = (card % 10 - 1);
				let type = Math.floor(card / 10);
				cards[type][rank]++;
			}
		}
		return {
			cards,
			ghostCount
		};
	}

	/*
	 * 胡牌算法
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playeType 癞子玩法
	 */
	getCanHu(chairID, cards, card, operateRecord, playeType, extra = false) {
		//玩法为飞小鸡癞子 且手上只有一张 且这张牌是癞子 不能胡
		if (playeType == gameProto.playType.FEIXIAOJI && cards.length == 1 && cards == 21) {
			return false;
		}
		//转换牌型
		// let handcloneCards = cards.slice();
		// let cloneCardsCard = card;
		// if (cloneCardsCard != null && cloneCardsCard != undefined) {
		// 	handcloneCards.push(cloneCardsCard);
		// }
		// let cloneCards = this.getCardNumberArr(handcloneCards, [38]);
		// let rank = (card % 10 - 1);
		// let type = Math.floor(card / 10);
		// if (cloneCardsCard != null && cloneCardsCard != undefined && cloneCards.cards[type][rank] != 2 && cloneCards.cards[type][rank] != 4) {
		// 	return false;
		// }

		//获取平胡番数
		let handCard = cards.slice();
		let ShouCard = card;
		let handoperateRecord = operateRecord.slice();
		let Hu_PingHu = this.canHuPingHu(chairID, handCard, ShouCard, handoperateRecord, playeType);
		let Fan_PingHu = this.getCanHuresidue(Hu_PingHu);

		//获取七对番数
		handCard = cards.slice();
		ShouCard = card;
		handoperateRecord = operateRecord.slice();
		let Hu_2 = this.canHuQidui(chairID, handoperateRecord, handCard, ShouCard, playeType);
		let Fan_2 = this.getCanHuresidue(Hu_2);
		if (Fan_2 > Fan_PingHu || (Fan_2 && !Fan_PingHu)) {
			Hu_PingHu = Hu_2;
			Fan_PingHu = Fan_2;
		}
		//获取大对子番数
		handCard = cards.slice();
		ShouCard = card;
		handoperateRecord = operateRecord.slice();
		Hu_2 = this.canHuDaDduiZi(chairID, handCard, ShouCard, handoperateRecord, playeType);
		Fan_2 = this.getCanHuresidue(Hu_2);
		if (Fan_2 > Fan_PingHu || (Fan_2 && !Fan_PingHu)) {
			Hu_PingHu = Hu_2;
			Fan_PingHu = Fan_2;
		}
		//获取十风番数
		handoperateRecord = operateRecord.slice();
		Hu_2 = this.canHuShiFeng(chairID, handoperateRecord, playeType);
		Fan_2 = this.getCanHuresidue(Hu_2);
		if (Fan_2 > Fan_PingHu || (Fan_2 && !Fan_PingHu)) {
			Hu_PingHu = Hu_2;
			Fan_PingHu = Fan_2;
		}
		//获取十三幺番数
		handoperateRecord = operateRecord.slice();
		Hu_2 = this.canHuShiSanYao(chairID, handoperateRecord, playeType);
		Fan_2 = this.getCanHuresidue(Hu_2);
		if (Fan_2 > Fan_PingHu || (Fan_2 && !Fan_PingHu)) {
			Hu_PingHu = Hu_2;
			Fan_PingHu = Fan_2;
		}
		//获取烂牌番数
		handCard = cards.slice();
		ShouCard = card;
		Hu_2 = this.canHulanPai(handCard, ShouCard, playeType);
		Fan_2 = this.getCanHuresidue(Hu_2);
		if (Fan_2 > Fan_PingHu || (Fan_2 && !Fan_PingHu)) {
			Hu_PingHu = Hu_2;
			Fan_PingHu = Fan_2;
		}
		//获取手提十三幺番数
		handCard = cards.slice();
		ShouCard = card;
		handoperateRecord = operateRecord.slice();
		Hu_2 = this.canHuShouShiSanYao(chairID, handoperateRecord, handCard, ShouCard);
		Fan_2 = this.getCanHuresidue(Hu_2, card);
		if (Fan_2 > Fan_PingHu || (Fan_2 && !Fan_PingHu)) {
			Hu_PingHu = Hu_2;
			Fan_PingHu = Fan_2;
		}
		// 能否胡四小鸡
		handCard = cards.slice();
		ShouCard = card;
		handoperateRecord = operateRecord.slice();
		Hu_2 = this.canHuSiXiaoJi(handCard, ShouCard, playeType);
		Fan_2 = this.getCanHuresidue(Hu_2);
		if (Fan_2 > Fan_PingHu || (Fan_2 && !Fan_PingHu)) {
			Hu_PingHu = Hu_2;
			Fan_PingHu = Fan_2;
		}
		//获取八鬼番数
		handCard = cards.slice();
		ShouCard = card;
		handoperateRecord = operateRecord.slice();
		Hu_2 = this.canHuBaGui(chairID, handCard, ShouCard, handoperateRecord, playeType);
		Fan_2 = this.getCanHuresidue(Hu_2);
		if (Fan_2 > Fan_PingHu || (Fan_2 && !Fan_PingHu)) {
			Hu_PingHu = Hu_2;
			Fan_PingHu = Fan_2;
		}

		//能胡 
		if (Hu_PingHu > 0) {

			handCard = cards.slice();
			ShouCard = card;
			handoperateRecord = operateRecord.slice();
			let QingYiSe = this.QingYiSe(chairID, handCard, ShouCard, handoperateRecord, playeType);
			let Fan_QingYiSe = this.getCanHuresidue(QingYiSe);
			if (Fan_QingYiSe > Fan_PingHu) {
				Hu_PingHu = QingYiSe;
				Fan_PingHu = Fan_QingYiSe;
			}
			handCard = cards.slice();
			ShouCard = card;
			handoperateRecord = operateRecord.slice();
			let HunSanYan = this.HunSanYan(chairID, handCard, ShouCard, handoperateRecord, playeType);
			let Fan_HunSanYan = this.getCanHuresidue(HunSanYan);
			if (Fan_HunSanYan > Fan_PingHu) {
				Hu_PingHu = HunSanYan;
				Fan_PingHu = Fan_HunSanYan;
			}
			handCard = cards.slice();
			ShouCard = card;
			handoperateRecord = operateRecord.slice();
			let DaSanYuan = this.DaSanYuan(chairID, handCard, ShouCard, handoperateRecord, playeType);
			let Fan_DaSanYuan = this.getCanHuresidue(DaSanYuan);
			if (Fan_DaSanYuan > Fan_PingHu) {
				Hu_PingHu = DaSanYuan;
				Fan_PingHu = Fan_DaSanYuan;
			}
			handCard = cards.slice();
			ShouCard = card;
			handoperateRecord = operateRecord.slice();
			let DaSiXi = this.DaSiXi(chairID, handCard, ShouCard, handoperateRecord, playeType);
			let Fan_DaSiXi = this.getCanHuresidue(DaSiXi);
			if (Fan_DaSiXi > Fan_PingHu) {
				Hu_PingHu = DaSiXi;
				Fan_PingHu = Fan_DaSiXi;
			}
			handCard = cards.slice();
			ShouCard = card;
			handoperateRecord = operateRecord.slice();
			let canHulanPai = this.canHulanPai(handCard, ShouCard, playeType);
			let Fan_canHulanPai = this.getCanHuresidue(canHulanPai);
			if (Fan_canHulanPai > Fan_PingHu) {
				Hu_PingHu = canHulanPai;
				Fan_PingHu = Fan_canHulanPai;
			}
			handCard = cards.slice();
			ShouCard = card;
			handoperateRecord = operateRecord.slice();
			let quanQiuRen = this.quanQiuRen(chairID, handCard, ShouCard, handoperateRecord, playeType);
			let Fan_quanQiuRen = this.getCanHuresidue(quanQiuRen);
			if (Fan_quanQiuRen > Fan_PingHu) {
				Hu_PingHu = quanQiuRen;
				Fan_PingHu = Fan_quanQiuRen;
			}
			//加入另加番 番数
			if (extra) {
				//门清 
				if (card == null || card == undefined) {
					handCard = cards.slice();
					ShouCard = card;
					handoperateRecord = operateRecord.slice();
					let MengQing = this.MengQing(chairID, handCard, handoperateRecord, Hu_PingHu);
					if (MengQing) {
						Fan_PingHu++;
					}
				}

				//一条龙
				handCard = cards.slice();
				ShouCard = card;
				handoperateRecord = operateRecord.slice();
				let YiTiaoLong = this.YiTiaoLong(chairID, handCard, card, handoperateRecord, playeType);
				if (YiTiaoLong) {
					Fan_PingHu++;
				}

				//混一色
				handCard = cards.slice();
				ShouCard = card;
				handoperateRecord = operateRecord.slice();
				let HunYiSe = this.HunYiSe(chairID, handCard, card, handoperateRecord, playeType, Hu_PingHu);
				if (HunYiSe) {
					Fan_PingHu++;
				}
				//无癞加番 
				handCard = cards.slice();
				ShouCard = card;
				handoperateRecord = operateRecord.slice();
				let WuLai = this.WuLai(chairID, handCard, card, handoperateRecord, playeType, Hu_PingHu);
				if (WuLai) {
					Fan_PingHu++;
				}
			}
		}

		if (Hu_PingHu >= 0 && Fan_PingHu >= 0) {
			let type = Hu_PingHu;
			let rate = Fan_PingHu;
			return {
				type,
				rate
			};
		}
		return false;
	}

	/*
	 * 能否胡七对
	 * cards 手牌
	 * card 摸到的牌
	 * playeType 癞子玩法
	 */
	canHuQidui(chairID, operateRecord, cards, card, playType) {
		let cloneCards = cards.slice();
		if (card != null && card != undefined) {
			cloneCards.push(card);
			cards.push(card)
		}
		//手牌 排序
		cloneCards.sort((a, b) => {
			return a - b;
		});
		let EndCards = this.getOperateRecordCard(chairID, cards, card, operateRecord);
		if (EndCards.length != cloneCards.length) {
			return false;
		}
		let handcloneCards = cards.slice();
		if (card != null && card != undefined) {
			handcloneCards.push(card);
		}
		let cloneCardsCard = this.getCardNumberArr(handcloneCards, [38]);
		let rank = (card % 10 - 1);
		let type = Math.floor(card / 10);
		if (card != null && card != undefined && cloneCardsCard.cards[type][rank] == 1) {
			return false;
		}
		let ghostList = [];
		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21)
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(37);
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(35);
			ghostList.push(37);
		}
		//获取花色
		let CardColor = this.getCardColorArr(cloneCards, ghostList, 2);
		//转换牌型
		cloneCards = this.getCardNumberArr(cloneCards, ghostList);
		// if (card != null && card != undefined) {
		// 	let rank = (card % 10 - 1);
		// 	let type = Math.floor(card / 10);
		// 	cloneCards.cards[type][rank]++;
		// }
		//记录龙背爪
		let isQidui = false;
		for (let i = 0; i < cloneCards.cards.length; i++) {
			for (let j = 0; j < cloneCards.cards[i].length; j++) {
				//只有一张牌
				if (cloneCards.cards[i][j] == 1) {
					//没有癞子
					if (cloneCards.ghostCount <= 0) {
						return false;
					}
					//如果有癞子 替换一个
					cloneCards.ghostCount--;
				}
				//只有三张牌
				if (cloneCards.cards[i][j] == 3) {
					//没有癞子
					if (cloneCards.ghostCount <= 0) {
						return false;
					}
					//如果有癞子 替换一个
					cloneCards.ghostCount--;
					//同时改变牌型 为龙背爪
					isQidui = true;
				}
				//有四张牌
				if (cloneCards.cards[i][j] == 4) {
					//let cardccc = i * 10 + (j + 1);
					//摸到的牌 为杠 //改变牌型 为龙背爪
					//if (card == cardccc)
					isQidui = true;


				}
			}
		}

		//如果还剩有癞子 且数量大于等于2个 
		if (cloneCards.ghostCount >= 2) {
			isQidui = true;
		}

		//通过上面判断后 判断花色 如果是一种颜色 返回清七对番数
		if (CardColor) return gameProto.cardType.QINGQIDUI;

		//返回龙背爪
		if (isQidui) return gameProto.cardType.LONGBEIZHUA;


		return gameProto.cardType.QIDUI;
	}
	/*
	 * 能否胡大对子
	 * chairID 玩家ID
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playeType 癞子玩法
	 */
	canHuDaDduiZi(chairID, cards, card, operateRecord, playType) {
		let EndCards = this.getOperateRecordCard(chairID, cards, card, operateRecord, 1);
		if (!EndCards) {
			return false;
		}
		let handcloneCardss = cards.slice();
		if (card != null && card != undefined) {
			handcloneCardss.push(card);
		}
		let cloneCardsCard = this.getCardNumberArr(handcloneCardss, [38]);
		let rank = (card % 10 - 1);
		let type = Math.floor(card / 10);
		if (card != null && card != undefined && cloneCardsCard.cards[type][rank] == 1) {
			return false;
		}
		let handcloneCards = cards.slice();
		//手牌 排序
		handcloneCards.sort((a, b) => {
			return a - b;
		});
		let ghostList = [];
		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21);
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(37);
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(35);
			ghostList.push(37);
		}
		//转换牌型
		let cloneCards = this.getCardNumberArr(handcloneCards, ghostList);
		if (card != null && card != undefined) {
			let rank = (card % 10 - 1);
			let type = Math.floor(card / 10);
			cloneCards.cards[type][rank]++;
		}
		//是否有将对
		let tmpData = false;
		for (let i = 0; i < cloneCards.cards.length; i++) {
			for (let j = 0; j < cloneCards.cards[i].length; j++) {
				//只有一张牌
				if (cloneCards.cards[i][j] == 1) {
					//没有癞子
					if (cloneCards.ghostCount <= 0) {
						return false;
					}
					if (tmpData == false) {
						//如果有癞子 替换一个
						cloneCards.ghostCount--;
						//组为将对
						tmpData = true;
					} else if (tmpData == true && cloneCards.ghostCount >= 2) {
						//如果有癞子 替换两个 组为坎牌
						cloneCards.ghostCount -= 2;
					} else {
						return false;
					}
				}
				//两张牌
				if (cloneCards.cards[i][j] == 2) {
					if (tmpData == false) {
						//设置为将对
						tmpData = true;
						continue;
					}

					//已有将对且没有癞子
					if (tmpData == true && cloneCards.ghostCount <= 0) {
						return false;
					} else {
						//如果有癞子 替换一个组合为3张牌
						cloneCards.ghostCount--;
					}
				}
			}
		}
		//如果还剩有癞子 且数量大于等于2个 
		if (cloneCards.ghostCount >= 2 && tmpData == false) {
			tmpData = true;
			cloneCards.ghostCount -= 2;
		}
		if (tmpData == false) return false;
		//获取花色
		let CardColor = this.getCardColorArr(EndCards, ghostList, 2);
		//通过上面判断后 判断花色 如果是一种颜色 返回清大对番数
		if (CardColor && tmpData) return gameProto.cardType.QINGDADUI;

		return gameProto.cardType.DADUIZI;
	}

	//递归将牌多种组合
	canHuJiang(cloneCards, Data, length, card) {
		let tmpData = false;
		let HuCombination = [];
		//踢出将牌
		for (let i = 0; i < cloneCards.cards.length; i++) {
			for (let j = 0; j < cloneCards.cards[i].length; j++) {
				let Cards = i * 10 + (j + 1);
				if (Data == Cards) {
					if (cloneCards.cards[i][j] == 4) {
						cloneCards.cards[i][j] -= 2;
						length -= 2;
						//设置为将对
						tmpData = true;
						HuCombination.push({
							type: 0,
							list: [Cards, Cards]
						});
						if (card == Cards) {
							HuCombination.push({
								type: 3,
								list: [Cards, Cards]
							});
						}
					} else if (cloneCards.cards[i][j] == 3) {
						cloneCards.cards[i][j] -= 2;
						length -= 2;
						//设置为将对
						tmpData = true;
						HuCombination.push({
							type: 0,
							list: [Cards, Cards]
						});
						if (card == Cards) {
							HuCombination.push({
								type: 3,
								list: [Cards, Cards]
							});
						}
					} else if (cloneCards.cards[i][j] == 2) {
						cloneCards.cards[i][j] -= 2;
						length -= 2;
						//设置为将对
						tmpData = true;
						HuCombination.push({
							type: 0,
							list: [Cards, Cards]
						});
						if (card == Cards) {
							HuCombination.push({
								type: 3,
								list: [Cards, Cards]
							});
						}
					} else if (cloneCards.cards[i][j] == 1) {
						cloneCards.cards[i][j]--;
						if (cloneCards.ghostCount > 0) {
							//如果有癞子 替换一个组合为2张牌
							cloneCards.ghostCount--;
						} else {
							return {
								not: false,
								ghost: cloneCards.ghostCount
							};
						}
						//设置为将对
						tmpData = true;
						length -= 2;
						HuCombination.push({
							type: 0,
							list: [Cards, Cards]
						});
						if (card == Cards) {
							HuCombination.push({
								type: 3,
								list: [Cards, Cards]
							});
						}
					}
				}
				if (tmpData == true) break;
			}
			if (tmpData == true) break;
		}
		let cloneCards_to = JSON.parse(JSON.stringify(cloneCards));
		let chun_to = this.Shun_1(cloneCards_to, length, tmpData, card);
		if (chun_to.not == true) {
			cloneCards.ghostCount = chun_to.ghost;
			length = chun_to.length;
			for (let key in chun_to.HuCombination) {
				HuCombination.push(chun_to.HuCombination[key]);
			}
		}
		if (length == 0) {
			return {
				not: true,
				ghost: cloneCards.ghostCount,
				HuCombination: HuCombination
			};
		}
		let cloneCards_shui = JSON.parse(JSON.stringify(cloneCards));
		let chun_shui = this.Shun_2(cloneCards_shui, length, tmpData, card);
		if (chun_shui.not == true) {
			cloneCards.ghostCount = chun_shui.ghost;
			length = chun_shui.length;
			for (let key in chun_shui.HuCombination) {
				HuCombination.push(chun_shui.HuCombination[key]);
			}
		}
		if (length == 0) {
			return {
				not: true,
				ghost: cloneCards.ghostCount,
				HuCombination: HuCombination
			};
		}
		let cloneCards_fei = JSON.parse(JSON.stringify(cloneCards));
		let chun_fei = this.Shun_3(cloneCards_fei, length, tmpData, card);
		if (chun_fei.not == true) {
			cloneCards.ghostCount = chun_fei.ghost;
			length = chun_fei.length;
			for (let key in chun_fei.HuCombination) {
				HuCombination.push(chun_fei.HuCombination[key]);
			}
		}
		if (length == 0) {
			return {
				not: true,
				ghost: cloneCards.ghostCount,
				HuCombination: HuCombination
			};
		}

		return {
			not: false,
			ghost: cloneCards.ghostCount
		};
	}
	/*
	 * 能否胡平胡
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playeType 癞子玩法
	 */
	canHuPingHu(chairID, cards, card, operateRecord, playType) {
		let handcloneCards = cards.slice();
		// let End = this.getOperateRecordCard(chairID, cards, card, operateRecord);
		if (card != null && card != undefined) {
			handcloneCards.push(card);
		}
		// let cloneCardsCard = this.getCardNumberArr(handcloneCardss, [38]);
		// let rank = (card % 10 - 1);
		// let type = Math.floor(card / 10);
		// if (card != null && card != undefined && cloneCardsCard.cards[type][rank] == 1) {
		// 	return false;
		// }
		// let handcloneCards = cards.slice();
		//手牌 排序
		handcloneCards.sort((a, b) => {
			return a - b;
		});
		let ghostList = [];
		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21);
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(37);
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(35);
			ghostList.push(37);
		}
		//转换牌型 只用计算手上的牌
		let cloneCards = this.getCardNumberArr(handcloneCards, ghostList);
		// if (card != null && card != undefined) {
		//     let rank = (card % 10 - 1);
		//     let type = Math.floor(card / 10);
		//     cloneCards.cards[type][rank]++;
		// }
		//是否有将对
		let tmpData = false;
		let tmpCardsData = [];
		let jiang = 0;
		//先计算将对
		for (let i = 0; i < cloneCards.cards.length; i++) {
			for (let j = 0; j < cloneCards.cards[i].length; j++) {
				//两张牌
				if (cloneCards.cards[i][j] >= 1) {
					//计算牌值
					let Cards = i * 10 + (j + 1);
					// if(card != null && card != undefined&&card==Cards&&cloneCards.cards[i][j]!=2)
					// {
					// 	continue;
					// }
					tmpCardsData.push(Cards);
				}
			}
		}
		//不用鬼牌
		for (let i = 0; i < tmpCardsData.length; i++) {
			//先不使用鬼牌查看能否有将对 且能胡
			let Cards_to = this.getCardNumberArr(handcloneCards, [38]);
			let cardlength = handcloneCards.length;
			// if (card != null && card != undefined) {
			//     let rank = (card % 10 - 1);
			//     let type = Math.floor(card / 10);
			//     Cards_to.cards[type][rank]++;
			//     cardlength++;
			// }
			let Cardsdata = this.canHuJiang(Cards_to, tmpCardsData[i], cardlength, card);
			if (Cardsdata.not == true) {
				tmpData = true;
				jiang = tmpCardsData[i];
				break;
			}
		}
		if (tmpData == false) {
			for (let i = 0; i < tmpCardsData.length; i++) {
				//使用鬼牌查看将对
				//使用鬼牌
				let Cards_sui = this.getCardNumberArr(handcloneCards, ghostList);
				let cardlength = handcloneCards.length;
				// if (card != null && card != undefined) {
				//     let rank = (card % 10 - 1);
				//     let type = Math.floor(card / 10);
				//     Cards_sui.cards[type][rank]++;
				//     cardlength++;
				// }
				let Cardsdata = this.canHuJiang(Cards_sui, tmpCardsData[i], cardlength, card);
				if (Cardsdata.not == true) {
					cloneCards.ghostCount = Cardsdata.ghost;
					tmpData = true;
					jiang = tmpCardsData[i];
					break;
				}
			}
		}

		if (tmpData == false) return false;
		//如果还剩有癞子 且数量大于等于2个 没有将对 
		// if (cloneCards.ghostCount >= 2 && tmpData == false) {
		// 	tmpData = true;
		// 	cloneCards.ghostCount -= 2;
		// }
		return gameProto.cardType.PINGHU;
	}

	/*
	 * 大四喜
	 * chairID 
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playType 玩法类型 
	 */
	DaSiXi(chairID, cards, card, operateRecord, playType) {
		let ghostList = [];
		let handcloneCards = this.getOperateRecordCard(chairID, cards, card, operateRecord);

		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21);
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(37);
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(35);
			ghostList.push(37);
		}

		//转换牌型 只用计算手上的牌
		let cloneCards = this.getCardNumberArr(handcloneCards, ghostList);
		// if (card != null && card != undefined) {
		// 	let rank = (card % 10 - 1);
		// 	let type = Math.floor(card / 10);
		// 	cloneCards.cards[type][rank]++;
		// }
		//记录字牌数量 是否大四喜
		let isDaShiXisum = 0;
		let jiang = false;
		//使用整个牌组
		for (let i = 0; i < cloneCards.cards[3].length; i++) {
			//计算牌值
			let card = 3 * 10 + (i + 1);
			//校验字牌 如果是 东南西北 记录牌数量 用于判断大四喜
			if (card == CARDID.CARDID_DONG || card == CARDID.CARDID_NAN ||
				card == CARDID.CARDID_XI || card == CARDID.CARDID_BEI) {
				if (cloneCards.cards[3][i] == 2) {
					if (jiang == true) {
						return false;
					}
					isDaShiXisum++;
					jiang = true;
				} else if (cloneCards.cards[3][i] >= 3) {
					isDaShiXisum++;
				} else if (cloneCards.cards[3][i] == 2 && cloneCards.ghostCount >= 1) {
					isDaShiXisum++;
					cloneCards.ghostCount--;
				} else if (cloneCards.cards[3][i] == 1 && cloneCards.ghostCount >= 2) {
					isDaShiXisum++;
					cloneCards.ghostCount -= 2;
				}
			}
		}
		if (isDaShiXisum == 4) {
			//返回大四喜番数
			return gameProto.cardType.DASIXI;
		} else if (isDaShiXisum == 3 && cloneCards.ghostCount >= 3) {
			//返回大四喜番数
			return gameProto.cardType.DASIXI;
		} else if (isDaShiXisum == 2 && cloneCards.ghostCount >= 6) {
			//返回大四喜番数
			return gameProto.cardType.DASIXI;
		}
		return false;
	}

	/*
	 * 混三元
	 * chairID 
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playType 玩法类型 
	 */
	HunSanYan(chairID, cards, card, operateRecord, playType) {
		let DaSanYuan = this.DaSanYuan(chairID, cards, card, operateRecord, playType);
		let HunYiSe = this.HunYiSe(chairID, cards, card, operateRecord, playType);
		if (DaSanYuan > 0 && HunYiSe > 0) {
			let handcloneCards = this.getOperateRecordCard(chairID, cards, card, operateRecord);
			//转换牌型 只用计算手上的牌
			let cloneCards = this.getCardNumberArr(handcloneCards, [38]);
			// if (card != null && card != undefined) {
			// 	let rank = (card % 10 - 1);
			// 	let type = Math.floor(card / 10);
			// 	cloneCards.cards[type][rank]++;
			// }
			let ghostList = [];
			if (playType == gameProto.playType.FEIXIAOJI) {
				ghostList.push(21);
			} else if (playType == gameProto.playType.FEIBAIBAN) {
				//飞白板或者飞双鬼 白板算作鸡
				ghostList.push(37);
			} else if (playType == gameProto.playType.FEISHUANGGUI) {
				//飞白板或者飞双鬼 白板算作鸡
				ghostList.push(35);
				ghostList.push(37);
			}
			//是否有将对
			let tmpCardsData = [];
			//先计算将对
			for (let i = 0; i < cloneCards.cards.length; i++) {
				for (let j = 0; j < cloneCards.cards[i].length; j++) {
					//两张牌
					if (cloneCards.cards[i][j] >= 1) {
						//计算牌值
						let Cards = i * 10 + (j + 1);
						tmpCardsData.push(Cards);
					}
				}
			}
			//不用鬼牌
			for (let i = 0; i < tmpCardsData.length; i++) {
				//先不使用鬼牌查看能否有将对 且能胡
				let Cards_to = this.getCardNumberArr(handcloneCards, [38], 1);
				let cardlength = handcloneCards.length;
				// if (card != null && card != undefined) {
				// 	let rank = (card % 10 - 1);
				// 	let type = Math.floor(card / 10);
				// 	Cards_to.cards[type][rank]++;
				// 	cardlength++;
				// }
				let Cardsdata = this.canHuJiang(Cards_to, tmpCardsData[i], cardlength, card);
				if (Cardsdata.not == true) {
					if (tmpCardsData[i] == CARDID.CARDID_ZHONG || tmpCardsData[i] == CARDID.CARDID_FA ||
						tmpCardsData[i] == CARDID.CARDID_BAI) {
						//返回混三元番数
						return gameProto.cardType.HUNSANYUAN;
					}
				}
			}
			//使用鬼牌
			for (let i = 0; i < tmpCardsData.length; i++) {
				//使用鬼牌查看将对

				let Cards_sui = this.getCardNumberArr(handcloneCards, ghostList);
				let cardlength = handcloneCards.length;
				// if (card != null && card != undefined) {
				// 	let rank = (card % 10 - 1);
				// 	let type = Math.floor(card / 10);
				// 	Cards_sui.cards[type][rank]++;
				// 	cardlength++;
				// }
				let Cardsdata = this.canHuJiang(Cards_sui, tmpCardsData[i], cardlength, card);
				if (Cardsdata.not == true) {
					if (tmpCardsData[i] == CARDID.CARDID_ZHONG || tmpCardsData[i] == CARDID.CARDID_FA ||
						tmpCardsData[i] == CARDID.CARDID_BAI) {
						//返回混三元番数
						return gameProto.cardType.HUNSANYUAN;
					}

				}
			}

		}
		return false;
	}

	/*
	 * 大三元 
	 * chairID 
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playType 玩法类型 
	 */
	DaSanYuan(chairID, cards, card, operateRecord, playType) {
		let handcloneCards = this.getOperateRecordCard(chairID, cards, card, operateRecord);
		//记录字牌数量 是否大三元
		let isDaSanYuan = 0;
		//使用整个牌组
		for (let i = 0; i < handcloneCards.length; i++) {
			//校验字牌 如果是 中 白 发 记录牌数量 用于判断混三元
			if (handcloneCards[i] == CARDID.CARDID_ZHONG || handcloneCards[i] == CARDID.CARDID_FA ||
				handcloneCards[i] == CARDID.CARDID_BAI) {
				//记录字牌数量
				isDaSanYuan++;
			}
			if (playType == gameProto.playType.FEIBAIBAN && handcloneCards[i] == CARDID.CARDID_BAI) {
				isDaSanYuan--;
			} else if (playType == gameProto.playType.FEISHUANGGUI && (handcloneCards[i] == CARDID.CARDID_BAI || handcloneCards[i] == CARDID.CARDID_ZHONG)) {
				isDaSanYuan--;
			}
		}
		let ghostList = [];
		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21);
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(37);
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(35);
			ghostList.push(37);
		}

		//转换牌型 只用计算手上的牌
		let cloneCards = this.getCardNumberArr(handcloneCards, ghostList);
		//中、发、白各三张+癞子 大于8张 返回大三元
		if (isDaSanYuan + cloneCards.ghostCount >= 8) {
			//返回大三元番数
			return gameProto.cardType.DASANYUAN;
		}
		return false;
	}
	/*
	 * 风一色
	 * chairID 
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playType 玩法类型 
	 */
	FengYiSe(chairID, cards, card, operateRecord, playType) {
		let handcloneCards = this.getOperateRecordCard(chairID, cards, card, operateRecord);
		let ghostList = [];
		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21);
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(37);
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(35);
			ghostList.push(37);
		}
		//东南西北中发白字牌数
		let ziPai = 0;
		//全部牌
		for (let i = 0; i < handcloneCards.length; i++) {
			if ((handcloneCards[i] >= CARDID.CARDID_DONG && handcloneCards[i] <= CARDID.CARDID_BAI) || ghostList.indexOf(cloneCards[i]) >= 0) {
				ziPai++;
			}
		}
		//东南西北中发白字牌数 等于所有的牌数  且有将牌 返回风一色
		if (ziPai == cloneCards.length) {
			return gameProto.cardType.FENGYISE;
		}

		return false;
	}
	/*
	 * 清一色
	 * chairID 
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playType 玩法类型 
	 */
	QingYiSe(chairID, cards, card, operateRecord, playType) {
		let handcloneCards = this.getOperateRecordCard(chairID, cards, card, operateRecord);
		let ghostList = [];
		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21);
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(37);
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(35);
			ghostList.push(37);
		}
		//通过上面判断后 判断花色 如果是一种颜色 返回清一色
		if (this.getCardColorArr(handcloneCards, ghostList)) return gameProto.cardType.QINGYISE;
		return false;
	}

	/*
	 * 无癞
	 * chairID 
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playType 玩法类型 
	 */
	WuLai(chairID, cards, card, operateRecord, playType, type) {
		let handcloneCards = this.getOperateRecordCard(chairID, cards, card, operateRecord, 3);
		if (!handcloneCards) return false;
		let ghostList = [];
		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21);
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(37);
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(35);
			ghostList.push(37);
		}
		if (ghostList.length == 0) {
			return false;
		}
		//转换牌型 只用计算手上的牌
		let cloneCards = [];
		if (card != null && card != undefined) {
			if (card == 21 && playType == gameProto.playType.FEIXIAOJI) {
				cloneCards = this.getCardNumberArr(handcloneCards, ghostList);
				let rank = (card % 10 - 1);
				let type = Math.floor(card / 10);
				cloneCards.cards[type][rank]++;
			} else {
				handcloneCards.push(card);
				cloneCards = this.getCardNumberArr(handcloneCards, ghostList);
			}
		} else {
			cloneCards = this.getCardNumberArr(handcloneCards, ghostList);
		}

		let type_forbid = [gameProto.cardType.QIXIN, gameProto.cardType.LIUXIN, gameProto.cardType.LIUXINZIMEI, gameProto.cardType.QIXINLAIZLAN];
		if (this.getCanHu(chairID, cards, card, operateRecord, 0) && type_forbid.indexOf(type) != -1) {
			let isZHISunm = 0;
			for (let j = 0; j < cloneCards.cards[3].length; j++) {
				//校验字牌 只能存在一张
				if (cloneCards.cards[3][j] == 1) {
					//记录字牌数量
					isZHISunm++;
				}
			}
			if (isZHISunm + cloneCards.ghostCount == 8 && handcloneCards.indexOf(CARDID.CARDID_TIAO4) != 0 && handcloneCards.indexOf(CARDID.CARDID_TIAO7) != 0) {
				return gameProto.cardType.WULAI;
			} else {
				return false;
			}
		}
		if (cloneCards.ghostCount == 0) {
			return gameProto.cardType.WULAI;
		}
		if (this.getCanHu(chairID, cards.slice(), card, operateRecord, 4)) {
			return gameProto.cardType.WULAI;
		}
		// if (playType == gameProto.playType.FEIXIAOJI&&cloneCards.ghostCount == 1&&cloneCards.cards[2][1]==1&&cloneCards.cards[2][2]==1) {
		// 	return gameProto.cardType.WULAI;
		// }else if(playType == gameProto.playType.FEIXIAOJI&&cloneCards.ghostCount == 2&&cloneCards.cards[2][1]==2&&cloneCards.cards[2][2]==2)
		// {
		// 	return gameProto.cardType.WULAI;
		// }

		return false;
	}
	/*
	 * 一条龙
	 * chairID 
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playType 玩法类型 
	 */
	YiTiaoLong(chairID, cards, card, operateRecord, playType) {
		let handcloneCards = this.getOperateRecordCard(chairID, cards, card, operateRecord);

		//转换牌型 只用计算手上的牌
		let cloneCards = this.getCardNumberArr(handcloneCards, [38]);
		// if (card != null && card != undefined) {
		// 	let rank = (card % 10 - 1);
		// 	let type = Math.floor(card / 10);
		// 	cloneCards.cards[type][rank]++;
		// }
		let ghostList = [];
		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21);
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(37);
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(35);
			ghostList.push(37);
		}
		//是否有将对
		let tmpCardsData = [];
		//先计算将对
		for (let i = 0; i < cloneCards.cards.length; i++) {
			for (let j = 0; j < cloneCards.cards[i].length; j++) {
				//两张牌
				if (cloneCards.cards[i][j] >= 1) {
					//计算牌值
					let Cards = i * 10 + (j + 1);
					tmpCardsData.push(Cards);
				}
			}
		}
		//不用鬼牌
		for (let i = 0; i < tmpCardsData.length; i++) {
			//先不使用鬼牌查看能否有将对 且能胡
			let Cards_to = this.getCardNumberArr(handcloneCards, [38], 1);
			let cardlength = handcloneCards.length;
			// if (card != null && card != undefined) {
			// 	let rank = (card % 10 - 1);
			// 	let type = Math.floor(card / 10);
			// 	Cards_to.cards[type][rank]++;
			// 	cardlength++;
			// }
			let Cardsdata = this.canHuJiang(Cards_to, tmpCardsData[i], cardlength, card);
			if (Cardsdata.not == true) {
				let YiTiaoLongCards = this.getOperateRecordCard(chairID, cards, card, operateRecord, 2);
				if (card != null && card != undefined) {
					YiTiaoLongCards.push(card);
				}
				if (this.getYiTiaoLong(YiTiaoLongCards, ghostList, playType)) {
					return gameProto.cardType.YITIAOLONG;
				}
			}
		}
		//使用鬼牌\
		for (let i = 0; i < tmpCardsData.length; i++) {
			//使用鬼牌查看将对

			let Cards_sui = this.getCardNumberArr(handcloneCards, ghostList);
			let cardlength = handcloneCards.length;
			// if (card != null && card != undefined) {
			// 	let rank = (card % 10 - 1);
			// 	let type = Math.floor(card / 10);
			// 	Cards_sui.cards[type][rank]++;
			// 	cardlength++;
			// }
			let Cardsdata = this.canHuJiang(Cards_sui, tmpCardsData[i], cardlength, card);
			if (Cardsdata.not == true) {
				let YiTiaoLongCards = this.getOperateRecordCard(chairID, cards, card, operateRecord, 2);
				if (card != null && card != undefined) {
					YiTiaoLongCards.push(card);
				}
				if (this.getYiTiaoLong(YiTiaoLongCards, ghostList, playType)) {
					return gameProto.cardType.YITIAOLONG;
				}

			}
		}
		return false;
	}

	/*
	 * 门清
	 * chairID 
	 * card 摸到的牌
	 * operateRecord 操作数组
	 */
	MengQing(chairID, card, operateRecord, type) {
		let MengQing = true;
		//以下牌型不与门清叠加番数	
		//七对 //龙背爪 //清七对
		let type_forbid = [gameProto.cardType.QIDUI, gameProto.cardType.LONGBEIZHUA, gameProto.cardType.QINGQIDUI];
		if (type_forbid.indexOf(type) >= 0) {
			return false;
		}
		//获取已经操作过的所有牌 
		for (let i = 0; i < operateRecord.length; ++i) {
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.PENG) {
				/* 碰 */
				MengQing = false;
			} else if (operateRecord[i].chairID == chairID && (operateRecord[i].operate == gameProto.operateType.GANG_CHI /* 吃杠 */ ||
				operateRecord[i].operate == gameProto.operateType.GANG_BU /* 补杠 */)) {
				MengQing = false;
			} else if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.CHI) {
				/* 吃牌 */
				MengQing = false;
			}
		}
		//没有碰杠且自摸	返回门清 
		if (MengQing == true)
			return gameProto.cardType.MENQING;

		return false;
	}

	/*
	 * 全求人
	 * chairID 
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playType 玩法类型 
	 */
	quanQiuRen(chairID, cards, card, operateRecord, playType) {
		let quanQiuRen = true;
		//获取已经操作过的所有牌 
		for (let i = 0; i < operateRecord.length; ++i) {
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.GANG_ZHI) {
				quanQiuRen = false;
			}
		}
		if (playType == gameProto.playType.FEIXIAOJI) {
			//手牌只有一张 且摸到的牌值等于手牌值 返回 全求人
			if (card && quanQiuRen && cards.length == 1 && (card == CARDID.CARDID_TIAO1 || cards[0] == CARDID.CARDID_TIAO1)) {
				return gameProto.cardType.QUANQIUREN;
			}
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//手牌只有一张 且摸到的牌值等于手牌值 返回 全求人
			if (card && quanQiuRen && cards.length == 1 && (card == CARDID.CARDID_BAI || cards[0] == CARDID.CARDID_BAI)) {
				return gameProto.cardType.QUANQIUREN;
			}
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//手牌只有一张 且摸到的牌值等于手牌值 返回 全求人
			if (card && quanQiuRen && cards.length == 1 && (card == CARDID.CARDID_BAI || cards[0] == CARDID.CARDID_BAI ||
				card == CARDID.CARDID_ZHONG || cards[0] == CARDID.CARDID_ZHONG)) {
				return gameProto.cardType.QUANQIUREN;
			}
		}

		if (card && quanQiuRen && cards.length == 1 && cards[0] == card) {
			return gameProto.cardType.QUANQIUREN;
		}

		if (quanQiuRen && cards.length == 2 && cards[0] == cards[1]) {
			return gameProto.cardType.QUANQIUREN;
		}
	}

	/*
	 * 混一色
	 * chairID 
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playType 玩法类型 
	 */
	HunYiSe(chairID, cards, card, operateRecord, playType, type) {

		let ghostList = [];
		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21);
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(37);
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(35);
			ghostList.push(37);
		}
		let End = this.getOperateRecordCard(chairID, cards, card, operateRecord);
		//获取花色 使用整个牌组 不校验字牌花色
		let EndColor = End.slice();
		//去掉将牌 剩下的牌是一种花色
		if (this.getCardColorSum(EndColor, ghostList, 1) <= 1) {
			//是大队子牌型 且是风牌 加 四个三张 则为混大队
			if (type == gameProto.cardType.DADUIZI) {
				return gameProto.cardType.HUNDADUI;
			} else {
				//返回混一色番数
				return gameProto.cardType.HUNYISE;
			}
		}
	}

	/*
	 * 能否胡十风
	 */
	canHuShiFeng(chairID, operateRecord, playType) {
		let cloneCards = [];
		let ghostList = [];
		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21);
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(37);
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(35);
			ghostList.push(37);
		}
		//获取已经操作过的所有牌 
		for (let i = 0; i < operateRecord.length; i++) {
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.PENG) {
				/* 碰 */
				return false;
			}
			if (operateRecord[i].chairID == chairID && (operateRecord[i].operate == gameProto.operateType.GANG_CHI /* 吃杠 */ ||
				operateRecord[i].operate == gameProto.operateType.GANG_BU /* 补杠 */ ||
				operateRecord[i].operate == gameProto.operateType.GANG_ZHI)) {
				/* 自摸杠 */
				return false;
			}
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.CHI) {
				/* 吃牌 */
				return false;
			}
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.QI) {
				/* 出的牌 */
				//出牌 放入数组
				cloneCards.push(operateRecord[i].card);
			}
		}
		//手牌 排序
		//cloneCards.sort((a, b) => { return a - b; });
		//循环判断风牌有无连续出10张
		let fengSun = 0; //记录风牌数量
		for (let i = 0; i < cloneCards.length; i++) {
			//从i位到最后一位不足10张踢出
			// if ((i - cloneCards.length) < 10) {
			// 	return false;
			// }
			if (this.getCardColor(cloneCards[i]) == 3) {
				for (let j = i; j < cloneCards.length; j++) {
					if ((this.getCardColor(cloneCards[j]) == 3 && cloneCards[j] <= CARDID.CARDID_BAI && cloneCards[j] >= CARDID.CARDID_DONG) || ghostList.indexOf(cloneCards[j]) >= 0) {
						fengSun++;
					} else {
						fengSun = 0;
					}
					if (fengSun >= 10) {
						return gameProto.cardType.SHIFEN;
					}
				}
				fengSun = 0;
			}
		}
		return false;
	}
	/*
	 * 能否胡十三幺
	 */
	canHuShiSanYao(chairID, operateRecord, playType) {
		let cloneCards = [];
		let ghostList = [];
		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21);
		} else if (playType == gameProto.playType.FEIBAIBAN) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(37);
		} else if (playType == gameProto.playType.FEISHUANGGUI) {
			//飞白板或者飞双鬼 白板算作鸡
			ghostList.push(35);
			ghostList.push(37);
		}
		//获取已经操作过的所有牌 
		for (let i = 0; i < operateRecord.length; i++) {
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.PENG) {
				/* 碰 */
				return false;
			}
			if (operateRecord[i].chairID == chairID && (operateRecord[i].operate == gameProto.operateType.GANG_CHI /* 吃杠 */ ||
				operateRecord[i].operate == gameProto.operateType.GANG_BU /* 补杠 */ ||
				operateRecord[i].operate == gameProto.operateType.GANG_ZHI)) {
				/* 自摸杠 */
				return false;
			}
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.CHI) {
				/* 吃牌 */
				return false;
			}
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.QI) {
				/* 出的牌 */
				//出牌 放入数组
				cloneCards.push(operateRecord[i].card);
			}
		}
		//手牌 排序
		//cloneCards.sort((a, b) => { return a - b; });
		//循环判断十三幺牌有无连续出13张
		let ShiSanYao = 0; //记录十三幺牌数量
		for (let i = 0; i < cloneCards.length; i++) {
			//从i位到最后一位不足10张踢出
			// if ((i - cloneCards.length) < 10) {
			// 	return false;
			// }
			if ((cloneCards[i] <= CARDID.CARDID_BAI && cloneCards[i] >= CARDID.CARDID_DONG) || (cloneCards[i] % 10 == 1 || cloneCards[i] % 10 == 9)) {
				for (let j = i; j < cloneCards.length; j++) {
					if ((cloneCards[j] <= CARDID.CARDID_BAI && cloneCards[j] >= CARDID.CARDID_DONG) || (cloneCards[j] % 10 == 1 || cloneCards[j] % 10 == 9) || ghostList.indexOf(cloneCards[j]) >= 0) {
						ShiSanYao++;
					} else {
						ShiSanYao = 0;
					}
					if (ShiSanYao >= 13) {
						return gameProto.cardType.SHISANYAO;
					}
				}
				ShiSanYao = 0;
			}
		}
		return false;
	}
	/*
	 * 能否手提胡十三幺
	 */
	canHuShouShiSanYao(chairID, operateRecord, cloneCards, card) {
		// if (card != null && card != undefined) {
		// 	return false;
		// }
		if (card != null && card != undefined) {
			cloneCards.push(card);
		}
		if (cloneCards.length != 14) {
			return false;
		}
		//获取已经操作过的所有牌 
		for (let i = 0; i < operateRecord.length; i++) {
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.PENG) {
				/* 碰 */
				return false;
			}
			if (operateRecord[i].chairID == chairID && (operateRecord[i].operate == gameProto.operateType.GANG_CHI /* 吃杠 */ ||
				operateRecord[i].operate == gameProto.operateType.GANG_BU /* 补杠 */ ||
				operateRecord[i].operate == gameProto.operateType.GANG_ZHI)) {
				/* 自摸杠 */
				return false;
			}
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.CHI) {
				/* 吃牌 */
				return false;
			}
		}
		//手牌 排序
		cloneCards.sort((a, b) => {
			return a - b;
		});
		//循环判断十三幺牌有无连续出13张
		let ShiSanYao = 0; //记录十三幺牌数量
		for (let i = 0; i < cloneCards.length; i++) {
			//从i位到最后一位不足10张踢出
			// if ((i - cloneCards.length) < 10) {
			// 	return false;
			// }
			if ((cloneCards[i] <= CARDID.CARDID_BAI && cloneCards[i] >= CARDID.CARDID_DONG) || (cloneCards[i] % 10 == 1 || cloneCards[i] % 10 == 9)) {
				ShiSanYao = 0;
				for (let j = i; j < cloneCards.length; j++) {
					if ((cloneCards[j] <= CARDID.CARDID_BAI && cloneCards[j] >= CARDID.CARDID_DONG) || (cloneCards[j] % 10 == 1 || cloneCards[j] % 10 == 9)) {
						ShiSanYao++;
					}
					if (ShiSanYao >= 14) {
						return gameProto.cardType.SHOUTISHISANYAO;
					}
				}
			}
		}
		return false;
	}
	/*
	 * 能否胡烂牌（五星六星七星）
	 */
	canHulanPai(cards, card, playType) {
		let huliascards = cards.slice();
		if (card != null && card != undefined) {
			huliascards.push(card);
		}
		//手牌 排序
		huliascards.sort((a, b) => {
			return a - b;
		});
		if (huliascards.length != 14 && (huliascards.length == 13 && card == null && card == undefined)) {
			return false;
		}
		let ghostList = [];
		if (playType == gameProto.playType.FEIXIAOJI) {
			ghostList.push(21);
		}
		// if (playType == gameProto.playType.FEISHUANGGUI) {
		// 	//飞白板或者飞双鬼 白板算作鸡
		//     ghostList.push(35);
		// 	ghostList.push(37);
		// }
		//转换牌型 
		let cloneCards = this.getCardNumberArr(huliascards, ghostList);
		// if (card != null && card != undefined) {
		// 	let rank = (card % 10 - 1);
		// 	let type = Math.floor(card / 10);
		// 	cloneCards.cards[type][rank]++;
		// }
		if (playType == gameProto.playType.FEIXIAOJI && card != null && card != undefined && card == 21 && cloneCards.ghostCount >= 2) {
			return false;
		}
		//有4.7条时 鸡归位 两张癞子 不算烂牌
		if (playType == gameProto.playType.FEIXIAOJI && cloneCards.ghostCount >= 2 && (huliascards.indexOf(CARDID.CARDID_TIAO4) != -1 || huliascards.indexOf(CARDID.CARDID_TIAO7) != -1)) {
			return false;
		}
		//记录字牌数量
		let isZHISunm = 0;
		for (let j = 0; j < cloneCards.cards[3].length; j++) {
			//校验字牌 只能存在一张
			if (cloneCards.cards[3][j] == 1) {
				//记录字牌数量
				isZHISunm++;
				cloneCards.cards[3][j]--;
			} else if (cloneCards.cards[3][j] >= 2) {
				let Cards_1 = 3 * 10 + (j + 1);
				if (playType == gameProto.playType.FEISHUANGGUI) {
					if (Cards_1 == card) {
						return false;
					}
					if (Cards_1 == 35 || Cards_1 == 37) {
						cloneCards.cards[3][j]--;
						cloneCards.ghostCount++;
						j -= 2;
						continue;
					}
				}
				return false;
			}
		}
		//提出1 4 7 / 2 5 8 /3 6 9 组合
		let CardColor = [0, 0, 0];
		let CardColorZiMei = [0, 0, 0];
		let cardsSum = 0;
		let canHuJiang = false;
		let CardColorTong = 0;
		for (let i = 0; i < cloneCards.cards.length; i++) {
			//校验字牌 只能存在一张
			if (i != 3 && cloneCards.cards[i][0] == 1 && cloneCards.cards[i][3] == 1 && cloneCards.cards[i][6] == 1) {
				//记录牌数量
				cardsSum += 3;
				cloneCards.cards[i][0]--;
				cloneCards.cards[i][3]--;
				cloneCards.cards[i][6]--;
				if (CardColor[0] == 1) {
					return false;
				}
				CardColor[0] = 1;
				CardColorZiMei[0]++;
				if (CardColorTong == 1)
					return false;
				CardColorTong = 1;
			}
			if (i != 3 && cloneCards.cards[i][1] == 1 && cloneCards.cards[i][4] == 1 && cloneCards.cards[i][7] == 1) {
				//记录牌数量
				cardsSum += 3;
				cloneCards.cards[i][1]--;
				cloneCards.cards[i][4]--;
				cloneCards.cards[i][7]--;
				if (CardColor[1] == 1) {
					return false;
				}
				CardColor[1] = 1;
				CardColorZiMei[1]++;
				if (CardColorTong == 1)
					return false;
				CardColorTong = 1;
			}
			if (i != 3 && cloneCards.cards[i][2] == 1 && cloneCards.cards[i][5] == 1 && cloneCards.cards[i][8] == 1) {
				//记录牌数量
				cardsSum += 3;
				cloneCards.cards[i][2]--;
				cloneCards.cards[i][5]--;
				cloneCards.cards[i][8]--;
				if (CardColor[2] == 1) {
					return false;
				}
				CardColor[2] = 1;
				CardColorZiMei[2]++;
				if (CardColorTong == 1)
					return false;
				CardColorTong = 1;
			}
			if (i != 3 && (cloneCards.cards[i][0] == 1 && cloneCards.cards[i][3] == 1) || i != 3 && (cloneCards.cards[i][3] == 1 && cloneCards.cards[i][6] == 1) ||
				i != 3 && (cloneCards.cards[i][0] == 1 && cloneCards.cards[i][6] == 1)) {
				//记录牌数量
				cardsSum += 2;
				cloneCards.cards[i][0] = cloneCards.cards[i][0] == 1 ? 0 : cloneCards.cards[i][0];
				cloneCards.cards[i][3] = cloneCards.cards[i][3] == 1 ? 0 : cloneCards.cards[i][3];
				cloneCards.cards[i][6] = cloneCards.cards[i][6] == 1 ? 0 : cloneCards.cards[i][6];
				if (CardColor[0] == 1) {
					return false;
				}
				CardColor[0] = 1;
				CardColorZiMei[0]++;
				if (CardColorTong == 1)
					return false;
				CardColorTong = 1;
			}
			if (i != 3 && (cloneCards.cards[i][1] == 1 && cloneCards.cards[i][4] == 1) || i != 3 && (cloneCards.cards[i][4] == 1 && cloneCards.cards[i][7] == 1) ||
				i != 3 && (cloneCards.cards[i][1] == 1 && cloneCards.cards[i][7] == 1)) {
				//记录牌数量
				cardsSum += 2;
				cloneCards.cards[i][1] = cloneCards.cards[i][1] == 1 ? 0 : cloneCards.cards[i][1];
				cloneCards.cards[i][4] = cloneCards.cards[i][4] == 1 ? 0 : cloneCards.cards[i][4];
				cloneCards.cards[i][7] = cloneCards.cards[i][7] == 1 ? 0 : cloneCards.cards[i][7];
				if (CardColor[1] == 1) {
					return false;
				}
				CardColor[1] = 1;
				CardColorZiMei[1]++;
				if (CardColorTong == 1)
					return false;
				CardColorTong = 1;
			}
			if (i != 3 && (cloneCards.cards[i][2] == 1 && cloneCards.cards[i][5] == 1) || i != 3 && (cloneCards.cards[i][5] == 1 && cloneCards.cards[i][8] == 1) ||
				i != 3 && (cloneCards.cards[i][2] == 1 && cloneCards.cards[i][8] == 1)) {
				//记录牌数量
				cardsSum += 2;
				cloneCards.cards[i][2] = cloneCards.cards[i][2] == 1 ? 0 : cloneCards.cards[i][2];
				cloneCards.cards[i][5] = cloneCards.cards[i][5] == 1 ? 0 : cloneCards.cards[i][5];
				cloneCards.cards[i][8] = cloneCards.cards[i][8] == 1 ? 0 : cloneCards.cards[i][8];
				if (CardColor[2] == 1) {
					return false;
				}
				CardColor[2] = 1;
				CardColorZiMei[2]++;
				if (CardColorTong == 1)
					return false;
				CardColorTong = 1;
			}
			for (let j = 0; j < cloneCards.cards[i].length; j++) {
				if (cloneCards.cards[i][j] == 0) continue;
				if (i != 3 && cloneCards.cards[i][j] >= 2) {
					return false;
				} else if (i != 3 && cloneCards.cards[i][j] == 1) {
					if (canHuJiang == true) {
						return false;
					} else {
						if (CardColorTong >= 1) {
							return false;
						}
						cloneCards.cards[i][j]--;
						canHuJiang = true;
						cardsSum++;
						if (j == 0 || j == 3 || j == 6) {
							CardColorZiMei[0]++;
						} else if (j == 1 || j == 4 || j == 7) {
							CardColorZiMei[1]++;
						} else if (j == 2 || j == 5 || j == 8) {
							CardColorZiMei[2]++;
						}

					}

				}
			}
			CardColor = [0, 0, 0];
			CardColorTong = 0;
		}
		if ((cardsSum + isZHISunm + cloneCards.ghostCount) == 14) {
			if (isZHISunm + cloneCards.ghostCount >= 7) {
				if (playType == gameProto.playType.FEIXIAOJI && huliascards.indexOf(CARDID.CARDID_TIAO1) != -1) {
					if (huliascards.indexOf(CARDID.CARDID_TIAO4) != -1 && huliascards.indexOf(CARDID.CARDID_TIAO7) != -1) {
						if (isZHISunm == 6) {
							return gameProto.cardType.LIUXIN;
						} else {
							return gameProto.cardType.QIXIN;
						}
					} else {
						return gameProto.cardType.QIXINLAIZLAN;
					}
				} else if (playType == gameProto.playType.FEISHUANGGUI) {
					if (isZHISunm == 7 && cloneCards.ghostCount == 0) {
						return gameProto.cardType.QIXIN;
					} else {
						return gameProto.cardType.QIXINLAIZLAN;
					}
				} else {
					return gameProto.cardType.QIXIN;
				}

			}
			if (isZHISunm + cloneCards.ghostCount >= 5 && (CardColorZiMei[0] == 3 || CardColorZiMei[1] == 3 || CardColorZiMei[2] == 3)) {
				return gameProto.cardType.LIUXINZIMEI;
			}
			if (isZHISunm + cloneCards.ghostCount >= 5 || isZHISunm + cloneCards.ghostCount >= 6) {
				return gameProto.cardType.LIUXIN;
			}

		}

		return false;
	}
	/*
	 * 能否胡四小鸡
	 */
	canHuSiXiaoJi(cards, card, playType) {
		if (playType != gameProto.playType.FEIXIAOJI && playType != gameProto.playType.FEIBAIBAN) {
			return false;
		}
		let cloneCards = cards.slice();
		if (card != null && card != undefined) {
			cloneCards.push(card);
		}
		//手牌 排序
		cloneCards.sort((a, b) => {
			return a - b;
		});

		let count = this.getHongZhongCount(cloneCards, playType);
		if (count >= 4 && playType == gameProto.playType.FEIXIAOJI) {
			return gameProto.cardType.SIXIAOJI;
		}
		if (count >= 4 && playType == gameProto.playType.FEIBAIBAN) {
			return gameProto.cardType.SIGUI;
		}
		return false;
	}
	/*
	 * 能否胡八鬼
	 */
	canHuBaGui(chairID, cards, card, operateRecord, playType) {
		if (playType != gameProto.playType.FEISHUANGGUI) {
			return false;
		}
		//获取已经操作过的所有牌 
		for (let i = 0; i < operateRecord.length; i++) {
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.PENG) {
				/* 碰 */
				return false;
			}
			if (operateRecord[i].chairID == chairID && (operateRecord[i].operate == gameProto.operateType.GANG_CHI /* 吃杠 */ ||
				operateRecord[i].operate == gameProto.operateType.GANG_BU /* 补杠 */ ||
				operateRecord[i].operate == gameProto.operateType.GANG_ZHI)) {
				/* 自摸杠 */
				return false;
			}
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.CHI) {
				/* 吃牌 */
				return false;
			}
		}
		let cloneCards = cards.slice();
		if (card != null && card != undefined) {
			cloneCards.push(card);
		}
		//手牌 排序
		cloneCards.sort((a, b) => {
			return a - b;
		});

		let count = this.getHongZhongCount(cloneCards, playType, true);
		if (count >= 8) {
			return gameProto.cardType.BAGUI;
		}
		return false;
	}

	/*
	 * 获取癞子的个数
	 */
	getHongZhongCount(cards, playeType, fen = false) {
		let count = 0;
		for (let i = 0; i < cards.length; ++i) {
			if (fen == false) {
				//小鸡癞子
				if (playeType == gameProto.playType.FEIXIAOJI) {
					if (cards[i] == CARDID.CARDID_TIAO1) {
						++count;
					}
				} else if (playeType == gameProto.playType.FEIBAIBAN) //白板癞子
				{
					if (cards[i] == CARDID.CARDID_BAI) {
						++count;
					}
				}
			} else {
				if (playeType == gameProto.playType.FEISHUANGGUI) //白板+红中 8癞子
				{
					if (cards[i] == CARDID.CARDID_BAI) {
						++count;
					}
					if (cards[i] == CARDID.CARDID_ZHONG) {
						++count;
					}
				}
			}
		}
		return count;
	}

	/*
	 * 获取牌的个数
	 */
	getCardCount(cards, card) {
		let count = 0;
		for (let i = 0; i < cards.length; ++i) {
			if (cards[i] == card) {
				++count;
			}
		}
		return count;
	}

	/*
	 * 获取剩余的牌数
	 */
	getRestCardsCount() {
		return this.cards.length;
	}

	/*
	 * 由名字转成手牌
	 * @param names Array 名字
	 * @return Array
	 */
	getCardsByNames(names) {
		let NAMES = [
			'', '1筒', '2筒', '3筒', '4筒', '5筒', '6筒', '7筒', '8筒', '9筒',
			'', '1条', '2条', '3条', '4条', '5条', '6条', '7条', '8条', '9条',
			'', '1万', '2万', '3万', '4万', '5万', '6万', '7万', '8万', '9万',
			'', '东风', '南风', '西风', '北风', '红中', '发财', '白板'
		];
		let array = [];
		for (let name of names) {
			array.push(NAMES.indexOf(name));
		}
		return array;
	}

	/**
	 * 获取玩家所有马牌
	 * @param bankerChairID Number 庄家id
	 * @return Array
	 */
	getMaCardsByChairID() {
		return [CARDID.CARDID_WAN1, CARDID.CARDID_WAN5, CARDID.CARDID_WAN9, CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO9, CARDID.CARDID_TONG1, CARDID.CARDID_TONG5, CARDID.CARDID_TONG9, CARDID.CARDID_ZHONG];
	}

	getRestCards() {
		return this.cards;
	}

	getCard(card) {
		let index = this.cards.indexOf(card);
		if (index == -1) {
			return null;
		} else {
			this.cards.splice(index, 1);
			return card;
		}
	}

	//通过胡牌类型 返回番数
	getCanHuresidue(type, card = 0) {
		let maxRate = 0;
		this.gameRule = FXJModel.getGameRule()
		if (this.gameRule.maxRate == 0) {
			maxRate = 5;
		} else {
			maxRate = this.gameRule.maxRate;
		}

		if (type == gameProto.cardType.PINGHU) {
			return 0;
		} else if (type == gameProto.cardType.DADUIZI) {
			return 1;
		} else if (type == gameProto.cardType.HUNYISE) {
			return 1;
		} else if (type == gameProto.cardType.HUNDADUI) {
			return 2;
		} else if (type == gameProto.cardType.QINGYISE) {
			return 2;
		} else if (type == gameProto.cardType.QIDUI) {
			return 2;
		} else if (type == gameProto.cardType.QINGQIDUI) {
			return 3;
		} else if (type == gameProto.cardType.QINGDADUI) {
			return 3;
		} else if (type == gameProto.cardType.LONGBEIZHUA) {
			return 3;
		} else if (type == gameProto.cardType.HUNSANYUAN) {
			return 3;
		} else if (type == gameProto.cardType.SHIFEN) {
			return 3;
		} else if (type == gameProto.cardType.SHISANYAO) {
			return 3;
		} else if (type == gameProto.cardType.DASANYUAN) {
			return 2;
		} else if (type == gameProto.cardType.DASIXI) {
			return 3;
		} else if (type == gameProto.cardType.SIXIAOJI) {
			//四小鸡 顶番
			return 3;
		} else if (type == gameProto.cardType.SIGUI) {
			//四鬼 顶番
			return 3;
		} else if (type == gameProto.cardType.LIUXIN) {
			return 1;
		} else if (type == gameProto.cardType.QIXIN) {
			return 3;
		} else if (type == gameProto.cardType.QIXINLAIZLAN) {
			return 1;
		} else if (type == gameProto.cardType.LIUXINZIMEI) {
			return 2;
		} else if (type == gameProto.cardType.QUANQIUREN) {

			if (card == null) {
				return 2;
			} else {
				return 3;
			}
		} else if (type == gameProto.cardType.MENQING) {
			return 1;
		} else if (type == gameProto.cardType.YITIAOLONG) {
			return 1;
		} else if (type == gameProto.cardType.FENGYISE) {
			return 3;
		} else if (type == gameProto.cardType.BAGUI) {
			//八鬼 顶番
			return 3;
		} else if (type == gameProto.cardType.WULAI) {
			return 1;
		} else if (type == gameProto.cardType.SHOUTISHISANYAO) {
			if (card == null) {
				return 2;
			} else {
				return this.gameRule.shiSanYaoDianPao / 2;
			}
		}
	}
	//取牌先后顺序 三张 顺子 两张
	Shun_1(cloneCards, lengths, tmpData, card) {
		let length = lengths;
		let HuCombination = [];
		//计算牌型
		for (let i = 0; i < cloneCards.cards.length; i++) {
			for (let j = 0; j < cloneCards.cards[i].length; j++) {
				if (cloneCards.cards[i][j] == 0) continue;
				//三张牌
				if (cloneCards.cards[i][j] >= 3) {
					length -= 3;
					cloneCards.cards[i][j] -= 3;
					let Cards_1 = i * 10 + (j + 1);
					HuCombination.push({
						type: 1,
						list: [Cards_1, Cards_1, Cards_1]
					});
					if (card == Cards_1) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_1]
						});
					}
				}
				//判断顺子
				let T_1 = cloneCards.cards[i][j];
				T_1 = T_1 ? T_1 : 0;
				let T_2 = cloneCards.cards[i][j + 1];
				T_2 = T_2 ? T_2 : 0;
				let T_3 = cloneCards.cards[i][j + 2];
				T_3 = T_3 ? T_3 : 0;
				//三张牌 连一起为顺子 
				if (i != 3 && T_1 >= 1 && T_2 >= 1 && T_3 >= 1) {
					//提出牌
					cloneCards.cards[i][j]--;
					cloneCards.cards[i][j + 1]--;
					cloneCards.cards[i][j + 2]--;
					length -= 3;


					let Cards_1 = i * 10 + (j + 1);
					let Cards_2 = i * 10 + (j + 2);
					let Cards_3 = i * 10 + (j + 3);
					HuCombination.push({
						type: 1,
						list: [Cards_1, Cards_2, Cards_3]
					});
					if (card == Cards_1) {
						HuCombination.push({
							type: 2,
							list: [Cards_2, Cards_3]
						});
					} else if (card == Cards_2) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_3]
						});
					} else if (card == Cards_3) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_2]
						});
					}
					j--;
					continue;
				} else if (i != 3 && T_1 >= 1 && T_2 >= 1 && T_3 <= 0) {
					//两张牌 连一起 第三张没有连 如果有癞子替换一个 变为顺子 
					//没有癞子
					if (cloneCards.ghostCount <= 0) {
						return {
							not: false,
							ghost: cloneCards.ghostCount,
							length: lengths
						};
					}
					//提出牌
					cloneCards.cards[i][j]--;
					cloneCards.cards[i][j + 1]--;
					//如果有癞子 替换一个
					cloneCards.ghostCount--;
					length -= 3;

					let Cards_1 = i * 10 + (j + 1);
					let Cards_2 = i * 10 + (j + 2);
					let Cards_3 = null;
					if (j + 1 == 8) {
						Cards_3 = i * 10 + j;
						HuCombination.push({
							type: 1,
							list: [Cards_3, Cards_1, Cards_2]
						});
					} else {
						Cards_3 = i * 10 + (j + 3);
						HuCombination.push({
							type: 1,
							list: [Cards_1, Cards_2, Cards_3]
						});
					}

					if (card == Cards_1) {
						HuCombination.push({
							type: 2,
							list: [Cards_2, Cards_3]
						});
					} else if (card == Cards_2) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_3]
						});
					} else if (card == Cards_3) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_2]
						});
					} else if (card == 38) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_2]
						});
					}
					j--;
					continue;
				} else if (i != 3 && T_1 >= 1 && T_2 <= 0 && T_3 >= 1) {
					//第一张和第三张两张牌 连一起 第二张张没有连 如果有癞子替换一个 变为顺子 
					//没有癞子
					if (cloneCards.ghostCount <= 0) {
						return {
							not: false,
							ghost: cloneCards.ghostCount,
							length: lengths
						};
					}
					//提出牌
					cloneCards.cards[i][j]--;
					cloneCards.cards[i][j + 2]--;
					//如果有癞子 替换一个
					cloneCards.ghostCount--;
					length -= 3;

					let Cards_1 = i * 10 + (j + 1);
					let Cards_2 = i * 10 + (j + 2);
					let Cards_3 = i * 10 + (j + 3);
					HuCombination.push({
						type: 1,
						list: [Cards_1, Cards_2, Cards_3]
					});
					if (card == Cards_1) {
						HuCombination.push({
							type: 2,
							list: [Cards_2, Cards_3]
						});
					} else if (card == Cards_2) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_3]
						});
					} else if (card == Cards_3) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_2]
						});
					} else if (card == 38) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_3]
						});
					}
					j--;
					continue;
				}
				//两张牌
				if (cloneCards.cards[i][j] == 2) {
					//已有将对且没有癞子
					if (tmpData == true && cloneCards.ghostCount <= 0) {
						return {
							not: false,
							ghost: cloneCards.ghostCount,
							length: lengths
						};
					} else {
						//如果有癞子 替换一个组合为3张牌
						cloneCards.ghostCount--;
						cloneCards.cards[i][j] -= 2;
						length -= 3;
						let Cards_1 = i * 10 + (j + 1);
						HuCombination.push({
							type: 1,
							list: [Cards_1, Cards_1, Cards_1]
						});
						if (card == Cards_1) {
							HuCombination.push({
								type: 2,
								list: [Cards_1, Cards_1]
							});
						} else if (card == 38) {
							HuCombination.push({
								type: 2,
								list: [Cards_1, Cards_1]
							});
						}
					}
				}
				//只有一张牌
				if (cloneCards.cards[i][j] == 1) {
					//如果有两张癞子 将其替换为顺子
					if (cloneCards.ghostCount >= 2) {
						cloneCards.ghostCount -= 2;
						cloneCards.cards[i][j]--;
						length -= 3;

						let Cards_1 = i * 10 + (j + 1);
						let Cards_2 = i * 10 + (j + 2);
						let Cards_3 = i * 10 + (j + 3);
						HuCombination.push({
							type: 1,
							list: [Cards_1, Cards_2, Cards_3]
						});
						if (card == Cards_1) {
							HuCombination.push({
								type: 2,
								list: [Cards_2, Cards_3]
							});
						} else if (card == 38) {
							HuCombination.push({
								type: 2,
								list: [Cards_2, Cards_3]
							});
						}
					} else {
						return {
							not: false,
							ghost: cloneCards.ghostCount,
							length: lengths
						};
					}
				}
			}
		}
		return {
			not: true,
			ghost: cloneCards.ghostCount,
			length: length,
			HuCombination: HuCombination
		};
	}
	//取牌先后顺序 顺子 三张 两张
	Shun_2(cloneCards, lengths, tmpData, card) {
		let length = lengths;
		let HuCombination = [];
		//计算牌型
		for (let i = 0; i < cloneCards.cards.length; i++) {
			for (let j = 0; j < cloneCards.cards[i].length; j++) {
				if (cloneCards.cards[i][j] == 0) continue;
				//判断顺子
				let T_1 = cloneCards.cards[i][j];
				T_1 = T_1 ? T_1 : 0;
				let T_2 = cloneCards.cards[i][j + 1];
				T_2 = T_2 ? T_2 : 0;
				let T_3 = cloneCards.cards[i][j + 2];
				T_3 = T_3 ? T_3 : 0;
				//三张牌 连一起为顺子 
				if (i != 3 && T_1 >= 1 && T_2 >= 1 && T_3 >= 1) {
					//提出牌
					cloneCards.cards[i][j]--;
					cloneCards.cards[i][j + 1]--;
					cloneCards.cards[i][j + 2]--;
					length -= 3;

					let Cards_1 = i * 10 + (j + 1);
					let Cards_2 = i * 10 + (j + 2);
					let Cards_3 = i * 10 + (j + 3);
					HuCombination.push({
						type: 1,
						list: [Cards_1, Cards_2, Cards_3]
					});
					if (card == Cards_1) {
						HuCombination.push({
							type: 2,
							list: [Cards_2, Cards_3]
						});
					} else if (card == Cards_2) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_3]
						});
					} else if (card == Cards_3) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_2]
						});
					}
					j--;
					continue;
				} else if (i != 3 && T_1 >= 1 && T_2 >= 1 && T_3 <= 0) {
					//两张牌 连一起 第三张没有连 如果有癞子替换一个 变为顺子 
					//没有癞子
					if (cloneCards.ghostCount <= 0) {
						return {
							not: false,
							ghost: cloneCards.ghostCount,
							length: lengths
						};
					}
					//提出牌
					cloneCards.cards[i][j]--;
					cloneCards.cards[i][j + 1]--;
					//如果有癞子 替换一个
					cloneCards.ghostCount--;
					length -= 3;

					let Cards_1 = i * 10 + (j + 1);
					let Cards_2 = i * 10 + (j + 2);
					let Cards_3 = null;
					if (j + 1 == 8) {
						Cards_3 = i * 10 + j;
						HuCombination.push({
							type: 1,
							list: [Cards_3, Cards_1, Cards_2]
						});
					} else {
						Cards_3 = i * 10 + (j + 3);
						HuCombination.push({
							type: 1,
							list: [Cards_1, Cards_2, Cards_3]
						});
					}

					if (card == Cards_1) {
						HuCombination.push({
							type: 2,
							list: [Cards_2, Cards_3]
						});
					} else if (card == Cards_2) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_3]
						});
					} else if (card == Cards_3) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_2]
						});
					} else if (card == 38) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_2]
						});
					}
					j--;
					continue;
				} else if (i != 3 && T_1 >= 1 && T_2 <= 0 && T_3 >= 1) {
					//第一张和第三张两张牌 连一起 第二张张没有连 如果有癞子替换一个 变为顺子 
					//没有癞子
					if (cloneCards.ghostCount <= 0) {
						return {
							not: false,
							ghost: cloneCards.ghostCount,
							length: lengths
						};
					}
					//提出牌
					cloneCards.cards[i][j]--;
					cloneCards.cards[i][j + 2]--;
					//如果有癞子 替换一个
					cloneCards.ghostCount--;
					length -= 3;

					let Cards_1 = i * 10 + (j + 1);
					let Cards_2 = i * 10 + (j + 2);
					let Cards_3 = i * 10 + (j + 3);
					HuCombination.push({
						type: 1,
						list: [Cards_1, Cards_2, Cards_3]
					});
					if (card == Cards_1) {
						HuCombination.push({
							type: 2,
							list: [Cards_2, Cards_3]
						});
					} else if (card == Cards_2) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_3]
						});
					} else if (card == Cards_3) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_2]
						});
					} else if (card == 38) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_3]
						});
					}
					j--;
					continue;
				}
				//三张牌
				if (cloneCards.cards[i][j] >= 3) {
					length -= 3;
					cloneCards.cards[i][j] -= 3;
					let Cards_1 = i * 10 + (j + 1);
					HuCombination.push({
						type: 1,
						list: [Cards_1, Cards_1, Cards_1]
					});
					if (card == Cards_1) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_1]
						});
					}
				}
				//两张牌
				if (cloneCards.cards[i][j] == 2) {
					//已有将对且没有癞子
					if (tmpData == true && cloneCards.ghostCount <= 0) {
						return {
							not: false,
							ghost: cloneCards.ghostCount,
							length: lengths
						};
					} else {
						//如果有癞子 替换一个组合为3张牌
						cloneCards.ghostCount--;
						cloneCards.cards[i][j] -= 2;
						length -= 3;

						let Cards_1 = i * 10 + (j + 1);
						HuCombination.push({
							type: 1,
							list: [Cards_1, Cards_1, Cards_1]
						});
						if (card == Cards_1) {
							HuCombination.push({
								type: 2,
								list: [Cards_1, Cards_1]
							});
						} else if (card == 38) {
							HuCombination.push({
								type: 2,
								list: [Cards_1, Cards_1]
							});
						}
					}
				}
				//只有一张牌
				if (cloneCards.cards[i][j] == 1) {
					//如果有两张癞子 将其替换为顺子
					if (cloneCards.ghostCount >= 2) {
						cloneCards.ghostCount -= 2;
						cloneCards.cards[i][j]--;
						length -= 3;

						let Cards_1 = i * 10 + (j + 1);
						let Cards_2 = i * 10 + (j + 2);
						let Cards_3 = i * 10 + (j + 3);
						HuCombination.push({
							type: 1,
							list: [Cards_1, Cards_2, Cards_3]
						});
						if (card == Cards_1) {
							HuCombination.push({
								type: 2,
								list: [Cards_2, Cards_3]
							});
						} else if (card == 38) {
							HuCombination.push({
								type: 2,
								list: [Cards_2, Cards_3]
							});
						}
					} else {
						return {
							not: false,
							ghost: cloneCards.ghostCount,
							length: lengths
						};
					}
				}
			}
		}
		return {
			not: true,
			ghost: cloneCards.ghostCount,
			length: length,
			HuCombination: HuCombination
		};
	}
	//取牌先后顺序  三张 两张 顺子
	Shun_3(cloneCards, lengths, tmpData, card) {
		let length = lengths;
		let HuCombination = [];
		//计算牌型
		for (let i = 0; i < cloneCards.cards.length; i++) {
			for (let j = 0; j < cloneCards.cards[i].length; j++) {
				if (cloneCards.cards[i][j] == 0) continue;
				//三张牌
				if (cloneCards.cards[i][j] >= 3) {
					length -= 3;
					cloneCards.cards[i][j] -= 3;

					let Cards_1 = i * 10 + (j + 1);
					HuCombination.push({
						type: 1,
						list: [Cards_1, Cards_1, Cards_1]
					});
					if (card == Cards_1) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_1]
						});
					}
				}
				//两张牌
				if (cloneCards.cards[i][j] == 2) {
					//已有将对且没有癞子
					if (tmpData == true && cloneCards.ghostCount <= 0) {
						return {
							not: false,
							ghost: cloneCards.ghostCount,
							length: lengths
						};
					} else {
						//如果有癞子 替换一个组合为3张牌
						cloneCards.ghostCount--;
						cloneCards.cards[i][j] -= 2;
						length -= 3;

						let Cards_1 = i * 10 + (j + 1);
						HuCombination.push({
							type: 1,
							list: [Cards_1, Cards_1, Cards_1]
						});
						if (card == Cards_1) {
							HuCombination.push({
								type: 2,
								list: [Cards_1, Cards_1]
							});
						} else if (card == 38) {
							HuCombination.push({
								type: 2,
								list: [Cards_1, Cards_1]
							});
						}
					}
				}
				//判断顺子
				let T_1 = cloneCards.cards[i][j];
				T_1 = T_1 ? T_1 : 0;
				let T_2 = cloneCards.cards[i][j + 1];
				T_2 = T_2 ? T_2 : 0;
				let T_3 = cloneCards.cards[i][j + 2];
				T_3 = T_3 ? T_3 : 0;
				//三张牌 连一起为顺子 
				if (i != 3 && T_1 >= 1 && T_2 >= 1 && T_3 >= 1) {
					//提出牌
					cloneCards.cards[i][j]--;
					cloneCards.cards[i][j + 1]--;
					cloneCards.cards[i][j + 2]--;
					length -= 3;


					let Cards_1 = i * 10 + (j + 1);
					let Cards_2 = i * 10 + (j + 2);
					let Cards_3 = i * 10 + (j + 3);
					HuCombination.push({
						type: 1,
						list: [Cards_1, Cards_2, Cards_3]
					});
					if (card == Cards_1) {
						HuCombination.push({
							type: 2,
							list: [Cards_2, Cards_3]
						});
					} else if (card == Cards_2) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_3]
						});
					} else if (card == Cards_3) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_2]
						});
					}
					j--;
					continue;
				} else if (i != 3 && T_1 >= 1 && T_2 >= 1 && T_3 <= 0) {
					//两张牌 连一起 第三张没有连 如果有癞子替换一个 变为顺子 
					//没有癞子
					if (cloneCards.ghostCount <= 0) {
						return {
							not: false,
							ghost: cloneCards.ghostCount,
							length: lengths
						};
					}
					//提出牌
					cloneCards.cards[i][j]--;
					cloneCards.cards[i][j + 1]--;
					//如果有癞子 替换一个
					cloneCards.ghostCount--;
					length -= 3;


					let Cards_1 = i * 10 + (j + 1);
					let Cards_2 = i * 10 + (j + 2);
					let Cards_3 = null;
					if (j + 1 == 8) {
						Cards_3 = i * 10 + j;
						HuCombination.push({
							type: 1,
							list: [Cards_3, Cards_1, Cards_2]
						});
					} else {
						Cards_3 = i * 10 + (j + 3);
						HuCombination.push({
							type: 1,
							list: [Cards_1, Cards_2, Cards_3]
						});
					}
					if (card == Cards_1) {
						HuCombination.push({
							type: 2,
							list: [Cards_2, Cards_3]
						});
					} else if (card == Cards_2) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_3]
						});
					} else if (card == Cards_3) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_2]
						});
					} else if (card == 38) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_2]
						});
					}
					j--;
					continue;
				} else if (i != 3 && T_1 >= 1 && T_2 <= 0 && T_3 >= 1) {
					//第一张和第三张两张牌 连一起 第二张张没有连 如果有癞子替换一个 变为顺子 
					//没有癞子
					if (cloneCards.ghostCount <= 0) {
						return {
							not: false,
							ghost: cloneCards.ghostCount,
							length: lengths
						};
					}
					//提出牌
					cloneCards.cards[i][j]--;
					cloneCards.cards[i][j + 2]--;
					//如果有癞子 替换一个
					cloneCards.ghostCount--;
					length -= 3;


					let Cards_1 = i * 10 + (j + 1);
					let Cards_2 = i * 10 + (j + 2);
					let Cards_3 = i * 10 + (j + 3);
					HuCombination.push({
						type: 1,
						list: [Cards_1, Cards_2, Cards_3]
					});
					if (card == Cards_1) {
						HuCombination.push({
							type: 2,
							list: [Cards_2, Cards_3]
						});
					} else if (card == Cards_2) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_3]
						});
					} else if (card == Cards_3) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_2]
						});
					} else if (card == 38) {
						HuCombination.push({
							type: 2,
							list: [Cards_1, Cards_3]
						});
					}
					j--;
					continue;
				}
				//只有一张牌
				if (cloneCards.cards[i][j] == 1) {
					//如果有两张癞子 将其替换为顺子
					if (cloneCards.ghostCount >= 2) {
						cloneCards.ghostCount -= 2;
						cloneCards.cards[i][j]--;
						length -= 3;

						let Cards_1 = i * 10 + (j + 1);
						let Cards_2 = i * 10 + (j + 2);
						let Cards_3 = i * 10 + (j + 3);
						HuCombination.push({
							type: 1,
							list: [Cards_1, Cards_2, Cards_3]
						});
						if (card == Cards_1) {
							HuCombination.push({
								type: 2,
								list: [Cards_2, Cards_3]
							});
						} else if (card == 38) {
							HuCombination.push({
								type: 2,
								list: [Cards_2, Cards_3]
							});
						}
					} else {
						return {
							not: false,
							ghost: cloneCards.ghostCount,
							length: lengths
						};
					}
				}
			}
		}
		return {
			not: true,
			ghost: cloneCards.ghostCount,
			length: length,
			HuCombination: HuCombination
		};
	}
}

let instance = null;
module.exports = (() => {
	if (instance == null) {
		instance = new GameLogic();
	}
	return instance;
})();