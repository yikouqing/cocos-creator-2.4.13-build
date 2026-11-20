/*
 * 三公算法
 */
const { Def_Sgbjh } = require('../../../src/const/Defines');
const ApiSgbjh = require('./ApiSgbjh');

class GameLogic {
	constructor() {
		this.cards = [];
	}

	/*
	 * 洗牌
	 */
	washCards() {
		this.cards = [
			0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d,
			0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d,
			0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d,
			0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d
		];
		for (let i = 0; i < this.cards.length; ++i) {
			let random = Math.floor(Math.random() * this.cards.length);
			let tmp = this.cards[i];
			this.cards[i] = this.cards[random];
			this.cards[random] = tmp;
		}
	}

	/*
	 * 获取牌的花色
	 * @param card 牌id
	 * @return Number 花色值
	 */
	getCardColor(card) {
		return Math.floor(card / 16);
	}

	/*
	 * 获取牌的花色名字
	 * @param card Number 牌id
	 * @return String 花色
	 */
	getCardColorName(card) {
		let colors = ['方块', '草花', '红桃', '黑桃'];
		if (card >= 0x01 && card <= 0x3d) {
			return colors[Math.floor(card / 0x10)];
		}
		return null;
	}

	/*
	 * 获取牌的计算值
	 * @param card Number 牌id
	 * @return Number 值
	 */
	getCardValue(card) {
		let value = card & 0x0f;
		if (value >= 10) {
			value = 0;
		}
		return value;
	}

	/*
	 * 获取牌的牌面数值
	 * @param card Number 牌id
	 * @return Number 值
	 */
	getCardNumber(card) {
		return card & 0x0f;
	}

	/*
	 * 获取3张手牌
	 * @return Array 手牌
	 */
	getCards() {
		let cards = [];
		for (let i = 0; i < 3; ++i) {
			cards.push(this.cards.pop());
		}
		return cards;
	}

	/*
	 * 获取牌的类型
	 * @param cards Array 牌
	 * @return String 类型
	 */
	getCardsType(cards) {
		let num0 = this.getCardNumber(cards[0]);
		let num1 = this.getCardNumber(cards[1]);
		let num2 = this.getCardNumber(cards[2]);
		let is_same = (num0 == num1 && num1 == num2);

		if (is_same) {
			return ApiSgbjh.cardsType.BAOZI;
		}


		let gong_count = 0;
		if (num0 > 10) {
			++gong_count;
		}
		if (num1 > 10) {
			++gong_count;
		}
		if (num2 > 10) {
			++gong_count;
		}
		if (gong_count == 3) {
			return ApiSgbjh.cardsType.SANGONG;
		} else {
			return ApiSgbjh.cardsType.ZHENGCHANG;
		}
	}

	/*
	 * 比较两幅牌的大小，0和，1cards1大，-1cards2大
	 * @param cards1 Array 牌1
	 * @param cards2 Array 牌2
	 * @return Number 结果
	 */
	compareCards(cards1, cards2) {
		let type1 = this.getCardsType(cards1);
		let type2 = this.getCardsType(cards2);
		if (type1 != type2) {
			return type1 - type2;
		}

		if (type1 == ApiSgbjh.cardsType.BAOZI) {
			return this.getCardNumber(cards1[0]) - this.getCardNumber(cards2[0]);
		} else {
			if (type1 == ApiSgbjh.cardsType.ZHENGCHANG) {
				/* 先比点数再比公个数 */
				let num1 = (this.getCardValue(cards1[0]) + this.getCardValue(cards1[1]) + this.getCardValue(cards1[2])) % 10;
				let num2 = (this.getCardValue(cards2[0]) + this.getCardValue(cards2[1]) + this.getCardValue(cards2[2])) % 10;
				if (num1 != num2) {
					return num1 - num2;
				}

				let gong_count1 = this.getGongCount(cards1);
				let gong_count2 = this.getGongCount(cards2);
				if (gong_count1 != gong_count2) {
					return gong_count1 - gong_count2;
				}
			}

			let sort_fun = (a, b) => {
				if (this.getCardNumber(a) != this.getCardNumber(b)) {
					return this.getCardNumber(b) - this.getCardNumber(a);
				} else {
					return this.getCardColor(b) - this.getCardColor(a);
				}
			};
			let sample1 = cards1.slice().sort(sort_fun);
			let sample2 = cards2.slice().sort(sort_fun);
			return -sort_fun(sample1[0], sample2[0]); /* 比第一张牌的大小花色 */
		}
	}

	/*
	 * 根据牌型获取倍率
	 * @param Array cards 手牌
	 * @param Number scaleType 翻倍类型 BIG LITTLE
	 * @return Number
	 */
	getScaleByCards(cards, scaleType) {
		let type = this.getCardsType(cards);
		if (scaleType == Def_Sgbjh.scaleType.LITTLE) {
			return 1;
		} else {
			if (type == ApiSgbjh.cardsType.BAOZI) {
				return 5;
			} else if (type == ApiSgbjh.cardsType.SANGONG) {
				return 4;
			} else {
				let num = (this.getCardValue(cards[0]) + this.getCardValue(cards[1]) + this.getCardValue(cards[2])) % 10;
				if (num == 9) {
					return 3;
				} else if (num == 8) {
					return 2;
				} else {
					return 1;
				}
			}
		}
	}

	/*
	 * 获取公牌个数
	 * @param Array cards
	 * @return Number
	 */
	getGongCount(cards) {
		let count = 0;
		for (let i = 0; i < cards.length; ++i) {
			if (this.getCardNumber(cards[i]) > 10) {
				++count;
			}
		}
		return count;
	}
}

let instance = null;
module.exports = (() => {
	if (instance == null) {
		instance = new GameLogic();
	}
	return instance;
})();