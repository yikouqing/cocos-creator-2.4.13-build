/*
 * 麻将算法
 */
const gameProto = require('./ApiXz');
const XZModel = require('./XZModel');

let yaojiu_list;
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
    CARDID_LAI: 38,

};

class GameLogic {
    init(gameRule) {
        this.cards = [];
        this.gameRule = gameRule;
    }

    getgameRule() {
        return this.gameRule;
    }
    /*
     * 洗牌
     */
    washCards(roomType, addLaiZi) {

        if (roomType == gameProto.roomType.ONE) {
            //一房只有万字
            this.cards = [
                CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9,
                CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9,
                CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9,
                CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9
            ];
        } else if (roomType == gameProto.roomType.TWO) {

            //两房缺万字
            this.cards = [
                CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,
                CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,
                CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,
                CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,

                CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,
                CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,
                CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,
                CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9
            ];
        } else {
            //默认所有牌
            this.cards = [
                CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,
                CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,
                CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,
                CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,

                CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,
                CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,
                CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,
                CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,

                CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9,
                CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9,
                CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9,
                CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9
            ];
        }

        //癞子玩法
        if (addLaiZi) {
            this.cards.push(CARDID.CARDID_LAI, CARDID.CARDID_LAI, CARDID.CARDID_LAI, CARDID.CARDID_LAI);
        }

		for (let i = 0; i < 300; ++i) {
			let index = i % this.cards.length;
			let random1 = Math.floor(Math.random() * this.cards.length);
			let tmp = this.cards[index];
			this.cards[index] = this.cards[random1];
			this.cards[random1] = tmp;
		}
	}
	getAllCardList(roomType, addLaiZi) {
		let cards = [];
		if (roomType == gameProto.roomType.ONE) {
			//一房只有万字
			cards = [
				CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9,
				CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9,
				CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9,
				CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9
			];
		} else if (roomType == gameProto.roomType.TWO) {

			//两房缺万字
			cards = [
				CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,
				CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,
				CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,
				CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,

				CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,
				CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,
				CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,
				CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9
			];
		} else {
			//默认所有牌
			cards = [
				CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,
				CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,
				CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,
				CARDID.CARDID_TONG1, CARDID.CARDID_TONG2, CARDID.CARDID_TONG3, CARDID.CARDID_TONG4, CARDID.CARDID_TONG5, CARDID.CARDID_TONG6, CARDID.CARDID_TONG7, CARDID.CARDID_TONG8, CARDID.CARDID_TONG9,

				CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,
				CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,
				CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,
				CARDID.CARDID_TIAO1, CARDID.CARDID_TIAO2, CARDID.CARDID_TIAO3, CARDID.CARDID_TIAO4, CARDID.CARDID_TIAO5, CARDID.CARDID_TIAO6, CARDID.CARDID_TIAO7, CARDID.CARDID_TIAO8, CARDID.CARDID_TIAO9,

				CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9,
				CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9,
				CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9,
				CARDID.CARDID_WAN1, CARDID.CARDID_WAN2, CARDID.CARDID_WAN3, CARDID.CARDID_WAN4, CARDID.CARDID_WAN5, CARDID.CARDID_WAN6, CARDID.CARDID_WAN7, CARDID.CARDID_WAN8, CARDID.CARDID_WAN9
			];
		}

		//癞子玩法
		if (addLaiZi) {
			cards.push(CARDID.CARDID_LAI, CARDID.CARDID_LAI, CARDID.CARDID_LAI, CARDID.CARDID_LAI);
		}
		return cards;
	}
	/*
	 * 获取已经操作过的所有牌+手牌 
	 */
	getOperateRecordCard(chairID, cards, card, operateRecord) {
		let End = cards.slice();
		if (card != null && card != undefined) {
			End.push(card);
		}
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
				//碰牌 放入三张
				End.push(operateRecord[i].card);
				End.push(operateRecord[i].card);
				End.push(operateRecord[i].card);
			} else if (operateRecord[i].chairID == chairID && (operateRecord[i].operate == gameProto.operateType.GANG_CHI /* 吃杠 */ ||
					operateRecord[i].operate == gameProto.operateType.GANG_BU /* 补杠 */ ||
					operateRecord[i].operate == gameProto.operateType.GANG_ZHI)) {
				/* 自摸杠 */
				//杠牌 放入四张
				End.push(operateRecord[i].plusInfo.cardList[0]);
				End.push(operateRecord[i].plusInfo.cardList[1]);
				End.push(operateRecord[i].plusInfo.cardList[2]);
				End.push(operateRecord[i].plusInfo.cardList[3]);
			} else if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.CHI) {
				/* 吃牌 */
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

	//获取另加蕃
	getPlusRateType(chairID, userCards, card, operateRecord, type, bankerChairID, HU_ZHI_sun = false, Cha_Jiao = false) {

		//手牌 排序
		userCards.sort((a, b) => {
			return a - b;
		});
		//判断根加蕃
		let plusRateList = [];
		let userGangList = operateRecord.filter(item => {
			return item.chairID == chairID && ([gameProto.operateType.GANG_BU, gameProto.operateType.GANG_CHI, gameProto.operateType.GANG_ZHI].includes(item.operate))
		});
		let pengList = operateRecord.filter(item => item.chairID == chairID && (item.operate == gameProto.operateType.PENG));
		let HuCombination = this.HuCombination(userCards, card, operateRecord, chairID);
		//判断根
		if (type != gameProto.cardType.QIDUI && type != gameProto.cardType.LONGBEIZHUA &&
			type != gameProto.cardType.QINGQIDUI && type != gameProto.cardType.QINGLONGQIDUI) {

			let cards = userCards.slice();
			cards.push(card);
			let cardCountObj = {};
			for (let i = 0; i < cards.length; i++) {
				if (!cardCountObj[cards[i]]) {
					cardCountObj[cards[i]] = 0;
				}
				cardCountObj[cards[i]] += 1;
			}
			let handGang = 0;
			//let pengGen=[];
			for (let card in cardCountObj) {
				card = parseInt(card);
				let cardCount = cardCountObj[card];
				if (cardCount == 4) {
					handGang += 1;
				}
				//判断是否胡的牌是否有杠
				if (pengList.find(item => item.card == card)) {
					handGang += 1;
				}
			}

			//判断是否胡的牌是否有杠
			//let pengGen = pengList.filter(item => item.card == card);
			//let allCount = handGang + userGangList.length + pengGen.length;
			let allCount = handGang + userGangList.length;
			if (allCount > 0) {
				//几根加几番
				plusRateList.push({
					type: gameProto.plusRateType.GEN,
					rate: allCount
				});
			}
		}

		//一条龙 1蕃
		{
			if (this.gameRule.yiTiaoLong) {
				if (this.getYiTiaoLong(HuCombination)) {
					plusRateList.push({
						type: gameProto.plusRateType.YITIAOLONG,
						rate: 2
					});
				}

			}
		}
		//查叫不算
		//海底捞 1蕃
		{
			if (Cha_Jiao == false) {
				let restCardsCount = this.getRestCardsCount();
				if (restCardsCount == 0) {
					plusRateList.push({
						type: gameProto.plusRateType.HAIDILAO,
						rate: 1
					});
				}

			}
		}

		//卡二条
		{
			if (this.gameRule.kaErTiao && card == CARDID.CARDID_TIAO2) {
				for (let i = 0; i < HuCombination.length; i++) {
					if (HuCombination[i].type == 2 && HuCombination[i].list[0] == CARDID.CARDID_TIAO1 && HuCombination[i].list[1] == CARDID.CARDID_TIAO3) {
						plusRateList.push({
							type: gameProto.plusRateType.KAERTIAO,
							rate: 1
						});
					}
				}
			}
		}
		//夹心五
		{
			if (type != gameProto.cardType.QIDUI && type != gameProto.cardType.LONGBEIZHUA &&
				type != gameProto.cardType.QINGQIDUI && type != gameProto.cardType.QINGLONGQIDUI) {
				if (this.gameRule.jiaXinWu && card % 10 == 5) {
					for (let i = 0; i < HuCombination.length; i++) {
						if (HuCombination[i].type == 2 && HuCombination[i].list[0] % 10 == 4 && HuCombination[i].list[1] % 10 == 6) {
							plusRateList.push({
								type: gameProto.plusRateType.JIAXINGWU,
								rate: 1
							});
							break;
						}
					}
				}
			}
		}
		//全幺九
		{
			if (type != gameProto.cardType.QIDUI && type != gameProto.cardType.LONGBEIZHUA &&
				type != gameProto.cardType.QINGQIDUI && type != gameProto.cardType.QINGLONGQIDUI) {
				let YaoJiucars = true;
				yaojiu_list = true;
				HuCombination = this.HuCombination(userCards, card, operateRecord, chairID);
				for (let i = 0; i < HuCombination.length; i++) {
					if (HuCombination[i].type == 2) continue;
					let yaojiu_1 = HuCombination[i].list[0] % 10;
					let yaojiu_2 = HuCombination[i].list[HuCombination[i].list.length - 1] % 10;
					if (yaojiu_1 != 1 && yaojiu_1 != 9 && yaojiu_2 != 1 && yaojiu_2 != 9) {
						YaoJiucars = false;
					}
				}
				if (YaoJiucars != false && HuCombination) {
					plusRateList.push({
						type: gameProto.plusRateType.QUANYAOJIU,
						rate: 3
					});
				}
				yaojiu_list = false;
			}

		}
		//中张 1蕃
		{
			if (this.gameRule.menQingZhongZhang) {
				let haveGang19 = userGangList.find(item => ((item.card % 10) == 1) || ((item.card % 10) == 9));
				let havePeng19 = pengList.find(item => ((item.card % 10) == 1) || ((item.card % 10) == 9));
				let isHaveOnNine = true;
				let HuCombination_zhong = this.HuCombination(userCards, card, operateRecord, chairID);
				for (let i = 0; i < HuCombination_zhong.length; i++) {
					if (HuCombination_zhong[i].type == 2) continue;
					let isHaveOnNine_1 = HuCombination_zhong[i].list[0] % 10;
					let isHaveOnNine_2 = HuCombination_zhong[i].list[HuCombination_zhong[i].list.length - 1] % 10;
					if (isHaveOnNine_1 == 1 || isHaveOnNine_1 == 9 || isHaveOnNine_2 == 1 || isHaveOnNine_2 == 9) {
						isHaveOnNine = false;
						break;
					}
				}
				if (isHaveOnNine) {
					let cards = userCards.slice();
					cards.push(card);
					for (let i = 0; i < cards.length; i++) {
						if (cards[i] % 10 == 1 || cards[i] % 10 == 9) {
							isHaveOnNine = false;
							break;
						}
					}
				}
				if (!haveGang19 && !havePeng19 && isHaveOnNine) {
					plusRateList.push({
						type: gameProto.plusRateType.ZHONGZHANG,
						rate: 1
					});
				}
			}
		}
		//门清 1蕃 没有碰 没有杠
		{
			if (this.gameRule.menQingZhongZhang) {
				let userGangLists = operateRecord.filter(item => {
					return item.chairID == chairID && ([gameProto.operateType.GANG_BU, gameProto.operateType.GANG_CHI].includes(item.operate))
				});
				let pengLists = operateRecord.filter(item => item.chairID == chairID && (item.operate == gameProto.operateType.PENG));
				if (pengLists.length + userGangLists.length == 0) {
					plusRateList.push({
						type: gameProto.plusRateType.MENQING,
						rate: 1
					});
				}
			}
		}

		//金钩钩 1蕃
		{
			let userCardCount = userCards;
			if (userCardCount.length == 1) {
				plusRateList.push({
					type: gameProto.plusRateType.JINGOUGOU,
					rate: 1
				});
			}
		}
		//查叫不算
		//绝张
		{
			if (Cha_Jiao == false) {
				if (this.gameRule.jueZhangDouble) {
					let cardata = [];
					cardata.push(card);
					let QICards = 0;
					//获取已经操作过的所有牌 
					for (let i = 0; i < operateRecord.length; ++i) {
						if (operateRecord[i].operate == gameProto.operateType.QI && cardata.indexOf(operateRecord[i].card) >= 0) {
							/* 弃牌 */
							QICards++;
						} else if (operateRecord[i].operate == gameProto.operateType.PENG && cardata.indexOf(operateRecord[i].card) >= 0) {
							/* 碰牌 */
							QICards += 3;
						}
					}
					if (HU_ZHI_sun == true) {
						if ((4 - QICards) <= 1) {
							plusRateList.push({
								type: gameProto.plusRateType.JUEZHANG,
								rate: 1
							});
						}
					} else {
						if ((4 - QICards) <= 0) {
							plusRateList.push({
								type: gameProto.plusRateType.JUEZHANG,
								rate: 1
							});
						}
					}

				}
			}
		}
		if (this.gameRule.tianDiHu) {
			//天胡 
			let isHaveQi = operateRecord.find(item => item.operate == gameProto.operateType.QI);
			if (!isHaveQi && bankerChairID == chairID) {
				plusRateList.push({
					type: gameProto.plusRateType.TIANHU,
					rate: 3
				});
			}
			//地胡 当前胡牌的玩家没有打牌
			let userQiCount = operateRecord.filter(item => item.chairID == chairID && item.operate == gameProto.operateType.QI);
			if (userQiCount.length == 0 && bankerChairID != chairID) {
				plusRateList.push({
					type: gameProto.plusRateType.DIHU,
					rate: 2
				});
			}
		}
		if (this.gameRule.laiZiDouble) {
			let cards = userCards.slice();
			cards.push(card);
			let userCardNum = cards.filter(item => {
				return item == 38
			});
			if (userCardNum.length == 0) {
				plusRateList.push({
					type: gameProto.plusRateType.laiZiDouble,
					rate: 1
				});
			}
		}
		if (this.gameRule.duiDuiDouble) {
			if (type == gameProto.cardType.DADUIZI || type == gameProto.cardType.QINGDADUI || type == gameProto.cardType.JIANGDUI) {
				plusRateList.push({
					type: gameProto.plusRateType.duiDuiDouble,
					rate: 1
				});
			}
		}

		return plusRateList;
	}

	getYiTiaoLong(HuCombination) {
		let yiTiaoLong = [
			[],
			[],
			[]
		];
		for (let i = 0; i < HuCombination.length; i++) {
			//提出胡牌顺子 类型为1 胡牌长度为3
			if (HuCombination[i].type == 1 && HuCombination[i].list.length == 3) {
				//是顺子
				if (HuCombination[i].list[0] < HuCombination[i].list[1] && HuCombination[i].list[1] < HuCombination[i].list[2]) {
					let type = Math.floor(HuCombination[i].list[0] / 10);
					//长度大于0说明已有数据 判断最后一位数据
					if (yiTiaoLong[type].length > 0 && yiTiaoLong[type][yiTiaoLong[type].length - 1] + 1 == HuCombination[i].list[0]) {
						yiTiaoLong[type].push(HuCombination[i].list[0]);
						yiTiaoLong[type].push(HuCombination[i].list[1]);
						yiTiaoLong[type].push(HuCombination[i].list[2]);
					} else if (yiTiaoLong[type].length == 0) {
						yiTiaoLong[type].push(HuCombination[i].list[0]);
						yiTiaoLong[type].push(HuCombination[i].list[1]);
						yiTiaoLong[type].push(HuCombination[i].list[2]);
					}

					if (yiTiaoLong[type].length >= 9) {
						return true;
					}
				}
			}
		}
		return false;
	}

	/*
	 * 获取牌的花色
	 */
	getCardColor(card) {
		return Math.floor(card / 10);
	}

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
	getHuanSanZhuang(cards) {

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
		cardList = cardList.find(item => item.count >= 3);
		return cardList && cardList.list && cardList.list.slice(0, 3);

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


	/*
	 * 校验花色是否都是一样
	 * Color 0 正常校验 1不校验字牌 2校验到字牌踢出
	 */
	getCardColorArr(handCard, ghostList) {
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
			if (to_1 != to_2) {
				return false;
			}
		}
		return true;
	}

	/*
	 * 获取牌的数值
	 */
	getCardNumber(card) {
		return card % 9 + 1;
	}

	/*
	 * 获取牌的数值
	 */
	getCardNumberArr(handCard, ghostList, list = 0) {
		// 初始计数
		let cards = [
			[0, 0, 0, 0, 0, 0, 0, 0, 0], // 万
			[0, 0, 0, 0, 0, 0, 0, 0, 0], // 筒
			[0, 0, 0, 0, 0, 0, 0, 0, 0], // 条
		];
		// 鬼牌总数
		let ghostCount = 0;
		// 计数：统计各牌张数，鬼牌另计在ghostCount上
		for (let card of handCard) {
			if (ghostList.indexOf(card) >= 0 && list == 1) continue;
			if (!this.gameRule.addLaiZi && card == CARDID.CARDID_LAI) continue;
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
	 * 获取手牌能杠牌的数组
	 * chairID 玩家ID 
	 * handCard 手牌
	 * ghostList 鬼牌
	 * operateArray 操作数组
	 * lastCard 上家打出的牌
	 */
	gethandCardArr(chairID, handCard, operateRecord, ghostList, lastCard) {
		let cards = this.getCardNumberArr(handCard, ghostList);
		//获取已经操作过的碰牌 补杠
		for (let i = 0; i < operateRecord.length; ++i) {
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.PENG) {
				let rank = (operateRecord[i].card % 10 - 1);
				let type = Math.floor(operateRecord[i].card / 10);
				cards.cards[type][rank] += 3;
			}
		}
		//用于记录能杠牌 
		let GangArray = [];
		// 牌组转换后 鬼牌数量加上 当前拥有的牌数量 如果等于或大于4 则可以杠
		for (let i = 0; i < cards.cards.length; i++) {
			for (let j = 0; j < cards.cards[i].length; j++) {
				//计算牌值
				let card = i * 10 + (j + 1);
				//手牌 +鬼牌
				if (lastCard == card && cards.cards[i][j] + cards.ghostCount >= 4) {
					if (cards.cards[i][j] >= 2 && cards.ghostCount >= 2) { //两张牌+鬼牌 能组合为4张
						//放入三张牌值 + 鬼牌一张 
						GangArray.push([card, card, ghostList[0], ghostList[0]]);
					}
					if (cards.cards[i][j] >= 3 && cards.ghostCount >= 1) //三张牌+1张鬼牌 能组合为4张
					{
						//放入牌值 + 鬼牌 
						GangArray.push([card, card, card, ghostList[0]]);
					}
					if (cards.cards[i][j] == 4) //四张牌
					{
						//放入牌值 
						GangArray.push([card, card, card, card]);
					}

				}
			}
		}
		return GangArray;
	}
	/*
	 * 获取可操作列表
	 * @param cards Array 自己手牌列表
	 * @param outCard Number 上家出的牌
	 * @return Array 自己可进行的操作
	 */
	//getOperateArray(cards, outCard, playeType) {
	getOperateArray(chairID, cards, outCard, operateRecord, playeType) {
		let operateArray = [];
		cards = cards.sort((a, b) => {
			return a - b;
		});
		let sameCount = 0;
		for (let i = 0; i < cards.length; ++i) {
			if (cards[i] == outCard) {
				++sameCount;
			}
		}
		if (sameCount >= 2) {
			operateArray.push(gameProto.operateType.PENG);
		}
		if (sameCount >= 3) {
			operateArray.push(gameProto.operateType.GANG_CHI);
		}
		///* 吃胡只能抢杠胡 */
		//if (this.canHu(cards, outCard, playeType)) {
		if (this.getCanHu(chairID, cards, outCard, operateRecord, playeType)) {
			operateArray.push(gameProto.operateType.HU_CHI);
		}
		if (operateArray.length > 0) {
			operateArray.push(gameProto.operateType.GUO);
		}
		return operateArray;
	}

	/*
	 * 获取手牌
	 * @param cardCount Number 拿牌的数量
	 * @return Array 手牌
	 */
	getCards(cardCount) {
		let array = [];
		while (this.cards.length > 0 && cardCount > 0) {
			array.push(this.cards.pop());
			--cardCount;
		}
		return array;
	}
	/*
	 * 听牌算法
	 * cards 手牌
	 * operateRecord 操作数组
	 */
	getCanHuTing(chairID, cards, operateRecord) {
		if (cards >= 14) return true;
		for (let key in CARDID) {
			let CanHu = this.getCanHu(chairID, cards, CARDID[key], operateRecord);
			if (CanHu && CanHu.type >= 1) {
				if (this.gameRule.siJiaoPei) {
					return this.getCardsJiao(chairID, cards, operateRecord);
				}
				return true;
			}
		}
		return false;
	}
	/*
	 * 牌型最大算法
	 * cards 手牌
	 * operateRecord 操作数组
	 */
	getType(chairID, cards, operateRecord) {
		let Hu_1 = this.getCanHu(chairID, cards, 38, operateRecord, false, false, true);
		if (Hu_1.getPlusRateType) {
			for (let i = 0; i < Hu_1.getPlusRateType.length; i++) {
				Hu_1.rate += Hu_1.getPlusRateType[i].rate;
			}
		}
		for (let key in CARDID) {
			let Hu_2 = this.getCanHu(chairID, cards, CARDID[key], operateRecord, false, false, true);
			if (Hu_2.getPlusRateType) {
				for (let i = 0; i < Hu_2.getPlusRateType.length; i++) {
					Hu_2.rate += Hu_2.getPlusRateType[i].rate;
				}
			}
			if (Hu_2.rate > Hu_1.rate || (Hu_2.type && !Hu_1.type)) {
				Hu_1 = Hu_2;
			}
		}
		if (Hu_1.type >= 0 && Hu_1.rate >= 0) {
			return Hu_1;
		}
		return false;
	}
	/*
	 * 无牌不算叫
	 * cards 手牌
	 * operateRecord 操作数组
	 */
	getCardsJiao(chairID, cards, operateRecord) {
		let cardata = [];
		for (let key in CARDID) {
			let CanHu = this.getCanHu(chairID, cards, CARDID[key], operateRecord);
			if (CanHu && CanHu.type >= 1) {
				cardata.push(CARDID[key]);
			}
		}
		let QICards = 0;
		let cardataQICards = [];
		//获取已经操作过的所有牌 
		for (let i = 0; i < operateRecord.length; ++i) {
			if (operateRecord[i].operate == gameProto.operateType.QI && cardata.indexOf(operateRecord[i].card) >= 0) {
				/* 弃牌 */
				QICards++;
				cardataQICards.push(operateRecord[i].card);
			} else if (operateRecord[i].operate == gameProto.operateType.PENG && cardata.indexOf(operateRecord[i].card) >= 0) {
				/* 碰牌 */
				QICards += 3;
				if (cardataQICards.indexOf(operateRecord[i].card) >= 0) {
					QICards--;
				}
			} else if (operateRecord[i].operate == gameProto.operateType.GANG_CHI && cardata.indexOf(operateRecord[i].card) >= 0) {
				/* 吃杠 */
				QICards += 4;
				if (cardataQICards.indexOf(operateRecord[i].card) >= 0) {
					QICards--;
				}
			} else if (operateRecord[i].operate == gameProto.operateType.GANG_BU && cardata.indexOf(operateRecord[i].card) >= 0) {
				/* 补杠 */
				QICards += 4;
				if (cardataQICards.indexOf(operateRecord[i].card) >= 0) {
					QICards--;
				}
			} else if (operateRecord[i].operate == gameProto.operateType.GANG_ZHI && cardata.indexOf(operateRecord[i].card) >= 0) {
				/* 自摸杠 */
				QICards += 4;
				if (cardataQICards.indexOf(operateRecord[i].card) >= 0) {
					QICards--;
				}
			}

		}
		if (QICards >= (cardata.length * 4)) {
			return false;
		}
		return true;
	}
	/*
	 * 胡牌算法
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * cardCount 玩法张数
	 * addLaiZi 癞子玩法
	 */
	getCanHu(chairID, cards, card, operateRecord, bankerChairID, HU_ZHI_sun = false, Cha_Jiao = false) {
		let cardCount = this.gameRule.cardCount;
		let addLaiZi = this.gameRule.addLaiZi;

		//获取平胡番数
		let handCard = cards.slice();
		let ShouCard = card;
		let handoperateRecord = operateRecord.slice();
		let Hu_1 = this.canHuPingHu(chairID, handCard, ShouCard, handoperateRecord, cardCount, addLaiZi);
		let Fan_1 = this.getCanHuresidue(Hu_1, ShouCard);

		//获取七对番数
		handCard = cards.slice();
		ShouCard = card;
		handoperateRecord = operateRecord.slice();
		let Hu_2 = this.canHuQidui(chairID, handCard, ShouCard, handoperateRecord, cardCount, addLaiZi);
		let Fan_2 = this.getCanHuresidue(Hu_2, ShouCard);
		if (Fan_2 > Fan_1 || (Fan_2 && !Fan_1)) {
			Hu_1 = Hu_2;
			Fan_1 = Fan_2;
		}
		//获取大对子番数
		handCard = cards.slice();
		ShouCard = card;
		handoperateRecord = operateRecord.slice();
		Hu_2 = this.canHuDaDduiZi(chairID, handCard, ShouCard, handoperateRecord, cardCount, addLaiZi);
		Fan_2 = this.getCanHuresidue(Hu_2, ShouCard);
		if (Fan_2 > Fan_1 || (Fan_2 && !Fan_1)) {
			Hu_1 = Hu_2;
			Fan_1 = Fan_2;
		}
		if (Hu_1 >= 0 && Fan_1 >= 0) {
			let type = Hu_1;
			let rate = Fan_1;

			handCard = cards.slice();
			ShouCard = card;
			handoperateRecord = operateRecord.slice();
			let getPlusRateType = this.getPlusRateType(chairID, handCard, ShouCard, handoperateRecord, type, bankerChairID, HU_ZHI_sun, Cha_Jiao);
			return {
				type,
				rate,
				getPlusRateType
			};
		}
		return false;
	}

	/*
	 * 能否胡七对
	 * cards 手牌
	 * card 摸到的牌
	 * cardCount 玩法张数
	 * playeType 癞子玩法
	 */
	canHuQidui(chairID, cards, card, operateRecord, cardCount, addLaiZi) {
		let cloneCards = cards.slice();
		if (card != null && card != undefined) {
			cloneCards.push(card);
		}
		//手牌 排序
		cloneCards.sort((a, b) => {
			return a - b;
		});

		if (cardCount == 13) {
			if (cloneCards.length != 14) {
				return false;
			}
		} else if (cardCount == 10) {
			if (cloneCards.length != 11) {
				return false;
			}
		} else if (cardCount == 7) {
			if (cloneCards.length != 8) {
				return false;
			}
		}

		let ghostList = [];
		if (addLaiZi) {
			ghostList.push(38);
		}
		//获取花色
		let CardColor = this.getCardColorArr(cloneCards, ghostList);
		//转换牌型
		cloneCards = this.getCardNumberArr(cloneCards, ghostList);
		//记录龙七对
		let isQidui = false;
		let jiang = true;
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
					if (j + 1 != 2 && j + 1 != 5 && j + 1 != 8) jiang = false;
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
					if (j + 1 != 2 && j + 1 != 5 && j + 1 != 8) jiang = false;
				}
				//有四张牌
				if (cloneCards.cards[i][j] == 4) {
					//改变牌型 为龙背爪
					isQidui = true;
					if (j + 1 != 2 && j + 1 != 5 && j + 1 != 8) jiang = false;
				}
				if (cloneCards.cards[i][j] == 2) {
					if (j + 1 != 2 && j + 1 != 5 && j + 1 != 8) jiang = false;
				}

			}
		}
		//如果还剩有癞子 且数量大于等于2个 
		if (cloneCards.ghostCount >= 2) isQidui = true;
		if (cardCount == 13 || cardCount == 7) {

			//花色一样 且 有杠 返回 清龙七对
			if (CardColor && isQidui) return gameProto.cardType.QINGLONGQIDUI;

			//通过上面判断后 判断花色 如果是一种颜色 返回清七对
			if (CardColor) return gameProto.cardType.QINGQIDUI;
			//牌值都是2 5 8 返回将七对
			if (jiang) return gameProto.cardType.JIANQIDUI;
			//返回龙七对
			if (isQidui) return gameProto.cardType.LONGBEIZHUA;
			return gameProto.cardType.QIDUI;
		}
		return false;
	}
	/*
	 * 能否胡大对子
	 * chairID 玩家ID
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playeType 癞子玩法
	 */
	canHuDaDduiZi(chairID, cards, card, operateRecord, cardCount, addLaiZi) {
		let cloneCards = cards.slice();
		let EndCards = cards.slice();
		if (card != null && card != undefined) {
			cloneCards.push(card);
			EndCards.push(card);
		}
		//手牌 排序
		cloneCards.sort((a, b) => {
			return a - b;
		});
		let ghostList = [];
		if (addLaiZi) {
			ghostList.push(38);
		}
		//先提取出补杠数组 
		let RecordArr = [];
		let YaoJiu = true;
		let jiang = true;
		for (let i = 0; i < operateRecord.length; ++i) {
			/* 补杠 */
			if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.GANG_BU) {
				RecordArr.push(operateRecord[i].card);
				if (operateRecord[i].card % 10 != 1 && operateRecord[i].card % 10 != 9) YaoJiu = false;
				if (operateRecord[i].card % 10 != 2 && operateRecord[i].card % 10 != 5 && operateRecord[i].card % 10 != 8) jiang = false;
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
				//碰牌 放入三张
				EndCards.push(operateRecord[i].card);
				EndCards.push(operateRecord[i].card);
				EndCards.push(operateRecord[i].card);
				if (operateRecord[i].card % 10 != 1 && operateRecord[i].card % 10 != 9) YaoJiu = false;
				if (operateRecord[i].card % 10 != 2 && operateRecord[i].card % 10 != 5 && operateRecord[i].card % 10 != 8) jiang = false;
			} else if (operateRecord[i].chairID == chairID && (operateRecord[i].operate == gameProto.operateType.GANG_CHI /* 吃杠 */ ||
					operateRecord[i].operate == gameProto.operateType.GANG_BU /* 补杠 */ ||
					operateRecord[i].operate == gameProto.operateType.GANG_ZHI)) {
				/* 自摸杠 */
				//杠牌 放入四张
				EndCards.push(operateRecord[i].plusInfo.cardList[0]);
				EndCards.push(operateRecord[i].plusInfo.cardList[1]);
				EndCards.push(operateRecord[i].plusInfo.cardList[2]);
				EndCards.push(operateRecord[i].plusInfo.cardList[3]);
				if (operateRecord[i].plusInfo.cardList[0] % 10 != 1 && operateRecord[i].plusInfo.cardList[0] % 10 != 9) YaoJiu = false;
				if (operateRecord[i].plusInfo.cardList[1] % 10 != 1 && operateRecord[i].plusInfo.cardList[1] % 10 != 9) YaoJiu = false;
				if (operateRecord[i].plusInfo.cardList[2] % 10 != 1 && operateRecord[i].plusInfo.cardList[2] % 10 != 9) YaoJiu = false;
				if (operateRecord[i].plusInfo.cardList[3] % 10 != 1 && operateRecord[i].plusInfo.cardList[3] % 10 != 9) YaoJiu = false;

				if (operateRecord[i].plusInfo.cardList[0] % 10 != 2 && operateRecord[i].plusInfo.cardList[0] % 10 != 5 && operateRecord[i].plusInfo.cardList[0] % 10 != 8) jiang = false;
				if (operateRecord[i].plusInfo.cardList[1] % 10 != 2 && operateRecord[i].plusInfo.cardList[1] % 10 != 5 && operateRecord[i].plusInfo.cardList[0] % 10 != 8) jiang = false;
				if (operateRecord[i].plusInfo.cardList[2] % 10 != 2 && operateRecord[i].plusInfo.cardList[2] % 10 != 5 && operateRecord[i].plusInfo.cardList[0] % 10 != 8) jiang = false;
				if (operateRecord[i].plusInfo.cardList[3] % 10 != 2 && operateRecord[i].plusInfo.cardList[3] % 10 != 5 && operateRecord[i].plusInfo.cardList[0] % 10 != 8) jiang = false;
			} else if (operateRecord[i].chairID == chairID && operateRecord[i].operate == gameProto.operateType.CHI) {
				/* 吃牌 */
				//玩家有吃牌操作 直接返回
				return false;
			}
		}
		//全部牌（碰+杠+手牌） 排序
		EndCards.sort((a, b) => {
			return a - b;
		});
		//转换牌型
		cloneCards = this.getCardNumberArr(cloneCards, ghostList);
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
					if (j + 1 != 2 && j + 1 != 5 && j + 1 != 8) jiang = false;

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
					if (j + 1 != 2 && j + 1 != 5 && j + 1 != 8) jiang = false;
				}
				if (cloneCards.cards[i][j] == 3) {
					if (j + 1 != 2 && j + 1 != 5 && j + 1 != 8) jiang = false;
				}
			}
		}
		//如果还剩有癞子 且数量大于等于2个 
		if (cloneCards.ghostCount >= 2 && tmpData == false) {
			tmpData = true;
			cloneCards.ghostCount -= 2;
		}
		if (tmpData == false) return false;
		//全是 2 5 8 且有将对 返回将对
		if (jiang && tmpData) return gameProto.cardType.JIANGDUI;
		//获取花色
		let CardColor = this.getCardColorArr(EndCards, ghostList);
		//通过上面判断后 判断花色 如果是一种颜色 返回清大对番数
		if (CardColor && tmpData) return gameProto.cardType.QINGDADUI;

		return gameProto.cardType.DADUIZI;
	}



	//递归将牌多种组合
	canHuJiang(cloneCards, Data, length, YaoJiu, card) {
		let tmpData = false;
		let HuCombination = [];
		//踢出将牌
		for (let i = 0; i < cloneCards.cards.length; i++) {
			for (let j = 0; j < cloneCards.cards[i].length; j++) {
				let Cards = i * 10 + (j + 1);
				if (Data == Cards) {
					if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
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
		let chun_to = this.Shun_1(cloneCards_to, length, YaoJiu, tmpData, card);
		if (chun_to.not == true) {
			YaoJiu = chun_to.YaoJiu;
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
				YaoJiu: YaoJiu,
				HuCombination: HuCombination
			};
		}
		let cloneCards_shui = JSON.parse(JSON.stringify(cloneCards));
		let chun_shui = this.Shun_2(cloneCards_shui, length, YaoJiu, tmpData, card);
		if (chun_shui.not == true) {
			YaoJiu = chun_shui.YaoJiu;
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
				YaoJiu: YaoJiu,
				HuCombination: HuCombination
			};
		}
		let cloneCards_fei = JSON.parse(JSON.stringify(cloneCards));
		let chun_fei = this.Shun_3(cloneCards_fei, length, YaoJiu, tmpData, card);
		if (chun_fei.not == true) {
			YaoJiu = chun_fei.YaoJiu;
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
				YaoJiu: YaoJiu,
				HuCombination: HuCombination
			};
		}

		return {
			not: false,
			ghost: cloneCards.ghostCount,
			YaoJiu: YaoJiu
		};
	}
	/*
	 * 能否胡平胡
	 * cards 手牌
	 * card 摸到的牌
	 * operateRecord 操作数组
	 * playeType 癞子玩法
	 */
	canHuPingHu(chairID, cards, card, operateRecord, cardCount, addLaiZi) {
		let handcloneCards = cards.slice();
		let End = cards.slice();
		let YaoJiucars = true;
		if (card != null && card != undefined) {
			handcloneCards.push(card);
			End.push(card);
		}
		//手牌 排序
		handcloneCards.sort((a, b) => {
			return a - b;
		});
		let ghostList = [];
		if (addLaiZi) {
			ghostList.push(38);
		}
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
				//碰牌 放入三张
				End.push(operateRecord[i].card);
				End.push(operateRecord[i].card);
				End.push(operateRecord[i].card);
				let card = operateRecord[i].card % 10;
				if (card != 1 && card != 9) YaoJiucars = false;
			} else if (operateRecord[i].chairID == chairID && (operateRecord[i].operate == gameProto.operateType.GANG_CHI /* 吃杠 */ ||
					operateRecord[i].operate == gameProto.operateType.GANG_BU /* 补杠 */ ||
					operateRecord[i].operate == gameProto.operateType.GANG_ZHI)) {
				/* 自摸杠 */
				if (!operateRecord[i].plusInfo.cardList) {
					let a = 0;
				}
				//杠牌 放入四张
				End.push(operateRecord[i].plusInfo.cardList[0]);
				End.push(operateRecord[i].plusInfo.cardList[1]);
				End.push(operateRecord[i].plusInfo.cardList[2]);
				End.push(operateRecord[i].plusInfo.cardList[3]);
				let card = operateRecord[i].card % 10;
				if (card != 1 && card != 9) YaoJiucars = false;
			}
		}
		//全部牌（碰+杠+手牌） 排序
		End.sort((a, b) => {
			return a - b;
		});
		//转换牌型 只用计算手上的牌
		let cloneCards = this.getCardNumberArr(handcloneCards, ghostList);

		//是否有将对
		let tmpData = false;
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
			let Cardsdata = this.canHuJiang(Cards_to, tmpCardsData[i], handcloneCards.length, YaoJiucars, card);
			if (Cardsdata.not == true) {
				tmpData = true;
				YaoJiucars = Cardsdata.YaoJiu;
				break;
			}
		}
		if (tmpData == false) {
			for (let i = 0; i < tmpCardsData.length; i++) {
				//使用鬼牌查看将对
				//使用鬼牌
				let Cards_sui = this.getCardNumberArr(handcloneCards, ghostList);
				let Cardsdata = this.canHuJiang(Cards_sui, tmpCardsData[i], handcloneCards.length, YaoJiucars, card);
				if (Cardsdata.not == true) {
					cloneCards.ghostCount = Cardsdata.ghost;
					tmpData = true;
					YaoJiucars = Cardsdata.YaoJiu;
					break;
				}
			}
		}

		if (tmpData == false) return false;

		//如果还剩有癞子 且数量大于等于2个 没有将对 
		if (cloneCards.ghostCount >= 2 && tmpData == false) {
			tmpData = true;
			cloneCards.ghostCount -= 2;
		}

		if (tmpData == false) return false;
		// //手牌 + 碰杠牌 都是1 9 返回幺九
		// if (YaoJiucars == true) return gameProto.cardType.QUANYAOJIU;
		//获取花色 使用整个牌组 校验字牌花色
		let CardColor = this.getCardColorArr(End, ghostList);
		//通过上面判断后 判断花色 如果是一种颜色 返回清一色
		if (CardColor && tmpData && this.gameRule.roomType != gameProto.roomType.ONE) return gameProto.cardType.QINGYISE;
		// //循环拉取 校验一条龙
		// let isYiTiaoLong = 0;
		// let EndCards = this.getCardNumberArr(End, ghostList);
		// for (let i = 0; i < EndCards.cards.length; i++) {
		// 	for (let j = 0; j < EndCards.cards[i].length; j++) {
		// 		if (EndCards.cards[i][j] == 0) continue;
		// 		isYiTiaoLong++;
		// 		//1到9连上 都是单牌
		// 		if (isYiTiaoLong + EndCards.ghostCount >= 9) {
		// 			if (cardCount == 13) {
		// 				return gameProto.cardType.YITIAOLONG;
		// 			}
		// 		}
		// 	}
		// 	isYiTiaoLong = 0;
		// }
		// //手牌只有一张 且摸到的牌值是2条 手牌值 且手牌上要有1条和3条 返回 卡2条 
		// if (card && cards.length == 1 && cards[0] == CARDID.CARDID_TIAO2 && handcloneCards.indexOf(CARDID.CARDID_TIAO1) >= 0 && handcloneCards.indexOf(CARDID.CARDID_TIAO3) >= 0) {
		// 	return gameProto.cardType.KAERTIAO;
		// }

		return gameProto.cardType.PINGHU;
	}
	/*
	 * 平胡牌型组合 
	 * cards 手牌
	 * card 摸到的牌
	 */
	HuCombination(cards, card, operateRecord, chairID) {
		let handcloneCards = cards.slice();
		let YaoJiucars = true;
		if (card != null && card != undefined) {
			handcloneCards.push(card);
		}
		//全部牌（碰+杠+手牌） 排序
		handcloneCards.sort((a, b) => {
			return a - b;
		});
		//转换牌型 只用计算手上的牌
		let cloneCards = this.getCardNumberArr(handcloneCards, [38]);

		//是否有将对
		let tmpData = false;
		let tmpCardsData = [];
		//胡牌组合
		let HuCombination = [];
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
			let Cards_to = this.getCardNumberArr(handcloneCards, [CARDID.CARDID_LAI], 1);
			let Cardsdata = this.canHuJiang(Cards_to, tmpCardsData[i], handcloneCards.length, YaoJiucars, card);
			if (Cardsdata.not == true) {
				tmpData = true;
				HuCombination = Cardsdata.HuCombination;
				if (Cardsdata.YaoJiu) {
					break;
				}
				if (this.getYiTiaoLong(HuCombination)) {
					break;
				}
			}
		}
		if (tmpData == false) {
			for (let i = 0; i < tmpCardsData.length; i++) {
				//使用鬼牌查看将对
				//使用鬼牌
				let Cards_sui = this.getCardNumberArr(handcloneCards, [CARDID.CARDID_LAI]);
				let Cardsdata = this.canHuJiang(Cards_sui, tmpCardsData[i], handcloneCards.length, YaoJiucars, card);
				if (Cardsdata.not == true) {
					cloneCards.ghostCount = Cardsdata.ghost;
					tmpData = true;
					HuCombination = Cardsdata.HuCombination;
					if (Cardsdata.YaoJiu) {
						break;
					}
					if (this.getYiTiaoLong(HuCombination)) {
						break;
					}

				}
			}
		}

		if (tmpData == false) return false;

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
				//碰牌 放入三张
				HuCombination.push({
					type: 1,
					list: [operateRecord[i].card, operateRecord[i].card, operateRecord[i].card]
				});
			} else if (operateRecord[i].chairID == chairID && (operateRecord[i].operate == gameProto.operateType.GANG_CHI /* 吃杠 */ ||
					operateRecord[i].operate == gameProto.operateType.GANG_BU /* 补杠 */ ||
					operateRecord[i].operate == gameProto.operateType.GANG_ZHI)) {
				/* 自摸杠 */
				//杠牌 放入四张
				HuCombination.push({
					type: 1,
					list: [operateRecord[i].card, operateRecord[i].card, operateRecord[i].card, operateRecord[i].card]
				});
			}
		}
		return HuCombination;
	}
	/*
	 * 获取癞子的个数
	 */
	getHongZhongCount(cards, addLaiZi) {
		let count = 0;
		for (let i = 0; i < cards.length; ++i) {
			//癞子
			if (addLaiZi == true) {
				if (cards[i] == CARDID.CARDID_LAI) {
					++count;
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
        return XZModel.getLastCardCount();
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
    getCanHuresidue(type, card = null) {
        if (type == gameProto.cardType.PINGHU) {
            return 0;
        } else if (type == gameProto.cardType.DADUIZI) {
            return 1;
        } else if (type == gameProto.cardType.QINGYISE) {
            return 2;
        } else if (type == gameProto.cardType.QIDUI) {
            return 2;
        } else if (type == gameProto.cardType.LONGBEIZHUA) {
            return 3;
        } else if (type == gameProto.cardType.QINGDADUI) {
            return 3;
        } else if (type == gameProto.cardType.QINGQIDUI) {
            return 4;
        } else if (type == gameProto.cardType.QINGLONGQIDUI) {
            return 5;
        } else if (type == gameProto.cardType.QUANYAOJIU) {
            return 3;
        } else if (type == gameProto.cardType.JIANGDUI) {
            return 3;
        } else if (type == gameProto.cardType.JIANQIDUI) {
            return 4;
        } else if (type == gameProto.cardType.KAERTIAO) {
            return 1;
        } else if (type == gameProto.cardType.YITIAOLONG) {
            return 2;
        } else if (type == gameProto.cardType.JUEZHUANG) {
            return 1;
        }
    }

    //取牌先后顺序 三张 顺子 两张
    Shun_1(cloneCards, lengths, YaoJiu, tmpData, card) {
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
                    if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
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
                    if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;


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
                        if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;
                        return {
                            not: false,
                            ghost: cloneCards.ghostCount,
                            YaoJiu: YaoJiu,
                            length: lengths
                        };
                    }
                    //提出牌
                    cloneCards.cards[i][j]--;
                    cloneCards.cards[i][j + 1]--;
                    //如果有癞子 替换一个
                    cloneCards.ghostCount--;
                    length -= 3;
                    //if ((j + 1 != 1 && j + 1 != 9) && (j + 2 != 1 && j + 2 != 9)) YaoJiu = false;

                    let Cards_1 = i * 10 + (j + 1);
                    let Cards_2 = i * 10 + (j + 2);
                    let Cards_3 = i * 10 + (j + 3);
                    if (yaojiu_list) {
                        if (j + 1 == 8 && j + 2 == 9) {
                            Cards_3 = i * 10 + (j);
                            HuCombination.push({
                                type: 1,
                                list: [Cards_3, Cards_1, Cards_2]
                            });
                        } else if (j + 1 == 2 && j + 2 == 3) {
                            Cards_3 = i * 10 + (j);
                            HuCombination.push({
                                type: 1,
                                list: [Cards_3, Cards_1, Cards_2]
                            });
                        } else {
                            HuCombination.push({
                                type: 1,
                                list: [Cards_1, Cards_2, Cards_3]
                            });
                        }
                    } else {
                        HuCombination.push({
                            type: 1,
                            list: [Cards_1, Cards_2, Cards_3]
                        });
                    }

                    if ((Cards_1 % 10 != 1 && Cards_1 % 10 != 9) && (Cards_3 % 10 != 1 && Cards_3 % 10 != 9)) YaoJiu = false;
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
                        if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;
                        return {
                            not: false,
                            ghost: cloneCards.ghostCount,
                            YaoJiu: YaoJiu,
                            length: lengths
                        };
                    }
                    //提出牌
                    cloneCards.cards[i][j]--;
                    cloneCards.cards[i][j + 2]--;
                    //如果有癞子 替换一个
                    cloneCards.ghostCount--;
                    length -= 3;
                    if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;

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
                        if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
                        return {
                            not: false,
                            ghost: cloneCards.ghostCount,
                            YaoJiu: YaoJiu,
                            length: lengths
                        };
                    } else {
                        //如果有癞子 替换一个组合为3张牌
                        cloneCards.ghostCount--;
                        cloneCards.cards[i][j] -= 2;
                        length -= 3;
                        if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
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
                        if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
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
                            YaoJiu: YaoJiu,
                            length: lengths
                        };
                    }
                }
            }
        }
        return {
            not: true,
            ghost: cloneCards.ghostCount,
            YaoJiu: YaoJiu,
            length: length,
            HuCombination: HuCombination
        };
    }
    //取牌先后顺序 顺子 三张 两张
    Shun_2(cloneCards, lengths, YaoJiu, tmpData, card) {
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
                    if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;

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
                        if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;
                        return {
                            not: false,
                            ghost: cloneCards.ghostCount,
                            YaoJiu: YaoJiu,
                            length: lengths
                        };
                    }
                    //提出牌
                    cloneCards.cards[i][j]--;
                    cloneCards.cards[i][j + 1]--;
                    //如果有癞子 替换一个
                    cloneCards.ghostCount--;
                    length -= 3;
                    //if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;

                    let Cards_1 = i * 10 + (j + 1);
                    let Cards_2 = i * 10 + (j + 2);
                    let Cards_3 = i * 10 + (j + 3);
                    if (yaojiu_list) {
                        if (j + 1 == 8 && j + 2 == 9) {
                            Cards_3 = i * 10 + (j);
                            HuCombination.push({
                                type: 1,
                                list: [Cards_3, Cards_1, Cards_2]
                            });
                        } else if (j + 1 == 2 && j + 2 == 3) {
                            Cards_3 = i * 10 + (j);
                            HuCombination.push({
                                type: 1,
                                list: [Cards_3, Cards_1, Cards_2]
                            });
                        } else {
                            HuCombination.push({
                                type: 1,
                                list: [Cards_1, Cards_2, Cards_3]
                            });
                        }
                    } else {
                        HuCombination.push({
                            type: 1,
                            list: [Cards_1, Cards_2, Cards_3]
                        });
                    }
                    if ((Cards_1 % 10 != 1 && Cards_1 % 10 != 9) && (Cards_3 % 10 != 1 && Cards_3 % 10 != 9)) YaoJiu = false;
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
                        if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;
                        return {
                            not: false,
                            ghost: cloneCards.ghostCount,
                            YaoJiu: YaoJiu,
                            length: lengths
                        };
                    }
                    //提出牌
                    cloneCards.cards[i][j]--;
                    cloneCards.cards[i][j + 2]--;
                    //如果有癞子 替换一个
                    cloneCards.ghostCount--;
                    length -= 3;
                    if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;

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
                    if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
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
                        if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
                        return {
                            not: false,
                            ghost: cloneCards.ghostCount,
                            YaoJiu: YaoJiu,
                            length: lengths
                        };
                    } else {
                        //如果有癞子 替换一个组合为3张牌
                        cloneCards.ghostCount--;
                        cloneCards.cards[i][j] -= 2;
                        length -= 3;
                        if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
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
                        if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
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
                            YaoJiu: YaoJiu,
                            length: lengths
                        };
                    }
                }
            }
        }
        return {
            not: true,
            ghost: cloneCards.ghostCount,
            YaoJiu: YaoJiu,
            length: length,
            HuCombination: HuCombination
        };
    }
    //取牌先后顺序  三张 两张 顺子
    Shun_3(cloneCards, lengths, YaoJiu, tmpData, card) {
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
                    if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
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
                        if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
                        return {
                            not: false,
                            ghost: cloneCards.ghostCount,
                            YaoJiu: YaoJiu,
                            length: lengths
                        };
                    } else {
                        //如果有癞子 替换一个组合为3张牌
                        cloneCards.ghostCount--;
                        cloneCards.cards[i][j] -= 2;
                        length -= 3;
                        if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
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
                    if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;

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
                        if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;
                        return {
                            not: false,
                            ghost: cloneCards.ghostCount,
                            YaoJiu: YaoJiu,
                            length: lengths
                        };
                    }
                    //提出牌
                    cloneCards.cards[i][j]--;
                    cloneCards.cards[i][j + 1]--;
                    //如果有癞子 替换一个
                    cloneCards.ghostCount--;
                    length -= 3;
                    //if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;

                    let Cards_1 = i * 10 + (j + 1);
                    let Cards_2 = i * 10 + (j + 2);
                    let Cards_3 = i * 10 + (j + 3);
                    if (yaojiu_list) {
                        if (j + 1 == 8 && j + 2 == 9) {
                            Cards_3 = i * 10 + (j);
                            HuCombination.push({
                                type: 1,
                                list: [Cards_3, Cards_1, Cards_2]
                            });
                        } else if (j + 1 == 2 && j + 2 == 3) {
                            Cards_3 = i * 10 + (j);
                            HuCombination.push({
                                type: 1,
                                list: [Cards_3, Cards_1, Cards_2]
                            });
                        } else {
                            HuCombination.push({
                                type: 1,
                                list: [Cards_1, Cards_2, Cards_3]
                            });
                        }
                    } else {
                        HuCombination.push({
                            type: 1,
                            list: [Cards_1, Cards_2, Cards_3]
                        });
                    }
                    if ((Cards_1 % 10 != 1 && Cards_1 % 10 != 9) && (Cards_3 % 10 != 1 && Cards_3 % 10 != 9)) YaoJiu = false;
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
                        if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;
                        return {
                            not: false,
                            ghost: cloneCards.ghostCount,
                            YaoJiu: YaoJiu,
                            length: lengths
                        };
                    }
                    //提出牌
                    cloneCards.cards[i][j]--;
                    cloneCards.cards[i][j + 2]--;
                    //如果有癞子 替换一个
                    cloneCards.ghostCount--;
                    length -= 3;
                    if ((j + 1 != 1 && j + 1 != 9) && (j + 3 != 1 && j + 3 != 9)) YaoJiu = false;

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
                        if (j + 1 != 1 && j + 1 != 9) YaoJiu = false;
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
                            YaoJiu: YaoJiu,
                            length: lengths
                        };
                    }
                }
            }
        }
        return {
            not: true,
            ghost: cloneCards.ghostCount,
            YaoJiu: YaoJiu,
            length: length,
            HuCombination: HuCombination
        };
    }

    /*
     * 打出一张牌能否听牌
     */
    getTingCards(cards) {
        let tingCards = [];
        let rule = XZModel.getGameRule()
        let chairID = XZModel.getMyChairID()
        let operateRecord = XZModel.getOptRecord()
        let dtype = XZModel.getDingQueType(chairID)
        let addLaizi = rule.addLaiZi
        let queWan = []
        if (dtype === -1) {
            switch (rule.roomType) {
                case 2:
                    queWan.push(gameProto.queType.WAN)
                    break;
                case 1:
                    queWan.push(gameProto.queType.TONG)
                    queWan.push(gameProto.queType.TIAO)
                    break;
            }
        }
        for (let i = 0; i < cards.length; ++i) {
            let cloneCards = cards.slice();
            cloneCards.splice(i, 1);
            /**把除了缺牌以外的牌挨着放进去看是否能胡 */
            for (let key in CARDID) {
                let item = CARDID[key];
                let c = this.getCardColor(item)
                if (c !== dtype && !queWan.includes(c)) {
                    if (!addLaizi && item === CARDID.CARDID_LAI) {
                        continue;
                    }
                    if (cards[i] != item) {
                        if (this.getCanHu(chairID, cloneCards, item, operateRecord, XZModel.getBankerChairID())) {
                            tingCards.push(cards[i]);
                            break;
                        }
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
        let rule = XZModel.getGameRule()
        let chairID = XZModel.getMyChairID();
        let operateRecord = XZModel.getOptRecord(chairID);
        let dtype = XZModel.getDingQueType(chairID)
        let addLaizi = rule.addLaiZi
        let queWan = []
        if (dtype === -1) {
            switch (rule.roomType) {
                case 2:
                    queWan.push(gameProto.queType.WAN)
                    break;
                case 1:
                    queWan.push(gameProto.queType.TONG)
                    queWan.push(gameProto.queType.TIAO)
                    break;
            }
        }
        for (let key in CARDID) {
            let item = CARDID[key];
            let c = this.getCardColor(item)
            if (c !== dtype && !queWan.includes(c)) {
                if (!addLaizi && item === CARDID.CARDID_LAI) {
                    continue;
                }
                let huInfo = this.getCanHu(chairID, cards, item, operateRecord, XZModel.getBankerChairID())
                if (huInfo) {
                    huInfo.card = item
                    canWinCards.push(huInfo);
                }
            }
        }
        return canWinCards;
    }

    /**根据规则获取鬼牌列表 */
    getGhostList() {
        let ghostList = [CARDID.CARDID_LAI]
        return ghostList
    }
}

let instance = null;
module.exports = (() => {
    if (instance == null) {
        instance = new GameLogic();
    }
    return instance;
})();