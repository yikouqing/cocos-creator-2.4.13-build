/*
 * 牛牛算法
 */
const { Def_Nn } = require('../../../src/const/Defines');
const ApiNn = require('./ApiNn');

class GameLogic {
	constructor() {
		this.cards = [];
		this.cardsType = null;
		this.scaleType = null;
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
	 * 设置允许的牌类型
	 * @param Array cardsType 只能在此类型中
	 */
	setCardsType(cardsType, scaleType) {
		this.cardsType = cardsType;
		this.scaleType = scaleType;
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
		if (value > 10) {
			value = 10;
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
	 * 获取5张手牌
	 * @return Array 手牌
	 */
	getCards() {
		let cards = [];
		for (let i = 0; i < 5; ++i) {
			cards.push(this.cards.pop());
		}
		return cards;
	}

	/*
	 * 获取牌的类型  必须先设置可获取的类型 setCardsType
	 * @param cards Array 牌
	 * @return Number 类型
	 */
	getCardsType(cards) {
		let sum = 0;
		for (let i = 0; i < cards.length; ++i) {
			sum += this.getCardValue(cards[i]);
		}
		let niu_num = this.getNiuNumber(cards);

		let is_shunziniu = false; /* 顺子牛判断 */
		let array = cards.slice().sort((a, b) => {
			return this.getCardNumber(a) - this.getCardNumber(b);
		});
		let step_num = 0;
		for (let i = 1; i < array.length; ++i) {
			if (this.getCardNumber(array[i]) - 1 == this.getCardNumber(array[i - 1])) {
				++step_num;
			}
		}
		if (step_num == 4) {
			is_shunziniu = true;
		}
		if (this.getCardNumber(array[0]) == 1 &&
			this.getCardNumber(array[1]) == 10 &&
			this.getCardNumber(array[2]) == 11 &&
			this.getCardNumber(array[3]) == 12 &&
			this.getCardNumber(array[4]) == 13) {
			is_shunziniu = true;
		}

		let is_tonghuaniu = /* 同花牛判断 */
			this.getCardColor(cards[0]) == this.getCardColor(cards[1]) &&
			this.getCardColor(cards[1]) == this.getCardColor(cards[2]) &&
			this.getCardColor(cards[2]) == this.getCardColor(cards[3]) &&
			this.getCardColor(cards[3]) == this.getCardColor(cards[4]);

		let is_tonghuashunniu = is_shunziniu && is_tonghuaniu; /* 同花顺牛判断 */
		if (is_tonghuashunniu && (!!this.cardsType.TONGHUASHUN)) {
			return this.getBiggerScale(Def_Nn.cardsType.TONGHUASHUN, niu_num);
		}

		let is_yitiaolongniu = is_shunziniu && this.getCardNumber(array[0]) == 1 && this.getCardNumber(array[1]) == 2; /* 一条龙牛判断 */
		if (is_yitiaolongniu && !!this.cardsType.YITIAOLONG) {
			return this.getBiggerScale(Def_Nn.cardsType.YITIAOLONG, niu_num);
		}

		let four_same = false,
			three_same = false,
			two_same = false;
		for (let i = 0; i < cards.length; ++i) {
			let same = 0;
			for (let j = 0; j < cards.length; ++j) {
				if (this.getCardNumber(cards[i]) == this.getCardNumber(cards[j])) {
					++same;
				}
			}
			if (same == 4) {
				four_same = true;
			} else if (same == 3) {
				three_same = true;
			} else if (same == 2) {
				two_same = true;
			}
		}
		let is_zhadanniu = four_same; /* 炸弹牛判断 */
		if (is_zhadanniu && !!this.cardsType.ZHADANNIU) {
			return this.getBiggerScale(Def_Nn.cardsType.ZHADANNIU, niu_num);
		}

		let is_wuxiaoniu = true; /* 五小牛判断 */
		for (let i = 0; i < cards.length; ++i) {
			if (this.getCardNumber(cards[i]) >= 5) {
				is_wuxiaoniu = false;
			}
		}
		is_wuxiaoniu = is_wuxiaoniu && (sum < 10);
		if (is_wuxiaoniu && !!this.cardsType.WUXIAONIU) {
			return this.getBiggerScale(Def_Nn.cardsType.WUXIAONIU, niu_num);
		}

		let is_huluniu = three_same && two_same; /* 葫芦牛判断 */
		if (is_huluniu && !!this.cardsType.HULUNIU) {
			return this.getBiggerScale(Def_Nn.cardsType.HULUNIU, niu_num);
		}

		let is_wuhuaniu = true; /* 五花牛判断 */
		for (let i = 0; i < cards.length; ++i) {
			if ((cards[i] & 0x0f) <= 10) {
				is_wuhuaniu = false;
			}
		}
		if (is_wuhuaniu && !!this.cardsType.WUHUANIU) {
			return this.getBiggerScale(Def_Nn.cardsType.WUHUANIU, niu_num);
		}

		if (is_tonghuaniu && !!this.cardsType.TONGHUANIU) {
			return this.getBiggerScale(Def_Nn.cardsType.TONGHUANIU, niu_num);
		}

		let is_yinniu = /* 银牛判断 */
			this.getCardNumber(cards[0]) >= 10 &&
			this.getCardNumber(cards[1]) >= 10 &&
			this.getCardNumber(cards[2]) >= 10 &&
			this.getCardNumber(cards[3]) >= 10 &&
			this.getCardNumber(cards[4]) >= 10;
		if (is_yinniu && !!this.cardsType.YINNIU) {
			return this.getBiggerScale(Def_Nn.cardsType.YINNIU, niu_num);
		}

		if (is_shunziniu && !!this.cardsType.SHUNZINIU) {
			return this.getBiggerScale(Def_Nn.cardsType.SHUNZINIU, niu_num);
		}

		if (niu_num == 10) {
			return Def_Nn.cardsType.NIUNIU;
		}
		if (niu_num > 0) {
			return Def_Nn.cardsType.YOUNIU;
		}
		return Def_Nn.cardsType.MEINIU;
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
		if (type1 == Def_Nn.cardsType.YOUNIU) {
			let niu_num1 = this.getNiuNumber(cards1);
			let niu_num2 = this.getNiuNumber(cards2);
			if (niu_num1 != niu_num2) {
				return niu_num1 - niu_num2;
			}
		}
		let niu_num1 = cards1[0],
			niu_num2 = cards2[0]; /* 牌型相同时，需要比较的两张牌 */
		for (let i = 1; i < cards1.length; ++i) {
			if (this.getCardNumber(cards1[i]) > this.getCardNumber(niu_num1)) {
				niu_num1 = cards1[i];
			} else if (this.getCardNumber(cards1[i]) == this.getCardNumber(niu_num1) &&
				this.getCardColor(cards1[i]) > this.getCardColor(niu_num1)) {
				niu_num1 = cards1[i];
			}

			if (this.getCardNumber(cards2[i]) > this.getCardNumber(niu_num2)) {
				niu_num2 = cards2[i];
			} else if (this.getCardNumber(cards2[i]) == this.getCardNumber(niu_num2) &&
				this.getCardColor(cards2[i]) > this.getCardColor(niu_num2)) {
				niu_num2 = cards2[i];
			}
		}

		if (type1 == Def_Nn.cardsType.ZHADANNIU) {
			/* 炸弹牛比较炸弹 */
			for (let i = 1; i < cards1.length; ++i) {
				if (this.getCardNumber(cards1[i]) == this.getCardNumber(cards1[i - 1])) {
					niu_num1 = cards1[i];
				}
				if (this.getCardNumber(cards2[i]) == this.getCardNumber(cards2[i - 1])) {
					niu_num2 = cards2[i];
				}
			}
		} else if (type1 == Def_Nn.cardsType.HULUNIU) {
			/* 葫芦牛比较葫芦 */
			for (let i = 0; i < cards1.length; ++i) {
				let same1 = 0,
					same2 = 0;
				for (let j = 0; j < cards1.length; ++j) {
					if (this.getCardNumber(cards1[i]) == this.getCardNumber(cards1[j])) {
						++same1;
					}
					if (this.getCardNumber(cards2[i]) == this.getCardNumber(cards2[j])) {
						++same2;
					}
					if (same1 == 3) {
						niu_num1 = cards1[i];
					}
					if (same2 == 3) {
						niu_num2 = cards2[i];
					}
				}
			}
		}

		if (this.getCardNumber(niu_num1) != this.getCardNumber(niu_num2)) {
			return this.getCardNumber(niu_num1) - this.getCardNumber(niu_num2);
		} else {
			return this.getCardColor(niu_num1) - this.getCardColor(niu_num2);
		}
	}

	/*
	 * 根据牌型获取赔率
	 * @param Number type 类型
	 * @return Number 赔率
	 */
	getScaleByType(type) {
		if (type == Def_Nn.cardsType.MEINIU) {
			return 1;
		} else if (type == Def_Nn.cardsType.YOUNIU) {
			return 2;
		} else if (type == Def_Nn.cardsType.NIUNIU) {
			return 3;
		} else if (type == Def_Nn.cardsType.SHUNZINIU) {
			return (this.scaleType == Def_Nn.scaleType.DIANZI) ? 11 : 4;
		} else if (type == Def_Nn.cardsType.YINNIU) {
			return (this.scaleType == Def_Nn.scaleType.DIANZI) ? 11 : 4;
		} else if (type == Def_Nn.cardsType.TONGHUANIU) {
			return (this.scaleType == Def_Nn.scaleType.DIANZI) ? 11 : 6;
		} else if (type == Def_Nn.cardsType.WUHUANIU) {
			return (this.scaleType == Def_Nn.scaleType.DIANZI) ? 11 : 6;
		} else if (type == Def_Nn.cardsType.HULUNIU) {
			return (this.scaleType == Def_Nn.scaleType.DIANZI) ? 12 : 6;
		} else if (type == Def_Nn.cardsType.WUXIAONIU) {
			return (this.scaleType == Def_Nn.scaleType.DIANZI) ? 13 : 7;
		} else if (type == Def_Nn.cardsType.ZHADANNIU) {
			return (this.scaleType == Def_Nn.scaleType.DIANZI) ? 14 : 8;
		} else if (type == Def_Nn.cardsType.YITIAOLONG) {
			return (this.scaleType == Def_Nn.scaleType.DIANZI) ? 15 : 9;
		} else if (type == Def_Nn.cardsType.TONGHUASHUN) {
			return (this.scaleType == Def_Nn.scaleType.DIANZI) ? 16 : 10;
		}
	}

	/*
	 * 根据牌获取赔率
	 * @param cards Array 手牌
	 * @return Number 赔率
	 */
	getScaleByCards(cards) {
		let type = this.getCardsType(cards);
		let scale = this.getScaleByType(type);
		if (type == Def_Nn.cardsType.YOUNIU || type == Def_Nn.cardsType.NIUNIU) {
			let niu_num = this.getNiuNumber(cards);
			if (this.scaleType == Def_Nn.scaleType.BIG) {
				scale = [1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4][niu_num];
			} else if (this.scaleType == Def_Nn.scaleType.LITTLE) {
				scale = [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3][niu_num];
			} else {
				scale = [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10][niu_num];
			}
		}
		return scale;
	}

	/*
	 * 获取牛几类型
	 * @param Array cards 牌
	 * @return Number 牛0～10
	 */
	getNiuNumber(cards) {
		let sum = 0;
		for (let i = 0; i < cards.length; ++i) {
			sum += this.getCardValue(cards[i]);
		}
		let niu_num = 0;
		for (let i = 0; i < cards.length && niu_num == 0; ++i) {
			for (let j = i + 1; j < cards.length && niu_num == 0; ++j) {
				let rest = sum - this.getCardValue(cards[i]) - this.getCardValue(cards[j]);
				if (rest % 10 == 0) {
					/* 有牛 */
					niu_num = (sum - rest) % 10;
					if (niu_num == 0) {
						niu_num = 10;
					}
				}
			}
		}
		return niu_num;
	}

	/* 同点子牛类型比较，返回较大的类型 */
	getBiggerScale(type, niu_num) {
		if (this.scaleType == Def_Nn.scaleType.DIANZI) {
			let scale = this.getScaleByType(type);
			if (scale >= niu_num) {
				return type;
			} else {
				if (niu_num == 10) {
					return Def_Nn.cardsType.NIUNIU;
				} else {
					return Def_Nn.cardsType.YOUNIU;
				}
			}
		} else {
			return type;
		}
	}
}

module.exports = (() => {
	return new GameLogic();
})();