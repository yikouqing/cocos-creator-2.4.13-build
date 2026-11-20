/*
 * 炸金花算法
 */
var ApiSz = require('./ApiSz');

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
			0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d,
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
		if (value == 1) {
			value += 13;
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
	 * @return Number 类型
	 */
	getCardsType(cards) {
		if (this.getCardNumber(cards[0]) == this.getCardNumber(cards[1]) && this.getCardNumber(cards[1]) == this.getCardNumber(cards[2])) {
			return ApiSz.cardsType.BAOZI;
		}

		let is_jinhua = false;
		if (this.getCardColor(cards[0]) == this.getCardColor(cards[1]) && this.getCardColor(cards[1]) == this.getCardColor(cards[2])) {
			is_jinhua = true;
		}

		let is_shunzi = false;
		let array = [this.getCardValue(cards[0]), this.getCardValue(cards[1]), this.getCardValue(cards[2])].sort((a, b) => {
			return a - b;
		});
		if (array[0] + 1 == array[1] && array[1] + 1 == array[2]) {
			is_shunzi = true;
		}
		if (array[0] == 2 && array[1] == 3 && array[2] == 14) {
			is_shunzi = true;
		}

		if (is_jinhua && is_shunzi) {
			return ApiSz.cardsType.SHUNJIN;
		}
		if (is_jinhua) {
			return ApiSz.cardsType.JINHUA;
		}
		if (is_shunzi) {
			return ApiSz.cardsType.SHUNZI;
		}

		if (array[0] == array[1] || array[1] == array[2]) {
			return ApiSz.cardsType.DUIZI;
		}
		return ApiSz.cardsType.DANZHANG;
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

		/* 相同时，先比大小，所有牌大小相同时，比牌的花色 */
		let sample1 = cards1.slice();
		let sample2 = cards2.slice();
		if (type1 == ApiSz.cardsType.DUIZI) {
			/* 对子需要先比对子 */
			for (let i = 0; i < sample1.length; ++i) {
				for (let j = i + 1; j < sample1.length; ++j) {
					if (this.getCardNumber(sample1[i]) == this.getCardNumber(sample1[j])) {
						let card = sample1.splice(3 - i - j, 1);
						sample1.push(card[0]);
					}
					if (this.getCardNumber(sample2[i]) == this.getCardNumber(sample2[j])) {
						let card = sample2.splice(3 - i - j, 1);
						sample2.push(card[0]);
					}
				}
			}
			if (this.getCardColor(sample1[0]) < this.getCardColor(sample1[1])) {
				let tmp = sample1[0];
				sample1[0] = sample1[1];
				sample1[1] = tmp;
			}
			if (this.getCardColor(sample2[0]) < this.getCardColor(sample2[1])) {
				let tmp = sample2[0];
				sample2[0] = sample2[1];
				sample2[1] = tmp;
			}
		} else {
			let sort_fun = (a, b) => {
				return this.getCardValue(b) - this.getCardValue(a);
			};
			sample1.sort(sort_fun);
			sample2.sort(sort_fun);
		}

		for (let i = 0; i < sample1.length; ++i) {
			if (this.getCardValue(sample1[i]) != this.getCardValue(sample2[i])) {
				return this.getCardValue(sample1[i]) - this.getCardValue(sample2[i]);
			}
		}
		for (let i = 0; i < sample1.length; ++i) {
			if (this.getCardColor(sample1[i]) != this.getCardColor(sample2[i])) {
				return this.getCardColor(sample1[i]) - this.getCardColor(sample2[i]);
			}
		}
		return 0;
	}

	/*
	 * 根据牌型获取赔率
	 * @param type String 类型
	 * @return Number 赔率
	 */
	getScaleByType(type) {
		return 1;
	}
}

module.exports = new GameLogic();